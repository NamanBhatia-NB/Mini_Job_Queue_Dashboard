# Mini Job Queue Management Dashboard

A full-stack Job Queue Management Dashboard built with **NestJS** (Backend) and **React + TypeScript + Vite** (Frontend). Designed with a focus on robust API design, state machine integrity, error handling, and concurrency control.

---

## 🌟 Architecture Overview

```
airth-assignment/
├── backend/                  # NestJS + Prisma ORM + SQLite
│   ├── prisma/
│   │   └── schema.prisma     # Job model schema with OCC versioning
│   ├── src/
│   │   ├── jobs/             # Controller, Service, DTOs, Transition Matrix
│   │   ├── prisma/           # Prisma client module & service
│   │   ├── common/           # Global Exception filters & interceptors
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── scripts/
│       ├── test-concurrency.ts  # Automated 2-tab race condition test
│       └── verify-all.js        # Full integration test suite
│
├── frontend/                 # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Header, Metrics, Filters, JobList, Modal, Toast
│   │   ├── services/         # Axios API client
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Main application state & polling
│   │   └── index.css         # Clean, professional light SaaS design system
│   └── vite.config.ts
│
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v18+` (tested on Node `v24.x`)
- npm `v9+`

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Initialize SQLite database and generate Prisma Client
npx prisma db push

# Build the TypeScript project
npm run build

# Start production server (runs on port 4000)
npm run start:prod
# Or in dev mode: npm run start:dev
```
The backend will be live at `http://localhost:4000`.

### 2. Frontend Setup
In a separate terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on port 5173)
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📡 API Specification

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/jobs` | Create a job (`title`, `type`) | `201 Created`, `400 Bad Request` |
| `GET` | `/jobs` | Retrieve all jobs (supports `?status=...`) | `200 OK` |
| `GET` | `/jobs/metrics` | Retrieve aggregated status counts | `200 OK` |
| `GET` | `/jobs/:id` | Get details for a specific job | `200 OK`, `404 Not Found` |
| `PATCH` | `/jobs/:id/status` | Update status (`status`, optional `expectedVersion`) | `200 OK`, `400 Bad Request`, `409 Conflict` |
| `DELETE`| `/jobs/:id` | Permanently delete a job | `200 OK`, `404 Not Found` |

### Allowed Job Statuses & State Machine
```
[ pending ] ──► [ running ] ──┬──► [ completed ] (terminal)
                              │
                              └──► [ failed ]    (terminal)
```
- A `completed` or `failed` job **cannot** transition back to `running` or `pending`.
- Attempting any invalid transition returns HTTP `400 Bad Request`.

---

## 🧠 Think About This: Concurrency & State Transitions

> **Scenario**: Imagine two browser tabs are open. Both users see a job as `pending` and both try to change it to `running` at almost the same time.

### 1. Where should this rule be enforced?
**It must be enforced strictly on the Backend and Database layer.**
- While the React frontend can disable invalid buttons for good UX, frontend validation cannot prevent race conditions, network latency desynchronizations, or intentional direct API calls.
- The backend service and database query must be the single source of truth for all state transitions.

### 2. What happens if someone bypasses the React application and calls the API directly?
- All requests pass through NestJS `ValidationPipe` and the `JobsService` state machine guard.
- If a caller attempts an illegal transition (e.g., `completed -> running` or `pending -> completed` directly), the server immediately rejects the request with **HTTP `400 Bad Request`** with a descriptive message explaining the allowed transitions.
- If the job does not exist, the server returns **HTTP `404 Not Found`**.

### 3. What happens when two requests arrive at nearly the same time?
- In a naive read-then-write implementation:
  1. Request A reads the database: status is `pending`.
  2. Request B reads the database: status is `pending`.
  3. Request A validates that `pending -> running` is legal and executes `UPDATE jobs SET status = 'running'`.
  4. Request B validates that `pending -> running` is legal and executes `UPDATE jobs SET status = 'running'`.
- Both requests succeed, potentially causing **duplicate worker execution**, double billing, or corrupted event streams.

### 4. How is this prevented in this implementation?
We prevent this via **Atomic Conditional Updates with Optimistic Concurrency Control (OCC)**:
```ts
// Executed in backend/src/jobs/jobs.service.ts
const updateResult = await this.prisma.job.updateMany({
  where: {
    id: id,
    status: currentStatus, // Must still match 'pending' at the exact moment of write!
    ...(expectedVersion ? { version: expectedVersion } : {}),
  },
  data: {
    status: targetStatus,
    version: { increment: 1 },
  },
});

if (updateResult.count === 0) {
  // A concurrent request modified this job between our read and write!
  const freshJob = await this.prisma.job.findUnique({ where: { id } });
  throw new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: `Concurrency Conflict: Job "${id}" status was modified concurrently by another process. Current status is now "${freshJob?.status}".`,
    currentJob: freshJob,
  });
}
```

#### Why this guarantees consistency:
- The database executes the `WHERE id = :id AND status = :expectedStatus` atomically under row-level synchronization.
- **Request 1** finds the row matching `status = 'pending'`, updates it to `running`, increments version to `2`, and returns `count = 1` (success).
- **Request 2** evaluates the same query milliseconds later; the row status is now `running`, so the condition `status = 'pending'` matches **0 rows**.
- The backend detects `count === 0` and immediately responds with **HTTP `409 Conflict`**. No inconsistent or duplicate write can ever occur.

---

## 🧪 Automated Concurrency & Integration Tests

### Concurrency Test (Simulates 2 Simultaneous Requests)
Run the automated test script while the backend is running:
```bash
cd backend
npm run test:concurrency
```
**Output**:
```text
=============================================================
🧪 CONCURRENCY TEST: TWO TABS UPDATING JOB AT THE SAME TIME
=============================================================
1. Creating a new job in "pending" status...
✅ Created Job ID: 8afb59d0-77cd-44ce-a301-3be2b2a80b70 | Status: pending | Version: 1

2. Firing two simultaneous PATCH /jobs/:id/status requests to "running"...
⏱️ Both requests finished in 505ms

📡 Response Tab A: HTTP 409 Conflict (Job was modified concurrently)
📡 Response Tab B: HTTP 200 OK (Transitioned to running, Version = 2)

🔍 EVALUATION:
✅ TEST PASSED: Exactly one request succeeded and one was rejected with HTTP 409 Conflict!
   Atomic Optimistic Concurrency Control successfully prevented the race condition.
```

### Full Integration Test Suite
```bash
cd backend
node scripts/verify-all.js
```
Runs 11 automated test assertions verifying:
- Metrics aggregation
- DTO validation errors (400)
- Legal transitions (`pending -> running -> completed`)
- Illegal jumps (`pending -> completed` rejected)
- Terminal state locks (`completed -> running` rejected)
- Stale version optimistic locking (409)
- Status query filtering (`?status=completed`)
- Safe deletion and subsequent 404 verification

---

## 🎁 Bonus Production-Ready Features

1. **Optimistic Concurrency Control (OCC) with Version Tracking**:
   - Every `Job` entity includes a monotonically increasing `version` field.
   - Frontend and external API callers can optionally pass `expectedVersion`.
   - Protects against distributed lost updates and race conditions across serverless instances or multi-tab browser sessions.
2. **Auto-Sync / Live Multi-Tab Sync**:
   - Frontend includes an active background sync toggle that polls the queue state every 4 seconds.
   - When a job is updated in Tab A, Tab B reflects the update automatically without requiring manual page reload.
   - If a user in Tab B still clicks an action before sync, the backend rejects it with `409 Conflict`, and the UI displays a conflict warning banner and automatically re-fetches fresh data.

---

## 🌐 Deployment Instructions (Vercel + Neon PostgreSQL)

This application is configured for deployment on **Vercel** with a serverless **Neon PostgreSQL** database.

### 1. Deploy Backend to Vercel
1. In Vercel, click **Add New** → **Project** and select your GitHub repository.
2. In the project setup settings:
   - **Root Directory**: Click edit and select `backend`.
   - **Framework Preset**: Other (automatically uses `@vercel/node` from `vercel.json`).
3. Under **Environment Variables**, add:
   - `DATABASE_URL` = `<your-neon-postgres-connection-string>`
4. Click **Deploy**.
5. Once deployed, note down your backend URL (e.g., `https://your-backend-project.vercel.app`).

### 2. Deploy Frontend to Vercel
1. In Vercel, click **Add New** → **Project** and select the same GitHub repository.
2. In the project setup settings:
   - **Root Directory**: Click edit and select `frontend`.
   - **Framework Preset**: `Vite`.
3. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `<your-deployed-backend-url-from-step-1>`
4. Click **Deploy**.
5. Your live frontend is now connected to your live serverless backend!

---

## ⚖️ Trade-offs & Future Improvements (Given More Time)
1. **Queue Processor Worker (BullMQ / Redis)**:
   - In a production architecture with heavy background jobs, we would pair NestJS with `@nestjs/bullmq` and Redis.
   - Jobs would be pushed to an async queue and processed by dedicated worker nodes with retry policies, backoff exponential delays, and heartbeat monitoring.
2. **Server-Sent Events (SSE) or WebSockets**:
   - While short-polling works effectively for light dashboards, WebSocket or SSE gateways (`@nestjs/websockets`) would push sub-millisecond status events to all connected clients.
3. **Database Migration to Managed Postgres**:
   - SQLite was chosen for zero-dependency local evaluation. For distributed production deployments with multiple backend replicas, switching Prisma's datasource provider to PostgreSQL (e.g. AWS RDS or Supabase) with `SELECT FOR UPDATE` or OCC versioning ensures horizontal scalability.

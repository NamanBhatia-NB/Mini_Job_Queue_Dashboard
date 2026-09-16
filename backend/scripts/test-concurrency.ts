/**
 * Concurrency Test Script: Simulating the Two-Tab Race Condition
 *
 * Scenario:
 * Two users / browser tabs both see a job in 'pending' status.
 * Both click "Start Running" at the exact same millisecond.
 *
 * Expected Result:
 * - Request 1 succeeds (HTTP 200) -> transitions state to 'running', increments version to 2.
 * - Request 2 fails (HTTP 409 Conflict) -> atomic conditional update matches 0 rows, rejected cleanly!
 */

const API_BASE = process.env.API_URL || 'http://localhost:4000';

async function runConcurrencyTest() {
  console.log('\n=============================================================');
  console.log('🧪 CONCURRENCY TEST: TWO TABS UPDATING JOB AT THE SAME TIME');
  console.log('=============================================================\n');

  try {
    // Step 1: Create a pending job
    console.log('1. Creating a new job in "pending" status...');
    const createRes = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Concurrent Race Condition Test Job',
        type: 'stress-test',
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create job: ${createRes.status} ${createRes.statusText}`);
    }

    const job = await createRes.json();
    console.log(`✅ Created Job ID: ${job.id} | Status: ${job.status} | Version: ${job.version}\n`);

    // Step 2: Fire two simultaneous PATCH requests to transition pending -> running
    console.log('2. Firing two simultaneous PATCH /jobs/:id/status requests to "running"...');

    const updatePayload = { status: 'running' };

    const startTime = Date.now();
    const [res1, res2] = await Promise.all([
      fetch(`${API_BASE}/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      }),
      fetch(`${API_BASE}/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      }),
    ]);
    const duration = Date.now() - startTime;

    const data1 = await res1.json();
    const data2 = await res2.json();

    console.log(`\n⏱️ Both requests finished in ${duration}ms\n`);
    console.log(`📡 Response Tab A: HTTP ${res1.status}`, data1);
    console.log(`📡 Response Tab B: HTTP ${res2.status}`, data2);

    console.log('\n-------------------------------------------------------------');
    console.log('🔍 EVALUATION:');

    const hasSuccess = res1.status === 200 || res2.status === 200;
    const hasConflict = res1.status === 409 || res2.status === 409;

    if (hasSuccess && hasConflict) {
      console.log('✅ TEST PASSED: Exactly one request succeeded and one was rejected with HTTP 409 Conflict!');
      console.log('   Atomic Optimistic Concurrency Control successfully prevented the race condition.');
    } else if (res1.status === 200 && res2.status === 200) {
      console.log('❌ TEST FAILED: Both requests succeeded (Race condition occurred / double transition).');
    } else {
      console.log(`⚠️ Unexpected status codes: ${res1.status} and ${res2.status}`);
    }

    // Step 3: Fetch final job state
    const finalRes = await fetch(`${API_BASE}/jobs/${job.id}`);
    const finalJob = await finalRes.json();
    console.log(`\n📋 Final Job State in DB: Status = "${finalJob.status}", Version = ${finalJob.version}`);
    console.log('=============================================================\n');

    // Clean up
    await fetch(`${API_BASE}/jobs/${job.id}`, { method: 'DELETE' });
    console.log(`🧹 Cleaned up test job ${job.id}`);
  } catch (err: any) {
    console.error('❌ Error executing concurrency test:', err.message);
  }
}

runConcurrencyTest();

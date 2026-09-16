const API = 'http://localhost:4000';

async function runFullVerification() {
  console.log('====================================================');
  console.log('🔍 FULL SYSTEM INTEGRATION & COMPLIANCE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Check Metrics
    console.log('Step 1: Testing GET /jobs/metrics...');
    const mRes = await fetch(`${API}/jobs/metrics`);
    const metrics = await mRes.json();
    assert(
      typeof metrics.total === 'number' && typeof metrics.pending === 'number',
      'GET /jobs/metrics returns structured counts for all statuses',
    );

    // 2. Validation Check: POST /jobs with empty body
    console.log('\nStep 2: Testing Validation on POST /jobs (invalid payload)...');
    const badCreateRes = await fetch(`${API}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(
      badCreateRes.status === 400,
      'POST /jobs with empty body returns 400 Bad Request',
    );

    // 3. Create Valid Job
    console.log('\nStep 3: Creating a valid job via POST /jobs...');
    const createRes = await fetch(`${API}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'End-To-End Test Job',
        type: 'qa-verification',
      }),
    });
    const job = await createRes.json();
    assert(
      createRes.status === 201 && job.status === 'pending' && job.version === 1,
      `Job created with ID ${job.id}, status "pending", version 1`,
    );

    // 4. Invalid Jump: pending -> completed directly (should fail 400)
    console.log('\nStep 4: Testing illegal transition pending -> completed...');
    const illegalJump = await fetch(`${API}/jobs/${job.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(
      illegalJump.status === 400,
      'Direct transition pending -> completed rejected with 400 Bad Request',
    );

    // 5. Valid Transition: pending -> running
    console.log('\nStep 5: Testing legal transition pending -> running...');
    const toRunning = await fetch(`${API}/jobs/${job.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'running', expectedVersion: 1 }),
    });
    const runningJob = await toRunning.json();
    assert(
      toRunning.status === 200 &&
        runningJob.status === 'running' &&
        runningJob.version === 2,
      'Transition pending -> running succeeded and version incremented to 2',
    );

    // 6. Concurrency / Stale Version Conflict Check
    console.log('\nStep 6: Testing Optimistic Concurrency Conflict (expectedVersion: 1 on version 2)...');
    const conflictRes = await fetch(`${API}/jobs/${job.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', expectedVersion: 1 }),
    });
    assert(
      conflictRes.status === 409,
      'Stale version update rejected with 409 Conflict',
    );

    // 7. Valid Transition: running -> completed
    console.log('\nStep 7: Testing legal transition running -> completed...');
    const toCompleted = await fetch(`${API}/jobs/${job.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const completedJob = await toCompleted.json();
    assert(
      toCompleted.status === 200 && completedJob.status === 'completed',
      'Transition running -> completed succeeded',
    );

    // 8. Terminal State Lock: completed -> running (should fail 400)
    console.log('\nStep 8: Testing modification of terminal state completed -> running...');
    const fromTerminal = await fetch(`${API}/jobs/${job.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'running' }),
    });
    assert(
      fromTerminal.status === 400,
      'Modification of terminal state rejected with 400 Bad Request',
    );

    // 9. Filtering Check: GET /jobs?status=completed
    console.log('\nStep 9: Testing GET /jobs?status=completed filtering...');
    const filterRes = await fetch(`${API}/jobs?status=completed`);
    const filteredJobs = await filterRes.json();
    const allCompleted = filteredJobs.every((j) => j.status === 'completed');
    assert(
      filterRes.status === 200 && allCompleted && filteredJobs.length > 0,
      'GET /jobs?status=completed returns only completed jobs',
    );

    // 10. Delete Job: DELETE /jobs/:id
    console.log('\nStep 10: Testing DELETE /jobs/:id...');
    const delRes = await fetch(`${API}/jobs/${job.id}`, { method: 'DELETE' });
    assert(delRes.status === 200, 'DELETE /jobs/:id successfully removed job');

    // 11. Verify 404 after deletion
    console.log('\nStep 11: Verifying deleted job returns 404...');
    const notFoundRes = await fetch(`${API}/jobs/${job.id}`);
    assert(notFoundRes.status === 404, 'GET /jobs/:id returns 404 Not Found after deletion');

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed} passed, ${failed} failed.`);
    if (failed === 0) {
      console.log('🎉 ALL ASSIGNMENT SPECIFICATIONS FULLY SATISFIED!');
    } else {
      console.log('⚠️ Some checks failed.');
    }
    console.log('====================================================\n');
  } catch (e) {
    console.error('Fatal error during verification:', e);
  }
}

runFullVerification();

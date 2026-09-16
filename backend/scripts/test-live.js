async function testLiveUrls() {
  const backend = 'https://mini-job-queue-dashboard-rosy.vercel.app';
  const frontend = 'https://mini-job-queue-dashboard-xdh5.vercel.app';

  console.log('--- 1. Testing Live Backend ---');
  try {
    const rJobs = await fetch(backend + '/jobs');
    console.log('GET /jobs status:', rJobs.status);
    const dataJobs = await rJobs.json();
    console.log('GET /jobs count:', Array.isArray(dataJobs) ? dataJobs.length : dataJobs);

    const rMetrics = await fetch(backend + '/jobs/metrics');
    console.log('GET /jobs/metrics status:', rMetrics.status);
    const dataMetrics = await rMetrics.json();
    console.log('GET /jobs/metrics data:', dataMetrics);
  } catch (err) {
    console.error('Backend error:', err.message);
  }

  console.log('\n--- 2. Testing Live Frontend ---');
  try {
    const rFront = await fetch(frontend);
    console.log('Frontend status:', rFront.status);
    const textFront = await rFront.text();
    console.log('Frontend HTML received, length:', textFront.length);
  } catch (err) {
    console.error('Frontend error:', err.message);
  }
}

testLiveUrls();

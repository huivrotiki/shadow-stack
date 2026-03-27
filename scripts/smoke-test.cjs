const http = require('http');

const url = (process.env.SMOKE_URL || 'http://127.0.0.1:3001') + '/health';
const timeout = 5000;

console.log(`Smoke test: ${url}`);

const req = http.get(url, { timeout }, (res) => {
  console.log(`Status: ${res.statusCode}`);
  if (res.statusCode >= 200 && res.statusCode < 400) {
    console.log('PASS');
    process.exit(0);
  } else {
    console.log('FAIL — unexpected status code');
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log(`FAIL — ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  console.log('FAIL — timeout');
  process.exit(1);
});

const http = require('http');

const body = JSON.stringify({ email: 'jeanfelicks@gmail.com' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/forgot-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log('Sending body:', body);
console.log('Body valid JSON?', JSON.parse(body));

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(body);
req.end();

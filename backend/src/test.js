const http = require('http');

const loginReq = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    const { token } = JSON.parse(body);
    if (token) {
      setTimeout(() => getTasks(token), 4000);
    }
  });
});

loginReq.write(JSON.stringify({ email: 'testuser123@test.com', password: 'test123' }));
loginReq.end();

function getTasks(token) {
  http.request({
    hostname: 'localhost', port: 5000, path: '/api/tasks',
    headers: { Authorization: 'Bearer ' + token }
  }, (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => console.log(body));
  }).end();
}
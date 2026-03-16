const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath;

  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'views', 'index.html');
  } else {
    filePath = path.join(__dirname, 'public', req.url);
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h2>404 - Not Found</h2>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ██████╗ ██╗    ██████╗  █████╗ ███████╗██╗  ██╗`);
  console.log(`  ██╔══██╗██║    ██╔══██╗██╔══██╗██╔════╝██║  ██║`);
  console.log(`  ██████╔╝██║    ██║  ██║███████║███████╗███████║`);
  console.log(`  ██╔═══╝ ██║    ██║  ██║██╔══██║╚════██║██╔══██║`);
  console.log(`  ██║     ██║    ██████╔╝██║  ██║███████║██║  ██║`);
  console.log(`  ╚═╝     ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`);
  console.log(`\n  Π-Shape Computing Education Dashboard`);
  console.log(`  ➜  Local:   http://localhost:${PORT}`);
  console.log(`  ➜  Press Ctrl+C to stop\n`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

function getPort() {
  const argPort = process.argv.find((arg) => arg.startsWith('--port='));
  if (argPort) return Number(argPort.split('=')[1]) || 8000;
  if (process.env.PORT) return Number(process.env.PORT) || 8000;
  return 8000;
}

function getRootDir() {
  const argRoot = process.argv[2] && !process.argv[2].startsWith('--')
    ? process.argv[2]
    : '.';
  return path.resolve(process.cwd(), argRoot);
}

async function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const data = await fs.promises.readFile(filePath);

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
  });
  res.end(data);
}

const rootDir = getRootDir();
const port = getPort();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === '/') pathname = '/index.html';

    const resolvedPath = path.resolve(rootDir, `.${pathname}`);
    if (!resolvedPath.startsWith(rootDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    let stats;
    try {
      stats = await fs.promises.stat(resolvedPath);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(resolvedPath, 'index.html');
      await sendFile(res, indexPath);
      return;
    }

    await sendFile(res, resolvedPath);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`500 Internal Server Error\n${error.message}`);
  }
});

server.listen(port, () => {
  console.log(`Serving ${rootDir}`);
  console.log(`Open http://localhost:${port}/`);
});

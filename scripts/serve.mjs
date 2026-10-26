import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, relative, extname, sep } from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

export function createStaticServer(root = fileURLToPath(new URL('../', import.meta.url))) {
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end('Method not allowed');
        return;
      }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let path = resolve(root, `.${pathname}`);
      const local = relative(root, path);
      if (local === '..' || local.startsWith(`..${sep}`) || local.split(sep).some(part => part.startsWith('.'))) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
      const bytes = await readFile(path);
      response.writeHead(200, {
        'Content-Type': types[extname(path)] || 'application/octet-stream',
        'Content-Length': bytes.length,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 'Not found' : 'Bad request');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2] || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port must be an integer from 1 to 65535.');
  createStaticServer().listen(port, '127.0.0.1', () => console.log(`Serving at http://127.0.0.1:${port}`));
}

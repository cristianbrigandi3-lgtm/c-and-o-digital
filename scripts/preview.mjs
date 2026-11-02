import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.resolve(projectRoot, 'public');
const port = Number(process.env.PREVIEW_PORT || 4173);
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};
const securityHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let target = path.resolve(publicRoot, '.' + pathname);
    if (target !== publicRoot && !target.startsWith(publicRoot + path.sep)) {
      response.writeHead(403, securityHeaders).end('Forbidden');
      return;
    }
    try {
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    } catch {
      if (!path.extname(target)) target = path.join(target, 'index.html');
    }
    const content = await readFile(target);
    response.writeHead(200, {
      ...securityHeaders,
      'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream',
    });
    response.end(content);
  } catch {
    response.writeHead(404, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Pagina non trovata');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log('Preview locale: http://127.0.0.1:' + port);
  console.log('Serve soltanto la cartella public; non è una pubblicazione online.');
});


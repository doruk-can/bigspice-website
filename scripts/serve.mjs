/** A 30-line static server for dist/, bound to loopback. Only used by the
 *  screenshot harness and for a quick local look; Cloudflare Pages serves the
 *  real thing. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'dist';
const PORT = Number(process.env.PORT ?? 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
};

createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = join(ROOT, p);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    try { await stat(file + '/index.html'); file = file + '/index.html'; } catch {}
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`serving dist on http://127.0.0.1:${PORT}`));

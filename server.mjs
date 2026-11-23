import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // A second path verifies GitHub Pages-style repository subpaths locally.
    if (pathname === '/survey') { res.writeHead(302, { Location: '/survey/' }); res.end(); return; }
    if (pathname.startsWith('/survey/')) pathname = pathname.slice('/survey'.length);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = resolve(root, '.' + pathname);
    if (!target.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error('Outside project');
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}/survey/`));

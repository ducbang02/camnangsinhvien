import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer as createViteServer } from 'vite';
import { categories } from '../src/data/categories.ts';
import { tools } from '../src/data/tools.ts';
import { ArticleStoreError, createArticleStore } from './lib/articles.mjs';
import { createMediaStore, readImageBody } from './lib/media.mjs';
import { createPublisher } from './lib/publish.mjs';
import { createTaxonomyStore } from './lib/taxonomy.mjs';

const cmsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(cmsDirectory, '..');
const clientRoot = path.join(cmsDirectory, 'client');
const articlesRoot = path.join(repositoryRoot, 'src', 'content', 'articles');
const categoriesPath = path.join(repositoryRoot, 'src', 'data', 'categories.ts');
const publicRoot = path.join(repositoryRoot, 'public');
const host = '127.0.0.1';
const port = Number(process.env.CMS_PORT || 4310);
const astroUrl = process.env.ASTRO_URL || 'http://127.0.0.1:4321';
const allowedOrigins = new Set([
  `http://${host}:${port}`,
  `http://localhost:${port}`,
]);
const store = createArticleStore({ root: articlesRoot, categories });
const taxonomyStore = createTaxonomyStore({ sourcePath: categoriesPath, categories, articlesRoot, tools });
const mediaStore = createMediaStore({ publicRoot });
const publisher = createPublisher({ repositoryRoot, store });

let astroProcess;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) throw new ArticleStoreError('Dữ liệu gửi lên vượt quá 2 MB.', 413, 'BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ArticleStoreError('Dữ liệu JSON không hợp lệ.', 400, 'INVALID_JSON');
  }
}

function verifyLocalRequest(request) {
  const origin = request.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    throw new ArticleStoreError('CMS chỉ chấp nhận yêu cầu từ giao diện local.', 403, 'INVALID_ORIGIN');
  }
}

async function handleApi(request, response, url) {
  verifyLocalRequest(request);
  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true, astroUrl, phase: 2 });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/categories') {
    sendJson(response, 200, { ...await taxonomyStore.snapshot(), tools });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/categories/save') {
    sendJson(response, 200, await taxonomyStore.saveCategory(await readJson(request)));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/categories/delete') {
    sendJson(response, 200, await taxonomyStore.deleteCategory(await readJson(request)));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/groups/save') {
    sendJson(response, 200, await taxonomyStore.saveGroup(await readJson(request)));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/groups/delete') {
    sendJson(response, 200, await taxonomyStore.deleteGroup(await readJson(request)));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/taxonomy/publish/prepare') {
    sendJson(response, 200, { plan: await publisher.prepareTaxonomy() });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/taxonomy/publish/confirm') {
    sendJson(response, 200, { result: await publisher.confirmTaxonomy(await readJson(request)) });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/articles') {
    sendJson(response, 200, { articles: await store.list() });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/article') {
    const article = await store.get(url.searchParams.get('id'));
    sendJson(response, 200, { article });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/articles/save') {
    const article = await store.save(await readJson(request));
    sendJson(response, 200, {
      article,
      message: article.metadata.status === 'draft' ? 'Đã lưu nháp vào repository local.' : 'Đã lưu bài ở trạng thái Published trên local.',
    });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/media/upload') {
    const originalName = decodeURIComponent(request.headers['x-file-name'] || 'anh-bai-viet');
    const media = await mediaStore.upload({
      slug: url.searchParams.get('slug'),
      originalName,
      mimeType: String(request.headers['content-type'] || '').split(';')[0].trim().toLowerCase(),
      buffer: await readImageBody(request),
    });
    sendJson(response, 201, { media, message: 'Đã lưu ảnh vào thư mục media của bài viết.' });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/publish/prepare') {
    const plan = await publisher.prepare(await readJson(request));
    sendJson(response, 200, { plan });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/publish/confirm') {
    const result = await publisher.confirm(await readJson(request));
    sendJson(response, 200, { result });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/delete/prepare') {
    const plan = await publisher.prepareDelete(await readJson(request));
    sendJson(response, 200, { plan });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/delete/confirm') {
    const result = await publisher.confirmDelete(await readJson(request));
    sendJson(response, 200, { result });
    return;
  }
  sendJson(response, 404, { error: 'API không tồn tại.', code: 'NOT_FOUND' });
}

async function astroIsReady() {
  try {
    const response = await fetch(astroUrl, { signal: AbortSignal.timeout(1200) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureAstroServer() {
  if (await astroIsReady()) return;
  const astroBin = path.join(repositoryRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');
  astroProcess = spawn(process.execPath, [astroBin, 'dev', '--host', host], {
    cwd: repositoryRoot,
    stdio: 'inherit',
    windowsHide: true,
  });
  astroProcess.on('exit', (code) => {
    if (code && code !== 0) console.error(`[CMS] Astro dev server đã dừng với mã ${code}.`);
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (await astroIsReady()) return;
  }
  throw new Error(`Không thể khởi động Astro tại ${astroUrl}.`);
}

await ensureAstroServer();

const vite = await createViteServer({
  root: clientRoot,
  publicDir: publicRoot,
  configFile: false,
  appType: 'spa',
  server: { middlewareMode: true },
});

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
  if (url.pathname.startsWith('/api/')) {
    try {
      await handleApi(request, response, url);
    } catch (error) {
      const known = error instanceof ArticleStoreError || Number.isInteger(error?.status);
      if (!known) console.error(error);
      sendJson(response, known ? error.status : 500, {
        error: known ? error.message : 'CMS gặp lỗi khi xử lý yêu cầu.',
        code: known ? error.code : 'INTERNAL_ERROR',
        details: known ? error.details : [],
      });
    }
    return;
  }
  vite.middlewares(request, response, (error) => {
    if (error) {
      console.error(error);
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Không thể tải giao diện CMS.');
    }
  });
});

server.listen(port, host, () => {
  console.log(`\nCMS local: http://${host}:${port}`);
  console.log(`Preview Astro: ${astroUrl}`);
  console.log('Nhấn Ctrl+C để dừng cả CMS và Astro do CMS khởi động.\n');
});

async function shutdown() {
  await vite.close();
  server.close();
  if (astroProcess && !astroProcess.killed) astroProcess.kill();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distRoot = path.join(root, 'dist');
const canonicalOrigin = 'https://camnangsinhvien.site';
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(entryPath));
    else files.push(entryPath);
  }

  return files;
}

function routeForHtml(file) {
  const relative = path.relative(distRoot, file).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
}

function localPathForUrl(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split(/[?#]/, 1)[0]);
  const relative = cleanPath.replace(/^\/+/, '');
  if (!relative) return path.join(distRoot, 'index.html');
  if (path.extname(relative)) return path.join(distRoot, relative);
  return path.join(distRoot, relative, 'index.html');
}

async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

function match(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? '';
}

const files = await walk(distRoot);
const htmlFiles = files.filter((file) => file.endsWith('.html'));

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = routeForHtml(file);
  const title = match(html, /<title>([\s\S]*?)<\/title>/i);
  const canonical = match(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const h1Count = (html.match(/<h1(?:\s|>)/gi) ?? []).length;

  if (!title) errors.push(`${route}: thiếu <title>`);
  if (h1Count !== 1) errors.push(`${route}: cần đúng một H1, hiện có ${h1Count}`);
  if (!canonical) errors.push(`${route}: thiếu canonical`);
  else if (!canonical.startsWith(`${canonicalOrigin}/`)) errors.push(`${route}: canonical sai domain (${canonical})`);

  for (const href of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)) {
    const target = href[1];
    if (!target.startsWith('/') || target.startsWith('//')) continue;
    if (!await exists(localPathForUrl(target))) errors.push(`${route}: link nội bộ không tồn tại (${target})`);
  }
}

const robots = await readFile(path.join(distRoot, 'robots.txt'), 'utf8');
if (!robots.includes(`${canonicalOrigin}/sitemap-index.xml`)) {
  errors.push('robots.txt: thiếu sitemap production');
}

const sitemapIndex = await readFile(path.join(distRoot, 'sitemap-index.xml'), 'utf8');
const sitemapUrls = [...sitemapIndex.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length === 0) errors.push('sitemap-index.xml: không có sitemap con');

for (const sitemapUrl of sitemapUrls) {
  const parsed = new URL(sitemapUrl);
  if (parsed.origin !== canonicalOrigin) errors.push(`sitemap-index.xml: sai domain (${sitemapUrl})`);
  const sitemapPath = localPathForUrl(parsed.pathname);
  if (!await exists(sitemapPath)) {
    errors.push(`sitemap-index.xml: không tìm thấy ${parsed.pathname}`);
    continue;
  }

  const sitemap = await readFile(sitemapPath, 'utf8');
  for (const loc of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
    const pageUrl = new URL(loc[1]);
    if (pageUrl.origin !== canonicalOrigin) errors.push(`sitemap: sai domain (${pageUrl.href})`);
    if (!await exists(localPathForUrl(pageUrl.pathname))) errors.push(`sitemap: route không tồn tại (${pageUrl.pathname})`);
  }
}

if (errors.length > 0) {
  console.error(`Site validation thất bại (${errors.length} lỗi):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Site validation đạt: ${htmlFiles.length} trang HTML, canonical, H1, sitemap và link nội bộ hợp lệ.`);
}

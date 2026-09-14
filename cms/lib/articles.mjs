import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const ARTICLE_EXTENSIONS = new Set(['.md', '.mdx']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

marked.use({ gfm: true, breaks: false });

function createTurndownService() {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });
  service.use(gfm);
  service.addRule('articleImage', {
    filter: (node) => node.nodeName === 'FIGURE' && node.hasAttribute('data-cms-image'),
    replacement(_content, node) {
      const image = node.querySelector('img');
      if (!image) return '';
      const src = escapeHtmlAttribute(image.getAttribute('src') ?? '');
      const alt = escapeHtmlAttribute(image.getAttribute('alt') ?? '');
      const caption = escapeHtml(node.querySelector('figcaption')?.textContent?.trim() ?? '');
      return `\n\n<figure class="article-figure" data-cms-image>\n  <img src="${src}" alt="${alt}" loading="lazy" />${caption ? `\n  <figcaption>${caption}</figcaption>` : ''}\n</figure>\n\n`;
    },
  });
  service.addRule('youtubeEmbed', {
    filter: (node) => node.nodeName === 'DIV' && node.hasAttribute('data-youtube-id'),
    replacement(_content, node) {
      const videoId = node.getAttribute('data-youtube-id') ?? '';
      if (!YOUTUBE_ID_PATTERN.test(videoId)) return '';
      return `\n\n<div class="video-embed" data-youtube-id="${videoId}">\n  <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="Video YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>\n</div>\n\n`;
    },
  });
  service.addRule('taskItem', {
    filter: (node) => node.nodeName === 'LI' && node.getAttribute('data-type') === 'taskItem',
    replacement(content, node) {
      const checked = node.getAttribute('data-checked') === 'true' ? 'x' : ' ';
      return `\n- [${checked}] ${content.trim()}\n`;
    },
  });
  return service;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function normalizeEditorHtml(html) {
  return String(html)
    .replace(/<colgroup[\s\S]*?<\/colgroup>/gi, '')
    .replace(/<(td|th)([^>]*)>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/\1>/gi, '<$1$2>$3</$1>')
    .replace(/\sstyle="[^"]*"/gi, '');
}

async function markdownToEditorHtml(markdown) {
  const html = await marked.parse(markdown);
  const withCmsBlocks = html
    .replace(/<figure class="article-figure"(?![^>]*data-cms-image)/gi, '<figure class="article-figure" data-cms-image')
    .replace(/<div class="video-embed" data-youtube-id="([A-Za-z0-9_-]{11})">/gi, '<div class="video-embed" data-youtube-id="$1">');
  const withTaskItems = withCmsBlocks.replace(
    /<li>\s*<input([^>]*)type="checkbox"([^>]*)>\s*([\s\S]*?)<\/li>/gi,
    (_match, before, after, content) => {
      const checked = /\bchecked(?:="")?/i.test(`${before} ${after}`);
      return `<li data-type="taskItem" data-checked="${checked}"><p>${content.trim()}</p></li>`;
    },
  );
  return withTaskItems.replace(
    /<ul>\s*((?:<li data-type="taskItem"[\s\S]*?<\/li>\s*)+)<\/ul>/gi,
    '<ul data-type="taskList">$1</ul>',
  );
}

function dateOnly(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function relativeId(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/').replace(/\.(md|mdx)$/i, '');
}

function assertInside(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new ArticleStoreError('Đường dẫn bài viết không hợp lệ.', 400, 'INVALID_PATH');
  }
  return resolvedTarget;
}

async function walkArticles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkArticles(root, target));
    if (entry.isFile() && ARTICLE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(target);
  }
  return files;
}

function publicMetadata(data) {
  return {
    title: data.title ?? '',
    slug: '',
    category: data.category ?? '',
    topic: data.topic ?? '',
    description: data.description ?? '',
    thumbnail: data.thumbnail ?? '',
    thumbnailAlt: data.thumbnailAlt ?? '',
    seoTitle: data.seoTitle ?? '',
    seoDescription: data.seoDescription ?? '',
    status: data.draft === true ? 'draft' : 'published',
    publishedDate: dateOnly(data.publishedDate),
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
}

function estimateReadingMinutes(markdown) {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>|[#>*_`\[\]()!-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function optionalText(value) {
  const text = String(value ?? '').trim();
  return text || undefined;
}

export class ArticleStoreError extends Error {
  constructor(message, status = 400, code = 'ARTICLE_ERROR', details = []) {
    super(message);
    this.name = 'ArticleStoreError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createArticleStore({ root, categories }) {
  const articleRoot = path.resolve(root);
  const categoryIds = new Set(categories.map((category) => category.id));

  async function list() {
    const files = await walkArticles(articleRoot);
    const articles = await Promise.all(files.map(async (filePath) => {
      const [source, fileStat] = await Promise.all([readFile(filePath, 'utf8'), stat(filePath)]);
      const { data } = matter(source);
      const id = relativeId(articleRoot, filePath);
      return {
        id,
        title: data.title ?? path.basename(id),
        category: data.category ?? '',
        status: data.draft === true ? 'draft' : 'published',
        publishedDate: dateOnly(data.publishedDate),
        updatedDate: dateOnly(data.updatedDate) || fileStat.mtime.toISOString().slice(0, 10),
        version: `${fileStat.mtimeMs}:${fileStat.size}`,
      };
    }));
    return articles.sort((a, b) => b.updatedDate.localeCompare(a.updatedDate) || a.title.localeCompare(b.title, 'vi'));
  }

  async function resolveExisting(id) {
    if (!id || typeof id !== 'string' || id.includes('\\') || id.startsWith('/') || id.includes('..')) {
      throw new ArticleStoreError('ID bài viết không hợp lệ.', 400, 'INVALID_ID');
    }
    for (const extension of ARTICLE_EXTENSIONS) {
      const candidate = assertInside(articleRoot, path.join(articleRoot, `${id}${extension}`));
      try {
        const fileStat = await stat(candidate);
        if (fileStat.isFile()) return { filePath: candidate, fileStat };
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    throw new ArticleStoreError('Không tìm thấy bài viết.', 404, 'NOT_FOUND');
  }

  async function get(id) {
    const { filePath, fileStat } = await resolveExisting(id);
    const source = await readFile(filePath, 'utf8');
    const parsed = matter(source);
    const metadata = publicMetadata(parsed.data);
    metadata.slug = path.basename(id);
    return {
      id,
      extension: path.extname(filePath),
      metadata,
      html: await markdownToEditorHtml(parsed.content),
      version: `${fileStat.mtimeMs}:${fileStat.size}`,
      previewUrl: `/cam-nang/${metadata.slug}/`,
    };
  }

  function validate(input) {
    const errors = [];
    const metadata = input?.metadata ?? {};
    const title = String(metadata.title ?? '').trim();
    const slug = String(metadata.slug ?? '').trim();
    const description = String(metadata.description ?? '').trim();
    const topic = String(metadata.topic ?? '').trim();
    const tags = Array.isArray(metadata.tags) ? metadata.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
    const content = String(input?.html ?? '').trim();

    if (title.length < 8) errors.push({ field: 'title', message: 'Tiêu đề cần ít nhất 8 ký tự.' });
    if (!SLUG_PATTERN.test(slug)) errors.push({ field: 'slug', message: 'Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.' });
    if (!categoryIds.has(metadata.category)) errors.push({ field: 'category', message: 'Hãy chọn một trụ cột hợp lệ.' });
    if (!topic) errors.push({ field: 'topic', message: 'Chủ đề nhỏ không được để trống.' });
    if (description.length < 40 || description.length > 180) errors.push({ field: 'description', message: 'Mô tả cần từ 40 đến 180 ký tự.' });
    if (!tags.length) errors.push({ field: 'tags', message: 'Cần ít nhất một tag.' });
    if (!DATE_PATTERN.test(String(metadata.publishedDate ?? ''))) errors.push({ field: 'publishedDate', message: 'Ngày đăng không hợp lệ.' });
    if (!['draft', 'published'].includes(metadata.status)) errors.push({ field: 'status', message: 'Trạng thái không hợp lệ.' });
    if (String(metadata.seoTitle ?? '').trim().length > 70) errors.push({ field: 'seoTitle', message: 'SEO title tối đa 70 ký tự.' });
    if (String(metadata.seoDescription ?? '').trim().length > 180) errors.push({ field: 'seoDescription', message: 'SEO description tối đa 180 ký tự.' });
    if (metadata.thumbnail && (!/^\/[A-Za-z0-9._/-]+$/.test(String(metadata.thumbnail)) || String(metadata.thumbnail).includes('..'))) errors.push({ field: 'thumbnail', message: 'Thumbnail cần là đường dẫn public an toàn bắt đầu bằng /.' });
    if (metadata.thumbnail && !String(metadata.thumbnailAlt ?? '').trim()) errors.push({ field: 'thumbnailAlt', message: 'Ảnh thumbnail cần alt text.' });
    for (const figure of content.matchAll(/<figure\b[^>]*data-cms-image[^>]*>([\s\S]*?)<\/figure>/gi)) {
      const image = figure[1].match(/<img\b[^>]*>/i)?.[0] ?? '';
      const source = image.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? '';
      const alt = image.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim() ?? '';
      if (!/^\/[A-Za-z0-9._/-]+$/.test(source) || source.includes('..')) errors.push({ field: 'content', message: 'Ảnh trong nội dung phải dùng đường dẫn public an toàn bắt đầu bằng /.' });
      if (!alt) errors.push({ field: 'content', message: 'Mỗi ảnh trong nội dung cần có alt text.' });
    }
    for (const embed of content.matchAll(/\bdata-youtube-id=["']([^"']*)["']/gi)) {
      if (!YOUTUBE_ID_PATTERN.test(embed[1])) errors.push({ field: 'content', message: 'Block YouTube có URL hoặc video ID không hợp lệ.' });
    }
    if (!content || content === '<p></p>') errors.push({ field: 'content', message: 'Nội dung bài viết không được để trống.' });
    return errors;
  }

  async function save(input) {
    const errors = validate(input);
    if (errors.length) throw new ArticleStoreError('Bài viết chưa đủ thông tin.', 422, 'VALIDATION_ERROR', errors);

    const metadata = input.metadata;
    const originalId = optionalText(input.originalId);
    let original = null;
    let previousData = {};
    let extension = '.md';

    if (originalId) {
      original = await resolveExisting(originalId);
      const currentVersion = `${original.fileStat.mtimeMs}:${original.fileStat.size}`;
      if (input.version && input.version !== currentVersion) {
        throw new ArticleStoreError('File đã thay đổi sau khi bạn mở. Hãy tải lại trước khi lưu.', 409, 'STALE_FILE');
      }
      const parsed = matter(await readFile(original.filePath, 'utf8'));
      previousData = parsed.data;
      extension = path.extname(original.filePath);
    }

    const categoryDirectory = assertInside(articleRoot, path.join(articleRoot, metadata.category));
    const target = assertInside(articleRoot, path.join(categoryDirectory, `${metadata.slug}${extension}`));
    const allArticleFiles = await walkArticles(articleRoot);
    const duplicateSlug = allArticleFiles.find((filePath) =>
      path.basename(filePath, path.extname(filePath)) === metadata.slug
      && (!original || path.resolve(filePath) !== path.resolve(original.filePath)),
    );
    if (duplicateSlug) {
      throw new ArticleStoreError('Slug này đã được dùng bởi một bài viết khác.', 409, 'SLUG_EXISTS');
    }
    if (!original || path.resolve(original.filePath) !== target) {
      try {
        const existing = await stat(target);
        if (existing.isFile()) throw new ArticleStoreError('Slug này đã được dùng trong trụ cột đã chọn.', 409, 'SLUG_EXISTS');
      } catch (error) {
        if (error instanceof ArticleStoreError) throw error;
        if (error.code !== 'ENOENT') throw error;
      }
    }

    const turndown = createTurndownService();
    const markdown = turndown.turndown(normalizeEditorHtml(input.html)).trim();
    const today = new Date().toISOString().slice(0, 10);
    const nextData = {
      ...previousData,
      title: String(metadata.title).trim(),
      description: String(metadata.description).trim(),
      category: metadata.category,
      topic: String(metadata.topic).trim(),
      tags: metadata.tags.map((tag) => String(tag).trim()).filter(Boolean),
      publishedDate: metadata.publishedDate,
      updatedDate: original ? today : undefined,
      author: previousData.author ?? 'Cẩm nang sinh viên',
      featured: previousData.featured ?? false,
      draft: metadata.status === 'draft',
      readingMinutes: estimateReadingMinutes(markdown),
      thumbnail: optionalText(metadata.thumbnail),
      thumbnailAlt: optionalText(metadata.thumbnailAlt),
      seoTitle: optionalText(metadata.seoTitle),
      seoDescription: optionalText(metadata.seoDescription),
      sources: previousData.sources ?? [],
    };
    for (const key of Object.keys(nextData)) {
      if (nextData[key] === undefined) delete nextData[key];
    }

    await mkdir(categoryDirectory, { recursive: true });
    const output = matter.stringify(`${markdown}\n`, nextData);
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, output, { encoding: 'utf8', flag: 'wx' });
    try {
      await rename(temporary, target);
    } catch (error) {
      await unlink(temporary).catch(() => {});
      throw error;
    }
    if (original && path.resolve(original.filePath) !== target) await unlink(original.filePath);

    return get(relativeId(articleRoot, target));
  }

  return { get, list, save, validate };
}

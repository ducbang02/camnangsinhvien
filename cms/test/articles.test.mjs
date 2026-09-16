import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ArticleStoreError, createArticleStore } from '../lib/articles.mjs';

const categories = [
  {
    id: 'hoc-tap-thi-cu',
    name: 'Học tập & thi cử',
    groups: [
      { id: 'hoc-dung-cach', title: 'Học đúng cách', order: 1 },
      { id: 'vao-ky-thi', title: 'Vào kỳ thi', order: 2 },
    ],
  },
  { id: 'ky-nang-may-tinh', name: 'Kỹ năng máy tính' },
];

function input(overrides = {}) {
  return {
    metadata: {
      title: 'Bài kiểm tra CMS local',
      slug: 'bai-kiem-tra-cms-local',
      category: 'hoc-tap-thi-cu',
      topic: 'Kiểm thử',
      group: 'hoc-dung-cach',
      articleOrder: '2',
      description: 'Mô tả đủ dài để kiểm tra schema bài viết của CMS local hoạt động chính xác.',
      thumbnail: '',
      thumbnailAlt: '',
      seoTitle: '',
      seoDescription: '',
      tool: '/cong-cu/tinh-gpa/',
      sources: [{ label: 'Nguồn kiểm tra', url: 'https://example.com/tai-lieu' }],
      status: 'draft',
      publishedDate: '2026-09-14',
      tags: ['cms', 'kiểm thử'],
      ...overrides,
    },
    html: '<h2>Danh sách cần làm</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Kiểm tra nội dung</p></li></ul><table style="min-width: 75px;"><colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>A</p></th><th colspan="1" rowspan="1"><p>B</p></th></tr><tr><td colspan="1" rowspan="1"><p>1</p></td><td colspan="1" rowspan="1"><p>2</p></td></tr></tbody></table>',
  };
}

test('tạo, đọc và cập nhật một bài Markdown trong thư mục tạm', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'cnsv-cms-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createArticleStore({ root, categories });

  const created = await store.save(input());
  assert.equal(created.id, 'hoc-tap-thi-cu/bai-kiem-tra-cms-local');
  assert.equal(created.metadata.status, 'draft');
  const markdownPath = path.join(root, 'hoc-tap-thi-cu', 'bai-kiem-tra-cms-local.md');
  const markdown = await readFile(markdownPath, 'utf8');
  assert.match(markdown, /draft: true/);
  assert.match(markdown, /- \[x\] Kiểm tra nội dung/);
  assert.match(markdown, /\| A \| B \|/);
  assert.match(markdown, /tool: \/cong-cu\/tinh-gpa\//);
  assert.match(markdown, /group: hoc-dung-cach/);
  assert.match(markdown, /articleOrder: 2/);
  assert.match(markdown, /label: Nguồn kiểm tra/);

  const loaded = await store.get(created.id);
  assert.match(loaded.html, /data-type="taskList"/);
  assert.match(loaded.html, /data-checked="true"/);
  assert.equal(loaded.metadata.tool, '/cong-cu/tinh-gpa/');
  assert.equal(loaded.metadata.group, 'hoc-dung-cach');
  assert.equal(loaded.metadata.articleOrder, 2);
  assert.deepEqual(loaded.metadata.sources, [{ label: 'Nguồn kiểm tra', url: 'https://example.com/tai-lieu' }]);
  const updated = await store.save({
    ...input({ title: 'Bài kiểm tra CMS local đã cập nhật' }),
    html: loaded.html,
    originalId: created.id,
    version: created.version,
  });
  assert.match(await readFile(markdownPath, 'utf8'), /- \[x\] Kiểm tra nội dung/);
  assert.equal(updated.metadata.title, 'Bài kiểm tra CMS local đã cập nhật');
  assert.equal((await store.list()).length, 1);
});

test('không ghi đè khi file đã bị thay đổi bên ngoài CMS', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'cnsv-cms-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createArticleStore({ root, categories });
  const created = await store.save(input());
  const markdownPath = path.join(root, 'hoc-tap-thi-cu', 'bai-kiem-tra-cms-local.md');
  await writeFile(markdownPath, `${await readFile(markdownPath, 'utf8')}\nThay đổi bên ngoài CMS.\n`, 'utf8');

  await assert.rejects(
    () => store.save({ ...input(), originalId: created.id, version: created.version }),
    (error) => error instanceof ArticleStoreError && error.code === 'STALE_FILE',
  );
});

test('từ chối slug và category không hợp lệ', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'cnsv-cms-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createArticleStore({ root, categories });
  const errors = store.validate(input({ slug: '../ra-ngoai', category: 'khong-ton-tai' }));
  assert.deepEqual(errors.map((error) => error.field), ['slug', 'category']);
});

test('từ chối route công cụ và nguồn tham khảo không hợp lệ', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'cnsv-cms-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createArticleStore({ root, categories });
  const errors = store.validate(input({
    tool: 'https://example.com/cong-cu',
    sources: [
      { label: '', url: 'https://example.com' },
      { label: 'Nguồn sai URL', url: 'javascript:alert(1)' },
    ],
  }));
  assert.deepEqual(errors.map((error) => error.field), ['tool', 'sources', 'sources']);
});

test('kiểm tra group theo cấu hình category và thứ tự bài', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'cnsv-cms-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createArticleStore({ root, categories });

  assert.deepEqual(
    store.validate(input({ group: '', articleOrder: '0' })).map((error) => error.field),
    ['group', 'articleOrder'],
  );
  assert.deepEqual(
    store.validate(input({ category: 'ky-nang-may-tinh', group: 'hoc-dung-cach', articleOrder: '' })).map((error) => error.field),
    ['group'],
  );
  assert.deepEqual(
    store.validate(input({ category: 'ky-nang-may-tinh', group: '', articleOrder: '4' })).map((error) => error.field),
    [],
  );
});

test('từ chối slug trùng ở category khác vì route chỉ dùng tên file', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'cnsv-cms-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createArticleStore({ root, categories });
  await store.save(input());
  await assert.rejects(
    () => store.save(input({ category: 'ky-nang-may-tinh', group: '' })),
    (error) => error instanceof ArticleStoreError && error.code === 'SLUG_EXISTS',
  );
});

test('giữ block ảnh có alt/caption và YouTube khi lưu rồi mở lại', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'cnsv-cms-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createArticleStore({ root, categories });
  const mediaHtml = '<h2>Minh họa</h2><figure class="article-figure" data-cms-image><img src="/media/articles/bai-kiem-tra-cms-local/minh-hoa.webp" alt="Sinh viên đang học" loading="lazy"><figcaption>Góc học tập mẫu</figcaption></figure><div class="video-embed" data-youtube-id="dQw4w9WgXcQ"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe></div>';
  const created = await store.save({ ...input(), html: mediaHtml });
  const markdownPath = path.join(root, 'hoc-tap-thi-cu', 'bai-kiem-tra-cms-local.md');
  const markdown = await readFile(markdownPath, 'utf8');
  assert.match(markdown, /<figure class="article-figure" data-cms-image>/);
  assert.match(markdown, /alt="Sinh viên đang học"/);
  assert.match(markdown, /<figcaption>Góc học tập mẫu<\/figcaption>/);
  assert.match(markdown, /data-youtube-id="dQw4w9WgXcQ"/);
  const loaded = await store.get(created.id);
  assert.match(loaded.html, /data-cms-image/);
  assert.match(loaded.html, /data-youtube-id="dQw4w9WgXcQ"/);
});

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ArticleStoreError } from '../lib/articles.mjs';
import { createTaxonomyStore } from '../lib/taxonomy.mjs';

function category(overrides = {}) {
  return {
    id: 'hoc-tap-thi-cu',
    name: 'Học tập & thi cử',
    shortName: 'Học tập',
    number: '01',
    heroImage: '/media/category-heroes/hoc-tap-thi-cu.webp',
    description: 'Phương pháp học và chuẩn bị thi cử dành cho sinh viên.',
    menuDescription: 'Phương pháp học, ôn thi',
    promise: 'Học có chiến lược, thi có kế hoạch.',
    accent: 'mint',
    seoTitle: 'Học tập và thi cử dành cho sinh viên',
    metaDescription: 'Cẩm nang phương pháp học, ôn thi và quản lý môn học dành cho sinh viên đại học.',
    groups: [{ id: 'hoc-dung-cach', title: 'Học đúng cách', description: 'Tìm phương pháp học phù hợp.', order: 1 }],
    ...overrides,
  };
}

async function fixture(t, { withArticle = false } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'cnsv-taxonomy-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const articlesRoot = path.join(root, 'src', 'content', 'articles');
  const sourcePath = path.join(root, 'src', 'data', 'categories.ts');
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await mkdir(articlesRoot, { recursive: true });
  const categories = [category()];
  await writeFile(sourcePath, `function defineCategories(items) { return items; }\n// CMS_CATEGORIES_START\nexport const categories = defineCategories(${JSON.stringify(categories, null, 2)});\n// CMS_CATEGORIES_END\nexport const categoryIds = categories.map((item) => item.id);\n`);
  if (withArticle) {
    const directory = path.join(articlesRoot, 'hoc-tap-thi-cu');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'bai-test.md'), '---\ntitle: Bài test\ncategory: hoc-tap-thi-cu\ngroup: hoc-dung-cach\n---\n');
  }
  return {
    categories,
    store: createTaxonomyStore({ sourcePath, categories, articlesRoot, tools: [] }),
    sourcePath,
  };
}

test('thêm, sửa và xóa group rồi ghi atomic vào categories.ts', async (t) => {
  const { store, sourcePath } = await fixture(t);
  let snapshot = await store.snapshot();
  snapshot = await store.saveGroup({
    categoryId: 'hoc-tap-thi-cu',
    version: snapshot.version,
    group: { id: 'vao-ky-thi', title: 'Vào kỳ thi', description: 'Chuẩn bị có chiến lược cho kỳ thi.', order: 2 },
  });
  assert.equal(snapshot.categories[0].groups.length, 2);
  snapshot = await store.saveGroup({
    categoryId: 'hoc-tap-thi-cu',
    originalId: 'vao-ky-thi',
    version: snapshot.version,
    group: { id: 'vao-ky-thi', title: 'Chuẩn bị kỳ thi', description: 'Chuẩn bị có chiến lược cho kỳ thi.', order: 2 },
  });
  assert.equal(snapshot.categories[0].groups[1].title, 'Chuẩn bị kỳ thi');
  snapshot = await store.deleteGroup({ categoryId: 'hoc-tap-thi-cu', id: 'vao-ky-thi', version: snapshot.version });
  assert.equal(snapshot.categories[0].groups.length, 1);
  const source = await readFile(sourcePath, 'utf8');
  assert.match(source, /CMS_CATEGORIES_START/);
  assert.doesNotMatch(source, /vao-ky-thi/);
});

test('không cho xóa group hoặc chủ đề khi bài viết vẫn tham chiếu', async (t) => {
  const { store } = await fixture(t, { withArticle: true });
  const snapshot = await store.snapshot();
  await assert.rejects(
    () => store.deleteGroup({ categoryId: 'hoc-tap-thi-cu', id: 'hoc-dung-cach', version: snapshot.version }),
    (error) => error instanceof ArticleStoreError && error.code === 'GROUP_IN_USE',
  );
  await assert.rejects(
    () => store.deleteCategory({ id: 'hoc-tap-thi-cu', version: snapshot.version }),
    (error) => error instanceof ArticleStoreError && error.code === 'CATEGORY_IN_USE',
  );
});

test('không cho đổi ID và phát hiện version taxonomy cũ', async (t) => {
  const { store, sourcePath } = await fixture(t);
  const snapshot = await store.snapshot();
  await assert.rejects(
    () => store.saveCategory({
      originalId: 'hoc-tap-thi-cu',
      version: snapshot.version,
      category: category({ id: 'id-moi' }),
    }),
    (error) => error instanceof ArticleStoreError && error.code === 'VALIDATION_ERROR',
  );
  await writeFile(sourcePath, `${await readFile(sourcePath, 'utf8')}\n`);
  await assert.rejects(
    () => store.saveGroup({
      categoryId: 'hoc-tap-thi-cu',
      version: snapshot.version,
      group: { id: 'nhom-moi', title: 'Nhóm mới', description: 'Mô tả đủ dài cho nhóm mới.', order: 2 },
    }),
    (error) => error instanceof ArticleStoreError && error.code === 'STALE_TAXONOMY',
  );
});

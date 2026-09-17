import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { ArticleStoreError } from './articles.mjs';

const START_MARKER = '// CMS_CATEGORIES_START';
const END_MARKER = '// CMS_CATEGORIES_END';
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PUBLIC_PATH_PATTERN = /^\/[A-Za-z0-9._/-]+$/;
const ACCENTS = new Set(['mint', 'blue', 'yellow', 'coral']);

function text(value) {
  return String(value ?? '').trim();
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

async function walk(directory) {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) files.push(target);
  }
  return files;
}

export function createTaxonomyStore({ sourcePath, categories, articlesRoot, tools = [] }) {
  const taxonomyPath = path.resolve(sourcePath);
  const articleDirectory = path.resolve(articlesRoot);

  async function version() {
    const fileStat = await stat(taxonomyPath);
    return `${fileStat.mtimeMs}:${fileStat.size}`;
  }

  async function snapshot() {
    return { categories, version: await version() };
  }

  async function articleReferences() {
    const files = await walk(articleDirectory);
    const references = [];
    for (const file of files) {
      const parsed = matter(await readFile(file, 'utf8'));
      references.push({ file, category: text(parsed.data.category), group: text(parsed.data.group) });
    }
    return references;
  }

  function assertVersion(expected, current) {
    if (expected && expected !== current) {
      throw new ArticleStoreError('Cấu trúc chủ đề đã thay đổi ở nơi khác. Hãy tải lại CMS.', 409, 'STALE_TAXONOMY');
    }
  }

  function validateCategory(input, { editingId } = {}) {
    const category = {
      id: text(input.id),
      name: text(input.name),
      shortName: text(input.shortName),
      number: text(input.number),
      heroImage: text(input.heroImage),
      description: text(input.description),
      menuDescription: text(input.menuDescription),
      promise: text(input.promise),
      accent: text(input.accent),
      seoTitle: text(input.seoTitle),
      metaDescription: text(input.metaDescription),
    };
    const errors = [];
    if (!ID_PATTERN.test(category.id)) errors.push({ field: 'id', message: 'ID chỉ gồm chữ thường không dấu, số và dấu gạch ngang.' });
    if (editingId && category.id !== editingId) errors.push({ field: 'id', message: 'Không thể đổi ID của chủ đề đã tạo.' });
    if (category.name.length < 3) errors.push({ field: 'name', message: 'Tên chủ đề cần ít nhất 3 ký tự.' });
    if (category.shortName.length < 2) errors.push({ field: 'shortName', message: 'Tên ngắn cần ít nhất 2 ký tự.' });
    if (!/^\d{2}$/.test(category.number)) errors.push({ field: 'number', message: 'Số thứ tự cần đúng 2 chữ số, ví dụ 01.' });
    if (!PUBLIC_PATH_PATTERN.test(category.heroImage) || category.heroImage.includes('..')) errors.push({ field: 'heroImage', message: 'Ảnh hero cần là đường dẫn public an toàn bắt đầu bằng /.' });
    if (category.description.length < 20) errors.push({ field: 'description', message: 'Mô tả chủ đề cần ít nhất 20 ký tự.' });
    if (category.menuDescription.length < 5) errors.push({ field: 'menuDescription', message: 'Mô tả menu cần ít nhất 5 ký tự.' });
    if (category.promise.length < 10) errors.push({ field: 'promise', message: 'Thông điệp chủ đề cần ít nhất 10 ký tự.' });
    if (!ACCENTS.has(category.accent)) errors.push({ field: 'accent', message: 'Màu chủ đề không hợp lệ.' });
    if (category.seoTitle.length < 8 || category.seoTitle.length > 70) errors.push({ field: 'seoTitle', message: 'SEO title cần từ 8 đến 70 ký tự.' });
    if (category.metaDescription.length < 40 || category.metaDescription.length > 180) errors.push({ field: 'metaDescription', message: 'Meta description cần từ 40 đến 180 ký tự.' });
    if (errors.length) throw new ArticleStoreError('Thông tin chủ đề chưa hợp lệ.', 422, 'VALIDATION_ERROR', errors);
    return category;
  }

  function validateGroup(input, { editingId } = {}) {
    const group = {
      id: text(input.id),
      title: text(input.title),
      shortTitle: text(input.shortTitle) || undefined,
      description: text(input.description),
      navigationDescription: text(input.navigationDescription) || undefined,
      order: positiveInteger(input.order, 0),
    };
    const errors = [];
    if (!ID_PATTERN.test(group.id)) errors.push({ field: 'id', message: 'ID nhóm chỉ gồm chữ thường không dấu, số và dấu gạch ngang.' });
    if (editingId && group.id !== editingId) errors.push({ field: 'id', message: 'Không thể đổi ID của nhóm đã tạo.' });
    if (group.title.length < 2) errors.push({ field: 'title', message: 'Tên nhóm cần ít nhất 2 ký tự.' });
    if (group.description.length < 10) errors.push({ field: 'description', message: 'Mô tả nhóm cần ít nhất 10 ký tự.' });
    if (!group.order) errors.push({ field: 'order', message: 'Thứ tự nhóm phải là số nguyên từ 1 trở lên.' });
    if (errors.length) throw new ArticleStoreError('Thông tin nhóm chưa hợp lệ.', 422, 'VALIDATION_ERROR', errors);
    for (const key of Object.keys(group)) if (group[key] === undefined) delete group[key];
    return group;
  }

  async function persist(nextCategories, expectedVersion) {
    const currentVersion = await version();
    assertVersion(expectedVersion, currentVersion);
    const source = await readFile(taxonomyPath, 'utf8');
    const start = source.indexOf(START_MARKER);
    const end = source.indexOf(END_MARKER);
    if (start < 0 || end < start) throw new ArticleStoreError('Không tìm thấy vùng dữ liệu taxonomy trong categories.ts.', 500, 'TAXONOMY_MARKERS_MISSING');
    const before = source.slice(0, start + START_MARKER.length);
    const after = source.slice(end);
    const generated = `\nexport const categories = defineCategories(${JSON.stringify(nextCategories, null, 2)});\n`;
    const temporary = `${taxonomyPath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${before}${generated}${after}`, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, taxonomyPath);
    categories.splice(0, categories.length, ...nextCategories);
    return snapshot();
  }

  async function saveCategory({ category: input, originalId, version: expectedVersion } = {}) {
    const existing = originalId ? categories.find((item) => item.id === originalId) : null;
    if (originalId && !existing) throw new ArticleStoreError('Không tìm thấy chủ đề cần sửa.', 404, 'CATEGORY_NOT_FOUND');
    const category = validateCategory(input ?? {}, { editingId: originalId || undefined });
    if (!existing && categories.some((item) => item.id === category.id)) throw new ArticleStoreError('ID chủ đề đã tồn tại.', 409, 'CATEGORY_EXISTS');
    if (categories.some((item) => item.number === category.number && item.id !== originalId)) throw new ArticleStoreError('Số thứ tự chủ đề đã được sử dụng.', 409, 'CATEGORY_NUMBER_EXISTS');
    const next = existing
      ? categories.map((item) => item.id === originalId ? { ...item, ...category } : item)
      : [...categories, category];
    next.sort((a, b) => a.number.localeCompare(b.number));
    return persist(next, expectedVersion);
  }

  async function deleteCategory({ id, version: expectedVersion } = {}) {
    const categoryId = text(id);
    const category = categories.find((item) => item.id === categoryId);
    if (!category) throw new ArticleStoreError('Không tìm thấy chủ đề cần xóa.', 404, 'CATEGORY_NOT_FOUND');
    const article = (await articleReferences()).find((item) => item.category === categoryId);
    if (article) throw new ArticleStoreError('Không thể xóa chủ đề vì vẫn còn bài viết thuộc chủ đề này.', 409, 'CATEGORY_IN_USE');
    if (tools.some((tool) => tool.category === categoryId)) throw new ArticleStoreError('Không thể xóa chủ đề vì vẫn còn công cụ đang tham chiếu.', 409, 'CATEGORY_IN_USE');
    return persist(categories.filter((item) => item.id !== categoryId), expectedVersion);
  }

  async function saveGroup({ categoryId, group: input, originalId, version: expectedVersion } = {}) {
    const category = categories.find((item) => item.id === text(categoryId));
    if (!category) throw new ArticleStoreError('Không tìm thấy chủ đề của nhóm.', 404, 'CATEGORY_NOT_FOUND');
    const groups = [...(category.groups ?? [])];
    const existing = originalId ? groups.find((item) => item.id === originalId) : null;
    if (originalId && !existing) throw new ArticleStoreError('Không tìm thấy nhóm cần sửa.', 404, 'GROUP_NOT_FOUND');
    const group = validateGroup(input ?? {}, { editingId: originalId || undefined });
    if (!existing && groups.some((item) => item.id === group.id)) throw new ArticleStoreError('ID nhóm đã tồn tại trong chủ đề.', 409, 'GROUP_EXISTS');
    if (groups.some((item) => item.order === group.order && item.id !== originalId)) throw new ArticleStoreError('Thứ tự nhóm đã được sử dụng.', 409, 'GROUP_ORDER_EXISTS');
    const nextGroups = existing
      ? groups.map((item) => item.id === originalId ? { ...item, ...group } : item)
      : [...groups, group];
    nextGroups.sort((a, b) => a.order - b.order);
    const next = categories.map((item) => item.id === category.id ? { ...item, groups: nextGroups } : item);
    return persist(next, expectedVersion);
  }

  async function deleteGroup({ categoryId, id, version: expectedVersion } = {}) {
    const selectedCategory = text(categoryId);
    const groupId = text(id);
    const category = categories.find((item) => item.id === selectedCategory);
    if (!category) throw new ArticleStoreError('Không tìm thấy chủ đề của nhóm.', 404, 'CATEGORY_NOT_FOUND');
    if (!(category.groups ?? []).some((item) => item.id === groupId)) throw new ArticleStoreError('Không tìm thấy nhóm cần xóa.', 404, 'GROUP_NOT_FOUND');
    const article = (await articleReferences()).find((item) => item.category === selectedCategory && item.group === groupId);
    if (article) throw new ArticleStoreError('Không thể xóa nhóm vì vẫn còn bài viết trong nhóm này.', 409, 'GROUP_IN_USE');
    const groups = (category.groups ?? []).filter((item) => item.id !== groupId);
    const next = categories.map((item) => {
      if (item.id !== selectedCategory) return item;
      const updated = { ...item };
      if (groups.length) updated.groups = groups;
      else delete updated.groups;
      return updated;
    });
    return persist(next, expectedVersion);
  }

  return { snapshot, saveCategory, deleteCategory, saveGroup, deleteGroup };
}

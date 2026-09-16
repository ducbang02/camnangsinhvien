import { Editor, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import './styles.css';

const ASTRO_URL = 'http://127.0.0.1:4321';
const listView = document.querySelector('#list-view');
const editorView = document.querySelector('#editor-view');
const form = document.querySelector('#article-form');
const titleInput = document.querySelector('#title');
const slugInput = document.querySelector('#slug');
const slugPreview = document.querySelector('#slug-preview');
const categorySelect = document.querySelector('#category');
const categoryFilter = document.querySelector('#category-filter');
const searchInput = document.querySelector('#article-search');
const statusInput = document.querySelector('#status');
const descriptionInput = document.querySelector('#description');
const seoTitleInput = document.querySelector('#seoTitle');
const seoDescriptionInput = document.querySelector('#seoDescription');
const toolSelect = document.querySelector('#tool');
const sourcesList = document.querySelector('#sources-list');
const saveState = document.querySelector('#save-state');
const validationSummary = document.querySelector('#validation-summary');
const toast = document.querySelector('#toast');
const imageDialog = document.querySelector('#image-dialog');
const imageForm = document.querySelector('#image-form');
const publishDialog = document.querySelector('#publish-dialog');
const publishForm = document.querySelector('#publish-form');

let categories = [];
let siteTools = [];
let articles = [];
let currentArticle = null;
let isDirty = false;
let isHydrating = false;
let slugWasEdited = false;
let toastTimer;
let publishPlan = null;

const ImageFigure = Node.create({
  name: 'imageFigure',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: '', parseHTML: (element) => element.querySelector('img')?.getAttribute('src') ?? '' },
      alt: { default: '', parseHTML: (element) => element.querySelector('img')?.getAttribute('alt') ?? '' },
      caption: { default: '', parseHTML: (element) => element.querySelector('figcaption')?.textContent?.trim() ?? '' },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-cms-image]' }, { tag: 'figure.article-figure' }];
  },
  renderHTML({ node }) {
    return ['figure', { class: 'article-figure', 'data-cms-image': '' },
      ['img', { src: node.attrs.src, alt: node.attrs.alt, loading: 'lazy' }],
      ['figcaption', {}, node.attrs.caption],
    ];
  },
});

const YoutubeEmbed = Node.create({
  name: 'youtubeEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      videoId: { default: '', parseHTML: (element) => element.getAttribute('data-youtube-id') ?? '' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-youtube-id]' }];
  },
  renderHTML({ node }) {
    return ['div', { class: 'video-embed', 'data-youtube-id': node.attrs.videoId },
      ['iframe', {
        src: `https://www.youtube-nocookie.com/embed/${node.attrs.videoId}`,
        title: 'Video YouTube',
        loading: 'lazy',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        allowfullscreen: 'true',
      }],
    ];
  },
});

function cleanPastedHtml(html) {
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  documentFragment.querySelectorAll('script, style, meta, link, object, embed, iframe').forEach((node) => node.remove());

  const wordParagraphs = [...documentFragment.body.children].filter((node) =>
    node.tagName === 'P' && /mso-list/i.test(node.getAttribute('style') || ''),
  );
  for (const paragraph of wordParagraphs) {
    const text = paragraph.textContent.trim();
    const ordered = /^(\d+|[a-z])[.)]\s+/i.test(text);
    const listTag = ordered ? 'OL' : 'UL';
    let list = paragraph.previousElementSibling;
    if (!list || list.tagName !== listTag || list.dataset.cmsPasteList !== 'true') {
      list = documentFragment.createElement(listTag);
      list.dataset.cmsPasteList = 'true';
      paragraph.before(list);
    }
    const item = documentFragment.createElement('li');
    item.innerHTML = paragraph.innerHTML
      .replace(/<!--\[if[^>]*]>[\s\S]*?<!\[endif\]-->/gi, '')
      .replace(/^\s*(?:\d+|[a-z])[.)]\s*/i, '')
      .replace(/^\s*[•·▪o]\s*/i, '');
    list.append(item);
    paragraph.remove();
  }

  documentFragment.querySelectorAll('[data-cms-paste-list]').forEach((node) => node.removeAttribute('data-cms-paste-list'));
  documentFragment.querySelectorAll('*').forEach((node) => {
    for (const attribute of [...node.attributes]) {
      if (['style', 'class', 'id', 'lang', 'dir', 'face', 'color', 'size', 'width', 'height', 'align'].includes(attribute.name)
        || attribute.name.startsWith('on')) node.removeAttribute(attribute.name);
    }
  });
  documentFragment.querySelectorAll('font, span').forEach((node) => node.replaceWith(...node.childNodes));
  return documentFragment.body.innerHTML;
}

const editor = new Editor({
  element: document.querySelector('#content-editor'),
  extensions: [
    StarterKit.configure({ heading: { levels: [2, 3] } }),
    TableKit.configure({ table: { resizable: true } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    ImageFigure,
    YoutubeEmbed,
  ],
  content: '<p>Bắt đầu viết nội dung tại đây…</p>',
  editorProps: {
    attributes: { 'aria-label': 'Nội dung bài viết', spellcheck: 'true' },
    transformPastedHTML: cleanPastedHtml,
  },
  onUpdate: () => markDirty(),
  onSelectionUpdate: updateToolbar,
});

function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}

async function api(path, options) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'CMS không thể xử lý yêu cầu.');
    error.details = payload.details ?? [];
    error.code = payload.code;
    throw error;
  }
  return payload;
}

function articlePayload({ forcePublished = false } = {}) {
  const metadata = metadataFromForm();
  if (forcePublished) metadata.status = 'published';
  return {
    originalId: currentArticle?.id,
    version: currentArticle?.version,
    extension: currentArticle?.extension,
    metadata,
    html: editor.getHTML(),
  };
}

async function uploadImage(file) {
  const slug = slugInput.value.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Hãy nhập tiêu đề/slug hợp lệ trước khi tải ảnh.');
  if (!file) throw new Error('Hãy chọn một file ảnh.');
  const response = await fetch(`/api/media/upload?slug=${encodeURIComponent(slug)}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Không thể tải ảnh lên.');
    error.code = payload.code;
    error.details = payload.details ?? [];
    throw error;
  }
  return payload.media;
}

function youtubeId(value) {
  try {
    const url = new URL(String(value).trim());
    const host = url.hostname.replace(/^www\./, '');
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] ?? '';
    if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v') ?? '';
      else if (/^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split('/')[2] ?? '';
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function markDirty() {
  if (isHydrating) return;
  isDirty = true;
  saveState.textContent = 'Có thay đổi chưa lưu';
}

function setClean(message = 'Đã lưu local') {
  isDirty = false;
  saveState.textContent = message;
}

function autosizeTitle() {
  titleInput.style.height = 'auto';
  titleInput.style.height = `${titleInput.scrollHeight}px`;
  titleInput.scrollTop = 0;
}

function setCounter(input, output, maximum) {
  output.textContent = `${input.value.length}/${maximum}`;
}

function populateCategories() {
  for (const category of categories) {
    const editorOption = new Option(`${category.number}. ${category.name}`, category.id);
    const filterOption = new Option(`${category.number}. ${category.name}`, category.id);
    categorySelect.add(editorOption);
    categoryFilter.add(filterOption);
  }
}

function populateTools() {
  for (const tool of siteTools) {
    toolSelect.add(new Option(tool.name, `/cong-cu/${tool.slug}/`));
  }
}

function ensureToolOption(value) {
  if (!value || [...toolSelect.options].some((option) => option.value === value)) return;
  toolSelect.add(new Option(`Đường dẫn hiện có: ${value}`, value));
}

function addSourceRow(source = {}, { focus = false } = {}) {
  const row = document.createElement('div');
  row.className = 'source-row';

  const labelControl = document.createElement('label');
  labelControl.className = 'source-control';
  const labelText = document.createElement('span');
  labelText.textContent = 'Tên nguồn';
  const labelInput = document.createElement('input');
  labelInput.name = 'sources';
  labelInput.type = 'text';
  labelInput.placeholder = 'Ví dụ: Quy chế đào tạo của trường';
  labelInput.value = source.label ?? '';
  labelControl.append(labelText, labelInput);

  const urlControl = document.createElement('label');
  urlControl.className = 'source-control';
  const urlText = document.createElement('span');
  urlText.textContent = 'URL';
  const urlInput = document.createElement('input');
  urlInput.name = 'sources';
  urlInput.type = 'url';
  urlInput.placeholder = 'https://...';
  urlInput.value = source.url ?? '';
  urlControl.append(urlText, urlInput);

  const remove = document.createElement('button');
  remove.className = 'source-remove';
  remove.type = 'button';
  remove.dataset.action = 'remove-source';
  remove.setAttribute('aria-label', 'Xóa nguồn tham khảo này');
  remove.textContent = '×';

  row.append(labelControl, urlControl, remove);
  sourcesList.append(row);
  if (focus) labelInput.focus();
}

function renderSources(sources = []) {
  sourcesList.replaceChildren();
  for (const source of sources) addSourceRow(source);
  if (!sources.length) addSourceRow();
}

function sourcesFromForm() {
  return [...sourcesList.querySelectorAll('.source-row')]
    .map((row) => {
      const [label, url] = row.querySelectorAll('input');
      return { label: label.value.trim(), url: url.value.trim() };
    })
    .filter((source) => source.label || source.url);
}

function categoryName(id) {
  return categories.find((category) => category.id === id)?.shortName || id;
}

function renderArticles() {
  const query = searchInput.value.trim().toLocaleLowerCase('vi');
  const selectedCategory = categoryFilter.value;
  const filtered = articles.filter((article) =>
    (!query || article.title.toLocaleLowerCase('vi').includes(query))
    && (!selectedCategory || article.category === selectedCategory),
  );
  const tableBody = document.querySelector('#article-list');
  tableBody.replaceChildren();

  for (const article of filtered) {
    const row = document.createElement('tr');
    const titleCell = document.createElement('td');
    const title = document.createElement('span');
    title.className = 'article-title';
    title.textContent = article.title;
    const id = document.createElement('span');
    id.className = 'article-id';
    id.textContent = article.id;
    titleCell.append(title, id);

    const categoryCell = document.createElement('td');
    const category = document.createElement('span');
    category.className = 'category-chip';
    category.textContent = categoryName(article.category);
    categoryCell.append(category);

    const statusCell = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status-chip ${article.status}`;
    status.textContent = article.status === 'published' ? 'Published' : 'Draft';
    statusCell.append(status);

    const dateCell = document.createElement('td');
    dateCell.textContent = article.updatedDate || article.publishedDate || '—';

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openArticle(article.id));
    const preview = document.createElement('a');
    preview.href = `${ASTRO_URL}/cam-nang/${article.id.split('/').at(-1)}/`;
    preview.target = '_blank';
    preview.rel = 'noopener';
    preview.textContent = 'Preview ↗';
    actions.append(edit, preview);
    actionsCell.append(actions);
    row.append(titleCell, categoryCell, statusCell, dateCell, actionsCell);
    tableBody.append(row);
  }

  document.querySelector('#empty-state').hidden = filtered.length > 0;
  document.querySelector('.article-table').hidden = filtered.length === 0;
  document.querySelector('#article-count').textContent = `${filtered.length}${filtered.length !== articles.length ? ` / ${articles.length}` : ''} bài viết`;
}

function showView(name) {
  listView.hidden = name !== 'list';
  editorView.hidden = name !== 'editor';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function resetErrors() {
  validationSummary.hidden = true;
  validationSummary.replaceChildren();
  document.querySelectorAll('.field.has-error').forEach((field) => field.classList.remove('has-error'));
}

function displayErrors(details = [], fallback = 'Hãy kiểm tra lại dữ liệu bài viết.') {
  resetErrors();
  const strong = document.createElement('strong');
  strong.textContent = fallback;
  validationSummary.append(strong);
  if (details.length) {
    const list = document.createElement('ul');
    for (const detail of details) {
      const item = document.createElement('li');
      item.textContent = detail.message;
      list.append(item);
      document.querySelector(`[name="${detail.field}"]`)?.closest('.field')?.classList.add('has-error');
    }
    validationSummary.append(list);
  }
  validationSummary.hidden = false;
  const firstField = details[0]?.field;
  if (firstField === 'content') editor.commands.focus();
  else if (firstField) document.querySelector(`[name="${firstField}"]`)?.focus();
}

function metadataFromForm() {
  return {
    title: titleInput.value.trim(),
    slug: slugInput.value.trim(),
    category: categorySelect.value,
    topic: document.querySelector('#topic').value.trim(),
    description: descriptionInput.value.trim(),
    thumbnail: document.querySelector('#thumbnail').value.trim(),
    thumbnailAlt: document.querySelector('#thumbnailAlt').value.trim(),
    seoTitle: seoTitleInput.value.trim(),
    seoDescription: seoDescriptionInput.value.trim(),
    tool: toolSelect.value,
    sources: sourcesFromForm(),
    status: statusInput.value,
    publishedDate: document.querySelector('#publishedDate').value,
    tags: document.querySelector('#tags').value.split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}

function hydrateEditor(article) {
  isHydrating = true;
  currentArticle = article;
  const metadata = article.metadata;
  for (const [name, value] of Object.entries(metadata)) {
    if (name === 'sources') continue;
    const field = form.elements.namedItem(name);
    if (!field) continue;
    if (name === 'tool') ensureToolOption(value);
    field.value = name === 'tags' ? value.join(', ') : value;
  }
  renderSources(metadata.sources ?? []);
  editor.commands.setContent(article.html || '<p></p>');
  document.querySelector('#editor-title').textContent = metadata.title || 'Bài viết mới';
  slugPreview.textContent = metadata.slug || 'ten-bai-viet';
  slugWasEdited = Boolean(article.id);
  setCounter(descriptionInput, document.querySelector('#description-count'), 180);
  setCounter(seoTitleInput, document.querySelector('#seo-title-count'), 70);
  setCounter(seoDescriptionInput, document.querySelector('#seo-description-count'), 180);
  resetErrors();
  isHydrating = false;
  setClean(article.id ? 'Đã tải từ repository' : 'Chưa lưu');
  if (!article.id) isDirty = true;
  showView('editor');
  requestAnimationFrame(autosizeTitle);
  document.fonts?.ready.then(autosizeTitle);
  titleInput.focus();
}

function newArticle() {
  hydrateEditor({
    id: null,
    version: null,
    metadata: {
      title: '', slug: '', category: '', topic: '', description: '', thumbnail: '', thumbnailAlt: '',
      seoTitle: '', seoDescription: '', tool: '', sources: [], status: 'draft', publishedDate: today(), tags: [],
    },
    html: '<p></p>',
  });
}

async function openArticle(id) {
  try {
    const { article } = await api(`/api/article?id=${encodeURIComponent(id)}`);
    hydrateEditor(article);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function refreshArticles() {
  const payload = await api('/api/articles');
  articles = payload.articles;
  renderArticles();
}

async function saveArticle({ forceDraft = false } = {}) {
  resetErrors();
  if (forceDraft) statusInput.value = 'draft';
  const buttonList = [...document.querySelectorAll('.editor-actions button:not(:disabled)')];
  buttonList.forEach((button) => { button.disabled = true; });
  saveState.textContent = 'Đang lưu…';
  try {
    const payload = await api('/api/articles/save', {
      method: 'POST',
      body: JSON.stringify(articlePayload()),
    });
    currentArticle = payload.article;
    slugWasEdited = true;
    setClean(payload.article.metadata.status === 'draft' ? 'Đã lưu nháp local' : 'Đã lưu Published local');
    document.querySelector('#editor-title').textContent = payload.article.metadata.title;
    showToast(payload.message);
    await refreshArticles();
    return payload.article;
  } catch (error) {
    saveState.textContent = 'Lưu chưa thành công';
    displayErrors(error.details, error.message);
    showToast(error.message, 'error');
    return null;
  } finally {
    buttonList.forEach((button) => { button.disabled = false; });
  }
}

async function preparePublish() {
  resetErrors();
  saveState.textContent = 'Đang validate project…';
  const buttons = [...document.querySelectorAll('.editor-actions button')];
  buttons.forEach((button) => { button.disabled = true; });
  try {
    const { plan } = await api('/api/publish/prepare', {
      method: 'POST',
      body: JSON.stringify(articlePayload({ forcePublished: true })),
    });
    publishPlan = plan;
    currentArticle = plan.article;
    statusInput.value = 'published';
    setClean('Đã validate — chờ xác nhận Git');
    document.querySelector('#publish-target').textContent = `Branch: ${plan.branch} · Remote: ${plan.remote}`;
    const fileList = document.querySelector('#publish-file-list');
    fileList.replaceChildren(...plan.files.map((file) => {
      const item = document.createElement('li');
      item.textContent = file;
      return item;
    }));
    document.querySelector('#commit-message').value = plan.suggestedMessage;
    await refreshArticles();
    publishDialog.showModal();
  } catch (error) {
    saveState.textContent = 'Chưa thể xuất bản';
    displayErrors(error.details, error.message);
    showToast(error.message, 'error');
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

async function confirmPublish() {
  if (!publishPlan) return;
  const submit = publishForm.querySelector('button[type="submit"]');
  const cancel = publishForm.querySelector('[data-action="close-publish-dialog"]');
  submit.disabled = true;
  cancel.disabled = true;
  submit.textContent = 'Đang commit & push…';
  try {
    const { result } = await api('/api/publish/confirm', {
      method: 'POST',
      body: JSON.stringify({ token: publishPlan.token, message: document.querySelector('#commit-message').value.trim() }),
    });
    publishDialog.close();
    publishPlan = null;
    currentArticle = result.article;
    setClean(`Đã push commit ${result.commit}`);
    showToast(result.message);
    await refreshArticles();
  } catch (error) {
    showToast(error.message, 'error');
    const detail = error.details?.map((item) => item.message).filter(Boolean).join('\n');
    if (detail) window.alert(`${error.message}\n\n${detail}`);
  } finally {
    submit.disabled = false;
    cancel.disabled = false;
    submit.textContent = 'Commit và push';
  }
}

async function previewArticle() {
  const previewWindow = window.open('about:blank', 'cms-article-preview');
  const article = await saveArticle();
  if (!article) {
    previewWindow?.close();
    return;
  }
  const previewUrl = `${ASTRO_URL}${article.previewUrl}?cms-preview=${Date.now()}`;
  if (previewWindow) previewWindow.location.href = previewUrl;
  else window.open(previewUrl, '_blank', 'noopener');
}

function updateToolbar() {
  const activeMap = {
    heading2: editor.isActive('heading', { level: 2 }),
    heading3: editor.isActive('heading', { level: 3 }),
    paragraph: editor.isActive('paragraph'),
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    link: editor.isActive('link'),
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    taskList: editor.isActive('taskList'),
    blockquote: editor.isActive('blockquote'),
    codeBlock: editor.isActive('codeBlock'),
  };
  document.querySelectorAll('[data-command]').forEach((button) => button.classList.toggle('is-active', Boolean(activeMap[button.dataset.command])));
  document.querySelector('.table-tools').hidden = !editor.isActive('table');
}

const commands = {
  heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  heading3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  paragraph: () => editor.chain().focus().setParagraph().run(),
  bold: () => editor.chain().focus().toggleBold().run(),
  italic: () => editor.chain().focus().toggleItalic().run(),
  link: () => {
    const previous = editor.getAttributes('link').href || '';
    const href = window.prompt('Nhập URL liên kết (để trống để gỡ link):', previous);
    if (href === null) return;
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  },
  bulletList: () => editor.chain().focus().toggleBulletList().run(),
  orderedList: () => editor.chain().focus().toggleOrderedList().run(),
  taskList: () => editor.chain().focus().toggleTaskList().run(),
  blockquote: () => editor.chain().focus().toggleBlockquote().run(),
  codeBlock: () => editor.chain().focus().toggleCodeBlock().run(),
  horizontalRule: () => editor.chain().focus().setHorizontalRule().run(),
  table: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  addRow: () => editor.chain().focus().addRowAfter().run(),
  addColumn: () => editor.chain().focus().addColumnAfter().run(),
  deleteTable: () => editor.chain().focus().deleteTable().run(),
  undo: () => editor.chain().focus().undo().run(),
  redo: () => editor.chain().focus().redo().run(),
};

document.querySelector('#toolbar').addEventListener('click', (event) => {
  const button = event.target.closest('[data-command]');
  if (!button) return;
  commands[button.dataset.command]?.();
  updateToolbar();
});

document.addEventListener('click', async (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'new-article') newArticle();
  if (action === 'save-draft') await saveArticle({ forceDraft: true });
  if (action === 'save-local') await saveArticle();
  if (action === 'preview') await previewArticle();
  if (action === 'prepare-publish') await preparePublish();
  if (action === 'open-image-dialog') imageDialog.showModal();
  if (action === 'close-image-dialog') imageDialog.close();
  if (action === 'close-publish-dialog') {
    publishPlan = null;
    publishDialog.close();
  }
  if (action === 'insert-youtube') {
    const url = window.prompt('Dán URL YouTube:');
    if (url === null) return;
    const id = youtubeId(url);
    if (!id) showToast('URL YouTube không hợp lệ.', 'error');
    else editor.chain().focus().insertContent({ type: 'youtubeEmbed', attrs: { videoId: id } }).run();
  }
  if (action === 'upload-thumbnail') {
    try {
      const media = await uploadImage(document.querySelector('#thumbnail-file').files[0]);
      document.querySelector('#thumbnail').value = media.publicPath;
      markDirty();
      document.querySelector('#thumbnailAlt').focus();
      showToast('Đã tải thumbnail. Hãy nhập alt text trước khi lưu.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
  if (action === 'regenerate-slug') {
    slugInput.value = slugify(titleInput.value);
    slugPreview.textContent = slugInput.value || 'ten-bai-viet';
    slugWasEdited = true;
    markDirty();
  }
  if (action === 'add-source') {
    addSourceRow({}, { focus: true });
    markDirty();
  }
  if (action === 'remove-source') {
    event.target.closest('.source-row')?.remove();
    if (!sourcesList.children.length) addSourceRow();
    if (!validationSummary.hidden) resetErrors();
    markDirty();
  }
  if (action === 'show-list' || action === 'back-to-list') {
    if (isDirty && !window.confirm('Bạn có thay đổi chưa lưu. Vẫn quay lại danh sách?')) return;
    showView('list');
  }
});

imageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = document.querySelector('#body-image-file').files[0];
  const alt = document.querySelector('#body-image-alt').value.trim();
  const caption = document.querySelector('#body-image-caption').value.trim();
  if (!file || !alt) {
    showToast('Hãy chọn ảnh và nhập alt text.', 'error');
    return;
  }
  const submit = imageForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Đang tải…';
  try {
    const media = await uploadImage(file);
    editor.chain().focus().insertContent({ type: 'imageFigure', attrs: { src: media.publicPath, alt, caption } }).run();
    imageDialog.close();
    imageForm.reset();
    showToast('Đã chèn ảnh vào bài viết.');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Tải lên và chèn';
  }
});

publishForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await confirmPublish();
});

form.addEventListener('input', (event) => {
  if (!validationSummary.hidden) resetErrors();
  markDirty();
  if (event.target === titleInput) {
    autosizeTitle();
    document.querySelector('#editor-title').textContent = titleInput.value || 'Bài viết mới';
    if (!slugWasEdited) {
      slugInput.value = slugify(titleInput.value);
      slugPreview.textContent = slugInput.value || 'ten-bai-viet';
    }
  }
  if (event.target === slugInput) {
    slugWasEdited = true;
    slugPreview.textContent = slugInput.value || 'ten-bai-viet';
  }
  if (event.target === descriptionInput) setCounter(descriptionInput, document.querySelector('#description-count'), 180);
  if (event.target === seoTitleInput) setCounter(seoTitleInput, document.querySelector('#seo-title-count'), 70);
  if (event.target === seoDescriptionInput) setCounter(seoDescriptionInput, document.querySelector('#seo-description-count'), 180);
});

searchInput.addEventListener('input', renderArticles);
categoryFilter.addEventListener('change', renderArticles);
window.addEventListener('resize', autosizeTitle);
window.addEventListener('beforeunload', (event) => {
  if (!isDirty) return;
  event.preventDefault();
});

try {
  const [categoryPayload, articlePayload] = await Promise.all([api('/api/categories'), api('/api/articles')]);
  categories = categoryPayload.categories;
  siteTools = categoryPayload.tools ?? [];
  articles = articlePayload.articles;
  populateCategories();
  populateTools();
  renderArticles();
} catch (error) {
  document.querySelector('#article-count').textContent = 'Không thể đọc nội dung';
  showToast(error.message, 'error');
}

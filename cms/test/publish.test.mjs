import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { createArticleStore } from '../lib/articles.mjs';
import { createPublisher } from '../lib/publish.mjs';

const exec = promisify(execFile);
const categories = [{ id: 'hoc-tap-thi-cu', name: 'Học tập & thi cử' }];

function articleInput() {
  return {
    metadata: {
      title: 'Bài kiểm tra publish an toàn',
      slug: 'bai-kiem-tra-publish-an-toan',
      category: 'hoc-tap-thi-cu',
      topic: 'Kiểm thử',
      description: 'Mô tả đủ dài dùng để kiểm tra quy trình publish an toàn của CMS local.',
      thumbnail: '', thumbnailAlt: '', seoTitle: '', seoDescription: '',
      status: 'draft', publishedDate: '2026-09-15', tags: ['cms'],
    },
    html: '<h2>Nội dung kiểm tra</h2><p>Quy trình chỉ được commit đúng file của bài hiện tại.</p>',
  };
}

async function git(cwd, ...args) {
  return exec('git', args, { cwd, encoding: 'utf8' });
}

async function fixture(t) {
  const parent = await mkdtemp(path.join(tmpdir(), 'cnsv-publish-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const repositoryRoot = path.join(parent, 'work');
  const remote = path.join(parent, 'remote.git');
  await mkdir(repositoryRoot);
  await git(repositoryRoot, 'init');
  await git(repositoryRoot, 'config', 'user.name', 'CMS Test');
  await git(repositoryRoot, 'config', 'user.email', 'cms-test@example.com');
  await writeFile(path.join(repositoryRoot, 'README.md'), '# Test\n');
  await writeFile(path.join(repositoryRoot, '.gitignore'), '.cms-trash/\n');
  await git(repositoryRoot, 'add', 'README.md', '.gitignore');
  await git(repositoryRoot, 'commit', '-m', 'test: khởi tạo');
  await git(repositoryRoot, 'branch', '-M', 'main');
  await git(parent, 'init', '--bare', remote);
  await git(repositoryRoot, 'remote', 'add', 'origin', remote);
  const articlesRoot = path.join(repositoryRoot, 'src', 'content', 'articles');
  await mkdir(articlesRoot, { recursive: true });
  const store = createArticleStore({ root: articlesRoot, categories });
  const publisher = createPublisher({
    repositoryRoot,
    store,
    validateCommand: { executable: process.execPath, args: ['-e', 'process.exit(0)'] },
  });
  return { repositoryRoot, remote, publisher };
}

test('prepare liệt kê đúng file rồi confirm commit và push branch hiện tại', async (t) => {
  const { repositoryRoot, remote, publisher } = await fixture(t);
  const plan = await publisher.prepare(articleInput());
  assert.equal(plan.branch, 'main');
  assert.deepEqual(plan.files, ['src/content/articles/hoc-tap-thi-cu/bai-kiem-tra-publish-an-toan.md']);
  const result = await publisher.confirm({ token: plan.token, message: 'feat: xuất bản bài kiểm tra an toàn' });
  assert.match(result.commit, /^[a-f0-9]+$/);
  assert.match((await git(repositoryRoot, 'log', '-1', '--pretty=%s')).stdout, /xuất bản bài kiểm tra an toàn/);
  assert.match((await git(remote, 'show-ref', '--heads', 'main')).stdout, /refs\/heads\/main/);
  assert.match(await readFile(path.join(repositoryRoot, plan.files[0]), 'utf8'), /draft: false/);
});

test('dừng trước khi lưu nếu repository có thay đổi không liên quan', async (t) => {
  const { repositoryRoot, publisher } = await fixture(t);
  await writeFile(path.join(repositoryRoot, 'README.md'), '# Thay đổi ngoài bài viết\n');
  await assert.rejects(
    () => publisher.prepare(articleInput()),
    (error) => error.code === 'GIT_UNRELATED_CHANGES' && error.details[0].message === 'README.md',
  );
});

test('gỡ bài chuyển trạng thái thành Draft rồi commit và push', async (t) => {
  const { repositoryRoot, publisher } = await fixture(t);
  const publishPlan = await publisher.prepare(articleInput());
  const published = await publisher.confirm({ token: publishPlan.token, message: 'feat: xuất bản bài trước khi gỡ' });

  const unpublishPlan = await publisher.prepare({
    ...articleInput(),
    originalId: published.article.id,
    version: published.article.version,
    extension: published.article.extension,
    publicationAction: 'unpublish',
  });
  assert.equal(unpublishPlan.publicationAction, 'unpublish');
  assert.equal(unpublishPlan.article.metadata.status, 'draft');
  await publisher.confirm({ token: unpublishPlan.token, message: 'chore: gỡ bài kiểm tra khỏi website' });
  assert.match(await readFile(path.join(repositoryRoot, unpublishPlan.files[0]), 'utf8'), /draft: true/);
});

test('xóa bài và media qua thùng rác rồi commit và push', async (t) => {
  const { repositoryRoot, publisher } = await fixture(t);
  const slug = articleInput().metadata.slug;
  const articlePath = `src/content/articles/hoc-tap-thi-cu/${slug}.md`;
  const mediaPath = `public/media/articles/${slug}/thumbnail.webp`;
  await mkdir(path.dirname(path.join(repositoryRoot, mediaPath)), { recursive: true });
  await writeFile(path.join(repositoryRoot, mediaPath), 'fake-webp-for-publish-test');
  const input = articleInput();
  input.metadata.thumbnail = `/media/articles/${slug}/thumbnail.webp`;
  input.metadata.thumbnailAlt = 'Thumbnail kiểm tra';
  const publishPlan = await publisher.prepare(input);
  const published = await publisher.confirm({ token: publishPlan.token, message: 'feat: xuất bản bài để kiểm tra xóa' });

  await assert.rejects(
    () => publisher.prepareDelete({ id: published.article.id, version: published.article.version, confirmation: 'slug-sai', deleteMedia: true }),
    (error) => error.code === 'DELETE_CONFIRMATION_MISMATCH',
  );
  const deletePlan = await publisher.prepareDelete({
    id: published.article.id,
    version: published.article.version,
    confirmation: slug,
    deleteMedia: true,
  });
  assert.deepEqual(deletePlan.files.sort(), [articlePath, mediaPath].sort());
  const deleted = await publisher.confirmDelete({ token: deletePlan.token, message: 'chore: xóa bài kiểm tra an toàn' });
  await assert.rejects(() => access(path.join(repositoryRoot, articlePath)), { code: 'ENOENT' });
  await assert.rejects(() => access(path.join(repositoryRoot, mediaPath)), { code: 'ENOENT' });
  await access(path.join(repositoryRoot, deleted.trashDirectory, articlePath));
  await access(path.join(repositoryRoot, deleted.trashDirectory, mediaPath));
  assert.match((await git(repositoryRoot, 'log', '-1', '--pretty=%s')).stdout, /xóa bài kiểm tra an toàn/);
});

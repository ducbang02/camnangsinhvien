import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
  await git(repositoryRoot, 'add', 'README.md');
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

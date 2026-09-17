import { randomUUID } from 'node:crypto';
import { access, mkdir, readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ArticleStoreError } from './articles.mjs';

const PLAN_TTL_MS = 15 * 60 * 1000;
const COMMIT_MESSAGE_PATTERN = /^.{8,160}$/u;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function run(command, args, { cwd, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, windowsHide: true, shell: false });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({
      code,
      stdout: Buffer.concat(stdout).toString('utf8'),
      stderr: Buffer.concat(stderr).toString('utf8'),
    }));
  });
}

function parseStatus(output) {
  const fields = output.split('\0');
  const entries = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (!field) continue;
    const status = field.slice(0, 2);
    const file = field.slice(3);
    entries.push({ status, file: toPosix(file) });
    if (/[RC]/.test(status)) {
      const original = fields[index + 1];
      if (original) entries.push({ status: ' D', file: toPosix(original) });
      index += 1;
    }
  }
  return entries;
}

function mediaPaths(input) {
  const values = [];
  const thumbnail = String(input?.metadata?.thumbnail ?? '').trim();
  if (thumbnail.startsWith('/media/')) values.push(thumbnail);
  const html = String(input?.html ?? '');
  for (const match of html.matchAll(/\bsrc=["'](\/media\/[^"']+)["']/gi)) values.push(match[1]);
  return [...new Set(values)].map((value) => {
    let decoded;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      throw new ArticleStoreError('Đường dẫn media không hợp lệ.', 422, 'INVALID_MEDIA_PATH');
    }
    const repositoryPath = path.posix.normalize(`public${decoded}`);
    if (!repositoryPath.startsWith('public/media/') || repositoryPath.includes('..')) {
      throw new ArticleStoreError('Đường dẫn media nằm ngoài thư mục public/media.', 422, 'INVALID_MEDIA_PATH');
    }
    return repositoryPath;
  });
}

function candidateArticlePaths(input) {
  const extension = String(input?.extension ?? '.md').toLowerCase() === '.mdx' ? '.mdx' : '.md';
  const result = [`src/content/articles/${input.metadata.category}/${input.metadata.slug}${extension}`];
  if (input.originalId) result.push(`src/content/articles/${input.originalId}${extension}`);
  return [...new Set(result)];
}

async function listFiles(repositoryRoot, relativeDirectory) {
  const directory = path.resolve(repositoryRoot, relativeDirectory);
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) files.push(...await listFiles(repositoryRoot, relativePath));
      if (entry.isFile()) files.push(relativePath);
    }
    return files;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function assertGitState(repositoryRoot, allowedPaths) {
  const branchResult = await run('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], { cwd: repositoryRoot });
  if (branchResult.code !== 0 || !branchResult.stdout.trim()) {
    throw new ArticleStoreError('Git đang ở detached HEAD. Hãy chuyển về một branch trước khi xuất bản.', 409, 'GIT_DETACHED');
  }
  for (const ref of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD']) {
    const result = await run('git', ['rev-parse', '--quiet', '--verify', ref], { cwd: repositoryRoot });
    if (result.code === 0) throw new ArticleStoreError(`Git đang có thao tác ${ref.replace('_HEAD', '').toLowerCase()} chưa hoàn tất.`, 409, 'GIT_OPERATION');
  }
  for (const directory of ['rebase-merge', 'rebase-apply']) {
    const result = await run('git', ['rev-parse', '--git-path', directory], { cwd: repositoryRoot });
    if (result.code === 0 && result.stdout.trim()) {
      try {
        await access(path.resolve(repositoryRoot, result.stdout.trim()));
        throw new ArticleStoreError('Git đang rebase chưa hoàn tất.', 409, 'GIT_OPERATION');
      } catch (error) {
        if (error instanceof ArticleStoreError) throw error;
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }

  const remoteResult = await run('git', ['remote', 'get-url', 'origin'], { cwd: repositoryRoot });
  if (remoteResult.code !== 0) throw new ArticleStoreError('Repository chưa có remote origin.', 409, 'GIT_REMOTE_MISSING');
  const statusResult = await run('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], { cwd: repositoryRoot });
  if (statusResult.code !== 0) throw new ArticleStoreError('Không đọc được trạng thái Git.', 500, 'GIT_STATUS_FAILED');
  const entries = parseStatus(statusResult.stdout);
  const staged = entries.filter(({ status }) => status[0] !== ' ' && status[0] !== '?');
  if (staged.length) {
    throw new ArticleStoreError('Đang có file đã được stage. Hãy commit hoặc unstage chúng trước khi xuất bản từ CMS.', 409, 'GIT_STAGED_FILES', staged.map(({ file }) => ({ field: 'publish', message: file })));
  }
  const allowed = new Set(allowedPaths.map(toPosix));
  const unrelated = entries.filter(({ file }) => !allowed.has(file));
  if (unrelated.length) {
    throw new ArticleStoreError('Repository có thay đổi ngoài phạm vi đang xuất bản. CMS đã dừng để tránh commit nhầm.', 409, 'GIT_UNRELATED_CHANGES', unrelated.map(({ file }) => ({ field: 'publish', message: file })));
  }
  return {
    branch: branchResult.stdout.trim(),
    remote: remoteResult.stdout.trim(),
    entries,
    snapshot: statusResult.stdout,
  };
}

export function createPublisher({ repositoryRoot, store, validateCommand } = {}) {
  const root = path.resolve(repositoryRoot);
  const plans = new Map();
  const command = validateCommand ?? {
    executable: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'validate'],
  };

  async function commitAndPush(plan, message) {
    const commitMessage = String(message ?? '').trim();
    if (!COMMIT_MESSAGE_PATTERN.test(commitMessage)) throw new ArticleStoreError('Commit message cần từ 8 đến 160 ký tự.', 422, 'INVALID_COMMIT_MESSAGE');

    const git = await assertGitState(root, plan.files);
    if (git.branch !== plan.branch || git.snapshot !== plan.snapshot) {
      throw new ArticleStoreError('Repository đã thay đổi sau bước kiểm tra. Hãy tạo lại danh sách thao tác.', 409, 'PUBLISH_PLAN_CHANGED');
    }
    const add = await run('git', ['add', '--', ...plan.files], { cwd: root });
    if (add.code !== 0) throw new ArticleStoreError('Không thể stage các file đã chọn.', 500, 'GIT_ADD_FAILED', [{ field: 'publish', message: add.stderr.trim() }]);

    const stagedResult = await run('git', ['diff', '--cached', '--name-only', '-z'], { cwd: root });
    const stagedFiles = stagedResult.stdout.split('\0').filter(Boolean).map(toPosix);
    const allowed = new Set(plan.files);
    if (stagedResult.code !== 0 || !stagedFiles.length || stagedFiles.some((file) => !allowed.has(file))) {
      await run('git', ['restore', '--staged', '--', ...plan.files], { cwd: root });
      throw new ArticleStoreError('Danh sách staged không còn an toàn. CMS đã unstage file và dừng.', 409, 'GIT_STAGE_MISMATCH');
    }

    const commit = await run('git', ['commit', '-m', commitMessage], { cwd: root });
    if (commit.code !== 0) {
      await run('git', ['restore', '--staged', '--', ...plan.files], { cwd: root });
      throw new ArticleStoreError('Không thể tạo commit. File vẫn được giữ nguyên trên máy.', 500, 'GIT_COMMIT_FAILED', [{ field: 'publish', message: commit.stderr.trim() }]);
    }
    const push = await run('git', ['push', 'origin', plan.branch], { cwd: root });
    if (push.code !== 0) {
      throw new ArticleStoreError('Đã commit local nhưng push thất bại. Không có force push; hãy kiểm tra remote rồi push lại.', 502, 'GIT_PUSH_FAILED', [{ field: 'publish', message: push.stderr.trim() }]);
    }
    const hash = await run('git', ['rev-parse', '--short', 'HEAD'], { cwd: root });
    return { branch: plan.branch, files: stagedFiles, commit: hash.stdout.trim() };
  }

  async function prepare(input) {
    const publicationAction = input?.publicationAction === 'unpublish' ? 'unpublish' : 'publish';
    const publishInput = {
      ...input,
      metadata: { ...input.metadata, status: publicationAction === 'unpublish' ? 'draft' : 'published' },
    };
    delete publishInput.publicationAction;
    const errors = store.validate(publishInput);
    if (errors.length) throw new ArticleStoreError('Bài viết chưa đủ thông tin.', 422, 'VALIDATION_ERROR', errors);

    const referencedMedia = mediaPaths(publishInput);
    for (const mediaPath of referencedMedia) {
      try {
        await access(path.resolve(root, mediaPath));
      } catch (error) {
        if (error.code === 'ENOENT') throw new ArticleStoreError(`Không tìm thấy media: ${mediaPath}`, 422, 'MEDIA_NOT_FOUND');
        throw error;
      }
    }
    const candidates = [...candidateArticlePaths(publishInput), ...referencedMedia];
    await assertGitState(root, candidates);
    const article = await store.save(publishInput);
    const articlePath = `src/content/articles/${article.id}${article.extension}`;
    const managedFiles = [...new Set([
      articlePath,
      ...(input.originalId && input.originalId !== article.id ? [`src/content/articles/${input.originalId}${article.extension}`] : []),
      ...referencedMedia,
    ])];

    const validation = await run(command.executable, command.args, { cwd: root });
    if (validation.code !== 0) {
      throw new ArticleStoreError('Validation của project không đạt. Bài đã lưu local nhưng chưa được commit.', 422, 'PROJECT_VALIDATION_FAILED', [
        { field: 'publish', message: (validation.stderr || validation.stdout).trim().slice(-1800) },
      ]);
    }
    const git = await assertGitState(root, managedFiles);
    const changedFiles = git.entries.map(({ file }) => file).filter((file) => managedFiles.includes(file));
    if (!changedFiles.length) throw new ArticleStoreError('Bài viết không có thay đổi mới để xuất bản.', 409, 'NOTHING_TO_PUBLISH');

    const token = randomUUID();
    plans.set(token, {
      kind: 'publication',
      publicationAction,
      article,
      branch: git.branch,
      files: changedFiles,
      snapshot: git.snapshot,
      expiresAt: Date.now() + PLAN_TTL_MS,
    });
    return {
      token,
      article,
      branch: git.branch,
      remote: git.remote,
      files: changedFiles,
      publicationAction,
      suggestedMessage: `${publicationAction === 'unpublish' ? 'chore: gỡ bài' : 'feat: xuất bản bài'} ${article.metadata.title}`.slice(0, 160),
    };
  }

  async function confirm({ token, message }) {
    const plan = plans.get(token);
    plans.delete(token);
    if (!plan || plan.kind !== 'publication' || plan.expiresAt < Date.now()) throw new ArticleStoreError('Phiên xác nhận đã hết hạn. Hãy kiểm tra lại trước khi xuất bản.', 409, 'PUBLISH_PLAN_EXPIRED');
    const committed = await commitAndPush(plan, message);
    return {
      article: plan.article,
      ...committed,
      message: plan.publicationAction === 'unpublish'
        ? 'Đã chuyển bài thành Draft và push. Cloudflare sẽ gỡ route bài sau khi build xong.'
        : 'Đã commit và push. Cloudflare sẽ tự build từ GitHub.',
    };
  }

  async function prepareTaxonomy() {
    const managedFiles = ['src/data/categories.ts'];
    await assertGitState(root, managedFiles);
    const validation = await run(command.executable, command.args, { cwd: root });
    if (validation.code !== 0) {
      throw new ArticleStoreError('Validation của project không đạt. Cấu trúc vẫn được lưu local nhưng chưa commit.', 422, 'PROJECT_VALIDATION_FAILED', [
        { field: 'publish', message: (validation.stderr || validation.stdout).trim().slice(-1800) },
      ]);
    }
    const git = await assertGitState(root, managedFiles);
    const changedFiles = git.entries.map(({ file }) => file).filter((file) => managedFiles.includes(file));
    if (!changedFiles.length) throw new ArticleStoreError('Cấu trúc chủ đề không có thay đổi mới để xuất bản.', 409, 'NOTHING_TO_PUBLISH');
    const token = randomUUID();
    plans.set(token, {
      kind: 'taxonomy',
      branch: git.branch,
      files: changedFiles,
      snapshot: git.snapshot,
      expiresAt: Date.now() + PLAN_TTL_MS,
    });
    return {
      token,
      kind: 'taxonomy',
      branch: git.branch,
      remote: git.remote,
      files: changedFiles,
      suggestedMessage: 'feat: cập nhật cấu trúc chủ đề và nhóm',
    };
  }

  async function confirmTaxonomy({ token, message }) {
    const plan = plans.get(token);
    plans.delete(token);
    if (!plan || plan.kind !== 'taxonomy' || plan.expiresAt < Date.now()) {
      throw new ArticleStoreError('Phiên xác nhận cấu trúc đã hết hạn. Hãy kiểm tra lại.', 409, 'PUBLISH_PLAN_EXPIRED');
    }
    const committed = await commitAndPush(plan, message);
    return { ...committed, message: 'Đã commit và push cấu trúc chủ đề. Cloudflare sẽ tự build từ GitHub.' };
  }

  async function prepareDelete({ id, version, confirmation, deleteMedia = false } = {}) {
    const article = await store.get(id);
    if (version && version !== article.version) {
      throw new ArticleStoreError('File đã thay đổi sau khi bạn mở. Hãy tải lại trước khi xóa.', 409, 'STALE_FILE');
    }
    if (String(confirmation ?? '').trim() !== article.metadata.slug) {
      throw new ArticleStoreError('Slug xác nhận không khớp. CMS chưa xóa bài.', 422, 'DELETE_CONFIRMATION_MISMATCH');
    }

    const articlePath = `src/content/articles/${article.id}${article.extension}`;
    const mediaDirectory = `public/media/articles/${article.metadata.slug}`;
    const mediaFiles = deleteMedia ? await listFiles(root, mediaDirectory) : [];
    const files = [articlePath, ...mediaFiles];
    const git = await assertGitState(root, files);
    const token = randomUUID();
    plans.set(token, {
      kind: 'delete',
      article,
      branch: git.branch,
      files,
      snapshot: git.snapshot,
      mediaDirectory: deleteMedia && mediaFiles.length ? mediaDirectory : null,
      expiresAt: Date.now() + PLAN_TTL_MS,
    });
    return {
      token,
      kind: 'delete',
      article: { id: article.id, title: article.metadata.title, slug: article.metadata.slug },
      branch: git.branch,
      remote: git.remote,
      files,
      suggestedMessage: `chore: xóa bài ${article.metadata.title}`.slice(0, 160),
    };
  }

  async function confirmDelete({ token, message }) {
    const plan = plans.get(token);
    plans.delete(token);
    if (!plan || plan.kind !== 'delete' || plan.expiresAt < Date.now()) {
      throw new ArticleStoreError('Phiên xác nhận xóa đã hết hạn. Hãy kiểm tra lại.', 409, 'DELETE_PLAN_EXPIRED');
    }
    const commitMessage = String(message ?? '').trim();
    if (!COMMIT_MESSAGE_PATTERN.test(commitMessage)) throw new ArticleStoreError('Commit message cần từ 8 đến 160 ký tự.', 422, 'INVALID_COMMIT_MESSAGE');
    const beforeDelete = await assertGitState(root, plan.files);
    if (beforeDelete.branch !== plan.branch || beforeDelete.snapshot !== plan.snapshot) {
      throw new ArticleStoreError('Repository đã thay đổi sau bước kiểm tra. CMS chưa xóa bài.', 409, 'PUBLISH_PLAN_CHANGED');
    }

    const trashDirectory = `.cms-trash/${new Date().toISOString().replace(/[:.]/g, '-')}-${token.slice(0, 8)}`;
    const moveTargets = [
      `src/content/articles/${plan.article.id}${plan.article.extension}`,
      ...(plan.mediaDirectory ? [plan.mediaDirectory] : []),
    ];
    const moved = [];
    const restoreMoved = async () => {
      for (const item of [...moved].reverse()) {
        await mkdir(path.dirname(path.resolve(root, item.source)), { recursive: true });
        await rename(path.resolve(root, item.trash), path.resolve(root, item.source));
      }
    };

    try {
      for (const source of moveTargets) {
        const trash = path.posix.join(trashDirectory, source);
        await mkdir(path.dirname(path.resolve(root, trash)), { recursive: true });
        await rename(path.resolve(root, source), path.resolve(root, trash));
        moved.push({ source, trash });
      }

      const validation = await run(command.executable, command.args, { cwd: root });
      if (validation.code !== 0) {
        await restoreMoved();
        throw new ArticleStoreError('Validation không đạt nên CMS đã khôi phục bài, chưa commit.', 422, 'PROJECT_VALIDATION_FAILED', [
          { field: 'publish', message: (validation.stderr || validation.stdout).trim().slice(-1800) },
        ]);
      }

      const afterDelete = await assertGitState(root, plan.files);
      const changedFiles = afterDelete.entries.map(({ file }) => file).filter((file) => plan.files.includes(file));
      if (!changedFiles.length) {
        return {
          deletedId: plan.article.id,
          files: plan.files,
          localOnly: true,
          trashDirectory,
          message: 'Bài chưa từng được Git theo dõi nên chỉ được chuyển vào thùng rác local; không cần commit/push.',
        };
      }

      try {
        const committed = await commitAndPush({
          ...plan,
          files: changedFiles,
          snapshot: afterDelete.snapshot,
        }, commitMessage);
        return {
          deletedId: plan.article.id,
          ...committed,
          trashDirectory,
          message: 'Đã xóa bài, commit và push. Cloudflare sẽ cập nhật sau khi build xong.',
        };
      } catch (error) {
        if (error.code !== 'GIT_PUSH_FAILED') {
          await run('git', ['restore', '--staged', '--', ...changedFiles], { cwd: root });
          await restoreMoved();
        }
        throw error;
      }
    } catch (error) {
      if (moved.length && error.code !== 'GIT_PUSH_FAILED') {
        const firstTrashStillExists = await access(path.resolve(root, moved[0].trash)).then(() => true).catch(() => false);
        if (firstTrashStillExists) await restoreMoved();
      }
      throw error;
    }
  }

  return { prepare, confirm, prepareTaxonomy, confirmTaxonomy, prepareDelete, confirmDelete };
}

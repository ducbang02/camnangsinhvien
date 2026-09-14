import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createMediaStore } from '../lib/media.mjs';

test('lưu ảnh vào thư mục media theo slug và không ghi đè file trùng', async (t) => {
  const publicRoot = await mkdtemp(path.join(tmpdir(), 'cnsv-media-'));
  t.after(() => rm(publicRoot, { recursive: true, force: true }));
  const store = createMediaStore({ publicRoot });
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const first = await store.upload({ slug: 'bai-viet-moi', originalName: 'Ảnh minh họa.PNG', mimeType: 'image/png', buffer: png });
  const second = await store.upload({ slug: 'bai-viet-moi', originalName: 'Ảnh minh họa.PNG', mimeType: 'image/png', buffer: png });
  assert.equal(first.publicPath, '/media/articles/bai-viet-moi/anh-minh-hoa.png');
  assert.equal(second.publicPath, '/media/articles/bai-viet-moi/anh-minh-hoa-2.png');
  assert.deepEqual(await readFile(path.join(publicRoot, first.publicPath.slice(1))), png);
});

test('từ chối file giả ảnh và slug không hợp lệ', async (t) => {
  const publicRoot = await mkdtemp(path.join(tmpdir(), 'cnsv-media-'));
  t.after(() => rm(publicRoot, { recursive: true, force: true }));
  const store = createMediaStore({ publicRoot });
  await assert.rejects(() => store.upload({ slug: '../sai', originalName: 'x.png', mimeType: 'image/png', buffer: Buffer.from('not png') }));
  await assert.rejects(() => store.upload({ slug: 'bai-hop-le', originalName: 'x.png', mimeType: 'image/png', buffer: Buffer.from('not png') }));
});

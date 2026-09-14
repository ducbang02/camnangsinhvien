import { mkdir, open } from 'node:fs/promises';
import path from 'node:path';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

function normalizeFilename(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'anh-bai-viet';
}

function detectedType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return 'image/gif';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp' && ['avif', 'avis'].includes(buffer.subarray(8, 12).toString('ascii'))) return 'image/avif';
  return null;
}

function assertInside(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (!resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error('Đường dẫn media không hợp lệ.');
  return resolvedTarget;
}

export async function readImageBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_IMAGE_BYTES) {
      const error = new Error('Ảnh vượt quá giới hạn 10 MB.');
      error.status = 413;
      error.code = 'IMAGE_TOO_LARGE';
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function createMediaStore({ publicRoot }) {
  const resolvedPublicRoot = path.resolve(publicRoot);

  async function upload({ slug, originalName, mimeType, buffer }) {
    if (!SLUG_PATTERN.test(String(slug ?? ''))) {
      const error = new Error('Hãy nhập slug hợp lệ trước khi tải ảnh.');
      error.status = 422;
      error.code = 'INVALID_MEDIA_SLUG';
      throw error;
    }
    if (!buffer.length) {
      const error = new Error('File ảnh đang trống.');
      error.status = 422;
      error.code = 'EMPTY_IMAGE';
      throw error;
    }
    const actualType = detectedType(buffer);
    if (!actualType || !IMAGE_TYPES[mimeType] || actualType !== mimeType) {
      const error = new Error('Chỉ nhận JPEG, PNG, GIF, WebP hoặc AVIF hợp lệ.');
      error.status = 415;
      error.code = 'INVALID_IMAGE';
      throw error;
    }

    const directory = assertInside(resolvedPublicRoot, path.join(resolvedPublicRoot, 'media', 'articles', slug));
    await mkdir(directory, { recursive: true });
    const base = normalizeFilename(originalName);
    const extension = IMAGE_TYPES[actualType];
    for (let suffix = 1; suffix <= 999; suffix += 1) {
      const filename = `${base}${suffix === 1 ? '' : `-${suffix}`}${extension}`;
      const target = assertInside(resolvedPublicRoot, path.join(directory, filename));
      try {
        const handle = await open(target, 'wx');
        try {
          await handle.writeFile(buffer);
        } finally {
          await handle.close();
        }
        return {
          publicPath: `/media/articles/${slug}/${filename}`,
          size: buffer.length,
          mimeType: actualType,
        };
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    }
    throw new Error('Không thể tạo tên file ảnh duy nhất.');
  }

  return { upload };
}

export { MAX_IMAGE_BYTES };

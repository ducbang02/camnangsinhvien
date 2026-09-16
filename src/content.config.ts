import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { getCategory, getCategoryGroups, isCategoryId, type CategoryId } from './data/categories';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(8),
    description: z.string().min(40).max(180),
    category: z.string()
      .refine(isCategoryId, { message: 'Chủ đề không tồn tại trong src/data/categories.ts' })
      .transform((value) => value as CategoryId),
    topic: z.string(),
    group: z.string().trim().min(1).optional(),
    articleOrder: z.number().int().positive().optional(),
    tags: z.array(z.string()).min(1),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Cẩm nang sinh viên'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    readingMinutes: z.number().int().positive().optional(),
    thumbnail: z.string().min(1).optional(),
    thumbnailAlt: z.string().optional(),
    seoTitle: z.string().max(70).optional(),
    seoDescription: z.string().max(180).optional(),
    tool: z.string().optional(),
    video: z.url().optional(),
    sources: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  }).superRefine((data, context) => {
    const groups = getCategoryGroups(getCategory(data.category));

    if (groups.length > 0 && !data.group) {
      context.addIssue({ code: 'custom', path: ['group'], message: 'Bài viết cần chọn một group của chủ đề.' });
      return;
    }

    if (data.group && !groups.some((group) => group.id === data.group)) {
      context.addIssue({ code: 'custom', path: ['group'], message: 'Group không tồn tại trong cấu hình của chủ đề.' });
    }
  }),
});

export const collections = { articles };

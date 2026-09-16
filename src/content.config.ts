import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isCategoryId, type CategoryId } from './data/categories';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(8),
    description: z.string().min(40).max(180),
    category: z.string()
      .refine(isCategoryId, { message: 'Chủ đề không tồn tại trong src/data/categories.ts' })
      .transform((value) => value as CategoryId),
    topic: z.string(),
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
  }),
});

export const collections = { articles };

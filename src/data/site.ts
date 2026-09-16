import type { CategoryId } from './categories';
import { tools } from './tools';

export const site = {
  name: 'Cẩm nang sinh viên',
  shortName: 'CNSV',
  description:
    'Hướng dẫn, checklist và công cụ giúp sinh viên học tốt hơn, dùng công nghệ thông minh và sống chủ động.',
};

export { categories, getCategory } from './categories';
export { tools } from './tools';

export type Tool = (typeof tools)[number] & { category: CategoryId };

export const primaryNav = [
  { href: '/cong-cu/', label: 'Công cụ' },
  { href: '/gioi-thieu/', label: 'Về chúng tôi' },
  { href: '/lien-he/', label: 'Liên hệ' },
];

export function articleSlug(id: string) {
  return id.split('/').at(-1) ?? id;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

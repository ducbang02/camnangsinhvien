import type { CategoryId } from './categories';

export const site = {
  name: 'Cẩm nang sinh viên',
  shortName: 'CNSV',
  description:
    'Hướng dẫn, checklist và công cụ giúp sinh viên học tốt hơn, dùng công nghệ thông minh và sống chủ động.',
};

export { categories, getCategory } from './categories';

export const tools = [
  {
    slug: 'tinh-gpa',
    name: 'Tính GPA',
    description: 'Tính GPA hệ 4 theo tín chỉ và lưu các lần tính gần đây trên thiết bị.',
    icon: 'gpa',
    category: 'hoc-tap-thi-cu',
    status: 'ready',
  },
  {
    slug: 'diem-cuoi-ky',
    name: 'Điểm cuối kỳ cần bao nhiêu?',
    description: 'Biết điểm thi cần đạt theo trọng số và mục tiêu môn học.',
    icon: 'target',
    category: 'hoc-tap-thi-cu',
    status: 'ready',
  },
  {
    slug: 'pomodoro',
    name: 'Pomodoro học tập',
    description: 'Bộ đếm tập trung có tùy chỉnh phiên học và nghỉ.',
    icon: 'timer',
    category: 'quan-ly-ban-than',
    status: 'ready',
  },
  {
    slug: 'chia-nhom',
    name: 'Chia nhóm ngẫu nhiên',
    description: 'Dán danh sách thành viên và chia nhóm cân bằng trong vài giây.',
    icon: 'group',
    category: 'ky-nang-mem-giao-tiep',
    status: 'ready',
  },
  {
    slug: 'ngan-sach-sinh-vien',
    name: 'Ngân sách sinh viên',
    description: 'Phân bổ thu nhập, chi phí cố định và ngân sách linh hoạt mỗi tháng.',
    icon: 'wallet',
    category: 'cuoc-song-sinh-vien',
    status: 'ready',
  },
] as const;

export type Tool = (typeof tools)[number] & { category: CategoryId };

export const primaryNav = [
  { href: '/cong-cu/', label: 'Công cụ' },
  { href: '/sinh-vien-it/', label: 'Sinh viên IT' },
  { href: '/lo-trinh/', label: 'Lộ trình' },
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

export const site = {
  name: 'Cẩm nang sinh viên',
  shortName: 'CNSV',
  description:
    'Hướng dẫn, checklist và công cụ giúp sinh viên học tốt hơn, dùng công nghệ thông minh và sống chủ động.',
};

export const pillars = [
  {
    id: 'hoc-tap',
    name: 'Học tập & phát triển bản thân',
    shortName: 'Học tập',
    number: '01',
    description: 'Từ GPA và ôn thi đến tập trung, research và giao tiếp trong trường đại học.',
    promise: 'Học có phương pháp, quản lý được học kỳ.',
    accent: 'mint',
  },
  {
    id: 'ky-nang-so',
    name: 'Kỹ năng số & công cụ',
    shortName: 'Kỹ năng số',
    number: '02',
    description: 'Máy tính, phần mềm, AI và những workflow số sinh viên thực sự cần.',
    promise: 'Làm việc số nhanh hơn, an toàn hơn.',
    accent: 'blue',
  },
  {
    id: 'cuoc-song',
    name: 'Cuộc sống sinh viên',
    shortName: 'Cuộc sống',
    number: '03',
    description: 'Năm nhất, ở trọ, chi tiêu, làm việc nhóm và chuẩn bị đi thực tập.',
    promise: 'Bớt bối rối trước những quyết định đời thường.',
    accent: 'yellow',
  },
] as const;

export type PillarId = (typeof pillars)[number]['id'];

export const tools = [
  {
    slug: 'tinh-gpa',
    name: 'Tính GPA',
    description: 'Tính GPA hệ 4 theo tín chỉ và lưu các lần tính gần đây trên thiết bị.',
    icon: 'gpa',
    pillar: 'hoc-tap',
    status: 'ready',
  },
  {
    slug: 'diem-cuoi-ky',
    name: 'Điểm cuối kỳ cần bao nhiêu?',
    description: 'Biết điểm thi cần đạt theo trọng số và mục tiêu môn học.',
    icon: 'target',
    pillar: 'hoc-tap',
    status: 'ready',
  },
  {
    slug: 'pomodoro',
    name: 'Pomodoro học tập',
    description: 'Bộ đếm tập trung có tùy chỉnh phiên học và nghỉ.',
    icon: 'timer',
    pillar: 'hoc-tap',
    status: 'ready',
  },
  {
    slug: 'chia-nhom',
    name: 'Chia nhóm ngẫu nhiên',
    description: 'Dán danh sách thành viên và chia nhóm cân bằng trong vài giây.',
    icon: 'group',
    pillar: 'cuoc-song',
    status: 'ready',
  },
  {
    slug: 'ngan-sach-sinh-vien',
    name: 'Ngân sách sinh viên',
    description: 'Phân bổ thu nhập, chi phí cố định và ngân sách linh hoạt mỗi tháng.',
    icon: 'wallet',
    pillar: 'cuoc-song',
    status: 'ready',
  },
] as const;

export const primaryNav = [
  { href: '/cam-nang/', label: 'Cẩm nang' },
  { href: '/cong-cu/', label: 'Công cụ' },
  { href: '/sinh-vien-it/', label: 'Sinh viên IT' },
  { href: '/lo-trinh/', label: 'Lộ trình' },
];

export function getPillar(id: string) {
  return pillars.find((pillar) => pillar.id === id);
}

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

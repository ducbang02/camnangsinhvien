export type CategoryGroup = {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  navigationDescription?: string;
  order: number;
};

type CategoryDefinition = {
  id: string;
  name: string;
  shortName: string;
  number: string;
  heroImage: string;
  description: string;
  menuDescription: string;
  promise: string;
  accent: 'mint' | 'blue' | 'yellow' | 'coral';
  seoTitle: string;
  metaDescription: string;
  steps?: readonly { label: string; text: string }[];
  groups?: readonly CategoryGroup[];
};

function defineCategories<const T extends readonly CategoryDefinition[]>(items: T) {
  return items;
}

// CMS_CATEGORIES_START
export const categories = defineCategories([
  {
    id: 'hoc-tap-thi-cu',
    name: 'Học tập & thi cử',
    shortName: 'Học tập',
    number: '01',
    heroImage: '/media/category-heroes/hoc-tap-thi-cu.webp',
    description: 'Phương pháp học, GPA, ôn thi và cách xử lý những môn đang khiến bạn mất phương hướng.',
    menuDescription: 'GPA, phương pháp học, ôn thi',
    promise: 'Học có chiến lược, thi có kế hoạch.',
    accent: 'mint',
    seoTitle: 'Học tập & thi cử dành cho sinh viên',
    metaDescription: 'Cẩm nang phương pháp học, tính GPA, ôn thi và quản lý môn học dành cho sinh viên đại học.',
    groups: [
      {
        id: 'hoc-dung-cach',
        title: 'Học đúng cách',
        shortTitle: 'Học đúng cách',
        description: 'Nắm nền tảng và tìm ra phương pháp học phù hợp.',
        navigationDescription: 'Tìm ra cách học phù hợp trước khi cố học nhiều.',
        order: 1,
      },
      {
        id: 'hoc-deu',
        title: 'Học đều & không trì hoãn',
        shortTitle: 'Học đều',
        description: 'Biến việc học thành một phần ổn định của tuần thay vì đợi sát deadline.',
        navigationDescription: 'Quản lý thời gian, deadline và duy trì việc học trong cả học kỳ.',
        order: 2,
      },
      {
        id: 'vao-ky-thi',
        title: 'Vào kỳ thi',
        shortTitle: 'Vào kỳ thi',
        description: 'Chuyển từ học kiến thức sang tối ưu điểm số và chuẩn bị cho kỳ thi.',
        navigationDescription: 'Ưu tiên đúng kiến thức, luyện đề và ôn tập có chiến lược.',
        order: 3,
      },
    ],
  },
  {
    id: 'ky-nang-may-tinh',
    name: 'Kỹ năng máy tính',
    shortName: 'Máy tính',
    number: '02',
    heroImage: '/media/category-heroes/ky-nang-may-tinh.webp',
    description: 'Những kỹ năng nền tảng để dùng máy tính nhanh, gọn, an toàn và tự xử lý lỗi thường gặp.',
    menuDescription: 'File, bảo mật, thao tác nền tảng',
    promise: 'Làm chủ thiết bị thay vì chỉ dùng theo thói quen.',
    accent: 'blue',
    seoTitle: 'Kỹ năng máy tính thiết yếu cho sinh viên',
    metaDescription: 'Hướng dẫn kỹ năng máy tính, quản lý file, bảo mật tài khoản và sử dụng thiết bị hiệu quả cho sinh viên.',
    steps: [
      { label: 'Sắp xếp', text: 'Tổ chức file, thư mục và phiên bản để luôn tìm được tài liệu.' },
      { label: 'Thao tác', text: 'Luyện phím tắt, gõ bàn phím và các workflow tiết kiệm thời gian.' },
      { label: 'Tự bảo vệ', text: 'Thiết lập tài khoản an toàn và biết cách xử lý sự cố cơ bản.' },
    ],
  },
  {
    id: 'ky-nang-mem-giao-tiep',
    name: 'Kỹ năng mềm & giao tiếp',
    shortName: 'Giao tiếp',
    number: '03',
    heroImage: '/media/category-heroes/ky-nang-mem-giao-tiep.webp',
    description: 'Giao tiếp rõ ràng với giảng viên, bạn học và đội nhóm trong những tình huống thật ở đại học.',
    menuDescription: 'Email, thuyết trình, làm việc nhóm',
    promise: 'Nói đúng việc, phối hợp đúng cách.',
    accent: 'yellow',
    seoTitle: 'Kỹ năng mềm & giao tiếp cho sinh viên',
    metaDescription: 'Mẫu và hướng dẫn giao tiếp, viết email, thuyết trình và làm việc nhóm dành cho sinh viên.',
    steps: [
      { label: 'Nói rõ', text: 'Trình bày đủ bối cảnh, yêu cầu và thời hạn.' },
      { label: 'Phối hợp', text: 'Chia việc, xác nhận trách nhiệm và lưu lại tiến độ.' },
      { label: 'Xử lý khó', text: 'Phản hồi mâu thuẫn bằng dữ kiện thay vì công kích cá nhân.' },
    ],
  },
  {
    id: 'tieng-anh',
    name: 'Tiếng Anh',
    shortName: 'Tiếng Anh',
    number: '04',
    heroImage: '/media/category-heroes/tieng-anh.webp',
    description: 'Tiếng Anh thực dụng cho việc học, đọc tài liệu, thuyết trình và chuẩn bị môi trường làm việc.',
    menuDescription: 'Đọc tài liệu, viết, giao tiếp',
    promise: 'Học đúng ngữ cảnh bạn thực sự cần dùng.',
    accent: 'coral',
    seoTitle: 'Tiếng Anh thực dụng cho sinh viên',
    metaDescription: 'Cẩm nang học tiếng Anh để đọc tài liệu, viết học thuật, thuyết trình và chuẩn bị đi làm cho sinh viên.',
    steps: [
      { label: 'Xác định đích', text: 'Chọn kỹ năng theo môn học hoặc tình huống thực tế.' },
      { label: 'Luyện đầu vào', text: 'Đọc và nghe nội dung vừa sức nhưng có tính lặp lại.' },
      { label: 'Tạo đầu ra', text: 'Viết, nói và sửa lỗi qua từng sản phẩm nhỏ.' },
    ],
  },
  {
    id: 'quan-ly-ban-than',
    name: 'Quản lý bản thân',
    shortName: 'Bản thân',
    number: '05',
    heroImage: '/media/category-heroes/quan-ly-ban-than.webp',
    description: 'Quản lý thời gian, năng lượng, thói quen và áp lực để học kỳ không chỉ chạy theo deadline.',
    menuDescription: 'Thời gian, tập trung, thói quen',
    promise: 'Giữ nhịp ổn định trong một lịch học không ổn định.',
    accent: 'mint',
    seoTitle: 'Quản lý bản thân và thời gian cho sinh viên',
    metaDescription: 'Cách quản lý thời gian, tập trung, thói quen và kế hoạch cá nhân phù hợp với đời sống sinh viên.',
    steps: [
      { label: 'Nhìn toàn cảnh', text: 'Gom lịch học, deadline và việc cá nhân về một nơi.' },
      { label: 'Chọn ưu tiên', text: 'Phân biệt việc quan trọng với việc chỉ đang gây ồn.' },
      { label: 'Giữ nhịp', text: 'Thiết kế phiên tập trung và khoảng nghỉ có thể lặp lại.' },
    ],
  },
  {
    id: 'cuoc-song-sinh-vien',
    name: 'Cuộc sống sinh viên',
    shortName: 'Cuộc sống',
    number: '06',
    heroImage: '/media/category-heroes/cuoc-song-sinh-vien.webp',
    description: 'Năm nhất, ở trọ, chi tiêu và những quyết định đời thường cần chuẩn bị trước khi trả giá bằng tiền.',
    menuDescription: 'Năm nhất, ở trọ, chi tiêu',
    promise: 'Bớt bối rối trước những việc chưa từng trải qua.',
    accent: 'yellow',
    seoTitle: 'Cẩm nang cuộc sống sinh viên',
    metaDescription: 'Hướng dẫn thực tế về năm nhất, ở trọ, chi tiêu và chuẩn bị đời sống đại học cho sinh viên Việt Nam.',
    steps: [
      { label: 'Ổn định', text: 'Hoàn tất giấy tờ, tài khoản, chỗ ở và lịch học.' },
      { label: 'Kiểm soát tiền', text: 'Biết chi phí bắt buộc và số tiền thực sự có thể tiêu.' },
      { label: 'Sống chủ động', text: 'Chuẩn bị trước các quyết định mua sắm và sinh hoạt lớn.' },
    ],
  },
  {
    id: 'nghien-cuu-thong-tin',
    name: 'Nghiên cứu & xử lý thông tin',
    shortName: 'Nghiên cứu',
    number: '07',
    heroImage: '/media/category-heroes/nghien-cuu-thong-tin.webp',
    description: 'Tìm, đánh giá, ghi chú và tổng hợp thông tin để làm bài có căn cứ thay vì chỉ gom đường link.',
    menuDescription: 'Tìm nguồn, kiểm chứng, ghi chú',
    promise: 'Đi từ câu hỏi tốt đến kết luận có căn cứ.',
    accent: 'blue',
    seoTitle: 'Nghiên cứu & xử lý thông tin cho sinh viên',
    metaDescription: 'Hướng dẫn tìm nguồn, kiểm chứng, ghi chú và tổng hợp thông tin phục vụ học tập và nghiên cứu sinh viên.',
    steps: [
      { label: 'Đặt câu hỏi', text: 'Thu hẹp vấn đề thành các câu hỏi có thể tìm bằng chứng.' },
      { label: 'Kiểm nguồn', text: 'Xác định tác giả, ngữ cảnh, phương pháp và ngày cập nhật.' },
      { label: 'Tổng hợp', text: 'Ghi lại luận điểm, bằng chứng và giới hạn của kết luận.' },
    ],
  },
  {
    id: 'nghe-nghiep',
    name: 'Nghề nghiệp & chuẩn bị đi làm',
    shortName: 'Nghề nghiệp',
    number: '08',
    heroImage: '/media/category-heroes/nghe-nghiep.webp',
    description: 'Khám phá hướng nghề, xây project, CV và bằng chứng năng lực trước khi bước vào kỳ thực tập.',
    menuDescription: 'CV, project, thực tập, định hướng',
    promise: 'Chuẩn bị năng lực trước khi cần nộp hồ sơ.',
    accent: 'coral',
    seoTitle: 'Nghề nghiệp & chuẩn bị đi làm cho sinh viên',
    metaDescription: 'Cẩm nang định hướng nghề nghiệp, làm project, viết CV và chuẩn bị thực tập dành cho sinh viên.',
    steps: [
      { label: 'Khám phá', text: 'Hiểu công việc qua đầu ra và kỹ năng, không chỉ qua tên chức danh.' },
      { label: 'Làm bằng chứng', text: 'Tạo project nhỏ, hoàn chỉnh và giải thích được quyết định.' },
      { label: 'Ứng tuyển', text: 'Chuyển trải nghiệm thành CV, portfolio và câu chuyện phỏng vấn.' },
    ],
  },
  {
    id: 'ai-cho-sinh-vien',
    name: 'AI cho sinh viên',
    shortName: 'AI',
    number: '09',
    heroImage: '/media/category-heroes/ai-cho-sinh-vien.webp',
    description: 'Dùng AI để hiểu sâu, phản biện và làm việc nhanh hơn mà không giao luôn phần tư duy cho máy.',
    menuDescription: 'Prompt, kiểm chứng, học có trách nhiệm',
    promise: 'Dùng AI như trợ lý, không dùng như người làm hộ.',
    accent: 'mint',
    seoTitle: 'AI cho sinh viên: dùng hiệu quả và có trách nhiệm',
    metaDescription: 'Hướng dẫn sinh viên dùng AI để học, nghiên cứu và làm việc hiệu quả, an toàn và có trách nhiệm.',
    steps: [
      { label: 'Giao việc rõ', text: 'Cung cấp bối cảnh, mục tiêu và tiêu chí cho câu trả lời.' },
      { label: 'Giữ tư duy', text: 'Tự làm bản nháp hoặc dự đoán trước khi hỏi AI.' },
      { label: 'Kiểm chứng', text: 'Tách claim, kiểm nguồn và thử lại các ví dụ quan trọng.' },
    ],
  },
  {
    id: 'cong-cu-phan-mem',
    name: 'Công cụ & phần mềm hữu ích',
    shortName: 'Công cụ',
    number: '10',
    heroImage: '/media/category-heroes/cong-cu-phan-mem.webp',
    description: 'Chọn và thiết lập phần mềm theo đúng nhu cầu học tập, cộng tác và quản lý công việc.',
    menuDescription: 'Ứng dụng, workflow, thiết lập',
    promise: 'Ít công cụ hơn, workflow rõ ràng hơn.',
    accent: 'blue',
    seoTitle: 'Công cụ & phần mềm hữu ích cho sinh viên',
    metaDescription: 'Đánh giá và hướng dẫn sử dụng công cụ, ứng dụng và phần mềm hữu ích cho học tập và đời sống sinh viên.',
    steps: [
      { label: 'Chọn nhu cầu', text: 'Bắt đầu từ việc cần làm, không bắt đầu từ danh sách ứng dụng.' },
      { label: 'Thiết lập gọn', text: 'Chỉ giữ những tính năng phục vụ workflow chính.' },
      { label: 'Đánh giá lại', text: 'Kiểm tra chi phí, quyền riêng tư và khả năng xuất dữ liệu.' },
    ],
  },
]);
// CMS_CATEGORIES_END

export type CategoryId = (typeof categories)[number]['id'];

export const categoryIds = categories.map((category) => category.id);

export function isCategoryId(value: string): value is CategoryId {
  return categoryIds.some((id) => id === value);
}

export function getCategory(id: string) {
  return categories.find((category) => category.id === id);
}

export function getCategoryGroups(category: CategoryDefinition | undefined): readonly CategoryGroup[] {
  return category?.groups ?? [];
}

export function getCategorySteps(category: CategoryDefinition | undefined) {
  return category?.steps ?? [];
}

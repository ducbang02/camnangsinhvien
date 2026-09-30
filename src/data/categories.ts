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
    "id": "hoc-tap-thi-cu",
    "name": "Học tập & thi cử",
    "shortName": "Học tập",
    "number": "01",
    "heroImage": "/media/category-heroes/hoc-tap-thi-cu.webp",
    "description": "Phương pháp học, GPA, ôn thi và cách xử lý những môn đang khiến bạn mất phương hướng.",
    "menuDescription": "GPA, phương pháp học, ôn thi",
    "promise": "Học có chiến lược, thi có kế hoạch.",
    "accent": "mint",
    "seoTitle": "Học tập & thi cử dành cho sinh viên",
    "metaDescription": "Cẩm nang phương pháp học, tính GPA, ôn thi và quản lý môn học dành cho sinh viên đại học.",
    "groups": [
      {
        "id": "hoc-dung-cach",
        "title": "Học đúng cách",
        "shortTitle": "Học đúng cách",
        "description": "Nắm nền tảng và tìm ra phương pháp học phù hợp.",
        "navigationDescription": "Tìm ra cách học phù hợp trước khi cố học nhiều.",
        "order": 1
      },
      {
        "id": "hoc-deu",
        "title": "Học đều & không trì hoãn",
        "shortTitle": "Học đều",
        "description": "Biến việc học thành một phần ổn định của tuần thay vì đợi sát deadline.",
        "navigationDescription": "Quản lý thời gian, deadline và duy trì việc học trong cả học kỳ.",
        "order": 2
      },
      {
        "id": "vao-ky-thi",
        "title": "Vào kỳ thi",
        "shortTitle": "Vào kỳ thi",
        "description": "Chuyển từ học kiến thức sang tối ưu điểm số và chuẩn bị cho kỳ thi.",
        "navigationDescription": "Ưu tiên đúng kiến thức, luyện đề và ôn tập có chiến lược.",
        "order": 3
      }
    ]
  },
  {
    "id": "ky-nang",
    "name": "Kỹ năng",
    "shortName": "Kỹ năng",
    "number": "02",
    "heroImage": "/media/category-heroes/ky-nang-may-tinh.webp",
    "description": "Những năng lực thực tế giúp bạn dùng công nghệ hiệu quả, giao tiếp rõ ràng và phối hợp tốt hơn ở đại học.",
    "menuDescription": "Máy tính, giao tiếp, làm việc nhóm",
    "promise": "Làm chủ công cụ và phối hợp đúng cách.",
    "accent": "blue",
    "seoTitle": "Kỹ năng thiết yếu cho sinh viên",
    "metaDescription": "Cẩm nang kỹ năng máy tính, giao tiếp và làm việc nhóm giúp sinh viên học tập, cộng tác và chuẩn bị đi làm tốt hơn.",
    "groups": [
      {
        "id": "ky-nang-may-tinh",
        "title": "Kỹ năng máy tính",
        "shortTitle": "Máy tính",
        "description": "Dùng máy tính nhanh, gọn, an toàn và tự xử lý những lỗi thường gặp.",
        "navigationDescription": "File, bảo mật, thao tác nền tảng và công cụ số.",
        "order": 1
      },
      {
        "id": "ky-nang-mem",
        "title": "Kỹ năng mềm",
        "shortTitle": "Kỹ năng mềm",
        "description": "Giao tiếp rõ ràng, thuyết trình và phối hợp với bạn học, giảng viên, đội nhóm.",
        "navigationDescription": "Email, thuyết trình, làm việc nhóm và xử lý tình huống.",
        "order": 2
      }
    ]
  },
  {
    "id": "ngoai-ngu",
    "name": "Ngoại ngữ",
    "shortName": "Ngoại ngữ",
    "number": "03",
    "heroImage": "/media/category-heroes/ngoai-ngu.webp",
    "description": "Ngoại ngữ thực dụng cho việc học, đọc tài liệu, thuyết trình và chuẩn bị môi trường làm việc.",
    "menuDescription": "Đọc tài liệu, viết, giao tiếp",
    "promise": "Học đúng ngữ cảnh bạn thực sự cần dùng.",
    "accent": "coral",
    "seoTitle": "Ngoại ngữ thực dụng cho sinh viên",
    "metaDescription": "Cẩm nang học ngoại ngữ để đọc tài liệu, viết học thuật, thuyết trình và chuẩn bị đi làm cho sinh viên."
  },
  {
    "id": "quan-ly-ban-than",
    "name": "Quản lý bản thân",
    "shortName": "Bản thân",
    "number": "04",
    "heroImage": "/media/category-heroes/quan-ly-ban-than.webp",
    "description": "Quản lý thời gian, năng lượng, thói quen và áp lực để học kỳ không chỉ chạy theo deadline.",
    "menuDescription": "Thời gian, tập trung, thói quen",
    "promise": "Giữ nhịp ổn định trong một lịch học không ổn định.",
    "accent": "mint",
    "seoTitle": "Quản lý bản thân và thời gian cho sinh viên",
    "metaDescription": "Cách quản lý thời gian, tập trung, thói quen và kế hoạch cá nhân phù hợp với đời sống sinh viên."
  },
  {
    "id": "cuoc-song-sinh-vien",
    "name": "Cuộc sống sinh viên",
    "shortName": "Cuộc sống",
    "number": "05",
    "heroImage": "/media/category-heroes/cuoc-song-sinh-vien.webp",
    "description": "Năm nhất, ở trọ, chi tiêu và những quyết định đời thường cần chuẩn bị trước khi trả giá bằng tiền.",
    "menuDescription": "Năm nhất, ở trọ, chi tiêu",
    "promise": "Bớt bối rối trước những việc chưa từng trải qua.",
    "accent": "yellow",
    "seoTitle": "Cẩm nang cuộc sống sinh viên",
    "metaDescription": "Hướng dẫn thực tế về năm nhất, ở trọ, chi tiêu và chuẩn bị đời sống đại học cho sinh viên Việt Nam."
  },
  {
    "id": "nghien-cuu-thong-tin",
    "name": "Nghiên cứu & xử lý thông tin",
    "shortName": "Nghiên cứu",
    "number": "06",
    "heroImage": "/media/category-heroes/nghien-cuu-thong-tin.webp",
    "description": "Tìm, đánh giá, ghi chú và tổng hợp thông tin để làm bài có căn cứ thay vì chỉ gom đường link.",
    "menuDescription": "Tìm nguồn, kiểm chứng, ghi chú",
    "promise": "Đi từ câu hỏi tốt đến kết luận có căn cứ.",
    "accent": "blue",
    "seoTitle": "Nghiên cứu & xử lý thông tin cho sinh viên",
    "metaDescription": "Hướng dẫn tìm nguồn, kiểm chứng, ghi chú và tổng hợp thông tin phục vụ học tập và nghiên cứu sinh viên."
  },
  {
    "id": "nghe-nghiep",
    "name": "Nghề nghiệp & chuẩn bị đi làm",
    "shortName": "Nghề nghiệp",
    "number": "07",
    "heroImage": "/media/category-heroes/nghe-nghiep.webp",
    "description": "Khám phá hướng nghề, xây project, CV và bằng chứng năng lực trước khi bước vào kỳ thực tập.",
    "menuDescription": "CV, project, thực tập, định hướng",
    "promise": "Chuẩn bị năng lực trước khi cần nộp hồ sơ.",
    "accent": "coral",
    "seoTitle": "Nghề nghiệp & chuẩn bị đi làm cho sinh viên",
    "metaDescription": "Cẩm nang định hướng nghề nghiệp, làm project, viết CV và chuẩn bị thực tập dành cho sinh viên."
  },
  {
    "id": "ai-cho-sinh-vien",
    "name": "AI cho sinh viên",
    "shortName": "AI",
    "number": "08",
    "heroImage": "/media/category-heroes/ai-cho-sinh-vien.webp",
    "description": "Dùng AI để hiểu sâu, phản biện và làm việc nhanh hơn mà không giao luôn phần tư duy cho máy.",
    "menuDescription": "Prompt, kiểm chứng, học có trách nhiệm",
    "promise": "Dùng AI như trợ lý, không dùng như người làm hộ.",
    "accent": "mint",
    "seoTitle": "AI cho sinh viên: dùng hiệu quả và có trách nhiệm",
    "metaDescription": "Hướng dẫn sinh viên dùng AI để học, nghiên cứu và làm việc hiệu quả, an toàn và có trách nhiệm."
  },
  {
    "id": "cong-cu-phan-mem",
    "name": "Công cụ & phần mềm hữu ích",
    "shortName": "Công cụ",
    "number": "09",
    "heroImage": "/media/category-heroes/cong-cu-phan-mem.webp",
    "description": "Chọn và thiết lập phần mềm theo đúng nhu cầu học tập, cộng tác và quản lý công việc.",
    "menuDescription": "Ứng dụng, workflow, thiết lập",
    "promise": "Ít công cụ hơn, workflow rõ ràng hơn.",
    "accent": "blue",
    "seoTitle": "Công cụ & phần mềm hữu ích cho sinh viên",
    "metaDescription": "Đánh giá và hướng dẫn sử dụng công cụ, ứng dụng và phần mềm hữu ích cho học tập và đời sống sinh viên."
  }
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

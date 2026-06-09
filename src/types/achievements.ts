export interface Achievement {
  id: string;
  name: string;
  description: string;
  rewardText: string;
  chocoReward: number;
  goldenReward: number;
  progressTarget: number;
  category: string;
}

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', name: 'Tất Cả' },
  { id: 'reading', name: 'Đọc Truyện' },
  { id: 'community', name: 'Cộng Đồng' },
  { id: 'collection', name: 'Cửa Hàng & Sưu Tầm' },
  { id: 'challenge', name: 'Điểm Danh & Nhiệm Vụ' },
  { id: 'legend', name: 'Huyền Thoại & Tài Sản' }
];

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_chapter',
    name: 'Mới Thử Choco',
    description: 'Đọc xong chương đầu tiên của một bộ truyện bất kỳ.',
    rewardText: '+1 Choco',
    chocoReward: 1,
    goldenReward: 0,
    progressTarget: 1,
    category: 'reading'
  },
  {
    id: 'midnight_read',
    name: 'Lén Ăn Choco Nửa Đêm',
    description: 'Đọc truyện vào khung giờ từ 24:00h - 03:00h sáng.',
    rewardText: '+3 Choco',
    chocoReward: 3,
    goldenReward: 0,
    progressTarget: 1,
    category: 'reading'
  },
  {
    id: 'early_morning_read',
    name: 'Ăn Choco Sáng Sớm',
    description: 'Đọc truyện vào khung giờ sáng sớm giúp kích thích não bộ (từ 05:00h - 08:00h sáng).',
    rewardText: '+3 Choco',
    chocoReward: 3,
    goldenReward: 0,
    progressTarget: 1,
    category: 'reading'
  },
  {
    id: 'read_100_chapters',
    name: 'Vừa Ăn Choco Vừa Đọc',
    description: 'Tích lũy đọc tổng cộng 100 chương truyện.',
    rewardText: '+10 Choco & +1 GChoco',
    chocoReward: 10,
    goldenReward: 1,
    progressTarget: 100,
    category: 'reading'
  },
  {
    id: 'multi_genre',
    name: 'Ăn Nhiều Loại Choco',
    description: 'Đọc đủ 5 bộ truyện thể loại khác nhau.',
    rewardText: '+5 Choco',
    chocoReward: 5,
    goldenReward: 0,
    progressTarget: 5,
    category: 'reading'
  },
  {
    id: 'collector',
    name: 'Nhà Sưu Tầm Choco',
    description: 'Lưu trữ 10 bộ truyện vào thư viện.',
    rewardText: '+10 Choco',
    chocoReward: 10,
    goldenReward: 0,
    progressTarget: 10,
    category: 'collection'
  },
  {
    id: 'sticker_collector',
    name: 'Choco Thích Thú',
    description: 'Mua và sở hữu thành công 30 Sticker trang trí hồ sơ trong Cửa Hàng.',
    rewardText: '+30 Choco',
    chocoReward: 30,
    goldenReward: 0,
    progressTarget: 30,
    category: 'collection'
  },
  {
    id: 'big_spender',
    name: 'Tiêu Nhiều Choco',
    description: 'Sử dụng tổng cộng 10,000 Choco trong Cửa Hàng.',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 10000,
    category: 'collection'
  },
  {
    id: 'blogger_choco_new',
    name: 'Blogger Choco Mới',
    description: 'Đăng tải bài viết đầu tiên lên Bản tin Choco trên Hồ sơ cá nhân.',
    rewardText: '+5 Choco',
    chocoReward: 5,
    goldenReward: 0,
    progressTarget: 1,
    category: 'community'
  },
  {
    id: 'commenter_choco',
    name: 'Bình Luận Viên Choco',
    description: 'Viết tổng cộng 100 bình luận hoặc phản hồi các chương truyện bất kỳ.',
    rewardText: '+10 Choco & +1 GChoco',
    chocoReward: 10,
    goldenReward: 1,
    progressTarget: 100,
    category: 'community'
  },
  {
    id: 'chatty_lounge',
    name: 'Khách Quen Lounge',
    description: 'Hoàn thành gửi 100 tin nhắn trò chuyện tại góc Choco Lounge.',
    rewardText: '+5 Choco',
    chocoReward: 5,
    goldenReward: 0,
    progressTarget: 100,
    category: 'community'
  },
  {
    id: 'chatty',
    name: 'Vừa Ăn Choco Vừa Nói',
    description: 'Gửi thành công 5000 tin nhắn tại góc trò chuyện chung Choco Lounge.',
    rewardText: '+50 Choco',
    chocoReward: 50,
    goldenReward: 0,
    progressTarget: 5000,
    category: 'community'
  },
  {
    id: 'streak_7',
    name: 'Ăn Choco Xuyên Tuần',
    description: 'Hoàn thành điểm danh liên tiếp 7 ngày.',
    rewardText: '+7 Choco',
    chocoReward: 7,
    goldenReward: 0,
    progressTarget: 7,
    category: 'challenge'
  },
  {
    id: 'monthly_checkin',
    name: 'Ăn Choco Cả Tháng',
    description: 'Hoàn thành điểm danh mốc 30 ngày (không cần liên tiếp).',
    rewardText: '+30 Choco',
    chocoReward: 30,
    goldenReward: 0,
    progressTarget: 30,
    category: 'challenge'
  },
  {
    id: 'weekly_missions_perfect',
    name: 'Chăm Ăn Choco Cả Tuần',
    description: 'Hoàn thành đầy đủ tất cả nhiệm vụ ngày trong suốt 1 tuần (gồm 7 ngày hoàn thành trọn vẹn).',
    rewardText: '+10 Choco',
    chocoReward: 10,
    goldenReward: 0,
    progressTarget: 7,
    category: 'challenge'
  },
  {
    id: 'generous_donor',
    name: 'Choco Hào Phóng',
    description: 'Tặng Choco cho truyện bạn yêu thích lần đầu tiên.',
    rewardText: '+5 Choco',
    chocoReward: 5,
    goldenReward: 0,
    progressTarget: 1,
    category: 'legend'
  },
  {
    id: 'choco_king',
    name: 'Vua Choco',
    description: 'Tích lũy đạt mốc 10,000 Choco đầu tiên.',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 10000,
    category: 'legend'
  },
  {
    id: 'gchoco_king',
    name: 'Bố Choco',
    description: 'Tích lũy đạt mốc 10,000 Gchoco đầu tiên.',
    rewardText: '+100 Gchoco',
    chocoReward: 0,
    goldenReward: 100,
    progressTarget: 10000,
    category: 'legend'
  },
  {
    id: 'choco_cute',
    name: 'Choco Đáng Yêu',
    description: 'Trở thành một trong những thành viên tích cực nhất được xuất hiện trong bảng xếp hạng (Nằm trong Top 3 BXH Tích Cực).',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 1,
    category: 'legend'
  },
  {
    id: 'choco_high_level',
    name: 'Choco Cấp Cao',
    description: 'Đạt Level 100.',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 100,
    category: 'legend'
  }
];

export const getGMT7Date = (): Date => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 7));
};

export const getWeeklyId = (): string => {
  const d = getGMT7Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
};

export const getPreviousWeeklyId = (): string => {
  const d = getGMT7Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
};

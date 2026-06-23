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
  },
  {
    id: 'choco_mot_sach',
    name: 'Choco Mọt Sách',
    description: 'Tích lũy đọc tổng cộng 500 chương truyện.',
    rewardText: '+50 Choco',
    chocoReward: 50,
    goldenReward: 0,
    progressTarget: 500,
    category: 'reading'
  },
  {
    id: 'choco_tuong_tac',
    name: 'Choco Tương Tác',
    description: 'Viết tổng cộng 500 bình luận hoặc phản hồi các chương truyện bất kỳ.',
    rewardText: '+50 Choco',
    chocoReward: 50,
    goldenReward: 0,
    progressTarget: 500,
    category: 'community'
  },
  {
    id: 'chucu_friend_500',
    name: 'Bạn Thân Của Chucu',
    description: 'Thực hiện tương tác vui chơi hoặc cho ăn thành công 500 lần với bé Chucu.',
    rewardText: '+50 Choco',
    chocoReward: 50,
    goldenReward: 0,
    progressTarget: 500,
    category: 'challenge'
  },
  {
    id: 'chucu_an_sang',
    name: 'Chucu Ăn Sang',
    description: 'Cho Chucu mlem mlem hảo hạng 100 lần.',
    rewardText: '+10 GChoco',
    chocoReward: 0,
    goldenReward: 10,
    progressTarget: 100,
    category: 'challenge'
  },
  {
    id: 'chucu_master_100',
    name: 'Huấn Luyện Viên Chucu',
    description: 'Yêu thương và nuôi nấng bé Chucu đạt đến Cấp độ (Level) 100.',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 100,
    category: 'challenge'
  },
  {
    id: 'chucu_fashion_5',
    name: 'Fashionista Chucu',
    description: 'Sắm sửa và sở hữu từ 5 phụ kiện đáng yêu trở lên cho Chucu.',
    rewardText: '+50 Choco',
    chocoReward: 50,
    goldenReward: 0,
    progressTarget: 5,
    category: 'collection'
  },
  {
    id: 'choco_catch_no_miss',
    name: 'Hứng Choco Không Trượt Phát Nào',
    description: 'Hứng liên tiếp 20 viên Choco mà không làm rơi bất kỳ viên nào trong một màn chơi.',
    rewardText: '+20 Choco',
    chocoReward: 20,
    goldenReward: 0,
    progressTarget: 20,
    category: 'challenge'
  },
  {
    id: 'choco_rain_1000',
    name: 'Mưa Choco Ngọt Ngào (Đồng)',
    description: 'Hứng được tổng cộng 1,000 viên Choco (tích lũy qua các màn chơi).',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 1000,
    category: 'challenge'
  },
  {
    id: 'choco_rain_5000',
    name: 'Mưa Choco Ngọt Ngào (Bạc)',
    description: 'Hứng được tổng cộng 5,000 viên Choco (tích lũy qua các màn chơi).',
    rewardText: '+500 Choco',
    chocoReward: 500,
    goldenReward: 0,
    progressTarget: 5000,
    category: 'challenge'
  },
  {
    id: 'choco_rain_10000',
    name: 'Mưa Choco Ngọt Ngào (Vàng)',
    description: 'Hứng được tổng cộng 10,000 viên Choco (tích lũy qua các màn chơi).',
    rewardText: '+1,000 Choco',
    chocoReward: 1000,
    goldenReward: 0,
    progressTarget: 10000,
    category: 'challenge'
  },
  {
    id: 'gold_choco_perfect',
    name: 'Săn Choco Hoàng Kim',
    description: 'Thu thập trọn vẹn toàn bộ số Choco Vàng xuất hiện trong 5 lượt chơi liên tiếp.',
    rewardText: '+5 Gchoco',
    chocoReward: 0,
    goldenReward: 5,
    progressTarget: 5,
    category: 'challenge'
  },
  {
    id: 'dodge_negative_perfect',
    name: 'Choco Né Số Một',
    description: 'Né được hết những vật phẩm tiêu cực trong 5 lượt chơi liên tiếp.',
    rewardText: '+5 Gchoco',
    chocoReward: 0,
    goldenReward: 5,
    progressTarget: 5,
    category: 'challenge'
  },
  {
    id: 'radio_night_chill',
    name: 'Choco Chill Đêm',
    description: 'Nghe Radio trong 30 phút liên tục trong khung giờ từ 11:00 tối đến 5:00 sáng hôm sau.',
    rewardText: '+10 Choco',
    chocoReward: 10,
    goldenReward: 0,
    progressTarget: 30,
    category: 'challenge'
  },
  {
    id: 'radio_one_track_love',
    name: 'Giai Điệu Choco Yêu',
    description: 'Nghe 1 giai điệu liên tục trong 1 tiếng đồng hồ.',
    rewardText: '+10 Choco',
    chocoReward: 10,
    goldenReward: 0,
    progressTarget: 60,
    category: 'challenge'
  },
  {
    id: 'radio_universe_explorer',
    name: 'Vũ Trụ Âm Thanh Của Choco',
    description: 'Khám phá và nghe qua tất cả các bài hát / bản nhạc có sẵn trong danh sách phát của Radio ít nhất một lần.',
    rewardText: '+1 Gchoco',
    chocoReward: 0,
    goldenReward: 1,
    progressTarget: 10,
    category: 'challenge'
  },
  {
    id: 'radio_track_switches',
    name: 'Choco Tìm Kiếm',
    description: 'Đổi danh giai điệu qua lại 15 lần (Tìm kiếm giai điệu phù hợp nhất cho tâm trạng).',
    rewardText: '+15 Choco',
    chocoReward: 15,
    goldenReward: 0,
    progressTarget: 15,
    category: 'challenge'
  },
  {
    id: 'gacha_first_pull_5star',
    name: 'Choco Siêu May Mắn',
    description: 'Trúng Sticker 5 Sao ngay trong lượt Gacha Đơn (Gacha 1 Lần) đầu tiên.',
    rewardText: '+5 Gchoco',
    chocoReward: 0,
    goldenReward: 5,
    progressTarget: 1,
    category: 'challenge'
  },
  {
    id: 'choco_kientri',
    name: 'Choco Kiên Trì',
    description: 'Chạm mốc bảo hiểm 90 lượt (Pity) để nhận Sticker 5 Sao đầu tiên.',
    rewardText: '+10 Vé Gacha',
    chocoReward: 0,
    goldenReward: 0,
    progressTarget: 90,
    category: 'challenge'
  },
  {
    id: 'choco_suutam',
    name: 'Choco Sưu Tầm',
    description: 'Sở hữu toàn bộ sticker có trong 1 banner.',
    rewardText: '+10 Vé Gacha',
    chocoReward: 0,
    goldenReward: 0,
    progressTarget: 100,
    category: 'challenge'
  },
  {
    id: 'gacha_double_4star',
    name: 'Choco Nhân Phẩm',
    description: 'Thực hiện cú quay x10 (Gacha 10 Lần) và nhận được đồng thời từ 2 Sticker 4 Sao trở lên trong một lượt.',
    rewardText: '+20 Choco',
    chocoReward: 20,
    goldenReward: 0,
    progressTarget: 1,
    category: 'challenge'
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

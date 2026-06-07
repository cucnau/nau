export interface Achievement {
  id: string;
  name: string;
  description: string;
  rewardText: string;
  chocoReward: number;
  goldenReward: number;
  progressTarget: number;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_chapter',
    name: 'Mới Thử Choco',
    description: 'Đọc xong chương đầu tiên của một bộ truyện bất kỳ.',
    rewardText: '+1 Choco',
    chocoReward: 1,
    goldenReward: 0,
    progressTarget: 1
  },
  {
    id: 'midnight_read',
    name: 'Lén Ăn Choco Nửa Đêm',
    description: 'Đọc truyện vào khung giờ từ 24:00h - 03:00h sáng.',
    rewardText: '+3 Choco',
    chocoReward: 3,
    goldenReward: 0,
    progressTarget: 1
  },
  {
    id: 'multi_genre',
    name: 'Ăn Nhiều Loại Choco',
    description: 'Đọc đủ 5 bộ truyện thể loại khác nhau.',
    rewardText: '+5 Choco',
    chocoReward: 5,
    goldenReward: 0,
    progressTarget: 5
  },
  {
    id: 'collector',
    name: 'Nhà Sưu Tầm Choco',
    description: 'Lưu trữ 10 bộ truyện vào thư viện.',
    rewardText: '+10 Choco',
    chocoReward: 10,
    goldenReward: 0,
    progressTarget: 10
  },
  {
    id: 'choco_king',
    name: 'Vua Choco',
    description: 'Tích lũy đạt mốc 10,000 Choco đầu tiên.',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 10000
  },
  {
    id: 'gchoco_king',
    name: 'Bố Choco',
    description: 'Tích lũy đạt mốc 10,000 Gchoco đầu tiên.',
    rewardText: '+100 Gchoco',
    chocoReward: 0,
    goldenReward: 100,
    progressTarget: 10000
  },
  {
    id: 'big_spender',
    name: 'Tiêu Nhiều Choco',
    description: 'Sử dụng tổng cộng 10,000 Choco trong Cửa Hàng.',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 10000
  },
  {
    id: 'streak_7',
    name: 'Ăn Choco Xuyên Tuần',
    description: 'Hoàn thành điểm danh liên tiếp 7 ngày.',
    rewardText: '+7 Choco',
    chocoReward: 7,
    goldenReward: 0,
    progressTarget: 7
  },
  {
    id: 'monthly_checkin',
    name: 'Ăn Choco Cả Tháng',
    description: 'Hoàn thành điểm danh mốc 30 ngày (không cần liên tiếp).',
    rewardText: '+30 Choco',
    chocoReward: 30,
    goldenReward: 0,
    progressTarget: 30
  },
  {
    id: 'weekly_missions_perfect',
    name: 'Chăm Ăn Choco Cả Tuần',
    description: 'Hoàn thành đầy đủ tất cả nhiệm vụ ngày trong suốt 1 tuần (gồm 7 ngày hoàn thành trọn vẹn).',
    rewardText: '+10 Choco',
    chocoReward: 10,
    goldenReward: 0,
    progressTarget: 7
  },
  {
    id: 'chatty',
    name: 'Vừa Ăn Choco Vừa Nói',
    description: 'Gửi thành công 5000 tin nhắn tại góc trò chuyện chung Choco Lounge.',
    rewardText: '+50 Choco',
    chocoReward: 50,
    goldenReward: 0,
    progressTarget: 5000
  },
  {
    id: 'choco_cute',
    name: 'Choco Đáng Yêu',
    description: 'Trở thành một trong những thành viên tích cực nhất được xuất hiện trong bảng xếp hạng (Nằm trong Top 3 BXH Tích Cực).',
    rewardText: '+100 Choco',
    chocoReward: 100,
    goldenReward: 0,
    progressTarget: 1
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

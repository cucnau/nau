import { useStore } from '../store';

export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  defaultLevel: number;
}

export const FEATURES_LIST: FeatureConfig[] = [
  { id: 'reading', name: 'Đọc truyện & Chương', description: 'Xem chi tiết danh sách truyện và đọc nội dung các chương sách.', defaultLevel: 1 },
  { id: 'library', name: 'Thư viện cá nhân', description: 'Lưu trữ truyện yêu thích vào thư viện riêng.', defaultLevel: 1 },
  { id: 'shop', name: 'Cửa hàng vật phẩm', description: 'Mua sticker và phụ kiện bằng Choco/Golden Choco.', defaultLevel: 1 },
  { id: 'missions', name: 'Nhiệm vụ & Điểm danh', description: 'Hệ thống điểm danh hằng ngày và nhận thưởng nhiệm vụ.', defaultLevel: 1 },
  { id: 'achievements', name: 'Thành tựu', description: 'Xem và nhận quà từ danh sách thành tựu đã đạt được.', defaultLevel: 1 },
  { id: 'chucu_catch', name: 'Hứng Choco', description: 'Mini-game hứng Choco rơi giúp chú cú nhận mảnh và nguyên liệu.', defaultLevel: 1 },
  { id: 'choco_radio', name: 'Choco Radio', description: 'Trình nghe nhạc thư giãn tích hợp trên web.', defaultLevel: 1 },
  { id: 'choco_match', name: 'Ghép Choco', description: 'Trò chơi giải đố xếp kẹo Match-3 cực kỳ lôi cuốn.', defaultLevel: 1 },
  { id: 'gacha', name: 'Vòng quay Gacha', description: 'Tính năng quay gacha nhận sticker và các vật phẩm giới hạn.', defaultLevel: 1 },
  { id: 'forum', name: 'Bảng tin & Đăng bài', description: 'Đăng trạng thái, chia sẻ bài viết và bình luận trên diễn đàn chung.', defaultLevel: 1 },
  { id: 'chat', name: 'Chat toàn cầu', description: 'Phòng trò chuyện trực tuyến thời gian thực giữa các thành viên.', defaultLevel: 1 },
  { id: 'fortune', name: 'Xin quẻ đầu ngày', description: 'Rút quẻ bói nhận may mắn và phần quà ngẫu nhiên mỗi tuần.', defaultLevel: 1 },
  { id: 'chucu_interact', name: 'Chăm sóc Chucu', description: 'Cho chú cú ăn sáng, chơi cùng cú và thay đổi trang phục phụ kiện.', defaultLevel: 1 },
];

export function useFeatureRestriction() {
  const level = useStore((state) => state.level || 1);
  const featureLevels = useStore((state) => state.featureLevels || {});

  const getRequiredLevel = (featureId: string): number => {
    return featureLevels[featureId] !== undefined ? Number(featureLevels[featureId]) : 1;
  };

  const isFeatureLocked = (featureId: string): boolean => {
    const requiredLevel = getRequiredLevel(featureId);
    return level < requiredLevel;
  };

  return {
    level,
    getRequiredLevel,
    isFeatureLocked,
    FEATURES_LIST,
  };
}

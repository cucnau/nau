import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, differenceInDays } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';
import { db, checkIfQuotaError } from './lib/firebase';
import { doc, updateDoc, getDocs, collection, query, where, orderBy, limit, writeBatch, addDoc, deleteField } from 'firebase/firestore';
import { getWeeklyId, getPreviousWeeklyId, ACHIEVEMENTS_LIST, Achievement, getGMT7Date } from './types/achievements';
import { logTransaction } from './lib/transactions';
import { addStoryFire } from './lib/storyFire';

export function compressBase64Image(dataUrl: string, maxWidth = 600, maxHeight = 600, quality = 0.9): Promise<string> {
   return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
         resolve(dataUrl);
         return;
      }
      // If already small (<300KB), no need to compress
      if (dataUrl.length < 300000) {
         resolve(dataUrl);
         return;
      }
      const img = new Image();
      img.onload = () => {
         try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > height) {
               if (width > maxWidth) {
                  height *= maxWidth / width;
                  width = maxWidth;
               }
            } else {
               if (height > maxHeight) {
                  width *= maxHeight / height;
                  height = maxHeight;
               }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
         } catch (e) {
            console.error("Lỗi nén ảnh:", e);
            resolve("");
         }
      };
      img.onerror = () => {
         resolve("");
      };
      img.src = dataUrl;
   });
}

interface Mission {
  id: string;
  type: 'daily' | 'weekly' | 'permanent';
  description: string;
  chocoReward: number;
  goldenReward: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

interface UserState {
  isLoggedIn: boolean;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  equippedStickerComment: string | null;
  stickerPositionComment: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  equippedStickerChat: string | null;
  equippedStickerPost: string | null;
  stickerPositionPost: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  ownedStickers: string[];
  equippedAccessory: string | null;
  accessoryPosition: { x: number; y: number; scale: number; rotate: number };
  ownedAccessories: string[];
  ownedPassTickets: number;
  ownedPriorityTickets: number;
  ownedMysteryBoxes: number;
  ownedStreakTickets?: number;
  ownedGachaTickets?: number;
  gachaPity5Star?: number;
  gachaPity4Star?: number;
  activeStreakProtection?: boolean;
  lastFreeStreakRecoveryMonth?: string | null;
  lastClaimedRewardLevel: number;
  choco: number;
  goldenChoco: number;
  level: number;
  exp: number;
  checkInStreak: number;
  lastCheckInDate: string | null;
  lastDailyResetDate: string | null;
  lastWeeklyResetId: string | null;
  missions: Mission[];
  storyProgress: Record<string, number | number[]>; // storyId -> maxChapterRead or read chapters array
  readHistoryList: string[]; // storyIds
  savedStories: string[]; // saved storyIds
  unlockedPassChapters: string[]; // chapterIds
  unlockedEarlyAccessChapters: string[]; // chapterIds
  firebaseUser: FirebaseUser | null;
  
  isQuotaExceeded: boolean;
  setQuotaExceeded: (exceeded: boolean) => void;
  
  // Chucu State
  chucuLevel: number;
  chucuExp: number;
  chucuSatiety: number;
  chucuHappiness: number;
  chucuInteractions: number;
  chucuPremiumFeeds: number;
  chucuLastTime: number | null;
  updateChucuStats: (stats: Partial<{chucuLevel: number, chucuExp: number, chucuSatiety: number, chucuHappiness: number, chucuInteractions: number, chucuPremiumFeeds: number, chucuLastTime: number | null}>) => void;
  ownedChucuAccessories: string[];
  equippedChucuAccessory: string | null;
  showChucu: boolean;
  setShowChucu: (show: boolean) => void;

  // Chucu Game & Radio Popups States
  isChucuGameOpen: boolean;
  setChucuGameOpen: (open: boolean) => void;
  isChocoMatchOpen: boolean;
  setChocoMatchOpen: (open: boolean) => void;
  isChocoRadioOpen: boolean;
  setChocoRadioOpen: (open: boolean) => void;

  // Choco Match States
  chocoMatchLevel: number;
  chocoMatchWinStreak: number;
  chocoMatchHearts: number;
  chocoMatchLastHeartTick: number | null;
  chocoMatchTilesDestroyed: number;
  chocoMatchColorBombsCreated: number;
  chocoMatchSpecialCombos: number;
  updateChocoMatchState: (updates: Partial<{ chocoMatchLevel: number; chocoMatchWinStreak: number; chocoMatchHearts: number; chocoMatchLastHeartTick: number | null; chocoMatchTilesDestroyed: number; chocoMatchColorBombsCreated: number; chocoMatchSpecialCombos: number }>) => void;

  isGachaOpen: boolean;
  setGachaOpen: (open: boolean) => void;
  isGachaAdminOpen: boolean;
  setGachaAdminOpen: (open: boolean) => void;

  chucuGameFragments: number;
  chucuGameGFragments: number;
  chucuGameBonusPoints: number;
  chucuGameMaxScore: number;
  chucuGamePlaysToday: number;
  chucuGameLastPlayDate: string | null;
  gachaFragments: number;

  addChucuGameFragments: (amt: number) => void;
  addChucuGameGFragments: (amt: number) => void;
  addChucuGameBonusPoints: (amt: number) => void;
  addGachaFragments: (amt: number) => void;
  incrementChucuGamePlayCount: () => void;
  finishChucuGame: (
     fragments: number,
     gFragments: number,
     bonusPoints: number,
     isNoRewardPlay: boolean,
     satietyDeduct: number,
     stats?: {
        maxConsecutiveCatches: number;
        totalCaught: number;
        goldMissed: boolean;
        hitBombOrApple: boolean;
        chocoMissed?: boolean;
        goldGenerated?: number;
     }
  ) => void;

  // Per-uid historical record dictionaries
  allUsersMissions: Record<string, Mission[]>;
  allUsersStoryProgress: Record<string, Record<string, number | number[]>>;
  allUsersReadHistoryList: Record<string, string[]>;
  allUsersSavedStories: Record<string, string[]>;
  allUsersUnlockedAchievements: Record<string, string[]>;
  allUsersClaimedAchievements: Record<string, string[]>;
  allUsersOwnedStickers: Record<string, string[]>;
  allUsersOwnedAccessories: Record<string, string[]>;

  // Achievements properties
  unlockedAchievements: string[];
  claimedAchievements: string[];
  totalEarnedChoco: number;
  totalEarnedGChoco: number;
  totalSpentChoco: number;
  totalGiftedChoco: number;
  totalCheckIns: number;
  perfectDailyDates: string[];
  sentMessagesCount: number;
  totalChaptersRead: number;
  totalCommentsCount: number;
  totalGachaPulls?: number;
  totalRadioSeconds?: number;
  genresRead: string[];
  activePoints: number;
  lastActiveWeek: string;
  prevActivePoints: number;
  prevActiveWeek: string;
  activeTitle: string | null;
  maxConsecutiveChocoCount?: number;
  totalChocoCaught?: number;
  consecutiveGoldClears?: number;
  consecutiveDodgeClears?: number;
  radioNightChillSeconds?: number;
  radioTrackSeconds?: number;
  maxRadioTrackSeconds?: number;
  heardRadioTracks?: string[];
  radioTrackSwitches?: number;
  gachaSinglePullCount?: number;
  maxBannerCompletionPct?: number;
  setActiveTitle: (title: string | null) => void;
  isMaintenance: boolean;
  setMaintenance: (val: boolean) => void;
  customTitles: any[];
  customTitleColors: Record<string, string>;
  achTitleColors: Record<string, string>;
  setCustomTitleColors: (colors: Record<string, string>) => void;
  setAchievementColors: (colors: Record<string, string>) => void;
  getTitleColor: (title: string | null) => string | undefined;
  featureLevels: Record<string, number>;
  setFeatureLevels: (levels: Record<string, number>) => void;
  lockedFeatureId: string | null;
  setLockedFeatureId: (id: string | null) => void;
  
  isStoreOpen: boolean;
  isMissionsOpen: boolean;
  isAchievementsOpen: boolean;
  isInventoryOpen: boolean;
  setStoreOpen: (open: boolean) => void;
  setMissionsOpen: (open: boolean) => void;
  setAchievementsOpen: (open: boolean) => void;
  setInventoryOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  login: (name: string) => void;
  logout: () => void;
  isFirebaseSynced: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  syncFromFirebase: (data: any) => void;
  
  checkIn: () => void;
  gainExp: (amount: number) => void;
  addChoco: (amount: number, reason?: string) => void;
  addGoldenChoco: (amount: number, reason?: string) => void;
  buyTicket: (type: 'pass' | 'priority' | 'streak', amount?: number) => void;
  consumePassTicket: (chapterId: string) => boolean;
  consumePriorityTicket: (chapterId: string) => boolean;
  useStreakTicket: () => boolean;
  spendChoco: (amount: number, reason?: string) => boolean;
  spendGoldenChoco: (amount: number, reason?: string) => boolean;
  
  markStoryRead: (storyId: string, chapterOrder: number, genres?: string[]) => void;
  addCommentProgress: () => void;
  syncCommentsCountFromDB: () => Promise<void>;
  syncUserDataStatsFromDB: () => Promise<void>;
  toggleSaveStory: (storyId: string) => void;
  giftChoco: (storyId: string, amount: number) => boolean;
  addOwnedSticker: (stickerUrl: string) => void;
  equipSticker: (type: 'comment' | 'chat' | 'post', stickerUrl: string | null) => void;
  setStickerPosition: (type: 'comment' | 'post', pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void;
  addOwnedAccessory: (accessoryUrl: string) => void;
  addOwnedChucuAccessory: (url: string) => void;
  equipAccessory: (accessoryUrl: string | null) => void;
  equipChucuAccessory: (url: string | null) => void;
  setAccessoryPosition: (pos: { x: number; y: number; scale: number; rotate: number }) => void;
  
  claimMission: (id: string) => void;
  updateUserDoc: (updates: any, transactionReason?: string) => Promise<void>;
  useMysteryBox: () => Promise<any | null>;

  // Achievements Actions
  unlockAchievement: (id: string) => void;
  claimAchievement: (id: string) => void;
  incrementSentMessages: () => void;
  propagateEquipmentChanges: () => Promise<void>;
  checkChocoCuteAchievement: () => Promise<void>;
  _ensureActiveWeekCalculations: () => Promise<void>;
  _triggerCountAchievementsCheck: () => void;
  _checkPerfectDailyDay: () => void;
  _checkResetMissions: () => void;
}

export const getDailyMissions = (): Mission[] => [
  { id: 'd1', type: 'daily', description: 'Điểm danh ngày', chocoReward: 1, goldenReward: 0, progress: 0, target: 1,  completed: false, claimed: false },
  { id: 'd2', type: 'daily', description: 'Đọc 1 chương truyện', chocoReward: 1, goldenReward: 0, progress: 0, target: 1, completed: false, claimed: false },
  { id: 'd3', type: 'daily', description: 'Bình luận truyện 1 lần', chocoReward: 2, goldenReward: 0, progress: 0, target: 1, completed: false, claimed: false },
];

export const getWeeklyMissions = (): Mission[] => [
  { id: 'w1', type: 'weekly', description: 'Điểm danh 5 ngày trong tuần', chocoReward: 5, goldenReward: 1, progress: 0, target: 5, completed: false, claimed: false },
  { id: 'w2', type: 'weekly', description: 'Đọc 10 chương truyện', chocoReward: 10, goldenReward: 1, progress: 0, target: 10, completed: false, claimed: false },
  { id: 'w3', type: 'weekly', description: 'Bình luận 10 lần', chocoReward: 20, goldenReward: 1, progress: 0, target: 10, completed: false, claimed: false },
];

export const getPermanentMissions = (state: Partial<UserState> = {}): Mission[] => {
   const res: Mission[] = [];
   const highestTiers: Record<string, number> = {
       checkin: 20, read: 20, level: 10, chocomatchlvl: 100, comm: 20, gacha: 20, catch: 20, radio: 20, spend: 20
   };

   if (state.missions && Array.isArray(state.missions)) {
       state.missions.forEach(m => {
           if (m.type === 'permanent') {
               const parts = m.id.split('_');
               if (parts.length === 3 && parts[0] === 'p') {
                   const cat = parts[1];
                   const tier = parseInt(parts[2], 10);
                   if (!isNaN(tier) && highestTiers[cat] !== undefined) {
                       highestTiers[cat] = Math.max(highestTiers[cat], m.completed ? tier + 2 : tier);
                   }
               }
           }
       });
   }

   highestTiers.checkin = Math.min(200, Math.max(highestTiers.checkin, Math.ceil(Math.max(state.totalCheckIns || 0, state.checkInStreak || 0) / 30) + 2));
   highestTiers.read = Math.min(200, Math.max(highestTiers.read, Math.ceil((state.totalChaptersRead || 0) / 50) + 2));
   highestTiers.level = Math.min(200, Math.max(highestTiers.level, Math.ceil((state.level || 1) / 10) + 2));
   highestTiers.chocomatchlvl = Math.min(200, Math.max(highestTiers.chocomatchlvl, Math.ceil(Math.max(0, (state.chocoMatchLevel || 1) - 1) / 100) + 2));
   highestTiers.comm = Math.min(200, Math.max(highestTiers.comm, Math.ceil((state.totalCommentsCount || 0) / 50) + 2));
   highestTiers.gacha = Math.min(200, Math.max(highestTiers.gacha, Math.ceil((state.totalGachaPulls || 0) / 50) + 2));
   highestTiers.catch = Math.min(200, Math.max(highestTiers.catch, Math.ceil((state.totalChocoCaught || 0) / 1000) + 2));
   highestTiers.radio = Math.min(200, Math.max(highestTiers.radio, Math.ceil(Math.floor((state.totalRadioSeconds || 0) / 60) / 60) + 2));
   highestTiers.spend = Math.min(200, Math.max(highestTiers.spend, Math.ceil((state.totalSpentChoco || 0) / 100) + 2));

   for (let i = 1; i <= highestTiers.checkin; i++) {
       res.push({ id: `p_checkin_${i}`, type: 'permanent', description: `Điểm danh ${i * 30} ngày`, chocoReward: i * 30, goldenReward: i * 3, progress: 0, target: i * 30, completed: false, claimed: false });
   }
   for (let i = 1; i <= highestTiers.read; i++) {
       res.push({ id: `p_read_${i}`, type: 'permanent', description: `Đọc ${i * 50} chương truyện`, chocoReward: i * 50, goldenReward: i * 5, progress: 0, target: i * 50, completed: false, claimed: false });
   }
   for (let i = 1; i <= highestTiers.level; i++) {
       res.push({ id: `p_level_${i}`, type: 'permanent', description: `Đạt level ${i * 10}`, chocoReward: i * 10, goldenReward: i * 1, progress: 0, target: i * 10, completed: false, claimed: false });
   }
   for (let i = 1; i <= highestTiers.chocomatchlvl; i++) {
       res.push({ id: `p_chocomatchlvl_${i}`, type: 'permanent', description: `Vượt qua level ${i * 100} trên Sông Choco`, chocoReward: i * 100, goldenReward: i * 10, progress: 0, target: i * 100, completed: false, claimed: false });
   }
   for (let i = 1; i <= highestTiers.comm; i++) {
       res.push({ id: `p_comm_${i}`, type: 'permanent', description: `Bình luận truyện ${i * 50} lần`, chocoReward: i * 50, goldenReward: i * 5, progress: 0, target: i * 50, completed: false, claimed: false });
   }
   for (let i = 1; i <= highestTiers.gacha; i++) {
       res.push({ id: `p_gacha_${i}`, type: 'permanent', description: `Gacha tổng cộng ${i * 50} lần`, chocoReward: i * 50, goldenReward: i * 5, progress: 0, target: i * 50, completed: false, claimed: false });
   }
   for (let i = 1; i <= highestTiers.catch; i++) {
       res.push({ id: `p_catch_${i}`, type: 'permanent', description: `Hứng chính xác ${i * 1000} viên Choco trong game Hứng Choco`, chocoReward: i * 10, goldenReward: i * 1, progress: 0, target: i * 1000, completed: false, claimed: false });
   }
   for (let i = 1; i <= highestTiers.radio; i++) {
       res.push({ id: `p_radio_${i}`, type: 'permanent', description: `Nghe choco radio tổng cộng ${i * 60} phút`, chocoReward: i * 10, goldenReward: i * 1, progress: 0, target: i * 60, completed: false, claimed: false });
   }
   for (let i = 1; i <= highestTiers.spend; i++) {
       res.push({ id: `p_spend_${i}`, type: 'permanent', description: `Tiêu tổng cộng ${i * 100} Choco`, chocoReward: i * 10, goldenReward: i * 1, progress: 0, target: i * 100, completed: false, claimed: false });
   }
   return res;
};

export const reconcileMissions = (loadedMissions: Mission[], state: Partial<UserState> = {}): Mission[] => {
  const mergedState = { ...state, missions: loadedMissions };
  const defaults = [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions(mergedState)];
  if (!Array.isArray(loadedMissions) || loadedMissions.length === 0) {
    return defaults;
  }
  const loadedMap = new Map(loadedMissions.map(m => [m.id, m]));
  return defaults.map(def => {
    if (loadedMap.has(def.id)) {
      const loaded = loadedMap.get(def.id)!;
      return {
        ...def,
        progress: loaded.progress !== undefined ? loaded.progress : def.progress,
        completed: loaded.completed !== undefined ? loaded.completed : def.completed,
        claimed: loaded.claimed !== undefined ? loaded.claimed : def.claimed,
      };
    }
    return def;
  });
};

let pendingUserUpdates: Record<string, any> = {};
let flushingUserUpdates: Record<string, any> = {};
let pendingUserUpdatesTimeout: any = null;
let isFlushing = false;

export const isPendingOrFlushing = (key: string) => {
   return (key in pendingUserUpdates) || (key in flushingUserUpdates);
};

const flushPendingUserUpdates = async (uid: string) => {
   if (isFlushing) {
      if (pendingUserUpdatesTimeout) {
         clearTimeout(pendingUserUpdatesTimeout);
      }
      pendingUserUpdatesTimeout = setTimeout(() => {
         flushPendingUserUpdates(uid);
      }, 50);
      return;
   }

   if (Object.keys(pendingUserUpdates).length === 0) return;
   
   isFlushing = true;
   flushingUserUpdates = { ...pendingUserUpdates };
   const docUpdates = { ...pendingUserUpdates };
   pendingUserUpdates = {};
   pendingUserUpdatesTimeout = null;

   delete docUpdates.$chocoDiff;
   delete docUpdates.$gchocoDiff;
   
   // Hard delete obsolete fields permanently if they were accidentally requested in update
   const obsolete = ['allUsersUnlockedAchievements', 'allUsersClaimedAchievements', 'allUsersMissions', 'allUsersStoryProgress', 'allUsersReadHistoryList', 'allUsersSavedStories', 'allUsersOwnedStickers', 'allUsersOwnedAccessories'];
   obsolete.forEach(k => {
       if (k in docUpdates) {
          docUpdates[k] = deleteField();
       }
   });

   // Tối ưu hóa dung lượng: Chỉ lưu ID và tiến độ của các nhiệm vụ có tiến trình, hoàn thành hoặc đã nhận thưởng (giúp giảm >90% dung lượng mảng missions trên Firestore)
   if (Array.isArray(docUpdates.missions)) {
       docUpdates.missions = docUpdates.missions
          .filter((m: any) => m.progress > 0 || m.completed || m.claimed)
          .map((m: any) => ({
              id: m.id,
              progress: m.progress || 0,
              completed: m.completed || false,
              claimed: m.claimed || false
          }));
   }

   // Tối ưu hóa dung lượng: Giới hạn lịch sử đọc tối đa 200 bộ truyện gần nhất để tránh phình dung lượng tài khoản qua thời gian
   if (Array.isArray(docUpdates.readHistoryList)) {
       if (docUpdates.readHistoryList.length > 200) {
           docUpdates.readHistoryList = docUpdates.readHistoryList.slice(0, 200);
       }
   }

   const state = useStore.getState();

   // Tự động kiểm tra và phục hồi: nếu avatarUrl hiện tại quá lớn (>300KB Base64),
   // ta sẽ đè lên bằng một phiên bản nén siêu nhỏ để cứu document khỏi giới hạn 1MB của Firestore.
   const currentAvatarUrl = state.avatarUrl;
   if (currentAvatarUrl && currentAvatarUrl.startsWith('data:image/') && currentAvatarUrl.length > 300000) {
      const compressed = await compressBase64Image(currentAvatarUrl);
      docUpdates.avatarUrl = compressed;
      useStore.setState({ avatarUrl: compressed });
   }

   // Nếu bản thân payload/updates chứa avatarUrl mới siêu lớn, nén ngay lập tức trước khi lưu
   if (docUpdates.avatarUrl && docUpdates.avatarUrl.startsWith('data:image/') && docUpdates.avatarUrl.length > 300000) {
      const compressed = await compressBase64Image(docUpdates.avatarUrl);
      docUpdates.avatarUrl = compressed;
      useStore.setState({ avatarUrl: compressed });
   }

   try {
      await updateDoc(doc(db, 'users', uid), docUpdates);
   } catch (err) {
      console.error('Lỗi khi update user doc:', err);
      if (checkIfQuotaError(err)) {
         useStore.setState({ isQuotaExceeded: true });
      }
   } finally {
      isFlushing = false;
      flushingUserUpdates = {};
   }
};

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      isFirebaseSynced: false,
      isLoggedIn: false,
      uid: null,
      displayName: null,
      email: null,
      avatarUrl: null,
      equippedStickerComment: null,
      stickerPositionComment: 'top-right',
      equippedStickerChat: null,
      equippedStickerPost: null,
      stickerPositionPost: 'top-right',
      ownedStickers: [],
      equippedAccessory: null,
      accessoryPosition: { x: 0, y: 0, scale: 100, rotate: 0 },
      ownedAccessories: [],
      ownedChucuAccessories: [],
      equippedChucuAccessory: null,
      showChucu: true,

      chocoMatchLevel: 1,
      chocoMatchWinStreak: 0,
      chocoMatchHearts: 5,
      chocoMatchLastHeartTick: null,
      chocoMatchTilesDestroyed: 0,
      chocoMatchColorBombsCreated: 0,
      chocoMatchSpecialCombos: 0,

      // Chucu Game & Radio default states
      isChucuGameOpen: false,
      isChocoMatchOpen: false,
      isChocoRadioOpen: false,
      isGachaOpen: false,
      isGachaAdminOpen: false,
      chucuGameFragments: 0,
      chucuGameGFragments: 0,
      gachaFragments: 0,
      chucuGameBonusPoints: 0,
      chucuGameMaxScore: 0,
      chucuGamePlaysToday: 0,
      chucuGameLastPlayDate: null,
      ownedPassTickets: 0,
      ownedPriorityTickets: 0,
      ownedMysteryBoxes: 0,
      ownedStreakTickets: 0,
      ownedGachaTickets: 0,
      gachaPity5Star: 0,
      gachaPity4Star: 0,
      activeStreakProtection: false,
      lastFreeStreakRecoveryMonth: null,
      lastClaimedRewardLevel: 1,
      choco: 0,
      goldenChoco: 0,
      level: 1,
      exp: 0,
      checkInStreak: 0,
      lastCheckInDate: null,
      lastDailyResetDate: null,
      lastWeeklyResetId: null,
      missions: [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions()],
      storyProgress: {},
      readHistoryList: [],
      savedStories: [],
      unlockedPassChapters: [],
      unlockedEarlyAccessChapters: [],
      firebaseUser: null,
      
      chucuLevel: 1,
      chucuExp: 0,
      chucuSatiety: 70,
      chucuHappiness: 50,
      chucuInteractions: 0,
      chucuPremiumFeeds: 0,
      chucuLastTime: null,

      isQuotaExceeded: false,
      setQuotaExceeded: (exceeded) => set({ isQuotaExceeded: exceeded }),
      allUsersMissions: {},
      allUsersStoryProgress: {},
      allUsersReadHistoryList: {},
      allUsersSavedStories: {},
      allUsersUnlockedAchievements: {},
      allUsersClaimedAchievements: {},
      allUsersOwnedStickers: {},
      allUsersOwnedAccessories: {},

      // Achievements defaults
      unlockedAchievements: [],
      claimedAchievements: [],
      totalEarnedChoco: 0,
      totalEarnedGChoco: 0,
      totalSpentChoco: 0,
      totalGiftedChoco: 0,
      totalCheckIns: 0,
      perfectDailyDates: [],
      sentMessagesCount: 0,
      totalChaptersRead: 0,
      totalCommentsCount: 0,
      totalGachaPulls: 0,
      totalRadioSeconds: 0,
      genresRead: [],
      activePoints: 0,
      maxConsecutiveChocoCount: 0,
      totalChocoCaught: 0,
      consecutiveGoldClears: 0,
      consecutiveDodgeClears: 0,
      radioNightChillSeconds: 0,
      radioTrackSeconds: 0,
      maxRadioTrackSeconds: 0,
      heardRadioTracks: [],
      radioTrackSwitches: 0,
      gachaSinglePullCount: 0,
      maxBannerCompletionPct: 0,
      lastActiveWeek: '',
      prevActivePoints: 0,
      prevActiveWeek: '',
      activeTitle: null,
      setActiveTitle: (title) => {
         const state = get();
         if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;
         set({ activeTitle: title });
         get().updateUserDoc({ activeTitle: title });
      },
      isMaintenance: false,
      setMaintenance: (val) => set({ isMaintenance: val }),
      customTitles: [],
      customTitleColors: {},
      achTitleColors: {},
      setCustomTitleColors: (colors) => set({ customTitleColors: colors }),
      setAchievementColors: (colors) => set({ achTitleColors: colors }),
      featureLevels: {},
      setFeatureLevels: (levels) => set({ featureLevels: levels }),
      lockedFeatureId: null,
      setLockedFeatureId: (id) => set({ lockedFeatureId: id }),
      getTitleColor: (title) => {
         if (!title) return undefined;
         const state = get();
         return state.customTitleColors[title] || state.achTitleColors[title] || undefined;
      },
      
      isStoreOpen: false,
      isMissionsOpen: false,
      isAchievementsOpen: false,
      isInventoryOpen: false,
      setStoreOpen: (open) => set({ isStoreOpen: open }),
      setMissionsOpen: (open) => set({ isMissionsOpen: open }),
      setAchievementsOpen: (open) => set({ isAchievementsOpen: open }),
      setInventoryOpen: (open) => set({ isInventoryOpen: open }),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      
      login: (name: string) => set({ isLoggedIn: true, displayName: name }),
      logout: () => set({ 
        isFirebaseSynced: false,
        isLoggedIn: false, 
        uid: null, 
        displayName: null, 
        firebaseUser: null, 
        email: null, 
        avatarUrl: null,
        equippedStickerComment: null,
        stickerPositionComment: 'top-right',
        equippedStickerChat: null,
        equippedStickerPost: null,
        stickerPositionPost: 'top-right',
        ownedStickers: [],
        equippedAccessory: null,
        accessoryPosition: { x: 0, y: 0, scale: 100, rotate: 0 },
        ownedAccessories: [],
        ownedPassTickets: 0,
        ownedPriorityTickets: 0,
        ownedMysteryBoxes: 0,
        ownedStreakTickets: 0,
        ownedGachaTickets: 0,
        gachaPity5Star: 0,
        gachaPity4Star: 0,
        activeStreakProtection: false,
        lastFreeStreakRecoveryMonth: null,
        lastClaimedRewardLevel: 1,
        choco: 0,
        goldenChoco: 0,
        level: 1,
        exp: 0,
        checkInStreak: 0,
        lastCheckInDate: null,
        lastDailyResetDate: null,
        lastWeeklyResetId: null,
        missions: [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions()],
        storyProgress: {},
        readHistoryList: [],
        savedStories: [],
        unlockedPassChapters: [],
        unlockedEarlyAccessChapters: [],
        unlockedAchievements: [],
        claimedAchievements: [],
        customTitles: [],
        totalEarnedChoco: 0,
        totalEarnedGChoco: 0,
        totalSpentChoco: 0,
        totalGiftedChoco: 0,
        totalCheckIns: 0,
        perfectDailyDates: [],
        sentMessagesCount: 0,
        totalChaptersRead: 0,
        totalCommentsCount: 0,
        totalGachaPulls: 0,
        totalRadioSeconds: 0,
        genresRead: [],
        activePoints: 0,
        maxConsecutiveChocoCount: 0,
        totalChocoCaught: 0,
        consecutiveGoldClears: 0,
        consecutiveDodgeClears: 0,
        radioNightChillSeconds: 0,
        radioTrackSeconds: 0,
        maxRadioTrackSeconds: 0,
        heardRadioTracks: [],
        radioTrackSwitches: 0,
        gachaSinglePullCount: 0,
        maxBannerCompletionPct: 0,
        lastActiveWeek: '',
        prevActivePoints: 0,
        prevActiveWeek: '',
        activeTitle: null,
      }),
      setFirebaseUser: (user) => {
         if (user) {
            const uid = user.uid;
            const state = get();
            const allMs = state.allUsersMissions || {};
            const allSp = state.allUsersStoryProgress || {};
            const allHl = state.allUsersReadHistoryList || {};
            const allSaved = state.allUsersSavedStories || {};
            const allOwnedStickers = state.allUsersOwnedStickers || {};
            const allOwnedAccessories = state.allUsersOwnedAccessories || {};
            const allUnlocked = state.allUsersUnlockedAchievements || {};
            const allClaimed = state.allUsersClaimedAchievements || {};
            
            const userMissions = allMs[uid] || [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions()];
            const userProgress = allSp[uid] || {};
            const userHistory = allHl[uid] || [];
            const userSaved = allSaved[uid] || [];
            const userOwnedStickers = allOwnedStickers[uid] || [];
            const userOwnedAccessories = allOwnedAccessories[uid] || [];
            const userUnlocked = allUnlocked[uid] || [];
            const userClaimed = allClaimed[uid] || [];

            set({ 
               isFirebaseSynced: false,
               firebaseUser: user, 
               isLoggedIn: true, 
               uid,
               email: state.email || user.email || '',
               displayName: state.displayName || user.displayName || 'Reader ' + uid.slice(0,4),
               avatarUrl: state.avatarUrl || user.photoURL || '',
               missions: userMissions,
               storyProgress: userProgress,
               readHistoryList: userHistory,
               savedStories: userSaved,
               unlockedPassChapters: state.unlockedPassChapters || [],
               unlockedEarlyAccessChapters: state.unlockedEarlyAccessChapters || [],
               ownedStickers: userOwnedStickers,
               equippedAccessory: state.equippedAccessory || null,
               accessoryPosition: state.accessoryPosition || { x: 0, y: 0, scale: 100, rotate: 0 },
               ownedAccessories: userOwnedAccessories,
               ownedPassTickets: state.ownedPassTickets || 0,
               ownedPriorityTickets: state.ownedPriorityTickets || 0,
               unlockedAchievements: userUnlocked,
               claimedAchievements: userClaimed
            });
         } else {
            // Bao toan du lieu tren may nguoi dung khi load lai trang hoac mat session tam thoi o Vercel/Iframe sandboxed.
            // Chi dang xuat, xoa trang luc nguoi dung chu dong an button "Dang xuat" duoc thuc hien thong qua logout() han hoi.
            set({ 
               firebaseUser: null
            });
         }
      },
      syncFromFirebase: (data) => {
         set((state) => {
             const uid = state.uid;
             if (!uid) return {};
             
             // Update caches
             const newAllUsersUnlocked = { ...state.allUsersUnlockedAchievements };
             const newAllUsersClaimed = { ...state.allUsersClaimedAchievements };
             const newAllMissions = { ...state.allUsersMissions };
             const newAllProgress = { ...state.allUsersStoryProgress };
             const newAllHistory = { ...state.allUsersReadHistoryList };
             const newAllSaved = { ...state.allUsersSavedStories };
             const newAllStickers = { ...state.allUsersOwnedStickers };
             const newAllAccessories = { ...state.allUsersOwnedAccessories };
             
             if (data.unlockedAchievements !== undefined) newAllUsersUnlocked[uid] = data.unlockedAchievements;
             if (data.claimedAchievements !== undefined) newAllUsersClaimed[uid] = data.claimedAchievements;
             if (data.storyProgress !== undefined) newAllProgress[uid] = data.storyProgress;
             if (data.readHistoryList !== undefined) newAllHistory[uid] = data.readHistoryList;
             if (data.savedStories !== undefined) newAllSaved[uid] = data.savedStories;
             if (data.ownedStickers !== undefined) newAllStickers[uid] = data.ownedStickers;
             if (data.ownedAccessories !== undefined) newAllAccessories[uid] = data.ownedAccessories;

            let computedChapters = data.totalChaptersRead;
            if (computedChapters === undefined || computedChapters === 0) {
               const prog = data.storyProgress || state.storyProgress || {};
               computedChapters = Object.values(prog).reduce((a: any, b: any) => a + (Array.isArray(b) ? b.length : (typeof b === 'number' ? b : 0)), 0);
            }
            
            let computedCheckIns = data.totalCheckIns || 0;
            const rawStreak = data.checkInStreak !== undefined ? data.checkInStreak : state.checkInStreak || 0;
            computedCheckIns = Math.max(computedCheckIns, rawStreak);

            let rawMissions = data.missions !== undefined ? data.missions : state.missions;
            let missionsChanged = false;

            // Bảo vệ và hợp nhất dữ liệu nhiệm vụ cục bộ (localStorage) với Firestore:
            // Nếu localStorage có tiến độ cao hơn hoặc đã hoàn thành/đã nhận mà Firestore chưa lưu được, ta giữ lại giá trị tối ưu này.
            if (data.missions !== undefined && Array.isArray(state.missions) && state.missions.length > 0) {
               const localMap = new Map<string, any>(state.missions.map(m => [m.id, m]));
               const fireMap = new Map<string, any>((Array.isArray(data.missions) ? data.missions : []).map((m: any) => [m.id, m]));
               const allIds = Array.from(new Set<string>([...localMap.keys(), ...fireMap.keys()]));

               rawMissions = allIds.map((id: string) => {
                  const local = localMap.get(id) as any;
                  const fire = fireMap.get(id) as any;

                  if (local && fire) {
                     const mergedProgress = Math.max(fire.progress || 0, local.progress || 0);
                     const mergedCompleted = fire.completed || local.completed || false;
                     const mergedClaimed = fire.claimed || local.claimed || false;
                     if (mergedProgress > (fire.progress || 0) || mergedCompleted !== fire.completed || mergedClaimed !== fire.claimed) {
                        missionsChanged = true;
                     }
                     return {
                        ...fire,
                        progress: mergedProgress,
                        completed: mergedCompleted,
                        claimed: mergedClaimed
                     };
                  } else if (local) {
                     return local;
                  } else {
                     return fire!;
                  }
               });
            }

            let resolvedMissions = reconcileMissions(rawMissions, data);

            resolvedMissions = resolvedMissions.map(m => {
               if (m.id === 'd1') {
                  const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
                  const isCheckedInToday = (data.lastCheckInDate || state.lastCheckInDate) === todayStr;
                  if (isCheckedInToday) {
                     m.progress = 1;
                     m.completed = true;
                  }
               }
               if (m.type === 'permanent' && m.description.includes('Điểm danh')) {
                  const progress = Math.max(m.progress || 0, computedCheckIns);
                  const completed = progress >= m.target;
                  return { ...m, progress, completed };
               }
               if (m.id === 'w1') {
                  const isStreakActive = data.lastCheckInDate || state.lastCheckInDate ? true : false;
                  if (isStreakActive && rawStreak > 0) {
                     const d = getGMT7Date();
                     const day = d.getDay();
                     const dayOfWeek = day === 0 ? 7 : day;
                     const estimatedWeeklyCheckins = Math.min(dayOfWeek, rawStreak);
                     const progress = Math.max(m.progress || 0, estimatedWeeklyCheckins);
                     const completed = progress >= m.target;
                     return { ...m, progress, completed };
                  }
               }
               return m;
            });

            newAllMissions[uid] = resolvedMissions;

            // Bù đắp dữ liệu gacha/radio từ trước cho những feature mới thêm bằng cách lấy MAX giữa Firestore và LocalState
            const totalGachaPullsFallback = Math.max(
                data.totalGachaPulls || 0,
                state.totalGachaPulls || 0,
                data.gachaSinglePullCount || 0,
                state.gachaSinglePullCount || 0
            );
            // Bù đắp radio
            let totalRadioSecondsFallback = Math.max(
                data.totalRadioSeconds || 0,
                state.totalRadioSeconds || 0
            );
            const prevNightChill = Math.max(data.radioNightChillSeconds || 0, state.radioNightChillSeconds || 0);
            const prevMaxTrack = Math.max(data.maxRadioTrackSeconds || 0, state.maxRadioTrackSeconds || 0);
            totalRadioSecondsFallback = Math.max(totalRadioSecondsFallback, prevNightChill + prevMaxTrack);

            // Bù đắp tiêu Choco = số Choco đã tiêu + (số GChoco đã tiêu * 3)
            const getEarnedTotalC = Math.max(data.totalEarnedChoco || 0, state.totalEarnedChoco || 0);
            const getCurrentC = data.choco !== undefined ? data.choco : (state.choco || 0);
            const getEarnedTotalG = Math.max(data.totalEarnedGChoco || 0, state.totalEarnedGChoco || 0);
            const getCurrentG = data.goldenChoco !== undefined ? data.goldenChoco : (state.goldenChoco || 0);
            let totalSpentChocoFallback = Math.max(data.totalSpentChoco || 0, state.totalSpentChoco || 0);
            const spentGChocoApprox = Math.max(0, getEarnedTotalG - getCurrentG);
            const spentChocoApprox = Math.max(0, getEarnedTotalC - getCurrentC);
            if (totalSpentChocoFallback < spentChocoApprox + (spentGChocoApprox * 3)) {
                totalSpentChocoFallback = Math.max(totalSpentChocoFallback, spentChocoApprox + (spentGChocoApprox * 3));
            }

            // Bù đắp Hứng Choco (nếu trước kia chưa lưu totalChocoCaught)
            let totalChocoCaughtFallback = Math.max(
                data.totalChocoCaught || 0,
                state.totalChocoCaught || 0
            );
            const approxFromExp = (data.chucuExp || state.chucuExp || 0) ? Math.floor((data.chucuExp || state.chucuExp || 0) / 2) : 0;
            const approxFromPoints = (data.chucuGameBonusPoints || state.chucuGameBonusPoints || 0) ? Math.floor((data.chucuGameBonusPoints || state.chucuGameBonusPoints || 0) / 8) : 0;
            let approxFromAchievements = 0;
            const unlockedAch = data.unlockedAchievements || state.unlockedAchievements || [];
            if (unlockedAch.includes('choco_rain_10000')) {
                approxFromAchievements = 10000;
            } else if (unlockedAch.includes('choco_rain_5000')) {
                approxFromAchievements = 5000;
            } else if (unlockedAch.includes('choco_rain_1000')) {
                approxFromAchievements = 1000;
            }
            totalChocoCaughtFallback = Math.max(
                totalChocoCaughtFallback,
                approxFromExp,
                approxFromPoints,
                approxFromAchievements,
                data.chucuGameFragments || 0,
                state.chucuGameFragments || 0
            );

            // Lưu bù đắp ngược lại lên Firestore nếu giá trị mới cao hơn trong Firestore
            const mergedUnlocked = Array.from(new Set([
               ...(Array.isArray(data.unlockedAchievements) ? data.unlockedAchievements : []),
               ...(Array.isArray(state.unlockedAchievements) ? state.unlockedAchievements : [])
            ]));
            const mergedClaimed = Array.from(new Set([
               ...(Array.isArray(data.claimedAchievements) ? data.claimedAchievements : []),
               ...(Array.isArray(state.claimedAchievements) ? state.claimedAchievements : [])
            ]));

            const writeBack: any = {};
            if (totalGachaPullsFallback > (data.totalGachaPulls || 0)) {
               writeBack.totalGachaPulls = totalGachaPullsFallback;
            }
            if (totalRadioSecondsFallback > (data.totalRadioSeconds || 0)) {
               writeBack.totalRadioSeconds = totalRadioSecondsFallback;
            }
            if (totalSpentChocoFallback > (data.totalSpentChoco || 0)) {
               writeBack.totalSpentChoco = totalSpentChocoFallback;
            }
            if (totalChocoCaughtFallback > (data.totalChocoCaught || 0)) {
               writeBack.totalChocoCaught = totalChocoCaughtFallback;
            }
            if (mergedUnlocked.length > (data.unlockedAchievements?.length || 0)) {
               writeBack.unlockedAchievements = mergedUnlocked;
            }
            if (mergedClaimed.length > (data.claimedAchievements?.length || 0)) {
               writeBack.claimedAchievements = mergedClaimed;
            }
            if (missionsChanged) {
               writeBack.missions = resolvedMissions;
            }
            if ((state.level || 1) > (data.level || 1)) {
               writeBack.level = state.level;
               writeBack.exp = state.exp;
            }
            if (data.lastClaimedRewardLevel === undefined) {
               writeBack.lastClaimedRewardLevel = state.lastClaimedRewardLevel || data.level || state.level || 1;
            } else if (state.lastClaimedRewardLevel > data.lastClaimedRewardLevel) {
               writeBack.lastClaimedRewardLevel = state.lastClaimedRewardLevel;
            }
            if (Object.keys(writeBack).length > 0) {
               setTimeout(() => {
                   get().updateUserDoc(writeBack);
               }, 100);
            }

            return {
            allUsersUnlockedAchievements: newAllUsersUnlocked,
            allUsersClaimedAchievements: newAllUsersClaimed,
            allUsersMissions: newAllMissions,
            allUsersStoryProgress: newAllProgress,
            allUsersReadHistoryList: newAllHistory,
            allUsersSavedStories: newAllSaved,
            allUsersOwnedStickers: newAllStickers,
            allUsersOwnedAccessories: newAllAccessories,
            isFirebaseSynced: true,
            choco: isPendingOrFlushing('choco') ? state.choco : (typeof data.choco === 'number' ? data.choco : (typeof state.choco === 'number' ? state.choco : 0)),
            goldenChoco: isPendingOrFlushing('goldenChoco') ? state.goldenChoco : (typeof data.goldenChoco === 'number' ? data.goldenChoco : (typeof state.goldenChoco === 'number' ? state.goldenChoco : 0)),
            level: isPendingOrFlushing('level') ? state.level : Math.max(data.level !== undefined ? data.level : 1, state.level || 1),
            exp: isPendingOrFlushing('exp') ? state.exp : (data.exp !== undefined ? ((state.level && data.level && data.level < state.level) ? state.exp : data.exp) : state.exp),
            checkInStreak: isPendingOrFlushing('checkInStreak') ? state.checkInStreak : (data.checkInStreak !== undefined ? data.checkInStreak : state.checkInStreak),
            lastCheckInDate: isPendingOrFlushing('lastCheckInDate') ? state.lastCheckInDate : (data.lastCheckInDate !== undefined ? data.lastCheckInDate : state.lastCheckInDate),
            lastDailyResetDate: isPendingOrFlushing('lastDailyResetDate') ? state.lastDailyResetDate : (data.lastDailyResetDate !== undefined ? data.lastDailyResetDate : state.lastDailyResetDate),
            lastWeeklyResetId: isPendingOrFlushing('lastWeeklyResetId') ? state.lastWeeklyResetId : (data.lastWeeklyResetId !== undefined ? data.lastWeeklyResetId : state.lastWeeklyResetId),
            displayName: isPendingOrFlushing('displayName') ? state.displayName : (data.displayName !== undefined ? data.displayName : state.displayName),
            email: isPendingOrFlushing('email') ? state.email : (data.email !== undefined ? data.email : state.email),
            avatarUrl: isPendingOrFlushing('avatarUrl') ? state.avatarUrl : (data.avatarUrl !== undefined ? data.avatarUrl : state.avatarUrl),
            equippedStickerComment: isPendingOrFlushing('equippedStickerComment') ? state.equippedStickerComment : (data.equippedStickerComment !== undefined ? data.equippedStickerComment : (data.equippedStickerAvatar !== undefined ? data.equippedStickerAvatar : state.equippedStickerComment)),
            stickerPositionComment: isPendingOrFlushing('stickerPositionComment') ? state.stickerPositionComment : (data.stickerPositionComment !== undefined ? data.stickerPositionComment : (data.stickerPositionAvatar !== undefined ? data.stickerPositionAvatar : state.stickerPositionComment)),
            equippedStickerChat: isPendingOrFlushing('equippedStickerChat') ? state.equippedStickerChat : (data.equippedStickerChat !== undefined ? data.equippedStickerChat : state.equippedStickerChat),
            equippedStickerPost: isPendingOrFlushing('equippedStickerPost') ? state.equippedStickerPost : (data.equippedStickerPost !== undefined ? data.equippedStickerPost : state.equippedStickerPost),
            stickerPositionPost: isPendingOrFlushing('stickerPositionPost') ? state.stickerPositionPost : (data.stickerPositionPost !== undefined ? data.stickerPositionPost : state.stickerPositionPost),
            ownedStickers: isPendingOrFlushing('ownedStickers') ? state.ownedStickers : (data.ownedStickers !== undefined ? data.ownedStickers : state.ownedStickers),
            equippedAccessory: isPendingOrFlushing('equippedAccessory') ? state.equippedAccessory : (data.equippedAccessory !== undefined ? data.equippedAccessory : state.equippedAccessory),
            accessoryPosition: isPendingOrFlushing('accessoryPosition') ? state.accessoryPosition : (data.accessoryPosition !== undefined ? data.accessoryPosition : state.accessoryPosition),
            ownedAccessories: isPendingOrFlushing('ownedAccessories') ? state.ownedAccessories : (data.ownedAccessories !== undefined ? data.ownedAccessories : state.ownedAccessories),
            ownedChucuAccessories: isPendingOrFlushing('ownedChucuAccessories') ? state.ownedChucuAccessories : (data.ownedChucuAccessories !== undefined ? data.ownedChucuAccessories : state.ownedChucuAccessories),
            equippedChucuAccessory: isPendingOrFlushing('equippedChucuAccessory') ? state.equippedChucuAccessory : (data.equippedChucuAccessory !== undefined ? data.equippedChucuAccessory : state.equippedChucuAccessory),
            showChucu: isPendingOrFlushing('showChucu') ? state.showChucu : (data.showChucu !== undefined ? data.showChucu : true),
            ownedPassTickets: isPendingOrFlushing('ownedPassTickets') ? state.ownedPassTickets : (data.ownedPassTickets !== undefined ? data.ownedPassTickets : state.ownedPassTickets),
            ownedPriorityTickets: isPendingOrFlushing('ownedPriorityTickets') ? state.ownedPriorityTickets : (data.ownedPriorityTickets !== undefined ? data.ownedPriorityTickets : state.ownedPriorityTickets),
            ownedMysteryBoxes: isPendingOrFlushing('ownedMysteryBoxes') ? state.ownedMysteryBoxes : (data.ownedMysteryBoxes !== undefined ? data.ownedMysteryBoxes : state.ownedMysteryBoxes),
            ownedStreakTickets: isPendingOrFlushing('ownedStreakTickets') ? state.ownedStreakTickets : (data.ownedStreakTickets !== undefined ? data.ownedStreakTickets : state.ownedStreakTickets),
            ownedGachaTickets: isPendingOrFlushing('ownedGachaTickets') ? state.ownedGachaTickets : (data.ownedGachaTickets !== undefined ? data.ownedGachaTickets : state.ownedGachaTickets),
            gachaPity5Star: isPendingOrFlushing('gachaPity5Star') ? state.gachaPity5Star : (data.gachaPity5Star !== undefined ? data.gachaPity5Star : state.gachaPity5Star),
            gachaPity4Star: isPendingOrFlushing('gachaPity4Star') ? state.gachaPity4Star : (data.gachaPity4Star !== undefined ? data.gachaPity4Star : state.gachaPity4Star),
            activeStreakProtection: isPendingOrFlushing('activeStreakProtection') ? state.activeStreakProtection : (data.activeStreakProtection !== undefined ? data.activeStreakProtection : state.activeStreakProtection),
            lastFreeStreakRecoveryMonth: isPendingOrFlushing('lastFreeStreakRecoveryMonth') ? state.lastFreeStreakRecoveryMonth : (data.lastFreeStreakRecoveryMonth !== undefined ? data.lastFreeStreakRecoveryMonth : state.lastFreeStreakRecoveryMonth),
            lastClaimedRewardLevel: isPendingOrFlushing('lastClaimedRewardLevel') ? state.lastClaimedRewardLevel : (data.lastClaimedRewardLevel !== undefined ? data.lastClaimedRewardLevel : (state.lastClaimedRewardLevel || data.level || state.level || 1)),
            savedStories: isPendingOrFlushing('savedStories') ? state.savedStories : (data.savedStories !== undefined ? data.savedStories : state.savedStories),
            unlockedPassChapters: isPendingOrFlushing('unlockedPassChapters') ? state.unlockedPassChapters : (data.unlockedPassChapters !== undefined ? data.unlockedPassChapters : state.unlockedPassChapters),
            unlockedEarlyAccessChapters: isPendingOrFlushing('unlockedEarlyAccessChapters') ? state.unlockedEarlyAccessChapters : (data.unlockedEarlyAccessChapters !== undefined ? data.unlockedEarlyAccessChapters : state.unlockedEarlyAccessChapters),
            missions: isPendingOrFlushing('missions') ? state.missions : resolvedMissions,
            storyProgress: isPendingOrFlushing('storyProgress') ? state.storyProgress : (data.storyProgress !== undefined ? data.storyProgress : state.storyProgress),
            readHistoryList: isPendingOrFlushing('readHistoryList') ? state.readHistoryList : (data.readHistoryList !== undefined ? data.readHistoryList : state.readHistoryList),
            chucuLevel: isPendingOrFlushing('chucuLevel') ? state.chucuLevel : (data.chucuLevel !== undefined ? data.chucuLevel : state.chucuLevel),
            chucuExp: isPendingOrFlushing('chucuExp') ? state.chucuExp : (data.chucuExp !== undefined ? data.chucuExp : state.chucuExp),
            chucuSatiety: isPendingOrFlushing('chucuSatiety') ? state.chucuSatiety : (data.chucuSatiety !== undefined ? data.chucuSatiety : state.chucuSatiety),
            chucuHappiness: isPendingOrFlushing('chucuHappiness') ? state.chucuHappiness : (data.chucuHappiness !== undefined ? data.chucuHappiness : state.chucuHappiness),
            chucuInteractions: isPendingOrFlushing('chucuInteractions') ? state.chucuInteractions : (data.chucuInteractions !== undefined ? data.chucuInteractions : state.chucuInteractions),
            chucuPremiumFeeds: isPendingOrFlushing('chucuPremiumFeeds') ? state.chucuPremiumFeeds : (data.chucuPremiumFeeds !== undefined ? data.chucuPremiumFeeds : state.chucuPremiumFeeds),
            chucuLastTime: isPendingOrFlushing('chucuLastTime') ? state.chucuLastTime : (data.chucuLastTime !== undefined ? data.chucuLastTime : state.chucuLastTime),

            chucuGameFragments: isPendingOrFlushing('chucuGameFragments') ? state.chucuGameFragments : (data.chucuGameFragments !== undefined ? data.chucuGameFragments : state.chucuGameFragments),
            chucuGameGFragments: isPendingOrFlushing('chucuGameGFragments') ? state.chucuGameGFragments : (data.chucuGameGFragments !== undefined ? data.chucuGameGFragments : state.chucuGameGFragments),
            gachaFragments: isPendingOrFlushing('gachaFragments') ? state.gachaFragments : (data.gachaFragments !== undefined ? data.gachaFragments : state.gachaFragments),
            chucuGameBonusPoints: isPendingOrFlushing('chucuGameBonusPoints') ? state.chucuGameBonusPoints : (data.chucuGameBonusPoints !== undefined ? data.chucuGameBonusPoints : state.chucuGameBonusPoints),
            chucuGameMaxScore: isPendingOrFlushing('chucuGameMaxScore') ? state.chucuGameMaxScore : (data.chucuGameMaxScore !== undefined ? data.chucuGameMaxScore : (state.chucuGameMaxScore || 0)),
            chucuGamePlaysToday: isPendingOrFlushing('chucuGamePlaysToday') ? state.chucuGamePlaysToday : (data.chucuGamePlaysToday !== undefined ? data.chucuGamePlaysToday : state.chucuGamePlaysToday),
            chucuGameLastPlayDate: isPendingOrFlushing('chucuGameLastPlayDate') ? state.chucuGameLastPlayDate : (data.chucuGameLastPlayDate !== undefined ? data.chucuGameLastPlayDate : state.chucuGameLastPlayDate),

            chocoMatchLevel: isPendingOrFlushing('chocoMatchLevel') ? state.chocoMatchLevel : (data.chocoMatchLevel !== undefined ? data.chocoMatchLevel : state.chocoMatchLevel),
            chocoMatchWinStreak: isPendingOrFlushing('chocoMatchWinStreak') ? state.chocoMatchWinStreak : (data.chocoMatchWinStreak !== undefined ? data.chocoMatchWinStreak : (state.chocoMatchWinStreak || 0)),
            chocoMatchHearts: isPendingOrFlushing('chocoMatchHearts') ? state.chocoMatchHearts : (data.chocoMatchHearts !== undefined ? data.chocoMatchHearts : state.chocoMatchHearts),
            chocoMatchLastHeartTick: isPendingOrFlushing('chocoMatchLastHeartTick') ? state.chocoMatchLastHeartTick : (data.chocoMatchLastHeartTick !== undefined ? data.chocoMatchLastHeartTick : state.chocoMatchLastHeartTick),

            unlockedAchievements: isPendingOrFlushing('unlockedAchievements') ? state.unlockedAchievements : mergedUnlocked,
            claimedAchievements: isPendingOrFlushing('claimedAchievements') ? state.claimedAchievements : mergedClaimed,
            totalEarnedChoco: isPendingOrFlushing('totalEarnedChoco') ? state.totalEarnedChoco : (data.totalEarnedChoco !== undefined ? data.totalEarnedChoco : state.totalEarnedChoco),
            totalEarnedGChoco: isPendingOrFlushing('totalEarnedGChoco') ? state.totalEarnedGChoco : (data.totalEarnedGChoco !== undefined ? data.totalEarnedGChoco : state.totalEarnedGChoco),
            totalSpentChoco: isPendingOrFlushing('totalSpentChoco') ? state.totalSpentChoco : totalSpentChocoFallback,
            totalGiftedChoco: isPendingOrFlushing('totalGiftedChoco') ? state.totalGiftedChoco : (data.totalGiftedChoco !== undefined ? data.totalGiftedChoco : (state.totalGiftedChoco || 0)),
            totalCheckIns: isPendingOrFlushing('totalCheckIns') ? state.totalCheckIns : (computedCheckIns !== undefined ? computedCheckIns : state.totalCheckIns),
            perfectDailyDates: isPendingOrFlushing('perfectDailyDates') ? state.perfectDailyDates : (data.perfectDailyDates !== undefined ? data.perfectDailyDates : state.perfectDailyDates),
            sentMessagesCount: isPendingOrFlushing('sentMessagesCount') ? state.sentMessagesCount : (data.sentMessagesCount !== undefined ? data.sentMessagesCount : state.sentMessagesCount),
            totalChaptersRead: isPendingOrFlushing('totalChaptersRead') ? state.totalChaptersRead : computedChapters,
            totalCommentsCount: isPendingOrFlushing('totalCommentsCount') ? state.totalCommentsCount : (data.totalCommentsCount !== undefined ? data.totalCommentsCount : state.totalCommentsCount),
            totalGachaPulls: isPendingOrFlushing('totalGachaPulls') ? state.totalGachaPulls : totalGachaPullsFallback,
            totalRadioSeconds: isPendingOrFlushing('totalRadioSeconds') ? state.totalRadioSeconds : totalRadioSecondsFallback,
            genresRead: isPendingOrFlushing('genresRead') ? state.genresRead : (data.genresRead !== undefined ? data.genresRead : state.genresRead),
            activePoints: isPendingOrFlushing('activePoints') ? state.activePoints : (data.activePoints !== undefined ? data.activePoints : state.activePoints),
            maxConsecutiveChocoCount: isPendingOrFlushing('maxConsecutiveChocoCount') ? state.maxConsecutiveChocoCount : (data.maxConsecutiveChocoCount !== undefined ? data.maxConsecutiveChocoCount : (state.maxConsecutiveChocoCount || 0)),
            totalChocoCaught: isPendingOrFlushing('totalChocoCaught') ? state.totalChocoCaught : totalChocoCaughtFallback,
            consecutiveGoldClears: isPendingOrFlushing('consecutiveGoldClears') ? state.consecutiveGoldClears : (data.consecutiveGoldClears !== undefined ? data.consecutiveGoldClears : (state.consecutiveGoldClears || 0)),
            consecutiveDodgeClears: isPendingOrFlushing('consecutiveDodgeClears') ? state.consecutiveDodgeClears : (data.consecutiveDodgeClears !== undefined ? data.consecutiveDodgeClears : (state.consecutiveDodgeClears || 0)),
            radioNightChillSeconds: isPendingOrFlushing('radioNightChillSeconds') ? state.radioNightChillSeconds : (data.radioNightChillSeconds !== undefined ? data.radioNightChillSeconds : (state.radioNightChillSeconds || 0)),
            radioTrackSeconds: data.radioTrackSeconds !== undefined ? data.radioTrackSeconds : (state.radioTrackSeconds || 0),
            maxRadioTrackSeconds: data.maxRadioTrackSeconds !== undefined ? data.maxRadioTrackSeconds : (state.maxRadioTrackSeconds || 0),
            heardRadioTracks: data.heardRadioTracks !== undefined ? data.heardRadioTracks : (state.heardRadioTracks || []),
            radioTrackSwitches: data.radioTrackSwitches !== undefined ? data.radioTrackSwitches : (state.radioTrackSwitches || 0),
            gachaSinglePullCount: data.gachaSinglePullCount !== undefined ? data.gachaSinglePullCount : (state.gachaSinglePullCount || 0),
            maxBannerCompletionPct: data.maxBannerCompletionPct !== undefined ? data.maxBannerCompletionPct : (state.maxBannerCompletionPct || 0),
            lastActiveWeek: data.lastActiveWeek !== undefined ? data.lastActiveWeek : state.lastActiveWeek,
            prevActivePoints: data.prevActivePoints !== undefined ? data.prevActivePoints : state.prevActivePoints,
            prevActiveWeek: data.prevActiveWeek !== undefined ? data.prevActiveWeek : state.prevActiveWeek,
            activeTitle: data.activeTitle !== undefined ? data.activeTitle : state.activeTitle,
            customTitles: data.customTitles !== undefined ? data.customTitles : state.customTitles,
            };
         });
         get()._checkResetMissions();
         get()._triggerCountAchievementsCheck();
      },

      gainExp: (amount: number) => {
         const state = get();
         if (!state.isLoggedIn) return;
         
         let currentExp = state.exp || 0;
         let currentLevel = state.level || 1;
         
         let newExp = currentExp + amount;
         let newLevel = currentLevel;
         
         while (true) {
            const expNeeded = newLevel * 100;
            if (newExp >= expNeeded) {
               newExp -= expNeeded;
               newLevel += 1;
            } else {
               break;
            }
         }
         
         set({ exp: newExp, level: newLevel });
         get().updateUserDoc({ exp: newExp, level: newLevel });
      },

      updateChocoMatchState: (updates) => {
         const state = get();
         set({ ...updates });
         if (state.isLoggedIn && state.uid) {
            state.updateUserDoc(updates);
         }
         
         setTimeout(() => {
            get()._triggerCountAchievementsCheck();
         }, 50);
      },

      updateChucuStats: (stats) => {
         const state = get();
         set({ ...stats });
         if (state.isLoggedIn && state.uid) {
            state.updateUserDoc(stats);
            setTimeout(() => {
               get()._triggerCountAchievementsCheck();
            }, 50);
         }
      },

      updateUserDoc: async (updates: any, transactionReason?: string) => {
         const state = get();
         const uid = state.uid;
         if (!uid || !state.isFirebaseSynced) return;

         const prevChoco = state.choco || 0;
         const prevGChoco = state.goldenChoco || 0;
         
         // Luon cap nhat Zustand State cuc bo ngay va luon de luu xuong LocalStorage tuc thi
         set((currentState) => {
            const newState: any = {};
            Object.keys(updates).forEach(key => {
               if (key in currentState) {
                  newState[key] = updates[key];
               }
            });
            return newState;
         });

         if (!uid) return;

         // Log transactions if amounts changed
         if (transactionReason) {
            let cDiff = 0;
            let gDiff = 0;
            
            if (updates.$chocoDiff !== undefined) {
               cDiff = updates.$chocoDiff;
            } else if (updates.choco !== undefined) {
               cDiff = updates.choco - prevChoco;
            }
            
            if (updates.$gchocoDiff !== undefined) {
               gDiff = updates.$gchocoDiff;
            } else if (updates.goldenChoco !== undefined) {
               gDiff = updates.goldenChoco - prevGChoco;
            }

            if (cDiff !== 0) {
               const bal = updates.choco !== undefined ? updates.choco : prevChoco + cDiff;
               logTransaction(uid, Math.abs(cDiff), 'choco', cDiff > 0 ? 'earn' : 'spend', transactionReason, bal);
            }
            if (gDiff !== 0) {
               const bal = updates.goldenChoco !== undefined ? updates.goldenChoco : prevGChoco + gDiff;
               logTransaction(uid, Math.abs(gDiff), 'gchoco', gDiff > 0 ? 'earn' : 'spend', transactionReason, bal);
            }
         }

         // Queue the updates to be flushed together
         const updatesCopy = { ...updates };
         delete updatesCopy.$chocoDiff;
         delete updatesCopy.$gchocoDiff;

         pendingUserUpdates = { ...pendingUserUpdates, ...updatesCopy };

         if (pendingUserUpdatesTimeout) {
            clearTimeout(pendingUserUpdatesTimeout);
         }

         pendingUserUpdatesTimeout = setTimeout(() => {
            flushPendingUserUpdates(uid);
         }, 50);
      },
      
      useMysteryBox: async () => {
         const state = get();
         if (!state.isLoggedIn || !state.uid) {
            alert("Vui lòng đăng nhập!");
            return null;
         }
         if ((state.ownedMysteryBoxes || 0) <= 0) {
            alert("Bạn không có Hộp Quà Sticker Bí Ẩn nào!");
            return null;
         }
         try {
            // Tải danh sách tất cả sticker từ cửa hàng
            const q = query(collection(db, 'store_stickers'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const allStickers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
            
            // Lọc ra các sticker mà người dùng CHƯA sở hữu
            const unowned = allStickers.filter(s => s.url && !state.ownedStickers?.includes(s.url));
            if (unowned.length === 0) {
               alert("Bạn đã sở hữu toàn bộ sticker có trong cửa hàng rồi!");
               return null;
            }
            
            // Chọn ngẫu nhiên 1 sticker chưa sở hữu
            const randomIndex = Math.floor(Math.random() * unowned.length);
            const chosenSticker = unowned[randomIndex];
            
            // Lấy lại state mới nhất để tránh lỗi click nhiều lần liên tiếp do lag tải data
            const currentState = get();
            
            // Cập nhật state cục bộ và Firestore
            const newBoxes = (currentState.ownedMysteryBoxes || 0) - 1;
            const newStickers = [...(currentState.ownedStickers || []), chosenSticker.url];
            
            // Cập nhật thông qua updateUserDoc để lưu đồng nhất (trừ ownedStickers vì lưu vào subcollection)
            await currentState.updateUserDoc({
               ownedMysteryBoxes: newBoxes
            });

            // Ghi sticker mới vào subcollection
            try {
               await addDoc(collection(db, 'users', currentState.uid, 'owned_stickers'), {
                  url: chosenSticker.url,
                  acquiredAt: Date.now()
               });
            } catch(subErr) {
               console.error('Lỗi khi lưu sticker vào subcollection:', subErr);
            }
            
            // Cập nhật state cục bộ manually vì listener onSnapshot có thể chậm 1 chút
            set({ ownedStickers: newStickers });
            
            return chosenSticker;
         } catch (err: any) {
            console.error("Lỗi khi dùng Hộp Quà Sticker Bí Ẩn:", err);
            alert("Đã xảy ra lỗi: " + err.message);
            return null;
         }
      },
      
      checkIn: () => {
        get()._checkResetMissions();
        const state = get();
        if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;
        
        const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
        if (state.lastCheckInDate === todayStr) return; // Already checked in
        
        let newStreak = 1;
        let updateStreakRecoveryStats: any = {};
        if (state.lastCheckInDate) {
           let daysDiff = 1;
           try {
              const d1 = new Date(todayStr + 'T00:00:00Z').getTime();
              const d2 = new Date(state.lastCheckInDate + 'T00:00:00Z').getTime();
              daysDiff = Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
           } catch (e) {
              console.error('Error parsing checkin dates:', e);
           }
           if (daysDiff === 1) {
               newStreak = state.checkInStreak + 1;
           } else if (daysDiff > 1) {
               const missedDays = daysDiff - 1;
               let remainingMissedDays = missedDays;
               
               const currentMonth = format(new Date(), 'yyyy-MM');
               let usedFree = false;
               if (state.lastFreeStreakRecoveryMonth !== currentMonth) {
                   remainingMissedDays -= 1;
                   usedFree = true;
               }
               
               if (remainingMissedDays <= 0) {
                   // Fully covered by free monthly
                   newStreak = state.checkInStreak + 1;
                   updateStreakRecoveryStats.lastFreeStreakRecoveryMonth = currentMonth;
               } else {
                   // Need to use tickets
                   const ticketsNeeded = remainingMissedDays;
                   if ((state.ownedStreakTickets || 0) >= ticketsNeeded) {
                       newStreak = state.checkInStreak + 1;
                       if (usedFree) updateStreakRecoveryStats.lastFreeStreakRecoveryMonth = currentMonth;
                       updateStreakRecoveryStats.ownedStreakTickets = (state.ownedStreakTickets || 0) - ticketsNeeded;
                   } else {
                       // Not enough tickets
                       newStreak = 1;
                   }
               }
           } else {
               newStreak = 1;
           }
        }
        
        // Calculate choco
        let dailyChoco = 1;
        if (newStreak === 1) dailyChoco = 1;
        else if (newStreak >= 2 && newStreak <= 3) dailyChoco = 2;
        else if (newStreak >= 4 && newStreak <= 6) dailyChoco = 3;
        else if (newStreak >= 7 && newStreak <= 10) dailyChoco = 4;
        else if (newStreak >= 11 && newStreak <= 15) dailyChoco = 5;
        else if (newStreak >= 16 && newStreak <= 21) dailyChoco = 6;
        else if (newStreak >= 22 && newStreak <= 28) dailyChoco = 7;
        else if (newStreak >= 29 && newStreak <= 36) dailyChoco = 8;
        else if (newStreak >= 37 && newStreak <= 45) dailyChoco = 9;
        else if (newStreak >= 46) dailyChoco = 10;

        // Update missions
        const ms = reconcileMissions([...state.missions], state);
        const dCheck = ms.find(m => m.id === 'd1');
        if (dCheck) { dCheck.progress = 1; dCheck.completed = true; }
        
        const wCheck = ms.find(m => m.id === 'w1');
        if (wCheck) { wCheck.progress += 1; if (wCheck.progress >= wCheck.target) wCheck.completed = true; }
         
        const actualTotalCheckIns = Math.max(state.totalCheckIns || 0, state.checkInStreak || 0);
        const newTotalCheckins = actualTotalCheckIns + 1;
        
        ms.filter(m => m.type === 'permanent' && m.description.includes('Điểm danh')).forEach(pCheck => {
           pCheck.progress = newTotalCheckins;
           if (pCheck.progress >= pCheck.target) pCheck.completed = true;
        });

        // Track per-uid for persistence separation
        const uid = state.uid;
        const allMs = { ...(state.allUsersMissions || {}) };
        if (uid) {
          allMs[uid] = ms;
        }

        const newChoco = state.choco + dailyChoco;
        const newTotalEarnedChoco = (state.totalEarnedChoco || 0) + dailyChoco;

        set({ 
            lastCheckInDate: todayStr, 
            checkInStreak: newStreak, 
            choco: newChoco,
            totalEarnedChoco: newTotalEarnedChoco,
            totalCheckIns: newTotalCheckins,
            missions: ms,
            allUsersMissions: allMs,
            ...updateStreakRecoveryStats
        });
        
        get().updateUserDoc({
            lastCheckInDate: todayStr,
            checkInStreak: newStreak,
            choco: newChoco,
            $chocoDiff: dailyChoco,
            totalEarnedChoco: newTotalEarnedChoco,
            totalCheckIns: newTotalCheckins,
            missions: ms,
            ...updateStreakRecoveryStats
        }, "Điểm danh hàng ngày");
        
        get().gainExp(10);
        get()._checkPerfectDailyDay();
        get()._triggerCountAchievementsCheck();
      },
      
      addChoco: (amount, reason = "Nhận Choco") => {
          const state = get();
          if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;
          const newChoco = state.choco + amount;
          const newTotalEarned = (state.totalEarnedChoco || 0) + amount;
          
          set({ choco: newChoco, totalEarnedChoco: newTotalEarned });
          get().updateUserDoc({ choco: newChoco, $chocoDiff: amount, totalEarnedChoco: newTotalEarned }, reason);
          
          setTimeout(() => {
             get()._triggerCountAchievementsCheck();
          }, 50);
      },
      addGoldenChoco: (amount, reason = "Nhận GChoco") => {
          const state = get();
          if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;
          const newGolden = state.goldenChoco + amount;
          const newTotalEarnedG = (state.totalEarnedGChoco || 0) + amount;
          
          set({ goldenChoco: newGolden, totalEarnedGChoco: newTotalEarnedG });
          get().updateUserDoc({ goldenChoco: newGolden, $gchocoDiff: amount, totalEarnedGChoco: newTotalEarnedG }, reason);

          setTimeout(() => {
             get()._triggerCountAchievementsCheck();
          }, 50);
      },
      spendChoco: (amount, reason = "Dùng Choco") => {
          const state = get();
          if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return false;
          if (state.choco >= amount) {
              const newChoco = state.choco - amount;
              const newTotalSpent = (state.totalSpentChoco || 0) + amount;
              set({ choco: newChoco, totalSpentChoco: newTotalSpent });
              get().updateUserDoc({ choco: newChoco, $chocoDiff: -amount, totalSpentChoco: newTotalSpent }, reason);

              setTimeout(() => {
                 get()._triggerCountAchievementsCheck();
              }, 50);

              return true;
          }
          return false;
      },
      spendGoldenChoco: (amount, reason = "Dùng GChoco") => {
          const state = get();
          if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return false;
          if (state.goldenChoco >= amount) {
              const newTotalSpent = (state.totalSpentChoco || 0) + (amount * 3);
              set({ goldenChoco: state.goldenChoco - amount, totalSpentChoco: newTotalSpent });
              get().updateUserDoc({ goldenChoco: state.goldenChoco - amount, totalSpentChoco: newTotalSpent, $gchocoDiff: -amount }, reason);
              
              setTimeout(() => {
                 get()._triggerCountAchievementsCheck();
              }, 50);

              return true;
          }
          return false;
      },
      
      markStoryRead: (storyId, chapterOrder, genres) => {
        get()._checkResetMissions();
        const state = get();
        if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;
        
        const prevProgress = state.storyProgress[storyId];
        let currentArray: number[] = [];
        if (typeof prevProgress === 'number') {
           if (prevProgress > 0) {
              currentArray = Array.from({length: prevProgress}, (_, i) => i + 1);
           }
        } else if (Array.isArray(prevProgress)) {
           currentArray = prevProgress;
        }

        let isNewChapter = false;
        if (!currentArray.includes(chapterOrder)) {
             isNewChapter = true;
        }

        const newProgressArray = Array.from(new Set([...currentArray, chapterOrder])).sort((a,b)=>a-b);
        const newProgress = { ...state.storyProgress, [storyId]: newProgressArray };
        const newHistory = Array.from(new Set([storyId, ...state.readHistoryList]));
        
        let newTotalChaptersRead = state.totalChaptersRead || 0;
        const ms = [...state.missions];
        if (isNewChapter) {
            const dRead = ms.find(m => m.id === 'd2');
            if (dRead && !dRead.completed) { dRead.progress = 1; dRead.completed = true; }
            
            const wRead = ms.find(m => m.id === 'w2');
            if (wRead && !wRead.completed) { wRead.progress += 1; if(wRead.progress >= wRead.target) wRead.completed = true;}
            
            get().gainExp(3);
            newTotalChaptersRead += 1;
        }

        // Active points addition (continuous, no weekly reset)
        const finalActivePoints = (state.activePoints || 0) + 1;

        // Achievements triggers
        // 1. Mới Thử Choco: chapterOrder === 1
        if (chapterOrder === 1) {
           get().unlockAchievement('first_chapter');
        }

        // 2. Midnight Read: hour 0, 1, 2
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 3) {
           get().unlockAchievement('midnight_read');
        }

        // 2b. Early Morning Read: hour 05:00 - 08:00
        if (hour >= 5 && hour < 8) {
           get().unlockAchievement('early_morning_read');
        }

        // 3. Multi Genre: 5 unique genres read and 5 stories read
        let uniqueGenres = state.genresRead || [];
        if (genres && genres.length > 0) {
           uniqueGenres = Array.from(new Set([...uniqueGenres, ...genres]));
           if (uniqueGenres.length >= 5 && newHistory.length >= 5) {
              get().unlockAchievement('multi_genre');
           }
        }

        // Track per-uid for persistence separation
        const uid = state.uid;
        const allSp = { ...(state.allUsersStoryProgress || {}) };
        const allHl = { ...(state.allUsersReadHistoryList || {}) };
        const allMs = { ...(state.allUsersMissions || {}) };
        if (uid) {
           allSp[uid] = newProgress;
           allHl[uid] = newHistory;
           allMs[uid] = ms;
        }

        set({ 
          storyProgress: newProgress,
          readHistoryList: newHistory,
          missions: ms,
          totalChaptersRead: newTotalChaptersRead,
          genresRead: uniqueGenres,
          activePoints: finalActivePoints,
          allUsersStoryProgress: allSp,
          allUsersReadHistoryList: allHl,
          allUsersMissions: allMs
        });

        get().updateUserDoc({
          genresRead: uniqueGenres,
          activePoints: finalActivePoints,
          totalChaptersRead: newTotalChaptersRead,
          storyProgress: newProgress,
          readHistoryList: newHistory,
          missions: ms,
        });

        get()._checkPerfectDailyDay();
        get()._triggerCountAchievementsCheck();
      },
      
      addCommentProgress: () => {
         get()._checkResetMissions();
         const state = get();
         if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;
         const ms = [...state.missions];
         
         const dComm = ms.find(m => m.id === 'd3');
         if (dComm && !dComm.completed) { dComm.progress = 1; dComm.completed = true; }
         
         const wComm = ms.find(m => m.id === 'w3');
         if (wComm && !wComm.completed) { wComm.progress += 1; if(wComm.progress >= wComm.target) wComm.completed = true;}
         
         const uid = state.uid;
         const allMs = { ...(state.allUsersMissions || {}) };
         if (uid) {
            allMs[uid] = ms;
         }

         const finalActivePoints = (state.activePoints || 0) + 1;
         const newCommentsCount = (state.totalCommentsCount || 0) + 1;

         const rewardChoco = 1; // +1 choco for completing comment action in store code originally was +1
         const newChoco = (state.choco || 0) + rewardChoco;
         const newTotalEarned = (state.totalEarnedChoco || 0) + rewardChoco;

         set({ 
           missions: ms, 
           choco: newChoco,
           totalEarnedChoco: newTotalEarned,
           totalCommentsCount: newCommentsCount,
           activePoints: finalActivePoints,
           allUsersMissions: allMs
         });

         get().updateUserDoc({ 
           choco: newChoco, 
           $chocoDiff: rewardChoco,
           totalEarnedChoco: newTotalEarned,
           totalCommentsCount: newCommentsCount,
           activePoints: finalActivePoints,
           missions: ms,
         }, "Hoàn thành bình luận");

         get().gainExp(5);
         get()._checkPerfectDailyDay();
         get()._triggerCountAchievementsCheck();
      },
      
      syncCommentsCountFromDB: async () => {
         await get().syncUserDataStatsFromDB();
      },
      
      syncUserDataStatsFromDB: async () => {
         const state = get();
         const uid = state.uid;
         if (!uid) return;
         try {
            const commenterQuery = query(collection(db, 'comments'), where('uid', '==', uid));
            const commentsSnap = await getDocs(commenterQuery);
            const commentsCount = commentsSnap.size;

            const chatQuery = query(collection(db, 'chatMessages'), where('uid', '==', uid));
            const chatSnap = await getDocs(chatQuery);
            const chatCount = chatSnap.size;

            const updates: any = {};
            if (commentsCount !== state.totalCommentsCount) {
               updates.totalCommentsCount = commentsCount;
            }
            if (chatCount !== state.sentMessagesCount) {
               updates.sentMessagesCount = chatCount;
            }

            const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
            const currentWeekId = getWeeklyId();

            let commentsTodayCount = 0;
            let commentsThisWeekCount = 0;

            const toGMT7Date = (ms: number): Date => {
               const d = new Date(ms);
               const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
               return new Date(utc + (3600000 * 7));
            };

            const getWeeklyIdOfDate = (gmt7: Date): string => {
               const d = new Date(gmt7.getTime());
               d.setHours(0, 0, 0, 0);
               d.setDate(d.getDate() + 4 - (d.getDay() || 7));
               const yearStart = new Date(d.getFullYear(), 0, 1);
               const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
               return `${d.getFullYear()}-W${weekNo}`;
            };

            commentsSnap.forEach((doc) => {
               const data = doc.data();
               if (data && data.createdAt) {
                  const createdAt = data.createdAt;
                  const createdMs = typeof createdAt === 'number' ? createdAt : (createdAt?.toMillis?.() || 0);
                  if (createdMs > 0) {
                     const commentGmt7 = toGMT7Date(createdMs);
                     
                     const commentDateStr = format(commentGmt7, 'yyyy-MM-dd');
                     if (commentDateStr === todayStr) {
                        commentsTodayCount++;
                     }
                     
                     const commentWeekId = getWeeklyIdOfDate(commentGmt7);
                     if (commentWeekId === currentWeekId) {
                        commentsThisWeekCount++;
                     }
                  }
               }
            });

            const ms = [...state.missions];
            let missionsUpdated = false;

            const d3 = ms.find(m => m.id === 'd3');
            if (d3) {
               const targetProgress = Math.min(d3.target, commentsTodayCount);
               if (d3.progress < targetProgress) {
                  d3.progress = targetProgress;
                  if (d3.progress >= d3.target) {
                     d3.completed = true;
                  }
                  missionsUpdated = true;
               }
            }

            const w3 = ms.find(m => m.id === 'w3');
            if (w3) {
               const targetProgress = Math.min(w3.target, commentsThisWeekCount);
               if (w3.progress < targetProgress) {
                  w3.progress = targetProgress;
                  if (w3.progress >= w3.target) {
                     w3.completed = true;
                  }
                  missionsUpdated = true;
               }
            }

            const nextState: any = {
               totalCommentsCount: commentsCount,
               sentMessagesCount: chatCount
            };

            if (missionsUpdated) {
               nextState.missions = ms;
               const allMs = { ...(state.allUsersMissions || {}) };
               allMs[uid] = ms;
               nextState.allUsersMissions = allMs;
               updates.missions = ms;
            }

            set(nextState);

            if (Object.keys(updates).length > 0) {
               await state.updateUserDoc(updates);
            }

            get()._triggerCountAchievementsCheck();
         } catch (e) {
            console.error("Lỗi đồng bộ dữ liệu người dùng từ máy chủ:", e);
         }
      },
      
      claimMission: (id: string) => {
          const state = get();
          const ms = [...state.missions];
          const m = ms.find(x => x.id === id);
          if (m && m.completed && !m.claimed) {
              m.claimed = true;
              const newChoco = state.choco + m.chocoReward;
              const newGolden = state.goldenChoco + m.goldenReward;
              const newTotalEarnedC = (state.totalEarnedChoco || 0) + m.chocoReward;
              const newTotalEarnedG = (state.totalEarnedGChoco || 0) + m.goldenReward;
              
              const uid = state.uid;
              const allMs = { ...(state.allUsersMissions || {}) };
              if (uid) {
                 allMs[uid] = ms;
              }

              set({ 
                 missions: ms, 
                 choco: newChoco, 
                 goldenChoco: newGolden,
                 totalEarnedChoco: newTotalEarnedC,
                 totalEarnedGChoco: newTotalEarnedG,
                 allUsersMissions: allMs
              });
              
              const updates: any = {
                 choco: newChoco,
                 $chocoDiff: m.chocoReward,
                 goldenChoco: newGolden,
                 $gchocoDiff: m.goldenReward,
                 totalEarnedChoco: newTotalEarnedC,
                 totalEarnedGChoco: newTotalEarnedG,
                 missions: ms
              };
              get().updateUserDoc(updates, `Nhận thưởng nhiệm vụ: ${m.id} - ${m.description}`);
              
              setTimeout(() => {
                 get()._triggerCountAchievementsCheck();
              }, 50);
          }
      },
      
      toggleSaveStory: (storyId: string) => {
          const state = get();
          if (!state.isLoggedIn) return;
          
          const isSaved = (state.savedStories || []).includes(storyId);
          let newSavedStories: string[];
          if (isSaved) {
             newSavedStories = (state.savedStories || []).filter(id => id !== storyId);
             addStoryFire(storyId, -1);
          } else {
             newSavedStories = [...(state.savedStories || []), storyId];
             addStoryFire(storyId, 1);
          }
          
          const uid = state.uid;
          const allSaved = { ...(state.allUsersSavedStories || {}) };
          if (uid) {
             allSaved[uid] = newSavedStories;
          }
          
          set({
             savedStories: newSavedStories,
             allUsersSavedStories: allSaved
          });
          
          get().updateUserDoc({ savedStories: newSavedStories });

          setTimeout(() => {
             get()._triggerCountAchievementsCheck();
          }, 50);
      },
      
      buyTicket: (type: 'pass' | 'priority' | 'streak', amount: number = 1) => {
         const state = get();
         if (!state.isLoggedIn) return;
         if (type === 'pass') {
             const newVal = (state.ownedPassTickets || 0) + amount;
             set({ ownedPassTickets: newVal });
             get().updateUserDoc({ ownedPassTickets: newVal });
         } else if (type === 'priority') {
             const newVal = (state.ownedPriorityTickets || 0) + amount;
             set({ ownedPriorityTickets: newVal });
             get().updateUserDoc({ ownedPriorityTickets: newVal });
         } else if (type === 'streak') {
             const newVal = (state.ownedStreakTickets || 0) + amount;
             set({ ownedStreakTickets: newVal });
             get().updateUserDoc({ ownedStreakTickets: newVal });
         }
      },
      
      useStreakTicket: () => {
          const state = get();
          if (!state.isLoggedIn || (state.ownedStreakTickets || 0) < 1) return false;
          if (state.activeStreakProtection) return false; // already active
          
          const newVal = (state.ownedStreakTickets || 0) - 1;
          set({ ownedStreakTickets: newVal, activeStreakProtection: true });
          get().updateUserDoc({ ownedStreakTickets: newVal, activeStreakProtection: true });
          return true;
      },
      
      consumePassTicket: (chapterId: string) => {
          const state = get();
          if (!state.isLoggedIn || (state.ownedPassTickets || 0) < 1) return false;
          if ((state.unlockedPassChapters || []).includes(chapterId)) return true; // Already unlocked

          const newVal = (state.ownedPassTickets || 0) - 1;
          const newUnlocked = [...(state.unlockedPassChapters || []), chapterId];
          set({ ownedPassTickets: newVal, unlockedPassChapters: newUnlocked });
          get().updateUserDoc({ ownedPassTickets: newVal, unlockedPassChapters: newUnlocked });
          return true;
      },

      consumePriorityTicket: (chapterId: string) => {
          const state = get();
          if (!state.isLoggedIn || (state.ownedPriorityTickets || 0) < 1) return false;
          if ((state.unlockedEarlyAccessChapters || []).includes(chapterId)) return true; // Already unlocked

          const newVal = (state.ownedPriorityTickets || 0) - 1;
          const newUnlocked = [...(state.unlockedEarlyAccessChapters || []), chapterId];
          set({ ownedPriorityTickets: newVal, unlockedEarlyAccessChapters: newUnlocked });
          get().updateUserDoc({ ownedPriorityTickets: newVal, unlockedEarlyAccessChapters: newUnlocked });
          return true;
      },
      
      addOwnedSticker: (stickerUrl: string) => {
         const state = get();
         if (!state.isLoggedIn || !state.uid) return;
         if ((state.ownedStickers || []).includes(stickerUrl)) return;
         
         const newOwned = [...(state.ownedStickers || []), stickerUrl];
         const uid = state.uid;
         const allOwned = { ...(state.allUsersOwnedStickers || {}) };
         allOwned[uid] = newOwned;
         
         set({
            ownedStickers: newOwned,
            allUsersOwnedStickers: allOwned
         });
         
         addDoc(collection(db, 'users', uid, 'owned_stickers'), {
            url: stickerUrl,
            acquiredAt: Date.now()
         }).catch(err => {
            console.error("Lỗi khi lưu sticker sở hữu vào subcollection:", err);
         });
      },
      
      equipSticker: (type: 'comment' | 'chat' | 'post', stickerUrl: string | null) => {
         const state = get();
         if (!state.isLoggedIn) return;
         
         const key = type === 'comment' ? 'equippedStickerComment' : type === 'chat' ? 'equippedStickerChat' : 'equippedStickerPost';
         const originalValue = state[key];

         set({ [key]: stickerUrl });
         get().updateUserDoc({ [key]: stickerUrl })
            .then(() => {
               get().propagateEquipmentChanges();
            })
            .catch((err) => {
               console.error("Lỗi khi trang bị sticker:", err);
               // Rollback local state
               set({ [key]: originalValue });
               alert(`Không thể trang bị sticker này: ${err?.message || String(err)}`);
            });
      },

      setStickerPosition: (type: 'comment' | 'post', pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
         const state = get();
         if (!state.isLoggedIn) return;
         
         const key = type === 'comment' ? 'stickerPositionComment' : 'stickerPositionPost';
         const originalValue = state[key];

         set({ [key]: pos });
         get().updateUserDoc({ [key]: pos })
            .then(() => {
               get().propagateEquipmentChanges();
            })
            .catch((err) => {
               console.error("Lỗi khi đổi vị trí sticker:", err);
               // Rollback local state
               set({ [key]: originalValue });
               alert(`Không thể thay đổi vị trí sticker: ${err?.message || String(err)}`);
            });
      },

      addOwnedAccessory: (accessoryUrl: string) => {
         const state = get();
         if (!state.isLoggedIn || !state.uid) return;
         if ((state.ownedAccessories || []).includes(accessoryUrl)) return;
         
         const newOwned = [...(state.ownedAccessories || []), accessoryUrl];
         const uid = state.uid;
         const allOwned = { ...(state.allUsersOwnedAccessories || {}) };
         allOwned[uid] = newOwned;
         
         set({
            ownedAccessories: newOwned,
            allUsersOwnedAccessories: allOwned
         });
         
         addDoc(collection(db, 'users', uid, 'owned_accessories'), {
            url: accessoryUrl,
            acquiredAt: Date.now()
         }).catch(err => {
            console.error("Lỗi khi lưu phụ kiện sở hữu vào subcollection:", err);
         });
      },
      
      equipAccessory: (accessoryUrl: string | null) => {
         const state = get();
         if (!state.isLoggedIn) return;
         
         set({ equippedAccessory: accessoryUrl });
         get().updateUserDoc({ equippedAccessory: accessoryUrl }).then(() => {
            get().propagateEquipmentChanges();
         });
      },

      addOwnedChucuAccessory: (url: string) => {
         const state = get();
         if (!state.isLoggedIn || !state.uid) return;
         if ((state.ownedChucuAccessories || []).includes(url)) return;
         const newOwned = [...(state.ownedChucuAccessories || []), url];
         set({ ownedChucuAccessories: newOwned });
         
         addDoc(collection(db, 'users', state.uid, 'owned_chucu_accessories'), {
            url,
            acquiredAt: Date.now()
         }).catch(err => {
            console.error("Lỗi khi lưu phụ kiện chucu sở hữu vào subcollection:", err);
         });
         
         setTimeout(() => {
            get()._triggerCountAchievementsCheck();
         }, 50);
      },

      equipChucuAccessory: (url: string | null) => {
         const state = get();
         if (!state.isLoggedIn) return;
         set({ equippedChucuAccessory: url });
         get().updateUserDoc({ equippedChucuAccessory: url });
      },

      setShowChucu: (show: boolean) => {
         const state = get();
         set({ showChucu: show });
         if (state.isLoggedIn) {
            get().updateUserDoc({ showChucu: show });
         }
       },

      setChucuGameOpen: (open: boolean) => {
         set({ isChucuGameOpen: open });
      },

      setChocoMatchOpen: (open: boolean) => {
         set({ isChocoMatchOpen: open });
      },

      setChocoRadioOpen: (open: boolean) => {
         set({ isChocoRadioOpen: open });
      },

      setGachaOpen: (open: boolean) => {
         set({ isGachaOpen: open });
      },

      setGachaAdminOpen: (open: boolean) => {
         set({ isGachaAdminOpen: open });
      },

      addChucuGameFragments: (amt: number) => {
         let current = get().chucuGameFragments || 0;
         if (current < 0) current = 0;
         set({ chucuGameFragments: current + amt });
         get().updateUserDoc({ chucuGameFragments: current + amt });
      },

      addChucuGameGFragments: (amt: number) => {
         let current = get().chucuGameGFragments || 0;
         if (current < 0) current = 0;
         set({ chucuGameGFragments: current + amt });
         get().updateUserDoc({ chucuGameGFragments: current + amt });
      },

      addChucuGameBonusPoints: (amt: number) => {
         let current = get().chucuGameBonusPoints || 0;
         if (current < 0) current = 0; // Auto-repair negative points
         set({ chucuGameBonusPoints: current + amt });
         get().updateUserDoc({ chucuGameBonusPoints: current + amt });
      },

      addGachaFragments: (amt: number) => {
         let current = get().gachaFragments || 0;
         if (current < 0) current = 0;
         set({ gachaFragments: current + amt });
         get().updateUserDoc({ gachaFragments: current + amt });
      },

      incrementChucuGamePlayCount: () => {
         const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
         const lastDate = get().chucuGameLastPlayDate;
         let count = get().chucuGamePlaysToday || 0;
         if (lastDate !== todayStr) {
           count = 1;
         } else {
           count += 1;
         }
         set({ chucuGamePlaysToday: count, chucuGameLastPlayDate: todayStr });
         get().updateUserDoc({ chucuGamePlaysToday: count, chucuGameLastPlayDate: todayStr });
      },

      finishChucuGame: (
         fragments: number,
         gFragments: number,
         bonusPoints: number,
         isNoRewardPlay: boolean,
         satietyDeduct: number,
         stats?: {
            maxConsecutiveCatches: number;
            totalCaught: number;
            goldMissed: boolean;
            hitBombOrApple: boolean;
            chocoMissed?: boolean;
            goldGenerated?: number;
         }
      ) => {
         const state = get();
         const updates: any = {};
         const nextState: any = {};
         
         // 1. Play count
         const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
         const lastDate = state.chucuGameLastPlayDate;
         let count = state.chucuGamePlaysToday || 0;
         if (lastDate !== todayStr) {
           count = 1;
         } else {
           count += 1;
         }
         nextState.chucuGamePlaysToday = count;
         nextState.chucuGameLastPlayDate = todayStr;
         updates.chucuGamePlaysToday = count;
         updates.chucuGameLastPlayDate = todayStr;

         // 2. Achievements stats
         if (stats) {
            const currentTotalChoco = state.totalChocoCaught || 0;
            const newTotalChoco = currentTotalChoco + stats.totalCaught;
            nextState.totalChocoCaught = newTotalChoco;
            updates.totalChocoCaught = newTotalChoco;

            const currentMaxConsecutive = state.maxConsecutiveChocoCount || 0;
            const newMaxConsecutive = Math.max(currentMaxConsecutive, stats.maxConsecutiveCatches);
            nextState.maxConsecutiveChocoCount = newMaxConsecutive;
            updates.maxConsecutiveChocoCount = newMaxConsecutive;

            const currentDodgeClears = state.consecutiveDodgeClears || 0;
            const newDodgeClears = stats.hitBombOrApple ? 0 : (currentDodgeClears + 1);
            nextState.consecutiveDodgeClears = newDodgeClears;
            updates.consecutiveDodgeClears = newDodgeClears;

            const currentGoldClears = state.consecutiveGoldClears || 0;
            let newGoldClears = currentGoldClears;
            if (stats.goldMissed) {
               newGoldClears = 0;
            } else if ((stats.goldGenerated || 0) > 0) {
               newGoldClears = currentGoldClears + 1;
            }
            nextState.consecutiveGoldClears = newGoldClears;
            updates.consecutiveGoldClears = newGoldClears;
         }

         // 3. Rewards (only if not no reward play)
         if (!isNoRewardPlay) {
            if (fragments > 0) {
               let curF = state.chucuGameFragments || 0;
               if (curF < 0) curF = 0;
               nextState.chucuGameFragments = curF + fragments;
               updates.chucuGameFragments = curF + fragments;
            }
            if (gFragments > 0) {
               let curG = state.chucuGameGFragments || 0;
               if (curG < 0) curG = 0;
               nextState.chucuGameGFragments = curG + gFragments;
               updates.chucuGameGFragments = curG + gFragments;
            }
            if (bonusPoints > 0) {
               let curP = state.chucuGameBonusPoints || 0;
               if (curP < 0) curP = 0;
               nextState.chucuGameBonusPoints = curP + bonusPoints;
               updates.chucuGameBonusPoints = curP + bonusPoints;
            }
         } else {
            // Deduct satiety
            const newSatiety = Math.max(0, (state.chucuSatiety || 70) - satietyDeduct);
            nextState.chucuSatiety = newSatiety;
            updates.chucuSatiety = newSatiety;
         }

         const currentMaxScore = state.chucuGameMaxScore || 0;
         if (bonusPoints > currentMaxScore) {
            nextState.chucuGameMaxScore = bonusPoints;
            updates.chucuGameMaxScore = bonusPoints;
         }

         set(nextState);
         get().updateUserDoc(updates);
         get()._triggerCountAchievementsCheck();
      },

      setAccessoryPosition: (pos: { x: number; y: number; scale: number; rotate: number }) => {
         const state = get();
         if (!state.isLoggedIn) return;
         
         set({ accessoryPosition: pos });
         get().updateUserDoc({ accessoryPosition: pos }).then(() => {
            get().propagateEquipmentChanges();
         });
      },

      giftChoco: (storyId: string, amount: number) => {
          const state = get();
          if (!state.isLoggedIn) return false;
          if (state.choco < amount || amount <= 0) return false;
          
          const newChoco = state.choco - amount;
          const newTotalSpent = (state.totalSpentChoco || 0) + amount;
          const newTotalGifted = (state.totalGiftedChoco || 0) + amount;
          const finalActivePoints = (state.activePoints || 0) + 1;

          set({ 
            choco: newChoco,
            totalSpentChoco: newTotalSpent,
            totalGiftedChoco: newTotalGifted,
            activePoints: finalActivePoints,
          });

          get().updateUserDoc({ 
            choco: newChoco,
            totalSpentChoco: newTotalSpent,
            totalGiftedChoco: newTotalGifted,
            $chocoDiff: -amount,
            activePoints: finalActivePoints,
          }, "Tặng Choco cho truyện");

          // Add fire points equal to gifted choco
          addStoryFire(storyId, amount);

          // Unlock generous_donor (gifting choco first time)
          get().unlockAchievement('generous_donor');

          get()._checkPerfectDailyDay();
          get()._triggerCountAchievementsCheck();
          return true;
      },

      // Achievements Actions
      unlockAchievement: (id: string) => {
        const state = get();
        if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;
        const currentUnlocked = state.unlockedAchievements || [];
        if (currentUnlocked.includes(id)) return;

        const newUnlocked = [...currentUnlocked, id];
        
        // Track locally per user for backup
        const allUnlocked = { ...(state.allUsersUnlockedAchievements || {}) };
        allUnlocked[state.uid] = newUnlocked;

        set({ 
          unlockedAchievements: newUnlocked,
          allUsersUnlockedAchievements: allUnlocked
        });
        get().updateUserDoc({ unlockedAchievements: newUnlocked });
      },

      claimAchievement: (id: string) => {
         const state = get();
         if (!state.isLoggedIn || !state.uid || !id || !state.isFirebaseSynced) return;
         const unlocked = state.unlockedAchievements || [];
         const claimed = state.claimedAchievements || [];
         
         if (!unlocked.includes(id)) return;
         if (claimed.includes(id)) return;
         
         const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
         if (!ach) return;
         
         const newClaimed = [...claimed, id];
         const newChoco = state.choco + ach.chocoReward;
         const newGolden = state.goldenChoco + ach.goldenReward;
         const newTotalEarnedChoco = (state.totalEarnedChoco || 0) + ach.chocoReward;
         const newTotalEarnedGChoco = (state.totalEarnedGChoco || 0) + ach.goldenReward;
         
         let addedTickets = 0;
         if (id === 'choco_kientri' || id === 'choco_suutam') {
            addedTickets = 10;
         }
         
         const allClaimed = { ...(state.allUsersClaimedAchievements || {}) };
         allClaimed[state.uid] = newClaimed;

         set({
            claimedAchievements: newClaimed,
            allUsersClaimedAchievements: allClaimed,
            choco: newChoco,
            goldenChoco: newGolden,
            totalEarnedChoco: newTotalEarnedChoco,
            totalEarnedGChoco: newTotalEarnedGChoco,
            ownedGachaTickets: (state.ownedGachaTickets || 0) + addedTickets
         });
         
         get().updateUserDoc({
            claimedAchievements: newClaimed,
            choco: newChoco,
            $chocoDiff: ach.chocoReward,
            goldenChoco: newGolden,
            $gchocoDiff: ach.goldenReward,
            totalEarnedChoco: newTotalEarnedChoco,
            totalEarnedGChoco: newTotalEarnedGChoco,
            ownedGachaTickets: (state.ownedGachaTickets || 0) + addedTickets
         }, `Nhận thưởng thành tựu: ${ach.name}`);
         
         get().gainExp(30);

         setTimeout(() => {
            get()._triggerCountAchievementsCheck();
         }, 50);
      },

      incrementSentMessages: () => {
         const state = get();
         if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;
         const newCount = (state.sentMessagesCount || 0) + 1;
         set({ sentMessagesCount: newCount });
         get().updateUserDoc({ sentMessagesCount: newCount });

         setTimeout(() => {
            get()._triggerCountAchievementsCheck();
         }, 50);
      },

      propagateEquipmentChanges: async () => {
         const state = get();
         if (!state.uid) return;
         
         const stickerUpdates: any = {};
         if (state.equippedStickerComment !== undefined) stickerUpdates.equippedSticker = state.equippedStickerComment;
         if (state.stickerPositionComment !== undefined) stickerUpdates.stickerPosition = state.stickerPositionComment;
         if (state.equippedStickerChat !== undefined) stickerUpdates.equippedStickerChat = state.equippedStickerChat;
         if (state.equippedStickerPost !== undefined) stickerUpdates.equippedStickerPost = state.equippedStickerPost;
         if (state.stickerPositionPost !== undefined) stickerUpdates.stickerPositionPost = state.stickerPositionPost;
         if (state.equippedAccessory !== undefined) stickerUpdates.equippedAccessory = state.equippedAccessory;
         if (state.accessoryPosition !== undefined) stickerUpdates.accessoryPosition = state.accessoryPosition;
         if (state.avatarUrl !== undefined) stickerUpdates.avatarUrl = state.avatarUrl;
         if (state.activeTitle !== undefined) stickerUpdates.activeTitle = state.activeTitle;
         if (state.displayName !== undefined) stickerUpdates.displayName = state.displayName;

         if (Object.keys(stickerUpdates).length === 0) return;

         try {
            let batch = writeBatch(db);
            let writeCount = 0;

            const commitBatchIfNeeded = async () => {
                if (writeCount >= 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    writeCount = 0;
                }
            };

            // Update News Feed
            const feedQ = query(collection(db, 'newsFeed'), where('uid', '==', state.uid), limit(500));
            const feedSnaps = await getDocs(feedQ);
            for (const d of feedSnaps.docs) { batch.update(d.ref, stickerUpdates); writeCount++; await commitBatchIfNeeded(); }

            // Update Chat
            const chatQ = query(collection(db, 'chatMessages'), where('uid', '==', state.uid), limit(500));
            const chatSnaps = await getDocs(chatQ);
            for (const d of chatSnaps.docs) { batch.update(d.ref, stickerUpdates); writeCount++; await commitBatchIfNeeded(); }

            // Update Comments
            const commQ = query(collection(db, 'comments'), where('uid', '==', state.uid), limit(500));
            const commSnaps = await getDocs(commQ);
            for (const d of commSnaps.docs) { batch.update(d.ref, stickerUpdates); writeCount++; await commitBatchIfNeeded(); }
            
            if (writeCount > 0) {
                await batch.commit();
            }
         } catch (err) {
            console.error("Lỗi đồng bộ phụ kiện:", err);
         }
      },

      checkChocoCuteAchievement: async () => {
         // Moved to week transition handler to avoid instant awards
      },

      _ensureActiveWeekCalculations: async () => {
         const state = get();
         if (!state.isLoggedIn || !state.uid) return;
         const currentWeek = getWeeklyId();
         const lastWeek = state.lastActiveWeek || '';
         
         if (!lastWeek) {
            set({ lastActiveWeek: currentWeek });
            get().updateUserDoc({ lastActiveWeek: currentWeek });
            return;
         }
         
         if (lastWeek !== currentWeek) {
            // Week changed! Checking Top 3 to award choco_cute final
            try {
               const userEmail = state.email || state.firebaseUser?.email || '';
               const isAdmin = userEmail.toLowerCase() === 'cucnau01@gmail.com';
               
               if (!isAdmin) {
                  const q = query(
                     collection(db, 'users'),
                     orderBy('activePoints', 'desc'),
                     limit(10)
                  );
                  const snap = await getDocs(q);
                  const activePlayers = snap.docs
                     .map(doc => ({ id: doc.id, ...doc.data() as any }))
                     .filter(u => u.email?.toLowerCase() !== 'cucnau01@gmail.com');
                  
                  const top3Uids = activePlayers.slice(0, 3).map(u => u.id);
                  if (top3Uids.includes(state.uid)) {
                     get().unlockAchievement('choco_cute');
                  }
               }
            } catch (e) {
               console.error('Error on week transition top 3 checking:', e);
            }
            
            // Set new week but DO NOT RESET activePoints
            set({ 
               lastActiveWeek: currentWeek,
               prevActiveWeek: lastWeek,
               prevActivePoints: state.activePoints || 0
            });
            get().updateUserDoc({ 
               lastActiveWeek: currentWeek,
               prevActiveWeek: lastWeek,
               prevActivePoints: state.activePoints || 0
            });
         }
      },

      _triggerCountAchievementsCheck: () => {
         const state = get();
         
         const currentUnlocked = state.unlockedAchievements || [];
         const newUnlocked = new Set(currentUnlocked);
         
         // Evaluate permanent missions progress dynamically
         const ms = reconcileMissions([...state.missions], state);
         let msChanged = false;
         
         ms.filter(m => m.type === 'permanent').forEach(p => {
             let newProg = p.progress;
             if (p.id.startsWith('p_checkin_')) {
                 newProg = Math.max(state.totalCheckIns || 0, state.checkInStreak || 0);
             } else if (p.id.startsWith('p_read_')) {
                 newProg = state.totalChaptersRead || 0;
             } else if (p.id.startsWith('p_comm_')) {
                 newProg = state.totalCommentsCount || 0;
             } else if (p.id.startsWith('p_level_')) {
                 newProg = state.level || 1;
             } else if (p.id.startsWith('p_chocomatchlvl_')) {
                 newProg = (state.chocoMatchLevel || 1) - 1;
             } else if (p.id.startsWith('p_gacha_')) {
                 newProg = state.totalGachaPulls || 0;
             } else if (p.id.startsWith('p_catch_')) {
                 newProg = state.totalChocoCaught || 0;
             } else if (p.id.startsWith('p_radio_')) {
                 newProg = Math.floor((state.totalRadioSeconds || 0) / 60);
             } else if (p.id.startsWith('p_spend_')) {
                 newProg = state.totalSpentChoco || 0;
             }
             
             if (newProg !== p.progress) {
                 p.progress = newProg;
                 if (p.progress >= p.target) p.completed = true;
                 msChanged = true;
             }
         });
         
         if (msChanged) {
            set({ missions: ms });
            get().updateUserDoc({ missions: ms });
            if (state.uid) {
               const allMs = { ...(state.allUsersMissions || {}) };
               allMs[state.uid] = ms;
               set({ allUsersMissions: allMs });
            }
         }
         
         const addAch = (id: string) => newUnlocked.add(id);

         if ((state.genresRead || []).length >= 5 && (state.readHistoryList || []).length >= 5) addAch('multi_genre');
         if ((state.savedStories || []).length >= 10) addAch('collector');
         if ((state.level || 1) >= 100) addAch('choco_high_level');
         if ((state.chocoMatchTilesDestroyed || 0) >= 100000) addAch('choco_destroyer');
         if ((state.chocoMatchColorBombsCreated || 0) >= 10000) addAch('choco_color_bomb');
         if ((state.chocoMatchSpecialCombos || 0) >= 10000) addAch('choco_special_combo');
         if ((state.totalEarnedChoco || 0) >= 10000) addAch('choco_king');
         if ((state.totalEarnedGChoco || 0) >= 10000) addAch('gchoco_king');
         if ((state.totalSpentChoco || 0) >= 10000) addAch('big_spender');
         if ((state.totalGiftedChoco || 0) > 0) addAch('generous_donor');
         if ((state.checkInStreak || 0) >= 7) addAch('streak_7');
         if ((state.totalCheckIns || 0) >= 30) addAch('monthly_checkin');
         if ((state.perfectDailyDates || []).length >= 7) addAch('weekly_missions_perfect');
         if ((state.sentMessagesCount || 0) >= 5000) addAch('chatty');
         if ((state.totalCommentsCount || 0) >= 100) addAch('commenter_choco');
         if ((state.sentMessagesCount || 0) >= 100) addAch('chatty_lounge');
         if ((state.totalChaptersRead || 0) >= 100) addAch('read_100_chapters');
         if ((state.ownedStickers || []).length >= 30) addAch('sticker_collector');
         if ((state.totalChaptersRead || 0) >= 500) addAch('choco_mot_sach');
         if ((state.totalCommentsCount || 0) >= 500) addAch('choco_tuong_tac');
         if ((state.chucuInteractions || 0) >= 500) addAch('chucu_friend_500');
         if ((state.chucuPremiumFeeds || 0) >= 100) addAch('chucu_an_sang');
         if ((state.chucuLevel || 1) >= 100) addAch('chucu_master_100');
         if ((state.ownedChucuAccessories || []).length >= 5) addAch('chucu_fashion_5');
         if ((state.maxConsecutiveChocoCount || 0) >= 20) addAch('choco_catch_no_miss');
         if ((state.totalChocoCaught || 0) >= 1000) addAch('choco_rain_1000');
         if ((state.totalChocoCaught || 0) >= 5000) addAch('choco_rain_5000');
         if ((state.totalChocoCaught || 0) >= 10000) addAch('choco_rain_10000');
         if ((state.consecutiveGoldClears || 0) >= 5) addAch('gold_choco_perfect');
         if ((state.consecutiveDodgeClears || 0) >= 5) addAch('dodge_negative_perfect');
         if ((state.radioNightChillSeconds || 0) >= 1800) addAch('radio_night_chill');
         if ((state.maxRadioTrackSeconds || 0) >= 3600) addAch('radio_one_track_love');
         if ((state.heardRadioTracks || []).length >= 10) addAch('radio_universe_explorer');
         if ((state.radioTrackSwitches || 0) >= 15) addAch('radio_track_switches');
         if ((state.gachaPity5Star || 0) >= 90) addAch('choco_kientri');
         if ((state.maxBannerCompletionPct || 0) >= 100) addAch('choco_suutam');

         if (newUnlocked.size > currentUnlocked.length) {
            const finalUnlocked = Array.from(newUnlocked);
            const allUnlocked = { ...(state.allUsersUnlockedAchievements || {}) };
            if (state.uid) allUnlocked[state.uid] = finalUnlocked;
            set({ unlockedAchievements: finalUnlocked, allUsersUnlockedAchievements: allUnlocked });
            get().updateUserDoc({ unlockedAchievements: finalUnlocked });
         }
      },

      _checkPerfectDailyDay: () => {
         const state = get();
         if (!state.isLoggedIn) return;
         const daily = state.missions.filter(m => m.type === 'daily');
         const allCompleted = daily.every(m => m.completed);
         if (allCompleted) {
            const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
            const pDates = state.perfectDailyDates || [];
            if (!pDates.includes(todayStr)) {
               const newPerfectDates = [...pDates, todayStr];
               set({ perfectDailyDates: newPerfectDates });
               get().updateUserDoc({ perfectDailyDates: newPerfectDates });
               
               if (newPerfectDates.length >= 7) {
                  get().unlockAchievement('weekly_missions_perfect');
               }
            }
         }
      },

      _checkResetMissions: () => {
         const state = get();
         if (!state.isLoggedIn || !state.uid || !state.isFirebaseSynced) return;

         const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
         const currentWeekId = getWeeklyId();

         let changed = false;
         let nextMissions = [...(state.missions || [])];
         let nextDailyResetDate = state.lastDailyResetDate || null;
         let nextWeeklyResetId = state.lastWeeklyResetId || null;

         // 1. Check Daily Reset (00:00 every day)
         if (!state.lastDailyResetDate || state.lastDailyResetDate !== todayStr) {
            console.log('Daily reset triggered, resetting daily missions');
            nextMissions = nextMissions.map(m => {
               if (m.type === 'daily') {
                  if (m.id === 'd1' && state.lastCheckInDate === todayStr) {
                     return { ...m, progress: 1, completed: true };
                  }
                  return { ...m, progress: 0, completed: false, claimed: false };
               }
               return m;
            });
            nextDailyResetDate = todayStr;
            changed = true;
         }

         let nextChucuGamePlaysToday = state.chucuGamePlaysToday;
         let nextChucuGameLastPlayDate = state.chucuGameLastPlayDate;
         if (state.chucuGameLastPlayDate && state.chucuGameLastPlayDate !== todayStr) {
            if (nextChucuGamePlaysToday !== 0) {
               nextChucuGamePlaysToday = 0;
               changed = true;
            }
         }

         // 2. Check Weekly Reset (00:00 Sunday -> Monday)
         if (!state.lastWeeklyResetId || state.lastWeeklyResetId !== currentWeekId) {
            console.log('Weekly reset triggered, resetting weekly missions');
            nextMissions = nextMissions.map(m => {
               if (m.type === 'weekly') {
                  return { ...m, progress: 0, completed: false, claimed: false };
               }
               return m;
            });
            nextWeeklyResetId = currentWeekId;
            changed = true;
         }

         if (changed) {
            const uid = state.uid;
            const allMs = { ...(state.allUsersMissions || {}) };
            if (uid) {
               allMs[uid] = nextMissions;
            }

            set({
               missions: nextMissions,
               lastDailyResetDate: nextDailyResetDate,
               lastWeeklyResetId: nextWeeklyResetId,
               allUsersMissions: allMs,
               chucuGamePlaysToday: nextChucuGamePlaysToday
            });

            get().updateUserDoc({
               lastDailyResetDate: nextDailyResetDate,
               lastWeeklyResetId: nextWeeklyResetId,
               missions: nextMissions,
               chucuGamePlaysToday: nextChucuGamePlaysToday
            });
         }
      }
    }),
    {
      name: 'truyen-storage',
      partialize: (state) => {
        const {
          firebaseUser,
          isQuotaExceeded,
          ...rest
        } = state;
        return rest as any;
      },
      merge: (persistedState: any, currentState: UserState) => {
         const merged = { ...currentState, ...persistedState };
         if (persistedState.missions) {
             merged.missions = reconcileMissions(persistedState.missions, persistedState);
         }
         return merged as UserState;
      }
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__setQuotaExceeded = (val: boolean) => {
    useStore.getState().setQuotaExceeded(val);
  };
}

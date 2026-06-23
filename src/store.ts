import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, differenceInDays } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';
import { db, checkIfQuotaError } from './lib/firebase';
import { doc, updateDoc, getDocs, collection, query, where, orderBy, limit, writeBatch, addDoc, deleteField } from 'firebase/firestore';
import { getWeeklyId, getPreviousWeeklyId, ACHIEVEMENTS_LIST, Achievement, getGMT7Date } from './types/achievements';
import { logTransaction } from './lib/transactions';

export function compressBase64Image(dataUrl: string, maxWidth = 180, maxHeight = 180, quality = 0.85): Promise<string> {
   return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
         resolve(dataUrl);
         return;
      }
      // If already small (<40KB), no need to compress
      if (dataUrl.length < 40000) {
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
  isChocoRadioOpen: boolean;
  setChocoRadioOpen: (open: boolean) => void;

  isGachaOpen: boolean;
  setGachaOpen: (open: boolean) => void;
  isGachaAdminOpen: boolean;
  setGachaAdminOpen: (open: boolean) => void;

  chucuGameFragments: number;
  chucuGameGFragments: number;
  chucuGameBonusPoints: number;
  chucuGamePlaysToday: number;
  chucuGameLastPlayDate: string | null;
  gachaFragments: number;

  addChucuGameFragments: (amt: number) => void;
  addChucuGameGFragments: (amt: number) => void;
  addChucuGameBonusPoints: (amt: number) => void;
  addGachaFragments: (amt: number) => void;
  incrementChucuGamePlayCount: () => void;
  finishChucuGame: (fragments: number, gFragments: number, bonusPoints: number, isNoRewardPlay: boolean, satietyDeduct: number) => void;

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
  totalCheckIns: number;
  perfectDailyDates: string[];
  sentMessagesCount: number;
  totalChaptersRead: number;
  totalCommentsCount: number;
  genresRead: string[];
  activePoints: number;
  lastActiveWeek: string;
  prevActivePoints: number;
  prevActiveWeek: string;
  activeTitle: string | null;
  setActiveTitle: (title: string | null) => void;
  isMaintenance: boolean;
  setMaintenance: (val: boolean) => void;
  customTitles: any[];
  customTitleColors: Record<string, string>;
  achTitleColors: Record<string, string>;
  setCustomTitleColors: (colors: Record<string, string>) => void;
  setAchievementColors: (colors: Record<string, string>) => void;
  getTitleColor: (title: string | null) => string | undefined;
  
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

export const getPermanentMissions = (): Mission[] => [
  { id: 'p1', type: 'permanent', description: 'Điểm danh 30 ngày', chocoReward: 30, goldenReward: 3, progress: 0, target: 30, completed: false, claimed: false },
  { id: 'p2', type: 'permanent', description: 'Điểm danh 60 ngày', chocoReward: 60, goldenReward: 6, progress: 0, target: 60, completed: false, claimed: false },
  { id: 'p3', type: 'permanent', description: 'Điểm danh 90 ngày', chocoReward: 90, goldenReward: 9, progress: 0, target: 90, completed: false, claimed: false },
];

export const reconcileMissions = (loadedMissions: Mission[]): Mission[] => {
  const defaults = [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions()];
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

      // Chucu Game & Radio default states
      isChucuGameOpen: false,
      isChocoRadioOpen: false,
      isGachaOpen: false,
      isGachaAdminOpen: false,
      chucuGameFragments: 0,
      chucuGameGFragments: 0,
      gachaFragments: 0,
      chucuGameBonusPoints: 0,
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
      totalCheckIns: 0,
      perfectDailyDates: [],
      sentMessagesCount: 0,
      totalChaptersRead: 0,
      totalCommentsCount: 0,
      genresRead: [],
      activePoints: 0,
      lastActiveWeek: '',
      prevActivePoints: 0,
      prevActiveWeek: '',
      activeTitle: null,
      setActiveTitle: (title) => {
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
        totalCheckIns: 0,
        perfectDailyDates: [],
        sentMessagesCount: 0,
        totalChaptersRead: 0,
        totalCommentsCount: 0,
        genresRead: [],
        activePoints: 0,
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
            let resolvedMissions = reconcileMissions(rawMissions);

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
            choco: data.choco !== undefined ? data.choco : state.choco,
            goldenChoco: data.goldenChoco !== undefined ? data.goldenChoco : state.goldenChoco,
            level: data.level !== undefined ? data.level : state.level,
            exp: data.exp !== undefined ? data.exp : state.exp,
            checkInStreak: data.checkInStreak !== undefined ? data.checkInStreak : state.checkInStreak,
            lastCheckInDate: data.lastCheckInDate !== undefined ? data.lastCheckInDate : state.lastCheckInDate,
            lastDailyResetDate: data.lastDailyResetDate !== undefined ? data.lastDailyResetDate : state.lastDailyResetDate,
            lastWeeklyResetId: data.lastWeeklyResetId !== undefined ? data.lastWeeklyResetId : state.lastWeeklyResetId,
            displayName: data.displayName !== undefined ? data.displayName : state.displayName,
            email: data.email !== undefined ? data.email : state.email,
            avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : state.avatarUrl,
            equippedStickerComment: data.equippedStickerComment !== undefined ? data.equippedStickerComment : (data.equippedStickerAvatar !== undefined ? data.equippedStickerAvatar : state.equippedStickerComment),
            stickerPositionComment: data.stickerPositionComment !== undefined ? data.stickerPositionComment : (data.stickerPositionAvatar !== undefined ? data.stickerPositionAvatar : state.stickerPositionComment),
            equippedStickerChat: data.equippedStickerChat !== undefined ? data.equippedStickerChat : state.equippedStickerChat,
            equippedStickerPost: data.equippedStickerPost !== undefined ? data.equippedStickerPost : state.equippedStickerPost,
            stickerPositionPost: data.stickerPositionPost !== undefined ? data.stickerPositionPost : state.stickerPositionPost,
            ownedStickers: data.ownedStickers !== undefined ? data.ownedStickers : state.ownedStickers,
            equippedAccessory: data.equippedAccessory !== undefined ? data.equippedAccessory : state.equippedAccessory,
            accessoryPosition: data.accessoryPosition !== undefined ? data.accessoryPosition : state.accessoryPosition,
            ownedAccessories: data.ownedAccessories !== undefined ? data.ownedAccessories : state.ownedAccessories,
            ownedChucuAccessories: data.ownedChucuAccessories !== undefined ? data.ownedChucuAccessories : state.ownedChucuAccessories,
            equippedChucuAccessory: data.equippedChucuAccessory !== undefined ? data.equippedChucuAccessory : state.equippedChucuAccessory,
            showChucu: data.showChucu !== undefined ? data.showChucu : true,
            ownedPassTickets: data.ownedPassTickets !== undefined ? data.ownedPassTickets : state.ownedPassTickets,
            ownedPriorityTickets: data.ownedPriorityTickets !== undefined ? data.ownedPriorityTickets : state.ownedPriorityTickets,
            ownedMysteryBoxes: data.ownedMysteryBoxes !== undefined ? data.ownedMysteryBoxes : state.ownedMysteryBoxes,
            ownedStreakTickets: data.ownedStreakTickets !== undefined ? data.ownedStreakTickets : state.ownedStreakTickets,
            ownedGachaTickets: data.ownedGachaTickets !== undefined ? data.ownedGachaTickets : state.ownedGachaTickets,
            gachaPity5Star: data.gachaPity5Star !== undefined ? data.gachaPity5Star : state.gachaPity5Star,
            gachaPity4Star: data.gachaPity4Star !== undefined ? data.gachaPity4Star : state.gachaPity4Star,
            activeStreakProtection: data.activeStreakProtection !== undefined ? data.activeStreakProtection : state.activeStreakProtection,
            lastFreeStreakRecoveryMonth: data.lastFreeStreakRecoveryMonth !== undefined ? data.lastFreeStreakRecoveryMonth : state.lastFreeStreakRecoveryMonth,
            lastClaimedRewardLevel: data.lastClaimedRewardLevel !== undefined ? data.lastClaimedRewardLevel : state.lastClaimedRewardLevel,
            savedStories: data.savedStories !== undefined ? data.savedStories : state.savedStories,
            unlockedPassChapters: data.unlockedPassChapters !== undefined ? data.unlockedPassChapters : state.unlockedPassChapters,
            unlockedEarlyAccessChapters: data.unlockedEarlyAccessChapters !== undefined ? data.unlockedEarlyAccessChapters : state.unlockedEarlyAccessChapters,
            missions: resolvedMissions,
            storyProgress: data.storyProgress !== undefined ? data.storyProgress : state.storyProgress,
            readHistoryList: data.readHistoryList !== undefined ? data.readHistoryList : state.readHistoryList,
            chucuLevel: data.chucuLevel !== undefined ? data.chucuLevel : state.chucuLevel,
            chucuExp: data.chucuExp !== undefined ? data.chucuExp : state.chucuExp,
            chucuSatiety: data.chucuSatiety !== undefined ? data.chucuSatiety : state.chucuSatiety,
            chucuHappiness: data.chucuHappiness !== undefined ? data.chucuHappiness : state.chucuHappiness,
            chucuInteractions: data.chucuInteractions !== undefined ? data.chucuInteractions : state.chucuInteractions,
            chucuPremiumFeeds: data.chucuPremiumFeeds !== undefined ? data.chucuPremiumFeeds : state.chucuPremiumFeeds,
            chucuLastTime: data.chucuLastTime !== undefined ? data.chucuLastTime : state.chucuLastTime,

            chucuGameFragments: data.chucuGameFragments !== undefined ? data.chucuGameFragments : state.chucuGameFragments,
            chucuGameGFragments: data.chucuGameGFragments !== undefined ? data.chucuGameGFragments : state.chucuGameGFragments,
            gachaFragments: data.gachaFragments !== undefined ? data.gachaFragments : state.gachaFragments,
            chucuGameBonusPoints: data.chucuGameBonusPoints !== undefined ? data.chucuGameBonusPoints : state.chucuGameBonusPoints,
            chucuGamePlaysToday: data.chucuGamePlaysToday !== undefined ? data.chucuGamePlaysToday : state.chucuGamePlaysToday,
            chucuGameLastPlayDate: data.chucuGameLastPlayDate !== undefined ? data.chucuGameLastPlayDate : state.chucuGameLastPlayDate,


            unlockedAchievements: data.unlockedAchievements !== undefined ? data.unlockedAchievements : state.unlockedAchievements,
            claimedAchievements: data.claimedAchievements !== undefined ? data.claimedAchievements : state.claimedAchievements,
            totalEarnedChoco: data.totalEarnedChoco !== undefined ? data.totalEarnedChoco : state.totalEarnedChoco,
            totalEarnedGChoco: data.totalEarnedGChoco !== undefined ? data.totalEarnedGChoco : state.totalEarnedGChoco,
            totalSpentChoco: data.totalSpentChoco !== undefined ? data.totalSpentChoco : state.totalSpentChoco,
            totalCheckIns: computedCheckIns !== undefined ? computedCheckIns : state.totalCheckIns,
            perfectDailyDates: data.perfectDailyDates !== undefined ? data.perfectDailyDates : state.perfectDailyDates,
            sentMessagesCount: data.sentMessagesCount !== undefined ? data.sentMessagesCount : state.sentMessagesCount,
            totalChaptersRead: computedChapters,
            totalCommentsCount: data.totalCommentsCount !== undefined ? data.totalCommentsCount : state.totalCommentsCount,
            genresRead: data.genresRead !== undefined ? data.genresRead : state.genresRead,
            activePoints: data.activePoints !== undefined ? data.activePoints : state.activePoints,
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
         
         const { choco: prevChoco, goldenChoco: prevGChoco } = state;

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

         try {
            const docUpdates: any = { ...updates };
            delete docUpdates.$chocoDiff;
            delete docUpdates.$gchocoDiff;
            
            // Hard delete obsolete fields permanently if they were accidentally requested in update
            const obsolete = ['allUsersUnlockedAchievements', 'allUsersClaimedAchievements', 'allUsersMissions', 'allUsersStoryProgress', 'allUsersReadHistoryList', 'allUsersSavedStories', 'allUsersOwnedStickers', 'allUsersOwnedAccessories'];
            obsolete.forEach(k => {
                if (k in docUpdates) {
                   docUpdates[k] = deleteField();
                }
            });

            // Tự động kiểm tra và phục hồi: nếu avatarUrl hiện tại quá lớn (>80KB Base64),
            // ta sẽ đè lên bằng một phiên bản nén siêu nhỏ để cứu document khỏi giới hạn 1MB của Firestore.
            const currentAvatarUrl = state.avatarUrl;
            if (currentAvatarUrl && currentAvatarUrl.startsWith('data:image/') && currentAvatarUrl.length > 80000) {
               const compressed = await compressBase64Image(currentAvatarUrl);
               docUpdates.avatarUrl = compressed;
               set({ avatarUrl: compressed });
            }

            // Nếu bản thân payload/updates chứa avatarUrl mới siêu lớn, nén ngay lập tức trước khi lưu
            if (docUpdates.avatarUrl && docUpdates.avatarUrl.startsWith('data:image/') && docUpdates.avatarUrl.length > 80000) {
               const compressed = await compressBase64Image(docUpdates.avatarUrl);
               docUpdates.avatarUrl = compressed;
               set({ avatarUrl: compressed });
            }

            await updateDoc(doc(db, 'users', uid), docUpdates);
         } catch (err) {
            console.error('Lỗi khi update user doc:', err);
            if (checkIfQuotaError(err)) {
               set({ isQuotaExceeded: true });
            }
         }
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
        if (!state.isLoggedIn) return;
        
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
        const ms = reconcileMissions([...state.missions]);
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
          if (state.goldenChoco >= amount) {
              set({ goldenChoco: state.goldenChoco - amount });
              get().updateUserDoc({ goldenChoco: state.goldenChoco - amount, $gchocoDiff: -amount }, reason);
              return true;
          }
          return false;
      },
      
      markStoryRead: (storyId, chapterOrder, genres) => {
        get()._checkResetMissions();
        const state = get();
        if (!state.isLoggedIn) return;
        
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
         if (!state.isLoggedIn) return;
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
              get().updateUserDoc(updates, "Nhận thưởng nhiệm vụ");
              
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
          } else {
             newSavedStories = [...(state.savedStories || []), storyId];
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
         get().updateUserDoc({ ownedChucuAccessories: newOwned });
         
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

      finishChucuGame: (fragments: number, gFragments: number, bonusPoints: number, isNoRewardPlay: boolean, satietyDeduct: number) => {
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

         // 2. Rewards (only if not no reward play)
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

         set(nextState);
         get().updateUserDoc(updates);
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
          const finalActivePoints = (state.activePoints || 0) + 1;

          set({ 
            choco: newChoco,
            activePoints: finalActivePoints,
          });

          get().updateUserDoc({ 
            choco: newChoco,
            $chocoDiff: -amount,
            activePoints: finalActivePoints,
          }, "Tặng Choco cho truyện");

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
         
         const allClaimed = { ...(state.allUsersClaimedAchievements || {}) };
         allClaimed[state.uid] = newClaimed;

         set({
            claimedAchievements: newClaimed,
            allUsersClaimedAchievements: allClaimed,
            choco: newChoco,
            goldenChoco: newGolden,
            totalEarnedChoco: newTotalEarnedChoco,
            totalEarnedGChoco: newTotalEarnedGChoco
         });
         
         get().updateUserDoc({
            claimedAchievements: newClaimed,
            choco: newChoco,
            $chocoDiff: ach.chocoReward,
            goldenChoco: newGolden,
            $gchocoDiff: ach.goldenReward,
            totalEarnedChoco: newTotalEarnedChoco,
            totalEarnedGChoco: newTotalEarnedGChoco
         }, `Nhận thưởng thành tựu: ${ach.name}`);
         
         get().gainExp(30);

         setTimeout(() => {
            get()._triggerCountAchievementsCheck();
         }, 50);
      },

      incrementSentMessages: () => {
         const state = get();
         if (!state.isLoggedIn) return;
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
            const feedQ = query(collection(db, 'newsFeed'), where('uid', '==', state.uid), orderBy('createdAt', 'desc'), limit(500));
            const feedSnaps = await getDocs(feedQ);
            for (const d of feedSnaps.docs) { batch.update(d.ref, stickerUpdates); writeCount++; await commitBatchIfNeeded(); }

            // Update Chat
            const chatQ = query(collection(db, 'chatMessages'), where('uid', '==', state.uid), orderBy('createdAt', 'desc'), limit(500));
            const chatSnaps = await getDocs(chatQ);
            for (const d of chatSnaps.docs) { batch.update(d.ref, stickerUpdates); writeCount++; await commitBatchIfNeeded(); }

            // Update Comments
            const commQ = query(collection(db, 'comments'), where('uid', '==', state.uid), orderBy('createdAt', 'desc'), limit(500));
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
         if (!state.isLoggedIn) return;
         
         const currentUnlocked = state.unlockedAchievements || [];
         
         // 3. Multi Genre fallback trigger
         if (!currentUnlocked.includes('multi_genre') && (state.genresRead || []).length >= 5 && (state.readHistoryList || []).length >= 5) {
             get().unlockAchievement('multi_genre');
         }

         // 4. Collector: Library has >= 10 stories
         if (!currentUnlocked.includes('collector') && (state.savedStories || []).length >= 10) {
            get().unlockAchievement('collector');
         }

         if (!currentUnlocked.includes('choco_high_level') && (state.level || 1) >= 100) {
            get().unlockAchievement('choco_high_level');
         }
         
         // 5. Vua Choco: total earned choco >= 10000
         if (!currentUnlocked.includes('choco_king') && (state.totalEarnedChoco || 0) >= 10000) {
            get().unlockAchievement('choco_king');
         }

          // 6. Bố Choco: total earned gchoco >= 10000
         if (!currentUnlocked.includes('gchoco_king') && (state.totalEarnedGChoco || 0) >= 10000) {
            get().unlockAchievement('gchoco_king');
         }

         // 7. Tiêu Nhiều Choco: total spent choco in store >= 10000
         if (!currentUnlocked.includes('big_spender') && (state.totalSpentChoco || 0) >= 10000) {
            get().unlockAchievement('big_spender');
         }

         if (!currentUnlocked.includes('generous_donor') && (state.totalSpentChoco || 0) > 0) {
            get().unlockAchievement('generous_donor');
         }

         // 8. Streak 7: checkInStreak >= 7
         if (!currentUnlocked.includes('streak_7') && (state.checkInStreak || 0) >= 7) {
            get().unlockAchievement('streak_7');
         }

         // 9. Monthly Checkin: totalCheckIns >= 30
         if (!currentUnlocked.includes('monthly_checkin') && (state.totalCheckIns || 0) >= 30) {
            get().unlockAchievement('monthly_checkin');
         }

         // 10. Perfect missions week: perfectDailyDates.length >= 7
         if (!currentUnlocked.includes('weekly_missions_perfect') && (state.perfectDailyDates || []).length >= 7) {
            get().unlockAchievement('weekly_missions_perfect');
         }

         // 11. Chatty: sentMessagesCount >= 5000
         if (!currentUnlocked.includes('chatty') && (state.sentMessagesCount || 0) >= 5000) {
            get().unlockAchievement('chatty');
         }

         // 12. Bình Luận Viên Choco: totalCommentsCount >= 100
         if (!currentUnlocked.includes('commenter_choco') && (state.totalCommentsCount || 0) >= 100) {
            get().unlockAchievement('commenter_choco');
         }

         // 13. Khách Quen Lounge: sentMessagesCount >= 100
         if (!currentUnlocked.includes('chatty_lounge') && (state.sentMessagesCount || 0) >= 100) {
            get().unlockAchievement('chatty_lounge');
         }

         // 14. Vừa Ăn Choco Vừa Đọc: totalChaptersRead >= 100
         if (!currentUnlocked.includes('read_100_chapters') && (state.totalChaptersRead || 0) >= 100) {
            get().unlockAchievement('read_100_chapters');
         }

         // 15. Choco Thích Thú: ownedStickers.length >= 30
         if (!currentUnlocked.includes('sticker_collector') && (state.ownedStickers || []).length >= 30) {
            get().unlockAchievement('sticker_collector');
         }

         // 16. Choco Mọt Sách: totalChaptersRead >= 500
         if (!currentUnlocked.includes('choco_mot_sach') && (state.totalChaptersRead || 0) >= 500) {
            get().unlockAchievement('choco_mot_sach');
         }

         // 17. Choco Tương Tác: totalCommentsCount >= 500
         if (!currentUnlocked.includes('choco_tuong_tac') && (state.totalCommentsCount || 0) >= 500) {
            get().unlockAchievement('choco_tuong_tac');
         }

         // 18. Bạn Thân Của Chucu: chucuInteractions >= 500
         if (!currentUnlocked.includes('chucu_friend_500') && (state.chucuInteractions || 0) >= 500) {
            get().unlockAchievement('chucu_friend_500');
         }

         // 19. Chucu Ăn Sang: chucuPremiumFeeds >= 100
         if (!currentUnlocked.includes('chucu_an_sang') && (state.chucuPremiumFeeds || 0) >= 100) {
            get().unlockAchievement('chucu_an_sang');
         }

         // 20. Huấn Luyện Viên Chucu: chucuLevel >= 100
         if (!currentUnlocked.includes('chucu_master_100') && (state.chucuLevel || 1) >= 100) {
            get().unlockAchievement('chucu_master_100');
         }

         // 21. Fashionista Chucu: ownedChucuAccessories.length >= 5
         if (!currentUnlocked.includes('chucu_fashion_5') && (state.ownedChucuAccessories || []).length >= 5) {
            get().unlockAchievement('chucu_fashion_5');
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
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__setQuotaExceeded = (val: boolean) => {
    useStore.getState().setQuotaExceeded(val);
  };
}

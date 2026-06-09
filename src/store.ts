import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, differenceInDays } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';
import { db, checkIfQuotaError } from './lib/firebase';
import { doc, updateDoc, getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { getWeeklyId, getPreviousWeeklyId, ACHIEVEMENTS_LIST, Achievement } from './types/achievements';

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
  equippedStickerAvatar: string | null;
  stickerPositionAvatar: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  equippedStickerChat: string | null;
  equippedStickerPost: string | null;
  stickerPositionPost: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  ownedStickers: string[];
  ownedPassTickets: number;
  ownedPriorityTickets: number;
  choco: number;
  goldenChoco: number;
  level: number;
  exp: number;
  checkInStreak: number;
  lastCheckInDate: string | null;
  lastDailyResetDate: string | null;
  lastWeeklyResetId: string | null;
  missions: Mission[];
  storyProgress: Record<string, number>; // storyId -> maxChapterRead
  readHistoryList: string[]; // storyIds
  savedStories: string[]; // saved storyIds
  unlockedPassChapters: string[]; // chapterIds
  unlockedEarlyAccessChapters: string[]; // chapterIds
  firebaseUser: FirebaseUser | null;
  
  isQuotaExceeded: boolean;
  setQuotaExceeded: (exceeded: boolean) => void;
  
  // Per-uid historical record dictionaries
  allUsersMissions: Record<string, Mission[]>;
  allUsersStoryProgress: Record<string, Record<string, number>>;
  allUsersReadHistoryList: Record<string, string[]>;
  allUsersSavedStories: Record<string, string[]>;
  allUsersUnlockedAchievements: Record<string, string[]>;
  allUsersClaimedAchievements: Record<string, string[]>;
  allUsersOwnedStickers: Record<string, string[]>;

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
  
  isStoreOpen: boolean;
  isMissionsOpen: boolean;
  isAchievementsOpen: boolean;
  isInventoryOpen: boolean;
  setStoreOpen: (open: boolean) => void;
  setMissionsOpen: (open: boolean) => void;
  setAchievementsOpen: (open: boolean) => void;
  setInventoryOpen: (open: boolean) => void;

  login: (name: string) => void;
  logout: () => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  syncFromFirebase: (data: any) => void;
  
  checkIn: () => void;
  gainExp: (amount: number) => void;
  addChoco: (amount: number) => void;
  addGoldenChoco: (amount: number) => void;
  buyTicket: (type: 'pass' | 'priority', amount?: number) => void;
  consumePassTicket: (chapterId: string) => boolean;
  consumePriorityTicket: (chapterId: string) => boolean;
  spendChoco: (amount: number) => boolean;
  spendGoldenChoco: (amount: number) => boolean;
  
  markStoryRead: (storyId: string, chapterOrder: number, genres?: string[]) => void;
  addCommentProgress: () => void;
  toggleSaveStory: (storyId: string) => void;
  giftChoco: (storyId: string, amount: number) => boolean;
  addOwnedSticker: (stickerUrl: string) => void;
  equipSticker: (type: 'avatar' | 'chat' | 'post', stickerUrl: string | null) => void;
  setStickerPosition: (type: 'avatar' | 'post', pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void;
  
  claimMission: (id: string) => void;
  updateUserDoc: (updates: any) => Promise<void>;

  // Achievements Actions
  unlockAchievement: (id: string) => void;
  claimAchievement: (id: string) => void;
  incrementSentMessages: () => void;
  checkChocoCuteAchievement: () => Promise<void>;
  _ensureActiveWeekCalculations: () => Promise<void>;
  _triggerCountAchievementsCheck: () => void;
  _checkPerfectDailyDay: () => void;
  _checkResetMissions: () => void;
}

const getDailyMissions = (): Mission[] => [
  { id: 'd1', type: 'daily', description: 'Điểm danh ngày', chocoReward: 1, goldenReward: 0, progress: 0, target: 1,  completed: false, claimed: false },
  { id: 'd2', type: 'daily', description: 'Đọc 1 chương truyện', chocoReward: 1, goldenReward: 0, progress: 0, target: 1, completed: false, claimed: false },
  { id: 'd3', type: 'daily', description: 'Bình luận truyện 1 lần', chocoReward: 2, goldenReward: 0, progress: 0, target: 1, completed: false, claimed: false },
];

const getWeeklyMissions = (): Mission[] => [
  { id: 'w1', type: 'weekly', description: 'Điểm danh 5 ngày trong tuần', chocoReward: 5, goldenReward: 1, progress: 0, target: 5, completed: false, claimed: false },
  { id: 'w2', type: 'weekly', description: 'Đọc 10 chương truyện', chocoReward: 10, goldenReward: 1, progress: 0, target: 10, completed: false, claimed: false },
  { id: 'w3', type: 'weekly', description: 'Bình luận 10 lần', chocoReward: 20, goldenReward: 1, progress: 0, target: 10, completed: false, claimed: false },
];

const getPermanentMissions = (): Mission[] => [
  { id: 'p1', type: 'permanent', description: 'Điểm danh 30 ngày', chocoReward: 30, goldenReward: 3, progress: 0, target: 30, completed: false, claimed: false },
  { id: 'p2', type: 'permanent', description: 'Điểm danh 60 ngày', chocoReward: 60, goldenReward: 6, progress: 0, target: 60, completed: false, claimed: false },
  { id: 'p3', type: 'permanent', description: 'Điểm danh 90 ngày', chocoReward: 90, goldenReward: 9, progress: 0, target: 90, completed: false, claimed: false },
];

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      uid: null,
      displayName: null,
      email: null,
      avatarUrl: null,
      equippedStickerAvatar: null,
      stickerPositionAvatar: 'top-right',
      equippedStickerChat: null,
      equippedStickerPost: null,
      stickerPositionPost: 'top-right',
      ownedStickers: [],
      ownedPassTickets: 0,
      ownedPriorityTickets: 0,
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
      
      isQuotaExceeded: false,
      setQuotaExceeded: (exceeded) => set({ isQuotaExceeded: exceeded }),
      allUsersMissions: {},
      allUsersStoryProgress: {},
      allUsersReadHistoryList: {},
      allUsersSavedStories: {},
      allUsersUnlockedAchievements: {},
      allUsersClaimedAchievements: {},
      allUsersOwnedStickers: {},

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
      
      isStoreOpen: false,
      isMissionsOpen: false,
      isAchievementsOpen: false,
      isInventoryOpen: false,
      setStoreOpen: (open) => set({ isStoreOpen: open }),
      setMissionsOpen: (open) => set({ isMissionsOpen: open }),
      setAchievementsOpen: (open) => set({ isAchievementsOpen: open }),
      setInventoryOpen: (open) => set({ isInventoryOpen: open }),
      
      login: (name: string) => set({ isLoggedIn: true, displayName: name }),
      logout: () => set({ 
        isLoggedIn: false, 
        uid: null, 
        displayName: null, 
        firebaseUser: null, 
        email: null, 
        avatarUrl: null,
        equippedStickerAvatar: null,
        stickerPositionAvatar: 'top-right',
        equippedStickerChat: null,
        equippedStickerPost: null,
        stickerPositionPost: 'top-right',
        ownedStickers: [],
        ownedPassTickets: 0,
        ownedPriorityTickets: 0,
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
            const allUnlocked = state.allUsersUnlockedAchievements || {};
            const allClaimed = state.allUsersClaimedAchievements || {};
            
            const userMissions = allMs[uid] || [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions()];
            const userProgress = allSp[uid] || {};
            const userHistory = allHl[uid] || [];
            const userSaved = allSaved[uid] || [];
            const userOwnedStickers = allOwnedStickers[uid] || [];
            const userUnlocked = allUnlocked[uid] || [];
            const userClaimed = allClaimed[uid] || [];

            set({ 
               firebaseUser: user, 
               isLoggedIn: true, 
               uid,
               email: user.email || state.email || '',
               displayName: user.displayName || state.displayName || 'Reader ' + uid.slice(0,4),
               avatarUrl: user.photoURL || state.avatarUrl || '',
               missions: userMissions,
               storyProgress: userProgress,
               readHistoryList: userHistory,
               savedStories: userSaved,
               unlockedPassChapters: (user as any).unlockedPassChapters || [],
               unlockedEarlyAccessChapters: (user as any).unlockedEarlyAccessChapters || [],
               ownedStickers: userOwnedStickers,
               ownedPassTickets: (user as any).ownedPassTickets || 0,
               ownedPriorityTickets: (user as any).ownedPriorityTickets || 0,
               unlockedAchievements: userUnlocked,
               claimedAchievements: userClaimed
            });
         } else {
            set({ 
               firebaseUser: null, 
               isLoggedIn: false, 
               uid: null,
               missions: [...getDailyMissions(), ...getWeeklyMissions(), ...getPermanentMissions()],
               storyProgress: {},
               readHistoryList: [],
               savedStories: [],
               unlockedPassChapters: [],
               unlockedEarlyAccessChapters: [],
               ownedStickers: [],
               ownedPassTickets: 0,
               ownedPriorityTickets: 0,
               unlockedAchievements: [],
               claimedAchievements: []
            });
         }
      },
      syncFromFirebase: (data) => {
         set((state) => {
            return {
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
            equippedStickerAvatar: data.equippedStickerAvatar !== undefined ? data.equippedStickerAvatar : state.equippedStickerAvatar,
            stickerPositionAvatar: data.stickerPositionAvatar !== undefined ? data.stickerPositionAvatar : state.stickerPositionAvatar,
            equippedStickerChat: data.equippedStickerChat !== undefined ? data.equippedStickerChat : state.equippedStickerChat,
            equippedStickerPost: data.equippedStickerPost !== undefined ? data.equippedStickerPost : state.equippedStickerPost,
            stickerPositionPost: data.stickerPositionPost !== undefined ? data.stickerPositionPost : state.stickerPositionPost,
            ownedStickers: data.ownedStickers !== undefined ? data.ownedStickers : state.ownedStickers,
            ownedPassTickets: data.ownedPassTickets !== undefined ? data.ownedPassTickets : state.ownedPassTickets,
            ownedPriorityTickets: data.ownedPriorityTickets !== undefined ? data.ownedPriorityTickets : state.ownedPriorityTickets,
            savedStories: data.savedStories !== undefined ? data.savedStories : state.savedStories,
            unlockedPassChapters: data.unlockedPassChapters !== undefined ? data.unlockedPassChapters : state.unlockedPassChapters,
            unlockedEarlyAccessChapters: data.unlockedEarlyAccessChapters !== undefined ? data.unlockedEarlyAccessChapters : state.unlockedEarlyAccessChapters,

            unlockedAchievements: data.unlockedAchievements !== undefined ? data.unlockedAchievements : state.unlockedAchievements,
            claimedAchievements: data.claimedAchievements !== undefined ? data.claimedAchievements : state.claimedAchievements,
            totalEarnedChoco: data.totalEarnedChoco !== undefined ? data.totalEarnedChoco : state.totalEarnedChoco,
            totalEarnedGChoco: data.totalEarnedGChoco !== undefined ? data.totalEarnedGChoco : state.totalEarnedGChoco,
            totalSpentChoco: data.totalSpentChoco !== undefined ? data.totalSpentChoco : state.totalSpentChoco,
            totalCheckIns: data.totalCheckIns !== undefined ? data.totalCheckIns : state.totalCheckIns,
            perfectDailyDates: data.perfectDailyDates !== undefined ? data.perfectDailyDates : state.perfectDailyDates,
            sentMessagesCount: data.sentMessagesCount !== undefined ? data.sentMessagesCount : state.sentMessagesCount,
            totalChaptersRead: data.totalChaptersRead !== undefined ? data.totalChaptersRead : state.totalChaptersRead,
            totalCommentsCount: data.totalCommentsCount !== undefined ? data.totalCommentsCount : state.totalCommentsCount,
            genresRead: data.genresRead !== undefined ? data.genresRead : state.genresRead,
            activePoints: data.activePoints !== undefined ? data.activePoints : state.activePoints,
            lastActiveWeek: data.lastActiveWeek !== undefined ? data.lastActiveWeek : state.lastActiveWeek,
            prevActivePoints: data.prevActivePoints !== undefined ? data.prevActivePoints : state.prevActivePoints,
            prevActiveWeek: data.prevActiveWeek !== undefined ? data.prevActiveWeek : state.prevActiveWeek,
            activeTitle: data.activeTitle !== undefined ? data.activeTitle : state.activeTitle,
            };
         });
         get()._checkResetMissions();
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

      updateUserDoc: async (updates: any) => {
         const { uid } = get();
         if (uid) {
            // Optimistically update local state
            set((state) => {
               const newState: any = {};
               Object.keys(updates).forEach(key => {
                  if (key in state) {
                     newState[key] = updates[key];
                  }
               });
               return newState;
            });

            try {
               await updateDoc(doc(db, 'users', uid), updates);
            } catch (err) {
               console.error('Lỗi khi update user doc:', err);
               if (checkIfQuotaError(err)) {
                  set({ isQuotaExceeded: true });
               }
               throw err;
            }
         }
      },
      
      checkIn: () => {
        get()._checkResetMissions();
        const state = get();
        if (!state.isLoggedIn) return;
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (state.lastCheckInDate === todayStr) return; // Already checked in
        
        let newStreak = 1;
        if (state.lastCheckInDate) {
           const daysDiff = differenceInDays(new Date(), new Date(state.lastCheckInDate));
           if (daysDiff === 1) {
               newStreak = state.checkInStreak + 1;
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
        const ms = [...state.missions];
        const dCheck = ms.find(m => m.id === 'd1');
        if (dCheck) { dCheck.progress = 1; dCheck.completed = true; }
        
        const wCheck = ms.find(m => m.id === 'w1');
        if (wCheck) { wCheck.progress += 1; if (wCheck.progress >= wCheck.target) wCheck.completed = true; }
        
        ms.filter(m => m.type === 'permanent' && m.description.includes('Điểm danh')).forEach(pCheck => {
           pCheck.progress = newStreak;
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
        const newTotalCheckins = (state.totalCheckIns || 0) + 1;

        set({ 
            lastCheckInDate: todayStr, 
            checkInStreak: newStreak, 
            choco: newChoco,
            totalEarnedChoco: newTotalEarnedChoco,
            totalCheckIns: newTotalCheckins,
            missions: ms,
            allUsersMissions: allMs
        });
        
        get().updateUserDoc({
            lastCheckInDate: todayStr,
            checkInStreak: newStreak,
            choco: newChoco,
            totalEarnedChoco: newTotalEarnedChoco,
            totalCheckIns: newTotalCheckins,
        });
        
        get().gainExp(10);
        get()._checkPerfectDailyDay();
        get()._triggerCountAchievementsCheck();
      },
      
      addChoco: (amount) => {
          set((state) => {
              const newChoco = state.choco + amount;
              const newTotalEarned = (state.totalEarnedChoco || 0) + amount;
              get().updateUserDoc({ choco: newChoco, totalEarnedChoco: newTotalEarned });
              
              setTimeout(() => {
                 get()._triggerCountAchievementsCheck();
              }, 50);

              return { choco: newChoco, totalEarnedChoco: newTotalEarned };
          });
      },
      addGoldenChoco: (amount) => {
          set((state) => {
              const newGolden = state.goldenChoco + amount;
              const newTotalEarnedG = (state.totalEarnedGChoco || 0) + amount;
              get().updateUserDoc({ goldenChoco: newGolden, totalEarnedGChoco: newTotalEarnedG });

              setTimeout(() => {
                 get()._triggerCountAchievementsCheck();
              }, 50);

              return { goldenChoco: newGolden, totalEarnedGChoco: newTotalEarnedG };
          });
      },
      spendChoco: (amount) => {
          const state = get();
          if (state.choco >= amount) {
              const newChoco = state.choco - amount;
              const newTotalSpent = (state.totalSpentChoco || 0) + amount;
              set({ choco: newChoco, totalSpentChoco: newTotalSpent });
              get().updateUserDoc({ choco: newChoco, totalSpentChoco: newTotalSpent });

              setTimeout(() => {
                 get()._triggerCountAchievementsCheck();
              }, 50);

              return true;
          }
          return false;
      },
      spendGoldenChoco: (amount) => {
          const state = get();
          if (state.goldenChoco >= amount) {
              set({ goldenChoco: state.goldenChoco - amount });
              get().updateUserDoc({ goldenChoco: state.goldenChoco - amount });
              return true;
          }
          return false;
      },
      
      markStoryRead: (storyId, chapterOrder, genres) => {
        get()._checkResetMissions();
        const state = get();
        if (!state.isLoggedIn) return;
        
        const currentProgress = state.storyProgress[storyId] || 0;
        let isNewChapter = false;
        
        if (chapterOrder > currentProgress) {
             isNewChapter = true;
        }

        const newProgress = { ...state.storyProgress, [storyId]: Math.max(currentProgress, chapterOrder) };
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

        // 3. Multi Genre: 5 unique genres read AND at least 5 stories read
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
           totalEarnedChoco: newTotalEarned,
           totalCommentsCount: newCommentsCount,
           activePoints: finalActivePoints,
         });

         get().gainExp(5);
         get()._checkPerfectDailyDay();
         get()._triggerCountAchievementsCheck();
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
                 goldenChoco: newGolden,
                 totalEarnedChoco: newTotalEarnedC,
                 totalEarnedGChoco: newTotalEarnedG
              };
              get().updateUserDoc(updates);
              
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
      
      buyTicket: (type: 'pass' | 'priority', amount: number = 1) => {
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
         }
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
         
         get().updateUserDoc({ ownedStickers: newOwned });
      },
      
      equipSticker: (type: 'avatar' | 'chat' | 'post', stickerUrl: string | null) => {
         const state = get();
         if (!state.isLoggedIn) return;
         
         const key = type === 'avatar' ? 'equippedStickerAvatar' : type === 'chat' ? 'equippedStickerChat' : 'equippedStickerPost';
         set({ [key]: stickerUrl });
         get().updateUserDoc({ [key]: stickerUrl });
      },

      setStickerPosition: (type: 'avatar' | 'post', pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
         const state = get();
         if (!state.isLoggedIn) return;
         
         const key = type === 'avatar' ? 'stickerPositionAvatar' : 'stickerPositionPost';
         set({ [key]: pos });
         get().updateUserDoc({ [key]: pos });
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
            activePoints: finalActivePoints,
          });

          // Unlock generous_donor (gifting choco first time)
          get().unlockAchievement('generous_donor');

          get()._checkPerfectDailyDay();
          get()._triggerCountAchievementsCheck();
          return true;
      },

      // Achievements Actions
      unlockAchievement: (id: string) => {
        const state = get();
        if (!state.isLoggedIn || !state.uid) return;
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
         if (!state.isLoggedIn || !state.uid || !id) return;
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
            goldenChoco: newGolden,
            totalEarnedChoco: newTotalEarnedChoco,
            totalEarnedGChoco: newTotalEarnedGChoco
         });
         
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
               const q = query(
                  collection(db, 'users'),
                  orderBy('activePoints', 'desc'),
                  limit(3)
               );
               const snap = await getDocs(q);
               const topUids = snap.docs.map(doc => doc.id);
               if (topUids.includes(state.uid)) {
                  get().unlockAchievement('choco_cute');
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
         
         // 4. Collector: Library has >= 10 stories
         if (!currentUnlocked.includes('collector') && (state.savedStories || []).length >= 10) {
            get().unlockAchievement('collector');
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
      },

      _checkPerfectDailyDay: () => {
         const state = get();
         if (!state.isLoggedIn) return;
         const daily = state.missions.filter(m => m.type === 'daily');
         const allCompleted = daily.every(m => m.completed);
         if (allCompleted) {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
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
         if (!state.isLoggedIn || !state.uid) return;

         const todayStr = format(new Date(), 'yyyy-MM-dd');
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
                  return { ...m, progress: 0, completed: false, claimed: false };
               }
               return m;
            });
            nextDailyResetDate = todayStr;
            changed = true;
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
               allUsersMissions: allMs
            });

            get().updateUserDoc({
               lastDailyResetDate: nextDailyResetDate,
               lastWeeklyResetId: nextWeeklyResetId
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

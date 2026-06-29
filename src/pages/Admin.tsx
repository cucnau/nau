import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { format, subDays } from "date-fns";
import { generateSlug } from "../lib/slug";
import { CHUCU_PRESET_ACCESSORIES, getChucuAccessoryPreview } from "../components/ChucuPresetAccessories";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  collectionGroup,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Trash2,
  Plus,
  Edit,
  ShieldAlert,
  CheckCircle,
  Smile,
  BookOpen,
  Users,
  Save,
  MessageSquare,
  Award,
  Sparkles,
  FileText,
  MessageCircle,
  ShoppingBag,
  Wrench,
  Radio,
  Music,
  Dices,
  Lock,
  Unlock,
} from "lucide-react";
import { ACHIEVEMENTS_LIST } from "../types/achievements";
import { FEATURES_LIST } from "../types/features";

const getGMT7Date = (): Date => {
  try {
    const options = { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false } as const;
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const second = parts.find(p => p.type === 'second')?.value;
    
    if (year && month && day && hour && minute && second) {
      return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    }
  } catch (e) {
    console.error('Error in robust getGMT7Date, falling back:', e);
  }
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 7));
};


interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
  genres: string[];
  chapterCount: number;
  completed?: boolean;
  externalUrl?: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  isPasswordProtected?: boolean;
  requiresPass?: boolean;
  requiresEarlyAccess?: boolean;
  isLockedRead?: boolean;
  externalUrl?: string;
}

interface CustomTitle {
  id: string;
  name: string;
  color: string;
}

interface AdminUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  choco: number;
  goldenChoco: number;
  isBanned?: boolean;
  banExpiresAt?: number | null;
  customTitles?: CustomTitle[];
  claimedAchievements?: string[];
  unlockedAchievements?: string[];
  level?: number;
  exp?: number;
  activePoints?: number;
  chucuLevel?: number;
  chucuExp?: number;
  chucuSatiety?: number;
  chucuHappiness?: number;
  chucuInteractions?: number;
  chucuPremiumFeeds?: number;
  totalChaptersRead?: number;
  totalCommentsCount?: number;
  checkInStreak?: number;
  lastCheckInDate?: string | null;
  ownedStreakTickets?: number;
  totalCheckIns?: number;
  totalGachaPulls?: number;
  gachaPity5Star?: number;
  gachaPity4Star?: number;
  ownedGachaTickets?: number;
}

interface AdminComment {
  id: string;
  targetId: string;
  uid: string;
  displayName: string;
  content: string;
  type: string;
  createdAt: any;
  storyTitle?: string;
  storyId?: string;
  chapterTitle?: string;
  giftAmount?: number;
}

export function Admin() {
  const { email, firebaseUser, theme, isMaintenance } = useStore();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<
    | "stories"
    | "users"
    | "comments"
    | "messages"
    | "stickers"
    | "posts"
    | "titles"
    | "accessories"
    | "chucu_accessories"
    | "radio"
    | "gacha"
    | "system"
    | "features"
  >("stories");

  // Custom Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    text: string;
    action: () => void;
  } | null>(null);

  // States for feature levels configuration
  const { featureLevels } = useStore();
  const [localFeatureLevels, setLocalFeatureLevels] = useState<Record<string, number>>({});
  const [savingFeatures, setSavingFeatures] = useState(false);

  useEffect(() => {
    if (featureLevels) {
      const initial: Record<string, number> = {};
      FEATURES_LIST.forEach((f) => {
        initial[f.id] = featureLevels[f.id] !== undefined ? Number(featureLevels[f.id]) : f.defaultLevel;
      });
      setLocalFeatureLevels(initial);
    }
  }, [featureLevels]);

  const handleSaveFeatureLevels = async () => {
    setSavingFeatures(true);
    try {
      const { setDoc, doc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "feature_levels"), localFeatureLevels, { merge: true });
      alert("Đã lưu cấu hình cấp độ tính năng thành công!");
    } catch (err) {
      console.error("Lỗi khi lưu cấp độ tính năng:", err);
      alert("Lỗi: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingFeatures(false);
    }
  };

  const [restorationLogs, setRestorationLogs] = useState<string[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);

  // States for duplicate scanner and revoker
  const [duplicateLogs, setDuplicateLogs] = useState<string[]>([]);
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [isRevokingDuplicates, setIsRevokingDuplicates] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState<{
    totalScanned: number;
    totalDuplicatesFound: number;
    totalChocoToRevoke: number;
    totalGChocoToRevoke: number;
    usersWithDuplicates: Array<{
      userId: string;
      displayName: string;
      email: string;
      currentChoco: number;
      currentGChoco: number;
      chocoToRevoke: number;
      gchocoToRevoke: number;
      duplicates: Array<{
        type: 'achievement' | 'mission_id' | 'mission_legacy';
        detail: string;
        amount: number;
        currency: 'choco' | 'gchoco';
        createdAtStr: string;
        txId: string;
      }>;
    }>;
  } | null>(null);

  // States for targeted single-user audit module
  const [auditingUser, setAuditingUser] = useState<any | null>(null);
  const [auditReport, setAuditReport] = useState<any | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  const runChocoRestoration = async () => {
    setIsRestoring(true);
    setRestorationLogs(["Bắt đầu tiến trình TRUY QUÉT TOÀN DIỆN và ĐỐI SOÁT khôi phục dữ liệu cho tất cả thành viên..."]);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      setRestorationLogs(prev => [...prev, `Tìm thấy ${users.length} thành viên.`]);

      // Tải các banner gacha để phân loại độ hiếm nhãn dán
      const bannersSnap = await getDocs(collection(db, "gacha_banners"));
      const banners = bannersSnap.docs.map(doc => doc.data() as any);
      const stickerRarities = new Map<string, number>();
      banners.forEach(b => {
        if (b.pool5Star) {
          b.pool5Star.forEach((item: any) => {
            if (item.image) stickerRarities.set(item.image, 5);
          });
        }
        if (b.featured5Star) {
          const item = b.featured5Star;
          if (item.image) stickerRarities.set(item.image, 5);
        }
        if (b.pool4Star) {
          b.pool4Star.forEach((item: any) => {
            if (item.image) stickerRarities.set(item.image, 4);
          });
        }
        if (b.featured4Stars) {
          b.featured4Stars.forEach((item: any) => {
            if (item.image) stickerRarities.set(item.image, 4);
          });
        }
      });

      // Tải các vật phẩm Gacha để bổ sung chính xác độ hiếm nhãn dán
      try {
        const gachaItemsSnap = await getDocs(collection(db, "gacha_items"));
        gachaItemsSnap.docs.forEach(doc => {
          const item = doc.data();
          if (item.image && item.rarity) {
            stickerRarities.set(item.image, Number(item.rarity));
          }
        });
      } catch (gachaItemsErr) {
        console.warn("Không thể tải bổ sung danh sách gacha_items:", gachaItemsErr);
      }

      // Tải các vật phẩm trong cửa hàng để truy quét giá trị tài sản đang sở hữu
      const storeStickersSnap = await getDocs(collection(db, "store_stickers"));
      const storeAccessoriesSnap = await getDocs(collection(db, "store_accessories"));
      const storeChucuAccessoriesSnap = await getDocs(collection(db, "store_chucu_accessories"));

      const stickerPrices = new Map<string, { price: number; currency: string }>();
      storeStickersSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.url) {
          stickerPrices.set(data.url, { 
            price: Number(data.price) || 0, 
            currency: (data.type || 'choco').toLowerCase() 
          });
        }
      });

      const accessoryPrices = new Map<string, { price: number; currency: string }>();
      storeAccessoriesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.url) {
          accessoryPrices.set(data.url, { 
            price: Number(data.price) || 0, 
            currency: (data.type || 'choco').toLowerCase() 
          });
        }
      });

      const chucuAccessoryPrices = new Map<string, { price: number; currency: string }>();
      storeChucuAccessoriesSnap.docs.forEach(doc => {
        const data = doc.data();
        const key = data.url || data.id;
        if (key) {
          chucuAccessoryPrices.set(key, { 
            price: Number(data.price) || 0, 
            currency: (data.type || 'choco').toLowerCase() 
          });
        }
      });

      let restoredCount = 0;

      for (const u of users) {
        setRestorationLogs(prev => [
          ...prev, 
          `--------------------------------------------------------------------------------`, 
          `🔍 Đang phân tích & đối soát toàn diện: ${u.displayName || u.email || u.id}...`
        ]);
        
        // 1. Fetch subcollections và các hoạt động thực tế từ mọi ngóc ngách
        const txSnap = await getDocs(collection(db, `users/${u.id}/transactions`));
        const txs = txSnap.docs.map(doc => doc.data());
        
        const stickersSnap = await getDocs(collection(db, `users/${u.id}/owned_stickers`));
        const currentStickerUrls = new Set(stickersSnap.docs.map(doc => doc.data().url).filter(Boolean));
        
        const accessoriesSnap = await getDocs(collection(db, `users/${u.id}/owned_accessories`));
        const currentAccessoryUrls = new Set(accessoriesSnap.docs.map(doc => doc.data().url).filter(Boolean));

        // Quét thêm "mọi ngóc ngách": bình luận, tin nhắn chat, bài viết từ DB thực tế
        const commentsSnap = await getDocs(query(collection(db, "comments"), where("uid", "==", u.id)));
        const actualCommentsCount = commentsSnap.size;

        const chatSnap = await getDocs(query(collection(db, "chatMessages"), where("uid", "==", u.id)));
        const actualChatCount = chatSnap.size;

        const feedSnap = await getDocs(query(collection(db, "newsFeed"), where("uid", "==", u.id)));
        const actualFeedCount = feedSnap.size;
        
        // Sort transactions ascending by timestamp
        const getTxTime = (tx: any) => {
          if (!tx.createdAt) return 0;
          if (typeof tx.createdAt.toMillis === 'function') return tx.createdAt.toMillis();
          if (tx.createdAt.seconds !== undefined) return tx.createdAt.seconds * 1000;
          return new Date(tx.createdAt).getTime() || 0;
        };
        const sortedTxs = [...txs].sort((a, b) => getTxTime(a) - getTxTime(b));

        // 2. Reconstruct balances & analyze activities
        let calculatedEarnedChoco = 0;
        let calculatedEarnedGChoco = 0;
        let calculatedSpentChoco = 0;
        let calculatedSpentGChoco = 0;
        
        let conversionEarnedGChoco = 0;
        let adminGiftsChoco = 0;
        let adminGiftsGChoco = 0;
        
        const txBoughtStickerUrls = new Set<string>();
        const txBoughtAccessoryUrls = new Set<string>();
        const txUnlockedChapters = new Set<string>();
        const txUnlockedEarlyAccessChapters = new Set<string>();
        const restoredAchievements = new Set<string>();
        const checkInDates = new Set<string>();
        
        let playCountChocoMatch = 0;
        let playCountChucuGame = 0;
        let gachaDrawCount = 0;
        let commentsCount = 0;

        sortedTxs.forEach(t => {
          if (t.isDuplicateRevoked) return;
          const desc = t.description || t.reason || "";
          const isRevocation = 
            desc.includes("Thu hồi") || desc.includes("thu hồi") || 
            desc.includes("Khấu trừ") || desc.includes("khấu trừ") || 
            desc.includes("Revoke") || desc.includes("revoke") ||
            desc.includes("Admin") || desc.includes("admin") ||
            desc.includes("Cập nhật") || desc.includes("cập nhật") ||
            desc.includes("Điều chỉnh") || desc.includes("điều chỉnh") ||
            desc.includes("Trừ") || desc.includes("trừ") ||
            desc.includes("Bị trừ") || desc.includes("bị trừ") ||
            desc.includes("Phạt") || desc.includes("phạt");
          if (isRevocation) return;

          const amt = Number(t.amount) || 0;
          const isSpecialEarn = desc.includes("Admin") || desc.includes("Tặng") || desc.includes("Quà") || desc.includes("gift") || desc.includes("Bù") || desc.includes("Khôi phục");
          
          if (t.currency === 'choco') {
            if (t.type === 'earn') {
              calculatedEarnedChoco += amt;
              if (isSpecialEarn) {
                adminGiftsChoco += amt;
              }
            } else if (t.type === 'spend') {
              calculatedSpentChoco += amt;
            }
          } else if (t.currency === 'gchoco') {
            if (t.type === 'earn') {
              calculatedEarnedGChoco += amt;
              if (desc.includes("Đổi") || desc.includes("convert")) {
                conversionEarnedGChoco += amt;
              }
              if (isSpecialEarn) {
                adminGiftsGChoco += amt;
              }
            } else if (t.type === 'spend') {
              calculatedSpentGChoco += amt;
            }
          }

          // Check if this was a check-in
          if (desc.includes("Điểm danh")) {
            const tTime = getTxTime(t);
            if (tTime) {
               const dateStr = format(new Date(tTime), 'yyyy-MM-dd');
               checkInDates.add(dateStr);
            }
          }

          // Check if this is a game play
          if (desc.includes("Choco Match") || desc.includes("Choco_Match") || desc.includes("ChocoMatch")) {
            playCountChocoMatch++;
          }
          if (desc.includes("Chucu") || desc.includes("Hứng Choco") || desc.includes("Nuôi Chucu")) {
            playCountChucuGame++;
          }
          if (desc.includes("Gacha")) {
            gachaDrawCount++;
          }
          if (desc.includes("Bình luận") || desc.includes("comment")) {
            commentsCount++;
          }

          // Detect Sticker/Accessory purchases from image URLs or names
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urlMatches = desc.match(urlRegex);
          if (urlMatches) {
            urlMatches.forEach((url: string) => {
              const cleanedUrl = url.trim();
              if (cleanedUrl.includes("sticker") || cleanedUrl.includes("gacha") || cleanedUrl.includes("nhan_dan")) {
                txBoughtStickerUrls.add(cleanedUrl);
              } else if (cleanedUrl.includes("accessory") || cleanedUrl.includes("phu_kien") || cleanedUrl.includes("pet")) {
                txBoughtAccessoryUrls.add(cleanedUrl);
              }
            });
          }

          // Parse explicit chapters
          if (desc.includes("Mở khóa chương") || desc.includes("Mở khóa sớm")) {
             const chapMatch = desc.match(/chương\s*([a-zA-Z0-9_\-]+)/i) || desc.match(/chapter\s*([a-zA-Z0-9_\-]+)/i);
             if (chapMatch) {
               if (desc.includes("sớm") || desc.includes("early")) {
                 txUnlockedEarlyAccessChapters.add(chapMatch[1].trim());
               } else {
                 txUnlockedChapters.add(chapMatch[1].trim());
               }
             }
          }

          // Detect achievements
          const match = desc.match(/Nhận thưởng thành tựu:\s*(.+)/);
          if (match) {
            const achName = match[1].trim();
            const foundAch = ACHIEVEMENTS_LIST.find(a => a.name.trim().toLowerCase() === achName.toLowerCase());
            if (foundAch) {
              restoredAchievements.add(foundAch.id);
            }
          }
        });

        let spentChocoFromAssets = 0;
        let spentGChocoFromAssets = 0;

        currentStickerUrls.forEach(url => {
          const asset = stickerPrices.get(url);
          if (asset) {
            if (asset.currency === 'gchoco') spentGChocoFromAssets += asset.price;
            else spentChocoFromAssets += asset.price;
          }
        });

        currentAccessoryUrls.forEach(url => {
          const asset = accessoryPrices.get(url);
          if (asset) {
            if (asset.currency === 'gchoco') spentGChocoFromAssets += asset.price;
            else spentChocoFromAssets += asset.price;
          }
        });

        const ownedChucuAccs = Array.isArray(u.ownedChucuAccessories) ? u.ownedChucuAccessories : [];
        ownedChucuAccs.forEach((accKey: string) => {
          const asset = chucuAccessoryPrices.get(accKey);
          if (asset) {
            if (asset.currency === 'gchoco') spentGChocoFromAssets += asset.price;
            else spentChocoFromAssets += asset.price;
          }
        });

        // Điều chỉnh calculatedSpentChoco/GChoco theo giá trị tài sản sở hữu thực tế để không bị thiếu hụt chi tiêu do mất giao dịch
        calculatedSpentChoco = Math.max(calculatedSpentChoco, spentChocoFromAssets);
        calculatedSpentGChoco = Math.max(calculatedSpentGChoco, spentGChocoFromAssets);

        const uChoco = u.choco || 0;
        const uGChoco = u.goldenChoco || 0;

        // Restore using last transaction with balanceAfter + following deltas
        let finalCalculatedChoco = uChoco;
        let lastChocoTxIndex = -1;
        for (let i = sortedTxs.length - 1; i >= 0; i--) {
          const t = sortedTxs[i];
          if (t.currency === 'choco' && t.balanceAfter !== undefined && t.balanceAfter !== null) {
            lastChocoTxIndex = i;
            break;
          }
        }

        if (lastChocoTxIndex !== -1) {
          let bal = Number(sortedTxs[lastChocoTxIndex].balanceAfter);
          for (let i = lastChocoTxIndex + 1; i < sortedTxs.length; i++) {
            const t = sortedTxs[i];
            if (t.currency === 'choco') {
              const amt = Number(t.amount) || 0;
              if (t.type === 'earn') bal += amt;
              else if (t.type === 'spend') bal -= amt;
            }
          }
          finalCalculatedChoco = Math.max(0, bal);
        } else {
          if (sortedTxs.some(t => t.currency === 'choco')) {
            let sumChoco = 0;
            sortedTxs.forEach(t => {
              if (t.currency === 'choco') {
                const amt = Number(t.amount) || 0;
                if (t.type === 'earn') sumChoco += amt;
                else if (t.type === 'spend') sumChoco -= amt;
              }
            });
            finalCalculatedChoco = Math.max(uChoco, sumChoco);
          }
        }

        let finalCalculatedGChoco = uGChoco;
        let lastGChocoTxIndex = -1;
        for (let i = sortedTxs.length - 1; i >= 0; i--) {
          const t = sortedTxs[i];
          if (t.currency === 'gchoco' && t.balanceAfter !== undefined && t.balanceAfter !== null) {
            lastGChocoTxIndex = i;
            break;
          }
        }

        if (lastGChocoTxIndex !== -1) {
          let bal = Number(sortedTxs[lastGChocoTxIndex].balanceAfter);
          for (let i = lastGChocoTxIndex + 1; i < sortedTxs.length; i++) {
            const t = sortedTxs[i];
            if (t.currency === 'gchoco') {
              const amt = Number(t.amount) || 0;
              if (t.type === 'earn') bal += amt;
              else if (t.type === 'spend') bal -= amt;
            }
          }
          finalCalculatedGChoco = Math.max(0, bal);
        } else {
          if (sortedTxs.some(t => t.currency === 'gchoco')) {
            let sumGChoco = 0;
            sortedTxs.forEach(t => {
              if (t.currency === 'gchoco') {
                const amt = Number(t.amount) || 0;
                if (t.type === 'earn') sumGChoco += amt;
                else if (t.type === 'spend') sumGChoco -= amt;
              }
            });
            finalCalculatedGChoco = Math.max(uGChoco, sumGChoco);
          }
        }

        // Compute check-in streak dynamically from dates
        const sortedCheckInDates = Array.from(checkInDates).sort().reverse();
        let calculatedStreak = u.checkInStreak || 0;
        
        if (sortedCheckInDates.length > 0) {
          const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
          const yesterdayStr = format(new Date(getGMT7Date().getTime() - 24*60*60*1000), 'yyyy-MM-dd');
          
          let startStr = "";
          if (sortedCheckInDates.includes(todayStr)) {
            startStr = todayStr;
          } else if (sortedCheckInDates.includes(yesterdayStr)) {
            startStr = yesterdayStr;
          }
          
          if (startStr !== "") {
            let tempStreak = 0;
            let currentCheck = new Date(startStr + 'T00:00:00Z');
            while (true) {
              const checkStr = format(currentCheck, 'yyyy-MM-dd');
              if (sortedCheckInDates.includes(checkStr)) {
                tempStreak++;
                currentCheck = new Date(currentCheck.getTime() - 24*60*60*1000);
              } else {
                break;
              }
            }
            calculatedStreak = Math.max(u.checkInStreak || 0, tempStreak);
          }
        }

        // Reconstruct EXP and Level
        const totalCheckIns = Math.max(u.totalCheckIns || 0, checkInDates.size);
        const totalChaptersRead = u.totalChaptersRead || 0;
        const totalComments = u.totalCommentsCount || 0;
        const currentUnlockedAchievementsCount = (u.unlockedAchievements || []).length;
        
        // Est: 10 exp check-in, 3 exp reading, 5 exp comment, 30 exp achievements
        const totalEstimatedExp = (totalCheckIns * 10) + (totalChaptersRead * 3) + (totalComments * 5) + (currentUnlockedAchievementsCount * 30);
        
        let calculatedLevel = 1;
        let remainingExp = totalEstimatedExp;
        while (true) {
          const expNeeded = calculatedLevel * 100;
          if (remainingExp >= expNeeded) {
             remainingExp -= expNeeded;
             calculatedLevel++;
          } else {
             break;
          }
        }
        
        if ((u.level || 1) > calculatedLevel) {
          calculatedLevel = u.level || 1;
          remainingExp = u.exp || 0;
        }

        const mergedUnlocked = new Set<string>(Array.isArray(u.unlockedAchievements) ? u.unlockedAchievements : []);
        const mergedClaimed = new Set<string>(Array.isArray(u.claimedAchievements) ? u.claimedAchievements : []);

        // Determine sticker and accessory gaps
        const missingStickerUrlsToRestore = [...txBoughtStickerUrls].filter(url => !currentStickerUrls.has(url));
        const missingAccessoryUrlsToRestore = [...txBoughtAccessoryUrls].filter(url => !currentAccessoryUrls.has(url));

        // Tái dựng số lượng Vé Gacha đã sử dụng từ lịch sử giao dịch mua vé
        let ticketsFromTxs = 0;
        sortedTxs.forEach(t => {
          const desc = t.description || t.reason || "";
          if (desc.includes("Vé Gacha") || desc.includes("Gacha")) {
            const match = desc.match(/(?:Mua|Đổi\s+sang|Đổi|Tặng)\s*(\d+)/i) || desc.match(/(\d+)\s*Vé/i);
            if (match) {
              ticketsFromTxs += parseInt(match[1], 10);
            }
          }
        });

        // Tái dựng Bảo hiểm Gacha (Pity) theo trình tự thời gian nhận nhãn dán
        const sortedStickersWithRarity = stickersSnap.docs
          .map(doc => {
            const data = doc.data();
            const url = data.url || "";
            const rarity = stickerRarities.get(url) || 3; // Mặc định là 3 sao
            
            let time = 0;
            if (data.createdAt) {
              if (typeof data.createdAt.toMillis === 'function') {
                time = data.createdAt.toMillis();
              } else if (data.createdAt.seconds !== undefined) {
                time = data.createdAt.seconds * 1000;
              } else {
                time = new Date(data.createdAt).getTime() || 0;
              }
            }
            return { url, rarity, time };
          })
          .sort((a, b) => a.time - b.time);

        const maxPullsFromTxs = Math.max(0, ticketsFromTxs - (u.ownedGachaTickets || 0));
        const minPullsFromStickers = sortedStickersWithRarity.length;
        const reconstructedTotalPulls = Math.max(u.totalGachaPulls || 0, maxPullsFromTxs, minPullsFromStickers);

        let calculatedPity5 = u.gachaPity5Star !== undefined && u.gachaPity5Star !== null ? u.gachaPity5Star : -1;
        let calculatedPity4 = u.gachaPity4Star !== undefined && u.gachaPity4Star !== null ? u.gachaPity4Star : -1;
        const totalPulls = reconstructedTotalPulls;
        const totalUniqueStickers = sortedStickersWithRarity.length;
        
        // Tái dựng Bảo hiểm 5⭐ từ lịch sử nhãn dán nếu chưa có
        if (calculatedPity5 === -1) {
          if (totalPulls > 0) {
            if (totalUniqueStickers > 0) {
              const last5StarIndex = sortedStickersWithRarity.map(s => s.rarity).lastIndexOf(5);
              if (last5StarIndex === -1) {
                calculatedPity5 = totalPulls;
              } else {
                const stickersAfterLast5 = sortedStickersWithRarity.slice(last5StarIndex + 1);
                const uniqueCountAfterLast5 = stickersAfterLast5.length;
                const pullsPerUniqueSticker = totalPulls / totalUniqueStickers;
                const estimatedPullsAfterLast5 = Math.round(uniqueCountAfterLast5 * pullsPerUniqueSticker);
                calculatedPity5 = Math.max(uniqueCountAfterLast5, estimatedPullsAfterLast5);
              }
            } else {
              calculatedPity5 = totalPulls;
            }
          } else {
            calculatedPity5 = 0;
          }
          calculatedPity5 = Math.min(calculatedPity5, 89);
          if (totalUniqueStickers > 0) {
            const count5Star = sortedStickersWithRarity.filter(s => s.rarity === 5).length;
            if (count5Star === 0 && totalPulls >= 90) {
              calculatedPity5 = totalPulls % 90;
            }
          } else if (totalPulls >= 90) {
            calculatedPity5 = totalPulls % 90;
          }
        }

        // Tái dựng Bảo hiểm 4⭐ từ lịch sử nhãn dán nếu chưa có
        if (calculatedPity4 === -1) {
          if (totalPulls > 0) {
            if (totalUniqueStickers > 0) {
              const last4StarIndex = sortedStickersWithRarity.map(s => s.rarity).lastIndexOf(4);
              if (last4StarIndex === -1) {
                calculatedPity4 = totalPulls;
              } else {
                const stickersAfterLast4 = sortedStickersWithRarity.slice(last4StarIndex + 1);
                const uniqueCountAfterLast4 = stickersAfterLast4.length;
                const pullsPerUniqueSticker = totalPulls / totalUniqueStickers;
                const estimatedPullsAfterLast4 = Math.round(uniqueCountAfterLast4 * pullsPerUniqueSticker);
                calculatedPity4 = Math.max(uniqueCountAfterLast4, estimatedPullsAfterLast4);
              }
            } else {
              calculatedPity4 = totalPulls;
            }
          } else {
            calculatedPity4 = 0;
          }
          calculatedPity4 = Math.min(calculatedPity4, 9);
          if (totalUniqueStickers > 0) {
            const count4Star = sortedStickersWithRarity.filter(s => s.rarity === 4).length;
            if (count4Star === 0 && totalPulls >= 10) {
              calculatedPity4 = totalPulls % 10;
            }
          } else if (totalPulls >= 10) {
            calculatedPity4 = totalPulls % 10;
          }
        }

        // Evaluate achievements
        // Reading category
        if (totalChaptersRead >= 1) mergedUnlocked.add('first_chapter');
        if (totalChaptersRead >= 3) {
          mergedUnlocked.add('midnight_read');
          mergedUnlocked.add('early_morning_read');
        }
        if (totalChaptersRead >= 100) mergedUnlocked.add('read_100_chapters');
        if (totalChaptersRead >= 500) mergedUnlocked.add('choco_mot_sach');
        const genresRead = Array.isArray(u.genresRead) ? u.genresRead : [];
        if (genresRead.length >= 5 || totalChaptersRead >= 10) mergedUnlocked.add('multi_genre');
        const savedStories = Array.isArray(u.savedStories) ? u.savedStories : [];
        if (savedStories.length >= 10) mergedUnlocked.add('collector');

        // Community category
        if (actualFeedCount >= 1) mergedUnlocked.add('blogger_choco_new');
        if (totalComments >= 100 || u.totalCommentsCount >= 100) mergedUnlocked.add('commenter_choco');
        if (totalComments >= 500 || u.totalCommentsCount >= 500) mergedUnlocked.add('choco_tuong_tac');
        if (actualChatCount >= 100 || u.sentMessagesCount >= 100) mergedUnlocked.add('chatty_lounge');
        if (actualChatCount >= 5000 || u.sentMessagesCount >= 5000) mergedUnlocked.add('chatty');
        const totalGiftedChoco = Number(u.totalGiftedChoco) || 0;
        if (totalGiftedChoco > 0) mergedUnlocked.add('generous_donor');

        // Activity category
        if (calculatedStreak >= 7 || u.checkInStreak >= 7) mergedUnlocked.add('streak_7');
        if (totalCheckIns >= 30 || u.totalCheckIns >= 30) mergedUnlocked.add('monthly_checkin');
        const perfectDailyDates = Array.isArray(u.perfectDailyDates) ? u.perfectDailyDates : [];
        if (perfectDailyDates.length >= 7) mergedUnlocked.add('weekly_missions_perfect');

        // Economy & Gacha category
        if (stickersSnap.size >= 30) mergedUnlocked.add('sticker_collector');
        if (calculatedSpentChoco >= 10000 || u.totalSpentChoco >= 10000) mergedUnlocked.add('big_spender');
        if (calculatedPity5 >= 90 || totalPulls >= 90 || u.totalGachaPulls >= 90) mergedUnlocked.add('choco_kientri');
        if (u.maxBannerCompletionPct >= 100) mergedUnlocked.add('choco_suutam');
        
        // Gaming category
        if (u.chucuInteractions >= 500) mergedUnlocked.add('chucu_friend_500');
        if (u.chucuPremiumFeeds >= 100) mergedUnlocked.add('chucu_an_sang');
        if (u.chucuLevel >= 100) mergedUnlocked.add('chucu_master_100');
        const ownedChucuAccessories = Array.isArray(u.ownedChucuAccessories) ? u.ownedChucuAccessories : [];
        if (ownedChucuAccessories.length >= 5) mergedUnlocked.add('chucu_fashion_5');
        if (u.maxConsecutiveChocoCount >= 20) mergedUnlocked.add('choco_catch_no_miss');
        const totalChocoCaught = Number(u.totalChocoCaught) || 0;
        if (totalChocoCaught >= 1000) mergedUnlocked.add('choco_rain_1000');
        if (totalChocoCaught >= 5000) mergedUnlocked.add('choco_rain_5000');
        if (totalChocoCaught >= 10000) mergedUnlocked.add('choco_rain_10000');
        if (u.consecutiveGoldClears >= 5) mergedUnlocked.add('gold_choco_perfect');
        if (u.consecutiveDodgeClears >= 5) mergedUnlocked.add('dodge_negative_perfect');
        if (u.chocoMatchTilesDestroyed >= 100000) mergedUnlocked.add('choco_destroyer');
        if (u.chocoMatchColorBombsCreated >= 10000) mergedUnlocked.add('choco_color_bomb');
        if (u.chocoMatchSpecialCombos >= 10000) mergedUnlocked.add('choco_special_combo');

        // Radio category
        if (u.radioNightChillSeconds >= 1800) mergedUnlocked.add('radio_night_chill');
        if (u.maxRadioTrackSeconds >= 3600) mergedUnlocked.add('radio_one_track_love');
        const heardRadioTracks = Array.isArray(u.heardRadioTracks) ? u.heardRadioTracks : [];
        if (heardRadioTracks.length >= 10) mergedUnlocked.add('radio_universe_explorer');
        if (u.radioTrackSwitches >= 15) mergedUnlocked.add('radio_track_switches');

        // Legend category
        if (calculatedLevel >= 100 || u.level >= 100) mergedUnlocked.add('choco_high_level');
        if (calculatedEarnedChoco >= 10000 || u.totalEarnedChoco >= 10000) mergedUnlocked.add('choco_king');
        if (calculatedEarnedGChoco >= 10000 || u.totalEarnedGChoco >= 10000) mergedUnlocked.add('gchoco_king');

        restoredAchievements.forEach(id => {
          mergedUnlocked.add(id);
          mergedClaimed.add(id);
        });

        // Compute claimed achievements rewards
        const claimedAchievementsList = Array.from(mergedClaimed);
        let claimedAchievementsChocoReward = 0;
        let claimedAchievementsGChocoReward = 0;
        claimedAchievementsList.forEach(achId => {
          const ach = ACHIEVEMENTS_LIST.find(a => a.id === achId);
          if (ach) {
            claimedAchievementsChocoReward += ach.chocoReward || 0;
            claimedAchievementsGChocoReward += ach.goldenReward || 0;
          }
        });

        // Kiểm tra xem thành viên này có phải là Admin (cucnau01@gmail.com) hay không
        const isUserAdmin = u.email?.toLowerCase() === 'cucnau01@gmail.com';
        if (isUserAdmin) {
          finalCalculatedChoco = 9999999 + calculatedEarnedChoco - calculatedSpentChoco;
          finalCalculatedGChoco = 9999999 + calculatedEarnedGChoco - calculatedSpentGChoco;
        } else {
          // Đảm bảo số dư khôi phục không bao giờ thấp hơn số dư hiện tại trong cơ sở dữ liệu
          finalCalculatedChoco = Math.max(finalCalculatedChoco, uChoco);
          finalCalculatedGChoco = Math.max(finalCalculatedGChoco, uGChoco);
        }

        // Compute Verifiable Upper Bounds
        const finalCheckInsCount = Math.max(u.totalCheckIns || 0, checkInDates.size);
        const maxVerifiableChocoEarned = ((finalCheckInsCount * 10) + claimedAchievementsChocoReward + (playCountChocoMatch * 15) + (playCountChucuGame * 15) + adminGiftsChoco + spentChocoFromAssets + (actualCommentsCount * 1) + 300);
        const maxVerifiableGChocoEarned = (claimedAchievementsGChocoReward + Math.ceil(playCountChocoMatch / 10) + conversionEarnedGChoco + adminGiftsGChoco + spentGChocoFromAssets + 5);

        let chocoCapped = false;
        const originalCalculatedChoco = finalCalculatedChoco;
        if (!isUserAdmin && finalCalculatedChoco > maxVerifiableChocoEarned) {
          finalCalculatedChoco = maxVerifiableChocoEarned;
          chocoCapped = true;
        }

        let gchocoCapped = false;
        const originalCalculatedGChoco = finalCalculatedGChoco;
        if (!isUserAdmin && finalCalculatedGChoco > maxVerifiableGChocoEarned) {
          finalCalculatedGChoco = maxVerifiableGChocoEarned;
          gchocoCapped = true;
        }

        const updates: any = {};
        let changed = false;

        if (finalCalculatedChoco !== uChoco) {
          updates.choco = finalCalculatedChoco;
          changed = true;
        }
        if (finalCalculatedGChoco !== uGChoco) {
          updates.goldenChoco = finalCalculatedGChoco;
          changed = true;
        }
        if (calculatedEarnedChoco !== (u.totalEarnedChoco || 0)) {
          updates.totalEarnedChoco = isUserAdmin ? (9999999 + calculatedEarnedChoco) : Math.min(calculatedEarnedChoco, maxVerifiableChocoEarned);
          changed = true;
        }
        if (calculatedEarnedGChoco !== (u.totalEarnedGChoco || 0)) {
          updates.totalEarnedGChoco = isUserAdmin ? (9999999 + calculatedEarnedGChoco) : Math.min(calculatedEarnedGChoco, maxVerifiableGChocoEarned);
          changed = true;
        }
        if (calculatedSpentChoco !== (u.totalSpentChoco || 0)) {
          updates.totalSpentChoco = calculatedSpentChoco;
          changed = true;
        }
        if (calculatedStreak !== (u.checkInStreak || 0)) {
          updates.checkInStreak = calculatedStreak;
          changed = true;
        }
        if (totalCheckIns !== (u.totalCheckIns || 0)) {
          updates.totalCheckIns = totalCheckIns;
          changed = true;
        }
        if (calculatedLevel !== (u.level || 1)) {
          updates.level = calculatedLevel;
          changed = true;
        }
        if (remainingExp !== (u.exp || 0)) {
          updates.exp = remainingExp;
          changed = true;
        }

        if (reconstructedTotalPulls !== (u.totalGachaPulls || 0)) {
          updates.totalGachaPulls = reconstructedTotalPulls;
          changed = true;
        }
        if (calculatedPity5 !== (u.gachaPity5Star || 0)) {
          updates.gachaPity5Star = calculatedPity5;
          changed = true;
        }
        if (calculatedPity4 !== (u.gachaPity4Star || 0)) {
          updates.gachaPity4Star = calculatedPity4;
          changed = true;
        }
        if (actualCommentsCount !== (u.totalCommentsCount || 0)) {
          updates.totalCommentsCount = actualCommentsCount;
          changed = true;
        }
        if (actualChatCount !== (u.sentMessagesCount || 0)) {
          updates.sentMessagesCount = actualChatCount;
          changed = true;
        }

        // Story/Pass chapters
        const uUnlockedChaps = Array.isArray(u.unlockedPassChapters) ? u.unlockedPassChapters : [];
        const missingUnlockedChaps = [...txUnlockedChapters].filter(id => !uUnlockedChaps.includes(id));
        if (missingUnlockedChaps.length > 0) {
          updates.unlockedPassChapters = Array.from(new Set([...uUnlockedChaps, ...missingUnlockedChaps]));
          changed = true;
        }

        const uUnlockedEarlyChaps = Array.isArray(u.unlockedEarlyAccessChapters) ? u.unlockedEarlyAccessChapters : [];
        const missingEarlyChaps = [...txUnlockedEarlyAccessChapters].filter(id => !uUnlockedEarlyChaps.includes(id));
        if (missingEarlyChaps.length > 0) {
          updates.unlockedEarlyAccessChapters = Array.from(new Set([...uUnlockedEarlyChaps, ...missingEarlyChaps]));
          changed = true;
        }

        // Achievements state
        const currentUnlockedList = Array.from(mergedUnlocked);
        const currentClaimedList = Array.from(mergedClaimed);
        
        const existingUnlocked = Array.isArray(u.unlockedAchievements) ? u.unlockedAchievements : [];
        if (currentUnlockedList.length !== existingUnlocked.length || currentUnlockedList.some(id => !existingUnlocked.includes(id))) {
          updates.unlockedAchievements = currentUnlockedList;
          changed = true;
        }
        const existingClaimed = Array.isArray(u.claimedAchievements) ? u.claimedAchievements : [];
        if (currentClaimedList.length !== existingClaimed.length || currentClaimedList.some(id => !existingClaimed.includes(id))) {
          updates.claimedAchievements = currentClaimedList;
          changed = true;
        }

        setRestorationLogs(prev => [
          ...prev,
          `📊 Báo cáo đối soát & kiểm định thực tế:`,
          `   - Số dư DB hiện tại: ${uChoco.toLocaleString()} Choco / ${uGChoco.toLocaleString()} GChoco`,
          isUserAdmin 
            ? `   - Quyền hạn Admin: Tự động khôi phục số dư gốc mặc định cộng tích lũy (${(9999999 + calculatedEarnedChoco - calculatedSpentChoco).toLocaleString()} Choco / ${(9999999 + calculatedEarnedGChoco - calculatedSpentGChoco).toLocaleString()} GChoco) (Gốc 9,999,999 + Kiếm thêm: ${calculatedEarnedChoco.toLocaleString()} Choco / ${calculatedEarnedGChoco.toLocaleString()} GChoco)` 
            : `   - Số dư sau tái dựng (Từ GD): ${originalCalculatedChoco.toLocaleString()} Choco / ${originalCalculatedGChoco.toLocaleString()} GChoco`,
          isUserAdmin 
            ? `   - Hạn mức thực tế tối đa (Minh chứng): Không giới hạn (Tài khoản Admin)` 
            : `   - Hạn mức thực tế tối đa (Minh chứng): ≤ ${maxVerifiableChocoEarned.toLocaleString()} Choco / ≤ ${maxVerifiableGChocoEarned.toLocaleString()} GChoco`,
          `   - Trị giá tài sản sở hữu thực tế: ${spentChocoFromAssets.toLocaleString()} Choco / ${spentGChocoFromAssets.toLocaleString()} GChoco`,
          isUserAdmin
            ? `   ✅ ĐỐI SOÁT HỢP LỆ: Tài khoản Admin có đặc quyền vô hạn.`
            : (chocoCapped || gchocoCapped
                ? `   ⚠️ PHÁT HIỆN LỆCH BẤT THƯỜNG: Số dư tái dựng vượt quá minh chứng hoạt động thực tế! Đã áp trần bảo vệ thành công.`
                : `   ✅ ĐỐI SOÁT HỢP LỆ: Số dư sau tái dựng khớp hoàn toàn trong giới hạn thực tế cho phép.`),
          `   - Điểm danh ghi nhận: ${checkInDates.size} ngày. Chuỗi liên tục: ${calculatedStreak} ngày.`,
          `   - Hoạt động cộng đồng: Bình luận thực tế: ${actualCommentsCount} lượt, Tin nhắn Chat: ${actualChatCount} dòng, Bài viết Feed: ${actualFeedCount} bài.`,
          `   - Giao dịch minigame: ChocoMatch: ${playCountChocoMatch} lượt, Chucu: ${playCountChucuGame} lượt.`,
          `   - Vé Gacha: Đã sở hữu/mua ${ticketsFromTxs} vé. Tổng lượt gacha: ${reconstructedTotalPulls} lượt.`,
          `   - Bảo hiểm Gacha (Pity): 5⭐: ${calculatedPity5}/90, 4⭐: ${calculatedPity4}/10`,
          `   - Đẳng cấp: Cấp ${calculatedLevel} (EXP tích lũy ước tính: ${totalEstimatedExp.toLocaleString()})`,
          `   - Nhãn dán: Có trong túi: ${stickersSnap.size} / Phát hiện trong GD: ${txBoughtStickerUrls.size}`,
          `   - Phụ kiện: Có trong túi: ${accessoriesSnap.size} / Phát hiện trong GD: ${txBoughtAccessoryUrls.size}`
        ]);

        if (changed) {
          await updateDoc(doc(db, "users", u.id), updates);
        }

        // Re-add missing subcollection items
        for (const sUrl of missingStickerUrlsToRestore) {
          await addDoc(collection(db, "users", u.id, "owned_stickers"), {
            url: sUrl,
            createdAt: serverTimestamp()
          });
          setRestorationLogs(prev => [...prev, `   🎉 Đã khôi phục Nhãn dán: ${sUrl}`]);
        }

        for (const aUrl of missingAccessoryUrlsToRestore) {
          await addDoc(collection(db, "users", u.id, "owned_accessories"), {
            url: aUrl,
            createdAt: serverTimestamp()
          });
          setRestorationLogs(prev => [...prev, `   🎉 Đã khôi phục Phụ kiện: ${aUrl}`]);
        }

        if (changed || missingStickerUrlsToRestore.length > 0 || missingAccessoryUrlsToRestore.length > 0) {
          restoredCount++;
          let logStr = `➡️ 🎉 ĐÃ KHÔI PHỤC TOÀN DIỆN THÀNH CÔNG: `;
          if (updates.choco !== undefined) logStr += `${updates.choco.toLocaleString()} Choco, `;
          if (updates.goldenChoco !== undefined) logStr += `${updates.goldenChoco.toLocaleString()} GChoco, `;
          if (updates.level !== undefined) logStr += `Level ${updates.level}, `;
          if (updates.checkInStreak !== undefined) logStr += `Chuỗi ${updates.checkInStreak} ngày, `;
          if (updates.totalGachaPulls !== undefined) logStr += `Gacha ${updates.totalGachaPulls} lượt, `;
          if (updates.gachaPity5Star !== undefined) logStr += `Pity 5⭐: ${updates.gachaPity5Star}/90, `;
          if (missingStickerUrlsToRestore.length > 0) logStr += `Thêm ${missingStickerUrlsToRestore.length} Nhãn dán, `;
          if (missingAccessoryUrlsToRestore.length > 0) logStr += `Thêm ${missingAccessoryUrlsToRestore.length} Phụ kiện, `;
          if (missingUnlockedChaps.length > 0) logStr += `Bù ${missingUnlockedChaps.length} chương truyện, `;
          setRestorationLogs(prev => [...prev, logStr.replace(/,\s*$/, "")]);
        } else {
          setRestorationLogs(prev => [...prev, `✅ Trạng thái tài khoản này hoàn toàn chính xác.`]);
        }
      }

      setRestorationLogs(prev => [...prev, `--------------------------------------------------------------------------------`, `🎉 HOÀN THÀNH TRUY QUÉT & KHÔI PHỤC TOÀN DIỆN! Đã xử lý & chuẩn hóa thành công ${restoredCount} tài khoản.`]);
    } catch (err: any) {
      console.error(err);
      setRestorationLogs(prev => [...prev, `❌ Thất bại: ${err.message || err}`]);
    } finally {
      setIsRestoring(false);
    }
  };

  const runDuplicateScan = async () => {
    setIsScanningDuplicates(true);
    setDuplicateReport(null);
    setDuplicateLogs(["Bắt đầu quét lịch sử giao dịch để tìm nhận trùng nhiệm vụ và thành tựu..."]);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      setDuplicateLogs(prev => [...prev, `Tìm thấy ${users.length} thành viên.`]);

      let totalDuplicatesFound = 0;
      let totalChocoToRevoke = 0;
      let totalGChocoToRevoke = 0;
      const usersWithDuplicates: any[] = [];

      // Helper to parse date to GMT+7 Date object
      const toGMT7Date = (ms: number): Date => {
         const d = new Date(ms);
         const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
         return new Date(utc + (3600000 * 7));
      };

      // Helper to compute Weekly ID of a date
      const getWeeklyIdOfDate = (gmt7: Date): string => {
         const d = new Date(gmt7.getTime());
         d.setHours(0, 0, 0, 0);
         d.setDate(d.getDate() + 4 - (d.getDay() || 7));
         const yearStart = new Date(d.getFullYear(), 0, 1);
         const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
         return `${d.getFullYear()}-W${weekNo}`;
      };

      for (const u of users) {
        setDuplicateLogs(prev => [...prev, `⏳ Đang quét người dùng: ${u.displayName || u.email || u.id}...`]);
        
        const txSnap = await getDocs(collection(db, `users/${u.id}/transactions`));
        const txs = txSnap.docs.map(doc => ({ txId: doc.id, ...doc.data() as any }));
        
        // Tính toán số lượng đã thu hồi trong quá khứ dựa trên các giao dịch spend
        let alreadyRevokedChoco = 0;
        let alreadyRevokedGChoco = 0;
        txs.forEach(t => {
          if (t.type === 'spend') {
            const reason = t.reason || "";
            if (reason.includes("Thu hồi Choco nhận trùng")) {
              alreadyRevokedChoco += Number(t.amount) || 0;
            }
            if (reason.includes("Thu hồi GChoco nhận trùng")) {
              alreadyRevokedGChoco += Number(t.amount) || 0;
            }
          }
        });

        // Chỉ đối soát các giao dịch chưa bị đánh dấu là đã thu hồi trùng lặp (isDuplicateRevoked !== true)
        const activeTxs = txs.filter(t => t.isDuplicateRevoked !== true);

        // Sắp xếp các giao dịch tăng dần theo thời gian tạo
        const getTxTime = (tx: any) => {
          if (!tx.createdAt) return 0;
          if (typeof tx.createdAt.toMillis === 'function') return tx.createdAt.toMillis();
          if (tx.createdAt.seconds !== undefined) return tx.createdAt.seconds * 1000;
          return new Date(tx.createdAt).getTime() || 0;
        };
        const sortedTxs = [...activeTxs].sort((a, b) => getTxTime(a) - getTxTime(b));

        const candidateDuplicates: any[] = [];

        // Nhóm 1: Thành tựu (Achievements)
        // Group earn transactions containing "Nhận thưởng thành tựu: "
        const achMap = new Map<string, any[]>();
        sortedTxs.forEach(t => {
          if (t.type === 'earn') {
            const desc = t.description || t.reason || "";
            const match = desc.match(/Nhận thưởng thành tựu:\s*(.+)/);
            if (match) {
              const achName = match[1].trim();
              if (!achMap.has(achName)) achMap.set(achName, []);
              achMap.get(achName)!.push(t);
            }
          }
        });

        achMap.forEach((txList, achName) => {
          if (txList.length > 1) {
            // Chỉ giữ lại giao dịch đầu tiên (mốc thời gian sớm nhất)
            // Tất cả giao dịch sau là trùng lặp
            for (let i = 1; i < txList.length; i++) {
              const dupTx = txList[i];
              const amt = Number(dupTx.amount) || 0;
              const cur = (dupTx.currency || 'choco').toLowerCase();
              
              const tTime = getTxTime(dupTx);
              const dateStr = tTime ? format(toGMT7Date(tTime), 'yyyy-MM-dd HH:mm:ss') : "Không rõ ngày";

              candidateDuplicates.push({
                type: 'achievement',
                detail: `Thành tựu: ${achName}`,
                amount: amt,
                currency: cur,
                createdAtStr: dateStr,
                txId: dupTx.txId,
                timestamp: tTime
              });
            }
          }
        });

        // Nhóm 2: Nhiệm vụ có ID (Missions with ID)
        // Group earn transactions containing "Nhận thưởng nhiệm vụ: "
        const missionIdMap = new Map<string, any[]>();
        sortedTxs.forEach(t => {
          if (t.type === 'earn') {
            const desc = t.description || t.reason || "";
            const match = desc.match(/Nhận thưởng nhiệm vụ:\s*([a-zA-Z0-9_\-]+)/);
            if (match) {
              const mId = match[1].trim();
              if (!missionIdMap.has(mId)) missionIdMap.set(mId, []);
              missionIdMap.get(mId)!.push(t);
            }
          }
        });

        missionIdMap.forEach((txList, mId) => {
          if (txList.length > 1) {
            if (mId.startsWith('p_')) {
              // Nhiệm vụ vĩnh viễn (Permanent): chỉ nhận 1 lần duy nhất trong đời
              for (let i = 1; i < txList.length; i++) {
                const dupTx = txList[i];
                const amt = Number(dupTx.amount) || 0;
                const cur = (dupTx.currency || 'choco').toLowerCase();
                
                const tTime = getTxTime(dupTx);
                const dateStr = tTime ? format(toGMT7Date(tTime), 'yyyy-MM-dd HH:mm:ss') : "Không rõ ngày";

                candidateDuplicates.push({
                  type: 'mission_id',
                  detail: `Nhiệm vụ vĩnh viễn: ${mId}`,
                  amount: amt,
                  currency: cur,
                  createdAtStr: dateStr,
                  txId: dupTx.txId,
                  timestamp: tTime
                });
              }
            } else if (mId.startsWith('d')) {
              // Nhiệm vụ hàng ngày (Daily): chỉ được nhận tối đa 1 lần/ngày
              const dailyGroups = new Map<string, any[]>();
              txList.forEach(tx => {
                const tTime = getTxTime(tx);
                if (tTime) {
                  const dateStr = format(toGMT7Date(tTime), 'yyyy-MM-dd');
                  if (!dailyGroups.has(dateStr)) dailyGroups.set(dateStr, []);
                  dailyGroups.get(dateStr)!.push(tx);
                }
              });

              dailyGroups.forEach((txsInDay, dateStr) => {
                if (txsInDay.length > 1) {
                  for (let i = 1; i < txsInDay.length; i++) {
                    const dupTx = txsInDay[i];
                    const amt = Number(dupTx.amount) || 0;
                    const cur = (dupTx.currency || 'choco').toLowerCase();
                    
                    const tTime = getTxTime(dupTx);
                    const fullDateStr = tTime ? format(toGMT7Date(tTime), 'yyyy-MM-dd HH:mm:ss') : dateStr;

                    candidateDuplicates.push({
                      type: 'mission_id',
                      detail: `Nhiệm vụ ngày trùng trong ngày ${dateStr}: ${mId}`,
                      amount: amt,
                      currency: cur,
                      createdAtStr: fullDateStr,
                      txId: dupTx.txId,
                      timestamp: tTime
                    });
                  }
                }
              });
            } else if (mId.startsWith('w')) {
              // Nhiệm vụ tuần (Weekly): chỉ được nhận tối đa 1 lần/tuần
              const weeklyGroups = new Map<string, any[]>();
              txList.forEach(tx => {
                const tTime = getTxTime(tx);
                if (tTime) {
                  const weekStr = getWeeklyIdOfDate(toGMT7Date(tTime));
                  if (!weeklyGroups.has(weekStr)) weeklyGroups.set(weekStr, []);
                  weeklyGroups.get(weekStr)!.push(tx);
                }
              });

              weeklyGroups.forEach((txsInWeek, weekStr) => {
                if (txsInWeek.length > 1) {
                  for (let i = 1; i < txsInWeek.length; i++) {
                    const dupTx = txsInWeek[i];
                    const amt = Number(dupTx.amount) || 0;
                    const cur = (dupTx.currency || 'choco').toLowerCase();
                    
                    const tTime = getTxTime(dupTx);
                    const fullDateStr = tTime ? format(toGMT7Date(tTime), 'yyyy-MM-dd HH:mm:ss') : weekStr;

                    candidateDuplicates.push({
                      type: 'mission_id',
                      detail: `Nhiệm vụ tuần trùng trong tuần ${weekStr}: ${mId}`,
                      amount: amt,
                      currency: cur,
                      createdAtStr: fullDateStr,
                      txId: dupTx.txId,
                      timestamp: tTime
                    });
                  }
                }
              });
            }
          }
        });

        // Nhóm 3: Nhiệm vụ cũ (Legacy Missions)
        const legacyTxs = sortedTxs.filter(t => t.type === 'earn' && (t.description || t.reason) === "Nhận thưởng nhiệm vụ");
        
        const processedLegacyTxIds = new Set<string>();
        for (let i = 0; i < legacyTxs.length; i++) {
          const t1 = legacyTxs[i];
          if (processedLegacyTxIds.has(t1.txId)) continue;
          
          const t1Time = getTxTime(t1);
          const t1Amt = Number(t1.amount) || 0;
          const t1Cur = (t1.currency || 'choco').toLowerCase();
          const t1Bal = t1.balanceAfter;

          for (let j = i + 1; j < legacyTxs.length; j++) {
            const t2 = legacyTxs[j];
            if (processedLegacyTxIds.has(t2.txId)) continue;

            const t2Time = getTxTime(t2);
            const t2Amt = Number(t2.amount) || 0;
            const t2Cur = (t2.currency || 'choco').toLowerCase();
            const t2Bal = t2.balanceAfter;

            if (t1Cur === t2Cur && t1Amt === t2Amt && t1Bal === t2Bal && Math.abs(t1Time - t2Time) <= 5000) {
              processedLegacyTxIds.add(t2.txId);
              
              const dateStr = t2Time ? format(toGMT7Date(t2Time), 'yyyy-MM-dd HH:mm:ss') : "Không rõ ngày";

              candidateDuplicates.push({
                type: 'mission_legacy',
                detail: `Nhiệm vụ cũ nhận trùng (ghi song song, cùng số dư sau gd: ${t2Bal})`,
                amount: t2Amt,
                currency: t2Cur,
                createdAtStr: dateStr,
                txId: t2.txId,
                timestamp: t2Time
              });
            }
          }
        }

        // Đối chiếu các trùng lặp ứng viên với các giao dịch spend đã thu hồi trong lịch sử
        const sortedCandidates = [...candidateDuplicates].sort((a, b) => a.timestamp - b.timestamp);
        const userDuplicates: any[] = [];
        let userChocoToRevoke = 0;
        let userGChocoToRevoke = 0;

        for (const candidate of sortedCandidates) {
          const amt = candidate.amount;
          const isGolden = candidate.currency === 'gchoco';

          if (isGolden) {
            if (alreadyRevokedGChoco >= amt) {
              alreadyRevokedGChoco -= amt;
              // Tự động ghim nhãn isDuplicateRevoked: true trong Firestore để tránh quét lại
              try {
                await updateDoc(doc(db, `users/${u.id}/transactions`, candidate.txId), { isDuplicateRevoked: true });
              } catch (e) {
                console.error("Lỗi cập nhật isDuplicateRevoked:", e);
              }
            } else {
              userGChocoToRevoke += amt;
              userDuplicates.push(candidate);
            }
          } else {
            if (alreadyRevokedChoco >= amt) {
              alreadyRevokedChoco -= amt;
              // Tự động ghim nhãn isDuplicateRevoked: true trong Firestore để tránh quét lại
              try {
                await updateDoc(doc(db, `users/${u.id}/transactions`, candidate.txId), { isDuplicateRevoked: true });
              } catch (e) {
                console.error("Lỗi cập nhật isDuplicateRevoked:", e);
              }
            } else {
              userChocoToRevoke += amt;
              userDuplicates.push(candidate);
            }
          }
        }

        if (userDuplicates.length > 0) {
          totalDuplicatesFound += userDuplicates.length;
          totalChocoToRevoke += userChocoToRevoke;
          totalGChocoToRevoke += userGChocoToRevoke;

          usersWithDuplicates.push({
            userId: u.id,
            displayName: u.displayName || 'Không có tên',
            email: u.email || 'Không có email',
            currentChoco: u.choco || 0,
            currentGChoco: u.goldenChoco || 0,
            chocoToRevoke: userChocoToRevoke,
            gchocoToRevoke: userGChocoToRevoke,
            duplicates: userDuplicates
          });

          setDuplicateLogs(prev => [...prev, `⚠️ Phát hiện ${userDuplicates.length} nhận trùng mới cho ${u.displayName || u.email}. Trùng lặp: -${userChocoToRevoke} Choco, -${userGChocoToRevoke} GChoco.`]);
        }
      }

      setDuplicateReport({
        totalScanned: users.length,
        totalDuplicatesFound,
        totalChocoToRevoke,
        totalGChocoToRevoke,
        usersWithDuplicates
      });

      setDuplicateLogs(prev => [
        ...prev, 
        `--------------------------------------------------------------------------------`,
        `🎉 Hoàn tất TRUY QUÉT trùng lặp!`,
        `📊 Tổng số thành viên quét: ${users.length}`,
        `📊 Số lượng lượt nhận trùng: ${totalDuplicatesFound}`,
        `🍫 Tổng số Choco cần thu hồi: ${totalChocoToRevoke}`,
        `🌟 Tổng số GChoco cần thu hồi: ${totalGChocoToRevoke}`,
        `➡️ Nhấp "THỰC THI THU HỒI" để hoàn tất khấu trừ trong cơ sở dữ liệu.`
      ]);

    } catch (e: any) {
      console.error("Lỗi khi quét trùng lặp: ", e);
      setDuplicateLogs(prev => [...prev, `❌ Thao tác thất bại: ${e.message || e}`]);
    } finally {
      setIsScanningDuplicates(false);
    }
  };

  const runDuplicateRevoke = async () => {
    if (!duplicateReport || duplicateReport.usersWithDuplicates.length === 0) return;
    setIsRevokingDuplicates(true);
    setDuplicateLogs(prev => [...prev, `--------------------------------------------------------------------------------`, `🚀 Bắt đầu thực thi THU HỒI tài sản nhận trùng lặp trong Firestore...`]);
    
    try {
      let successfullyRevokedUsers = 0;

      for (const uInfo of duplicateReport.usersWithDuplicates) {
        setDuplicateLogs(prev => [...prev, `⏳ Đang xử lý tài khoản: ${uInfo.displayName} (${uInfo.email})...`]);
        
        const userRef = doc(db, "users", uInfo.userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          setDuplicateLogs(prev => [...prev, `❌ Không tìm thấy tài liệu người dùng ${uInfo.userId} trong Firestore.`]);
          continue;
        }

        const actualUserData = userDoc.data() as any;
        const currentChoco = actualUserData.choco || 0;
        const currentGChoco = actualUserData.goldenChoco || 0;
        const totalEarnedChoco = actualUserData.totalEarnedChoco || 0;
        const totalEarnedGChoco = actualUserData.totalEarnedGChoco || 0;

        const nextChoco = Math.max(0, currentChoco - uInfo.chocoToRevoke);
        const nextGChoco = Math.max(0, currentGChoco - uInfo.gchocoToRevoke);
        const nextTotalEarnedChoco = Math.max(0, totalEarnedChoco - uInfo.chocoToRevoke);
        const nextTotalEarnedGChoco = Math.max(0, totalEarnedGChoco - uInfo.gchocoToRevoke);

        const updates: any = {
          choco: nextChoco,
          goldenChoco: nextGChoco,
          totalEarnedChoco: nextTotalEarnedChoco,
          totalEarnedGChoco: nextTotalEarnedGChoco
        };

        if (uInfo.chocoToRevoke > 0) {
          await addDoc(collection(db, `users/${uInfo.userId}/transactions`), {
            amount: uInfo.chocoToRevoke,
            currency: 'choco',
            type: 'spend',
            reason: `Thu hồi Choco nhận trùng (${uInfo.duplicates.filter(d => d.currency === 'choco').length} lần trùng lặp)`,
            balanceAfter: nextChoco,
            createdAt: serverTimestamp()
          });
        }

        if (uInfo.gchocoToRevoke > 0) {
          await addDoc(collection(db, `users/${uInfo.userId}/transactions`), {
            amount: uInfo.gchocoToRevoke,
            currency: 'gchoco',
            type: 'spend',
            reason: `Thu hồi GChoco nhận trùng (${uInfo.duplicates.filter(d => d.currency === 'gchoco').length} lần trùng lặp)`,
            balanceAfter: nextGChoco,
            createdAt: serverTimestamp()
          });
        }

        await updateDoc(userRef, updates);

        // Đánh dấu thuộc tính isDuplicateRevoked: true cho toàn bộ các giao dịch trùng lặp vừa được thu hồi
        for (const dup of uInfo.duplicates) {
          if (dup.txId) {
            try {
              await updateDoc(doc(db, `users/${uInfo.userId}/transactions`, dup.txId), { isDuplicateRevoked: true });
            } catch (err) {
              console.error(`Lỗi đánh dấu isDuplicateRevoked cho gd ${dup.txId}:`, err);
            }
          }
        }

        successfullyRevokedUsers++;
        setDuplicateLogs(prev => [...prev, `🎉 Hoàn tất thu hồi cho ${uInfo.displayName}: Số dư Choco ${currentChoco} ➔ ${nextChoco}, GChoco ${currentGChoco} ➔ ${nextGChoco}`]);
      }

      setDuplicateLogs(prev => [
        ...prev, 
        `--------------------------------------------------------------------------------`,
        `🎉 HOÀN THÀNH TIẾN TRÌNH THU HỒI TRÙNG LẶP!`,
        `📊 Đã xử lý thành công: ${successfullyRevokedUsers} tài khoản`,
        `✅ Hệ thống đã khấu trừ tổng cộng -${duplicateReport.totalChocoToRevoke} Choco và -${duplicateReport.totalGChocoToRevoke} GChoco.`
      ]);

      setDuplicateReport(null);

    } catch (err: any) {
      console.error("Lỗi khi thu hồi: ", err);
      setDuplicateLogs(prev => [...prev, `❌ Lỗi tiến trình thu hồi: ${err.message || err}`]);
    } finally {
      setIsRevokingDuplicates(false);
    }
  };

  const runSingleUserAudit = async (u: any) => {
    setIsAuditing(true);
    setAuditLogs([`🔍 Bắt đầu đối soát chi tiết cho người dùng: ${u.displayName || u.email || u.id}...`]);
    setAuditReport(null);
    try {
      // 1. Tải các banner gacha để phân loại độ hiếm nhãn dán
      const bannersSnap = await getDocs(collection(db, "gacha_banners"));
      const banners = bannersSnap.docs.map(doc => doc.data() as any);
      const stickerRarities = new Map<string, number>();
      
      banners.forEach(b => {
        if (b.pool5Star) {
          b.pool5Star.forEach((item: any) => {
            if (item.image) stickerRarities.set(item.image, 5);
          });
        }
        if (b.featured5Star) {
          const item = b.featured5Star;
          if (item.image) stickerRarities.set(item.image, 5);
        }
        if (b.pool4Star) {
          b.pool4Star.forEach((item: any) => {
            if (item.image) stickerRarities.set(item.image, 4);
          });
        }
        if (b.featured4Stars) {
          b.featured4Stars.forEach((item: any) => {
            if (item.image) stickerRarities.set(item.image, 4);
          });
        }
      });

      // Tải các vật phẩm Gacha để bổ sung chính xác độ hiếm nhãn dán
      try {
        const gachaItemsSnap = await getDocs(collection(db, "gacha_items"));
        gachaItemsSnap.docs.forEach(doc => {
          const item = doc.data();
          if (item.image && item.rarity) {
            stickerRarities.set(item.image, Number(item.rarity));
          }
        });
      } catch (auditGachaItemsErr) {
        console.warn("Không thể tải bổ sung danh sách gacha_items trong đối soát:", auditGachaItemsErr);
      }

      // Tải giá trong cửa hàng
      const storeStickersSnap = await getDocs(collection(db, "store_stickers"));
      const storeAccessoriesSnap = await getDocs(collection(db, "store_accessories"));
      const storeChucuAccessoriesSnap = await getDocs(collection(db, "store_chucu_accessories"));

      const stickerPrices = new Map<string, { price: number; currency: string }>();
      storeStickersSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.url) {
          stickerPrices.set(data.url, { 
            price: Number(data.price) || 0, 
            currency: (data.type || 'choco').toLowerCase() 
          });
        }
      });

      const accessoryPrices = new Map<string, { price: number; currency: string }>();
      storeAccessoriesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.url) {
          accessoryPrices.set(data.url, { 
            price: Number(data.price) || 0, 
            currency: (data.type || 'choco').toLowerCase() 
          });
        }
      });

      const chucuAccessoryPrices = new Map<string, { price: number; currency: string }>();
      storeChucuAccessoriesSnap.docs.forEach(doc => {
        const data = doc.data();
        const key = data.url || data.id;
        if (key) {
          chucuAccessoryPrices.set(key, { 
            price: Number(data.price) || 0, 
            currency: (data.type || 'choco').toLowerCase() 
          });
        }
      });

      // Fetch subcollections của user
      const txSnap = await getDocs(collection(db, `users/${u.id}/transactions`));
      const txs = txSnap.docs.map(doc => doc.data());
      setAuditLogs(prev => [...prev, `➡️ Đã tìm thấy ${txs.length} giao dịch trong Firestore.`]);

      const stickersSnap = await getDocs(collection(db, `users/${u.id}/owned_stickers`));
      const currentStickerUrls = new Set(stickersSnap.docs.map(doc => doc.data().url).filter(Boolean));
      setAuditLogs(prev => [...prev, `➡️ Đang sở hữu ${stickersSnap.size} Nhãn dán.`]);

      const accessoriesSnap = await getDocs(collection(db, `users/${u.id}/owned_accessories`));
      const currentAccessoryUrls = new Set(accessoriesSnap.docs.map(doc => doc.data().url).filter(Boolean));
      setAuditLogs(prev => [...prev, `➡️ Đang sở hữu ${accessoriesSnap.size} Phụ kiện.`]);

      const commentsSnap = await getDocs(query(collection(db, "comments"), where("uid", "==", u.id)));
      const actualCommentsCount = commentsSnap.size;

      const chatSnap = await getDocs(query(collection(db, "chatMessages"), where("uid", "==", u.id)));
      const actualChatCount = chatSnap.size;

      const feedSnap = await getDocs(query(collection(db, "newsFeed"), where("uid", "==", u.id)));
      const actualFeedCount = feedSnap.size;

      // Sắp xếp giao dịch theo thời gian tăng dần
      const getTxTime = (tx: any) => {
        if (!tx.createdAt) return 0;
        if (typeof tx.createdAt.toMillis === 'function') return tx.createdAt.toMillis();
        if (tx.createdAt.seconds !== undefined) return tx.createdAt.seconds * 1000;
        return new Date(tx.createdAt).getTime() || 0;
      };
      const sortedTxs = [...txs].sort((a, b) => getTxTime(a) - getTxTime(b));

      // Reconstruct balances & analyze activities
      let calculatedEarnedChoco = 0;
      let calculatedEarnedGChoco = 0;
      let calculatedSpentChoco = 0;
      let calculatedSpentGChoco = 0;

      let conversionEarnedGChoco = 0;
      let adminGiftsChoco = 0;
      let adminGiftsGChoco = 0;

      const txBoughtStickerUrls = new Set<string>();
      const txBoughtAccessoryUrls = new Set<string>();
      const txUnlockedChapters = new Set<string>();
      const txUnlockedEarlyAccessChapters = new Set<string>();
      const restoredAchievements = new Set<string>();
      const checkInDates = new Set<string>();

      let playCountChocoMatch = 0;
      let playCountChucuGame = 0;
      let gachaDrawCount = 0;
      let commentsCount = 0;

      sortedTxs.forEach(t => {
        if (t.isDuplicateRevoked) return;
        const desc = t.description || t.reason || "";
        const isRevocation = 
          desc.includes("Thu hồi") || desc.includes("thu hồi") || 
          desc.includes("Khấu trừ") || desc.includes("khấu trừ") || 
          desc.includes("Revoke") || desc.includes("revoke") ||
          desc.includes("Admin") || desc.includes("admin") ||
          desc.includes("Cập nhật") || desc.includes("cập nhật") ||
          desc.includes("Điều chỉnh") || desc.includes("điều chỉnh") ||
          desc.includes("Trừ") || desc.includes("trừ") ||
          desc.includes("Bị trừ") || desc.includes("bị trừ") ||
          desc.includes("Phạt") || desc.includes("phạt");
        if (isRevocation) return;

        const amt = Number(t.amount) || 0;
        const isSpecialEarn = desc.includes("Admin") || desc.includes("Tặng") || desc.includes("Quà") || desc.includes("gift") || desc.includes("Bù") || desc.includes("Khôi phục");
        
        if (t.currency === 'choco') {
          if (t.type === 'earn') {
            calculatedEarnedChoco += amt;
            if (isSpecialEarn) {
              adminGiftsChoco += amt;
            }
          } else if (t.type === 'spend') {
            calculatedSpentChoco += amt;
          }
        } else if (t.currency === 'gchoco') {
          if (t.type === 'earn') {
            calculatedEarnedGChoco += amt;
            if (desc.includes("Đổi") || desc.includes("convert")) {
              conversionEarnedGChoco += amt;
            }
            if (isSpecialEarn) {
              adminGiftsGChoco += amt;
            }
          } else if (t.type === 'spend') {
            calculatedSpentGChoco += amt;
          }
        }

        // Kiểm tra điểm danh
        if (desc.includes("Điểm danh")) {
          const tTime = getTxTime(t);
          if (tTime) {
             const dateStr = format(new Date(tTime), 'yyyy-MM-dd');
             checkInDates.add(dateStr);
          }
        }

        // Games and other counts
        if (desc.includes("Choco Match") || desc.includes("Choco_Match") || desc.includes("ChocoMatch")) {
          playCountChocoMatch++;
        }
        if (desc.includes("Chucu") || desc.includes("Hứng Choco") || desc.includes("Nuôi Chucu")) {
          playCountChucuGame++;
        }
        if (desc.includes("Gacha")) {
          gachaDrawCount++;
        }
        if (desc.includes("Bình luận") || desc.includes("comment")) {
          commentsCount++;
        }

        // Nhận diện tài sản
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urlMatches = desc.match(urlRegex);
        if (urlMatches) {
          urlMatches.forEach((url: string) => {
            const cleanedUrl = url.trim();
            if (cleanedUrl.includes("sticker") || cleanedUrl.includes("gacha") || cleanedUrl.includes("nhan_dan")) {
              txBoughtStickerUrls.add(cleanedUrl);
            } else if (cleanedUrl.includes("accessory") || cleanedUrl.includes("phu_kien") || cleanedUrl.includes("pet")) {
              txBoughtAccessoryUrls.add(cleanedUrl);
            }
          });
        }

        if (t.unlockedChapterId) {
          txUnlockedChapters.add(t.unlockedChapterId);
        } else if (desc.includes("Chương") || desc.includes("chapter")) {
          const m = desc.match(/chương\s+([a-zA-Z0-9_-]+)/i) || desc.match(/chapter\s+([a-zA-Z0-9_-]+)/i);
          if (m) txUnlockedChapters.add(m[1]);
        }

        if (t.unlockedEarlyAccessChapterId) {
          txUnlockedEarlyAccessChapters.add(t.unlockedEarlyAccessChapterId);
        }

        // Achievements
        if (desc.includes("Thành tựu") || desc.includes("achievement")) {
          const m = desc.match(/Thành tựu\s+([a-zA-Z0-9_-]+)/i) || desc.match(/achievement\s+([a-zA-Z0-9_-]+)/i);
          if (m) restoredAchievements.add(m[1]);
        }
      });

      let spentChocoFromAssets = 0;
      let spentGChocoFromAssets = 0;

      txBoughtStickerUrls.forEach(url => {
        const itemPrice = stickerPrices.get(url);
        if (itemPrice) {
          if (itemPrice.currency === 'gchoco') spentGChocoFromAssets += itemPrice.price;
          else spentChocoFromAssets += itemPrice.price;
        }
      });

      txBoughtAccessoryUrls.forEach(url => {
        const itemPrice = accessoryPrices.get(url) || chucuAccessoryPrices.get(url);
        if (itemPrice) {
          if (itemPrice.currency === 'gchoco') spentGChocoFromAssets += itemPrice.price;
          else spentChocoFromAssets += itemPrice.price;
        }
      });

      calculatedSpentChoco = Math.max(calculatedSpentChoco, spentChocoFromAssets);
      calculatedSpentGChoco = Math.max(calculatedSpentGChoco, spentGChocoFromAssets);

      const uChoco = u.choco || 0;
      const uGChoco = u.goldenChoco || 0;

      // Khôi phục theo số dư giao dịch gần nhất
      let finalCalculatedChoco = uChoco;
      let lastChocoTxIndex = -1;
      for (let i = sortedTxs.length - 1; i >= 0; i--) {
        const t = sortedTxs[i];
        if (t.currency === 'choco' && t.balanceAfter !== undefined && t.balanceAfter !== null) {
          lastChocoTxIndex = i;
          break;
        }
      }

      if (lastChocoTxIndex !== -1) {
        let bal = Number(sortedTxs[lastChocoTxIndex].balanceAfter);
        for (let i = lastChocoTxIndex + 1; i < sortedTxs.length; i++) {
          const t = sortedTxs[i];
          if (t.currency === 'choco') {
            const amt = Number(t.amount) || 0;
            if (t.type === 'earn') bal += amt;
            else if (t.type === 'spend') bal -= amt;
          }
        }
        finalCalculatedChoco = Math.max(0, bal);
      } else {
        if (sortedTxs.some(t => t.currency === 'choco')) {
          let sumChoco = 0;
          sortedTxs.forEach(t => {
            if (t.currency === 'choco') {
              const amt = Number(t.amount) || 0;
              if (t.type === 'earn') sumChoco += amt;
              else if (t.type === 'spend') sumChoco -= amt;
            }
          });
          finalCalculatedChoco = Math.max(uChoco, sumChoco);
        }
      }

      let finalCalculatedGChoco = uGChoco;
      let lastGChocoTxIndex = -1;
      for (let i = sortedTxs.length - 1; i >= 0; i--) {
        const t = sortedTxs[i];
        if (t.currency === 'gchoco' && t.balanceAfter !== undefined && t.balanceAfter !== null) {
          lastGChocoTxIndex = i;
          break;
        }
      }

      if (lastGChocoTxIndex !== -1) {
        let bal = Number(sortedTxs[lastGChocoTxIndex].balanceAfter);
        for (let i = lastGChocoTxIndex + 1; i < sortedTxs.length; i++) {
          const t = sortedTxs[i];
          if (t.currency === 'gchoco') {
            const amt = Number(t.amount) || 0;
            if (t.type === 'earn') bal += amt;
            else if (t.type === 'spend') bal -= amt;
          }
        }
        finalCalculatedGChoco = Math.max(0, bal);
      } else {
        if (sortedTxs.some(t => t.currency === 'gchoco')) {
          let sumGChoco = 0;
          sortedTxs.forEach(t => {
            if (t.currency === 'gchoco') {
              const amt = Number(t.amount) || 0;
              if (t.type === 'earn') sumGChoco += amt;
              else if (t.type === 'spend') sumGChoco -= amt;
            }
          });
          finalCalculatedGChoco = Math.max(uGChoco, sumGChoco);
        }
      }

      // Achievement rewards check
      const mergedClaimed = new Set(u.claimedAchievements || []);
      const mergedUnlocked = new Set(u.unlockedAchievements || []);
      restoredAchievements.forEach(id => {
        mergedUnlocked.add(id);
        mergedClaimed.add(id);
      });

      const claimedAchievementsList = Array.from(mergedClaimed);
      let claimedAchievementsChocoReward = 0;
      let claimedAchievementsGChocoReward = 0;
      claimedAchievementsList.forEach(achId => {
        const ach = ACHIEVEMENTS_LIST.find(a => a.id === achId);
        if (ach) {
          claimedAchievementsChocoReward += ach.chocoReward || 0;
          claimedAchievementsGChocoReward += ach.goldenReward || 0;
        }
      });

      // Admin verification - BẢO TOÀN GỐC 9.999.999 và khôi phục cộng thêm tích lũy!
      const isUserAdmin = u.email?.toLowerCase() === 'cucnau01@gmail.com';
      if (isUserAdmin) {
        finalCalculatedChoco = 9999999 + calculatedEarnedChoco - calculatedSpentChoco;
        finalCalculatedGChoco = 9999999 + calculatedEarnedGChoco - calculatedSpentGChoco;
      } else {
        finalCalculatedChoco = Math.max(finalCalculatedChoco, uChoco);
        finalCalculatedGChoco = Math.max(finalCalculatedGChoco, uGChoco);
      }

      const finalCheckInsCount = Math.max(u.totalCheckIns || 0, checkInDates.size);
      const maxVerifiableChocoEarned = ((finalCheckInsCount * 10) + claimedAchievementsChocoReward + (playCountChocoMatch * 15) + (playCountChucuGame * 15) + adminGiftsChoco + spentChocoFromAssets + (actualCommentsCount * 1) + 300);
      const maxVerifiableGChocoEarned = (claimedAchievementsGChocoReward + Math.ceil(playCountChocoMatch / 10) + conversionEarnedGChoco + adminGiftsGChoco + spentGChocoFromAssets + 5);

      let chocoCapped = false;
      const originalCalculatedChoco = finalCalculatedChoco;
      if (!isUserAdmin && finalCalculatedChoco > maxVerifiableChocoEarned) {
        finalCalculatedChoco = maxVerifiableChocoEarned;
        chocoCapped = true;
      }

      let gchocoCapped = false;
      const originalCalculatedGChoco = finalCalculatedGChoco;
      if (!isUserAdmin && finalCalculatedGChoco > maxVerifiableGChocoEarned) {
        finalCalculatedGChoco = maxVerifiableGChocoEarned;
        gchocoCapped = true;
      }

      // Restore tickets From Txs
      let ticketsFromTxs = 0;
      sortedTxs.forEach(t => {
        const desc = t.description || t.reason || "";
        if (desc.includes("Vé Gacha") || desc.includes("Gacha")) {
          const match = desc.match(/(?:Mua|Đổi\s+sang|Đổi|Tặng)\s*(\d+)/i) || desc.match(/(\d+)\s*Vé/i);
          if (match) {
            ticketsFromTxs += parseInt(match[1], 10);
          }
        }
      });

      const maxPullsFromTxs = Math.max(0, ticketsFromTxs - (u.ownedGachaTickets || 0));
      const sortedStickersWithRarity = stickersSnap.docs
        .map(doc => {
          const data = doc.data();
          const url = data.url || "";
          const rarity = stickerRarities.get(url) || 3;
          
          let time = 0;
          if (data.createdAt) {
            if (typeof data.createdAt.toMillis === 'function') {
              time = data.createdAt.toMillis();
            } else if (data.createdAt.seconds !== undefined) {
              time = data.createdAt.seconds * 1000;
            } else {
              time = new Date(data.createdAt).getTime() || 0;
            }
          }
          return { url, rarity, time };
        })
        .sort((a, b) => a.time - b.time);

      const minPullsFromStickers = sortedStickersWithRarity.length;
      const reconstructedTotalPulls = Math.max(u.totalGachaPulls || 0, maxPullsFromTxs, minPullsFromStickers);

      // PITY PRESERVATIVE logic: Keep live pity if they are already defined in DB!
      let calculatedPity5 = u.gachaPity5Star !== undefined && u.gachaPity5Star !== null ? u.gachaPity5Star : -1;
      let calculatedPity4 = u.gachaPity4Star !== undefined && u.gachaPity4Star !== null ? u.gachaPity4Star : -1;

      if (calculatedPity5 === -1) {
        const totalPulls = reconstructedTotalPulls;
        const totalUniqueStickers = sortedStickersWithRarity.length;
        if (totalPulls > 0) {
          if (totalUniqueStickers > 0) {
            const last5StarIndex = sortedStickersWithRarity.map(s => s.rarity).lastIndexOf(5);
            if (last5StarIndex === -1) {
              calculatedPity5 = totalPulls;
            } else {
              const stickersAfterLast5 = sortedStickersWithRarity.slice(last5StarIndex + 1);
              const uniqueCountAfterLast5 = stickersAfterLast5.length;
              const pullsPerUniqueSticker = totalPulls / totalUniqueStickers;
              const estimatedPullsAfterLast5 = Math.round(uniqueCountAfterLast5 * pullsPerUniqueSticker);
              calculatedPity5 = Math.max(uniqueCountAfterLast5, estimatedPullsAfterLast5);
            }
          } else {
            calculatedPity5 = totalPulls;
          }
        }
        calculatedPity5 = Math.min(calculatedPity5, 89);
        if (totalUniqueStickers > 0) {
          const count5Star = sortedStickersWithRarity.filter(s => s.rarity === 5).length;
          if (count5Star === 0 && totalPulls >= 90) {
            calculatedPity5 = totalPulls % 90;
          }
        } else if (totalPulls >= 90) {
          calculatedPity5 = totalPulls % 90;
        }
      }

      if (calculatedPity4 === -1) {
        const totalPulls = reconstructedTotalPulls;
        const totalUniqueStickers = sortedStickersWithRarity.length;
        if (totalPulls > 0) {
          if (totalUniqueStickers > 0) {
            const last4StarIndex = sortedStickersWithRarity.map(s => s.rarity).lastIndexOf(4);
            if (last4StarIndex === -1) {
              calculatedPity4 = totalPulls;
            } else {
              const stickersAfterLast4 = sortedStickersWithRarity.slice(last4StarIndex + 1);
              const uniqueCountAfterLast4 = stickersAfterLast4.length;
              const pullsPerUniqueSticker = totalPulls / totalUniqueStickers;
              const estimatedPullsAfterLast4 = Math.round(uniqueCountAfterLast4 * pullsPerUniqueSticker);
              calculatedPity4 = Math.max(uniqueCountAfterLast4, estimatedPullsAfterLast4);
            }
          } else {
            calculatedPity4 = totalPulls;
          }
        }
        calculatedPity4 = Math.min(calculatedPity4, 9);
        if (totalUniqueStickers > 0) {
          const count4Star = sortedStickersWithRarity.filter(s => s.rarity === 4).length;
          if (count4Star === 0 && totalPulls >= 10) {
            calculatedPity4 = totalPulls % 10;
          }
        } else if (totalPulls >= 10) {
          calculatedPity4 = totalPulls % 10;
        }
      }

      // Check differences
      const updates: any = {};
      let changed = false;

      if (finalCalculatedChoco !== uChoco) {
        updates.choco = finalCalculatedChoco;
        changed = true;
      }
      if (finalCalculatedGChoco !== uGChoco) {
        updates.goldenChoco = finalCalculatedGChoco;
        changed = true;
      }
      if (calculatedEarnedChoco !== (u.totalEarnedChoco || 0)) {
        updates.totalEarnedChoco = isUserAdmin ? (9999999 + calculatedEarnedChoco) : Math.min(calculatedEarnedChoco, maxVerifiableChocoEarned);
        changed = true;
      }
      if (calculatedEarnedGChoco !== (u.totalEarnedGChoco || 0)) {
        updates.totalEarnedGChoco = isUserAdmin ? (9999999 + calculatedEarnedGChoco) : Math.min(calculatedEarnedGChoco, maxVerifiableGChocoEarned);
        changed = true;
      }
      if (calculatedSpentChoco !== (u.totalSpentChoco || 0)) {
        updates.totalSpentChoco = calculatedSpentChoco;
        changed = true;
      }
      if (finalCheckInsCount !== (u.totalCheckIns || 0)) {
        updates.totalCheckIns = finalCheckInsCount;
        changed = true;
      }
      if (actualCommentsCount !== (u.totalCommentsCount || 0)) {
        updates.totalCommentsCount = actualCommentsCount;
        changed = true;
      }
      if (actualChatCount !== (u.sentMessagesCount || 0)) {
        updates.sentMessagesCount = actualChatCount;
        changed = true;
      }
      if (reconstructedTotalPulls !== (u.totalGachaPulls || 0)) {
        updates.totalGachaPulls = reconstructedTotalPulls;
        changed = true;
      }
      if (calculatedPity5 !== (u.gachaPity5Star || 0)) {
        updates.gachaPity5Star = calculatedPity5;
        changed = true;
      }
      if (calculatedPity4 !== (u.gachaPity4Star || 0)) {
        updates.gachaPity4Star = calculatedPity4;
        changed = true;
      }

      setAuditLogs(prev => [
        ...prev,
        `📊 KẾT QUẢ ĐỐI SOÁT:`,
        `   - Số dư hiện tại: ${uChoco.toLocaleString()} Choco / ${uGChoco.toLocaleString()} GChoco`,
        isUserAdmin 
          ? `   - Số dư sau đối soát (Admin): Gốc 9.999.999 + Tích lũy thực tế = ${finalCalculatedChoco.toLocaleString()} Choco / ${finalCalculatedGChoco.toLocaleString()} GChoco (Kiếm thêm ${calculatedEarnedChoco.toLocaleString()} Choco)`
          : `   - Số dư sau đối soát (Tái dựng): ${finalCalculatedChoco.toLocaleString()} Choco / ${finalCalculatedGChoco.toLocaleString()} GChoco`,
        `   - Bảo hiểm Pity (Firestore): 5⭐: ${u.gachaPity5Star || 0}/90, 4⭐: ${u.gachaPity4Star || 0}/10`,
        `   - Bảo hiểm Pity (Thực tế): 5⭐: ${calculatedPity5}/90, 4⭐: ${calculatedPity4}/10`,
        `   - Phát hiện lệch số dư/pity: ${changed ? "CÓ CHÊNH LỆCH (Cần đồng bộ)" : "KHÔNG (Đã chuẩn khớp)"}`
      ]);

      setAuditReport({
        user: u,
        uChoco,
        uGChoco,
        finalCalculatedChoco,
        finalCalculatedGChoco,
        calculatedEarnedChoco,
        calculatedSpentChoco,
        calculatedEarnedGChoco,
        calculatedSpentGChoco,
        reconstructedTotalPulls,
        calculatedPity5,
        calculatedPity4,
        ticketsFromTxs,
        checkInsCount: finalCheckInsCount,
        commentsCount: actualCommentsCount,
        chatCount: actualChatCount,
        feedCount: actualFeedCount,
        isUserAdmin,
        updates,
        changed,
        missingStickers: [...txBoughtStickerUrls].filter(url => !currentStickerUrls.has(url)),
        missingAccessories: [...txBoughtAccessoryUrls].filter(url => !currentAccessoryUrls.has(url)),
        missingUnlockedChaps: Array.from(txUnlockedChapters),
        missingUnlockedEarlyAccessChaps: Array.from(txUnlockedEarlyAccessChapters),
        mergedUnlocked: Array.from(mergedUnlocked),
        mergedClaimed: Array.from(mergedClaimed)
      });
    } catch (err: any) {
      console.error(err);
      setAuditLogs(prev => [...prev, `❌ Thất bại: ${err.message || err}`]);
    } finally {
      setIsAuditing(false);
    }
  };

  const executeSingleUserRestore = async () => {
    if (!auditReport) return;
    const { user, updates, missingStickers, missingAccessories, missingUnlockedChaps, missingUnlockedEarlyAccessChaps, mergedUnlocked, mergedClaimed } = auditReport;
    setIsAuditing(true);
    setAuditLogs(prev => [...prev, `⏳ Đang khôi phục & đồng bộ trực tiếp xuống Firestore...`]);
    try {
      const uRef = doc(db, "users", user.id);
      
      const finalUpdates = { ...updates };
      if (mergedUnlocked.length > 0) finalUpdates.unlockedAchievements = mergedUnlocked;
      if (mergedClaimed.length > 0) finalUpdates.claimedAchievements = mergedClaimed;
      if (missingUnlockedChaps.length > 0) finalUpdates.unlockedChapters = missingUnlockedChaps;
      if (missingUnlockedEarlyAccessChaps.length > 0) finalUpdates.unlockedEarlyAccessChapters = missingUnlockedEarlyAccessChaps;

      await updateDoc(uRef, finalUpdates);

      for (const sUrl of missingStickers) {
        await addDoc(collection(db, "users", user.id, "owned_stickers"), {
          url: sUrl,
          createdAt: serverTimestamp()
        });
        setAuditLogs(prev => [...prev, `   🎉 Đã khôi phục Nhãn dán: ${sUrl}`]);
      }

      for (const aUrl of missingAccessories) {
        await addDoc(collection(db, "users", user.id, "owned_accessories"), {
          url: aUrl,
          createdAt: serverTimestamp()
        });
        setAuditLogs(prev => [...prev, `   🎉 Đã khôi phục Phụ kiện: ${aUrl}`]);
      }

      setAuditLogs(prev => [...prev, `🎉 KHÔI PHỤC THÀNH CÔNG CHO ${user.displayName || user.email}! Toàn bộ dữ liệu của thành viên này đã chuẩn hóa.`]);
      setAuditReport(prev => prev ? { ...prev, changed: false } : null);
    } catch (err: any) {
      console.error(err);
      setAuditLogs(prev => [...prev, `❌ Thất bại: ${err.message || err}`]);
    } finally {
      setIsAuditing(false);
    }
  };
  const [stories, setStories] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState("");
  const [completed, setCompleted] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [editingStory, setEditingStory] = useState<Book | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Chapter Management
  const [managingStoryChapters, setManagingStoryChapters] = useState<
    string | null
  >(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [adminChapterPage, setAdminChapterPage] = useState(0);
  const [adminChapterSortDesc, setAdminChapterSortDesc] = useState(false);
  const ADMIN_CHAPTERS_PER_PAGE = 50;

  const [chapterModalMode, setChapterModalMode] = useState<
    "add" | "edit" | null
  >(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [cTitle, setCTitle] = useState("");
  const [cContent, setCContent] = useState("");
  const [cRequiresPass, setCRequiresPass] = useState(false);
  const [cRequiresEarlyAccess, setCRequiresEarlyAccess] = useState(false);
  const [cIsLockedRead, setCIsLockedRead] = useState(false);
  const [cExternalUrl, setCExternalUrl] = useState("");

  // Users Management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [givingChoco, setGivingChoco] = useState<number>(0);
  const [givingGChoco, setGivingGChoco] = useState<number>(0);
  const [banningUser, setBanningUser] = useState<AdminUser | null>(null);
  const [banDurationHours, setBanDurationHours] = useState<number>(0); // 0 means permanent

  // User Stats Recovery Editor React State
  const [editingUserStats, setEditingUserStats] = useState<AdminUser | null>(null);
  const [editStatLevel, setEditStatLevel] = useState<number>(1);
  const [editStatExp, setEditStatExp] = useState<number>(0);
  const [editStatActivePoints, setEditStatActivePoints] = useState<number>(0);
  const [editStatChoco, setEditStatChoco] = useState<number>(0);
  const [editStatGoldenChoco, setEditStatGoldenChoco] = useState<number>(0);
  const [editStatChucuLevel, setEditStatChucuLevel] = useState<number>(1);
  const [editStatChucuExp, setEditStatChucuExp] = useState<number>(0);
  const [editStatChucuSatiety, setEditStatChucuSatiety] = useState<number>(70);
  const [editStatChucuHappiness, setEditStatChucuHappiness] = useState<number>(50);
  const [editStatChucuInteractions, setEditStatChucuInteractions] = useState<number>(0);
  const [editStatChucuPremiumFeeds, setEditStatChucuPremiumFeeds] = useState<number>(0);
  const [editStatTotalChaptersRead, setEditStatTotalChaptersRead] = useState<number>(0);
  const [editStatTotalCommentsCount, setEditStatTotalCommentsCount] = useState<number>(0);
  const [editStatCheckInStreak, setEditStatCheckInStreak] = useState<number>(0);
  const [editStatLastCheckInDate, setEditStatLastCheckInDate] = useState<string>("");
  const [editStatOwnedStreakTickets, setEditStatOwnedStreakTickets] = useState<number>(0);
  
  const [editStatTotalCheckIns, setEditStatTotalCheckIns] = useState<number>(0);
  const [editStatTotalGachaPulls, setEditStatTotalGachaPulls] = useState<number>(0);
  const [editStatGachaPity5Star, setEditStatGachaPity5Star] = useState<number>(0);
  const [editStatGachaPity4Star, setEditStatGachaPity4Star] = useState<number>(0);
  const [editStatOwnedGachaTickets, setEditStatOwnedGachaTickets] = useState<number>(0);

  const openEditUserStats = (u: AdminUser) => {
    setEditingUserStats(u);
    setEditStatLevel(u.level ?? 1);
    setEditStatExp(u.exp ?? 0);
    setEditStatActivePoints(u.activePoints ?? 0);
    setEditStatChoco(u.choco ?? 0);
    setEditStatGoldenChoco(u.goldenChoco ?? 0);
    setEditStatChucuLevel(u.chucuLevel ?? 1);
    setEditStatChucuExp(u.chucuExp ?? 0);
    setEditStatChucuSatiety(u.chucuSatiety ?? 70);
    setEditStatChucuHappiness(u.chucuHappiness ?? 50);
    setEditStatChucuInteractions(u.chucuInteractions ?? 0);
    setEditStatChucuPremiumFeeds(u.chucuPremiumFeeds ?? 0);
    setEditStatTotalChaptersRead(u.totalChaptersRead ?? 0);
    setEditStatTotalCommentsCount(u.totalCommentsCount ?? 0);
    setEditStatCheckInStreak(u.checkInStreak ?? 0);
    setEditStatLastCheckInDate(u.lastCheckInDate ?? "");
    setEditStatOwnedStreakTickets(u.ownedStreakTickets ?? 0);
    setEditStatTotalCheckIns(u.totalCheckIns ?? 0);
    setEditStatTotalGachaPulls(u.totalGachaPulls ?? 0);
    setEditStatGachaPity5Star(u.gachaPity5Star ?? 0);
    setEditStatGachaPity4Star(u.gachaPity4Star ?? 0);
    setEditStatOwnedGachaTickets(u.ownedGachaTickets ?? 0);
  };

  const handleSaveUserStats = async () => {
    if (!editingUserStats) return;
    try {
      await updateDoc(doc(db, "users", editingUserStats.id), {
        level: editStatLevel,
        exp: editStatExp,
        activePoints: editStatActivePoints,
        choco: editStatChoco,
        goldenChoco: editStatGoldenChoco,
        chucuLevel: editStatChucuLevel,
        chucuExp: editStatChucuExp,
        chucuSatiety: editStatChucuSatiety,
        chucuHappiness: editStatChucuHappiness,
        chucuInteractions: editStatChucuInteractions,
        chucuPremiumFeeds: editStatChucuPremiumFeeds,
        totalChaptersRead: editStatTotalChaptersRead,
        totalCommentsCount: editStatTotalCommentsCount,
        checkInStreak: editStatCheckInStreak,
        lastCheckInDate: editStatLastCheckInDate ? editStatLastCheckInDate : null,
        ownedStreakTickets: editStatOwnedStreakTickets,
        totalCheckIns: editStatTotalCheckIns,
        totalGachaPulls: editStatTotalGachaPulls,
        gachaPity5Star: editStatGachaPity5Star,
        gachaPity4Star: editStatGachaPity4Star,
        ownedGachaTickets: editStatOwnedGachaTickets,
      });
      alert(`Đã khôi phục và cập nhật chỉ số cho thành viên ${editingUserStats.displayName} thành công!`);
      setEditingUserStats(null);
      fetchUsers();
    } catch (err: any) {
      alert("Lỗi khi cập nhật chỉ số: " + (err.message || err));
    }
  };

  const handleBanUser = async () => {
    if (!banningUser) return;
    try {
      const banExpiresAt =
        banDurationHours > 0
          ? Date.now() + banDurationHours * 60 * 60 * 1000
          : null;
      await updateDoc(doc(db, "users", banningUser.id), {
        isBanned: true,
        banExpiresAt,
      });
      alert(
        `Đã cấm tài khoản ${banningUser.email} ${banDurationHours > 0 ? `trong ${banDurationHours} giờ` : "vĩnh viễn"}.`,
      );
      setBanningUser(null);
      setBanDurationHours(0);
      fetchUsers();
    } catch (err: any) {
      alert("Không thể cấm tài khoản. Lỗi: " + (err.message || err));
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isBanned: false,
        banExpiresAt: null,
      });
      alert("Đã gỡ cấm tài khoản.");
      fetchUsers();
    } catch (err: any) {
      alert("Không thể gỡ cấm. Lỗi: " + (err.message || err));
    }
  };

  // Comments Management
  const [comments, setComments] = useState<AdminComment[]>([]);

  // Lounge Messages Management
  const [messages, setMessages] = useState<any[]>([]);

  // Avatar Stickers state
  const [stickers, setStickers] = useState<any[]>([]);
  const [stName, setStName] = useState("");
  const [stDesc, setStDesc] = useState("");
  const [stPrice, setStPrice] = useState<number>(0);
  const [stType, setStType] = useState<"choco" | "golden">("choco");
  const [stUrl, setStUrl] = useState("");
  const [editingSticker, setEditingSticker] = useState<any | null>(null);
  const stickerFileInputRef = useRef<HTMLInputElement>(null);
  const editStickerFileInputRef = useRef<HTMLInputElement>(null);
  const poolStickerFileInputRef = useRef<HTMLInputElement>(null);

  // Avatar Accessories state
  const [accessories, setAccessories] = useState<any[]>([]);
  const [accName, setAccName] = useState("");
  const [accDesc, setAccDesc] = useState("");
  const [accPrice, setAccPrice] = useState<number>(0);
  const [accType, setAccType] = useState<"choco" | "golden">("choco");
  const [accUrl, setAccUrl] = useState("");
  const [accRequiredLevel, setAccRequiredLevel] = useState<number>(1);
  const [editingAccessory, setEditingAccessory] = useState<any | null>(null);
  const accessoryFileInputRef = useRef<HTMLInputElement>(null);
  const editAccessoryFileInputRef = useRef<HTMLInputElement>(null);

  // Chucu Accessories state
  const [chucuAccessories, setChucuAccessories] = useState<any[]>([]);
  const [cAccName, setCAccName] = useState("");
  const [cAccDesc, setCAccDesc] = useState("");
  const [cAccPrice, setCAccPrice] = useState<number>(0);
  const [cAccType, setCAccType] = useState<"choco" | "golden">("choco");
  const [cAccUrl, setCAccUrl] = useState("");
  const [cAccRequiredLevel, setCAccRequiredLevel] = useState<number>(1);
  const [editingChucuAccessory, setEditingChucuAccessory] = useState<
    any | null
  >(null);
  const chucuAccessoryFileInputRef = useRef<HTMLInputElement>(null);
  const editChucuAccessoryFileInputRef = useRef<HTMLInputElement>(null);

  // Radio Tracks Management state
  const [customTracks, setCustomTracks] = useState<any[]>([]);
  const [radioTitle, setRadioTitle] = useState("");
  const [radioDesc, setRadioDesc] = useState("");
  const [radioStreamUrl, setRadioStreamUrl] = useState("");
  const [radioTrackType, setRadioTrackType] = useState<"url" | "spotify" | "file">("file");
  const [radioSpotifyUrl, setRadioSpotifyUrl] = useState("");
  const [radioAudioBase64, setRadioAudioBase64] = useState("");
  const [radioFileSizeKB, setRadioFileSizeKB] = useState<number | null>(null);
  const adminRadioFileInputRef = useRef<HTMLInputElement>(null);

  // Posts Management
  const [posts, setPosts] = useState<any[]>([]);

  // Gacha Banner Management states
  const [gachaBanners, setGachaBanners] = useState<any[]>([]);
  const [rawGachaBanners, setRawGachaBanners] = useState<any[]>([]);
  const [dbGachaItems, setDbGachaItems] = useState<any[]>([]);

  useEffect(() => {
    const merged = rawGachaBanners.map(banner => {
      const bannerItems = dbGachaItems.filter(item => item.bannerId === banner.id);
      
      const pool5Star = [
        ...(banner.pool5Star || []).filter((item: any) => !dbGachaItems.some(gi => gi.id === item.id)),
        ...bannerItems.filter(item => item.rarity === 5)
      ];
      
      const pool4Star = [
        ...(banner.pool4Star || []).filter((item: any) => !dbGachaItems.some(gi => gi.id === item.id)),
        ...bannerItems.filter(item => item.rarity === 4)
      ];

      return {
        ...banner,
        pool5Star,
        pool4Star
      };
    });
    setGachaBanners(merged);
  }, [rawGachaBanners, dbGachaItems]);
  const [selectedBannerId, setSelectedBannerId] = useState<string>("");
  const [gbType, setGbType] = useState<"standard" | "limited">("standard");
  const [gbName, setGbName] = useState("");
  const [gbDescription, setGbDescription] = useState("");
  const [gbImage, setGbImage] = useState("");
  const [gbActive, setGbActive] = useState(true);
  const [gbStartDate, setGbStartDate] = useState("");
  const [gbEndDate, setGbEndDate] = useState("");

  const [poolItemName, setPoolItemName] = useState("");
  const [poolItemRarity, setPoolItemRarity] = useState<4 | 5>(5);
  const [poolItemType, setPoolItemType] = useState<"sticker" | "fragment">("sticker");
  const [poolItemImage, setPoolItemImage] = useState("");
  const [poolItemDesc, setPoolItemDesc] = useState("");

  const [isMigratingPool, setIsMigratingPool] = useState(false);

  const handleMigrateLegacyPool = async () => {
    setIsMigratingPool(true);
    try {
      let migratedCount = 0;
      for (const banner of rawGachaBanners) {
        const p5 = banner.pool5Star || [];
        const p4 = banner.pool4Star || [];
        
        if (p5.length === 0 && p4.length === 0) continue;

        // Copy pool5Star
        for (const item of p5) {
          const alreadyExists = dbGachaItems.some(gi => gi.id === item.id);
          if (!alreadyExists) {
            await addDoc(collection(db, "gacha_items"), {
              id: item.id || "item-" + Date.now() + Math.random().toString(36).substr(2, 5),
              bannerId: banner.id,
              name: item.name || "Sticker Không Tên",
              rarity: 5,
              type: item.type || "sticker",
              image: item.image || "",
              description: item.description || "",
              createdAt: item.createdAt || new Date().toISOString()
            });
            migratedCount++;
          }
        }

        // Copy pool4Star
        for (const item of p4) {
          const alreadyExists = dbGachaItems.some(gi => gi.id === item.id);
          if (!alreadyExists) {
            await addDoc(collection(db, "gacha_items"), {
              id: item.id || "item-" + Date.now() + Math.random().toString(36).substr(2, 5),
              bannerId: banner.id,
              name: item.name || "Sticker Không Tên",
              rarity: 4,
              type: item.type || "sticker",
              image: item.image || "",
              description: item.description || "",
              createdAt: item.createdAt || new Date().toISOString()
            });
            migratedCount++;
          }
        }

        // Now clear the fields in the banner document
        await updateDoc(doc(db, "gacha_banners", banner.id), {
          pool5Star: [],
          pool4Star: []
        });
      }

      alert(`Tối ưu dữ liệu hoàn tất! Đã di cư thành công ${migratedCount} Sticker sang hệ thống lưu trữ phân rã mới. Dung lượng bản ghi chính đã giảm từ 1MB+ về dưới 1KB!`);
    } catch (err: any) {
      console.error(err);
      alert("Lỗi tối ưu hóa dữ liệu: " + err.message);
    } finally {
      setIsMigratingPool(false);
    }
  };

  const [gachaSubTab, setGachaSubTab] = useState<"standard" | "limited">("standard");
  const [editingStdBannerName, setEditingStdBannerName] = useState("");
  const [isEditingStdBannerName, setIsEditingStdBannerName] = useState(false);
  const [featured5StarId, setFeatured5StarId] = useState("");
  const [customFeatured5StarName, setCustomFeatured5StarName] = useState("");
  const [customFeatured5StarImage, setCustomFeatured5StarImage] = useState("");

  const [featured4Star1Id, setFeatured4Star1Id] = useState("");
  const [customFeatured4Star1Name, setCustomFeatured4Star1Name] = useState("");
  const [customFeatured4Star1Image, setCustomFeatured4Star1Image] = useState("");

  const [featured4Star2Id, setFeatured4Star2Id] = useState("");
  const [customFeatured4Star2Name, setCustomFeatured4Star2Name] = useState("");
  const [customFeatured4Star2Image, setCustomFeatured4Star2Image] = useState("");

  const [featured4Star3Id, setFeatured4Star3Id] = useState("");
  const [customFeatured4Star3Name, setCustomFeatured4Star3Name] = useState("");
  const [customFeatured4Star3Image, setCustomFeatured4Star3Image] = useState("");

  // Titles Management
  const [globalTitles, setGlobalTitles] = useState<CustomTitle[]>([]);
  const [achievementColors, setAchievementColors] = useState<
    Record<string, string>
  >({});
  const [newTitleName, setNewTitleName] = useState("");
  const [newTitleColor, setNewTitleColor] = useState("#8D6E63");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleName, setEditingTitleName] = useState("");
  const [editingTitleColor, setEditingTitleColor] = useState("");
  const [assigningTitleUser, setAssigningTitleUser] =
    useState<AdminUser | null>(null);
  const [selectedTitleIdToAssign, setSelectedTitleIdToAssign] =
    useState<string>("");
  const [viewingTitleUsers, setViewingTitleUsers] = useState<{
    id: string;
    name: string;
    isAchievement: boolean;
  } | null>(null);

  useEffect(() => {
    const isReady =
      email?.toLowerCase() === "cucnau01@gmail.com" ||
      firebaseUser?.email?.toLowerCase() === "cucnau01@gmail.com";
    if (isReady) {
      fetchStories();
      fetchUsers();
      fetchComments();
      fetchMessages();
      fetchStickers();
      fetchPosts();
      fetchGlobalTitles();
      fetchAchievementColors();
    }
  }, [email, firebaseUser, activeTab]);

  const fetchAchievementColors = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "achievement_colors"));
      if (docSnap.exists()) {
        setAchievementColors(docSnap.data() as Record<string, string>);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const unsubStories = onSnapshot(
      query(collection(db, "stories"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Book[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            title: data.title,
            author: data.author,
            coverUrl: data.coverUrl || "",
            description: data.description || "",
            genres: data.genres || [],
            chapterCount: data.chapterCount || 0,
            completed: data.completed || false,
            externalUrl: data.externalUrl || "",
          });
        });
        setStories(list);
      },
      (err) => {
        console.error("Lỗi tải danh sách truyện realtime:", err);
      },
    );

    return () => {
      unsubStories();
    };
  }, []);

  const fetchStories = async () => {
    // Legacy function kept for references, but data is now fetched via onSnapshot above
  };

  const fetchGlobalTitles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "custom_titles"));
      const list: CustomTitle[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || "",
          color: data.color || "#8D6E63",
        });
      });
      setGlobalTitles(list);
    } catch (err: any) {
      console.error("Lỗi tải danh hiệu:", err);
    }
  };

  const handleSaveAchievementColor = async (
    achievementId: string,
    color: string,
  ) => {
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        doc(db, "settings", "achievement_colors"),
        { [achievementId]: color },
        { merge: true },
      );
    } catch (err) {
      console.error("Failed to save achievement color", err);
    }
  };

  const handleCreateTitle = async () => {
    if (!newTitleName.trim()) return;
    try {
      await addDoc(collection(db, "custom_titles"), {
        name: newTitleName.trim(),
        color: newTitleColor,
        createdAt: serverTimestamp(),
      });
      setNewTitleName("");
      fetchGlobalTitles();
      alert("Đã tạo danh hiệu mới");
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleStartEditTitle = (t: CustomTitle) => {
    setEditingTitleId(t.id);
    setEditingTitleName(t.name);
    setEditingTitleColor(t.color);
  };

  const handleSaveEditTitle = async () => {
    if (!editingTitleId || !editingTitleName.trim()) return;
    try {
      await updateDoc(doc(db, "custom_titles", editingTitleId), {
        name: editingTitleName.trim(),
        color: editingTitleColor,
      });

      const usersSnapshot = await getDocs(collection(db, "users"));
      const batch = writeBatch(db);
      let count = 0;
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.customTitles && userData.customTitles.length > 0) {
          const hasTitle = userData.customTitles.find(
            (ct: any) => ct.id === editingTitleId,
          );
          if (hasTitle) {
            const updatedTitles = userData.customTitles.map((ct: any) =>
              ct.id === editingTitleId
                ? {
                    ...ct,
                    name: editingTitleName.trim(),
                    color: editingTitleColor,
                  }
                : ct,
            );
            batch.update(userDoc.ref, { customTitles: updatedTitles });
            count++;
          }
        }
      });
      if (count > 0) await batch.commit();

      setEditingTitleId(null);
      fetchGlobalTitles();
      fetchUsers();
      alert("Đã cập nhật danh hiệu");
    } catch (err: any) {
      alert("Lỗi sửa danh hiệu: " + err.message);
    }
  };

  const handleCancelEditTitle = () => {
    setEditingTitleId(null);
  };

  const handleDeleteTitle = async (id: string) => {
    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa danh hiệu này?",
      action: async () => {
        try {
          await deleteDoc(doc(db, "custom_titles", id));
          fetchGlobalTitles();
        } catch (err: any) {
          alert("Lỗi: " + err.message);
        }
      },
    });
  };

  const handleAssignTitle = async () => {
    if (!assigningTitleUser || !selectedTitleIdToAssign) return;
    const titleObj = globalTitles.find((t) => t.id === selectedTitleIdToAssign);
    if (!titleObj) return;

    try {
      const currentTitles = assigningTitleUser.customTitles || [];
      if (currentTitles.find((t) => t.id === titleObj.id)) {
        alert("Người dùng đã có danh hiệu này");
        return;
      }

      const newTitles = [...currentTitles, titleObj];
      await updateDoc(doc(db, "users", assigningTitleUser.id), {
        customTitles: newTitles,
      });
      setAssigningTitleUser(null);
      setSelectedTitleIdToAssign("");
      fetchUsers();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleRemoveUserTitle = async (userId: string, titleId: string) => {
    setConfirmDialog({
      text: "Gỡ danh hiệu của người dùng này?",
      action: async () => {
        try {
          const user = users.find((u) => u.id === userId);
          if (!user) return;
          const newTitles = (user.customTitles || []).filter(
            (t) => t.id !== titleId,
          );
          await updateDoc(doc(db, "users", userId), {
            customTitles: newTitles,
          });
          fetchUsers();
        } catch (err: any) {
          alert("Lỗi: " + err.message);
        }
      },
    });
  };

  const handleRemoveUserAchievement = async (
    userId: string,
    achievementId: string,
  ) => {
    setConfirmDialog({
      text: "Gỡ danh hiệu thành tựu của người dùng này?",
      action: async () => {
        try {
          const user = users.find((u) => u.id === userId);
          if (!user) return;
          const newClaimed = (user.claimedAchievements || []).filter(
            (id) => id !== achievementId,
          );
          const newUnlocked = (user.unlockedAchievements || []).filter(
            (id) => id !== achievementId,
          );
          await updateDoc(doc(db, "users", userId), {
            claimedAchievements: newClaimed,
            unlockedAchievements: newUnlocked,
          });
          fetchUsers();
        } catch (err: any) {
          alert("Lỗi: " + err.message);
        }
      },
    });
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list: AdminUser[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          displayName: data.displayName || "Vô danh",
          email: data.email || "",
          choco: data.choco || 0,
          goldenChoco: data.goldenChoco || 0,
          isBanned: data.isBanned || false,
          banExpiresAt: data.banExpiresAt || null,
          customTitles: data.customTitles || [],
          claimedAchievements: data.claimedAchievements || [],
          unlockedAchievements: data.unlockedAchievements || [],
          level: data.level !== undefined ? data.level : 1,
          exp: data.exp !== undefined ? data.exp : 0,
          activePoints: data.activePoints !== undefined ? data.activePoints : 0,
          chucuLevel: data.chucuLevel !== undefined ? data.chucuLevel : 1,
          chucuExp: data.chucuExp !== undefined ? data.chucuExp : 0,
          chucuSatiety: data.chucuSatiety !== undefined ? data.chucuSatiety : 70,
          chucuHappiness: data.chucuHappiness !== undefined ? data.chucuHappiness : 50,
          chucuInteractions: data.chucuInteractions !== undefined ? data.chucuInteractions : 0,
          chucuPremiumFeeds: data.chucuPremiumFeeds !== undefined ? data.chucuPremiumFeeds : 0,
          totalChaptersRead: data.totalChaptersRead !== undefined ? data.totalChaptersRead : 0,
          totalCommentsCount: data.totalCommentsCount !== undefined ? data.totalCommentsCount : 0,
          checkInStreak: data.checkInStreak !== undefined ? data.checkInStreak : 0,
          lastCheckInDate: data.lastCheckInDate !== undefined ? data.lastCheckInDate : "",
          ownedStreakTickets: data.ownedStreakTickets !== undefined ? data.ownedStreakTickets : 0,
          totalCheckIns: data.totalCheckIns !== undefined ? data.totalCheckIns : 0,
          totalGachaPulls: data.totalGachaPulls !== undefined ? data.totalGachaPulls : 0,
          gachaPity5Star: data.gachaPity5Star !== undefined ? data.gachaPity5Star : 0,
          gachaPity4Star: data.gachaPity4Star !== undefined ? data.gachaPity4Star : 0,
          ownedGachaTickets: data.ownedGachaTickets !== undefined ? data.ownedGachaTickets : 0,
        });
      });
      setUsers(list);
    } catch (err: any) {
      console.error("Lỗi tải danh sách người dùng:", err);
      alert("Không thể tải danh sách người dùng. Lỗi: " + (err.message || err));
    }
  };

  const fetchComments = async () => {
    try {
      const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list: AdminComment[] = [];
      const missingTargetIds = new Set<string>();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.storyTitle && data.targetId && data.targetId !== 'Hệ thống') {
           missingTargetIds.add(data.targetId);
        }
        list.push({
          id: docSnap.id,
          targetId: data.targetId,
          uid: data.uid,
          displayName: data.displayName || "Vô danh",
          content: data.content,
          type: data.type || "story",
          createdAt: data.createdAt,
          storyTitle: data.storyTitle,
          storyId: data.storyId,
          chapterTitle: data.chapterTitle,
          giftAmount: data.giftAmount || 0,
        });
      });

      if (missingTargetIds.size > 0) {
         try {
            const sdocs = await getDocs(collection(db, "stories"));
            const allChaptersMap: Record<string, { storyId: string, storyTitle: string, chapterTitle: string }> = {};
            for (const s of sdocs.docs) {
               const sid = s.id;
               const stitle = s.data().title;
               allChaptersMap[sid] = { storyId: sid, storyTitle: stitle, chapterTitle: '' };
               const cdocs = await getDocs(collection(db, "stories", sid, "chapters"));
               cdocs.forEach(c => {
                  allChaptersMap[c.id] = { storyId: sid, storyTitle: stitle, chapterTitle: c.data().title || "Chương" };
               });
            }

            for (let i = 0; i < list.length; i++) {
               const c = list[i];
               if (!c.storyTitle && c.targetId && allChaptersMap[c.targetId]) {
                  const info = allChaptersMap[c.targetId];
                  c.storyTitle = info.storyTitle;
                  c.storyId = info.storyId;
                  if (!c.chapterTitle && info.chapterTitle) {
                     c.chapterTitle = info.chapterTitle;
                  }
                  
                  updateDoc(doc(db, "comments", c.id), {
                     storyTitle: c.storyTitle,
                     storyId: c.storyId,
                     chapterTitle: c.chapterTitle || null
                  }).catch(console.error);
               }
            }
         } catch (e) {
            console.error("Lỗi fix chapters:", e);
         }
      }

      setComments(list);
    } catch (err: any) {
      console.error("Lỗi tải bình luận:", err);
      alert("Không thể tải bình luận. Lỗi: " + (err.message || err));
    }
  };

  const fetchMessages = async () => {
    try {
      const q = query(
        collection(db, "chatMessages"),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid,
          displayName: data.displayName || "Vô danh",
          content: data.content,
          createdAt: data.createdAt,
        });
      });
      setMessages(list);
    } catch (err: any) {
      console.error("Lỗi tải tin nhắn:", err);
      alert("Không thể tải tin nhắn. Lỗi: " + (err.message || err));
    }
  };

  useEffect(() => {
    const unsubStickers = onSnapshot(
      query(collection(db, "store_stickers"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: any[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            ...data,
          });
        });
        setStickers(list);
      },
      (err) => {
        console.error("Error fetching stickers realtime:", err);
      },
    );

    const unsubAccessories = onSnapshot(
      query(collection(db, "store_accessories"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: any[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            ...data,
          });
        });
        setAccessories(list);
      },
      (err) => {
        console.error("Error fetching accessories realtime:", err);
      },
    );

    const unsubChucuAccessories = onSnapshot(
      query(
        collection(db, "store_chucu_accessories"),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setChucuAccessories(list);
      },
      (err) => {
        console.error("Error fetching chucu accessories:", err);
      },
    );

    const unsubRadioTracks = onSnapshot(
      query(
        collection(db, "radioTracks"),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCustomTracks(list);
      },
      (err) => {
        console.error("Error fetching radio tracks realtime:", err);
      },
    );

    const unsubGacha = onSnapshot(
      collection(db, "gacha_banners"),
      (snap) => {
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRawGachaBanners(list);
        if (list.length === 0) {
          const initialBanner = {
            type: "standard",
            name: "Cốc Choco Nóng",
            description: "Gacha Thường Trực - Nơi mang lại những hương vị cổ điển.",
            image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=600&auto=format&fit=crop",
            pool5Star: [],
            pool4Star: [],
            pool3Star: [
              { id: "s3-1", name: "10 Mảnh Choco", rarity: 3, type: "fragment" },
            ],
            active: true
          };
          addDoc(collection(db, "gacha_banners"), initialBanner);
        }
      },
      (err) => {
        console.error("Error fetching gacha banners:", err);
      }
    );

    const unsubGachaItems = onSnapshot(
      collection(db, "gacha_items"),
      (snap) => {
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id_db: docSnap.id, ...docSnap.data() });
        });
        setDbGachaItems(list);
      },
      (err) => {
        console.error("Error fetching gacha items realtime:", err);
      }
    );

    return () => {
      unsubStickers();
      unsubAccessories();
      unsubChucuAccessories();
      unsubRadioTracks();
      unsubGacha();
      unsubGachaItems();
    };
  }, []);

  const fetchStickers = async () => {
    // Legacy function kept for references, but data is now fetched via onSnapshot above
  };

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "newsFeed"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid,
          displayName: data.displayName || "Vô danh",
          content: data.content,
          createdAt: data.createdAt,
        });
      });
      setPosts(list);
    } catch (err: any) {
      console.error("Lỗi tải bài đăng:", err);
    }
  };

  const handleDeletePost = async (id: string, postUid?: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;
    try {
      await deleteDoc(doc(db, "newsFeed", id));
      if (postUid) {
        await deleteDoc(doc(db, `users/${postUid}/reviews`, id));
      }
      setPosts(posts.filter((m) => m.id !== id));
      alert("Đã xóa bài đăng.");
    } catch (err: any) {
      alert("Không thể xóa. Lỗi: " + (err.message || err));
    }
  };

  const handleImageResize = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 600;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditing = false,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let base64Data: string;
    if (file.type === "image/gif") {
      base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    } else {
      base64Data = await handleImageResize(file);
    }

    if (base64Data.length > 500000) {
      alert("Ảnh quá lớn! Vui lòng chọn ảnh dung lượng nhỏ hơn (dưới ~350KB).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      return;
    }

    if (isEditing && editingStory) {
      setEditingStory({ ...editingStory, coverUrl: base64Data });
    } else {
      setCoverUrl(base64Data);
    }
  };

  const handleStickerImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditing = false,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let base64Data: string;
    if (file.type === "image/gif") {
      base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    } else {
      base64Data = await handleImageResize(file);
    }

    if (base64Data.length > 500000) {
      alert(
        "Ảnh sticker quá lớn! Vui lòng chọn ảnh dung lượng nhỏ hơn (dưới ~350KB).",
      );
      if (stickerFileInputRef.current) stickerFileInputRef.current.value = "";
      if (editStickerFileInputRef.current)
        editStickerFileInputRef.current.value = "";
      return;
    }

    if (isEditing && editingSticker) {
      setEditingSticker({ ...editingSticker, url: base64Data });
    } else {
      setStUrl(base64Data);
    }
  };

  const handleStickerPoolResize = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 400; // Crisp and clean 400px maximum dimension
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, width, height); // Keep transparency
            ctx.drawImage(img, 0, 0, width, height);
          }
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => {
          reject(new Error("Không thể đọc ảnh"));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error("Không thể đọc file"));
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePoolStickerImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 950 * 1024) {
      alert("Ảnh sticker quá lớn! Vui lòng chọn ảnh dưới 950KB để đảm bảo hệ thống lưu trữ hoạt động ổn định.");
      if (poolStickerFileInputRef.current) poolStickerFileInputRef.current.value = "";
      return;
    }

    try {
      if (file.type === "image/gif") {
        // Safe to read base64 directly as individual documents can up to 1MB
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
        setPoolItemImage(base64Data);
      } else {
        const base64Data = await handleStickerPoolResize(file);
        setPoolItemImage(base64Data);
      }
    } catch (err: any) {
      alert("Lỗi tải ảnh sticker gacha: " + err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const genreArray = genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);
      const slug = generateSlug(title);
      await addDoc(collection(db, "stories"), {
        title,
        slug,
        author,
        coverUrl,
        description,
        genres: genreArray,
        chapterCount: 0,
        completed,
        externalUrl: externalUrl.trim(),
        createdAt: serverTimestamp(),
        updatedAt: Date.now(),
      });
      setTitle("");
      setAuthor("");
      setCoverUrl("");
      setDescription("");
      setGenres("");
      setCompleted(false);
      setExternalUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error(err);
      if (err?.code === "resource-exhausted") {
        alert(
          "Lỗi: Firebase đã hết tài nguyên viết miễn phí hôm nay (Quota Limit Exceeded). Không thể thêm truyện.",
        );
      } else {
        alert("Lỗi thêm truyện: " + err.message);
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;
    try {
      const genreArray =
        typeof editingStory.genres === "string"
          ? (editingStory.genres as string)
              .split(",")
              .map((g: string) => g.trim())
              .filter(Boolean)
          : editingStory.genres;

      const slug = generateSlug(editingStory.title);
      await updateDoc(doc(db, "stories", editingStory.id), {
        title: editingStory.title,
        slug,
        author: editingStory.author,
        coverUrl: editingStory.coverUrl,
        description: editingStory.description || "",
        genres: genreArray,
        completed: editingStory.completed || false,
        externalUrl: editingStory.externalUrl || "",
        updatedAt: Date.now(),
      });
      setEditingStory(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      fetchStories();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStory = (id: string) => {
    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa truyện này và tất cả chương của nó?",
      action: async () => {
        try {
          await deleteDoc(doc(db, "stories", id));
          // Clean chapters
          const chSnap = await getDocs(
            collection(db, "stories", id, "chapters"),
          );
          const batch = writeBatch(db);
          chSnap.forEach((d) => {
            batch.delete(d.ref);
          });
          await batch.commit();
          fetchStories();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  // Chapter handlers
  const fetchChaptersForAdmin = async (storyId: string) => {
    try {
      setSelectedChapterIds([]);
      const q = query(
        collection(db, "stories", storyId, "chapters"),
        orderBy("order", "asc"),
      );
      const querySnapshot = await getDocs(q);
      const list: Chapter[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title,
          content: data.content,
          order: data.order,
          isPasswordProtected: data.isPasswordProtected || false,
          requiresPass: data.requiresPass || false,
          requiresEarlyAccess: data.requiresEarlyAccess || false,
          isLockedRead: data.isLockedRead || false,
          externalUrl: data.externalUrl || "",
        });
      });
      setChapters(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkLock = (lock: boolean) => {
    if (!managingStoryChapters) return;
    if (selectedChapterIds.length === 0) {
      alert("Vui lòng chọn ít nhất một chương!");
      return;
    }
    const actionName = lock ? "khóa" : "bỏ khóa";
    const confirmMsg = `Bạn có chắc chắn muốn ${actionName} ${selectedChapterIds.length} chương đã chọn?`;

    setConfirmDialog({
      text: confirmMsg,
      action: async () => {
        try {
          const batch = writeBatch(db);
          selectedChapterIds.forEach((chapterId) => {
            const docRef = doc(
              db,
              "stories",
              managingStoryChapters,
              "chapters",
              chapterId,
            );
            batch.update(docRef, { isLockedRead: lock });
          });
          await batch.commit();
          alert("Cập nhật thành công!");
          setSelectedChapterIds([]);
          fetchChaptersForAdmin(managingStoryChapters);
        } catch (err: any) {
          console.error(err);
          alert("Có lỗi xảy ra khi cập nhật hàng loạt: " + (err.message || err));
        }
      },
    });
  };

  const openAddChapter = (storyId: string) => {
    setManagingStoryChapters(storyId);
    setChapterModalMode("add");
    setEditingChapter(null);
    setCTitle("");
    setCContent("");
    setCRequiresPass(false);
    setCRequiresEarlyAccess(false);
    setCIsLockedRead(false);
    setCExternalUrl("");
  };

  const openEditChapter = (storyId: string, chapter: Chapter) => {
    setManagingStoryChapters(storyId);
    setChapterModalMode("edit");
    setEditingChapter(chapter);
    setCTitle(chapter.title);
    setCContent(chapter.content);
    setCRequiresPass(chapter.requiresPass || false);
    setCRequiresEarlyAccess(chapter.requiresEarlyAccess || false);
    setCIsLockedRead(chapter.isLockedRead || false);
    setCExternalUrl(chapter.externalUrl || "");
  };

  const submitChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingStoryChapters) return;

    try {
      if (chapterModalMode === "add") {
        const nextOrder =
          chapters.length > 0
            ? Math.max(...chapters.map((c) => c.order)) + 1
            : 1;
        const newChapterDoc = await addDoc(
          collection(db, "stories", managingStoryChapters, "chapters"),
          {
            title: cTitle,
            content: cContent,
            order: nextOrder,
            storyId: managingStoryChapters,
            requiresPass: cRequiresPass,
            requiresEarlyAccess: cRequiresEarlyAccess,
            isLockedRead: cIsLockedRead,
            externalUrl: cExternalUrl.trim(),
            createdAt: Date.now(),
          },
        );
        // Update chapter count on story
        const storyRef = doc(db, "stories", managingStoryChapters);
        const storySnap = await getDoc(storyRef);
        if (storySnap.exists()) {
          const currentCount = storySnap.data().chapterCount || 0;
          await updateDoc(storyRef, { 
            chapterCount: currentCount + 1,
            updatedAt: Date.now()
          });

          // Send notifications to users who have saved this story
          const storyData = storySnap.data();
          const storyTitle = storyData.title || "Truyện";
          try {
            const usersQuery = query(
              collection(db, "users"),
              where("savedStories", "array-contains", managingStoryChapters),
            );
            const usersSnap = await getDocs(usersQuery);
            const notifyPromises = usersSnap.docs.map((userDoc) => {
              return addDoc(collection(db, "notifications"), {
                userId: userDoc.id,
                storyId: managingStoryChapters,
                chapterId: newChapterDoc.id,
                storyTitle: storyTitle,
                chapterTitle: cTitle,
                isRead: false,
                createdAt: Date.now(),
              });
            });
            await Promise.all(notifyPromises);
          } catch (notifErr) {
            console.error("Lỗi gửi thông báo:", notifErr);
          }
        }
      } else if (chapterModalMode === "edit" && editingChapter) {
        await updateDoc(
          doc(
            db,
            "stories",
            managingStoryChapters,
            "chapters",
            editingChapter.id,
          ),
          {
            title: cTitle,
            content: cContent,
            requiresPass: cRequiresPass,
            requiresEarlyAccess: cRequiresEarlyAccess,
            isLockedRead: cIsLockedRead,
            externalUrl: cExternalUrl.trim(),
          },
        );
        await updateDoc(doc(db, "stories", managingStoryChapters), {
          updatedAt: Date.now()
        });
      }

      setChapterModalMode(null);
      setEditingChapter(null);
      setCTitle("");
      setCContent("");
      fetchChaptersForAdmin(managingStoryChapters);
      fetchStories();
    } catch (err: any) {
      console.error(err);
      if (err?.code === "resource-exhausted") {
        alert("Lỗi: Đã hết tài nguyên viết Firebase miễn phí hôm nay.");
      } else {
        alert("Lỗi khi lưu chương: " + err.message);
      }
    }
  };

  const deleteChapter = (storyId: string, chapterId: string) => {
    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa chương này?",
      action: async () => {
        try {
          await deleteDoc(doc(db, "stories", storyId, "chapters", chapterId));
          const storyRef = doc(db, "stories", storyId);
          const storySnap = await getDoc(storyRef);
          if (storySnap.exists()) {
            const currentCount = storySnap.data().chapterCount || 0;
            await updateDoc(storyRef, {
              chapterCount: Math.max(0, currentCount - 1),
            });
          }
          fetchChaptersForAdmin(storyId);
          fetchStories();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  // Give currency handler
  const handleGiveCurrency = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const currentChoco = data.choco || 0;
        const currentGChoco = data.goldenChoco || 0;
        await updateDoc(userRef, {
          choco: currentChoco + givingChoco,
          goldenChoco: currentGChoco + givingGChoco,
        });

        if (givingChoco !== 0) {
          await addDoc(collection(db, `users/${userId}/transactions`), {
            amount: Math.abs(givingChoco),
            currency: "choco",
            type: givingChoco > 0 ? "earn" : "spend",
            reason: "Admin cập nhật",
            createdAt: serverTimestamp(),
          });
        }
        if (givingGChoco !== 0) {
          await addDoc(collection(db, `users/${userId}/transactions`), {
            amount: Math.abs(givingGChoco),
            currency: "gchoco",
            type: givingGChoco > 0 ? "earn" : "spend",
            reason: "Admin cập nhật",
            createdAt: serverTimestamp(),
          });
        }

        alert("Tặng thành công!");
        setGivingChoco(0);
        setGivingGChoco(0);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Comments
  const deleteCommentItem = (id: string) => {
    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa bình luận này?",
      action: async () => {
        try {
          await deleteDoc(doc(db, "comments", id));
          fetchComments();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  // Delete Messages
  const deleteMessageItem = (id: string) => {
    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa tin nhắn này trong Lounge?",
      action: async () => {
        try {
          await deleteDoc(doc(db, "chatMessages", id));
          fetchMessages();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  // Sticker handlers
  const handleCreateSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stUrl) {
      alert("Vui lòng chọn ảnh sticker!");
      return;
    }
    try {
      await addDoc(collection(db, "store_stickers"), {
        name: stName,
        description: stDesc,
        price: stPrice,
        type: stType,
        url: stUrl,
        createdAt: serverTimestamp(),
      });
      setStName("");
      setStDesc("");
      setStPrice(0);
      setStType("choco");
      setStUrl("");
      if (stickerFileInputRef.current) stickerFileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Error creating sticker:", err);
      if (err?.code === "resource-exhausted") {
        alert(
          "Lỗi: Đã vượt quá hạn mức ghi dữ liệu của máy chủ Firebase hôm nay (Quota Exceeded).",
        );
      } else {
        alert("Lỗi: " + err.message);
      }
    }
  };

  const handleUpdateSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSticker) return;
    try {
      await updateDoc(doc(db, "store_stickers", editingSticker.id), {
        name: editingSticker.name,
        description: editingSticker.description,
        price: Number(editingSticker.price),
        type: editingSticker.type,
        url: editingSticker.url,
      });
      setEditingSticker(null);
      if (editStickerFileInputRef.current)
        editStickerFileInputRef.current.value = "";
      fetchStickers();
    } catch (err: any) {
      console.error("Error updating sticker:", err);
      if (err?.code === "resource-exhausted") {
        alert("Lỗi: Đã vượt quá hạn mức dữ liệu của máy chủ Firebase hôm nay.");
      } else {
        alert("Lỗi: " + err.message);
      }
    }
  };

  const deleteSticker = (id: string) => {
    const stickerToDelete = stickers.find((s) => s.id === id);
    const stickerUrl = stickerToDelete ? stickerToDelete.url : null;

    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa sticker này khỏi cửa hàng? Điều này cũng sẽ gỡ sticker khỏi hồ sơ của tất cả những ai đang sở hữu/trang bị nó.",
      action: async () => {
        try {
          await deleteDoc(doc(db, "store_stickers", id));

          if (stickerUrl) {
            // Cập nhật Firestore cho tất cả người dùng
            const usersSnap = await getDocs(collection(db, "users"));
            const batchPromises = usersSnap.docs.map(async (userDoc) => {
              const userData = userDoc.data();
              let needsUpdate = false;
              const updateData: any = {};

              if (userData.equippedStickerComment === stickerUrl) {
                updateData.equippedStickerComment = null;
                needsUpdate = true;
              }

              if (
                Array.isArray(userData.ownedStickers) &&
                userData.ownedStickers.includes(stickerUrl)
              ) {
                updateData.ownedStickers = userData.ownedStickers.filter(
                  (u: string) => u !== stickerUrl,
                );
                needsUpdate = true;
              }

              if (needsUpdate) {
                await updateDoc(doc(db, "users", userDoc.id), updateData);
              }
            });
            await Promise.all(batchPromises);

            // Đồng thời cập nhật trạng thái trong bộ nhớ cục bộ (Zustand store) nếu người dùng hiện tại đang đeo sticker này
            const {
              ownedStickers,
              equippedStickerComment,
              equippedStickerChat,
              equippedStickerPost,
              syncFromFirebase,
            } = useStore.getState();
            const newOwned = (ownedStickers || []).filter(
              (u: string) => u !== stickerUrl,
            );
            const newEquippedComment =
              equippedStickerComment === stickerUrl
                ? null
                : equippedStickerComment;
            const newEquippedChat =
              equippedStickerChat === stickerUrl ? null : equippedStickerChat;
            const newEquippedPost =
              equippedStickerPost === stickerUrl ? null : equippedStickerPost;
            syncFromFirebase({
              ownedStickers: newOwned,
              equippedStickerComment: newEquippedComment,
              equippedStickerChat: newEquippedChat,
              equippedStickerPost: newEquippedPost,
            });
          }

          fetchStickers();
        } catch (err: any) {
          console.error("Error deleting sticker:", err);
          const errMsg = err?.message || String(err);
          if (
            errMsg.toLowerCase().includes("quota") ||
            errMsg.toLowerCase().includes("exhausted") ||
            err?.code === "resource-exhausted"
          ) {
            alert(
              "Lỗi: Đã vượt quá hạn mức ghi dữ liệu của máy chủ miễn phí (Quota Limit Exceeded) hôm nay. Bạn không thể thực hiện thao tác này lúc này.",
            );
            if (
              typeof window !== "undefined" &&
              (window as any).__setQuotaExceeded
            ) {
              (window as any).__setQuotaExceeded(true);
            }
          } else {
            alert("Có lỗi xảy ra khi xóa sticker: " + errMsg);
          }
        }
      },
    });
  };

  // Accessories handlers
  const handleAccessoryImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditing = false,
    isChucu = false,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let base64Data: string;
    if (file.type === "image/gif") {
      base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    } else {
      base64Data = await handleImageResize(file);
    }

    if (base64Data.length > 500000) {
      alert(
        "Ảnh phụ kiện quá lớn! Vui lòng chọn ảnh dung lượng nhỏ hơn (dưới ~350KB).",
      );
      if (accessoryFileInputRef.current)
        accessoryFileInputRef.current.value = "";
      if (editAccessoryFileInputRef.current)
        editAccessoryFileInputRef.current.value = "";
      if (chucuAccessoryFileInputRef.current)
        chucuAccessoryFileInputRef.current.value = "";
      if (editChucuAccessoryFileInputRef.current)
        editChucuAccessoryFileInputRef.current.value = "";
      return;
    }

    if (isChucu) {
      if (isEditing && editingChucuAccessory) {
        setEditingChucuAccessory({ ...editingChucuAccessory, url: base64Data });
      } else {
        setCAccUrl(base64Data);
      }
    } else {
      if (isEditing && editingAccessory) {
        setEditingAccessory({ ...editingAccessory, url: base64Data });
      } else {
        setAccUrl(base64Data);
      }
    }
  };

  const handleCreateAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accUrl) {
      alert("Vui lòng chọn ảnh phụ kiện!");
      return;
    }
    try {
      await addDoc(collection(db, "store_accessories"), {
        name: accName,
        description: accDesc,
        price: accPrice,
        type: accType,
        url: accUrl,
        requiredLevel: accRequiredLevel,
        createdAt: serverTimestamp(),
      });
      setAccName("");
      setAccDesc("");
      setAccPrice(0);
      setAccType("choco");
      setAccUrl("");
      setAccRequiredLevel(1);
      if (accessoryFileInputRef.current)
        accessoryFileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Error creating accessory:", err);
      alert("Lỗi: " + err.message);
    }
  };

  const handleUpdateAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccessory) return;
    try {
      await updateDoc(doc(db, "store_accessories", editingAccessory.id), {
        name: editingAccessory.name,
        description: editingAccessory.description,
        price: Number(editingAccessory.price),
        type: editingAccessory.type,
        url: editingAccessory.url,
        requiredLevel: Number(editingAccessory.requiredLevel || 1),
      });
      setEditingAccessory(null);
      if (editAccessoryFileInputRef.current)
        editAccessoryFileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Error updating accessory:", err);
      alert("Lỗi: " + err.message);
    }
  };

  const deleteAccessory = (id: string) => {
    const accessoryToDelete = accessories.find((a) => a.id === id);
    const accessoryUrl = accessoryToDelete ? accessoryToDelete.url : null;

    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa phụ kiện này khỏi cửa hàng? Điều này cũng sẽ gỡ phụ kiện khỏi hồ sơ của tất cả những ai đang sở hữu/trang bị nó.",
      action: async () => {
        try {
          await deleteDoc(doc(db, "store_accessories", id));

          if (accessoryUrl) {
            // Cập nhật Firestore cho tất cả người dùng
            const usersSnap = await getDocs(collection(db, "users"));
            const batchPromises = usersSnap.docs.map(async (userDoc) => {
              const userData = userDoc.data();
              let needsUpdate = false;
              const updateData: any = {};

              if (userData.equippedAccessory === accessoryUrl) {
                updateData.equippedAccessory = null;
                needsUpdate = true;
              }

              if (
                Array.isArray(userData.ownedAccessories) &&
                userData.ownedAccessories.includes(accessoryUrl)
              ) {
                updateData.ownedAccessories = userData.ownedAccessories.filter(
                  (u: string) => u !== accessoryUrl,
                );
                needsUpdate = true;
              }

              if (needsUpdate) {
                await updateDoc(doc(db, "users", userDoc.id), updateData);
              }
            });
            await Promise.all(batchPromises);

            // Đồng thời cập nhật trạng thái trong bộ nhớ cục bộ (Zustand store) nếu người dùng hiện tại đang đeo phụ kiện này
            const { ownedAccessories, equippedAccessory, syncFromFirebase } =
              useStore.getState();
            const newOwned = (ownedAccessories || []).filter(
              (u: string) => u !== accessoryUrl,
            );
            const newEquipped =
              equippedAccessory === accessoryUrl ? null : equippedAccessory;
            syncFromFirebase({
              ownedAccessories: newOwned,
              equippedAccessory: newEquipped,
            });
          }
        } catch (err: any) {
          console.error("Error deleting accessory:", err);
          alert("Lỗi: " + err.message);
        }
      },
    });
  };

  const handleAddChucuAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cAccUrl) {
      alert("Vui lòng chọn hình ảnh thiết kế của phụ kiện (hoặc tải một ảnh lên)!");
      return;
    }
    if (!cAccName || !cAccName.trim()) {
      alert("Vui lòng nhập tên phụ kiện!");
      return;
    }
    if (!cAccDesc || !cAccDesc.trim()) {
      alert("Vui lòng nhập mô tả phụ kiện!");
      return;
    }
    if (cAccPrice === undefined || cAccPrice === null || isNaN(Number(cAccPrice)) || Number(cAccPrice) < 0) {
      alert("Vui lòng nhập giá phụ kiện hợp lệ (bằng hoặc lớn hơn 0)!");
      return;
    }
    try {
      await addDoc(collection(db, "store_chucu_accessories"), {
        name: cAccName.trim(),
        description: cAccDesc.trim(),
        price: Number(cAccPrice),
        type: cAccType,
        url: cAccUrl,
        requiredLevel: Number(cAccRequiredLevel),
        createdAt: Date.now(),
      });
      alert(`Đã tạo thành công phụ kiện Chucu: "${cAccName.trim()}"!`);
      setCAccName("");
      setCAccDesc("");
      setCAccPrice(0);
      setCAccUrl("");
      setCAccRequiredLevel(1);
      if (chucuAccessoryFileInputRef.current)
        chucuAccessoryFileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Error adding chucu accessory:", err);
      alert("Lỗi: " + err.message);
    }
  };

  const handleUpdateChucuAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChucuAccessory) return;
    try {
      await updateDoc(
        doc(db, "store_chucu_accessories", editingChucuAccessory.id),
        {
          name: editingChucuAccessory.name,
          description: editingChucuAccessory.description,
          price: Number(editingChucuAccessory.price),
          type: editingChucuAccessory.type,
          url: editingChucuAccessory.url,
          requiredLevel: Number(editingChucuAccessory.requiredLevel || 1),
        },
      );
      setEditingChucuAccessory(null);
      if (editChucuAccessoryFileInputRef.current)
        editChucuAccessoryFileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Error updating:", err);
      alert("Lỗi: " + err.message);
    }
  };

  const deleteChucuAccessory = (id: string) => {
    setConfirmDialog({
      text: "Xóa phụ kiện Chucu này khỏi cửa hàng?",
      action: async () => {
        try {
          await deleteDoc(doc(db, "store_chucu_accessories", id));
        } catch (err: any) {
          alert(err.message);
        }
      },
    });
  };

  const handleAddRadioTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!radioTitle.trim()) {
      alert("Vui lòng điền tên bài hát!");
      return;
    }

    if (!radioAudioBase64) {
      alert("Vui lòng chọn hoặc tải file âm thanh lên!");
      return;
    }

    // Double check size in Base64 characters (should be safely under 1,000,000 characters)
    if (radioAudioBase64.length > 1030000) {
      alert(
        "Tệp âm thanh của bạn quá lớn sau khi mã hóa (vượt quá 1MB giới hạn của Firestore).\n\n" +
        "Mách bạn cách sửa:\n" +
        "• Chọn file .mp3 có dung lượng nhỏ hơn 700KB.\n" +
        "• Sử dụng công cụ nén âm thanh trực tuyến (nén thành bitrate 64kbps hoặc 96kbps mono).\n" +
        "• Hoặc cắt ngắn nhạc thành 20-30 giây để Chucu vừa phát lặp lại vừa tối ưu hóa tốc độ tải trang!"
      );
      return;
    }

    try {
      await addDoc(collection(db, "radioTracks"), {
        title: radioTitle.trim(),
        desc: radioDesc.trim(),
        streamUrl: radioAudioBase64,
        isSpotify: false,
        spotifyEmbedUrl: "",
        isLocalFile: true,
        createdAt: new Date().toISOString()
      });

      // Clear states
      setRadioTitle("");
      setRadioDesc("");
      setRadioStreamUrl("");
      setRadioSpotifyUrl("");
      setRadioAudioBase64("");
      setRadioFileSizeKB(null);
      if (adminRadioFileInputRef.current) adminRadioFileInputRef.current.value = "";
      alert("Đã lưu và xuất bản bài hát Choco Radio thành công!");
    } catch (err: any) {
      alert("Lỗi khi thêm bài hát: " + err.message);
    }
  };

  const handleDeleteRadioTrack = (id: string) => {
    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa bài hát radio này?",
      action: async () => {
        try {
          await deleteDoc(doc(db, "radioTracks", id));
          alert("Đã xóa bài hát Radio thành công!");
        } catch (err: any) {
          alert("Lỗi: " + err.message);
        }
      }
    });
  };

  const handleCreateOrUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gbName.trim()) {
      alert("Vui lòng điền tên banner!");
      return;
    }
    try {
      let f5Star = null;
      if (featured5StarId === "custom") {
        f5Star = {
          id: "custom-5s-" + Date.now(),
          name: customFeatured5StarName.trim() || "Sticker 5 Sao Giao Diện",
          image: customFeatured5StarImage.trim() || "",
          rarity: 5,
          type: "sticker"
        };
      } else if (featured5StarId) {
        const found = (stickers || []).find(s => s.id === featured5StarId);
        if (found) {
          f5Star = {
            id: found.id,
            name: found.name || "Sticker 5 Sao",
            image: found.url || "",
            rarity: 5,
            type: "sticker"
          };
        }
      }

      const f4Stars = [];
      const keys4 = [
        { id: featured4Star1Id, customName: customFeatured4Star1Name, customImage: customFeatured4Star1Image },
        { id: featured4Star2Id, customName: customFeatured4Star2Name, customImage: customFeatured4Star2Image },
        { id: featured4Star3Id, customName: customFeatured4Star3Name, customImage: customFeatured4Star3Image }
      ];

      for (let i = 0; i < keys4.length; i++) {
        const { id, customName, customImage } = keys4[i];
        if (id === "custom") {
          f4Stars.push({
            id: "custom-4s-" + i + "-" + Date.now(),
            name: customName.trim() || `Sticker 4 Sao ${i+1}`,
            image: customImage.trim() || "",
            rarity: 4,
            type: "sticker"
          });
        } else if (id) {
          const found = (stickers || []).find(s => s.id === id);
          if (found) {
            f4Stars.push({
              id: found.id,
              name: found.name || "Sticker 4 Sao",
              image: found.url || "",
              rarity: 4,
              type: "sticker"
            });
          }
        }
      }

      const bannerData: any = {
        name: gbName.trim(),
        description: gbDescription.trim(),
        image: gbImage.trim() || "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=600&auto=format&fit=crop",
        type: gbType,
        active: gbActive,
        startDate: gbStartDate || null,
        endDate: gbEndDate || null,
        featured5Star: f5Star,
        featured4Stars: f4Stars
      };

      if (selectedBannerId) {
        await updateDoc(doc(db, "gacha_banners", selectedBannerId), bannerData);
        alert("Cập nhật banner thành công!");
      } else {
        // Create new
        const newBanner = {
          ...bannerData,
          pool5Star: [],
          pool4Star: [],
          pool3Star: [
            { id: "s3-1", name: "10 Mảnh Choco", rarity: 3, type: "fragment" }
          ]
        };
        await addDoc(collection(db, "gacha_banners"), newBanner);
        alert("Tạo chiến dịch banner mới thành công!");
      }
      // Reset campaign form fields
      setGbName("");
      setGbDescription("");
      setGbImage("");
      setGbStartDate("");
      setGbEndDate("");
      setGbActive(true);
      setSelectedBannerId("");
      setFeatured5StarId("");
      setCustomFeatured5StarName("");
      setCustomFeatured5StarImage("");
      setFeatured4Star1Id("");
      setCustomFeatured4Star1Name("");
      setCustomFeatured4Star1Image("");
      setFeatured4Star2Id("");
      setCustomFeatured4Star2Name("");
      setCustomFeatured4Star2Image("");
      setFeatured4Star3Id("");
      setCustomFeatured4Star3Name("");
      setCustomFeatured4Star3Image("");
    } catch (err: any) {
      console.error(err);
      alert("Đã xảy ra lỗi khi lưu banner: " + err.message);
    }
  };

  const handleEditBannerSelect = (banner: any) => {
    setSelectedBannerId(banner.id);
    setGbName(banner.name || "");
    setGbDescription(banner.description || "");
    setGbImage(banner.image || "");
    setGbType(banner.type || "standard");
    setGbActive(banner.active !== false);
    setGbStartDate(banner.startDate || "");
    setGbEndDate(banner.endDate || "");
    setGachaSubTab(banner.type || "standard");

    const f5 = banner.featured5Star;
    if (f5) {
      if (f5.id && !f5.id.startsWith("custom-")) {
        setFeatured5StarId(f5.id);
        setCustomFeatured5StarName("");
        setCustomFeatured5StarImage("");
      } else {
        setFeatured5StarId("custom");
        setCustomFeatured5StarName(f5.name || "");
        setCustomFeatured5StarImage(f5.image || "");
      }
    } else {
      setFeatured5StarId("");
      setCustomFeatured5StarName("");
      setCustomFeatured5StarImage("");
    }

    const f4s = banner.featured4Stars || [];
    if (f4s[0]) {
      if (f4s[0].id && !f4s[0].id.startsWith("custom-")) {
        setFeatured4Star1Id(f4s[0].id);
        setCustomFeatured4Star1Name("");
        setCustomFeatured4Star1Image("");
      } else {
        setFeatured4Star1Id("custom");
        setCustomFeatured4Star1Name(f4s[0].name || "");
        setCustomFeatured4Star1Image(f4s[0].image || "");
      }
    } else {
      setFeatured4Star1Id("");
      setCustomFeatured4Star1Name("");
      setCustomFeatured4Star1Image("");
    }

    if (f4s[1]) {
      if (f4s[1].id && !f4s[1].id.startsWith("custom-")) {
        setFeatured4Star2Id(f4s[1].id);
        setCustomFeatured4Star2Name("");
        setCustomFeatured4Star2Image("");
      } else {
        setFeatured4Star2Id("custom");
        setCustomFeatured4Star2Name(f4s[1].name || "");
        setCustomFeatured4Star2Image(f4s[1].image || "");
      }
    } else {
      setFeatured4Star2Id("");
      setCustomFeatured4Star2Name("");
      setCustomFeatured4Star2Image("");
    }

    if (f4s[2]) {
      if (f4s[2].id && !f4s[2].id.startsWith("custom-")) {
        setFeatured4Star3Id(f4s[2].id);
        setCustomFeatured4Star3Name("");
        setCustomFeatured4Star3Image("");
      } else {
        setFeatured4Star3Id("custom");
        setCustomFeatured4Star3Name(f4s[2].name || "");
        setCustomFeatured4Star3Image(f4s[2].image || "");
      }
    } else {
      setFeatured4Star3Id("");
      setCustomFeatured4Star3Name("");
      setCustomFeatured4Star3Image("");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    setConfirmDialog({
      text: "Bạn có chắc chắn muốn xóa banner này cùng toàn bộ thiết lập Gacha của nó?",
      action: async () => {
        try {
          await deleteDoc(doc(db, "gacha_banners", id));
          if (selectedBannerId === id) {
            setSelectedBannerId("");
          }
          alert("Đã xoá banner thành công!");
        } catch (err: any) {
          alert("Lỗi khi xoá banner: " + err.message);
        }
      }
    });
  };

  const handleAddPoolItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBannerId) {
      alert("Vui lòng chọn một Banner từ danh sách bên dưới để cấu hình vật phẩm trước!");
      return;
    }
    if (!poolItemName.trim()) {
      alert("Vui lòng điền tên vật phẩm!");
      return;
    }
    const currentBanner = gachaBanners.find(b => b.id === selectedBannerId);
    if (!currentBanner) return;

    try {
      const newItemId = "item-" + Date.now();
      const newItem = {
        id: newItemId,
        bannerId: selectedBannerId,
        name: poolItemName.trim(),
        rarity: poolItemRarity,
        type: poolItemType,
        image: poolItemImage.trim() || "",
        description: poolItemDesc.trim() || "",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "gacha_items"), newItem);

      alert("Đã thêm vật phẩm vào bể gacha!");
      setPoolItemName("");
      setPoolItemImage("");
      setPoolItemDesc("");
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi thêm vật phẩm: " + err.message);
    }
  };

  const handleRemovePoolItem = async (bannerId: string, itemRarity: number, itemId: string) => {
    setConfirmDialog({
      text: "Bạn có chắc muốn xóa vật phẩm này ra khỏi bể tỉ lệ Gacha?",
      action: async () => {
        const rawBanner = rawGachaBanners.find(b => b.id === bannerId);
        if (!rawBanner) return;

        try {
          // 1. Delete from legacy arrays in raw doc if present
          let hasLegacy = false;
          if (itemRarity === 5) {
            const legacyPool = rawBanner.pool5Star || [];
            if (legacyPool.some((i: any) => i.id === itemId)) {
              const updated = legacyPool.filter((i: any) => i.id !== itemId);
              await updateDoc(doc(db, "gacha_banners", bannerId), { pool5Star: updated });
              hasLegacy = true;
            }
          } else {
            const legacyPool = rawBanner.pool4Star || [];
            if (legacyPool.some((i: any) => i.id === itemId)) {
              const updated = legacyPool.filter((i: any) => i.id !== itemId);
              await updateDoc(doc(db, "gacha_banners", bannerId), { pool4Star: updated });
              hasLegacy = true;
            }
          }

          // 2. Delete from flat gacha_items collection
          const q = query(collection(db, "gacha_items"), where("id", "==", itemId));
          const querySnap = await getDocs(q);
          for (const docSnap of querySnap.docs) {
            await deleteDoc(docSnap.ref);
          }

          alert("Đã xoá vật phẩm!");
        } catch (err: any) {
          console.error(err);
          if (err.message?.includes("exceeds the maximum allowed size") || err.message?.includes("1048576 bytes")) {
            alert("Lỗi: Dữ liệu cấu trúc cũ (Legacy) trong tài liệu này quá lớn (>1MB). Bạn hãy kéo xuống nhấn nút 'Tối ưu hóa và Di cư dữ liệu bể Gacha' để hệ thống tự động giải phóng dung lượng, sau đó bạn sẽ xóa vật phẩm thành công!");
          } else {
            alert("Lỗi khi xoá vật phẩm: " + err.message);
          }
        }
      }
    });
  };

  const isAdmin =
    email?.toLowerCase() === "cucnau01@gmail.com" ||
    firebaseUser?.email?.toLowerCase() === "cucnau01@gmail.com";
  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Không có quyền truy cập. (
        {email || firebaseUser?.email || "Chưa đăng nhập"})
      </div>
    );
  }

  return (
    <div
      className={`flex-1 p-4 sm:p-6 lg:p-10 flex flex-col gap-8 max-w-4xl mx-auto w-full transition-colors duration-300`}
    >
      <h1
        className={`text-3xl font-black uppercase tracking-widest text-[#3E2723] dark:text-[#ECE5DC]`}
      >
        Bảng Điều Khiển Admin
      </h1>

      <div
        className={`flex flex-wrap items-center justify-center gap-1 sm:gap-2 p-2 rounded-2xl sticky top-4 z-30 border-[3px] shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] max-w-max mx-auto transition-all backdrop-blur-md ${isDark ? "bg-[#251A15]/95 border-[#1A1412]" : "bg-[#FFFDF9]/95 border-[#3E2723]"}`}
      >
        {/* Nhóm 1: Nội dung & Tương tác */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("stories")}
            title="Quản lý Truyện"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "stories" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            title="Quản lý Bài đăng"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "posts" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            title="Quản lý Bình luận"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "comments" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            title="Quản lý Choco Lounge"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "messages" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh dọc phân cách */}
        <div
          className={`h-6 w-[2px] mx-1 transition-colors ${isDark ? "bg-[#3E2D25]" : "bg-[#3E2723]/30"}`}
        />

        {/* Nhóm 2: Người dùng & Danh hiệu */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("users")}
            title="Quản lý Thành viên"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "users" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("titles")}
            title="Quản lý Danh hiệu"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "titles" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <Award className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh dọc phân cách */}
        <div
          className={`h-6 w-[2px] mx-1 transition-colors ${isDark ? "bg-[#3E2D25]" : "bg-[#3E2723]/30"}`}
        />

        {/* Nhóm 3: Vật phẩm Cửa hàng */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("stickers")}
            title="Quản lý Stickers"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "stickers" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("accessories")}
            title="Quản lý Phụ kiện Avatar"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "accessories" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("chucu_accessories")}
            title="Quản lý Phụ kiện Chucu"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "chucu_accessories" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("radio")}
            title="Quản lý Radio"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "radio" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <Radio className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("gacha")}
            title="Quản lý Gacha"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "gacha" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <Dices className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh dọc phân cách */}
        <div
          className={`h-6 w-[2px] mx-1 transition-colors ${isDark ? "bg-[#3E2D25]" : "bg-[#3E2723]/30"}`}
        />

        {/* Nhóm 4: Hệ thống */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("system")}
            title="Hệ thống"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "system" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <Wrench className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("features")}
            title="Cấp độ Tính năng"
            className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center hover:scale-110 active:scale-95 border-2 ${activeTab === "features" ? "bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] border-[#3E2723] dark:border-[#4E342E] shadow-sm" : "border-transparent text-[#8D6E63] hover:bg-[#D7CCC8]/30 dark:text-[#A1887F]"}`}
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tiêu đề mục quản trị hiện tại */}
      <div className="text-center -mt-2">
        <span
          className={`text-xs uppercase font-extrabold tracking-widest px-4 py-2 rounded-xl border-[3px] shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] inline-flex items-center gap-1.5 transition-all ${isDark ? "text-[#ECE5DC] bg-[#251A15] border-[#1A1412]" : "text-[#3E2723] bg-[#FFFDF9] border-[#3E2723]"}`}
        >
          {activeTab === "stories" && "📖 Quản lý Truyện"}
          {activeTab === "posts" && "📝 Quản lý Bài đăng"}
          {activeTab === "comments" && "💬 Quản lý Bình luận"}
          {activeTab === "messages" && "☕ Quản lý Choco Lounge"}
          {activeTab === "users" && "👥 Quản lý Thành viên"}
          {activeTab === "titles" && "🏆 Quản lý Danh hiệu"}
          {activeTab === "stickers" && "✨ Quản lý Stickers"}
          {activeTab === "accessories" && "👑 Quản lý Phụ kiện"}
          {activeTab === "chucu_accessories" && "🧸 Quản lý Phụ kiện Chucu"}
          {activeTab === "radio" && "📻 Quản lý Choco Radio"}
          {activeTab === "gacha" && "🎲 Quản lý Gacha"}
          {activeTab === "system" && "🛠️ Quản lý Hệ thống"}
          {activeTab === "features" && "🔒 Cấp độ Tính năng"}
        </span>
      </div>

      {activeTab === "features" && (
        <div className={`p-6 sm:p-8 rounded-[32px] border-4 shadow-[4px_4px_0_0_#3E2723] dark:shadow-[4px_4px_0_0_#0D0907] flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}>
          <div className="flex items-center justify-between border-b-2 border-[#3E2723]/10 pb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-[#8D6E63] dark:text-[#A1887F]" />
              <div>
                <h2 className="text-2xl font-black uppercase text-[#3E2723] dark:text-[#ECE5DC] tracking-tighter">
                  Cấp độ Tính năng
                </h2>
                <p className="text-sm font-medium text-[#8D6E63] dark:text-[#A1887F]">
                  Giới hạn cấp độ (Level) tối thiểu để người dùng được phép sử dụng các tính năng trên website
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSaveFeatureLevels}
              disabled={savingFeatures}
              className={`px-6 py-3 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center gap-2 border-[3px] border-[#3E2723] shadow-[3px_3px_0_0_#3E2723] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all ${
                isDark 
                  ? "bg-[#C29D70] hover:bg-[#B38F62] text-[#181311]" 
                  : "bg-[#E6D4BF] hover:bg-[#D4C0A8] text-[#3E2723]"
              }`}
            >
              <Save className="w-4 h-4" />
              {savingFeatures ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES_LIST.map((feat) => {
              const currentVal = localFeatureLevels[feat.id] !== undefined ? localFeatureLevels[feat.id] : feat.defaultLevel;
              return (
                <div
                  key={feat.id}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${
                    isDark 
                      ? "bg-[#2B2320] border-[#3E2D25] hover:border-[#4E342E]" 
                      : "bg-[#FFFDF9] border-[#F1E5D8] hover:border-[#D7CCC8]"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                    isDark 
                      ? "bg-[#3C2E27]/40 border-[#5D4037]/30 text-[#A1887F]" 
                      : "bg-[#F5E6D3] border-[#D7CCC8] text-[#8D6E63]"
                  }`}>
                    {currentVal > 1 ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#3E2723] dark:text-[#ECE5DC] text-base truncate">
                      {feat.name}
                    </h3>
                    <p className="text-xs text-[#8D6E63] dark:text-[#A1887F] line-clamp-2 mt-0.5 leading-relaxed">
                      {feat.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs font-bold text-[#8D6E63] dark:text-[#A1887F]">
                        Yêu cầu Level:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setLocalFeatureLevels(prev => ({
                              ...prev,
                              [feat.id]: Math.max(1, currentVal - 1)
                            }));
                          }}
                          className={`w-8 h-8 rounded-lg font-black border-2 flex items-center justify-center transition-all active:scale-95 ${
                            isDark 
                              ? "bg-[#251E1B] border-[#4E342E] text-[#ECE5DC] hover:bg-[#312622]" 
                              : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723] hover:bg-[#E6D8C9]"
                          }`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={currentVal}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setLocalFeatureLevels(prev => ({
                              ...prev,
                              [feat.id]: val
                            }));
                          }}
                          className={`w-14 h-8 text-center font-bold text-sm rounded-lg border-2 focus:outline-none focus:ring-0 ${
                            isDark 
                              ? "bg-[#251E1B] border-[#4E342E] text-[#ECE5DC]" 
                              : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLocalFeatureLevels(prev => ({
                              ...prev,
                              [feat.id]: currentVal + 1
                            }));
                          }}
                          className={`w-8 h-8 rounded-lg font-black border-2 flex items-center justify-center transition-all active:scale-95 ${
                            isDark 
                              ? "bg-[#251E1B] border-[#4E342E] text-[#ECE5DC] hover:bg-[#312622]" 
                              : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723] hover:bg-[#E6D8C9]"
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <div className={`p-6 sm:p-8 rounded-[32px] border-4 shadow-[4px_4px_0_0_#3E2723] dark:shadow-[4px_4px_0_0_#0D0907] flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}>
          <div className="flex items-center gap-3 border-b-2 border-[#3E2723]/10 pb-4">
            <Wrench className="w-8 h-8 text-[#8D6E63] dark:text-[#A1887F]" />
            <div>
              <h2 className="text-2xl font-black uppercase text-[#3E2723] dark:text-[#ECE5DC] tracking-tighter">
                Hệ Thống
              </h2>
              <p className="text-sm font-medium text-[#8D6E63] dark:text-[#A1887F]">
                Quản lý các trạng thái hoạt động của Website
              </p>
            </div>
          </div>
          
          <div className={`p-6 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all ${isMaintenance ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#FDF6EC] dark:bg-[#1A1412] border-[#3E2723]/10 dark:border-[#4E342E]/30'}`}>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-bold text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2">
                Chế độ Bảo Trì
                {isMaintenance ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">Đang Bật</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-wider">Đang Tắt</span>
                )}
              </h3>
              <p className="text-[#5D4037] dark:text-[#A1887F] text-sm">
                Khi chế độ này được bật, tất cả người dùng (ngoại trừ <strong>cucnau01@gmail.com</strong>) sẽ chỉ thấy màn hình hình nền Chucu với thông báo bảo trì, và không thể tương tác hay dùng tính năng gì. Mọi thay đổi dữ liệu của người dùng sẽ bị đóng băng. Thích hợp để bảo trì web.
              </p>
            </div>
            
            <button
              onClick={() => {
                setConfirmDialog({
                  text: isMaintenance 
                    ? "Bạn có chắc chắn muốn TẮT chế độ bảo trì và mở lại website cho tất cả mọi người?" 
                    : "Bạn có chắc chắn muốn BẬT chế độ bảo trì? Thao tác này sẽ khóa tương tác của mọi người dùng thông thường.",
                  action: async () => {
                    try {
                      await setDoc(doc(db, 'settings', 'system'), { isMaintenance: !isMaintenance }, { merge: true });
                    } catch (e: any) {
                      console.error("Lỗi khi thay đổi trạng thái bảo trì: ", e);
                    }
                  }
                });
              }}
              className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#3E2723] dark:shadow-[2px_2px_0_0_#0D0907] transition-all hover:translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0 active:shadow-none whitespace-nowrap ${isMaintenance ? 'bg-stone-500 hover:bg-stone-600 border-2 border-stone-800' : 'bg-red-600 hover:bg-red-700 border-2 border-red-900'}`}
            >
              {isMaintenance ? "Tắt Bảo Trì" : "Bật Bảo Trì"}
            </button>
          </div>

          <div className="p-6 rounded-2xl border-2 flex flex-col gap-6 bg-[#FDF6EC] dark:bg-[#1A1412] border-[#3E2723]/10 dark:border-[#4E342E]/30 transition-all">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2">
                <Award className="w-6 h-6 text-[#8D6E63] dark:text-[#A1887F]" />
                Truy quét & Khôi phục Lịch sử Choco / Thành Tựu
              </h3>
              <p className="text-[#5D4037] dark:text-[#A1887F] text-sm">
                Công cụ này sẽ tự động duyệt toàn bộ tài khoản người dùng, phân tích chi tiết lịch sử giao dịch (transactions) trong Firestore để tính toán lại chính xác số lượng Choco, Golden Choco, và tự động khôi phục các thành tựu (claimed/unlocked achievements) đã đạt được cho người dùng nếu bị lỗi reset.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setConfirmDialog({
                    text: "Bạn có chắc chắn muốn chạy tiến trình TRUY QUÉT và KHÔI PHỤC Choco / Thành tựu cho tất cả người dùng không?",
                    action: runChocoRestoration
                  });
                }}
                disabled={isRestoring}
                className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#3E2723] dark:shadow-[2px_2px_0_0_#0D0907] transition-all hover:translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0 active:shadow-none whitespace-nowrap self-start ${isRestoring ? 'bg-stone-500 cursor-not-allowed border-2 border-stone-800' : 'bg-[#C29D70] hover:bg-[#b08b5f] border-2 border-[#3E2723]'}`}
              >
                {isRestoring ? "Đang truy quét và khôi phục..." : "Chạy Tiến Trình Khôi Phục"}
              </button>

              {restorationLogs.length > 0 && (
                <div className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs max-h-60 overflow-y-auto space-y-1">
                  {restorationLogs.map((log, index) => (
                    <div key={index} className={log.startsWith("❌") ? "text-red-400" : log.startsWith("🎉") ? "text-green-400" : log.startsWith("➡️") ? "text-amber-400" : "text-stone-300"}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl border-2 flex flex-col gap-6 bg-[#FDF6EC] dark:bg-[#1A1412] border-[#3E2723]/10 dark:border-[#4E342E]/30 transition-all">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-[#8D6E63] dark:text-[#A1887F]" />
                Truy quét & Thu hồi Nhiệm vụ & Thành tựu Trùng lặp
              </h3>
              <p className="text-[#5D4037] dark:text-[#A1887F] text-sm">
                Tính năng này sẽ rà soát kỹ lưỡng lịch sử nhận thưởng nhiệm vụ và thành tựu của toàn bộ người dùng để tìm ra những lượt nhận trùng (do lỗi mạng hoặc spam nhấp đúp). Sau khi quét, bạn có thể thực hiện thu hồi chính xác số lượng Choco và GChoco dư thừa.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={runDuplicateScan}
                  disabled={isScanningDuplicates || isRevokingDuplicates}
                  className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#3E2723] dark:shadow-[2px_2px_0_0_#0D0907] transition-all hover:translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0 active:shadow-none whitespace-nowrap ${isScanningDuplicates ? 'bg-stone-500 cursor-not-allowed border-2 border-stone-800' : 'bg-[#8D6E63] hover:bg-[#7D5E53] border-2 border-[#3E2723]'}`}
                >
                  {isScanningDuplicates ? "Đang quét trùng lặp..." : "Quét Nhận Trùng Lặp"}
                </button>

                {duplicateReport && duplicateReport.totalDuplicatesFound > 0 && (
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        text: `Bạn có chắc chắn muốn THU HỒI tổng cộng -${duplicateReport.totalChocoToRevoke} Choco và -${duplicateReport.totalGChocoToRevoke} GChoco của ${duplicateReport.usersWithDuplicates.length} người dùng nhận trùng không? Lịch sử giao dịch spend sẽ được ghi nhận tự động.`,
                        action: runDuplicateRevoke
                      });
                    }}
                    disabled={isRevokingDuplicates}
                    className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#3E2723] dark:shadow-[2px_2px_0_0_#0D0907] transition-all hover:translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0 active:shadow-none whitespace-nowrap ${isRevokingDuplicates ? 'bg-stone-500 cursor-not-allowed border-2 border-stone-800' : 'bg-red-600 hover:bg-red-700 border-2 border-red-900'}`}
                  >
                    {isRevokingDuplicates ? "Đang thực thi thu hồi..." : "Thực Thi Thu Hồi"}
                  </button>
                )}
              </div>

              {duplicateLogs.length > 0 && (
                <div className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs max-h-60 overflow-y-auto space-y-1">
                  {duplicateLogs.map((log, index) => (
                    <div key={index} className={log.startsWith("❌") ? "text-red-400" : log.startsWith("🎉") ? "text-green-400" : log.startsWith("⚠️") ? "text-amber-400" : "text-stone-300"}>
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {duplicateReport && (
                <div className={`p-4 rounded-xl border-2 ${isDark ? 'bg-[#2D221C] border-[#4E342E]' : 'bg-amber-50/50 border-[#8D6E63]/20'} space-y-4`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-stone-100 dark:bg-stone-800/50 rounded-lg">
                      <div className="text-xs font-bold text-stone-500 uppercase">Thành viên quét</div>
                      <div className="text-xl font-black text-stone-800 dark:text-stone-200">{duplicateReport.totalScanned}</div>
                    </div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <div className="text-xs font-bold text-amber-600 uppercase">Lượt nhận trùng</div>
                      <div className="text-xl font-black text-amber-700 dark:text-amber-300">{duplicateReport.totalDuplicatesFound}</div>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <div className="text-xs font-bold text-red-500 uppercase">Thu hồi Choco</div>
                      <div className="text-xl font-black text-red-600 dark:text-red-400">-{duplicateReport.totalChocoToRevoke}</div>
                    </div>
                    <div className="p-3 bg-amber-200 dark:bg-yellow-900/30 rounded-lg">
                      <div className="text-xs font-bold text-yellow-700 uppercase">Thu hồi GChoco</div>
                      <div className="text-xl font-black text-yellow-600 dark:text-yellow-400">-{duplicateReport.totalGChocoToRevoke}</div>
                    </div>
                  </div>

                  {duplicateReport.usersWithDuplicates.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm font-bold text-[#3E2723] dark:text-[#ECE5DC]">Danh sách người dùng có trùng lặp:</div>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {duplicateReport.usersWithDuplicates.map((user, uidx) => (
                          <div key={uidx} className="p-3 rounded-lg bg-white dark:bg-[#1f1714] border border-stone-200 dark:border-[#3E2D25] space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1.5">
                              <span className="font-extrabold text-stone-800 dark:text-stone-200">
                                {user.displayName} ({user.email})
                              </span>
                              <span className="font-black text-red-600 dark:text-red-400">
                                Thu hồi: -{user.chocoToRevoke} 🍫 / -{user.gchocoToRevoke} 🌟
                              </span>
                            </div>
                            <div className="space-y-1 text-stone-500 dark:text-stone-400 pl-2 border-l-2 border-stone-300">
                              {user.duplicates.map((dup, didx) => (
                                <div key={didx} className="flex justify-between">
                                  <span>• {dup.detail} ({dup.createdAtStr})</span>
                                  <span className="font-bold text-stone-700 dark:text-stone-300">+{dup.amount} {dup.currency === 'gchoco' ? 'GChoco' : 'Choco'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs font-medium text-stone-500 dark:text-stone-400">
                      ✨ Không phát hiện bất kỳ giao dịch nhận trùng lặp nào. Hệ thống hoạt động an toàn tuyệt đối!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "stickers" && (
        <>
          {editingSticker ? (
            <form
              onSubmit={handleUpdateSticker}
              className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
            >
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
                Sửa Sticker
              </h2>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-50 flex items-center justify-center shrink-0 border rounded-xl shadow-sm overflow-hidden p-2">
                  {editingSticker.url && (
                    <img
                      src={editingSticker.url}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <input
                    type="file"
                    accept="image/png, image/webp, image/gif"
                    onChange={(e) => handleStickerImageChange(e, true)}
                    ref={editStickerFileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editStickerFileInputRef.current?.click()}
                    className={`px-4 py-1.5 border text-sm font-bold w-max rounded-lg transition-all ${isDark ? "bg-[#1D1410] border-[#8D6E63] text-[#ECE5DC] hover:bg-[#251A15]" : "bg-[#FDF6EC] border-[#8D6E63] text-[#8D6E63] hover:bg-white"}`}
                  >
                    Đổi ảnh sticker
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Tên sticker"
                value={editingSticker.name}
                onChange={(e) =>
                  setEditingSticker({ ...editingSticker, name: e.target.value })
                }
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                required
              />
              <input
                type="text"
                placeholder="Mô tả"
                value={editingSticker.description}
                onChange={(e) =>
                  setEditingSticker({
                    ...editingSticker,
                    description: e.target.value,
                  })
                }
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                required
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Giá"
                  value={editingSticker.price}
                  onChange={(e) =>
                    setEditingSticker({
                      ...editingSticker,
                      price: e.target.value,
                    })
                  }
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl flex-1 focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                  required
                />
                <select
                  value={editingSticker.type}
                  onChange={(e) =>
                    setEditingSticker({
                      ...editingSticker,
                      type: e.target.value,
                    })
                  }
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] w-32 transition-all`}
                >
                  <option value="choco">Choco</option>
                  <option value="golden">Golden Choco</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingSticker(null)}
                  className={`px-4 py-2 rounded font-bold transition-colors ${isDark ? "bg-[#3E2D25] text-[#ECE5DC] hover:bg-[#523C32]" : "bg-gray-200 hover:bg-gray-300"}`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8D6E63] text-white rounded font-bold hover:bg-[#5D4037]"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleCreateSticker}
              className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
            >
              <h2
                className={`text-xl font-bold transition-colors ${isDark ? "text-[#ECE5DC]" : "text-[#3E2723]"}`}
              >
                Thêm Sticker
              </h2>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-50 flex items-center justify-center shrink-0 border rounded-xl shadow-sm overflow-hidden p-2">
                  {stUrl ? (
                    <img src={stUrl} className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="text-xs text-[#8D6E63]/80 dark:text-stone-400 text-center">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <input
                    type="file"
                    accept="image/png, image/webp, image/gif"
                    onChange={(e) => handleStickerImageChange(e, false)}
                    ref={stickerFileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => stickerFileInputRef.current?.click()}
                    className={`px-4 py-1.5 border text-sm font-bold w-max rounded-lg transition-all ${isDark ? "bg-[#1D1410] border-[#8D6E63] text-[#ECE5DC] hover:bg-[#251A15]" : "bg-[#FDF6EC] border-[#8D6E63] text-[#8D6E63] hover:bg-white"}`}
                  >
                    Chọn ảnh sticker (PNG/WebP/GIF trong suốt)
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Tên sticker"
                value={stName}
                onChange={(e) => setStName(e.target.value)}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                required
              />
              <input
                type="text"
                placeholder="Mô tả"
                value={stDesc}
                onChange={(e) => setStDesc(e.target.value)}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                required
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Giá"
                  value={stPrice}
                  onChange={(e) => setStPrice(Number(e.target.value))}
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl flex-1 focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                  required
                />
                <select
                  value={stType}
                  onChange={(e) => setStType(e.target.value as any)}
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] w-32 transition-all`}
                >
                  <option value="choco">Choco</option>
                  <option value="golden">Golden Choco</option>
                </select>
              </div>
              <button
                type="submit"
                className="mt-2 bg-[#8D6E63] text-white py-2 rounded-lg font-bold hover:bg-[#5D4037] transition-colors"
              >
                Tạo Sticker
              </button>
            </form>
          )}

          <div className="space-y-4 pb-20">
            <h2
              className={
                isDark
                  ? "text-xl font-bold transition-colors text-[#ECE5DC]"
                  : "text-xl font-bold transition-colors text-[#3E2723]"
              }
            >
              Danh sách sticker ({stickers.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stickers.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-3xl border-2 shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_#3E2723] transition-all flex flex-col items-center text-center duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
                >
                  <div
                    className={`w-16 h-16 relative mb-4 p-2 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-colors ${isDark ? "bg-[#1E1815] border-[#4E342E]" : "bg-white border-[#3E2723]"}`}
                  >
                    {s.url ? (
                      <img
                        src={s.url}
                        alt=""
                        className="w-12 h-12 object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="text-xs text-gray-400">Trống</div>
                    )}
                  </div>
                  <h3 className="font-bold leading-tight text-[#3E2723] dark:text-[#ECE5DC]">
                    {s.name}
                  </h3>
                  <p
                    className={`text-xs mb-2 mt-1 line-clamp-2 transition-colors ${isDark ? "text-[#A1887F]" : "text-[#8D6E63]/80 dark:text-stone-400"}`}
                  >
                    {s.description}
                  </p>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded transition-colors ${s.type === "golden" ? "bg-yellow-500/20 text-yellow-500" : isDark ? "bg-[#3E2D25] text-[#ECE5DC]" : "bg-[#D7CCC8]/30 text-[#5D4037]"}`}
                  >
                    {s.price} {s.type === "golden" ? "GChoco" : "Choco"}
                  </span>
                  <div className="flex gap-2 mt-4 w-full">
                    <button
                      onClick={() => setEditingSticker(s)}
                      className={`flex-1 py-1.5 text-xs rounded font-bold transition-all ${isDark ? "bg-[#3E2D25] text-[#ECE5DC] hover:bg-[#523C32]" : "bg-[#D7CCC8]/30 text-[#5D4037] hover:bg-[#D7CCC8]/60"}`}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteSticker(s.id)}
                      className={`px-3 py-1.5 text-xs rounded font-bold transition-colors flex items-center justify-center ${isDark ? "bg-red-950/40 text-red-400 hover:bg-red-900/60" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "accessories" && (
        <>
          {editingAccessory ? (
            <form
              onSubmit={handleUpdateAccessory}
              className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
            >
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
                Sửa Phụ Kiện Avatar
              </h2>
              <div className="flex gap-4">
                <div
                  className={`w-24 h-24 flex items-center justify-center shrink-0 border rounded-xl shadow-sm overflow-hidden p-2 transition-colors ${isDark ? "bg-[#1D1410] border-[#3E2D25]" : "bg-gray-50 border-[#D7CCC8]"}`}
                >
                  {editingAccessory.url && (
                    <img
                      src={editingAccessory.url}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <input
                    type="file"
                    accept="image/png, image/webp, image/gif"
                    onChange={(e) => handleAccessoryImageChange(e, true)}
                    ref={editAccessoryFileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editAccessoryFileInputRef.current?.click()}
                    className={`px-4 py-1.5 border text-sm font-bold w-max rounded-lg transition-all ${isDark ? "bg-[#1D1410] border-[#8D6E63] text-[#ECE5DC] hover:bg-[#251A15]" : "bg-[#FDF6EC] border-[#8D6E63] text-[#8D6E63] hover:bg-white"}`}
                  >
                    Đổi ảnh phụ kiện (PNG/WebP/GIF)
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Tên phụ kiện"
                value={editingAccessory.name}
                onChange={(e) =>
                  setEditingAccessory({
                    ...editingAccessory,
                    name: e.target.value,
                  })
                }
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                required
              />
              <input
                type="text"
                placeholder="Mô tả"
                value={editingAccessory.description}
                onChange={(e) =>
                  setEditingAccessory({
                    ...editingAccessory,
                    description: e.target.value,
                  })
                }
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                required
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Giá"
                  value={editingAccessory.price}
                  onChange={(e) =>
                    setEditingAccessory({
                      ...editingAccessory,
                      price: e.target.value,
                    })
                  }
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl flex-1 focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                  required
                />
                <select
                  value={editingAccessory.type}
                  onChange={(e) =>
                    setEditingAccessory({
                      ...editingAccessory,
                      type: e.target.value,
                    })
                  }
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] w-32 transition-all`}
                >
                  <option value="choco">Choco</option>
                  <option value="golden">Golden Choco</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Cấp độ tối thiểu (Mặc định: 1)"
                value={editingAccessory.requiredLevel || ""}
                onChange={(e) =>
                  setEditingAccessory({
                    ...editingAccessory,
                    requiredLevel: Number(e.target.value),
                  })
                }
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                min="1"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccessory(null)}
                  className={`px-4 py-2 rounded font-bold transition-colors ${isDark ? "bg-[#3E2D25] text-[#ECE5DC] hover:bg-[#523C32]" : "bg-gray-200 hover:bg-gray-300"}`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8D6E63] text-white rounded font-bold hover:bg-[#5D4037]"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleCreateAccessory}
              className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
            >
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
                Thêm Phụ Kiện Avatar
              </h2>
              <div className="flex gap-4">
                <div
                  className={`w-24 h-24 flex items-center justify-center shrink-0 border rounded-xl shadow-sm overflow-hidden p-2 transition-colors ${isDark ? "bg-[#1D1410] border-[#3E2D25]" : "bg-gray-50 border-[#D7CCC8]"}`}
                >
                  {accUrl ? (
                    <img src={accUrl} className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="text-xs text-[#8D6E63]/80 dark:text-stone-400 text-center">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <input
                    type="file"
                    accept="image/png, image/webp, image/gif"
                    onChange={(e) => handleAccessoryImageChange(e, false)}
                    ref={accessoryFileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => accessoryFileInputRef.current?.click()}
                    className={`px-4 py-1.5 border text-sm font-bold w-max rounded-lg transition-all ${isDark ? "bg-[#1D1410] border-[#8D6E63] text-[#ECE5DC] hover:bg-[#251A15]" : "bg-[#FDF6EC] border-[#8D6E63] text-[#8D6E63] hover:bg-white"}`}
                  >
                    Chọn ảnh phụ kiện (PNG/WebP/GIF trong suốt)
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Tên phụ kiện"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                required
              />
              <input
                type="text"
                placeholder="Mô tả"
                value={accDesc}
                onChange={(e) => setAccDesc(e.target.value)}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                required
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Giá"
                  value={accPrice}
                  onChange={(e) => setAccPrice(Number(e.target.value))}
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl flex-1 focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                  required
                />
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as any)}
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] w-32 transition-all`}
                >
                  <option value="choco">Choco</option>
                  <option value="golden">Golden Choco</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Cấp độ Chucu yêu cầu (Mặc định 1)"
                value={accRequiredLevel || ""}
                onChange={(e) => setAccRequiredLevel(Number(e.target.value))}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all`}
                min="1"
              />
              <button
                type="submit"
                className="mt-2 bg-[#8D6E63] text-white py-2 rounded-lg font-bold hover:bg-[#5D4037] transition-colors"
              >
                Tạo Phụ Kiện
              </button>
            </form>
          )}

          <div className="space-y-4 pb-20">
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
              Danh sách phụ kiện ({accessories.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {accessories.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-3xl border-2 shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_#3E2723] transition-all flex flex-col items-center text-center duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
                >
                  <div
                    className={`w-16 h-16 relative mb-4 p-2 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-colors ${isDark ? "bg-[#1E1815] border-[#4E342E]" : "bg-white border-[#3E2723]"}`}
                  >
                    {a.url ? (
                      <img
                        src={a.url}
                        alt=""
                        className="w-12 h-12 object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="text-xs text-gray-400">Trống</div>
                    )}
                  </div>
                  <h3 className="font-bold leading-tight text-[#3E2723] dark:text-[#ECE5DC]">
                    {a.name}
                  </h3>
                  <p className="text-xs mb-2 mt-1 line-clamp-2 text-[#8D6E63]/80 dark:text-[#A1887F]/80">
                    {a.description}
                  </p>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${a.type === "golden" ? "bg-yellow-100 text-yellow-800" : "bg-[#D7CCC8]/30 text-[#5D4037]"}`}
                  >
                    {a.price} {a.type === "golden" ? "GChoco" : "Choco"}
                  </span>
                  {a.requiredLevel > 1 && (
                    <span className="text-[10px] font-bold text-[#8D6E63] dark:text-[#A1887F] mt-1 border border-[#D7CCC8] dark:border-[#4E342E] px-2 py-0.5 rounded-full">
                      Yêu cầu Lv.{a.requiredLevel}
                    </span>
                  )}
                  <div className="flex gap-2 mt-4 w-full">
                    <button
                      onClick={() => setEditingAccessory(a)}
                      className="flex-1 py-1.5 text-xs bg-[#D7CCC8]/30 rounded font-bold hover:bg-[#D7CCC8]/60 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteAccessory(a.id)}
                      className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded font-bold hover:bg-red-200 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "chucu_accessories" && (
        <>
          {editingChucuAccessory ? (
            <form
              onSubmit={handleUpdateChucuAccessory}
              className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
            >
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
                Sửa Phụ Kiện Chucu
              </h2>
              <div className="flex gap-4">
                <div
                  className={`w-24 h-24 flex items-center justify-center shrink-0 border rounded-xl shadow-sm overflow-hidden p-2 transition-colors ${isDark ? "bg-[#1D1410] border-[#3E2D25]" : "bg-gray-50 border-[#D7CCC8]"}`}
                >
                  {editingChucuAccessory.url && (
                    editingChucuAccessory.url.startsWith("chucu_acc_") ? (
                      <div className="w-16 h-16 flex items-center justify-center scale-150">
                        {getChucuAccessoryPreview(editingChucuAccessory.url)}
                      </div>
                    ) : (
                      <img
                        src={editingChucuAccessory.url}
                        className="w-16 h-16 object-contain"
                      />
                    )
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <input
                    type="file"
                    accept="image/png, image/webp, image/gif"
                    onChange={(e) => handleAccessoryImageChange(e, true, true)}
                    ref={editChucuAccessoryFileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      editChucuAccessoryFileInputRef.current?.click()
                    }
                    className={`px-4 py-1.5 border text-sm font-bold w-max rounded-lg transition-all ${isDark ? "bg-[#1D1410] border-[#8D6E63] text-[#ECE5DC] hover:bg-[#251A15]" : "bg-[#FDF6EC] border-[#8D6E63] text-[#8D6E63] hover:bg-white"}`}
                  >
                    Đổi ảnh phụ kiện Chucu (hoặc để trống nếu dùng sẵn)
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Tên phụ kiện"
                value={editingChucuAccessory.name}
                onChange={(e) =>
                  setEditingChucuAccessory({
                    ...editingChucuAccessory,
                    name: e.target.value,
                  })
                }
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037]`}
                required
              />
              <input
                type="text"
                placeholder="Mô tả"
                value={editingChucuAccessory.description}
                onChange={(e) =>
                  setEditingChucuAccessory({
                    ...editingChucuAccessory,
                    description: e.target.value,
                  })
                }
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037]`}
                required
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Giá"
                  value={editingChucuAccessory.price}
                  onChange={(e) =>
                    setEditingChucuAccessory({
                      ...editingChucuAccessory,
                      price: e.target.value,
                    })
                  }
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl flex-1`}
                  required
                />
                <select
                  value={editingChucuAccessory.type}
                  onChange={(e) =>
                    setEditingChucuAccessory({
                      ...editingChucuAccessory,
                      type: e.target.value,
                    })
                  }
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] w-32`}
                >
                  <option value="choco">Choco</option>
                  <option value="golden">Golden</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Cấp Chucu yêu cầu (Mặc định: 1)"
                value={editingChucuAccessory.requiredLevel || ""}
                onChange={(e) =>
                  setEditingChucuAccessory({
                    ...editingChucuAccessory,
                    requiredLevel: Number(e.target.value),
                  })
                }
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl`}
                min="1"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingChucuAccessory(null)}
                  className={`px-4 py-2 rounded font-bold transition-colors ${isDark ? "bg-[#3E2D25] text-[#ECE5DC] hover:bg-[#523C32]" : "bg-gray-200 hover:bg-gray-300"}`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8D6E63] text-white rounded font-bold hover:bg-[#5D4037]"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleAddChucuAccessory}
              className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
            >
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
                Thêm Phụ Kiện Chucu
              </h2>
              {/* Preset Selection Grid designed by AI */}
              <div className="flex flex-col gap-2 border-b border-[#3E2723]/10 dark:border-white/10 pb-4">
                <span className="text-xs font-bold text-[#8D6E63] dark:text-[#A1887F] uppercase tracking-wider">
                  🎨 Thiết kế phụ kiện Chucu của AI (Chọn để tự động điền):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-56 overflow-y-auto p-3 bg-stone-50 dark:bg-black/15 rounded-2xl border-2 border-dashed border-[#D7CCC8] dark:border-[#5D4037]">
                  {CHUCU_PRESET_ACCESSORIES.map((preset) => {
                    const isSelected = cAccUrl === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setCAccUrl(preset.id);
                          setCAccName(preset.name);
                          setCAccDesc(preset.description);
                        }}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${
                          isSelected
                            ? "bg-[#8D6E63]/15 border-[#8D6E63] shadow-inner"
                            : "bg-[#FFFDF9] dark:bg-[#1E1815] border-[#3E2723]/10 dark:border-stone-800 hover:border-[#8D6E63]"
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                          {preset.previewSvg}
                        </div>
                        <div className="flex flex-col gap-0.5 w-full">
                          <span className="text-[10px] font-black uppercase text-[#3E2723] dark:text-[#ECE5DC] truncate line-clamp-1 w-full leading-tight">
                            {preset.name}
                          </span>
                          <span className="text-[8px] text-stone-500 truncate line-clamp-1 w-full leading-tight">
                            Bấm để chọn
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <div
                  className={`w-24 h-24 flex items-center justify-center shrink-0 border rounded-xl shadow-sm overflow-hidden p-2 transition-colors ${isDark ? "bg-[#1D1410] border-[#3E2D25]" : "bg-gray-50 border-[#D7CCC8]"}`}
                >
                  {cAccUrl ? (
                    cAccUrl.startsWith("chucu_acc_") ? (
                      <div className="w-16 h-16 flex items-center justify-center scale-150">
                        {getChucuAccessoryPreview(cAccUrl)}
                      </div>
                    ) : (
                      <img src={cAccUrl} className="w-16 h-16 object-contain" />
                    )
                  ) : (
                    <div className="text-xs text-[#8D6E63]/80 text-center">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <input
                    type="file"
                    accept="image/png, image/webp, image/gif"
                    onChange={(e) => handleAccessoryImageChange(e, false, true)}
                    ref={chucuAccessoryFileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => chucuAccessoryFileInputRef.current?.click()}
                    className={`px-4 py-1.5 border text-sm font-bold w-max rounded-lg transition-all ${isDark ? "bg-[#1D1410] border-[#8D6E63] text-[#ECE5DC] hover:bg-[#251A15]" : "bg-[#FDF6EC] border-[#8D6E63] text-[#8D6E63] hover:bg-white"}`}
                  >
                    Chọn ảnh tùy chỉnh khác nếu muốn
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Tên phụ kiện"
                value={cAccName}
                onChange={(e) => setCAccName(e.target.value)}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl`}
                required
              />
              <input
                type="text"
                placeholder="Mô tả"
                value={cAccDesc}
                onChange={(e) => setCAccDesc(e.target.value)}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl`}
                required
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Giá"
                  value={cAccPrice || ""}
                  onChange={(e) => setCAccPrice(Number(e.target.value))}
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl flex-1`}
                  required
                />
                <select
                  value={cAccType}
                  onChange={(e) => setCAccType(e.target.value as any)}
                  className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl w-32`}
                >
                  <option value="choco">Choco</option>
                  <option value="golden">Golden</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Cấp độ Chucu yêu cầu (Mặc định 1)"
                value={cAccRequiredLevel || ""}
                onChange={(e) => setCAccRequiredLevel(Number(e.target.value))}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl`}
                min="1"
              />
              <button
                type="submit"
                className="mt-2 bg-[#8D6E63] text-white py-2 rounded-lg font-bold hover:bg-[#5D4037] transition-colors"
              >
                Tạo Phụ Kiện
              </button>
            </form>
          )}

          <div className="space-y-4 pb-20">
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
              Danh sách phụ kiện ({chucuAccessories.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {chucuAccessories.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-3xl border-2 shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] hover:-translate-y-0.5 transition-all flex flex-col items-center text-center duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}
                >
                  <div
                    className={`w-16 h-16 relative mb-4 p-2 rounded-2xl border-2 flex items-center justify-center shrink-0  ${isDark ? "bg-[#1E1815] border-[#4E342E]" : "bg-white border-[#3E2723]"}`}
                  >
                    {a.url ? (
                      a.url.startsWith("chucu_acc_") ? (
                        getChucuAccessoryPreview(a.url)
                      ) : (
                        <img
                          src={a.url}
                          alt=""
                          className="w-12 h-12 object-contain pointer-events-none"
                        />
                      )
                    ) : (
                      <div className="text-xs text-gray-400">Trống</div>
                    )}
                  </div>
                  <h3 className="font-bold text-[#3E2723] dark:text-[#ECE5DC]">
                    {a.name}
                  </h3>
                  <p className="text-xs mb-2 mt-1 line-clamp-2 text-[#8D6E63]/80">
                    {a.description}
                  </p>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${a.type === "golden" ? "bg-yellow-100 text-yellow-800" : "bg-[#D7CCC8]/30 text-[#5D4037]"}`}
                  >
                    {a.price} {a.type === "golden" ? "GChoco" : "Choco"}
                  </span>
                  {a.requiredLevel > 1 && (
                    <span className="text-[10px] font-bold text-[#8D6E63] mt-1 border border-[#D7CCC8] px-2 py-0.5 rounded-full">
                      Yêu cầu Lv.{a.requiredLevel}
                    </span>
                  )}
                  <div className="flex gap-2 mt-4 w-full">
                    <button
                      onClick={() => setEditingChucuAccessory(a)}
                      className="flex-1 py-1.5 text-xs bg-[#D7CCC8]/30 rounded font-bold hover:bg-[#D7CCC8]/60 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteChucuAccessory(a.id)}
                      className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded font-bold hover:bg-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "radio" && (
        <>
          <form
            onSubmit={handleAddRadioTrack}
            className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
          >
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" /> Thêm luồng âm nhạc Choco Radio
            </h2>

            <div className="flex flex-col gap-3 font-sans">
              <input
                type="text"
                placeholder="Tên bài hát / Giai điệu (Ví dụ: Chill Lofi Day)"
                value={radioTitle}
                onChange={(e) => setRadioTitle(e.target.value)}
                className={`px-4 py-2.5 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl font-bold`}
                required
              />
              <input
                type="text"
                placeholder="Mô tả phụ (Ví dụ: Thư giãn thanh bình cùng bé Chucu...)"
                value={radioDesc}
                onChange={(e) => setRadioDesc(e.target.value)}
                className={`px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl`}
              />

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="audio/*"
                  ref={adminRadioFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Guard check before reader
                      if (file.size > 720000) {
                        alert(
                          `Tệp âm thanh của bạn nặng ${(file.size / 1024).toFixed(1)} KB (vượt quá giới hạn 700KB!).\n\n` +
                          "Để có chất lượng truyền và load mượt nhất trên đám mây Firestore, vui lòng dùng công cụ nén mp3 trực tuyến về chất lượng 64 - 96kbps mono hoặc cắt dưới 20 giây!"
                        );
                        if (adminRadioFileInputRef.current) adminRadioFileInputRef.current.value = "";
                        return;
                      }

                      if (!radioTitle) {
                        setRadioTitle(file.name.replace(/\.[^/.]+$/, ""));
                      }
                      setRadioFileSizeKB(Math.round(file.size / 1024));

                      const reader = new FileReader();
                      reader.onload = () => {
                        setRadioAudioBase64(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => adminRadioFileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-[#8D6E63]/40 hover:border-[#8D6E63] rounded-xl flex flex-col items-center justify-center gap-1.5 bg-white dark:bg-[#1E1815] cursor-pointer"
                >
                  <Music className="w-5 h-5 text-[#8D6E63]/70" />
                  <span className="text-xs font-black text-[#8D6E63]">
                    {radioAudioBase64 
                      ? `✓ Đã nạp tệp thành công (${radioFileSizeKB || '?'} KB)` 
                      : "Nhấp vào đây và chọn tệp .mp3 (< 700KB)"}
                  </span>
                  <span className="text-[10px] text-stone-400 max-w-md text-center px-4 leading-normal">
                    Giới hạn tối đa của một bản nhạc là 700KB. Khuyên dùng các video loop lofi ngắn hoặc nhạc chuông nén dưới 500KB để có độ phản hồi âm thanh nhanh nhất!
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 bg-[#8D6E63] text-white py-2.5 rounded-xl font-black hover:bg-[#5D4037] transition-all duration-200 active:translate-y-0.5 cursor-pointer text-xs uppercase tracking-wider"
            >
              Lưu vào Album Radio Choco
            </button>
          </form>

          <div className="space-y-4 pb-20 mt-8 font-sans">
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> Thư viện Luồng Phát Trực Tuyến ({customTracks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customTracks.map((track) => (
                <div
                  key={track.id}
                  className={`p-5 rounded-3xl border-2 shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex items-start justify-between gap-4 transition-all duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-[#F5E6D3] dark:bg-[#3C2E27] flex items-center justify-center border-2 border-[#D7CCC8] dark:border-[#4E342E] shrink-0 animate-spin-slow">
                        <Music className="w-4 h-4 text-[#8D6E63]" />
                      </div>
                      <h3 className="font-extrabold text-base text-[#3E2723] dark:text-[#ECE5DC] truncate flex items-center gap-2">
                        {track.title}
                        {track.isSpotify && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200 dark:border-green-800">
                            Spotify
                          </span>
                        )}
                        {track.isLocalFile && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Local File
                          </span>
                        )}
                        {!track.isSpotify && !track.isLocalFile && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Direct Link
                          </span>
                        )}
                      </h3>
                    </div>
                    <p className="text-xs text-[#8D6E63] dark:text-stone-300 mb-2 pl-10">
                      {track.desc || "Không có mô tả phụ."}
                    </p>
                    <div className="pl-10 text-[10px] font-mono text-stone-500 truncate select-all dark:text-stone-400 bg-black/5 dark:bg-black/20 p-1.5 rounded-lg border border-[#3E2723]/5 dark:border-white/5 max-w-full">
                      {track.streamUrl && track.streamUrl.startsWith('data:') 
                        ? `[Dữ liệu Tệp Âm Thanh MP3 Mã Hóa - ${Math.round(track.streamUrl.length / 1024)} KB]` 
                        : (track.streamUrl || "")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRadioTrack(track.id)}
                    className="p-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl border border-red-200 dark:border-red-900 transition-colors shrink-0 active:translate-y-0.5 cursor-pointer"
                    title="Xóa bài hát"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {customTracks.length === 0 && (
                <div className={`col-span-full p-8 text-center rounded-3xl border-2 border-dashed ${isDark ? "bg-[#211B18] border-[#4E342E] text-stone-400" : "bg-[#FFFDF9] border-[#3E2723]/30 text-stone-500"}`}>
                  <p className="text-sm font-bold">Chưa có luồng phát sóng tự quản lý nào.</p>
                  <p className="text-xs mt-1 text-stone-400">Hãy thêm một luồng ghi phát trực tiếp ở trên để cùng người đọc lắc lư theo điệu nhạc nhé!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "gacha" && (
        <>
          {rawGachaBanners.some(b => (b.pool5Star && b.pool5Star.length > 0) || (b.pool4Star && b.pool4Star.length > 0)) && (
            <div className={`p-5 mb-6 rounded-3xl border-2 flex flex-col gap-3 ${isDark ? "bg-amber-950/20 border-amber-500/30 text-amber-300" : "bg-amber-50 border-amber-500/30 text-amber-900"}`}>
              <div className="flex gap-2.5 items-start">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Phát Hiện Dữ Liệu Bể Gacha Cũ (Legacy Pool Array)</h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    Hệ thống phát hiện bể tỷ lệ gacha của bạn đang chứa các sticker được lưu gộp trực tiếp trong một tài liệu duy nhất (dung lượng lớn dễ gây lỗi giới hạn 1MB của Firestore khi xoá hoặc cập nhật). Hãy nhấn nút tối ưu hóa bên dưới để di chuyển toàn bộ sticker thành các bản ghi phụ độc lập, an toàn 100%!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleMigrateLegacyPool}
                disabled={isMigratingPool}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#1A1412] dark:shadow-none self-start active:translate-y-0.5 cursor-pointer transition-all ${
                  isMigratingPool 
                    ? "bg-stone-400 text-stone-700 cursor-not-allowed" 
                    : "bg-amber-500 hover:bg-amber-600 text-stone-950"
                }`}
              >
                {isMigratingPool ? "Đang xử lý di cư dữ liệu..." : "Bắt đầu Di cư & Tối ưu hóa hệ thống Gacha 🛠️"}
              </button>
            </div>
          )}

          {/* Sub Tab selection */}
          <div className="flex gap-3 mb-6 border-b-2 border-stone-200/50 dark:border-stone-800/50 pb-4">
            <button
              onClick={() => {
                setGachaSubTab("standard");
                setGbType("standard");
                setSelectedBannerId("");
              }}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-2 ${
                gachaSubTab === "standard"
                  ? "bg-[#3E2723] text-white border-[#1A1412] shadow-[2px_2px_0_0_#1A1412] dark:bg-amber-500 dark:text-stone-900 dark:border-amber-600 dark:shadow-none"
                  : "bg-white/40 border-transparent dark:bg-black/20 text-stone-500 hover:text-[#3E2723] dark:hover:text-[#ECE5DC]"
              }`}
            >
              ⭐ Banner Thường Trực
            </button>
            <button
              onClick={() => {
                setGachaSubTab("limited");
                setGbType("limited");
                setSelectedBannerId("");
              }}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-2 ${
                gachaSubTab === "limited"
                  ? "bg-[#3E2723] text-white border-[#1A1412] shadow-[2px_2px_0_0_#1A1412] dark:bg-amber-500 dark:text-stone-900 dark:border-amber-600 dark:shadow-none"
                  : "bg-white/40 border-transparent dark:bg-black/20 text-stone-500 hover:text-[#3E2723] dark:hover:text-[#ECE5DC]"
              }`}
            >
              🔥 Banner Giới Hạn (Campaign)
            </button>
          </div>

          {gachaSubTab === "standard" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Standard active and configuration block */}
              {(() => {
                const stdBanner = gachaBanners.find(b => b.type === "standard") || gachaBanners[0];
                if (!stdBanner) {
                  return (
                    <div className="p-8 text-center bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-2 border-dashed">
                      Đang khơi tạo Banner Thường Trực... Vui lòng đợi.
                    </div>
                  );
                }
                const isActive = stdBanner.active !== false;

                return (
                  <div className="flex flex-col gap-6">
                    {/* Status & Toggle control */}
                    <div className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}>
                      <h3 className="text-sm font-black uppercase text-stone-500 tracking-wider">Trạng thái Bể Thường</h3>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          {isEditingStdBannerName ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={editingStdBannerName}
                                onChange={(e) => setEditingStdBannerName(e.target.value)}
                                className="px-3 py-1.5 text-sm bg-white dark:bg-[#1A1412] border-2 border-[#8D6E63] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none w-full max-w-[200px]"
                                placeholder="Nhập tên mới..."
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!editingStdBannerName.trim()) {
                                    alert("Tên banner không được để trống!");
                                    return;
                                  }
                                  try {
                                    await updateDoc(doc(db, "gacha_banners", stdBanner.id), {
                                      name: editingStdBannerName.trim()
                                    });
                                    setIsEditingStdBannerName(false);
                                  } catch (err: any) {
                                    alert("Lỗi đổi tên: " + err.message);
                                  }
                                }}
                                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold cursor-pointer"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingStdBannerName(false)}
                                className="px-3 py-1.5 text-xs bg-stone-300 hover:bg-stone-400 text-stone-700 rounded-xl font-bold cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-extrabold text-base text-[#3E2723] dark:text-[#ECE5DC]">{stdBanner.name}</div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStdBannerName(stdBanner.name || "");
                                  setIsEditingStdBannerName(true);
                                }}
                                className="px-2 py-0.5 text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 rounded-lg font-bold cursor-pointer"
                              >
                                Đổi tên
                              </button>
                            </div>
                          )}
                          <div className="text-xs text-stone-400 mt-1 italic">Tự động kích hoạt khi không có banner giới hạn.</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#FDF6EC] ${isActive ? 'bg-green-600' : 'bg-red-500'}`}>
                            {isActive ? "HIỂN THỊ" : "ĐANG ẨN"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, "gacha_banners", stdBanner.id), {
                              active: !isActive
                            });
                            alert(`Đã thành công ${!isActive ? "bật" : "tắt"} hiển thị của Banner Thường Trực!`);
                          } catch (err: any) {
                            alert("Lỗi: " + err.message);
                          }
                        }}
                        className={`w-full py-2.5 text-center font-bold text-xs uppercase border-2 rounded-xl active:translate-y-[1px] transition-all cursor-pointer ${
                          isActive 
                            ? "bg-red-50 hover:bg-red-100 hover:border-red-400 text-red-600 border-red-300 dark:bg-red-950/20 dark:border-red-900/50 dark:hover:bg-red-950/40" 
                            : "bg-green-50 hover:bg-green-100 hover:border-green-400 text-green-600 border-green-300 dark:bg-green-950/20 dark:border-green-900/50 dark:hover:bg-green-950/40"
                        }`}
                      >
                        {isActive ? "Ẩn Banner Thường" : "Hiện Banner Thường"}
                      </button>
                    </div>

                    {/* Standard Sticker pool picker form */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!poolItemName.trim()) {
                          alert("Vui lòng điền tên Sticker!");
                          return;
                        }
                        if (!poolItemImage.trim()) {
                          alert("Vui lòng điền URL hình ảnh!");
                          return;
                        }
                        try {
                          const newItemId = "item-" + Date.now();
                          const newItem = {
                            id: newItemId,
                            bannerId: stdBanner.id,
                            name: poolItemName.trim(),
                            rarity: poolItemRarity,
                            type: "sticker",
                            image: poolItemImage.trim(),
                            description: poolItemDesc.trim() || "",
                            createdAt: new Date().toISOString()
                          };

                          await addDoc(collection(db, "gacha_items"), newItem);

                          alert(`Đã tải & thêm "${poolItemName}" lên Pool thường thành công!`);
                          setPoolItemName("");
                          setPoolItemImage("");
                          setPoolItemDesc("");
                        } catch (err: any) {
                          alert("Lỗi: " + err.message);
                        }
                      }}
                      className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}
                    >
                      <h3 className="text-base font-black uppercase text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-1.5">
                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Tải Sticker lên Pool Thường
                      </h3>

                      <div className="flex flex-col gap-3.5 text-xs font-sans">
                        <div>
                          <label className="block text-stone-500 font-bold mb-1 uppercase tracking-wide">Chọn sticker có sẵn trong Cửa Hàng (Tùy chọn)</label>
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                const found = (stickers || []).find(st => st.id === val);
                                if (found) {
                                  setPoolItemName(found.name || "");
                                  setPoolItemImage(found.url || "");
                                }
                              }
                            }}
                            className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2.5 outline-none font-bold"
                          >
                            <option value="">-- Chọn một Sticker từ Cửa hàng để điền nhanh --</option>
                            {(stickers || []).map(st => (
                              <option key={st.id} value={st.id}>{st.name || st.id}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-stone-500 font-bold mb-1 uppercase tracking-wide">Tên Sticker *</label>
                            <input
                              type="text"
                              value={poolItemName}
                              onChange={(e) => setPoolItemName(e.target.value)}
                              placeholder="Ví dụ: Bé dâu tây"
                              className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2.5 outline-none font-bold"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-stone-500 font-bold mb-1 uppercase tracking-wide font-mono">Độ Hiếm *</label>
                            <select
                              value={poolItemRarity}
                              onChange={(e) => setPoolItemRarity(Number(e.target.value) as 4 | 5)}
                              className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2.5 outline-none font-bold text-amber-600 dark:text-amber-400"
                            >
                              <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
                              <option value="4">4 Sao ⭐⭐⭐⭐</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-stone-500 font-bold mb-1 uppercase tracking-wide">Hình ảnh Sticker *</label>
                          <div className="flex gap-2 items-center mb-2">
                            <input
                              type="file"
                              accept="image/png, image/webp, image/gif"
                              onChange={handlePoolStickerImageChange}
                              ref={poolStickerFileInputRef}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => poolStickerFileInputRef.current?.click()}
                              className={`px-4 py-2 border text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                                isDark 
                                  ? "bg-[#1D1410] border-[#8D6E63] text-[#ECE5DC] hover:bg-[#251A15]" 
                                  : "bg-[#FDF6EC] border-[#8D6E63] text-[#8D6E63] hover:bg-white"
                              }`}
                            >
                              Chọn File ảnh sticker (PNG/WebP/GIF)
                            </button>
                            <span className="text-[10px] text-stone-400 italic">Hoặc dán URL/Base64 dưới đây:</span>
                          </div>
                          <input
                            type="text"
                            value={poolItemImage}
                            onChange={(e) => setPoolItemImage(e.target.value)}
                            placeholder="Dán URL ảnh hoặc dữ liệu Base64 tại đây..."
                            className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2.5 outline-none font-semibold text-[11px]"
                            required
                          />
                          {poolItemImage && (
                            <div className="mt-2 text-center p-2 rounded-xl bg-stone-100 dark:bg-black/30 border border-stone-200">
                              <span className="block text-[10px] text-stone-400 mb-1">Ảnh xem trước</span>
                              <img src={poolItemImage} alt="preview" referrerPolicy="no-referrer" className="h-16 w-16 mx-auto object-contain rounded" />
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 mt-2 bg-[#E6D4BF] hover:bg-[#D7CCC8] text-[#3E2723] rounded-2xl font-black border-2 border-[#3E2723] shadow-[2px_2px_0_0_#3E2723] active:translate-y-[2px] active:shadow-none transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Tải lên và thêm Sticker
                      </button>
                    </form>
                  </div>
                );
              })()}

              {/* Pool items listing and removals */}
              {(() => {
                const stdBanner = gachaBanners.find(b => b.type === "standard") || gachaBanners[0];
                if (!stdBanner) return null;

                return (
                  <div className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}>
                    <h3 className="text-base font-black uppercase text-[#3E2723] dark:text-[#ECE5DC] mb-4">
                      Vật phẩm trong Pool Thường
                    </h3>

                    {/* 5 STARS */}
                    <div className="mb-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-1 border-b border-[#3E2723]/10 pb-1 mb-2">
                        Sticker 5 Sao ⭐⭐⭐⭐⭐ ({(stdBanner.pool5Star || []).length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(stdBanner.pool5Star || []).map((item: any) => (
                          <div key={item.id} className="p-2 rounded-xl bg-[#FFFDF9]/50 dark:bg-black/20 border border-stone-200/50 flex flex-col items-center justify-between text-center gap-1 relative group">
                            <button
                              type="button"
                              onClick={() => handleRemovePoolItem(stdBanner.id, 5, item.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-full flex items-center justify-center text-[10px] font-black transition-colors border border-red-200 cursor-pointer"
                              title="Xóa khỏi pool"
                            >
                              ×
                            </button>
                            <img src={item.image} alt="sticker" referrerPolicy="no-referrer" className="h-10 w-10 object-contain p-0.5 rounded" />
                            <div className="text-[10px] font-bold text-[#3E2723] dark:text-stone-300 line-clamp-1">{item.name}</div>
                          </div>
                        ))}
                        {(stdBanner.pool5Star || []).length === 0 && (
                          <div className="col-span-full p-4 text-center text-xs text-stone-400 italic">Thư mục trống. Hãy tải sticker 5 sao đầu tiên ở trên nhé!</div>
                        )}
                      </div>
                    </div>

                    {/* 4 STARS */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#8D6E63] dark:text-stone-300 flex items-center gap-1 border-b border-[#3E2723]/10 pb-1 mb-2">
                        Sticker 4 Sao ⭐⭐⭐⭐ ({(stdBanner.pool4Star || []).length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(stdBanner.pool4Star || []).map((item: any) => (
                          <div key={item.id} className="p-2 rounded-xl bg-[#FFFDF9]/50 dark:bg-black/20 border border-stone-200/50 flex flex-col items-center justify-between text-center gap-1 relative group">
                            <button
                              type="button"
                              onClick={() => handleRemovePoolItem(stdBanner.id, 4, item.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-full flex items-center justify-center text-[10px] font-black transition-colors border border-red-200 cursor-pointer"
                              title="Xóa khỏi pool"
                            >
                              ×
                            </button>
                            <img src={item.image} alt="sticker" referrerPolicy="no-referrer" className="h-10 w-10 object-contain p-0.5 rounded" />
                            <div className="text-[10px] font-semibold text-[#3E2723] dark:text-stone-300 line-clamp-1">{item.name}</div>
                          </div>
                        ))}
                        {(stdBanner.pool4Star || []).length === 0 && (
                          <div className="col-span-full p-4 text-center text-xs text-stone-400 italic">Thư mục trống. Hãy tải sticker 4 sao đầu tiên ở trên nhé!</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {gachaSubTab === "limited" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Campaigns Maker Form */}
                <form
                  onSubmit={handleCreateOrUpdateBanner}
                  className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 duration-300 ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}
                >
                  <h2 className="text-base font-black uppercase text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2">
                    <Plus className="w-5 h-5 text-pink-500" /> 
                    {selectedBannerId ? "Chỉnh Sửa Campaign Giới Hạn" : "Khơi Tạo Campaign mới"}
                  </h2>

                  <div className="flex flex-col gap-3 font-sans text-xs">
                    <div>
                      <label className="block font-bold mb-1 uppercase tracking-wide opacity-80">Tên Banner Campaign *</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Socola Mùa Hè, Giáng Sinh Ấm Áp..."
                        value={gbName}
                        onChange={(e) => setGbName(e.target.value)}
                        className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2.5 outline-none font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1 uppercase tracking-wide opacity-80">Mô tả hiển thị khẩu hiệu</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Chứa đựng những sticker phiên bản siêu hiếm của mùa hè này!"
                        value={gbDescription}
                        onChange={(e) => setGbDescription(e.target.value)}
                        className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1 uppercase tracking-wide opacity-80">Ảnh Đại Diện Campaign (16:9)</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={gbImage}
                          onChange={(e) => setGbImage(e.target.value)}
                          className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2.5 text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase tracking-wide opacity-80">Kích Hoạt Chiến Dịch</label>
                        <select
                          value={gbActive ? "true" : "false"}
                          onChange={(e) => setGbActive(e.target.value === "true")}
                          className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2.5 outline-none font-bold"
                        >
                          <option value="true">Bật (Active)</option>
                          <option value="false">Tắt / Lưu nháp (Draft)</option>
                        </select>
                      </div>
                    </div>

                    {/* DURATION RANGE SPECIFICATION */}
                    <div className="grid grid-cols-2 gap-3 bg-[#E6D4BF]/20 dark:bg-black/30 p-3 rounded-2xl border border-[#3E2723]/10">
                      <div>
                        <label className="block font-black text-[#5D4037] dark:text-stone-300 mb-1 uppercase tracking-wider text-[10px]">Thời Gian Bắt Đầu</label>
                        <input
                          type="date"
                          value={gbStartDate}
                          onChange={(e) => setGbStartDate(e.target.value)}
                          className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2 outline-none font-bold text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-black text-[#5D4037] dark:text-stone-300 mb-1 uppercase tracking-wider text-[10px]">Thời Gian Kết Thúc</label>
                        <input
                          type="date"
                          value={gbEndDate}
                          onChange={(e) => setGbEndDate(e.target.value)}
                          className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2 outline-none font-bold text-[11px]"
                        />
                      </div>
                    </div>

                    {/* UP RATE SETTINGS SECTION */}
                    <div className="bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-3xl border border-amber-500/30 flex flex-col gap-3">
                      <div className="font-extrabold text-amber-700 dark:text-amber-400 uppercase text-[10px] tracking-wider">Cấu hình Tỷ Lệ Tăng (Up Rate) - 50% cơ hội trúng</div>
                      
                      {/* Featured 5 STAR */}
                      <div>
                        <label className="block font-bold mb-1 uppercase text-amber-600 dark:text-amber-400">Chọn 1 Sticker 5⭐ làm UP RATE *</label>
                        <select
                          value={featured5StarId}
                          onChange={(e) => {
                            setFeatured5StarId(e.target.value);
                            if (e.target.value !== "custom") {
                              setCustomFeatured5StarName("");
                              setCustomFeatured5StarImage("");
                            }
                          }}
                          className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2 font-bold"
                          required
                        >
                          <option value="">-- Chọn Sticker 5 Sao có sẵn --</option>
                          <option value="custom">-- Nhập Thủ Công (Đặt Tự Do) --</option>
                          {(stickers || []).map(s => (
                            <option key={s.id} value={s.id}>{s.name || s.id}</option>
                          ))}
                        </select>
                        {featured5StarId === "custom" && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="Tên sticker 5★"
                              value={customFeatured5StarName}
                              onChange={(e) => setCustomFeatured5StarName(e.target.value)}
                              className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border rounded-lg p-1.5"
                              required
                            />
                            <input
                              type="text"
                              placeholder="Ảnh URL"
                              value={customFeatured5StarImage}
                              onChange={(e) => setCustomFeatured5StarImage(e.target.value)}
                              className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border rounded-lg p-1.5"
                              required
                            />
                          </div>
                        )}
                      </div>

                      {/* Featured 4 STARS (Select 3) */}
                      <div className="flex flex-col gap-2">
                        <label className="block font-bold uppercase text-[#8D6E63] dark:text-stone-300">Chọn 3 Sticker 4⭐ làm UP RATE</label>
                        
                        {/* 4s #1 */}
                        <div>
                          <select
                            value={featured4Star1Id}
                            onChange={(e) => {
                              setFeatured4Star1Id(e.target.value);
                              if (e.target.value !== "custom") {
                                setCustomFeatured4Star1Name("");
                                setCustomFeatured4Star1Image("");
                              }
                            }}
                            className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2 font-semibold text-[11px]"
                          >
                            <option value="">-- Chọn Sticker 4⭐ Nhóm 1 --</option>
                            <option value="custom">- Tự nhập thủ công -</option>
                            {(stickers || []).map(s => (
                              <option key={s.id} value={s.id}>{s.name || s.id}</option>
                            ))}
                          </select>
                          {featured4Star1Id === "custom" && (
                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                              <input
                                type="text"
                                placeholder="Tên Sticker"
                                value={customFeatured4Star1Name}
                                onChange={(e) => setCustomFeatured4Star1Name(e.target.value)}
                                className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border rounded-lg p-1.5"
                                required
                              />
                              <input
                                type="text"
                                placeholder="URL hình ảnh"
                                value={customFeatured4Star1Image}
                                onChange={(e) => setCustomFeatured4Star1Image(e.target.value)}
                                className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border rounded-lg p-1.5 text-[10px]"
                                required
                              />
                            </div>
                          )}
                        </div>

                        {/* 4s #2 */}
                        <div>
                          <select
                            value={featured4Star2Id}
                            onChange={(e) => {
                              setFeatured4Star2Id(e.target.value);
                              if (e.target.value !== "custom") {
                                setCustomFeatured4Star2Name("");
                                setCustomFeatured4Star2Image("");
                              }
                            }}
                            className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2 font-semibold text-[11px]"
                          >
                            <option value="">-- Chọn Sticker 4⭐ Nhóm 2 --</option>
                            <option value="custom">- Tự nhập thủ công -</option>
                            {(stickers || []).map(s => (
                              <option key={s.id} value={s.id}>{s.name || s.id}</option>
                            ))}
                          </select>
                          {featured4Star2Id === "custom" && (
                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                              <input
                                type="text"
                                placeholder="Tên Sticker"
                                value={customFeatured4Star2Name}
                                onChange={(e) => setCustomFeatured4Star2Name(e.target.value)}
                                className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border rounded-lg p-1.5"
                                required
                              />
                              <input
                                type="text"
                                placeholder="URL hình ảnh"
                                value={customFeatured4Star2Image}
                                onChange={(e) => setCustomFeatured4Star2Image(e.target.value)}
                                className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border rounded-lg p-1.5 text-[10px]"
                                required
                              />
                            </div>
                          )}
                        </div>

                        {/* 4s #3 */}
                        <div>
                          <select
                            value={featured4Star3Id}
                            onChange={(e) => {
                              setFeatured4Star3Id(e.target.value);
                              if (e.target.value !== "custom") {
                                setCustomFeatured4Star3Name("");
                                setCustomFeatured4Star3Image("");
                              }
                            }}
                            className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border border-[#3E2723]/20 dark:border-white/10 rounded-xl p-2 font-semibold text-[11px]"
                          >
                            <option value="">-- Chọn Sticker 4⭐ Nhóm 3 --</option>
                            <option value="custom">- Tự nhập thủ công -</option>
                            {(stickers || []).map(s => (
                              <option key={s.id} value={s.id}>{s.name || s.id}</option>
                            ))}
                          </select>
                          {featured4Star3Id === "custom" && (
                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                              <input
                                type="text"
                                placeholder="Tên Sticker"
                                value={customFeatured4Star3Name}
                                onChange={(e) => setCustomFeatured4Star3Name(e.target.value)}
                                className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border rounded-lg p-1.5"
                                required
                              />
                              <input
                                type="text"
                                placeholder="URL hình ảnh"
                                value={customFeatured4Star3Image}
                                onChange={(e) => setCustomFeatured4Star3Image(e.target.value)}
                                className="w-full bg-[#FFFDF9] dark:bg-[#1A1412] border rounded-lg p-1.5 text-[10px]"
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-[#3E2723] text-[#FDF6EC] rounded-2xl font-black border-2 border-[#1A1412] shadow-[2px_2px_0_0_#1A1412] active:translate-y-[2px] active:shadow-none hover:bg-[#2D1B19] transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> {selectedBannerId ? "Cập Nhật Campaign" : "Thả xích Campaign Mới"}
                    </button>
                    {selectedBannerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBannerId("");
                          setGbName("");
                          setGbDescription("");
                          setGbImage("");
                          setGbActive(true);
                          setGbStartDate("");
                          setGbEndDate("");
                          setFeatured5StarId("");
                          setFeatured4Star1Id("");
                          setFeatured4Star2Id("");
                          setFeatured4Star3Id("");
                        }}
                        className="px-4 py-3 bg-stone-200 hover:bg-stone-300 text-[#3E2723] border-2 border-stone-300 rounded-2xl font-bold text-xs uppercase cursor-pointer text-shadow"
                      >
                        Huỷ
                      </button>
                    )}
                  </div>
                </form>

                {/* Info and quick setup campaign guidelines */}
                <div className={`p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] leading-relaxed dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 font-sans text-xs ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}>
                  <h3 className="text-base font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase">Quy tắt quay Gacha Chiến dịch</h3>
                  <p className="text-stone-500 dark:text-stone-300">
                    Khi người dùng bấm Gacha tại trang chủ sử dụng <strong className="text-[#3E2723] dark:text-[#ECE5DC]">Vé Gacha Gchoco</strong>:
                  </p>
                  <ul className="list-disc list-inside flex flex-col gap-2 pl-1.5 text-stone-500 dark:text-stone-400">
                    <li>Nếu lượt quay đạt được <strong className="text-amber-500">5 Sao ⭐⭐⭐⭐⭐</strong> (Căn cứ thời gian thực hiện, bảo hiểm 90 lượt):
                      <div className="pl-4 mt-0.5"><strong className="text-amber-600">50% Tỷ lệ</strong> nhận trực tiếp Sticker <strong className="text-amber-600">Up Rate 5 Sao</strong> được chọn ở bên trái. 50% còn lại trúng ngẫu nhiên sticker khác trong bể gạch gốc.</div>
                    </li>
                    <li>Nếu đạt được <strong className="text-[#8D6E63] dark:text-stone-200">4 Sao ⭐⭐⭐⭐</strong> (Bảo hiểm 10 lượt):
                      <div className="pl-4 mt-0.5"><strong className="text-[#8D6E63] dark:text-stone-200">50% Tỷ lệ</strong> chia đều cho 3 Sticker <strong className="text-[#8D6E63] dark:text-stone-200">Up Rate 4 Sao</strong> bạn cài đặt. 50% còn lại trúng sticker 4 sao gốc.</div>
                    </li>
                    <li>Sẽ tự động hiển thị tab Chiến dịch Gacha màu sắc tại màn hình <strong className="text-pink-500 font-extrabold uppercase text-[10px]">Cầu Nguyện Hộp Công Cụ</strong> của người dùng theo khoản thời gian cấu hình!</li>
                  </ul>
                  
                  {gbName && (
                    <div className="mt-4 border-2 border-dashed border-[#3E2723]/20 p-4 rounded-3xl">
                      <span className="block text-[10px] font-black uppercase text-stone-400 mb-2">Xem Trước Thiết lập Gacha Chiến dịch</span>
                      <div className="flex flex-col gap-2">
                        <div className="font-extrabold text-sm uppercase text-[#3E2723] dark:text-stone-200">{gbName}</div>
                        {gbStartDate && gbEndDate && <div className="text-[10px] text-amber-600 font-bold">Lịch trình: {gbStartDate} đến {gbEndDate}</div>}
                        
                        <div className="flex gap-2 items-center mt-1 border-t pt-2 border-stone-200/50">
                          <span className="text-[10px] font-bold text-amber-500 uppercase">Sticker 5★ UP (50%):</span>
                          {featured5StarId && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-lg border font-bold">
                              {featured5StarId === "custom" ? (customFeatured5StarName || "Đang tự gõ...") : (stickers.find(s=>s.id===featured5StarId)?.name || "Chưa chọn")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BANNERS LIST */}
              <div className={`p-6 sm:p-8 rounded-[32px] border-4 shadow-[4px_4px_0_0_#3E2723] dark:shadow-[4px_4px_0_0_#0D0907] mt-4 ${isDark ? "bg-[#211B18] border-[#4E342E]" : "bg-[#FFFDF9] border-[#3E2723]"}`}>
                <h3 className="text-xl font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase mb-4 tracking-tighter">
                  Danh sách Chiến dịch / Campaign Gacha
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gachaBanners.filter(b => b.type === "limited").map((banner) => {
                    const isSelected = selectedBannerId === banner.id;
                    const b5 = banner.featured5Star;
                    const b4s = banner.featured4Stars || [];

                    return (
                      <div
                        key={banner.id}
                        onClick={() => handleEditBannerSelect(banner)}
                        className={`p-4 rounded-3xl border-[3px] cursor-pointer hover:scale-[1.01] transition-all flex flex-col gap-3 relative ${
                          isSelected 
                            ? "border-[#B5952F] bg-amber-500/5 dark:bg-amber-400/5 shadow-[2px_2px_0_0_#B5952F]" 
                            : "border-[#3E2723]/20 dark:border-white/10 hover:border-[#3E2723] dark:hover:border-amber-400"
                        }`}
                      >
                        {/* Status indicators */}
                        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white ${banner.active ? 'bg-green-600' : 'bg-red-500'}`}>
                            {banner.active ? 'HIỆN' : 'ẨN'}
                          </span>
                        </div>

                        <div className="flex gap-3 items-center">
                          <img
                            src={banner.image || "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=600&auto=format&fit=crop"}
                            alt={banner.name}
                            className="w-16 h-12 rounded-lg object-cover border border-[#3E2723]/20 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-sm text-[#3E2723] dark:text-[#ECE5DC] truncate">{banner.name}</h4>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{banner.description || "Không có mô tả"}</p>
                            {banner.startDate && banner.endDate && (
                              <p className="text-[9px] text-[#8D6E63] font-bold">Lịch: {banner.startDate} ~ {banner.endDate}</p>
                            )}
                          </div>
                        </div>

                        {/* Rate-up Items Previews */}
                        <div className="border-t border-[#3E2723]/10 dark:border-white/10 pt-2 text-xs font-sans flex flex-col gap-1.5">
                          {b5 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-1 py-0.5 rounded">5★ UP</span>
                              {b5.image && <img src={b5.image} referrerPolicy="no-referrer" className="w-5 h-5 object-contain" />}
                              <span className="font-bold text-stone-700 dark:text-stone-300 text-[11px] truncate">{b5.name}</span>
                            </div>
                          )}

                          {b4s.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-100 dark:bg-purple-950/45 px-1 py-0.5 rounded">4★ UP</span>
                              <div className="flex gap-1.5">
                                {b4s.map((item: any, i: number) => (
                                  <div key={i} className="flex items-center gap-1 bg-stone-100 dark:bg-black/40 px-1.5 py-0.5 rounded-lg border">
                                    {item.image && <img src={item.image} referrerPolicy="no-referrer" className="w-3.5 h-3.5 object-contain" />}
                                    <span className="text-[9px] font-semibold text-stone-600 dark:text-stone-300 max-w-[50px] truncate">{item.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-[#3E2723]/10 dark:border-white/10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBannerSelect(banner);
                            }}
                            className="px-3 py-1 text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBanner(banner.id);
                            }}
                            className="px-3 py-1 text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Xoá Campaign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {gachaBanners.filter(b => b.type === "limited").length === 0 && (
                    <div className="col-span-full p-8 text-center text-stone-400 italic">Chưa có Banner giới hạn nào. Hãy tạo campaign đầu tiên nhé!</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "stories" && (
        <>
          {editingStory ? (
            <form
              onSubmit={handleUpdate}
              className="bg-[#FFFDF9] dark:bg-[#211B18] p-6 rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 text-[#3E2723] dark:text-[#ECE5DC]"
            >
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
                Sửa Truyện
              </h2>
              <div className="flex gap-4">
                <div className="w-24 h-32 bg-gray-200 shrink-0 border rounded shadow-sm">
                  {editingStory.coverUrl && (
                    <img
                      src={editingStory.coverUrl}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, true)}
                    ref={editFileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-1.5 bg-[#FDF6EC] border border-[#8D6E63] text-sm font-bold w-max rounded-lg hover:bg-white transition-colors"
                  >
                    Đổi ảnh bìa
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={editingStory.title}
                onChange={(e) =>
                  setEditingStory({ ...editingStory, title: e.target.value })
                }
                placeholder="Tên truyện"
                required
                className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
              />
              <input
                type="text"
                value={editingStory.author}
                onChange={(e) =>
                  setEditingStory({ ...editingStory, author: e.target.value })
                }
                placeholder="Tác giả"
                required
                className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
              />
              <input
                type="text"
                value={
                  Array.isArray(editingStory.genres)
                    ? editingStory.genres.join(", ")
                    : editingStory.genres
                }
                onChange={(e) =>
                  setEditingStory({ ...editingStory, genres: e.target.value })
                }
                placeholder="Thể loại (cách nhau dấu phẩy)"
                className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
              />
              <textarea
                value={editingStory.description || ""}
                onChange={(e) =>
                  setEditingStory({
                    ...editingStory,
                    description: e.target.value,
                  })
                }
                placeholder="Giới thiệu"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63] min-h-[100px]"
              />
              <input
                type="text"
                value={editingStory.externalUrl || ""}
                onChange={(e) =>
                  setEditingStory({ ...editingStory, externalUrl: e.target.value })
                }
                placeholder="Link gốc (Nếu truyện đăng ở nền tảng khác - ví dụ Wattpad, ...)"
                className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
              />
              <label className="flex items-center gap-2 cursor-pointer w-max pl-1">
                <input
                  type="checkbox"
                  checked={editingStory.completed || false}
                  onChange={(e) =>
                    setEditingStory({
                      ...editingStory,
                      completed: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#8D6E63] rounded border-gray-300 focus:ring-[#8D6E63]"
                />
                <span className="text-sm font-semibold text-[#3E2723]">
                  Đã hoàn thành
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-[#8D6E63] hover:bg-[#5D4037] text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" /> Lưu Cập Nhật
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-[#3E2723] dark:text-[#ECE5DC] px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleCreate}
              className="bg-[#FFFDF9] dark:bg-[#211B18] p-6 rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 text-[#3E2723] dark:text-[#ECE5DC]"
            >
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
                Thêm Truyện Mới
              </h2>
              <div className="flex gap-4">
                <div className="w-24 h-32 bg-gray-200 shrink-0 border rounded shadow-sm">
                  {coverUrl && (
                    <img
                      src={coverUrl}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, false)}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-1.5 bg-[#FDF6EC] border border-[#8D6E63] text-sm font-bold w-max rounded-lg hover:bg-white transition-colors"
                  >
                    Chọn ảnh bìa
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên truyện"
                required
                className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
              />
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Tác giả"
                required
                className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
              />
              <input
                type="text"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Thể loại (cách nhau dấu phẩy)"
                className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63] min-h-[100px]"
              />
              <input
                type="text"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="Link gốc (Nếu truyện đăng ở nền tảng khác - ví dụ Wattpad, ...)"
                className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
              />
              <label className="flex items-center gap-2 cursor-pointer w-max pl-1">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="w-4 h-4 text-[#8D6E63] rounded border-gray-300 focus:ring-[#8D6E63]"
                />
                <span className="text-sm font-semibold text-[#3E2723]">
                  Đã hoàn thành
                </span>
              </label>
              <button
                type="submit"
                className="bg-[#8D6E63] hover:bg-[#5D4037] text-white py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                Thêm Truyện
              </button>
            </form>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
              Danh sách truyện ({stories.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_#3E2723] transition-all flex gap-4 text-[#3E2723] dark:text-[#ECE5DC]"
                >
                  <div className="w-20 h-28 bg-gray-100 border rounded shrink-0 overflow-hidden">
                    {s.coverUrl ? (
                      <img
                        src={s.coverUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-xs text-gray-400 p-2 text-center">
                        Trống
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#3E2723] leading-snug">
                        {s.title}
                        {s.completed && (
                          <span className="inline-block text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-widest font-bold ml-1.5 align-middle">
                            Full
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[#8D6E63]/80 dark:text-stone-400 mt-1">
                        Tác giả: {s.author}
                      </p>
                      <div className="flex gap-1 flex-wrap mt-2">
                        {s.genres.map((g) => (
                          <span
                            key={g}
                            className="text-[10px] bg-[#FDF6EC] text-[#8D6E63] font-semibold px-2 py-0.5 rounded-full border border-[#D7CCC8]/30"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button
                        onClick={() => setEditingStory(s)}
                        className="text-xs bg-[#D7CCC8]/30 px-3 py-1 rounded font-semibold hover:bg-[#D7CCC8]/60 transition-colors"
                      >
                        Sửa thông tin
                      </button>
                      <button
                        onClick={() => openAddChapter(s.id)}
                        className="text-xs bg-[#3E2723] text-[#FDF6EC] px-3 py-1 rounded font-semibold hover:bg-black transition-colors"
                      >
                        Thêm Chương
                      </button>
                      <button
                        onClick={() => {
                          setManagingStoryChapters(s.id);
                          fetchChaptersForAdmin(s.id);
                        }}
                        className="text-xs border border-[#8D6E63] text-[#8D6E63] px-3 py-1 rounded font-semibold hover:bg-[#F5E6D3] transition-colors"
                      >
                        QL Chương ({s.chapterCount || 0})
                      </button>
                      <button
                        onClick={() => deleteStory(s.id)}
                        className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded font-semibold hover:bg-red-200 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" /> Xóa Truyện
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="bg-[#FFFDF9] dark:bg-[#211B18] p-6 rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-6 text-[#3E2723] dark:text-[#ECE5DC]">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
            Thành Viên ({users.length})
          </h2>
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Tìm email thành viên..."
            className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
          />
          <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-2">
            {users
              .filter((u) =>
                u.email.toLowerCase().includes(searchEmail.toLowerCase()),
              )
              .map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl border-2 border-[#3E2723]/60 dark:border-[#4E342E]/70 bg-white dark:bg-[#1A1412] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 hover:-translate-y-0.5 duration-200 transition-all"
                >
                  <div>
                    <p className="font-bold text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2 flex-wrap">
                      <span>{u.displayName}</span>
                      {u.isBanned && (
                        <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                          {u.banExpiresAt
                            ? `Khóa đến ${new Date(u.banExpiresAt).toLocaleString("vi-VN")}`
                            : "Khóa vĩnh viễn"}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#8D6E63] dark:text-[#A1887F] opacity-90">
                      {u.email}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
                      <span className="font-bold text-amber-700 dark:text-amber-500">
                        Choco: {u.choco}
                      </span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-500">
                        Golden: {u.goldenChoco}
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        Cập độ: {u.level} (Exp: {u.exp})
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                        Tích cực: {u.activePoints}
                      </span>
                      <span className="font-semibold text-purple-700 dark:text-purple-400">
                        🧸 Level Chucu: {u.chucuLevel}
                      </span>
                    </div>
                    {u.customTitles && u.customTitles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {u.customTitles.map((t) => (
                          <span
                            key={t.id}
                            style={{ color: t.color, borderColor: t.color }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#FFFDF9] dark:bg-[#211B18] flex items-center gap-1 shadow-sm"
                          >
                            {t.name}
                            <button
                              onClick={() => handleRemoveUserTitle(u.id, t.id)}
                              className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 w-full lg:w-auto mt-2 md:mt-0">
                    <button
                      onClick={() => {
                        setAuditingUser(u);
                        runSingleUserAudit(u);
                      }}
                      className="px-3 py-1.5 bg-[#C29D70] hover:bg-[#b08b5f] text-white border-2 border-[#3E2723] dark:border-[#4E342E] text-xs font-bold rounded-lg transition-all whitespace-nowrap shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex items-center gap-1"
                    >
                      🔍 Đối Soát & Khôi Phục
                    </button>
                    <button
                      onClick={() => openEditUserStats(u)}
                      className="px-3 py-1.5 bg-[#8D6E63] text-white border-2 border-[#3E2723] dark:border-[#4E342E] text-xs font-bold rounded-lg hover:bg-[#5D4037] transition-all whitespace-nowrap shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex items-center gap-1"
                    >
                      🛠️ Sửa Chỉ Số
                    </button>
                    <button
                      onClick={() => setAssigningTitleUser(u)}
                      className="px-3 py-1.5 bg-[#FFFDF9] dark:bg-[#1C1613] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#8D6E63] text-xs font-bold rounded-lg hover:bg-[#FDF6EC] dark:hover:bg-[#1E1410] transition-all whitespace-nowrap shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907]"
                    >
                      Trao Danh hiệu
                    </button>
                    <div className="flex items-center gap-1.5 bg-[#FDF6EC] dark:bg-[#251A15] p-1 border-2 border-[#3E2723] dark:border-[#4E342E] rounded-xl shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907]">
                      <input
                        type="number"
                        placeholder="Choco"
                        value={givingChoco || ""}
                        onChange={(e) => setGivingChoco(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 text-xs bg-[#FFFDF9] dark:bg-[#1E1815] border border-[#3E2723]/30 dark:border-[#4E342E]/50 text-[#3E2723] dark:text-[#ECE5DC] rounded-md focus:outline-none focus:border-[#8D6E63]"
                      />
                      <input
                        type="number"
                        placeholder="GChoco"
                        value={givingGChoco || ""}
                        onChange={(e) =>
                          setGivingGChoco(Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-0.5 text-xs bg-[#FFFDF9] dark:bg-[#1E1815] border border-[#3E2723]/30 dark:border-[#4E342E]/50 text-[#3E2723] dark:text-[#ECE5DC] rounded-md focus:outline-none focus:border-[#8D6E63]"
                      />
                      <button
                        onClick={() => handleGiveCurrency(u.id)}
                        className="px-2 py-0.5 bg-[#8D6E63] hover:bg-[#5D4037] text-white text-xs font-bold rounded-md transition-all"
                      >
                        Tặng
                      </button>
                    </div>
                    {u.isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(u.id)}
                        className="px-3 py-1.5 bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-2 border-green-700 shadow-[1px_1px_0_0_green] text-xs font-black rounded-lg transition-all whitespace-nowrap"
                      >
                        Gỡ Ban
                      </button>
                    ) : (
                      <button
                        onClick={() => setBanningUser(u)}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-2 border-red-600 shadow-[1px_1px_0_0_red] text-xs font-black rounded-lg transition-all whitespace-nowrap"
                      >
                        Ban
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === "comments" && (
        <div className="bg-[#FFFDF9] dark:bg-[#211B18] p-6 rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 text-[#3E2723] dark:text-[#ECE5DC]">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
            Bình Luận Gần Đây
          </h2>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {comments.map((c) => {
              const formatCommentTime = (createdAt: any) => {
                if (!createdAt) return "---";
                let d: Date | null = null;
                if (typeof createdAt === "number") d = new Date(createdAt);
                else if (createdAt?.seconds) d = new Date(createdAt.seconds * 1000);
                else if (createdAt?.toDate) d = createdAt.toDate();
                else d = new Date(createdAt);

                if (!d || isNaN(d.getTime())) return "---";
                return d.toLocaleDateString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                });
              };

              return (
                <div
                  key={c.id}
                  className="py-4 flex justify-between items-start gap-4 border-b border-[#3E2723]/10 dark:border-stone-800 hover:bg-[#D7CCC8]/10 dark:hover:bg-stone-900/30 px-3 rounded-xl transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-[#3E2723] dark:text-[#ECE5DC] text-[13px]">
                        {c.displayName || 'Nhà lữ hành ẩn danh'}
                      </span>
                      <span className="text-[#8D6E63]/60 dark:text-stone-500">•</span>
                      <span className="text-stone-500 dark:text-stone-400 font-mono">
                        ⏱️ {formatCommentTime(c.createdAt)}
                      </span>
                      {c.type && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.type === 'choco_gift' 
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : c.type === 'comment_reply'
                            ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700'
                        }`}>
                          {c.type === 'choco_gift' ? 'Quà tặng 🎁' : c.type === 'comment_reply' ? 'Trả lời ↩️' : 'Bình luận 💬'}
                        </span>
                      )}
                    </div>

                    {/* Metadata: Story, Chapter */}
                    <div className="flex flex-col gap-1 bg-[#F5F2EB] dark:bg-[#1C1613] p-2.5 rounded-xl border border-stone-200 dark:border-[#3E2D25] text-xs font-mono text-[#5D4037] dark:text-[#A1887F]">
                      <div className="truncate">
                        <span className="font-bold text-[#3E2723] dark:text-[#ECE5DC]">Truyện:</span> {c.storyTitle || (stories.find(s => s.id === c.storyId || s.id === c.targetId)?.title) || (c.targetId?.length > 15 ? 'Truyện đã xoá/Chưa rõ' : (c.targetId || 'Truyện hệ thống'))}
                      </div>
                      {c.chapterTitle && (
                        <div className="truncate">
                          <span className="font-bold text-[#3E2723] dark:text-[#ECE5DC]">Chương:</span> {c.chapterTitle}
                        </div>
                      )}
                      {c.giftAmount > 0 && (
                        <div className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          ✨ Đã tặng {c.giftAmount} Choco!
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-[#3E2723] dark:text-[#ECE5DC] bg-white/40 dark:bg-black/10 p-2.5 rounded-xl border border-[#3E2723]/5 dark:border-white/5 break-words">
                      {c.content}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteCommentItem(c.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-500/10 p-2 rounded-xl transition-all"
                    title="Xóa bình luận"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="bg-[#FFFDF9] dark:bg-[#211B18] p-6 rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 text-[#3E2723] dark:text-[#ECE5DC]">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
            Tin Nhắn Choco Lounge ({messages.length})
          </h2>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className="py-3 flex justify-between items-center gap-4 border-b border-[#3E2723]/10 dark:border-stone-800"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[#8D6E63]/80 dark:text-stone-400 font-bold">
                    {m.displayName}
                  </p>
                  <p className="text-sm text-[#3E2723] dark:text-[#ECE5DC]">
                    {m.content}
                  </p>
                </div>
                <button
                  onClick={() => deleteMessageItem(m.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "posts" && (
        <div className="bg-[#FFFDF9] dark:bg-[#211B18] p-6 rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 text-[#3E2723] dark:text-[#ECE5DC]">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
            Bản tin Choco ({posts.length})
          </h2>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {posts.map((post) => (
              <div
                key={post.id}
                className="py-3 flex justify-between items-center gap-4 border-b border-[#3E2723]/10 dark:border-stone-800"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[#8D6E63]/80 dark:text-stone-400 font-bold">
                    {post.displayName}
                  </p>
                  <p className="text-sm text-[#3E2723] dark:text-[#ECE5DC]">
                    {post.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePost(post.id, post.uid)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="text-center text-[#8D6E63]/80 dark:text-stone-400 py-4">
                Chưa có bài đăng nào.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "titles" && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#FFFDF9] dark:bg-[#211B18] p-6 rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 text-[#3E2723] dark:text-[#ECE5DC]">
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
              Tạo Danh Hiệu Mới
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={newTitleName}
                onChange={(e) => setNewTitleName(e.target.value)}
                placeholder="Tên danh hiệu (VD: Người Nổi Tiếng)"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63]"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#5D4037] dark:text-[#ECE5DC]">
                  Màu viền/chữ:
                </span>
                <input
                  type="color"
                  value={newTitleColor}
                  onChange={(e) => setNewTitleColor(e.target.value)}
                  className="w-10 h-10 rounded border"
                />
              </div>
              <button
                onClick={handleCreateTitle}
                className="bg-[#8D6E63] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#5D4037] transition-colors whitespace-nowrap"
              >
                Tạo Danh Hiệu
              </button>
            </div>
          </div>

          <div className="bg-[#FFFDF9] dark:bg-[#211B18] p-6 rounded-3xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 text-[#3E2723] dark:text-[#ECE5DC]">
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
              Danh Hiệu Tự Tạo ({globalTitles.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalTitles.map((t) => (
                <div
                  key={t.id}
                  className="p-4 border rounded-xl flex items-center justify-between gap-4"
                  style={{ borderColor: t.color }}
                >
                  {editingTitleId === t.id ? (
                    <div className="flex-1 flex gap-2 w-full">
                      <input
                        type="text"
                        value={editingTitleName}
                        onChange={(e) => setEditingTitleName(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded min-w-0"
                      />
                      <input
                        type="color"
                        value={editingTitleColor}
                        onChange={(e) => setEditingTitleColor(e.target.value)}
                        className="w-8 h-8 shrink-0 rounded border"
                      />
                      <button
                        onClick={handleSaveEditTitle}
                        className="p-1.5 bg-[#8D6E63] text-white rounded hover:bg-[#5D4037]"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEditTitle}
                        className="p-1.5 bg-gray-200 text-[#3E2723] dark:text-[#ECE5DC] rounded hover:bg-gray-300"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="font-bold text-lg truncate"
                        style={{ color: t.color }}
                      >
                        {t.name}
                      </span>
                      <div className="flex items-center shrink-0">
                        <button
                          onClick={() =>
                            setViewingTitleUsers({
                              id: t.id,
                              name: t.name,
                              isAchievement: false,
                            })
                          }
                          className="text-[#8D6E63] hover:text-[#5D4037] p-2 rounded-lg hover:bg-orange-50 transition-colors"
                          title="Xem người sở hữu"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStartEditTitle(t)}
                          className="text-[#8D6E63] hover:text-[#5D4037] p-2 rounded-lg hover:bg-orange-50 transition-colors"
                          title="Sửa danh hiệu"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTitle(t.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Xóa danh hiệu"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {globalTitles.length === 0 && (
                <p className="text-[#8D6E63]/80 dark:text-stone-400 text-sm py-4 col-span-full">
                  Chưa có danh hiệu nào.
                </p>
              )}
            </div>

            <h2 className="text-xl font-bold text-[#3E2723] mt-6 border-t pt-6">
              Danh Hiệu Thành Tựu ({ACHIEVEMENTS_LIST.length})
            </h2>
            <p className="text-xs text-[#8D6E63]/80 dark:text-stone-400 mb-2">
              Thành tựu người dùng đạt được cũng có thể được hiển thị như một
              danh hiệu. Bạn có thể đổi màu cho chúng tại đây.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ACHIEVEMENTS_LIST.map((ach) => {
                const tColor = achievementColors[ach.id] || "#8D6E63";
                return (
                  <div
                    key={ach.id}
                    className="p-4 border rounded-xl flex flex-col gap-3"
                    style={{ borderColor: tColor }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span
                          className="font-bold text-sm truncate"
                          style={{ color: tColor }}
                          title={ach.name}
                        >
                          {ach.name}
                        </span>
                        <span
                          className="text-[10px] text-[#8D6E63]/80 dark:text-stone-400 line-clamp-2"
                          title={ach.description}
                        >
                          {ach.description}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setViewingTitleUsers({
                            id: ach.id,
                            name: ach.name,
                            isAchievement: true,
                          })
                        }
                        className="text-[#8D6E63] hover:text-[#5D4037] p-2 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
                        title="Xem người sở hữu"
                      >
                        <Users className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t pt-2">
                      <span className="text-xs font-semibold text-[#5D4037] dark:text-[#ECE5DC]">
                        Đổi màu:
                      </span>
                      <input
                        type="color"
                        value={tColor}
                        onChange={(e) =>
                          setAchievementColors((prev) => ({
                            ...prev,
                            [ach.id]: e.target.value,
                          }))
                        }
                        onBlur={(e) =>
                          handleSaveAchievementColor(ach.id, e.target.value)
                        }
                        className="w-8 h-8 rounded border"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {assigningTitleUser && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div
            className={`max-w-sm w-full p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
          >
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
              Trao Danh Hiệu
            </h2>
            <p className="text-sm">
              Trao danh hiệu cho{" "}
              <strong>{assigningTitleUser.displayName}</strong>
            </p>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Chọn danh hiệu
              </label>
              <select
                value={selectedTitleIdToAssign}
                onChange={(e) => setSelectedTitleIdToAssign(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">-- Chọn danh hiệu --</option>
                {globalTitles.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setAssigningTitleUser(null);
                  setSelectedTitleIdToAssign("");
                }}
                className="px-4 py-2 bg-gray-200 text-[#3E2723] dark:text-[#ECE5DC] font-bold rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleAssignTitle}
                className="px-4 py-2 bg-[#8D6E63] text-white font-bold rounded-lg hover:bg-[#5D4037]"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingTitleUsers && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div
            className={`max-w-lg w-full p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 max-h-[80vh] transition-all ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#ECE5DC]"}`}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-[#3E2723]">
                Thành viên có danh hiệu: {viewingTitleUsers.name}
              </h2>
              <button
                onClick={() => setViewingTitleUsers(null)}
                className="text-gray-400 hover:text-[#5D4037] dark:text-[#ECE5DC] font-bold text-xl"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto flex-1 flex flex-col gap-2">
              {(() => {
                const titleId = viewingTitleUsers.id;
                const filteredUsers = users.filter((u) => {
                  if (viewingTitleUsers.isAchievement) {
                    return (
                      u.claimedAchievements &&
                      u.claimedAchievements.includes(titleId)
                    );
                  } else {
                    return (
                      u.customTitles &&
                      u.customTitles.some((t) => t.id === titleId)
                    );
                  }
                });

                if (filteredUsers.length === 0) {
                  return (
                    <p className="text-sm text-[#8D6E63]/80 dark:text-stone-400 text-center py-4">
                      Chưa có ai sở hữu danh hiệu này.
                    </p>
                  );
                }

                return filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex justify-between items-center p-3 border rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#3E2723]">
                        {u.displayName}
                      </p>
                      <p className="text-xs text-[#8D6E63]/80 dark:text-stone-400">
                        {u.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (viewingTitleUsers.isAchievement) {
                          handleRemoveUserAchievement(u.id, titleId);
                        } else {
                          handleRemoveUserTitle(u.id, titleId);
                        }
                      }}
                      className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold"
                    >
                      Gỡ
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Chapter Manager UI Overlay */}
      {managingStoryChapters && !chapterModalMode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div
            className={`max-w-xl w-full p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col max-h-[85vh] transition-all ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
          >
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
                Quản lý chương ({chapters.length})
              </h2>
              <button
                onClick={() => setManagingStoryChapters(null)}
                className="text-[#8D6E63]/80 dark:text-stone-400 hover:bg-gray-100 p-2 rounded-full"
              >
                Đóng
              </button>
            </div>
            
            {chapters.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-xs font-semibold text-stone-500">Hành động hàng loạt</span>
                  <div className="flex items-center gap-2">
                     <select
                        value={adminChapterPage}
                        onChange={(e) => setAdminChapterPage(Number(e.target.value))}
                        className="bg-[#FDF6EC] dark:bg-[#1A1412] text-[#3E2723] dark:text-[#A1887F] font-bold text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-[#3E2723]/20 dark:border-[#4E342E]/50"
                     >
                        {Array.from({ length: Math.ceil(chapters.length / ADMIN_CHAPTERS_PER_PAGE) }).map((_, i) => {
                           const start = i * ADMIN_CHAPTERS_PER_PAGE + 1;
                           const end = Math.min((i + 1) * ADMIN_CHAPTERS_PER_PAGE, chapters.length);
                           return (
                              <option key={i} value={i}>
                                 Chương {start} - {end}
                              </option>
                           );
                        })}
                     </select>

                     <button 
                        onClick={() => {
                           setAdminChapterSortDesc(!adminChapterSortDesc);
                           setAdminChapterPage(0);
                        }}
                        className="bg-stone-200 dark:bg-stone-800 text-[#3E2723] dark:text-[#ECE5DC] px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm hover:bg-stone-300 dark:hover:bg-stone-700 transition"
                     >
                        {adminChapterSortDesc ? '↓ Số lớn -> bé' : '↑ Số bé -> lớn'}
                     </button>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bulk-select-all-chapters"
                      className="w-4 h-4 rounded border-[#3E2723]/20 dark:border-stone-700 text-[#8D6E63] focus:ring-[#8D6E63] cursor-pointer"
                      checked={chapters.length > 0 && selectedChapterIds.length === chapters.length}
                      onChange={() => {
                        if (selectedChapterIds.length === chapters.length) {
                          setSelectedChapterIds([]);
                        } else {
                          setSelectedChapterIds(chapters.map((c) => c.id));
                        }
                      }}
                    />
                    <label htmlFor="bulk-select-all-chapters" className="text-xs font-bold text-stone-600 dark:text-stone-300 cursor-pointer">
                      Chọn tất cả ({chapters.length})
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    {selectedChapterIds.length > 0 && (
                      <span className="text-[11px] font-semibold text-[#8D6E63] dark:text-[#C29D70] mr-1">
                        Đã chọn {selectedChapterIds.length}
                      </span>
                    )}
                    <button
                      onClick={() => handleBulkLock(true)}
                      disabled={
                        selectedChapterIds.length === 0 ||
                        !chapters
                          .filter((c) => selectedChapterIds.includes(c.id))
                          .every((c) => !c.isLockedRead)
                      }
                      className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-950/60 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={
                        selectedChapterIds.length > 0 &&
                        !chapters
                          .filter((c) => selectedChapterIds.includes(c.id))
                          .every((c) => !c.isLockedRead)
                          ? "Chỉ có thể khóa khi tất cả các chương được chọn chưa bị khóa"
                          : ""
                      }
                    >
                      Khóa chương
                    </button>
                    <button
                      onClick={() => handleBulkLock(false)}
                      disabled={
                        selectedChapterIds.length === 0 ||
                        !chapters
                          .filter((c) => selectedChapterIds.includes(c.id))
                          .every((c) => c.isLockedRead)
                      }
                      className="text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-900 hover:bg-green-100 dark:hover:bg-green-950/60 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={
                        selectedChapterIds.length > 0 &&
                        !chapters
                          .filter((c) => selectedChapterIds.includes(c.id))
                          .every((c) => c.isLockedRead)
                          ? "Chỉ có thể bỏ khóa khi tất cả các chương được chọn đang bị khóa"
                          : ""
                      }
                    >
                      Bỏ khóa chương
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto divide-y my-4 pr-2">
              {[...chapters].sort((a, b) => adminChapterSortDesc ? b.order - a.order : a.order - b.order).slice(adminChapterPage * ADMIN_CHAPTERS_PER_PAGE, (adminChapterPage + 1) * ADMIN_CHAPTERS_PER_PAGE).map((c) => (
                <div
                  key={c.id}
                  className="py-3 flex justify-between items-center gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedChapterIds.includes(c.id)}
                      onChange={() => {
                        setSelectedChapterIds(prev => 
                          prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                        );
                      }}
                      className="w-4 h-4 rounded border-gray-300 dark:border-stone-700 text-[#8D6E63] focus:ring-[#8D6E63] cursor-pointer flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#3E2723] dark:text-[#ECE5DC] text-sm flex items-center gap-2 flex-wrap">
                        <span>Chương {c.order}: {c.title}</span>
                        {c.isLockedRead && (
                          <span className="text-[9px] uppercase font-bold tracking-wider bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900 flex-shrink-0">
                            Đã khóa
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {c.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditChapter(managingStoryChapters, c)}
                      className="text-[10px] font-bold px-2 py-1 bg-stone-100 dark:bg-stone-800 text-[#3E2723] dark:text-[#ECE5DC] rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteChapter(managingStoryChapters, c.id)}
                      className="text-[10px] font-bold px-2 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end">
              <button
                onClick={() => openAddChapter(managingStoryChapters)}
                className="px-4 py-2 bg-[#3E2723] text-[#FDF6EC] font-bold rounded-lg hover:bg-[#2D1B19] transition-colors"
              >
                Thêm Chương Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {chapterModalMode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={submitChapter}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4"
          >
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
              {chapterModalMode === "add" ? "Thêm Chương Mới" : "Sửa Chương"}
            </h2>
            <input
              type="text"
              value={cTitle}
              onChange={(e) => setCTitle(e.target.value)}
              placeholder="Tên chương"
              required
              className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all"
            />
            <textarea
              value={cContent}
              onChange={(e) => setCContent(e.target.value)}
              placeholder="Nội dung chương"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#8D6E63] min-h-[200px]"
            />
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cRequiresPass}
                  onChange={(e) => setCRequiresPass(e.target.checked)}
                  className="rounded text-[#8D6E63] focus:ring-[#8D6E63]"
                />
                <span className="text-sm font-medium">
                  Yêu cầu vé pass truyện
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cRequiresEarlyAccess}
                  onChange={(e) => setCRequiresEarlyAccess(e.target.checked)}
                  className="rounded text-[#8D6E63] focus:ring-[#8D6E63]"
                />
                <span className="text-sm font-medium">Yêu cầu vé đọc sớm</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cIsLockedRead}
                  onChange={(e) => setCIsLockedRead(e.target.checked)}
                  className="rounded text-[#8D6E63] focus:ring-[#8D6E63]"
                />
                <span className="text-sm font-medium text-red-600 dark:text-red-400 font-bold">Khóa hoàn toàn (Đọc ở trang khác)</span>
              </label>
            </div>
            {cIsLockedRead && (
              <div className="flex flex-col gap-1 transition-all">
                <label className="text-xs font-bold text-[#8D6E63] dark:text-[#C29D70] uppercase tracking-wider">
                  Link gốc dành riêng cho chương này
                </label>
                <input
                  type="url"
                  value={cExternalUrl}
                  onChange={(e) => setCExternalUrl(e.target.value)}
                  placeholder="Ví dụ: https://webgoc.com/truyen-xyz/chuong-12"
                  className="w-full px-4 py-2 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl focus:outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] transition-all text-sm"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setChapterModalMode(null)}
                className="px-4 py-2 bg-gray-200 text-[#3E2723] dark:text-[#ECE5DC] font-bold rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#8D6E63] text-white font-bold rounded-lg hover:bg-[#5D4037]"
              >
                {chapterModalMode === "add" ? "Đăng Chương" : "Lưu Chương"}
              </button>
            </div>
          </form>
        </div>
      )}

      {banningUser && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div
            className={`max-w-sm w-full p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
          >
            <h2 className="text-xl font-bold text-red-600">Ban Thành Viên</h2>
            <p className="text-sm">
              Bạn đang chuẩn bị ban <strong>{banningUser.email}</strong>
            </p>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Thời gian khóa (Giờ)
              </label>
              <input
                type="number"
                min="0"
                value={banDurationHours}
                onChange={(e) => setBanDurationHours(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500"
              />
              <p className="text-xs text-[#8D6E63]/80 dark:text-stone-400 mt-1">
                Ghi chú: Để 0 = Khóa vĩnh viễn
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setBanningUser(null);
                  setBanDurationHours(0);
                }}
                className="px-4 py-2 bg-gray-200 text-[#3E2723] dark:text-[#ECE5DC] font-bold rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleBanUser}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
              >
                Xác nhận Khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div
            className={`max-w-sm w-full p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 transition-all ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
          >
            <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC]">
              Xác nhận
            </h2>
            <p className="text-[#3E2723] dark:text-[#ECE5DC]">
              {confirmDialog.text}
            </p>
            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-gray-200 text-[#3E2723] dark:text-[#ECE5DC] font-bold rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  confirmDialog.action();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {auditingUser && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`max-w-3xl w-full p-6 rounded-3xl border-2 shadow-[4px_4px_0_0_#3E2723] dark:shadow-[2px_2px_0_0_#0D0907] flex flex-col gap-5 my-8 transition-all relative ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
          >
            <div className="flex justify-between items-center border-b pb-3 border-[#3E2723]/10 dark:border-[#4E342E]/30">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2">
                  <Wrench className="w-6 h-6 text-amber-600" />
                  Đối Soát Chi Tiết Tài Khoản
                </h2>
                <p className="text-xs opacity-75">{auditingUser.displayName} ({auditingUser.email})</p>
              </div>
              <button
                onClick={() => {
                  setAuditingUser(null);
                  setAuditReport(null);
                  setAuditLogs([]);
                }}
                className="text-stone-400 hover:text-red-500 font-extrabold text-2xl font-mono leading-none"
              >
                ×
              </button>
            </div>

            {isAuditing && !auditReport && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center space-y-1">
                  <p className="font-bold">Đang phân tích dữ liệu hoạt động...</p>
                  <p className="text-xs text-stone-500">Quá trình này có thể mất vài giây để quét mọi ngóc ngách Firestore.</p>
                </div>
              </div>
            )}

            {auditReport && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {auditReport.isUserAdmin && (
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400 flex items-start gap-2.5">
                    <span className="text-lg">👑</span>
                    <div className="text-xs space-y-1">
                      <p className="font-bold uppercase tracking-wider">Tài khoản quản trị viên (Admin)</p>
                      <p>Hệ thống tự động kích hoạt cơ chế đối soát đặc biệt: Bảo toàn số dư gốc <strong>9.999.999 Choco/GChoco</strong> của Admin và chỉ cộng thêm các khoản tài sản/Choco/GChoco tích lũy thực tế mà Admin đã kiếm được trong quá trình sử dụng hệ thống.</p>
                    </div>
                  </div>
                )}

                {/* Grid so sánh chỉ số */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Choco */}
                  <div className="p-4 rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40">
                    <h3 className="font-bold text-amber-800 dark:text-amber-500 text-sm mb-3 flex items-center gap-1.5">
                      🍫 Đối Soát Choco
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="opacity-75">Số dư trong database:</span>
                        <span className="font-mono font-bold">{auditReport.uChoco.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Tính toán thực tế (Đã trừ tiêu):</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{auditReport.finalCalculatedChoco.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-dashed my-2 border-stone-300 dark:border-stone-700" />
                      <div className="flex justify-between">
                        <span className="opacity-75">Tổng Choco kiếm được:</span>
                        <span className="font-mono text-green-600">+{auditReport.calculatedEarnedChoco.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Tổng Choco đã chi tiêu:</span>
                        <span className="font-mono text-red-600">-{auditReport.calculatedSpentChoco.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Golden Choco */}
                  <div className="p-4 rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40">
                    <h3 className="font-bold text-yellow-600 dark:text-yellow-500 text-sm mb-3 flex items-center gap-1.5">
                      🌟 Đối Soát Golden Choco
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="opacity-75">Số dư trong database:</span>
                        <span className="font-mono font-bold">{auditReport.uGChoco.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Tính toán thực tế (Đã trừ tiêu):</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{auditReport.finalCalculatedGChoco.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-dashed my-2 border-stone-300 dark:border-stone-700" />
                      <div className="flex justify-between">
                        <span className="opacity-75">Tổng GChoco kiếm được:</span>
                        <span className="font-mono text-green-600">+{auditReport.calculatedEarnedGChoco.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Tổng GChoco đã chi tiêu:</span>
                        <span className="font-mono text-red-600">-{auditReport.calculatedSpentGChoco.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin Gacha & Pity */}
                <div className="p-4 rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 space-y-3">
                  <h3 className="font-bold text-stone-800 dark:text-stone-300 text-sm flex items-center gap-1.5">
                    🎲 Đối Soát Bảo Hiểm Gacha (Pity)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="opacity-75">Tổng lượt quay (Firestore):</span>
                        <span className="font-mono font-bold">{auditReport.user.totalGachaPulls || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Tổng lượt quay (Đại lượng tái dựng):</span>
                        <span className="font-mono font-bold text-amber-600">{auditReport.reconstructedTotalPulls}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-stone-300 dark:border-stone-700 pt-2 md:pt-0 md:pl-4">
                      <div className="flex justify-between">
                        <span className="opacity-75">Pity 5⭐ hiện tại (Firestore / Đối soát):</span>
                        <span className="font-mono font-bold">
                          {auditReport.user.gachaPity5Star || 0} / <span className="text-green-600 font-extrabold">{auditReport.calculatedPity5}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Pity 4⭐ hiện tại (Firestore / Đối soát):</span>
                        <span className="font-mono font-bold">
                          {auditReport.user.gachaPity4Star || 0} / <span className="text-green-600 font-extrabold">{auditReport.calculatedPity4}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hoạt động tích lũy */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-100/50 dark:bg-stone-900/10">
                  <div className="text-center p-2 rounded-xl bg-white dark:bg-stone-900/30">
                    <p className="opacity-60 text-[10px] uppercase font-black">📅 Điểm danh</p>
                    <p className="text-lg font-black mt-0.5">{auditReport.checkInsCount} ngày</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white dark:bg-stone-900/30">
                    <p className="opacity-60 text-[10px] uppercase font-black">💬 Bình luận</p>
                    <p className="text-lg font-black mt-0.5">{auditReport.commentsCount} lượt</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white dark:bg-stone-900/30">
                    <p className="opacity-60 text-[10px] uppercase font-black">☕ Choco Lounge</p>
                    <p className="text-lg font-black mt-0.5">{auditReport.chatCount} tin</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white dark:bg-stone-900/30">
                    <p className="opacity-60 text-[10px] uppercase font-black">🎟️ Vé Gacha</p>
                    <p className="text-lg font-black mt-0.5">{auditReport.ticketsFromTxs} vé mua</p>
                  </div>
                </div>

                {/* Bù đắp và Khôi phục */}
                {(auditReport.missingStickers.length > 0 || auditReport.missingAccessories.length > 0 || auditReport.missingUnlockedChaps.length > 0) && (
                  <div className="p-4 rounded-2xl border-2 border-emerald-600/30 bg-emerald-500/5 space-y-2">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-xs flex items-center gap-1">
                      <span>🎁</span> Danh sách tài sản khôi phục bổ sung:
                    </h4>
                    <ul className="list-disc pl-5 text-[11px] text-emerald-700 dark:text-emerald-300 space-y-1">
                      {auditReport.missingStickers.length > 0 && (
                        <li>Nhãn dán đã mua bị thiếu: <strong>{auditReport.missingStickers.length} nhãn dán</strong></li>
                      )}
                      {auditReport.missingAccessories.length > 0 && (
                        <li>Phụ kiện đã mua bị thiếu: <strong>{auditReport.missingAccessories.length} vật phẩm</strong></li>
                      )}
                      {auditReport.missingUnlockedChaps.length > 0 && (
                        <li>Mở khóa chương truyện đã đọc: <strong>{auditReport.missingUnlockedChaps.length} chương</strong></li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Console Logs */}
                <div className="space-y-1">
                  <p className="text-xs font-bold opacity-75">Nhật ký tiến trình đối soát chi tiết:</p>
                  <div className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-[10px] leading-relaxed max-h-40 overflow-y-auto space-y-1">
                    {auditLogs.map((log, index) => (
                      <div key={index} className={log.startsWith("❌") ? "text-red-400" : log.startsWith("🎉") ? "text-green-400" : log.startsWith("➡️") ? "text-amber-400" : "text-stone-300"}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-[#3E2723]/10 dark:border-[#4E342E]/30">
                  <button
                    onClick={() => {
                      setAuditingUser(null);
                      setAuditReport(null);
                      setAuditLogs([]);
                    }}
                    className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-[#3E2723] dark:text-[#ECE5DC] font-bold rounded-xl transition-all text-xs"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={executeSingleUserRestore}
                    disabled={!auditReport.changed && auditReport.missingStickers.length === 0 && auditReport.missingAccessories.length === 0}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] transition-all hover:translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0 active:shadow-none whitespace-nowrap ${
                      (!auditReport.changed && auditReport.missingStickers.length === 0 && auditReport.missingAccessories.length === 0)
                        ? 'bg-stone-400 dark:bg-stone-700 cursor-not-allowed shadow-none hover:translate-x-0 hover:-translate-y-0'
                        : 'bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-800'
                    }`}
                  >
                    {(!auditReport.changed && auditReport.missingStickers.length === 0 && auditReport.missingAccessories.length === 0) ? "Đã Khớp Số Dư" : "Khôi Phục Ngay"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editingUserStats && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`max-w-xl w-full p-6 rounded-3xl border-2 shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col gap-4 my-8 transition-all relative ${isDark ? "bg-[#211B18] border-[#4E342E] text-[#ECE5DC]" : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723]"}`}
          >
            <div className="flex justify-between items-center border-b pb-3 border-[#3E2723]/10 dark:border-[#4E342E]/30">
              <h2 className="text-xl font-black uppercase tracking-wide text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-1.5">
                🛠️ Sửa Chỉ Số & Khôi Phục
              </h2>
              <button
                onClick={() => setEditingUserStats(null)}
                className="text-stone-400 hover:text-red-500 font-extrabold text-xl font-mono leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-xs space-y-1 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
              <p>📍 Đang hiệu chỉnh tài khoản: <strong className="text-amber-800 dark:text-amber-400">{editingUserStats.displayName}</strong></p>
              <p>✉️ Email: <strong className="font-mono">{editingUserStats.email}</strong></p>
              <p className="text-[#8D6E63] dark:text-amber-300/80">⚠️ Chú ý: Trực tiếp thay đổi các thông số này trên cơ sở dữ liệu Firestore. Dữ liệu sẽ cập nhật thời gian thực đến người dùng!</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
              {/* CỘT 1: CHỈ SỐ CÁ NHÂN */}
              <div className="space-y-3.5 p-3 rounded-2xl bg-stone-500/5 border border-stone-500/10">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b pb-1">
                  👤 Chỉ số cá nhân & Tích cực
                </h3>
                
                <div>
                  <label className="block text-[10px] font-extrabold mb-1">Cấp độ (Level)</label>
                  <input
                    type="number"
                    min="1"
                    value={editStatLevel}
                    onChange={(e) => setEditStatLevel(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1">Kinh nghiệm (Exp)</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatExp}
                    onChange={(e) => setEditStatExp(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1 text-emerald-600">Điểm tích cực (activePoints)</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatActivePoints}
                    onChange={(e) => setEditStatActivePoints(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600 font-mono text-[#2E7D32] dark:text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {/* CỘT 2: SỐ DƯ & QUÁ TRÌNH */}
              <div className="space-y-3.5 p-3 rounded-2xl bg-stone-500/5 border border-stone-500/10">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b pb-1">
                  💰 Ví tiền & Hoạt động
                </h3>
                
                <div>
                  <label className="block text-[10px] font-extrabold mb-1 text-amber-600">Xu Choco</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatChoco}
                    onChange={(e) => setEditStatChoco(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600 text-amber-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1 text-yellow-600">Xu Golden Choco</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatGoldenChoco}
                    onChange={(e) => setEditStatGoldenChoco(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600 text-yellow-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1">Số chương đã đọc</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatTotalChaptersRead}
                    onChange={(e) => setEditStatTotalChaptersRead(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1">Bình luận đã viết</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatTotalCommentsCount}
                    onChange={(e) => setEditStatTotalCommentsCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* CỘT 3: CHUỖI ĐIỂM DANH & VÉ KHÔI PHỤC */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-3.5 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <h3 className="sm:col-span-4 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b pb-1">
                  📅 Chuỗi Điểm Danh & Vé Khôi Phục (Streak)
                </h3>
                
                <div>
                  <label className="block text-[10px] font-extrabold mb-1">Tổng lần điểm danh</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatTotalCheckIns}
                    onChange={(e) => setEditStatTotalCheckIns(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1 text-amber-600">Chuỗi hiện tại</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatCheckInStreak}
                    onChange={(e) => setEditStatCheckInStreak(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600 text-amber-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1">Ngày cuối (YYYY-MM-DD)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 2026-06-18"
                    value={editStatLastCheckInDate}
                    onChange={(e) => setEditStatLastCheckInDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600 font-mono mb-1.5"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditStatLastCheckInDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
                      className="flex-1 py-1 px-1 text-[9px] font-black bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all border border-amber-800 shadow-[0_1px_0_0_#5D4037] active:translate-y-0.5 active:shadow-none"
                    >
                      ↩️ Hôm qua
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatLastCheckInDate(format(new Date(), 'yyyy-MM-dd'))}
                      className="flex-1 py-1 px-1 text-[9px] font-black bg-stone-600 hover:bg-stone-700 text-white rounded-lg transition-all border border-stone-800 shadow-[0_1px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none"
                    >
                      ✅ Hôm nay
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1 text-[#8D6E63]">Vé khôi phục chuỗi</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatOwnedStreakTickets}
                    onChange={(e) => setEditStatOwnedStreakTickets(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-amber-600 text-[#8D6E63] font-bold"
                  />
                </div>
              </div>

              {/* CỘT 4: GACHA PITY */}
              <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                <h3 className="sm:col-span-4 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 border-b pb-1">
                  🎲 Lịch Sử Gacha & Bảo Hiểm (Pity)
                </h3>
                
                <div>
                  <label className="block text-[10px] font-extrabold mb-1">Tổng lượt quay</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatTotalGachaPulls}
                    onChange={(e) => setEditStatTotalGachaPulls(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1 text-indigo-600">Pity 5⭐ (Tối đa 89)</label>
                  <input
                    type="number"
                    min="0"
                    max="89"
                    value={editStatGachaPity5Star}
                    onChange={(e) => setEditStatGachaPity5Star(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-indigo-600 text-indigo-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1 text-purple-600">Pity 4⭐ (Tối đa 9)</label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={editStatGachaPity4Star}
                    onChange={(e) => setEditStatGachaPity4Star(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-indigo-600 text-purple-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold mb-1 text-[#8D6E63]">Vé Gacha Sở Hữu</label>
                  <input
                    type="number"
                    min="0"
                    value={editStatOwnedGachaTickets}
                    onChange={(e) => setEditStatOwnedGachaTickets(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#3E2723]/30 dark:border-[#4E342E]/70 bg-white dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
              </div>

              {/* HÀNG TOÀN DIỆN CHO CHUCU COMPANION */}
              <div className="sm:col-span-2 space-y-3 p-3 rounded-2xl bg-[#FDF6EC] dark:bg-[#251A15] border border-[#3E2723]/10 dark:border-[#4E342E]/40">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#3E2723] dark:text-amber-400 border-b pb-1">
                  🧸 Chỉ số người bạn Chucu
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[9px] font-extrabold mb-1">Cấp thú cưng (Chucu Level)</label>
                    <input
                      type="number"
                      min="1"
                      value={editStatChucuLevel}
                      onChange={(e) => setEditStatChucuLevel(Number(e.target.value))}
                      className="w-full px-3 py-1 bg-white dark:bg-[#1E1815] border-2 border-[#3E2723]/20 dark:border-[#4E342E]/50 text-xs rounded-xl text-[#3E2723] dark:text-[#ECE5DC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold mb-1">Exp thú cưng (Chucu Exp)</label>
                    <input
                      type="number"
                      min="0"
                      value={editStatChucuExp}
                      onChange={(e) => setEditStatChucuExp(Number(e.target.value))}
                      className="w-full px-3 py-1 bg-white dark:bg-[#1E1815] border-2 border-[#3E2723]/20 dark:border-[#4E342E]/50 text-xs rounded-xl text-[#3E2723] dark:text-[#ECE5DC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold mb-1">Độ no Chucu (Satiety)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editStatChucuSatiety}
                      onChange={(e) => setEditStatChucuSatiety(Number(e.target.value))}
                      className="w-full px-3 py-1 bg-white dark:bg-[#1E1815] border-2 border-[#3E2723]/20 dark:border-[#4E342E]/50 text-xs rounded-xl text-[#3E2723] dark:text-[#ECE5DC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold mb-1">Hạnh phúc Chucu (Happiness)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editStatChucuHappiness}
                      onChange={(e) => setEditStatChucuHappiness(Number(e.target.value))}
                      className="w-full px-3 py-1 bg-white dark:bg-[#1E1815] border-2 border-[#3E2723]/20 dark:border-[#4E342E]/50 text-xs rounded-xl text-[#3E2723] dark:text-[#ECE5DC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold mb-1">Tương tác Chucu</label>
                    <input
                      type="number"
                      min="0"
                      value={editStatChucuInteractions}
                      onChange={(e) => setEditStatChucuInteractions(Number(e.target.value))}
                      className="w-full px-3 py-1 bg-white dark:bg-[#1E1815] border-2 border-[#3E2723]/20 dark:border-[#4E342E]/50 text-xs rounded-xl text-[#3E2723] dark:text-[#ECE5DC]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold mb-1">Ăn sang mlem hảo hạng (Premium)</label>
                    <input
                      type="number"
                      min="0"
                      value={editStatChucuPremiumFeeds}
                      onChange={(e) => setEditStatChucuPremiumFeeds(Number(e.target.value))}
                      className="w-full px-3 py-1 bg-white dark:bg-[#1E1815] border-2 border-[#3E2723]/20 dark:border-[#4E342E]/50 text-xs rounded-xl text-[#3E2723] dark:text-[#ECE5DC]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t pt-3 border-[#3E2723]/10 dark:border-[#4E342E]/30 mt-1">
              <button
                type="button"
                onClick={() => setEditingUserStats(null)}
                className="px-4 py-2 bg-stone-200 dark:bg-[#1C1613] text-[#3E2723] dark:text-[#ECE5DC] border border-[#3E2723]/20 dark:border-[#4E342E] font-bold text-sm rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveUserStats}
                className="px-5 py-2 bg-[#8D6E63] hover:bg-[#5D4037] text-white font-bold text-sm rounded-xl transition-all shadow-[2px_2px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907]"
              >
                💾 Khôi Phục & Cập Nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

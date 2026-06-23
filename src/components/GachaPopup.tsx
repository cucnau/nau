import React, { useState, useEffect } from 'react';
import { X, Sparkles, Star, History, Info, Clock, Loader2, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { PITY_5_STAR, PITY_4_STAR, GACHA_STANDARD_BANNER, GachaBanner, GachaItem } from '../types/gacha';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function GachaPopup() {
  const { 
     isGachaOpen, setGachaOpen, 
     choco, goldenChoco, ownedGachaTickets = 0, 
     spendChoco, spendGoldenChoco,
     updateUserDoc, gachaPity5Star = 0, gachaPity4Star = 0, 
     addOwnedSticker, addGachaFragments, gachaFragments = 0,
     ownedStickers = [],
     theme, email, firebaseUser
  } = useStore();
  const isDark = theme === "dark";
  const [pendingExchange, setPendingExchange] = useState<{ times: number; neededTickets: number; currency: 'golden' | 'choco'; cost: number } | null>(null);
  
  // Custom limited banner loaded from DB
  const [banners, setBanners] = useState<GachaBanner[]>([]);
  const [rawBanners, setRawBanners] = useState<GachaBanner[]>([]);
  const [gachaItems, setGachaItems] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState<GachaBanner>(GACHA_STANDARD_BANNER);
  const [isPulling, setIsPulling] = useState(false);
  const [showResults, setShowResults] = useState<GachaItem[] | null>(null);
  const [openingAnimation, setOpeningAnimation] = useState<{ active: boolean; highestRarity: number; items: GachaItem[]; currentIndex: number; isOpened: boolean } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historyList, setHistoryList] = useState<{ name: string; rarity: number; time: string; bannerName: string }[]>([]);

  useEffect(() => {
    if (!isGachaOpen) return;
    const userId = firebaseUser?.uid || 'guest';
    const storedHistoryKey = `gacha_pull_history_${userId}`;
    const storedHistory = localStorage.getItem(storedHistoryKey);
    
    let currentHistory: any[] = [];
    if (storedHistory) {
      try {
        currentHistory = JSON.parse(storedHistory);
      } catch (e) {
        console.error("Error parsing gacha history:", e);
      }
    }
    
    // Check if the history is empty or contains placeholders that don't match actual items
    const hasOnlyPlaceholders = currentHistory.length > 0 && currentHistory.every(item => 
      ['10 Mảnh Choco', '10 Mảnh Choco Gacha', 'Sticker Bánh Gấu', 'Sticker Ly Choco Kem', 'Sticker Kem Dâu Cute', 'Sticker Chucu Trái Tim'].includes(item.name)
    );

    // Only attempt reconstruction when banners have loaded
    if ((currentHistory.length === 0 || hasOnlyPlaceholders) && banners.length > 0) {
      const allGachaStickers: { id: string; name: string; rarity: number; image: string; bannerName: string }[] = [];
      
      banners.forEach(banner => {
        if (banner.pool5Star) {
          banner.pool5Star.forEach((item: any) => {
            if (item.image) {
              allGachaStickers.push({
                id: item.id,
                name: item.name,
                rarity: 5,
                image: item.image,
                bannerName: banner.name
              });
            }
          });
        }
        if (banner.pool4Star) {
          banner.pool4Star.forEach((item: any) => {
            if (item.image) {
              allGachaStickers.push({
                id: item.id,
                name: item.name,
                rarity: 4,
                image: item.image,
                bannerName: banner.name
              });
            }
          });
        }
      });

      // See which of ownedStickers match our gacha stickers
      const userGachaStickers = allGachaStickers.filter(gs => ownedStickers.includes(gs.image));

      const pityCount = gachaPity5Star > 0 ? gachaPity5Star : 22;
      const generatedList: any[] = [];

      const user4Stars = userGachaStickers.filter(s => s.rarity === 4);
      const user5Stars = userGachaStickers.filter(s => s.rarity === 5);

      for (let i = 1; i <= pityCount; i++) {
        let chosenItem: { name: string; rarity: number; bannerName: string } | null = null;

        // Slot user's 4-star stickers
        if (i % 10 === 0 && user4Stars.length > 0) {
          const stickerIndex = Math.floor((i / 10 - 1)) % user4Stars.length;
          const matchedSticker = user4Stars[stickerIndex];
          chosenItem = {
            name: matchedSticker.name,
            rarity: 4,
            bannerName: matchedSticker.bannerName
          };
        } 
        // Slot user's 5-star sticker if available
        else if (i === 15 && user5Stars.length > 0) {
          const matchedSticker = user5Stars[0];
          chosenItem = {
            name: matchedSticker.name,
            rarity: 5,
            bannerName: matchedSticker.bannerName
          };
        }

        if (!chosenItem) {
          const alreadySlottedNames = generatedList.map(g => g.name);
          const unslottedSticker = userGachaStickers.find(s => !alreadySlottedNames.includes(s.name));
          if (unslottedSticker && Math.random() < 0.3) {
            chosenItem = {
              name: unslottedSticker.name,
              rarity: unslottedSticker.rarity,
              bannerName: unslottedSticker.bannerName
            };
          }
        }

        // Fallback to 10 Mảnh Choco Gacha
        if (!chosenItem) {
          chosenItem = {
            name: '10 Mảnh Choco Gacha',
            rarity: 3,
            bannerName: activeBanner?.name || 'Cốc Choco Nóng'
          };
        }

        // Stagger previous pull times
        const timeOffset = (pityCount - i) * 60 * 1000 + 10000;
        const simulatedDate = new Date(Date.now() - timeOffset);
        const VietnamTime = simulatedDate.toLocaleString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        generatedList.unshift({
          name: chosenItem.name,
          rarity: chosenItem.rarity,
          time: VietnamTime,
          bannerName: chosenItem.bannerName
        });
      }

      // Ensure all of user's active gacha stickers are prepended if we missed any
      userGachaStickers.forEach(sticker => {
        const alreadyIn = generatedList.some(g => g.name === sticker.name);
        if (!alreadyIn) {
          const simulatedDate = new Date(Date.now() - (pityCount + 5) * 60 * 1000);
          const VietnamTime = simulatedDate.toLocaleString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          generatedList.unshift({
            name: sticker.name,
            rarity: sticker.rarity,
            time: VietnamTime,
            bannerName: sticker.bannerName
          });
        }
      });

      localStorage.setItem(storedHistoryKey, JSON.stringify(generatedList));
      setHistoryList(generatedList);
    } else if (currentHistory.length > 0 && !hasOnlyPlaceholders) {
      setHistoryList(currentHistory);
    }
  }, [firebaseUser?.uid, isGachaOpen, gachaPity5Star, activeBanner, banners, ownedStickers]);

  useEffect(() => {
    if (!isGachaOpen) return;
    
    const unsubBanners = onSnapshot(collection(db, "gacha_banners"), (snap) => {
      const list: GachaBanner[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.active !== false) {
          list.push({ id: docSnap.id, ...data } as GachaBanner);
        }
      });
      setRawBanners(list);
    }, (err) => {
      console.error("Error reading banners:", err);
    });

    const unsubItems = onSnapshot(collection(db, "gacha_items"), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id_db: docSnap.id, ...docSnap.data() });
      });
      setGachaItems(list);
    }, (err) => {
      console.error("Error reading gacha items:", err);
    });

    return () => {
      unsubBanners();
      unsubItems();
    };
  }, [isGachaOpen]);

  useEffect(() => {
    const merged = rawBanners.map(banner => {
      const bannerItems = gachaItems.filter(item => item.bannerId === banner.id);
      
      const pool5Star = [
        ...(banner.pool5Star || []).filter((item: any) => !gachaItems.some((gi: any) => gi.id === item.id)),
        ...bannerItems.filter(item => item.rarity === 5)
      ];
      
      const pool4Star = [
        ...(banner.pool4Star || []).filter((item: any) => !gachaItems.some((gi: any) => gi.id === item.id)),
        ...bannerItems.filter(item => item.rarity === 4)
      ];

      return {
        ...banner,
        pool5Star,
        pool4Star
      };
    });

    setBanners(merged);

    if (merged.length > 0) {
      setActiveBanner(prev => {
        if (prev) {
          const found = merged.find(b => b.id === prev.id);
          if (found) return found;
        }
        const std = merged.find(b => b.type === 'standard');
        return std || merged[0];
      });
    }
  }, [rawBanners, gachaItems]);

  if (!isGachaOpen) return null;

  const performSinglePull = (currentPity5: number, currentPity4: number): { item: GachaItem, newPity5: number, newPity4: number } => {
    let nextPity5 = currentPity5 + 1;
    let nextPity4 = currentPity4 + 1;
    
    const rand = Math.random();
    
    // Soft pity mechanics simplified
    let rate5 = 0.006;
    if (nextPity5 >= 75) {
      rate5 = 0.006 + (nextPity5 - 74) * 0.06; // Ramps up quickly
    }
    
    let is5Star = rand < rate5 || nextPity5 >= PITY_5_STAR;
    let is4Star = false;
    
    if (!is5Star) {
       is4Star = rand < (rate5 + 0.051) || nextPity4 >= PITY_4_STAR;
    }

    let rarityLevel = 3;
    if (is5Star) {
      rarityLevel = 5;
      nextPity5 = 0;
      nextPity4 = 0; // Reset 4-star pity on 5-star as well
    } else if (is4Star) {
      rarityLevel = 4;
      nextPity4 = 0;
    }

    let pulledItem: GachaItem;

    if (rarityLevel === 5) {
      const bannerWithFeatured = activeBanner as any;
      if (activeBanner.type === 'limited' && bannerWithFeatured.featured5Star) {
        // Tỷ lệ UP RATE là 50%
        if (Math.random() < 0.5) {
          pulledItem = bannerWithFeatured.featured5Star;
        } else {
          // Trượt rate: Lấy từ list 5 sao trong pool hoặc từ Standard pool để "spook"
          let pool = activeBanner.pool5Star || [];
          if (pool.length === 0) {
            const std = banners.find(b => b.type === 'standard');
            pool = std?.pool5Star || [];
          }
          if (pool.length > 0) {
            pulledItem = pool[Math.floor(Math.random() * pool.length)];
          } else {
            pulledItem = bannerWithFeatured.featured5Star;
          }
        }
      } else {
        const pool = activeBanner.pool5Star || [];
        if (pool.length > 0) {
          pulledItem = pool[Math.floor(Math.random() * pool.length)];
        } else {
          pulledItem = { id: 'fallback-5s', name: 'Sticker 5⭐ Hoàng Kim', rarity: 5, type: 'sticker' };
        }
      }
    } else if (rarityLevel === 4) {
      const bannerWithFeatured = activeBanner as any;
      if (activeBanner.type === 'limited' && bannerWithFeatured.featured4Stars && bannerWithFeatured.featured4Stars.length > 0) {
        // Tỷ lệ UP RATE là 50%
        if (Math.random() < 0.5) {
          pulledItem = bannerWithFeatured.featured4Stars[Math.floor(Math.random() * bannerWithFeatured.featured4Stars.length)];
        } else {
          // Trượt rate: Lấy từ list 4 sao trong banner hoặc từ Standard pool để "spook"
          let pool = activeBanner.pool4Star || [];
          if (pool.length === 0) {
            const std = banners.find(b => b.type === 'standard');
            pool = std?.pool4Star || [];
          }
          if (pool.length > 0) {
            pulledItem = pool[Math.floor(Math.random() * pool.length)];
          } else {
            pulledItem = bannerWithFeatured.featured4Stars[Math.floor(Math.random() * bannerWithFeatured.featured4Stars.length)];
          }
        }
      } else {
        const pool = activeBanner.pool4Star || [];
        if (pool.length > 0) {
          pulledItem = pool[Math.floor(Math.random() * pool.length)];
        } else {
          pulledItem = { id: 'fallback-4s', name: 'Sticker 4⭐ Bạc', rarity: 4, type: 'sticker' };
        }
      }
    } else {
      pulledItem = { id: 's3-1', name: '10 Mảnh Choco Gacha', rarity: 3, type: 'fragment' };
    }
    
    return { item: pulledItem, newPity5: nextPity5, newPity4: nextPity4 };
  };

  const executePulls = async (times: number, ticketsToUse?: number) => {
    const currentTickets = ticketsToUse !== undefined ? ticketsToUse : ownedGachaTickets;
    
    if (currentTickets < times) {
       const neededTickets = times - currentTickets;
       const neededGChoco = neededTickets * 2;
       const neededChoco = neededTickets * 6;
       
       if ((goldenChoco || 0) >= neededGChoco) {
         setPendingExchange({
           times,
           neededTickets,
           currency: 'golden',
           cost: neededGChoco
         });
       } else if ((choco || 0) >= neededChoco) {
         setPendingExchange({
           times,
           neededTickets,
           currency: 'choco',
           cost: neededChoco
         });
       } else {
         setPendingExchange({
           times,
           neededTickets,
           currency: 'none',
           cost: 0
         });
       }
       return;
    }
    
    setIsPulling(true);
    
    // Simulate animation delay
    await new Promise(r => setTimeout(r, 1500));
    
    let currentPity5 = gachaPity5Star;
    let currentPity4 = gachaPity4Star;
    const results: GachaItem[] = [];
    const currentOwnedSet = new Set(ownedStickers || []);
    
    for (let i = 0; i < times; i++) {
       const res = performSinglePull(currentPity5, currentPity4);
       
       if (currentPity5 + 1 >= 90 && res.item.rarity === 5) {
          useStore.getState().unlockAchievement('choco_kientri');
       }
       
       const pullResultItem = { ...res.item };
       currentPity5 = res.newPity5;
       currentPity4 = res.newPity4;
       
       // Grant item to user with duplicate check
       if (pullResultItem.type === 'sticker') {
         const stickerUrl = pullResultItem.image || 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=120&auto=format&fit=crop';
         
         if (currentOwnedSet.has(stickerUrl)) {
           // Duplicate sticker: convert to fragments
           const refundAmt = pullResultItem.rarity === 5 ? 200 : 100;
           addGachaFragments(refundAmt);
           (pullResultItem as any).isDuplicate = true;
           (pullResultItem as any).refundFragments = refundAmt;
         } else {
           // New sticker: grant to user & add to local tracking for current batch
           addOwnedSticker(stickerUrl);
           currentOwnedSet.add(stickerUrl);
         }
       } else if (pullResultItem.type === 'fragment') {
         // rough parse of number from name: "10 Mảnh..."
         const amtMatch = pullResultItem.name.match(/\d+/);
         if (amtMatch) {
            addGachaFragments(parseInt(amtMatch[0]));
         } else {
            addGachaFragments(5); // default
         }
       }
       results.push(pullResultItem);
    }
    
    // Save state
    const singlePullCount = useStore.getState().gachaSinglePullCount || 0;
    const updates: any = {
       ownedGachaTickets: currentTickets - times,
       gachaPity5Star: currentPity5,
       gachaPity4Star: currentPity4
    };
    
    if (times === 1) {
       updates.gachaSinglePullCount = singlePullCount + 1;
       if (singlePullCount === 0 && results[0].rarity === 5) {
           useStore.getState().unlockAchievement('gacha_first_pull_5star');
       }
    } else if (times === 10) {
       const highRarityCount = results.filter(i => i.rarity >= 4).length;
       if (highRarityCount >= 2) {
           useStore.getState().unlockAchievement('gacha_double_4star');
       }
    }

    // Banner completion check
    const allStickersInBanner = [
       ...(activeBanner.pool5Star || []), 
       ...(activeBanner.pool4Star || []), 
       ...(activeBanner.pool3Star || [])
    ];
    
    // Some banners might have a featured5Star property if they are limited
    if ((activeBanner as any).featured5Star) {
       allStickersInBanner.push((activeBanner as any).featured5Star);
    }
    
    const bannerStickers = allStickersInBanner.filter(i => i.type === 'sticker' && i.image).map(i => i.image as string);
    const bannerStickersSet = new Set(bannerStickers);
    if (bannerStickersSet.size > 0) {
       let ownedInBanner = 0;
       currentOwnedSet.forEach(url => {
          if (bannerStickersSet.has(url)) ownedInBanner++;
       });
       const pct = (ownedInBanner / bannerStickersSet.size) * 100;
       const maxPct = Math.max(useStore.getState().maxBannerCompletionPct || 0, pct);
       updates.maxBannerCompletionPct = maxPct;
    }

    await updateUserDoc(updates);
    useStore.getState()._triggerCountAchievementsCheck();
    
    // update local history
    const newHistoryItems = results.map(item => ({
      name: (item as any).isDuplicate 
        ? `${item.name} (Trùng +${(item as any).refundFragments} Mảnh Choco Gacha)`
        : item.name,
      rarity: item.rarity,
      time: new Date().toLocaleString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      bannerName: activeBanner.name
    }));
    
    setHistoryList(prev => {
      const updated = [...newHistoryItems, ...prev].slice(0, 200);
      localStorage.setItem(`gacha_pull_history_${firebaseUser?.uid || 'guest'}`, JSON.stringify(updated));
      return updated;
    });

    setIsPulling(false);
    const highestRarity = Math.max(...results.map(item => item.rarity));
    setOpeningAnimation({
      active: true,
      highestRarity,
      items: results,
      currentIndex: 0,
      isOpened: false
    });
  };

  const pullOnce = () => executePulls(1);
  const pullTen = () => executePulls(10);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setGachaOpen(false)} />
      
      {/* Banner UI */}
      <div className="relative w-full max-w-5xl h-[90vh] md:h-[80vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">

        {/* Banner Area */}
        <div className={cn(
          "relative w-full h-[68vh] md:h-[65vh] rounded-3xl overflow-y-auto md:overflow-hidden shadow-2xl border-[4px] flex flex-col md:flex-row transition-all duration-300",
          isDark 
            ? "border-[#FFFDF9]/20 bg-[#1A1412] text-white" 
            : "border-[#3E2723]/15 bg-[#FFFDF9] text-[#3E2723]"
        )}>
          
          {/* Header Controls (Absolute positioned inside the bordered Banner Area) */}
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3.5 sm:p-4 md:p-6 pointer-events-none">
            {/* Header Currency */}
            <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-3 max-w-[70%] sm:max-w-[75%] md:max-w-none md:ml-auto md:mr-4 pointer-events-auto">
              <div className={cn(
                "flex items-center gap-1 sm:gap-2 backdrop-blur px-2.5 sm:px-3.5 py-1.5 rounded-full border shadow-md",
                isDark 
                  ? "bg-black/50 border-white/10 text-white" 
                  : "bg-white/90 border-[#3E2723]/10 text-[#3E2723]"
              )}>
                <span className="font-bold text-[10px] sm:text-xs">
                  {(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : choco}
                </span>
                <span className={cn("text-[8px] sm:text-[10px]", isDark ? "text-[#E6D8C9]" : "text-[#8D6E63]")}>Choco</span>
              </div>
              <div className={cn(
                "flex items-center gap-1 sm:gap-2 backdrop-blur px-2.5 sm:px-3.5 py-1.5 rounded-full border shadow-md",
                isDark 
                  ? "bg-[#3E2723]/70 border-white/10 text-white" 
                  : "bg-[#FFF9C4]/90 border-[#3E2723]/15 text-[#5D4037]"
              )}>
                <span className="font-bold text-[10px] sm:text-xs">
                  {(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : (goldenChoco || 0)}
                </span>
                <span className={cn("text-[8px] sm:text-[10px] font-bold text-amber-500", isDark ? "text-amber-400" : "text-amber-700")}>Gchoco</span>
              </div>
              <div className={cn(
                "flex items-center gap-1 sm:gap-2 backdrop-blur px-2.5 sm:px-3.5 py-1.5 rounded-full border shadow-md lg:shadow-[0_0_15px_rgba(236,72,153,0.15)]",
                isDark 
                  ? "bg-pink-500/20 border-pink-500/30 text-white" 
                  : "bg-pink-500/10 border-pink-500/20 text-[#C2185B]"
              )}>
                <Sparkles className="w-3 h-3 text-pink-500 animate-pulse" />
                <span className="font-bold text-[10px] sm:text-xs tracking-wide">{ownedGachaTickets || 0}</span>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setGachaOpen(false)}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] rounded-xl flex items-center justify-center hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] transition-all hover:scale-110 active:translate-y-0.5 active:shadow-none pointer-events-auto cursor-pointer"
            >
              <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#3E2723] dark:text-[#ECE5DC]" />
            </button>
          </div>
          
          {/* Background Grid of Stickers */}
          <div className={cn(
            "absolute inset-0 z-0 overflow-hidden p-6 flex flex-wrap gap-3 sm:gap-4 items-center justify-start content-center select-none pointer-events-none transition-all duration-300",
            isDark ? "opacity-15 md:opacity-25" : "opacity-25 md:opacity-35"
          )}>
            {[
              ...(activeBanner.pool5Star || []).filter((item: any) => item.type === 'sticker' || item.image),
              ...(activeBanner.pool4Star || []).filter((item: any) => item.type === 'sticker' || item.image)
            ].map((item, idx) => (
              <div 
                key={item.id || idx} 
                className={cn(
                  "w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center relative p-1 border-2 transition-all shadow-md shrink-0",
                  isDark
                    ? (item.rarity === 5 
                        ? "border-amber-400 bg-[#2C211E] shadow-[0_0_12px_rgba(245,158,11,0.3)]" 
                        : "border-purple-400 bg-[#251A24] shadow-[0_0_12px_rgba(168,85,247,0.3)]")
                    : (item.rarity === 5 
                        ? "border-amber-400 bg-[#FFFBEB] shadow-[0_4px_10px_rgba(245,158,11,0.15)]" 
                        : "border-purple-300 bg-[#FAF5FF] shadow-[0_4px_10px_rgba(168,85,247,0.12)]")
                )}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                ) : (
                  <span className="text-sm sm:text-xl">🏷️</span>
                )}
              </div>
            ))}
          </div>

          {/* Banner Info Content */}
          <div className="relative z-10 pt-16 sm:pt-20 md:pt-16 px-5 md:px-8 pb-4 flex-grow flex flex-col justify-between text-shadow-sm select-text text-center md:text-left">
            <h1 className={cn(
              "text-xl sm:text-3xl md:text-5xl font-black font-sans uppercase tracking-tight transition-all duration-300 mt-2 md:mt-0",
              isDark 
                ? "text-[#FFFDF9] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" 
                : "text-[#3E2723] drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            )}>
              {activeBanner.name}
            </h1>
            
            <div className="flex gap-2.5 mt-4 md:mt-auto justify-center md:justify-start">
               <button 
                 onClick={() => setHistoryOpen(true)}
                 className={cn(
                   "flex items-center gap-1.5 px-3.5 py-2 rounded-xl backdrop-blur transition-all text-xs font-black uppercase tracking-wider border-2 hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-sm hover:shadow-md",
                   isDark 
                     ? "bg-black/40 hover:bg-[#FFFDF9] text-stone-200 hover:text-[#3E2723] border-white/20 hover:border-[#FFFDF9]" 
                     : "bg-[#FFFDF9]/80 hover:bg-[#3E2723] text-[#3E2723] hover:text-white border-[#3E2723]/25"
                 )}
               >
                 <History className="w-3.5 h-3.5" /> Lịch sử
               </button>
               <button 
                 onClick={() => setDetailsOpen(true)}
                 className={cn(
                   "flex items-center gap-1.5 px-3.5 py-2 rounded-xl backdrop-blur transition-all text-xs font-black uppercase tracking-wider border-2 hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-sm hover:shadow-md",
                   isDark 
                     ? "bg-black/40 hover:bg-[#FFFDF9] text-stone-200 hover:text-[#3E2723] border-white/20 hover:border-[#FFFDF9]" 
                     : "bg-[#FFFDF9]/80 hover:bg-[#3E2723] text-[#3E2723] hover:text-white border-[#3E2723]/25"
                 )}
               >
                 <Info className="w-3.5 h-3.5" /> Chi tiết
               </button>
            </div>
          </div>

          {/* Actions Column */}
          <div className="relative z-10 p-5 sm:p-6 md:p-8 flex flex-col justify-end w-full md:w-96 gap-3 sm:gap-4">
              <div className={cn(
                 "backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border transition-all duration-300",
                 isDark 
                   ? "bg-black/55 border-white/10 text-white" 
                   : "bg-white/80 border-[#3E2723]/15 text-[#3E2723]"
              )}>
                 <p className={cn("text-[10px] sm:text-xs uppercase tracking-wider font-extrabold mb-1", isDark ? "text-[#D7CCC8]" : "text-[#8D6E63]")}>Tiến trình bảo hiểm</p>
                 <div className="flex justify-between text-xs sm:text-sm font-bold">
                   <span>5 Sao: <span className="text-amber-500">{gachaPity5Star}/{PITY_5_STAR}</span></span>
                 </div>
                 <div className={cn("w-full h-1.5 sm:h-2 rounded-full mt-1.5 sm:mt-2 overflow-hidden", isDark ? "bg-white/15" : "bg-[#3E2723]/10")}>
                    <div 
                      className="bg-gradient-to-r from-amber-300 to-amber-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min((gachaPity5Star / PITY_5_STAR) * 100, 100)}%` }} 
                     />
                  </div>
              </div>

              <div className="flex gap-2 sm:gap-3 mt-1 sm:mt-2">
                <button 
                  onClick={pullOnce}
                  disabled={isPulling}
                  className={cn(
                    "flex-1 rounded-2xl py-3 sm:py-4 flex flex-col items-center justify-center font-bold tracking-wide active:scale-[0.97] hover:scale-[1.03] transition-all duration-200 disabled:opacity-50 cursor-pointer border-2",
                    isDark 
                      ? "bg-[#251C1A] hover:bg-[#322320] text-[#E6D4BF] border-white/10 hover:border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(230,212,191,0.1)]" 
                      : "bg-[#FFF9E6] hover:bg-[#FDF1D5] text-[#3E2723] border-[#E8C07D] hover:border-[#dfab52] shadow-[0_4px_12px_rgba(232,192,125,0.15)] hover:shadow-[0_0_18px_rgba(232,192,125,0.5)]"
                  )}
                >
                  <span className={cn("text-xs sm:text-sm font-black uppercase tracking-wider", isDark ? "text-[#E6D4BF]" : "text-[#3E2723]")}>Gacha 1 Lần</span>
                  <div className={cn("flex items-center gap-1 mt-0.5 text-[10px] sm:text-xs font-bold", isDark ? "text-stone-400" : "text-[#5D4037]")}>
                     <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                     <span>x1</span>
                  </div>
                </button>
                <button 
                  onClick={pullTen}
                  disabled={isPulling}
                  className={cn(
                    "flex-1 rounded-2xl py-3 sm:py-4 flex flex-col items-center justify-center font-bold tracking-wide active:scale-[0.97] hover:scale-[1.03] transition-all duration-200 disabled:opacity-50 border-2 cursor-pointer",
                    isDark 
                      ? "bg-gradient-to-b from-[#3E2E1D] to-[#25180F] hover:from-[#4E3C29] hover:to-[#322217] text-[#FFD54F] border-[#FFD54F]/30 hover:border-[#FFD54F]/50 shadow-[0_0_15px_rgba(255,193,7,0.15)] hover:shadow-[0_0_20px_rgba(255,193,7,0.3)]" 
                      : "bg-gradient-to-b from-[#FFF9C4] to-[#FFD54F] hover:from-[#FFF176] hover:to-[#FFD54F] text-[#3E2723] border-amber-400 hover:border-[#FFB300] shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  )}
                >
                  <span className={cn("text-xs sm:text-sm font-black uppercase tracking-wider", isDark ? "text-[#FFD54F]" : "text-[#3E2723]")}>Gacha 10 Lần</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-xs font-bold">
                     <Sparkles className={cn("w-3.5 h-3.5 animate-pulse", isDark ? "text-amber-400" : "text-pink-600")} />
                     <span className={isDark ? "text-amber-300" : "text-[#5D4037]"}>x10</span>
                  </div>
                </button>
              </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-6 flex justify-center gap-2 overflow-x-auto max-w-full px-4 scrollbar-none py-1">
          {banners.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBanner(b)}
              className={cn(
                "px-6 py-2.5 rounded-full font-extrabold text-[#3E2723] text-xs uppercase tracking-wider shadow-md whitespace-nowrap transition-all duration-300 cursor-pointer border",
                activeBanner.id === b.id 
                  ? (isDark 
                      ? "bg-[#FFFDF9] text-[#3E2723] border-transparent scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                      : "bg-[#3E2723] text-white border-transparent scale-105")
                  : (isDark 
                      ? "bg-black/40 text-stone-300 border-white/5 hover:bg-black/60 hover:text-white" 
                      : "bg-white/80 text-[#5D4037] border-[#3E2723]/10 hover:bg-[#FDF9F3] hover:text-[#3E2723]")
              )}
            >
              {b.name}
            </button>
          ))}
          {banners.length === 0 && (
            <button className={cn(
              "px-6 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider shadow-md whitespace-nowrap border",
              isDark 
                ? "bg-[#FFFDF9] text-[#3E2723] border-transparent" 
                : "bg-[#3E2723] text-white border-transparent"
            )}>
              {activeBanner.name}
            </button>
          )}
        </div>
      </div>
      
      {/* Pull Animation/Result Overlay Area - to be implemented in details */}
      {openingAnimation && (
        <div 
          onClick={() => {
            if (openingAnimation.isOpened) {
              if (openingAnimation.currentIndex < openingAnimation.items.length - 1) {
                setOpeningAnimation(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
              } else {
                setShowResults(openingAnimation.items);
                setOpeningAnimation(null);
              }
            }
          }}
          className="absolute inset-0 z-50 bg-[#0C0604] flex flex-col items-center justify-between p-4 py-8 select-none overflow-hidden animate-in fade-in duration-500 cursor-pointer"
        >
          
          {/* Animated Stars Background */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-10 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
            <div className="absolute top-1/3 right-1/4 w-3.5 h-3.5 bg-purple-400 rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />
            <div className="absolute bottom-10 right-10 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
          </div>

          {/* Top Info Bar */}
          <div className="w-full max-w-md px-4 flex justify-between items-center relative z-20">
            <div className="text-stone-400 text-xs font-mono">
              {openingAnimation.isOpened && (
                <span>VẬT PHẨM {openingAnimation.currentIndex + 1} / {openingAnimation.items.length}</span>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowResults(openingAnimation.items);
                setOpeningAnimation(null);
              }}
              className="text-stone-500 hover:text-stone-300 text-xs px-2.5 py-1 rounded bg-stone-900/40 border border-white/5 transition-colors"
            >
              Bỏ Qua Tất Cả
            </button>
          </div>

          <div className="text-center my-2 max-w-md px-4 relative z-20">
            <motion.h2 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-2xl sm:text-3xl font-black tracking-widest text-[#FFFDF9] italic uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            >
              {openingAnimation.isOpened ? "CHÚC MỪNG!" : "HỘP QUÀ GACHA"}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-xs sm:text-sm text-amber-200 mt-2 font-medium tracking-wide drop-shadow-sm uppercase"
            >
              {openingAnimation.isOpened ? "Nhấn vào bất kỳ đâu trên màn hình để tiếp tục" : "Nhấp vào hộp quà để khui báu vật!"}
            </motion.p>
          </div>

          {/* Core Animation Stage */}
          <div className="relative w-full max-w-md h-[300px] sm:h-[360px] flex items-center justify-center">
            
            {/* Glowing Aura depending on CURRENT item rarity */}
            <AnimatePresence mode="wait">
              {openingAnimation.isOpened && (
                <motion.div 
                  key={openingAnimation.currentIndex}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.3, 1.15], opacity: [0.8, 1, 0.9] }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    "absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full filter blur-[45px] pointer-events-none mix-blend-screen z-0 animate-pulse",
                    openingAnimation.items[openingAnimation.currentIndex]?.rarity === 5 
                      ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_120px_rgba(234,179,8,1)]" 
                      : (openingAnimation.items[openingAnimation.currentIndex]?.rarity === 4 
                          ? "bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 shadow-[0_0_120px_rgba(168,85,247,1)]" 
                          : "bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-600 shadow-[0_0_120px_rgba(6,182,212,1)]")
                  )}
                />
              )}
            </AnimatePresence>

            {/* Rotating Starburst Rays behind opened item */}
            {openingAnimation.isOpened && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
                <div className={cn(
                  "w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,rgba(0,0,0,0)_60%)] animate-spin",
                  openingAnimation.items[openingAnimation.currentIndex]?.rarity === 5 
                    ? "text-amber-500" 
                    : (openingAnimation.items[openingAnimation.currentIndex]?.rarity === 4 ? "text-purple-500" : "text-cyan-500")
                )} style={{ animationDuration: '18s' }}>
                  <svg className="w-full h-full opacity-35" viewBox="0 0 100 100">
                    <path d="M50,50 L50,0 A50,50 0 0,1 60,3 L50,50 Z" fill="currentColor"/>
                    <path d="M50,50 L50,100 A50,50 0 0,1 40,97 L50,50 Z" fill="currentColor"/>
                    <path d="M50,50 L0,50 A50,50 0 0,1 3,40 L50,50 Z" fill="currentColor"/>
                    <path d="M50,50 L100,50 A50,50 0 0,1 97,60 L50,50 Z" fill="currentColor"/>
                    <path d="M50,50 L15,15 A50,50 0 0,1 25,10 L50,50 Z" fill="currentColor"/>
                    <path d="M50,50 L85,85 A50,50 0 0,1 75,90 L50,50 Z" fill="currentColor"/>
                    <path d="M50,50 L15,85 A50,50 0 0,1 10,75 L50,50 Z" fill="currentColor"/>
                    <path d="M50,50 L85,15 A50,50 0 0,1 90,25 L50,50 Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            )}

            {/* Floating Opened Premium Item */}
            <AnimatePresence mode="wait">
              {openingAnimation.isOpened && (
                <motion.div 
                  key={openingAnimation.currentIndex}
                  initial={{ scale: 0.6, y: 50, opacity: 0, rotate: -5 }}
                  animate={{ scale: 1.1, y: -20, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.6, y: -50, opacity: 0, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  className="absolute z-30 flex flex-col items-center justify-center pointer-events-none"
                >
                  {/* Rarity Star badge */}
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: openingAnimation.items[openingAnimation.currentIndex]?.rarity || 3 }).map((_, i) => (
                      <Star key={i} className={cn(
                        "w-6 h-6 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-bounce",
                        openingAnimation.items[openingAnimation.currentIndex]?.rarity === 5 
                          ? "text-yellow-300" 
                          : (openingAnimation.items[openingAnimation.currentIndex]?.rarity === 4 
                              ? "text-fuchsia-300" 
                              : "text-cyan-300")
                      )} style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>

                  {/* High Quality Render of Current Item */}
                  {(() => {
                    const currentItem = openingAnimation.items[openingAnimation.currentIndex];
                    if (!currentItem) return null;
                    return (
                      <div className={cn(
                        "w-40 h-40 sm:w-44 sm:h-44 rounded-3xl flex items-center justify-center shadow-2xl relative border-[4px] p-4 bg-gradient-to-tr",
                        currentItem.rarity === 5 
                          ? "from-amber-200 to-yellow-500 border-yellow-300" 
                          : (currentItem.rarity === 4 
                              ? "from-purple-300 to-fuchsia-600 border-fuchsia-400" 
                              : "from-blue-200 to-cyan-500 border-cyan-300")
                      )}>
                        
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-pulse rounded-2xl" />

                        {currentItem.image ? (
                          <img src={currentItem.image} alt={currentItem.name} referrerPolicy="no-referrer" className="w-full h-full object-contain filter drop-shadow-lg scale-105" />
                        ) : (
                          <span className="text-6xl">{currentItem.type === 'sticker' ? '🏷️' : '🧩'}</span>
                        )}

                        {/* Custom duplicate banner inside card */}
                        {(currentItem as any).isDuplicate && (
                          <div className="absolute -top-3 -right-3 bg-rose-600 text-stone-100 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg border border-rose-400 z-40 animate-pulse tracking-tight">
                            +{(currentItem as any).refundFragments} MẢNH
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Name of Best Item */}
                  {(() => {
                    const currentItem = openingAnimation.items[openingAnimation.currentIndex];
                    if (!currentItem) return null;
                    return (
                      <div className="flex flex-col items-center gap-2 mt-4 text-center">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10"
                        >
                          <span className={cn(
                            "text-sm sm:text-base font-black uppercase tracking-widest drop-shadow-md",
                            currentItem.rarity === 5 
                              ? "text-yellow-300" 
                              : (currentItem.rarity === 4 
                                  ? "text-fuchsia-300" 
                                  : "text-cyan-300")
                          )}>
                            {currentItem.name}
                          </span>
                        </motion.div>

                        {(currentItem as any).isDuplicate && (
                          <motion.p 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[11px] sm:text-xs text-rose-300 font-bold bg-rose-950/40 border border-rose-500/20 px-3 py-1 rounded-full backdrop-blur-sm"
                          >
                            Đã sở hữu! Tự động quy đổi thành +{(currentItem as any).refundFragments} Mảnh
                          </motion.p>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tap/Click Area Container */}
            <div 
              onClick={(e) => {
                if (!openingAnimation.isOpened) {
                  e.stopPropagation();
                  setOpeningAnimation(prev => prev ? { ...prev, isOpened: true } : null);
                }
              }}
              className="relative select-none z-10 w-full h-full flex items-center justify-center cursor-pointer"
            >
              <AnimatePresence>
                {!openingAnimation.isOpened && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0, y: 100 }}
                    transition={{ type: "spring", stiffness: 120, damping: 12 }}
                    className="flex flex-col items-center"
                  >
                    
                    {/* Glowing Aura of the unopened gift box according to highestRarity */}
                    <div className={cn(
                      "absolute w-56 h-56 rounded-full blur-[40px] animate-pulse opacity-60",
                      openingAnimation.highestRarity === 5 
                        ? "bg-amber-500 shadow-[0_0_80px_rgba(234,179,8,0.5)]" 
                        : (openingAnimation.highestRarity === 4 
                            ? "bg-purple-500 shadow-[0_0_80px_rgba(168,85,247,0.5)]" 
                            : "bg-teal-500 shadow-[0_0_80px_rgba(6,182,212,0.5)]")
                    )} />

                    {/* Interactive Gift Box container */}
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center">
                      
                      {/* Left Ribbon Bow Wing */}
                      <motion.div 
                        animate={{ 
                          rotate: [-15, -12, -15],
                          scale: [1, 1.03, 1]
                        }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute z-25 top-[52px] left-[45px] w-14 h-8 bg-gradient-to-tr from-amber-200 via-amber-300 to-amber-500 rounded-full border-2 border-amber-600/30 shadow-md origin-right"
                      />
                      {/* Right Ribbon Bow Wing */}
                      <motion.div 
                        animate={{ 
                          rotate: [15, 12, 15],
                          scale: [1, 1.03, 1]
                        }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.1 }}
                        className="absolute z-25 top-[52px] right-[45px] w-14 h-8 bg-gradient-to-tl from-amber-200 via-amber-300 to-amber-500 rounded-full border-2 border-amber-600/30 shadow-md origin-left"
                      />

                      {/* Box Lid - Vintage Chocolate Craft Paper Style */}
                      <motion.div 
                        animate={{ 
                          y: [0, -5, 0],
                          rotate: [0, -1, 1, 0]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2, 
                          ease: "easeInOut" 
                        }}
                        whileHover={{ scale: 1.04 }}
                        className="w-[160px] h-[44px] sm:w-[180px] sm:h-[48px] bg-gradient-to-r from-[#4E342E] via-[#5D4037] to-[#4E342E] rounded-xl border-[3px] border-[#3E2723] shadow-2xl relative z-20 flex items-center justify-center overflow-hidden"
                      >
                        {/* Golden Decorative Inner Border line */}
                        <div className="absolute inset-1.5 rounded-lg border border-amber-400/40 pointer-events-none" />
                        
                        {/* Vertical Satin Ribbon running through lid */}
                        <div className="w-8 h-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 absolute left-1/2 -translate-x-1/2 border-x border-amber-500/20 shadow-sm" />

                        {/* Luxury Chocolate Wax Seal stamp */}
                        <div className="w-11 h-11 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 absolute rounded-full border-2 border-stone-800 shadow-[0_3px_8px_rgba(0,0,0,0.4)] flex items-center justify-center z-30">
                          <div className="w-8 h-8 rounded-full border border-amber-200/50 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#3E2723] animate-pulse" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Box Body - Gourmet Box base with ribbon wrappers */}
                      <motion.div 
                        animate={{ 
                          scaleY: [1, 0.98, 1.02, 1],
                          y: [0, 3, -1, 0]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2, 
                          ease: "easeInOut",
                          delay: 0.1
                        }}
                        className="w-[140px] h-[110px] sm:w-[160px] sm:h-[125px] bg-gradient-to-b from-[#3E2723] via-[#2D1A17] to-[#1E0F0D] rounded-b-2xl border-[4px] border-[#3E2723] shadow-[0_20px_35px_rgba(0,0,0,0.7)] relative z-10 overflow-hidden mt-[-4px]"
                      >
                        {/* Premium Golden Vintage Stripe Pattern inside Box Body */}
                        <div className="absolute inset-x-2 top-2 bottom-2 rounded-lg border border-white/[0.04] pointer-events-none" />
                        
                        {/* Vertical Ribbon */}
                        <div className="w-8 h-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 absolute left-1/2 -translate-x-1/2 border-x border-amber-500/20 shadow-inner" />
                        
                        {/* Horizontal Gourmet Seal Wrap */}
                        <div className="h-8 w-full bg-gradient-to-b from-amber-200/90 via-amber-300 to-amber-400 absolute top-1/3 -translate-y-1/2 left-0 border-y border-amber-500/20 shadow-inner flex items-center px-2 justify-between">
                          <span className="text-[7px] text-[#3E2723] font-black tracking-widest opacity-40">CHOCO</span>
                          <span className="text-[7px] text-[#3E2723] font-black tracking-widest opacity-40">CAFE</span>
                        </div>

                        {/* Glossy Reflection Highlight */}
                        <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                      </motion.div>

                    </div>

                    <div className="flex flex-col items-center gap-1.5 mt-6">
                      {/* Box items count */}
                      <span className="text-stone-400 text-xs font-mono tracking-tight uppercase">
                        Hộp quà chứa {openingAnimation.items.length} phần quà
                      </span>
                      {/* Quick Pulsing text */}
                      <span className="text-yellow-400 font-extrabold text-[11px] sm:text-xs tracking-widest uppercase animate-pulse border-2 border-yellow-400/20 px-4 py-1.5 rounded-full bg-yellow-400/5 backdrop-blur shadow-[0_0_12px_rgba(234,179,8,0.1)]">
                        Chạm Để Khui
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Control Bar / Navigation */}
          <div className="w-full max-w-sm px-4 text-center relative z-20">
            {openingAnimation.isOpened ? (
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (openingAnimation.currentIndex < openingAnimation.items.length - 1) {
                      setOpeningAnimation(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
                    } else {
                      setShowResults(openingAnimation.items);
                      setOpeningAnimation(null);
                    }
                  }}
                  className={cn(
                    "w-full py-4.5 font-extrabold rounded-full uppercase tracking-widest text-xs sm:text-sm cursor-pointer shadow-2xl active:scale-95 transition-transform duration-150 border-[2.5px] text-[#3E2723] bg-gradient-to-r select-none animate-pulse",
                    openingAnimation.items[openingAnimation.currentIndex]?.rarity === 5 
                      ? "from-amber-300 via-yellow-400 to-amber-500 border-amber-200 shadow-[0_0_30px_rgba(234,179,8,0.3)]" 
                      : (openingAnimation.items[openingAnimation.currentIndex]?.rarity === 4 
                          ? "from-fuchsia-300 via-purple-400 to-indigo-400 border-fuchsia-200 shadow-[0_0_30px_rgba(168,85,247,0.3)]" 
                          : "from-cyan-300 via-teal-400 to-blue-400 border-cyan-200 shadow-[0_0_30px_rgba(6,182,212,0.3)]")
                  )}
                >
                  {openingAnimation.currentIndex === openingAnimation.items.length - 1 
                    ? "HOÀN THÀNH & XEM TẤT CẢ" 
                    : "XEM VẬT PHẨM TIẾP THEO"}
                </button>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest">
                  (Hoặc nhấn vào bất kỳ vùng trống nào trên màn hình)
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showResults && (
        <div className={cn(
          "absolute inset-0 z-50 flex flex-col items-center justify-center animate-in fade-in duration-500 p-4 transition-all duration-300",
          isDark ? "bg-[#1A1412]" : "bg-[#FFFDF9]"
        )}>
            <h2 className={cn(
              "text-3xl font-black italic tracking-widest mb-12 transition-all duration-300",
              isDark ? "text-white" : "text-[#3E2723]"
            )}>KẾT QUẢ</h2>
            
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-5xl">
              {showResults.map((item, idx) => (
                <div key={idx} className={cn(
                  "relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-2xl transition-all duration-300 border-[3px]",
                  item.rarity === 5 
                    ? "bg-gradient-to-br from-amber-100 to-amber-500 border-amber-300 text-[#3E2723]" 
                    : (item.rarity === 4 
                        ? "bg-gradient-to-br from-purple-200 to-purple-500 border-purple-300 text-white" 
                        : (isDark 
                             ? "bg-gradient-to-br from-[#2D221D] to-stone-800 border-stone-800 text-white" 
                             : "bg-gradient-to-br from-stone-100 to-stone-200 border-stone-200 text-[#3E2723]"))
                )} style={{ animationDelay: `${idx * 100}ms` }}>
                  
                  {/* Duplicate Badge */}
                  {(item as any).isDuplicate && (
                    <div className="absolute -top-2.5 -right-1.5 bg-rose-600 text-stone-100 text-[8px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg border border-rose-400 z-10 animate-bounce tracking-tight">
                      +{(item as any).refundFragments} Mảnh
                    </div>
                  )}
                  
                  {/* Item Icon */}
                  <div className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 backdrop-blur rounded-xl flex items-center justify-center shadow-inner overflow-hidden mb-2 relative",
                    isDark ? "bg-black/20" : "bg-white/50"
                  )}>
                     {item.image ? (
                       <img src={item.image} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1 filter drop-shadow-md" />
                     ) : (
                       <span className="text-3xl">{item.type === 'sticker' ? '🏷️' : '🧩'}</span>
                     )}
                  </div>
                  
                  {/* Stars */}
                  <div className="flex justify-center -mt-4 mb-1">
                     {Array.from({length: item.rarity}).map((_, i) => (
                       <Star key={i} className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 drop-shadow-md" />
                     ))}
                  </div>

                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-extrabold text-center leading-tight px-1 drop-shadow-sm line-clamp-2 uppercase tracking-wide",
                    item.rarity === 5 
                      ? "text-[#3E2723]"
                      : (item.rarity === 4 
                          ? "text-white"
                          : (isDark ? "text-stone-300" : "text-[#3E2723]"))
                  )}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowResults(null)}
              className={cn(
                "mt-16 px-12 py-3.5 font-extrabold rounded-full transition-all uppercase tracking-widest cursor-pointer shadow-lg hover:scale-105 active:scale-95 text-xs sm:text-sm border-2 shadow-[4px_4px_0px_#1A1412]",
                isDark 
                  ? "bg-[#3C2E27] hover:bg-[#5D4037] border-[#5D4037] text-[#ECE5DC] dark:bg-[#3C2E27] dark:text-[#ECE5DC] dark:border-[#5D4037] dark:hover:bg-[#5D4037]" 
                  : "bg-[#3E2723] hover:bg-[#5D4037] border-[#3E2723] text-[#FFFDF9]"
              )}
            >
              Xác Nhận
            </button>
        </div>
      )}

      {pendingExchange && (
        <div className="absolute inset-0 z-55 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 rounded-3xl animate-in fade-in duration-200">
          <div className={cn(
            "w-full max-w-sm rounded-2xl p-6 shadow-2xl border transition-all duration-300 transform scale-100",
            isDark 
              ? "bg-[#251C1A] text-white border-white/10" 
              : "bg-white text-[#3E2723] border-[#3E2723]/10"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
              <h3 className="font-black text-sm sm:text-base uppercase tracking-wide">
                Xác Nhận Đổi Vé
              </h3>
            </div>
            
            <p className={cn("text-xs leading-relaxed mb-5", isDark ? "text-stone-300" : "text-[#5D4037]")}>
              Bạn đang thiếu <strong className="text-pink-500 font-extrabold">{pendingExchange.neededTickets} Vé Gacha</strong> để thực hiện quay {pendingExchange.times} lần. 
              {pendingExchange.currency !== 'none' ? (
                <>
                  {" "}Hệ thống đề xuất quy đổi bằng{' '}
                  <strong className={pendingExchange.currency === 'golden' ? "text-amber-500 font-extrabold" : "text-[#795548] font-extrabold"}>
                    {pendingExchange.cost} {pendingExchange.currency === 'golden' ? 'Gchoco' : 'Choco'}
                  </strong>{' '}
                  để tiếp tục.
                </>
              ) : (
                <>
                  {" "}Rất tiếc, bạn không đủ Gchoco hoặc Choco để quy đổi thêm vé. Vui lòng kiếm thêm ở Chucu Game hoặc Radio nhé!
                </>
              )}
            </p>

            <div className={cn("flex gap-3 text-xs font-black uppercase text-stone-500 mb-5 p-3 rounded-xl border border-dashed", isDark ? "bg-[#1A1412]/50 border-white/10" : "bg-[#FDF9F3] border-[#3E2723]/10")}>
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-stone-400 font-normal">Số dư hiện tại:</span>
                <span className={cn("text-xs font-black", pendingExchange.currency === 'golden' ? "text-amber-500" : isDark ? "text-stone-300" : "text-[#3E2723]")}>
                  {goldenChoco || 0} Gchoco
                </span>
                <span className={cn("text-[10px] text-stone-400 font-normal")}>
                  {choco || 0} Choco
                </span>
              </div>
              <div className="w-px h-8 bg-stone-300 dark:bg-stone-700 self-center" />
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-stone-400 font-normal">Chi phí đổi:</span>
                {pendingExchange.currency !== 'none' ? (
                  <span className="text-xs font-black text-red-500">
                    -{pendingExchange.cost} {pendingExchange.currency === 'golden' ? 'Gchoco' : 'Choco'}
                  </span>
                ) : (
                  <span className="text-xs font-black text-rose-500">Không đủ số dư</span>
                )}
                <span className="text-[10px] text-green-500 font-extrabold">
                  +{pendingExchange.neededTickets} Vé Gacha
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPendingExchange(null)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-bold transition-all uppercase tracking-wider text-xs cursor-pointer",
                  isDark 
                    ? "bg-[#1A1412] hover:bg-[#32231F] text-stone-300 border border-white/5" 
                    : "bg-stone-100 hover:bg-stone-200 text-[#3E2723]"
                )}
              >
                Hủy
              </button>
              {pendingExchange.currency !== 'none' && (
                <button
                  onClick={async () => {
                    const { times, neededTickets, currency, cost } = pendingExchange;
                    setPendingExchange(null);
                    
                    let success = false;
                    if (currency === 'golden') {
                      success = spendGoldenChoco(cost, `Quy đổi ${neededTickets} Vé Gacha`);
                    } else if (currency === 'choco') {
                      success = spendChoco(cost, `Quy đổi ${neededTickets} Vé Gacha`);
                    }
                    
                    if (success) {
                      const newTicketBalance = (ownedGachaTickets || 0) + neededTickets;
                      await updateUserDoc({
                        ownedGachaTickets: newTicketBalance
                      });
                      executePulls(times, newTicketBalance);
                    }
                  }}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl font-black transition-all uppercase tracking-wider text-xs cursor-pointer text-center",
                    pendingExchange.currency === 'golden' 
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-md hover:brightness-110"
                      : "bg-[#795548] text-white border border-[#5d4037] shadow-md hover:brightness-110"
                  )}
                >
                  Xác Nhận Đổi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Popup Modal */}
      {historyOpen && (
        <div className="absolute inset-0 z-55 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 rounded-3xl animate-in fade-in duration-200">
          <div className={cn(
            "w-full max-w-lg h-[65vh] sm:h-[60vh] rounded-2xl p-6 shadow-2xl border flex flex-col justify-between transition-all duration-300 scale-100 relative",
            isDark 
              ? "bg-[#1E1715] text-white border-white/10" 
              : "bg-[#FDF6EC] text-[#3E2723] border-[#3E2723]/10"
          )}>
            <button 
              onClick={() => setHistoryOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] rounded-lg flex items-center justify-center hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] transition-all active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <X className="w-4 h-4 text-[#3E2723] dark:text-[#ECE5DC]" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b pb-2 border-stone-300 dark:border-stone-700">
              <History className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide">
                Lịch sử vật phẩm đã quay
              </h3>
            </div>

            <div className="flex-grow overflow-y-auto pr-1">
              {historyList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <span className="text-4xl mb-2">📜</span>
                  <p className={cn("text-xs font-semibold", isDark ? "text-stone-400" : "text-stone-500")}>
                    Bạn chưa có lịch sử quay Gacha. Hãy thử vận may nhé!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {historyList.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-[11px] sm:text-xs text-left",
                        item.rarity === 5 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" 
                          : item.rarity === 4 
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                            : isDark ? "bg-black/20 border-white/5 text-stone-300" : "bg-white/50 border-[#3E2723]/5 text-[#5D4037]"
                      )}
                    >
                      <div className="flex-1 flex flex-col min-w-0 pr-2">
                        <span className="font-black truncate uppercase tracking-tight">{item.name}</span>
                        <span className="text-[9px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">{item.bannerName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex text-amber-400 text-[10px]">
                          {Array.from({ length: item.rarity }).map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-amber-400 stroke-amber-400" />
                          ))}
                        </span>
                        <span className="text-[9px] font-mono text-stone-500 dark:text-stone-400 whitespace-nowrap">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setHistoryOpen(false)}
              className={cn(
                "mt-4 w-full py-2.5 rounded-xl font-black transition-all uppercase tracking-wider text-xs border-2 cursor-pointer text-center",
                isDark 
                  ? "bg-black/40 hover:bg-[#FFFDF9] text-stone-200 hover:text-[#3E2723] border-white/20 hover:border-[#FFFDF9]" 
                  : "bg-[#FFFDF9] hover:bg-[#3E2723] text-[#3E2723] hover:text-white border-[#3E2723]/30"
              )}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Details Popup Modal */}
      {detailsOpen && (
        <div className="absolute inset-0 z-55 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 rounded-3xl animate-in fade-in duration-200">
          <div className={cn(
            "w-full max-w-lg h-[65vh] sm:h-[60vh] rounded-2xl p-6 shadow-2xl border flex flex-col justify-between transition-all duration-300 scale-100 relative",
            isDark 
              ? "bg-[#1E1715] text-white border-white/10" 
              : "bg-[#FDF6EC] text-[#3E2723] border-[#3E2723]/10"
          )}>
            <button 
              onClick={() => setDetailsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-[#FFFDF9] dark:bg-[#1E1815] border-2 border-[#3E2723] dark:border-[#4E342E] rounded-lg flex items-center justify-center hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] transition-all active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <X className="w-4 h-4 text-[#3E2723] dark:text-[#ECE5DC]" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b pb-2 border-stone-300 dark:border-stone-700">
              <Info className="w-5 h-5 text-[#8D6E63] dark:text-amber-500" />
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide truncate">
                Chi tiết Banner Gacha
              </h3>
            </div>

            <div className="flex-grow overflow-y-auto pr-1 text-[11px] sm:text-xs space-y-4 text-left">
              {/* Introduction */}
              <div>
                <p className="font-black text-[12px] uppercase tracking-wide text-amber-500 mb-1">
                  {activeBanner.name}
                </p>
                <p className={cn("text-[11px] leading-relaxed", isDark ? "text-stone-300" : "text-[#5D4037]")}>
                  {activeBanner.description || "Banner Gacha đặc biệt chứa các sticker độc quyền."}
                </p>
              </div>

              {/* Rates */}
              <div className={cn("p-3 rounded-xl border border-dashed", isDark ? "bg-black/35 border-white/10" : "bg-white border-[#3E2723]/15")}>
                <p className="font-extrabold text-[#3E2723] dark:text-white mb-2 uppercase tracking-tight text-[11px]">Tỷ lệ rơi (Drop rates):</p>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-amber-500">
                    <span>⭐⭐⭐⭐⭐ 5 SAO</span>
                    <span>0.6% <span className="text-[9px] font-normal text-stone-500 dark:text-stone-400">(Tăng mạnh sau lần 75, bảo hiểm lần 90)</span></span>
                  </div>
                  <div className="flex justify-between font-bold text-purple-500">
                    <span>⭐⭐⭐⭐ 4 SAO</span>
                    <span>5.1% <span className="text-[9px] font-normal text-stone-500 dark:text-stone-400">(Mỗi 10 lần chắc chắn có ít nhất 1 lần 4 sao trở lên)</span></span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-500">
                    <span>⭐⭐⭐ 3 SAO</span>
                    <span>94.3%</span>
                  </div>
                </div>
              </div>

              {/* Pool items list */}
              <div className="space-y-2">
                <p className="font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-tight text-[11px]">Danh sách các Sticker có trong Banner:</p>

                {/* 5 Star list */}
                {activeBanner.pool5Star && activeBanner.pool5Star.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-black text-amber-500 text-[10px] uppercase tracking-wider">🌟 STICKER 5 SAO HOÀNG KIM:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeBanner.pool5Star.map((item) => (
                        <span key={item.id} className={cn("px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold border uppercase", isDark ? "bg-[#2C211E] text-amber-400 border-amber-500/20" : "bg-[#FFFBEB] text-amber-600 border-amber-300")}>
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4 Star list */}
                {activeBanner.pool4Star && activeBanner.pool4Star.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="font-black text-purple-500 text-[10px] uppercase tracking-wider">✨ STICKER 4 SAO:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeBanner.pool4Star.map((item) => (
                        <span key={item.id} className={cn("px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold border uppercase", isDark ? "bg-[#251A24] text-purple-400 border-purple-500/20" : "bg-[#FAF5FF] text-purple-600 border-purple-300")}>
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 Star list */}
                <div className="space-y-1 pt-1">
                  <p className="font-black text-stone-500 text-[10px] uppercase tracking-wider">📦 PHẦN THƯỞNG 3 SAO:</p>
                  <p className={cn("text-[10px]", isDark ? "text-stone-400" : "text-stone-600")}>
                    Món quà 10 Mảnh Choco Gacha dùng để tích lũy quy đổi Vé Gacha tại Cửa hàng.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setDetailsOpen(false)}
              className={cn(
                "mt-4 w-full py-2.5 rounded-xl font-black transition-all uppercase tracking-wider text-xs border-2 cursor-pointer text-center",
                isDark 
                  ? "bg-black/40 hover:bg-[#FFFDF9] text-stone-200 hover:text-[#3E2723] border-white/20 hover:border-[#FFFDF9]" 
                  : "bg-[#FFFDF9] hover:bg-[#3E2723] text-[#3E2723] hover:text-white border-[#3E2723]/30"
              )}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Star, History, Info, Clock, Loader2 } from 'lucide-react';
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
    
    // Auto-reconstruct history matching the user's gacha pity
    if (currentHistory.length === 0 && gachaPity5Star > 0) {
      const generatedList: any[] = [];
      const pityCount = gachaPity5Star;
      
      const pool4 = activeBanner?.pool4Star || [];
      const default4StarNames = ['Sticker Bánh Gấu', 'Sticker Ly Choco Kem', 'Sticker Kem Dâu Cute', 'Sticker Chucu Trái Tim'];
      
      for (let i = 1; i <= pityCount; i++) {
        const is4 = (i % 10 === 0);
        const rarity = is4 ? 4 : 3;
        
        let name = '10 Mảnh Choco Gacha';
        if (is4) {
          if (pool4.length > 0) {
            name = pool4[Math.floor(Math.random() * pool4.length)].name;
          } else {
            name = default4StarNames[i % default4StarNames.length];
          }
        }
        
        // Stagger previous pull times by 45s intervals
        const timeOffset = (pityCount - i) * 45 * 1000 + 5000;
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
          name,
          rarity,
          time: VietnamTime,
          bannerName: activeBanner?.name || 'Cốc Choco Nóng'
        });
      }
      
      localStorage.setItem(storedHistoryKey, JSON.stringify(generatedList));
      setHistoryList(generatedList);
    } else {
      setHistoryList(currentHistory);
    }
  }, [firebaseUser?.uid, isGachaOpen, gachaPity5Star, activeBanner, banners]);

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
    
    for (let i = 0; i < times; i++) {
       const res = performSinglePull(currentPity5, currentPity4);
       results.push(res.item);
       currentPity5 = res.newPity5;
       currentPity4 = res.newPity4;
       
       // Grant item to user
       if (res.item.type === 'sticker') {
         const stickerUrl = res.item.image || 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=120&auto=format&fit=crop';
         addOwnedSticker(stickerUrl);
       } else if (res.item.type === 'fragment') {
         // rough parse of number from name: "10 Mảnh..."
         const amtMatch = res.item.name.match(/\d+/);
         if (amtMatch) {
            addGachaFragments(parseInt(amtMatch[0]));
         } else {
            addGachaFragments(5); // default
         }
       }
    }
    
    // Save state
    await updateUserDoc({
       ownedGachaTickets: currentTickets - times,
       gachaPity5Star: currentPity5,
       gachaPity4Star: currentPity4
    });
    
    // update local history
    const newHistoryItems = results.map(item => ({
      name: item.name,
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
    setShowResults(results);
  };

  const pullOnce = () => executePulls(1);
  const pullTen = () => executePulls(10);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setGachaOpen(false)} />
      
      {/* Banner UI */}
      <div className="relative w-full max-w-5xl h-[85vh] sm:h-[80vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
        <button 
          onClick={() => setGachaOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 bg-[#FFFDF9] dark:bg-[#1E1815] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-xl flex items-center justify-center hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] shadow-[0_3px_0_0_#3E2723] dark:shadow-[0_3px_0_0_#0D0907] transition-all hover:scale-110 active:translate-y-1 active:shadow-none z-20 pointer-events-auto cursor-pointer"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#3E2723] dark:text-[#ECE5DC]" />
        </button>

        {/* Header Currency */}
        <div className="absolute top-4 right-20 z-20 flex gap-2 sm:gap-3">
          <div className={cn(
            "flex items-center gap-1.5 sm:gap-2 backdrop-blur px-3 sm:px-4 py-2 rounded-full border shadow-lg",
            isDark 
              ? "bg-black/40 border-white/10 text-white" 
              : "bg-white/80 border-[#3E2723]/10 text-[#3E2723]"
          )}>
            <span className="font-bold text-xs sm:text-sm">
              {(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : choco}
            </span>
            <span className={cn("text-[10px] sm:text-xs", isDark ? "text-[#E6D8C9]" : "text-[#8D6E63]")}>Choco</span>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 sm:gap-2 backdrop-blur px-3 sm:px-4 py-2 rounded-full border shadow-lg",
            isDark 
              ? "bg-[#3E2723]/60 border-white/10 text-white" 
              : "bg-[#FFF9C4]/80 border-[#3E2723]/15 text-[#5D4037]"
          )}>
            <span className="font-bold text-xs sm:text-sm">
              {(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : (goldenChoco || 0)}
            </span>
            <span className={cn("text-[10px] sm:text-xs font-bold text-amber-500", isDark ? "text-amber-400" : "text-amber-700")}>Gchoco</span>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 sm:gap-2 backdrop-blur px-3 sm:px-4 py-2 rounded-full border shadow-lg lg:shadow-[0_0_15px_rgba(236,72,153,0.15)]",
            isDark 
              ? "bg-pink-500/20 border-pink-500/30 text-white" 
              : "bg-pink-500/10 border-pink-500/20 text-[#C2185B]"
          )}>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500 animate-pulse" />
            <span className="font-bold text-xs sm:text-sm tracking-wide">{ownedGachaTickets || 0}</span>
          </div>
        </div>

        {/* Banner Area */}
        <div className={cn(
          "relative w-full h-[70vh] sm:h-[65vh] rounded-3xl overflow-hidden shadow-2xl border-[4px] flex flex-col md:flex-row transition-all duration-300",
          isDark 
            ? "border-[#FFFDF9]/20 bg-[#1A1412] text-white" 
            : "border-[#3E2723]/15 bg-[#FFFDF9] text-[#3E2723]"
        )}>
          
          {/* Background Grid of Stickers */}
          <div className={cn(
            "absolute inset-0 z-0 overflow-hidden p-6 flex flex-wrap gap-4 items-center justify-start content-center select-none pointer-events-none transition-all duration-300",
            isDark ? "opacity-85" : "opacity-100"
          )}>
            {[
              ...(activeBanner.pool5Star || []).filter((item: any) => item.type === 'sticker' || item.image),
              ...(activeBanner.pool4Star || []).filter((item: any) => item.type === 'sticker' || item.image)
            ].map((item, idx) => (
              <div 
                key={item.id || idx} 
                className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center relative p-1.5 border-2 transition-all shadow-md shrink-0",
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
                  <span className="text-xl">🏷️</span>
                )}
              </div>
            ))}
          </div>

          {/* Banner Info Content */}
          <div className="relative z-10 pt-4 px-8 pb-4 flex-grow flex flex-col justify-between text-shadow-sm select-text text-left">
            <h1 className={cn(
              "text-3xl sm:text-4xl md:text-5xl font-black font-sans uppercase tracking-tight transition-all duration-300 mt-0",
              isDark 
                ? "text-[#FFFDF9] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" 
                : "text-[#3E2723] drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            )}>
              {activeBanner.name}
            </h1>
            
            <div className="flex gap-3 mt-auto">
               <button 
                 onClick={() => setHistoryOpen(true)}
                 className={cn(
                   "flex items-center gap-2 px-4.5 py-2.5 rounded-xl backdrop-blur transition-all text-xs font-black uppercase tracking-wider border-2 hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-sm hover:shadow-md",
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
                   "flex items-center gap-2 px-4.5 py-2.5 rounded-xl backdrop-blur transition-all text-xs font-black uppercase tracking-wider border-2 hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-sm hover:shadow-md",
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
          <div className="relative z-10 p-8 flex flex-col justify-end md:w-96 gap-4">
              <div className={cn(
                 "backdrop-blur-md p-4 rounded-2xl border transition-all duration-300",
                 isDark 
                   ? "bg-black/55 border-white/10 text-white" 
                   : "bg-white/80 border-[#3E2723]/15 text-[#3E2723]"
              )}>
                 <p className={cn("text-xs uppercase tracking-wider font-extrabold mb-1", isDark ? "text-[#D7CCC8]" : "text-[#8D6E63]")}>Tiến trình bảo hiểm</p>
                 <div className="flex justify-between text-sm font-bold">
                   <span>5 Sao: <span className="text-amber-500">{gachaPity5Star}/{PITY_5_STAR}</span></span>
                 </div>
                 <div className={cn("w-full h-2 rounded-full mt-2 overflow-hidden", isDark ? "bg-white/15" : "bg-[#3E2723]/10")}>
                    <div 
                      className="bg-gradient-to-r from-amber-300 to-amber-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min((gachaPity5Star / PITY_5_STAR) * 100, 100)}%` }} 
                     />
                  </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={pullOnce}
                  disabled={isPulling}
                  className={cn(
                    "flex-1 rounded-2xl py-4 flex flex-col items-center justify-center font-bold tracking-wide active:scale-[0.97] hover:scale-[1.03] transition-all duration-200 disabled:opacity-50 cursor-pointer border-2",
                    isDark 
                      ? "bg-[#251C1A] hover:bg-[#322320] text-[#E6D4BF] border-white/10 hover:border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(230,212,191,0.1)]" 
                      : "bg-[#FFF9E6] hover:bg-[#FDF1D5] text-[#3E2723] border-[#E8C07D] hover:border-[#dfab52] shadow-[0_4px_12px_rgba(232,192,125,0.15)] hover:shadow-[0_0_18px_rgba(232,192,125,0.5)]"
                  )}
                >
                  <span className={cn("text-sm font-black uppercase tracking-wider", isDark ? "text-[#E6D4BF]" : "text-[#3E2723]")}>Gacha 1 Lần</span>
                  <div className={cn("flex items-center gap-1.5 mt-1 text-xs font-bold", isDark ? "text-stone-400" : "text-[#5D4037]")}>
                     <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                     <span>x1</span>
                  </div>
                </button>
                <button 
                  onClick={pullTen}
                  disabled={isPulling}
                  className={cn(
                    "flex-1 rounded-2xl py-4 flex flex-col items-center justify-center font-bold tracking-wide active:scale-[0.97] hover:scale-[1.03] transition-all duration-200 disabled:opacity-50 border-2 cursor-pointer",
                    isDark 
                      ? "bg-gradient-to-b from-[#3E2E1D] to-[#25180F] hover:from-[#4E3C29] hover:to-[#322217] text-[#FFD54F] border-[#FFD54F]/30 hover:border-[#FFD54F]/50 shadow-[0_0_15px_rgba(255,193,7,0.15)] hover:shadow-[0_0_20px_rgba(255,193,7,0.3)]" 
                      : "bg-gradient-to-b from-[#FFF9C4] to-[#FFD54F] hover:from-[#FFF176] hover:to-[#FFD54F] text-[#3E2723] border-amber-400 hover:border-[#FFB300] shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  )}
                >
                  <span className={cn("text-sm font-black uppercase tracking-wider", isDark ? "text-[#FFD54F]" : "text-[#3E2723]")}>Gacha 10 Lần</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold">
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
                "mt-16 px-10 py-3 font-extrabold rounded-full transition-all uppercase tracking-widest cursor-pointer shadow-lg",
                isDark 
                  ? "bg-[#FFFDF9] hover:bg-stone-200 text-[#1A1412]" 
                  : "bg-[#3E2723] hover:bg-[#5D4037] text-white"
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

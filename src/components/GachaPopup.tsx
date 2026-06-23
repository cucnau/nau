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
     choco, ownedGachaTickets = 0, 
     updateUserDoc, gachaPity5Star = 0, gachaPity4Star = 0, 
     addOwnedSticker, addChucuGameFragments
  } = useStore();
  
  // Custom limited banner loaded from DB
  const [banners, setBanners] = useState<GachaBanner[]>([]);
  const [activeBanner, setActiveBanner] = useState<GachaBanner>(GACHA_STANDARD_BANNER);
  const [isPulling, setIsPulling] = useState(false);
  const [showResults, setShowResults] = useState<GachaItem[] | null>(null);

  useEffect(() => {
    if (!isGachaOpen) return;
    const unsub = onSnapshot(collection(db, "gacha_banners"), (snap) => {
      const list: GachaBanner[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.active !== false) {
          list.push({ id: docSnap.id, ...data } as GachaBanner);
        }
      });
      setBanners(list);
      if (list.length > 0) {
        setActiveBanner(prev => {
          if (prev) {
            const found = list.find(b => b.id === prev.id);
            if (found) return found;
          }
          const std = list.find(b => b.type === 'standard');
          return std || list[0];
        });
      }
    }, (err) => {
      console.error("Error reading banners:", err);
    });

    return () => unsub();
  }, [isGachaOpen]);

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
      pulledItem = { id: 's3-1', name: '10 Mảnh Choco', rarity: 3, type: 'fragment' };
    }
    
    return { item: pulledItem, newPity5: nextPity5, newPity4: nextPity4 };
  };

  const executePulls = async (times: number) => {
    if (ownedGachaTickets < times) {
       alert(`Không đủ Vé Gacha! Bạn cần ${times} vé.`);
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
         addOwnedSticker(res.item.id);
       } else if (res.item.type === 'fragment') {
         // rough parse of number from name: "10 Mảnh..."
         const amtMatch = res.item.name.match(/\d+/);
         if (amtMatch) {
            addChucuGameFragments(parseInt(amtMatch[0]));
         } else {
            addChucuGameFragments(5); // default
         }
       }
    }
    
    // Save state
    await updateUserDoc({
       ownedGachaTickets: ownedGachaTickets - times,
       gachaPity5Star: currentPity5,
       gachaPity4Star: currentPity4
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
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur border border-white/20 rounded-full flex items-center justify-center text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Currency */}
        <div className="absolute top-4 right-20 z-20 flex gap-3">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-white shadow-lg">
            <span className="font-bold text-sm">{choco}</span>
            <span className="text-xs text-[#E6D8C9]">Choco</span>
          </div>
          <div className="flex items-center gap-2 bg-pink-500/20 backdrop-blur px-4 py-2 rounded-full border border-pink-500/30 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <Sparkles className="w-4 h-4 text-pink-300" />
            <span className="font-bold text-sm tracking-wide">{ownedGachaTickets || 0}</span>
          </div>
        </div>

        {/* Banner Area */}
        <div className="relative w-full h-[70vh] sm:h-[65vh] rounded-3xl overflow-hidden shadow-2xl border-[4px] border-[#FFFDF9]/20 flex flex-col md:flex-row bg-[#1A1412]">
          
          {/* Background Image / Art */}
          <div className="absolute inset-0 z-0">
            <img src={activeBanner.image} alt="Banner bg" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412] via-transparent to-transparent" />
          </div>

          {/* Banner Info Content */}
          <div className="relative z-10 p-8 flex-1 flex flex-col justify-center text-white text-shadow-sm">
            <h1 className="text-4xl md:text-6xl font-black font-sans uppercase italic tracking-tighter mb-2 text-[#FFFDF9] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {activeBanner.name}
            </h1>
            <p className="text-[#D7CCC8] text-lg font-medium max-w-md drop-shadow-md">
              {activeBanner.description}
            </p>
            
            <div className="mt-8 flex gap-3">
               <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl backdrop-blur transition-all text-sm font-bold border border-white/20">
                 <History className="w-4 h-4" /> Lịch sử
               </button>
               <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl backdrop-blur transition-all text-sm font-bold border border-white/20">
                 <Info className="w-4 h-4" /> Chi tiết
               </button>
            </div>
          </div>

          {/* Actions Column */}
          <div className="relative z-10 p-8 flex flex-col justify-end md:w-96 gap-4">
             <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white">
                <p className="text-xs text-[#D7CCC8] uppercase tracking-wider font-bold mb-1">Tiến trình bảo hiểm</p>
                <div className="flex justify-between text-sm">
                  <span>5 Sao: <span className="font-bold text-amber-400">{gachaPity5Star}/{PITY_5_STAR}</span></span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                   <div 
                     className="bg-gradient-to-r from-amber-200 to-amber-500 h-full rounded-full transition-all" 
                     style={{ width: `${Math.min((gachaPity5Star / PITY_5_STAR) * 100, 100)}%` }} 
                   />
                </div>
             </div>

             <div className="flex gap-3 mt-4">
               <button 
                 onClick={pullOnce}
                 disabled={isPulling}
                 className="flex-1 bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] rounded-2xl py-4 flex flex-col items-center justify-center font-bold tracking-wide active:scale-95 transition-all disabled:opacity-50"
               >
                 <span>Gacha 1 Lần</span>
                 <div className="flex items-center gap-1.5 mt-1 text-xs text-[#5D4037]">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>x1</span>
                 </div>
               </button>
               <button 
                 onClick={pullTen}
                 disabled={isPulling}
                 className="flex-1 bg-gradient-to-b from-[#FFF9C4] to-[#FFD54F] hover:from-[#FFF176] hover:to-[#FFC107] text-[#3E2723] rounded-2xl py-4 flex flex-col items-center justify-center font-bold tracking-wide shadow-[0_0_15px_rgba(255,193,7,0.4)] active:scale-95 transition-all disabled:opacity-50 border border-[#FFE082]"
               >
                 <span>Gacha 10 Lần</span>
                 <div className="flex items-center gap-1.5 mt-1 text-xs text-[#5D4037]">
                    <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                    <span>x10</span>
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
                "px-6 py-2 rounded-full font-bold text-sm shadow-lg whitespace-nowrap transition-all duration-300",
                activeBanner.id === b.id 
                  ? "bg-white text-[#3E2723] scale-105" 
                  : "bg-black/40 text-stone-300 hover:bg-black/60 hover:text-white"
              )}
            >
              {b.name}
            </button>
          ))}
          {banners.length === 0 && (
            <button className="px-6 py-2 rounded-full bg-white text-[#3E2723] font-bold text-sm shadow-lg whitespace-nowrap">
              {activeBanner.name}
            </button>
          )}
        </div>
      </div>
      
      {/* Pull Animation/Result Overlay Area - to be implemented in details */}
      {showResults && (
        <div className="absolute inset-0 z-50 bg-[#1A1412] flex flex-col items-center justify-center animate-in fade-in duration-500 p-4">
            <h2 className="text-3xl font-black text-white italic tracking-widest mb-12">KẾT QUẢ</h2>
            
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-5xl">
              {showResults.map((item, idx) => (
                <div key={idx} className={cn(
                  "relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-2xl",
                  item.rarity === 5 ? "bg-gradient-to-br from-amber-200 to-amber-600 border-[3px] border-amber-100" :
                  item.rarity === 4 ? "bg-gradient-to-br from-purple-300 to-purple-600 border-[3px] border-purple-200" :
                  "bg-gradient-to-br from-stone-200 to-stone-400 border-[3px] border-stone-100"
                )} style={{ animationDelay: `${idx * 100}ms` }}>
                  
                  {/* Item Icon */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-inner overflow-hidden mb-2 relative">
                     {item.image ? (
                       <img src={item.image} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" />
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

                  <span className="text-[9px] sm:text-[10px] font-bold text-white text-center leading-tight px-1 drop-shadow-md line-clamp-2">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowResults(null)}
              className="mt-16 px-10 py-3 bg-white hover:bg-stone-200 text-[#1A1412] font-bold rounded-full transition-all uppercase tracking-widest"
            >
              Xác Nhận
            </button>
        </div>
      )}
    </div>
  );
}

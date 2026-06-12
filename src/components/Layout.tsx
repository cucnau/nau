import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Menu, Search, User, Key, LogOut, X, Trophy, BookOpen, Zap, Flame, ShieldCheck, 
  Camera, Calendar, Mail, Clock, Settings, Copy, Home, ClipboardList, ShoppingBag, List, Edit2, Library,
  Medal, Award, Lock, Unlock, Users, Sparkles, CheckCircle, Gift, Bell, CheckCheck, Sun, Moon
} from 'lucide-react';
import { useStore } from '../store';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { getDocs, collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { ACHIEVEMENTS_LIST, getWeeklyId, getPreviousWeeklyId, ACHIEVEMENT_CATEGORIES } from '../types/achievements';
import { Store } from '../pages/Store';
import { Missions } from '../pages/Missions';
import { Inventory } from '../pages/Inventory';
import { UserAvatar } from './UserAvatar';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Vừa xong';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export function PaimonLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Glow / Halo */}
      <path d="M50,15 C25,15 20,22 20,24 C20,26 25,28 50,28 C75,28 80,26 80,24 C80,22 75,15 50,15 Z" fill="#FDF6EC" opacity="0.15" />
      <path d="M50,18 C28,18 24,23 24,24 C24,25 28,27 50,27 C72,27 76,25 76,24 C76,23 72,18 50,18 Z" stroke="#FFF" strokeWidth="2" fill="none" />
      
      {/* Gold Crown Back Crown piece */}
      <path d="M46,6 L54,6 L50,23 Z" fill="#ECC45C" />
      
      {/* Gold Crown 4-pointed star */}
      <path d="M50,8 L53,14 L59,17 L53,20 L50,26 L47,20 L41,17 L47,14 Z" fill="#ECC45C" />
      <circle cx="50" cy="17" r="1.5" fill="#FFF" />

      {/* Paimon Hair - Main background white/silver silhouette */}
      <path d="M15,48 C12,58 10,74 20,83 C24,86 28,81 28,75 C28,68 32,58 38,58 C41,58 44,65 50,65 C56,65 59,58 62,58 C68,58 72,68 72,75 C72,81 76,86 80,83 C90,74 88,58 85,48 C80,35 68,36 50,36 C32,36 20,35 15,48 Z" fill="#FFF" />
      
      {/* Hair Clips (Dark/Gold hairpins) */}
      <path d="M28,48 L34,51 L31,55 Z" fill="#4B3F3D" />
      <path d="M72,48 L66,51 L69,55 Z" fill="#4B3F3D" />
      <path d="M29,49 L33,52 L31,54 Z" fill="#ECC45C" />
      <path d="M71,49 L67,52 L69,54 Z" fill="#ECC45C" />
      
      {/* Cute little inner shadows or highlights on hair */}
      <path d="M50,36 C64,36 72,40 76,48 C68,44 58,45 50,49 C42,45 32,44 24,48 C28,40 36,36 50,36 Z" fill="#CBD5E1" opacity="0.8" />
      
      {/* Crown Ring Outline front section */}
      <path d="M30,24 C36,26 44,27 50,27 C56,27 64,26 70,24" stroke="#FFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { 
    isLoggedIn, email, missions, level, lastClaimedRewardLevel,
    setStoreOpen, setMissionsOpen, setAchievementsOpen,
    firebaseUser
  } = useStore();

  if (!isOpen) return null;

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        if (popupError?.code === 'auth/popup-blocked' || popupError?.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Login failed', error);
      if (error?.code === 'auth/unauthorized-domain') {
        alert(
          'Lỗi: Tên miền này chưa được cấp phép đăng ký/đăng nhập trong Firebase Auth!\n\n' +
          'Bạn cần thêm "nau-self.vercel.app" vào danh sách "Authorized domains" trong Firebase Console:\n' +
          '1. Truy cập: https://console.firebase.google.com/project/valued-year-b4wsx/authentication/providers\n' +
          '2. Chọn tab Settings (Cấu hình) -> Authorized domains (Miền được ủy quyền).\n' +
          '3. Nhấp "Thêm miền" và nhập đúng: nau-self.vercel.app'
        );
      } else {
        alert('Đăng nhập thất bại: ' + (error?.message || String(error)));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const claimableMissions = missions.filter(m => m.completed && !m.claimed).length;
  const hasLevelUpRewards = isLoggedIn && (level || 1) > (lastClaimedRewardLevel || 1);

  return (
    <>
      {/* Blurred overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      
      {/* Navigation Drawer Container */}
      <div className="fixed left-0 top-0 bottom-0 w-80 sm:w-[360px] bg-[#FDF6EC] dark:bg-[#161311] z-50 shadow-2xl flex flex-col border-r-4 border-[#3E2723] dark:border-[#261E1A] overflow-hidden animate-in slide-in-from-left duration-300 font-sans">
        
        {/* Header Row */}
        <div className="p-4 bg-[#3E2723] text-[#FDF6EC] flex items-center justify-between border-b border-[#5D4037]">
          <span className="font-black text-sm tracking-wider uppercase">Menu Tiện Ích</span>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-90 transition-all text-[#FDF6EC]"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tiles Body */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
             {/* Trang Chủ */}
             <button 
                onClick={() => { onClose(); navigate('/'); }}
                className="bg-[#EEE2D4] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-[#DFD3C5] dark:border-[#3C2E27] shadow-sm group"
             >
                <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/35 flex items-center justify-center group-hover:scale-105 transition-transform">
                   <Home className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-bold leading-normal">Trang Chủ</span>
             </button>

             {/* Danh Sách */}
             <button 
                onClick={() => { onClose(); navigate('/danh-sach'); }}
                className="bg-[#EEE2D4] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-[#DFD3C5] dark:border-[#3C2E27] shadow-sm group"
             >
                <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/35 flex items-center justify-center group-hover:scale-105 transition-transform">
                   <List className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-bold leading-normal">Danh Sách</span>
             </button>

             {/* Thư Viện */}
             <button 
                onClick={() => { onClose(); navigate('/thu-vien'); }}
                className="bg-[#EEE2D4] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-[#DFD3C5] dark:border-[#3C2E27] shadow-sm group"
             >
                <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/35 flex items-center justify-center group-hover:scale-105 transition-transform">
                   <Library className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-bold leading-normal">Thư Viện</span>
             </button>

             {/* Cửa Hàng */}
             <button 
                onClick={() => { onClose(); setStoreOpen(true); }}
                className="bg-[#EEE2D4] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-[#DFD3C5] dark:border-[#3C2E27] shadow-sm group"
             >
                <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/35 flex items-center justify-center group-hover:scale-105 transition-transform">
                   <ShoppingBag className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-bold leading-normal">Cửa Hàng</span>
             </button>

             {/* Nhiệm Vụ */}
             <button 
                onClick={() => { onClose(); setMissionsOpen(true); }}
                className="bg-[#EEE2D4] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] active:scale-105 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-[#DFD3C5] dark:border-[#3C2E27] shadow-sm relative group"
             >
                <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/35 flex items-center justify-center group-hover:scale-105 transition-transform">
                   <ClipboardList className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-bold leading-normal">Nhiệm Vụ</span>
                {claimableMissions > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
             </button>

             {/* Thành Tựu */}
             <button 
                onClick={() => { onClose(); setAchievementsOpen(true); }}
                className="bg-[#EEE2D4] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-[#DFD3C5] dark:border-[#3C2E27] shadow-sm group"
             >
                <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/35 flex items-center justify-center group-hover:scale-105 transition-transform">
                   <Trophy className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-bold leading-normal">Thành Tựu</span>
              </button>

              {/* Tài Khoản */}
              <button 
                 onClick={() => { onClose(); navigate('/tai-khoan'); }}
                 className="bg-[#EEE2D4] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-[#DFD3C5] dark:border-[#3C2E27] shadow-sm relative group"
              >
                 <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/35 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5 text-[#8D6E63]" />
                 </div>
                 <span className="text-xs font-bold leading-normal">Hồ Sơ</span>
                 {hasLevelUpRewards && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                 )}
              </button>

             {/* Quản Trị (Optional) */}
             {isLoggedIn && (email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') && (
                <button 
                   onClick={() => { onClose(); navigate('/admin'); }}
                   className="bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#1E293B] dark:bg-slate-900/60 dark:hover:bg-slate-800 dark:text-slate-200 active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-slate-300 dark:border-slate-800 shadow-sm group"
                >
                   <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/35 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                   </div>
                   <span className="text-xs font-bold leading-normal">Quản Trị</span>
                </button>
             )}

             {/* Tài khoản - Đăng Nhập / Đăng Xuất Tile */}
             {isLoggedIn ? (
                <button 
                   onClick={() => { onClose(); handleLogout(); }}
                   className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] dark:bg-rose-950/40 dark:hover:bg-rose-905/30 dark:text-rose-200 active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-red-200 dark:border-red-900/40 shadow-sm group"
                >
                   <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                   </div>
                   <span className="text-xs font-bold leading-normal">Đăng Xuất</span>
                </button>
             ) : (
                <button 
                   onClick={() => { onClose(); handleLogin(); }}
                   className="bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#065F46] dark:bg-emerald-950/40 dark:hover:bg-emerald-905/30 dark:text-emerald-200 active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border border-emerald-200 dark:border-emerald-900/40 shadow-sm group"
                >
                   <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                   </div>
                   <span className="text-xs font-bold leading-normal font-sans">Đăng Nhập</span>
                </button>
             )}
          </div>
        </div>
      </div>
    </>
  );
}

function AchievementsModal() {
  const { 
    isLoggedIn, uid, unlockedAchievements, claimedAchievements,
    totalEarnedChoco, totalEarnedGChoco, totalSpentChoco, totalCheckIns,
    perfectDailyDates, sentMessagesCount, genresRead, checkInStreak,
    claimAchievement, savedStories, totalChaptersRead, totalCommentsCount, ownedStickers
  } = useStore();

  const [activeCategory, setActiveCategory] = useState('all');
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [activeCategory]);

  const getProgress = (id: string) => {
    switch(id) {
      case 'first_chapter':
        return unlockedAchievements.includes('first_chapter') ? 1 : 0;
      case 'midnight_read':
        return unlockedAchievements.includes('midnight_read') ? 1 : 0;
      case 'early_morning_read':
        return unlockedAchievements.includes('early_morning_read') ? 1 : 0;
      case 'read_100_chapters':
        return totalChaptersRead || 0;
      case 'multi_genre':
        return (genresRead || []).length;
      case 'collector':
        return (savedStories || []).length;
      case 'sticker_collector':
        return (ownedStickers || []).length;
      case 'big_spender':
        return totalSpentChoco || 0;
      case 'blogger_choco_new':
        return unlockedAchievements.includes('blogger_choco_new') ? 1 : 0;
      case 'commenter_choco':
        return totalCommentsCount || 0;
      case 'chatty_lounge':
        return sentMessagesCount || 0;
      case 'chatty':
        return sentMessagesCount || 0;
      case 'streak_7':
        return checkInStreak || 0;
      case 'monthly_checkin':
        return totalCheckIns || 0;
      case 'weekly_missions_perfect':
        return (perfectDailyDates || []).length;
      case 'generous_donor':
        return unlockedAchievements.includes('generous_donor') ? 1 : 0;
      case 'choco_king':
        return totalEarnedChoco || 0;
      case 'gchoco_king':
        return totalEarnedGChoco || 0;
      case 'choco_cute':
        return unlockedAchievements.includes('choco_cute') ? 1 : 0;
      default:
        return 0;
    }
  };

  const filteredAchievements = ACHIEVEMENTS_LIST.filter(
    (ach) => activeCategory === 'all' || ach.category === activeCategory
  );

  return (
    <div className="text-[#3E2723] flex-1 flex flex-col h-full">
      {/* Title Header */}
      <div className="mb-4 text-center border-b border-[#D7CCC8]/60 pb-3 w-full shrink-0">
         <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-1 drop-shadow" />
         <h2 className="text-xl font-bold uppercase tracking-tight font-sans">Khu Thành Tựu</h2>
         <p className="text-xs text-[#6D4C41] mt-1">
           Đạt các cột mốc danh giá để nhận quà tặng ({unlockedAchievements.length}/{ACHIEVEMENTS_LIST.length})
         </p>
      </div>

      {/* Category Carousel / Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-[#D7CCC8]/30 max-w-full scrollbar-none shrink-0 scroll-smooth">
        {ACHIEVEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap border shrink-0",
              activeCategory === cat.id
                ? "bg-[#5D4037] text-white border-[#5D4037] dark:bg-[#C29D70] dark:text-[#1D1613] dark:border-[#C29D70] shadow-sm scale-105"
                : "bg-white text-[#5D4037] border-[#D7CCC8]/80 hover:bg-[#EFEBE9]/40 dark:bg-[#1C1613] dark:text-[#ECE5DC] dark:border-[#3C2E27] dark:hover:bg-[#2C221D]"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[50vh]">
        {filteredAchievements.length === 0 ? (
          <div className="text-center py-10 text-stone-400 text-xs">
            Chưa có thành tựu nào thuộc mục này.
          </div>
        ) : (
          filteredAchievements.map((ach) => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            const isClaimed = claimedAchievements.includes(ach.id);
            const progress = getProgress(ach.id);
            const percent = Math.min(100, Math.floor((progress / ach.progressTarget) * 100));

            return (
              <div 
                key={ach.id} 
                onClick={() => {
                  if (activeCategory !== ach.category) {
                    setActiveCategory(ach.category);
                  }
                }}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer",
                  isClaimed 
                    ? "bg-[#EFEBE9]/60 border-[#D7CCC8]/60 opacity-75 dark:bg-[#2C221D]/50 dark:border-[#3C2E27]/60"
                    : isUnlocked 
                      ? "bg-white border-yellow-400 shadow-md ring-1 ring-yellow-200 dark:bg-[#2C221D] dark:border-yellow-600 dark:ring-yellow-800" 
                      : "bg-white border-[#D7CCC8]/80 hover:shadow-sm dark:bg-[#1E1815] dark:border-[#3C2E27]"
                )}
              >
                {/* Background Sparkle for Unlocked */}
                {isUnlocked && !isClaimed && (
                  <div className="absolute top-0 right-0 p-1 bg-yellow-400/20 text-yellow-600 rounded-bl-xl">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "p-1 rounded-lg text-white",
                      isClaimed ? "bg-stone-400" : isUnlocked ? "bg-yellow-500" : "bg-[#A1887F]"
                    )}>
                      {isClaimed ? <CheckCircle className="w-3.5 h-3.5" /> : isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#4E342E]">{ach.name}</h4>
                    
                    {/* Rewards badge */}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                      ach.goldenReward > 0 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50" : "bg-[#EFEBE9] dark:bg-[#1C1613] text-[#5D4037] dark:text-[#A1887F]"
                    )}>
                      {ach.rewardText}
                    </span>
                  </div>
                  <p className="text-xs text-[#5D4037] dark:text-[#D7CCC8]">{ach.description}</p>

                  {/* Progress bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                      <span>Tiến trình</span>
                      <span className="font-bold font-mono">{progress} / {ach.progressTarget} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-[#EFEBE9] dark:bg-[#1A1412] h-2 rounded-full overflow-hidden border border-[#D7CCC8]/30 dark:border-[#3C2E27]">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isUnlocked ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-gradient-to-r from-[#A1887F] to-[#8D6E63]"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Area Action Button */}
                <div className="flex items-center shrink-0 min-w-[90px] justify-end" onClick={(e) => e.stopPropagation()}>
                  {isClaimed ? (
                    <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Đã nhận
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => claimAchievement(ach.id)}
                      className="w-full md:w-auto bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      Nhận Quà
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Chưa mở
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState(true);
  const { 
    isLoggedIn, uid, displayName, avatarUrl, 
    equippedAccessory, accessoryPosition,
    choco, goldenChoco, email, level, lastClaimedRewardLevel, missions,
    isStoreOpen, isMissionsOpen, isAchievementsOpen, isInventoryOpen,
    setStoreOpen, setMissionsOpen, setAchievementsOpen, setInventoryOpen,
    isQuotaExceeded, firebaseUser, activeTitle, getTitleColor,
    theme, setTheme
  } = useStore();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      return;
    }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      // Sort in descending order by createdAt
      notifs.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(notifs);
    }, (error) => {
      console.error("Lỗi khi fetch notifications:", error);
    });
    return () => unsubscribe();
  }, [uid]);

  const hasUnreadNotifs = notifications.some(n => !n.isRead);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        const notifRef = doc(db, 'notifications', n.id);
        batch.update(notifRef, { isRead: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Lỗi khi Đánh dấu đã đọc tất cả:", err);
    }
  };

  const handleNotifClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
      }
      setShowNotifDropdown(false);
      if (notif.chapterId) {
        navigate(`/doc/${notif.storyId}/${notif.chapterId}`);
      } else {
        navigate(`/truyen/${notif.storyId}`);
      }
    } catch (err) {
      console.error("Lỗi khi click notification:", err);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        if (popupError?.code === 'auth/popup-blocked' || popupError?.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Login failed', error);
      if (error?.code === 'auth/unauthorized-domain') {
        alert(
          'Lỗi: Tên miền này chưa được cấp phép đăng ký/đăng nhập trong Firebase Auth!\n\n' +
          'Bạn cần thêm "nau-self.vercel.app" vào danh sách "Authorized domains" trong Firebase Console:\n' +
          '1. Truy cập: https://console.firebase.google.com/project/valued-year-b4wsx/authentication/providers\n' +
          '2. Chọn tab Settings (Cấu hình) -> Authorized domains (Miền được ủy quyền).\n' +
          '3. Nhấp "Thêm miền" và nhập đúng: nau-self.vercel.app'
        );
      } else {
        alert('Đăng nhập thất bại: ' + (error?.message || String(error)));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const claimableMissionsInLayout = (missions || []).filter(m => m.completed && !m.claimed).length;
  const hasLevelUpRewardsInLayout = isLoggedIn && (level || 1) > (lastClaimedRewardLevel || 1);
  const utilityMenuHasRedDot = claimableMissionsInLayout > 0 || hasLevelUpRewardsInLayout;

  return (
    <div className="min-h-screen bg-[#FDF6EC] text-[#3E2723] flex flex-col font-sans">
      {isQuotaExceeded && showQuotaWarning && (
        <div className="bg-[#FFF9C4] border-b border-[#FBC02D]/40 text-[#4E342E] px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <span>
              <strong>Hệ thống đạt giới hạn lưu trữ đám mây hôm nay:</strong> Do máy chủ miễn phí chịu tải lớn, một số dữ liệu mới (bình luận, mua sắm...) tạm thời không thể lưu trữ. Bạn vẫn có thể trải nghiệm đọc truyện bình thường!
            </span>
          </div>
          <button onClick={() => setShowQuotaWarning(false)} className="text-[#3E2723] hover:opacity-75 transition-opacity font-bold text-xs bg-black/5 px-2 py-0.5 rounded shrink-0">Đóng</button>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-[#3E2723] text-[#FDF6EC] border-b border-[#5D4037] shadow-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[#5D4037] hover:bg-[#8D6E63] hover:scale-110 active:scale-95 transition-all outline-none border border-[#8D6E63] shadow-md text-white relative"
            title="Menu Tiện Ích"
          >
            <Menu className="w-5 h-5" />
            {utilityMenuHasRedDot && (
              <span className="absolute top-[3px] right-[3px] flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-[#3E2723]"></span>
              </span>
            )}
          </button>
        </div>

        <div className="font-bold tracking-tight text-xl cursor-pointer" onClick={() => navigate('/')}>
          Chocoatl
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center cursor-pointer outline-none hover:scale-110 active:scale-95"
            title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
          >
            {theme === 'light' ? <Moon className="w-[20px] h-[20px]" /> : <Sun className="w-[20px] h-[20px]" />}
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm font-medium">
                <span className="bg-[#8D6E63] text-[#FDF6EC] px-2.5 py-1 rounded-full text-xs font-bold border border-[#A1887F]/30 shadow-inner">Lv. {level || 1}</span>
                <span className="bg-[#5D4037] px-3 py-1 rounded-full text-[#FDF6EC] border border-[#8D6E63] text-sm">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : choco} Choco</span>
                <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 px-3 py-1 rounded-full text-sm">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : goldenChoco} Gchoco</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center cursor-pointer outline-none"
                  title="Thông báo"
                >
                  <Bell className="w-[22px] h-[22px]" />
                  {hasUnreadNotifs && (
                    <span className="absolute top-[5px] right-[5px] w-2.5 h-2.5 bg-red-500 rounded-full border border-[#3E2723] animate-pulse" />
                  )}
                </button>

                {showNotifDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#FDF6EC] dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] rounded-2xl shadow-2xl border border-[#D7CCC8]/60 dark:border-[#3C2E27] z-50 flex flex-col overflow-hidden max-h-[450px]">
                      <div className="p-4 border-b border-[#D7CCC8]/60 dark:border-[#3C2E27] bg-[#F5E6D3]/40 dark:bg-[#251E1B]/50 flex items-center justify-between">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-[#3E2723] dark:text-[#D7CCC8]">Thông báo ({notifications.filter(n => !n.isRead).length})</span>
                        {hasUnreadNotifs && (
                          <button 
                            onClick={markAllAsRead} 
                            className="text-xs hover:underline flex items-center gap-1 font-bold text-[#8D6E63] hover:text-[#5D4037] transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Đọc tất cả
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1 divide-y divide-[#D7CCC8]/30 max-h-80">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-sm text-gray-400 italic">
                             Không có thông báo nào.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={cn(
                                "p-3.5 hover:bg-[#F5E6D3]/30 dark:hover:bg-[#2C221D] transition-colors cursor-pointer flex gap-3 items-start text-xs sm:text-sm text-left font-normal",
                                !notif.isRead ? "bg-[#FDF6EC] dark:bg-[#1E1815] font-semibold text-[#3E2723] dark:text-[#ECE5DC]" : "bg-[#FDF6EC]/60 dark:bg-[#1A1412]/80 opacity-80 text-gray-600 dark:text-gray-400"
                              )}
                            >
                              <div className="w-2 h-2 rounded-full shrink-0 mt-1.5 bg-red-500 opacity-95" style={{ visibility: notif.isRead ? 'hidden' : 'visible' }} />
                              <div className="flex-1">
                                {notif.type === 'comment_reply' ? (
                                  <p className="leading-relaxed text-[#3E2723]">
                                     <span className="font-bold text-[#5D4037]">{notif.replierName}</span> đã trả lời bình luận của bạn trong truyện <span className="font-bold text-[#5D4037]">{notif.storyTitle}</span>{notif.chapterTitle ? ` (Chương: ${notif.chapterTitle})` : ''}
                                  </p>
                                ) : (
                                  <p className="leading-relaxed">
                                     Truyện <span className="font-bold text-[#5D4037]">{notif.storyTitle}</span> vừa có chương mới: <span className="italic text-[#8D6E63]">{notif.chapterTitle}</span>
                                  </p>
                                )}
                                <span className="text-[10px] text-gray-400 font-mono block mt-1">{formatRelativeTime(notif.createdAt)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative group cursor-pointer">
                <div className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors relative group">
                   <UserAvatar 
                     avatarUrl={avatarUrl} 
                     equippedAccessory={equippedAccessory}
                     accessoryPosition={accessoryPosition}
                     className="w-6 h-6" 
                     fallbackIconSizeClass="w-3 h-3" 
                     borderClass="border-0"
                   />
                   <span className="hidden sm:inline font-medium" style={{ color: getTitleColor(activeTitle) || undefined }}>{displayName}</span>
                </div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#FDF6EC] dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl shadow-xl border border-[#D7CCC8] dark:border-[#3C2E27] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden">
                   <div className="px-4 py-3 border-b border-[#D7CCC8] dark:border-[#3C2E27] mb-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                         <p className="font-semibold truncate" style={{ color: getTitleColor(activeTitle) || undefined }}>{displayName}</p>
                         <span className="px-1.5 py-0.5 bg-[#8D6E63] text-white text-[9px] font-bold rounded">Lv. {level || 1}</span>
                      </div>
                      <p className="text-xs opacity-70 truncate">{uid}</p>
                   </div>
                   <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] text-left" onClick={() => navigate('/tai-khoan')}>
                     <User className="w-4 h-4" />
                     <span>Hồ sơ & Cài đặt</span>
                   </button>
                   {(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') && (
                     <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] text-left text-blue-800 dark:text-blue-400" onClick={() => navigate('/admin')}>
                       <Key className="w-4 h-4" />
                       <span>Quản lý Truyện</span>
                     </button>
                   )}
                   <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] text-left text-red-900 dark:text-red-400">
                     <LogOut className="w-4 h-4" />
                     <span>Đăng xuất</span>
                   </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="bg-[#FDF6EC] text-[#3E2723] px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-white transition-colors border border-[#8D6E63]"
            >
              Đăng nhập / Đăng ký
            </button>
          )}
        </div>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Modal Cửa hàng */}
      {isStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setStoreOpen(false)} />
          <div className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-4xl h-[85vh] rounded-3xl overflow-y-auto border-4 border-[#8D6E63] dark:border-[#3C2E27] shadow-2xl flex flex-col z-10 transition-all">
            <button 
              onClick={() => setStoreOpen(false)} 
              className="absolute top-4 right-4 p-2 bg-[#3E2723] hover:bg-[#2D1B19] text-white rounded-full transition-colors z-20 shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2 sm:p-4 flex-1">
              <Store />
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhiệm vụ */}
      {isMissionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMissionsOpen(false)} />
          <div className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-3xl h-[85vh] rounded-3xl overflow-y-auto border-4 border-[#8D6E63] dark:border-[#3C2E27] shadow-2xl flex flex-col z-10 transition-all">
            <button 
              onClick={() => setMissionsOpen(false)} 
              className="absolute top-4 right-4 p-1.5 bg-[#3E2723] hover:bg-[#2D1B19] text-white rounded-full transition-colors z-20 shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2 sm:p-4 flex-1">
              <Missions />
            </div>
          </div>
        </div>
      )}

      {/* Modal Thành tựu */}
      {isAchievementsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setAchievementsOpen(false)} />
          <div className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-y-auto border-4 border-[#8D6E63] dark:border-[#3C2E27] shadow-2xl flex flex-col z-10 p-6 sm:p-8 transition-all">
            <button 
              onClick={() => setAchievementsOpen(false)} 
              className="absolute top-4 right-4 p-2 bg-[#3E2723] hover:bg-[#2D1B19] text-white rounded-full transition-colors z-20 shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <AchievementsModal />
          </div>
        </div>
      )}

      {/* Modal Túi đồ */}
      {isInventoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setInventoryOpen(false)} />
          <div className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-4xl h-[85vh] rounded-3xl overflow-y-auto border-4 border-[#8D6E63] dark:border-[#3C2E27] shadow-2xl flex flex-col z-10 transition-all">
            <button 
              onClick={() => setInventoryOpen(false)} 
              className="absolute top-4 right-4 p-2 bg-[#3E2723] hover:bg-[#2D1B19] text-white rounded-full transition-colors z-20 shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2 sm:p-4 flex-1">
              <Inventory />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

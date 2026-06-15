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
                className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 group"
             >
                <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                   <Home className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-black leading-normal uppercase tracking-tight">Trang Chủ</span>
             </button>

             {/* Danh Sách */}
             <button 
                onClick={() => { onClose(); navigate('/danh-sach'); }}
                className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 group"
             >
                <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                   <List className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-black leading-normal uppercase tracking-tight">Danh Sách</span>
             </button>

             {/* Thư Viện */}
             <button 
                onClick={() => { onClose(); navigate('/thu-vien'); }}
                className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 group"
             >
                <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                   <Library className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-black leading-normal uppercase tracking-tight">Thư Viện</span>
             </button>

             {/* Cửa Hàng */}
             <button 
                onClick={() => { onClose(); setStoreOpen(true); }}
                className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 group"
             >
                <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                   <ShoppingBag className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-black leading-normal uppercase tracking-tight">Cửa Hàng</span>
             </button>

             {/* Nhiệm Vụ */}
             <button 
                onClick={() => { onClose(); setMissionsOpen(true); }}
                className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 relative group"
             >
                <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                   <ClipboardList className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-black leading-normal uppercase tracking-tight">Nhiệm Vụ</span>
                {claimableMissions > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8D6E63] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#5D4037] border-[2px] border-[#FFFDF9] dark:border-[#251E1B]"></span>
                  </span>
                )}
             </button>

             {/* Thành Tựu */}
             <button 
                onClick={() => { onClose(); setAchievementsOpen(true); }}
                className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 group"
             >
                <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                   <Trophy className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <span className="text-xs font-black leading-normal uppercase tracking-tight">Thành Tựu</span>
              </button>

              {/* Tài Khoản */}
              <button 
                 onClick={() => { onClose(); navigate('/tai-khoan'); }}
                 className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 relative group"
              >
                 <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                    <User className="w-5 h-5 text-[#8D6E63]" />
                 </div>
                 <span className="text-xs font-black leading-normal uppercase tracking-tight">Hồ Sơ</span>
                 {hasLevelUpRewards && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8D6E63] opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#5D4037] border-[2px] border-[#FFFDF9] dark:border-[#251E1B]"></span>
                    </span>
                 )}
              </button>

             {/* Quản Trị (Optional) */}
             {isLoggedIn && (email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') && (
                <button 
                   onClick={() => { onClose(); navigate('/admin'); }}
                   className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 group"
                >
                   <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                      <ShieldCheck className="w-5 h-5 text-[#8D6E63]" />
                   </div>
                   <span className="text-xs font-black leading-normal uppercase tracking-tight">Quản Trị</span>
                </button>
             )}

             {/* Tài khoản - Đăng Nhập / Đăng Xuất Tile */}
             {isLoggedIn ? (
                <button 
                   onClick={() => { onClose(); handleLogout(); }}
                   className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 group"
                >
                   <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                      <LogOut className="w-5 h-5 text-[#8D6E63]" />
                   </div>
                   <span className="text-xs font-black leading-normal uppercase tracking-tight">Đăng Xuất</span>
                </button>
             ) : (
                <button 
                   onClick={() => { onClose(); handleLogin(); }}
                   className="bg-[#FFFDF9] hover:bg-[#E6D8C9] text-[#3E2723] dark:bg-[#251E1B] dark:hover:bg-[#312622] dark:text-[#ECE5DC] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] active:translate-y-1 active:shadow-none transition-all p-4 rounded-3xl flex flex-col items-center justify-center text-center gap-2 group"
                >
                   <div className="w-10 h-10 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center group-hover:scale-105 transition-transform border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30">
                      <User className="w-5 h-5 text-[#8D6E63]" />
                   </div>
                   <span className="text-xs font-black leading-normal uppercase tracking-tight">Đăng Nhập</span>
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
    <div className="text-[#3E2723] dark:text-[#ECE5DC] flex-1 flex flex-col h-full">
      {/* Title Header */}
      <div className="mb-4 text-center border-b-[3px] border-[#3E2723] dark:border-[#5D4037] pb-4 w-full shrink-0">
          <Trophy className="w-10 h-10 text-[#8D6E63] mx-auto mb-1 drop-shadow" />
          <h2 className="text-xl font-black uppercase tracking-widest font-sans">Khu Thành Tựu</h2>
          <p className="text-xs text-[#6D4C41] dark:text-[#A1887F] mt-1 font-bold">
            Đạt các cột mốc danh giá để nhận quà tặng ({unlockedAchievements.length}/{ACHIEVEMENTS_LIST.length})
          </p>
      </div>

      {/* Category Carousel / Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b-[3px] border-[#3E2723]/20 dark:border-[#5D4037]/40 max-w-full scrollbar-none shrink-0 scroll-smooth">
        {ACHIEVEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 border-[3px] shrink-0",
              activeCategory === cat.id
                ? "bg-[#E6D8C9] border-[#3E2723] text-[#3E2723] dark:bg-[#C29D70] dark:border-[#4E342E] dark:text-[#181311] shadow-[0_3px_0_0_#3E2723] dark:shadow-[0_3px_0_0_#0D0907] scale-105"
                : "bg-white text-[#8D6E63] border-[#3E2723]/30 dark:bg-[#1C1613] dark:border-[#5D4037]/50 dark:text-[#A1887F] hover:bg-[#EFEBE9]/40 hover:border-[#3E2723]/80"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[50vh]">
        {filteredAchievements.length === 0 ? (
          <div className="text-center py-10 text-stone-400 text-xs font-bold font-mono">
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
                  "p-4 rounded-2xl border-[3px] transition-all duration-200 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer",
                  isClaimed 
                    ? "bg-[#EFEBE9]/40 border-[#3E2723]/45 opacity-75 dark:bg-[#2C221D]/30 dark:border-[#5D4037]/55 shadow-[1px_1px_0_0_#3E2723]"
                    : isUnlocked 
                      ? "bg-[#FFFDF9] border-[#8D6E63] shadow-[1px_1px_0_0_#8D6E63] dark:bg-[#2C221D] dark:border-[#D7CCC8]/80 dark:shadow-[1px_1px_0_0_#0D0907] hover:-translate-y-0.5" 
                      : "bg-[#FFFDF9] border-[#3E2723] shadow-[1px_1px_0_0_#3E2723] dark:bg-[#1E1815] dark:border-[#4E342E] dark:shadow-[1px_1px_0_0_#0D0907] hover:-translate-y-0.5"
                )}
              >
                {/* Background Sparkle for Unlocked */}
                {isUnlocked && !isClaimed && (
                  <div className="absolute top-0 right-0 p-1.5 bg-[#8D6E63] text-white border-b-[3px] border-l-[3px] border-[#3E2723] rounded-bl-xl font-bold">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "p-1.5 rounded-lg border-[2px] border-[#3E2723] text-white",
                      isClaimed ? "bg-stone-400" : isUnlocked ? "bg-[#8D6E63]" : "bg-[#A1887F]"
                    )}>
                      {isClaimed ? <CheckCircle className="w-3.5 h-3.5" /> : isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </span>
                    <h4 className="font-black text-sm text-[#3E2723] dark:text-[#ECE5DC]">{ach.name}</h4>
                    
                    {/* Rewards badge */}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black border-[2px] border-[#3E2723] uppercase tracking-wider",
                      ach.goldenReward > 0 ? "bg-[#D7CCC8] dark:bg-[#5D4037]/60 text-[#3E2723] dark:text-[#E6D8C9]" : "bg-[#EFEBE9] dark:bg-[#1C1613] text-[#5D4037] dark:text-[#A1887F]"
                    )}>
                      {ach.rewardText}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#5D4037] dark:text-[#D7CCC8]">{ach.description}</p>

                  {/* Progress bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-stone-500 font-bold mb-1">
                      <span>TIẾN TRÌNH</span>
                      <span className="font-black font-mono">{progress} / {ach.progressTarget} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-[#EFEBE9] dark:bg-[#1A1412] h-4 rounded-full overflow-hidden border-[3px] border-[#3E2723] dark:border-[#5D4037] shadow-[inset_0_2px_0_0_rgba(0,0,0,0.1)]">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isUnlocked ? "bg-[#8D6E63]" : "bg-[#A1887F]"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Area Action Button */}
                <div className="flex items-center shrink-0 min-w-[100px] justify-end" onClick={(e) => e.stopPropagation()}>
                  {isClaimed ? (
                    <span className="text-xs font-black text-stone-400 flex items-center gap-1.5 border-[2px] border-dashed border-stone-300 rounded-lg px-2.5 py-1">
                      <CheckCircle className="w-4 h-4 text-stone-400" />
                      ĐÃ NHẬN
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => claimAchievement(ach.id)}
                      className="w-full md:w-auto bg-[#8D6E63] hover:bg-[#5D4037] text-white font-black text-xs py-2 px-4 rounded-xl border-[3px] border-[#3E2723] shadow-[0_3px_0_0_#3E2723] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      NHẬN QUÀ
                    </button>
                  ) : (
                    <span className="text-xs font-black text-[#A1887F] dark:text-stone-400 flex items-center gap-1.5 border-[2px] border-dashed border-stone-300 rounded-lg px-2.5 py-1">
                      <Lock className="w-3.5 h-3.5" />
                      CHƯA MỞ
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
    <div className="min-h-screen bg-transparent text-[#3E2723] flex flex-col font-sans">
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

      <header className="sticky top-0 z-30 bg-[#8D6E63] dark:bg-[#2C221D] text-[#FDF6EC] border-b-[6px] border-[#3E2723] dark:border-[#4E342E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#5D4037] hover:bg-[#4E342E] active:translate-y-1 transition-all outline-none border-[3px] border-[#3E2723] shadow-[0_2px_0_0_#3E2723] text-white relative"
            title="Menu Tiện Ích"
          >
            <Menu className="w-6 h-6" />
            {utilityMenuHasRedDot && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D7CCC8] opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8D6E63] border-2 border-[#3E2723]"></span>
              </span>
            )}
          </button>
        </div>

        <div className="font-extrabold tracking-widest text-2xl cursor-pointer text-[#FDF6EC] drop-shadow-[1px_1px_0_#3E2723]" onClick={() => navigate('/')}>
          CHOCOATL
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2.5 bg-[#5D4037] text-white hover:bg-[#4E342E] rounded-xl transition-all flex items-center justify-center cursor-pointer outline-none border-[3px] border-[#3E2723] shadow-[0_2px_0_0_#3E2723] active:translate-y-1 active:shadow-none"
            title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
          >
            {theme === 'light' ? <Moon className="w-[20px] h-[20px]" /> : <Sun className="w-[20px] h-[20px]" />}
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm font-medium">
                <span className="bg-[#EFEBE9] dark:bg-[#2C221D] text-[#3E2723] dark:text-[#ECE5DC] px-3 py-1.5 rounded-xl text-xs font-black border-2 border-[#3E2723] dark:border-[#ECE5DC] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#ECE5DC]">Lv. {level || 1}</span>
                <span className="bg-[#FDF6EC] dark:bg-[#1A1412] px-3 py-1.5 rounded-xl text-[#5D4037] dark:text-[#D7CCC8] border-2 border-[#8D6E63] dark:border-[#8D6E63] shadow-[0_2px_0_0_#8D6E63] dark:shadow-[0_2px_0_0_#8D6E63] font-black text-xs">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : choco} Choco</span>
                <span className="bg-[#D7CCC8] dark:bg-[#3E2723] text-[#5D4037] dark:text-[#D4AF37] border-2 border-[#5D4037] dark:border-[#D4AF37] shadow-[0_2px_0_0_#5D4037] dark:shadow-[0_2px_0_0_#D4AF37] font-black px-3 py-1.5 rounded-xl text-xs">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : goldenChoco} Gchoco</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2.5 bg-[#5D4037] text-white hover:bg-[#4E342E] rounded-xl transition-all flex items-center justify-center cursor-pointer outline-none border-[3px] border-[#3E2723] shadow-[0_2px_0_0_#3E2723] active:translate-y-1 active:shadow-none"
                  title="Thông báo"
                >
                  <Bell className="w-[22px] h-[22px]" />
                  {hasUnreadNotifs && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#8D6E63] rounded-full border-[2px] border-[#3E2723] animate-pulse" />
                  )}
                </button>

                {showNotifDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#FDF6EC] dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] rounded-2xl shadow-2xl border border-[#D7CCC8]/60 dark:border-[#5D4037] z-50 flex flex-col overflow-hidden max-h-[450px]">
                      <div className="p-4 border-b border-[#D7CCC8]/60 dark:border-[#5D4037] bg-[#F5E6D3]/40 dark:bg-[#251E1B]/50 flex items-center justify-between">
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
                          <div className="p-8 text-center text-sm text-stone-400 italic">
                             Không có thông báo nào.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={cn(
                                "p-3.5 hover:bg-[#F5E6D3]/30 dark:hover:bg-[#2C221D] transition-colors cursor-pointer flex gap-3 items-start text-xs sm:text-sm text-left font-normal",
                                !notif.isRead ? "bg-[#FDF6EC] dark:bg-[#1E1815] font-semibold text-[#3E2723] dark:text-[#ECE5DC]" : "bg-[#FDF6EC]/60 dark:bg-[#1A1412]/80 opacity-80 text-stone-600 dark:text-stone-400"
                              )}
                            >
                              <div className="w-2 h-2 rounded-full shrink-0 mt-1.5 bg-[#8D6E63] opacity-95" style={{ visibility: notif.isRead ? 'hidden' : 'visible' }} />
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
                                <span className="text-[10px] text-stone-400 font-mono block mt-1">{formatRelativeTime(notif.createdAt)}</span>
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
                <div className="flex items-center gap-2 bg-[#5D4037] px-3 py-1.5 rounded-xl transition-all relative group border-[3px] border-[#3E2723] shadow-[0_2px_0_0_#3E2723] hover:bg-[#4E342E] active:translate-y-1 active:shadow-none">
                   <UserAvatar 
                     avatarUrl={avatarUrl} 
                     equippedAccessory={equippedAccessory}
                     accessoryPosition={accessoryPosition}
                     className="w-8 h-8 rounded-lg" 
                     fallbackIconSizeClass="w-5 h-5" 
                     borderClass="border-2 border-[#3E2723]"
                   />
                   <span className="hidden sm:inline font-bold text-white tracking-wide" style={{ color: getTitleColor(activeTitle) || undefined }}>{displayName}</span>
                </div>
                <div className="absolute right-0 top-full mt-3 w-48 bg-[#FDF6EC] dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] rounded-2xl shadow-[0_2px_0_0_#3E2723] border-2 border-[#3E2723] dark:border-[#5D4037] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden">
                   <div className="px-4 py-3 border-b-[3px] border-[#3E2723] dark:border-[#5D4037] mb-1 bg-white dark:bg-black/20">
                      <div className="flex items-center gap-1.5 mb-1">
                         <p className="font-extrabold truncate text-base" style={{ color: getTitleColor(activeTitle) || undefined }}>{displayName}</p>
                         <span className="px-2 py-0.5 bg-[#8D6E63] text-white text-[10px] font-black rounded-lg border-2 border-[#3E2723]">Lv. {level || 1}</span>
                      </div>
                      <p className="font-mono text-[10px] opacity-70 truncate">{uid}</p>
                   </div>
                   <button className="flex items-center text-sm font-bold gap-3 px-4 py-3 hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] text-left transition-colors border-b-2 border-transparent hover:border-[#D7CCC8]" onClick={() => navigate('/tai-khoan')}>
                     <User className="w-5 h-5" />
                     <span>Hồ sơ & Cài đặt</span>
                   </button>
                   {(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') && (
                     <button className="flex items-center text-sm font-bold gap-3 px-4 py-3 hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] text-left text-[#5D4037] dark:text-[#A1887F] transition-colors border-b-2 border-transparent hover:border-[#D7CCC8]" onClick={() => navigate('/admin')}>
                       <Key className="w-5 h-5" />
                       <span>Quản lý Truyện</span>
                     </button>
                   )}
                   <button onClick={handleLogout} className="flex items-center text-sm font-bold gap-3 px-4 py-3 hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] text-left text-[#3E2723] dark:text-[#ECE5DC] transition-colors">
                     <LogOut className="w-5 h-5" />
                     <span>Đăng xuất</span>
                   </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="bg-[#FFFDF9] dark:bg-[#1E1815] text-[#3E2723] dark:text-[#ECE5DC] px-5 py-2.5 rounded-xl text-sm font-black transition-all border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] hover:bg-[#FDF6EC] dark:hover:bg-[#2C221D] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none tracking-wide uppercase"
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
          <div className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-4xl h-[85vh] rounded-3xl overflow-y-auto border-2 border-[#3E2723] shadow-[0_2px_0_0_#3E2723] dark:border-[#5D4037] shadow-2xl flex flex-col z-10 transition-all">
            <button 
              onClick={() => setStoreOpen(false)} 
              className="absolute top-4 right-4 p-2 bg-[#FDF6EC] hover:bg-[#E6D8C9] border-[3px] border-[#3E2723] shadow-[0_3px_0_0_#3E2723] text-[#3E2723] rounded-xl active:translate-y-0.5 active:shadow-none transition-all z-20"
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
          <div className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-3xl h-[85vh] rounded-3xl overflow-y-auto border-2 border-[#3E2723] shadow-[0_2px_0_0_#3E2723] dark:border-[#5D4037] shadow-2xl flex flex-col z-10 transition-all">
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
          <div className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-y-auto border-2 border-[#3E2723] shadow-[0_2px_0_0_#3E2723] dark:border-[#5D4037] shadow-2xl flex flex-col z-10 p-6 sm:p-8 transition-all">
            <button 
              onClick={() => setAchievementsOpen(false)} 
              className="absolute top-4 right-4 p-2 bg-[#FDF6EC] hover:bg-[#E6D8C9] border-[3px] border-[#3E2723] shadow-[0_3px_0_0_#3E2723] text-[#3E2723] rounded-xl active:translate-y-0.5 active:shadow-none transition-all z-20"
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
          <div className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-4xl h-[85vh] rounded-3xl overflow-y-auto border-2 border-[#3E2723] shadow-[0_2px_0_0_#3E2723] dark:border-[#5D4037] shadow-2xl flex flex-col z-10 transition-all">
            <button 
              onClick={() => setInventoryOpen(false)} 
              className="absolute top-4 right-4 p-2 bg-[#FDF6EC] hover:bg-[#E6D8C9] border-[3px] border-[#3E2723] shadow-[0_3px_0_0_#3E2723] text-[#3E2723] rounded-xl active:translate-y-0.5 active:shadow-none transition-all z-20"
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

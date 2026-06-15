import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalChat } from '../components/GlobalChat';
import { NewsFeed } from '../components/NewsFeed';
import { useStore } from '../store';
import { CalendarCheck, ClipboardList, ShoppingBag, Trophy, Star, BookOpen, Flame, User, PackageOpen, Library } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { UserAvatar } from '../components/UserAvatar';
import { format } from 'date-fns';
import { getWeeklyId } from '../types/achievements';

export function Home() {
  const navigate = useNavigate();
  const { checkIn, isLoggedIn, uid, unlockAchievement, unlockedAchievements, missions, claimedAchievements, setMissionsOpen, setAchievementsOpen, setStoreOpen, setInventoryOpen, lastCheckInDate, checkInStreak, getTitleColor, lastFreeStreakRecoveryMonth, activeStreakProtection, ownedStreakTickets, theme } = useStore();
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isCheckedInToday = lastCheckInDate === todayStr;
  
  const hasUnclaimedMissions = isCheckedInToday && missions.some(m => m.completed && !m.claimed);
  const hasUnclaimedAchievements = isCheckedInToday && unlockedAchievements.some(id => !claimedAchievements.includes(id));
  const [bxhTab, setBxhTab] = useState<'day' | 'week'>('week');
  const [stories, setStories] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topActiveUsers, setTopActiveUsers] = useState<any[]>([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  useEffect(() => {
    const qStories = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(10));
    const unsubStories = onSnapshot(qStories, (snap) => {
      setStories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(collection(db, 'users'), orderBy('choco', 'desc'), limit(15));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((u: any) => u.email?.toLowerCase() !== 'cucnau01@gmail.com');
      setTopUsers(users.slice(0, 10));
    });

    const qActiveUsers = query(collection(db, 'users'), orderBy('activePoints', 'desc'), limit(15));
    const unsubActiveUsers = onSnapshot(qActiveUsers, (snap) => {
      const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((u: any) => u.email?.toLowerCase() !== 'cucnau01@gmail.com');
      setTopActiveUsers(users.slice(0, 10));
    });

    return () => {
      unsubStories();
      unsubUsers();
      unsubActiveUsers();
    };
  }, []);

  // Auto award Choco Đáng Yêu achievement is now handled centrally in _ensureActiveWeekCalculations
  // when week physically transitions.

  const handleCheckInBtnClick = () => {
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập để điểm danh!");
      return;
    }
    setShowCheckInModal(true);
  };

  const performCheckIn = () => {
    checkIn();
    alert("Điểm danh thành công! Kiểm tra nhiệm vụ để xem phần thưởng.");
  };

  return (
    <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6 relative">
      {/* Check-In Modal Overlay */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FFFDF9] rounded-3xl max-w-sm w-full p-6 relative border-2 border-[#3E2723] shadow-[0_2px_0_0_#3E2723] flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowCheckInModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#FDF6EC] hover:bg-[#E6D8C9] border-[3px] border-[#3E2723] shadow-[0_3px_0_0_#3E2723] text-[#3E2723] rounded-xl active:translate-y-0.5 active:shadow-none transition-all">×</button>
            <div className="w-16 h-16 bg-[#F5E6D3] text-[#8D6E63] rounded-2xl flex items-center justify-center mb-4 transform -rotate-6 border-2 border-[#D7CCC8]">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#3E2723] uppercase tracking-tight mb-2 text-center">Điểm Danh Hàng Ngày</h2>
            <p className="text-sm text-stone-600 font-medium text-center mb-6">Hãy điểm danh mỗi ngày để nhận <strong className="text-[#8D6E63]">Choco</strong>!</p>
            
            {/* Streak Bar */}
            {(() => {
              const phases = [
                { min: 1, max: 1, reward: 1 },
                { min: 2, max: 3, reward: 2 },
                { min: 4, max: 6, reward: 3 },
                { min: 7, max: 10, reward: 4 },
                { min: 11, max: 15, reward: 5 },
                { min: 16, max: 21, reward: 6 },
                { min: 22, max: 28, reward: 7 },
                { min: 29, max: 36, reward: 8 },
                { min: 37, max: 45, reward: 9 },
                { min: 46, max: Infinity, reward: 10 }
              ];
              
              const activeStreak = checkInStreak || 0;
              let nextCheckInStreak = isCheckedInToday ? activeStreak : activeStreak + 1;
              
              // Check if broken
              let isBroken = false;
              let isProtected = false;
              if (!isCheckedInToday && lastCheckInDate) {
                const diffDays = Math.round(Math.abs(new Date(todayStr).getTime() - new Date(lastCheckInDate).getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 1) {
                   const missedDays = diffDays - 1;
                   let remaining = missedDays;
                   const currentMonth = format(new Date(), 'yyyy-MM');
                   
                   if (lastFreeStreakRecoveryMonth !== currentMonth) {
                      remaining -= 1;
                   }
                   
                   if (remaining <= 0) {
                      isProtected = true;
                   } else if ((ownedStreakTickets || 0) >= remaining) {
                      isProtected = true;
                   } else {
                      isBroken = true;
                   }
                }
              }
              
              if (isBroken) nextCheckInStreak = 1;

              const currentPhaseIndex = phases.findIndex(p => nextCheckInStreak >= p.min && nextCheckInStreak <= p.max);
              const currentPhase = currentPhaseIndex >= 0 ? phases[currentPhaseIndex] : phases[phases.length - 1];
              
              let nextPhase = phases[phases.length - 1];
              if (currentPhaseIndex < phases.length - 1) {
                nextPhase = phases[currentPhaseIndex + 1];
              }

              const progressStart = currentPhase.min;
              const progressEnd = currentPhase.max === Infinity ? nextCheckInStreak + 1 : currentPhase.max; 
              const currentProgress = nextCheckInStreak;
              
              const segments = progressEnd - progressStart + 1;
              const filledSegments = currentProgress - progressStart + 1;

              return (
                <div className="w-full bg-[#FDF6EC] p-4 rounded-2xl border border-[#F5E6D3] mb-6 flex flex-col gap-3">
                  <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Chuỗi: <span className="text-xl font-black text-[#3E2723]">{activeStreak}</span> ngày</span>
                      {isProtected && <span className="text-[10px] font-bold text-[#5D4037] bg-[#F5E6D3] px-2 py-0.5 rounded px-2 animate-pulse uppercase tracking-widest">Đang giữ chuỗi</span>}
                      {isBroken && activeStreak > 0 && <span className="text-[10px] font-bold text-[#8D6E63] animate-pulse">Chuỗi đã đứt!</span>}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#EFDCD5] shadow-inner mb-1 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                          <CalendarCheck className="w-12 h-12" />
                      </div>
                      <p className="text-xs text-stone-500 font-bold mb-1">{isCheckedInToday ? 'Hôm Nay Nhận:' : 'Nếu Điểm Danh Hôm Nay:'}</p>
                      <p className="text-2xl font-black text-[#8D6E63]">+{currentPhase.reward} <span className="text-sm font-bold text-[#3E2723]">Choco</span></p>
                      
                      {currentPhase.max !== Infinity ? (
                          <div className="mt-3 flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] text-stone-500 font-bold">
                              <span>Giai đoạn: {currentPhase.min} - {currentPhase.max} ngày</span>
                              <span>{filledSegments} / {segments}</span>
                            </div>
                            <div className="flex-1 flex gap-1 h-2">
                              {[...Array(Math.min(segments, 15))].map((_, i) => (
                                  <div key={i} className={`flex-1 rounded-full ${i < filledSegments ? 'bg-[#8D6E63]' : 'bg-[#D7CCC8]/30'}`} />
                              ))}
                            </div>
                          </div>
                      ) : (
                          <div className="mt-3 text-[10px] text-[#8D6E63] font-bold">Mức thưởng tối đa!</div>
                      )}
                  </div>

                  {currentPhase.max !== Infinity && (
                    <div className="flex justify-center items-center">
                        <span className="text-[11px] font-bold text-[#8D6E63] bg-[#F5E6D3] px-3 py-1 rounded-full">
                          Mục Tiêu Tiếp Theo: Ngày {nextPhase.min} (+{nextPhase.reward} Choco)
                        </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <button 
              onClick={performCheckIn}
              disabled={isCheckedInToday}
              className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest transition-all ${
                isCheckedInToday 
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed hidden' 
                : 'bg-[#8D6E63] text-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-[#5D4037]'
              }`}
            >
              {isCheckedInToday ? 'Đã Điểm Danh' : 'Điểm Danh Ngay'}
            </button>
            {isCheckedInToday && (
              <p className="text-sm font-bold text-[#8D6E63] mt-2 bg-[#F5E6D3] px-4 py-2 rounded-lg border border-[#D7CCC8] w-full text-center">Bạn đã điểm danh hôm nay!</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Rankings and Top Rich Users */}
        <section className="flex-[1.5] flex flex-col gap-6">
           <div className="bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-[3px] border-[#3E2723] p-5 shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-3 bg-[#E6D8C9] dark:bg-[#3C2E27] border-b-[3px] border-[#3E2723] dark:border-[#4E342E]" />
              <div className="flex justify-between items-center mb-4 mt-2">
                 <h2 className="font-black text-lg border-l-[6px] border-[#3E2723] dark:border-[#D7CCC8] pl-3 uppercase tracking-widest text-[#3E2723] dark:text-[#ECE5DC] drop-shadow-[1px_1px_0_#D7CCC8] dark:drop-shadow-[1px_1px_0_#1A1412]">
                   Bảng Xếp Hạng Truyện
                 </h2>
                 <div className="flex text-[10px] font-bold gap-3">
                   <button onClick={() => setBxhTab('day')} className={`uppercase transition-colors ${bxhTab === 'day' ? 'text-[#3E2723] dark:text-[#ECE5DC] underline decoration-2 underline-offset-4' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}>NGÀY</button>
                   <button onClick={() => setBxhTab('week')} className={`uppercase transition-colors ${bxhTab === 'week' ? 'text-[#3E2723] dark:text-[#ECE5DC] underline decoration-2 underline-offset-4' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}>TUẦN</button>
                 </div>
              </div>
              <div className="space-y-3">
                 {stories.length === 0 && <p className="text-stone-400 italic text-sm text-center py-4">Chưa có truyện nào.</p>}
                 {[...stories].sort((a,b) => {
                    const viewA = bxhTab === 'day' ? (a.dailyViews?.[todayStr] || 0) : (a.weeklyViews?.[getWeeklyId()] || 0);
                    const viewB = bxhTab === 'day' ? (b.dailyViews?.[todayStr] || 0) : (b.weeklyViews?.[getWeeklyId()] || 0);
                    return viewB - viewA;
                 }).slice(0, 3).map((story, i) => {
                    const views = bxhTab === 'day' ? (story.dailyViews?.[todayStr] || 0) : (story.weeklyViews?.[getWeeklyId()] || 0);
                    return (
                    <div key={story.id} className="group flex items-center gap-4 p-3 bg-[#FDF6EC] dark:bg-[#1C1613] rounded-2xl border-2 border-[#F5E6D3] dark:border-[#5D4037] cursor-pointer hover:border-[#8D6E63] dark:hover:border-[#C29D70] hover:shadow-[0_2px_0_0_#8D6E63] dark:hover:shadow-[0_2px_0_0_#C29D70] active:translate-y-[2px] active:shadow-none transition-all duration-200 mb-2 shadow-[0_2px_0_0_#F5E6D3] dark:shadow-[0_2px_0_0_#0D0907] min-w-0" onClick={() => navigate(`/truyen/${story.id}`)}>
                       <span className="font-black text-xl italic text-[#8D6E63] dark:text-[#C29D70] w-6 transition-transform group-hover:scale-110 shrink-0">0{i + 1}</span>
                       <img src={story.coverUrl} alt={story.title} className="w-10 h-14 object-cover rounded-xl opacity-90 border border-transparent dark:border-[#5D4037] transition-transform group-hover:scale-105 duration-300 shrink-0" />
                       <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-sm text-[#3E2723] dark:text-[#ECE5DC] group-hover:text-[#8D6E63] dark:group-hover:text-[#BF9F95] transition-colors truncate">{story.title}</p>
                          <p className="text-[10px] opacity-70 italic dark:text-stone-400">Lượt đọc: {views.toLocaleString()}</p>
                       </div>
                       <span className="text-xs font-bold text-[#8D6E63] dark:text-[#C29D70] shrink-0">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(views)} 🔥</span>
                    </div>
                 )})}
              </div>
           </div>

            {/* Bảng Xếp Hạng Tích Cực */}
            <div className="bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-[3px] border-[#3E2723] p-5 shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-3 bg-[#E6D8C9] dark:bg-[#3C2E27] border-b-[3px] border-[#3E2723] dark:border-[#4E342E]" />
               <div className="flex justify-between items-center mb-4 mt-2">
                  <h2 className="font-black text-lg border-l-[6px] border-[#3E2723] pl-3 uppercase tracking-widest flex items-center gap-2 text-[#3E2723] dark:text-[#ECE5DC] drop-shadow-[1px_1px_0_#D7CCC8] dark:drop-shadow-[1px_1px_0_#1A1412]">
                    <Flame className="w-5 h-5 text-[#8D6E63] animate-pulse" />
                    Bảng Xếp Hạng Tích Cực
                  </h2>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topActiveUsers.length === 0 && <p className="text-stone-400 italic text-sm text-center py-4 col-span-2">Chưa có dữ liệu tích cực.</p>}
                  {topActiveUsers.map((u, i) => {
                     const isMe = u.id === uid;
                     const isTop3 = i < 3;
                     return (
                        <div key={u.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 shadow-[1px_1px_0_0_#3E2723] hover:-translate-y-0.5 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all cursor-pointer ${isMe ? 'bg-[#F5E6D3] border-[#8D6E63] dark:bg-[#322420] dark:border-[#8D6E63]' : 'bg-[#FDF6EC] border-[#3E2723] hover:border-[#8D6E63] dark:bg-[#1C1613] dark:border-[#5D4037] dark:hover:border-[#C29D70]'}`}>
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              i === 0 ? 'bg-[#5D4037] text-white ring-2 ring-[#8D6E63] dark:bg-[#D7CCC8] dark:text-[#3E2723] dark:ring-[#F5E6D3]' :
                              i === 1 ? 'bg-[#8D6E63] text-white ring-2 ring-[#D7CCC8] dark:bg-[#A1887F] dark:text-[#211B18] dark:ring-[#D7CCC8]' :
                              i === 2 ? 'bg-[#A1887F] text-white ring-2 ring-[#D7CCC8] dark:bg-[#8D6E63] dark:text-[#211B18] dark:ring-[#A1887F]' :
                              'bg-[#E6D8C9] text-[#5D4037] dark:bg-[#3C2E27] dark:text-[#D7CCC8]'
                           }`}>
                              {i + 1}
                           </div>
                            <UserAvatar 
                               avatarUrl={u.avatarUrl} 
                               equippedAccessory={u.equippedAccessory}
                               accessoryPosition={u.accessoryPosition} 
                               className="w-10 h-10" 
                               fallbackIconSizeClass="w-5 h-5 text-[#8D6E63]" 
                               borderClass="border-2 border-[#D7CCC8] dark:border-[#5D4037]"
                            />
                           <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate flex items-center gap-1" style={{ color: getTitleColor(u.activeTitle) || (theme === 'dark' ? '#ECE5DC' : '#3E2723') }}>
                                 {u.displayName}
                                 {isMe && <span className="text-[9px] text-[#5D4037] dark:text-[#ECE5DC] shrink-0">(Bạn)</span>}
                              </div>
                              <div className="text-[10px] text-[#8D6E63] font-extrabold flex items-center gap-0.5">
                                 <Flame className="w-3.5 h-3.5 shrink-0" />
                                 {(u.activePoints || 0).toLocaleString()} điểm
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-[3px] border-[#3E2723] p-5 shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-3 bg-[#E6D8C9] dark:bg-[#3C2E27] border-b-[3px] border-[#3E2723] dark:border-[#4E342E]" />
               <h2 className="font-black text-lg border-l-[6px] border-[#3E2723] pl-3 mb-4 mt-2 uppercase tracking-widest text-[#3E2723] dark:text-[#ECE5DC] drop-shadow-[1px_1px_0_#D7CCC8] dark:drop-shadow-[1px_1px_0_#1A1412]">
                Đại Gia Choco
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {topUsers.length === 0 && <p className="text-stone-400 italic text-sm text-center py-4">Chưa có dữ liệu.</p>}
                 {topUsers.map((u, i) => {
                    const isMe = u.id === uid;
                    return (
                       <div key={u.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 shadow-[1px_1px_0_0_#3E2723] hover:-translate-y-0.5 hover:shadow-[1.5px_1.5px_0_0_#3E2723] transition-all cursor-pointer ${isMe ? 'bg-[#F5E6D3] border-[#8D6E63] dark:bg-[#322420] dark:border-[#8D6E63]' : 'bg-[#FDF6EC] border-[#3E2723] hover:border-[#8D6E63] dark:bg-[#1C1613] dark:border-[#5D4037] dark:hover:border-[#C29D70]'}`}>
                           <UserAvatar 
                              avatarUrl={u.avatarUrl} 
                              equippedAccessory={u.equippedAccessory}
                              accessoryPosition={u.accessoryPosition} 
                              className="w-10 h-10" 
                              fallbackIconSizeClass="w-5 h-5 text-[#8D6E63]" 
                              borderClass="border-2 border-[#D7CCC8] dark:border-[#5D4037]"
                           />
                          <div className="flex-1 min-w-0">
                             <div className="text-xs font-bold truncate flex items-center gap-1" style={{ color: getTitleColor(u.activeTitle) || (theme === 'dark' ? '#ECE5DC' : '#3E2723') }}>
                                <span>Top {i + 1}: {u.displayName}</span>
                                {isMe && <span className="text-[9px] text-[#5D4037] dark:text-[#ECE5DC] shrink-0">(Bạn)</span>}
                             </div>
                             <div className="text-[10px] text-[#A1887F] dark:text-stone-400 font-semibold">{u.choco?.toLocaleString()} Choco</div>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

           <div className="bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-[3px] border-[#3E2723] p-5 shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-3 bg-[#E6D8C9] dark:bg-[#3C2E27] border-b-[3px] border-[#3E2723] dark:border-[#4E342E]" />
              <h2 className="font-black text-lg border-l-[6px] border-[#3E2723] pl-3 mb-4 mt-2 uppercase tracking-widest flex items-center gap-2 text-[#3E2723] dark:text-[#ECE5DC] drop-shadow-[1px_1px_0_#D7CCC8] dark:drop-shadow-[1px_1px_0_#1A1412]">
                <BookOpen className="w-5 h-5 text-[#8D6E63]" />
                Truyện Mới Cập Nhật
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {stories.length === 0 && <p className="text-stone-400 italic text-sm text-center py-4">Chưa có truyện mới.</p>}
                 {stories.slice(0, 6).map((story) => (
                    <div key={story.id} className="group flex gap-3.5 p-3 bg-[#FDF6EC] dark:bg-[#1C1613] rounded-2xl border-[3px] border-[#F5E6D3] dark:border-[#5D4037] cursor-pointer hover:border-[#8D6E63] dark:hover:border-[#C29D70] transition-all hover:-translate-y-1 shadow-[0_2px_0_0_#F5E6D3] dark:shadow-[0_2px_0_0_#0D0907] hover:shadow-[0_2px_0_0_#8D6E63] dark:hover:shadow-[0_2px_0_0_#C29D70] active:translate-y-1 active:shadow-none" onClick={() => navigate(`/truyen/${story.id}`)}>
                       <img src={story.coverUrl} alt={story.title} className="w-12 h-16 object-cover rounded-xl shadow-xs border border-white/50 dark:border-black/50 shrink-0 group-hover:scale-105 transition-all duration-300" />
                       <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                          <div>
                             <p className="font-extrabold text-sm text-[#3E2723] hover:text-[#8D6E63] transition-colors truncate">
                                {story.title}
                                {story.completed && <span className="inline-block text-[8px] bg-[#D7CCC8] text-[#5D4037] px-1 py-0.5 rounded uppercase tracking-widest font-bold ml-1.5 align-middle">Full</span>}
                             </p>
                             <p className="text-[10px] text-stone-500 italic truncate mt-0.5">Tác giả: {story.author || 'Ẩn danh'}</p>
                          </div>
                          <div className="flex gap-1 items-center flex-wrap">
                             {story.genres && story.genres.slice(0, 2).map((g: string, i: number) => (
                                <span key={i} className="text-[8px] font-bold bg-white/60 dark:bg-[#1A1412] text-[#8D6E63] dark:text-[#A1887F] border border-[#F5E6D3] dark:border-[#5D4037] px-1.5 py-0.5 rounded-md uppercase tracking-tight truncate max-w-[60px]">{g}</span>
                             ))}
                             {(!story.genres || story.genres.length === 0) && (
                                <span className="text-[8px] font-bold bg-white/60 dark:bg-[#1A1412] text-[#8D6E63] dark:text-[#A1887F] border border-[#F5E6D3] dark:border-[#5D4037] px-1.5 py-0.5 rounded-md uppercase tracking-tight">Ký Sự</span>
                             )}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>
 
        {/* Right Column: Toolbox & Global Chat side-by-side on desktop */}
        <section className="flex-1 flex flex-col gap-6">
           {/* Hộp Công Cụ (Toolbox widget styled exactly like HoyoLab's compact squares) */}
           <div className="bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-[3px] border-[#3E2723] p-5 shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-3 bg-[#E6D8C9] dark:bg-[#3C2E27] border-b-[3px] border-[#3E2723] dark:border-[#4E342E]" />
              <h2 className="font-black text-lg border-l-[6px] border-[#3E2723] pl-3 mb-4 mt-2 text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-widest drop-shadow-[1px_1px_0_#D7CCC8] dark:drop-shadow-[1px_1px_0_#1A1412]">
                 Hộp Công Cụ
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                 <button onClick={handleCheckInBtnClick} className="flex flex-col items-center justify-center text-center p-3 bg-[#FDF6EC] dark:bg-[#2C221D] rounded-2xl transition-all group border-2 border-[#D7CCC8]/40 dark:border-[#5D4037] shadow-[0_3px_0_0_#D7CCC8] dark:shadow-[0_3px_0_0_#0D0907] hover:-translate-y-1 hover:border-[#8D6E63] dark:hover:border-[#C29D70] active:translate-y-1 active:shadow-none cursor-pointer">
                    <div className="relative w-12 h-12 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center mb-1.5 border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30 group-hover:scale-105 transition-transform">
                       <CalendarCheck className="w-5 h-5 text-[#8D6E63]" />
                       {(!lastCheckInDate || lastCheckInDate !== format(new Date(), 'yyyy-MM-dd')) && isLoggedIn && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8D6E63] opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#5D4037] border-[2px] border-[#FDF6EC] dark:border-[#2C221D]"></span>
                          </span>
                       )}
                    </div>
                    <span className="font-bold text-[11px] text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide group-hover:text-[#5D4037] dark:group-hover:text-[#FFF] transition-colors">Điểm danh</span>
                 </button>
 
                 <button onClick={() => setMissionsOpen(true)} className="flex flex-col items-center justify-center text-center p-3 bg-[#FDF6EC] dark:bg-[#2C221D] rounded-2xl transition-all group border-2 border-[#D7CCC8]/40 dark:border-[#5D4037] shadow-[0_3px_0_0_#D7CCC8] dark:shadow-[0_3px_0_0_#0D0907] hover:-translate-y-1 hover:border-[#8D6E63] dark:hover:border-[#C29D70] active:translate-y-1 active:shadow-none cursor-pointer">
                    <div className="relative w-12 h-12 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center mb-1.5 border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30 group-hover:scale-105 transition-transform">
                       <ClipboardList className="w-5 h-5 text-[#8D6E63]" />
                       {hasUnclaimedMissions && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#5D4037] rounded-full border-[2px] border-[#FDF6EC] dark:border-[#2C221D]" />}
                    </div>
                    <span className="font-bold text-[11px] text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide group-hover:text-[#5D4037] dark:group-hover:text-[#FFF] transition-colors">Nhiệm vụ</span>
                 </button>
 
                 <button onClick={() => setStoreOpen(true)} className="flex flex-col items-center justify-center text-center p-3 bg-[#FDF6EC] dark:bg-[#2C221D] rounded-2xl transition-all group border-2 border-[#D7CCC8]/40 dark:border-[#5D4037] shadow-[0_3px_0_0_#D7CCC8] dark:shadow-[0_3px_0_0_#0D0907] hover:-translate-y-1 hover:border-[#8D6E63] dark:hover:border-[#C29D70] active:translate-y-1 active:shadow-none cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center mb-1.5 border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30 group-hover:scale-105 transition-transform">
                       <ShoppingBag className="w-5 h-5 text-[#8D6E63]" />
                    </div>
                    <span className="font-bold text-[11px] text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide group-hover:text-[#5D4037] dark:group-hover:text-[#FFF] transition-colors">Cửa hàng</span>
                 </button>
 
                 <button onClick={() => setAchievementsOpen(true)} className="flex flex-col items-center justify-center text-center p-3 bg-[#FDF6EC] dark:bg-[#2C221D] rounded-2xl transition-all group border-2 border-[#D7CCC8]/40 dark:border-[#5D4037] shadow-[0_3px_0_0_#D7CCC8] dark:shadow-[0_3px_0_0_#0D0907] hover:-translate-y-1 hover:border-[#8D6E63] dark:hover:border-[#C29D70] active:translate-y-1 active:shadow-none cursor-pointer">
                    <div className="relative w-12 h-12 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center mb-1.5 border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30 group-hover:scale-105 transition-transform">
                       <Trophy className="w-5 h-5 text-[#8D6E63]" />
                       {hasUnclaimedAchievements && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#5D4037] rounded-full border-[2px] border-[#FDF6EC] dark:border-[#2C221D]" />}
                    </div>
                    <span className="font-bold text-[11px] text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide group-hover:text-[#5D4037] dark:group-hover:text-[#FFF] transition-colors">Thành tựu</span>
                 </button>

                 <button onClick={() => navigate('/thu-vien')} className="flex flex-col items-center justify-center text-center p-3 bg-[#FDF6EC] dark:bg-[#2C221D] rounded-2xl transition-all group border-2 border-[#D7CCC8]/40 dark:border-[#5D4037] shadow-[0_3px_0_0_#D7CCC8] dark:shadow-[0_3px_0_0_#0D0907] hover:-translate-y-1 hover:border-[#8D6E63] dark:hover:border-[#C29D70] active:translate-y-1 active:shadow-none cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center mb-1.5 border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30 group-hover:scale-105 transition-transform">
                       <Library className="w-5 h-5 text-[#8D6E63]" />
                    </div>
                    <span className="font-bold text-[11px] text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide group-hover:text-[#5D4037] dark:group-hover:text-[#FFF] transition-colors">Thư viện</span>
                 </button>

                 <button onClick={() => setInventoryOpen(true)} className="flex flex-col items-center justify-center text-center p-3 bg-[#FDF6EC] dark:bg-[#2C221D] rounded-2xl transition-all group border-2 border-[#D7CCC8]/40 dark:border-[#5D4037] shadow-[0_3px_0_0_#D7CCC8] dark:shadow-[0_3px_0_0_#0D0907] hover:-translate-y-1 hover:border-[#8D6E63] dark:hover:border-[#C29D70] active:translate-y-1 active:shadow-none cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-[#F5E6D3] dark:bg-[#3C2E27]/40 flex items-center justify-center mb-1.5 border-[2px] border-[#D7CCC8] dark:border-[#5D4037]/30 group-hover:scale-105 transition-transform">
                       <PackageOpen className="w-5 h-5 text-[#8D6E63]" />
                    </div>
                    <span className="font-bold text-[11px] text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide group-hover:text-[#5D4037] dark:group-hover:text-[#FFF] transition-colors">Túi đồ</span>
                 </button>
              </div>
           </div>
 
           {/* News Feed */}
           <NewsFeed />

           {/* Global Chat */}
           <div className="flex-1 flex flex-col min-h-[400px]">
              <GlobalChat />
           </div>
        </section>
      </div>
    </div>
  );
}

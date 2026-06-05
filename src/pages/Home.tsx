import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalChat } from '../components/GlobalChat';
import { useStore } from '../store';
import { CalendarCheck, ClipboardList, ShoppingBag, Trophy, Star, BookOpen, Flame, User } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function Home() {
  const navigate = useNavigate();
  const { checkIn, isLoggedIn, uid, unlockAchievement, unlockedAchievements, missions, claimedAchievements, setMissionsOpen, setAchievementsOpen, setStoreOpen, lastCheckInDate } = useStore();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const isCheckedInToday = lastCheckInDate === todayStr;
  
  const hasUnclaimedMissions = isCheckedInToday && missions.some(m => m.completed && !m.claimed);
  const hasUnclaimedAchievements = isCheckedInToday && unlockedAchievements.some(id => !claimedAchievements.includes(id));
  const [bxhTab, setBxhTab] = useState<'day' | 'week'>('week');
  const [stories, setStories] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topActiveUsers, setTopActiveUsers] = useState<any[]>([]);

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

  // Auto award Choco Đáng Yêu achievement to Top 3 active users at the end of the week
  useEffect(() => {
    const now = new Date();
    // Sunday is 0. Only award at the end of the week.
    if (now.getDay() === 0) {
      if (isLoggedIn && uid && topActiveUsers.length > 0) {
        const top3Uids = topActiveUsers.slice(0, 3).map(u => u.id);
        if (top3Uids.includes(uid) && !unlockedAchievements.includes('choco_cute')) {
          unlockAchievement('choco_cute');
        }
      }
    }
  }, [topActiveUsers, isLoggedIn, uid, unlockedAchievements, unlockAchievement]);

  const handleCheckIn = () => {
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập để điểm danh!");
      return;
    }
    checkIn();
    alert("Điểm danh thành công! Kiểm tra nhiệm vụ để xem phần thưởng.");
  };

  return (
    <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Rankings and Top Rich Users */}
        <section className="flex-[1.5] flex flex-col gap-6">
           <div className="bg-white rounded-2xl shadow-sm border border-[#D7CCC8] p-5">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="font-bold text-lg border-l-4 border-[#3E2723] pl-3 uppercase tracking-tighter">
                   Bảng Xếp Hạng Truyện
                 </h2>
                 <div className="flex text-[10px] font-bold gap-3">
                   <button onClick={() => setBxhTab('day')} className={`uppercase transition-colors ${bxhTab === 'day' ? 'text-[#3E2723] underline decoration-2 underline-offset-4' : 'text-gray-400 hover:text-gray-600'}`}>NGÀY</button>
                   <button onClick={() => setBxhTab('week')} className={`uppercase transition-colors ${bxhTab === 'week' ? 'text-[#3E2723] underline decoration-2 underline-offset-4' : 'text-gray-400 hover:text-gray-600'}`}>TUẦN</button>
                 </div>
              </div>
              <div className="space-y-3">
                 {stories.length === 0 && <p className="text-gray-400 italic text-sm text-center py-4">Chưa có truyện nào.</p>}
                 {[...stories].sort((a,b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 3).map((story, i) => (
                    <div key={story.id} className="flex items-center gap-4 p-2 bg-[#FDF6EC] rounded-lg border border-[#F5E6D3] cursor-pointer hover:border-[#D7CCC8] transition-colors" onClick={() => navigate(`/truyen/${story.id}`)}>
                       <span className="font-black text-xl italic text-[#8D6E63] w-6">0{i + 1}</span>
                       <img src={story.coverUrl} alt={story.title} className="w-10 h-14 object-cover rounded opacity-90" />
                       <div className="flex-1">
                          <p className="font-bold text-sm text-[#3E2723]">{story.title}</p>
                          <p className="text-[10px] opacity-70 italic">Lượt đọc: {(story.viewCount || 0).toLocaleString()}</p>
                       </div>
                       <span className="text-xs font-bold text-[#8D6E63]">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)} 🔥</span>
                    </div>
                 ))}
              </div>
           </div>

            {/* Bảng Xếp Hạng Tích Cực */}
            <div className="bg-[#FFFDF9] rounded-2xl shadow-sm border border-orange-200 p-5 ring-1 ring-orange-50">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg border-l-4 border-orange-500 pl-3 uppercase tracking-tighter flex items-center gap-2 text-[#3E2723]">
                    <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                    Bảng Xếp Hạng Tích Cực
                  </h2>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topActiveUsers.length === 0 && <p className="text-gray-400 italic text-sm text-center py-4 col-span-2">Chưa có dữ liệu tích cực.</p>}
                  {topActiveUsers.map((u, i) => {
                     const isMe = u.id === uid;
                     const isTop3 = i < 3;
                     return (
                        <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isMe ? 'bg-orange-50 border-orange-300' : 'bg-white border-[#F5E6D3] hover:border-orange-200'}`}>
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              i === 0 ? 'bg-yellow-400 text-yellow-950 ring-2 ring-yellow-200' :
                              i === 1 ? 'bg-slate-300 text-slate-950 ring-2 ring-slate-100' :
                              i === 2 ? 'bg-amber-600 text-amber-50 ring-2 ring-amber-100' :
                              'bg-orange-100 text-orange-900'
                           }`}>
                              {i + 1}
                           </div>
                           <div className="w-10 h-10 rounded-full bg-[#3E2723] text-white flex items-center justify-center overflow-hidden shrink-0 border border-orange-200">
                              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User className="w-5 h-5 text-orange-200" />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-[#3E2723] truncate flex items-center gap-1">
                                 {u.displayName}
                                 {isMe && <span className="text-[9px] text-orange-600 shrink-0">(Bạn)</span>}
                                 {/* Crown removed as requested */}
                              </div>
                              <div className="text-[10px] text-orange-500 font-extrabold flex items-center gap-0.5">
                                 <Flame className="w-3.5 h-3.5 shrink-0" />
                                 {(u.activePoints || 0).toLocaleString()} điểm
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#D7CCC8] p-5">
               <h2 className="font-bold text-lg border-l-4 border-[#D4AF37] pl-3 mb-4 uppercase tracking-tighter">
                Đại Gia Choco
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {topUsers.length === 0 && <p className="text-gray-400 italic text-sm text-center py-4">Chưa có dữ liệu.</p>}
                 {topUsers.map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3 bg-[#FDF6EC] p-3 rounded-xl border border-[#F5E6D3]">
                       <div className="w-10 h-10 rounded-full bg-[#3E2723] text-white flex items-center justify-center overflow-hidden shrink-0">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#3E2723] truncate">Top {i + 1}: {u.displayName}</div>
                          <div className="text-[10px] text-[#A1887F] font-semibold">{u.choco?.toLocaleString()} Choco</div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-[#D7CCC8] p-5">
              <h2 className="font-bold text-lg border-l-4 border-[#8D6E63] pl-3 mb-4 uppercase tracking-tighter flex items-center gap-2 text-[#3E2723]">
                <BookOpen className="w-5 h-5 text-[#8D6E63]" />
                Truyện Mới Cập Nhật
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {stories.length === 0 && <p className="text-gray-400 italic text-sm text-center py-4">Chưa có truyện mới.</p>}
                 {stories.slice(0, 6).map((story) => (
                    <div key={story.id} className="group flex gap-3.5 p-3 bg-[#FDF6EC] rounded-2xl border border-[#F5E6D3] cursor-pointer hover:border-[#D7CCC8] transition-all hover:translate-y-[-1px] shadow-xs active:scale-98" onClick={() => navigate(`/truyen/${story.id}`)}>
                       <img src={story.coverUrl} alt={story.title} className="w-12 h-16 object-cover rounded-xl shadow-xs border border-white/50 shrink-0 group-hover:scale-105 group-hover:border-[#8D6E63]/60 transition-all duration-300" />
                       <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                          <div>
                             <p className="font-extrabold text-sm text-[#3E2723] hover:text-[#8D6E63] transition-colors truncate">{story.title}</p>
                             <p className="text-[10px] text-gray-500 italic truncate mt-0.5">Tác giả: {story.author || 'Ẩn danh'}</p>
                          </div>
                          <div className="flex gap-1 items-center flex-wrap">
                             {story.genres && story.genres.slice(0, 2).map((g: string, i: number) => (
                                <span key={i} className="text-[8px] font-bold bg-white/60 text-[#8D6E63] border border-[#F5E6D3] px-1.5 py-0.5 rounded-md uppercase tracking-tight truncate max-w-[60px]">{g}</span>
                             ))}
                             {(!story.genres || story.genres.length === 0) && (
                                <span className="text-[8px] font-bold bg-white/60 text-[#8D6E63] border border-[#F5E6D3] px-1.5 py-0.5 rounded-md uppercase tracking-tight">Ký Sự</span>
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
           <div className="bg-white rounded-2xl border border-[#D7CCC8] p-5 shadow-sm">
              <h2 className="font-bold text-sm border-l-4 border-[#8D6E63] pl-2.5 mb-4 text-[#3E2723] uppercase tracking-wider">
                 Hộp Công Cụ
              </h2>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={handleCheckIn} className="flex flex-col items-center justify-center text-center p-3 hover:bg-[#FDF6EC] rounded-2xl transition-all group border border-transparent hover:border-[#D7CCC8]/40">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-1.5 border border-orange-100/40 group-hover:scale-105 transition-transform">
                       <CalendarCheck className="w-5 h-5 text-[#8D6E63]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-[#3E2723] uppercase tracking-tight group-hover:text-[#8D6E63] transition-colors">Điểm danh</span>
                 </button>
 
                 <button onClick={() => setMissionsOpen(true)} className="flex flex-col items-center justify-center text-center p-3 hover:bg-[#FDF6EC] rounded-2xl transition-all group border border-transparent hover:border-[#D7CCC8]/40">
                    <div className="relative w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-1.5 border border-amber-100/40 group-hover:scale-105 transition-transform">
                       <ClipboardList className="w-5 h-5 text-[#8D6E63]" />
                       {hasUnclaimedMissions && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                    </div>
                    <span className="font-extrabold text-[11px] text-[#3E2723] uppercase tracking-tight group-hover:text-[#8D6E63] transition-colors">Nhiệm vụ</span>
                 </button>
 
                 <button onClick={() => setStoreOpen(true)} className="flex flex-col items-center justify-center text-center p-3 hover:bg-[#FDF6EC] rounded-2xl transition-all group border border-transparent hover:border-[#D7CCC8]/40">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0F0] flex items-center justify-center mb-1.5 border border-red-100/40 group-hover:scale-105 transition-transform">
                       <ShoppingBag className="w-5 h-5 text-[#8D6E63]" />
                    </div>
                    <span className="font-extrabold text-[11px] text-[#3E2723] uppercase tracking-tight group-hover:text-[#8D6E63] transition-colors">Cửa hàng</span>
                 </button>
 
                 <button onClick={() => setAchievementsOpen(true)} className="flex flex-col items-center justify-center text-center p-3 hover:bg-[#FDF6EC] rounded-2xl transition-all group border border-transparent hover:border-[#D7CCC8]/40">
                    <div className="relative w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-1.5 border border-yellow-100/40 group-hover:scale-105 transition-transform">
                       <Trophy className="w-5 h-5 text-[#8D6E63]" />
                       {hasUnclaimedAchievements && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                    </div>
                    <span className="font-extrabold text-[11px] text-[#3E2723] uppercase tracking-tight group-hover:text-[#8D6E63] transition-colors">Thành tựu</span>
                 </button>
              </div>
           </div>
 
           {/* Global Chat */}
           <div className="flex-1 flex flex-col min-h-[400px]">
              <GlobalChat />
           </div>
        </section>
      </div>
    </div>
  );
}

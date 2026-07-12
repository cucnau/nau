import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, ExternalLink, ChevronRight, Users, MessageSquare, Heart, Sparkles, ArrowLeft, Award, ShieldAlert, Book, Compass, Scroll, Crown, Swords, Feather, Shield, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

export function ThaiTuNghinNamTheme(props: ThemeProps) {
  const {
    story, chapters, comments, activeTab, setActiveTab,
    chapterPage, setChapterPage, chapterSortDesc, setChapterSortDesc, CHAPTERS_PER_PAGE,
    showGiftModal, setShowGiftModal, giftAmount, setGiftAmount, giftMessage, setGiftMessage, handleGiftSubmit,
    commentText, setCommentText, submittingComment, handleSendComment,
    isLoggedIn, savedStories, handleSaveToggle, choco, navigate,
    profilesCache = {}, getTitleColor, uid
  } = props;

  const {
    equippedStickerComment, stickerPositionComment, displayName: storeDisplayName,
    avatarUrl: storeAvatarUrl, activeTitle: storeActiveTitle,
    equippedAccessory: storeEquippedAccessory, accessoryPosition: storeAccessoryPosition
  } = useStore();

  const totalGiftedChoco = comments.filter(c => c.type === 'choco_gift').reduce((acc, curr) => acc + (curr.giftAmount || 0), 0);

  // Grouping chapters by specific volumes defined by user
  const [selectedVolume, setSelectedVolume] = useState(0);

  // Sort chapters first
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = a.orderIndex !== undefined ? a.orderIndex : parseFloat(a.title?.match(/\d+/)?.[0] || '0');
    const bNum = b.orderIndex !== undefined ? b.orderIndex : parseFloat(b.title?.match(/\d+/)?.[0] || '0');
    return chapterSortDesc ? bNum - aNum : aNum - bNum;
  });

  const volumesConfig = [
    {
      id: 0,
      title: "Quyển một",
      subtitle: "Đêm đông sống lại",
      filter: (chap: any) => chap.order >= 0 && chap.order <= 10,
      rangeText: "Chương 1 - 11"
    },
    {
      id: 1,
      title: "Quyển hai",
      subtitle: "Sóng ngầm Binh bộ",
      filter: (chap: any) => chap.order >= 11 && chap.order <= 20,
      rangeText: "Chương 12 - 21"
    }
  ];

  const currentVolumeConfig = volumesConfig.find(v => v.id === selectedVolume) || volumesConfig[0];
  const volumeChapters = sortedChapters.filter(currentVolumeConfig.filter);

  return (
    <div className="thai-tu-theme-container bg-[#14100e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#382b26]/60 via-[#14100e] to-[#14100e] min-h-screen text-[#d7cac1] font-serif selection:bg-[#741611] selection:text-[#d7cac1] pb-24 relative overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .thai-tu-theme-container, 
        .thai-tu-theme-container *, 
        .thai-tu-theme-container .font-sans, 
        .thai-tu-theme-container .font-mono, 
        .thai-tu-theme-container .font-serif {
          font-family: 'Cormorant Garamond', Georgia, serif !important;
        }
        
        /* Royal ancient Chinese borders */
        .royal-box {
          position: relative;
          background: rgba(20, 16, 14, 0.95);
          border: 1px solid rgba(116, 22, 17, 0.45);
          box-shadow: inset 0 0 30px rgba(116, 22, 17, 0.12), 0 12px 36px rgba(0, 0, 0, 0.65);
        }
        
        .royal-inner-border {
          position: absolute;
          inset: 5px;
          border: 1px solid rgba(171, 143, 101, 0.18);
          pointer-events: none;
        }

        /* Delicate gold-crimson ornate corners - Royal Chinese meander and cloud fusion */
        .royal-corners::before {
          content: "";
          position: absolute;
          inset: -1px;
          pointer-events: none;
          z-index: 5;
          background-image: 
            /* Top-Left: Imperial court meander & refined cloud accent */
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v2H2v38H0V0zm6 6h28v2H8v26H6V6zm6 6h16v2H14v14h-2V12zm6 6h4v2h-2v2h-2v-4z' fill='%23741611'/%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23ab8f65'/%3E%3Ccircle cx='18' cy='10' r='1' fill='%23ab8f65'/%3E%3Ccircle cx='10' cy='18' r='1' fill='%23ab8f65'/%3E%3C/svg%3E"),
            /* Top-Right */
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M40 0v40h-2V2H2V0h38zm-6 6v28h-2V8H12V6h22zm-6 6v16h-2V14H20v-2h12zm-6 6v4h-2v-2h-2v-2h4z' fill='%23741611'/%3E%3Ccircle cx='30' cy='10' r='1.5' fill='%23ab8f65'/%3E%3Ccircle cx='22' cy='10' r='1' fill='%23ab8f65'/%3E%3Ccircle cx='30' cy='18' r='1' fill='%23ab8f65'/%3E%3C/svg%3E"),
            /* Bottom-Left */
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 40V0h2v38h38v2H0zm6-6V6h2v26h26v2H6zm6-6V12h2v14h14v2H12zm6-6v-4h2v2h2v2h-4z' fill='%23741611'/%3E%3Ccircle cx='10' cy='30' r='1.5' fill='%23ab8f65'/%3E%3Ccircle cx='18' cy='30' r='1' fill='%23ab8f65'/%3E%3Ccircle cx='10' cy='22' r='1' fill='%23ab8f65'/%3E%3C/svg%3E"),
            /* Bottom-Right */
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M40 40H0v-2h38V2h2v38zm-6-6H6v-2h26V12h2v22zm-6-6H12v-2h14V20h2v8zm-6-6h-4v-2h2v-2h2v4z' fill='%23741611'/%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23ab8f65'/%3E%3Ccircle cx='22' cy='30' r='1' fill='%23ab8f65'/%3E%3Ccircle cx='30' cy='22' r='1' fill='%23ab8f65'/%3E%3C/svg%3E");
          background-position: top left, top right, bottom left, bottom right;
          background-repeat: no-repeat;
          opacity: 0.95;
        }

        /* Gold accents for important cards */
        .gold-border-accent {
          border-color: rgba(116, 22, 17, 0.5) !important;
          background: linear-gradient(135deg, rgba(34, 28, 25, 0.9) 0%, rgba(20, 16, 14, 0.95) 100%);
        }

        /* Ancient slab effect for characters */
        .slab-card {
          position: relative;
          background: #171311;
          border: 1px solid rgba(116, 22, 17, 0.35);
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.8), 0 5px 15px rgba(0, 0, 0, 0.5);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slab-card:hover {
          border-color: #741611;
          transform: translateY(-3px);
          box-shadow: inset 0 0 25px rgba(116, 22, 17, 0.2), 0 12px 28px rgba(0, 0, 0, 0.7);
        }

        /* Royal Custom Scrollbar */
        .royal-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .royal-scroll::-webkit-scrollbar-track {
          background: #14100e;
        }
        .royal-scroll::-webkit-scrollbar-thumb {
          background: #741611;
          border-radius: 9px;
        }
        .royal-scroll::-webkit-scrollbar-thumb:hover {
          background: #8e1d17;
        }
      ` }} />
      
      {/* Background Royal Seal Motif decoration */}
      <div className="absolute top-36 left-0 right-0 h-[500px] pointer-events-none opacity-[0.03] flex justify-between px-16 select-none">
        <svg className="w-80 h-80" viewBox="0 0 100 100" fill="none" stroke="#d7cac1" strokeWidth="0.5">
          <circle cx="50" cy="50" r="46" />
          <path d="M 50 4 L 96 50 L 50 96 L 4 50 Z" />
          <rect x="25" y="25" width="50" height="50" strokeDasharray="2,2" />
          <circle cx="50" cy="50" r="20" />
        </svg>
        <svg className="w-80 h-80 transform rotate-45" viewBox="0 0 100 100" fill="none" stroke="#d7cac1" strokeWidth="0.5">
          <circle cx="50" cy="50" r="46" />
          <rect x="15" y="15" width="70" height="70" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      {/* STICKY TOP COURT BAR */}
      <div className="border-b-2 border-[#741611]/60 bg-gradient-to-r from-[#1b1715] via-[#473a36] to-[#1b1715] px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#741611]/15 hover:bg-[#741611]/30 text-[#d7cac1] text-xs font-sans font-bold tracking-[0.15em] border border-[#741611]/40 transition-all cursor-pointer group uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>LUI TRIỀU</span>
        </button>

        <div className="flex items-center gap-2 select-none">
          <div className="w-2 h-2 rounded-full bg-[#741611] animate-ping" />
          <span className="font-sans text-[10px] tracking-[0.25em] text-[#8c7b72] font-black uppercase hidden sm:inline">太子千秋万载</span>
        </div>

        <div className="text-right">
          <span className="font-sans text-[9px] tracking-[0.1em] text-[#8c7b72] uppercase font-bold">NGHÌN NĂM VẠN THUỞ</span>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto p-4 md:p-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PROFILE PANEL */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Main Book Emblem Frame */}
          <div className="royal-box royal-corners p-6 rounded-lg relative overflow-hidden flex flex-col items-center">
            <div className="royal-inner-border" />
            
            <div className="relative w-48 md:w-full max-w-[220px] aspect-[2/3] bg-[#14100e] overflow-hidden border border-[#741611]/45 rounded shadow-2xl mb-4 group">
              <img 
                src={story.coverUrl || 'https://via.placeholder.com/400x600'} 
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14100e]/95 via-transparent to-transparent opacity-80" />
            </div>

            <div className="text-center w-full z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#741611]/15 border border-[#741611]/45 text-[#d7cac1] text-[10px] font-sans font-bold tracking-[0.2em] mb-3 uppercase rounded">
                <Award className="w-3.5 h-3.5 text-[#741611]" />
                {story.completed ? 'VĨNH KẾT HOÀNG TRIỀU' : 'ĐANG CHẤP BÚT'}
              </div>
              <h1 className="text-2xl font-black text-[#d7cac1] tracking-wide mb-1.5 leading-snug">
                {story.title}
              </h1>
              <p className="text-xs text-[#8c7b72] tracking-[0.15em] uppercase font-sans font-bold italic mb-2">
                Ngự bút: {story.author}
              </p>
            </div>
          </div>

          {/* Stats card */}
          <div className="royal-box p-5 rounded-lg relative overflow-hidden">
            <div className="royal-inner-border" />
            <div className="absolute top-2 right-2 text-[#741611]/15 font-bold font-serif text-3xl select-none pointer-events-none">考</div>
            <h3 className="text-[11px] font-sans font-black tracking-[0.2em] text-[#8c7b72] uppercase mb-4 flex items-center gap-2 select-none border-b border-[#741611]/25 pb-2 z-10 relative">
              <Scroll className="w-4 h-4 text-[#741611]" /> SỔ GHI NGỰ THƯ
            </h3>
            <div className="grid grid-cols-2 gap-3 font-sans relative z-10">
              <div className="bg-[#14100e]/90 border border-[#741611]/25 p-3 text-center rounded">
                <span className="block text-[#d7cac1] text-lg font-black">{chapters.length}</span>
                <span className="text-[9px] text-[#8c7b72] font-black uppercase tracking-wider">SỐ HỒI</span>
              </div>
              <div className="bg-[#14100e]/90 border border-[#741611]/25 p-3 text-center rounded">
                <span className="block text-[#d7cac1] text-lg font-black">
                  {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}
                </span>
                <span className="text-[9px] text-[#8c7b72] font-black uppercase tracking-wider">LƯỢT DUYỆT SÁCH</span>
              </div>
              <div className="bg-[#14100e]/90 border border-[#741611]/25 p-3 text-center col-span-2 rounded">
                <span className="block text-[#741611] text-lg font-black">{totalGiftedChoco} Choco</span>
                <span className="text-[9px] text-[#8c7b72] font-black uppercase tracking-wider">CỐNG PHẨM QUÂN VƯƠNG</span>
              </div>
            </div>
          </div>

          {/* Verification / Blood Lineage Plot Widget */}
          <div className="royal-box p-5 rounded-lg relative overflow-hidden">
            <div className="royal-inner-border" />
            <div className="absolute top-2 right-2 text-[#741611]/15 font-bold font-serif text-3xl select-none pointer-events-none">血</div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#741611]/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-[11px] font-sans font-black tracking-[0.2em] text-[#741611] uppercase mb-2 flex items-center gap-2 select-none z-10 relative">
              <Shield className="w-4 h-4" /> BÍ MẬT HOÀNG TỘC
            </h3>
            <p className="text-xs text-[#8c7b72] leading-relaxed mb-3 z-10 relative">
              Mật bản ghi chép chi tiết về cuộc tráo đổi hoàng tộc. Thụ tôn quý là Thái tử thật bị đẩy ra chốn gian truân, sống lại thề quy hồi bảo tọa, trừng phạt kẻ giả mạo.
            </p>
            <div className="border border-[#741611]/30 bg-[#14100e]/95 p-3 rounded text-[11px] leading-relaxed font-serif text-[#d7cac1]/80 italic z-10 relative">
              "Máu đỏ nhỏ vào giọt nước trong, cốt nhục tương liên tất hòa một. Gian xảo đánh tráo nghìn năm, nay linh hồn quy bặc lập hoàng triều."
            </div>
          </div>

          {/* Quick Read Buttons */}
          <div className="flex flex-col gap-2">
            {chapters.length > 0 && (
              <button 
                onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${chapters[0].order + 1}`)}
                className="w-full py-3 bg-[#741611] text-[#d7cac1] hover:bg-[#8e1d17] font-sans font-bold tracking-[0.15em] uppercase text-xs rounded transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" /> MỞ SÁCH ĐỌC NGAY
              </button>
            )}
            <button 
              onClick={handleSaveToggle}
              className={`w-full py-3 font-sans font-bold tracking-[0.15em] uppercase text-xs rounded border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                savedStories.includes(story.id) 
                  ? 'bg-[#473a36]/35 border-[#473a36] text-[#d7cac1]' 
                  : 'bg-transparent border-[#473a36] text-[#8c7b72] hover:text-[#d7cac1] hover:border-[#741611]/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={savedStories.includes(story.id) ? "currentColor" : "none"} />
              {savedStories.includes(story.id) ? 'ĐÃ LƯU TÀNG THƯ CÁC' : 'THU VÀO TÀNG THƯ CÁC'}
            </button>
          </div>

        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Story Info Box */}
          <div className="royal-box royal-corners p-6 lg:p-8 rounded-lg relative overflow-hidden">
            <div className="royal-inner-border" />
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-20">
              {/* Decorative corner */}
              <svg viewBox="0 0 100 100" className="w-full h-full fill-[#741611]">
                <path d="M 100,0 L 100,100 L 90,100 L 90,10 L 0,10 L 0,0 Z" />
              </svg>
            </div>

            {/* Genres Tag */}
            <div className="flex flex-wrap gap-2 mb-6 z-10 relative">
              {story.genres?.map?.((g: string) => (
                <span 
                  key={g} 
                  className="bg-[#741611]/15 text-[#d7cac1] px-3 py-1 text-[10px] font-sans font-extrabold uppercase tracking-widest rounded border border-[#741611]/45"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Story Description */}
            <div className="mb-6 relative z-10">
              <div className="absolute top-0 right-0 text-[#741611]/10 font-bold font-serif text-3xl select-none pointer-events-none">卷</div>
              <h3 className="text-xs font-sans font-black tracking-[0.2em] text-[#741611] uppercase mb-3 select-none flex items-center gap-1.5">
                <Scroll className="w-4 h-4 text-[#741611]" /> ĐIỂN TÍCH KHỞI NGUYÊN
              </h3>
              <div className="text-[#d7cac1]/90 leading-relaxed text-[15px] font-serif pr-2 max-h-[320px] overflow-y-auto royal-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#741611 #221c19' }}>
                {story.description?.split('\n').map((para: string, idx: number) => {
                  const trimmed = para.trim();
                  if (!trimmed) return null;
                  return (
                    <p key={idx} className="indent-8 text-justify leading-relaxed mb-4">
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* RECOMMENDED STORIES - KHẢI TẤU TIẾN CỬ */}
            {story.recommendations && (
              <div className="border-t border-[#741611]/25 pt-5 mt-5 z-10 relative">
                <h4 className="text-[11px] font-sans font-black tracking-[0.25em] text-[#741611] uppercase mb-3 flex items-center gap-1.5 select-none">
                  <Scroll className="w-4 h-4 text-[#741611]" /> KHẢI TẤU TIẾN CỬ
                </h4>
                <div className="text-[13px] leading-relaxed text-[#d7cac1]/80 bg-[#14100e]/95 p-4 rounded border border-[#741611]/30 whitespace-pre-line font-serif italic relative">
                  <div className="absolute top-2 right-2 text-[#741611]/20 font-sans text-4xl select-none font-bold">薦</div>
                  {story.recommendations}
                </div>
              </div>
            )}
          </div>

          {/* IMMERSIVE CHARACTER DOSSIERS */}
          <div className="royal-box royal-corners p-6 rounded-lg relative overflow-hidden shadow-2xl">
            <div className="royal-inner-border" />
            {/* Elegant Background flourish */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#741611]/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xs font-sans font-black tracking-[0.25em] text-[#741611] uppercase mb-6 flex items-center gap-2 select-none border-b border-[#741611]/30 pb-2.5 z-10 relative">
              <Scroll className="w-4 h-4 text-[#741611]" /> HỒ SƠ NHÂN VẬT BẢN THẢO
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              
              {/* Uong Phu Thang (Thu) */}
              <div className="slab-card p-5 rounded-md relative overflow-hidden group">
                {/* Chinese characters watermarks */}
                <div className="absolute bottom-2 right-2 text-[#741611]/15 font-black text-4xl select-none font-serif tracking-widest pointer-events-none transition-all duration-300 group-hover:scale-110">
                  应浮昇
                </div>
                
                <div className="flex items-start gap-3 mb-4">
                  <div>
                    <h4 className="font-bold text-[#d7cac1] text-base font-serif tracking-wide">Ưng Phù Thăng</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] font-sans text-[#741611] font-black uppercase tracking-widest bg-[#741611]/15 border border-[#741611]/35 px-1.5 py-0.5 rounded inline-block">
                        Thái tử thật
                      </span>
                      <span className="text-[10px] font-sans text-[#741611] font-black uppercase tracking-widest bg-[#741611]/15 border border-[#741611]/35 px-1.5 py-0.5 rounded inline-block">
                        Thụ
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 text-[13px] text-[#d7cac1]/90 font-serif">
                  <div className="flex items-center gap-2 border-b border-[#741611]/15 pb-2">
                    <span className="text-[#8c7b72] w-16 text-[10px] font-sans uppercase tracking-wider">Vai trò:</span>
                    <span className="text-[#741611] font-bold">Thụ</span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-[#741611]/15 pb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#741611]" />
                    <span>Dồn sức xây dựng sự nghiệp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#741611]" />
                    <span>Âm hiểm tàn độc</span>
                  </div>
                </div>
              </div>

              {/* Thich Han Chu (Cong) */}
              <div className="slab-card p-5 rounded-md relative overflow-hidden group">
                {/* Chinese characters watermarks */}
                <div className="absolute bottom-2 right-2 text-[#8c7b72]/15 font-black text-4xl select-none font-serif tracking-widest pointer-events-none transition-all duration-300 group-hover:scale-110">
                  戚寒舟
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div>
                    <h4 className="font-bold text-[#d7cac1] text-base font-serif tracking-wide">Thích Hàn Chu</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] font-sans text-[#8c7b72] font-black uppercase tracking-widest bg-[#8c7b72]/15 border border-[#8c7b72]/35 px-1.5 py-0.5 rounded inline-block">
                        Quan võ lạnh lùng
                      </span>
                      <span className="text-[10px] font-sans text-[#8c7b72] font-black uppercase tracking-widest bg-[#8c7b72]/15 border border-[#8c7b72]/35 px-1.5 py-0.5 rounded inline-block">
                        Công
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-[13px] text-[#d7cac1]/90 font-serif">
                  <div className="flex items-center gap-2 border-b border-[#741611]/15 pb-2">
                    <span className="text-[#8c7b72] w-16 text-[10px] font-sans uppercase tracking-wider">Vai trò:</span>
                    <span className="text-[#8c7b72] font-bold">Công</span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-[#741611]/15 pb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8c7b72]" />
                    <span>Thuở thiếu thời từng là kiếm khách</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8c7b72]" />
                    <span>Tiêu dao tự tại</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* TABS SELECTOR (CHAPTERS & COMMENTS) */}
          <div className="flex border-b border-[#473a36] bg-[#1b1715]/40 rounded-t-lg overflow-hidden select-none">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex-1 py-3 font-sans font-black text-xs uppercase tracking-[0.2em] relative transition-all duration-300 ${
                activeTab === 'chapters' ? 'text-[#741611] bg-[#221c19]/60' : 'text-[#8c7b72] hover:text-[#d7cac1] bg-transparent'
              }`}
            >
              MỤC LỤC CHƯƠNG ({chapters.length})
              {activeTab === 'chapters' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#741611] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-3 font-sans font-black text-xs uppercase tracking-[0.2em] relative transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'comments' ? 'text-[#741611] bg-[#221c19]/60' : 'text-[#8c7b72] hover:text-[#d7cac1] bg-transparent'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> TẤU CHƯƠNG ĐÀM LUẬN ({comments.length})
              {activeTab === 'comments' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#741611] rounded-t-full" />
              )}
            </button>
          </div>

          {/* RENDER ACTIVE TAB */}
          <div className="border-x border-b border-[#473a36] bg-[#221c19]/20 p-5 rounded-b-xl">
            
            {activeTab === 'chapters' ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                
                {/* SELECTOR QUYỂN TRUYỆN CỔ KÍNH */}
                <div className="pb-5 border-b border-[#741611]/30 select-none">
                  <div className="flex items-center gap-2 mb-3">
                    <Feather className="w-4 h-4 text-[#741611]" />
                    <span className="text-[11px] font-sans font-black uppercase text-[#8c7b72] tracking-[0.2em]">
                      CHỌN CHI ĐỒNG THƯ QUYỂN:
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {volumesConfig.map((vol) => {
                      const isSelected = selectedVolume === vol.id;
                      return (
                        <button
                          key={vol.id}
                          onClick={() => setSelectedVolume(vol.id)}
                          className={`relative p-3 text-left rounded transition-all duration-300 border cursor-pointer overflow-hidden ${
                            isSelected
                              ? 'bg-[#2a1714] border-[#741611]/80 text-[#d7cac1] shadow-[0_0_15px_rgba(116,22,17,0.15)]'
                              : 'bg-[#1b1715]/80 border-[#473a36]/50 text-[#8c7b72] hover:text-[#d7cac1] hover:border-[#741611]/40'
                          }`}
                        >
                          {/* Inner corner decoration for selected Volume tab */}
                          {isSelected && (
                            <>
                              <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#741611]" />
                              <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#741611]" />
                              <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#741611]" />
                              <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#741611]" />
                            </>
                          )}
                          
                          <div className={`text-[10px] font-sans font-black uppercase tracking-widest ${isSelected ? 'text-[#741611]' : 'text-[#8c7b72]'}`}>
                            {vol.title}
                          </div>
                          <div className="font-serif text-sm font-bold text-[#d7cac1] mt-0.5 tracking-wide truncate">
                            {vol.subtitle}
                          </div>
                          <div className="text-[9px] font-sans text-[#8c7b72] mt-1 flex items-center justify-between">
                            <span />
                            {isSelected && <span className="text-[8px] tracking-wider px-1 bg-[#741611]/20 text-[#d7cac1] rounded">ĐANG XEM</span>}
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* NÚT CÒN TIẾP CỦA MỤC LỤC */}
                    <div className="relative p-3 text-left rounded border bg-[#14100e]/35 border-[#473a36]/20 text-[#473a36] select-none flex flex-col justify-center">
                      <div className="text-[10px] font-sans font-black uppercase tracking-widest text-[#473a36]/60">
                        HỒI SAU...
                      </div>
                      <div className="font-serif text-sm font-bold mt-0.5 text-[#473a36]/70 italic">
                        Đang mài mực viết tiếp
                      </div>
                      <div className="text-[9px] font-sans text-[#473a36]/50 mt-1">
                        Còn tiếp...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chapters list grid inside current selected Volume */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#741611 #1b1715' }}>
                  {volumeChapters.length > 0 ? (
                    volumeChapters.map((chap, i) => {
                      const absoluteIndex = chap.order + 1;
                      const recordCode = `THƯ QUYỂN · ${absoluteIndex.toString().padStart(3, '0')}`;
                      return (
                        <div 
                          key={chap.id} 
                          onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${chap.order + 1}`)}
                          className="bg-[#1b1715]/70 border border-[#473a36]/40 hover:border-[#741611] p-4 flex flex-col justify-between cursor-pointer group transition-all duration-300 rounded-lg relative"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-[#8c7b72] group-hover:text-[#741611] transition-colors uppercase">
                              {recordCode}
                            </span>
                            <span className="px-1.5 py-0.5 border border-[#473a36]/30 bg-[#473a36]/10 rounded text-[8px] font-sans font-semibold text-[#8c7b72] group-hover:text-[#d7cac1] transition-colors">
                              CHƯƠNG TRUYỆN
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-[#d7cac1] group-hover:text-white line-clamp-2 leading-snug mb-3 transition-colors">
                            {chap.title}
                          </h4>

                          <div className="flex items-center justify-between pt-2 border-t border-[#473a36]/20">
                            <span className="text-[9px] text-[#8c7b72] font-sans uppercase tracking-wider group-hover:text-[#d7cac1]/70 transition-colors">
                              CHI TIẾT CHƯƠNG
                            </span>
                            <span className="text-[9px] font-sans font-black uppercase tracking-wider text-[#741611] group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-0.5">
                              VÀO ĐỌC <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-10 font-serif text-[#8c7b72] italic text-sm">
                      Sách văn chương tiết chưa được ban hành.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                {/* Gifting Section */}
                <div className="border border-[#741611]/30 bg-[#741611]/5 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#741611]/15 rounded-full flex items-center justify-center text-[#741611]">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#d7cac1] text-xs uppercase tracking-wider">TIẾN CỐNG QUÂN VƯƠNG</h4>
                      <p className="text-[11px] text-[#8c7b72]">Dâng hiến Choco tiếp thêm động lực cho vị diện ngự bút.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGiftModal(true)}
                    className="px-4 py-2 bg-[#741611] text-[#d7cac1] hover:bg-[#8e1d17] text-[10px] font-sans font-black uppercase tracking-wider rounded transition-all duration-300 cursor-pointer"
                  >
                    DÂNG CỐNG PHẨM
                  </button>
                </div>

                {/* Submitting comments */}
                <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                  <h4 className="text-[11px] font-sans font-black tracking-[0.15em] text-[#8c7b72] uppercase select-none">
                    DÂNG SÁCH TẤU ĐÀM LUẬN
                  </h4>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={isLoggedIn ? "Nhập mật nghị, tấu văn đóng góp ý kiến..." : "Đăng nhập để dâng tấu văn thảo luận..."}
                    disabled={!isLoggedIn}
                    className="w-full p-3.5 rounded bg-[#1b1715]/90 border border-[#473a36] focus:border-[#741611] text-[#d7cac1] text-sm outline-none font-serif min-h-[90px] resize-none transition-all"
                  />
                  <div className="flex justify-end select-none">
                    <button
                      type="submit"
                      disabled={!isLoggedIn || !commentText.trim() || submittingComment}
                      className="px-5 py-2 bg-[#741611] text-[#d7cac1] hover:bg-[#8e1d17] disabled:bg-[#473a36]/30 disabled:text-[#8c7b72] border border-[#741611] text-[10px] font-sans font-black uppercase tracking-wider rounded transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                    >
                      DÂNG TẤU <Send className="w-3 h-3" />
                    </button>
                  </div>
                </form>

                {/* Comments feed */}
                <div className="space-y-4 pt-4 border-t border-[#473a36]/40 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#741611 #1b1715' }}>
                  {comments.length > 0 ? (
                    comments.map((comm) => {
                      const commDisplayName = profilesCache[comm.uid]?.displayName || comm.displayName || "Triều Thần Ẩn Danh";
                      const commAvatarUrl = profilesCache[comm.uid]?.avatarUrl || comm.avatarUrl;
                      const activeTitle = profilesCache[comm.uid]?.activeTitle;
                      
                      return (
                        <div key={comm.id} className="p-4 bg-[#1b1715]/80 border border-[#473a36]/30 rounded flex gap-3 relative">
                          <UserAvatar 
                            avatarUrl={commAvatarUrl} 
                            equippedAccessory={profilesCache[comm.uid]?.equippedAccessory || comm.equippedAccessory}
                            accessoryPosition={profilesCache[comm.uid]?.accessoryPosition || comm.accessoryPosition}
                            className="w-9 h-9 border border-[#473a36]" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1 select-none">
                              <span className="font-sans font-black text-xs text-[#d7cac1] hover:text-[#741611] transition-colors">
                                {commDisplayName}
                              </span>
                              <span className="text-[9px] font-sans text-[#8c7b72] font-semibold uppercase">
                                {comm.createdAt?.seconds ? format(new Date(comm.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : 'VỪA XONG'}
                              </span>
                            </div>
 
                            {activeTitle && (
                              <div className="mb-2 select-none">
                                <span className="text-[8px] font-sans font-black tracking-widest bg-[#741611]/20 text-[#d7cac1] border border-[#741611]/50 px-1.5 py-0.5 rounded uppercase">
                                  {activeTitle}
                                </span>
                              </div>
                            )}
 
                            {comm.type === 'choco_gift' ? (
                              <div className="mt-1 bg-[#741611]/15 border border-[#741611]/40 rounded-lg p-3 flex items-center gap-3 select-none">
                                <Gift className="w-4 h-4 text-[#741611]" />
                                <div className="text-xs">
                                  Đã dâng hiến cống vật quân vương <strong className="text-[#741611] font-bold">{comm.giftAmount} Choco</strong>
                                  {comm.giftMessage && <p className="italic text-[#8c7b72] mt-1">"{comm.giftMessage}"</p>}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm font-serif text-[#d7cac1]/90 leading-relaxed break-words whitespace-pre-wrap">
                                {comm.text}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 font-serif text-[#8c7b72] italic text-xs">
                      Án thư phẳng lặng, chưa có tấu chương thảo luận nào được dâng lên.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Briefcase, TrendingUp, MessageSquare, ArrowUpRight, Quote, ExternalLink, Activity, Shield, FileText, ChevronRight, BarChart2, DollarSign, Users, Award } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

const stockData = [
  { symbol: 'GIA NGOAN CORP (GNC)', price: '248.50', change: '+14.2%', up: true },
  { symbol: 'HOMER GROUP (HMG)', price: '102.15', change: '-4.8%', up: false },
  { symbol: 'CHOCO CAPITAL (CCI)', price: '520.40', change: '+8.3%', up: true },
  { symbol: 'SHELL PARTNERS (SPS)', price: '88.90', change: '+1.2%', up: true },
  { symbol: 'REBIRTH INDEX (RBI)', price: '1,420.00', change: '-2.5%', up: false },
];

export function HuongDanGiaNgoanTheme(props: ThemeProps) {
  const {
    story, chapters, comments, activeTab, setActiveTab,
    chapterPage, setChapterPage, chapterSortDesc, setChapterSortDesc, CHAPTERS_PER_PAGE,
    showGiftModal, setShowGiftModal, giftAmount, setGiftAmount, giftMessage, setGiftMessage, handleGiftSubmit,
    commentText, setCommentText, submittingComment, handleSendComment,
    isLoggedIn, savedStories, handleSaveToggle, choco, navigate,
    profilesCache = {}, getTitleColor, uid
  } = props;

  const {
    equippedStickerComment,
    stickerPositionComment,
    displayName: storeDisplayName,
    avatarUrl: storeAvatarUrl,
    activeTitle: storeActiveTitle,
    equippedAccessory: storeEquippedAccessory,
    accessoryPosition: storeAccessoryPosition
  } = useStore();

  const [activeSection, setActiveSection] = useState<string>('ban-khao-sat');
  const intersectingRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const sections = ['ban-khao-sat', 'lien-ket-de-xuat', 'ho-so-thuong-vu'].filter(id => {
      if (id === 'lien-ket-de-xuat' && !story.recommendations) return false;
      return true;
    });

    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -40% 0px',
      threshold: 0,
    };

    const determineActiveSection = () => {
      const activeIds = sections.filter(id => intersectingRef.current[id]);
      if (activeIds.length === 0) return;
      if (activeIds.length === 1) {
        setActiveSection(activeIds[0]);
        return;
      }
      
      let bestId = activeIds[0];
      let minDiff = Infinity;
      activeIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const diff = Math.abs(rect.top);
          if (diff < minDiff) {
            minDiff = diff;
            bestId = id;
          }
        }
      });
      setActiveSection(bestId);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        intersectingRef.current[entry.target.id] = entry.isIntersecting;
      });
      determineActiveSection();
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [story.recommendations]);

  const totalGiftedChoco = comments
    .filter(c => c.type === 'choco_gift')
    .reduce((acc, curr) => acc + (curr.giftAmount || 0), 0);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayedChapters = [...chapters]
    .sort((a, b) => {
      const aNum = a.orderIndex !== undefined ? a.orderIndex : parseFloat(a.title?.match(/\d+/)?.[0] || '0');
      const bNum = b.orderIndex !== undefined ? b.orderIndex : parseFloat(b.title?.match(/\d+/)?.[0] || '0');
      return chapterSortDesc ? bNum - aNum : aNum - bNum;
    })
    .slice(chapterPage * CHAPTERS_PER_PAGE, (chapterPage + 1) * CHAPTERS_PER_PAGE);

  return (
    <div className="bg-[#13120d] min-h-screen text-[#dbcec2] font-reading-garamond selection:bg-[#bbee1f] selection:text-[#13120d] pb-20 relative overflow-hidden">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        /* Custom scrollbar for transaction table */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #13120d;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2e2a63;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #695b7f;
        }
      `}</style>

      {/* Real-time Financial Stock Ticker (Business War theme) */}
      <div className="w-full bg-[#13120d] border-b border-[#2e2a63] py-2 overflow-hidden relative z-20 select-none border-t-2 border-[#bbee1f] font-sans">
        <div className="flex whitespace-nowrap animate-marquee items-center gap-12 text-[10px] tracking-widest text-[#dbcec2]/65">
          {Array.from({ length: 4 }).flatMap(() => stockData).map((stock, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-black text-white">{stock.symbol}</span>
              <span className="text-[#dbcec2]/90 font-mono">{stock.price} USD</span>
              <span className={stock.up ? "text-[#bbee1f] font-black" : "text-[#695b7f] font-black"}>
                {stock.up ? "▲" : "▼"} {stock.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Background Decor - Blueprint / Matrix Grid Layout */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
           style={{ backgroundImage: 'radial-gradient(#695b7f 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      <div className="absolute inset-0 pointer-events-none opacity-5"
           style={{ backgroundImage: 'linear-gradient(to right, #2e2a63 1px, transparent 1px), linear-gradient(to bottom, #2e2a63 1px, transparent 1px)', backgroundSize: '120px 120px' }} />
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#2e2a63] rounded-full blur-[200px] opacity-20 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#695b7f] rounded-full blur-[180px] opacity-15 pointer-events-none" />

      {/* Hero Section - Executive M&A Dossier Theme */}
      <div className="relative pt-8 lg:pt-16 pb-12 px-4 sm:px-6 border-b border-[#2e2a63]/50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-14 items-center lg:items-start relative z-10">
          
          {/* Cover Art - Embedded Security Display Frame */}
          <div className="w-56 lg:w-64 flex-shrink-0 relative group z-20">
            <div className="relative aspect-[2/3] overflow-hidden border-2 border-[#2e2a63] bg-[#2e2a63]/30 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:border-[#bbee1f]">
              <div className="w-full h-full overflow-hidden relative">
                <img 
                  src={story.coverUrl || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80'} 
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#13120d] via-transparent to-transparent opacity-80" />
              </div>
            </div>

            {/* Tech Bracket Corners */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#bbee1f] pointer-events-none" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#bbee1f] pointer-events-none" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#2e2a63] pointer-events-none group-hover:border-[#bbee1f] transition-colors" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#2e2a63] pointer-events-none group-hover:border-[#bbee1f] transition-colors" />
          </div>

          {/* Story Info - Corporate Asset Overview */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left relative">
            
            <div className="absolute top-0 right-0 text-[#2e2a63] opacity-[0.03] text-7xl lg:text-[150px] font-black italic pointer-events-none leading-none select-none tracking-tighter font-sans">
              M&A DOSSIER
            </div>

            <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-[#2e2a63] border border-[#695b7f]/50 text-[9px] font-sans tracking-[0.15em] text-[#bbee1f] uppercase rounded relative z-10 select-none">
              <span className="w-1.5 h-1.5 bg-[#bbee1f] rounded-full animate-ping absolute" />
              <span className="w-1.5 h-1.5 bg-[#bbee1f] rounded-full" />
              HỒ SƠ THƯƠNG VỤ MẬT
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-5 relative z-10 font-sans">
              <span className="text-[#13120d] text-[10px] tracking-[0.2em] uppercase font-black bg-[#bbee1f] px-3 py-1 border border-[#bbee1f] whitespace-nowrap shadow-md">
                {(story.status === 'completed' || story.completed) ? 'Đã Kiểm Thẩm' : 'Đang Kiểm Thẩm'}
              </span>
              
              {story.tags?.map((tag: string, i: number) => (
                <span key={`tag-${i}`} className="px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] font-bold text-[#dbcec2] bg-[#2e2a63]/40 border border-[#695b7f] hover:border-[#bbee1f] hover:text-[#bbee1f] transition-colors">
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#dbcec2] leading-[1.25] mb-5 tracking-normal relative z-10 drop-shadow-md uppercase font-reading-garamond">
              {story.title}
            </h1>
            
            <div className="text-[#dbcec2]/85 text-sm tracking-[0.25em] uppercase mb-6 flex items-center gap-3 relative z-10 flex-wrap justify-center lg:justify-start font-sans">
              <span className="w-12 h-[1px] bg-[#695b7f]" />
              CHỦ BIÊN ĐỀ ÁN: <span className="font-extrabold text-[#bbee1f] tracking-widest">{story.author || 'Đang cập nhật'}</span>
              <span className="w-12 h-[1px] bg-[#695b7f]" />
            </div>

            {/* Thể loại (Genres) */}
            {story.genres && story.genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6 relative z-10 font-sans">
                {story.genres.map((genre: string, i: number) => (
                  <span key={`genre-${i}`} className="px-3 py-1 text-[10px] uppercase tracking-[0.1em] font-semibold text-[#bbee1f] bg-[#2e2a63] border border-[#695b7f]/50 hover:bg-[#bbee1f] hover:text-[#13120d] transition-colors duration-200">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Core Subjects Dossier - Characters Profiles */}
            <div className="w-full text-left relative z-10 font-reading-garamond border-t border-[#2e2a63]/40 pt-6">
              <div className="text-[11px] font-sans font-black tracking-[0.2em] text-[#bbee1f] uppercase mb-4 flex items-center justify-center lg:justify-start gap-2 select-none">
                <Users className="w-4 h-4" /> HỒ SƠ ĐỐI TƯỢNG CỐT LÕI
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                {/* Subject 1 */}
                <div className="p-4 bg-[#2e2a63]/10 border border-[#2e2a63]/60 relative hover:border-[#bbee1f]/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 text-[9px] font-mono text-[#695b7f] p-2 uppercase select-none">SUB-01</div>
                  <div className="font-bold text-[#bbee1f] text-lg mb-1">Trần Kỳ Chiêu <span className="text-[10px] font-sans bg-[#2e2a63]/70 text-[#dbcec2] px-1.5 py-0.5 ml-1 border border-[#695b7f]/40 font-bold">THỤ</span></div>
                  <div className="text-[11px] uppercase font-sans tracking-wider text-[#695b7f] mb-2 font-bold">Chức vụ: Giám đốc</div>
                  <ul className="text-sm text-[#dbcec2]/90 space-y-1 list-none pl-0">
                    <li className="flex items-start gap-2">
                      <span className="text-[#bbee1f] mt-1.5">▪</span>
                      <span>Bề ngoài mềm mại đáng yêu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#bbee1f] mt-1.5">▪</span>
                      <span>Thực ra ngang ngược xấu xa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#bbee1f] mt-1.5">▪</span>
                      <span className="text-white font-semibold">Đặc điểm nhận dạng: Điên</span>
                    </li>
                  </ul>
                </div>

                {/* Subject 2 */}
                <div className="p-4 bg-[#2e2a63]/10 border border-[#2e2a63]/60 relative hover:border-[#bbee1f]/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 text-[9px] font-mono text-[#695b7f] p-2 uppercase select-none">SUB-02</div>
                  <div className="font-bold text-[#bbee1f] text-lg mb-1">Thẩm Vu Hoài <span className="text-[10px] font-sans bg-[#2e2a63]/70 text-[#dbcec2] px-1.5 py-0.5 ml-1 border border-[#695b7f]/40 font-bold">CÔNG</span></div>
                  <div className="text-[11px] uppercase font-sans tracking-wider text-[#695b7f] mb-2 font-bold">Chức vụ: Nghiên cứu viên</div>
                  <ul className="text-sm text-[#dbcec2]/90 space-y-1 list-none pl-0">
                    <li className="flex items-start gap-2">
                      <span className="text-[#bbee1f] mt-1.5">▪</span>
                      <span>Lạt mềm buộc chặt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#bbee1f] mt-1.5">▪</span>
                      <span>Ba phần mưu mẹo bảy phần thông minh khó đoán</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Floating Vertical Quick Navigation Bar - Business Terminal Style */}
      <div className="fixed right-4 lg:right-10 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-5 select-none pointer-events-auto">
        <div className="absolute right-[6px] top-3 bottom-3 w-[1px] bg-[#2e2a63]" />
        
        {story.description && (
          <div 
            onClick={() => scrollToSection('ban-khao-sat')}
            className="flex items-center justify-end group cursor-pointer relative font-sans"
          >
            <span className={`mr-4 text-[10px] uppercase tracking-[0.15em] font-black transition-all duration-300 whitespace-nowrap hidden md:inline-block ${
              activeSection === 'ban-khao-sat' 
                ? 'text-[#bbee1f] opacity-100' 
                : 'text-[#695b7f] opacity-50 group-hover:opacity-100 group-hover:text-[#dbcec2]'
            }`}>
              BÁO CÁO THẨM ĐỊNH
            </span>
            <div className={`w-3 h-3 rotate-45 border transition-all duration-300 relative z-10 flex items-center justify-center ${
              activeSection === 'ban-khao-sat' 
                ? 'bg-[#bbee1f] border-[#bbee1f]' 
                : 'bg-[#13120d] border-[#2e2a63] group-hover:border-[#bbee1f]'
            }`}>
              <div className={`w-1 h-1 rotate-45 ${activeSection === 'ban-khao-sat' ? 'bg-[#13120d]' : 'bg-transparent'}`} />
            </div>
          </div>
        )}

        {story.recommendations && (
          <div 
            onClick={() => scrollToSection('lien-ket-de-xuat')}
            className="flex items-center justify-end group cursor-pointer relative font-sans"
          >
            <span className={`mr-4 text-[10px] uppercase tracking-[0.15em] font-black transition-all duration-300 whitespace-nowrap hidden md:inline-block ${
              activeSection === 'lien-ket-de-xuat' 
                ? 'text-[#bbee1f] opacity-100' 
                : 'text-[#695b7f] opacity-50 group-hover:opacity-100 group-hover:text-[#dbcec2]'
            }`}>
              DANH MỤC ĐỐI TÁC
            </span>
            <div className={`w-3 h-3 rotate-45 border transition-all duration-300 relative z-10 flex items-center justify-center ${
              activeSection === 'lien-ket-de-xuat' 
                ? 'bg-[#bbee1f] border-[#bbee1f]' 
                : 'bg-[#13120d] border-[#2e2a63] group-hover:border-[#bbee1f]'
            }`}>
              <div className={`w-1 h-1 rotate-45 ${activeSection === 'lien-ket-de-xuat' ? 'bg-[#13120d]' : 'bg-transparent'}`} />
            </div>
          </div>
        )}

        <div 
          onClick={() => {
            setActiveTab('chapters');
            setTimeout(() => scrollToSection('ho-so-thuong-vu'), 50);
          }}
          className="flex items-center justify-end group cursor-pointer relative font-sans"
        >
          <span className={`mr-4 text-[10px] uppercase tracking-[0.15em] font-black transition-all duration-300 whitespace-nowrap hidden md:inline-block ${
            activeSection === 'ho-so-thuong-vu' 
              ? 'text-[#bbee1f] opacity-100' 
              : 'text-[#695b7f] opacity-50 group-hover:opacity-100 group-hover:text-[#dbcec2]'
          }`}>
            SỔ GIAO DỊCH TÀI SẢN
          </span>
          <div className={`w-3 h-3 rotate-45 border transition-all duration-300 relative z-10 flex items-center justify-center ${
            activeSection === 'ho-so-thuong-vu' 
              ? 'bg-[#bbee1f] border-[#bbee1f]' 
              : 'bg-[#13120d] border-[#2e2a63] group-hover:border-[#bbee1f]'
          }`}>
            <div className={`w-1 h-1 rotate-45 ${activeSection === 'ho-so-thuong-vu' ? 'bg-[#13120d]' : 'bg-transparent'}`} />
          </div>
        </div>
      </div>

      {/* Main Grid Layout - DISTINCT ASYMMETRIC 2-COLUMN STRUCTURE (Business & Financial War Design) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Deep Reports, Ledger and Chapters (65% width equivalent) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Synopsis - Business Feasibility Report */}
            {story.description && (
              <div id="ban-khao-sat" className="relative p-6 lg:p-10 bg-[#2e2a63]/15 backdrop-blur-md border border-[#2e2a63]/60 shadow-xl group scroll-mt-[130px] sm:scroll-mt-[150px]">
                {/* Tech Corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#bbee1f]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#bbee1f]" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-[#2e2a63]" />
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#2e2a63]" />
                
                <div className="absolute -top-4 -left-4 bg-[#2e2a63] w-8 h-8 flex items-center justify-center border border-[#bbee1f] text-[#bbee1f]">
                  <Quote className="w-4 h-4" />
                </div>
                
                <h3 className="text-[#bbee1f] uppercase text-xs font-sans font-black tracking-[0.3em] mb-6 flex items-center gap-3 select-none">
                  <span className="w-6 h-[1px] bg-[#bbee1f]" /> BÁO CÁO THẨM ĐỊNH DOANH NGHIỆP
                </h3>
                
                <div className="text-base lg:text-lg leading-relaxed text-[#dbcec2] font-normal space-y-4 font-reading-garamond">
                  {story.description?.split('\n').filter((p: string) => p.trim() !== '').map((paragraph: string, idx: number) => (
                    <p key={idx} className="indent-6 text-justify">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations / Other Projects */}
            {story.recommendations && (
              <div id="lien-ket-de-xuat" className="relative p-6 lg:p-10 bg-[#2e2a63]/15 backdrop-blur-md border border-[#2e2a63]/60 shadow-xl group scroll-mt-[130px] sm:scroll-mt-[150px]">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#bbee1f]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#bbee1f]" />
                
                <h3 className="text-[#bbee1f] uppercase text-xs font-sans font-black tracking-[0.3em] mb-6 flex items-center gap-3 select-none">
                  <span className="w-6 h-[1px] bg-[#bbee1f]" /> DANH MỤC ĐẦU TƯ ĐỐI TÁC
                </h3>
                
                <div className="text-base lg:text-lg leading-relaxed text-[#dbcec2] font-normal space-y-4 font-reading-garamond">
                  {story.recommendations?.split('\n').filter((p: string) => p.trim() !== '').map((paragraph: string, idx: number) => (
                    <p key={idx} className="indent-6 text-justify">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Board Selector (Custom Tabs) */}
            <div id="ho-so-thuong-vu" className="flex gap-6 border-b border-[#2e2a63] scroll-mt-[130px] sm:scroll-mt-[150px] select-none pt-4">
              <button
                onClick={() => setActiveTab('chapters')}
                className={`pb-4 uppercase font-sans font-black tracking-[0.15em] text-[11px] sm:text-xs transition-all relative ${
                  activeTab === 'chapters' ? 'text-[#bbee1f]' : 'text-[#695b7f] hover:text-[#dbcec2]'
                }`}
              >
                [ SỔ GIAO DỊCH TÀI SẢN ]
                {activeTab === 'chapters' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#bbee1f]" />}
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-4 uppercase font-sans font-black tracking-[0.15em] text-[11px] sm:text-xs transition-all relative ${
                  activeTab === 'comments' ? 'text-[#bbee1f]' : 'text-[#695b7f] hover:text-[#dbcec2]'
                }`}
              >
                [ BIÊN BẢN HỢP TÁC ({comments.length}) ]
                {activeTab === 'comments' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#bbee1f]" />}
              </button>
            </div>

            {/* Content Area - Designed as a Corporate Ledger / Stock Table */}
            {activeTab === 'chapters' ? (
              <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                
                {/* Table Header Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-[#2e2a63]/30 border border-[#2e2a63] p-4 gap-4 relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#bbee1f]" />
                  <div className="flex items-center gap-2 font-sans">
                    <Shield className="w-4 h-4 text-[#bbee1f]" />
                    <span className="text-[#dbcec2]/90 text-[10px] uppercase tracking-[0.1em] font-bold">
                      BẢN CHỨNG THƯ HIỆN CÓ: {chapters.length} TÀI LIỆU KHẢ DỤNG
                    </span>
                  </div>
                  <button
                    onClick={() => setChapterSortDesc(!chapterSortDesc)}
                    className="text-[#bbee1f] text-[10px] font-sans font-black uppercase tracking-[0.15em] hover:text-white transition-colors flex items-center justify-center gap-1.5 border border-[#bbee1f]/40 px-3 py-1.5 bg-[#13120d]"
                  >
                    TRÌNH TỰ SẮP XẾP: {chapterSortDesc ? 'MỚI NHẤT ▲' : 'CŨ NHẤT ▼'}
                  </button>
                </div>
                
                {/* The Ledger Table redesigned as Scrollable Grid of Folders */}
                <div 
                  className="max-h-[480px] overflow-y-auto pr-1 select-none"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#2e2a63 #13120d'
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedChapters.map((chap, i) => {
                      const absoluteIndex = (chapterPage * CHAPTERS_PER_PAGE) + i + 1;
                      const recordCode = `SEC-GNC-${absoluteIndex.toString().padStart(3, '0')}`;
                      return (
                        <div 
                          key={chap.id} 
                          onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${chap.order + 1}`)}
                          className="bg-[#2e2a63]/10 border border-[#2e2a63]/50 hover:border-[#bbee1f] p-4 flex flex-col justify-between cursor-pointer group transition-all duration-300 relative rounded-lg"
                        >
                          {/* Top Info */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-[#695b7f] group-hover:text-[#bbee1f] transition-colors">
                              {recordCode}
                            </span>
                            <span className="px-1.5 py-0.5 border border-[#2e2a63] bg-[#2e2a63]/30 rounded text-[8px] font-semibold text-[#695b7f] group-hover:text-[#dbcec2] group-hover:border-[#bbee1f]/40 transition-colors">
                              SECURED PDF
                            </span>
                          </div>

                          {/* Chapter Title */}
                          <h4 className="text-sm font-bold text-[#dbcec2] group-hover:text-white line-clamp-2 leading-snug mb-3 font-reading-garamond transition-colors">
                            {chap.title}
                          </h4>

                          {/* Bottom Action */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#2e2a63]/30">
                            <span className="text-[9px] text-[#695b7f] font-sans uppercase tracking-wider group-hover:text-[#dbcec2]/70 transition-colors">
                              CHỨNG THƯ KHẢ DỤNG
                            </span>
                            <span className="text-[9px] font-sans font-black uppercase tracking-wider text-[#bbee1f] group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-0.5">
                              XUẤT BẢN <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination Controls - Clean & Minimalist terminal look */}
                {chapters.length > CHAPTERS_PER_PAGE && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-[#2e2a63]">
                    {/* Range Selector */}
                    <div className="flex items-center gap-3 font-sans">
                      <span className="text-[#695b7f] text-[10px] uppercase tracking-wider font-bold">DẢI PHÊ DUYỆT:</span>
                      <select
                        value={chapterPage}
                        onChange={(e) => setChapterPage(Number(e.target.value))}
                        className="bg-[#13120d] text-[#bbee1f] text-xs font-bold px-3 py-1.5 border border-[#2e2a63] focus:border-[#bbee1f] focus:outline-none transition-all cursor-pointer rounded"
                      >
                        {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, p) => {
                          const start = p * CHAPTERS_PER_PAGE + 1;
                          const end = Math.min((p + 1) * CHAPTERS_PER_PAGE, chapters.length);
                          return (
                            <option key={p} value={p} className="bg-[#13120d] text-[#dbcec2]">
                              PHÂN ĐOẠN {start} - {end}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Number Pagination */}
                    <div className="flex flex-wrap gap-2 justify-center font-sans">
                      {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, p) => (
                        <button
                          key={p}
                          onClick={() => setChapterPage(p)}
                          className={`w-8 h-8 flex items-center justify-center text-[11px] font-black transition-all border rounded ${
                            chapterPage === p 
                              ? 'bg-[#bbee1f] text-[#13120d] border-[#bbee1f] font-extrabold shadow-sm' 
                              : 'bg-[#13120d] text-[#695b7f] border-[#2e2a63] hover:border-[#bbee1f] hover:text-[#bbee1f]'
                          }`}
                        >
                          {(p + 1).toString().padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                {/* Comment Input - Shareholder memorandum */}
                <div className="bg-[#2e2a63]/10 border border-[#2e2a63] p-6 lg:p-8 relative shadow-md">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#bbee1f]" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#bbee1f]" />
                  
                  <h3 className="text-[#bbee1f] uppercase tracking-[0.15em] font-sans text-xs font-black mb-5 flex items-center gap-2 select-none">
                    <MessageSquare className="w-4 h-4" /> BẢN GHI NHỚ ĐỀ XUẤT CỦA CỔ ĐÔNG
                  </h3>
                  
                  {isLoggedIn ? (
                    <form onSubmit={handleSendComment} className="flex flex-col gap-4 font-sans">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Nhập nội dung đề đề xuất, phản hồi thẩm định dự án..."
                        className="w-full bg-[#13120d] border border-[#2e2a63] p-4 text-[#dbcec2] text-xs sm:text-sm focus:border-[#bbee1f] focus:outline-none resize-none h-28 transition-colors placeholder:text-[#695b7f]/60"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!commentText.trim() || submittingComment}
                          className="px-6 py-3 bg-[#2e2a63] border border-[#695b7f] hover:border-[#bbee1f] text-[#bbee1f] font-bold uppercase tracking-wider hover:bg-[#bbee1f] hover:text-[#13120d] disabled:opacity-50 transition-all flex items-center gap-2 text-xs"
                        >
                          {submittingComment ? 'ĐANG PHÊ DUYỆT...' : <><Send className="w-4 h-4" /> TRÌNH ĐỀ XUẤT</>}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center p-8 border border-dashed border-[#2e2a63] font-sans text-[#695b7f] text-[11px] uppercase tracking-wider select-none">
                      VUI LÒNG ĐĂNG NHẬP ĐỂ SỬ DỤNG KÊNH PHẢN HỒI Ý KIẾN
                    </div>
                  )}
                </div>

                {/* Comment List - Shareholder Forum */}
                <div className="flex flex-col gap-4">
                  {comments.map((comment) => {
                    const isGift = comment.type === 'choco_gift';
                    const isMe = comment.uid === uid || comment.authorId === uid;
                    const cached = comment.uid ? profilesCache[comment.uid] : (comment.authorId ? profilesCache[comment.authorId] : null);

                    const currentSticker = isMe ? equippedStickerComment : (cached?.equippedStickerComment ?? cached?.equippedSticker ?? comment.equippedSticker);
                    const currentDisplayName = isMe ? storeDisplayName : (cached?.displayName ?? comment.displayName ?? comment.authorName);
                    const currentAvatarUrl = isMe ? storeAvatarUrl : (cached?.avatarUrl ?? comment.avatarUrl);
                    const currentActiveTitle = isMe ? storeActiveTitle : (cached?.activeTitle ?? comment.activeTitle);
                    const currentAccessory = isMe ? storeEquippedAccessory : (cached?.equippedAccessory ?? comment.equippedAccessory);
                    const currentAccessoryPos = isMe ? storeAccessoryPosition : (cached?.accessoryPosition ?? comment.accessoryPosition);

                    return (
                      <div key={comment.id} className="bg-[#2e2a63]/5 border border-[#2e2a63]/60 p-5 relative group hover:border-[#2e2a63] transition-colors pr-12">
                        <div className="absolute left-0 top-0 w-1 h-0 bg-[#bbee1f] group-hover:h-full transition-all duration-300" />
                        
                        {currentSticker && (
                          <img 
                            src={currentSticker} 
                            alt="Sticker" 
                            className="absolute w-10 h-10 object-contain pointer-events-none z-10 right-2 top-1/2 -translate-y-1/2" 
                            referrerPolicy="no-referrer"
                          />
                        )}

                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar 
                              avatarUrl={currentAvatarUrl} 
                              equippedAccessory={currentAccessory}
                              accessoryPosition={currentAccessoryPos}
                              className="w-8 h-8 shrink-0" 
                              fallbackIconSizeClass="w-4 h-4 text-[#bbee1f]"
                              borderClass="border border-[#2e2a63]"
                              bgClass="bg-[#13120d]"
                            />
                            <div className="flex flex-col font-sans">
                              <span className="font-bold text-[#bbee1f] uppercase tracking-wider text-xs flex items-center gap-1.5 flex-wrap">
                                <span style={{ color: getTitleColor?.(currentActiveTitle) }}>
                                  {currentDisplayName || 'Cổ Đông Vô Danh'}
                                </span>
                                {currentActiveTitle && (
                                  <span className="px-1.5 py-0.5 bg-[#2e2a63] text-[#bbee1f] text-[8px] font-extrabold uppercase tracking-tight select-none border border-[#695b7f]/40 ml-1">
                                    🏆 {currentActiveTitle}
                                  </span>
                                )}
                              </span>
                              <span className="text-[#695b7f] text-[9px] tracking-wider uppercase mt-0.5">
                                {comment.createdAt ? format(comment.createdAt.toDate(), 'dd.MM.yyyy / HH:mm') : 'HỆ THỐNG GHI NHẬN'}
                              </span>
                            </div>
                          </div>
                          
                          {isGift && (
                            <span className="ml-auto text-[#13120d] text-[9px] font-sans font-black bg-[#bbee1f] px-2 py-1 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                              <Gift className="w-3 h-3" /> TÀI TRỢ {comment.giftAmount} CC
                            </span>
                          )}
                        </div>
                        
                        <div className="text-[#dbcec2] text-sm lg:text-base leading-relaxed whitespace-pre-wrap pl-11 font-reading-garamond">
                          {comment.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: EXECUTIVE trading & investment console (35% width equivalent) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* The Investment Panel */}
            <div className="bg-[#2e2a63]/25 border-2 border-[#2e2a63] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#2e2a63] px-2.5 py-1 text-[8px] font-sans tracking-widest text-[#bbee1f] uppercase select-none font-bold">
                M&A TERMINAL
              </div>
              
              <h4 className="text-white font-sans text-xs font-black tracking-widest uppercase border-b border-[#2e2a63] pb-3 mb-6 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#bbee1f]" /> BẢNG THU THẬP THƯƠNG VỤ
              </h4>

              {/* Balances Sheet Stats */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between border-b border-[#2e2a63]/40 pb-2.5">
                  <span className="text-[#695b7f] text-xs font-sans font-bold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#bbee1f]" /> Vốn Tài Liệu</span>
                  <span className="font-mono text-sm font-black text-white">{chapters.length} <span className="text-[10px] text-[#695b7f] font-sans">bản ghi</span></span>
                </div>
                <div className="flex items-center justify-between border-b border-[#2e2a63]/40 pb-2.5">
                  <span className="text-[#695b7f] text-xs font-sans font-bold flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-[#bbee1f]" /> Giao Dịch Lưu Lượng</span>
                  <span className="font-mono text-sm font-black text-white">{new Intl.NumberFormat('en-US').format(story.viewCount || 0)} <span className="text-[10px] text-[#695b7f] font-sans">lượt</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#695b7f] text-xs font-sans font-bold flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#bbee1f]" /> Vốn Tích Lũy</span>
                  <span className="font-mono text-sm font-black text-[#bbee1f]">{totalGiftedChoco} <span className="text-[10px] text-[#dbcec2] font-sans">CC</span></span>
                </div>
              </div>

              {/* Action Suite */}
              <div className="space-y-3 font-sans">
                <button 
                  onClick={() => chapters.length > 0 && navigate(`/doc/${story.slug || story.id}/chuong-${chapters[0].order + 1}`)}
                  className="w-full py-3.5 bg-[#bbee1f] text-[#13120d] font-black uppercase text-xs tracking-widest hover:bg-white hover:shadow-[0_0_20px_rgba(187,238,31,0.4)] transition-all flex items-center justify-center gap-2 border border-[#bbee1f]"
                >
                  <BookOpen className="w-4 h-4" /> BẮT ĐẦU PHÊ DUYỆT
                </button>

                {story.externalUrl && (
                  <button 
                    onClick={() => window.open(story.externalUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full py-3 border border-[#695b7f] text-[#dbcec2] uppercase text-xs font-bold tracking-widest hover:border-[#bbee1f] hover:text-[#bbee1f] transition-all flex items-center justify-center gap-2 bg-[#13120d]/50"
                  >
                    <ExternalLink className="w-4 h-4" /> TRUY XUẤT HỒ SƠ GỐC
                  </button>
                )}

                <button 
                  onClick={handleSaveToggle}
                  className="w-full py-3 border border-[#695b7f] text-[#dbcec2] uppercase text-xs font-bold tracking-widest hover:border-[#bbee1f] hover:text-[#bbee1f] transition-all flex items-center justify-center gap-2 bg-[#13120d]/50"
                >
                  <Bookmark className={`w-4 h-4 ${savedStories.includes(story.id) ? 'fill-[#bbee1f] text-[#bbee1f]' : ''}`} /> 
                  {savedStories.includes(story.id) ? 'HỒ SƠ ĐÃ LƯU' : 'LƯU TRỮ CHỨNG THƯ'}
                </button>

                <button 
                  onClick={() => setShowGiftModal(true)}
                  className="w-full py-3 border border-[#bbee1f] text-[#bbee1f] uppercase text-xs font-bold tracking-widest hover:bg-[#bbee1f] hover:text-[#13120d] transition-all flex items-center justify-center gap-2 bg-[#2e2a63]/40"
                >
                  <Gift className="w-4 h-4" /> KÝ HỢP ĐỒNG ĐẦU TƯ
                </button>
              </div>
            </div>

            {/* Financial Index & Market Sentiment */}
            <div className="bg-[#2e2a63]/10 border border-[#2e2a63]/60 p-6 relative">
              <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#2e2a63] border border-[#695b7f] px-2 py-0.5 text-[8px] font-mono text-[#bbee1f] tracking-widest uppercase">
                INDEX CHỈ SỐ
              </div>

              <h4 className="text-white font-sans text-xs font-black tracking-widest uppercase mb-4 flex items-center gap-2 border-b border-[#2e2a63]/30 pb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#bbee1f]" /> THÔNG TIN THỊ TRƯỜNG M&A
              </h4>

              <div className="space-y-3 text-xs font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-[#695b7f] font-medium">Xếp Hạng Dự Án</span>
                  <span className="text-white font-bold flex items-center gap-1">AAA <span className="text-[8px] text-[#bbee1f] bg-[#2e2a63] px-1 py-0.2 rounded font-mono">TỐI CAO</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#695b7f] font-medium">Hệ Số Rủi Ro</span>
                  <span className="text-[#bbee1f] font-mono font-bold">0.02% (Cực thấp)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#695b7f] font-medium">Khu Vực Đầu Tư</span>
                  <span className="text-[#dbcec2] font-semibold">Tự Do Thương Mại</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#695b7f] font-medium">Pháp Lý Dự Án</span>
                  <span className="text-[#bbee1f] font-bold flex items-center gap-1"><Shield className="w-3 h-3"/> Đã Đóng Dấu</span>
                </div>
              </div>
            </div>

            {/* Top Backer Board / Shareholders Ledger */}
            <div className="bg-[#13120d] border border-[#2e2a63] p-5 shadow-lg relative">
              <h4 className="text-white font-sans text-xs font-black tracking-widest uppercase mb-4 flex items-center gap-2 border-b border-[#2e2a63] pb-2">
                <Award className="w-3.5 h-3.5 text-[#bbee1f]" /> NHẬT KÝ THƯƠNG VỤ SÁP NHẬP
              </h4>
              
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                {comments.filter(c => c.type === 'choco_gift').length === 0 ? (
                  <div className="text-[#695b7f] text-[10px] text-center uppercase py-4 font-sans tracking-wider">
                    CHƯA CÓ THƯƠNG VỤ ĐẦU TƯ LỚN NÀO ĐƯỢC KÝ KẾT.
                  </div>
                ) : (
                  comments.filter(c => c.type === 'choco_gift').slice(0, 5).map((gift, idx) => {
                    const cached = gift.uid ? profilesCache[gift.uid] : (gift.authorId ? profilesCache[gift.authorId] : null);
                    const displayName = cached?.displayName ?? gift.displayName ?? gift.authorName ?? 'Cổ đông lớn';
                    return (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#2e2a63]/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#bbee1f]" />
                          <span className="text-xs font-bold text-[#dbcec2] font-reading-garamond truncate max-w-[120px]">{displayName}</span>
                        </div>
                        <span className="font-mono text-xs font-black text-[#bbee1f] bg-[#2e2a63]/40 px-2 py-0.5 border border-[#2e2a63]/60">
                          +{gift.giftAmount} CC
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#13120d]/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#13120d] border-2 border-[#bbee1f] p-6 sm:p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(187,238,31,0.15)] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowGiftModal(false)} className="absolute top-4 right-4 text-[#695b7f] hover:text-[#bbee1f] transition-colors text-xl">✕</button>
            
            <div className="text-center mb-6 select-none font-sans">
              <div className="w-10 h-10 bg-[#2e2a63] flex items-center justify-center mx-auto mb-3 border border-[#695b7f] rotate-45">
                <Gift className="w-4 h-4 text-[#bbee1f] -rotate-45" />
              </div>
              <h2 className="text-[#bbee1f] text-lg font-black uppercase tracking-wider">KÝ KẾT ĐẦU TƯ DỰ ÁN</h2>
              <p className="text-[#695b7f] text-[9px] mt-1 tracking-widest uppercase">
                NGÂN SÁCH HIỆN TẠI: <span className="text-white font-bold">{choco} CC</span>
              </p>
            </div>
            
            <div className="flex flex-col gap-4 font-sans">
              <div>
                <label className="text-[#695b7f] text-[9px] font-bold uppercase tracking-wider mb-2.5 block text-center select-none">CHỌN GÓI VỐN ĐẦU TƯ</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setGiftAmount(amt)}
                      className={`py-2 text-xs font-black transition-all border rounded ${
                        giftAmount === amt 
                          ? 'bg-[#bbee1f] text-[#13120d] border-[#bbee1f]' 
                          : 'bg-[#13120d] text-[#dbcec2] border-[#2e2a63] hover:border-[#695b7f]'
                      }`}
                    >
                      {amt} CC
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={giftAmount || ''}
                    onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                    placeholder="Khác"
                    className="py-2 bg-[#13120d] text-[#dbcec2] text-center text-xs font-black border border-[#2e2a63] focus:border-[#bbee1f] focus:outline-none transition-all placeholder:text-[#695b7f] rounded"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[#695b7f] text-[9px] font-bold uppercase tracking-wider mb-2.5 block text-center select-none">BIÊN BẢN HỢP ĐỒNG (TÙY CHỌN)</label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Nhập lời nhắn gửi đến chủ biên..."
                  className="w-full bg-[#13120d] border border-[#2e2a63] p-3 text-[#dbcec2] text-xs focus:border-[#bbee1f] focus:outline-none resize-none h-16 transition-colors placeholder:text-[#695b7f]/60 rounded"
                />
              </div>

              <button
                onClick={handleGiftSubmit}
                disabled={giftAmount <= 0}
                className="w-full py-3 bg-[#bbee1f] text-[#13120d] font-black uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all mt-1 flex items-center justify-center gap-2 text-xs rounded border border-[#bbee1f]"
              >
                XÁC NHẬN GIAO DỊCH <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

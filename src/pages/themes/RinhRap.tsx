import React, { useState, useEffect } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Scroll, Heart, ArrowLeft, Sparkles, Rabbit, Skull, Ghost, Gamepad2, Lock, Unlock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';


const RabbitMask = ({ className, ...props }: any) => (
  <svg viewBox="0 0 100 100" className={className} {...props}>
    <path d="M 35 45 C 35 15, 20 0, 35 5 C 45 10, 45 40, 45 45 Z" fill="#ffffff" />
    <path d="M 37 40 C 37 20, 28 10, 37 12 C 41 15, 41 35, 41 40 Z" fill="#facaca" />
    <path d="M 65 45 C 65 15, 80 0, 65 5 C 55 10, 55 40, 55 45 Z" fill="#ffffff" />
    <path d="M 63 40 C 63 20, 72 10, 63 12 C 59 15, 59 35, 59 40 Z" fill="#facaca" />
    <path d="M 20 40 C 0 40, 0 75, 20 85 C 35 90, 65 90, 80 85 C 100 75, 100 40, 80 40 C 60 30, 40 30, 20 40 Z" fill="#ffffff" />
    <ellipse cx="32" cy="65" rx="14" ry="11" fill="currentColor" />
    <ellipse cx="68" cy="65" rx="14" ry="11" fill="currentColor" />
    <circle cx="50" cy="82" r="5" fill="#facaca" />
    <path d="M 26 48 Q 33 43 40 48" stroke="#facaca" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M 74 48 Q 67 43 60 48" stroke="#facaca" strokeWidth="4" strokeLinecap="round" fill="none" />
    <line x1="15" y1="65" x2="3" y2="60" stroke="#facaca" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="72" x2="0" y2="72" stroke="#facaca" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="16" y1="78" x2="5" y2="84" stroke="#facaca" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="85" y1="65" x2="97" y2="60" stroke="#facaca" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="88" y1="72" x2="100" y2="72" stroke="#facaca" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="84" y1="78" x2="95" y2="84" stroke="#facaca" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const RinhRapTheme: React.FC<ThemeProps> = (props) => {
  const {
    story, actualStoryId, chapters, comments, activeTab, setActiveTab,
    chapterPage, setChapterPage, chapterSortDesc, setChapterSortDesc, CHAPTERS_PER_PAGE,
    showGiftModal, setShowGiftModal, giftAmount, setGiftAmount,
    giftMessage, setGiftMessage, handleGiftSubmit, commentText, setCommentText,
    submittingComment, handleSendComment, isLoggedIn, savedStories, handleSaveToggle, choco, navigate,
    profilesCache = {}, getTitleColor, uid, unlockedPassChapters, unlockedEarlyAccessChapters
  } = props;

  const {
    equippedStickerComment, stickerPositionComment, displayName: storeDisplayName,
    avatarUrl: storeAvatarUrl, activeTitle: storeActiveTitle,
    equippedAccessory: storeEquippedAccessory, accessoryPosition: storeAccessoryPosition
  } = useStore();

  const totalGiftedChoco = comments.filter(c => c.type === 'choco_gift').reduce((acc, curr) => acc + (curr.giftAmount || 0), 0);
  const isSaved = (savedStories || []).includes(story.id);

  // Sync state for thodo/thotrang with localStorage
  const [rinhrapMode, setRinhrapMode] = useState<'thodo' | 'thotrang'>(() => {
    return (localStorage.getItem('reader-rinhrap-mode') as 'thodo' | 'thotrang') || 'thodo';
  });

  useEffect(() => {
    localStorage.setItem('reader-rinhrap-mode', rinhrapMode);
  }, [rinhrapMode]);

  const handleModeChange = (mode: 'thodo' | 'thotrang') => {
    setRinhrapMode(mode);
    localStorage.setItem('reader-rinhrap-mode', mode);
  };

  // Glitch effect state
  const [glitch, setGlitch] = useState(false);

  const triggerGlitch = () => {
    setGlitch(true);
    setTimeout(() => setGlitch(false), 300);
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-[#780606] selection:text-[#ffffff] pb-24 relative overflow-x-hidden transition-all duration-300 ${
      rinhrapMode === 'thotrang'
        ? (glitch ? 'bg-[#780606] text-[#ffffff]' : 'bg-[#fff2f1] text-[#780606]')
        : (glitch ? 'bg-[#9c0800] text-[#000000]' : 'bg-[#000000] text-[#fff2f1]')
    }`}>
      
      {/* BACKGROUND GRAPHICS: CUTE BUT CREEPY */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
         {/* Subtle red tint at the bottom */}
         <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t mix-blend-multiply ${
            rinhrapMode === 'thotrang' ? 'from-[#facaca] to-transparent' : 'from-[#780606] to-transparent'
         }`}></div>
         {/* Floating icons */}
         <RabbitMask className={`absolute top-[10%] left-[5%] w-32 h-32 opacity-10 animate-pulse ${
            rinhrapMode === 'thotrang' ? 'text-[#facaca]' : 'text-[#fde0e0]'
         }`} />
         <Skull className={`absolute top-[30%] right-[10%] w-48 h-48 opacity-5 -rotate-12 ${
            rinhrapMode === 'thotrang' ? 'text-[#facaca]' : 'text-[#823323]'
         }`} />
         <Ghost className={`absolute bottom-[20%] left-[15%] w-24 h-24 opacity-10 rotate-12 text-[#facaca]`} />
      </div>

      {/* STICKY TOP BANNER */}
      <div className={`border-b-4 border-dashed px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 transition-all ${
         rinhrapMode === 'thotrang'
            ? 'border-[#facaca] bg-[#fff2f1] shadow-[0_4px_15px_rgba(250,202,202,0.6)]'
            : 'border-[#823323] bg-[#000000] shadow-[0_4px_15px_rgba(120,6,6,0.4)]'
      }`}>
        <button 
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black tracking-widest border-2 transition-all cursor-pointer group ${
            rinhrapMode === 'thotrang'
               ? 'bg-[#780606] hover:bg-[#9c0800] text-[#ffffff] border-[#823323]'
               : 'bg-[#fde0e0] hover:bg-[#facaca] text-[#780606] border-[#780606]'
          }`}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>THOÁT GAME</span>
        </button>

        <div className="flex items-center justify-center gap-2 cursor-pointer group" onClick={triggerGlitch}>
          <RabbitMask className={`w-6 h-6 transition-colors ${glitch ? 'text-[#ffffff]' : (rinhrapMode === 'thotrang' ? 'text-[#780606]' : 'text-[#facaca]')}`} />
          <h2 className={`font-black text-lg md:text-2xl tracking-[0.3em] uppercase transition-all ${
             rinhrapMode === 'thotrang'
                ? 'text-[#780606] drop-shadow-[0_0_8px_#facaca]'
                : 'text-[#fff2f1] drop-shadow-[0_0_8px_#780606]'
          }`}>
            RÌNH RẬP
          </h2>
          <Skull className={`w-5 h-5 transition-colors ${glitch ? 'text-[#ffffff]' : (rinhrapMode === 'thotrang' ? 'text-[#823323]' : 'text-[#9c0800]')}`} />
        </div>

        {/* MODE SELECTOR IN TOP BANNER */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('thodo')}
            className={`px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black rounded-lg border-2 transition-all cursor-pointer ${
              rinhrapMode === 'thodo'
                ? 'bg-[#780606] text-white border-[#450A0A] shadow-[1px_1px_0_0_#450A0A]'
                : (rinhrapMode === 'thotrang' 
                   ? 'bg-transparent text-[#780606]/70 border-[#823323]/50 hover:bg-[#facaca]/50'
                   : 'bg-transparent text-[#facaca] border-[#780606]/50 hover:bg-[#780606]/20')
            }`}
          >
            THỎ ĐỎ
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('thotrang')}
            className={`px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black rounded-lg border-2 transition-all cursor-pointer ${
              rinhrapMode === 'thotrang'
                ? 'bg-[#facaca] text-[#780606] border-[#823323] shadow-[1px_1px_0_0_#facaca]'
                : 'bg-transparent text-[#facaca]/70 border-[#780606]/50 hover:bg-[#780606]/20'
            }`}
          >
            THỎ TRẮNG
          </button>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto p-4 md:p-8 relative z-10 flex flex-col gap-10 mt-8">
        
        {/* STORY PROFILE CARD */}
        <div className={`flex flex-col md:flex-row gap-8 rounded-[2rem] p-6 relative overflow-hidden group border-4 transition-all ${
           rinhrapMode === 'thotrang'
              ? 'bg-[#ffffff] border-[#823323] shadow-[8px_8px_0_0_#facaca]'
              : 'bg-[#000000] border-[#780606] shadow-[8px_8px_0_0_#823323]'
        }`}>
          
          {/* Decorative Corner Tape */}
          <div className={`absolute -top-6 -left-6 w-20 h-8 rotate-45 border-y-2 border-dashed opacity-80 ${
             rinhrapMode === 'thotrang' ? 'bg-[#780606] border-[#823323]' : 'bg-[#facaca] border-[#780606]'
          }`}></div>
          <div className={`absolute -bottom-6 -right-6 w-20 h-8 rotate-45 border-y-2 border-dashed opacity-80 ${
             rinhrapMode === 'thotrang' ? 'bg-[#780606] border-[#823323]' : 'bg-[#facaca] border-[#780606]'
          }`}></div>

          {/* Cover Art */}
          <div className="w-full md:w-56 shrink-0 relative flex justify-center">
            <div className={`relative w-48 h-64 md:w-full md:h-72 rounded-2xl overflow-hidden border-4 transition-all ${
               rinhrapMode === 'thotrang'
                  ? 'border-[#823323] shadow-[0_0_20px_#facaca]'
                  : 'border-[#facaca] shadow-[0_0_20px_#9c0800]'
            }`}>
              
              {story.coverUrl ? (
                <img 
                  src={story.coverUrl} 
                  alt={story.title} 
                  className="w-full h-full object-cover group-hover:brightness-110 group-hover:scale-105 transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full bg-[#823323] flex items-center justify-center">
                  <RabbitMask className="w-20 h-20 text-[#000000] opacity-50" />
                </div>
              )}
              {/* Cute heart sticker overlay */}
              <div className={`absolute bottom-2 right-2 p-1.5 rounded-full rotate-12 shadow-lg z-20 border transition-all ${
                 rinhrapMode === 'thotrang' ? 'bg-[#780606] border-[#823323]' : 'bg-[#ffffff] border-transparent'
              }`}>
                 <Heart className={`w-5 h-5 ${
                    rinhrapMode === 'thotrang' ? 'text-[#facaca] fill-[#ffffff]' : 'text-[#9c0800] fill-[#facaca]'
                 }`} />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center flex-1 space-y-4">
            
            <h1 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter transition-all ${
               rinhrapMode === 'thotrang'
                  ? 'text-[#780606] drop-shadow-[2px_2px_0_#facaca]'
                  : 'text-[#ffffff] drop-shadow-[2px_2px_0_#9c0800]'
            }`}>
              {story.title}
            </h1>
            
            <div className={`flex items-center gap-4 text-xs font-bold transition-all ${
               rinhrapMode === 'thotrang' ? 'text-[#780606]' : 'text-[#facaca]'
            }`}>
              <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
                 rinhrapMode === 'thotrang' ? 'bg-[#facaca]/40 border-[#facaca]' : 'bg-[#823323]/40 border-[#823323]'
              }`}>
                <Gamepad2 className="w-4 h-4" /> TRẠNG THÁI: {story.completed ? 'ĐÃ PHÁ ĐẢO' : 'ĐANG KẾT NỐI...'}
              </span>
              <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
                 rinhrapMode === 'thotrang' ? 'bg-[#facaca]/40 border-[#facaca]' : 'bg-[#780606]/40 border-[#780606]'
              }`}>
                <BookOpen className="w-4 h-4" /> {chapters.length} MÀN CHƠI
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 mb-2">
              {story.genres && story.genres.length > 0 ? (
                story.genres.map((tag: string, i: number) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                     rinhrapMode === 'thotrang'
                        ? 'bg-[#780606] text-[#ffffff] border-[#823323]'
                        : 'bg-[#facaca] text-[#780606] border-[#780606]'
                  }`}>
                    {tag}
                  </span>
                ))
              ) : null}
            </div>

            <p className={`text-sm leading-relaxed font-medium p-4 rounded-xl border border-dashed text-justify whitespace-pre-line transition-all ${
               rinhrapMode === 'thotrang'
                  ? 'text-[#000000] bg-[#facaca]/10 border-[#facaca]'
                  : 'text-[#fff2f1] bg-[#823323]/20 border-[#780606]'
            }`}>
              {story.description || "Hệ thống đang tải dữ liệu... Đừng nhìn ra sau lưng."}
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              {chapters.length > 0 && (
                <button
                  onClick={() => navigate(`/doc/${story.slug || actualStoryId}/chuong-${chapters[0].order + 1}`)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-black tracking-wider uppercase border-2 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                     rinhrapMode === 'thotrang'
                        ? 'bg-[#facaca] hover:bg-[#fff2f1] text-[#780606] border-[#823323]'
                        : 'bg-[#780606] hover:bg-[#9c0800] text-[#ffffff] border-[#780606]'
                  }`}
                >
                  <BookOpen className="w-5 h-5" /> START GAME
                </button>
              )}
              <button
                onClick={handleSaveToggle}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-black tracking-wider uppercase border-2 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                  isSaved 
                    ? (rinhrapMode === 'thotrang'
                       ? 'bg-[#facaca] text-[#780606] border-[#823323] hover:bg-[#fff2f1]'
                       : 'bg-[#facaca] text-[#780606] border-[#780606] hover:bg-[#fde0e0]')
                    : (rinhrapMode === 'thotrang'
                       ? 'bg-[#780606] text-white border-[#823323] hover:bg-[#9c0800]'
                       : 'bg-[#9c0800] text-[#ffffff] border-[#780606] hover:bg-[#823323]')
                }`}
              >
                <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? 'SAVED GAME' : 'SAVE GAME'}
              </button>
              
              <button
                onClick={() => setShowGiftModal(true)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 border-2 ${
                   rinhrapMode === 'thotrang'
                      ? 'bg-[#ffffff] text-[#780606] border-[#823323] hover:bg-[#facaca] shadow-[4px_4px_0_0_#facaca]'
                      : 'bg-[#ffffff] text-[#000000] border-[#000000] hover:bg-[#facaca] hover:text-[#780606] hover:border-[#780606] shadow-[4px_4px_0_0_#9c0800]'
                }`}
              >
                <Gift className="w-5 h-5 text-[#9c0800]" />
                DONATE ITEM
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex justify-center mt-6">
           <div className={`p-1.5 rounded-full inline-flex border transition-all ${
              rinhrapMode === 'thotrang'
                 ? 'bg-[#facaca]/30 border-[#823323]'
                 : 'bg-[#823323]/30 border-[#780606]'
           }`}>
             <button
                onClick={() => setActiveTab('chapters')}
                className={`px-6 py-2 rounded-full text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
                  activeTab === 'chapters' 
                    ? (rinhrapMode === 'thotrang' ? 'bg-[#780606] text-[#ffffff] shadow-md' : 'bg-[#facaca] text-[#780606] shadow-md') 
                    : (rinhrapMode === 'thotrang' ? 'text-[#780606] hover:bg-[#facaca]/50' : 'text-[#facaca] hover:bg-[#780606]/50 hover:text-[#ffffff]')
                }`}
             >
                <Gamepad2 className="w-4 h-4" /> SELECT STAGE
             </button>
             <button
                onClick={() => setActiveTab('comments')}
                className={`px-6 py-2 rounded-full text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
                  activeTab === 'comments' 
                    ? (rinhrapMode === 'thotrang' ? 'bg-[#780606] text-[#ffffff] shadow-md' : 'bg-[#facaca] text-[#780606] shadow-md') 
                    : (rinhrapMode === 'thotrang' ? 'text-[#780606] hover:bg-[#facaca]/50' : 'text-[#facaca] hover:bg-[#780606]/50 hover:text-[#ffffff]')
                }`}
             >
                <Ghost className="w-4 h-4" /> SYSTEM CHAT
             </button>
           </div>
        </div>

        {/* CONTENT AREA */}
        <div className={`rounded-3xl p-6 md:p-10 relative border-4 transition-all ${
           rinhrapMode === 'thotrang'
              ? 'bg-[#ffffff] border-[#823323] shadow-[8px_8px_0_0_#facaca]'
              : 'bg-[#000000] border-[#780606] shadow-[8px_8px_0_0_#facaca]'
        }`}>
          
          {activeTab === 'chapters' && (
            <div className="flex flex-col gap-6">
              <div className={`flex items-center justify-between border-b-2 border-dashed pb-4 transition-all ${
                 rinhrapMode === 'thotrang' ? 'border-[#facaca]' : 'border-[#780606]'
              }`}>
                <h3 className={`font-black text-xl uppercase flex items-center gap-2 ${rinhrapMode === 'thotrang' ? 'text-[#780606]' : 'text-[#ffffff]'}`}>
                  <Skull className="w-6 h-6 text-[#9c0800]" /> DANH SÁCH MÀN CHƠI
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {chapters.length === 0 ? (
                  <p className="text-[#facaca] col-span-2 text-center py-10 font-bold border-2 border-dashed border-[#823323] rounded-xl bg-[#780606]/10">
                    Chưa có màn chơi nào được tải lên...
                  </p>
                ) : (
                  chapters.slice(chapterPage * CHAPTERS_PER_PAGE, (chapterPage + 1) * CHAPTERS_PER_PAGE).map((chap, idx) => {
                    const isPassRequired = chap.requiresPass;
                    const hasPassUnlocked = isPassRequired && (unlockedPassChapters || []).includes(chap.id);
                    const isEarlyAccess = chap.requiresEarlyAccess;
                    const chapTime = chap.createdAt?.toMillis ? chap.createdAt.toMillis() : (typeof chap.createdAt === 'number' ? chap.createdAt : 0);
                    const isStillEarlyAccess = isEarlyAccess && (Date.now() - chapTime < 24 * 60 * 60 * 1000);
                    const hasEarlyAccessUnlocked = isEarlyAccess && (unlockedEarlyAccessChapters || []).includes(chap.id);
                    const isLockedRead = !!chap.isLockedRead;

                    return (
                      <button
                        key={chap.id}
                        onClick={() => navigate(`/doc/${story.slug || actualStoryId}/chuong-${chap.order + 1}`)}
                        className={`group relative p-4 rounded-2xl transition-all text-left flex justify-between items-center overflow-hidden border-2 ${
                           rinhrapMode === 'thotrang'
                              ? 'bg-[#facaca]/20 border-[#facaca] hover:bg-[#facaca]/40 hover:border-[#823323]'
                              : 'bg-[#823323]/20 border-[#780606] hover:bg-[#780606]/40 hover:border-[#facaca]'
                        }`}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(250,202,202,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col gap-1 pr-4 min-w-0">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block w-max border transition-all ${
                             rinhrapMode === 'thotrang'
                                ? 'text-[#780606] bg-[#ffffff] border-[#facaca]'
                                : 'text-[#facaca] bg-[#000000] border-[#780606]'
                          }`}>
                            STAGE {chapterSortDesc ? chapters.length - (chapterPage * CHAPTERS_PER_PAGE) - idx : (chapterPage * CHAPTERS_PER_PAGE) + idx + 1}
                          </span>
                          <span className={`font-bold text-sm line-clamp-1 transition-all ${
                             rinhrapMode === 'thotrang'
                                ? 'text-[#000000] group-hover:text-[#780606]'
                                : 'text-[#ffffff] group-hover:text-[#facaca]'
                          }`}>
                            {chap.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 z-10">
                          {isPassRequired && (
                            hasPassUnlocked ? (
                              <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
                                <Unlock className="w-2.5 h-2.5" /> KEY_OK
                              </span>
                            ) : (
                              <span className="text-[9px] bg-amber-950/60 text-amber-400 border border-amber-900/50 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> REQ_KEY
                              </span>
                            )
                          )}
                          {isEarlyAccess && isStillEarlyAccess && (
                            hasEarlyAccessUnlocked ? (
                              <span className="text-[9px] bg-teal-950/60 text-teal-400 border border-teal-900/50 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 text-teal-400 fill-teal-950" /> VIP_OK
                              </span>
                            ) : (
                              <span className="text-[9px] bg-amber-950/60 text-amber-400 border border-amber-900/30 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5 animate-pulse">
                                <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-100" /> VIP_STAGE
                              </span>
                            )
                          )}
                          {isEarlyAccess && !isStillEarlyAccess && (
                            <span className="text-[9px] bg-gray-950/60 text-gray-500 border border-gray-900 px-1.5 py-0.5 rounded font-mono">
                              PUB_FREE
                            </span>
                          )}
                          {isLockedRead && (
                            <span className="text-[9px] bg-red-950/60 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded font-mono">
                              LOCKED
                            </span>
                          )}
                          {!isPassRequired && !(isEarlyAccess && isStillEarlyAccess) && !isLockedRead && (
                            <RabbitMask className={`w-5 h-5 transition-colors relative z-10 ${
                               rinhrapMode === 'thotrang'
                                  ? 'text-[#823323] group-hover:text-[#780606]'
                                  : 'text-[#9c0800] group-hover:text-[#facaca]'
                            }`} />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col gap-6">
              
              <div className={`border-2 border-dashed p-4 rounded-2xl flex flex-col gap-3 transition-all ${
                 rinhrapMode === 'thotrang'
                    ? 'bg-[#facaca]/20 border-[#823323]'
                    : 'bg-[#780606]/20 border-[#9c0800]'
              }`}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Để lại âm thanh hoặc lời cầu cứu..."
                  rows={3}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none text-sm resize-none font-medium transition-all ${
                     rinhrapMode === 'thotrang'
                        ? 'bg-[#ffffff] text-[#000000] placeholder-[#780606]/40 border-[#facaca] focus:border-[#780606]'
                        : 'bg-[#000000] text-[#ffffff] placeholder-[#823323] border-[#780606] focus:border-[#facaca]'
                  }`}
                />
                
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${
                     rinhrapMode === 'thotrang' ? 'text-[#780606]' : 'text-[#facaca]'
                  }`}>
                    {isLoggedIn ? "> Đường truyền sẵn sàng" : "> Yêu cầu đăng nhập để kết nối đường truyền"}
                  </span>
                  <button 
                    onClick={handleSendComment}
                    disabled={submittingComment || !commentText.trim()}
                    className={`px-5 py-2 text-xs font-black tracking-widest rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 border-2 ${
                       rinhrapMode === 'thotrang'
                          ? 'bg-[#780606] hover:bg-[#9c0800] text-white border-[#823323]'
                          : 'bg-[#ffffff] hover:bg-[#facaca] text-[#000000] border-[#000000]'
                    }`}
                  >
                    GỬI TIN <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-[#780606]/10 border-2 border-dashed border-[#823323] rounded-2xl text-center text-[#facaca] font-bold gap-3">
                    <Ghost className="w-8 h-8 text-[#9c0800] opacity-50" />
                    <p>Không có tiếng động nào. Không gian hoàn toàn im lặng...</p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isGift = comment.type === 'choco_gift';
                    const cacheUser = profilesCache[comment.uid] || {};
                    const avatar = cacheUser.avatarUrl || comment.avatarUrl || '';
                    const dName = cacheUser.displayName || comment.displayName || 'Khách lãng du ẩn danh';
                    const customTitle = cacheUser.activeTitle || comment.activeTitle;
                    const isMe = comment.uid === uid;
                    const currentSticker = isMe ? equippedStickerComment : (cacheUser?.equippedStickerComment ?? cacheUser?.equippedSticker ?? comment.equippedSticker);

                    return (
                      <div 
                        key={comment.id}
                        className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                          isGift 
                            ? (rinhrapMode === 'thotrang' ? 'bg-[#facaca]/30 border-[#823323]' : 'bg-[#facaca]/10 border-[#facaca]') 
                            : (rinhrapMode === 'thotrang' ? 'bg-[#ffffff] border-[#facaca]' : 'bg-[#000000] border-[#780606]')
                        } ${currentSticker ? 'pr-16' : ''}`}
                      >
                        {currentSticker && (
                          <img 
                            src={currentSticker} 
                            alt="Sticker" 
                            className="absolute w-14 h-14 object-contain pointer-events-none z-10 right-2 top-1/2 -translate-y-1/2 drop-shadow-md" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="flex items-start gap-3 relative z-10">
                          <UserAvatar 
                            avatarUrl={avatar} 
                            equippedAccessory={cacheUser.equippedAccessory || comment.equippedAccessory} 
                            accessoryPosition={cacheUser.accessoryPosition || comment.accessoryPosition} 
                            className={`w-10 h-10 shrink-0 border-2 rounded-xl shadow-sm transition-all ${
                               rinhrapMode === 'thotrang' ? 'border-[#823323]' : 'border-[#facaca]'
                            }`} 
                            fallbackIconSizeClass="w-6 h-6 text-[#780606]" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`font-black text-xs tracking-wide transition-all ${
                                 rinhrapMode === 'thotrang' ? 'text-[#780606]' : 'text-[#ffffff]'
                              }`}>
                                {dName}
                              </span>
                              {customTitle && (
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border transition-all ${
                                   rinhrapMode === 'thotrang'
                                      ? 'bg-[#780606] text-white border-[#823323]'
                                      : 'bg-[#9c0800] text-[#ffffff] border-[#facaca]'
                                }`}>
                                  {customTitle.name || customTitle}
                                </span>
                              )}
                              <span className={`text-[9px] font-bold ml-auto transition-all ${
                                 rinhrapMode === 'thotrang' ? 'text-[#823323]/80' : 'text-[#823323]'
                              }`}>
                                {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yy HH:mm') : 'NOW'}
                              </span>
                            </div>

                            {isGift && (
                              <div className={`mt-1 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black max-w-max border-2 shadow-sm transition-all ${
                                 rinhrapMode === 'thotrang'
                                    ? 'bg-[#780606] text-[#fff2f1] border-[#823323]'
                                    : 'bg-[#facaca] text-[#780606] border-[#ffffff]'
                              }`}>
                                <RabbitMask className="w-3.5 h-3.5" /> SUPPORT DROP: {comment.giftAmount} CC
                              </div>
                            )}

                            <p className={`mt-2 text-sm font-medium leading-relaxed transition-all ${
                               rinhrapMode === 'thotrang' ? 'text-[#000000]' : 'text-[#fff2f1]'
                            }`}>
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* GIFT MODAL */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-[#000000]/90 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-sm p-6 rounded-[2rem] relative border-4 transition-all ${
             rinhrapMode === 'thotrang'
                ? 'bg-[#ffffff] border-[#823323] shadow-[0_0_40px_rgba(250,202,202,0.8)]'
                : 'bg-[#000000] border-[#facaca] shadow-[0_0_40px_rgba(156,8,0,0.6)]'
          }`}>
            <div className={`absolute -top-6 -right-6 p-2 rounded-full border-4 transition-all ${
               rinhrapMode === 'thotrang' ? 'bg-[#780606] border-[#823323]' : 'bg-[#ffffff] border-[#000000]'
            }`}>
               <RabbitMask className={`w-8 h-8 ${rinhrapMode === 'thotrang' ? 'text-[#fff2f1]' : 'text-[#9c0800]'}`} />
            </div>
            
            <h3 className={`text-xl font-black mb-2 uppercase tracking-widest flex items-center gap-2 transition-all ${
               rinhrapMode === 'thotrang' ? 'text-[#780606]' : 'text-[#ffffff]'
            }`}>
              <Sparkles className={`w-5 h-5 ${rinhrapMode === 'thotrang' ? 'text-[#823323]' : 'text-[#facaca]'}`} /> REQUEST SUPPORT
            </h3>
            <p className={`text-xs mb-6 font-bold leading-relaxed transition-all ${
               rinhrapMode === 'thotrang' ? 'text-[#823323]' : 'text-[#facaca]'
            }`}>
              Cung cấp vật phẩm để giúp nhân vật chính sống sót lâu hơn trong hệ thống.
            </p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className={`text-[10px] font-black mb-1.5 uppercase flex items-center gap-1 transition-all ${
                   rinhrapMode === 'thotrang' ? 'text-[#780606]' : 'text-[#ffffff]'
                }`}>
                   <Gift className="w-3 h-3" /> VẬT PHẨM (SỐ DƯ: {choco} CC)
                </label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className={`w-full border-2 p-3 rounded-xl text-sm font-bold focus:outline-none transition-all ${
                     rinhrapMode === 'thotrang'
                        ? 'bg-[#facaca]/20 text-[#000000] border-[#facaca] focus:border-[#780606]'
                        : 'bg-[#780606]/20 text-[#ffffff] border-[#823323] focus:border-[#facaca]'
                  }`}
                  min="1"
                />
              </div>
              
              <div>
                <label className={`text-[10px] font-black mb-1.5 uppercase flex items-center gap-1 transition-all ${
                   rinhrapMode === 'thotrang' ? 'text-[#780606]' : 'text-[#ffffff]'
                }`}>
                   <Send className="w-3 h-3" /> LỜI NHẮN ĐÍNH KÈM
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Cẩn thận Thỏ Đỏ sau lưng bạn..."
                  rows={3}
                  className={`w-full border-2 p-3 rounded-xl text-xs font-bold focus:outline-none resize-none transition-all ${
                     rinhrapMode === 'thotrang'
                        ? 'bg-[#facaca]/20 text-[#000000] border-[#facaca] focus:border-[#780606]'
                        : 'bg-[#780606]/20 text-[#ffffff] border-[#823323] focus:border-[#facaca]'
                  }`}
                />
              </div>
              
              <div className="flex gap-3 pt-2 mt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className={`flex-1 py-2 border-2 rounded-xl text-xs font-black uppercase transition-all ${
                     rinhrapMode === 'thotrang'
                        ? 'border-[#facaca] text-[#780606] hover:bg-[#facaca]/45'
                        : 'border-[#823323] text-[#facaca] hover:bg-[#823323]'
                  }`}
                >
                  HỦY BỎ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all border-2 ${
                     rinhrapMode === 'thotrang'
                        ? 'bg-[#780606] text-white border-[#823323] hover:bg-[#9c0800]'
                        : 'bg-[#facaca] text-[#000000] hover:bg-[#facaca]'
                  }`}
                >
                  XÁC NHẬN GỬI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Scroll, Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

export function TinhYeuThuyTienTheme(props: ThemeProps) {
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

  const displayedChapters = [...chapters]
    .sort((a, b) => {
      const aNum = a.orderIndex !== undefined ? a.orderIndex : parseFloat(a.title?.match(/\d+/)?.[0] || '0');
      const bNum = b.orderIndex !== undefined ? b.orderIndex : parseFloat(b.title?.match(/\d+/)?.[0] || '0');
      return chapterSortDesc ? bNum - aNum : aNum - bNum;
    })
    .slice(chapterPage * CHAPTERS_PER_PAGE, (chapterPage + 1) * CHAPTERS_PER_PAGE);

  // Thần thoại Hy Lạp & Ái tình tự luyến tột cùng của Narcissus
  const reflections = [
    "“Hỡi dung nhan tuyệt mỹ khôn cùng dưới làn nước lạnh, thế gian làm sao có thể sánh được với bóng hình tiên tử của chính ta?”",
    "“Cớ sao mỗi lần ta cúi xuống trao nụ hôn thành kính, ngươi lại tan vỡ thành muôn vàn vòng sóng xao động rồi lẩn tránh ta?”",
    "“Ta tự say đắm bóng hình của chính mình. Sự kiêu hãnh của cõi trần gian đều phải cúi đầu trước nhan sắc thần thánh này.”",
    "“Không một tiên nữ hay phàm nhân nào xứng đáng có được ái tình này. Ta nguyện dâng hiến cả sinh mệnh để ôm lấy bóng mình dưới đáy suối thẳm.”",
    "“Yêu một bóng hình hư ảo, tự si mê chính sinh mệnh mình, đó không phải là lời nguyền, đó là đặc ân tuyệt diệu nhất của tạo hóa.”",
    "Đóa hoa Thủy Tiên muôn đời soi bóng xuống dòng nước lặng, mọc lên từ nơi trái tim rực cháy ngọn lửa tự luyến của Narcissus.",
    "“Thần chết có thể mang đi hơi thở, nhưng vĩnh viễn không thể cướp đi sự sùng bái tuyệt đối mà ta dành cho bản thân.”",
    "“Chạm khẽ vào bóng gương soi, ta thấy cả thiên đường và địa ngục, tất cả đều tan chảy trong ánh mắt si mê của chính ta dành cho mình.”"
  ];

  const [reflectionIdx, setReflectionIdx] = useState(0);
  const [isRippling, setIsRippling] = useState(false);

  const handleTouchWater = () => {
    if (isRippling) return;
    setIsRippling(true);
    let nextIdx = reflectionIdx;
    while (nextIdx === reflectionIdx) {
      nextIdx = Math.floor(Math.random() * reflections.length);
    }
    setTimeout(() => {
      setReflectionIdx(nextIdx);
      setIsRippling(false);
    }, 800);
  };

  return (
    <div className="bg-[#0E0C0A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2E251E] via-[#0E0C0A] to-[#0E0C0A] min-h-screen text-[#EADDC9] font-serif selection:bg-[#9A8E7D] selection:text-[#0E0C0A] pb-24 relative overflow-x-hidden">
      
      {/* BACKGROUND GRAPHICS: SACRED GREEK SYMBOLS */}
      <div className="absolute top-48 left-0 right-0 h-[600px] pointer-events-none opacity-[0.02] flex justify-between px-10">
        <svg className="w-96 h-96" viewBox="0 0 100 100" fill="none" stroke="#EADDC9" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" strokeDasharray="3,3" />
          <path d="M 50 5 L 95 50 L 50 95 L 5 50 Z" />
          <circle cx="50" cy="50" r="25" />
        </svg>
        <svg className="w-96 h-96 transform rotate-45" viewBox="0 0 100 100" fill="none" stroke="#EADDC9" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" />
          <polygon points="50,10 90,80 10,80" />
        </svg>
      </div>

      {/* STICKY TOP MEANDER BANNER */}
      <div className="border-b-2 border-[#9A8E7D]/40 bg-gradient-to-r from-[#0E0C0A] via-[#241D18] to-[#0E0C0A] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
        <div className="absolute top-0.5 left-0 right-0 h-1 opacity-20 bg-[linear-gradient(90deg,#9A8E7D_2px,transparent_2px)] bg-[length:10px_100%]" />
        <div className="absolute bottom-0.5 left-0 right-0 h-1 opacity-20 bg-[linear-gradient(90deg,#9A8E7D_2px,transparent_2px)] bg-[length:10px_100%]" />

        {/* Back button styled like a classical tablet */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#241D18]/90 hover:bg-[#9A8E7D]/20 text-[#EADDC9] text-xs font-sans font-bold tracking-widest border border-[#9A8E7D]/30 transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>QUAY LẠI</span>
        </button>

        {/* Central Logo */}
        <div className="flex items-center gap-3">
          <span className="text-[#9A8E7D] text-xs font-sans tracking-widest hidden sm:block uppercase font-bold opacity-60">SỬ THI</span>
          <h2 className="font-bold text-[#EADDC9] font-serif text-lg md:text-2xl tracking-[0.2em] uppercase italic flex items-center gap-2">
            NARCISSUS
          </h2>
          <span className="text-[#9A8E7D] text-xs font-sans tracking-widest hidden sm:block uppercase font-bold opacity-60">HY LẠP</span>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-[#241D18] border border-[#9A8E7D]/30 text-[#9A8E7D]">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-4 md:p-8 relative z-10 flex flex-col gap-12">
        
        {/* ==================== 1. THE ARCHITECTURAL TEMPLE SHRINE ==================== */}
        <div className="w-full flex flex-col items-center">
          
          {/* Classical Greek Pediment (Mái tam giác đầu hồi đền thờ) */}
          <div className="w-full max-w-[800px] flex flex-col items-center relative">
            <svg className="w-full h-16 md:h-24 text-[#9A8E7D] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 800 100" fill="currentColor">
              {/* Triangular roof */}
              <polygon points="400,10 10,90 790,90" fill="#1C1713" stroke="#9A8E7D" strokeWidth="3" />
              {/* Sculpture inside the pediment - decorative flowers and leaves */}
              <circle cx="400" cy="60" r="10" fill="none" stroke="#9A8E7D" strokeWidth="2" />
              <path d="M 380,70 Q 400,50 420,70" fill="none" stroke="#9A8E7D" strokeWidth="2" />
              <path d="M 330,85 C 360,70 370,85 390,75" fill="none" stroke="#9A8E7D" strokeWidth="1.5" />
              <path d="M 470,85 C 440,70 430,85 410,75" fill="none" stroke="#9A8E7D" strokeWidth="1.5" />
              {/* Bottom architrave line */}
              <rect x="0" y="90" width="800" height="10" fill="#2E251E" stroke="#9A8E7D" strokeWidth="2" />
            </svg>

            {/* Frieze / Metopes (Thanh dầm trang trí) */}
            <div className="w-[98%] bg-[#1A1512] border-x-2 border-[#9A8E7D] py-1 px-4 flex justify-between text-[10px] text-[#9A8E7D]/50 font-sans tracking-[0.3em] uppercase">
              <span>✦ TEMPUS ✦</span>
              <span>✦ AMOR ✦</span>
              <span>✦ FATA ✦</span>
              <span>✦ REFLEXIO ✦</span>
              <span>✦ VITA ✦</span>
            </div>

            {/* Core Shrine Area bounded by Columns */}
            <div className="w-full bg-[#16120F] border-2 border-[#9A8E7D] rounded-b-2xl p-6 md:p-10 flex flex-col items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-[#2E251E]/20 via-transparent to-transparent pointer-events-none" />
              
              {/* Decorative Corner Seals */}
              <div className="absolute top-4 left-4 text-xs text-[#9A8E7D]/30">α</div>
              <div className="absolute top-4 right-4 text-xs text-[#9A8E7D]/30">ω</div>
              <div className="absolute bottom-4 left-4 text-xs text-[#9A8E7D]/30">ψ</div>
              <div className="absolute bottom-4 right-4 text-xs text-[#9A8E7D]/30">φ</div>

              {/* Cover Fresco Frame */}
              <div className="relative w-56 md:w-64 aspect-[3/4] bg-[#0E0C0A] rounded-xl overflow-hidden border-4 border-[#9A8E7D] shadow-[0_15px_30px_rgba(0,0,0,0.8)] group transition-all duration-500 hover:border-[#EADDC9]">
                <img 
                  src={story.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=1000'} 
                  alt={story.title}
                  className="w-full h-full object-cover opacity-80 contrast-110 saturate-[0.8] group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0C0A] via-transparent to-transparent" />
                <div className="absolute inset-2 border border-[#9A8E7D]/20 rounded-lg pointer-events-none" />
              </div>

              {/* Title & Author Info */}
              <div className="text-center mt-8 max-w-2xl relative">
                <span className="text-[10px] text-[#9A8E7D] tracking-[0.4em] uppercase font-sans font-black block mb-3">BI KỊCH HOA THỦY TIÊN</span>
                <h1 className="text-3xl md:text-5xl font-bold tracking-wider text-[#EADDC9] uppercase drop-shadow-lg leading-tight font-serif italic">
                  {story.title}
                </h1>
                <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-[#9A8E7D]/50 to-transparent mx-auto mt-4" />
                <p className="text-xs text-[#9A8E7D] mt-4 font-sans uppercase tracking-[0.2em]">
                  Chắp bút bởi hiền nhân: <span className="text-[#EADDC9] font-bold">{story.author}</span>
                </p>
              </div>

              {/* Story Ledger Stats integrated into Temple base */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-xl mt-8 pt-6 border-t border-[#9A8E7D]/20 font-sans text-center">
                <div className="bg-[#1F1915] border border-[#9A8E7D]/20 rounded-xl p-3 shadow-inner">
                  <span className="block text-[#9A8E7D] text-[9px] font-bold tracking-widest uppercase mb-1">MỤC SỬ THI</span>
                  <span className="text-[#EADDC9] text-lg font-serif font-bold">{chapters.length} Chương</span>
                </div>
                <div className="bg-[#1F1915] border border-[#9A8E7D]/20 rounded-xl p-3 shadow-inner">
                  <span className="block text-[#9A8E7D] text-[9px] font-bold tracking-widest uppercase mb-1">SOI CHIẾU BIỂU</span>
                  <span className="text-[#EADDC9] text-lg font-serif font-bold">
                    {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)} Lượt
                  </span>
                </div>
                <div className="bg-[#1F1915] border border-[#9A8E7D]/20 rounded-xl p-3 shadow-inner">
                  <span className="block text-[#9A8E7D] text-[9px] font-bold tracking-widest uppercase mb-1">DÂNG LỄ CC</span>
                  <span className="text-[#EADDC9] text-lg font-serif font-bold flex items-center justify-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-[#9A8E7D] text-[#9A8E7D]" /> {totalGiftedChoco}
                  </span>
                </div>
              </div>

              {/* Horizontal Altar Action Buttons */}
              <div className="w-full max-w-xl mt-8 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => chapters.length > 0 && navigate(`/doc/${story.id}/${chapters[0].id}`)}
                  className="flex-1 py-4 bg-[#9A8E7D] hover:bg-[#EADDC9] text-[#0E0C0A] uppercase text-xs font-sans font-black tracking-[0.2em] rounded-xl transition-all duration-300 flex justify-center items-center gap-2 border-2 border-[#9A8E7D] shadow-[0_4px_15px_rgba(154,142,125,0.2)] cursor-pointer"
                >
                  XEM SỬ THI <BookOpen className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSaveToggle}
                  className={`px-6 py-4 rounded-xl border-2 uppercase text-[10px] font-sans font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer ${savedStories.includes(story.id) ? 'bg-[#2E251E] border-[#9A8E7D] text-[#EADDC9]' : 'bg-transparent border-[#9A8E7D]/40 text-[#9A8E7D] hover:border-[#9A8E7D] hover:text-[#EADDC9]'}`}
                >
                  <Bookmark className={`w-4 h-4 ${savedStories.includes(story.id) ? 'fill-[#9A8E7D] text-[#9A8E7D]' : ''}`} /> 
                  {savedStories.includes(story.id) ? 'ĐÃ KHẮC GHI' : 'KHẮC ĐỊNH MỆNH'}
                </button>
                <button 
                  onClick={() => setShowGiftModal(true)}
                  className="px-6 py-4 bg-transparent hover:bg-[#9A8E7D]/10 text-[#9A8E7D] hover:text-[#EADDC9] border-2 border-[#9A8E7D]/40 hover:border-[#9A8E7D] uppercase text-[10px] font-sans font-bold tracking-widest rounded-xl transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer"
                >
                  <Gift className="w-4 h-4" /> DÂNG NECTAR
                </button>
              </div>

            </div>
          </div>
        </div>


        {/* ==================== 2. THE SACRED WATER REFLECTION POOL ==================== */}
        <div className="w-full max-w-[900px] mx-auto">
          <div className="border-2 border-[#9A8E7D]/60 bg-gradient-to-b from-[#1F1915] to-[#0E0C0A] rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl text-center">
            
            {/* Pool Steps Frame Design */}
            <div className="absolute inset-0 border-[6px] border-double border-[#9A8E7D]/20 rounded-2xl pointer-events-none" />
            <span className="text-[9px] text-[#9A8E7D]/40 tracking-[0.3em] uppercase block mb-4 font-sans font-bold">HỒ NƯỚC THẦN THOẠI NARCISSUS</span>
            
            <div className="relative max-w-2xl mx-auto py-8 px-4 flex flex-col items-center">
              
              {/* Ripple water pool container */}
              <div className="w-full min-h-[160px] flex items-center justify-center p-6 bg-[#0E0C0A] border border-[#9A8E7D]/30 rounded-full relative overflow-hidden shadow-[inset_0_0_40px_rgba(154,142,125,0.4)] transition-all duration-500">
                {isRippling && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 rounded-full border-2 border-[#9A8E7D]/30 animate-ping absolute" />
                    <div className="w-40 h-40 rounded-full border border-[#9A8E7D]/20 animate-ping absolute" />
                    <div className="w-60 h-60 rounded-full border border-[#9A8E7D]/10 animate-ping absolute" />
                  </div>
                )}
                
                {/* Mythological flower silhouette in background water pool */}
                <div className="absolute opacity-[0.04] pointer-events-none">
                  <svg width="150" height="150" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M50 10 C45 30, 25 45, 10 50 C25 55, 45 70, 50 90 C55 70, 75 55, 90 50 C75 45, 55 30, 50 10 Z" />
                    <circle cx="50" cy="50" r="10" />
                  </svg>
                </div>

                <p className={`text-base md:text-lg text-[#EADDC9] italic font-serif leading-relaxed tracking-wide text-center relative z-10 max-w-lg transition-all duration-500 ${isRippling ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
                  {reflections[reflectionIdx]}
                </p>
              </div>

              {/* Ripple Trigger */}
              <button 
                onClick={handleTouchWater}
                disabled={isRippling}
                className="mt-6 px-8 py-3 bg-[#9A8E7D] hover:bg-[#EADDC9] text-[#0E0C0A] border border-[#9A8E7D] text-xs font-sans font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-lg hover:scale-105 disabled:opacity-50 cursor-pointer"
              >
                {isRippling ? 'Suối Thần xao động...' : 'Chạm vào mặt hồ soi bóng'}
              </button>
              <p className="text-[10px] text-[#9A8E7D]/60 italic font-serif mt-3">Mặt hồ soi chiếu dung nhan kiệt tác và ngọn lửa ái tình tự luyến thiêng liêng</p>

            </div>
          </div>
        </div>


        {/* ==================== 3. STORY PARCHMENT DESCRIPTION ==================== */}
        <div className="w-full max-w-[900px] mx-auto">
          <div className="border-4 border-double border-[#9A8E7D]/50 bg-[#16120F] text-[#EADDC9] p-6 md:p-10 rounded-2xl relative shadow-2xl">
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#9A8E7D]/30" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#9A8E7D]/30" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#9A8E7D]/30" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#9A8E7D]/30" />

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-[#9A8E7D]/20 pb-4">
                <Scroll className="w-5 h-5 text-[#9A8E7D]" />
                <h3 className="font-serif text-[#EADDC9] text-xl font-bold uppercase tracking-widest">Ghi Chép Sử Thi</h3>
              </div>
              
              <p className="leading-relaxed text-base md:text-lg font-serif italic text-[#EADDC9] text-justify whitespace-pre-line font-medium leading-relaxed">
                {story.description || "Truyền thuyết tráng lệ kể về Narcissus - chàng mục đồng có dung nhan tuyệt mỹ hoàn hảo vô song nhưng lại dửng dưng trước mọi lưới ái tình trần thế, khiến nữ thần báo ứng Nemesis dâng lên lời nguyền bi kịch. Chàng say đắm cuồng si chính dung nhan của mình in bóng dưới đáy hồ nước trong veo, yêu mến khát khao đến mức tan chảy hóa thành đóa hoa Thủy Tiên nghiêng mình soi bóng cô liêu..."}
              </p>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-[#9A8E7D]/20">
                {story.genres?.map((g: string) => (
                  <span key={g} className="px-3 py-1 bg-[#2E251E] text-[#EADDC9] text-[9px] font-sans font-bold tracking-widest rounded-md border border-[#9A8E7D]/30 uppercase">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ==================== 4. SYMMETRIC SANCTUARY PORTICO (SIDE-BY-SIDE) ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full mt-4">
          
          {/* LEFT PORTICO: KHẢI HUYỀN THƯ TỊCH (Chapters list) */}
          <div className="border-2 border-[#9A8E7D]/40 bg-[#16120F]/90 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-[#9A8E7D]/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-[#9A8E7D] rounded-full animate-pulse" />
                <h3 className="font-serif text-lg font-bold uppercase tracking-widest text-[#EADDC9]">Mục Khải Huyền ({chapters.length})</h3>
              </div>
              <button 
                onClick={() => setChapterSortDesc(!chapterSortDesc)}
                className="text-xs text-[#9A8E7D] hover:text-[#EADDC9] font-sans font-bold tracking-wider uppercase cursor-pointer"
              >
                {chapterSortDesc ? 'Mới nhất trước' : 'Cũ nhất trước'}
              </button>
            </div>

            <div className="flex flex-col gap-3 min-h-[400px]">
              {displayedChapters.length === 0 ? (
                <div className="flex items-center justify-center p-12 bg-[#0E0C0A]/40 border border-[#9A8E7D]/10 rounded-xl text-center text-xs text-[#9A8E7D]/50 font-serif italic">
                  Các trang thư tịch cổ đang được thần cai quản bảo hộ hoặc chưa ghi chép.
                </div>
              ) : (
                displayedChapters.map((chap) => (
                  <div 
                    key={chap.id}
                    onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                    className="group p-4 bg-[#211915]/50 hover:bg-[#2E251E] border border-[#9A8E7D]/10 hover:border-[#9A8E7D] rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#0E0C0A] flex items-center justify-center text-xs text-[#9A8E7D] border border-[#9A8E7D]/20 group-hover:border-[#9A8E7D] transition-all font-serif font-black">
                        {chap.order}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-bold text-sm md:text-base text-[#EADDC9] group-hover:text-[#9A8E7D] transition-colors truncate">
                          {chap.title}
                        </h4>
                        <span className="text-[9px] text-[#9A8E7D]/50 block mt-0.5 uppercase tracking-widest font-sans font-bold">
                          TRANG CHÉP CỔ TỰ
                        </span>
                      </div>
                    </div>
                    
                    {/* Ancient Arrow design */}
                    <div className="w-7 h-7 rounded-full bg-[#0E0C0A]/30 flex items-center justify-center border border-[#9A8E7D]/10 group-hover:border-[#9A8E7D]/50 transition-all">
                      <span className="text-[#9A8E7D] text-xs font-sans font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* PAGINATION COINS */}
            {chapters.length > CHAPTERS_PER_PAGE && (
              <div className="flex justify-center gap-3 border-t border-[#9A8E7D]/10 pt-4">
                <button 
                  disabled={chapterPage === 0}
                  onClick={() => setChapterPage(chapterPage - 1)}
                  className="px-4 py-2 bg-[#0E0C0A] text-[#9A8E7D] hover:text-[#EADDC9] border border-[#9A8E7D]/20 hover:border-[#9A8E7D] rounded-lg disabled:opacity-30 transition-all text-xs font-sans font-bold uppercase cursor-pointer"
                >
                  ◀ Lùi trang
                </button>
                <button 
                  disabled={(chapterPage + 1) * CHAPTERS_PER_PAGE >= chapters.length}
                  onClick={() => setChapterPage(chapterPage + 1)}
                  className="px-4 py-2 bg-[#0E0C0A] text-[#9A8E7D] hover:text-[#EADDC9] border border-[#9A8E7D]/20 hover:border-[#9A8E7D] rounded-lg disabled:opacity-30 transition-all text-xs font-sans font-bold uppercase cursor-pointer"
                >
                  Tiến trang ▶
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PORTICO: VANG VỌNG TRẦN THẾ (Comments area) */}
          <div className="border-2 border-[#9A8E7D]/40 bg-[#16120F]/90 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
            <div className="border-b border-[#9A8E7D]/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-[#9A8E7D] rounded-full animate-pulse" />
                <h3 className="font-serif text-lg font-bold uppercase tracking-widest text-[#EADDC9]">Tiếng Vọng Trần Thế ({comments.length})</h3>
              </div>
            </div>

            {/* Whisper Composer */}
            <div className="bg-[#0E0C0A] border border-[#9A8E7D]/30 p-4 rounded-xl flex flex-col gap-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Thổ lộ lòng tự ngưỡng mộ bản thân hoặc lời ca tụng nhan sắc tuyệt mỹ..."
                rows={3}
                className="w-full bg-[#0E0C0A] text-[#EADDC9] placeholder-[#9A8E7D]/30 p-2 rounded-lg border border-[#2E251E] focus:outline-none focus:border-[#9A8E7D] text-sm resize-none font-serif italic"
              />
              
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#9A8E7D]/50 italic font-sans font-bold">
                  {isLoggedIn ? "Tên bạn sẽ khắc trên đá thần..." : "Cần đăng nhập để tạc đá tích..."}
                </span>
                <button 
                  onClick={handleSendComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="px-4 py-1.5 bg-[#9A8E7D] hover:bg-[#EADDC9] text-[#0E0C0A] text-xs font-sans font-black tracking-widest rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  KHẮC LỜI <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* WHISPERS LIST */}
            <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.length === 0 ? (
                <div className="flex items-center justify-center p-12 bg-[#0E0C0A]/40 border border-[#9A8E7D]/10 rounded-xl text-center text-xs text-[#9A8E7D]/50 font-serif italic">
                  Yên ắng tĩnh lặng. Chưa có tiếng vọng của nhà lữ hành nào được ghi lại.
                </div>
              ) : (
                comments.map((comment) => {
                  const isGift = comment.type === 'choco_gift';
                  const cacheUser = profilesCache[comment.uid] || {};
                  const avatar = cacheUser.avatarUrl || comment.avatarUrl || '';
                  const dName = cacheUser.displayName || comment.displayName || 'Khách lãng du ẩn danh';
                  const customTitle = cacheUser.activeTitle || comment.activeTitle;
                  
                  return (
                    <div 
                      key={comment.id}
                      className={`p-4 rounded-xl border transition-all duration-300 ${isGift ? 'bg-[#2E251E]/60 border-[#9A8E7D]' : 'bg-[#0E0C0A]/60 border-[#2E251E]'}`}
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar 
                          avatarUrl={avatar} 
                          equippedAccessory={cacheUser.equippedAccessory || comment.equippedAccessory} 
                          accessoryPosition={cacheUser.accessoryPosition || comment.accessoryPosition} 
                          className="w-9 h-9 shrink-0 pointer-events-none" 
                          fallbackIconSizeClass="w-5 h-5 text-[#EADDC9]" 
                          borderClass="border border-[#9A8E7D]/30"
                          bgClass="bg-[#1F1915]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-[#EADDC9] hover:underline cursor-pointer">
                              {dName}
                            </span>
                            {customTitle && (
                              <span className="px-2 py-0.5 bg-[#2E251E] text-[#9A8E7D] rounded text-[8px] font-sans font-black uppercase tracking-wider border border-[#9A8E7D]/30">
                                {customTitle.name || customTitle}
                              </span>
                            )}
                            <span className="text-[9px] text-[#9A8E7D]/50 font-sans">
                              {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : 'Hôm nay'}
                            </span>
                          </div>

                          {/* Gift Tag */}
                          {isGift && (
                            <div className="mt-1.5 flex items-center gap-1.5 bg-[#0E0C0A] border border-[#9A8E7D]/40 px-2 py-0.5 rounded text-[10px] text-[#9A8E7D] font-sans font-bold max-w-max shadow-sm">
                              <Gift className="w-3 h-3" /> Đã dâng {comment.giftAmount} CC tôn vinh nhan sắc tự nhiên
                            </div>
                          )}

                          <p className="mt-2 text-xs md:text-sm text-[#EADDC9] whitespace-pre-line font-serif italic text-justify leading-relaxed">
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

        </div>

      </div>

      {/* GIFT MODAL */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-[#0E0C0A]/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#16120F] border-4 border-double border-[#9A8E7D] w-full max-w-md p-6 rounded-2xl shadow-2xl relative text-[#EADDC9]">
            <h3 className="font-serif text-[#EADDC9] text-xl font-bold mb-1 uppercase tracking-widest">DÂNG HIẾN LỄ VẬT CỦA SẮC ĐẸP</h3>
            <p className="text-xs text-[#9A8E7D] mb-5">Hương vị Nectar ngọt lành tôn kính chàng mỹ nam Narcissus tự soi dung nhan bên suối thẳm.</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#9A8E7D] font-sans font-bold block mb-1 uppercase">Lễ vật Choco (Túi của bạn: {choco} CC)</label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0E0C0A] text-[#EADDC9] border border-[#9A8E7D]/30 p-3 rounded-lg text-sm focus:outline-none focus:border-[#9A8E7D] font-sans"
                  min="1"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#9A8E7D] font-sans font-bold block mb-1 uppercase font-bold">Khắc tạc tâm nguyện</label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi lời chúc phúc, nguyện cầu vang vọng ngàn thu..."
                  rows={3}
                  className="w-full bg-[#0E0C0A] text-[#EADDC9] border border-[#9A8E7D]/30 p-3 rounded-lg text-xs focus:outline-none resize-none font-serif italic focus:border-[#9A8E7D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 border border-[#9A8E7D]/30 text-[#9A8E7D] hover:text-[#EADDC9] rounded-lg text-xs font-sans font-bold transition-all cursor-pointer uppercase"
                >
                  BÃI LỄ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="px-4 py-2 bg-[#9A8E7D] text-[#0E0C0A] hover:bg-[#EADDC9] rounded-lg text-xs font-sans font-black tracking-widest transition-all cursor-pointer uppercase"
                >
                  DÂNG LỄ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

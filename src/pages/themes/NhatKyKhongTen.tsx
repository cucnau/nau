import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, PenTool, Scroll, MessageSquare, Heart, Activity, ArrowLeft, Scissors, Lock, Unlock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

export function NhatKyKhongTenTheme(props: ThemeProps) {
  const {
    story, chapters, comments, activeTab, setActiveTab,
    chapterPage, setChapterPage, chapterSortDesc, setChapterSortDesc, CHAPTERS_PER_PAGE,
    showGiftModal, setShowGiftModal, giftAmount, setGiftAmount, giftMessage, setGiftMessage, handleGiftSubmit,
    commentText, setCommentText, submittingComment, handleSendComment,
    isLoggedIn, savedStories, handleSaveToggle, choco, navigate,
    profilesCache = {}, getTitleColor, uid, unlockedPassChapters, unlockedEarlyAccessChapters
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

  // Marionette Soul Interaction: Whispers from the wooden puppet
  const whispers = [
    "Sự thẹn thùng buộc tôi phải im lặng, đốt đi những lá thư đây lời tình tự, để tro tàn hòa vào làn sóng thời đại, vĩnh viễn chôn vùi trong quá khứ.",
    "Có lẽ trong mắt bạn đây chỉ là lời mê sảng của một kẻ điên nào đó, vậy thì xin đừng bận tâm, tôi chỉ là giả vờ hào phóng cho bạn xem một cái, giống như một đứa trẻ bưng ra món đồ chơi yêu quý nhất của mình lúc rảnh rỗi thôi.",
    "Trong tiếng nhạc cầu nguyện, tôi mang theo một niềm hạnh phúc không rõ là gì, bị lay động đưa về phía cái chết đen kịt như đêm ở phương ха.",
    "Có lẽ những khát vọng tưởng chừng đã biến mất ấy chỉ bị phong ấn, giờ đây phong ấn được giải trừ, chúng tràn ra, ranh giới mỏng manh đang sụp đổ một cách điên cuồng.",
    "Bây giờ.\nTôi không yêu người mẹ kỹ nữ của mình.\nTôi không yêu người mẹ quý phu nhân của mình.\nTôi yêu chủ nhân của mình.\nYêu anh ấy một cách bệnh hoạn."
  ];

  const [whisperIdx, setWhisperIdx] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handlePullString = () => {
    if (isPulling) return;
    setIsPulling(true);
    let nextIdx = whisperIdx;
    while (nextIdx === whisperIdx) {
      nextIdx = Math.floor(Math.random() * whispers.length);
    }
    setTimeout(() => {
      setWhisperIdx(nextIdx);
      setIsPulling(false);
    }, 600);
  };

  return (
    <div className="bg-[#C9B695] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D5C2A5] via-[#C9B695] to-[#BCA782] min-h-screen text-[#2C1814] font-reading-cormorant selection:bg-[#BCA782] selection:text-[#E8DCC4] pb-16 relative overflow-x-hidden">
      
      {/* Decorative Puppet Strings hanging from the ceiling */}
      <div className="absolute top-0 left-12 w-[1px] h-32 bg-gradient-to-b from-[#BCA782]/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-24 w-[1px] h-48 bg-gradient-to-b from-[#BCA782]/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-16 w-[1px] h-40 bg-gradient-to-b from-[#BCA782]/30 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-32 w-[1px] h-20 bg-gradient-to-b from-[#BCA782]/20 to-transparent pointer-events-none" />

      {/* Top Thread Bar - Stylized Diary Header with Stitched Leather Look & Back Navigation */}
      <div className="border-b-2 border-[#BCA782] bg-gradient-to-r from-[#DFCEB4] via-[#E8DCC4] to-[#DFCEB4] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xl relative overflow-hidden">
        {/* Top & Bottom stitched thread lines */}
        <div className="absolute top-1 left-0 right-0 border-t border-dashed border-[#BCA782]/60 pointer-events-none" />
        <div className="absolute bottom-1 left-0 right-0 border-b border-dashed border-[#BCA782]/60 pointer-events-none" />

        {/* Back Button - Styled as a vintage brass key ornament */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DFCEB4]/40 hover:bg-[#BCA782]/30 text-[#2C1814] text-xs font-sans font-black tracking-widest border border-[#BCA782]/60 transition-all cursor-pointer group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-[#2C1814]" />
          <span>TRỞ VỀ</span>
        </button>

        {/* Central Title */}
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-[#BCA782] hidden md:block animate-pulse" />
          <h2 className="relative font-bold text-[#2C1814] font-serif text-lg md:text-2xl tracking-widest italic flex items-center gap-2">
            <span className="text-[#BCA782] font-normal font-sans text-xs md:text-sm">✦</span>
            Một cuốn nhật ký không tên
            <span className="text-[#BCA782] font-normal font-sans text-xs md:text-sm">✦</span>
            <span className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#BCA782]/60 to-transparent" />
          </h2>
          <Scroll className="w-4 h-4 text-[#BCA782] hidden md:block" />
        </div>

        {/* Right decoration representing scissors cutting puppet threads */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#2C1814]/70 font-sans tracking-widest hidden sm:block uppercase font-bold">Cắt Đứt Tơ Rối</span>
          <div className="p-1.5 rounded-lg bg-[#DFCEB4]/40 border border-[#BCA782]/60 text-[#2C1814] hover:bg-[#BCA782]/30 transition-all cursor-pointer" title="Cắt đứt tơ rối">
            <Scissors className="w-3.5 h-3.5 rotate-45" />
          </div>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10 mt-2">
        
        {/* LEFT COLUMN - THE ANCIENT LEATHER DIARY BINDER */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-24 flex flex-col gap-6">
            
            {/* Diary Book Bound Cover */}
            <div className="border-4 border-[#BCA782] bg-[#D5C2A5] p-5 rounded-2xl shadow-[0_15px_35px_rgba(44,24,20,0.25),_inset_0_4px_10px_rgba(255,255,255,0.05)] relative overflow-hidden">
              {/* Embossed Leather Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(44,24,20,0.08)_0%,_transparent_100%)] pointer-events-none" />
              
              {/* Gold Ornament Corners */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#BCA782] pointer-events-none" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#BCA782] pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#BCA782] pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#BCA782] pointer-events-none" />

              {/* String / Sewing texture on the side representing book binding */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#BCA782] border-r border-[#C9B695] flex flex-col justify-around py-8 items-center shadow-inner">
                <div className="w-2 h-2 rounded-full bg-[#E8DCC4] border border-[#BCA782]/40" />
                <div className="w-2 h-2 rounded-full bg-[#E8DCC4] border border-[#BCA782]/40" />
                <div className="w-2 h-2 rounded-full bg-[#E8DCC4] border border-[#BCA782]/40" />
                <div className="w-2 h-2 rounded-full bg-[#E8DCC4] border border-[#BCA782]/40" />
                <div className="w-2 h-2 rounded-full bg-[#E8DCC4] border border-[#BCA782]/40" />
              </div>

              <div className="pl-6">
                <div className="relative aspect-[3/4] bg-[#E8DCC4] overflow-hidden border-2 border-[#C9B695] rounded-xl group shadow-2xl">
                  <img 
                    src={story.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=1000'} 
                    alt={story.title}
                    className="w-full h-full object-cover opacity-75 grayscale contrast-115 group-hover:grayscale-0 group-hover:opacity-90 transition-all duration-700 transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Overlay vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#DFCEB4] via-transparent to-transparent opacity-90" />
                  
                  {/* Decorative corner brackets inside image */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#BCA782]" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#BCA782]" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#BCA782]" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#BCA782]" />

                  {/* Puppet Cross strings icon in cover */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-85 transition-opacity pointer-events-none">
                    <Activity className="w-12 h-12 text-[#BCA782] animate-pulse" />
                  </div>
                </div>

                <div className="text-center pt-5 pb-1">
                  <h1 className="text-2xl font-bold text-[#2C1814] leading-tight px-1 font-serif tracking-tight drop-shadow-sm">
                    {story.title}
                  </h1>
                  <p className="text-xs text-[#5C3627] mt-2 font-sans italic">Tác giả biên chép: <span className="text-[#2C1814] font-semibold">{story.author}</span></p>
                </div>
              </div>
            </div>

            {/* Vintage Library-Card Index / Stats Panel (Aged parchment card stuck on desk) */}
            <div className="border-2 border-[#C9B695] bg-[#E8DCC4] p-5 rounded-2xl relative shadow-[0_8px_25px_rgba(44,24,20,0.15),_3px_3px_0_#DFCEB4] text-[#2C1814]">
              {/* String Anchor Hook on top */}
              <div className="absolute top-[-10px] right-6 px-3 py-0.5 bg-[#BCA782] border border-[#C9B695] text-[#E8DCC4] text-[9px] font-sans font-bold uppercase rounded shadow-md">
                Chỉ số ký ức
              </div>

              <h2 className="text-[10px] text-[#5C3627] font-sans uppercase tracking-[0.2em] mb-4 flex items-center gap-2 font-black border-b border-[#C9B695] pb-2">
                <PenTool className="w-3.5 h-3.5 text-[#5C3627]" /> THƯ VIỆN KÝ ỨC CỔ
              </h2>
              
              <div className="grid grid-cols-2 gap-3 font-sans">
                <div className="bg-[#DFCEB4] border border-[#C9B695] p-3 rounded-xl text-center shadow-inner">
                  <div className="text-[#2C1814] text-xl font-serif font-bold mb-0.5">{chapters.length}</div>
                  <div className="text-[8px] text-[#5C3627] font-bold uppercase tracking-wider">Trang Bản Thảo</div>
                </div>
                <div className="bg-[#DFCEB4] border border-[#C9B695] p-3 rounded-xl text-center shadow-inner">
                  <div className="text-[#2C1814] text-xl font-serif font-bold mb-0.5">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}</div>
                  <div className="text-[8px] text-[#5C3627] font-bold uppercase tracking-wider">Cảm Ứng Rối</div>
                </div>
                <div className="bg-[#D5C2A5] border border-[#C9B695] p-3 rounded-xl text-center col-span-2 shadow-inner">
                  <div className="text-[#2C1814] text-base font-serif font-bold mb-0.5 flex items-center justify-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#5C3627] fill-[#5C3627]" /> {totalGiftedChoco} CC
                  </div>
                  <div className="text-[8px] text-[#5C3627] font-bold uppercase tracking-wider">Năng Lượng Nhớ Thương</div>
                </div>
              </div>
            </div>

            {/* Core Action Buttons - Styled like aged tabs */}
            <div className="flex flex-col gap-2 font-sans">
              <button 
                onClick={() => chapters.length > 0 && navigate(`/doc/${story.slug || story.id}/chuong-${chapters[0].order + 1}`)}
                className="w-full py-3.5 bg-[#BCA782] hover:bg-[#C9B695] text-[#2C1814] uppercase text-xs font-black tracking-widest transition-all duration-300 flex justify-center items-center gap-2.5 rounded-xl border-2 border-[#C9B695] shadow-[0_6px_15px_rgba(44,24,20,0.1)] cursor-pointer"
              >
                MỞ TRANG ĐẦU TIÊN <BookOpen className="w-4 h-4 text-[#2C1814]" />
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleSaveToggle}
                  className={`py-2.5 rounded-xl border-2 uppercase text-[9px] font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer ${savedStories.includes(story.id) ? 'bg-[#C9B695] border-[#BCA782] text-[#2C1814]' : 'bg-[#E8DCC4] border-[#C9B695] text-[#2C1814] hover:bg-[#DFCEB4]'}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedStories.includes(story.id) ? 'fill-[#2C1814] text-[#2C1814]' : ''}`} /> 
                  {savedStories.includes(story.id) ? 'ĐÃ CẤT GIỮ' : 'ĐÁNH DẤU TRANG'}
                </button>
                <button 
                  onClick={() => setShowGiftModal(true)}
                  className="py-2.5 rounded-xl border-2 border-[#C9B695] bg-[#E8DCC4] hover:bg-[#DFCEB4] text-[#2C1814] uppercase text-[9px] font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5 text-[#2C1814]" /> GỬI TRÁI TIM
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - THE DIARY PAPYRUS / NOTEBOOK PAGES */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Aesthetic Story Page - Stylized as an open paper page from an old diary */}
          <div className="border-2 border-[#C9B695] bg-[#E8DCC4] text-[#2C1814] p-6 lg:p-10 rounded-2xl relative shadow-[0_12px_30px_rgba(44,24,20,0.15),_4px_4px_0px_#DFCEB4,_8px_8px_0px_#D5C2A5,_12px_12px_0px_#C9B695] overflow-hidden">
            
            {/* Lined Paper Texture Background */}
            <div className="absolute inset-0 opacity-[0.22] pointer-events-none" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#BCA782 1px, transparent 1px)', 
                   backgroundSize: '100% 2.2rem',
                   lineHeight: '2.2rem'
                 }} 
             />

            {/* Vertical binder red/brown margin line on the left */}
            <div className="absolute left-6 lg:left-10 top-0 bottom-0 w-[1.5px] bg-[#BCA782] opacity-55 pointer-events-none" />

            {/* Ornamental top gold line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#BCA782]/40 to-transparent" />
            
            {/* Ink blot element */}
            <div className="absolute right-8 top-12 w-24 h-24 bg-[#2C1814] rounded-full blur-3xl opacity-[0.06] pointer-events-none" />
            
            <div className="pl-6 lg:pl-10 relative z-10">
              <h3 className="font-serif text-[#2C1814] text-2xl font-bold mb-6 border-b border-[#C9B695] pb-4 flex items-center gap-2">
                <Scroll className="w-6 h-6 text-[#2C1814]" /> Nhật Ký Của Rối
              </h3>
              
              {/* Story Description with spacious margins and custom line-height */}
              <p className="leading-[2.2rem] text-base font-serif italic text-[#2C1814] text-justify whitespace-pre-line pr-2 relative z-10 mb-8 font-medium">
                {story.description || "Cuốn nhật ký sờn cũ bằng da dê, bên trong nét mực sẫm màu ghi lại cuộc đời của một chú rối bằng gỗ. Một người đã từng là con người, bị dâng hiến cho bóng tối và được tái sinh bởi một bậc thầy múa rối bí ẩn. Cuộc đồng hành đong đầy cảm xúc, một nụ hôn vụn trộm dưới đêm khuya, và rồi khói lửa chiến tranh nổ ra hé lộ bí mật kinh hoàng..."}
              </p>

              {/* Genres Tag Cloud */}
              <div className="flex flex-wrap gap-2 mt-4 relative z-10 pt-2 border-t border-[#C9B695]/60">
                {story.genres?.map((g: string) => (
                  <span key={g} className="px-3 py-1.5 bg-[#DFCEB4] text-[#2C1814] text-[10px] font-sans font-bold tracking-wider rounded-md border border-[#C9B695] uppercase">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* INTERACTIVE MARIONETTE SOUL WHISPERS PANEL - SEPARATED BELOW & PAPYRUS LOOK */}
          <div className="border-2 border-[#C9B695] bg-[#E8DCC4] text-[#2C1814] p-6 rounded-2xl relative overflow-hidden shadow-[0_8px_20px_rgba(44,24,20,0.15),_3px_3px_0_#DFCEB4]">
            {/* Hanging Thread Anchor Hook on top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-5 bg-[#BCA782] border-b border-[#C9B695]/40 flex justify-center items-end">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8DCC4] animate-ping absolute" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8DCC4]" />
            </div>
            
            <div className="text-center pt-2">
              <h3 className="text-[10px] text-[#2C1814] font-sans uppercase tracking-[0.25em] font-black mb-4">
                LINH HỒN RỐI THÌ THẦM
              </h3>

              <div className="min-h-[110px] flex items-center justify-center px-5 py-4 bg-[#DFCEB4] border border-[#C9B695] rounded-xl relative shadow-inner">
                {/* Vintage ornamental corner background */}
                <div className="absolute top-1 left-1 text-[10px] text-[#BCA782] select-none font-serif">✦</div>
                <div className="absolute bottom-1 right-1 text-[10px] text-[#BCA782] select-none font-serif">✦</div>

                <p className={`text-xs md:text-sm text-[#2C1814] italic font-serif leading-relaxed text-center whitespace-pre-line transition-all duration-500 ${isPulling ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                  {whispers[whisperIdx]}
                </p>
              </div>

              {/* Active interacting string thread */}
              <div className="mt-4 flex flex-col items-center">
                <div className={`w-[2px] bg-[#BCA782] transition-all duration-300 ${isPulling ? 'h-14 bg-[#2C1814]' : 'h-8'}`} />
                <button 
                  onClick={handlePullString}
                  disabled={isPulling}
                  className={`mt-1 px-5 py-1.5 bg-[#BCA782] hover:bg-[#C9B695] border border-[#C9B695] text-[#2C1814] text-[9px] font-sans font-black uppercase tracking-widest rounded-full transition-all shadow-[0_3px_8px_rgba(44,24,20,0.15)] ${isPulling ? 'translate-y-2' : ''}`}
                >
                  {isPulling ? 'Đang kéo tơ...' : 'Kéo Tơ Đánh Thức Rối'}
                </button>
                <p className="text-[9px] text-[#2C1814] font-sans italic mt-2">Mỗi cái kéo dệt một sợi tơ liên kết tâm hồn</p>
              </div>
            </div>
          </div>

          {/* MAIN TABS SELECTOR - STYLED AS DIARY DIVIDER LABELS */}
          <div className="flex border-b-2 border-[#C9B695] font-sans text-xs sm:text-sm tracking-wider uppercase">
            <button 
              onClick={() => setActiveTab('chapters')}
              className={`px-6 py-4 font-black border-t-2 border-x-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'chapters' ? 'bg-[#E8DCC4] border-[#C9B695] text-[#2C1814]' : 'border-transparent text-[#5C3627] hover:text-[#2C1814]'}`}
            >
              <PenTool className="w-4 h-4 text-[#2C1814]" /> TRANG BẢN THẢO ({chapters.length})
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-4 font-black border-t-2 border-x-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'comments' ? 'bg-[#E8DCC4] border-[#C9B695] text-[#2C1814]' : 'border-transparent text-[#5C3627] hover:text-[#2C1814]'}`}
            >
              <MessageSquare className="w-4 h-4 text-[#2C1814]" /> DẤU BÚT ĐỂ LẠI ({comments.length})
            </button>
          </div>

          {/* TAB 1: CHAPTERS LIST - PARCHMENT LOOK */}
          {activeTab === 'chapters' && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="flex justify-between items-center bg-[#E8DCC4] p-3 rounded-xl border border-[#C9B695] text-xs shadow-sm">
                <span className="text-[#2C1814] font-bold tracking-wider">MỤC LỤC TRANG SÁCH</span>
                <button 
                  onClick={() => setChapterSortDesc(!chapterSortDesc)}
                  className="text-[#2C1814] hover:text-[#5C3627] hover:underline font-bold cursor-pointer"
                >
                  {chapterSortDesc ? 'MỚI NHẤT TRƯỚC' : 'CŨ NHẤT TRƯỚC'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {displayedChapters.length === 0 ? (
                  <div className="p-8 text-center bg-[#E8DCC4] rounded-xl border border-[#C9B695] text-sm text-[#5C3627]">
                    Bản thảo hiện đang được bảo vệ hoặc chưa được ghi chép.
                  </div>
                ) : (
                  displayedChapters.map((chap, idx) => {
                    const isPassRequired = chap.requiresPass;
                    const hasPassUnlocked = isPassRequired && (unlockedPassChapters || []).includes(chap.id);
                    const isEarlyAccess = chap.requiresEarlyAccess;
                    const chapTime = chap.createdAt?.toMillis ? chap.createdAt.toMillis() : (typeof chap.createdAt === 'number' ? chap.createdAt : 0);
                    const isStillEarlyAccess = isEarlyAccess && (Date.now() - chapTime < 24 * 60 * 60 * 1000);
                    const hasEarlyAccessUnlocked = isEarlyAccess && (unlockedEarlyAccessChapters || []).includes(chap.id);
                    const isLockedRead = !!chap.isLockedRead;

                    return (
                      <div 
                         key={chap.id}
                         onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${chap.order + 1}`)}
                         className="group p-4 bg-[#E8DCC4] hover:bg-[#DFCEB4] border border-[#C9B695] hover:border-[#BCA782] rounded-xl cursor-pointer transition-all flex items-center justify-between shadow-[0_2px_8px_rgba(44,24,20,0.05)] hover:shadow-md"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#DFCEB4] flex items-center justify-center text-xs text-[#2C1814] border border-[#C9B695] font-bold group-hover:border-[#BCA782] transition-colors shrink-0">
                            {chap.order}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-serif font-bold text-sm md:text-base text-[#2C1814] transition-colors truncate">
                              {chap.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-[#2C1814]/70 uppercase tracking-wider font-semibold">
                                CHƯƠNG NHẬT KÝ ĐÃ LÊN TRANG
                              </span>
                              
                              {isPassRequired && (
                                hasPassUnlocked ? (
                                  <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1 rounded flex items-center gap-0.5 font-bold">
                                    <Unlock className="w-2 h-2" /> PASS OK
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-200 px-1 rounded flex items-center gap-0.5 font-bold">
                                    <Lock className="w-2 h-2" /> CẦN PASS
                                  </span>
                                )
                              )}
                              {isEarlyAccess && isStillEarlyAccess && (
                                hasEarlyAccessUnlocked ? (
                                  <span className="text-[8px] bg-teal-100 text-teal-800 border border-teal-200 px-1 rounded flex items-center gap-0.5 font-bold">
                                    <Zap className="w-2 h-2 text-teal-700 fill-teal-100" /> ĐÃ MỞ SỚM
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-amber-100 text-amber-800 border border-[#C9B695]/30 px-1 rounded flex items-center gap-0.5 font-bold animate-pulse">
                                    <Zap className="w-2 h-2 text-amber-700 fill-amber-100" /> ĐỌC SỚM
                                  </span>
                                )
                              )}
                              {isEarlyAccess && !isStillEarlyAccess && (
                                <span className="text-[8px] bg-stone-100 text-stone-500 border border-stone-200 px-1 rounded font-bold">
                                  MIỄN PHÍ
                                </span>
                              )}
                              {isLockedRead && (
                                <span className="text-[8px] bg-red-100 text-red-800 border border-red-200 px-1 rounded font-bold">
                                  ĐÃ KHÓA
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-[#2C1814] group-hover:text-[#5C3627] transition-all transform group-hover:translate-x-1 font-bold">
                          ➔
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* PAGINATION */}
              {chapters.length > CHAPTERS_PER_PAGE && (
                <div className="flex justify-center gap-2 pt-4">
                  <button 
                    disabled={chapterPage === 0}
                    onClick={() => setChapterPage(chapterPage - 1)}
                    className="px-4 py-2 bg-[#E8DCC4] text-[#2C1814] border border-[#C9B695] hover:border-[#BCA782] rounded-xl disabled:opacity-35 transition-all text-xs font-bold cursor-pointer"
                  >
                    TRANG TRƯỚC
                  </button>
                  <button 
                    disabled={(chapterPage + 1) * CHAPTERS_PER_PAGE >= chapters.length}
                    onClick={() => setChapterPage(chapterPage + 1)}
                    className="px-4 py-2 bg-[#E8DCC4] text-[#2C1814] border border-[#C9B695] hover:border-[#BCA782] rounded-xl disabled:opacity-35 transition-all text-xs font-bold cursor-pointer"
                  >
                    TRANG SAU
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMMENTS - PARCHMENT LOOK */}
          {activeTab === 'comments' && (
            <div className="flex flex-col gap-5 font-sans">
              
              {/* Comment Composer */}
              <div className="bg-[#E8DCC4] border border-[#C9B695] p-5 rounded-2xl flex flex-col gap-3.5 shadow-md text-[#2C1814]">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Để lại bút tích hoài niệm của bạn về mối tình và định mệnh rối gỗ..."
                  rows={3}
                  className="w-full bg-[#E8DCC4] text-[#2C1814] placeholder-[#2C1814]/40 p-3 rounded-xl border border-[#C9B695] focus:outline-none focus:border-[#BCA782] text-sm resize-none font-serif italic"
                />
                
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-[#2C1814]/70 italic font-semibold">
                    {isLoggedIn ? "Bút mực đã sẵn sàng..." : "Người lữ hành cần đăng nhập để ký thác"}
                  </div>
                  <button 
                    onClick={handleSendComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="px-5 py-2 bg-[#BCA782] hover:bg-[#C9B695] text-[#2C1814] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-45 cursor-pointer shadow-md"
                  >
                    Ký bút tích <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* COMMENTS LIST */}
              <div className="flex flex-col gap-4">
                {comments.length === 0 ? (
                  <div className="p-8 text-center bg-[#E8DCC4] rounded-xl border border-[#C9B695] text-sm text-[#2C1814]/60">
                    Chưa có nét bút tích nào lưu lại. Người hãy đặt nét mực đầu tiên.
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isGift = comment.type === 'choco_gift';
                    const cacheUser = profilesCache[comment.uid] || {};
                    const avatar = cacheUser.avatarUrl || comment.avatarUrl || '';
                    const dName = cacheUser.displayName || comment.displayName || 'Nhà lữ hành ẩn danh';
                    const customTitle = cacheUser.activeTitle || comment.activeTitle;
                    const isMe = comment.uid === uid;
                    const currentSticker = isMe ? equippedStickerComment : (cacheUser?.equippedStickerComment ?? cacheUser?.equippedSticker ?? comment.equippedSticker);
                    
                    return (
                      <div 
                        key={comment.id}
                        className={`relative p-4 rounded-xl border transition-all duration-300 ${isGift ? 'bg-[#DFCEB4] border-[#BCA782]' : 'bg-[#E8DCC4] border-[#C9B695]'} ${currentSticker ? 'pr-16' : ''}`}
                      >
                        {currentSticker && (
                          <img 
                            src={currentSticker} 
                            alt="Sticker" 
                            className="absolute w-12 h-12 object-contain pointer-events-none z-10 right-2 top-1/2 -translate-y-1/2" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="flex items-start gap-3">
                          <UserAvatar 
                            avatarUrl={avatar} 
                            equippedAccessory={cacheUser.equippedAccessory || comment.equippedAccessory} 
                            accessoryPosition={cacheUser.accessoryPosition || comment.accessoryPosition} 
                            className="w-10 h-10 shrink-0 pointer-events-none" 
                            fallbackIconSizeClass="w-5 h-5 text-[#2C1814]" 
                            borderClass="border border-[#C9B695]"
                            bgClass="bg-[#E8DCC4]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-[#2C1814] hover:underline cursor-pointer">
                                {dName}
                              </span>
                              {customTitle && (
                                <span className="px-1.5 py-0.5 bg-[#DFCEB4] text-[#2C1814] rounded text-[8px] font-bold uppercase tracking-wider border border-[#C9B695]">
                                  {customTitle.name || customTitle}
                                </span>
                              )}
                              <span className="text-[9px] text-[#2C1814]/70 font-medium">
                                {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : 'Hôm nay'}
                              </span>
                            </div>

                            {/* Gift details */}
                            {isGift && (
                              <div className="mt-1.5 flex items-center gap-1.5 bg-[#E8DCC4] border border-[#BCA782] px-2.5 py-1 rounded text-xs text-[#2C1814] font-bold max-w-max shadow-sm">
                                <Gift className="w-3.5 h-3.5 text-[#2C1814]" /> Đã tặng {comment.giftAmount} CC dệt tơ tâm hồn
                              </div>
                            )}

                            <p className="mt-2 text-xs md:text-sm text-[#2C1814] whitespace-pre-line font-serif italic text-justify leading-relaxed">
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
        <div className="fixed inset-0 bg-[#2C1814]/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-[#E8DCC4] border-4 border-[#C9B695] w-full max-w-md p-6 rounded-2xl shadow-[0_15px_35px_rgba(44,24,20,0.5)] relative text-[#2C1814]">
            <div className="absolute top-2 right-2 text-xs text-[#2C1814]">✦</div>
            <h3 className="font-serif text-[#2C1814] text-xl font-bold mb-1 uppercase tracking-tight">Dệt tơ ký ức</h3>
            <p className="text-xs text-[#2C1814]/70 mb-4">Mỗi mẩu Choco ngọt ngào sẽ hóa thành tơ kết nối linh hồn rối gỗ xích lại gần người.</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#2C1814] font-bold block mb-1">Số lượng Choco dâng hiến (Người có: {choco} CC)</label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#E8DCC4] text-[#2C1814] border border-[#C9B695] p-3 rounded-xl text-sm focus:outline-none focus:border-[#BCA782]"
                  min="1"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#2C1814] font-bold block mb-1">Lời tâm tình gửi búp bê</label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi gắm chút lời sưởi ấm đến chú rối cô đơn..."
                  rows={3}
                  className="w-full bg-[#E8DCC4] text-[#2C1814] border border-[#C9B695] p-3 rounded-xl text-xs focus:outline-none resize-none font-serif italic focus:border-[#BCA782]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 border border-[#C9B695] text-[#2C1814] hover:text-[#2C1814]/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  HUỶ BỎ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="px-4 py-2 bg-[#BCA782] text-[#2C1814] hover:bg-[#C9B695] rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer"
                >
                  DÂNG HIẾN KÝ ỨC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

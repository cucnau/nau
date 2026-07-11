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
    "Narcissus không đứng dậy, cứ thế ngồi nghiêng trên bãi cỏ, mái tóc dài mềm mại của chàng lay động ánh vàng lấp lánh, xõa xuống như rong biển bung nở, chúng bao bọc lấy chiếc cổ mảnh khảnh trắng lạnh của chàng, tựa như những sợi vàng ròng len lỏi vào mạch khoáng của đá ngọc.",
    "Ánh lửa nhảy múa dữ tợn trên khuôn mặt chàng, như một đám yêu quái nhỏ cười đùa, tổ lên khuôn mặt sâu thẳm lớp sơn màu vàng cam, nồng đậm rực rỡ vô cùng.\nHàng mi dài mảnh là chiếc cọ dày, vẽ bóng râm lên làn da trắng nõn, ánh sáng vụn vỡ loang lổ run rẩy rơi xuống.",
    "Băng đô lụa buộc lại mái tóc dài của Narcissus, chàng đứng dậy dưới ánh đèn dầu mỡ cừu.\nLàn da trắng lạnh ửng lên sắc hồng nhạt, màu vàng kim vụn vỡ và màu xanh nước trong suốt quấn quýt, đôi mắt xanh lục lấp lánh ánh sóng tuyệt đẹp, đổi môi tựa hoa hồng.",
    "Chàng phanh cổ áo, để lộ yết hầu, rồi cởi bỏ áo ngoài, người Hy Lạp cổ đại vốn tổn sùng vẻ đẹp của cơ thể trần trụi. Tuy làn da chàng trắng lạnh, nhưng khi những giọt mồ hôi li ti bám vào, các thớ cơ lại hiện lên vẻ bóng bẩy như được thoa dâu.",
    "Bóng hoa diên vĩ vàng in hằn trong những gợn sóng lăn tăn, nó thoáng thấy vệt đỏ nhạt hiện lên trên làn da trắng lạnh, khẽ cười nhạo lại thêm một kẻ ngốc rơi vào lưới tình.",
    "Trong phút chốc, kẻ cao ngạo đã bị khuất phục.\nThế giới dường như nổ tung thành vô số mảnh vụn, vĩnh viễn không thể cứu vãn.",
    "Người đó lặng lẽ giấu đi đôi mắt gieo rắc mộng ảo, có lẽ là vì thẹn thùng. Hàng mi thanh mảnh vẽ nên vẻ đẹp tinh tế, có ai đó đã dệt vàng ròng nóng chảy thành mái tóc dài của người đó, dùng ngọc lục bảo thượng hạng làm đôi mắt, lắng đọng vẻ sang trọng tràn ngập tầm nhìn.",
    "Narcissus cổ độc nằm bò bên bờ nước, sự mờ mịt xen lẫn nỗi u sầu, nỗi buồn không thể diễn tả bằng lời đang điên cuồng nảy nở.\nChàng thậm chí còn khóc thành tiếng, nguyền rủa đôi tay mình, không những không ôm được người trong mộng mà còn đẩy người đó ra xa.",
    "Sau đó, Narcissus không ngừng thốt ra đủ loại lời đường mật, chàng đã trở thành loại người mà mình ghét nhất, loại ngu ngốc đó. Chàng lục lọi hết tâm trí, cuồng nhiệt bày tỏ tình yêu của mình.",
    "Những hạt ngọc xinh đẹp sau khi ngấm nước càng thêm long lanh trong suốt, kéo theo những sợi nước li ti.\nNhững giọt nước tiếp tục rơi xuống.\nNgười đẹp tóc vàng lại trở nên mờ ảo.",
    "Thế là chàng bất chấp tất cả cúi xuống hồn, hình bóng phản chiếu cũng hồn chàng. Dù động tác có nồng cháy đến đâu, thứ chàng nhận được cũng chỉ là sự ẩm ướt lạnh lẽo, nó thấm đẫm trái tim chàng, phải chăng mũi tên tình yêu của Cupid đã bắn trúng chàng? Tình yêu ngọt ngào mang lại từ thứ kim loại lạnh lẽo đó. Lúc này linh hồn chàng tràn ngập tình ý nồng nàn.",
    "Chàng không quan tâm.\nChàng không cần lo lắng liệu có nhận được sự thương hại của người trong mộng hay không.\nChàng yêu chính mình.\nChắc chắn là vậy.",
    "\"Ta sẽ yêu ngươi cho đến chết cũng không thay lòng.\"\nThế là, chàng nói với hình bóng phản chiếu của mình như vậy."
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
    <div className="bg-[#12110F] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3D362E] via-[#12110F] to-[#12110F] min-h-screen text-[#F2E6D0] font-serif selection:bg-[#B6A996] selection:text-[#12110F] pb-24 relative overflow-x-hidden">
      
      {/* BACKGROUND GRAPHICS: SACRED GREEK SYMBOLS */}
      <div className="absolute top-48 left-0 right-0 h-[600px] pointer-events-none opacity-[0.02] flex justify-between px-10">
        <svg className="w-96 h-96" viewBox="0 0 100 100" fill="none" stroke="#F2E6D0" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" strokeDasharray="3,3" />
          <path d="M 50 5 L 95 50 L 50 95 L 5 50 Z" />
          <circle cx="50" cy="50" r="25" />
        </svg>
        <svg className="w-96 h-96 transform rotate-45" viewBox="0 0 100 100" fill="none" stroke="#F2E6D0" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" />
          <polygon points="50,10 90,80 10,80" />
        </svg>
      </div>

      {/* STICKY TOP MEANDER BANNER */}
      <div className="border-b-2 border-[#B6A996]/40 bg-gradient-to-r from-[#12110F] via-[#3D362E] to-[#12110F] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
        <div className="absolute top-0.5 left-0 right-0 h-1 opacity-20 bg-[linear-gradient(90deg,#B6A996_2px,transparent_2px)] bg-[length:10px_100%]" />
        <div className="absolute bottom-0.5 left-0 right-0 h-1 opacity-20 bg-[linear-gradient(90deg,#B6A996_2px,transparent_2px)] bg-[length:10px_100%]" />

        {/* Back button styled like a classical tablet */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#3D362E]/90 hover:bg-[#B6A996]/20 text-[#F2E6D0] text-xs font-sans font-bold tracking-widest border border-[#B6A996]/30 transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>QUAY LẠI</span>
        </button>

        {/* Central Logo */}
        <div className="flex items-center justify-center">
          <h2 className="font-bold text-[#F2E6D0] font-serif text-lg md:text-2xl tracking-[0.2em] uppercase italic flex items-center gap-2">
            NARCISSUS
          </h2>
        </div>

        {/* Right Spacer of identical width for perfect centering */}
        <div className="w-[124px] hidden md:block"></div>
      </div>

      <div className="max-w-[1200px] mx-auto p-4 md:p-8 relative z-10 flex flex-col gap-12">
        
        {/* ==================== 1. THE ARCHITECTURAL TEMPLE SHRINE ==================== */}
        <div className="w-full flex flex-col items-center">
          
          {/* Classical Greek Pediment (Mái tam giác đầu hồi đền thờ) */}
          <div className="w-full max-w-[900px] flex flex-col items-center relative">
            <svg className="w-full h-20 md:h-28 text-[#B6A996] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" viewBox="0 0 800 110" fill="currentColor">
              {/* Acroterion (Đỉnh và hai bên mái tam giác cổ điển tinh xảo) */}
              {/* Center apex palmette */}
              <path d="M 400,0 C 395,10 392,20 400,25 C 408,20 405,10 400,0 Z M 392,10 C 385,15 388,23 397,22 C 392,18 390,13 392,10 Z M 408,10 C 415,15 412,23 403,22 C 408,18 410,13 408,10 Z" fill="#F2E6D0" stroke="#B6A996" strokeWidth="1" />
              {/* Left corner acroterion scroll */}
              <path d="M 5,95 Q -5,80 5,75 Q 12,82 5,95 Z" fill="#F2E6D0" stroke="#B6A996" strokeWidth="1" />
              {/* Right corner acroterion scroll */}
              <path d="M 795,95 Q 805,80 795,75 Q 788,82 795,95 Z" fill="#F2E6D0" stroke="#B6A996" strokeWidth="1" />

              {/* Main Triangular Gable */}
              <polygon points="400,20 10,95 790,95" fill="#1C1713" stroke="#B6A996" strokeWidth="4" strokeLinejoin="round" />
              
              {/* Intricate golden double inner lines for sharp neoclassical feel */}
              <polygon points="400,28 22,91 778,91" fill="none" stroke="#F2E6D0" strokeWidth="1" opacity="0.6" />

              {/* High-craft crest inside pediment (Tác phẩm điêu khắc tinh xảo) */}
              <circle cx="400" cy="65" r="14" fill="#12110F" stroke="#F2E6D0" strokeWidth="2" />
              {/* Sacred fire in medallion */}
              <path d="M 396,72 C 393,65 396,58 400,53 C 404,58 407,65 404,72 Z" fill="#F2E6D0" stroke="#B6A996" strokeWidth="1" />
              {/* Left and right elegant neoclassical scrolls flanking center */}
              <path d="M 386,65 C 340,65 310,80 250,90 C 310,90 350,80 386,65 Z M 386,65 C 365,55 350,55 330,65 Q 360,75 386,65 Z" fill="#3D362E" stroke="#B6A996" strokeWidth="1.5" />
              <path d="M 414,65 C 460,65 490,80 550,90 C 490,90 450,80 414,65 Z M 414,65 C 435,55 450,55 470,65 Q 440,75 414,65 Z" fill="#3D362E" stroke="#B6A996" strokeWidth="1.5" />
              
              {/* Bottom Architrave/Dentils (Thanh dầm có hàng răng cưa cổ điển) */}
              <rect x="0" y="95" width="800" height="15" fill="#3D362E" stroke="#B6A996" strokeWidth="2.5" />
              {/* Dentils line (Hàng răng cưa tinh tế) */}
              <path d="M 15,102 L 785,102" stroke="#F2E6D0" strokeWidth="3" strokeDasharray="6,8" opacity="0.8" />
            </svg>

            {/* Frieze / Metopes (Thanh dầm khắc chữ vàng sang trọng) */}
            <div className="w-[98%] bg-[#1A1512] border-x-4 border-double border-[#B6A996] py-2 px-6 flex justify-between text-[11px] text-[#F2E6D0]/80 font-sans tracking-[0.35em] uppercase font-black bg-[linear-gradient(90deg,rgba(46,37,30,0.5)_0%,rgba(22,18,15,0.8)_50%,rgba(46,37,30,0.5)_100%)]">
              <span>✦ TEMPUS ✦</span>
              <span>✦ AMOR ✦</span>
              <span>✦ FATA ✦</span>
              <span>✦ REFLEXIO ✦</span>
              <span>✦ VITA ✦</span>
            </div>

            {/* Classical Columns flanking the Shrine on large screen */}
            <div className="w-full flex items-stretch gap-0 relative">
              
              {/* Left Neoclassical Column */}
              <div className="hidden lg:flex flex-col items-center justify-between w-10 shrink-0 border-r-2 border-l-2 border-[#B6A996]/40 bg-gradient-to-r from-[#12110F] via-[#3D362E] to-[#12110F] relative self-stretch z-20">
                {/* Ionic capital scroll */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-[#3D362E] border-2 border-[#B6A996] rounded-full flex justify-between px-1 shadow-md">
                  <div className="w-3 h-3 rounded-full bg-[#12110F] border border-[#B6A996] flex-shrink-0" />
                  <div className="w-3 h-3 rounded-full bg-[#12110F] border border-[#B6A996] flex-shrink-0" />
                </div>
                {/* Fluting */}
                <div className="flex justify-between w-full h-full px-2 opacity-25">
                  <div className="w-px h-full bg-[#B6A996]" />
                  <div className="w-px h-full bg-[#B6A996]" />
                  <div className="w-px h-full bg-[#B6A996]" />
                  <div className="w-px h-full bg-[#B6A996]" />
                </div>
                {/* Base */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-[#3D362E] border-2 border-[#B6A996] rounded-sm" />
              </div>

              {/* Core Shrine Area bounded by Columns */}
              <div className="flex-1 bg-[#12110F] border-4 border-double border-[#B6A996]/90 outline outline-1 outline-offset-[-8px] outline-[#B6A996]/30 rounded-b-2xl p-6 md:p-10 flex flex-col items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-radial-gradient from-[#3D362E]/20 via-transparent to-transparent pointer-events-none" />
                
                {/* Decorative Corner Seals */}
                <div className="absolute top-4 left-4 text-xs text-[#B6A996]/30">α</div>
                <div className="absolute top-4 right-4 text-xs text-[#B6A996]/30">ω</div>
                <div className="absolute bottom-4 left-4 text-xs text-[#B6A996]/30">ψ</div>
                <div className="absolute bottom-4 right-4 text-xs text-[#B6A996]/30">φ</div>

                {/* Cover Fresco Frame */}
                <div className="relative w-56 md:w-64 aspect-[3/4] bg-[#12110F] rounded-xl overflow-hidden border-4 border-[#B6A996] shadow-[0_15px_30px_rgba(0,0,0,0.8)] group transition-all duration-500 hover:border-[#F2E6D0]">
                  <img 
                    src={story.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=1000'} 
                    alt={story.title}
                    className="w-full h-full object-cover opacity-80 contrast-110 saturate-[0.8] group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12110F] via-transparent to-transparent" />
                  <div className="absolute inset-2 border border-[#B6A996]/20 rounded-lg pointer-events-none" />
                </div>

              {/* Title & Author Info */}
              <div className="text-center mt-8 max-w-2xl relative">
                <h1 className="text-3xl md:text-5xl font-bold tracking-wider text-[#F2E6D0] uppercase drop-shadow-lg leading-tight font-serif italic">
                  {story.title}
                </h1>
                <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-[#B6A996]/50 to-transparent mx-auto mt-4" />
                <p className="text-xs text-[#B6A996] mt-4 font-sans uppercase tracking-[0.2em]">
                  Chắp bút bởi hiền nhân: <span className="text-[#F2E6D0] font-bold">{story.author}</span>
                </p>
              </div>

              {/* Story Ledger Stats integrated into Temple base */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-xl mt-8 pt-6 border-t border-[#B6A996]/20 font-sans text-center">
                <div className="bg-[#1C1713] border border-[#B6A996]/20 rounded-xl p-3 shadow-inner">
                  <span className="block text-[#B6A996] text-[9px] font-bold tracking-widest uppercase mb-1">MỤC SỬ THI</span>
                  <span className="text-[#F2E6D0] text-lg font-serif font-bold">{chapters.length} Chương</span>
                </div>
                <div className="bg-[#1C1713] border border-[#B6A996]/20 rounded-xl p-3 shadow-inner">
                  <span className="block text-[#B6A996] text-[9px] font-bold tracking-widest uppercase mb-1">SOI CHIẾU BIỂU</span>
                  <span className="text-[#F2E6D0] text-lg font-serif font-bold">
                    {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)} Lượt
                  </span>
                </div>
                <div className="bg-[#1C1713] border border-[#B6A996]/20 rounded-xl p-3 shadow-inner">
                  <span className="block text-[#B6A996] text-[9px] font-bold tracking-widest uppercase mb-1">DÂNG LỄ CC</span>
                  <span className="text-[#F2E6D0] text-lg font-serif font-bold flex items-center justify-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-[#B6A996] text-[#B6A996]" /> {totalGiftedChoco}
                  </span>
                </div>
              </div>

              {/* Horizontal Altar Action Buttons */}
              <div className="w-full max-w-xl mt-8 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => chapters.length > 0 && navigate(`/doc/${story.slug || story.id}/chuong-${chapters[0].order + 1}`)}
                  className="flex-1 py-4 bg-[#B6A996] hover:bg-[#F2E6D0] text-[#12110F] uppercase text-xs font-sans font-black tracking-[0.2em] rounded-xl transition-all duration-300 flex justify-center items-center gap-2 border-2 border-[#B6A996] shadow-[0_4px_15px_rgba(154,142,125,0.2)] cursor-pointer"
                >
                  XEM SỬ THI <BookOpen className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSaveToggle}
                  className={`px-6 py-4 rounded-xl border-2 uppercase text-[10px] font-sans font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer ${savedStories.includes(story.id) ? 'bg-[#3D362E] border-[#B6A996] text-[#F2E6D0]' : 'bg-transparent border-[#B6A996]/40 text-[#B6A996] hover:border-[#B6A996] hover:text-[#F2E6D0]'}`}
                >
                  <Bookmark className={`w-4 h-4 ${savedStories.includes(story.id) ? 'fill-[#B6A996] text-[#B6A996]' : ''}`} /> 
                  {savedStories.includes(story.id) ? 'ĐÃ KHẮC GHI' : 'KHẮC ĐỊNH MỆNH'}
                </button>
                <button 
                  onClick={() => setShowGiftModal(true)}
                  className="px-6 py-4 bg-transparent hover:bg-[#B6A996]/10 text-[#B6A996] hover:text-[#F2E6D0] border-2 border-[#B6A996]/40 hover:border-[#B6A996] uppercase text-[10px] font-sans font-bold tracking-widest rounded-xl transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer"
                >
                  <Gift className="w-4 h-4" /> DÂNG NECTAR
                </button>
              </div>

            </div>

            {/* Right Neoclassical Column */}
            <div className="hidden lg:flex flex-col items-center justify-between w-10 shrink-0 border-r-2 border-l-2 border-[#B6A996]/40 bg-gradient-to-r from-[#12110F] via-[#3D362E] to-[#12110F] relative self-stretch z-20">
              {/* Ionic capital scroll */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-[#3D362E] border-2 border-[#B6A996] rounded-full flex justify-between px-1 shadow-md">
                <div className="w-3 h-3 rounded-full bg-[#12110F] border border-[#B6A996] flex-shrink-0" />
                <div className="w-3 h-3 rounded-full bg-[#12110F] border border-[#B6A996] flex-shrink-0" />
              </div>
              {/* Fluting */}
              <div className="flex justify-between w-full h-full px-2 opacity-25">
                <div className="w-px h-full bg-[#B6A996]" />
                <div className="w-px h-full bg-[#B6A996]" />
                <div className="w-px h-full bg-[#B6A996]" />
                <div className="w-px h-full bg-[#B6A996]" />
              </div>
              {/* Base */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-[#3D362E] border-2 border-[#B6A996] rounded-sm" />
            </div>

          </div>
        </div>
      </div>


        {/* ==================== 2. STORY PARCHMENT DESCRIPTION ==================== */}
        <div className="w-full max-w-[900px] mx-auto">
          <div className="border-4 border-double border-[#B6A996]/80 outline outline-1 outline-offset-[-8px] outline-[#B6A996]/30 bg-[#12110F] text-[#F2E6D0] p-6 md:p-10 rounded-2xl relative shadow-2xl">
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#B6A996]/30" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#B6A996]/30" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#B6A996]/30" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#B6A996]/30" />

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-[#B6A996]/20 pb-4">
                <Scroll className="w-5 h-5 text-[#B6A996]" />
                <h3 className="font-serif text-[#F2E6D0] text-xl font-bold uppercase tracking-widest">Ghi Chép Sử Thi</h3>
              </div>
              
              <p className="leading-relaxed text-base md:text-lg font-serif italic text-[#F2E6D0] text-justify whitespace-pre-line font-medium leading-relaxed">
                {story.description || "Truyền thuyết tráng lệ kể về Narcissus - chàng mục đồng có dung nhan tuyệt mỹ hoàn hảo vô song nhưng lại dửng dưng trước mọi lưới ái tình trần thế, khiến nữ thần báo ứng Nemesis dâng lên lời nguyền bi kịch. Chàng say đắm cuồng si chính dung nhan của mình in bóng dưới đáy hồ nước trong veo, yêu mến khát khao đến mức tan chảy hóa thành đóa hoa Thủy Tiên nghiêng mình soi bóng cô liêu..."}
              </p>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-[#B6A996]/20">
                {story.genres?.map((g: string) => (
                  <span key={g} className="px-3 py-1 bg-[#3D362E] text-[#F2E6D0] text-[9px] font-sans font-bold tracking-widest rounded-md border border-[#B6A996]/30 uppercase">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* ==================== 3. THE SACRED WATER REFLECTION POOL ==================== */}
        <div className="w-full max-w-[900px] mx-auto">
          <div className="border-4 border-double border-[#B6A996]/80 outline outline-1 outline-offset-[-8px] outline-[#B6A996]/30 bg-gradient-to-b from-[#3D362E] to-[#12110F] rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl text-center">
            
            {/* Pool Steps Frame Design */}
            <div className="absolute inset-0 border-[6px] border-double border-[#B6A996]/20 rounded-2xl pointer-events-none" />
            <span className="text-[9px] text-[#B6A996]/40 tracking-[0.3em] uppercase block mb-4 font-sans font-bold">HỒ NƯỚC THẦN THOẠI NARCISSUS</span>
            
            <div className="relative max-w-2xl mx-auto py-8 px-4 flex flex-col items-center">
              
              {/* Ripple water pool container */}
              <div className="w-full min-h-[160px] flex items-center justify-center p-6 bg-[#12110F] border border-[#B6A996]/30 rounded-full relative overflow-hidden shadow-[inset_0_0_40px_rgba(154,142,125,0.4)] transition-all duration-500">
                {isRippling && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 rounded-full border-2 border-[#B6A996]/30 animate-ping absolute" />
                    <div className="w-40 h-40 rounded-full border border-[#B6A996]/20 animate-ping absolute" />
                    <div className="w-60 h-60 rounded-full border border-[#B6A996]/10 animate-ping absolute" />
                  </div>
                )}
                
                <p className={`text-base md:text-lg text-[#F2E6D0] italic font-serif leading-relaxed tracking-wide text-center relative z-10 max-w-lg transition-all duration-500 whitespace-pre-line ${isRippling ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
                  {reflections[reflectionIdx]}
                </p>
              </div>

              {/* Ripple Trigger */}
              <button 
                onClick={handleTouchWater}
                disabled={isRippling}
                className="mt-6 px-8 py-3 bg-[#B6A996] hover:bg-[#F2E6D0] text-[#12110F] border border-[#B6A996] text-xs font-sans font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-lg hover:scale-105 disabled:opacity-50 cursor-pointer"
              >
                {isRippling ? 'Suối Thần xao động...' : 'Chạm vào mặt hồ soi bóng'}
              </button>
              <p className="text-[10px] text-[#B6A996]/60 italic font-serif mt-3">Mặt hồ soi chiếu dung nhan kiệt tác và ngọn lửa ái tình tự luyến thiêng liêng</p>

            </div>
          </div>
        </div>


        {/* ==================== 4. SYMMETRIC SANCTUARY PORTICO (SIDE-BY-SIDE) ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full mt-4">
          
          {/* LEFT PORTICO: KHẢI HUYỀN THƯ TỊCH (Chapters list) */}
          <div className="border-4 border-double border-[#B6A996]/80 outline outline-1 outline-offset-[-8px] outline-[#B6A996]/30 bg-[#12110F] rounded-2xl p-6 shadow-xl flex flex-col gap-6 relative">
            <div className="flex justify-between items-center border-b border-[#B6A996]/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-[#B6A996] rounded-full animate-pulse" />
                <h3 className="font-serif text-lg font-bold uppercase tracking-widest text-[#F2E6D0]">Mục Khải Huyền ({chapters.length})</h3>
              </div>
              <button 
                onClick={() => setChapterSortDesc(!chapterSortDesc)}
                className="text-xs text-[#B6A996] hover:text-[#F2E6D0] font-sans font-bold tracking-wider uppercase cursor-pointer"
              >
                {chapterSortDesc ? 'Mới nhất trước' : 'Cũ nhất trước'}
              </button>
            </div>

            <div className="flex flex-col gap-3 min-h-[400px]">
              {displayedChapters.length === 0 ? (
                <div className="flex items-center justify-center p-12 bg-[#12110F]/40 border border-[#B6A996]/10 rounded-xl text-center text-xs text-[#B6A996]/50 font-serif italic">
                  Các trang thư tịch cổ đang được thần cai quản bảo hộ hoặc chưa ghi chép.
                </div>
              ) : (
                displayedChapters.map((chap) => (
                  <div 
                    key={chap.id}
                    onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${chap.order + 1}`)}
                    className="group p-4 bg-[#3D362E]/50 hover:bg-[#3D362E] border border-[#B6A996]/10 hover:border-[#B6A996] rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1 mr-3">
                      <div className="w-10 h-10 rounded-lg bg-[#12110F] flex items-center justify-center text-xs text-[#B6A996] border border-[#B6A996]/20 group-hover:border-[#B6A996] transition-all font-serif font-black flex-shrink-0">
                        {chap.order}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-bold text-sm md:text-base text-[#F2E6D0] group-hover:text-[#B6A996] transition-colors truncate">
                          {chap.title}
                        </h4>
                        <span className="text-[9px] text-[#B6A996]/50 block mt-0.5 uppercase tracking-widest font-sans font-bold">
                          TRANG CHÉP CỔ TỰ
                        </span>
                      </div>
                    </div>
                    
                    {/* Ancient Arrow design */}
                    <div className="w-7 h-7 rounded-full bg-[#12110F]/30 flex items-center justify-center border border-[#B6A996]/10 group-hover:border-[#B6A996]/50 transition-all flex-shrink-0">
                      <span className="text-[#B6A996] text-xs font-sans font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* PAGINATION COINS */}
            {chapters.length > CHAPTERS_PER_PAGE && (
              <div className="flex justify-center gap-3 border-t border-[#B6A996]/10 pt-4">
                <button 
                  disabled={chapterPage === 0}
                  onClick={() => setChapterPage(chapterPage - 1)}
                  className="px-4 py-2 bg-[#12110F] text-[#B6A996] hover:text-[#F2E6D0] border border-[#B6A996]/20 hover:border-[#B6A996] rounded-lg disabled:opacity-30 transition-all text-xs font-sans font-bold uppercase cursor-pointer"
                >
                  ◀ Lùi trang
                </button>
                <button 
                  disabled={(chapterPage + 1) * CHAPTERS_PER_PAGE >= chapters.length}
                  onClick={() => setChapterPage(chapterPage + 1)}
                  className="px-4 py-2 bg-[#12110F] text-[#B6A996] hover:text-[#F2E6D0] border border-[#B6A996]/20 hover:border-[#B6A996] rounded-lg disabled:opacity-30 transition-all text-xs font-sans font-bold uppercase cursor-pointer"
                >
                  Tiến trang ▶
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PORTICO: VANG VỌNG TRẦN THẾ (Comments area) */}
          <div className="border-4 border-double border-[#B6A996]/80 outline outline-1 outline-offset-[-8px] outline-[#B6A996]/30 bg-[#12110F] rounded-2xl p-6 shadow-xl flex flex-col gap-6 relative">
            <div className="border-b border-[#B6A996]/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-[#B6A996] rounded-full animate-pulse" />
                <h3 className="font-serif text-lg font-bold uppercase tracking-widest text-[#F2E6D0]">Tiếng Vọng Trần Thế ({comments.length})</h3>
              </div>
            </div>

            {/* Whisper Composer */}
            <div className="bg-[#12110F] border border-[#B6A996]/30 p-4 rounded-xl flex flex-col gap-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Thổ lộ lòng tự ngưỡng mộ bản thân hoặc lời ca tụng nhan sắc tuyệt mỹ..."
                rows={3}
                className="w-full bg-[#12110F] text-[#F2E6D0] placeholder-[#B6A996]/30 p-2 rounded-lg border border-[#3D362E] focus:outline-none focus:border-[#B6A996] text-sm resize-none font-serif italic"
              />
              
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#B6A996]/50 italic font-sans font-bold">
                  {isLoggedIn ? "Tên bạn sẽ khắc trên đá thần..." : "Cần đăng nhập để tạc đá tích..."}
                </span>
                <button 
                  onClick={handleSendComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="px-4 py-1.5 bg-[#B6A996] hover:bg-[#F2E6D0] text-[#12110F] text-xs font-sans font-black tracking-widest rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  KHẮC LỜI <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* WHISPERS LIST */}
            <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.length === 0 ? (
                <div className="flex items-center justify-center p-12 bg-[#12110F]/40 border border-[#B6A996]/10 rounded-xl text-center text-xs text-[#B6A996]/50 font-serif italic">
                  Yên ắng tĩnh lặng. Chưa có tiếng vọng của nhà lữ hành nào được ghi lại.
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
                      className={`relative p-4 rounded-xl border transition-all duration-300 ${isGift ? 'bg-[#3D362E]/60 border-[#B6A996]' : 'bg-[#12110F]/60 border-[#3D362E]'} ${currentSticker ? 'pr-14' : ''}`}
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
                          className="w-9 h-9 shrink-0 pointer-events-none" 
                          fallbackIconSizeClass="w-5 h-5 text-[#F2E6D0]" 
                          borderClass="border border-[#B6A996]/30"
                          bgClass="bg-[#1C1713]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-[#F2E6D0] hover:underline cursor-pointer">
                              {dName}
                            </span>
                            {customTitle && (
                              <span className="px-2 py-0.5 bg-[#3D362E] text-[#B6A996] rounded text-[8px] font-sans font-black uppercase tracking-wider border border-[#B6A996]/30">
                                {customTitle.name || customTitle}
                              </span>
                            )}
                            <span className="text-[9px] text-[#B6A996]/50 font-sans">
                              {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : 'Hôm nay'}
                            </span>
                          </div>

                          {/* Gift Tag */}
                          {isGift && (
                            <div className="mt-1.5 flex items-center gap-1.5 bg-[#12110F] border border-[#B6A996]/40 px-2 py-0.5 rounded text-[10px] text-[#B6A996] font-sans font-bold max-w-max shadow-sm">
                              <Gift className="w-3 h-3" /> Đã dâng {comment.giftAmount} CC tôn vinh nhan sắc tự nhiên
                            </div>
                          )}

                          <p className="mt-2 text-xs md:text-sm text-[#F2E6D0] whitespace-pre-line font-serif italic text-justify leading-relaxed">
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
        <div className="fixed inset-0 bg-[#12110F]/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#12110F] border-4 border-double border-[#B6A996] w-full max-w-md p-6 rounded-2xl shadow-2xl relative text-[#F2E6D0]">
            <h3 className="font-serif text-[#F2E6D0] text-xl font-bold mb-1 uppercase tracking-widest">DÂNG HIẾN LỄ VẬT CỦA SẮC ĐẸP</h3>
            <p className="text-xs text-[#B6A996] mb-5">Hương vị Nectar ngọt lành tôn kính chàng mỹ nam Narcissus tự soi dung nhan bên suối thẳm.</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#B6A996] font-sans font-bold block mb-1 uppercase">Lễ vật Choco (Túi của bạn: {choco} CC)</label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#12110F] text-[#F2E6D0] border border-[#B6A996]/30 p-3 rounded-lg text-sm focus:outline-none focus:border-[#B6A996] font-sans"
                  min="1"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#B6A996] font-sans block mb-1 uppercase font-bold">Khắc tạc tâm nguyện</label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi lời chúc phúc, nguyện cầu vang vọng ngàn thu..."
                  rows={3}
                  className="w-full bg-[#12110F] text-[#F2E6D0] border border-[#B6A996]/30 p-3 rounded-lg text-xs focus:outline-none resize-none font-serif italic focus:border-[#B6A996]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 border border-[#B6A996]/30 text-[#B6A996] hover:text-[#F2E6D0] rounded-lg text-xs font-sans font-bold transition-all cursor-pointer uppercase"
                >
                  BÃI LỄ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="px-4 py-2 bg-[#B6A996] text-[#12110F] hover:bg-[#F2E6D0] rounded-lg text-xs font-sans font-black tracking-widest transition-all cursor-pointer uppercase"
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

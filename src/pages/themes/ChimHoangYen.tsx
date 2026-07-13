import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Heart, ArrowLeft, Sparkles, Feather, Compass } from 'lucide-react';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';
import { motion, AnimatePresence } from 'motion/react';

export function ChimHoangYenTheme(props: ThemeProps) {
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

  // Lê Phi Phàm & Cậu hai Hoắc Thiếu Huân quotes
  const quotes = [
    "Tôi xuyên thành chim hoàng yến được cậu hai Hoắc bao nuôi, chẳng thèm động tay động chân, cơm bưng nước rót suốt ba năm.",
    "Lý do tôi đứng vững bên cạnh ông lớn ba năm qua là vì quá giống bạch nguyệt quang cầu mà không được của anh ấy. Nhưng bạch nguyệt quang về rồi, chim hoàng yến tôi đây chuẩn bị 'bay nhảy' thôi!",
    "Cậu hai Hoắc nhíu mày: 'Em nói em không phân biệt nổi ngũ cốc? Thế ai là người lén ăn vụng hạt dưa hảo hạng của tôi?'",
    "Lê Phi Phàm: 'Bố đường à, tôi yêu tiền của anh thật lòng, nhưng tôi cũng yêu người thật lòng đấy... khi anh chịu chi tiền.'",
    "Gió thổi khẽ, những chiếc lá bạch quả vàng óng rụng đầy bên hồ nước họ Hoắc, xào xạc kể lại câu chuyện ngọt ngào của cậu hai.",
    "Bạch nguyệt quang trở về, Lê Phi Phàm vốn lười biếng đột nhiên lật ngược tình thế, dắt tay cậu hai Hoắc làm cả giới thượng lưu kinh ngạc.",
    "Chim hoàng yến không muốn làm thế thân, chim hoàng yến muốn làm chính cung của cậu hai!",
    "Cậu hai Hoắc Thiếu Huân: 'Tôi từng nghĩ em chỉ là chú chim hoàng yến ngốc nghếch bên hồ, hóa ra em lại là chú chim tinh ranh lém lỉnh nhất.'"
  ];

  const [quoteIdx, setQuoteIdx] = useState(0);
  const [isWaterRippling, setIsWaterRippling] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleTouchLake = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    setIsWaterRippling(true);

    // Trích dẫn ngẫu nhiên tiếp theo
    let nextIdx = quoteIdx;
    while (nextIdx === quoteIdx && quotes.length > 1) {
      nextIdx = Math.floor(Math.random() * quotes.length);
    }
    setQuoteIdx(nextIdx);

    // Xóa ripple sau khi hoàn thành animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
  };

  // Giả lập lá bạch quả rơi ngẫu nhiên
  const leavesArray = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    delay: i * 2.5,
    duration: 12 + i * 4,
    left: `${10 + i * 16}%`,
    scale: 0.6 + (i % 3) * 0.2
  }));

  return (
    <div className="bg-[#eff6f0] min-h-screen text-[#1b3a1e] font-sans pb-24 relative overflow-x-hidden selection:bg-[#f4d451] selection:text-[#1b3a1e]">
      
      {/* 1. LÁ BẠCH QUẢ RƠI LÃNG MẠN */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {leavesArray.map(leaf => (
          <motion.div
            key={leaf.id}
            initial={{ y: -50, opacity: 0, rotate: 0 }}
            animate={{
              y: '105vh',
              opacity: [0, 0.9, 0.9, 0],
              x: [0, 40, -30, 20],
              rotate: [0, 180, 360, 540]
            }}
            transition={{
              duration: leaf.duration,
              repeat: Infinity,
              delay: leaf.delay,
              ease: 'linear'
            }}
            style={{
              position: 'absolute',
              left: leaf.left,
              transform: `scale(${leaf.scale})`
            }}
          >
            {/* SVG Lá Bạch Quả vẽ thủ công chi tiết bằng màu vàng #ddd289 */}
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50,90 Q50,75 50,60 Q20,50 15,35 Q10,15 45,12 Q50,15 50,22 Q50,15 55,12 Q90,15 85,35 Q80,50 50,60"
                fill="#ddd289"
                stroke="#c7be78"
                strokeWidth="2"
              />
              <path d="M50,60 Q45,45 35,32" stroke="#c7be78" strokeWidth="1" strokeDasharray="2,2" />
              <path d="M50,60 Q55,45 65,32" stroke="#c7be78" strokeWidth="1" strokeDasharray="2,2" />
              <path d="M50,60 L50,25" stroke="#c7be78" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* 2. THANH TIÊU ĐỀ HOÀNG GIA - CẬU HAI HOẮC */}
      <div className="border-b-[3px] border-[#cde8c6] bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        {/* Nút quay lại */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#eff6f0] hover:bg-[#aeed9a] text-[#1b3a1e] text-xs font-bold tracking-wider border border-[#cde8c6] transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>DANH SÁCH</span>
        </button>

        {/* Tựa đề truyện trung tâm */}
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-[#f4d451]" />
          <h2 className="font-extrabold text-[#1b3a1e] text-sm md:text-base tracking-wider uppercase">
            CHIM HOÀNG YẾN CỦA CẬU HAI
          </h2>
        </div>

        {/* Choco Coin indicator */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f4d451]/15 border border-[#f4d451]/40 text-xs font-black">
          <span>🍫</span>
          <span>{choco} Choco</span>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto p-4 md:p-8 relative z-10 flex flex-col gap-8">
        
        {/* 3. BẢNG HIỆU LÁ BẠCH QUẢ & CHIM HOÀNG YẾN ĐẬU CÀNH */}
        <div className="w-full bg-white/70 rounded-[2.5rem] border-[3px] border-[#cde8c6] p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
          {/* Nhánh cây và chim hoàng yến vẽ bằng SVG trang nhã ở góc */}
          <div className="absolute top-0 right-0 w-36 h-36 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#aeed9a]">
              {/* Nhánh cây */}
              <path d="M100,20 Q60,30 20,10 Q40,40 100,50" stroke="#1b3a1e" strokeWidth="2" fill="none" />
              {/* Lá */}
              <path d="M50,22 Q53,10 60,18" stroke="#1b3a1e" fill="#aeed9a" />
              <path d="M70,25 Q75,12 82,20" stroke="#1b3a1e" fill="#ddd289" />
              {/* Chú chim nhỏ màu vàng */}
              <path d="M40,15 C35,10 25,12 25,20 C25,25 32,28 38,25 C40,23 45,22 40,15 Z" fill="#f4d451" />
              <path d="M25,18 L18,22 L23,24 Z" fill="#ddd289" />
            </svg>
          </div>

          {/* Ảnh bìa truyện */}
          <div className="w-48 h-72 md:w-56 md:h-84 flex-shrink-0 relative group">
            <div className="absolute inset-0 bg-[#cde8c6] rounded-2xl transform rotate-2 group-hover:rotate-0 transition-transform duration-300" />
            <img 
              src={story.coverUrl} 
              alt={story.title} 
              className="w-full h-full object-cover rounded-2xl border-2 border-[#1b3a1e] relative z-10 shadow-md group-hover:scale-[1.02] transition-all" 
            />
            {story.completed && (
              <span className="absolute top-3 left-3 bg-[#f4d451] text-[#1b3a1e] text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md z-20 border border-[#1b3a1e] shadow-sm">
                FULL
              </span>
            )}
          </div>

          {/* Chi tiết thông tin truyện */}
          <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
            <div>
              <span className="text-[10px] bg-[#aeed9a]/40 text-[#1b3a1e] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#cde8c6] inline-block mb-2">
                Bộ thứ 9 • Quyền quý gia tộc
              </span>
              <h1 className="text-2xl md:text-3.5xl font-black text-[#1b3a1e] tracking-tight leading-tight uppercase">
                {story.title}
              </h1>
              <p className="text-[#1b3a1e]/70 font-bold text-xs mt-1 uppercase tracking-wide">
                Tác giả: <span className="text-[#1b3a1e] font-black">{story.author}</span>
              </p>
            </div>

            {/* Thể loại */}
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
              {story.genres?.map?.((genre: string) => (
                <span 
                  key={genre} 
                  className="bg-[#eff6f0] hover:bg-[#aeed9a]/30 text-[#1b3a1e] text-[11px] font-bold uppercase px-3 py-1 rounded-xl border border-[#cde8c6] transition-colors"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Chỉ số */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y-2 border-dashed border-[#cde8c6]/60 text-center">
              <div>
                <p className="text-[10px] text-[#1b3a1e]/60 font-bold uppercase tracking-wider">Chương</p>
                <p className="text-xl font-black text-[#1b3a1e]">{Math.max(story.chapterCount || 0, chapters.length)}</p>
              </div>
              <div className="border-x border-[#cde8c6]">
                <p className="text-[10px] text-[#1b3a1e]/60 font-bold uppercase tracking-wider">Hỏa Lực 🔥</p>
                <p className="text-xl font-black text-[#1b3a1e]">
                  {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#1b3a1e]/60 font-bold uppercase tracking-wider">Đã Tặng 🍫</p>
                <p className="text-xl font-black text-[#1b3a1e]">{totalGiftedChoco}</p>
              </div>
            </div>

            {/* Hàng nút hành động */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
              <button 
                onClick={() => chapters.length > 0 && navigate(`/doc/${story.slug || story.id}/chuong-${chapters[0].order + 1}`)} 
                className="bg-[#f4d451] hover:bg-[#ddd289] text-[#1b3a1e] px-5 py-2.5 text-xs rounded-full font-black uppercase tracking-wider flex items-center gap-2 border-2 border-[#1b3a1e] shadow-[2px_2px_0_0_#1b3a1e] transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                Đọc Từ Đầu
              </button>

              <button 
                onClick={handleSaveToggle} 
                className={`px-5 py-2.5 text-xs rounded-full font-black uppercase tracking-wider flex items-center gap-2 border-2 border-[#1b3a1e] shadow-[2px_2px_0_0_#1b3a1e] transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer ${
                  savedStories?.includes(story.id)
                    ? "bg-[#cde8c6] text-[#1b3a1e]" 
                    : "bg-white text-[#1b3a1e]"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${savedStories?.includes(story.id) ? "fill-[#1b3a1e]" : ""}`} />
                {savedStories?.includes(story.id) ? 'Đã Lưu Thư Viện' : 'Lưu Thư Viện'}
              </button>

              <button 
                onClick={() => setShowGiftModal(true)} 
                className="bg-[#aeed9a] hover:bg-[#cde8c6] text-[#1b3a1e] px-5 py-2.5 text-xs rounded-full font-black uppercase tracking-wider flex items-center gap-2 border-2 border-[#1b3a1e] shadow-[2px_2px_0_0_#1b3a1e] transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer"
              >
                <Gift className="w-4 h-4 animate-bounce" />
                Tặng Choco
              </button>
            </div>
          </div>
        </div>

        {/* 4. MÔ TẢ GIỚI THIỆU TRUYỆN */}
        <div className="bg-white/50 rounded-3xl border-2 border-[#cde8c6] p-6 md:p-8 shadow-sm">
          <h3 className="font-extrabold text-sm uppercase tracking-widest text-[#1b3a1e] mb-4 border-b border-[#cde8c6]/80 pb-2">
            🌿 Tóm tắt câu chuyện
          </h3>
          <div className="text-[#1b3a1e]/90 leading-relaxed space-y-4 text-justify text-sm font-medium">
            {story.description?.split('\n').map((para: string, idx: number) => (
              <p key={idx} className={para.trim() ? "" : "hidden"}>
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* 5. GÓC NGẮM CẢNH LAKESIDE (TƯƠNG TÁC GỢN SÓNG NƯỚC) */}
        <div className="bg-white/80 rounded-[2rem] border-2 border-[#cde8c6] p-6 text-center relative overflow-hidden shadow-sm">
          <h4 className="font-extrabold text-xs uppercase tracking-widest text-[#1b3a1e] mb-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#f4d451]" />
            Góc bên hồ Họ Hoắc
          </h4>
          <p className="text-[11px] text-[#1b3a1e]/70 mb-4">
            (Bấm lên mặt nước xanh mướt bên dưới để khơi dậy gợn sóng và nghe chim hoàng yến Lê Phi Phàm hót)
          </p>
          
          {/* Hồ nước tương tác */}
          <div 
            onClick={handleTouchLake}
            className="w-full h-36 bg-gradient-to-b from-[#cde8c6]/50 to-[#eff6f0] rounded-2xl border-2 border-[#aeed9a] relative cursor-pointer overflow-hidden flex items-center justify-center p-4 transition-all hover:border-[#1b3a1e]"
          >
            {/* Gợn sóng bằng motion */}
            {ripples.map(ripple => (
              <motion.div
                key={ripple.id}
                initial={{ width: 0, height: 0, opacity: 0.8 }}
                animate={{ width: 250, height: 250, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute border-[3px] border-[#aeed9a] rounded-full pointer-events-none"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            {/* Trích dẫn hiển thị ở giữa hồ nước */}
            <AnimatePresence mode="wait">
              <motion.p
                key={quoteIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-xs md:text-sm font-bold text-[#1b3a1e] italic relative z-10 px-6 drop-shadow-sm select-none"
              >
                "{quotes[quoteIdx]}"
              </motion.p>
            </AnimatePresence>

            {/* Icon chim hoàng yến lượn nhẹ nhàng */}
            <motion.div 
              animate={{ 
                y: [0, -6, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-3 right-4 text-[#f4d451] pointer-events-none"
            >
              <Feather className="w-5 h-5 fill-[#f4d451]" />
            </motion.div>
          </div>
        </div>

        {/* 6. DANH SÁCH CHƯƠNG VÀ BÌNH LUẬN TABS */}
        <div className="bg-white/80 rounded-[2rem] border-2 border-[#cde8c6] p-6 shadow-sm">
          {/* Menu chọn Tab */}
          <div className="flex border-b-[3px] border-[#cde8c6]/50 mb-6 font-bold text-xs uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`px-4 py-3 relative transition-all cursor-pointer ${
                activeTab === 'chapters' ? "text-[#1b3a1e]" : "text-[#1b3a1e]/40 hover:text-[#1b3a1e]"
              }`}
            >
              Mục lục chương ({chapters.length})
              {activeTab === 'chapters' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f4d451] rounded-t-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-3 relative transition-all cursor-pointer ${
                activeTab === 'comments' ? "text-[#1b3a1e]" : "text-[#1b3a1e]/40 hover:text-[#1b3a1e]"
              }`}
            >
              Độc giả đàm đạo ({comments.length})
              {activeTab === 'comments' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f4d451] rounded-t-full"></span>
              )}
            </button>
          </div>

          {/* NỘI DUNG TAB CHƯƠNG */}
          {activeTab === 'chapters' ? (
            <div className="flex flex-col gap-4">
              {/* Thanh sắp xếp */}
              <div className="flex justify-between items-center bg-[#eff6f0]/50 p-2.5 rounded-xl border border-[#cde8c6]/40">
                <span className="text-xs font-bold text-[#1b3a1e]/70">
                  Sắp xếp chương
                </span>
                <button
                  onClick={() => setChapterSortDesc(!chapterSortDesc)}
                  className="text-xs font-bold px-3 py-1 bg-white hover:bg-[#aeed9a]/20 border border-[#cde8c6] rounded-lg transition-all cursor-pointer"
                >
                  {chapterSortDesc ? 'Mới nhất xếp trước' : 'Cũ nhất xếp trước'}
                </button>
              </div>

              {/* Danh sách các chương */}
              {displayedChapters.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {displayedChapters.map((ch: any) => {
                    const isRead = false; // logic check isRead
                    return (
                      <div
                        key={ch.id}
                        onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${ch.order + 1}`)}
                        className="p-3.5 bg-white hover:bg-[#aeed9a]/10 rounded-xl border border-[#cde8c6] hover:border-[#1b3a1e] transition-all cursor-pointer flex justify-between items-center group"
                      >
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-[#1b3a1e] truncate group-hover:text-[#1b3a1e]">
                            {ch.title}
                          </p>
                          <p className="text-[10px] text-[#1b3a1e]/50 font-mono mt-0.5">
                            Thứ tự: {ch.order + 1}
                          </p>
                        </div>
                        {ch.isPasswordProtected ? (
                          <span className="text-xs bg-[#f4d451]/20 border border-[#f4d451] text-[#1b3a1e]/80 px-2 py-0.5 rounded font-black">
                            KHÓA
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#1b3a1e]/60 font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                            ĐỌC ➜
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#1b3a1e]/50 font-bold uppercase">
                  Chương truyện đang được chuẩn bị...
                </div>
              )}

              {/* Phân trang chương */}
              {chapters.length > CHAPTERS_PER_PAGE && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setChapterPage(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        chapterPage === idx
                          ? "bg-[#f4d451] text-[#1b3a1e] border-[#1b3a1e]"
                          : "bg-white text-[#1b3a1e]/60 border-[#cde8c6] hover:bg-[#eff6f0]"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB BÌNH LUẬN */
            <div className="flex flex-col gap-6">
              {/* Form gửi bình luận */}
              {isLoggedIn ? (
                <form onSubmit={handleSendComment} className="flex flex-col gap-2.5">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Lê Phi Phàm tấu hài cực đỉnh, viết bình luận ủng hộ cậu ta nào..."
                    className="w-full bg-white border border-[#cde8c6] focus:border-[#1b3a1e] text-[#1b3a1e] text-sm rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-[#1b3a1e] placeholder-stone-400 leading-relaxed shadow-inner"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="bg-[#1b3a1e] hover:bg-[#1b3a1e]/80 disabled:bg-stone-200 disabled:text-stone-400 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-2.5 rounded-full border border-[#1b3a1e] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi Bình Luận
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 bg-[#eff6f0] border border-[#cde8c6] rounded-2xl text-center text-xs font-bold text-[#1b3a1e]/60 uppercase">
                  Đăng nhập để đàm đạo cùng các độc giả khác nhé!
                </div>
              )}

              {/* Danh sách bình luận */}
              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
                {comments.length > 0 ? (
                  comments.map((comment: any) => {
                    const isGift = comment.type === 'choco_gift';
                    return (
                      <div 
                        key={comment.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isGift
                            ? "bg-[#f4d451]/10 border-[#f4d451] hover:bg-[#f4d451]/15"
                            : "bg-white border-[#cde8c6] hover:border-[#aeed9a]"
                        }`}
                      >
                        <div className="flex gap-3">
                          <UserAvatar 
                            avatarUrl={comment.avatarUrl} 
                            equippedAccessory={comment.equippedAccessory}
                            accessoryPosition={comment.accessoryPosition}
                            className="w-9 h-9 shrink-0 border border-[#cde8c6]" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span 
                                className="font-extrabold text-xs truncate"
                                style={{ color: getTitleColor?.(comment.activeTitle) || '#1b3a1e' }}
                              >
                                {comment.displayName || 'Độc giả ẩn danh'}
                                {comment.activeTitle && (
                                  <span className="ml-1.5 px-2 py-0.5 bg-[#f4d451]/30 border border-[#f4d451] text-[#1b3a1e] text-[9px] font-black rounded uppercase tracking-wider">
                                    {comment.activeTitle}
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] text-[#1b3a1e]/40 font-mono">
                                {comment.createdAt?.toDate 
                                  ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                                  : 'Vừa xong'}
                              </span>
                            </div>
                            
                            {isGift && (
                              <div className="mb-2 inline-flex items-center gap-1 bg-[#f4d451] text-[#1b3a1e] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#1b3a1e]">
                                🍫 TẶNG {comment.giftAmount} CHOCO
                              </div>
                            )}

                            <p className="text-xs md:text-sm text-[#1b3a1e]/90 leading-relaxed text-justify break-words">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-[#1b3a1e]/40 font-bold uppercase">
                    Chưa có bình luận nào cho câu chuyện này.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. MODAL TẶNG CHOCO */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] border-[3px] border-[#1b3a1e] max-w-md w-full p-6 md:p-8 relative overflow-hidden"
          >
            <h3 className="font-black text-lg text-[#1b3a1e] text-center uppercase tracking-wide mb-2 flex items-center justify-center gap-2">
              <span>🎁 TẶNG CHOCO</span>
            </h3>
            <p className="text-xs text-[#1b3a1e]/60 text-center mb-6">
              (Gửi kẹo Choco ngọt ngào để ủng hộ tinh thần tấu hài của Lê Phi Phàm!)
            </p>

            <div className="flex flex-col gap-4">
              {/* Chọn mức quà */}
              <div>
                <label className="text-[10px] text-[#1b3a1e]/50 font-black uppercase tracking-wider mb-2 block">
                  Chọn số lượng Choco:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 200, 1000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setGiftAmount(amount)}
                      className={`py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                        giftAmount === amount
                          ? "bg-[#f4d451] border-[#1b3a1e]"
                          : "bg-[#eff6f0]/50 border-[#cde8c6] hover:bg-[#aeed9a]/10"
                      }`}
                    >
                      {amount} 🍫
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhập thủ công */}
              <div>
                <label className="text-[10px] text-[#1b3a1e]/50 font-black uppercase tracking-wider mb-1 block">
                  Hoặc nhập số lượng tùy ý:
                </label>
                <input
                  type="number"
                  min={1}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Number(e.target.value))}
                  className="w-full bg-[#eff6f0]/30 border-2 border-[#cde8c6] focus:border-[#1b3a1e] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-0"
                />
              </div>

              {/* Lời nhắn gửi */}
              <div>
                <label className="text-[10px] text-[#1b3a1e]/50 font-black uppercase tracking-wider mb-1 block">
                  Lời nhắn gửi:
                </label>
                <textarea
                  rows={2}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi tặng Choco ngọt ngào ủng hộ tác phẩm!"
                  className="w-full bg-[#eff6f0]/30 border-2 border-[#cde8c6] focus:border-[#1b3a1e] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 py-3 border-2 border-[#cde8c6] rounded-full text-xs font-black uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleGiftSubmit}
                  className="flex-1 py-3 bg-[#f4d451] hover:bg-[#ddd289] border-2 border-[#1b3a1e] shadow-[2px_2px_0_0_#1b3a1e] rounded-full text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer"
                >
                  Tặng quà
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

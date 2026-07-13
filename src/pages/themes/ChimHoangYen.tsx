import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, ArrowLeft, Sparkles, Feather, Star } from 'lucide-react';
import { UserAvatar } from '../../components/UserAvatar';
import { motion } from 'motion/react';

export function ChimHoangYenTheme(props: ThemeProps) {
  const {
    story, chapters, comments, activeTab, setActiveTab,
    chapterPage, setChapterPage, chapterSortDesc, setChapterSortDesc, CHAPTERS_PER_PAGE,
    showGiftModal, setShowGiftModal, giftAmount, setGiftAmount, giftMessage, setGiftMessage, handleGiftSubmit,
    commentText, setCommentText, submittingComment, handleSendComment,
    isLoggedIn, savedStories, handleSaveToggle, choco, navigate,
    getTitleColor
  } = props;

  const totalGiftedChoco = comments.filter(c => c.type === 'choco_gift').reduce((acc, curr) => acc + (curr.giftAmount || 0), 0);

  const displayedChapters = [...chapters]
    .sort((a, b) => {
      const aNum = a.orderIndex !== undefined ? a.orderIndex : parseFloat(a.title?.match(/\d+/)?.[0] || '0');
      const bNum = b.orderIndex !== undefined ? b.orderIndex : parseFloat(b.title?.match(/\d+/)?.[0] || '0');
      return chapterSortDesc ? bNum - aNum : aNum - bNum;
    })
    .slice(chapterPage * CHAPTERS_PER_PAGE, (chapterPage + 1) * CHAPTERS_PER_PAGE);

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [chirping, setChirping] = useState(false);

  // Web Audio Bird Chirp Synthesizer (Tiếng chim hoàng yến hót lảnh lót dịu dàng)
  const playBirdChirp = () => {
    try {
      setChirping(true);
      setTimeout(() => setChirping(false), 500);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const chirp = (startTime: number, baseFreq: number, targetFreq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(targetFreq, startTime + duration * 0.3);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, startTime + duration);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + duration * 0.2);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      chirp(now, 3100, 4600, 0.07);
      chirp(now + 0.08, 3300, 4800, 0.08);
      chirp(now + 0.18, 3200, 4500, 0.07);
      
      if (Math.random() > 0.4) {
        chirp(now + 0.28, 3500, 5100, 0.1);
        chirp(now + 0.4, 3700, 5400, 0.12);
      }
    } catch (e) {
      console.warn('Web Audio is not supported yet', e);
    }
  };

  // Kích hoạt sóng nước lăn tăn trên toàn bộ mặt hồ giao diện khi chạm
  const handleTouchWater = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('textarea') || target.closest('input') || target.closest('.interactive-card')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    playBirdChirp();

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1200);
  };

  // Lá bạch quả vàng úa rơi mượt mà dịu mát (tạo từ 5 mã màu vàng/xanh tinh tế)
  const fallingLeaves = Array.from({ length: 14 }).map((_, i) => ({
    id: i,
    delay: i * 1.5,
    duration: 12 + i * 2.5,
    left: `${5 + i * 7}%`,
    scale: 0.4 + (i % 4) * 0.15,
    isFeather: i % 3 === 0
  }));

  return (
    <div 
      onClick={handleTouchWater}
      className="bg-gradient-to-b from-[#eff6f0] via-[#cde8c6] to-[#eff6f0] min-h-screen text-[#132e1a] font-sans pb-24 relative overflow-x-hidden selection:bg-[#f4d451] selection:text-[#132e1a] transition-all duration-1000"
    >
      
      {/* HIỆU ỨNG GỢN SÓNG NƯỚC TOÀN BỘ GIAO DIỆN (MẶT HỒ XANH MƯỚT) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: 350, height: 350, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute border-[1px] border-[#ddd289] rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Các gợn sóng nước tự nhiên lăn tăn khẽ khàng */}
        <motion.div 
          animate={{ opacity: [0.1, 0.25, 0.1], y: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-[#ddd289]/30 to-transparent rounded-full"
        />
        <motion.div 
          animate={{ opacity: [0.15, 0.3, 0.15], y: [0, -4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-2/3 right-1/4 w-[500px] h-1.5 bg-gradient-to-r from-transparent via-[#ddd289]/20 to-transparent rounded-full"
        />
        <motion.div 
          animate={{ opacity: [0.08, 0.2, 0.08], y: [0, 3, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/2 w-80 h-0.5 bg-gradient-to-r from-transparent via-[#ddd289]/25 to-transparent rounded-full"
        />
      </div>

      {/* 1. HIỆU ỨNG LÁ BẠCH QUẢ VÀ LÔNG VŨ RƠI MÀU SẮC SẢO */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {fallingLeaves.map(leaf => (
          <motion.div
            key={leaf.id}
            initial={{ y: -60, opacity: 0, rotate: 0 }}
            animate={{
              y: '105vh',
              opacity: [0, 0.9, 0.9, 0],
              x: [0, 40, -30, 20],
              rotate: [0, 140, 260, 360]
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
            {leaf.isFeather ? (
              /* Lông vũ hoàng yến mềm mại vàng óng (#f4d451) nét vẽ rất mảnh và sắc sảo */
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15,85 Q42,58 52,28 Q54,12 44,4 Q56,10 62,22 Q72,52 85,62 Q68,68 48,72 Z"
                  fill="#f4d451"
                  stroke="#ddd289"
                  strokeWidth="1"
                />
                <path d="M44,4 Q48,40 15,85" stroke="#eff6f0" strokeWidth="1" />
              </svg>
            ) : (
              /* Lá bạch quả hình quạt chân thực, thanh lịch (#ddd289 và #f4d451) nét viền mỏng tang cực sắc sảo */
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M50,90 C42,62 20,55 5,40 C15,22 35,16 50,30 C65,16 85,22 95,40 C80,55 58,62 50,90 Z"
                  fill="#ddd289"
                  stroke="#f4d451"
                  strokeWidth="0.8"
                />
                <path d="M50,90 C50,65 50,30 50,30" stroke="#eff6f0" strokeWidth="1" strokeDasharray="2,2" />
              </svg>
            )}
          </motion.div>
        ))}
      </div>

      {/* CÂY BẠCH QUẢ THẬT RỦ BÓNG MỀM MẠI, TINH TẾ Ở PHÍA TRÊN BÊN TRÁI - VIỀN MẢNH SẮC SẢO */}
      <div className="absolute top-0 left-0 w-96 h-[420px] pointer-events-none z-10 overflow-hidden opacity-95 hidden lg:block">
        <svg className="w-full h-full" viewBox="0 0 400 450" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Thân cây bạch quả phong trần, uốn lượn sắc sảo bằng màu nâu lục trầm (#ddd289) */}
          <path d="M0,0 Q120,40 210,130 T280,310" stroke="#ddd289" strokeWidth="4" strokeLinecap="round" />
          <path d="M90,30 Q170,90 160,170" stroke="#ddd289" strokeWidth="2" strokeLinecap="round" />
          <path d="M160,75 Q230,120 210,210" stroke="#ddd289" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M220,170 Q300,190 320,270" stroke="#ddd289" strokeWidth="1" strokeLinecap="round" />

          {/* Các phiến lá bạch quả xếp lớp rực rỡ sắc sảo bằng màu #f4d451, #ddd289 và màu xanh #aeed9a */}
          {/* Nhóm lá 1 */}
          <circle cx="100" cy="45" r="14" fill="#f4d451" className="opacity-85" />
          <circle cx="115" cy="55" r="11" fill="#ddd289" className="opacity-90" />
          <circle cx="85" cy="50" r="10" fill="#aeed9a" className="opacity-80" />
          
          {/* Nhóm lá 2 */}
          <circle cx="170" cy="100" r="20" fill="#ddd289" className="opacity-95" />
          <circle cx="190" cy="115" r="16" fill="#f4d451" className="opacity-90" />
          <circle cx="150" cy="110" r="12" fill="#aeed9a" className="opacity-85" />
          
          {/* Nhóm lá 3 */}
          <circle cx="225" cy="150" r="18" fill="#f4d451" className="opacity-90" />
          <circle cx="245" cy="170" r="14" fill="#ddd289" className="opacity-85" />
          <circle cx="205" cy="165" r="15" fill="#aeed9a" className="opacity-90" />

          {/* Nhóm lá 4 */}
          <circle cx="290" cy="240" r="16" fill="#ddd289" className="opacity-95" />
          <circle cx="305" cy="265" r="12" fill="#f4d451" className="opacity-90" />
          <circle cx="275" cy="255" r="14" fill="#aeed9a" className="opacity-85" />

          {/* CHÚ CHIM HOÀNG YẾN VÀG RỰC ĐẬU TỰ DO TRÊN NHÁNH BẠCH QUẢ TRẬM MẶC */}
          <motion.g
            whileHover={{ scale: 1.15 }}
            animate={{ y: [0, -2, 0], rotate: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            onClick={(e: any) => {
              e.stopPropagation();
              playBirdChirp();
            }}
            className="cursor-pointer pointer-events-auto"
            transform="translate(185, 125)"
          >
            {/* Chân chim mỏng manh tinh sảo */}
            <line x1="2" y1="8" x2="0" y2="14" stroke="#132e1a" strokeWidth="1" />
            <line x1="6" y1="8" x2="6" y2="14" stroke="#132e1a" strokeWidth="1" />
            
            {/* Đuôi chim */}
            <path d="M-8,5 L-20,12 L-14,2 Z" fill="#ddd289" stroke="#132e1a" strokeWidth="0.5" />
            
            {/* Thân chim */}
            <ellipse cx="4" cy="2" rx="12" ry="7" fill="#f4d451" stroke="#132e1a" strokeWidth="0.6" />
            
            {/* Đầu chim */}
            <circle cx="13" cy="-4" r="6" fill="#f4d451" stroke="#132e1a" strokeWidth="0.6" />
            
            {/* Mỏ chim nhỏ */}
            <polygon points="18,-6 23,-4 18,-2" fill="#ddd289" stroke="#132e1a" strokeWidth="0.5" />
            
            {/* Mắt chim nhỏ lém lỉnh */}
            <circle cx="14" cy="-5" r="1" fill="#132e1a" />
            
            {/* Cánh chim hoàng yến */}
            <path d="M-1,0 Q-5,-4 -9,1 Q-5,6 -1,2" fill="#ddd289" stroke="#132e1a" strokeWidth="0.5" />
          </motion.g>
        </svg>
      </div>

      {/* CÂY BẠCH QUẢ ĐỐI XỨNG Ở PHÍA TRÊN BÊN PHẢI ĐỂ CÂN BẰNG KHÔNG GIAN */}
      <div className="absolute top-0 right-0 w-80 h-[350px] pointer-events-none z-10 overflow-hidden opacity-90 hidden lg:block">
        <svg className="w-full h-full transform scale-x-[-1]" viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 Q100,30 180,110 T240,260" stroke="#ddd289" strokeWidth="3" strokeLinecap="round" />
          <path d="M80,25 Q145,75 135,145" stroke="#ddd289" strokeWidth="1.8" />
          <circle cx="100" cy="40" r="12" fill="#f4d451" className="opacity-80" />
          <circle cx="145" cy="95" r="16" fill="#ddd289" className="opacity-95" />
          <circle cx="165" cy="135" r="14" fill="#aeed9a" className="opacity-85" />
          <circle cx="210" cy="190" r="13" fill="#f4d451" className="opacity-90" />
        </svg>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG MỎNG, SẮC SẢO VÀ DỊU DÀNG */}
      <div className="border-b-[1px] border-[#ddd289] bg-[#eff6f0]/95 backdrop-blur-md px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-[0_2px_15px_rgba(19,46,26,0.03)]">
        {/* Nút Trở về rẽ sóng lãng mạn */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#eff6f0] hover:bg-[#cde8c6] text-[#132e1a] text-xs font-semibold border-[1px] border-[#ddd289] transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span className="tracking-wide">Lướt sóng quy về</span>
        </button>

        {/* Tiêu đề dịu dàng, trong trẻo */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/60 border-[1px] border-[#ddd289]/40">
          <Feather className="w-3.5 h-3.5 text-[#f4d451] animate-pulse" />
          <h2 className="font-medium text-xs md:text-sm tracking-wider uppercase font-serif">
            Gió lay mặt hồ • Nhánh bạch quả rủ soi bóng hoàng yến
          </h2>
        </div>

        {/* Choco Coin nhẹ nhàng */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/50 border-[1px] border-[#ddd289] text-xs font-medium text-[#132e1a]">
          <span>🍃 Sương hồ</span>
          <span className="tracking-wide">{choco} giọt</span>
        </div>
      </div>

      {/* 3. BỐ CỤC CHÍNH ĐỒNG BỘ MÀU SẮC ĐẸP ĐẼ */}
      <div className="max-w-[1240px] mx-auto p-4 md:p-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ===================== CỘT TRÁI (COL-SPAN 5): BÌA TRUYỆN DẠNG CHỮ NHẬT TRUYỀN THỐNG VÀ THỐNG KÊ ===================== */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          
          {/* KHUNG THÔNG TIN BÌA SÁCH THỜI TRANG, SẮC SẢO MỎNG MANH */}
          <div className="interactive-card w-full rounded-2xl border-[1px] border-[#ddd289] bg-white/90 backdrop-blur-sm p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Nhãn nhỏ xinh */}
            <div className="absolute top-4 right-4 bg-[#eff6f0] text-[#132e1a]/80 text-[9px] font-medium tracking-widest px-2.5 py-0.5 rounded border border-[#ddd289]/40 uppercase">
              Bạch quả rủ ký
            </div>

            {/* BÌA TRUYỆN ĐÃ TRẢ LẠI KÍCH THƯỚC BÌNH THƯỜNG (HÌNH CHỮ NHẬT ĐỨNG SẮC SẢO) */}
            <div className="w-40 h-56 md:w-48 md:h-68 rounded-xl relative overflow-hidden border-[1px] border-[#ddd289] shadow-[0_4px_20px_rgba(19,46,26,0.06)] group shrink-0 mt-3">
              <div className="absolute inset-0 bg-[#aeed9a]/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <img 
                src={story.coverUrl} 
                alt={story.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              {story.completed && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#f4d451] text-[#132e1a] text-[9px] uppercase font-semibold tracking-widest px-3 py-1 rounded-md border border-[#ddd289] shadow-sm z-20">
                  Sóng yên hồ lặng
                </span>
              )}
            </div>

            {/* Tiêu đề tác phẩm dịu dàng */}
            <div className="mt-6 z-10">
              <span className="text-[9px] bg-[#eff6f0] text-[#132e1a]/80 font-medium uppercase tracking-wider px-3 py-1 rounded border border-[#ddd289]/50 inline-block mb-3.5">
                Bóng nước nhà họ Hoắc
              </span>
              <h1 className="text-lg md:text-xl font-bold text-[#132e1a] tracking-tight leading-snug uppercase font-serif px-2">
                {story.title}
              </h1>
              <p className="text-[#132e1a]/70 font-medium text-xs mt-1.5 italic">
                Chấp bút: {story.author}
              </p>
            </div>

            {/* BẢNG THỐNG KÊ LỊCH SỬ THƠ MỘNG, ĐƯỜNG NÉT SẮC SẢO MỎNG MANH */}
            <div className="grid grid-cols-3 gap-1 w-full py-4 border-y-[1px] border-dashed border-[#ddd289] mt-6 text-center z-10">
              <div>
                <p className="text-[9px] text-[#132e1a]/50 font-medium uppercase tracking-wider">Đợt sóng chương</p>
                <p className="text-sm font-semibold text-[#132e1a] mt-0.5">{Math.max(story.chapterCount || 0, chapters.length)} lá</p>
              </div>
              <div className="border-x-[1px] border-[#ddd289]/40">
                <p className="text-[9px] text-[#132e1a]/50 font-medium uppercase tracking-wider">Bóng khách soi hồ</p>
                <p className="text-sm font-semibold text-[#132e1a] mt-0.5">
                  {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#132e1a]/50 font-medium uppercase tracking-wider">Chút lòng tri âm</p>
                <p className="text-sm font-semibold text-[#132e1a] mt-0.5">{totalGiftedChoco} hạt</p>
              </div>
            </div>

            {/* Câu cảm thán bay nhè nhẹ ở chân bìa truyện */}
            <div className="mt-4 text-center pointer-events-none">
              <span className="text-[11px] text-[#132e1a]/70 font-serif italic block px-2 leading-relaxed">
                “Mặt hồ gợn sóng xanh trong, khẽ lung lay bóng dừa và nhành bạch quả cổ phong lãng đãng...”
              </span>
            </div>
          </div>

          {/* CÁC NÚT ĐIỀU HƯỚNG NHANH - THIẾT KẾ MỎNG NHẸ, DỊU DÀNG */}
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => chapters.length > 0 && navigate(`/doc/${story.slug || story.id}/chuong-${chapters[0].order + 1}`)} 
              className="flex-1 bg-[#aeed9a] hover:bg-[#f4d451] text-[#132e1a] py-3 text-xs rounded-xl font-semibold tracking-wider flex items-center justify-center gap-2 border-[1px] border-[#ddd289] transition-all duration-300 hover:shadow-md cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#132e1a]" />
              Rẽ nước thưởng văn
            </button>

            <button 
              onClick={handleSaveToggle} 
              className={`flex-1 py-3 text-xs rounded-xl font-semibold tracking-wider flex items-center justify-center gap-2 border-[1px] border-[#ddd289] transition-all duration-300 hover:shadow-md cursor-pointer ${
                savedStories?.includes(story.id)
                  ? "bg-[#f4d451] text-[#132e1a]" 
                  : "bg-white/80 hover:bg-[#eff6f0] text-[#132e1a]"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedStories?.includes(story.id) ? "fill-[#132e1a]" : ""}`} />
              {savedStories?.includes(story.id) ? 'Khắc lòng đáy nước' : 'Thả tim xuống hồ'}
            </button>
          </div>

        </div>

        {/* ===================== CỘT PHẢI (COL-SPAN 7): KHUNG SÁCH THƯ PHÁP TRƯNG BÀY NỘI DUNG VƯƠNG GIẢ ===================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* KHUNG GIẤY CỔ PHONG TRƯNG BÀY MÔ TẢ TRUYỆN (SẮC SẢO MỎNG MANH) */}
          <div className="interactive-card bg-white/95 rounded-2xl border-[1px] border-[#ddd289] p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
            {/* Họa tiết góc mỏng sọc nhẹ nhàng tinh xảo */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-[1px] border-l-[1px] border-[#ddd289]" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-[1px] border-r-[1px] border-[#ddd289]" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-[1px] border-l-[1px] border-[#ddd289]" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-[1px] border-r-[1px] border-[#ddd289]" />

            {/* Thể loại của truyện dịu dàng */}
            <div className="flex flex-wrap gap-1.5 mb-5 relative z-10">
              {story.genres?.map?.((genre: string) => (
                <span 
                  key={genre} 
                  className="bg-[#eff6f0] text-[#132e1a] text-[10px] font-medium tracking-wide px-3 py-1 rounded border border-[#ddd289]/40"
                >
                  Dưới bóng bạch quả • {genre}
                </span>
              ))}
            </div>

            {/* TIÊU ĐỀ LÃNG MẠN */}
            <div className="border-b-[1px] border-dashed border-[#ddd289] pb-3 mb-5 relative z-10">
              <h3 className="font-semibold text-xs tracking-wider text-[#132e1a]/80 flex items-center gap-1.5 font-serif">
                <Star className="w-3.5 h-3.5 fill-[#f4d451] text-[#f4d451]" />
                Nhật ký nhành bạch quả soi mặt nước hồ
              </h3>
            </div>

            {/* MÔ TẢ NỘI DUNG TRUYỆN CHỮ NGHỆ THUẬT */}
            <div className="text-[#132e1a]/90 leading-relaxed space-y-4 text-justify text-sm font-medium pr-1 relative z-10">
              {story.description?.split('\n').map((para: string, idx: number) => (
                <p key={idx} className={para.trim() ? "indent-6 text-stone-700 font-serif text-[15px] leading-relaxed" : "hidden"}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* KHUNG GIẤY TỔNG HỢP: MỤC LỤC & ĐÀM ĐẠO KIỂU TRẠM THƯ */}
          <div className="interactive-card bg-white/95 rounded-2xl border-[1px] border-[#ddd289] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            
            {/* TABS MENU SANG TRỌNG MÀU SẮC SẢO MỎNG MANH */}
            <div className="flex border-b-[1px] border-[#ddd289]/60 mb-6 font-semibold text-xs tracking-wider font-serif">
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 py-3 text-center relative transition-all cursor-pointer rounded-t-lg ${
                  activeTab === 'chapters' ? "text-[#132e1a] bg-[#eff6f0]" : "text-stone-400 hover:text-[#132e1a]"
                }`}
              >
                📜 Cuộn thư bạch quả rủ ({chapters.length})
                {activeTab === 'chapters' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#f4d451] rounded-t-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 text-center relative transition-all cursor-pointer rounded-t-lg ${
                  activeTab === 'comments' ? "text-[#132e1a] bg-[#eff6f0]" : "text-stone-400 hover:text-[#132e1a]"
                }`}
              >
                💬 Tiếng lòng gửi sóng ({comments.length})
                {activeTab === 'comments' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#f4d451] rounded-t-full"></span>
                )}
              </button>
            </div>

            {/* NỘI DUNG TAB MỤC LỤC */}
            {activeTab === 'chapters' ? (
              <div className="flex flex-col gap-4">
                {/* Sắp xếp biên niên sử dịu dàng */}
                <div className="flex justify-between items-center bg-[#eff6f0] p-3 rounded-xl border-[1px] border-[#ddd289]/60">
                  <span className="text-xs font-medium text-[#132e1a] tracking-wide">
                    Dòng chảy con nước
                  </span>
                  <button
                    onClick={() => setChapterSortDesc(!chapterSortDesc)}
                    className="text-[10px] font-semibold tracking-wide px-3.5 py-1 bg-white hover:bg-[#cde8c6] text-[#132e1a] border-[1px] border-[#ddd289] rounded-lg transition-all cursor-pointer"
                  >
                    {chapterSortDesc ? 'Sóng trào sau cùng' : 'Sóng khởi ban sơ'}
                  </button>
                </div>

                {/* Danh sách chương truyện nhẹ nhàng sắc sảo */}
                {displayedChapters.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayedChapters.map((ch: any) => (
                      <div
                        key={ch.id}
                        onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${ch.order + 1}`)}
                        className="p-4 bg-white/80 hover:bg-[#eff6f0]/60 rounded-xl border-[1px] border-[#ddd289]/40 hover:border-[#ddd289] transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
                      >
                        <div className="min-w-0 z-10">
                          <p className="font-semibold text-sm text-[#132e1a] truncate font-serif">
                            {ch.title}
                          </p>
                          <p className="text-[9px] text-[#132e1a]/60 font-medium uppercase tracking-widest mt-1">
                            Lá bạch quả thứ {ch.order + 1}
                          </p>
                        </div>
                        {ch.isPasswordProtected ? (
                          <span className="text-[10px] bg-[#f4d451]/70 text-[#132e1a] px-2.5 py-0.5 rounded font-medium border border-[#ddd289]">
                            SÓNG KHÓA
                          </span>
                        ) : (
                          <span className="text-xs text-[#ddd289] font-medium group-hover:translate-x-1 transition-transform">
                            ➔
                          </span>
                        )}
                        {/* Họa tiết ẩn nhẹ nhàng */}
                        <div className="absolute -bottom-1 -right-1 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                          <Feather className="w-10 h-10 text-[#f4d451]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-stone-400 font-medium uppercase tracking-widest">
                    Mặt nước im lìm chờ đợi lá vàng rơi...
                  </div>
                )}

                {/* Phân trang */}
                {chapters.length > CHAPTERS_PER_PAGE && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setChapterPage(idx)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold border-[1px] transition-all cursor-pointer ${
                          chapterPage === idx
                            ? "bg-[#f4d451] text-[#132e1a] border-[#ddd289] shadow-sm"
                            : "bg-white text-[#132e1a]/60 border-[#ddd289]/40 hover:bg-[#eff6f0]"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* TAB ĐÀM ĐẠO KIỂU THƯ PHÁP NHẸ NHÀNG */
              <div className="flex flex-col gap-6">
                {isLoggedIn ? (
                  <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ném một viên sỏi xuống lòng hồ xanh mướt, viết vài dòng gửi lại cùng ngọn gió thu dịu dàng..."
                      className="w-full bg-[#eff6f0]/40 border-[1px] border-[#ddd289]/70 focus:border-[#ddd289] text-[#132e1a] text-sm rounded-xl p-4 focus:outline-none placeholder-stone-400/80 font-medium"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="bg-[#aeed9a] hover:bg-[#f4d451] disabled:bg-stone-200 disabled:text-stone-400 text-[#132e1a] font-semibold text-xs tracking-wider px-5 py-2 rounded-lg border-[1px] border-[#ddd289] transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Send className="w-3 h-3 text-[#132e1a]" />
                        Thả trôi tâm tình
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 bg-[#eff6f0]/40 border-[1px] border-dashed border-[#ddd289] rounded-xl text-center text-xs font-medium text-[#132e1a]/70 tracking-wide">
                    Soi gương mặt hồ để cùng các tri âm đàm đạo tiếng lòng dịu dàng...
                  </div>
                )}

                {/* Danh sách bình luận dịu dàng tao nhã */}
                <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-2">
                  {comments.length > 0 ? (
                    comments.map((comment: any) => {
                      const isGift = comment.type === 'choco_gift';
                      return (
                        <div 
                          key={comment.id}
                          className={`p-4 rounded-xl border-[1px] transition-all relative overflow-hidden ${
                            isGift
                              ? "bg-[#f4d451]/5 border-[#f4d451]/60"
                              : "bg-white border-[#ddd289]/30 hover:border-[#ddd289]"
                          }`}
                        >
                          <div className="flex gap-3 relative z-10">
                            <UserAvatar 
                              avatarUrl={comment.avatarUrl} 
                              equippedAccessory={comment.equippedAccessory}
                              accessoryPosition={comment.accessoryPosition}
                              className="w-9 h-9 shrink-0 border-[1px] border-[#ddd289]/40" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span 
                                  className="font-semibold text-xs truncate"
                                  style={{ color: getTitleColor?.(comment.activeTitle) || '#132e1a' }}
                                >
                                  {comment.displayName || 'Khách soi bóng nước'}
                                  {comment.activeTitle && (
                                    <span className="ml-2 px-2 py-0.5 bg-[#f4d451]/40 text-[#132e1a] text-[8px] font-medium rounded tracking-wide border border-[#ddd289]/30">
                                      {comment.activeTitle}
                                    </span>
                                  )}
                                </span>
                                <span className="text-[9px] text-stone-400 font-mono">
                                  {comment.createdAt?.toDate 
                                    ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                                    : 'Vừa xong'}
                                </span>
                              </div>
                              
                              {isGift && (
                                <div className="mb-2 inline-flex items-center gap-1.5 bg-[#aeed9a]/50 text-[#132e1a] text-[9px] font-semibold px-2.5 py-0.5 rounded-full border border-[#ddd289]/50">
                                  🍫 Thả vào lòng hồ {comment.giftAmount} kẹo ngọt Choco
                                </div>
                              )}

                              <p className="text-xs md:text-sm text-stone-800 leading-relaxed text-justify break-words font-medium font-serif">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                          {isGift && (
                            <div className="absolute top-1 right-2 opacity-5 pointer-events-none">
                              <Gift className="w-12 h-12 text-[#f4d451]" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-stone-400 font-medium tracking-wide">
                      Mặt hồ phẳng lặng chưa có gợn sóng tri âm.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* QUÀ TẶNG CHOCO NGỌT NGÀO NHẸ NHÀNG */}
          <div className="interactive-card bg-[#eff6f0]/90 text-[#132e1a] rounded-2xl border-[1px] border-[#ddd289] p-6 text-center shadow-sm relative overflow-hidden">
            <h4 className="font-semibold text-sm tracking-wider text-[#132e1a] mb-2 flex items-center justify-center gap-2 relative z-10 font-serif">
              <Gift className="w-4.5 h-4.5 animate-bounce text-[#f4d451]" />
              Thả kẹo Choco xuống hồ
            </h4>
            <p className="text-[11px] text-[#132e1a]/80 mb-4 max-w-md mx-auto relative z-10 leading-relaxed font-serif">
              Thả kẹo ngọt Choco dịu ngọt vào lòng hồ, nuôi dưỡng cánh chim hoàng yến nhỏ bé ca hát bên nhành bạch quả lãng mạn...
            </p>
            <button 
              onClick={() => setShowGiftModal(true)} 
              className="bg-[#f4d451] hover:bg-[#cde8c6] text-[#132e1a] px-6 py-2.5 text-xs rounded-xl font-semibold tracking-wide border-[1px] border-[#ddd289] hover:shadow transition-all cursor-pointer relative z-10"
            >
              🍫 Thả Choco nuôi hoàng yến
            </button>
          </div>

        </div>

      </div>

      {/* 4. MODAL TẶNG QUÀ CHOCO QUÝ TỘC - THIẾT KẾ RẤT DỊU DÀNG VÀ SẮC SẢO */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border-[1px] border-[#ddd289] max-w-sm w-full p-6 relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-3 left-3 w-4 h-4 border-t-[1px] border-l-[1px] border-[#ddd289]" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-[1px] border-r-[1px] border-[#ddd289]" />

            <h3 className="font-semibold text-base text-[#132e1a] text-center tracking-wider mb-1 flex items-center justify-center gap-1.5 font-serif">
              <span>⚜️ Thả Choco ngọt lịm vào lòng hồ</span>
            </h3>
            <p className="text-[10px] text-stone-400 text-center mb-5 font-medium tracking-wide italic">
              (Kẹo ngọt dịu dàng vỗ về cánh hoàng yến đậu nhành bạch quả)
            </p>

            <div className="flex flex-col gap-4">
              {/* Chọn mức quà */}
              <div>
                <label className="text-[10px] text-[#132e1a]/70 font-semibold tracking-wide mb-2 block">
                  Mức kẹo thả xuống:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 200, 1000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setGiftAmount(amount)}
                      className={`py-2 rounded-lg text-xs font-semibold border-[1px] transition-all cursor-pointer ${
                        giftAmount === amount
                          ? "bg-[#f4d451] text-[#132e1a] border-[#ddd289] shadow-sm"
                          : "bg-[#eff6f0] border-stone-200 text-[#132e1a] hover:bg-[#cde8c6]"
                      }`}
                    >
                      {amount} 🍫
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhập thủ công */}
              <div>
                <label className="text-[10px] text-[#132e1a]/70 font-semibold tracking-wide mb-1.5 block">
                  Đo lượng kẹo muốn thả:
                </label>
                <input
                  type="number"
                  min={1}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Number(e.target.value))}
                  className="w-full bg-[#eff6f0] border-[1px] border-[#ddd289] rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none text-[#132e1a]"
                />
              </div>

              {/* Lời nhắn gửi */}
              <div>
                <label className="text-[10px] text-[#132e1a]/70 font-semibold tracking-wide mb-1.5 block">
                  Lời nhắn thả trôi theo dòng nước:
                </label>
                <textarea
                  rows={2}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi tặng Choco ngọt ngào ủng hộ tác phẩm!"
                  className="w-full bg-[#eff6f0] border-[1px] border-[#ddd289] rounded-lg px-3 py-2 text-xs font-medium focus:outline-none text-[#132e1a]"
                />
              </div>

              {/* Nút hành động dịu dàng */}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 py-2.5 border-[1px] border-[#ddd289] rounded-lg text-xs font-semibold hover:bg-stone-50 cursor-pointer transition-all"
                >
                  Giữ lòng hồ yên ả
                </button>
                <button
                  onClick={handleGiftSubmit}
                  className="flex-1 py-2.5 bg-[#f4d451] hover:bg-[#ddd289] text-[#132e1a] border-[1px] border-[#ddd289] shadow-sm rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Thả xuống lòng hồ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

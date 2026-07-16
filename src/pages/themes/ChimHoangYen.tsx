import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, ArrowLeft, Sparkles, Feather, Star, Compass, Lock, Unlock, Zap } from 'lucide-react';
import { UserAvatar } from '../../components/UserAvatar';
import { motion } from 'motion/react';

export function ChimHoangYenTheme(props: ThemeProps) {
  const {
    story, chapters, comments, activeTab, setActiveTab,
    chapterPage, setChapterPage, chapterSortDesc, setChapterSortDesc, CHAPTERS_PER_PAGE,
    showGiftModal, setShowGiftModal, giftAmount, setGiftAmount, giftMessage, setGiftMessage, handleGiftSubmit,
    commentText, setCommentText, submittingComment, handleSendComment,
    isLoggedIn, savedStories, handleSaveToggle, choco, navigate,
    getTitleColor, unlockedPassChapters, unlockedEarlyAccessChapters
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

  // Web Audio Water Ripple Synthesizer (Tiếng giọt nước rơi nhẹ nhàng, tí tách)
  const playWaterRippleSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      // Tần số từ trầm lên bổng cực nhanh mô phỏng tiếng bong bóng nước vỡ nhẹ
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.1);

      // Âm lượng siêu bé và tắt dần nhanh chóng để tạo cảm giác tĩnh mịch, dịu mát
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('Web Audio is not supported yet', e);
    }
  };

  // Kích hoạt sóng nước lăn tăn trên toàn bộ mặt hồ giao diện khi chạm
  const handleTouchWater = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    playWaterRippleSound();

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1200);
  };

  // Cả lá bạch quả vàng úa và lông vũ hoàng yến mềm mại rơi lãng đãng trong gió nhẹ bên mặt hồ
  const fallingElements = Array.from({ length: 18 }).map((_, i) => ({
    id: i,
    delay: i * 1.2,
    duration: 12 + i * 2.0,
    left: `${3 + i * 5.3}%`,
    scale: 0.42 + (i % 4) * 0.12,
    elementType: i % 3 // 0: Lông vũ lượn sóng, 1: Lông vũ mảnh dẻ, 2: Lá bạch quả
  }));

  return (
    <div 
      onClick={handleTouchWater}
      className="bg-gradient-to-b from-[#eff6f0] via-[#cde8c6] to-[#eff6f0] min-h-screen text-[#132e1a] font-sans pb-24 relative overflow-x-hidden selection:bg-[#f4d451] selection:text-[#132e1a] transition-all duration-1000"
    >
      
      {/* HIỆU ỨNG GỢN SÓNG NƯỚC TOÀN BỘ GIAO DIỆN (MẶT HỒ XANH MƯỚT) */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {ripples.map(ripple => (
          <React.Fragment key={ripple.id}>
            {/* Vòng ngoài lan rộng */}
            <motion.div
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{ width: 240, height: 240, opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute border-2 border-[#f4d451] bg-[#f4d451]/10 rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                transform: 'translate(-50%, -50%)',
              }}
            />
            {/* Vòng trong tinh tế */}
            <motion.div
              initial={{ width: 0, height: 0, opacity: 0.9 }}
              animate={{ width: 120, height: 120, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
              className="absolute border border-[#f4d451]/80 rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                transform: 'translate(-50%, -50%)',
              }}
            />
            {/* Tâm chấn lung linh */}
            <motion.div
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 30, height: 30, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute bg-white/65 rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </React.Fragment>
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

      {/* 1. HIỆU ỨNG Lá BẠCH QUẢ VÀ LÔNG VŨ HOÀNG YẾN RƠI MÀU SẮC SẢO MỀM MẠI */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {fallingElements.map(el => (
          <motion.div
            key={el.id}
            initial={{ y: -60, opacity: 0, rotate: 0 }}
            animate={{
              y: '105vh',
              opacity: [0, 0.9, 0.9, 0],
              x: [0, 35, -25, 15],
              rotate: [0, 120, 240, 360]
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: 'linear'
            }}
            style={{
              position: 'absolute',
              left: el.left,
              transform: `scale(${el.scale})`
            }}
          >
            {el.elementType === 0 ? (
              /* Mẫu lông vũ hoàng yến lãng mạn lượn sóng */
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20,80 Q45,55 52,30 Q54,15 44,6 Q56,12 62,24 Q70,50 82,60 Q66,66 48,70 Z"
                  fill="#f4d451"
                  stroke="#ddd289"
                  strokeWidth="0.8"
                />
                <path d="M44,6 Q48,42 20,80" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="1,1" />
              </svg>
            ) : el.elementType === 1 ? (
              /* Mẫu lông vũ hoàng yến mảnh dẻ bay bổng */
              <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10,90 C35,68 45,45 42,20 C40,5 52,10 58,25 C65,48 55,75 10,90 Z"
                  fill="#ddd289"
                  stroke="#f4d451"
                  strokeWidth="0.8"
                />
                <path d="M50,15 C45,48 10,90 10,90" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="1,1" />
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
            二爷家的麻雀成精了
          </h2>
        </div>

        {/* Tác giả */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/50 border-[1px] border-[#ddd289] text-xs font-medium text-[#132e1a] font-serif">
          <span>作者：听原</span>
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

            {/* Thể loại của truyện chuyển xuống chân bìa */}
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center z-10 w-full">
              {story.genres?.map?.((genre: string) => (
                <span 
                  key={genre} 
                  className="bg-[#eff6f0] text-[#132e1a] text-[10px] font-medium tracking-wide px-3 py-1 rounded border border-[#ddd289]/40 flex items-center gap-1 hover:bg-[#cde8c6] transition-all cursor-pointer"
                >
                  🍃 {genre}
                </span>
              ))}
            </div>
          </div>

          {/* CÁC NÚT ĐIỀU HƯỚNG NHANH - THIẾT KẾ MỎNG NHẸ, DỊU DÀNG */}
          <div className="flex flex-col gap-3 w-full">
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

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowGiftModal(true)} 
                className="flex-1 bg-[#f4d451] hover:bg-[#cde8c6] text-[#132e1a] py-3 text-xs rounded-xl font-semibold tracking-wider flex items-center justify-center gap-2 border-[1px] border-[#ddd289] transition-all duration-300 hover:shadow-md cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5 text-[#132e1a]" />
                Thả Choco nuôi hoàng yến
              </button>

              <a 
                href={story.externalUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white hover:bg-[#eff6f0] text-[#132e1a] py-3 text-xs rounded-xl font-semibold tracking-wider flex items-center justify-center gap-2 border-[1px] border-[#ddd289] transition-all duration-300 hover:shadow-md cursor-pointer text-center"
              >
                <Compass className="w-3.5 h-3.5 text-[#f4d451]" />
                Tìm về nguồn cội
              </a>
            </div>
          </div>

          {/* TIẾNG LÒNG GỬI SÓNG - BÌNH LUẬN KIỂU THƯ PHÁP NHẸ NHÀNG */}
          <div className="interactive-card bg-white/95 rounded-2xl border-[1px] border-[#ddd289] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col gap-4 relative overflow-hidden mt-1">
            <div className="border-b-[1px] border-dashed border-[#ddd289] pb-2">
              <h3 className="font-semibold text-xs tracking-wider text-[#132e1a]/80 flex items-center gap-1.5 font-serif">
                💬 Tiếng lòng gửi sóng ({comments.length})
              </h3>
            </div>
            {isLoggedIn ? (
              <form onSubmit={handleSendComment} className="flex flex-col gap-2 relative z-10">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ném một viên sỏi xuống lòng hồ xanh mướt, viết vài dòng gửi lại cùng ngọn gió thu dịu dàng..."
                  className="w-full bg-[#eff6f0]/40 border-[1px] border-[#ddd289]/70 focus:border-[#ddd289] text-[#132e1a] text-xs rounded-xl p-3 focus:outline-none placeholder-stone-400/80 font-medium leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="bg-[#aeed9a] hover:bg-[#f4d451] disabled:bg-stone-200 disabled:text-stone-400 text-[#132e1a] font-semibold text-[11px] tracking-wider px-4 py-1.5 rounded-lg border-[1px] border-[#ddd289] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-2.5 h-2.5 text-[#132e1a]" />
                    Thả trôi tâm tình
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-[#eff6f0]/40 border-[1px] border-dashed border-[#ddd289] rounded-xl text-center text-[10px] font-medium text-[#132e1a]/70 tracking-wide">
                Soi gương mặt hồ để cùng các tri âm đàm đạo tiếng lòng dịu dàng...
              </div>
            )}

            {/* Danh sách bình luận dịu dàng tao nhã */}
            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
              {comments.length > 0 ? (
                comments.map((comment: any) => {
                  const isGift = comment.type === 'choco_gift';
                  return (
                    <div 
                      key={comment.id}
                      className={`p-3 rounded-xl border-[1px] transition-all relative overflow-hidden ${
                        isGift
                          ? "bg-[#f4d451]/5 border-[#f4d451]/60"
                          : "bg-white border-[#ddd289]/30 hover:border-[#ddd289]"
                      }`}
                    >
                      <div className="flex gap-2 relative z-10">
                        <UserAvatar 
                          avatarUrl={comment.avatarUrl} 
                          equippedAccessory={comment.equippedAccessory}
                          accessoryPosition={comment.accessoryPosition}
                          className="w-8 h-8 shrink-0 border-[1px] border-[#ddd289]/40" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span 
                              className="font-semibold text-[11px] truncate"
                              style={{ color: getTitleColor?.(comment.activeTitle) || '#132e1a' }}
                            >
                              {comment.displayName || 'Khách soi bóng nước'}
                              {comment.activeTitle && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-[#f4d451]/40 text-[#132e1a] text-[7px] font-medium rounded tracking-wide border border-[#ddd289]/30">
                                  {comment.activeTitle}
                                </span>
                              )}
                            </span>
                            <span className="text-[8px] text-stone-400 font-mono">
                              {comment.createdAt?.toDate 
                                ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                                : 'Vừa xong'}
                            </span>
                          </div>
                          
                          {isGift && (
                            <div className="mb-1 inline-flex items-center gap-1 bg-[#aeed9a]/50 text-[#132e1a] text-[8px] font-semibold px-2 py-0.5 rounded-full border border-[#ddd289]/50">
                              🍫 Thả {comment.giftAmount} kẹo Choco
                            </div>
                          )}

                          <p className="text-[11px] text-stone-700 leading-relaxed text-justify break-words font-medium font-serif">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                      {isGift && (
                        <div className="absolute top-1 right-2 opacity-5 pointer-events-none">
                          <Gift className="w-10 h-10 text-[#f4d451]" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-[10px] text-stone-400 font-medium tracking-wide">
                  Mặt hồ phẳng lặng chưa có gợn sóng tri âm.
                </div>
              )}
            </div>
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

          {/* KHUNG GIẤY TỔNG HỢP: MỤC LỤC */}
          <div className="interactive-card bg-white/95 rounded-2xl border-[1px] border-[#ddd289] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            
            <div className="border-b-[1px] border-[#ddd289]/60 pb-3 mb-6 flex justify-between items-center">
              <h3 className="font-semibold text-xs tracking-wider font-serif text-[#132e1a] flex items-center gap-2">
                📜 Cuộn thư bạch quả rủ ({chapters.length})
              </h3>
            </div>

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
                  {displayedChapters.map((ch: any) => {
                    const isPassRequired = ch.requiresPass;
                    const hasPassUnlocked = isPassRequired && (unlockedPassChapters || []).includes(ch.id);
                    const isEarlyAccess = ch.requiresEarlyAccess;
                    const chapTime = ch.createdAt?.toMillis ? ch.createdAt.toMillis() : (typeof ch.createdAt === 'number' ? ch.createdAt : 0);
                    const isStillEarlyAccess = isEarlyAccess && (Date.now() - chapTime < 24 * 60 * 60 * 1000);
                    const hasEarlyAccessUnlocked = isEarlyAccess && (unlockedEarlyAccessChapters || []).includes(ch.id);
                    const isLockedRead = ch.isLockedRead || ch.isPasswordProtected;

                    return (
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
                        <div className="flex items-center gap-2 z-10">
                          {isPassRequired && (
                            hasPassUnlocked ? (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-bold">
                                <Unlock className="w-3 h-3" /> PASS OK
                              </span>
                            ) : (
                              <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-bold">
                                <Lock className="w-3 h-3" /> VÉ PASS
                              </span>
                            )
                          )}
                          {isEarlyAccess && isStillEarlyAccess && (
                            hasEarlyAccessUnlocked ? (
                              <span className="text-[9px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1 font-bold">
                                <Zap className="w-3 h-3 text-teal-600 fill-teal-100" /> ĐỌC SỚM
                              </span>
                            ) : (
                              <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-[#ddd289] flex items-center gap-1 font-bold">
                                <Zap className="w-3 h-3 text-amber-600 fill-amber-100 animate-pulse" /> ĐỌC SỚM
                              </span>
                            )
                          )}
                          {isEarlyAccess && !isStillEarlyAccess && (
                            <span className="text-[9px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-200 font-bold">
                              MIỄN PHÍ
                            </span>
                          )}
                          {isLockedRead && (
                            <span className="text-[10px] bg-[#f4d451]/70 text-[#132e1a] px-2.5 py-0.5 rounded font-medium border border-[#ddd289]">
                              SÓNG KHÓA
                            </span>
                          )}
                          {!isPassRequired && !(isEarlyAccess && isStillEarlyAccess) && !isLockedRead && (
                            <span className="text-xs text-[#ddd289] font-medium group-hover:translate-x-1 transition-transform">
                              ➔
                            </span>
                          )}
                        </div>
                        {/* Họa tiết ẩn nhẹ nhàng */}
                        <div className="absolute -bottom-1 -right-1 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                          <Feather className="w-10 h-10 text-[#f4d451]" />
                        </div>
                      </div>
                    );
                  })}
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

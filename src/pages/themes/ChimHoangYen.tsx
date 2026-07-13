import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, ArrowLeft, Sparkles, Feather, Star } from 'lucide-react';
import { useStore } from '../../store';
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

  // Web Audio Bird Chirp Synthesizer (Lớp âm thanh chim hót bằng code thuần đỉnh cao)
  const playBirdChirp = () => {
    try {
      setChirping(true);
      setTimeout(() => setChirping(false), 600);

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
        osc.frequency.exponentialRampToValueAtTime(targetFreq, startTime + duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, startTime + duration);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + duration * 0.2);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      chirp(now, 2900, 4400, 0.08);
      chirp(now + 0.1, 3100, 4600, 0.09);
      chirp(now + 0.22, 3000, 4350, 0.08);
      
      if (Math.random() > 0.5) {
        chirp(now + 0.35, 3300, 4900, 0.11);
        chirp(now + 0.48, 3500, 5200, 0.14);
      }
    } catch (e) {
      console.warn('Web Audio is not supported yet', e);
    }
  };

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
    playBirdChirp();

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1200);
  };

  // Giả lập lá bạch quả rơi tự do dập dềnh trên màn hình (được tạo hoàn toàn từ 5 mã màu)
  const fallingLeaves = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    delay: i * 1.8,
    duration: 10 + i * 3,
    left: `${8 + i * 10}%`,
    scale: 0.5 + (i % 3) * 0.2,
    isFeather: i % 2 === 0
  }));

  return (
    <div className="bg-[#eff6f0] min-h-screen text-[#132e1a] font-sans pb-24 relative overflow-x-hidden selection:bg-[#f4d451] selection:text-[#132e1a]">
      
      {/* 1. HIỆU ỨNG LÁ VÀ LÔNG VŨ RƠI MÀU VÀNG-XANH (TỪ 5 MÀU CHO SẴN) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {fallingLeaves.map(leaf => (
          <motion.div
            key={leaf.id}
            initial={{ y: -50, opacity: 0, rotate: 0 }}
            animate={{
              y: '105vh',
              opacity: [0, 0.85, 0.85, 0],
              x: [0, 35, -25, 15],
              rotate: [0, 180, 270, 360]
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
              /* Lông vũ hoàng yến vàng óng (#f4d451) */
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10,90 Q40,60 50,30 Q52,15 45,5 Q55,12 60,25 Q70,55 90,65 Q70,70 50,75 Z"
                  fill="#f4d451"
                  stroke="#ddd289"
                  strokeWidth="1.5"
                />
                <path d="M45,5 Q48,45 10,90" stroke="#eff6f0" strokeWidth="2" />
              </svg>
            ) : (
              /* Lá bạch quả vàng rực rỡ (#ddd289 và #f4d451) */
              <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M50,90 C45,65 25,60 5,45 C15,25 35,20 50,35 C65,20 85,25 95,45 C75,60 55,65 50,90 Z"
                  fill="#ddd289"
                  stroke="#f4d451"
                  strokeWidth="1"
                />
                <path d="M50,90 C50,65 50,35 50,35" stroke="#eff6f0" strokeWidth="1.5" strokeDasharray="3,3" />
              </svg>
            )}
          </motion.div>
        ))}
      </div>

      {/* CÂY BẠCH QUẢ CỔ THỤ PHỦ LÁ VÀNG TRÊN GÓC MÀN HÌNH (#ddd289 & #f4d451) */}
      <div className="absolute top-0 left-0 w-72 h-80 pointer-events-none z-10 overflow-hidden opacity-90 hidden lg:block">
        <svg className="w-full h-full" viewBox="0 0 300 350" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 Q100,30 160,100 T210,240" stroke="#ddd289" strokeWidth="6" strokeLinecap="round" />
          <path d="M70,25 Q140,70 120,140" stroke="#ddd289" strokeWidth="3" />
          {/* Chùm lá bạch quả bằng mảng màu #f4d451 và #aeed9a */}
          <circle cx="90" cy="45" r="18" fill="#f4d451" className="opacity-80" />
          <circle cx="140" cy="90" r="24" fill="#ddd289" className="opacity-95" />
          <circle cx="170" cy="130" r="20" fill="#f4d451" className="opacity-80" />
          <circle cx="190" cy="180" r="16" fill="#aeed9a" className="opacity-85" />
        </svg>
      </div>

      <div className="absolute top-0 right-0 w-72 h-80 pointer-events-none z-10 overflow-hidden opacity-90 hidden lg:block">
        <svg className="w-full h-full transform scale-x-[-1]" viewBox="0 0 300 350" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 Q100,30 160,100 T210,240" stroke="#ddd289" strokeWidth="6" strokeLinecap="round" />
          <path d="M70,25 Q140,70 120,140" stroke="#ddd289" strokeWidth="3" />
          <circle cx="90" cy="45" r="18" fill="#f4d451" className="opacity-80" />
          <circle cx="140" cy="90" r="24" fill="#ddd289" className="opacity-95" />
          <circle cx="170" cy="130" r="20" fill="#f4d451" className="opacity-80" />
          <circle cx="190" cy="180" r="16" fill="#aeed9a" className="opacity-85" />
        </svg>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG ĐỒNG BỘ CẢNH SẮC */}
      <div className="border-b-[4px] border-[#ddd289] bg-[#cde8c6] px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        {/* Nút quay lại */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#eff6f0] hover:bg-[#f4d451] text-[#132e1a] text-xs font-black tracking-wider border-2 border-[#ddd289] shadow-[2px_2px_0_0_#ddd289] transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>LUI VỀ</span>
        </button>

        {/* Tiêu đề thanh treo */}
        <div className="flex items-center gap-2 bg-[#eff6f0] text-[#132e1a] px-5 py-2 rounded-xl border-2 border-[#ddd289] shadow-inner">
          <Feather className="w-4 h-4 text-[#f4d451] animate-bounce" />
          <h2 className="font-black text-xs md:text-sm tracking-wider uppercase font-serif">
            HỒ BẠCH QUẢ // CHIM HOÀNG YẾN
          </h2>
        </div>

        {/* Choco Coin */}
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#aeed9a]/30 border-2 border-[#ddd289] text-xs font-black text-[#132e1a]">
          <span>🍫</span>
          <span>{choco} Choco</span>
        </div>
      </div>

      {/* 3. BỐ CỤC CHÍNH ĐỒNG BỘ MÀU SẮC ĐẸP ĐẼ */}
      <div className="max-w-[1240px] mx-auto p-4 md:p-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ===================== CỘT TRÁI (COL-SPAN 5): BỨC TRANH MẶT HỒ XANH MƯỚT VÀ THÔNG TIN BÌA TRUYỆN ===================== */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          
          {/* KHUNG BÌA VÀ THỦY CẢNH BẠCH QUẢ */}
          <div className="w-full rounded-[2rem] border-[4px] border-[#cde8c6] bg-white p-6 md:p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Nhãn Triều Đình */}
            <div className="absolute top-4 right-4 bg-[#aeed9a] text-[#132e1a] text-[8px] font-black tracking-widest px-2.5 py-1 rounded border border-[#ddd289] uppercase">
              Chính bản
            </div>

            {/* Khung bìa Tròn Vườn Thượng Uyển */}
            <div className="w-44 h-44 md:w-50 md:h-50 rounded-full relative overflow-hidden border-[6px] border-[#cde8c6] shadow-md group shrink-0 mt-2">
              <div className="absolute inset-0 bg-[#aeed9a] opacity-0 group-hover:opacity-20 transition-opacity z-10" />
              <img 
                src={story.coverUrl} 
                alt={story.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 border-[6px] border-white/30 rounded-full" />
              {story.completed && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#f4d451] text-[#132e1a] text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-[#ddd289] shadow z-20">
                  HOÀN THÀNH
                </span>
              )}
            </div>

            {/* Tiêu đề tác phẩm */}
            <div className="mt-6 z-10">
              <span className="text-[9px] bg-[#cde8c6] text-[#132e1a] font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-[#ddd289] inline-block mb-3 shadow-sm">
                CHUYỆN NHÀ HOẮC GIA
              </span>
              <h1 className="text-xl md:text-2xl font-black text-[#132e1a] tracking-tight leading-tight uppercase font-serif px-2">
                {story.title}
              </h1>
              <p className="text-[#132e1a]/70 font-black text-xs mt-1.5 uppercase tracking-wider">
                Chấp bút: {story.author}
              </p>
            </div>

            {/* BẢNG THỐNG KÊ LỊCH SỬ TRÊN NỀN VẢI MỊN */}
            <div className="grid grid-cols-3 gap-1 w-full py-4 border-y-2 border-dashed border-[#cde8c6] mt-6 text-center z-10">
              <div>
                <p className="text-[9px] text-[#132e1a]/60 font-black uppercase tracking-wider">Mục lục</p>
                <p className="text-base font-black text-[#132e1a]">{Math.max(story.chapterCount || 0, chapters.length)} chương</p>
              </div>
              <div className="border-x border-[#cde8c6]">
                <p className="text-[9px] text-[#132e1a]/60 font-black uppercase tracking-wider">Hỏa lực 🔥</p>
                <p className="text-base font-black text-[#132e1a]">
                  {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#132e1a]/60 font-black uppercase tracking-wider">Sủng ái 🍫</p>
                <p className="text-base font-black text-[#132e1a]">{totalGiftedChoco}</p>
              </div>
            </div>

            {/* MẶT HỒ XANH MƯỚT TƯƠNG TÁC (#aeed9a) VỚI CÀNH BẠCH QUẢ RỦ (#ddd289) VÀ HOÀNG YẾN (#f4d451) */}
            <div className="w-full mt-6 text-left">
              <div className="flex items-center gap-1 mb-2">
                <Sparkles className="w-4 h-4 text-[#f4d451] animate-pulse" />
                <span className="text-[10px] font-black uppercase text-[#132e1a] tracking-wider">
                  Mặt Hồ Xanh Mướt Tương Tác
                </span>
              </div>
              
              {/* Mặt hồ xanh mướt lung linh được vẽ hoàn toàn từ 5 mã màu của bạn */}
              <div 
                onClick={handleTouchLake}
                className="w-full h-44 bg-gradient-to-br from-[#aeed9a] via-[#cde8c6] to-[#eff6f0] rounded-2xl border-2 border-[#ddd289] relative cursor-pointer overflow-hidden p-4 transition-all hover:border-[#f4d451] shadow-inner"
              >
                {/* Ánh sáng lung linh hắt nhẹ từ mặt hồ */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,212,81,0.2)_0%,transparent_60%)] pointer-events-none" />

                {/* Sóng gợn lan tỏa khi chạm tay (màu vàng kim #f4d451 rạng ngời) */}
                {ripples.map(ripple => (
                  <motion.div
                    key={ripple.id}
                    initial={{ width: 0, height: 0, opacity: 0.95 }}
                    animate={{ width: 260, height: 260, opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="absolute border-[2.5px] border-[#f4d451] rounded-full pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}

                {/* SVG Vẽ Nhánh cây bạch quả rủ mềm mại (#ddd289) và hoàng yến nhỏ bé vàng tươi (#f4d451) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 180" preserveAspectRatio="none">
                  {/* Cành bạch quả rủ mềm mại từ trên xuống dưới hồ nước (#ddd289) */}
                  <path d="M400,0 Q310,35 220,65 T80,105" fill="none" stroke="#ddd289" strokeWidth="3.5" />
                  <path d="M290,20 Q210,60 140,85" fill="none" stroke="#ddd289" strokeWidth="2" />
                  <path d="M190,45 Q130,75 70,90" fill="none" stroke="#ddd289" strokeWidth="1.2" />

                  {/* Các nhóm lá bạch quả vàng đung đưa khẽ khàng (#f4d451 & #ddd289) */}
                  <motion.g animate={{ rotate: [-3, 4, -3] }} transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }} transform="translate(160, 75)">
                    <path d="M0,0 Q-15,-20 -25,-12 Q-28,5 -12,12 Q-5,8 0,0" fill="#f4d451" stroke="#ddd289" strokeWidth="0.8" />
                  </motion.g>
                  <motion.g animate={{ rotate: [4, -4, 4] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }} transform="translate(230, 45)">
                    <path d="M0,0 Q-12,-18 -22,-10 Q-25,5 -10,10 Q-4,6 0,0" fill="#f4d451" stroke="#ddd289" strokeWidth="0.8" />
                  </motion.g>
                  <motion.g animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }} transform="translate(110, 95)">
                    <path d="M0,0 Q-10,-15 -20,-8 Q-22,4 -8,8 Q-3,5 0,0" fill="#f4d451" stroke="#ddd289" strokeWidth="0.8" />
                  </motion.g>

                  {/* Chú chim hoàng yến nhỏ màu vàng tươi rạng rỡ đậu tự do trên cành cây bạch quả (#f4d451) */}
                  <motion.g
                    whileHover={{ scale: 1.18 }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                    onClick={(e: any) => {
                      e.stopPropagation();
                      playBirdChirp();
                    }}
                    className="cursor-pointer pointer-events-auto"
                    transform="translate(130, 70)"
                  >
                    {/* Thân chim hoàng yến */}
                    <ellipse cx="12" cy="0" rx="14" ry="9" fill="#f4d451" stroke="#ddd289" strokeWidth="1.2" />
                    {/* Đầu chim */}
                    <circle cx="22" cy="-6" r="7" fill="#f4d451" stroke="#ddd289" strokeWidth="1.2" />
                    {/* Mỏ chim nhỏ bé */}
                    <polygon points="28,-8 34,-6 28,-4" fill="#ddd289" />
                    {/* Mắt chim lém lỉnh */}
                    <circle cx="24" cy="-7" r="1.2" fill="#132e1a" />
                    {/* Cánh chim hoàng yến */}
                    <path d="M5,-2 Q-1,-6 -6,-1 Q-2,6 5,0" fill="#ddd289" />
                    {/* Đuôi chim */}
                    <path d="M-2,2 L-14,9 L-9,3 Z" fill="#ddd289" />
                    {/* Chân chim đậu trên cành */}
                    <line x1="8" y1="8" x2="6" y2="13" stroke="#ddd289" strokeWidth="1.2" />
                    <line x1="12" y1="8" x2="12" y2="13" stroke="#ddd289" strokeWidth="1.2" />
                  </motion.g>
                </svg>

                {/* Câu cảm thán bay nhè nhẹ ở chân mây mặt hồ */}
                <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                  <span className="text-[10px] text-[#132e1a]/80 font-serif italic">
                    “ Gió lay bạch quả lá vàng rơi, nước biếc trong veo tăm cá sủi... ”
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CÁC NÚT ĐIỀU HƯỚNG NHANH */}
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => chapters.length > 0 && navigate(`/doc/${story.slug || story.id}/chuong-${chapters[0].order + 1}`)} 
              className="flex-1 bg-[#aeed9a] hover:bg-[#f4d451] text-[#132e1a] py-3.5 text-xs rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-[#ddd289] shadow-[3px_3px_0_0_#ddd289] transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#132e1a]" />
              ĐỌC NGAY
            </button>

            <button 
              onClick={handleSaveToggle} 
              className={`flex-1 py-3.5 text-xs rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-[#ddd289] shadow-[3px_3px_0_0_#ddd289] transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer ${
                savedStories?.includes(story.id)
                  ? "bg-[#f4d451] text-[#132e1a]" 
                  : "bg-[#eff6f0] text-[#132e1a]"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${savedStories?.includes(story.id) ? "fill-[#132e1a]" : ""}`} />
              {savedStories?.includes(story.id) ? 'ĐÃ LƯU' : 'LƯU LẠI'}
            </button>
          </div>

        </div>

        {/* ===================== CỘT PHẢI (COL-SPAN 7): KHUNG SÁCH THƯ PHÁP TRƯNG BÀY NỘI DUNG VƯƠNG GIẢ ===================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* KHUNG GIẤY CỔ PHONG TRƯNG BÀY MÔ TẢ TRUYỆN */}
          <div className="bg-white rounded-[2rem] border-[4px] border-[#cde8c6] p-6 md:p-10 shadow-sm relative overflow-hidden">
            {/* Họa tiết góc mạ vàng bốn phía sang quý */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] border-[#ddd289]" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-[3px] border-r-[3px] border-[#ddd289]" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-[3px] border-l-[3px] border-[#ddd289]" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] border-[#ddd289]" />

            {/* Thể loại của truyện rực rỡ */}
            <div className="flex flex-wrap gap-2 mb-6 relative z-10">
              {story.genres?.map?.((genre: string) => (
                <span 
                  key={genre} 
                  className="bg-[#aeed9a]/30 text-[#132e1a] text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-md border border-[#ddd289]/60"
                >
                  🍃 {genre}
                </span>
              ))}
            </div>

            {/* TIÊU ĐỀ BẢN KÝ SỰ */}
            <div className="border-b-2 border-dashed border-[#ddd289] pb-3 mb-6 relative z-10">
              <h3 className="font-extrabold text-sm uppercase tracking-[0.2em] text-[#132e1a] flex items-center gap-2 font-serif">
                <Star className="w-4 h-4 fill-[#f4d451] text-[#f4d451]" />
                BẢN CHÉP TAY CỔ THƯ VỀ CHIM HOÀNG YẾN
              </h3>
            </div>

            {/* MÔ TẢ NỘI DUNG TRUYỆN CHỮ NGHỆ THUẬT */}
            <div className="text-[#132e1a] leading-relaxed space-y-4 text-justify text-sm font-medium pr-1 relative z-10">
              {story.description?.split('\n').map((para: string, idx: number) => (
                <p key={idx} className={para.trim() ? "indent-6 text-stone-800 font-serif text-[15px] leading-relaxed" : "hidden"}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* KHUNG GIẤY TỔNG HỢP: MỤC LỤC & ĐÀM ĐẠO KIỂU TRẠM THƯ */}
          <div className="bg-white rounded-[2rem] border-[4px] border-[#cde8c6] p-6 shadow-sm">
            
            {/* TABS MENU SANG TRỌNG CỔ KÍNH */}
            <div className="flex border-b-4 border-[#cde8c6] mb-6 font-black text-xs uppercase tracking-widest font-serif">
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 py-4 text-center relative transition-all cursor-pointer ${
                  activeTab === 'chapters' ? "text-[#132e1a] bg-[#aeed9a]/20" : "text-stone-400 hover:text-[#132e1a]"
                }`}
              >
                📜 Cuộn thư mục lục ({chapters.length})
                {activeTab === 'chapters' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#f4d451] rounded-t-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-4 text-center relative transition-all cursor-pointer ${
                  activeTab === 'comments' ? "text-[#132e1a] bg-[#aeed9a]/20" : "text-stone-400 hover:text-[#132e1a]"
                }`}
              >
                💬 Quý tộc đàm đạo ({comments.length})
                {activeTab === 'comments' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#f4d451] rounded-t-full"></span>
                )}
              </button>
            </div>

            {/* NỘI DUNG TAB MỤC LỤC */}
            {activeTab === 'chapters' ? (
              <div className="flex flex-col gap-4">
                {/* Sắp xếp biên niên sử */}
                <div className="flex justify-between items-center bg-[#aeed9a]/20 p-3 rounded-xl border-2 border-[#ddd289]">
                  <span className="text-xs font-black text-[#132e1a] uppercase tracking-wide">
                    Thứ tự biên niên sử chương truyện
                  </span>
                  <button
                    onClick={() => setChapterSortDesc(!chapterSortDesc)}
                    className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 bg-white hover:bg-[#f4d451] text-[#132e1a] border-2 border-[#ddd289] rounded-lg transition-all cursor-pointer shadow-[2px_2px_0_0_#ddd289] active:translate-y-px active:shadow-none"
                  >
                    {chapterSortDesc ? 'Chương mới nhất trước' : 'Chương cũ nhất trước'}
                  </button>
                </div>

                {/* Danh sách chương truyện đẹp đẽ */}
                {displayedChapters.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayedChapters.map((ch: any) => (
                      <div
                        key={ch.id}
                        onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${ch.order + 1}`)}
                        className="p-4 bg-white hover:bg-[#eff6f0] rounded-xl border-2 border-[#cde8c6] hover:border-[#f4d451] transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
                      >
                        <div className="min-w-0 z-10">
                          <p className="font-black text-sm text-[#132e1a] truncate font-serif">
                            {ch.title}
                          </p>
                          <p className="text-[9px] text-[#132e1a]/60 font-black uppercase tracking-widest mt-1">
                            Bản khắc • chương {ch.order + 1}
                          </p>
                        </div>
                        {ch.isPasswordProtected ? (
                          <span className="text-[10px] bg-[#f4d451] text-[#132e1a] px-2.5 py-1 rounded font-black border border-[#ddd289]">
                            KHÓA
                          </span>
                        ) : (
                          <span className="text-xs text-[#ddd289] font-black group-hover:translate-x-1 transition-transform">
                            ➔
                          </span>
                        )}
                        {/* Họa tiết ẩn dập dờn */}
                        <div className="absolute -bottom-2 -right-2 opacity-5 pointer-events-none group-hover:opacity-15 transition-opacity">
                          <Feather className="w-12 h-12 text-[#f4d451]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-stone-400 font-black uppercase tracking-widest">
                    Chương truyện đang được chuẩn bị bưng lên...
                  </div>
                )}

                {/* Phân trang */}
                {chapters.length > CHAPTERS_PER_PAGE && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setChapterPage(idx)}
                        className={`w-9 h-9 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                          chapterPage === idx
                            ? "bg-[#f4d451] text-[#132e1a] border-[#ddd289] shadow-[2px_2px_0_0_#ddd289]"
                            : "bg-white text-[#132e1a]/60 border-[#cde8c6] hover:bg-[#eff6f0]"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* TAB ĐÀM ĐẠO KIỂU THƯ PHÁP */
              <div className="flex flex-col gap-6">
                {isLoggedIn ? (
                  <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Mặt hồ xanh phẳng lặng, có khách ghé đàm đạo văn chương... Viết vài dòng cảm xúc của bạn tại đây."
                      className="w-full bg-[#eff6f0]/50 border-2 border-[#cde8c6] focus:border-[#f4d451] text-[#132e1a] text-sm rounded-2xl p-4 focus:outline-none placeholder-stone-400 font-medium shadow-inner"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="bg-[#aeed9a] hover:bg-[#f4d451] disabled:bg-stone-200 disabled:text-stone-400 text-[#132e1a] font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl border-2 border-[#ddd289] shadow-[3px_3px_0_0_#ddd289] active:translate-y-px active:shadow-none transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5 text-[#132e1a]" />
                        GỬI BÌNH LUẬN
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 bg-[#eff6f0]/60 border-2 border-dashed border-[#ddd289] rounded-2xl text-center text-xs font-black text-[#132e1a]/70 uppercase tracking-wider">
                    Đăng nhập để bình phẩm, đàm đạo cùng các vương tôn công tử khác!
                  </div>
                )}

                {/* Danh sách đàm luận cực tao nhã */}
                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {comments.length > 0 ? (
                    comments.map((comment: any) => {
                      const isGift = comment.type === 'choco_gift';
                      return (
                        <div 
                          key={comment.id}
                          className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                            isGift
                              ? "bg-[#f4d451]/10 border-[#f4d451] shadow-[3px_3px_0_0_#ddd289]"
                              : "bg-white border-[#cde8c6] hover:border-[#f4d451]"
                          }`}
                        >
                          <div className="flex gap-3 relative z-10">
                            <UserAvatar 
                              avatarUrl={comment.avatarUrl} 
                              equippedAccessory={comment.equippedAccessory}
                              accessoryPosition={comment.accessoryPosition}
                              className="w-10 h-10 shrink-0 border-2 border-[#cde8c6]" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span 
                                  className="font-black text-xs truncate"
                                  style={{ color: getTitleColor?.(comment.activeTitle) || '#132e1a' }}
                                >
                                  {comment.displayName || 'Khách danh gia'}
                                  {comment.activeTitle && (
                                    <span className="ml-2 px-2 py-0.5 bg-[#f4d451] text-[#132e1a] text-[8px] font-black rounded uppercase tracking-wider border border-[#ddd289]">
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
                                <div className="mb-2 inline-flex items-center gap-1.5 bg-[#aeed9a] text-[#132e1a] text-[9px] font-black uppercase px-3 py-1 rounded-full border border-[#ddd289] shadow-sm">
                                  🍫 ĐÃ SỦNG ÁI {comment.giftAmount} CHOCO COIN
                                </div>
                              )}

                              <p className="text-xs md:text-sm text-stone-800 leading-relaxed text-justify break-words font-medium font-serif">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                          {isGift && (
                            <div className="absolute top-1 right-2 opacity-5 pointer-events-none">
                              <Gift className="w-16 h-16 text-[#f4d451]" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-stone-400 font-black uppercase tracking-widest">
                      Chưa có nhã ý đàm đạo nào cho tác phẩm này.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* QUÀ TẶNG CHOCO SÙNG ÁI TRUYỆN */}
          <div className="bg-[#cde8c6] text-[#132e1a] rounded-[2rem] border-4 border-[#ddd289] p-6 text-center shadow-sm relative overflow-hidden">
            <h4 className="font-black text-sm uppercase tracking-[0.2em] text-[#132e1a] mb-2 flex items-center justify-center gap-2 relative z-10 font-serif">
              <Gift className="w-5 h-5 animate-bounce text-[#f4d451]" />
              SỦNG ÁI HOÀNG YẾN
            </h4>
            <p className="text-[11px] text-[#132e1a]/80 mb-4 max-w-md mx-auto relative z-10 leading-relaxed">
              Kẹo ngọt Choco ngọt ngào sẽ chu cấp thêm sức mạnh cho chú chim hoàng yến bay lượn tự do, khai mở vô vàn phúc lợi và bối cảnh truyện độc quyền!
            </p>
            <button 
              onClick={() => setShowGiftModal(true)} 
              className="bg-[#f4d451] hover:bg-[#ddd289] text-[#132e1a] px-8 py-3.5 text-xs rounded-xl font-black uppercase tracking-widest border-2 border-white shadow-[3px_3px_0_0_#ddd289] hover:-translate-y-0.5 active:translate-y-px active:shadow-none transition-all cursor-pointer relative z-10"
            >
              🍫 SỦNG ÁI CHOCO COIN NGAY
            </button>
          </div>

        </div>

      </div>

      {/* 4. MODAL TẶNG QUÀ CHOCO QUÝ TỘC */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] border-[6px] border-double border-[#ddd289] max-w-md w-full p-6 md:p-8 relative overflow-hidden shadow-2xl animate-fade-in"
          >
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#132e1a]" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#132e1a]" />

            <h3 className="font-black text-lg text-[#132e1a] text-center uppercase tracking-widest mb-1 flex items-center justify-center gap-2 font-serif">
              <span>⚜️ TẶNG CHOCO QUÝ TỘC</span>
            </h3>
            <p className="text-[10px] text-stone-500 text-center mb-6 font-bold uppercase tracking-wider">
              (Chu cấp kẹo ngọt ngào để thưởng thức những giai thoại tuyệt vời)
            </p>

            <div className="flex flex-col gap-4">
              {/* Chọn mức quà */}
              <div>
                <label className="text-[9px] text-[#132e1a]/70 font-black uppercase tracking-widest mb-2 block">
                  Định mức Choco chu cấp:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 200, 1000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setGiftAmount(amount)}
                      className={`py-2.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                        giftAmount === amount
                          ? "bg-[#f4d451] text-[#132e1a] border-[#ddd289] shadow-[2px_2px_0_0_#ddd289]"
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
                <label className="text-[9px] text-[#132e1a]/70 font-black uppercase tracking-widest mb-1.5 block">
                  Hoặc tự do chỉ định lượng:
                </label>
                <input
                  type="number"
                  min={1}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Number(e.target.value))}
                  className="w-full bg-[#eff6f0] border-2 border-[#cde8c6] focus:border-[#f4d451] rounded-xl px-4 py-2.5 text-sm font-black focus:outline-none text-[#132e1a]"
                />
              </div>

              {/* Lời nhắn gửi */}
              <div>
                <label className="text-[9px] text-[#132e1a]/70 font-black uppercase tracking-widest mb-1.5 block">
                  Bút tích gửi gắm:
                </label>
                <textarea
                  rows={2}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi tặng Choco ngọt ngào ủng hộ tác phẩm!"
                  className="w-full bg-[#eff6f0] border-2 border-[#cde8c6] focus:border-[#f4d451] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none text-[#132e1a]"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 py-3 border-2 border-[#ddd289] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-stone-100 cursor-pointer transition-all"
                >
                  BÃI BỎ
                </button>
                <button
                  onClick={handleGiftSubmit}
                  className="flex-1 py-3 bg-[#f4d451] hover:bg-[#ddd289] text-[#132e1a] border-2 border-[#ddd289] shadow-[3px_3px_0_0_#ddd289] rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer"
                >
                  CHU CẤP
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

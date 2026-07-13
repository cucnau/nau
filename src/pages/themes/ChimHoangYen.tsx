import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, ArrowLeft, Sparkles, Feather, Volume2, HelpCircle, Heart, Star } from 'lucide-react';
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

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [chirping, setChirping] = useState(false);
  const [fedCount, setFedCount] = useState(0);

  // Web Audio Bird Chirp Synthesizer (Lớp âm thanh chim hót đỉnh cao bằng code thuần)
  const playBirdChirp = () => {
    try {
      setChirping(true);
      setTimeout(() => setChirping(false), 800);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Chirp sweep generator
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
        gain.gain.linearRampToValueAtTime(0.15, startTime + duration * 0.2);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Trills / Chirps
      chirp(now, 2800, 4200, 0.08);
      chirp(now + 0.12, 3000, 4500, 0.09);
      chirp(now + 0.25, 2900, 4300, 0.08);
      
      // Thêm một âm rung nhẹ phía sau
      if (Math.random() > 0.5) {
        chirp(now + 0.4, 3200, 4800, 0.12);
        chirp(now + 0.55, 3400, 5000, 0.15);
      }
    } catch (e) {
      console.warn('Web Audio is not allowed or supported yet', e);
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

    // Xóa ripple sau khi hoàn thành animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
  };

  const feedCherry = () => {
    setFedCount(prev => prev + 1);
    playBirdChirp();
    // Tạo hiệu ứng lắc lồng chim
    const box = document.getElementById('golden-cage-container');
    if (box) {
      box.classList.add('animate-wiggle');
      setTimeout(() => box.classList.remove('animate-wiggle'), 500);
    }
  };

  // Giả lập lông vũ vàng rơi lãng mạn
  const feathersArray = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    delay: i * 1.8,
    duration: 10 + i * 3,
    left: `${8 + i * 12}%`,
    scale: 0.5 + (i % 4) * 0.15
  }));

  return (
    <div className="bg-[#e8f1e9] min-h-screen text-[#132e1a] font-sans pb-24 relative overflow-x-hidden selection:bg-[#dca842] selection:text-white">
      
      {/* 1. LÔNG VŨ HOÀNG YẾN RƠI LÃNG MẠN */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {feathersArray.map(feather => (
          <motion.div
            key={feather.id}
            initial={{ y: -50, opacity: 0, rotate: 0 }}
            animate={{
              y: '105vh',
              opacity: [0, 0.85, 0.85, 0],
              x: [0, 50, -40, 25],
              rotate: [0, 120, 240, 360]
            }}
            transition={{
              duration: feather.duration,
              repeat: Infinity,
              delay: feather.delay,
              ease: 'linear'
            }}
            style={{
              position: 'absolute',
              left: feather.left,
              transform: `scale(${feather.scale})`
            }}
          >
            {/* SVG Lông vũ cách điệu màu vàng ánh kim cực sang trọng */}
            <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 filter drop-shadow-[0_2px_4px_rgba(220,168,66,0.2)]">
              <path
                d="M10,90 Q40,60 50,30 Q52,15 45,5 Q55,12 60,25 Q70,55 90,65 Q70,70 50,75 Z"
                fill="#dca842"
                stroke="#b88626"
                strokeWidth="1.5"
              />
              <path d="M45,5 Q48,45 10,90" stroke="#fce69a" strokeWidth="2" />
              <path d="M48,35 Q60,40 75,42" stroke="#fce69a" strokeWidth="1" />
              <path d="M45,50 Q58,58 70,62" stroke="#fce69a" strokeWidth="1" />
              <path d="M40,65 Q50,72 60,78" stroke="#fce69a" strokeWidth="1" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* 2. KHU VỰC TIÊU ĐỀ PHONG CÁCH QUÝ TỘC PHÁP-TRUNG CỔ ĐIỂN */}
      <div className="border-b-[4px] border-[#dca842] bg-white/95 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        {/* Nút quay lại */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e8f1e9] hover:bg-[#dca842] hover:text-white text-[#132e1a] text-xs font-black tracking-wider border-2 border-[#132e1a] shadow-[2px_2px_0_0_#132e1a] transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>LUI VỀ</span>
        </button>

        {/* Biển treo Hoàng gia */}
        <div className="flex items-center gap-2 bg-[#132e1a] text-white px-5 py-2 rounded-xl border-2 border-[#dca842] shadow-inner">
          <Feather className="w-4 h-4 text-[#dca842] animate-bounce" />
          <h2 className="font-black text-xs md:text-sm tracking-[0.2em] uppercase">
            DINH THỰ HOẮC GIA // CHIM HOÀNG YẾN
          </h2>
        </div>

        {/* Choco Coin Quý tộc */}
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#dca842]/10 border-2 border-[#dca842] text-xs font-black text-[#132e1a]">
          <span className="animate-spin" style={{ animationDuration: '4s' }}>🍫</span>
          <span>{choco} Choco</span>
        </div>
      </div>

      {/* 3. BỐ CỤC ĐỘC LẠ TRÊN DESKTOP: 2 CỘT LỆCH KHÁC BIỆT HOÀN TOÀN */}
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* ===================== CỘT TRÁI (COL-SPAN 5): LỒNG CHIM VÀNG HOÀNG GIA ĐỘC ĐÁO ===================== */}
        <div className="md:col-span-5 flex flex-col gap-6 md:sticky md:top-24">
          
          {/* LỒNG CHIM HOÀNG GIA DÁT VÀNG */}
          <div 
            id="golden-cage-container"
            className="w-full rounded-t-[14rem] rounded-b-[3rem] border-[6px] border-double border-[#dca842] bg-[#fdfbf7] p-6 md:p-8 shadow-[0_25px_60px_rgba(184,134,38,0.2)] flex flex-col items-center justify-start text-center relative overflow-hidden transition-all duration-300"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 30%, #fffbf2 0%, #fdfbf7 100%)'
            }}
          >
            {/* Thanh treo lồng chim cổ điển */}
            <div className="w-1 h-14 bg-gradient-to-b from-stone-400 via-[#dca842] to-[#b88626] mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-10" />
            <div className="w-8 h-8 rounded-full border-4 border-[#dca842] absolute top-10 left-1/2 -translate-x-1/2 z-10 bg-white" />

            {/* Các thanh lồng chim dọc chìm tinh tế */}
            <div className="absolute inset-x-8 top-16 bottom-8 pointer-events-none opacity-[0.08] flex justify-between">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-[1.5px] h-full bg-[#132e1a]" />
              ))}
            </div>

            {/* Khung ảnh tròn kiểu "Cửa sổ vườn Thượng Uyển" cực lạ */}
            <div className="w-48 h-48 md:w-56 md:h-56 mt-14 rounded-full relative overflow-hidden border-[4px] border-[#dca842] shadow-2xl group shrink-0">
              <div className="absolute inset-0 bg-[#e8f1e9] opacity-0 group-hover:opacity-20 transition-opacity z-10" />
              <img 
                src={story.coverUrl} 
                alt={story.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 border-[6px] border-white/40 rounded-full" />
              {story.completed && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#852221] text-[#fff] text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-[#dca842] shadow-md">
                  HOÀN THÀNH
                </span>
              )}
            </div>

            {/* Thanh đậu bằng gỗ của Chim Hoàng Yến treo lửng */}
            <div className="w-40 h-2 bg-amber-950 rounded-full mt-4 shadow-md relative">
              <div className="absolute -top-1 left-2 w-3 h-3 rounded-full bg-[#dca842]" />
              <div className="absolute -top-1 right-2 w-3 h-3 rounded-full bg-[#dca842]" />
            </div>

            {/* Tiêu đề truyện được cách điệu hoa mỹ */}
            <div className="mt-6 z-10">
              <span className="text-[9px] bg-[#852221] text-white font-black uppercase tracking-[0.2em] px-3.5 py-1 rounded-full border border-[#dca842] inline-block mb-3">
                CHUYỆN NHÀ HOẮC GIA
              </span>
              <h1 className="text-xl md:text-2.5xl font-black text-[#132e1a] tracking-tight leading-tight uppercase font-serif px-2">
                {story.title}
              </h1>
              <p className="text-[#852221] font-black text-xs mt-1.5 uppercase tracking-wider">
                Chấp bút: {story.author}
              </p>
            </div>

            {/* THỐNG KÊ QUÝ TỘC */}
            <div className="grid grid-cols-3 gap-1 w-full py-4 border-y-2 border-dashed border-[#dca842]/40 mt-6 text-center z-10">
              <div>
                <p className="text-[9px] text-[#132e1a]/50 font-black uppercase tracking-wider">Mục lục</p>
                <p className="text-base font-black text-[#852221]">{Math.max(story.chapterCount || 0, chapters.length)} chương</p>
              </div>
              <div className="border-x border-[#dca842]/30">
                <p className="text-[9px] text-[#132e1a]/50 font-black uppercase tracking-wider">Hỏa lực 🔥</p>
                <p className="text-base font-black text-[#852221]">
                  {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#132e1a]/50 font-black uppercase tracking-wider">Sủng ái 🍫</p>
                <p className="text-base font-black text-[#852221]">{totalGiftedChoco}</p>
              </div>
            </div>
          </div>

          {/* CÁC NÚT ĐIỀU HƯỚNG NHANH KIỂU LUXURY */}
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => chapters.length > 0 && navigate(`/doc/${story.slug || story.id}/chuong-${chapters[0].order + 1}`)} 
              className="flex-1 bg-[#132e1a] hover:bg-[#20492b] text-white py-3.5 text-xs rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-[#dca842] shadow-[3px_3px_0_0_#dca842] transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#dca842]" />
              ĐỌC NGAY
            </button>

            <button 
              onClick={handleSaveToggle} 
              className={`flex-1 py-3.5 text-xs rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-[#132e1a] shadow-[3px_3px_0_0_#132e1a] transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer ${
                savedStories?.includes(story.id)
                  ? "bg-[#dca842] text-white" 
                  : "bg-white text-[#132e1a]"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${savedStories?.includes(story.id) ? "fill-white" : ""}`} />
              {savedStories?.includes(story.id) ? 'ĐÃ LƯU' : 'LƯU LẠI'}
            </button>
          </div>

        </div>

        {/* ===================== CỘT PHẢI (COL-SPAN 7): KHUNG SÁCH CỔ ĐIỂN VỚI THƯ PHÁP VÀ TRUYỆN THUYẾT ===================== */}
        <div className="md:col-span-7 flex flex-col gap-6">
          
          {/* SẤP GIẤY CHI TIẾT TRUYỆN KIỂU CỔ ĐIỂN */}
          <div className="bg-white rounded-[2.5rem] border-[4px] border-double border-[#132e1a] p-6 md:p-10 shadow-lg relative overflow-hidden">
            {/* Họa tiết góc kiểu Cung đình */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-[3px] border-l-[3px] border-[#dca842]" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-[3px] border-r-[3px] border-[#dca842]" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-[3px] border-l-[3px] border-[#dca842]" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-[3px] border-r-[3px] border-[#dca842]" />

            {/* Thể loại băm nhuyễn */}
            <div className="flex flex-wrap gap-2 mb-6">
              {story.genres?.map?.((genre: string) => (
                <span 
                  key={genre} 
                  className="bg-[#e8f1e9] text-[#132e1a] text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-md border border-[#dca842]/30"
                >
                  ⚜️ {genre}
                </span>
              ))}
            </div>

            {/* TIÊU ĐỀ KHU VỰC */}
            <div className="border-b-2 border-dashed border-[#dca842] pb-3 mb-6">
              <h3 className="font-extrabold text-xs uppercase tracking-[0.25em] text-[#852221] flex items-center gap-2">
                <Star className="w-4 h-4 fill-[#dca842] text-[#dca842]" />
                BẢN KÝ SỰ BÊN HỒ CỦA LÊ PHI PHÀM
              </h3>
            </div>

            {/* MÔ TẢ TRUYỆN */}
            <div className="text-[#132e1a] leading-relaxed space-y-4 text-justify text-sm font-medium pr-1">
              {story.description?.split('\n').map((para: string, idx: number) => (
                <p key={idx} className={para.trim() ? "indent-6 text-stone-700 font-serif text-[15px]" : "hidden"}>
                  {para}
                </p>
              ))}
            </div>

            {/* BỨC TRANH PHONG CẢNH HỒ NƯỚC BẠCH QUẢ VÀ HOÀNG YẾN TƯƠNG TÁC ĐỘC LẠ */}
            <div className="mt-8 bg-gradient-to-br from-[#e8f1e9] to-white rounded-3xl border-2 border-[#dca842] p-5 text-center relative overflow-hidden shadow-inner">
              <h4 className="font-black text-xs uppercase tracking-[0.15em] text-[#132e1a] mb-1.5 flex items-center justify-center gap-1.5">
                🍃 Nhánh Bạch Quả Rủ Bên Hồ Hoắc Gia
              </h4>
              <p className="text-[10px] text-stone-500 mb-4 font-medium">
                (Chạm nhẹ lên mặt hồ xanh mướt hoặc chú chim hoàng yến để tạo gợn nước và nghe tiếng hót ngọt ngào)
              </p>

              {/* Mặt hồ tương tác xanh mướt lung linh */}
              <div 
                onClick={handleTouchLake}
                className="w-full h-48 bg-gradient-to-br from-[#1b3a1e] via-[#2d5a37] to-[#0f2c18] rounded-2xl border-2 border-[#dca842]/60 relative cursor-pointer overflow-hidden p-4 transition-all hover:border-[#132e1a] shadow-inner"
              >
                {/* Lớp ánh sáng mặt hồ phản chiếu lung linh */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(252,230,154,0.15)_0%,transparent_60%)] pointer-events-none" />

                {/* Sóng nước gợn nhẹ liên tục tự nhiên */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute w-full h-full border-t border-b border-white/10 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
                  <div className="absolute w-full h-full border-l border-r border-white/5 rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
                </div>

                {/* Gợn sóng gợn nước lan tỏa khi chạm tay */}
                {ripples.map(ripple => (
                  <motion.div
                    key={ripple.id}
                    initial={{ width: 0, height: 0, opacity: 0.9 }}
                    animate={{ width: 300, height: 300, opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute border-2 border-[#fce69a]/55 rounded-full pointer-events-none"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}

                {/* SVG Vẽ Nhánh cây bạch quả rủ rợp và chú chim hoàng yến đậu thơ mộng */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Thân cành bạch quả rủ từ trên phải xuống */}
                  <path d="M400,0 Q320,40 240,75 T110,120" fill="none" stroke="#5c4033" strokeWidth="3" />
                  <path d="M310,25 Q230,70 160,95" fill="none" stroke="#5c4033" strokeWidth="1.8" />
                  <path d="M220,55 Q160,90 100,105" fill="none" stroke="#5c4033" strokeWidth="1.2" />

                  {/* Các nhóm lá bạch quả vàng đung đưa */}
                  <motion.g animate={{ rotate: [-2, 3, -2] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} transform="translate(180, 85)">
                    <path d="M0,0 Q-15,-20 -25,-12 Q-28,5 -12,12 Q-5,8 0,0" fill="#fbe183" stroke="#dca842" strokeWidth="0.8" />
                  </motion.g>
                  <motion.g animate={{ rotate: [3, -3, 3] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }} transform="translate(250, 55)">
                    <path d="M0,0 Q-12,-18 -22,-10 Q-25,5 -10,10 Q-4,6 0,0" fill="#fbe183" stroke="#dca842" strokeWidth="0.8" />
                  </motion.g>
                  <motion.g animate={{ rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} transform="translate(130, 105)">
                    <path d="M0,0 Q-10,-15 -20,-8 Q-22,4 -8,8 Q-3,5 0,0" fill="#fbe183" stroke="#dca842" strokeWidth="0.8" />
                  </motion.g>
                  <motion.g animate={{ rotate: [2, -2, 2] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} transform="translate(90, 115)">
                    <path d="M0,0 Q-12,-12 -18,-5 Q-18,12 -5,8 Q-2,4 0,0" fill="#fce69a" stroke="#dca842" strokeWidth="0.8" />
                  </motion.g>

                  {/* Chú chim hoàng yến nhỏ màu vàng tươi ngộ nghĩnh đậu trên cành */}
                  <motion.g
                    whileHover={{ scale: 1.15 }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                    onClick={(e: any) => {
                      e.stopPropagation();
                      playBirdChirp();
                    }}
                    className="cursor-pointer pointer-events-auto"
                    transform="translate(150, 80)"
                  >
                    {/* Thân chim */}
                    <ellipse cx="12" cy="0" rx="15" ry="10" fill="#fce69a" stroke="#dca842" strokeWidth="1.2" />
                    {/* Đầu chim */}
                    <circle cx="23" cy="-7" r="7.5" fill="#fce69a" stroke="#dca842" strokeWidth="1.2" />
                    {/* Mỏ chim */}
                    <polygon points="30,-9 36,-7 30,-5" fill="#dca842" />
                    {/* Mắt chim nhỏ lém lỉnh */}
                    <circle cx="25" cy="-8" r="1.2" fill="#132e1a" />
                    {/* Cánh chim vẫy nhẹ dập dờn */}
                    <motion.path 
                      d="M6,-3 Q-2,-8 -8,-2 Q-4,8 6,0" 
                      fill="#dca842" 
                      animate={{ rotate: [-4, 8, -4] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    />
                    {/* Đuôi chim điệu đà */}
                    <path d="M-3,3 L-16,11 L-10,4 Z" fill="#dca842" />
                    {/* Chân chim nhỏ đậu chắc chắn */}
                    <line x1="8" y1="9" x2="6" y2="15" stroke="#5c4033" strokeWidth="1.2" />
                    <line x1="13" y1="9" x2="13" y2="15" stroke="#5c4033" strokeWidth="1.2" />
                  </motion.g>
                </svg>

                {/* Dòng chữ tâm sự nhỏ bay bay khẽ ở mép dưới mặt hồ */}
                <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                  <span className="text-[10px] text-[#fce69a]/70 font-serif italic">
                    “ Mặt hồ xanh mọc rêu phong trầm mặc, chao lượn bóng chim yến nhỏ tinh ranh... ”
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MỤC LỤC & ĐÀM ĐẠO - PHONG CÁCH CUỘN THƯ HOÀNG GIA */}
          <div className="bg-white rounded-[2.5rem] border-[4px] border-[#dca842] p-6 shadow-lg">
            
            {/* TABS TÙY CHỈNH KIỂU VƯƠNG GIẢ */}
            <div className="flex border-b-4 border-[#132e1a] mb-6 font-black text-xs uppercase tracking-widest">
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 py-4 text-center relative transition-all cursor-pointer ${
                  activeTab === 'chapters' ? "text-[#852221] bg-[#e8f1e9]/50" : "text-stone-400 hover:text-[#132e1a]"
                }`}
              >
                📜 Cuộn thư mục lục ({chapters.length})
                {activeTab === 'chapters' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#852221] rounded-t-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-4 text-center relative transition-all cursor-pointer ${
                  activeTab === 'comments' ? "text-[#852221] bg-[#e8f1e9]/50" : "text-stone-400 hover:text-[#132e1a]"
                }`}
              >
                💬 Quý tộc đàm đạo ({comments.length})
                {activeTab === 'comments' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#852221] rounded-t-full"></span>
                )}
              </button>
            </div>

            {/* NỘI DUNG TAB CHƯƠNG */}
            {activeTab === 'chapters' ? (
              <div className="flex flex-col gap-4">
                {/* Sắp xếp cực xịn */}
                <div className="flex justify-between items-center bg-[#e8f1e9] p-3 rounded-xl border-2 border-[#132e1a]">
                  <span className="text-xs font-black text-[#132e1a] uppercase tracking-wide">
                    Thứ tự biên niên sử
                  </span>
                  <button
                    onClick={() => setChapterSortDesc(!chapterSortDesc)}
                    className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 bg-white hover:bg-[#dca842] hover:text-white border-2 border-[#132e1a] rounded-lg transition-all cursor-pointer shadow-[2px_2px_0_0_#132e1a] active:translate-y-px active:shadow-none"
                  >
                    {chapterSortDesc ? 'Chương mới nhất trước' : 'Chương cũ nhất trước'}
                  </button>
                </div>

                {/* Danh sách chương sang xịn mịn */}
                {displayedChapters.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayedChapters.map((ch: any) => (
                      <div
                        key={ch.id}
                        onClick={() => navigate(`/doc/${story.slug || story.id}/chuong-${ch.order + 1}`)}
                        className="p-4 bg-white hover:bg-[#e8f1e9]/40 rounded-xl border-2 border-[#132e1a] hover:border-[#dca842] transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
                      >
                        <div className="min-w-0 z-10">
                          <p className="font-black text-sm text-[#132e1a] truncate font-serif">
                            {ch.title}
                          </p>
                          <p className="text-[9px] text-[#852221] font-black uppercase tracking-widest mt-1">
                            Bản Khắc • thứ {ch.order + 1}
                          </p>
                        </div>
                        {ch.isPasswordProtected ? (
                          <span className="text-[10px] bg-[#852221] text-white px-2.5 py-1 rounded font-black border border-[#dca842]">
                            KHÓA
                          </span>
                        ) : (
                          <span className="text-xs text-[#dca842] font-black group-hover:translate-x-1 transition-transform">
                            ➔
                          </span>
                        )}
                        {/* Họa tiết mờ bên dưới */}
                        <div className="absolute -bottom-2 -right-2 opacity-5 pointer-events-none group-hover:opacity-15 transition-opacity">
                          <Feather className="w-12 h-12 text-[#dca842]" />
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
                            ? "bg-[#dca842] text-white border-[#132e1a] shadow-[2px_2px_0_0_#132e1a]"
                            : "bg-white text-[#132e1a]/60 border-[#cde8c6] hover:bg-[#e8f1e9]"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* TAB ĐÀM ĐẠO */
              <div className="flex flex-col gap-6">
                {isLoggedIn ? (
                  <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Lê Phi Phàm tấu hài cực đỉnh, Cậu hai Hoắc sủng thê vô độ! Viết vài dòng đàm luận của riêng bạn..."
                      className="w-full bg-stone-50 border-2 border-[#132e1a] focus:border-[#dca842] text-[#132e1a] text-sm rounded-2xl p-4 focus:outline-none placeholder-stone-400 font-medium shadow-inner"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="bg-[#132e1a] hover:bg-[#852221] disabled:bg-stone-200 disabled:text-stone-400 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl border-2 border-[#dca842] shadow-[3px_3px_0_0_#132e1a] active:translate-y-px active:shadow-none transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5 text-[#dca842]" />
                        GỬI BÌNH LUẬN
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 bg-[#e8f1e9] border-2 border-dashed border-[#dca842] rounded-2xl text-center text-xs font-black text-[#132e1a]/70 uppercase tracking-wider">
                    Đăng nhập để đàm đạo cùng các vương tôn công tử khác!
                  </div>
                )}

                {/* Danh sách đàm luận */}
                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {comments.length > 0 ? (
                    comments.map((comment: any) => {
                      const isGift = comment.type === 'choco_gift';
                      return (
                        <div 
                          key={comment.id}
                          className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                            isGift
                              ? "bg-[#dca842]/10 border-[#dca842] shadow-[3px_3px_0_0_#dca842]"
                              : "bg-white border-[#132e1a] hover:border-[#dca842]"
                          }`}
                        >
                          <div className="flex gap-3 relative z-10">
                            <UserAvatar 
                              avatarUrl={comment.avatarUrl} 
                              equippedAccessory={comment.equippedAccessory}
                              accessoryPosition={comment.accessoryPosition}
                              className="w-10 h-10 shrink-0 border-2 border-[#132e1a]" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span 
                                  className="font-black text-xs truncate"
                                  style={{ color: getTitleColor?.(comment.activeTitle) || '#132e1a' }}
                                >
                                  {comment.displayName || 'Khách danh gia'}
                                  {comment.activeTitle && (
                                    <span className="ml-2 px-2 py-0.5 bg-[#852221] text-white text-[8px] font-black rounded uppercase tracking-wider border border-[#dca842]">
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
                                <div className="mb-2 inline-flex items-center gap-1.5 bg-[#852221] text-white text-[9px] font-black uppercase px-3 py-1 rounded-full border border-[#dca842] shadow-sm">
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
                              <Gift className="w-16 h-16 text-[#dca842]" />
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

          {/* QUÀ TẶNG CHOCO ĐỂ TĂNG HỎA LỰC TRUYỆN */}
          <div className="bg-[#852221] text-white rounded-3xl border-4 border-[#dca842] p-6 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
            <h4 className="font-black text-sm uppercase tracking-[0.2em] text-[#fce69a] mb-2 flex items-center justify-center gap-2 relative z-10">
              <Gift className="w-5 h-5 animate-bounce text-[#dca842]" />
              SỦNG ÁI HOÀNG YẾN
            </h4>
            <p className="text-[11px] text-[#fff]/80 mb-4 max-w-md mx-auto relative z-10">
              Càng tặng nhiều kẹo Choco, tiếng kêu của Hoàng Yến càng lảnh lót, mở khóa thêm nhiều đặc quyền gia tộc cho Lê Phi Phàm!
            </p>
            <button 
              onClick={() => setShowGiftModal(true)} 
              className="bg-[#dca842] hover:bg-[#fce69a] text-[#132e1a] px-8 py-3.5 text-xs rounded-xl font-black uppercase tracking-widest border-2 border-white shadow-[3px_3px_0_0_#132e1a] hover:-translate-y-0.5 active:translate-y-px active:shadow-none transition-all cursor-pointer relative z-10"
            >
              🍫 SỦNG ÁI CHOCO COIN NGAY
            </button>
          </div>

        </div>

      </div>

      {/* 4. MODAL TẶNG QUÀ CHOCO QUÝ TỘC PHONG CÁCH "HỘP TRANG SỨC" */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3rem] border-[6px] border-double border-[#dca842] max-w-md w-full p-6 md:p-8 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#132e1a]" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#132e1a]" />

            <h3 className="font-black text-lg text-[#132e1a] text-center uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <span>⚜️ TẶNG CHOCO QUÝ TỘC</span>
            </h3>
            <p className="text-[10px] text-stone-500 text-center mb-6 font-bold uppercase tracking-wider">
              (Chu cấp kẹo ngọt ngào để ủng hộ Lê Phi Phàm sinh hoạt lười biếng)
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
                          ? "bg-[#dca842] text-white border-[#132e1a] shadow-[2px_2px_0_0_#132e1a]"
                          : "bg-[#e8f1e9]/50 border-stone-200 text-[#132e1a] hover:bg-[#e8f1e9]"
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
                  className="w-full bg-stone-50 border-2 border-[#132e1a] focus:border-[#dca842] rounded-xl px-4 py-2.5 text-sm font-black focus:outline-none"
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
                  className="w-full bg-stone-50 border-2 border-[#132e1a] focus:border-[#dca842] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 py-3 border-2 border-[#132e1a] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-stone-100 cursor-pointer transition-all"
                >
                  BÃI BỎ
                </button>
                <button
                  onClick={handleGiftSubmit}
                  className="flex-1 py-3 bg-[#dca842] hover:bg-[#b88626] text-white border-2 border-[#132e1a] shadow-[3px_3px_0_0_#132e1a] rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 active:translate-y-px active:shadow-none cursor-pointer"
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

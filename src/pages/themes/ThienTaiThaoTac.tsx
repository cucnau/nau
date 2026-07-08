import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Heart, ArrowLeft, Sparkles, Terminal, Cpu, Shield, Zap, Sword, Award, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

// Custom Hologram Grid Icon
const HologramGrid = ({ className, ...props }: any) => (
  <svg viewBox="0 0 100 100" className={className} {...props}>
    <path d="M 10,10 L 90,10 L 90,90 L 10,90 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
    <path d="M 30,10 L 30,90" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <path d="M 50,10 L 50,90" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <path d="M 70,10 L 70,90" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <path d="M 10,30 L 90,30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <path d="M 10,50 L 90,50" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    <path d="M 10,70 L 90,70" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
    <polygon points="50,25 72,62 28,62" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function ThienTaiThaoTacTheme(props: ThemeProps) {
  const {
    story, actualStoryId, chapters, comments, activeTab, setActiveTab,
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
  const isSaved = (savedStories || []).includes(story.id);

  const displayedChapters = [...chapters]
    .sort((a, b) => {
      const aNum = a.orderIndex !== undefined ? a.orderIndex : parseFloat(a.title?.match(/\d+/)?.[0] || '0');
      const bNum = b.orderIndex !== undefined ? b.orderIndex : parseFloat(b.title?.match(/\d+/)?.[0] || '0');
      return chapterSortDesc ? bNum - aNum : aNum - bNum;
    })
    .slice(chapterPage * CHAPTERS_PER_PAGE, (chapterPage + 1) * CHAPTERS_PER_PAGE);

  // Danh sách các phó bản cực đỉnh từ cốt truyện "Thần Thụ"
  const dungeons = [
    { name: "3145 · Server tân thủ", desc: "Chương 1-12", diff: "Tân Thủ", boss: "Không có", min: 1, max: 12 },
    { name: "3145 · Miếu Thần Thiên Địa", desc: "Chương 13-23", diff: "Dễ", boss: "Thiên Địa Thủ Vệ", min: 13, max: 23 },
    { name: "3145 · Khu vực lang thang hoang dã", desc: "Chương 24-28", diff: "Thường", boss: "Thương Lang Vương", min: 24, max: 28 },
    { name: "Khám phá · Thị Trấn Mê Cung Gương", desc: "Chương 29-37", diff: "Khó", boss: "Kính Ảnh Ma Thần", min: 29, max: 37 },
    { name: "Thần Thụ Thiên Không · Thị Trấn Lưu Ly", desc: "Chương 38-44", diff: "Khó", boss: "Lưu Ly Tinh Thể Long", min: 38, max: 44 },
    { name: "Trận chiến liên minh bang hội · Bạch Thủy Cốc", desc: "Chương 45-55", diff: "Cực Khó", boss: "Bạch Vụ Thần Điêu", min: 45, max: 55 },
    { name: "Khám phá · Trại Nhà Trần", desc: "Chương 56-69", diff: "Khó", boss: "Trần Đại Thủ Lĩnh", min: 56, max: 69 },
    { name: "Lối chơi đặc biệt · Tỉ Thí Kén Rể", desc: "Chương 70-90", diff: "Thường", boss: "Trấn Vũ Lôi Chủ", min: 70, max: 90 },
    { name: "Khám phá · Lĩnh Vực Thần Tài", desc: "Chương 91-114", diff: "Huyền Thoại", boss: "Kim Bảo Thần Tài", min: 91, max: 114 },
    { name: "Khám phá · Vùng Đất Sụp Đổ", desc: "Chương 115-135", diff: "Cực Khó", boss: "Vua Sụp Đổ", min: 115, max: 135 },
    { name: "Khám phá · Kỳ Quan Sơn Dã", desc: "Chương 136-157", diff: "Huyền Thoại", boss: "Cổ Thụ Thần Long", min: 136, max: 157 },
    { name: "Tiến độ thế giới · Bí Mật Trường Phái", desc: "Chương 158-184", diff: "Bí Ẩn", boss: "Trưởng Lão Trường Phái", min: 158, max: 184 },
    { name: "Còn tiếp...", desc: "Hành trình vẫn đang được cập nhật...", diff: "Chưa Rõ", boss: "Chưa Rõ", min: 185, max: 9999 }
  ];

  const [selectedDungeon, setSelectedDungeon] = useState<number | null>(null);
  const [interfaceLog, setInterfaceLog] = useState<string>("Đã khởi tạo bảng điều khiển Thần Thụ. Chờ thao tác...");

  const handleDungeonClick = (idx: number) => {
    setSelectedDungeon(idx);
    setInterfaceLog(`Hệ thống đang đồng bộ phó bản: ${dungeons[idx].name}. Trạng thái: Sẵn sàng thử thách!`);
  };

  return (
    <div className="bg-[#060406] min-h-screen text-[#d4c6c9] font-sans selection:bg-[#9a858d] selection:text-[#060406] pb-24 relative overflow-x-hidden">
      
      {/* VIRTUAL MATRIX BACKGROUND GRID */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.06] z-0 bg-[linear-gradient(rgba(100,90,108,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(100,90,108,0.15)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* GLOWING HUD ACCENTS */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full blur-[160px] opacity-[0.12] pointer-events-none bg-[#645a6c]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[200px] opacity-[0.08] pointer-events-none bg-[#9a858d]" />

      {/* STICKY NEO-CYBER BANNER */}
      <div className="border-b border-[#645a6c]/40 bg-[#060406]/95 backdrop-blur-md px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        {/* Connection status rail line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#9a858d] to-transparent opacity-80" />

        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#34282d]/80 hover:bg-[#645a6c]/20 text-[#d4c6c9] text-xs font-bold tracking-widest border border-[#645a6c]/40 transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>HỆ THỐNG</span>
        </button>

        <div className="flex items-center justify-center gap-2">
          <Terminal className="w-5 h-5 text-[#9a858d] animate-pulse" />
          <h2 className="font-extrabold text-sm md:text-lg tracking-[0.25em] text-[#d4c6c9] uppercase flex items-center gap-1.5 font-mono">
            THẦN THỤ <span className="text-[10px] text-[#9a858d] font-bold px-1 py-0.5 rounded border border-[#9a858d]/30 bg-[#34282d]/40">v1.2</span>
          </h2>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-[#645a6c]">
          <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 animate-spin-slow" /> CPU: OK</span>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> NGƯỜI CHƠI: SẴN SÀNG</span>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto p-4 md:p-8 relative z-10 flex flex-col gap-10 mt-6">
        
        {/* SYSTEM PROFILE INTERFACE (STORY PROFILE) */}
        <div className="flex flex-col md:flex-row gap-8 rounded-3xl p-6 md:p-8 border border-[#645a6c]/40 bg-[#34282d]/25 backdrop-blur-sm relative overflow-hidden shadow-2xl">
          {/* Hologram aesthetic lines */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#9a858d]/60 pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#9a858d]/60 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#9a858d]/60 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#9a858d]/60 pointer-events-none" />

          {/* Cover Art frame */}
          <div className="w-full md:w-56 shrink-0 flex justify-center items-center">
            <div className="relative w-44 h-60 md:w-full md:h-72 rounded-2xl overflow-hidden border-2 border-[#645a6c]/60 shadow-[0_0_25px_rgba(154,133,141,0.15)] bg-[#060406]">
              {story.coverUrl ? (
                <img 
                  src={story.coverUrl} 
                  alt={story.title} 
                  className="w-full h-full object-cover brightness-95 hover:brightness-110 hover:scale-105 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <HologramGrid className="w-16 h-16 text-[#9a858d] opacity-40 animate-pulse" />
                  <span className="text-[10px] font-mono text-[#645a6c]">NO ART SYNC</span>
                </div>
              )}
              {/* Overlay Hologram scanline */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#9a858d]/5 via-transparent to-transparent pointer-events-none animate-scanline" />
            </div>
          </div>

          {/* Info Details */}
          <div className="flex flex-col justify-center flex-1 space-y-4">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#9a858d] uppercase font-black tracking-widest">
              <span className="bg-[#9a858d]/10 border border-[#9a858d]/30 px-2.5 py-0.5 rounded">GAME ONLINE VR</span>
              <span>•</span>
              <span>THẬT GIẢ ĐAN XEN</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#d4c6c9] uppercase font-sans drop-shadow-[0_2px_10px_rgba(154,133,141,0.1)]">
              {story.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold font-mono text-[#645a6c]">
              <span className="flex items-center gap-1.5 text-[#d4c6c9]/80">
                <Cpu className="w-4 h-4 text-[#9a858d]" /> TÁC GIẢ: {story.author || 'Hệ Thống Thần Thụ'}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> {chapters.length} PHÂN ĐOẠN (CHƯƠNG)
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {story.genres && story.genres.length > 0 ? (
                story.genres.map((tag: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-[#645a6c]/40 bg-[#34282d]/40 text-[#9a858d]">
                    {tag}
                  </span>
                ))
              ) : (
                ['Cả đôi đều mạnh', 'Game online', 'Truyện sướng', 'Hành trình tăng cấp', 'Thực tế ảo'].map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-[#645a6c]/40 bg-[#34282d]/40 text-[#9a858d]">
                    {tag}
                  </span>
                ))
              )}
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-[#d4c6c9]/70 bg-[#060406]/40 p-4 rounded-2xl border border-[#645a6c]/20 text-justify font-sans">
              {story.description || "Dữ liệu truyện Thần Thụ đang nạp trực tuyến... Bước vào thế giới thực tế ảo cùng những pha thao tác thần sầu và bước nhảy cấp đầy sảng khoái."}
            </p>

            {/* Quick Stats Panel */}
            <div className="flex items-center gap-6 py-2 border-t border-b border-[#645a6c]/20 font-mono text-[11px] text-[#645a6c]">
              <div>Kênh thế giới: <span className="text-[#9a858d] font-bold">{comments.length} tin</span></div>
              <div>Donate tiếp tế: <span className="text-[#d4c6c9] font-bold">{totalGiftedChoco} CC</span></div>
              <div>Kết nối: <span className="text-[#9a858d] font-bold animate-pulse">ỔN ĐỊNH 100%</span></div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {chapters.length > 0 && (
                <button
                  onClick={() => navigate(`/doc/${actualStoryId}/${chapters[0].id}`)}
                  className="flex-1 py-3 px-5 rounded-xl text-xs font-extrabold tracking-widest uppercase bg-[#9a858d] hover:bg-[#d4c6c9] text-[#060406] border border-transparent hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(154,133,141,0.25)]"
                >
                  <Zap className="w-4 h-4 fill-current" /> BẮT ĐẦU CHINH PHỤC (ĐỌC)
                </button>
              )}
              <button
                onClick={handleSaveToggle}
                className={`py-3 px-5 rounded-xl text-xs font-extrabold tracking-widest uppercase transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                  isSaved 
                    ? 'bg-[#34282d] text-[#9a858d] border-[#9a858d]' 
                    : 'bg-transparent text-[#d4c6c9] border-[#645a6c] hover:bg-[#34282d]/50'
                }`}
              >
                <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? 'Đã ghim' : 'Ghim truyện'}
              </button>
              
              <button
                onClick={() => setShowGiftModal(true)}
                className="py-3 px-5 rounded-xl text-xs font-extrabold tracking-widest uppercase bg-transparent text-[#9a858d] border border-[#9a858d]/50 hover:bg-[#34282d]/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gift className="w-4 h-4 text-[#9a858d]" /> TIẾP TẾ LÀM GIÀU
              </button>
            </div>
          </div>
        </div>

        {/* ==================== 2. HÀNH TRÌNH PHÓ BẢN THẦN THỤ (VIRTUAL DUNGEON MAP) ==================== */}
        <div className="border border-[#645a6c]/30 rounded-3xl p-6 bg-[#34282d]/15 shadow-inner">
          <div className="flex items-center justify-between border-b border-[#645a6c]/20 pb-3 mb-5">
            <h3 className="font-extrabold text-sm md:text-base font-mono text-[#d4c6c9] uppercase tracking-widest flex items-center gap-2">
              <Sword className="w-5 h-5 text-[#9a858d]" /> BẢN ĐỒ HÀNH TRÌNH PHÓ BẢN THẦN THỤ
            </h3>
            <span className="text-[10px] font-mono text-[#645a6c]">HOÀN THÀNH: {dungeons.length}/{dungeons.length}</span>
          </div>

          <p className="text-xs text-[#645a6c] font-mono mb-4">
            *Người chơi đã mở khóa và vượt qua thành công toàn bộ phó bản dưới đây trong game thực tế ảo "Thần Thụ". Nhấp vào phó bản để dò tọa độ dữ liệu.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {dungeons.map((dun, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleDungeonClick(idx)}
                className={`py-2.5 px-2 rounded-xl border font-mono text-[10px] font-black transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                  selectedDungeon === idx 
                    ? "bg-[#9a858d] text-[#060406] border-[#d4c6c9] shadow-[0_0_12px_rgba(154,133,141,0.5)]" 
                    : "bg-[#060406] text-[#d4c6c9]/70 border-[#645a6c]/40 hover:border-[#9a858d] hover:text-[#9a858d]"
                }`}
              >
                <span className="opacity-50 text-[8px] tracking-tight block">PB 0{idx+1}</span>
                <span className="line-clamp-2 w-full font-sans font-bold px-1 text-[9px] leading-tight">{dun.name}</span>
              </button>
            ))}
          </div>

          {/* Dungeon details monitor */}
          <div className="mt-4 p-4 rounded-2xl bg-[#060406] border border-[#645a6c]/20 font-mono text-xs text-[#645a6c] flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="text-[#9a858d] font-bold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> 
                {selectedDungeon !== null ? dungeons[selectedDungeon].name : "MÁY QUÉT DỮ LIỆU PHÓ BẢN"}
              </div>
              <p className="text-[#d4c6c9]/70 font-sans text-xs sm:text-sm">
                {selectedDungeon !== null ? dungeons[selectedDungeon].desc : "Chọn phó bản bên trên để truy xuất thông tin hành trình vượt phó bản đặc trưng."}
              </p>
            </div>
            {selectedDungeon !== null && (
              <div className="shrink-0 flex md:flex-col justify-between md:justify-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-[#645a6c]/20 pt-3 md:pt-0 md:pl-5">
                <div>Cơ mật: <span className="text-[#9a858d] font-bold uppercase">{dungeons[selectedDungeon].diff}</span></div>
                <div>Yêu quái đầu sỏ: <span className="text-[#d4c6c9] font-bold">{dungeons[selectedDungeon].boss}</span></div>
              </div>
            )}
          </div>

          <div className="mt-3 text-[9px] font-mono text-[#9a858d] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9a858d] animate-pulse"></span>
            <span>HUD LOG: {interfaceLog}</span>
          </div>
            {/* Chapters for selected dungeon */}
            {selectedDungeon !== null && (
              <div className="mt-4 pt-4 border-t border-[#645a6c]/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {chapters.filter(chap => {
                    // Extract chapter number from title (e.g. "Chương 1", "Chương 15", "Chương 135:")
                    const match = chap.title.match(/Chươngs+(d+)/i);
                    const chapNum = match ? parseInt(match[1], 10) : 0;
                    return chapNum >= dungeons[selectedDungeon].min && chapNum <= dungeons[selectedDungeon].max;
                  }).map((chap, idx) => (
                    <button
                      key={chap.id}
                      onClick={() => navigate(`/doc/${actualStoryId}/${chap.id}`)}
                      className="group relative p-3 rounded-xl transition-all text-left flex flex-col gap-1 overflow-hidden border border-[#645a6c]/30 bg-[#060406]/60 hover:bg-[#34282d]/35 hover:border-[#9a858d] cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#9a858d]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#34282d] text-[#9a858d] border border-[#645a6c]/40 inline-block w-max">
                        STAGE {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-[#d4c6c9] group-hover:text-white line-clamp-1 font-mono">
                        {chap.title}
                      </span>
                    </button>
                  ))}
                  {chapters.filter(chap => {
                    const match = chap.title.match(/Chươngs+(d+)/i);
                    const chapNum = match ? parseInt(match[1], 10) : 0;
                    return chapNum >= dungeons[selectedDungeon].min && chapNum <= dungeons[selectedDungeon].max;
                  }).length === 0 && (
                    <p className="col-span-1 sm:col-span-2 text-center text-[10px] text-[#645a6c] font-mono italic">
                      Dữ liệu phân đoạn này chưa được cập nhật...
                    </p>
                  )}
                </div>
              </div>
            )}

        </div>

        
        {/* KÊNH THẾ GIỚI (COMMENTS) */}
        <div className="rounded-3xl p-6 md:p-8 border border-[#645a6c]/40 bg-[#34282d]/10 backdrop-blur-sm relative overflow-hidden shadow-2xl mt-4">
          <div className="flex flex-col gap-6">
            <h3 className="font-extrabold text-sm md:text-base uppercase tracking-widest flex items-center gap-2 text-[#d4c6c9] font-mono">
              <Terminal className="w-5 h-5 text-[#9a858d]" /> KÊNH THẾ GIỚI
            </h3>

              {/* SYSTEM CHAT INPUT */}
              <div className="border border-[#645a6c]/30 p-4 rounded-2xl flex flex-col gap-3 bg-[#060406]/40">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Gửi tin nhắn lên kênh thế giới của Người chơi..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-[#645a6c]/40 bg-[#060406] text-[#d4c6c9] placeholder-[#645a6c] focus:outline-none focus:border-[#9a858d] text-xs sm:text-sm resize-none font-medium transition-all"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#645a6c] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {isLoggedIn ? "> LOG: SẴN SÀNG PHÁT TIN" : "> LOG: YÊU CẦU ĐĂNG NHẬP"}
                  </span>
                  <button 
                    onClick={handleSendComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="px-5 py-2 text-xs font-bold font-mono tracking-widest rounded-xl transition-all bg-[#9a858d] hover:bg-[#d4c6c9] text-[#060406] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    PHÁT TIN <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES FEED */}
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#645a6c]/30 rounded-2xl bg-[#060406]/40 text-[#645a6c] font-mono">
                    <p>Kênh thế giới đang trống... Hãy là người chơi đầu tiên để lại bút tích.</p>
                  </div>
                ) : (
                  comments.map((comment, idx) => {

                    const isGift = comment.type === 'choco_gift';
                    const cacheUser = profilesCache[comment.uid] || {};
                    const avatar = cacheUser.avatarUrl || comment.avatarUrl || '';
                    const dName = cacheUser.displayName || comment.displayName || 'Người chơi vô danh';
                    const customTitle = cacheUser.activeTitle || comment.activeTitle;
                    const isMe = comment.uid === uid;
                    const currentSticker = isMe ? equippedStickerComment : (cacheUser?.equippedStickerComment ?? cacheUser?.equippedSticker ?? comment.equippedSticker);

                    return (
                      <div 
                        key={comment.id}
                        className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                          isGift 
                            ? 'bg-[#34282d]/30 border-[#9a858d]/50 shadow-[0_0_15px_rgba(154,133,141,0.05)]' 
                            : 'bg-[#060406]/70 border-[#645a6c]/30 hover:border-[#9a858d]/40'
                        } ${currentSticker ? 'pr-16' : ''}`}
                      >
                        {currentSticker && (
                          <img 
                            src={currentSticker} 
                            alt="Sticker" 
                            className="absolute w-12 h-12 object-contain pointer-events-none z-10 right-2 top-1/2 -translate-y-1/2 drop-shadow-md" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="flex items-start gap-3 relative z-10">
                          <UserAvatar 
                            avatarUrl={avatar} 
                            equippedAccessory={cacheUser.equippedAccessory || comment.equippedAccessory} 
                            accessoryPosition={cacheUser.accessoryPosition || comment.accessoryPosition} 
                            className="w-9 h-9 shrink-0 border border-[#645a6c]/40 rounded-xl" 
                            fallbackIconSizeClass="w-5 h-5 text-[#645a6c]" 
                          />
                          <div className="flex-1 min-w-0 font-mono">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-extrabold text-xs text-[#d4c6c9]">
                                {dName}
                              </span>
                              {customTitle && (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#34282d] text-[#9a858d] border border-[#9a858d]/40">
                                  {customTitle.name || customTitle}
                                </span>
                              )}
                              <span className="text-[9px] text-[#645a6c] ml-auto">
                                {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yy HH:mm') : 'MỚI'}
                              </span>
                            </div>

                            {isGift && (
                              <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold max-w-max border border-[#9a858d]/50 bg-[#34282d] text-[#9a858d]">
                                <Award className="w-3 h-3 text-[#9a858d]" /> TIẾP TẾ DROP: {comment.giftAmount} CC
                              </div>
                            )}

                            <p className="mt-2 text-xs sm:text-sm font-sans font-medium text-[#d4c6c9]/90 leading-relaxed text-justify">
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

      {/* GIFT SUPPORT INTERFACE (DONATE MODAL) */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-[#060406]/90 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-3xl relative border-2 border-[#9a858d] bg-[#34282d] shadow-[0_0_35px_rgba(154,133,141,0.2)]">
            <div className="absolute -top-6 -right-6 p-2 rounded-2xl border border-[#9a858d] bg-[#060406] text-[#9a858d]">
               <HologramGrid className="w-8 h-8 animate-pulse" />
            </div>
            
            <h3 className="text-lg font-black font-mono mb-1.5 uppercase tracking-widest flex items-center gap-2 text-[#d4c6c9]">
              <Sparkles className="w-4 h-4 text-[#9a858d]" /> TIẾP TẾ PHÓ BẢN
            </h3>
            <p className="text-xs mb-5 font-sans font-semibold text-[#645a6c] leading-relaxed">
              Trang bị thêm vũ khí và năng lượng hỗ trợ Người chơi sinh tồn và tăng cấp bão táp trong Thần Thụ.
            </p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-mono font-bold mb-1 uppercase flex items-center gap-1.5 text-[#9a858d]">
                   <Gift className="w-3.5 h-3.5" /> CHỌN CC TIẾP TẾ (SỐ DƯ: {choco} CC)
                </label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full border border-[#645a6c]/40 p-3 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#9a858d] bg-[#060406] text-[#d4c6c9]"
                  min="1"
                />
              </div>
              
              <div>
                <label className="text-[9px] font-mono font-bold mb-1 uppercase flex items-center gap-1.5 text-[#9a858d]">
                   <Terminal className="w-3.5 h-3.5" /> LỜI NHẮN HỆ THỐNG
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Thần Thụ vĩ đại, cầu xin thả boss phó bản ra nhẹ tay..."
                  rows={2}
                  className="w-full border border-[#645a6c]/40 p-3 rounded-xl text-xs font-sans font-bold focus:outline-none focus:border-[#9a858d] bg-[#060406] text-[#d4c6c9] resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold font-mono uppercase border border-[#645a6c] text-[#645a6c] hover:bg-[#645a6c]/10 cursor-pointer"
                >
                  HUY BO
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="flex-1 py-2 rounded-xl text-xs font-bold font-mono uppercase bg-[#9a858d] text-[#060406] hover:bg-[#d4c6c9] cursor-pointer"
                >
                  GUI CC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

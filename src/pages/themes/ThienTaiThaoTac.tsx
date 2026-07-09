import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, ExternalLink, Gift, Send, Bookmark, Heart, ArrowLeft, Sparkles, Terminal, Cpu, Shield, Zap, Sword, Award, Layers, User } from 'lucide-react';
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
    { name: "3145 · Server tân thủ", desc: "Chương 1-12", diff: "★★★", boss: "Thủ Thư Thư Viện", min: 1, max: 12 },
    { name: "3145 · Miếu Thần Thiên Địa", desc: "Chương 13-23", diff: "★★★★★★", boss: "Tượng Thần Hỗn Loạn", min: 13, max: 23 },
    { name: "3145 · Khu vực lang thang hoang dã", desc: "Chương 24-28", diff: "Không rõ", boss: "Không rõ", min: 24, max: 28 },
    { name: "Khám phá · Thị Trấn Mê Cung Gương", desc: "Chương 29-37", diff: "★★★★★★", boss: "Thần Sương", min: 29, max: 37 },
    { name: "Thần Thụ Thiên Không · Thị Trấn Lưu Ly", desc: "Chương 38-44", diff: "Không rõ", boss: "Không rõ", min: 38, max: 44 },
    { name: "Trận chiến liên minh bang hội · Bạch Thủy Cốc", desc: "Chương 45-55", diff: "★★★★★★", boss: "Thú dữ trấn giữ thung lũng", min: 45, max: 55 },
    { name: "Khám phá · Trại Nhà Trần", desc: "Chương 56-69", diff: "★★★★★★", boss: "Thần Cổ", min: 56, max: 69 },
    { name: "Lối chơi đặc biệt · Tỉ Thí Kén Rể", desc: "Chương 70-90", diff: "★★★★★★", boss: "Thần Giả", min: 70, max: 90 },
    { name: "Khám phá · Lĩnh Vực Thần Tài", desc: "Chương 91-114", diff: "★★★★★★★", boss: "Thần Dục", min: 91, max: 114 },
    { name: "Khám phá · Vùng Đất Sụp Đổ", desc: "Chương 115-135", diff: "★★★★★★★", boss: "Thần Ảo", min: 115, max: 135 },
    { name: "Khám phá · Kỳ Quan Sơn Dã", desc: "Chương 136-157", diff: "★★★★★★★", boss: "Thần Cảnh", min: 136, max: 157 },
    { name: "Tiến độ thế giới · Bí Mật Trường Phái", desc: "Chương 158-184", diff: "★★★★★★★★", boss: "Không rõ", min: 158, max: 184 },
    { name: "Còn tiếp...", desc: "Hành trình vẫn đang được cập nhật...", diff: "Chưa Rõ", boss: "Chưa Rõ", min: 185, max: 9999 }
  ];

  const [selectedDungeon, setSelectedDungeon] = useState<number | null>(null);
  const [interfaceLog, setInterfaceLog] = useState<string>("Đã khởi tạo giao diện hệ thống Thần Thụ. Chờ thao tác...");

  const handleDungeonClick = (idx: number) => {
    setSelectedDungeon(idx);
    setInterfaceLog(`Hệ thống đang đồng bộ phó bản: ${dungeons[idx].name}. Trạng thái: Sẵn sàng thử thách!`);
  };

  return (
    <div className="min-h-screen bg-[#060406] text-[#d4c6c9] font-space selection:bg-[#9a858d]/30 selection:text-white pb-20 overflow-x-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {story.coverUrl && (
          <img src={story.coverUrl} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-2xl scale-110" referrerPolicy="no-referrer" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060406]/80 via-[#060406]/90 to-[#060406] mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="max-w-[1200px] mx-auto p-4 md:p-8 relative z-10 flex flex-col gap-12 mt-4 md:mt-6">
        
        {/* HUD TOP WRAPPER */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* HUD DECORATIVE SEPARATOR */}
          <div className="w-full relative flex items-center justify-center opacity-80 pointer-events-none hidden md:flex">
            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#9a858d]/40 to-transparent"></div>
            <div className="w-full max-w-3xl flex justify-between items-center relative z-10 px-8">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-[#9a858d]/80 animate-pulse"></div>
                  <div className="w-1 h-2 bg-[#9a858d]/40"></div>
                  <div className="w-1 h-1 bg-[#9a858d]/40"></div>
                </div>
                <div className="w-12 h-[1px] bg-[#9a858d]/60"></div>
              </div>
              <div className="font-mono text-[10px] text-[#9a858d] tracking-[0.2em] bg-[#060406] px-6 py-1.5 border-y border-[#9a858d]/30 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-ping"></span>
                CONNECTING // HOLODECK_GAME
                <span className="w-1.5 h-1.5 bg-[#9a858d]/40"></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-[1px] bg-[#9a858d]/60"></div>
                <div className="flex gap-1 items-end">
                  <div className="w-1 h-1 bg-[#9a858d]/40"></div>
                  <div className="w-1 h-2 bg-[#9a858d]/40"></div>
                  <div className="w-1 h-3 bg-[#9a858d]/80 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* HUD HEADER: CHARACTER / STORY DATA */}
          <div className="w-full relative border border-[#9a858d]/20 bg-[#060406]/60 p-4 md:p-6 lg:p-8 backdrop-blur-md">
          {/* Grid Layout HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full relative z-10">
            
            {/* LEFT COLUMN: COVER & ACTIONS (Span 3) */}
            <div className="lg:col-span-3 lg:col-start-1 flex flex-col gap-4">
              {/* HOLOGRAPHIC COVER */}
              <div className="w-full relative group perspective-1000">
                <div className="relative rounded-sm overflow-hidden border-2 border-[#9a858d]/40 bg-[#060406]/80 shadow-[0_0_20px_rgba(154,133,141,0.15)] transform transition-transform duration-700 hover:rotate-y-6">
                  {/* Scanline overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-20 opacity-50" />
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-[#9a858d]/20 to-transparent -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite] z-20 pointer-events-none" />
                  
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#9a858d] z-30" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#9a858d] z-30" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#9a858d] z-30" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#9a858d] z-30" />

                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#060406]/90 border border-[#9a858d] text-[8px] font-mono font-bold text-[#9a858d] z-30 tracking-widest">
                    PATCH 1.0.2
                  </div>

                  {story.coverUrl ? (
                    <img 
                      src={story.coverUrl} 
                      alt={story.title} 
                      className="w-full aspect-[2/3] object-cover relative z-10 filter contrast-125 brightness-90 group-hover:brightness-110 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center bg-[#34282d]/20 relative z-10">
                      <span className="text-[#645a6c] font-mono text-xs tracking-widest">NO VISUAL DATA</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick stats under cover */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="border border-[#645a6c]/30 bg-[#060406]/80 p-2 flex flex-col gap-0.5 text-center items-center justify-center">
                  <span className="text-[#645a6c] tracking-widest text-[8px]">TÌNH TRẠNG</span>
                  <span className="text-[#9a858d] font-bold">{story.isFull ? 'ĐÃ ĐÓNG' : 'ONLINE'}</span>
                </div>
                <div className="border border-[#645a6c]/30 bg-[#060406]/80 p-2 flex flex-col gap-0.5 text-center items-center justify-center">
                  <span className="text-[#645a6c] tracking-widest text-[8px]">ĐỘ ỔN ĐỊNH</span>
                  <span className="text-emerald-500 font-bold animate-pulse">100%</span>
                </div>
              </div>

              
              {/* Action buttons (Stacked) */}
              <div className="flex flex-col gap-2 mt-2">
                {chapters.length > 0 && (
                  <button 
                    onClick={() => navigate(`/doc/${actualStoryId}/${chapters[0].id}`)}
                    className="w-full py-3 bg-[#9a858d] hover:bg-[#d4c6c9] text-[#060406] font-bold font-mono text-sm tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(154,133,141,0.2)] hover:shadow-[0_0_25px_rgba(154,133,141,0.5)] flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> BẮT ĐẦU
                  </button>
                )}

                {story.externalUrl && (
                  <button 
                    onClick={() => window.open(story.externalUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full py-3 font-bold font-mono text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 border border-[#645a6c] text-[#d4c6c9] hover:border-[#9a858d] hover:bg-[#9a858d]/10"
                  >
                    <ExternalLink className="w-4 h-4" /> TRUY CẬP MÁY CHỦ GỐC
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleSaveToggle}
                    className={`py-2 font-bold font-mono text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-1 border ${
                      isSaved 
                        ? 'border-[#9a858d] text-[#9a858d] bg-[#9a858d]/10' 
                        : 'border-[#645a6c] text-[#645a6c] hover:border-[#d4c6c9] hover:text-[#d4c6c9]'
                    }`}
                  >
                    <Bookmark className="w-3 h-3" /> {isSaved ? 'ĐÃ ĐỒNG BỘ' : 'ĐỒNG BỘ'}
                  </button>

                  <button 
                    onClick={() => setShowGiftModal(true)}
                    className="py-2 font-bold font-mono text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-1 border border-[#645a6c] text-[#d4c6c9] hover:border-[#9a858d] hover:bg-[#9a858d]/10"
                  >
                    <Gift className="w-3 h-3" /> TIẾP TẾ
                  </button>
                </div>
              </div>
            </div>

            {/* MIDDLE COLUMN: INFO & DESC (Span 5) */}
            <div className="lg:col-span-5 relative"><div className="static lg:absolute inset-0 flex flex-col font-mono h-auto lg:h-full w-full">
              <h1 className="text-2xl md:text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#d4c6c9] to-[#9a858d] leading-tight tracking-wider mb-2 drop-shadow-[0_0_10px_rgba(154,133,141,0.3)]">
                {story.title}
              </h1>
              <div className="flex items-center gap-2 text-[#9a858d] mb-4 font-mono text-sm tracking-widest uppercase border-b border-[#9a858d]/20 pb-4">
                <User className="w-4 h-4" /> {story.author || 'Đang cập nhật'}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {story.genres && story.genres.length > 0 ? (
                  story.genres.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest border border-[#645a6c]/50 bg-[#060406]/80 text-[#9a858d]">
                      {tag}
                    </span>
                  ))
                ) : (
                  ['Cả đôi đều mạnh', 'Game online', 'Truyện sướng', 'Thực tế ảo'].map((tag, i) => (
                    <span key={i} className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest border border-[#645a6c]/50 bg-[#060406]/80 text-[#9a858d]">
                      {tag}
                    </span>
                  ))
                )}
              </div>

              {/* Description box */}
              <div className="relative border border-[#645a6c]/30 bg-[#060406]/60 p-4 flex-1 flex flex-col min-h-0">
                <div className="text-[#9a858d] font-bold border-b border-[#645a6c]/30 pb-2 mb-3 text-xs tracking-widest uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> TRÍCH XUẤT DỮ LIỆU
                </div>
                <div className="overflow-y-auto pr-2 custom-scrollbar text-[13px] md:text-sm leading-relaxed text-[#d4c6c9]/80 font-space text-justify space-y-2 flex-1 min-h-0">
                  {story.description ? story.description.split('\n').map((line, i) => <p key={i}>{line}</p>) : <p>Dữ liệu truyện Thần Thụ đang nạp trực tuyến... Bước vào thế giới thực tế ảo cùng những pha thao tác thần sầu và bước nhảy cấp đầy sảng khoái.</p>}
                </div>
              </div>
            </div>
            </div>

            {/* RIGHT COLUMN: PLAYERS & RECOMMENDATIONS (Span 4) */}
            <div className="lg:col-span-4 relative"><div className="static lg:absolute inset-0 flex flex-col gap-4 font-mono h-auto lg:h-full w-full">
              
              {/* Player 1 */}
              <div className="border border-[#645a6c]/30 bg-[#060406]/60 p-3 relative overflow-hidden group hover:border-[#9a858d]/50 transition-colors">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#9a858d]/10 to-transparent pointer-events-none"></div>
                <div className="text-[#9a858d] font-bold border-b border-[#645a6c]/30 pb-1 mb-2 text-xs flex justify-between tracking-widest uppercase">
                  <span className="flex items-center gap-2"><Sword className="w-3 h-3"/> 1. Chu Tùy - thụ</span>
                  <span className="text-[9px] opacity-50 bg-[#9a858d]/20 px-1 py-0.5">PLAYER 1</span>
                </div>
                <div className="flex flex-col gap-1 text-[10px]">
                  <div className="text-[#d4c6c9] flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#d4c6c9]"></div> Sinh viên</div>
                  <div className="text-[#d4c6c9] flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#d4c6c9]"></div> ID: <span className="text-emerald-400 font-bold">[Chu Phi Nhục Thủy]</span></div>
                  <div className="text-[#645a6c] mt-1 pl-3 border-l-2 border-[#645a6c]/30 py-0.5">DPS bạo lực</div>
                  <div className="text-[#645a6c] pl-3 border-l-2 border-[#645a6c]/30 py-0.5">Thiên tài thao tác</div>
                  <div className="text-[#645a6c] pl-3 border-l-2 border-[#645a6c]/30 py-0.5">Healer sát thủ</div>
                </div>
              </div>

              {/* Player 2 */}
              <div className="border border-[#645a6c]/30 bg-[#060406]/60 p-3 relative overflow-hidden group hover:border-[#9a858d]/50 transition-colors">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#9a858d]/10 to-transparent pointer-events-none"></div>
                <div className="text-[#9a858d] font-bold border-b border-[#645a6c]/30 pb-1 mb-2 text-xs flex justify-between tracking-widest uppercase">
                  <span className="flex items-center gap-2"><Shield className="w-3 h-3"/> 2. Quý Tê Nguyên - công</span>
                  <span className="text-[9px] opacity-50 bg-[#9a858d]/20 px-1 py-0.5">PLAYER 2</span>
                </div>
                <div className="flex flex-col gap-1 text-[10px]">
                  <div className="text-[#d4c6c9] flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#d4c6c9]"></div> Bác sĩ</div>
                  <div className="text-[#d4c6c9] flex flex-wrap items-center gap-x-2 gap-y-1"><div className="w-1 h-1 rounded-full bg-[#d4c6c9]"></div> ID: <span className="text-emerald-400 font-bold">[Nhất Độ Âm Dương]</span> <span className="text-emerald-400 font-bold">[Bé Thỏ Con 123]</span></div>
                  <div className="text-[#645a6c] mt-1 pl-3 border-l-2 border-[#645a6c]/30 py-0.5">Phái kỹ thuật đỉnh cao</div>
                  <div className="text-[#645a6c] pl-3 border-l-2 border-[#645a6c]/30 py-0.5">Healer</div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="border border-[#645a6c]/30 bg-[#060406]/60 p-3 flex-1 flex flex-col min-h-0 relative group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#9a858d]/5 to-transparent pointer-events-none"></div>
                <div className="text-[#9a858d] font-bold border-b border-[#645a6c]/30 pb-2 mb-2 text-xs tracking-widest uppercase flex items-center gap-2">
                  <BookOpen className="w-3 h-3" /> HỒ SƠ TƯƠNG ĐỒNG
                </div>
                <div className="text-[#d4c6c9]/80 font-space text-xs italic leading-relaxed text-justify overflow-y-auto pr-2 custom-scrollbar space-y-2 flex-1 min-h-0">
                  {(story as any).recommendations ? (story as any).recommendations.split('\n').map((line: string, i: number) => line.trim() ? <p key={i} className="mb-3">{line}</p> : null) : <p>(Chưa có dữ liệu. Vui lòng cập nhật thêm từ hệ thống trung tâm.)</p>}
                </div>
              </div>

            </div>
            </div>

          </div>
        </div>
        </div>
        
        {/* BẢN ĐỒ HÀNH TRÌNH PHÓ BẢN THẦN THỤ */}
        <div className="flex flex-col relative">
          
          <div className="border border-[#9a858d]/30 bg-[#060406]/80 p-6 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#9a858d]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#9a858d]" />
          
          <div className="flex items-center gap-3 mb-6 font-mono text-lg font-black text-[#d4c6c9] tracking-widest uppercase border-b border-[#645a6c]/30 pb-3">
            <Sword className="w-6 h-6 text-[#9a858d]" /> BẢN ĐỒ KHU VỰC THẦN THỤ
          </div>
          
          <p className="text-xs font-mono text-[#645a6c] mb-6">
            *Người chơi đã mở khóa các khu vực dưới đây. Nhấp vào khu vực để dò tọa độ dữ liệu.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {dungeons.map((dun, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDungeon(idx === selectedDungeon ? null : idx)}
                className={`relative p-3 text-left border transition-all duration-300 overflow-hidden group flex flex-col gap-1 ${
                  selectedDungeon === idx 
                    ? 'border-[#9a858d] bg-[#9a858d]/20 shadow-[0_0_15px_rgba(154,133,141,0.2)]' 
                    : 'border-[#645a6c]/40 bg-[#060406] hover:border-[#9a858d]/60 hover:bg-[#34282d]/30'
                }`}
              >
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-l-[10px] border-t-[#9a858d] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-[9px] font-mono font-black text-[#9a858d] uppercase tracking-widest">
                  ZONE {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </span>
                <span className="line-clamp-2 w-full font-space font-bold text-xs text-[#d4c6c9] leading-tight">
                  {dun.name}
                </span>
              </button>
            ))}
          </div>

          {/* Dungeon details monitor */}
          <div className="mt-6 p-5 bg-[#060406] border border-[#9a858d]/40 relative font-mono text-sm">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#9a858d]" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#9a858d]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#9a858d]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#9a858d]" />

            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="text-[#9a858d] font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-5 h-5" /> 
                  {selectedDungeon !== null ? dungeons[selectedDungeon].name : "MÁY QUÉT DỮ LIỆU KHU VỰC"}
                </div>
                <p className="text-[#d4c6c9]/70 font-space text-sm">
                  {selectedDungeon !== null 
                    ? (dungeons[selectedDungeon].desc.startsWith("Chương") ? "" : dungeons[selectedDungeon].desc) 
                    : "Chọn khu vực bên trên để truy xuất thông tin hành trình."}
                </p>
              </div>
              {selectedDungeon !== null && (
                <div className="shrink-0 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-[#645a6c]/40 pt-4 md:pt-0 md:pl-6 text-xs justify-center">
                  <div className="flex justify-between md:justify-start gap-4">
                    <span className="text-[#645a6c]">Độ khó:</span>
                    <span className="text-[#9a858d] font-bold uppercase">{dungeons[selectedDungeon].diff}</span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4">
                    <span className="text-[#645a6c]">Boss:</span>
                    <span className="text-[#d4c6c9] font-bold">{dungeons[selectedDungeon].boss}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-[10px] font-mono text-[#9a858d] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9a858d] animate-pulse"></span>
              <span>HUD LOG: {interfaceLog}</span>
            </div>

            {/* Chapters for selected dungeon */}
            {selectedDungeon !== null && (
              <div className="mt-6 pt-6 border-t border-[#645a6c]/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {chapters.filter(chap => {
                    const match = chap.title.match(/(\d+)/);
                    const chapNum = match ? parseInt(match[1], 10) : 0;
                    return chapNum >= dungeons[selectedDungeon].min && chapNum <= dungeons[selectedDungeon].max;
                  }).map((chap, idx) => (
                    <button
                      key={chap.id}
                      onClick={() => navigate(`/doc/${actualStoryId}/${chap.id}`)}
                      className="group relative p-3 border border-[#645a6c]/40 bg-[#060406] hover:border-[#9a858d] hover:bg-[#9a858d]/10 transition-all text-left flex flex-col gap-1 cursor-pointer overflow-hidden"
                    >
                      {/* Scanline hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#9a858d]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#9a858d]">
                        STAGE {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-[#d4c6c9] group-hover:text-white line-clamp-1 font-mono">
                        {chap.title}
                      </span>
                    </button>
                  ))}
                  {chapters.filter(chap => {
                    const match = chap.title.match(/(\d+)/);
                    const chapNum = match ? parseInt(match[1], 10) : 0;
                    return chapNum >= dungeons[selectedDungeon].min && chapNum <= dungeons[selectedDungeon].max;
                  }).length === 0 && (
                    <p className="col-span-1 sm:col-span-2 md:col-span-3 text-center text-[11px] text-[#645a6c] font-mono italic py-4">
                      Dữ liệu phân đoạn này chưa được cập nhật...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* KÊNH THẾ GIỚI (COMMENTS) */}
        <div className="mt-4 border border-[#9a858d]/30 bg-[#060406]/80 p-6 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#9a858d]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#9a858d]" />
          
          <div className="flex flex-col gap-6">
            <h3 className="font-extrabold text-sm md:text-base uppercase tracking-widest flex items-center gap-2 text-[#d4c6c9] font-mono border-b border-[#645a6c]/30 pb-3">
              <Terminal className="w-5 h-5 text-[#9a858d]" /> KÊNH THẾ GIỚI
            </h3>

            {/* SYSTEM CHAT INPUT */}
            <div className="border border-[#645a6c]/40 p-4 bg-[#060406] flex flex-col gap-4 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#9a858d]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#9a858d]" />
              
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Gửi tin nhắn lên kênh thế giới của Người chơi..."
                rows={3}
                className="w-full p-3 border border-[#645a6c]/40 bg-[#060406] text-[#d4c6c9] placeholder-[#645a6c] focus:outline-none focus:border-[#9a858d] text-xs sm:text-sm resize-none font-mono transition-all"
              />
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-[#645a6c] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isLoggedIn ? "> LOG: SẴN SÀNG PHÁT TIN" : "> LOG: YÊU CẦU ĐĂNG NHẬP"}
                </span>
                <button 
                  onClick={handleSendComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="px-6 py-2.5 text-xs font-bold font-mono tracking-widest bg-[#9a858d] hover:bg-[#d4c6c9] text-[#060406] disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  PHÁT TIN <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CHAT MESSAGES FEED */}
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#645a6c]/40 bg-[#060406] text-[#645a6c] font-mono">
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
                      className={`relative p-4 border transition-all duration-300 ${
                        isGift 
                          ? 'bg-[#34282d]/20 border-[#9a858d]/50 shadow-[0_0_15px_rgba(154,133,141,0.05)]' 
                          : 'bg-[#060406] border-[#645a6c]/40 hover:border-[#9a858d]/60'
                      } ${currentSticker ? 'pr-16' : ''}`}
                    >
                      {currentSticker && (
                        <img 
                          src={currentSticker} 
                          alt="Sticker" 
                          className="absolute w-12 h-12 object-contain pointer-events-none z-10 right-3 top-1/2 -translate-y-1/2 drop-shadow-md" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="flex items-start gap-4 relative z-10">
                        <UserAvatar 
                          avatarUrl={avatar} 
                          equippedAccessory={cacheUser.equippedAccessory || comment.equippedAccessory} 
                          accessoryPosition={cacheUser.accessoryPosition || comment.accessoryPosition} 
                          className="w-10 h-10 shrink-0 border border-[#645a6c]/60 rounded-none bg-[#34282d]/50" 
                          fallbackIconSizeClass="w-5 h-5 text-[#645a6c]" 
                        />
                        <div className="flex-1 min-w-0 font-mono">
                          <div className="flex items-center gap-3 flex-wrap mb-2 border-b border-[#645a6c]/20 pb-2">
                            <span className="font-bold text-sm text-[#d4c6c9]">
                              {dName}
                            </span>
                            {customTitle && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-[#34282d]/60 text-[#9a858d] border border-[#9a858d]/40">
                                {customTitle.name || customTitle}
                              </span>
                            )}
                            <span className="text-[10px] text-[#645a6c] ml-auto">
                              {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yy HH:mm') : 'MỚI'}
                            </span>
                          </div>

                          {isGift && (
                            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold max-w-max border border-[#9a858d]/60 bg-[#9a858d]/10 text-[#9a858d]">
                              <Award className="w-4 h-4" /> TIẾP TẾ DROP: {comment.giftAmount} CC
                            </div>
                          )}

                          <p className="text-sm font-space text-[#d4c6c9]/90 leading-relaxed text-justify">
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
        <div className="fixed inset-0 bg-[#060406]/95 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md p-8 relative border border-[#9a858d] bg-[#060406] shadow-[0_0_50px_rgba(154,133,141,0.2)]">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#9a858d]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#9a858d]" />
            
            <h3 className="text-xl font-black font-mono mb-2 uppercase tracking-widest flex items-center gap-3 text-[#d4c6c9] border-b border-[#9a858d]/30 pb-4">
              <Sparkles className="w-6 h-6 text-[#9a858d]" /> TIẾP TẾ KHU VỰC
            </h3>
            
            <p className="text-sm mb-6 mt-4 font-mono text-[#645a6c] leading-relaxed">
              Trang bị thêm vũ khí và năng lượng hỗ trợ Người chơi sinh tồn và tăng cấp bão táp trong Thần Thụ.
            </p>
            
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-mono font-bold mb-2 uppercase flex items-center gap-2 text-[#9a858d]">
                  <Gift className="w-4 h-4" /> CHỌN CC TIẾP TẾ (SỐ DƯ: {choco} CC)
                </label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full border border-[#645a6c]/60 p-3 text-sm font-mono font-bold focus:outline-none focus:border-[#9a858d] bg-[#060406] text-[#d4c6c9] transition-colors"
                  min="1"
                />
              </div>
              
              <div>
                <label className="text-xs font-mono font-bold mb-2 uppercase flex items-center gap-2 text-[#9a858d]">
                  <Terminal className="w-4 h-4" /> LỜI NHẮN HỆ THỐNG
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Thần Thụ vĩ đại, cầu xin thả boss phó bản ra nhẹ tay..."
                  rows={3}
                  className="w-full border border-[#645a6c]/60 p-3 text-sm font-space focus:outline-none focus:border-[#9a858d] bg-[#060406] text-[#d4c6c9] resize-none transition-colors"
                />
              </div>
              
              <div className="flex gap-4 pt-4 mt-2 border-t border-[#645a6c]/30">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 py-3 text-sm font-bold font-mono uppercase border border-[#645a6c] text-[#645a6c] hover:border-[#d4c6c9] hover:text-[#d4c6c9] transition-colors"
                >
                  HỦY BỎ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="flex-1 py-3 text-sm font-bold font-mono uppercase bg-[#9a858d] text-[#060406] hover:bg-[#d4c6c9] transition-colors shadow-[0_0_15px_rgba(154,133,141,0.3)]"
                >
                  GỬI CC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

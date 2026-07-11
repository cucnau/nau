import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, ExternalLink, ChevronRight, Users, MessageSquare, Heart, Sparkles, ArrowLeft, Award, ShieldAlert, Book, Compass } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

export function ThaiTuNghinNamTheme(props: ThemeProps) {
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

  // Grouping chapters by "Quyển" (Volume) - 30 chapters per Volume
  const CHAPTERS_PER_VOLUME = 30;
  const totalVolumes = Math.ceil(chapters.length / CHAPTERS_PER_VOLUME) || 1;
  const [selectedVolume, setSelectedVolume] = useState(0);

  // Sort chapters first
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = a.orderIndex !== undefined ? a.orderIndex : parseFloat(a.title?.match(/\d+/)?.[0] || '0');
    const bNum = b.orderIndex !== undefined ? b.orderIndex : parseFloat(b.title?.match(/\d+/)?.[0] || '0');
    return chapterSortDesc ? bNum - aNum : aNum - bNum;
  });

  // Get chapters belonging to the currently selected Volume
  const volumeChapters = sortedChapters.slice(
    selectedVolume * CHAPTERS_PER_VOLUME,
    (selectedVolume + 1) * CHAPTERS_PER_VOLUME
  );

  return (
    <div className="bg-[#1b1715] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#473a36]/50 via-[#1b1715] to-[#1b1715] min-h-screen text-[#d7cac1] font-serif selection:bg-[#741611] selection:text-[#d7cac1] pb-24 relative overflow-x-hidden">
      
      {/* Background Royal Seal Motif decoration */}
      <div className="absolute top-36 left-0 right-0 h-[500px] pointer-events-none opacity-[0.03] flex justify-between px-16 select-none">
        <svg className="w-80 h-80" viewBox="0 0 100 100" fill="none" stroke="#d7cac1" strokeWidth="0.5">
          <circle cx="50" cy="50" r="46" />
          <path d="M 50 4 L 96 50 L 50 96 L 4 50 Z" />
          <rect x="25" y="25" width="50" height="50" strokeDasharray="2,2" />
          <circle cx="50" cy="50" r="20" />
        </svg>
        <svg className="w-80 h-80 transform rotate-45" viewBox="0 0 100 100" fill="none" stroke="#d7cac1" strokeWidth="0.5">
          <circle cx="50" cy="50" r="46" />
          <rect x="15" y="15" width="70" height="70" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      {/* STICKY TOP COURT BAR */}
      <div className="border-b-2 border-[#741611]/60 bg-gradient-to-r from-[#1b1715] via-[#473a36] to-[#1b1715] px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#741611]/15 hover:bg-[#741611]/30 text-[#d7cac1] text-xs font-sans font-bold tracking-[0.15em] border border-[#741611]/40 transition-all cursor-pointer group uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>LUI TRIỀU</span>
        </button>

        <div className="flex items-center gap-2 select-none">
          <div className="w-2 h-2 rounded-full bg-[#741611] animate-ping" />
          <span className="font-sans text-[10px] tracking-[0.25em] text-[#8c7b72] font-black uppercase hidden sm:inline">皇子復仇記 // THÁI TỬ NGỰ KIỆN</span>
        </div>

        <div className="text-right">
          <span className="font-sans text-[9px] tracking-[0.1em] text-[#8c7b72] uppercase font-bold">HOÀNG ĐỒ NGHIÊM CHỈNH</span>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto p-4 md:p-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PROFILE PANEL */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Main Book Emblem Frame */}
          <div className="border-2 border-[#473a36] bg-[#221c19]/80 p-4 rounded-xl relative overflow-hidden shadow-2xl flex flex-col items-center">
            {/* Elegant corner flourishes */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#741611]" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#741611]" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#741611]" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#741611]" />
            
            <div className="relative w-48 md:w-full max-w-[240px] aspect-[2/3] bg-[#1b1715] overflow-hidden border border-[#473a36] rounded-lg shadow-xl mb-4 group">
              <img 
                src={story.coverUrl || 'https://via.placeholder.com/400x600'} 
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b1715]/90 via-transparent to-transparent opacity-60" />
            </div>

            <div className="text-center w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#741611]/15 border border-[#741611]/50 text-[#d7cac1] text-[10px] font-sans font-bold tracking-[0.2em] mb-3 uppercase rounded">
                <Award className="w-3.5 h-3.5 text-[#741611]" />
                {story.completed ? 'VĨNH KẾT HOÀNG TRIỀU' : 'ĐANG CHẤP BÚT'}
              </div>
              <h1 className="text-2xl font-black text-[#d7cac1] tracking-wide mb-1 leading-snug">
                {story.title}
              </h1>
              <p className="text-xs text-[#8c7b72] tracking-[0.15em] uppercase font-sans font-bold italic mb-2">
                Ngự bút: {story.author}
              </p>
            </div>
          </div>

          {/* Stats card */}
          <div className="border border-[#473a36] bg-[#221c19]/60 p-5 rounded-xl">
            <h3 className="text-[11px] font-sans font-black tracking-[0.2em] text-[#8c7b72] uppercase mb-4 flex items-center gap-2 select-none border-b border-[#473a36]/50 pb-2">
              <Compass className="w-4 h-4 text-[#741611]" /> KHẢO QUYỂN TRIỀU ĐÌNH
            </h3>
            <div className="grid grid-cols-2 gap-3 font-sans">
              <div className="bg-[#1b1715]/80 border border-[#473a36]/40 p-3 text-center rounded">
                <span className="block text-[#d7cac1] text-lg font-black">{chapters.length}</span>
                <span className="text-[9px] text-[#8c7b72] font-black uppercase tracking-wider">CHƯƠNG TIẾT</span>
              </div>
              <div className="bg-[#1b1715]/80 border border-[#473a36]/40 p-3 text-center rounded">
                <span className="block text-[#d7cac1] text-lg font-black">
                  {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}
                </span>
                <span className="text-[9px] text-[#8c7b72] font-black uppercase tracking-wider">THƯỞNG DUYỆT</span>
              </div>
              <div className="bg-[#1b1715]/80 border border-[#473a36]/40 p-3 text-center col-span-2 rounded">
                <span className="block text-[#741611] text-lg font-black">{totalGiftedChoco} Choco</span>
                <span className="text-[9px] text-[#8c7b72] font-black uppercase tracking-wider">CỐNG PHẨM QUÂN VƯƠNG</span>
              </div>
            </div>
          </div>

          {/* Verification / Blood Lineage Plot Widget */}
          <div className="border border-[#741611]/40 bg-[#741611]/5 p-5 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#741611]/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-[11px] font-sans font-black tracking-[0.2em] text-[#741611] uppercase mb-2 flex items-center gap-2 select-none">
              <ShieldAlert className="w-4 h-4" /> NGHIỆM MINH THÂN PHẬN
            </h3>
            <p className="text-xs text-[#8c7b72] leading-relaxed mb-3">
              Mật bản ghi chép chi tiết về cuộc tráo đổi hoàng tộc. Thụ tôn quý là Thái tử thật bị đẩy ra chốn gian truân, sống lại thề quy hồi bảo tọa, trừng phạt kẻ giả mạo.
            </p>
            <div className="border border-[#473a36] bg-[#1b1715]/90 p-3 rounded text-[11px] leading-relaxed font-serif text-[#d7cac1]/80 italic">
              "Máu đỏ nhỏ vào giọt nước trong, cốt nhục tương liên tất hòa một. Gian xảo đánh tráo nghìn năm, nay linh hồn quy bặc lập hoàng triều."
            </div>
          </div>

          {/* Quick Read Buttons */}
          <div className="flex flex-col gap-2">
            {chapters.length > 0 && (
              <button 
                onClick={() => navigate(`/doc/${story.id}/${chapters[0].id}`)}
                className="w-full py-3 bg-[#741611] text-[#d7cac1] hover:bg-[#8e1d17] font-sans font-bold tracking-[0.15em] uppercase text-xs rounded transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" /> KHỞI QUYỂN ĐỌC NGAY
              </button>
            )}
            <button 
              onClick={handleSaveToggle}
              className={`w-full py-3 font-sans font-bold tracking-[0.15em] uppercase text-xs rounded border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                savedStories.includes(story.id) 
                  ? 'bg-[#473a36]/35 border-[#473a36] text-[#d7cac1]' 
                  : 'bg-transparent border-[#473a36] text-[#8c7b72] hover:text-[#d7cac1] hover:border-[#741611]/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={savedStories.includes(story.id) ? "currentColor" : "none"} />
              {savedStories.includes(story.id) ? 'ĐÃ LƯU TRÊN NGỰ ÁN' : 'LƯU LẠI TIẾN TRÌNH'}
            </button>
          </div>

        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Story Info Box */}
          <div className="border border-[#473a36] bg-[#221c19]/40 p-6 lg:p-8 rounded-xl relative">
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-10">
              {/* Decorative corner */}
              <svg viewBox="0 0 100 100" className="w-full h-full fill-[#d7cac1]">
                <path d="M 100,0 L 100,100 L 90,100 L 90,10 L 0,10 L 0,0 Z" />
              </svg>
            </div>

            {/* Genres Tag */}
            <div className="flex flex-wrap gap-2 mb-6">
              {story.genres?.map?.((g: string) => (
                <span 
                  key={g} 
                  className="bg-[#741611]/10 text-[#d7cac1] px-3 py-1 text-[10px] font-sans font-extrabold uppercase tracking-widest rounded border border-[#741611]/30"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Story Description */}
            <div className="mb-6">
              <h3 className="text-xs font-sans font-black tracking-[0.2em] text-[#741611] uppercase mb-3 select-none">
                ĐIỂN TÍCH KHỞI NGUYÊN
              </h3>
              <div className="text-[#d7cac1]/90 leading-relaxed text-[15px] space-y-4 whitespace-pre-line font-serif pr-2 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#741611 #221c19' }}>
                {story.description}
              </div>
            </div>

            {/* RECOMMENDED STORIES - KHẢI TẤU TIẾN CỬ */}
            {story.recommendations && (
              <div className="border-t border-[#473a36]/50 pt-5 mt-5">
                <h4 className="text-[11px] font-sans font-black tracking-[0.25em] text-[#741611] uppercase mb-3 flex items-center gap-1.5 select-none">
                  <Sparkles className="w-4 h-4 text-[#741611]" /> KHẢI TẤU TIẾN CỬ THƯ MỤC
                </h4>
                <div className="text-[13px] leading-relaxed text-[#d7cac1]/80 bg-[#1b1715]/80 p-4 rounded border border-[#473a36]/40 whitespace-pre-line font-serif italic relative">
                  <div className="absolute top-2 right-2 text-[#741611]/20 font-sans text-4xl select-none font-bold">薦</div>
                  {story.recommendations}
                </div>
              </div>
            )}
          </div>

          {/* IMMERSIVE CHARACTER DOSSIERS */}
          <div className="border border-[#473a36] bg-[#221c19]/40 p-6 rounded-xl">
            <h3 className="text-[11px] font-sans font-black tracking-[0.2em] text-[#741611] uppercase mb-4 flex items-center gap-2 select-none border-b border-[#473a36]/50 pb-2">
              <Users className="w-4 h-4" /> TRỰC HỆ VƯƠNG TÔNG MẬT BẢN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1b1715]/70 border-l-4 border-[#741611] border-y border-r border-[#473a36]/30 rounded-r">
                <h4 className="font-bold text-[#d7cac1] text-sm mb-1">Thái Tử Thật (Trang Ngôn)</h4>
                <p className="text-[10px] font-sans text-[#8c7b72] uppercase tracking-wider mb-2 font-bold">Vị thế: Chân Mệnh Đế Vương</p>
                <p className="text-xs text-[#d7cac1]/80 leading-relaxed font-serif">
                  Hoàng mạch chân chính bị đánh tráo từ thuở lọt lòng, trải qua kiếp trước phong trần uất hận. Trùng sinh trở lại, y khoác lên mình dáng vẻ điềm đạm ngọc thụ, nhưng ẩn sâu là mưu lược trùng trùng nhằm đoạt lại bảo tọa và đòi nợ máu.
                </p>
              </div>
              <div className="p-4 bg-[#1b1715]/70 border-l-4 border-[#8c7b72] border-y border-r border-[#473a36]/30 rounded-r">
                <h4 className="font-bold text-[#d7cac1] text-sm mb-1">Thiếu Tướng Quân</h4>
                <p className="text-[10px] font-sans text-[#8c7b72] uppercase tracking-wider mb-2 font-bold">Vị thế: Trụ cột Triều Đình</p>
                <p className="text-xs text-[#d7cac1]/80 leading-relaxed font-serif">
                  Vị tướng quân trẻ tuổi kiêu dũng thiện chiến, uy trấn phương xa. Chàng chính là thanh kiếm hộ mệnh kiên định nhất, vì Thái tử mà dẹp loạn vương đình, lập đại công thế trị và đồng hành trọn đời.
                </p>
              </div>
            </div>
          </div>

          {/* TABS SELECTOR (CHAPTERS & COMMENTS) */}
          <div className="flex border-b border-[#473a36] bg-[#1b1715]/40 rounded-t-lg overflow-hidden select-none">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex-1 py-3 font-sans font-black text-xs uppercase tracking-[0.2em] relative transition-all duration-300 ${
                activeTab === 'chapters' ? 'text-[#741611] bg-[#221c19]/60' : 'text-[#8c7b72] hover:text-[#d7cac1] bg-transparent'
              }`}
            >
              CHƯƠNG TIẾT SÁCH VĂN ({chapters.length})
              {activeTab === 'chapters' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#741611] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-3 font-sans font-black text-xs uppercase tracking-[0.2em] relative transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'comments' ? 'text-[#741611] bg-[#221c19]/60' : 'text-[#8c7b72] hover:text-[#d7cac1] bg-transparent'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> TẤU CHƯƠNG ĐÀM LUẬN ({comments.length})
              {activeTab === 'comments' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#741611] rounded-t-full" />
              )}
            </button>
          </div>

          {/* RENDER ACTIVE TAB */}
          <div className="border-x border-b border-[#473a36] bg-[#221c19]/20 p-5 rounded-b-xl">
            
            {activeTab === 'chapters' ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                
                {/* DYNAMIC VOLUME TABS SELECTOR (ANTI LONG SCROLL) */}
                {totalVolumes > 1 && (
                  <div className="flex flex-wrap gap-2 pb-4 border-b border-[#473a36]/30 select-none">
                    <span className="text-[10px] font-sans font-black uppercase text-[#8c7b72] self-center tracking-wider mr-2">
                      CHỌN QUYỂN CHƯƠNG:
                    </span>
                    {Array.from({ length: totalVolumes }).map((_, vIdx) => {
                      const startChap = vIdx * CHAPTERS_PER_VOLUME + 1;
                      const endChap = Math.min((vIdx + 1) * CHAPTERS_PER_VOLUME, chapters.length);
                      return (
                        <button
                          key={vIdx}
                          onClick={() => setSelectedVolume(vIdx)}
                          className={`px-3 py-1 text-[10px] font-sans font-bold uppercase rounded border transition-all duration-200 ${
                            selectedVolume === vIdx
                              ? 'bg-[#741611] border-[#741611] text-[#d7cac1]'
                              : 'bg-[#1b1715]/65 border-[#473a36]/50 text-[#8c7b72] hover:text-[#d7cac1] hover:border-[#741611]/60'
                          }`}
                        >
                          Quyển {vIdx + 1} ({startChap} - {endChap})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Chapters list grid inside current selected Volume */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#741611 #1b1715' }}>
                  {volumeChapters.length > 0 ? (
                    volumeChapters.map((chap, i) => {
                      const absoluteIndex = (selectedVolume * CHAPTERS_PER_VOLUME) + i + 1;
                      const recordCode = `HS-TT-${absoluteIndex.toString().padStart(3, '0')}`;
                      return (
                        <div 
                          key={chap.id} 
                          onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                          className="bg-[#1b1715]/70 border border-[#473a36]/40 hover:border-[#741611] p-4 flex flex-col justify-between cursor-pointer group transition-all duration-300 rounded-lg relative"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-[#8c7b72] group-hover:text-[#741611] transition-colors uppercase">
                              {recordCode}
                            </span>
                            <span className="px-1.5 py-0.5 border border-[#473a36]/30 bg-[#473a36]/10 rounded text-[8px] font-sans font-semibold text-[#8c7b72] group-hover:text-[#d7cac1] transition-colors">
                              MẬT KHẢO
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-[#d7cac1] group-hover:text-white line-clamp-2 leading-snug mb-3 transition-colors">
                            {chap.title}
                          </h4>

                          <div className="flex items-center justify-between pt-2 border-t border-[#473a36]/20">
                            <span className="text-[9px] text-[#8c7b72] font-sans uppercase tracking-wider group-hover:text-[#d7cac1]/70 transition-colors">
                              BẢN IN SÁCH VĂN
                            </span>
                            <span className="text-[9px] font-sans font-black uppercase tracking-wider text-[#741611] group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-0.5">
                              KHAI QUYỂN <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-10 font-serif text-[#8c7b72] italic text-sm">
                      Sách văn chương tiết chưa được ban hành.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                {/* Gifting Section */}
                <div className="border border-[#741611]/30 bg-[#741611]/5 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#741611]/15 rounded-full flex items-center justify-center text-[#741611]">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#d7cac1] text-xs uppercase tracking-wider">CỐNG HIẾN TẬP PHIẾU CHƯƠNG</h4>
                      <p className="text-[11px] text-[#8c7b72]">Gửi tặng Choco tiếp thêm động lực cho vị diện ngự bút.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGiftModal(true)}
                    className="px-4 py-2 bg-[#741611] text-[#d7cac1] hover:bg-[#8e1d17] text-[10px] font-sans font-black uppercase tracking-wider rounded transition-all duration-300 cursor-pointer"
                  >
                    DÂNG CỐNG PHẨM
                  </button>
                </div>

                {/* Submitting comments */}
                <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                  <h4 className="text-[11px] font-sans font-black tracking-[0.15em] text-[#8c7b72] uppercase select-none">
                    DÂNG SÁCH TẤU ĐÀM LUẬN
                  </h4>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={isLoggedIn ? "Nhập mật nghị, tấu văn đóng góp ý kiến..." : "Đăng nhập để dâng tấu văn thảo luận..."}
                    disabled={!isLoggedIn}
                    className="w-full p-3.5 rounded bg-[#1b1715]/90 border border-[#473a36] focus:border-[#741611] text-[#d7cac1] text-sm outline-none font-serif min-h-[90px] resize-none transition-all"
                  />
                  <div className="flex justify-end select-none">
                    <button
                      type="submit"
                      disabled={!isLoggedIn || !commentText.trim() || submittingComment}
                      className="px-5 py-2 bg-[#741611] text-[#d7cac1] hover:bg-[#8e1d17] disabled:bg-[#473a36]/30 disabled:text-[#8c7b72] border border-[#741611] text-[10px] font-sans font-black uppercase tracking-wider rounded transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                    >
                      DÂNG TẤU <Send className="w-3 h-3" />
                    </button>
                  </div>
                </form>

                {/* Comments feed */}
                <div className="space-y-4 pt-4 border-t border-[#473a36]/40 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#741611 #1b1715' }}>
                  {comments.length > 0 ? (
                    comments.map((comm) => {
                      const commDisplayName = profilesCache[comm.uid]?.displayName || comm.displayName || "Triều Thần Ẩn Danh";
                      const commAvatarUrl = profilesCache[comm.uid]?.avatarUrl || comm.avatarUrl;
                      const activeTitle = profilesCache[comm.uid]?.activeTitle;
                      
                      return (
                        <div key={comm.id} className="p-4 bg-[#1b1715]/80 border border-[#473a36]/30 rounded flex gap-3 relative">
                          <UserAvatar 
                            avatarUrl={commAvatarUrl} 
                            equippedAccessory={profilesCache[comm.uid]?.equippedAccessory || comm.equippedAccessory}
                            accessoryPosition={profilesCache[comm.uid]?.accessoryPosition || comm.accessoryPosition}
                            className="w-9 h-9 border border-[#473a36]" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1 select-none">
                              <span className="font-sans font-black text-xs text-[#d7cac1] hover:text-[#741611] transition-colors">
                                {commDisplayName}
                              </span>
                              <span className="text-[9px] font-sans text-[#8c7b72] font-semibold uppercase">
                                {comm.createdAt?.seconds ? format(new Date(comm.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : 'VỪA XONG'}
                              </span>
                            </div>

                            {activeTitle && (
                              <div className="mb-2 select-none">
                                <span className="text-[8px] font-sans font-black tracking-widest bg-[#741611]/25 text-[#d7cac1] border border-[#741611]/50 px-1.5 py-0.5 rounded uppercase">
                                  {activeTitle}
                                </span>
                              </div>
                            )}

                            {comm.type === 'choco_gift' ? (
                              <div className="mt-1 bg-[#741611]/10 border border-[#741611]/40 rounded-lg p-3 flex items-center gap-3 select-none">
                                <Gift className="w-4 h-4 text-[#741611]" />
                                <div className="text-xs">
                                  Đã dâng hiến cống vật quân vương <strong className="text-[#741611] font-bold">{comm.giftAmount} Choco</strong>
                                  {comm.giftMessage && <p className="italic text-[#8c7b72] mt-1">"{comm.giftMessage}"</p>}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm font-serif text-[#d7cac1]/90 leading-relaxed break-words whitespace-pre-wrap">
                                {comm.text}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 font-serif text-[#8c7b72] italic text-xs">
                      Án thư phẳng lặng, chưa có tấu chương thảo luận nào được dâng lên.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

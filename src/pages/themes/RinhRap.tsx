import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Scroll, Heart, ArrowLeft, Sparkles, Rabbit, Skull, Ghost, Gamepad2 } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

export const RinhRapTheme: React.FC<ThemeProps> = (props) => {
  const {
    story, actualStoryId, chapters, comments, activeTab, setActiveTab,
    chapterPage, setChapterPage, chapterSortDesc, setChapterSortDesc, CHAPTERS_PER_PAGE,
    showGiftModal, setShowGiftModal, giftAmount, setGiftAmount,
    giftMessage, setGiftMessage, handleGiftSubmit, commentText, setCommentText,
    submittingComment, handleSendComment, isLoggedIn, savedStories, handleSaveToggle, choco, navigate,
    profilesCache = {}, getTitleColor, uid
  } = props;

  const {
    equippedStickerComment, stickerPositionComment, displayName: storeDisplayName,
    avatarUrl: storeAvatarUrl, activeTitle: storeActiveTitle,
    equippedAccessory: storeEquippedAccessory, accessoryPosition: storeAccessoryPosition
  } = useStore();

  const totalGiftedChoco = comments.filter(c => c.type === 'choco_gift').reduce((acc, curr) => acc + (curr.giftAmount || 0), 0);
  const isSaved = (savedStories || []).includes(story.id);

  // Glitch effect state
  const [glitch, setGlitch] = useState(false);

  const triggerGlitch = () => {
    setGlitch(true);
    setTimeout(() => setGlitch(false), 300);
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-[#780606] selection:text-[#ffffff] pb-24 relative overflow-x-hidden transition-all duration-300 ${glitch ? 'bg-[#9c0800] text-[#000000]' : 'bg-[#000000] text-[#fff2f1]'}`}>
      
      {/* BACKGROUND GRAPHICS: CUTE BUT CREEPY */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
         {/* Subtle red tint at the bottom */}
         <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#780606] to-transparent mix-blend-multiply"></div>
         {/* Floating icons */}
         <Rabbit className="absolute top-[10%] left-[5%] w-32 h-32 text-[#fde0e0] opacity-10 animate-pulse" />
         <Skull className="absolute top-[30%] right-[10%] w-48 h-48 text-[#823323] opacity-5 -rotate-12" />
         <Ghost className="absolute bottom-[20%] left-[15%] w-24 h-24 text-[#facaca] opacity-10 rotate-12" />
      </div>

      {/* STICKY TOP BANNER */}
      <div className="border-b-4 border-dashed border-[#823323] bg-[#000000] px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_15px_rgba(120,6,6,0.4)]">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fde0e0] hover:bg-[#facaca] text-[#780606] text-xs font-black tracking-widest border-2 border-[#780606] transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>THOÁT GAME</span>
        </button>

        <div className="flex items-center justify-center gap-2 cursor-pointer group" onClick={triggerGlitch}>
          <Rabbit className={`w-6 h-6 transition-colors ${glitch ? 'text-[#ffffff]' : 'text-[#facaca]'}`} />
          <h2 className="font-black text-[#fff2f1] text-lg md:text-2xl tracking-[0.3em] uppercase drop-shadow-[0_0_8px_#780606]">
            RÌNH RẬP
          </h2>
          <Skull className={`w-5 h-5 transition-colors ${glitch ? 'text-[#ffffff]' : 'text-[#9c0800]'}`} />
        </div>

        <div className="w-[124px] hidden md:flex justify-end">
           <div className="flex gap-1">
             <div className="w-2 h-2 rounded-full bg-[#9c0800] animate-ping"></div>
             <div className="w-2 h-2 rounded-full bg-[#facaca] animate-pulse"></div>
           </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto p-4 md:p-8 relative z-10 flex flex-col gap-10 mt-8">
        
        {/* STORY PROFILE CARD */}
        <div className="flex flex-col md:flex-row gap-8 bg-[#000000] border-4 border-[#780606] rounded-[2rem] p-6 shadow-[8px_8px_0_0_#823323] relative overflow-hidden group">
          
          {/* Decorative Corner Tape */}
          <div className="absolute -top-6 -left-6 w-20 h-8 bg-[#facaca] rotate-45 border-y-2 border-dashed border-[#780606] opacity-80"></div>
          <div className="absolute -bottom-6 -right-6 w-20 h-8 bg-[#facaca] rotate-45 border-y-2 border-dashed border-[#780606] opacity-80"></div>

          {/* Cover Art */}
          <div className="w-full md:w-56 shrink-0 relative flex justify-center">
            <div className="relative w-48 h-64 md:w-full md:h-72 rounded-2xl overflow-hidden border-4 border-[#facaca] shadow-[0_0_20px_#9c0800]">
              <div className="absolute inset-0 bg-[#780606]/30 mix-blend-color-burn z-10 pointer-events-none group-hover:bg-transparent transition-all duration-700"></div>
              {story.coverImage ? (
                <img 
                  src={story.coverImage} 
                  alt={story.title} 
                  className="w-full h-full object-cover filter contrast-125 brightness-90 group-hover:brightness-110 group-hover:scale-105 transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full bg-[#823323] flex items-center justify-center">
                  <Rabbit className="w-20 h-20 text-[#000000] opacity-50" />
                </div>
              )}
              {/* Cute heart sticker overlay */}
              <div className="absolute bottom-2 right-2 bg-[#ffffff] p-1.5 rounded-full rotate-12 shadow-lg z-20">
                 <Heart className="w-5 h-5 text-[#9c0800] fill-[#facaca]" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <span className="px-3 py-1 bg-[#facaca] text-[#780606] rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-[#780606]">
                  VR GAME / SYSTEM
               </span>
               <span className="px-3 py-1 bg-[#000000] text-[#fde0e0] rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-[#fde0e0]">
                  CUTE x CREEPY
               </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-[#ffffff] uppercase tracking-tighter drop-shadow-[2px_2px_0_#9c0800]">
              {story.title}
            </h1>
            
            <div className="flex items-center gap-4 text-xs font-bold text-[#facaca]">
              <span className="flex items-center gap-1.5 bg-[#823323]/40 px-2 py-1 rounded-md border border-[#823323]">
                <Gamepad2 className="w-4 h-4" /> TRẠNG THÁI: {story.status === 'completed' ? 'HOÀN THÀNH' : 'ĐANG KẾT NỐI...'}
              </span>
              <span className="flex items-center gap-1.5 bg-[#780606]/40 px-2 py-1 rounded-md border border-[#780606]">
                <BookOpen className="w-4 h-4" /> {chapters.length} MÀN CHƠI
              </span>
            </div>

            <p className="text-sm text-[#fff2f1] leading-relaxed font-medium bg-[#823323]/20 p-4 rounded-xl border border-[#780606] border-dashed text-justify">
              {story.description || "Hệ thống đang tải dữ liệu... Đừng nhìn ra sau lưng."}
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveToggle}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-black tracking-wider uppercase border-2 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                  isSaved 
                    ? 'bg-[#facaca] text-[#780606] border-[#780606] hover:bg-[#fde0e0]' 
                    : 'bg-[#9c0800] text-[#ffffff] border-[#780606] hover:bg-[#823323]'
                }`}
              >
                <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? 'Đã lưu file' : 'Lưu tiến trình'}
              </button>
              
              <button
                onClick={() => setShowGiftModal(true)}
                className="flex-1 py-3 px-4 bg-[#ffffff] text-[#000000] border-2 border-[#000000] hover:bg-[#facaca] hover:text-[#780606] hover:border-[#780606] rounded-xl text-sm font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#9c0800]"
              >
                <Gift className="w-5 h-5 text-[#9c0800]" />
                DONATE ITEM
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex justify-center mt-6">
           <div className="bg-[#823323]/30 p-1.5 rounded-full inline-flex border border-[#780606]">
             <button
                onClick={() => setActiveTab('chapters')}
                className={`px-6 py-2 rounded-full text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
                  activeTab === 'chapters' 
                    ? 'bg-[#facaca] text-[#780606] shadow-md' 
                    : 'text-[#facaca] hover:bg-[#780606]/50 hover:text-[#ffffff]'
                }`}
             >
                <Gamepad2 className="w-4 h-4" /> SELECT STAGE
             </button>
             <button
                onClick={() => setActiveTab('comments')}
                className={`px-6 py-2 rounded-full text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider ${
                  activeTab === 'comments' 
                    ? 'bg-[#facaca] text-[#780606] shadow-md' 
                    : 'text-[#facaca] hover:bg-[#780606]/50 hover:text-[#ffffff]'
                }`}
             >
                <Ghost className="w-4 h-4" /> SYSTEM CHAT
             </button>
           </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-[#000000] border-4 border-[#780606] rounded-3xl p-6 md:p-10 shadow-[8px_8px_0_0_#facaca] relative">
          
          {activeTab === 'chapters' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#780606] pb-4">
                <h3 className="font-black text-xl text-[#ffffff] uppercase flex items-center gap-2">
                  <Skull className="w-6 h-6 text-[#9c0800]" /> DANH SÁCH MÀN CHƠI
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {chapters.length === 0 ? (
                  <p className="text-[#facaca] col-span-2 text-center py-10 font-bold border-2 border-dashed border-[#823323] rounded-xl bg-[#780606]/10">
                    Chưa có màn chơi nào được tải lên...
                  </p>
                ) : (
                  chapters.slice(chapterPage * CHAPTERS_PER_PAGE, (chapterPage + 1) * CHAPTERS_PER_PAGE).map((chap, idx) => (
                    <button
                      key={chap.id}
                      onClick={() => navigate(`/story/${actualStoryId}/chapter/${chap.id}`)}
                      className="group relative bg-[#823323]/20 border-2 border-[#780606] p-4 rounded-2xl hover:bg-[#780606]/40 hover:border-[#facaca] transition-all text-left flex justify-between items-center overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(250,202,202,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col gap-1 pr-4">
                        <span className="text-[10px] font-black text-[#facaca] uppercase tracking-widest bg-[#000000] px-2 py-0.5 rounded-md inline-block w-max border border-[#780606]">
                          STAGE {chapterSortDesc ? chapters.length - (chapterPage * CHAPTERS_PER_PAGE) - idx : (chapterPage * CHAPTERS_PER_PAGE) + idx + 1}
                        </span>
                        <span className="text-[#ffffff] font-bold text-sm line-clamp-1 group-hover:text-[#facaca]">
                          {chap.title}
                        </span>
                      </div>
                      <Rabbit className="w-5 h-5 text-[#9c0800] group-hover:text-[#facaca] transition-colors relative z-10" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col gap-6">
              
              <div className="bg-[#780606]/20 border-2 border-dashed border-[#9c0800] p-4 rounded-2xl flex flex-col gap-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Nhập tín hiệu cầu cứu hoặc lời nhắn hệ thống..."
                  rows={3}
                  className="w-full bg-[#000000] text-[#ffffff] placeholder-[#823323] p-3 rounded-xl border-2 border-[#780606] focus:outline-none focus:border-[#facaca] text-sm resize-none font-medium"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#facaca] font-black uppercase tracking-wider">
                    {isLoggedIn ? "> Tín hiệu sẵn sàng" : "> Yêu cầu đăng nhập để phát tín hiệu"}
                  </span>
                  <button 
                    onClick={handleSendComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="px-5 py-2 bg-[#ffffff] hover:bg-[#facaca] text-[#000000] text-xs font-black tracking-widest rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 border-2 border-[#000000]"
                  >
                    PHÁT SÓNG <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-[#780606]/10 border-2 border-dashed border-[#823323] rounded-2xl text-center text-[#facaca] font-bold gap-3">
                    <Ghost className="w-8 h-8 text-[#9c0800] opacity-50" />
                    <p>Chưa có tín hiệu nào được bắt lại.</p>
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
                        className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                          isGift ? 'bg-[#facaca]/10 border-[#facaca]' : 'bg-[#000000] border-[#780606]'
                        } ${currentSticker ? 'pr-16' : ''}`}
                      >
                        {currentSticker && (
                          <img 
                            src={currentSticker} 
                            alt="Sticker" 
                            className="absolute w-14 h-14 object-contain pointer-events-none z-10 right-2 top-1/2 -translate-y-1/2 drop-shadow-md" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="flex items-start gap-3 relative z-10">
                          <UserAvatar 
                            avatarUrl={avatar} 
                            equippedAccessory={cacheUser.equippedAccessory || comment.equippedAccessory} 
                            accessoryPosition={cacheUser.accessoryPosition || comment.accessoryPosition} 
                            className="w-10 h-10 shrink-0 border-2 border-[#facaca] rounded-xl shadow-sm" 
                            fallbackIconSizeClass="w-6 h-6 text-[#780606]" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-black text-xs text-[#ffffff] tracking-wide">
                                {dName}
                              </span>
                              {customTitle && (
                                <span className="px-2 py-0.5 bg-[#9c0800] text-[#ffffff] rounded-md text-[8px] font-black uppercase tracking-wider border border-[#facaca]">
                                  {customTitle.name || customTitle}
                                </span>
                              )}
                              <span className="text-[9px] text-[#823323] font-bold ml-auto">
                                {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yy HH:mm') : 'NOW'}
                              </span>
                            </div>

                            {isGift && (
                              <div className="mt-1 flex items-center gap-1.5 bg-[#facaca] text-[#780606] px-2 py-1 rounded-md text-[10px] font-black max-w-max border-2 border-[#ffffff] shadow-sm">
                                <Rabbit className="w-3.5 h-3.5" /> SUPPORT DROP: {comment.giftAmount} CC
                              </div>
                            )}

                            <p className="mt-2 text-sm text-[#fff2f1] font-medium leading-relaxed">
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
        <div className="fixed inset-0 bg-[#000000]/90 flex items-center justify-center p-4 z-50">
          <div className="bg-[#000000] border-4 border-[#facaca] w-full max-w-sm p-6 rounded-[2rem] shadow-[0_0_40px_rgba(156,8,0,0.6)] relative">
            <div className="absolute -top-6 -right-6 bg-[#ffffff] p-2 rounded-full border-4 border-[#000000]">
               <Rabbit className="w-8 h-8 text-[#9c0800]" />
            </div>
            
            <h3 className="text-[#ffffff] text-xl font-black mb-2 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#facaca]" /> REQUEST SUPPORT
            </h3>
            <p className="text-xs text-[#facaca] mb-6 font-bold leading-relaxed">
              Cung cấp vật phẩm để giúp nhân vật chính sống sót lâu hơn trong hệ thống.
            </p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#ffffff] font-black mb-1.5 uppercase flex items-center gap-1">
                   <Gift className="w-3 h-3" /> VẬT PHẨM (SỐ DƯ: {choco} CC)
                </label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#780606]/20 text-[#ffffff] border-2 border-[#823323] p-3 rounded-xl text-sm font-bold focus:outline-none focus:border-[#facaca]"
                  min="1"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-[#ffffff] font-black mb-1.5 uppercase flex items-center gap-1">
                   <Send className="w-3 h-3" /> LỜI NHẮN ĐÍNH KÈM
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Cẩn thận Thỏ Đỏ sau lưng bạn..."
                  rows={3}
                  className="w-full bg-[#780606]/20 text-[#ffffff] border-2 border-[#823323] p-3 rounded-xl text-xs font-bold focus:outline-none resize-none focus:border-[#facaca]"
                />
              </div>
              
              <div className="flex gap-3 pt-2 mt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 py-2 border-2 border-[#823323] text-[#facaca] hover:bg-[#823323] rounded-xl text-xs font-black uppercase transition-all"
                >
                  HỦY BỎ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="flex-1 py-2 bg-[#facaca] text-[#000000] hover:bg-[#ffffff] rounded-xl text-xs font-black uppercase transition-all border-2 border-[#facaca]"
                >
                  XÁC NHẬN GỬI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

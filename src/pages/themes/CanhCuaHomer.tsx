import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, ExternalLink, Radio, Globe, Zap, Compass, Crosshair, Terminal, Cpu, HardDrive, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

export function CanhCuaHomerTheme(props: ThemeProps) {
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

  return (
    <div className="bg-[#181f2d] min-h-screen text-[#a0a6b3] font-mono selection:bg-[#a0a6b3] selection:text-[#181f2d] pb-10">
      
      {/* Top Terminal Bar */}
      <div className="border-b border-[#47515f] bg-[#2d3745] px-4 py-2 flex items-center justify-between sticky top-0 z-30 text-[10px] uppercase tracking-widest text-[#67707e]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-[#a0a6b3] animate-pulse"><Terminal className="w-3 h-3" /> SYS.HOMER.ACTIVE</span>
          <span className="hidden sm:inline-block">CONNECTION_STABLE</span>
        </div>
        <div className="flex items-center gap-4">
          <span>PORT: {story.id?.slice(0,6) || '8080'}</span>
          <span>LATENCY: 12ms</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10 mt-4">
        
        {/* LEFT COLUMN - COMMAND CENTER (Sticky on Desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-24 flex flex-col gap-6">
            
            {/* Identity Module */}
            <div className="border border-[#47515f] bg-[#2d3745] p-2 rounded-sm flex flex-col gap-4">
              
              <div className="relative aspect-[3/4] bg-[#181f2d] overflow-hidden border border-[#47515f]">
                <img 
                  src={story.coverUrl || 'https://via.placeholder.com/400x600'} 
                  alt={story.title}
                  className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-500"
                />
                
                {/* HUD Overlay */}
                <div className="absolute inset-0 border-[10px] border-[#a0a6b3]/10 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#a0a6b3]/30 rounded-full flex items-center justify-center pointer-events-none">
                  <Crosshair className="w-8 h-8 text-[#a0a6b3]/50 animate-pulse" />
                </div>
              </div>

              <div className="text-center px-2 pb-2">
                <div className="inline-block px-3 py-1 bg-[#181f2d] border border-[#47515f] text-[#a0a6b3] text-[10px] font-bold mb-3 tracking-widest uppercase">
                  {(story.status === 'completed' || story.completed) ? 'GIẢI MÃ HOÀN TẤT' : 'ĐANG XỬ LÝ DỮ LIỆU'}
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-[#a0a6b3] uppercase tracking-tight">
                  {story.title}
                </h1>
              </div>
            </div>

            {/* Metrics Module */}
            <div className="border border-[#47515f] bg-[#2d3745] p-5 rounded-sm">
              <h2 className="text-[10px] text-[#67707e] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 font-bold">
                <Cpu className="w-3 h-3" /> THỐNG KÊ HỆ THỐNG
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#181f2d] border border-[#47515f] p-3 text-center">
                  <div className="text-[#a0a6b3] text-xl font-bold mb-1">{chapters.length}</div>
                  <div className="text-[9px] text-[#67707e] font-bold uppercase">TỌA ĐỘ</div>
                </div>
                <div className="bg-[#181f2d] border border-[#47515f] p-3 text-center">
                  <div className="text-[#a0a6b3] text-xl font-bold mb-1">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}</div>
                  <div className="text-[9px] text-[#67707e] font-bold uppercase">CỘNG HƯỞNG</div>
                </div>
                <div className="bg-[#181f2d] border border-[#47515f] p-3 text-center col-span-2">
                  <div className="text-[#a0a6b3] text-xl font-bold mb-1">{totalGiftedChoco} CC</div>
                  <div className="text-[9px] text-[#67707e] font-bold uppercase">NHIÊN LIỆU DỰ TRỮ</div>
                </div>
              </div>
            </div>

            {/* Action Module */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => chapters.length > 0 && navigate(`/doc/${story.id}/${chapters[0].id}`)}
                className="w-full py-4 bg-[#a0a6b3] text-[#181f2d] uppercase text-xs font-bold tracking-widest hover:bg-[#67707e] hover:text-[#181f2d] transition-all flex justify-center items-center gap-3 border border-[#a0a6b3]"
              >
                KHỞI ĐỘNG VƯỢT CỔNG <Zap className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleSaveToggle}
                  className={`py-3 border uppercase text-[10px] font-bold tracking-widest transition-all flex justify-center items-center gap-2 ${savedStories.includes(story.id) ? 'bg-[#47515f] border-[#47515f] text-[#a0a6b3]' : 'bg-[#2d3745] border-[#47515f] text-[#67707e] hover:border-[#a0a6b3] hover:text-[#a0a6b3]'}`}
                >
                  <Bookmark className={`w-3 h-3 ${savedStories.includes(story.id) ? 'fill-[#a0a6b3]' : ''}`} /> 
                  {savedStories.includes(story.id) ? 'ĐÃ GHIM' : 'GHIM TỌA ĐỘ'}
                </button>
                <button 
                  onClick={() => setShowGiftModal(true)}
                  className="py-3 bg-[#2d3745] border border-[#47515f] text-[#a0a6b3] uppercase text-[10px] font-bold tracking-widest hover:border-[#a0a6b3] transition-all flex justify-center items-center gap-2"
                >
                  <Gift className="w-3 h-3" /> NẠP NHIÊN LIỆU
                </button>
              </div>

              {story?.externalUrl && (
                <a 
                  href={story.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#2d3745] border border-[#47515f] text-[#67707e] uppercase text-[10px] font-bold tracking-widest hover:text-[#a0a6b3] hover:border-[#a0a6b3] transition-all flex justify-center items-center gap-2"
                >
                  KẾT NỐI MÁY CHỦ GỐC <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - DATA VISUALIZATION */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Metadata Block */}
          <div className="border border-[#47515f] bg-[#2d3745] p-6 rounded-sm">
            <h2 className="text-[#a0a6b3] uppercase text-xs font-bold tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-[#47515f] pb-3">
              <HardDrive className="w-4 h-4" /> THÔNG SỐ TỆP DỮ LIỆU
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex justify-between items-center border-b border-[#47515f] pb-2">
                <span className="text-[#67707e] text-xs font-bold">CHỈ HUY</span>
                <span className="text-[#a0a6b3]">{story.author || 'UNKNOWN'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#47515f] pb-2">
                <span className="text-[#67707e] text-xs font-bold">TRẠNG THÁI</span>
                <span className="text-[#a0a6b3]">{(story.status === 'completed' || story.completed) ? 'ĐÃ GIẢI MÃ' : 'ĐANG KHAI PHÁ'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#47515f] pb-2 col-span-1 md:col-span-2">
                <span className="text-[#67707e] text-xs font-bold shrink-0 mr-4">PHÂN LOẠI</span>
                <div className="flex flex-wrap gap-2 justify-end">
                  {story.genres?.map((g: string, i: number) => (
                    <span key={i} className="text-[10px] bg-[#47515f] px-2 py-0.5 text-[#a0a6b3] font-bold">{g}</span>
                  ))}
                  {(!story.genres || story.genres.length === 0) && <span className="text-[#a0a6b3]">NONE</span>}
                </div>
              </div>
              {story.tags && story.tags.length > 0 && (
                <div className="flex justify-between items-start border-b border-[#47515f] pb-2 col-span-1 md:col-span-2">
                  <span className="text-[#67707e] text-xs font-bold shrink-0 mr-4 pt-1">THẺ TAG</span>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {story.tags.map((t: string, i: number) => (
                      <span key={i} className="text-[9px] border border-[#67707e] px-1.5 py-0.5 text-[#a0a6b3]">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Block */}
          {story.description && (
            <div className="border border-[#47515f] bg-[#2d3745] p-6 rounded-sm relative">
              <h2 className="text-[#a0a6b3] uppercase text-xs font-bold tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-[#47515f] pb-3">
                <Radio className="w-4 h-4" /> DỮ LIỆU NHIỆM VỤ
              </h2>
              <div className="text-sm leading-[1.8] text-[#a0a6b3] whitespace-pre-wrap">
                {story.description}
              </div>
            </div>
          )}

          {/* Nav Tabs */}
          <div className="flex gap-1 border-b border-[#47515f] mt-4">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`px-6 py-3 uppercase text-xs font-bold tracking-widest transition-all ${
                activeTab === 'chapters' 
                  ? 'bg-[#47515f] text-[#a0a6b3] border-t-2 border-[#a0a6b3]' 
                  : 'bg-[#2d3745] text-[#67707e] hover:text-[#a0a6b3]'
              }`}
            >
              TRẠM TỌA ĐỘ
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-3 uppercase text-xs font-bold tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'comments' 
                  ? 'bg-[#47515f] text-[#a0a6b3] border-t-2 border-[#a0a6b3]' 
                  : 'bg-[#2d3745] text-[#67707e] hover:text-[#a0a6b3]'
              }`}
            >
              SÓNG PHẢN HỒI <span className="bg-[#67707e] text-[#181f2d] px-1.5 py-0.5 text-[9px] font-bold">{comments.length}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === 'chapters' ? (
              <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center p-3 bg-[#2d3745] border border-[#47515f]">
                  <span className="text-[#a0a6b3] text-[10px] font-bold uppercase tracking-widest">PHÁT HIỆN {chapters.length} TỌA ĐỘ</span>
                  <button
                    onClick={() => setChapterSortDesc(!chapterSortDesc)}
                    className="text-[#67707e] hover:text-[#a0a6b3] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                  >
                    TRÌNH TỰ: {chapterSortDesc ? 'GẦN ĐÂY' : 'GỐC'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedChapters.map((chap, i) => (
                    <button
                      key={chap.id}
                      onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                      className="flex items-center text-left p-3 bg-[#2d3745] border border-[#47515f] hover:border-[#a0a6b3] transition-colors group"
                    >
                      <div className="w-12 text-[#67707e] group-hover:text-[#a0a6b3] text-xl font-light border-r border-[#47515f] mr-3 pr-3 text-center">
                        {((chapterPage * CHAPTERS_PER_PAGE) + i + 1).toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 line-clamp-2 text-sm text-[#a0a6b3]">
                        {chap.title}
                      </div>
                    </button>
                  ))}
                </div>

                {chapters.length > CHAPTERS_PER_PAGE && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 p-4 border-t border-[#47515f]">
                    <select
                      value={chapterPage}
                      onChange={(e) => setChapterPage(Number(e.target.value))}
                      className="bg-[#2d3745] text-[#a0a6b3] border border-[#47515f] p-2 text-xs font-bold uppercase tracking-widest outline-none"
                    >
                      {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, p) => {
                        const start = p * CHAPTERS_PER_PAGE + 1;
                        const end = Math.min((p + 1) * CHAPTERS_PER_PAGE, chapters.length);
                        return <option key={p} value={p}>TỌA ĐỘ {start} - {end}</option>;
                      })}
                    </select>

                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, p) => (
                        <button
                          key={p}
                          onClick={() => setChapterPage(p)}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-bold border ${
                            chapterPage === p ? 'bg-[#a0a6b3] text-[#181f2d] border-[#a0a6b3]' : 'bg-[#2d3745] text-[#67707e] border-[#47515f] hover:text-[#a0a6b3] hover:border-[#a0a6b3]'
                          }`}
                        >
                          {p + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                {isLoggedIn ? (
                  <form onSubmit={handleSendComment} className="border border-[#47515f] bg-[#2d3745] p-5">
                    <h3 className="text-[#a0a6b3] uppercase text-[10px] font-bold tracking-widest mb-3 flex items-center gap-2">
                      <Terminal className="w-3 h-3" /> TRUYỀN TÍN HIỆU
                    </h3>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Nhập nội dung sóng phản hồi..."
                      className="w-full bg-[#181f2d] border border-[#47515f] p-3 text-[#a0a6b3] text-sm outline-none focus:border-[#67707e] h-24 mb-3 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!commentText.trim() || submittingComment}
                        className="px-6 py-2 bg-[#47515f] text-[#a0a6b3] text-xs font-bold uppercase tracking-widest hover:bg-[#a0a6b3] hover:text-[#181f2d] disabled:opacity-50 transition-colors"
                      >
                        {submittingComment ? 'ĐANG XỬ LÝ...' : 'PHÁT SÓNG'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center p-8 border border-dashed border-[#47515f] text-[#67707e] text-xs font-bold uppercase tracking-widest">
                    YÊU CẦU ĐĂNG NHẬP ĐỂ PHÁT SÓNG
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {comments.map((comment) => {
                    const isGift = comment.type === 'choco_gift';
                    const isMe = comment.uid === uid || comment.authorId === uid;
                    const cached = comment.uid ? profilesCache[comment.uid] : (comment.authorId ? profilesCache[comment.authorId] : null);

                    const currentSticker = isMe ? equippedStickerComment : (cached?.equippedStickerComment ?? cached?.equippedSticker ?? comment.equippedSticker);
                    const currentDisplayName = isMe ? storeDisplayName : (cached?.displayName ?? comment.displayName ?? comment.authorName);
                    const currentAvatarUrl = isMe ? storeAvatarUrl : (cached?.avatarUrl ?? comment.avatarUrl);
                    const currentActiveTitle = isMe ? storeActiveTitle : (cached?.activeTitle ?? comment.activeTitle);
                    const currentAccessory = isMe ? storeEquippedAccessory : (cached?.equippedAccessory ?? comment.equippedAccessory);
                    const currentAccessoryPos = isMe ? storeAccessoryPosition : (cached?.accessoryPosition ?? comment.accessoryPosition);

                    return (
                      <div key={comment.id} className="border border-[#47515f] bg-[#2d3745] p-4 relative pr-16 group hover:border-[#67707e] transition-colors">
                        
                        {currentSticker && (
                          <img 
                            src={currentSticker} 
                            alt="Sticker" 
                            className="absolute w-12 h-12 object-contain pointer-events-none z-10 right-2 top-1/2 -translate-y-1/2" 
                            referrerPolicy="no-referrer"
                          />
                        )}

                        <div className="flex items-center gap-4 border-b border-[#47515f] pb-3 mb-3">
                          <UserAvatar 
                            avatarUrl={currentAvatarUrl} 
                            equippedAccessory={currentAccessory}
                            accessoryPosition={currentAccessoryPos}
                            className="w-8 h-8 rounded-none border border-[#67707e]" 
                            fallbackIconSizeClass="w-4 h-4 text-[#a0a6b3]"
                            borderClass=""
                            bgClass="bg-[#181f2d]"
                          />
                          <div className="flex flex-col">
                            <span className="text-[#a0a6b3] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <span style={{ color: getTitleColor?.(currentActiveTitle) || '#a0a6b3' }}>
                                {currentDisplayName || 'ANON_USER'}
                              </span>
                              {currentActiveTitle && (
                                <span className="bg-[#47515f] text-[#a0a6b3] border border-[#67707e] text-[8px] px-1.5 py-0.5 rounded-sm">[{currentActiveTitle}]</span>
                              )}
                            </span>
                            <span className="text-[#67707e] text-[9px] font-bold uppercase tracking-widest mt-0.5">
                              {comment.createdAt ? format(comment.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'NOW'}
                            </span>
                          </div>
                          
                          {isGift && (
                            <span className="ml-auto text-[#181f2d] bg-[#a0a6b3] text-[9px] font-bold px-2 py-1 uppercase tracking-widest flex items-center gap-1 rounded-sm">
                              <Gift className="w-3 h-3" /> +{comment.giftAmount} CC
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-[#a0a6b3] whitespace-pre-wrap pl-12 leading-relaxed">
                          {comment.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181f2d]/90 backdrop-blur-sm">
          <div className="bg-[#2d3745] border border-[#47515f] p-6 max-w-sm w-full relative rounded-sm shadow-xl shadow-[#181f2d]/50">
            <button onClick={() => setShowGiftModal(false)} className="absolute top-3 right-3 text-[#67707e] hover:text-[#a0a6b3]">✕</button>
            
            <div className="text-center mb-6">
              <Zap className="w-8 h-8 text-[#a0a6b3] mx-auto mb-2" />
              <h2 className="text-[#a0a6b3] text-sm font-bold uppercase tracking-widest">NẠP NHIÊN LIỆU TRẠM</h2>
              <p className="text-[#67707e] text-[10px] font-bold uppercase tracking-widest mt-1">SẴN CÓ: <span className="text-[#a0a6b3]">{choco} CC</span></p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[5, 10, 20, 50, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => setGiftAmount(amt)}
                  className={`py-2 text-xs font-bold border transition-colors ${
                    giftAmount === amt ? 'bg-[#a0a6b3] text-[#181f2d] border-[#a0a6b3]' : 'bg-[#181f2d] text-[#67707e] border-[#47515f] hover:border-[#67707e]'
                  }`}
                >
                  {amt}
                </button>
              ))}
              <input
                type="number"
                min="1"
                value={giftAmount || ''}
                onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                placeholder="KHÁC"
                className="py-2 bg-[#181f2d] border border-[#47515f] text-center font-bold text-xs text-[#a0a6b3] outline-none focus:border-[#67707e]"
              />
            </div>
            
            <textarea
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              placeholder="TIN NHẮN ĐÍNH KÈM..."
              className="w-full bg-[#181f2d] border border-[#47515f] p-3 text-xs text-[#a0a6b3] outline-none focus:border-[#67707e] h-16 resize-none mb-4 font-mono"
            />

            <button
              onClick={handleGiftSubmit}
              disabled={giftAmount <= 0}
              className="w-full py-3 bg-[#a0a6b3] text-[#181f2d] text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-white transition-colors"
            >
              XÁC NHẬN CHUYỂN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

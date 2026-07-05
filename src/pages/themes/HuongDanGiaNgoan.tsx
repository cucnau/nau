import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Briefcase, TrendingUp, MessageSquare, ArrowUpRight, Star, Quote, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export function HuongDanGiaNgoanTheme(props: ThemeProps) {
  const {
    story, chapters, comments, activeTab, setActiveTab,
    chapterPage, setChapterPage, chapterSortDesc, setChapterSortDesc, CHAPTERS_PER_PAGE,
    showGiftModal, setShowGiftModal, giftAmount, setGiftAmount, giftMessage, setGiftMessage, handleGiftSubmit,
    commentText, setCommentText, submittingComment, handleSendComment,
    isLoggedIn, savedStories, handleSaveToggle, choco, navigate
  } = props;

  const totalGiftedChoco = comments
    .filter(c => c.type === 'choco_gift')
    .reduce((acc, curr) => acc + (curr.giftAmount || 0), 0);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayedChapters = [...chapters]
    .sort((a, b) => {
      const aNum = a.orderIndex !== undefined ? a.orderIndex : parseFloat(a.title?.match(/\d+/)?.[0] || '0');
      const bNum = b.orderIndex !== undefined ? b.orderIndex : parseFloat(b.title?.match(/\d+/)?.[0] || '0');
      return chapterSortDesc ? bNum - aNum : aNum - bNum;
    })
    .slice(chapterPage * CHAPTERS_PER_PAGE, (chapterPage + 1) * CHAPTERS_PER_PAGE);

  return (
    <div className="bg-[#13120d] min-h-screen text-[#dbcec2] font-reading-garamond selection:bg-[#bbee1f] selection:text-[#13120d] pb-20 relative">
      
      {/* Background Decor - Luxurious & Corporate */}
      <div className="fixed inset-0 pointer-events-none opacity-20"
           style={{ backgroundImage: 'repeating-linear-gradient(45deg, #2e2a63 0, #2e2a63 1px, transparent 1px, transparent 50px)' }} />
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#2e2a63] rounded-full blur-[150px] opacity-30 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#bbee1f] rounded-full blur-[180px] opacity-10 pointer-events-none" />

      {/* Decorative Top Border */}
      <div className="w-full h-2 bg-gradient-to-r from-[#13120d] via-[#bbee1f] to-[#13120d] relative z-20" />
      <div className="w-full h-1 mt-1 bg-gradient-to-r from-[#13120d] via-[#695b7f] to-[#13120d] relative z-20 opacity-50" />

      {/* Hero Section - Magazine / Dossier Style */}
      <div className="relative pt-12 lg:pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex flex-col lg:flex-row gap-16 items-center lg:items-start relative z-10">
          
          {/* Cover Art - Clean Frame */}
          <div className="w-56 lg:w-64 flex-shrink-0 relative group z-20">
            <div className="relative aspect-[2/3] overflow-hidden border border-[#2e2a63] shadow-[0_15px_40px_rgba(0,0,0,0.6)] group-hover:border-[#bbee1f] transition-colors duration-500">
              <img 
                src={story.coverUrl || 'https://via.placeholder.com/400x600'} 
                alt={story.title}
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              {/* Elegant overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#13120d] via-[#13120d]/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-700" />
            </div>

            {/* Corner Decor - Outside the image */}
            <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[#bbee1f] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[#bbee1f] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#bbee1f] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-[#bbee1f] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Story Info */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left mt-10 lg:mt-0 relative">
            
            <div className="absolute top-0 right-0 text-[#2e2a63] opacity-20 text-7xl lg:text-9xl font-black italic pointer-events-none leading-none">
              REBIRTH
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6 relative z-10">
              <span className="text-[#bbee1f] text-[10px] font-reading-garamond tracking-[0.3em] uppercase font-bold bg-[#13120d]/90 px-3 py-1.5 border border-[#bbee1f]/50 whitespace-nowrap shadow-lg">
                {story.status === 'completed' ? 'Hoàn Tất' : 'Đang Xử Lý'}
              </span>
              
              {story.tags?.map((tag: string, i: number) => (
                <span key={`tag-${i}`} className="px-3 py-1 text-[10px] lg:text-xs font-reading-garamond uppercase tracking-[0.2em] font-medium text-[#dbcec2] bg-transparent border border-[#695b7f] hover:border-[#bbee1f] hover:text-[#bbee1f] transition-colors">
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-xl lg:text-3xl font-black text-white leading-[1.3] mb-6 tracking-tight relative z-10 drop-shadow-xl uppercase">
              {story.title}
            </h1>
            
            <div className="text-[#dbcec2] text-sm font-reading-garamond tracking-[0.3em] uppercase mb-4 flex items-center gap-4 relative z-10">
              <span className="w-16 h-[2px] bg-[#bbee1f]" />
              Giám Đốc Dự Án: <span className="font-bold text-white">{story.author || 'Đang cập nhật'}</span>
              <span className="w-16 h-[2px] bg-[#bbee1f]" />
            </div>

            {/* Thể loại (Genres) dưới tên tác giả */}
            {story.genres && story.genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-10 relative z-10">
                {story.genres.map((genre: string, i: number) => (
                  <span key={`genre-${i}`} className="px-3.5 py-1 text-[10px] lg:text-xs font-reading-garamond uppercase tracking-[0.2em] font-medium text-[#13120d] bg-[#bbee1f] hover:bg-white transition-colors border border-[#13120d] shadow-md">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Dashboard Stats - Corporate Elegant */}
            <div className="grid grid-cols-3 gap-8 mb-12 w-full border-y border-[#2e2a63] py-8 relative z-10 bg-[#13120d]/50 backdrop-blur-sm">
              <div className="flex flex-col items-center border-r border-[#2e2a63]">
                <span className="text-[#695b7f] font-reading-garamond text-[10px] lg:text-xs tracking-widest uppercase mb-3 flex items-center gap-2"><BookOpen className="w-3 h-3 lg:w-4 lg:h-4 text-[#bbee1f]"/> Tài Liệu</span>
                <span className="text-3xl lg:text-4xl font-light text-white">{chapters.length}</span>
              </div>
              <div className="flex flex-col items-center border-r border-[#2e2a63]">
                <span className="text-[#695b7f] font-reading-garamond text-[10px] lg:text-xs tracking-widest uppercase mb-3 flex items-center gap-2"><Briefcase className="w-3 h-3 lg:w-4 lg:h-4 text-[#bbee1f]"/> Tình Trạng</span>
                <span className="text-lg lg:text-xl font-medium text-[#dbcec2] mt-2 text-center">{story.status === 'completed' ? 'Hoàn Thành' : 'Đang Cập Nhật'}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[#695b7f] font-reading-garamond text-[10px] lg:text-xs tracking-widest uppercase mb-3 flex items-center gap-2"><TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-[#bbee1f]"/> Đầu Tư</span>
                <span className="text-3xl lg:text-4xl font-light text-white">{totalGiftedChoco} <span className="text-[#bbee1f] text-sm font-reading-garamond font-bold">CC</span></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start relative z-10 flex-wrap">
              <button 
                onClick={() => chapters.length > 0 && navigate(`/doc/${story.id}/${chapters[0].id}`)}
                className="px-6 py-3.5 bg-[#bbee1f] text-[#13120d] font-reading-garamond font-black uppercase text-xs tracking-[0.2em] hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(187,238,31,0.3)] flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                Đọc Từ Đầu <BookOpen className="w-4 h-4" />
              </button>

              {story?.externalUrl && (
                <a 
                  href={story.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 border border-[#bbee1f] text-[#bbee1f] font-reading-garamond uppercase text-xs font-bold tracking-[0.1em] hover:bg-[#bbee1f] hover:text-[#13120d] transition-all flex items-center justify-center gap-2"
                >
                  Đọc Hồ Sơ <ExternalLink className="w-4 h-4" />
                </a>
              )}
              
              <button 
                onClick={handleSaveToggle}
                className="px-5 py-3.5 border border-[#695b7f] text-[#dbcec2] font-reading-garamond uppercase text-xs font-bold tracking-[0.1em] hover:bg-[#695b7f]/20 hover:border-[#bbee1f] transition-all flex items-center justify-center gap-2"
              >
                <Bookmark className={`w-4 h-4 ${savedStories.includes(story.id) ? 'fill-[#bbee1f] text-[#bbee1f]' : ''}`} /> 
                {savedStories.includes(story.id) ? 'Đã Lưu Trữ' : 'Lưu Trữ'}
              </button>

              <button 
                onClick={() => setShowGiftModal(true)}
                className="px-5 py-3.5 border border-[#2e2a63] text-[#bbee1f] font-reading-garamond uppercase text-xs font-bold tracking-[0.1em] hover:bg-[#bbee1f]/10 transition-all flex items-center justify-center gap-2 lg:ml-0"
              >
                <Gift className="w-4 h-4" /> Rót Vốn
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Mini Quick Navigation Bar */}
      <div className="sticky top-[55px] sm:top-[72px] z-30 w-full bg-[#13120d]/95 backdrop-blur-md border-y border-[#2e2a63]/80 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 flex items-center justify-center gap-6 sm:gap-12 flex-wrap text-xs font-reading-garamond uppercase tracking-[0.2em]">
          <button
            onClick={() => scrollToSection('ban-khao-sat')}
            className="flex items-center gap-2.5 text-[#dbcec2] hover:text-[#bbee1f] hover:scale-105 transition-all duration-300 font-bold px-3 py-1 bg-[#13120d] border border-transparent hover:border-[#bbee1f]/20"
          >
            <Quote className="w-3.5 h-3.5 text-[#bbee1f]" />
            Bản Khảo Sát
          </button>
          
          {story.recommendations && (
            <button
              onClick={() => scrollToSection('lien-ket-de-xuat')}
              className="flex items-center gap-2.5 text-[#dbcec2] hover:text-[#bbee1f] hover:scale-105 transition-all duration-300 font-bold px-3 py-1 bg-[#13120d] border border-transparent hover:border-[#bbee1f]/20"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-[#bbee1f]" />
              Dự Án Liên Kết
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('chapters');
              setTimeout(() => scrollToSection('ho-so-thuong-vu'), 50);
            }}
            className="flex items-center gap-2.5 text-[#dbcec2] hover:text-[#bbee1f] hover:scale-105 transition-all duration-300 font-bold px-3 py-1 bg-[#13120d] border border-transparent hover:border-[#bbee1f]/20"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#bbee1f]" />
            Hồ Sơ Thương Vụ
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 mt-16 flex flex-col gap-20 relative z-10">
        
        {/* Synopsis - Executive Summary */}
        {story.description && (
          <div id="ban-khao-sat" className="relative p-8 lg:p-14 bg-[#13120d]/80 backdrop-blur-md border border-[#2e2a63] shadow-[0_0_30px_rgba(46,42,99,0.2)] group scroll-mt-[130px] sm:scroll-mt-[150px]">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#bbee1f] opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#bbee1f] opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute -top-5 -left-5 bg-[#2e2a63] w-10 h-10 flex items-center justify-center shadow-lg border border-[#bbee1f]">
              <Quote className="w-4 h-4 text-[#bbee1f]" />
            </div>
            
            <h3 className="text-[#bbee1f] font-reading-garamond uppercase text-xs font-black tracking-[0.4em] mb-8 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-[#bbee1f]" /> Bản Khảo Sát Dự Án
            </h3>
            
            <div className="text-base lg:text-lg leading-[2] text-[#dbcec2] font-light relative z-10 drop-shadow-sm space-y-4">
              {story.description?.split('\n').filter((p: string) => p.trim() !== '').map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations / Other Stories */}
        {story.recommendations && (
          <div id="lien-ket-de-xuat" className="relative p-8 lg:p-14 bg-[#13120d]/80 backdrop-blur-md border border-[#2e2a63] shadow-[0_0_30px_rgba(46,42,99,0.2)] group scroll-mt-[130px] sm:scroll-mt-[150px]">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#bbee1f] opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#bbee1f] opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <h3 className="text-[#bbee1f] font-reading-garamond uppercase text-xs font-black tracking-[0.4em] mb-8 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-[#bbee1f]" /> Dự Án Liên Kết Đề Xuất
            </h3>
            
            <div className="text-base lg:text-lg leading-[2] text-[#dbcec2] font-light relative z-10 drop-shadow-sm space-y-4">
              {story.recommendations?.split('\n').filter((p: string) => p.trim() !== '').map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* Custom Tabs */}
        <div id="ho-so-thuong-vu" className="flex justify-center gap-12 border-b-2 border-[#2e2a63] scroll-mt-[130px] sm:scroll-mt-[150px]">
          <button
            onClick={() => setActiveTab('chapters')}
            className={`pb-6 font-reading-garamond uppercase font-bold tracking-[0.2em] text-sm transition-all relative ${
              activeTab === 'chapters' ? 'text-[#bbee1f]' : 'text-[#695b7f] hover:text-[#dbcec2]'
            }`}
          >
            Hồ Sơ Thương Vụ
            {activeTab === 'chapters' && <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-1/2 h-[4px] bg-[#bbee1f]" />}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`pb-6 font-reading-garamond uppercase font-bold tracking-[0.2em] text-sm transition-all relative ${
              activeTab === 'comments' ? 'text-[#bbee1f]' : 'text-[#695b7f] hover:text-[#dbcec2]'
            }`}
          >
            Đánh Giá Đối Tác ({comments.length})
            {activeTab === 'comments' && <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-1/2 h-[4px] bg-[#bbee1f]" />}
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'chapters' ? (
          <div className="flex flex-col gap-10 animate-in fade-in duration-700">
            <div className="flex justify-between items-center bg-[#13120d] border border-[#2e2a63] p-5 lg:p-6 shadow-md relative">
              <div className="absolute left-0 top-0 w-1 h-full bg-[#bbee1f]" />
              <span className="text-[#695b7f] font-reading-garamond text-[10px] lg:text-xs uppercase tracking-[0.2em] font-bold">Số lượng tài liệu: {chapters.length}</span>
              <button
                onClick={() => setChapterSortDesc(!chapterSortDesc)}
                className="text-[#bbee1f] font-reading-garamond text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center gap-2 border border-[#bbee1f]/30 px-3 py-1.5"
              >
                Trình Tự: {chapterSortDesc ? 'Gần Đây' : 'Ban Đầu'} <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              {displayedChapters.map((chap, i) => (
                <button
                  key={chap.id}
                  onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                  className="group flex items-center text-left p-2.5 lg:p-3 bg-[#13120d]/80 border border-[#2e2a63] hover:border-[#bbee1f]/50 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#2e2a63] group-hover:bg-[#bbee1f] transition-colors duration-500" />
                  
                  {/* Decorative dots */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 bg-[#bbee1f]" />
                    <div className="w-1 h-1 bg-[#bbee1f]" />
                  </div>
                  
                  <div className="flex-shrink-0 w-10 lg:w-12 text-center border-r border-[#2e2a63]/50 mr-3 lg:mr-4 pr-3 lg:pr-4">
                    <span className="block text-[#695b7f] font-reading-garamond text-[9px] tracking-[0.2em] uppercase mb-1">Mã Số</span>
                    <span className="block text-lg lg:text-xl font-light text-[#dbcec2] group-hover:text-[#bbee1f] transition-colors">
                      {((chapterPage * CHAPTERS_PER_PAGE) + i + 1).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className="flex-1 pr-4">
                    <span className="text-[#dbcec2] text-xs lg:text-sm group-hover:text-white transition-colors leading-relaxed line-clamp-2">
                      {chap.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination & Range Selector */}
            {chapters.length > CHAPTERS_PER_PAGE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-12 pt-6 border-t border-[#2e2a63]/30">
                {/* Range Selector Dropdown */}
                <div className="flex items-center gap-3">
                  <span className="text-[#695b7f] font-reading-garamond text-xs uppercase tracking-widest">Dải Chương:</span>
                  <select
                    value={chapterPage}
                    onChange={(e) => setChapterPage(Number(e.target.value))}
                    className="bg-[#13120d] text-[#bbee1f] font-reading-garamond text-xs font-bold px-4 py-2 border border-[#2e2a63] focus:border-[#bbee1f] focus:outline-none transition-all rounded-none uppercase tracking-wider cursor-pointer"
                  >
                    {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, p) => {
                      const start = p * CHAPTERS_PER_PAGE + 1;
                      const end = Math.min((p + 1) * CHAPTERS_PER_PAGE, chapters.length);
                      return (
                        <option key={p} value={p} className="bg-[#13120d] text-[#dbcec2]">
                          Chương {start} - {end}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Individual Page Buttons (Diamond style from the theme) */}
                <div className="flex flex-wrap gap-4 justify-center">
                  {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, p) => (
                    <button
                      key={p}
                      onClick={() => setChapterPage(p)}
                      className={`w-10 h-10 flex items-center justify-center font-reading-garamond text-xs font-black transition-all ${
                        chapterPage === p 
                          ? 'bg-[#bbee1f] text-[#13120d] shadow-[0_5px_15px_rgba(187,238,31,0.4)] rotate-45' 
                          : 'bg-[#13120d] text-[#695b7f] border border-[#2e2a63] hover:border-[#bbee1f] hover:text-[#bbee1f]'
                      }`}
                    >
                      <span className={chapterPage === p ? '-rotate-45 block' : 'block'}>{p + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-12 animate-in fade-in duration-700">
            {/* Comment Input */}
            <div className="bg-[#13120d]/80 border border-[#2e2a63] p-8 lg:p-10 relative shadow-md">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#bbee1f]" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#bbee1f]" />
              
              <h3 className="text-[#bbee1f] font-reading-garamond uppercase tracking-[0.2em] text-sm font-black mb-8 flex items-center gap-3">
                <MessageSquare className="w-5 h-5" /> Đề Xuất & Ý Kiến
              </h3>
              
              {isLoggedIn ? (
                <form onSubmit={handleSendComment} className="flex flex-col gap-6">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ghi chú đánh giá của bạn về dự án này..."
                    className="w-full bg-[#13120d] border border-[#2e2a63] p-5 text-[#dbcec2] text-sm focus:border-[#bbee1f] focus:outline-none resize-none h-32 transition-colors placeholder:text-[#695b7f]/50"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submittingComment}
                      className="px-10 py-4 bg-[#695b7f] text-white font-reading-garamond font-bold uppercase tracking-[0.2em] hover:bg-[#bbee1f] hover:text-[#13120d] disabled:opacity-50 transition-all flex items-center gap-3"
                    >
                      {submittingComment ? 'Đang Xử Lý...' : <><Send className="w-5 h-5" /> Trình Ý Kiến</>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center p-12 border border-dashed border-[#695b7f] text-[#695b7f] font-reading-garamond text-sm uppercase tracking-widest">
                  Yêu cầu đăng nhập hệ thống để gửi đánh giá
                </div>
              )}
            </div>

            {/* Comment List */}
            <div className="flex flex-col gap-6">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-[#13120d]/50 border border-[#2e2a63]/50 p-6 lg:p-8 relative group hover:border-[#2e2a63] transition-colors">
                  <div className="absolute left-0 top-0 w-1 h-0 bg-[#bbee1f] group-hover:h-full transition-all duration-500" />
                  
                  <div className="flex flex-wrap items-center gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#2e2a63] flex items-center justify-center text-white font-reading-garamond font-black text-sm border border-[#695b7f]/50">
                        {comment.authorName?.[0] || '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#bbee1f] font-reading-garamond uppercase tracking-widest text-xs lg:text-sm">{comment.authorName}</span>
                        <span className="text-[#695b7f] font-reading-garamond text-[9px] lg:text-[10px] tracking-[0.2em] uppercase mt-1">
                          {comment.createdAt ? format(comment.createdAt.toDate(), 'dd.MM.yyyy / HH:mm') : 'Vừa xong'}
                        </span>
                      </div>
                    </div>
                    
                    {comment.type === 'choco_gift' && (
                      <span className="ml-auto text-[#13120d] font-reading-garamond text-[10px] lg:text-xs font-black bg-[#bbee1f] px-3 py-1.5 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Gift className="w-3 h-3" /> Tài trợ {comment.giftAmount} CC
                      </span>
                    )}
                  </div>
                  
                  <div className="text-[#dbcec2] text-sm lg:text-base leading-[1.8] font-light whitespace-pre-wrap pl-14">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#13120d]/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#13120d] border-2 border-[#bbee1f] p-5 sm:p-8 max-w-md w-full relative shadow-[0_0_100px_rgba(187,238,31,0.15)] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowGiftModal(false)} className="absolute top-4 right-4 text-[#695b7f] hover:text-[#bbee1f] transition-colors font-reading-garamond text-2xl">✕</button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#2e2a63] flex items-center justify-center mx-auto mb-4 border border-[#695b7f] rotate-45">
                <Gift className="w-5 h-5 text-[#bbee1f] -rotate-45" />
              </div>
              <h2 className="text-[#bbee1f] text-xl font-black uppercase tracking-[0.2em]">Rót Vốn Dự Án</h2>
              <p className="text-[#695b7f] font-reading-garamond text-[10px] mt-2 tracking-widest uppercase">Ngân sách: <span className="text-white font-bold">{choco} CC</span></p>
            </div>
            
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[#695b7f] font-reading-garamond text-[9px] font-bold uppercase tracking-[0.3em] mb-3 block text-center">Gói Đầu Tư</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setGiftAmount(amt)}
                      className={`py-2.5 font-reading-garamond text-base font-black transition-all border ${
                        giftAmount === amt 
                          ? 'bg-[#bbee1f] text-[#13120d] border-[#bbee1f]' 
                          : 'bg-[#13120d] text-[#dbcec2] border-[#2e2a63] hover:border-[#695b7f]'
                      }`}
                    >
                      {amt} CC
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={giftAmount || ''}
                    onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                    placeholder="Khác"
                    className="py-2.5 bg-[#13120d] text-[#dbcec2] font-reading-garamond text-center text-base font-black border border-[#2e2a63] focus:border-[#bbee1f] focus:outline-none transition-all placeholder:text-[#695b7f]"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[#695b7f] font-reading-garamond text-[9px] font-bold uppercase tracking-[0.3em] mb-3 block text-center">Biên Bản Thỏa Thuận (Tùy Chọn)</label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Ghi chú đính kèm..."
                  className="w-full bg-[#13120d] border border-[#2e2a63] p-3 text-[#dbcec2] text-sm focus:border-[#bbee1f] focus:outline-none resize-none h-20 transition-all"
                />
              </div>

              <button
                onClick={handleGiftSubmit}
                disabled={giftAmount <= 0}
                className="w-full py-3 bg-[#bbee1f] text-[#13120d] font-reading-garamond font-black uppercase tracking-[0.2em] hover:bg-white disabled:opacity-50 transition-all mt-1 flex items-center justify-center gap-2 text-xs"
              >
                Xác Nhận Chuyển Giao <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



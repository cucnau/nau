import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Star, PenTool, Scissors, Scroll, Sparkles, MessageSquare, Heart, Compass, ShieldAlert, Award, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';

export function NhatKyKhongTenTheme(props: ThemeProps) {
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

  // Custom interactive features: Reader's Mood Rating & Personal Reading Notebook
  const [userMood, setUserMood] = useState<string>(() => {
    return localStorage.getItem(`story_user_mood_${story.id}`) || '';
  });
  const [moodVotes, setMoodVotes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`story_mood_votes_${story.id}`);
    if (saved) return JSON.parse(saved);
    return {
      'u-sau': 42,
      'am-ap': 28,
      'huyen-bi': 35,
      'day-dut': 49
    };
  });

  const [personalNotes, setPersonalNotes] = useState<Array<{id: string, text: string, createdAt: string}>>(() => {
    const saved = localStorage.getItem(`story_personal_notes_${story.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newNoteText, setNewNoteText] = useState('');

  const handleVoteMood = (moodKey: string) => {
    if (userMood === moodKey) {
      const newVotes = { ...moodVotes, [moodKey]: Math.max(0, moodVotes[moodKey] - 1) };
      setMoodVotes(newVotes);
      setUserMood('');
      localStorage.setItem(`story_mood_votes_${story.id}`, JSON.stringify(newVotes));
      localStorage.removeItem(`story_user_mood_${story.id}`);
    } else {
      const newVotes = { ...moodVotes };
      if (userMood) {
        newVotes[userMood] = Math.max(0, newVotes[userMood] - 1);
      }
      newVotes[moodKey] = (newVotes[moodKey] || 0) + 1;
      setMoodVotes(newVotes);
      setUserMood(moodKey);
      localStorage.setItem(`story_mood_votes_${story.id}`, JSON.stringify(newVotes));
      localStorage.setItem(`story_user_mood_${story.id}`, moodKey);
    }
  };

  const handleAddPersonalNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      createdAt: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newNote, ...personalNotes];
    setPersonalNotes(updated);
    localStorage.setItem(`story_personal_notes_${story.id}`, JSON.stringify(updated));
    setNewNoteText('');
  };

  const handleDeletePersonalNote = (noteId: string) => {
    const updated = personalNotes.filter(n => n.id !== noteId);
    setPersonalNotes(updated);
    localStorage.setItem(`story_personal_notes_${story.id}`, JSON.stringify(updated));
  };

  return (
    <div className="bg-[#1E1614] min-h-screen text-[#DFD6D3] font-reading-cormorant selection:bg-[#8E7E7A] selection:text-[#1E1614] pb-10">
      
      {/* Top Thread Bar with String-like borders */}
      <div className="border-b-2 border-[#5D4B45] bg-[#171110] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 text-xs uppercase tracking-widest text-[#8E7E7A] font-sans">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#E8DCB8] animate-pulse">
            <Scissors className="w-3.5 h-3.5" /> DIARY.PUPPET_SOUL // HOẠT ĐỘNG
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] sm:text-xs">
          <span className="text-[#8E7E7A]">Ghi chép bên lề nhật ký</span>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10 mt-2">
        
        {/* LEFT COLUMN - THE ANCIENT LEATHER DIARY BINDER */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-20 flex flex-col gap-6">
            
            {/* Diary Book Bound (Aesthetic Card) */}
            <div className="border-4 border-[#4E3E39] bg-[#2A1F1D] p-3 rounded-2xl shadow-[8px_8px_0px_#171110] relative overflow-hidden">
              {/* String / Sewing texture on the side */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#4E3E39]/40 border-r border-[#5D4B45] flex flex-col justify-around py-4 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E1614]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E1614]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E1614]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E1614]" />
              </div>

              <div className="pl-4">
                <div className="relative aspect-[3/4] bg-[#1E1614] overflow-hidden border-2 border-[#5D4B45] rounded-xl group">
                  <img 
                    src={story.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=1000'} 
                    alt={story.title}
                    className="w-full h-full object-cover opacity-75 grayscale contrast-125 group-hover:grayscale-0 group-hover:opacity-95 transition-all duration-700"
                  />
                  {/* Overlay vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E1614] via-transparent to-transparent opacity-90" />
                  
                  {/* Decorative corner brackets */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#E8DCB8]/50" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#E8DCB8]/50" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#E8DCB8]/50" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#E8DCB8]/50" />
                </div>

                <div className="text-center pt-5 pb-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E1614] border border-[#5D4B45] text-[#E8DCB8] text-[10px] tracking-widest uppercase font-sans font-bold mb-3">
                    <Scroll className="w-3 h-3 text-[#E8DCB8]" /> TRUYỆN NGẮN (1 CHƯƠNG)
                  </div>
                  <h1 className="text-2xl font-bold text-[#E8DCB8] leading-tight px-1 font-serif">
                    {story.title}
                  </h1>
                  <p className="text-xs text-[#8E7E7A] mt-1 font-sans italic">Tác giả: {story.author}</p>
                </div>
              </div>
            </div>

            {/* Antique Clock & Counters Panel */}
            <div className="border-2 border-[#4E3E39] bg-[#251B19] p-5 rounded-2xl relative">
              <div className="absolute top-[-10px] right-4 px-2.5 py-0.5 bg-[#4E3E39] border border-[#5D4B45] text-[#E8DCB8] text-[10px] font-sans font-bold uppercase rounded-md">
                Chỉ số ký ức
              </div>

              <h2 className="text-[10px] text-[#8E7E7A] font-sans uppercase tracking-[0.2em] mb-4 flex items-center gap-2 font-bold">
                <PenTool className="w-3.5 h-3.5 text-[#E8DCB8]" /> TRẠNG THÁI CUỐN DA
              </h2>
              <div className="grid grid-cols-2 gap-3 font-sans">
                <div className="bg-[#1E1614] border border-[#4E3E39] p-3 rounded-xl text-center">
                  <div className="text-[#E8DCB8] text-xl font-bold mb-1">{chapters.length}</div>
                  <div className="text-[9px] text-[#8E7E7A] font-bold uppercase tracking-wider">Trang Nhật Ký</div>
                </div>
                <div className="bg-[#1E1614] border border-[#4E3E39] p-3 rounded-xl text-center">
                  <div className="text-[#E8DCB8] text-xl font-bold mb-1">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}</div>
                  <div className="text-[9px] text-[#8E7E7A] font-bold uppercase tracking-wider">Cảm ứng</div>
                </div>
                <div className="bg-[#1E1614] border border-[#4E3E39] p-3 rounded-xl text-center col-span-2">
                  <div className="text-[#E8DCB8] text-lg font-bold mb-1 flex items-center justify-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#8E7E7A] fill-[#8E7E7A]" /> {totalGiftedChoco} CC
                  </div>
                  <div className="text-[9px] text-[#8E7E7A] font-bold uppercase tracking-wider">Năng Lượng Nhớ Thương</div>
                </div>
              </div>
            </div>

            {/* Core Action Buttons */}
            <div className="flex flex-col gap-2 font-sans">
              <button 
                onClick={() => chapters.length > 0 && navigate(`/doc/${story.id}/${chapters[0].id}`)}
                className="w-full py-3.5 bg-[#E8DCB8] hover:bg-[#F5E8C8] text-[#1E1614] uppercase text-xs font-black tracking-widest transition-all duration-300 flex justify-center items-center gap-2.5 rounded-xl border border-[#E8DCB8] shadow-[4px_4px_0_0_#4E3E39]"
              >
                MỞ TRANG ĐẦU TIÊN <BookOpen className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleSaveToggle}
                  className={`py-2.5 rounded-xl border uppercase text-[10px] font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-1.5 ${savedStories.includes(story.id) ? 'bg-[#4E3E39] border-[#5D4B45] text-[#E8DCB8]' : 'bg-[#1E1614] border-[#4E3E39] text-[#8E7E7A] hover:border-[#8E7E7A] hover:text-[#E8DCB8]'}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedStories.includes(story.id) ? 'fill-[#E8DCB8]' : ''}`} /> 
                  {savedStories.includes(story.id) ? 'ĐÃ CẤT GIỮ' : 'LƯU CUỐN DA'}
                </button>
                <button 
                  onClick={() => setShowGiftModal(true)}
                  className="py-2.5 rounded-xl border border-[#4E3E39] bg-[#1E1614] hover:bg-[#251B19] text-[#8E7E7A] hover:text-[#E8DCB8] uppercase text-[10px] font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-1.5"
                >
                  <Gift className="w-3.5 h-3.5" /> GỬI TRÁI TIM
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - NOTEBOOK PAPYRUS PAGES */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Aesthetic story summary & Genres inside Papyrus page */}
          <div className="border-2 border-[#4E3E39] bg-[#F5E8C8]/10 text-[#DFD6D3] p-6 lg:p-8 rounded-2xl relative shadow-xl">
            {/* Ink blot element */}
            <div className="absolute right-6 top-6 w-16 h-16 bg-[#171110] rounded-full blur-xl opacity-30 pointer-events-none" />
            
            <h3 className="font-serif text-[#E8DCB8] text-lg font-bold mb-4 border-b border-[#5D4B45] pb-2 flex items-center gap-2">
              <Scroll className="w-4.5 h-4.5 text-[#E8DCB8]" /> Tóm tắt trang đầu tiên
            </h3>
            
            <p className="leading-relaxed text-sm md:text-base font-serif italic text-[#DFD6D3]/90 text-justify whitespace-pre-line">
              {story.description || "Cuốn nhật ký sờn cũ bằng da dê, bên trong nét mực sẫm màu ghi lại cuộc đời của một chú rối bằng gỗ. Một người đã từng là con người, bị dâng hiến cho bóng tối và được tái sinh bởi một bậc thầy múa rối bí ẩn. Cuộc đồng hành đong đầy cảm xúc, một nụ hôn vụn trộm dưới đêm khuya, và rồi khói lửa chiến tranh nổ ra hé lộ bí mật kinh hoàng..."}
            </p>

            {/* Genres Tag Cloud */}
            <div className="flex flex-wrap gap-2 mt-6">
              {story.genres?.map((g: string) => (
                <span key={g} className="px-3 py-1 bg-[#2A1F1D] text-[#E8DCB8] text-xs font-sans rounded-md border border-[#4E3E39]">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* CUSTOM INTERACTIVE SECTION: READER REFLECTION & MOOD */}
          <div className="border-2 border-[#4E3E39] bg-[#251B19] p-6 rounded-2xl flex flex-col gap-6">
            {/* 1. MẢNG CẢM XÚC */}
            <div>
              <h3 className="font-serif text-[#E8DCB8] text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#E8DCB8]" /> Cảm nhận tâm trạng tác phẩm
              </h3>
              <p className="text-xs text-[#8E7E7A] font-sans mb-4">
                Hãy bình chọn cảm xúc sâu sắc nhất mà bạn cảm nhận được qua tác phẩm này.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'u-sau', label: 'U sầu cổ kính', desc: 'Nét buồn mộc mạc', color: 'bg-[#5D4B45]' },
                  { key: 'am-ap', label: 'Ấm áp dịu êm', desc: 'Hơi ấm sưởi tâm hồn', color: 'bg-[#8D6E63]' },
                  { key: 'huyen-bi', label: 'Huyền bí ly kỳ', desc: 'Bí ẩn chưa hé lộ', color: 'bg-[#4E3E39]' },
                  { key: 'day-dut', label: 'Tiếc nuối day dứt', desc: 'Nỗi buồn thầm lặng', color: 'bg-[#3E2723]' }
                ].map((mood) => {
                  const totalVotes = Object.keys(moodVotes).reduce((acc: number, key: string) => acc + (moodVotes[key] || 0), 0) || 1;
                  const voteCount = moodVotes[mood.key] || 0;
                  const percent = Math.round((voteCount / totalVotes) * 100);
                  const isSelected = userMood === mood.key;

                  return (
                    <button
                      key={mood.key}
                      onClick={() => handleVoteMood(mood.key)}
                      className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected 
                          ? 'border-[#E8DCB8] bg-[#1E1614] shadow-[0_0_10px_rgba(232,220,184,0.15)]' 
                          : 'border-[#4E3E39] bg-[#1E1614] hover:border-[#8E7E7A]'
                      }`}
                    >
                      {/* Background Progress bar bar */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-500 ${mood.color}`}
                        style={{ width: `${percent}%` }}
                      />
                      <div className="relative z-10 flex justify-between items-start">
                        <div>
                          <div className={`text-xs font-serif font-bold ${isSelected ? 'text-[#E8DCB8]' : 'text-[#DFD6D3]'}`}>
                            {mood.label} {isSelected && '✓'}
                          </div>
                          <div className="text-[10px] text-[#8E7E7A] font-sans mt-0.5">{mood.desc}</div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#E8DCB8]">
                          {percent}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Đường gạch phân cách */}
            <div className="border-t border-[#4E3E39] border-dashed" />

            {/* 2. SỔ TAY CHIÊM NGHIỆM RIÊNG TƯ */}
            <div>
              <h3 className="font-serif text-[#E8DCB8] text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#E8DCB8]" /> Sổ tay suy ngẫm cá nhân
              </h3>
              <p className="text-xs text-[#8E7E7A] font-sans mb-4">
                Không gian lưu trữ riêng tư giúp bạn ghi chép lại các suy ngẫm, cảm nhận cá nhân khi thưởng thức tác phẩm.
              </p>

              {/* Form ghi chép */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPersonalNote()}
                  placeholder="Ghi chép nhanh suy nghĩ, dòng tâm đắc của bạn..."
                  className="flex-1 bg-[#1E1614] text-[#DFD6D3] placeholder-[#8E7E7A]/75 px-3 py-2 rounded-xl border-2 border-[#4E3E39] focus:outline-none focus:border-[#8E7E7A] text-xs font-serif italic"
                />
                <button
                  onClick={handleAddPersonalNote}
                  disabled={!newNoteText.trim()}
                  className="px-4 py-2 bg-[#E8DCB8] hover:bg-[#F5E8C8] text-[#1E1614] text-xs font-black uppercase rounded-xl transition-all cursor-pointer disabled:opacity-40"
                >
                  Lưu
                </button>
              </div>

              {/* Danh sách ghi chép cá nhân */}
              {personalNotes.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {personalNotes.map((note) => (
                    <div 
                      key={note.id}
                      className="p-3 bg-[#1E1614]/70 border border-[#4E3E39] rounded-xl flex justify-between items-start gap-2 group animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-[#DFD6D3] font-serif leading-relaxed text-justify italic">
                          "{note.text}"
                        </p>
                        <span className="text-[9px] text-[#8E7E7A] font-mono block mt-1">
                          Ghi lúc: {note.createdAt}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeletePersonalNote(note.id)}
                        className="text-[#8E7E7A] hover:text-[#E8DCB8] transition-colors p-1 rounded hover:bg-[#251B19]"
                        title="Xoá ghi chép"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MAIN TABS SELECTOR */}
          <div className="flex border-b border-[#4E3E39] font-sans text-xs sm:text-sm tracking-wider uppercase">
            <button 
              onClick={() => setActiveTab('chapters')}
              className={`px-5 py-3.5 font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'chapters' ? 'border-[#E8DCB8] text-[#E8DCB8] bg-[#251B19]/50' : 'border-transparent text-[#8E7E7A] hover:text-[#DFD6D3]'}`}
            >
              <PenTool className="w-4 h-4" /> TRANG NHẬT KÝ ({chapters.length})
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`px-5 py-3.5 font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'comments' ? 'border-[#E8DCB8] text-[#E8DCB8] bg-[#251B19]/50' : 'border-transparent text-[#8E7E7A] hover:text-[#DFD6D3]'}`}
            >
              <MessageSquare className="w-4 h-4" /> BÚT TÍCH ĐỂ LẠI ({comments.length})
            </button>
          </div>

          {/* TAB 1: CHAPTERS LIST */}
          {activeTab === 'chapters' && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="flex justify-between items-center bg-[#171110] p-3 rounded-xl border border-[#4E3E39] text-xs">
                <span className="text-[#8E7E7A]">HIỂN THỊ TRANG MỤC LỤC</span>
                <button 
                  onClick={() => setChapterSortDesc(!chapterSortDesc)}
                  className="text-[#E8DCB8] hover:underline font-bold"
                >
                  {chapterSortDesc ? 'MỚI NHẤT TRƯỚC' : 'CŨ NHẤT TRƯỚC'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {displayedChapters.length === 0 ? (
                  <div className="p-8 text-center bg-[#251B19] rounded-xl border border-[#4E3E39] text-sm text-[#8E7E7A]">
                    Bản thảo hiện đang được bảo vệ hoặc chưa được ghi chép.
                  </div>
                ) : (
                  displayedChapters.map((chap, idx) => (
                    <div 
                      key={chap.id}
                      onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                      className="group p-4 bg-[#251B19] hover:bg-[#2A1F1D] border-2 border-[#4E3E39] hover:border-[#8E7E7A] rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1E1614] flex items-center justify-center text-xs text-[#E8DCB8] border border-[#4E3E39] font-bold">
                          {chap.order}
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm md:text-base text-[#DFD6D3] group-hover:text-[#E8DCB8] transition-colors">
                            {chap.title}
                          </h4>
                          <span className="text-[10px] text-[#8E7E7A] block mt-0.5 uppercase tracking-wide">
                            TRANG NHẬT KÝ CHÍNH THỨC
                          </span>
                        </div>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-[#8E7E7A] group-hover:text-[#E8DCB8] transition-all transform group-hover:translate-x-1" />
                    </div>
                  ))
                )}
              </div>

              {/* PAGINATION */}
              {chapters.length > CHAPTERS_PER_PAGE && (
                <div className="flex justify-center gap-2 pt-4">
                  <button 
                    disabled={chapterPage === 0}
                    onClick={() => setChapterPage(chapterPage - 1)}
                    className="px-4 py-2 bg-[#1E1614] text-[#DFD6D3] border border-[#4E3E39] hover:border-[#E8DCB8] rounded-xl disabled:opacity-30 disabled:hover:border-[#4E3E39] transition-all text-xs font-bold"
                  >
                    TRANG TRƯỚC
                  </button>
                  <button 
                    disabled={(chapterPage + 1) * CHAPTERS_PER_PAGE >= chapters.length}
                    onClick={() => setChapterPage(chapterPage + 1)}
                    className="px-4 py-2 bg-[#1E1614] text-[#DFD6D3] border border-[#4E3E39] hover:border-[#E8DCB8] rounded-xl disabled:opacity-30 disabled:hover:border-[#4E3E39] transition-all text-xs font-bold"
                  >
                    TRANG SAU
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="flex flex-col gap-5 font-sans">
              
              {/* Comment Composer */}
              <div className="bg-[#251B19] border-2 border-[#4E3E39] p-4 rounded-2xl flex flex-col gap-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Để lại bút tích của bạn về câu chuyện hoài niệm này..."
                  rows={3}
                  className="w-full bg-[#1E1614] text-[#DFD6D3] placeholder-[#8E7E7A] p-3 rounded-xl border border-[#4E3E39] focus:outline-none focus:border-[#8E7E7A] text-sm resize-none font-serif"
                />
                
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-[#8E7E7A]">
                    {isLoggedIn ? "Đang viết bút tích..." : "Đăng nhập để lại dấu bút"}
                  </div>
                  <button 
                    onClick={handleSendComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="px-4 py-2 bg-[#E8DCB8] hover:bg-[#F5E8C8] text-[#1E1614] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    Gửi bút tích <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* COMMENTS LIST */}
              <div className="flex flex-col gap-4">
                {comments.length === 0 ? (
                  <div className="p-8 text-center bg-[#251B19] rounded-xl border border-[#4E3E39] text-sm text-[#8E7E7A]">
                    Chưa có bất kỳ bút tích nào. Hãy là người đầu tiên ghi tên.
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isGift = comment.type === 'choco_gift';
                    const cacheUser = profilesCache[comment.uid] || {};
                    const avatar = cacheUser.avatarUrl || comment.avatarUrl || '';
                    const dName = cacheUser.displayName || comment.displayName || 'Nhà lữ hành ẩn danh';
                    const customTitle = cacheUser.activeTitle || comment.activeTitle;
                    
                    return (
                      <div 
                        key={comment.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${isGift ? 'bg-[#2A1F1D] border-[#5D4B45]' : 'bg-[#251B19] border-[#4E3E39]'}`}
                      >
                        <div className="flex items-start gap-3">
                          <UserAvatar 
                            avatarUrl={avatar} 
                            equippedAccessory={cacheUser.equippedAccessory || comment.equippedAccessory} 
                            accessoryPosition={cacheUser.accessoryPosition || comment.accessoryPosition} 
                            className="w-10 h-10 shrink-0 pointer-events-none" 
                            fallbackIconSizeClass="w-5 h-5 text-[#E8DCB8]" 
                            borderClass="border border-[#4E3E39]"
                            bgClass="bg-[#171110]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-[#E8DCB8] hover:underline cursor-pointer">
                                {dName}
                              </span>
                              {customTitle && (
                                <span className="px-1.5 py-0.5 bg-[#4E3E39] text-[#E8DCB8] rounded text-[8px] font-bold uppercase tracking-wider">
                                  {customTitle.name || customTitle}
                                </span>
                              )}
                              <span className="text-[9px] text-[#8E7E7A]">
                                {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : 'Hôm nay'}
                              </span>
                            </div>

                            {/* Gift details */}
                            {isGift && (
                              <div className="mt-1 flex items-center gap-1 bg-[#1E1614] border border-[#5D4B45] px-2 py-1 rounded text-xs text-[#E8DCB8] font-bold max-w-max">
                                <Gift className="w-3.5 h-3.5 text-[#E8DCB8]" /> Đã tặng {comment.giftAmount} CC quả tim lưu niệm
                              </div>
                            )}

                            <p className="mt-2 text-xs md:text-sm text-[#DFD6D3] whitespace-pre-line font-serif italic text-justify leading-relaxed">
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
        <div className="fixed inset-0 bg-[#1E1614]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-[#251B19] border-4 border-[#4E3E39] w-full max-w-md p-6 rounded-2xl shadow-[8px_8px_0_0_#171110]">
            <h3 className="font-serif text-[#E8DCB8] text-lg font-bold mb-1 uppercase tracking-tight">Gửi Hồi Ức Thương Nhớ</h3>
            <p className="text-xs text-[#8E7E7A] mb-4">Mỗi Choco dâng hiến sẽ biến thành sợi chỉ dệt nên ký ức hoàn hảo cho rối.</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#8E7E7A] font-bold block mb-1">Số Choco muốn hiến dâng (Số dư: {choco} CC)</label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#1E1614] text-[#DFD6D3] border border-[#4E3E39] p-3 rounded-xl text-sm focus:outline-none"
                  min="1"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8E7E7A] font-bold block mb-1">Lời nhắn của bạn</label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi lời chúc thầm lặng đến búp bê và bậc thầy rối..."
                  rows={3}
                  className="w-full bg-[#1E1614] text-[#DFD6D3] border border-[#4E3E39] p-3 rounded-xl text-xs focus:outline-none resize-none font-serif"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 border border-[#4E3E39] text-[#8E7E7A] hover:text-[#DFD6D3] rounded-xl text-xs font-bold transition-all"
                >
                  HUỶ BỎ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="px-4 py-2 bg-[#E8DCB8] text-[#1E1614] hover:bg-[#F5E8C8] rounded-xl text-xs font-black tracking-wider transition-all"
                >
                  DÂNG HIẾN CHOCO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

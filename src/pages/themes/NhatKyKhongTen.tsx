import React, { useState } from 'react';
import { ThemeProps } from './ThemeProps';
import { BookOpen, Gift, Send, Bookmark, Star, PenTool, Scissors, Scroll, Sparkles, MessageSquare, Heart, Compass, ShieldAlert, Award, FileText, Activity } from 'lucide-react';
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
      'u-sau': 54,
      'am-ap': 32,
      'huyen-bi': 48,
      'day-dut': 67
    };
  });

  const [personalNotes, setPersonalNotes] = useState<Array<{id: string, text: string, createdAt: string}>>(() => {
    const saved = localStorage.getItem(`story_personal_notes_${story.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newNoteText, setNewNoteText] = useState('');

  // Marionette Soul Interaction: Whispers from the wooden puppet
  const whispers = [
    "“Nếu tôi có một trái tim bằng xương bằng thịt, liệu người có bằng lòng ôm lấy cơ thể gỗ xù xì, lạnh lẽo này?”",
    "“Những sợi chỉ tơ này nâng tôi dậy mỗi ngày, nhưng chỉ có ánh mắt trìu mến của người mới thực sự kéo tôi ra khỏi bóng tối vô tận.”",
    "“Két... két... Tiếng bánh răng đồng rỉ sét trong lồng ngực này gầm rú, cố gắng đập theo nhịp tim hoài niệm của một kẻ đã từng là con người.”",
    "“Bậc thầy múa rối đã tạc nên hình hài bằng gỗ của tôi, nhưng chính người mới là người dệt nên linh hồn cho tôi qua từng trang viết.”",
    "“Một ngày nào đó, chiếc kéo sắc ngọt của định mệnh sẽ cắt đứt những sợi tơ treo này. Khi ấy, tôi sẽ tự do ngã vào vòng tay của người.”",
    "“Hồn gỗ vốn dĩ lạnh lẽo phong sương, nhưng mỗi bút tích dịu dàng của người để lại lại nhen nhóm lên ngọn lửa hồng ấm áp kỳ lạ.”",
    "“Sân khấu đã lên đèn, tiếng cười vang rộn rã, nhưng trong bóng tối sau tấm rèm nhung hoen ố, tôi chỉ ngóng tìm bóng hình người...”",
    "“Tôi múa theo ý của những sợi dây, nhưng tâm trí tôi hoàn toàn tự do khi nghĩ về đêm dạ tiệc cổ xưa ấy.”"
  ];

  const [whisperIdx, setWhisperIdx] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handlePullString = () => {
    if (isPulling) return;
    setIsPulling(true);
    // Change to a new whisper randomly
    let nextIdx = whisperIdx;
    while (nextIdx === whisperIdx) {
      nextIdx = Math.floor(Math.random() * whispers.length);
    }
    setTimeout(() => {
      setWhisperIdx(nextIdx);
      setIsPulling(false);
    }, 600);
  };

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
    <div className="bg-[#120B09] min-h-screen text-[#DFD6D3] font-reading-cormorant selection:bg-[#4E3E39] selection:text-[#E8DCB8] pb-16 relative overflow-x-hidden">
      
      {/* Decorative Puppet Strings hanging from the ceiling */}
      <div className="absolute top-0 left-12 w-[1px] h-32 bg-gradient-to-b from-[#8E7E7A]/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-24 w-[1px] h-48 bg-gradient-to-b from-[#8E7E7A]/25 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-16 w-[1px] h-40 bg-gradient-to-b from-[#8E7E7A]/30 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-32 w-[1px] h-20 bg-gradient-to-b from-[#8E7E7A]/20 to-transparent pointer-events-none" />

      {/* Top Thread Bar with String-like borders */}
      <div className="border-b-2 border-[#3A2D2A] bg-[#0E0807] px-4 py-3 flex items-center justify-between sticky top-0 z-30 text-xs uppercase tracking-widest text-[#8E7E7A] font-sans">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#E8DCB8] font-bold animate-pulse">
            <Scissors className="w-3.5 h-3.5 text-[#C5A059]" /> DIARY.PUPPET_SOUL // HOẠT ĐỘNG
          </span>
          <span className="hidden sm:inline-block text-[#5D4B45]">|</span>
          <span className="hidden sm:inline-block text-[10px] text-[#8E7E7A]/80 tracking-normal lowercase italic">Kết nối hồn gỗ thông qua bút tích thời gian</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] sm:text-xs">
          <span className="text-[#C5A059] font-semibold tracking-wider">Mở cổ thư nhật ký</span>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10 mt-2">
        
        {/* LEFT COLUMN - THE ANCIENT LEATHER DIARY BINDER */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-20 flex flex-col gap-6">
            
            {/* Diary Book Bound (Aesthetic Card) */}
            <div className="border-4 border-[#3E2D2A] bg-[#221412] p-4 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
              {/* Gold Ornament Corners */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#C5A059]/40 pointer-events-none" />
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#C5A059]/40 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#C5A059]/40 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#C5A059]/40 pointer-events-none" />

              {/* String / Sewing texture on the side */}
              <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-[#170E0C] border-r border-[#3E2D2A] flex flex-col justify-around py-6 items-center">
                <div className="w-2 h-2 rounded-full bg-[#3E2D2A] border border-[#C5A059]/30" />
                <div className="w-2 h-2 rounded-full bg-[#3E2D2A] border border-[#C5A059]/30" />
                <div className="w-2 h-2 rounded-full bg-[#3E2D2A] border border-[#C5A059]/30" />
                <div className="w-2 h-2 rounded-full bg-[#3E2D2A] border border-[#C5A059]/30" />
                <div className="w-2 h-2 rounded-full bg-[#3E2D2A] border border-[#C5A059]/30" />
              </div>

              <div className="pl-5">
                <div className="relative aspect-[3/4] bg-[#0F0908] overflow-hidden border-2 border-[#4E3E39] rounded-xl group shadow-inner">
                  <img 
                    src={story.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=1000'} 
                    alt={story.title}
                    className="w-full h-full object-cover opacity-65 grayscale contrast-125 group-hover:grayscale-0 group-hover:opacity-85 transition-all duration-700 transform group-hover:scale-105"
                  />
                  {/* Overlay vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0908] via-transparent to-transparent opacity-90" />
                  
                  {/* Decorative corner brackets inside image */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#E8DCB8]/40" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#E8DCB8]/40" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#E8DCB8]/40" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#E8DCB8]/40" />

                  {/* Puppet Cross strings icon in cover */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
                    <Activity className="w-12 h-12 text-[#C5A059] animate-pulse" />
                  </div>
                </div>

                <div className="text-center pt-5 pb-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0F0908] border border-[#4E3E39] text-[#C5A059] text-[10px] tracking-widest uppercase font-sans font-bold mb-3 shadow-[2px_2px_0px_#1E1614]">
                    <Scroll className="w-3 h-3 text-[#C5A059]" /> TRUYỆN NGẮN • NHẬT KÝ ĐỒNG
                  </div>
                  <h1 className="text-2xl font-bold text-[#E8DCB8] leading-tight px-1 font-serif tracking-tight drop-shadow-md">
                    {story.title}
                  </h1>
                  <p className="text-xs text-[#8E7E7A] mt-1.5 font-sans italic">Tác giả biên chép: <span className="text-[#DFD6D3]">{story.author}</span></p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE MARIONETTE SOUL WHISPERS PANEL - NEW & HIGHLY CRAFTED */}
            <div className="border-2 border-[#4E3E39] bg-[#1C100E] p-5 rounded-2xl relative overflow-hidden shadow-[4px_4px_15px_rgba(0,0,0,0.5)]">
              {/* String Anchor Hook on top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-5 bg-[#3E2D2A] border-b border-[#C5A059]/40 flex justify-center items-end">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-ping absolute" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
              </div>
              
              <div className="text-center pt-2">
                <h3 className="text-[10px] text-[#C5A059] font-sans uppercase tracking-[0.25em] font-bold mb-3">
                  LINH HỒN RỐI GỖ THÌ THẦM
                </h3>

                <div className="min-h-[85px] flex items-center justify-center px-2 py-3 bg-[#0F0908] border border-[#3E2D2A] rounded-xl relative shadow-inner">
                  {/* Vintage ornamental corner background */}
                  <div className="absolute top-1 left-1 text-[8px] text-[#4E3E39] select-none font-sans">✦</div>
                  <div className="absolute bottom-1 right-1 text-[8px] text-[#4E3E39] select-none font-sans">✦</div>

                  <p className={`text-xs md:text-sm text-[#E8DCB8] italic font-serif leading-relaxed text-center transition-all duration-500 ${isPulling ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    {whispers[whisperIdx]}
                  </p>
                </div>

                {/* Sợi dây kéo múa rối có tính tương tác cao */}
                <div className="mt-4 flex flex-col items-center">
                  <div className={`w-[2px] bg-[#C5A059] transition-all duration-300 ${isPulling ? 'h-14 bg-[#E8DCB8]' : 'h-8'}`} />
                  <button 
                    onClick={handlePullString}
                    disabled={isPulling}
                    className={`mt-1 px-4 py-1.5 bg-[#3E2D2A] hover:bg-[#4E3E39] border border-[#C5A059] text-[#C5A059] hover:text-[#E8DCB8] text-[9px] font-sans font-black uppercase tracking-widest rounded-full transition-all shadow-[0_2px_6px_rgba(0,0,0,0.4)] ${isPulling ? 'translate-y-2' : ''}`}
                  >
                    {isPulling ? 'Đang kéo tơ...' : 'Kéo Tơ Đánh Thức Rối'}
                  </button>
                  <p className="text-[8px] text-[#8E7E7A] font-sans italic mt-1.5">Mỗi cái kéo dệt một sợi tơ liên kết tâm hồn</p>
                </div>
              </div>
            </div>

            {/* Antique Clock & Counters Panel */}
            <div className="border-2 border-[#3E2D2A] bg-[#1A0E0C] p-5 rounded-2xl relative shadow-md">
              <div className="absolute top-[-10px] right-4 px-2.5 py-0.5 bg-[#4E3E39] border border-[#C5A059]/40 text-[#E8DCB8] text-[9px] font-sans font-bold uppercase rounded-md shadow-md">
                Chỉ số ký ức
              </div>

              <h2 className="text-[10px] text-[#8E7E7A] font-sans uppercase tracking-[0.2em] mb-4 flex items-center gap-2 font-bold">
                <PenTool className="w-3.5 h-3.5 text-[#C5A059]" /> THƯ VIỆN KÝ ỨC CỔ
              </h2>
              <div className="grid grid-cols-2 gap-3 font-sans">
                <div className="bg-[#0F0908] border border-[#3E2D2A] p-3 rounded-xl text-center">
                  <div className="text-[#C5A059] text-xl font-serif font-bold mb-0.5">{chapters.length}</div>
                  <div className="text-[8px] text-[#8E7E7A] font-bold uppercase tracking-wider">Trang Bản Thảo</div>
                </div>
                <div className="bg-[#0F0908] border border-[#3E2D2A] p-3 rounded-xl text-center">
                  <div className="text-[#C5A059] text-xl font-serif font-bold mb-0.5">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}</div>
                  <div className="text-[8px] text-[#8E7E7A] font-bold uppercase tracking-wider">Cảm Ứng Rối</div>
                </div>
                <div className="bg-[#0F0908] border border-[#3E2D2A] p-3 rounded-xl text-center col-span-2 shadow-inner">
                  <div className="text-[#E8DCB8] text-base font-serif font-bold mb-0.5 flex items-center justify-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" /> {totalGiftedChoco} CC
                  </div>
                  <div className="text-[8px] text-[#8E7E7A] font-bold uppercase tracking-wider">Năng Lượng Nhớ Thương</div>
                </div>
              </div>
            </div>

            {/* Core Action Buttons */}
            <div className="flex flex-col gap-2 font-sans">
              <button 
                onClick={() => chapters.length > 0 && navigate(`/doc/${story.id}/${chapters[0].id}`)}
                className="w-full py-3.5 bg-[#E8DCB8] hover:bg-[#F5E8C8] text-[#1E1614] uppercase text-xs font-black tracking-widest transition-all duration-300 flex justify-center items-center gap-2.5 rounded-xl border-2 border-[#C5A059] shadow-[0_4px_12px_rgba(197,160,89,0.2)] cursor-pointer"
              >
                MỞ TRANG ĐẦU TIÊN <BookOpen className="w-4 h-4 text-[#1E1614]" />
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleSaveToggle}
                  className={`py-2.5 rounded-xl border uppercase text-[9px] font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer ${savedStories.includes(story.id) ? 'bg-[#3E2D2A] border-[#C5A059] text-[#E8DCB8]' : 'bg-[#0F0908] border-[#3E2D2A] text-[#8E7E7A] hover:border-[#8E7E7A] hover:text-[#E8DCB8]'}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedStories.includes(story.id) ? 'fill-[#E8DCB8] text-[#C5A059]' : ''}`} /> 
                  {savedStories.includes(story.id) ? 'ĐÃ CẤT GIỮ' : 'LƯU CUỐN DA'}
                </button>
                <button 
                  onClick={() => setShowGiftModal(true)}
                  className="py-2.5 rounded-xl border border-[#3E2D2A] bg-[#0F0908] hover:bg-[#1C100E] text-[#8E7E7A] hover:text-[#E8DCB8] uppercase text-[9px] font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5 text-[#C5A059]" /> GỬI TRÁI TIM
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - NOTEBOOK PAPYRUS PAGES */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Aesthetic story summary & Genres inside Papyrus page */}
          <div className="border-2 border-[#3E2D2A] bg-[#1E1311] text-[#DFD6D3] p-6 lg:p-8 rounded-2xl relative shadow-xl overflow-hidden">
            {/* Ornamental gold line at the top of book content */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059]/50 to-transparent" />
            
            {/* Ink blot element */}
            <div className="absolute right-6 top-6 w-20 h-20 bg-[#000] rounded-full blur-2xl opacity-40 pointer-events-none" />
            
            <h3 className="font-serif text-[#C5A059] text-xl font-bold mb-4 border-b border-[#3E2D2A] pb-3 flex items-center gap-2">
              <Scroll className="w-5 h-5 text-[#C5A059]" /> Tóm Tắt Cuốn Da Cổ
            </h3>
            
            <p className="leading-relaxed text-sm md:text-base font-serif italic text-[#DFD6D3]/95 text-justify whitespace-pre-line leading-loose pr-2 relative z-10">
              {story.description || "Cuốn nhật ký sờn cũ bằng da dê, bên trong nét mực sẫm màu ghi lại cuộc đời của một chú rối bằng gỗ. Một người đã từng là con người, bị dâng hiến cho bóng tối và được tái sinh bởi một bậc thầy múa rối bí ẩn. Cuộc đồng hành đong đầy cảm xúc, một nụ hôn vụn trộm dưới đêm khuya, và rồi khói lửa chiến tranh nổ ra hé lộ bí mật kinh hoàng..."}
            </p>

            {/* Genres Tag Cloud */}
            <div className="flex flex-wrap gap-2 mt-6 relative z-10">
              {story.genres?.map((g: string) => (
                <span key={g} className="px-3 py-1.5 bg-[#0F0908] text-[#E8DCB8] text-[10px] font-sans font-semibold tracking-wider rounded-md border border-[#3E2D2A] uppercase">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* CUSTOM INTERACTIVE SECTION: READER REFLECTION & MOOD */}
          <div className="border-2 border-[#3E2D2A] bg-[#160E0D] p-6 rounded-2xl flex flex-col gap-6 shadow-md">
            {/* 1. MẢNG CẢM XÚC */}
            <div>
              <h3 className="font-serif text-[#C5A059] text-base font-bold mb-2 flex items-center gap-2">
                <Compass className="w-4.5 h-4.5 text-[#C5A059]" /> Cảm nhận mộng cảnh tác phẩm
              </h3>
              <p className="text-xs text-[#8E7E7A] font-sans mb-4">
                Bút pháp cổ xưa chạm tới miền cảm xúc nào sâu kín nhất trong tâm hồn của người lữ khách?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'u-sau', label: 'U sầu cổ kính', desc: 'Nét u huyền của lâu đài Âu cổ', color: 'bg-[#5D4B45]' },
                  { key: 'am-ap', label: 'Ấm áp dịu êm', desc: 'Hơi ấm sưởi ấm hồn gỗ cơ khí', color: 'bg-[#8D6E63]' },
                  { key: 'huyen-bi', label: 'Huyền bí mộng mị', desc: 'Sợi tơ bóng đêm rợn ngợp', color: 'bg-[#4E3E39]' },
                  { key: 'day-dut', label: 'Tiếc nuối day dứt', desc: 'Nỗi buồn chia ly rạn vỡ', color: 'bg-[#3E2723]' }
                ].map((mood) => {
                  const totalVotes = Object.keys(moodVotes).reduce((acc: number, key: string) => acc + (moodVotes[key] || 0), 0) || 1;
                  const voteCount = moodVotes[mood.key] || 0;
                  const percent = Math.round((voteCount / totalVotes) * 100);
                  const isSelected = userMood === mood.key;

                  return (
                    <button
                      key={mood.key}
                      onClick={() => handleVoteMood(mood.key)}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected 
                          ? 'border-[#C5A059] bg-[#0F0908] shadow-[0_0_15px_rgba(197,160,89,0.15)]' 
                          : 'border-[#3E2D2A] bg-[#0F0908] hover:border-[#8E7E7A]'
                      }`}
                    >
                      {/* Background Progress bar */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 opacity-15 transition-all duration-500 ${mood.color}`}
                        style={{ width: `${percent}%` }}
                      />
                      <div className="relative z-10 flex justify-between items-center">
                        <div>
                          <div className={`text-xs font-serif font-bold ${isSelected ? 'text-[#C5A059]' : 'text-[#DFD6D3]'}`}>
                            {mood.label} {isSelected && '✦'}
                          </div>
                          <div className="text-[10px] text-[#8E7E7A] font-sans mt-0.5">{mood.desc}</div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#C5A059]">
                          {percent}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Đường gạch phân cách mang tính Gothic */}
            <div className="border-t border-[#3E2D2A] border-dashed relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#160E0D] px-3 text-[10px] text-[#4E3E39]">✦ ✦ ✦</div>
            </div>

            {/* 2. SỔ TAY CHIÊM NGHIỆM RIÊNG TƯ */}
            <div>
              <h3 className="font-serif text-[#C5A059] text-base font-bold mb-2 flex items-center gap-2">
                <PenTool className="w-4.5 h-4.5 text-[#C5A059]" /> Sổ tay tâm tình của độc giả
              </h3>
              <p className="text-xs text-[#8E7E7A] font-sans mb-4">
                Không gian lưu trữ bút tích bí mật của riêng người. Nơi lưu giữ những trích dẫn say mê hay những suy ngẫm trầm tư.
              </p>

              {/* Form ghi chép */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPersonalNote()}
                  placeholder="Ghi lại dòng cảm xúc vụn vỡ đang trào dâng..."
                  className="flex-1 bg-[#0F0908] text-[#DFD6D3] placeholder-[#8E7E7A]/60 px-4 py-2.5 rounded-xl border border-[#3E2D2A] focus:outline-none focus:border-[#C5A059] text-xs font-serif italic"
                />
                <button
                  onClick={handleAddPersonalNote}
                  disabled={!newNoteText.trim()}
                  className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#E8DCB8] text-[#1E1614] text-xs font-black uppercase rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Lưu bút
                </button>
              </div>

              {/* Danh sách ghi chép cá nhân */}
              {personalNotes.length > 0 && (
                <div className="mt-4 flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {personalNotes.map((note) => (
                    <div 
                      key={note.id}
                      className="p-3.5 bg-[#0F0908]/90 border border-[#3E2D2A] rounded-xl flex justify-between items-start gap-3 group animate-in fade-in slide-in-from-top-1 duration-200 hover:border-[#4E3E39]"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-[#E8DCB8] font-serif leading-relaxed text-justify italic">
                          “{note.text}”
                        </p>
                        <span className="text-[9px] text-[#8E7E7A] font-mono block mt-1.5 uppercase tracking-wide">
                          Khắc ghi lúc: {note.createdAt}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeletePersonalNote(note.id)}
                        className="text-[#8E7E7A] hover:text-[#C5A059] transition-colors p-1 rounded hover:bg-[#1C100E] cursor-pointer"
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
          <div className="flex border-b border-[#3E2D2A] font-sans text-xs sm:text-sm tracking-wider uppercase">
            <button 
              onClick={() => setActiveTab('chapters')}
              className={`px-6 py-4 font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'chapters' ? 'border-[#C5A059] text-[#C5A059] bg-[#160E0D]' : 'border-transparent text-[#8E7E7A] hover:text-[#DFD6D3]'}`}
            >
              <PenTool className="w-4 h-4 text-[#C5A059]" /> TRANG BẢN THẢO ({chapters.length})
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-4 font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'comments' ? 'border-[#C5A059] text-[#C5A059] bg-[#160E0D]' : 'border-transparent text-[#8E7E7A] hover:text-[#DFD6D3]'}`}
            >
              <MessageSquare className="w-4 h-4 text-[#C5A059]" /> DẤU BÚT ĐỂ LẠI ({comments.length})
            </button>
          </div>

          {/* TAB 1: CHAPTERS LIST */}
          {activeTab === 'chapters' && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="flex justify-between items-center bg-[#0F0908] p-3 rounded-xl border border-[#3E2D2A] text-xs">
                <span className="text-[#8E7E7A] tracking-wider">MỤC LỤC TRANG SÁCH</span>
                <button 
                  onClick={() => setChapterSortDesc(!chapterSortDesc)}
                  className="text-[#C5A059] hover:text-[#E8DCB8] hover:underline font-bold cursor-pointer"
                >
                  {chapterSortDesc ? 'MỚI NHẤT TRƯỚC' : 'CŨ NHẤT TRƯỚC'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {displayedChapters.length === 0 ? (
                  <div className="p-8 text-center bg-[#160E0D] rounded-xl border border-[#3E2D2A] text-sm text-[#8E7E7A]">
                    Bản thảo hiện đang được bảo vệ hoặc chưa được ghi chép.
                  </div>
                ) : (
                  displayedChapters.map((chap, idx) => (
                    <div 
                      key={chap.id}
                      onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                      className="group p-4 bg-[#160E0D] hover:bg-[#1E1311] border border-[#3E2D2A] hover:border-[#C5A059] rounded-xl cursor-pointer transition-all flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#0F0908] flex items-center justify-center text-xs text-[#C5A059] border border-[#3E2D2A] font-bold group-hover:border-[#C5A059] transition-colors">
                          {chap.order}
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm md:text-base text-[#DFD6D3] group-hover:text-[#E8DCB8] transition-colors">
                            {chap.title}
                          </h4>
                          <span className="text-[9px] text-[#8E7E7A] block mt-0.5 uppercase tracking-wider">
                            CHƯƠNG NHẬT KÝ ĐÃ LÊN TRANG
                          </span>
                        </div>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-[#8E7E7A] group-hover:text-[#C5A059] transition-all transform group-hover:translate-x-1" />
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
                    className="px-4 py-2 bg-[#0F0908] text-[#DFD6D3] border border-[#3E2D2A] hover:border-[#C5A059] rounded-xl disabled:opacity-30 disabled:hover:border-[#3E2D2A] transition-all text-xs font-bold cursor-pointer"
                  >
                    TRANG TRƯỚC
                  </button>
                  <button 
                    disabled={(chapterPage + 1) * CHAPTERS_PER_PAGE >= chapters.length}
                    onClick={() => setChapterPage(chapterPage + 1)}
                    className="px-4 py-2 bg-[#0F0908] text-[#DFD6D3] border border-[#3E2D2A] hover:border-[#C5A059] rounded-xl disabled:opacity-30 disabled:hover:border-[#3E2D2A] transition-all text-xs font-bold cursor-pointer"
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
              <div className="bg-[#160E0D] border border-[#3E2D2A] p-5 rounded-2xl flex flex-col gap-3.5 shadow-md">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Để lại bút tích hoài niệm của bạn về mối tình và định mệnh rối gỗ..."
                  rows={3}
                  className="w-full bg-[#0F0908] text-[#DFD6D3] placeholder-[#8E7E7A]/65 p-3 rounded-xl border border-[#3E2D2A] focus:outline-none focus:border-[#C5A059] text-sm resize-none font-serif"
                />
                
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-[#8E7E7A] italic">
                    {isLoggedIn ? "Bút mực đã sẵn sàng..." : "Người lữ hành cần đăng nhập để ký thác"}
                  </div>
                  <button 
                    onClick={handleSendComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="px-5 py-2 bg-[#C5A059] hover:bg-[#E8DCB8] text-[#1E1614] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-45 cursor-pointer"
                  >
                    Ký bút tích <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* COMMENTS LIST */}
              <div className="flex flex-col gap-4">
                {comments.length === 0 ? (
                  <div className="p-8 text-center bg-[#160E0D] rounded-xl border border-[#3E2D2A] text-sm text-[#8E7E7A]">
                    Chưa có nét bút tích nào lưu lại. Người hãy đặt nét mực đầu tiên.
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
                        className={`p-4 rounded-xl border transition-all duration-300 ${isGift ? 'bg-[#221412] border-[#C5A059]/40' : 'bg-[#160E0D] border-[#3E2D2A]'}`}
                      >
                        <div className="flex items-start gap-3">
                          <UserAvatar 
                            avatarUrl={avatar} 
                            equippedAccessory={cacheUser.equippedAccessory || comment.equippedAccessory} 
                            accessoryPosition={cacheUser.accessoryPosition || comment.accessoryPosition} 
                            className="w-10 h-10 shrink-0 pointer-events-none" 
                            fallbackIconSizeClass="w-5 h-5 text-[#E8DCB8]" 
                            borderClass="border border-[#3E2D2A]"
                            bgClass="bg-[#0F0908]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-[#E8DCB8] hover:underline cursor-pointer">
                                {dName}
                              </span>
                              {customTitle && (
                                <span className="px-1.5 py-0.5 bg-[#3E2D2A] text-[#C5A059] rounded text-[8px] font-bold uppercase tracking-wider border border-[#C5A059]/20">
                                  {customTitle.name || customTitle}
                                </span>
                              )}
                              <span className="text-[9px] text-[#8E7E7A]">
                                {comment.createdAt ? format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : 'Hôm nay'}
                              </span>
                            </div>

                            {/* Gift details */}
                            {isGift && (
                              <div className="mt-1 flex items-center gap-1.5 bg-[#0F0908] border border-[#C5A059]/30 px-2.5 py-1 rounded text-xs text-[#E8DCB8] font-bold max-w-max">
                                <Gift className="w-3.5 h-3.5 text-[#C5A059]" /> Đã tặng {comment.giftAmount} CC dệt tơ tâm hồn
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
        <div className="fixed inset-0 bg-[#0F0908]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-[#1C100E] border-4 border-[#3E2D2A] w-full max-w-md p-6 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] relative">
            <div className="absolute top-2 right-2 text-xs text-[#C5A059]">✦</div>
            <h3 className="font-serif text-[#C5A059] text-xl font-bold mb-1 uppercase tracking-tight">Dệt tơ ký ức</h3>
            <p className="text-xs text-[#8E7E7A] mb-4">Mỗi mẩu Choco ngọt ngào sẽ hóa thành tơ kết nối linh hồn rối gỗ xích lại gần người.</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#8E7E7A] font-bold block mb-1">Số lượng Choco dâng hiến (Người có: {choco} CC)</label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0F0908] text-[#DFD6D3] border border-[#3E2D2A] p-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059]"
                  min="1"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8E7E7A] font-bold block mb-1">Lời tâm tình gửi búp bê</label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Gửi gắm chút lời sưởi ấm đến chú rối cô đơn..."
                  rows={3}
                  className="w-full bg-[#0F0908] text-[#DFD6D3] border border-[#3E2D2A] p-3 rounded-xl text-xs focus:outline-none resize-none font-serif focus:border-[#C5A059]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 border border-[#3E2D2A] text-[#8E7E7A] hover:text-[#DFD6D3] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  HUỶ BỎ
                </button>
                <button 
                  onClick={handleGiftSubmit}
                  className="px-4 py-2 bg-[#C5A059] text-[#1E1614] hover:bg-[#E8DCB8] rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer"
                >
                  DÂNG HIẾN KÝ ỨC
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

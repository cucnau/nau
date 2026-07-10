import React, { useState, useEffect } from 'react';
import { ThemeProps } from './ThemeProps';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { UserAvatar } from '../../components/UserAvatar';
import { 
  BookOpen, 
  ExternalLink, 
  Gift, 
  Send, 
  Bookmark, 
  Heart, 
  ArrowLeft, 
  Sparkles, 
  GraduationCap, 
  TrendingUp, 
  Award, 
  Clock, 
  Coffee, 
  CheckSquare, 
  Square,
  AlertCircle,
  Skull,
  BarChart2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Activity,
  DollarSign,
  Plus,
  RotateCcw,
  User,
  Users
} from 'lucide-react';

export function NguoiDepOmYeuTheme(props: ThemeProps) {
  const {
    story,
    actualStoryId,
    chapters,
    comments,
    activeTab,
    setActiveTab,
    chapterPage,
    setChapterPage,
    chapterSortDesc,
    setChapterSortDesc,
    CHAPTERS_PER_PAGE,
    showGiftModal,
    setShowGiftModal,
    giftAmount,
    setGiftAmount,
    giftMessage,
    setGiftMessage,
    handleGiftSubmit,
    commentText,
    setCommentText,
    submittingComment,
    handleSendComment,
    replyingToId,
    setReplyingToId,
    replyText,
    setReplyText,
    submittingReply,
    handleSendReply,
    profilesCache,
    isLoggedIn,
    savedStories,
    toggleSaveStory,
    handleSaveToggle,
    choco,
    uid,
    displayName,
    avatarUrl,
    unlockedPassChapters,
    unlockedEarlyAccessChapters,
    navigate,
  } = props;

  // 1. Easter Egg States for Sickly Beauty Theme (Chỉ giữ lại các chỉ số sức khoẻ cơ bản)
  const [heartRate, setHeartRate] = useState(72);
  const [bodyTemp, setBodyTemp] = useState(35.8);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(true);

  useEffect(() => {
    // Biến động nhịp tim ngẫu nhiên nhẹ nhàng để tạo hiệu ứng sinh động
    const interval = setInterval(() => {
      setHeartRate(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next < 60 ? 60 : next > 82 ? 82 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 2. Lịch trình ôn thi lớp 12 thực tế ngoài đời vô cùng hiệu quả
  const [schedule, setSchedule] = useState([
    { id: 1, time: "05:30 - 06:30", text: "Thức dậy sớm, ôn tập lý thuyết, học từ vựng (Anh/Văn) khi trí não minh mẫn nhất.", completed: false },
    { id: 2, time: "08:00 - 11:30", text: "Tập trung giải đề thi thử các môn tự nhiên (Toán/Lý/Hóa) nâng cao tư duy phản xạ.", completed: false },
    { id: 3, time: "14:00 - 17:00", text: "Hệ thống hóa kiến thức bằng sơ đồ tư duy, rèn luyện kỹ năng viết văn nghị luận xã hội.", completed: false },
    { id: 4, time: "19:30 - 22:00", text: "Luyện giải đề chính thức các năm trước dưới áp lực thời gian thật để phân bổ thời gian hợp lý.", completed: false },
    { id: 5, time: "22:00 - 22:30", text: "Review và ghi chép lại các lỗi sai thường gặp vào sổ tay cá nhân để rút kinh nghiệm sâu sắc.", completed: false },
    { id: 6, time: "22:30 - 23:00", text: "Thư giãn nhẹ nhàng, thả lỏng tinh thần, chuẩn bị đi ngủ sớm trước 23:00 để phục hồi não bộ.", completed: false }
  ]);

  const toggleTask = (id: number) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  // 3. Câu hỏi ôn thi đại học tương tác thực tế cho độc giả tích điểm
  const EXAM_QUESTIONS = [
    {
      question: "Trong bài thơ 'Tây Tiến' của Quang Dũng, hình ảnh đoàn quân được khắc họa độc đáo qua chi tiết nào?",
      options: [
        "A. Quân đi điệp điệp trùng trùng",
        "B. Tây Tiến đoàn binh không mọc tóc",
        "C. Áo chàm đưa buổi phân ly",
        "D. Đường ra trận mùa này đẹp lắm"
      ],
      correct: 1,
      explanation: "Hình ảnh 'không mọc tóc' phản ánh thực tế khốc liệt của căn bệnh sốt rét rừng nhưng vẫn toát lên vẻ kiêu hùng, lẫm liệt của người lính Tây Tiến."
    },
    {
      question: "Đạo hàm của hàm số y = ln(x) (với x > 0) là gì?",
      options: [
        "A. y' = 1/x",
        "B. y' = e^x",
        "C. y' = -1/x^2",
        "D. y' = ln(x)"
      ],
      correct: 0,
      explanation: "Theo công thức đạo hàm cơ bản của hàm số logarit tự nhiên, đạo hàm của y = ln(x) là y' = 1/x."
    },
    {
      question: "Từ nào sau đây viết ĐÚNG chính tả Tiếng Anh?",
      options: [
        "A. Pronunciation",
        "B. Pronounciation",
        "C. Pronunsiation",
        "D. Prononciation"
      ],
      correct: 0,
      explanation: "Từ đúng chính tả tiếng Anh là 'Pronunciation' (danh từ chỉ sự phát âm, động từ là pronounce)."
    },
    {
      question: "Ai là tác giả của tác phẩm văn học hiện thực xuất sắc 'Tắt Đèn'?",
      options: [
        "A. Nam Cao",
        "B. Ngô Tất Tố",
        "C. Vũ Trọng Phụng",
        "D. Nguyễn Công Hoan"
      ],
      correct: 1,
      explanation: "'Tắt Đèn' là tiểu thuyết tiêu biểu nhất khắc họa cuộc sống khốn khổ của người nông dân dưới chế độ phong kiến thực dân của Ngô Tất Tố."
    },
    {
      question: "Kim loại nào sau đây là kim loại nhẹ nhất trong bảng tuần hoàn hóa học?",
      options: [
        "A. Natri (Na)",
        "B. Nhôm (Al)",
        "C. Liti (Li)",
        "D. Kali (K)"
      ],
      correct: 2,
      explanation: "Liti (Li) là kim loại nhẹ nhất và có khối lượng riêng nhỏ nhất trong tất cả các kim loại."
    },
    {
      question: "Chiến dịch Điện Biên Phủ lừng lẫy năm châu chấn động địa cầu kết thúc thắng lợi vào năm nào?",
      options: [
        "A. Năm 1945",
        "B. Năm 1954",
        "C. Năm 1975",
        "D. Năm 1930"
      ],
      correct: 1,
      explanation: "Chiến thắng Điện Biên Phủ lịch sử kết thúc thắng lợi vẻ vang vào ngày 7 tháng 5 năm 1954."
    }
  ];

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [examScore, setExamScore] = useState(() => Number(localStorage.getItem('user_exam_score') || '0'));

  const handleAnswerClick = (index: number) => {
    if (hasAnswered) return;
    setSelectedAns(index);
    setHasAnswered(true);
    if (index === EXAM_QUESTIONS[currentQIdx].correct) {
      const newScore = examScore + 10;
      setExamScore(newScore);
      localStorage.setItem('user_exam_score', String(newScore));
    }
  };

  const handleNextQuestion = () => {
    setSelectedAns(null);
    setHasAnswered(false);
    let nextIdx = Math.floor(Math.random() * EXAM_QUESTIONS.length);
    if (nextIdx === currentQIdx) {
      nextIdx = (nextIdx + 1) % EXAM_QUESTIONS.length;
    }
    setCurrentQIdx(nextIdx);
  };

  // 4. Giả lập thị trường tài chính đơn giản cho sĩ tử tự học
  const [marketPrices, setMarketPrices] = useState([
    { code: "HBA", name: "Chỉ số Học Bá", price: 15.20, change: 3.5, desc: "Đo lường mức độ tiếp thu kiến thức và luyện đề của bạn." },
    { code: "SKH", name: "Chỉ số Sức Khỏe", price: 12.80, change: 1.2, desc: "Đo lường chế độ sinh hoạt và mức độ cân bằng thể chất." },
    { code: "TLY", name: "Tâm Lý Sĩ Tử", price: 10.50, change: -0.5, desc: "Đo lường mức độ vững vàng trước áp lực thi cử lớp 12." }
  ]);

  const updateMarketPrice = () => {
    setMarketPrices(prev => prev.map(stock => {
      const deltaPercent = (Math.random() * 6 - 2.8); // -2.8% to +3.2%
      const newChange = parseFloat((stock.change + deltaPercent / 1.5).toFixed(1));
      const newPrice = parseFloat((stock.price * (1 + deltaPercent / 100)).toFixed(2));
      return {
        ...stock,
        price: newPrice < 1 ? 1.00 : newPrice,
        change: newChange
      };
    }));
  };

  // 5. Gom cụm chương cho danh sách chương cực kỳ nhiều
  const GROUP_SIZE = 50;
  const numGroups = Math.ceil(chapters.length / GROUP_SIZE);
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [searchChapterNum, setSearchChapterNum] = useState('');

  // Sắp xếp chương
  const sortedChapters = [...chapters].sort((a, b) => {
    const orderA = a.order !== undefined ? a.order : 0;
    const orderB = b.order !== undefined ? b.order : 0;
    return chapterSortDesc ? orderB - orderA : orderA - orderB;
  });

  // Lấy danh sách chương hiển thị (hỗ trợ tìm kiếm nhanh & gom cụm)
  const displayedChapters = searchChapterNum.trim()
    ? sortedChapters.filter(chap => chap.title?.toLowerCase().includes(searchChapterNum.trim().toLowerCase()))
    : sortedChapters.slice(selectedGroup * GROUP_SIZE, (selectedGroup + 1) * GROUP_SIZE);

  return (
    <div className="w-full min-h-screen bg-[#0D121D] text-[#ECEFF4] font-lora selection:bg-[#A2B6CD]/30 selection:text-[#ECEFF4] relative overflow-hidden pb-16">
      
      {/* Abstract elegant background design with subtle lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#233145]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#A2B6CD]/20 to-transparent" />
      
      {/* 1. TOP HEADER WITH STATS SUMMARY */}
      <header className="border-b border-[#2D3D54]/40 bg-[#121824]/95 backdrop-blur-md sticky top-0 z-50 text-[#ECEFF4]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg border border-[#2D3D54]/50 hover:border-[#A2B6CD] text-[#A2B6CD] hover:text-[#101622] hover:bg-[#A2B6CD] transition-all bg-[#151C28]"
              title="Quay lại Trang chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-alegreya text-lg font-bold text-[#ECEFF4] leading-tight">
                {story?.title || "Người Đẹp Ốm Yếu Không Giãy Giụa Nữa"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Save story button */}
            <button
              onClick={handleSaveToggle}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all font-medium text-xs border ${
                savedStories.includes(story.id)
                  ? 'bg-[#A2B6CD] border-[#A2B6CD] text-[#101622] font-bold'
                  : 'border-[#2D3D54]/40 text-[#A2B6CD] hover:bg-[#A2B6CD] hover:text-[#101622]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>{savedStories.includes(story.id) ? 'Đang lưu trữ' : 'Lưu tủ sách'}</span>
            </button>

            {story.externalUrl && (
              <a
                href={story.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-[#233145] text-[#ECEFF4] border border-[#233145] hover:bg-[#A2B6CD] hover:text-[#101622] transition-all font-medium text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Đọc bản gốc</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 2. THREE-COLUMN CORE DESK LAYOUT */}
      <main className="max-w-[1400px] mx-auto px-4 mt-6 md:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= COLUMN 1: SICKLY BEAUTY HEALTH CABINET & REVENGE SYSTEM (LG: 3/12) ================= */}
          <section className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-[74px]">
            
            {/* NOVEL COVER CARD */}
            {story?.coverUrl && (
              <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg flex flex-col items-center">
                <div className="absolute top-2 right-2 border border-[#2D3D54]/40 text-[#A2B6CD] text-[8px] font-lora px-1.5 py-0.5 uppercase tracking-widest bg-black/40">
                  MẪU BÌA CHÍNH THỨC
                </div>
                <div className="w-full aspect-[2/3] overflow-hidden rounded-lg border border-[#2D3D54]/20 shadow-inner relative group">
                  <img 
                    src={story.coverUrl} 
                    alt={story.title} 
                    className="w-full h-full object-cover rounded-lg shadow-[2px_2px_0_0_#233145] group-hover:shadow-[4px_4px_0_0_#A2B6CD] transition-all duration-300" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151C28] via-transparent to-transparent opacity-60" />
                </div>
                  {/* No admission header */}
              </div>
            )}
            
            {/* INDICATORS CARD */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <div className="absolute top-1 right-2 p-1 text-[#A2B6CD]/20 font-alegreya text-3xl font-bold select-none pointer-events-none">
                35.8°C
              </div>
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-4 flex items-center gap-2 font-bold">
                <Heart className="w-3.5 h-3.5 text-[#A2B6CD] animate-pulse" /> CHỈ SỐ SINH MỆNH
              </h2>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#ECEFF4]/70 font-lora">Nhịp tim (Heart Rate):</span>
                  <span className="text-sm font-lora font-bold text-[#ECEFF4] flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#A2B6CD] animate-pulse" />
                    {heartRate} BPM
                  </span>
                </div>
                <div className="w-full bg-[#101622]/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#A2B6CD] h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(Math.max((heartRate - 50) * 3, 20), 100)}%` }} 
                  />
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#ECEFF4]/70 font-lora">Thân nhiệt (Body Temp):</span>
                  <span className="text-xs font-lora font-bold text-[#ECEFF4]">{bodyTemp.toFixed(1)}°C</span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#ECEFF4]/70 font-lora">Thể trạng:</span>
                  <span className="text-xs font-lora font-bold text-[#A2B6CD]">Duy trì ổn định</span>
                </div>
              </div>
            </div>

            {/* REVENGE CHECKLIST CARD -> CHUYỂN THÀNH 4 CHƯƠNG MỚI NHẤT */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-3 flex items-center gap-2 font-bold">
                <BookOpen className="w-3.5 h-3.5 text-[#A2B6CD]" /> SỔ TAY PHỤC THÙ
              </h2>
              
              <div className="flex flex-col gap-2.5">
                {[...chapters]
                  .sort((a, b) => {
                    const orderA = a.order !== undefined ? a.order : 0;
                    const orderB = b.order !== undefined ? b.order : 0;
                    return orderB - orderA;
                  })
                  .slice(0, 4)
                  .map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => navigate(`/doc/${story.id}/${ch.id}`)}
                      className="w-full text-left p-2 rounded border border-[#2D3D54]/20 hover:border-[#A2B6CD]/60 bg-[#233145]/10 hover:bg-[#233145]/30 transition-all text-xs flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-[#ECEFF4] line-clamp-1 group-hover:text-[#A2B6CD]">
                        {ch.title}
                      </span>
                      <span className="text-[10px] text-[#A2B6CD] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Đọc ngay &rarr;
                      </span>
                    </button>
                  ))}
                {chapters.length === 0 && (
                  <p className="text-xs text-[#ECEFF4]/50 italic">Chưa có chương mới nào.</p>
                )}
              </div>
            </div>

            {/* REAL-TIME LOG -> CHUYỂN THÀNH 4 COMMENT MỚI NHẤT */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-3 rounded-lg text-[11px] font-lora text-[#ECEFF4]">
              <div className="flex items-center gap-1.5 text-[#A2B6CD] font-bold mb-2.5 uppercase text-[9px] tracking-wider border-b border-[#2D3D54]/30 pb-1.5">
                <span className="w-1.5 h-1.5 bg-[#A2B6CD] rounded-full animate-ping" />
                DÒNG THỜI GIAN HÀNH ĐỘNG
              </div>
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {[...comments]
                  .sort((a, b) => {
                    const getCommentTime = (c: any) => {
                      if (!c.createdAt) return 0;
                      if (c.createdAt.seconds) return c.createdAt.seconds * 1000;
                      if (typeof c.createdAt.toMillis === 'function') return c.createdAt.toMillis();
                      return new Date(c.createdAt).getTime();
                    };
                    return getCommentTime(b) - getCommentTime(a);
                  })
                  .slice(0, 4)
                  .map((c, i) => (
                    <div key={c.id || i} className="border-l border-[#A2B6CD]/30 pl-2 pb-1 last:pb-0">
                      <p className="font-bold text-[#A2B6CD] text-[10px] leading-tight">
                        {c.displayName || c.authorName || "Độc giả ẩn danh"}
                      </p>
                      <p className="text-[10px] text-[#ECEFF4]/85 leading-normal mt-0.5 line-clamp-2">
                        {c.content || c.text}
                      </p>
                    </div>
                  ))}
                {comments.length === 0 && (
                  <p className="text-[10px] text-[#ECEFF4]/40 italic">Chưa có bình luận nào thảo luận.</p>
                )}
              </div>
            </div>

          </section>

          {/* ================= COLUMN 2: PRIMARY INTERACTIVE BODY (LG: 6/12) ================= */}
          <section className="lg:col-span-6 flex flex-col gap-6">
            
            {/* NOVEL BANNER & ADMISSIONS COVER */}
            <div className="relative border border-[#2D3D54]/30 bg-[#151C28] p-6 md:p-8 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center text-center text-[#ECEFF4]">
              {/* Ribbon removed */}

              {/* Delicate lace-like corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#2D3D54]/30" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#2D3D54]/30" />

              {/* Subtitle badge removed */}

              <h2 className="font-alegreya text-2xl md:text-3xl lg:text-4xl font-bold text-[#ECEFF4] tracking-tight leading-tight mb-4">
                {story?.title || "NGƯỜI ĐẸP ỐM YẾU KHÔNG GIẠY GIỤA NỮA"}
              </h2>

              {(() => {
                const desc = story?.description || story?.summary || "Đời trước bị cha ruột hãm hại, chị kế cướp đoạt sản nghiệp, chết thảm trong bệnh viện. Quay lại năm 17 tuổi, cầm trên tay bản kế hoạch báo thù tối mật cùng bộ não học bá tuyệt đỉnh, ta sẽ lấy lại tất cả những gì vốn thuộc về mình!";
                const needsTruncate = desc.length > 200;
                const displayText = (needsTruncate && !isDescExpanded) 
                  ? `${desc.slice(0, 200).trim()}...` 
                  : desc;
                return (
                  <>
                    <p className="text-xs text-[#ECEFF4]/80 max-w-lg mb-4 leading-relaxed text-left w-full whitespace-pre-line transition-all duration-300">
                      {displayText}
                    </p>
                    {needsTruncate && (
                      <button
                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                        className="text-[10px] text-[#A2B6CD] font-bold uppercase tracking-wider hover:text-[#ECEFF4] hover:underline mb-4 transition-colors flex items-center gap-1 focus:outline-none"
                      >
                        {isDescExpanded ? "Thu gọn giới thiệu ↑" : "Xem thêm giới thiệu ↓"}
                      </button>
                    )}
                  </>
                );
              })()}

              {/* Author and stats metadata row */}
              <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-[#2D3D54]/40 text-xs text-center">
                <div>
                  <span className="block text-[#ECEFF4]/50 text-[10px] uppercase font-lora mb-1">Tác giả</span>
                  <span className="font-bold text-[#A2B6CD]">{story?.author || "Đang cập nhật"}</span>
                </div>
                <div>
                  <span className="block text-[#ECEFF4]/50 text-[10px] uppercase font-lora mb-1">Số chương</span>
                  <span className="font-bold text-[#ECEFF4]">{chapters.length} chương</span>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR: CHAPTERS OR COMMENTS */}
            <div className="flex border-b border-[#151C28] gap-1">
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 py-3 text-center text-xs font-lora tracking-widest uppercase transition-all border-b-2 font-bold flex items-center justify-center gap-2 rounded-t-lg ${
                  activeTab === 'chapters'
                    ? 'border-[#A2B6CD] text-[#A2B6CD] bg-[#151C28]'
                    : 'border-transparent text-[#ECEFF4]/70 hover:text-[#A2B6CD] hover:bg-[#151C28]/50'
                }`}
              >
                <BookOpen className="w-4 h-4" /> ĐỀ THI ÔN LUYỆN
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 text-center text-xs font-lora tracking-widest uppercase transition-all border-b-2 font-bold flex items-center justify-center gap-2 rounded-t-lg ${
                  activeTab === 'comments'
                    ? 'border-[#A2B6CD] text-[#A2B6CD] bg-[#151C28]'
                    : 'border-transparent text-[#ECEFF4]/70 hover:text-[#A2B6CD] hover:bg-[#151C28]/50'
                }`}
              >
                <Users className="w-4 h-4" /> THẢO LUẬN THƯƠNG HỘI
              </button>
            </div>

            {/* ================= TAB 1: CHAPTERS LISTING ================= */}
            {activeTab === 'chapters' && (
              <div className="flex flex-col gap-4">
                
                {/* Search & Sort & Group Selection Row */}
                <div className="flex flex-col gap-3 bg-[#151C28] p-3 border border-[#2D3D54]/30 rounded-lg text-[#ECEFF4]">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="text-xs text-[#ECEFF4]/80 font-lora pl-1">
                      Tổng số: <strong className="text-[#A2B6CD]">{chapters.length}</strong> bài ôn luyện
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCompactMode(!isCompactMode)}
                        className={`px-3 py-1.5 text-[10px] font-lora uppercase border rounded transition-colors font-bold ${
                          isCompactMode 
                            ? "bg-[#A2B6CD] text-[#101622] border-[#A2B6CD]" 
                            : "bg-[#233145]/30 border-[#2D3D54]/30 text-[#A2B6CD] hover:bg-[#A2B6CD] hover:text-[#101622]"
                        }`}
                        title={isCompactMode ? "Chuyển sang dạng card đầy đủ thông tin" : "Chuyển sang dạng danh sách đề thi siêu gọn"}
                      >
                        {isCompactMode ? "Bản siêu gọn ✓" : "Bản đầy đủ"}
                      </button>

                      <button
                        onClick={() => setChapterSortDesc(!chapterSortDesc)}
                        className="px-3 py-1.5 text-[10px] font-lora uppercase bg-[#233145]/30 border border-[#2D3D54]/30 text-[#A2B6CD] rounded hover:bg-[#A2B6CD] hover:text-[#101622] transition-colors font-bold"
                      >
                        {chapterSortDesc ? "Mới nhất" : "Cũ nhất"}
                      </button>
                    </div>
                  </div>

                  {/* Thanh tìm kiếm nhanh chương */}
                  <div className="w-full relative mt-1">
                    <input
                      type="text"
                      placeholder="Tìm nhanh theo số chương hoặc tiêu đề (ví dụ: 'Chương 42', '42')..."
                      value={searchChapterNum}
                      onChange={(e) => setSearchChapterNum(e.target.value)}
                      className="w-full px-3 py-2 bg-black/35 border border-[#2D3D54]/30 focus:border-[#A2B6CD] rounded text-xs text-[#ECEFF4] placeholder-[#4B5E78] focus:outline-none transition-all"
                    />
                  </div>

                  {/* Chọn cụm chương gom gọn (Ví dụ: Cụm 50 chương) */}
                  {!searchChapterNum.trim() && numGroups > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#2D3D54]/50 scrollbar-track-transparent mt-1">
                      {Array.from({ length: numGroups }).map((_, idx) => {
                        const start = idx * GROUP_SIZE + 1;
                        const end = Math.min((idx + 1) * GROUP_SIZE, chapters.length);
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedGroup(idx)}
                            className={`px-3 py-1.5 rounded text-[10px] font-semibold whitespace-nowrap border transition-all ${
                              selectedGroup === idx
                                ? 'bg-[#A2B6CD] text-[#101622] border-[#A2B6CD] font-bold'
                                : 'border-[#2D3D54]/25 text-[#A2B6CD] hover:bg-[#233145]/30 bg-[#233145]/10'
                            }`}
                          >
                            Chương {start} - {end}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Chapter list layout */}
                {displayedChapters.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#2D3D54]/30 rounded-xl bg-[#151C28]">
                    <p className="text-[#ECEFF4]/70 text-sm font-alegreya italic">Không tìm thấy bài ôn thi nào phù hợp với yêu cầu tìm kiếm của bạn...</p>
                  </div>
                ) : isCompactMode ? (
                  /* COMPACT MODE: Giao diện siêu gọn tiết kiệm diện tích */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-2.5">
                    {displayedChapters.map((chap) => {
                      const absoluteIndex = chapters.findIndex(c => c.id === chap.id) + 1;
                      const isLocked = chap.isLocked && !unlockedPassChapters.includes(chap.id);
                      const isEarly = chap.isEarlyAccess && !unlockedEarlyAccessChapters.includes(chap.id);
                      
                      return (
                        <button
                          key={chap.id}
                          onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                          className="group text-left p-2.5 rounded-lg border border-[#2D3D54]/15 hover:border-[#A2B6CD]/80 bg-[#151C28] hover:bg-[#233145]/20 transition-all flex flex-col justify-between h-[66px] relative overflow-hidden shadow-sm"
                          title={chap.title}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[8px] md:text-[9px] font-mono text-[#A2B6CD]/80 font-bold tracking-wider">
                              MÃ ĐỀ {absoluteIndex.toString().padStart(2, '0')}
                            </span>
                            {isLocked ? (
                              <span className="text-[8px] bg-red-900/30 px-1 rounded text-red-300 scale-90 origin-right">KHÓA</span>
                            ) : isEarly ? (
                              <span className="text-[8px] bg-[#A2B6CD]/20 px-1 rounded text-[#A2B6CD] scale-90 origin-right">SỚM</span>
                            ) : null}
                          </div>

                          <div className="text-[11px] md:text-xs font-alegreya font-bold text-[#ECEFF4] group-hover:text-[#A2B6CD] transition-colors truncate mt-1 leading-tight w-full">
                            {chap.title}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* FULL MODE: Giao diện card đầy đủ thông tin */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {displayedChapters.map((chap) => {
                      const absoluteIndex = chapters.findIndex(c => c.id === chap.id) + 1;
                      const isLocked = chap.isLocked && !unlockedPassChapters.includes(chap.id);
                      const isEarly = chap.isEarlyAccess && !unlockedEarlyAccessChapters.includes(chap.id);
                      
                      return (
                        <button
                          key={chap.id}
                          onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                          className="group text-left p-4 rounded-xl border border-[#2D3D54]/15 hover:border-[#A2B6CD]/80 bg-gradient-to-br from-[#151C28] to-[#151C28]/90 hover:from-[#233145]/40 hover:to-[#151C28] transition-all shadow hover:shadow-xl flex flex-col justify-between h-[120px] relative overflow-hidden"
                        >
                          {/* Top Tag row */}
                          <div className="flex justify-between items-start w-full gap-2 z-10">
                            <span className="text-[9px] font-lora text-[#A2B6CD] tracking-wider uppercase">
                              MÃ ĐỀ LUYỆN {absoluteIndex.toString().padStart(2, '0')}
                            </span>
                            
                            {isLocked ? (
                              <span className="text-[9px] font-lora px-1.5 py-0.5 rounded bg-[#233145]/50 border border-[#233145] text-[#ECEFF4]/70">
                                CHƯA PHÊ DUYỆT
                              </span>
                            ) : isEarly ? (
                              <span className="text-[9px] font-lora px-1.5 py-0.5 rounded bg-[#A2B6CD]/20 border border-[#A2B6CD]/30 text-[#A2B6CD]">
                                ĐỌC SỚM
                              </span>
                            ) : null}
                          </div>

                          {/* Chapter Title */}
                          <div className="my-2 z-10">
                            <h3 className="font-alegreya text-sm font-bold text-[#ECEFF4] group-hover:text-[#A2B6CD] transition-colors line-clamp-2">
                              {chap.title}
                            </h3>
                          </div>

                          {/* Foot detail */}
                          <div className="flex justify-between items-center w-full z-10">
                            <span className="text-[10px] text-[#ECEFF4]/60 font-lora">
                              {chap.createdAt ? format(new Date(chap.createdAt), 'dd/MM/yyyy') : "09/07/2026"}
                            </span>
                            
                            <span className="text-[10px] text-[#A2B6CD] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Luyện đề <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Phân trang footer nếu đang tìm kiếm hoặc khi số chương hiển thị dài */}
                {searchChapterNum.trim() && displayedChapters.length > 20 && (
                  <div className="text-center py-2 text-[10px] text-[#ECEFF4]/50 italic">
                    Hiển thị tối đa {displayedChapters.length} kết quả tìm kiếm thích hợp
                  </div>
                )}

              </div>
            )}

            {/* ================= TAB 2: COMMENTS ================= */}
            {activeTab === 'comments' && (
              <div className="flex flex-col gap-6">
                
                {/* COMMENT BOX */}
                <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative text-[#ECEFF4]">
                  <h3 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase mb-3 flex items-center gap-1.5 font-bold">
                    <Send className="w-3.5 h-3.5" /> Gửi Công Văn Thảo Luận
                  </h3>

                  <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={isLoggedIn ? "Nhập ý kiến đóng góp cho thương hội tại đây..." : "Bạn cần đăng nhập để tham gia thảo luận!"}
                      rows={3}
                      disabled={!isLoggedIn}
                      className="w-full p-3 border border-[#2D3D54]/40 bg-black/25 text-[#ECEFF4] placeholder-[#4B5E78] focus:outline-none focus:border-[#A2B6CD] rounded-lg text-xs sm:text-sm resize-none transition-all disabled:opacity-40"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-lora text-[#ECEFF4]/60">
                        {isLoggedIn ? `Đang đăng nhập: ${displayName || "Thành viên"}` : "Kênh ngoại tuyến"}
                      </span>
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim() || !isLoggedIn}
                        className="px-5 py-2 rounded font-bold font-lora tracking-wider bg-[#A2B6CD] text-[#101622] hover:bg-[#ECEFF4] transition-colors text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {submittingComment ? "Đang gửi..." : "Trình duyệt ý kiến"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* DISCUSSION THREAD LIST */}
                <div className="flex flex-col gap-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[#2D3D54]/30 rounded-xl bg-[#151C28]">
                      <p className="text-[#ECEFF4]/70 text-xs font-alegreya italic font-bold">Thương hội chưa có công văn nào. Hãy là người đầu tiên đặt câu hỏi!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {comments.map((comm) => {
                        const cacheUser = profilesCache[comm.uid] || {};
                        const avatar = cacheUser.avatarUrl || comm.avatarUrl || '';
                        return (
                          <div key={comm.id} className="p-4 border border-[#2D3D54]/20 bg-[#151C28] text-[#ECEFF4] rounded-xl relative shadow">
                            
                            <div className="flex justify-between items-start gap-4 mb-2">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar 
                                  avatarUrl={avatar}
                                  equippedAccessory={cacheUser.equippedAccessory || comm.equippedAccessory}
                                  accessoryPosition={cacheUser.accessoryPosition || comm.accessoryPosition}
                                  className="w-8 h-8 rounded-full border border-[#2D3D54]/40"
                                />
                                <div>
                                  <h4 className="text-xs font-bold text-[#A2B6CD]">
                                    {comm.displayName || comm.authorName || "Nhà lữ hành ẩn danh"}
                                  </h4>
                                  <span className="text-[9px] font-lora text-[#ECEFF4]/50">
                                    {comm.createdAt ? format(new Date(comm.createdAt?.seconds ? comm.createdAt.seconds * 1000 : (comm.createdAt?.toMillis ? comm.createdAt.toMillis() : comm.createdAt)), 'dd/MM/yyyy HH:mm') : "Đang cập nhật"}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[9px] font-lora text-[#ECEFF4]/40 tracking-widest uppercase">
                                #{comm.id?.slice(-4) || "MSG"}
                              </span>
                            </div>

                            <p className="text-xs leading-relaxed text-[#ECEFF4] pl-11">
                              {comm.content || comm.text}
                            </p>

                            {/* REPLIES CONTAINER */}
                            {comm.replies && comm.replies.length > 0 && (
                              <div className="mt-3.5 pl-11 flex flex-col gap-3 border-l border-[#2D3D54]/40 ml-3.5">
                                {comm.replies.map((rep: any, idx: number) => {
                                  const cacheRepUser = profilesCache[rep.uid] || {};
                                  const repAvatar = cacheRepUser.avatarUrl || rep.avatarUrl || '';
                                  return (
                                    <div key={rep.id || idx} className="text-xs">
                                      <div className="flex items-center gap-2 mb-1">
                                        <UserAvatar 
                                          avatarUrl={repAvatar}
                                          equippedAccessory={cacheRepUser.equippedAccessory || rep.equippedAccessory}
                                          accessoryPosition={cacheRepUser.accessoryPosition || rep.accessoryPosition}
                                          className="w-5 h-5 rounded-full border border-[#2D3D54]/40"
                                        />
                                        <span className="font-bold text-[#A2B6CD] text-[11px]">{rep.displayName || rep.authorName || "Cố vấn ẩn danh"}</span>
                                        <span className="text-[9px] font-lora text-[#ECEFF4]/50">
                                          {rep.createdAt ? format(new Date(rep.createdAt?.seconds ? rep.createdAt.seconds * 1000 : (rep.createdAt?.toMillis ? rep.createdAt.toMillis() : rep.createdAt)), 'dd/MM HH:mm') : ""}
                                        </span>
                                      </div>
                                      <p className="text-[#ECEFF4]/85 pl-6 leading-relaxed">
                                        {rep.content || rep.text}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Inline reply action */}
                            <div className="mt-2.5 pl-11 flex justify-end">
                              {replyingToId === comm.id ? (
                                <div className="w-full flex flex-col gap-2 bg-black/25 p-2 rounded-lg border border-[#2D3D54]/30">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Nhập phản hồi cố vấn..."
                                    rows={2}
                                    className="w-full p-2 bg-[#151C28]/80 text-xs text-[#ECEFF4] placeholder-[#4B5E78] focus:outline-none focus:border-[#A2B6CD] border border-[#2D3D54]/40 rounded"
                                  />
                                  <div className="flex justify-end gap-2 text-[10px]">
                                    <button
                                      onClick={() => setReplyingToId(null)}
                                      className="px-2 py-1 text-[#ECEFF4]/50 hover:text-[#ECEFF4]"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      onClick={() => handleSendReply(comm)}
                                      disabled={submittingReply || !replyText.trim()}
                                      className="px-3 py-1 bg-[#A2B6CD] text-[#101622] font-bold uppercase rounded disabled:opacity-40"
                                    >
                                      Gửi cố vấn
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!isLoggedIn) return;
                                    setReplyingToId(comm.id);
                                  }}
                                  className="text-[10px] font-lora text-[#A2B6CD] hover:text-[#ECEFF4] flex items-center gap-1"
                                >
                                  Phản hồi cố vấn <Send className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </section>

          {/* ================= COLUMN 3: ACADEMIC GRADES & STOCK MARKET LEDGER (LG: 3/12) ================= */}
          <section className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-[74px]">
            
            {/* EXAM REVISION BOARD (CHUYỂN THÀNH CÂU HỎI TRẮC NGHIỆM ĐƠN GIẢN NGẪU NHIÊN) */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <div className="flex justify-between items-center border-b border-[#2D3D54]/40 pb-2 mb-3.5">
                <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase flex items-center gap-2 font-bold">
                  <GraduationCap className="w-4 h-4 text-[#A2B6CD]" /> CÂU HỎI ÔN THI ĐẠI HỌC
                </h2>
                <span className="text-[10px] font-lora text-[#A2B6CD] bg-[#A2B6CD]/10 px-1.5 py-0.5 rounded font-bold">
                  {examScore} Điểm
                </span>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                {/* Câu hỏi */}
                <p className="font-bold text-[#ECEFF4] leading-relaxed mb-1">
                  Câu {currentQIdx + 1}: {EXAM_QUESTIONS[currentQIdx].question}
                </p>

                {/* Các đáp án */}
                <div className="flex flex-col gap-2">
                  {EXAM_QUESTIONS[currentQIdx].options.map((opt, idx) => {
                    let btnStyle = "border-[#2D3D54]/30 bg-[#233145]/10 text-[#ECEFF4]/90 hover:bg-[#233145]/30 hover:border-[#A2B6CD]/50";
                    if (hasAnswered) {
                      if (idx === EXAM_QUESTIONS[currentQIdx].correct) {
                        btnStyle = "bg-[#A2B6CD]/20 border-[#A2B6CD] text-[#A2B6CD] font-semibold";
                      } else if (selectedAns === idx) {
                        btnStyle = "bg-red-950/20 border-red-500/40 text-red-300";
                      } else {
                        btnStyle = "opacity-40 border-[#2D3D54]/10 bg-[#233145]/5 text-[#ECEFF4]/60";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={hasAnswered}
                        onClick={() => handleAnswerClick(idx)}
                        className={`w-full text-left p-2.5 rounded border transition-all text-[11px] leading-snug ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Giải thích câu hỏi */}
                {hasAnswered && (
                  <div className="mt-2 p-2.5 bg-black/35 border border-[#2D3D54]/35 rounded text-[10px] text-[#ECEFF4]/80 leading-relaxed animate-fade-in">
                    <p className="text-[#A2B6CD] font-bold mb-0.5 uppercase tracking-wider text-[9px]">Lý giải đáp án:</p>
                    <p className="italic">{EXAM_QUESTIONS[currentQIdx].explanation}</p>
                  </div>
                )}

                {/* Nút câu tiếp theo */}
                {hasAnswered && (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full mt-1.5 py-1.5 border border-[#A2B6CD]/40 hover:border-[#A2B6CD] text-[10px] font-lora text-[#A2B6CD] hover:bg-[#A2B6CD] hover:text-[#101622] bg-[#A2B6CD]/5 transition-all rounded uppercase font-bold"
                  >
                    Luyện câu hỏi tiếp theo &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* INTERACTIVE STUDY SCHEDULE */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-3 flex items-center gap-2 font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#A2B6CD]" /> LỊCH TRÌNH ÔN THI HIỆU QUẢ
              </h2>

              <div className="flex flex-col gap-2">
                {schedule.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleTask(item.id)}
                    className="w-full text-left flex items-start gap-2.5 p-2 rounded hover:bg-[#233145]/20 transition-all text-xs"
                  >
                    <span className="mt-0.5 text-[#A2B6CD]">
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#A2B6CD]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#233145]" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-lora text-[9px] px-1 py-0.1 bg-black/30 text-[#A2B6CD] rounded">
                          {item.time}
                        </span>
                      </div>
                      <p className={`leading-relaxed text-xs ${item.completed ? 'line-through text-[#ECEFF4]/50' : 'text-[#ECEFF4]'}`}>
                        {item.text}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* COMMERCE / INVESTMENT WATCH (THƯƠNG TRƯỜNG BIẾN ĐỘNG CỦA SĨ TỬ) */}
            <div className="border border-[#2D3D54]/30 bg-[#151C28] p-4 rounded-xl relative shadow-lg text-[#ECEFF4]">
              <div className="absolute top-2 right-2 border border-[#2D3D54]/40 text-[#A2B6CD] text-[9px] font-lora px-1.5 py-0.1 rounded bg-[#A2B6CD]/10 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A2B6CD] animate-pulse" />
                ĐANG CHẠY
              </div>

              <h2 className="text-xs font-lora tracking-widest text-[#A2B6CD] uppercase border-b border-[#2D3D54]/40 pb-2 mb-3.5 flex items-center gap-2 font-bold">
                <TrendingUp className="w-4 h-4 text-[#A2B6CD]" /> THƯƠNG TRƯỜNG BIẾN ĐỘNG
              </h2>

              <div className="flex flex-col gap-3 text-xs">
                {marketPrices.map((stock) => (
                  <div key={stock.code} className="flex flex-col gap-0.5 border-b border-[#2D3D54]/10 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#ECEFF4] font-lora flex items-center gap-1.5">
                        <span className="text-[10px] bg-[#A2B6CD]/10 text-[#A2B6CD] border border-[#A2B6CD]/20 px-1 py-0.1 rounded font-bold">
                          {stock.code}
                        </span>
                        {stock.name}
                      </span>
                      <span className={`font-bold font-lora text-[11px] ${stock.change >= 0 ? "text-[#A2B6CD]" : "text-red-400"}`}>
                        {stock.price.toFixed(2)} ({stock.change >= 0 ? "+" : ""}{stock.change}%)
                      </span>
                    </div>
                    <span className="text-[10px] text-[#ECEFF4]/50 leading-normal">
                      {stock.desc}
                    </span>
                  </div>
                ))}

                <button
                  onClick={updateMarketPrice}
                  className="w-full mt-1.5 py-2 border border-[#2D3D54]/30 hover:border-[#A2B6CD] text-xs font-lora text-[#101622] bg-[#A2B6CD] hover:bg-[#ECEFF4] transition-all rounded uppercase font-bold"
                >
                  Cập nhật các chỉ số tự học
                </button>
              </div>
            </div>

          </section>

        </div>
      </main>

    </div>
  );
}

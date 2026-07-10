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

  // 1. Easter Egg States for Sickly Beauty Theme
  const [heartRate, setHeartRate] = useState(72);
  const [medPills, setMedPills] = useState(3);
  const [teaTemp, setTeaTemp] = useState(45);
  const [bodyTemp, setBodyTemp] = useState(35.8);
  const [isBrewing, setIsBrewing] = useState(false);
  const [systemLog, setSystemLog] = useState<string[]>([
    "Trùng sinh thành công về năm 17 tuổi.",
    "Khởi động tiến trình ôn thi đại học & âm thầm thu gom cổ phiếu.",
    "Bắt đầu thiết lập mạng lưới báo thù Lâm gia."
  ]);

  // 2. Interactive Schedule Tasks
  const [schedule, setSchedule] = useState([
    { id: 1, time: "06:00", text: "Uống một ngụm thuốc đắng, đọc từ vựng Tiếng Anh", completed: true },
    { id: 2, time: "08:00", text: "Luyện đề thi đại học môn Toán (Mục tiêu 150 điểm)", completed: true },
    { id: 3, time: "14:00", text: "Đọc báo cáo tài chính Thẩm thị, thu mua cổ phiếu ngầm", completed: false },
    { id: 4, time: "20:00", text: "Thực thi kế hoạch thanh trừng Lâm gia từng bước", completed: false }
  ]);

  // 3. Interactive Revenge targets
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const targets = [
    { 
      id: "lamhai", 
      name: "Lâm Hải", 
      role: "Nhạc phụ hiểm độc (Bố đẻ kiếp trước hại chết mẹ)", 
      status: "Đã phá sản & Thụ án giam", 
      color: "text-[#808499] border-[#808499]/30 bg-[#808499]/5",
      detail: "Lâm Hải đã bị phanh phui tội danh trốn thuế và hối lộ. Toàn bộ tài sản công ty bị niêm phong. Đang thụ án 18 năm tù giam. Kế hoạch báo thù giai đoạn 1 hoàn tất viên mãn!" 
    },
    { 
      id: "lamthuc", 
      name: "Lâm Thục", 
      role: "Chị kế thâm hiểm (Cướp đoạt vị trí, hãm hại danh dự)", 
      status: "Trục xuất & Thân bại danh liệt", 
      color: "text-[#808499] border-[#808499]/30 bg-[#808499]/5",
      detail: "Bị vạch trần vụ gian lận thi cử và ăn cắp bản thiết kế ngay trước toàn trường. Đã bị đuổi học khỏi trường chuyên, bị dư luận xã hội lên án dữ dội, không thể ngẩng đầu lên được." 
    },
    { 
      id: "thamtruc", 
      name: "Thẩm Trực", 
      role: "Định hôn phu bội bạc (Kiếp trước cấu kết hại chết ta)", 
      status: "Đang bị dồn vào chân tường", 
      color: "text-[#c5ad97] border-[#c5ad97]/30 bg-[#c5ad97]/5",
      detail: "Dự án đầu tư trung tâm thương mại của Thẩm gia bị FarEast (công ty con của ta) nẫng tay trên. Thẩm thị đang đứng trước nguy cơ gánh khoản nợ xấu 500 tỷ đồng, chuẩn bị tuyên bố phá sản." 
    },
    { 
      id: "lamthi", 
      name: "Tập đoàn Lâm Thị", 
      role: "Sản nghiệp vốn thuộc về mẹ ta", 
      status: "Đã thu mua ngầm 65%", 
      color: "text-[#c5ad97] border-[#c5ad97]/30 bg-[#c5ad97]/5",
      detail: "Đã âm thầm dùng pháp nhân nước ngoài FarEast thu gom toàn bộ cổ phần trôi nổi trên thị trường chứng khoán. Hiện nắm giữ 65% quyền biểu quyết, sẵn sàng tước quyền điều hành Lâm thị bất cứ lúc nào." 
    }
  ];

  // 4. Stock Market Live Simulator
  const [stockPrice, setStockPrice] = useState(142.5);
  const [stockChange, setStockChange] = useState(5.4);

  useEffect(() => {
    // Fluctuating heartbeat slightly
    const interval = setInterval(() => {
      setHeartRate(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next < 60 ? 60 : next > 82 ? 82 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    setSystemLog(prev => [msg, ...prev.slice(0, 5)]);
  };

  const handleTakeMedicine = () => {
    if (medPills <= 0) {
      addLog("Hết thuốc đông y đã sắc! Hãy bắt đầu sắc mẻ thuốc mới.");
      return;
    }
    setMedPills(prev => prev - 1);
    setHeartRate(72);
    setBodyTemp(36.5);
    setTeaTemp(prev => Math.min(prev + 5, 60));
    addLog("Bạn vừa uống một ngụm thuốc đông y đắng ngắt. Chỉ số nhịp tim ổn định ở mức 72 BPM, cơ thể ấm áp hơn.");
  };

  const handleBrewMedicine = () => {
    if (isBrewing) return;
    setIsBrewing(true);
    addLog("Bắt đầu sắc mẻ thuốc đông y bổ khí dưỡng huyết...");
    setTimeout(() => {
      setMedPills(3);
      setIsBrewing(false);
      addLog("Sắc thuốc hoàn tất! Bạn có thêm 3 liều thuốc duy trì thể chất.");
    }, 3000);
  };

  const handleBlowTea = () => {
    if (teaTemp <= 30) {
      addLog("Trà đã nguội lạnh. Hãy hâm nóng lại để tránh gây lạnh bụng.");
      return;
    }
    setTeaTemp(prev => Math.max(prev - 4, 30));
    addLog("Bạn khẽ thổi chén trà nóng nghi ngút khói. Hương thơm nhẹ dịu lan tỏa.");
  };

  const handleReheatTea = () => {
    setTeaTemp(55);
    addLog("Hâm nóng lại chén trà hoa cúc tuyết. Nhiệt độ hiện tại: 55°C.");
  };

  const toggleTask = (id: number) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.completed;
        addLog(`Đã cập nhật mục lịch trình: [${nextState ? "X" : " "}] ${item.text}`);
        return { ...item, completed: nextState };
      }
      return item;
    }));
  };

  const updateMarketPrice = () => {
    const deltaPercent = (Math.random() * 6 - 2.5); // -2.5% to +3.5%
    const change = parseFloat((stockChange + deltaPercent / 2).toFixed(1));
    const factor = 1 + deltaPercent / 100;
    const price = parseFloat((stockPrice * factor).toFixed(3));
    setStockPrice(price);
    setStockChange(change);
    addLog(`Thị trường biến động: Cổ phiếu FarEast giao dịch ở mức ${price.toFixed(3)} VND (${change >= 0 ? "+" : ""}${change}%)`);
  };

  const activeTargetObj = targets.find(t => t.id === selectedTarget);

  // Pagination for chapters
  const sortedChapters = [...chapters].sort((a, b) => {
    const orderA = a.order !== undefined ? a.order : 0;
    const orderB = b.order !== undefined ? b.order : 0;
    return chapterSortDesc ? orderB - orderA : orderA - orderB;
  });

  const displayedChapters = sortedChapters.slice(
    chapterPage * CHAPTERS_PER_PAGE,
    (chapterPage + 1) * CHAPTERS_PER_PAGE
  );

  return (
    <div className="w-full min-h-screen bg-[#808499] text-[#251e23] font-sans selection:bg-[#c5ad97]/30 selection:text-[#dfdee0] relative overflow-hidden pb-16">
      
      {/* Abstract elegant background design with subtle lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#604239]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#251e23]/20 to-transparent" />
      
      {/* 1. TOP HEADER WITH STATS SUMMARY */}
      <header className="border-b border-[#251e23]/20 bg-[#808499]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg border border-[#251e23]/30 hover:border-[#dfdee0] text-[#251e23] hover:text-[#dfdee0] hover:bg-[#251e23] transition-all bg-[#808499]"
              title="Quay lại Trang chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#251e23]/80 uppercase flex items-center gap-1.5 font-bold">
                <Clock className="w-3 h-3 text-[#251e23] animate-spin-slow" /> HỒ SƠ KHỞI ĐỘNG TRÙNG SINH NĂM 17 TUỔI
              </span>
              <h1 className="font-serif text-lg font-bold text-[#251e23] leading-tight">
                {story?.title || "Người Đẹp Ốm Yếu Không Giãy Giụa Nữa"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Choco display */}
            <div className="hidden sm:flex items-center gap-2 bg-[#251e23]/10 border border-[#251e23]/20 px-3 py-1.5 rounded-md">
              <Gift className="w-4 h-4 text-[#251e23]" />
              <span>Choco của bạn: <strong className="text-[#251e23] font-bold">{choco}</strong></span>
            </div>

            {/* Save story button */}
            <button
              onClick={handleSaveToggle}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all font-medium text-xs border ${
                savedStories.includes(story.id)
                  ? 'bg-[#251e23] border-[#251e23] text-[#dfdee0]'
                  : 'border-[#251e23]/30 text-[#251e23] hover:bg-[#251e23] hover:text-[#dfdee0]'
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
                className="px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-[#251e23] text-[#dfdee0] border border-[#251e23] hover:bg-[#604239] hover:text-[#dfdee0] transition-all font-medium text-xs"
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
              <div className="border border-[#251e23]/20 bg-[#251e23] p-4 rounded-xl relative shadow-lg flex flex-col items-center">
                <div className="absolute top-2 right-2 border border-[#808499]/30 text-[#dfdee0] text-[8px] font-mono px-1.5 py-0.5 uppercase tracking-widest bg-black/40">
                  MẪU BÌA CHÍNH THỨC
                </div>
                <div className="w-full aspect-[2/3] overflow-hidden rounded-lg border border-[#808499]/20 shadow-inner relative group">
                  <img 
                    src={story.coverUrl} 
                    alt={story.title} 
                    className="w-full h-full object-cover rounded-lg shadow-[2px_2px_0_0_#604239] group-hover:shadow-[4px_4px_0_0_#c5ad97] transition-all duration-300" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#251e23] via-transparent to-transparent opacity-60" />
                </div>
                <div className="mt-3 text-center">
                  <span className="text-[10px] font-mono text-[#c5ad97] uppercase tracking-wider">
                    HỒ SƠ TUYỂN SINH HOA HẠ
                  </span>
                </div>
              </div>
            )}
            
            {/* INDICATORS CARD */}
            <div className="border border-[#251e23]/20 bg-[#251e23] p-4 rounded-xl relative shadow-lg text-[#dfdee0]">
              <div className="absolute top-1 right-2 p-1 text-[#c5ad97]/20 font-serif text-3xl font-bold select-none pointer-events-none">
                35.8°C
              </div>
              <h2 className="text-xs font-mono tracking-widest text-[#c5ad97] uppercase border-b border-[#808499]/20 pb-2 mb-4 flex items-center gap-2 font-bold">
                <Heart className="w-3.5 h-3.5 text-[#c5ad97] animate-pulse" /> CHỈ SỐ SINH MỆNH
              </h2>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#dfdee0]/70 font-mono">Nhịp tim (Heart Rate):</span>
                  <span className="text-sm font-mono font-bold text-[#dfdee0] flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#c5ad97] animate-pulse" />
                    {heartRate} BPM
                  </span>
                </div>
                <div className="w-full bg-[#808499]/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#c5ad97] h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(Math.max((heartRate - 50) * 3, 20), 100)}%` }} 
                  />
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#dfdee0]/70 font-mono">Thân nhiệt (Body Temp):</span>
                  <span className="text-xs font-mono font-bold text-[#dfdee0]">{bodyTemp.toFixed(1)}°C</span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#dfdee0]/70 font-mono">Dược phẩm (Medicine):</span>
                  <span className="text-xs font-mono font-bold text-[#c5ad97]">{medPills} viên</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#dfdee0]/70 font-mono">Chén trà hoa cúc:</span>
                  <span className="text-xs font-mono font-bold text-[#c5ad97]">{teaTemp}°C</span>
                </div>
              </div>

              {/* ACTION BUTTONS (Easter eggs!) */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#808499]/20">
                <button
                  onClick={handleTakeMedicine}
                  className="px-2 py-1.5 text-[10px] font-bold font-mono text-center border border-[#c5ad97]/40 bg-[#c5ad97]/10 hover:bg-[#c5ad97] hover:text-[#251e23] transition-all uppercase rounded text-[#c5ad97]"
                >
                  Uống thuốc
                </button>
                <button
                  onClick={handleBrewMedicine}
                  disabled={isBrewing}
                  className="px-2 py-1.5 text-[10px] font-bold font-mono text-center border border-[#808499]/30 hover:border-[#dfdee0] bg-[#808499]/10 transition-all uppercase rounded text-[#dfdee0] disabled:opacity-40"
                >
                  {isBrewing ? "Đang sắc..." : "Sắc thuốc"}
                </button>
                <button
                  onClick={handleBlowTea}
                  className="px-2 py-1.5 text-[10px] font-bold font-mono text-center border border-[#808499]/30 hover:border-[#dfdee0] bg-[#808499]/10 transition-all uppercase rounded text-[#dfdee0]"
                >
                  Thổi trà
                </button>
                <button
                  onClick={handleReheatTea}
                  className="px-2 py-1.5 text-[10px] font-bold font-mono text-center border border-[#c5ad97]/40 bg-[#c5ad97]/10 hover:bg-[#c5ad97] hover:text-[#251e23] transition-all uppercase rounded text-[#c5ad97]"
                >
                  Hâm trà
                </button>
              </div>
            </div>

            {/* REVENGE CHECKLIST CARD */}
            <div className="border border-[#251e23]/20 bg-[#251e23] p-4 rounded-xl relative shadow-lg text-[#dfdee0]">
              <h2 className="text-xs font-mono tracking-widest text-[#c5ad97] uppercase border-b border-[#808499]/20 pb-2 mb-3 flex items-center gap-2 font-bold">
                <Skull className="w-3.5 h-3.5 text-[#c5ad97]" /> SỔ TAY PHỤC THÙ
              </h2>
              
              <div className="flex flex-col gap-2.5">
                {targets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTarget(selectedTarget === t.id ? null : t.id)}
                    className={`w-full text-left p-2.5 rounded border transition-all text-xs flex flex-col gap-1 ${
                      selectedTarget === t.id
                        ? 'border-[#c5ad97] bg-[#604239]/40'
                        : 'border-[#808499]/20 hover:border-[#c5ad97]/40 bg-[#808499]/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#dfdee0]">{t.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 ${t.id === 'thamtruc' ? 'text-[#c5ad97]' : 'text-[#808499]'}`}>
                        {t.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#dfdee0]/60 line-clamp-1">{t.role}</span>
                  </button>
                ))}
              </div>

              {/* Expansion Details */}
              {selectedTarget && activeTargetObj && (
                <div className="mt-3 p-3 bg-black/30 border border-[#808499]/20 rounded text-xs leading-relaxed animate-fade-in">
                  <p className="text-[#c5ad97] font-bold mb-1 uppercase tracking-wider text-[10px]">Nhật Ký Thực Thi:</p>
                  <p className="text-[#dfdee0] italic">"{activeTargetObj.detail}"</p>
                </div>
              )}
            </div>

            {/* REAL-TIME LOG */}
            <div className="border border-[#251e23]/20 bg-[#251e23] p-3 rounded-lg text-[11px] font-mono text-[#dfdee0]">
              <div className="flex items-center gap-1.5 text-[#c5ad97] font-bold mb-1.5 uppercase text-[9px] tracking-wider">
                <span className="w-1.5 h-1.5 bg-[#c5ad97] rounded-full animate-ping" />
                DÒNG THỜI GIAN HÀNH ĐỘNG
              </div>
              <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                {systemLog.map((log, i) => (
                  <p key={i} className="leading-normal">
                    <span className="text-[#c5ad97]">&gt;</span> {log}
                  </p>
                ))}
              </div>
            </div>

          </section>

          {/* ================= COLUMN 2: PRIMARY INTERACTIVE BODY (LG: 6/12) ================= */}
          <section className="lg:col-span-6 flex flex-col gap-6">
            
            {/* NOVEL BANNER & ADMISSIONS COVER */}
            <div className="relative border border-[#251e23]/20 bg-[#251e23] p-6 md:p-8 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center text-center text-[#dfdee0]">
              <div className="absolute top-2 right-2 border border-[#808499]/30 text-[#dfdee0]/70 text-[10px] font-mono px-2 py-0.5 uppercase tracking-widest bg-black/40 z-10">
                TRÙNG SINH CHI LỘ
              </div>

              {/* Delicate lace-like corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#808499]/30" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#808499]/30" />

              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-[#604239]/40 border border-[#c5ad97]/30 rounded-full text-xs text-[#c5ad97] font-serif italic">
                  Đại học Hoa Hạ • Học bá trùng sinh báo thù
                </span>
              </div>

              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-black text-[#dfdee0] tracking-tight leading-tight mb-4">
                NGƯỜI ĐẸP ỐM YẾU KHÔNG GIẠY GIỤA NỮA
              </h2>

              <p className="text-xs text-[#dfdee0]/80 max-w-lg mb-6 leading-relaxed text-center">
                Đời trước bị cha ruột hãm hại, chị kế cướp đoạt sản nghiệp, chết thảm trong bệnh viện. Quay lại năm 17 tuổi, cầm trên tay bản kế hoạch báo thù tối mật cùng bộ não học bá tuyệt đỉnh, ta sẽ lấy lại tất cả những gì vốn thuộc về mình!
              </p>

              {/* Author and stats metadata row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-4 border-t border-[#808499]/20 text-xs text-center">
                <div>
                  <span className="block text-[#dfdee0]/50 text-[10px] uppercase font-mono mb-1">Tác giả</span>
                  <span className="font-bold text-[#c5ad97]">{story?.author || "Đang cập nhật"}</span>
                </div>
                <div>
                  <span className="block text-[#dfdee0]/50 text-[10px] uppercase font-mono mb-1">Số chương</span>
                  <span className="font-bold text-[#dfdee0]">{chapters.length} chương</span>
                </div>
                <div>
                  <span className="block text-[#dfdee0]/50 text-[10px] uppercase font-mono mb-1">Chương đọc sớm</span>
                  <span className="font-bold text-[#c5ad97]">
                    {chapters.filter(c => c.isEarlyAccess).length} chương
                  </span>
                </div>
                <div>
                  <span className="block text-[#dfdee0]/50 text-[10px] uppercase font-mono mb-1">Mã tuyển sinh</span>
                  <span className="font-bold text-[#dfdee0] font-mono">华夏-2026</span>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR: CHAPTERS OR COMMENTS */}
            <div className="flex border-b border-[#251e23]/30">
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 py-3 text-center text-xs font-mono tracking-widest uppercase transition-all border-b-2 font-bold flex items-center justify-center gap-2 ${
                  activeTab === 'chapters'
                    ? 'border-[#251e23] text-[#251e23] bg-[#251e23]/10'
                    : 'border-transparent text-[#251e23]/70 hover:text-[#251e23] hover:bg-[#251e23]/5'
                }`}
              >
                <BookOpen className="w-4 h-4" /> ĐỀ THI ÔN LUYỆN (DANH SÁCH CHƯƠNG)
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 text-center text-xs font-mono tracking-widest uppercase transition-all border-b-2 font-bold flex items-center justify-center gap-2 ${
                  activeTab === 'comments'
                    ? 'border-[#251e23] text-[#251e23] bg-[#251e23]/10'
                    : 'border-transparent text-[#251e23]/70 hover:text-[#251e23] hover:bg-[#251e23]/5'
                }`}
              >
                <Users className="w-4 h-4" /> THẢO LUẬN THƯƠNG HỘI (BÌNH LUẬN)
              </button>
            </div>

            {/* ================= TAB 1: CHAPTERS LISTING ================= */}
            {activeTab === 'chapters' && (
              <div className="flex flex-col gap-4">
                
                {/* Search & Sort Row */}
                <div className="flex items-center justify-between gap-4 flex-wrap bg-[#251e23] p-2.5 border border-[#251e23]/20 rounded-lg text-[#dfdee0]">
                  <div className="text-xs text-[#dfdee0]/80 font-mono pl-2">
                    Tổng số: <strong className="text-[#c5ad97]">{chapters.length}</strong> bài ôn luyện
                  </div>
                  
                  <button
                    onClick={() => setChapterSortDesc(!chapterSortDesc)}
                    className="px-3 py-1.5 text-[10px] font-mono uppercase bg-[#808499]/10 border border-[#808499]/30 text-[#dfdee0] rounded hover:bg-[#c5ad97] hover:text-[#251e23] transition-colors"
                  >
                    Sắp xếp: {chapterSortDesc ? "Chương mới nhất" : "Chương đầu tiên"}
                  </button>
                </div>

                {/* Chapter list layout */}
                {displayedChapters.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#251e23]/30 rounded-xl">
                    <p className="text-[#251e23]/70 text-sm font-serif italic">Đề thi mẫu đang được biên soạn, hãy quay lại sau...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {displayedChapters.map((chap, i) => {
                      const absoluteIndex = (chapterPage * CHAPTERS_PER_PAGE) + i + 1;
                      const isLocked = chap.isLocked && !unlockedPassChapters.includes(chap.id);
                      const isEarly = chap.isEarlyAccess && !unlockedEarlyAccessChapters.includes(chap.id);
                      
                      return (
                        <button
                          key={chap.id}
                          onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                          className="group text-left p-4 rounded-xl border border-[#251e23]/20 hover:border-[#dfdee0] bg-gradient-to-br from-[#251e23] to-[#251e23]/90 hover:from-[#604239] hover:to-[#251e23] transition-all shadow hover:shadow-xl flex flex-col justify-between h-[120px] relative overflow-hidden"
                        >
                          {/* Top Tag row */}
                          <div className="flex justify-between items-start w-full gap-2 z-10">
                            <span className="text-[9px] font-mono text-[#c5ad97] tracking-wider uppercase">
                              MÃ ĐỀ LUYỆN {absoluteIndex.toString().padStart(2, '0')}
                            </span>
                            
                            {isLocked ? (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/40 border border-red-900/30 text-red-400">
                                CHƯA PHÊ DUYỆT
                              </span>
                            ) : isEarly ? (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#c5ad97]/20 border border-[#c5ad97]/30 text-[#c5ad97]">
                                ĐỌC SỚM
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#808499]/20 border border-[#808499]/30 text-[#dfdee0]">
                                MIỄN PHÍ
                              </span>
                            )}
                          </div>

                          {/* Chapter Title */}
                          <div className="my-2 z-10">
                            <h3 className="font-serif text-sm font-bold text-[#dfdee0] group-hover:text-[#c5ad97] transition-colors line-clamp-2">
                              {chap.title}
                            </h3>
                          </div>

                          {/* Foot detail */}
                          <div className="flex justify-between items-center w-full z-10">
                            <span className="text-[10px] text-[#dfdee0]/60 font-mono">
                              {chap.createdAt ? format(new Date(chap.createdAt), 'dd/MM/yyyy') : "09/07/2026"}
                            </span>
                            
                            <span className="text-[10px] text-[#c5ad97] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Luyện đề <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Pagination footer */}
                {chapters.length > CHAPTERS_PER_PAGE && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#251e23]/20">
                    <button
                      onClick={() => setChapterPage(Math.max(0, chapterPage - 1))}
                      disabled={chapterPage === 0}
                      className="px-3 py-1.5 rounded border border-[#251e23]/30 text-[#251e23] hover:bg-[#251e23] hover:text-[#dfdee0] transition-colors disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Trang trước
                    </button>
                    
                    <span className="text-xs font-mono text-[#251e23] font-bold">
                      Trang <strong className="text-[#dfdee0] bg-[#251e23] px-2 py-0.5 rounded">{chapterPage + 1}</strong> / {Math.ceil(chapters.length / CHAPTERS_PER_PAGE)}
                    </span>

                    <button
                      onClick={() => setChapterPage(Math.min(Math.ceil(chapters.length / CHAPTERS_PER_PAGE) - 1, chapterPage + 1))}
                      disabled={(chapterPage + 1) * CHAPTERS_PER_PAGE >= chapters.length}
                      className="px-3 py-1.5 rounded border border-[#251e23]/30 text-[#251e23] hover:bg-[#251e23] hover:text-[#dfdee0] transition-colors disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center gap-1"
                    >
                      Trang sau <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* ================= TAB 2: COMMENTS ================= */}
            {activeTab === 'comments' && (
              <div className="flex flex-col gap-6">
                
                {/* COMMENT BOX */}
                <div className="border border-[#251e23]/20 bg-[#251e23] p-4 rounded-xl relative text-[#dfdee0]">
                  <h3 className="text-xs font-mono tracking-widest text-[#c5ad97] uppercase mb-3 flex items-center gap-1.5 font-bold">
                    <Send className="w-3.5 h-3.5" /> Gửi Công Văn Thảo Luận
                  </h3>

                  <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={isLoggedIn ? "Nhập ý kiến đóng góp cho thương hội tại đây..." : "Bạn cần đăng nhập để tham gia thảo luận!"}
                      rows={3}
                      disabled={!isLoggedIn}
                      className="w-full p-3 border border-[#808499]/30 bg-black/20 text-[#dfdee0] placeholder-[#808499] focus:outline-none focus:border-[#c5ad97] rounded-lg text-xs sm:text-sm resize-none transition-all disabled:opacity-40"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-[#dfdee0]/60">
                        {isLoggedIn ? `Đang đăng nhập: ${displayName || "Thành viên"}` : "Kênh ngoại tuyến"}
                      </span>
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim() || !isLoggedIn}
                        className="px-5 py-2 rounded font-bold font-mono tracking-wider bg-[#c5ad97] text-[#251e23] hover:bg-[#dfdee0] transition-colors text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {submittingComment ? "Đang gửi..." : "Trình duyệt ý kiến"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* DISCUSSION THREAD LIST */}
                <div className="flex flex-col gap-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[#251e23]/30 rounded-xl">
                      <p className="text-[#251e23]/80 text-xs font-serif italic font-bold">Thương hội chưa có công văn nào. Hãy là người đầu tiên đặt câu hỏi!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {comments.map((comm) => {
                        const cacheUser = profilesCache[comm.uid] || {};
                        const avatar = cacheUser.avatarUrl || comm.avatarUrl || '';
                        return (
                          <div key={comm.id} className="p-4 border border-[#251e23]/20 bg-[#251e23] text-[#dfdee0] rounded-xl relative shadow">
                            
                            <div className="flex justify-between items-start gap-4 mb-2">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar 
                                  avatarUrl={avatar}
                                  equippedAccessory={cacheUser.equippedAccessory || comm.equippedAccessory}
                                  accessoryPosition={cacheUser.accessoryPosition || comm.accessoryPosition}
                                  className="w-8 h-8 rounded-full border border-[#808499]/30"
                                />
                                <div>
                                  <h4 className="text-xs font-bold text-[#c5ad97]">
                                    {comm.displayName || comm.authorName || "Nhà lữ hành ẩn danh"}
                                  </h4>
                                  <span className="text-[9px] font-mono text-[#dfdee0]/50">
                                    {comm.createdAt ? format(new Date(comm.createdAt?.seconds ? comm.createdAt.seconds * 1000 : (comm.createdAt?.toMillis ? comm.createdAt.toMillis() : comm.createdAt)), 'dd/MM/yyyy HH:mm') : "Đang cập nhật"}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[9px] font-mono text-[#dfdee0]/40 tracking-widest uppercase">
                                #{comm.id?.slice(-4) || "MSG"}
                              </span>
                            </div>

                            <p className="text-xs leading-relaxed text-[#dfdee0] pl-11">
                              {comm.content || comm.text}
                            </p>

                            {/* REPLIES CONTAINER */}
                            {comm.replies && comm.replies.length > 0 && (
                              <div className="mt-3.5 pl-11 flex flex-col gap-3 border-l border-[#808499]/20 ml-3.5">
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
                                          className="w-5 h-5 rounded-full border border-[#808499]/20"
                                        />
                                        <span className="font-bold text-[#c5ad97] text-[11px]">{rep.displayName || rep.authorName || "Cố vấn ẩn danh"}</span>
                                        <span className="text-[9px] font-mono text-[#dfdee0]/50">
                                          {rep.createdAt ? format(new Date(rep.createdAt?.seconds ? rep.createdAt.seconds * 1000 : (rep.createdAt?.toMillis ? rep.createdAt.toMillis() : rep.createdAt)), 'dd/MM HH:mm') : ""}
                                        </span>
                                      </div>
                                      <p className="text-[#dfdee0]/85 pl-6 leading-relaxed">
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
                                <div className="w-full flex flex-col gap-2 bg-black/20 p-2 rounded-lg border border-[#808499]/15">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Nhập phản hồi cố vấn..."
                                    rows={2}
                                    className="w-full p-2 bg-[#251e23]/80 text-xs text-[#dfdee0] placeholder-[#808499] focus:outline-none focus:border-[#c5ad97] border border-[#808499]/30 rounded"
                                  />
                                  <div className="flex justify-end gap-2 text-[10px]">
                                    <button
                                      onClick={() => setReplyingToId(null)}
                                      className="px-2 py-1 text-[#dfdee0]/50 hover:text-[#dfdee0]"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      onClick={() => handleSendReply(comm)}
                                      disabled={submittingReply || !replyText.trim()}
                                      className="px-3 py-1 bg-[#c5ad97] text-[#251e23] font-bold uppercase rounded disabled:opacity-40"
                                    >
                                      Gửi cố vấn
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!isLoggedIn) {
                                      addLog("Bạn cần đăng nhập để tham gia phản hồi cố vấn!");
                                      return;
                                    }
                                    setReplyingToId(comm.id);
                                  }}
                                  className="text-[10px] font-mono text-[#c5ad97] hover:text-[#dfdee0] flex items-center gap-1"
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
            
            {/* EXAM REVISION BOARD */}
            <div className="border border-[#251e23]/20 bg-[#251e23] p-4 rounded-xl relative shadow-lg text-[#dfdee0]">
              <h2 className="text-xs font-mono tracking-widest text-[#c5ad97] uppercase border-b border-[#808499]/20 pb-2 mb-3.5 flex items-center gap-2 font-bold">
                <GraduationCap className="w-4 h-4 text-[#c5ad97]" /> BẢNG ÔN THI ĐẠI HỌC
              </h2>

              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#dfdee0]/75">Toán học:</span>
                    <span className="font-bold font-mono text-[#dfdee0]">148 <span className="text-[10px] font-normal text-[#dfdee0]/50">/ 150</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-[#808499]/20 rounded-full overflow-hidden">
                    <div className="bg-[#c5ad97] h-full" style={{ width: '98.6%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#dfdee0]/75">Ngữ văn:</span>
                    <span className="font-bold font-mono text-[#dfdee0]">135 <span className="text-[10px] font-normal text-[#dfdee0]/50">/ 150</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-[#808499]/20 rounded-full overflow-hidden">
                    <div className="bg-[#c5ad97] h-full" style={{ width: '90%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#dfdee0]/75">Ngoại ngữ:</span>
                    <span className="font-bold font-mono text-[#dfdee0]">147 <span className="text-[10px] font-normal text-[#dfdee0]/50">/ 150</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-[#808499]/20 rounded-full overflow-hidden">
                    <div className="bg-[#c5ad97] h-full" style={{ width: '98%' }} />
                  </div>
                </div>

                <div className="mt-2.5 pt-3 border-t border-[#808499]/20 flex justify-between items-center">
                  <span className="text-[#dfdee0]/50 text-[10px] uppercase font-mono">Xếp hạng:</span>
                  <span className="font-bold font-mono text-[#c5ad97] bg-[#c5ad97]/10 px-2 py-0.5 rounded text-[10px] border border-[#c5ad97]/20">
                    Thủ khoa khối tự nhiên
                  </span>
                </div>
              </div>
            </div>

            {/* INTERACTIVE STUDY SCHEDULE */}
            <div className="border border-[#251e23]/20 bg-[#251e23] p-4 rounded-xl relative shadow-lg text-[#dfdee0]">
              <h2 className="text-xs font-mono tracking-widest text-[#c5ad97] uppercase border-b border-[#808499]/20 pb-2 mb-3 flex items-center gap-2 font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#c5ad97]" /> LỊCH TRÌNH ÔN THI
              </h2>

              <div className="flex flex-col gap-2">
                {schedule.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleTask(item.id)}
                    className="w-full text-left flex items-start gap-2.5 p-2 rounded hover:bg-[#808499]/10 transition-all text-xs"
                  >
                    <span className="mt-0.5 text-[#c5ad97]">
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#c5ad97]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#808499]" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[9px] px-1 py-0.1 bg-black/30 text-[#c5ad97] rounded">
                          {item.time}
                        </span>
                      </div>
                      <p className={`leading-relaxed text-xs ${item.completed ? 'line-through text-[#dfdee0]/50' : 'text-[#dfdee0]'}`}>
                        {item.text}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* COMMERCE / INVESTMENT WATCH */}
            <div className="border border-[#251e23]/20 bg-[#251e23] p-4 rounded-xl relative shadow-lg text-[#dfdee0]">
              <div className="absolute top-2 right-2 border border-[#808499]/30 text-[#c5ad97] text-[9px] font-mono px-1.5 py-0.1 rounded bg-[#c5ad97]/10 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5ad97] animate-pulse" />
                MỞ CỬA
              </div>

              <h2 className="text-xs font-mono tracking-widest text-[#c5ad97] uppercase border-b border-[#808499]/20 pb-2 mb-3.5 flex items-center gap-2 font-bold">
                <TrendingUp className="w-4 h-4 text-[#c5ad97]" /> THƯƠNG TRƯỜNG BIẾN ĐỘNG
              </h2>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#dfdee0]/70">Chỉ số FarEast:</span>
                  <span className="font-bold font-mono text-[#c5ad97]">{stockPrice.toFixed(3)} VND</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[#dfdee0]/70">Biến động ngày:</span>
                  <span className={`font-bold font-mono flex items-center ${stockChange >= 0 ? 'text-[#c5ad97]' : 'text-[#dfdee0]/70'}`}>
                    {stockChange >= 0 ? "+" : ""}{stockChange}%
                  </span>
                </div>

                <div className="w-full bg-[#808499]/10 p-2.5 rounded border border-[#808499]/15 text-[10px] text-[#dfdee0]/60 italic mt-1.5">
                  "Ủy thác đầu tư ngầm, thâu tóm cổ phiếu Lâm Thị từ 17 tuổi là quân cờ then chốt."
                </div>

                <button
                  onClick={updateMarketPrice}
                  className="w-full mt-2 py-2 border border-[#c5ad97]/30 hover:border-[#c5ad97] text-xs font-mono text-[#c5ad97] hover:bg-[#c5ad97]/10 transition-all rounded uppercase font-bold"
                >
                  Cập nhật thị trường
                </button>
              </div>
            </div>

          </section>

        </div>
      </main>

    </div>
  );
}

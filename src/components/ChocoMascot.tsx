import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from "framer-motion";
import {
  Heart,
  Smile,
  Sparkles,
  Hand,
  MessageCircle,
  X,
  Utensils,
  Zap,
  HelpCircle,
  Volume2,
  VolumeX,
  Flame,
  EyeOff,
} from "lucide-react";
import { useStore } from "../store";
import { FortuneWidget } from "./FortuneWidget";
import {
  renderChucuAccessorySvg,
  getChucuAccessoryPreview,
} from "./ChucuPresetAccessories";

// Interactive Floating mascot for CHOCOATL: Chucu
// Sassy, tsundere personality, uses "tui" / "mấy người".

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export function ChocoMascot() {
  const {
    isLoggedIn,
    isFirebaseSynced,
    displayName,
    choco,
    spendChoco,
    theme,
    chucuLevel,
    chucuExp,
    chucuSatiety,
    chucuHappiness,
    chucuInteractions,
    chucuPremiumFeeds,
    chucuLastTime,
    updateChucuStats,
    equippedChucuAccessory,
    ownedChucuAccessories,
    equipChucuAccessory,
    showChucu,
    setShowChucu,
  } = useStore();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMute, setIsMute] = useState<boolean>(false);
  const [mood, setMood] = useState<
    "idle" | "happy" | "eating" | "dizzy" | "sleeping" | "angry"
  >("idle");
  const [speechBubble, setSpeechBubble] = useState<string>(
    "Tránh ra, tui đang bận! 🙄",
  );
  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  
  const bubbleX = useTransform(dragX, (x) => {
    if (typeof window === "undefined") return "-50%";
    const w = window.innerWidth;
    const minX = -(w - 100);
    const percent = Math.max(0, Math.min(1, (x - minX) / (0 - minX)));
    return `-${20 + percent * 60}%`;
  });

  const pointerLeft = useTransform(dragX, (x) => {
    if (typeof window === "undefined") return "50%";
    const w = window.innerWidth;
    const minX = -(w - 100);
    const percent = Math.max(0, Math.min(1, (x - minX) / (0 - minX)));
    return `${20 + percent * 60}%`;
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [showSpeech, setShowSpeech] = useState<boolean>(true);

  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const moodTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const decayCalculatedRef = useRef(false);

  const dragControls = useDragControls();

  useEffect(() => {
    if (!isLoggedIn || !isFirebaseSynced) return;
    if (decayCalculatedRef.current) return;
    decayCalculatedRef.current = true;

    let currentSatiety = chucuSatiety;
    let currentHappiness = chucuHappiness;

    if (chucuLastTime) {
      const elapsedMs = Date.now() - chucuLastTime;
      const elapsedHours = elapsedMs / (1000 * 60 * 60);
      currentSatiety = Math.max(0, Math.round(chucuSatiety - elapsedHours * 5));
      currentHappiness = Math.max(
        0,
        Math.round(chucuHappiness - elapsedHours * 3),
      );

      if (
        currentSatiety !== chucuSatiety ||
        currentHappiness !== chucuHappiness
      ) {
        updateChucuStats({
          chucuSatiety: currentSatiety,
          chucuHappiness: currentHappiness,
          chucuLastTime: Date.now(),
        });
      }
    } else {
      updateChucuStats({ chucuLastTime: Date.now() });
    }

    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) {
      setMood("sleeping");
      setSpeechBubble("Khuya rồi đừng có phiền tui ngủ... zZ 😪");
    } else if (currentSatiety < 30) {
      setMood("angry");
      setSpeechBubble("Đói rã ruột rồi! Tính bỏ đói tui hay gì? 🤬");
    } else if (currentHappiness < 30) {
      setMood("angry");
      setSpeechBubble("Chán quá đi! Mấy người chả biết quan tâm tui! 😤");
    } else {
      setSpeechBubble(`Vào chi giờ này? Lại kiếm tui chứ gì... hứ. 😒`);
    }
  }, [isLoggedIn, isFirebaseSynced, displayName]);

  const saveStats = (
    newSat: number,
    newHap: number,
    newCount: number,
    newLevel: number,
    newExp: number,
  ) => {
    updateChucuStats({
      chucuSatiety: newSat,
      chucuHappiness: newHap,
      chucuInteractions: newCount,
      chucuLevel: newLevel,
      chucuExp: newExp,
      chucuLastTime: Date.now(),
    });
  };

  const addExp = (amount: number) => {
    let newExp = chucuExp + amount;
    let newLevel = chucuLevel;
    let didLevelUp = false;

    while (newExp >= newLevel * 200 + 100) {
      newExp -= newLevel * 200 + 100;
      newLevel++;
      didLevelUp = true;
    }

    if (didLevelUp) {
      spawnParticle("🌟");
      spawnParticle("⬆️");
      showSpeechText(
        `Ồ... Lên cấp ${newLevel} rồi à. Tui cũng chẳng thèm quan tâm đâu! (Thật ra tui rất thích hehe) 💅✨`,
        5000,
      );
      triggerMood("happy", 3000);
      triggerAudio("sparkle");
    }

    return { newLevel, newExp };
  };

  const triggerAudio = (
    target: "happy" | "chomp" | "dizzy" | "sparkle" | "click" | "angry",
  ) => {
    if (isMute) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (target === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (target === "happy") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (target === "angry") {
        osc.type = "square";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (target === "chomp") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (target === "dizzy") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (target === "sparkle") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.setValueAtTime(1500, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (err) {}
  };

  const spawnParticle = (emoji: string) => {
    const id = Date.now() + Math.random();
    setParticles((prev) => [
      ...prev,
      { id, x: Math.random() * 80 - 40, y: -20, emoji },
    ]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1200);
  };

  const showSpeechText = (text: string, duration = 4000) => {
    setSpeechBubble(text);
    setShowSpeech(true);
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowSpeech(false);
    }, duration);
  };

  const triggerMood = (newMood: typeof mood, duration = 2000) => {
    setMood(newMood);
    if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);

    if (newMood !== "sleeping" && newMood !== "idle") {
      moodTimeoutRef.current = setTimeout(() => {
        const hour = new Date().getHours();
        if (hour >= 23 || hour < 5) setMood("sleeping");
        else setMood("idle");
      }, duration);
    }
  };

  const handlePet = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mood === "sleeping") {
      showSpeechText("Mới ngủ xíu mà cũng vọc! Đừng có cản tui ngủ! 💢");
      triggerMood("angry");
      triggerAudio("angry");
      return;
    }
    const { newLevel, newExp } = addExp(1);
    const newHap = Math.min(100, chucuHappiness + 10);
    saveStats(chucuSatiety, newHap, chucuInteractions + 1, newLevel, newExp);
    triggerMood("happy");
    triggerAudio("happy");
    spawnParticle("💖");

    const chats = [
      "Xoa đầu tui à? Đừng tưởng làm vậy là tui thích nha! (Đỏ mặt) ///",
      "Được rồi, cho phép xoa đầu thêm 1 phút nữa đó. Hừ!",
      "Cái tay cái tay! Kéo tai tui bây giờ!",
      "Hiểu chuyện đấy! Cứ tiếp tục yêu thương tui đi!",
      "Hừ, hôm nay nể tình đang vui nên cho xoa đấy nhé!",
    ];
    showSpeechText(chats[Math.floor(Math.random() * chats.length)]);
  };

  const handlePoke = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newHap = Math.max(0, chucuHappiness - 5);
    const { newLevel, newExp } = addExp(0);
    saveStats(
      Math.max(0, chucuSatiety - 2),
      newHap,
      chucuInteractions + 1,
      newLevel,
      newExp,
    );
    triggerMood("angry");
    triggerAudio("angry");
    spawnParticle("💢");

    const chats = [
      "Đâm thọc gì tui đó! Rảnh rỗi sinh nông nổi hả?",
      "Tránh xê ra! Đụng vào tui quánh cho bây giờ!",
      "Dừng tay! Cứ chọc chọc khó chịu chết đi được! 😤",
      "Ủa quen hả? Quen hả mà chọc?? Mất lịch sự! 😒",
      "Trêu gì! Người ta đang bận tỏ ra ngầu! Đừng phá bĩnh!",
    ];
    showSpeechText(chats[Math.floor(Math.random() * chats.length)]);
  };

  const handleFeedFree = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (chucuSatiety >= 100) {
      showSpeechText("Tui no rồi! Đuốt nữa là bể bụng đó! 🤰💥");
      triggerMood("dizzy");
      triggerAudio("dizzy");
      return;
    }
    const { newLevel, newExp } = addExp(1);
    saveStats(
      Math.min(100, chucuSatiety + 10),
      chucuHappiness,
      chucuInteractions + 1,
      newLevel,
      newExp,
    );
    triggerMood("eating");
    triggerAudio("chomp");
    spawnParticle("🍞");

    const chats = [
      "Cái gì đây? Bánh vụn thừa hả? Thôi nể tình ăn tạm vậy... nhóp nhép...",
      "Tui mâm mâm đây. Mà nè, lần sau mua đồ xịn dùm đi! 😒",
      "Ngon ghê! Ớ, ý tui là... cũng ăn được thui...",
      "Tạm chấp nhận! Không có Choco thượng hạng thì xơi vụn cũng được.",
      "Ăn xong đi dọn dẹp miệng nha, dính đầy mỏ rồi đây này!",
    ];
    showSpeechText(chats[Math.floor(Math.random() * chats.length)]);
  };

  const handleFeedPremium = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn) {
      showSpeechText(
        "Ai cho đồ xịn mà lấy? Đăng nhập đi rồi nói chuyện với tui nha! 😒",
      );
      triggerMood("angry");
      return;
    }
    if (choco < 1) {
      showSpeechText(
        "Nghèo bày đặt đú xịn hả? Đi kiếm Choco đi rồi quay lại! 💸",
      );
      triggerMood("dizzy");
      return;
    }
    spendChoco(1, "Nuôi Chucu");
    const { newLevel, newExp } = addExp(3);
    updateChucuStats({
      chucuSatiety: Math.min(100, chucuSatiety + 40),
      chucuHappiness: Math.min(100, chucuHappiness + 30),
      chucuInteractions: chucuInteractions + 1,
      chucuPremiumFeeds: (chucuPremiumFeeds || 0) + 1,
      chucuLevel: newLevel,
      chucuExp: newExp,
      chucuLastTime: Date.now(),
    });
    triggerMood("happy");
    triggerAudio("chomp");
    spawnParticle("🌟");
    spawnParticle("🍫");

    const chats = [
      "Oa!! Choco xịn xò!! Hôm nay mấy người hào phóng thế?! 🥰",
      "Đù, cái này ngon nè! Nể tình đồ xịn, tui cho ôm 1 cái!",
      "H-Hôm nay bị sao vậy? Sao lại cho đồ mlem vậy? K-Không có thuốc xổ đúng không?",
      "Ăn món này xong... tui thấy mình đắt giá hẳn lên! 💅✨",
      "Vì món này siêu ngon nến tui tha thứ cho những lỗi lầm của mấy người đấy!",
    ];
    showSpeechText(chats[Math.floor(Math.random() * chats.length)]);
  };

  const handleDragEnd = (_e: any, info: any) => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 250);
    // If dragged fast or dropped from high, deduct happiness
    if (Math.abs(info.velocity.y) > 500 || Math.abs(info.velocity.x) > 500) {
      triggerMood("dizzy", 3000);
      triggerAudio("dizzy");
      spawnParticle("💫");
      const newHap = Math.max(0, chucuHappiness - 15);
      const { newLevel, newExp } = addExp(1);
      saveStats(
        Math.max(0, chucuSatiety - 5),
        newHap,
        chucuInteractions + 1,
        newLevel,
        newExp,
      );
      showSpeechText(
        "Á đù chóng mặt quáaaa!! Mấy người bạo lực vừa thôi!! 😵‍💫💢",
      );
    } else {
      // Soft drop
      triggerMood("happy", 1000);
      showSpeechText("Hạ cánh an toàn! Tui không sợ độ cao đâu nhá! 😌🚀");
    }
  };

  const getSatietyColor = () => {
    if (chucuSatiety < 30) return "bg-red-500";
    if (chucuSatiety < 60) return "bg-orange-500";
    return "bg-emerald-500";
  };
  const getHappinessColor = () => {
    if (chucuHappiness < 30) return "bg-stone-500";
    if (chucuHappiness < 60) return "bg-sky-400";
    return "bg-pink-500";
  };

  const renderMascotVisual = (isModal: boolean = false) => (
    <>
      <AnimatePresence>
        {((!isModal && showSpeech && speechBubble) || (isModal && showSpeech && speechBubble)) && (
          <motion.div
            style={isModal ? { left: "50%" } : { x: bubbleX, left: "50%" }}
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              triggerAudio("click");
              if (!isModal) setIsOpen(true);
            }}
            className={
              isModal 
                ? "absolute bottom-[100%] w-[160px] sm:w-[220px] p-2 sm:p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1815] border-[3px] border-[#3E2723] text-[#3E2723] dark:text-[#ECE5DC] shadow-[3px_3px_0_0_#3E2723] cursor-pointer text-xs font-black tracking-normal leading-snug text-left z-50 select-none mb-2 -translate-x-1/2"
                : "absolute bottom-[110%] w-[160px] sm:w-[220px] p-2 sm:p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1815] border-[3px] border-[#3E2723] text-[#3E2723] dark:text-[#ECE5DC] shadow-[3px_3px_0_0_#3E2723] cursor-pointer text-xs font-black tracking-normal leading-snug text-left z-50 select-none"
            }
          >
            <div className="line-clamp-3">{speechBubble}</div>
            <motion.div style={isModal ? { left: "50%" } : { left: pointerLeft }} className="absolute -translate-x-1/2 -bottom-[12px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#3E2723]" />
            <motion.div style={isModal ? { left: "50%" } : { left: pointerLeft }} className="absolute -translate-x-1/2 -bottom-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#FFFDF9] dark:border-t-[#1E1815]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        onClick={(e) => {
          if (isDraggingRef.current) return;
          triggerAudio("click");
          if (!isModal) {
            setIsOpen(!isOpen);
          } else {
            handlePoke(e as any);
          }
        }}
        whileHover={!isModal ? { scale: 1.05 } : {}}
        whileTap={{ scale: 0.9 }}
        title={!isModal ? "Bé Chucu đáng yêu tinh nghịch" : "Chọc ghẹo Chucu!"}
        className={!isModal ? "relative w-full h-full cursor-grab active:cursor-grabbing group drop-shadow-xl" : "relative w-32 h-32 mx-auto cursor-pointer drop-shadow-md z-30"}
      >
        <div className="absolute inset-0 pointer-events-none z-20">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 10, scale: 0.5, x: p.x }}
              animate={{ opacity: 0, y: -65, scale: 1.4 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute text-lg font-bold select-none"
            >
              {p.emoji}
            </motion.div>
          ))}
        </div>

        <motion.svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[2px_2px_0_rgba(62,39,35,0.7)]"
          animate={
            mood === "happy"
              ? { y: [0, -15, 0, -10, 0], rotate: [0, 8, -8, 8, 0] }
              : mood === "dizzy"
                ? { rotate: [0, 360], scale: [1, 1.2, 0.8, 1] }
                : mood === "eating"
                  ? { scaleY: [1, 0.8, 1.1, 1], scaleX: [1, 1.1, 0.9, 1] }
                  : mood === "angry"
                    ? { x: [-2, 2, -2, 2, 0], y: [-2, 2, -1, 1, 0] }
                    : { y: [0, -6, 0] }
          }
          transition={
            mood === "happy"
              ? { duration: 1 }
              : mood === "dizzy"
                ? { duration: 0.6, ease: "easeInOut" }
                : mood === "eating"
                  ? { repeat: 3, duration: 0.3 }
                  : mood === "angry"
                    ? { repeat: 3, duration: 0.2 }
                    : mood === "sleeping"
                      ? { repeat: Infinity, duration: 4, ease: "easeInOut" }
                      : { repeat: Infinity, duration: 3, ease: "easeInOut" }
          }
        >
          <ellipse cx="50" cy="85" rx="30" ry="10" fill="#000" opacity="0.2" stroke="none" />
          <ellipse cx="50" cy="53" rx="26" ry="23" fill="#8D6E63" stroke="#3E2723" strokeWidth="4" />
          <path d="M 35 30 Q 50 20 65 30" fill="none" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="32" cy="52" rx="4" ry="2" fill="#FF8A80" opacity="0.6" />
          <ellipse cx="68" cy="52" rx="4" ry="2" fill="#FF8A80" opacity="0.6" />
          {(mood === "idle" || mood === "eating") && (
            <>
              <line x1="38" y1="46" x2="48" y2="46" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" />
              <line x1="52" y1="46" x2="62" y2="46" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          {mood === "happy" && (
            <>
              <path d="M 38 46 Q 43 42 48 46" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 52 46 Q 57 42 62 46" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          )}
          {mood === "angry" && (
            <>
              <line x1="36" y1="42" x2="44" y2="46" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
              <line x1="64" y1="42" x2="56" y2="46" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
              <circle cx="42" cy="48" r="2.5" fill="#3E2723" />
              <circle cx="58" cy="48" r="2.5" fill="#3E2723" />
            </>
          )}
          {mood === "dizzy" && (
            <>
              <path d="M 38 43 L 44 49 M 44 43 L 38 49" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
              <path d="M 56 43 L 62 49 M 62 43 L 56 49" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          {mood === "sleeping" && (
            <>
              <line x1="38" y1="46" x2="46" y2="46" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
              <line x1="54" y1="46" x2="62" y2="46" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
              <text x="75" y="30" fill="#3E2723" fontSize="14" fontWeight="950" className="drop-shadow-sm">zZ</text>
            </>
          )}
          {mood !== "sleeping" && mood !== "angry" && (
            <>
              <line x1="45" y1="55" x2="55" y2="55" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
              <path d="M 48 55 L 48 65 Q 50 68 52 65 L 52 55" fill="#FF8A80" stroke="#3E2723" strokeWidth="2.5" />
            </>
          )}
          {mood === "angry" && (
            <path d="M 45 57 Q 50 54 55 57" fill="none" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
          )}
          {equippedChucuAccessory && equippedChucuAccessory.startsWith("chucu_acc_") && renderChucuAccessorySvg(equippedChucuAccessory)}
        </motion.svg>
        {equippedChucuAccessory && !equippedChucuAccessory.startsWith("chucu_acc_") && (
          <img src={equippedChucuAccessory} alt="Accessory" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] object-contain pointer-events-none drop-shadow-sm" referrerPolicy="no-referrer" />
        )}
      </motion.div>
    </>
  );

  if (!showChucu) return null;

  return (
    <>
      <div ref={dragConstraintsRef} className="fixed top-32 bottom-4 left-4 right-4 pointer-events-none z-30" />
      <div className={isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity'}>
        <motion.div
           drag
           style={{ x: dragX, y: dragY }}
           dragConstraints={dragConstraintsRef}
           dragElastic={0.2}
           dragTransition={{ bounceStiffness: 300, bounceDamping: 10 }}
          dragMomentum={true}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.1, rotate: Math.random() > 0.5 ? 5 : -5 }}
          className="fixed bottom-6 right-6 z-40 flex flex-col items-center justify-center pointer-events-auto w-16 h-16 sm:w-20 sm:h-20"
        >
          {renderMascotVisual(false)}
        </motion.div>
      </div>

      {/* Control Drawer Container */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-[#FDF6EC] dark:bg-[#1A1412] w-full max-w-sm max-h-[90vh] rounded-[2rem] overflow-hidden border-4 border-[#3E2723] shadow-[0_4px_0_0_#3E2723] dark:border-[#5D4037] flex flex-col z-10 p-6"
            >
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 bg-[#FFFDF9] dark:bg-[#1E1815] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-xl flex items-center justify-center hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] shadow-[0_3px_0_0_#3E2723] dark:shadow-[0_3px_0_0_#0D0907] transition-all active:translate-y-1 active:shadow-none z-20"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#3E2723] dark:text-[#ECE5DC]" />
              </button>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  setShowChucu(false);
                }} 
                className="absolute top-4 left-4 w-8 h-8 sm:w-10 sm:h-10 bg-[#FFFDF9] dark:bg-[#1E1815] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-xl flex items-center justify-center hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] shadow-[0_3px_0_0_#3E2723] dark:shadow-[0_3px_0_0_#0D0907] transition-all active:translate-y-1 active:shadow-none z-20"
                title="Ẩn Chucu"
              >
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-stone-500" />
              </button>

              <div className="overflow-y-auto flex-1 pr-1 -mr-1 mt-4 scrollbar-thin scrollbar-thumb-stone-300">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-[#3E2723] dark:text-[#ECE5DC] mb-1">
                    CHUCU STATION
                  </h3>
                  <div className="mb-4 mt-20">
                    {renderMascotVisual(true)}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="bg-[#8D6E63] text-white px-3 py-[2px] rounded-full text-xs font-bold font-mono">
                      Lvl {chucuLevel}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      Exp: {chucuExp}/{chucuLevel * 200 + 100}
                    </span>
                  </div>

                  <div className="space-y-3 px-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1 items-center dark:text-stone-300">
                        <span className="flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-emerald-500" /> Độ
                          no bụng
                        </span>
                        <span>{chucuSatiety}%</span>
                      </div>
                      <div className="h-4 bg-[#F5E6D3] dark:bg-[#2C221D] rounded-full overflow-hidden border-2 border-stone-300 dark:border-stone-700">
                        <motion.div
                          className={`h-full ${getSatietyColor()}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${chucuSatiety}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1 items-center dark:text-stone-300">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-500" /> Hạnh phúc
                        </span>
                        <span>{chucuHappiness}%</span>
                      </div>
                      <div className="h-4 bg-[#F5E6D3] dark:bg-[#2C221D] rounded-full overflow-hidden border-2 border-stone-300 dark:border-stone-700">
                        <motion.div
                          className={`h-full ${getHappinessColor()}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${chucuHappiness}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={handlePet}
                    className="p-3 bg-[#FFFDF9] dark:bg-[#251E1B] border-[3px] border-[#3E2723] hover:bg-[#F5E6D3] dark:hover:bg-[#322722] transition-colors rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[0_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    <Hand className="w-4 h-4 text-rose-400 fill-rose-100" />
                    <span>Xoa đầu</span>
                  </button>
                  <button
                    onClick={handlePoke}
                    className="p-3 bg-[#FFFDF9] dark:bg-[#251E1B] border-[3px] border-[#3E2723] hover:bg-[#F5E6D3] dark:hover:bg-[#322722] transition-colors rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[0_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    <Smile className="w-4 h-4 text-amber-500" />
                    <span>Chọc ghẹo</span>
                  </button>
                  <button
                    onClick={handleFeedFree}
                    className="p-3 bg-[#FFFDF9] dark:bg-[#251E1B] border-[3px] border-[#3E2723] hover:bg-[#F5E6D3] dark:hover:bg-[#322722] transition-colors rounded-2xl font-black text-xs uppercase flex flex-col items-center justify-center shadow-[0_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    <div className="flex gap-2 mb-1">
                      <Utensils className="w-4 h-4 text-emerald-400" /> Vụn Bánh
                    </div>
                    <span className="text-[10px] text-stone-500">
                      (Miễn phí)
                    </span>
                  </button>
                  <button
                    onClick={handleFeedPremium}
                    className="p-3 bg-[#FFF9C4]/35 dark:bg-[#2C2117] border-[3px] border-[#3E2723] hover:bg-[#FFF59D]/40 transition-colors rounded-2xl font-black text-xs uppercase flex flex-col items-center justify-center shadow-[0_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none cursor-pointer text-[#8D6E63] dark:text-[#E6C45E]"
                  >
                    <div className="flex gap-2 mb-1">
                      <Flame className="w-4 h-4 text-orange-400 fill-orange-200" />{" "}
                      Mlem Mlem
                    </div>
                    <span className="text-[10px]">Hảo hạng (-1 Choco)</span>
                  </button>
                </div>

                {/* Tủ đồ Chucu */}
                <div className="border-t border-[#3E2723]/10 pt-4 mb-4">
                  <h4 className="text-xs font-black text-[#5D4037] dark:text-[#A1887F] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>👗 Tủ Đồ Chucu</span>
                    {equippedChucuAccessory && (
                      <button
                        onClick={() => equipChucuAccessory(null)}
                        className="text-[10px] text-red-500 hover:underline font-bold"
                      >
                        Tháo hết
                      </button>
                    )}
                  </h4>

                  {ownedChucuAccessories && ownedChucuAccessories.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1.5 bg-white/50 dark:bg-black/10 rounded-xl border-2 border-[#D7CCC8] dark:border-[#5D4037]">
                      {ownedChucuAccessories.map((url, idx) => {
                        const isEquipped = equippedChucuAccessory === url;
                        return (
                          <button
                            key={idx}
                            onClick={() =>
                              equipChucuAccessory(isEquipped ? null : url)
                            }
                            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center p-1 relative hover:scale-105 active:scale-95 transition-all outline-none ${isEquipped ? "bg-[#D4AF37]/20 border-[#D4AF37] shadow-inner" : "bg-[#FFFDF9] dark:bg-[#1E1815] border-[#3E2723]/30 dark:border-stone-700 hover:border-[#8D6E63]"}`}
                            title="Click để mặc hoặc tháo phụ kiện cho Chucu"
                          >
                            {url && url.startsWith("chucu_acc_") ? (
                              getChucuAccessoryPreview(url)
                            ) : (
                              <img
                                src={url}
                                alt="Accessory"
                                className="w-10 h-10 object-contain pointer-events-none"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {isEquipped && (
                              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded-full border border-white">
                                E
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-[10px] text-stone-500 dark:text-stone-400 italic bg-white/25 dark:bg-black/5 rounded-xl border border-dashed border-[#D7CCC8]/60 dark:border-[#5D4037]/65">
                      Chucu chưa có phụ kiện nào. Hãy sắm thêm tại Cửa hàng!
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <FortuneWidget />
                </div>

                <div className="text-center font-mono text-[10px] text-stone-400 dark:text-stone-500 mt-2">
                  Đã tương tác: {chucuInteractions} lần
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

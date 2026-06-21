import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, ShoppingBag, Info, Sparkles, 
  Flame, HelpCircle, Trophy, Ticket, Heart, Utensils, Cookie, Star
} from 'lucide-react';

// Highly performance-optimized 8-bit synth sound generator using Web Audio API
class MiniGameSynth {
  private ctx: AudioContext | null = null;
  
  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch(e) {}
  }

  public playCatch() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playPowerUp() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, now); // E4
    osc.frequency.setValueAtTime(440, now + 0.08); // A4
    osc.frequency.setValueAtTime(554.37, now + 0.16); // C#5
    osc.frequency.exponentialRampToValueAtTime(1108.73, now + 0.3); // C#6

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playBomb() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // noise explosion
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.3);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noiseSource.start(now);
  }
}

const gameSounds = new MiniGameSynth();

interface FallingItem {
  x: number;
  y: number;
  speed: number;
  type: 'white' | 'brown' | 'gold' | 'milk' | 'bomb' | 'rotten_apple';
  radius: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export function ChucuGamePopup() {
  const { 
    isChucuGameOpen, setChucuGameOpen, 
    chucuGameFragments, addChucuGameFragments,
    chucuGameGFragments, addChucuGameGFragments,
    chucuGameBonusPoints, addChucuGameBonusPoints,
    chucuGamePlaysToday, chucuGameLastPlayDate, incrementChucuGamePlayCount,
    chucuSatiety, updateChucuStats,
    choco, goldenChoco, ownedMysteryBoxes, ownedStreakTickets,
    isLoggedIn, uid, updateUserDoc, theme
  } = useStore();

  const isDark = theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Modal Screen Tab State
  const [panelTab, setPanelTab] = useState<'play' | 'exchange' | 'guide'>('play');

  // Interactive Play States
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [chucuFragmentsEarned, setChucuFragmentsEarned] = useState(0);
  const [chucuGFragmentsEarned, setChucuGFragmentsEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lives, setLives] = useState(3);

  // Satiety warning or energy validation
  const defaultPlaysLimit = 10;
  const isNoRewardPlay = chucuGamePlaysToday >= defaultPlaysLimit;
  const satietyRequiredPerNoRewardPlay = 10; // consumes 10 Satiety per play

  // Game Engine Loop variable refs (prevents closure stale data)
  const scoreRef = useRef(0);
  const fragRef = useRef(0);
  const gFragRef = useRef(0);
  const timeLeftRef = useRef(30);
  const livesRef = useRef(3);
  const basketX = useRef(150);
  const basketWidth = useRef(60);
  const items = useRef<FallingItem[]>([]);
  const floatingTexts = useRef<FloatingText[]>([]);
  const screenFlash = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const timerIntervalId = useRef<number | null>(null);
  const lastSpawnTime = useRef(0);
  const powerupTimer = useRef<number | null>(null);
  const pointerInputRef = useRef(150);
  const gameStateRef = useRef<'idle' | 'playing' | 'gameover'>('idle');

  // Sync state helpers
  useEffect(() => {
    scoreRef.current = score;
    fragRef.current = chucuFragmentsEarned;
    gFragRef.current = chucuGFragmentsEarned;
    timeLeftRef.current = timeLeft;
    gameStateRef.current = gameState;
    livesRef.current = lives;
  }, [score, chucuFragmentsEarned, chucuGFragmentsEarned, timeLeft, gameState, lives]);

  // Start gameLoop when gameState becomes 'playing' and canvas is mounted
  useEffect(() => {
    if (gameState === 'playing') {
      const pid = requestAnimationFrame(() => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(gameLoop);
      });
      return () => {
        cancelAnimationFrame(pid);
      };
    }
  }, [gameState]);

  // Clean play loop on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (powerupTimer.current) clearTimeout(powerupTimer.current);
    };
  }, []);

  if (!isChucuGameOpen) return null;

  // 1. Transaction Handlers for fragments and points exchange
  const handleExchangeFragments = (type: 'choco' | 'gchoco') => {
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập để thực hiện giao dịch này!");
      return;
    }
    if (type === 'choco') {
      if (chucuGameFragments < 10) {
        alert("Bạn cần tích lũy tối thiểu 10 mảnh Choco nâu để quy đổi!");
        return;
      }
      const newFragments = chucuGameFragments - 10;
      const newChoco = choco + 1;
      updateUserDoc({
        chucuGameFragments: newFragments,
        choco: newChoco
      });
      addChucuGameFragments(-10); // sync with state
      alert("Đổi thành công 10 mảnh lấy 1 Choco thực!");
    } else {
      if (chucuGameGFragments < 10) {
        alert("Bạn cần tích lũy tối thiểu 10 mảnh Gchoco vàng để quy đổi!");
        return;
      }
      const newFragments = chucuGameGFragments - 10;
      const newGChoco = goldenChoco + 1;
      updateUserDoc({
        chucuGameGFragments: newFragments,
        goldenChoco: newGChoco
      });
      addChucuGameGFragments(-10); // sync with state
      alert("Đổi thành công 10 mảnh vàng lấy 1 Gchoco thực!");
    }
  };

  const handleExchangePoints = (reward: 'mystery' | 'streak_ticket' | 'feed_mlem') => {
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập để đổi quà!");
      return;
    }
    if (reward === 'mystery') {
      if (chucuGameBonusPoints < 1200) {
        alert("Bạn chưa đủ 1200 điểm thưởng để đổi Hộp Quà Sticker Bí Ẩn!");
        return;
      }
      const newPoints = chucuGameBonusPoints - 1200;
      const newBoxes = (ownedMysteryBoxes || 0) + 1;
      updateUserDoc({
        chucuGameBonusPoints: newPoints,
        ownedMysteryBoxes: newBoxes
      });
      addChucuGameBonusPoints(-1200); // sync with state
      alert("Đổi thành công 1200 điểm lấy 1 Hộp quà Sticker Bí Ẩn!");
    } else if (reward === 'streak_ticket') {
      if (chucuGameBonusPoints < 800) {
        alert("Bạn chưa đủ 800 điểm thưởng để đổi Vé bảo vệ Streak!");
        return;
      }
      const newPoints = chucuGameBonusPoints - 800;
      const newTickets = (ownedStreakTickets || 0) + 1;
      updateUserDoc({
        chucuGameBonusPoints: newPoints,
        ownedStreakTickets: newTickets
      });
      addChucuGameBonusPoints(-800); // sync with state
      alert("Đổi thành công 800 điểm lấy 1 Vé bảo vệ Streak!");
    } else if (reward === 'feed_mlem') {
      if (chucuGameBonusPoints < 600) {
        alert("Bạn chưa đủ 600 điểm thưởng để đổi Thức ăn mlem!");
        return;
      }
      const newPoints = chucuGameBonusPoints - 600;
      // Adds a free Premium feed instantly inside Mascot stats
      const newSatiety = Math.min(100, chucuSatiety + 25);
      updateUserDoc({
        chucuGameBonusPoints: newPoints,
        chucuSatiety: newSatiety
      });
      updateChucuStats({ chucuSatiety: newSatiety });
      addChucuGameBonusPoints(-600); // sync with state
      alert("Đổi thành công 600 điểm lấy 1 Thức ăn mlem mlem hảo hạng Chucu (Nạp đầy Satiety thêm +25%)!");
    }
  };

  // Start the actual game process loop
  const startGame = () => {
    if (!isLoggedIn) {
      alert("Chào bạn đọc mến thương! Bạn hãy đăng ký / đăng nhập để lưu trữ kết quả và phần thưởng vào túi đồ nhé.");
      return;
    }

    // Energy checks
    if (isNoRewardPlay) {
      if (chucuSatiety < satietyRequiredPerNoRewardPlay) {
        alert("Bé Chucu đã quá mệt và đói lả đi rồi, độ no bụng đang < 10%. Vui lòng nạp thức ăn mlem mlem hoặc bánh quy cho bé để hồi phục năng lượng chơi nhé!");
        return;
      }
    }

    // Reset game engines
    setGameState('playing');
    setScore(0);
    setChucuFragmentsEarned(0);
    setChucuGFragmentsEarned(0);
    setTimeLeft(30);
    setLives(3);

    scoreRef.current = 0;
    fragRef.current = 0;
    gFragRef.current = 0;
    timeLeftRef.current = 30;
    livesRef.current = 3;

    basketWidth.current = 65;
    items.current = [];
    floatingTexts.current = [];
    screenFlash.current = 0;
    lastSpawnTime.current = Date.now();
    pointerInputRef.current = 150;

    if (timerIntervalId.current) {
      clearInterval(timerIntervalId.current);
    }

    // Setup 1s timer countdown
    const countdown = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        clearInterval(countdown);
        gameOver();
      } else {
        setTimeLeft(prev => prev - 1);
      }
    }, 1000);
    timerIntervalId.current = countdown as any;
  };

  const gameOver = () => {
    setGameState('gameover');
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    if (timerIntervalId.current) {
      clearInterval(timerIntervalId.current);
      timerIntervalId.current = null;
    }

    // Satiety and transaction deduction logic
    if (isNoRewardPlay) {
      // Deduct satiety because played more than 10 times today without receiving rewards
      const newSatiety = Math.max(0, chucuSatiety - satietyRequiredPerNoRewardPlay);
      updateUserDoc({ 
        chucuSatiety: newSatiety
      });
      updateChucuStats({ chucuSatiety: newSatiety });
      incrementChucuGamePlayCount();
    } else {
      // Award fragments and bonus points inside daily rewarded limits!
      addChucuGameFragments(fragRef.current);
      addChucuGameGFragments(gFragRef.current);
      addChucuGameBonusPoints(scoreRef.current);
      incrementChucuGamePlayCount();
    }
  };

  // Main canvas looping
  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Width and height of canvas
    const W = canvas.width;
    const H = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, W, H);

    // Warm Retro Backdrop
    ctx.fillStyle = isDark ? '#2D221D' : '#FDF9F3';
    ctx.fillRect(0, 0, W, H);

    // Draw bottom ground line styling
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, H - 12);
    ctx.lineTo(W, H - 12);
    ctx.stroke();

    // Smooth physics interpolations for Chucu basket movement
    const targetX = pointerInputRef.current;
    basketX.current += (targetX - basketX.current) * 0.28; // high response damping

    // Constraint basket inside canvas
    const bw = basketWidth.current;
    if (basketX.current < bw / 2) basketX.current = bw / 2;
    if (basketX.current > W - bw / 2) basketX.current = W - bw / 2;

    // Draw Chucu character at bottom of screen
    const bx = basketX.current;
    const by = H - 36; // Base vertical alignment

    // DRAW CHUCU MASCOT
    // 1. Draw Shadow under Chucu
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(bx, by + 16, bw * 0.45, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Head & Body (Fat cute round brown ball like in ChocoMascot)
    // Chucu color: #8D6E63
    ctx.fillStyle = '#8D6E63'; 
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.ellipse(bx, by + 4, 25, 23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Forehead hair swoop (signature Chucu feature!)
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx, by - 12, 10, Math.PI * 0.9, Math.PI * 0.1, true); // smooth hair curve
    ctx.stroke();

    // 3. Cute little ears
    ctx.fillStyle = '#8D6E63';
    ctx.beginPath();
    // Left ear
    ctx.moveTo(bx - 18, by - 14);
    ctx.lineTo(bx - 26, by - 6);
    ctx.lineTo(bx - 12, by - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    // Right ear
    ctx.moveTo(bx + 18, by - 14);
    ctx.lineTo(bx + 26, by - 6);
    ctx.lineTo(bx + 12, by - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Rosy Cheeks
    ctx.fillStyle = 'rgba(255, 138, 128, 0.6)'; // pink blushing cheek
    ctx.beginPath();
    ctx.arc(bx - 14, by + 4, 4, 0, Math.PI * 2);
    ctx.arc(bx + 14, by + 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Bright cute eyes
    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.arc(bx - 9, by, 3, 0, Math.PI * 2);
    ctx.arc(bx + 9, by, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cute white sparkle highlight dot on eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bx - 10, by - 1, 1, 0, Math.PI * 2);
    ctx.arc(bx + 8, by - 1, 1, 0, Math.PI * 2);
    ctx.fill();

    // 6. Sweet little cat mouth & tongue sticking out (Chucu's signature expression!)
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // W-shaped cat lip
    ctx.arc(bx - 2, by + 4, 2, 0, Math.PI, false);
    ctx.arc(bx + 2, by + 4, 2, 0, Math.PI, false);
    ctx.stroke();

    // Small pink sticky out tongue
    ctx.fillStyle = '#FF8A80';
    ctx.beginPath();
    ctx.arc(bx, by + 7, 2.5, 0, Math.PI, false);
    ctx.fill();
    ctx.stroke();

    // 7. Dynamic chubby arms holding the basket!
    // Since basket is 'bw' wide, hands stretch from body to bx - bw/2 and bx + bw/2
    ctx.fillStyle = '#8D6E63';
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    // Left arm holding left of basket
    ctx.moveTo(bx - 18, by + 6);
    ctx.quadraticCurveTo(bx - bw/2, by - 2, bx - bw/2 + 2, by - 6);
    ctx.lineTo(bx - bw/2 + 8, by - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    // Right arm holding right of basket
    ctx.moveTo(bx + 18, by + 6);
    ctx.quadraticCurveTo(bx + bw/2, by - 2, bx + bw/2 - 2, by - 6);
    ctx.lineTo(bx + bw/2 - 8, by - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 8. THE DECORATIVE BASKET Woven Tray (the actual catcher region!)
    // Basket starts at bx - bw/2, vertical alignment at by - 10, height of 15px
    const basketYPos = by - 10;
    const basketH = 15;

    // Draw backing drop shadow inside the basket
    ctx.fillStyle = 'rgba(62, 39, 35, 0.2)';
    ctx.beginPath();
    ctx.roundRect(bx - bw/2, basketYPos, bw, basketH, 8);
    ctx.fill();

    // Wood basket base
    ctx.fillStyle = '#E6C29E'; // Nice vibrant light warm orange-brown wicker color
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(bx - bw/2, basketYPos, bw, basketH, [4, 4, 12, 12]); // rounded bottom edges
    ctx.fill();
    ctx.stroke();

    // Wicker textured woven grid lines
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // draw horizontal band
    ctx.moveTo(bx - bw/2 + 4, basketYPos + basketH / 2);
    ctx.lineTo(bx + bw/2 - 4, basketYPos + basketH / 2);
    ctx.stroke();

    // draw vertical segments
    for (let xOffset = -bw/2 + 10; xOffset < bw/2; xOffset += 14) {
      ctx.beginPath();
      ctx.moveTo(bx + xOffset, basketYPos + 2);
      ctx.lineTo(bx + xOffset, basketYPos + basketH - 2);
      ctx.stroke();
    }

    // Cute border rim for the basket
    ctx.fillStyle = '#CD853F'; // darker rim
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx - bw/2 - 2, basketYPos - 3, bw + 4, 5, 2);
    ctx.fill();
    ctx.stroke();

    // Draw milk carton box visual indicator if milk power-up is active (big text)
    if (bw > 70) {
      ctx.fillStyle = '#81D4FA';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText("🥛 TO KHỔNG LỒ", bx - 34, by - 18);
    }

    // Spawning falling items
    const nowTime = Date.now();
    const spawnInterval = Math.max(300, 600 - Math.floor(scoreRef.current / 2)); // Spawns faster as score increases
    if (nowTime - lastSpawnTime.current > spawnInterval) {
      const spawnX = Math.random() * (W - 30) + 15;
      let randType: FallingItem['type'] = 'white';
      const r = Math.random();
      
      if (r < 0.60) randType = 'white'; // White Be chocolate is point (60%)
      else if (r < 0.75) randType = 'bomb'; // Bomb trap (-20 points) (15%)
      else if (r < 0.85) randType = 'rotten_apple'; // Rotten Apple (-1 life) (10%)
      else if (r < 0.93) randType = 'milk'; // Sữa ngọt ngào power-up (8%)
      else if (r < 0.985) randType = 'brown'; // Brown Choco fragment (Hiếm - 5.5%)
      else randType = 'gold'; // Gold fragment (Siêu hiếm - 1.5%)

      items.current.push({
        x: spawnX,
        y: -15,
        speed: 3.8 + Math.random() * 3.5 + (scoreRef.current / 150), // Higher base speed
        type: randType,
        radius: 12
      });
      lastSpawnTime.current = nowTime;
    }

    // Physics update falling items
    items.current.forEach((item, idx) => {
      item.y += item.speed;

      // Draw item
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3E2723';

      if (item.type === 'white') {
        // Point Choco: Premium White chocolate chunk
        // Draw 3D-angled glossy square chocolate block with cream colors
        const size = item.radius * 2;
        const rx = item.x - item.radius;
        const ry = item.y - item.radius;

        // Base greyish shadows
        ctx.fillStyle = 'rgba(62, 39, 35, 0.15)';
        ctx.beginPath();
        ctx.roundRect(rx + 2, ry + 2, size, size, 5);
        ctx.fill();

        // White Chocolate main body gradient
        const whiteGrad = ctx.createLinearGradient(rx, ry, rx + size, ry + size);
        whiteGrad.addColorStop(0, '#FFFFFF'); // Creamy white
        whiteGrad.addColorStop(0.5, '#FFFDF0');
        whiteGrad.addColorStop(1, '#F5EBD3'); // Slightly warm vanilla shade
        ctx.fillStyle = whiteGrad;
        ctx.beginPath();
        ctx.roundRect(rx, ry, size, size, 5);
        ctx.fill();
        ctx.stroke();

        // 3D step bevel effect (grid segment lines)
        ctx.strokeStyle = '#E5DCD0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx + 3, ry + 3, size - 6, size - 6);

        // Highlight shine gloss
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(rx + 2, ry + 2);
        ctx.lineTo(rx + size - 2, ry + 2);
        ctx.lineTo(rx + 2, ry + size - 2);
        ctx.closePath();
        ctx.fill();

        // Little sweet gold star detail center
        ctx.fillStyle = '#E6C45E';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText("🥛", item.x - 4.5, item.y + 3);

      } else if (item.type === 'brown') {
        // Rare Choco fragment: Premium milk-chocolate chunk
        const size = item.radius * 2;
        const rx = item.x - item.radius;
        const ry = item.y - item.radius;

        // Base shadows
        ctx.fillStyle = 'rgba(62, 39, 35, 0.15)';
        ctx.beginPath();
        ctx.roundRect(rx + 2, ry + 2, size, size, 5);
        ctx.fill();

        // Chocolate main body gradient
        const brownGrad = ctx.createLinearGradient(rx, ry, rx + size, ry + size);
        brownGrad.addColorStop(0, '#A1887F'); // rich cocoa brown
        brownGrad.addColorStop(0.4, '#8D6E63'); 
        brownGrad.addColorStop(1, '#5D4037'); // dark cocoa
        ctx.fillStyle = brownGrad;
        ctx.beginPath();
        ctx.roundRect(rx, ry, size, size, 5);
        ctx.fill();
        ctx.stroke();

        // Bevel look
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx + 3, ry + 3, size - 6, size - 6);

        // Highlight gloss shines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(rx + 2, ry + 2);
        ctx.lineTo(rx + size - 2, ry + 2);
        ctx.lineTo(rx + 2, ry + size - 2);
        ctx.closePath();
        ctx.fill();

        // Sweets label imprint
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText("🍫", item.x - 4.5, item.y + 3);

      } else if (item.type === 'gold') {
        // Legendary Gchoco fragment: Glistening Golden Star Coin Choco!
        ctx.save();
        
        // Shiny glow underlay
        const pulse = Math.abs(Math.sin(Date.now() / 150)) * 6;
        const glowGrad = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, item.radius + pulse);
        glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        glowGrad.addColorStop(1, 'rgba(255, 193, 7, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Coin outline circle outer shadow
        ctx.fillStyle = '#B7791F'; // deep bronze
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius + 1, 0, Math.PI * 2);
        ctx.fill();

        // Main gold body gradient
        const goldGrad = ctx.createLinearGradient(item.x - item.radius, item.y - item.radius, item.x + item.radius, item.y + item.radius);
        goldGrad.addColorStop(0, '#FFE082'); // pale yellow gold
        goldGrad.addColorStop(0.3, '#FFD54F'); // gold
        goldGrad.addColorStop(0.7, '#FFC107'); // amber gold
        goldGrad.addColorStop(1, '#FF8F00'); // deep orange gold
        ctx.fillStyle = goldGrad;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Embossed inner border rim
        ctx.strokeStyle = '#FF8F00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius - 3.5, 0, Math.PI * 2);
        ctx.stroke();

        // Draw tiny shiny star in center
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText("⭐", item.x - 5.5, item.y + 4.5);

        // Gloss glare sweep line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.moveTo(item.x - item.radius + 2, item.y - item.radius + 4);
        ctx.quadraticCurveTo(item.x + 2, item.y + 1, item.x + item.radius - 4, item.y + item.radius - 2);
        ctx.quadraticCurveTo(item.x - 2, item.y, item.x - item.radius + 2, item.y - item.radius + 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

      } else if (item.type === 'milk') {
        // Sweet milk carton: A cute retro milk glass bottle!
        const rHeight = 26;
        const rWidth = 16;
        const mx = item.x - rWidth / 2;
        const my = item.y - rHeight / 2;

        // Draw shadow backing
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; 
        ctx.fillRect(mx + 2, my + 2, rWidth, rHeight);

        // draw white milk liquid base
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(mx, my + 6, rWidth, rHeight - 6);

        // draw transparent glass neck
        ctx.fillStyle = '#E0F7FA'; // sky blue tint
        ctx.fillRect(mx + 3, my, rWidth - 6, 6);

        // red cap on top
        ctx.fillStyle = '#EF5350';
        ctx.fillRect(mx + 2, my - 3, rWidth - 4, 3);

        // label tag belt in middle
        ctx.fillStyle = '#FF4081';
        ctx.fillRect(mx, my + 10, rWidth, 6);

        // inner heart on tag
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 5px sans-serif';
        ctx.fillText("♥", item.x - 2.5, my + 15);

        // outline stroke
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2.5;
        // Draw bottle path outline
        ctx.beginPath();
        ctx.moveTo(mx + 2, my - 3);
        ctx.lineTo(mx + rWidth - 2, my - 3);
        ctx.lineTo(mx + rWidth - 2, my);
        ctx.lineTo(mx + rWidth - 3, my + 6);
        ctx.lineTo(mx + rWidth, my + 6);
        ctx.lineTo(mx + rWidth, my + rHeight);
        ctx.lineTo(mx, my + rHeight);
        ctx.lineTo(mx, my + 6);
        ctx.lineTo(mx + 3, my + 6);
        ctx.lineTo(mx + 2, my);
        ctx.closePath();
        ctx.stroke();

      } else if (item.type === 'bomb') {
        // Mischief bomb: Retro black sphere with sparking fuse
        // 1. Fuse rope
        ctx.strokeStyle = '#D84315';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - 10);
        ctx.quadraticCurveTo(item.x + 8, item.y - 18, item.x + 14, item.y - 15);
        ctx.stroke();

        // 2. Yellow/Orange Spark star
        const sparkPhase = Math.sin(Date.now() / 60) * 3;
        ctx.fillStyle = '#FF3D00';
        ctx.beginPath();
        ctx.arc(item.x + 14, item.y - 15, 4 + sparkPhase, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFEA00';
        ctx.beginPath();
        ctx.arc(item.x + 14, item.y - 15, 2 + sparkPhase/2, 0, Math.PI * 2);
        ctx.fill();

        // 3. Bomb body shadow backing
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(item.x + 2, item.y + 2, item.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dark grey gradient
        const bombGrad = ctx.createRadialGradient(item.x - 3, item.y - 3, 2, item.x, item.y, item.radius);
        bombGrad.addColorStop(0, '#546E7A'); // dark ash slate shine
        bombGrad.addColorStop(0.3, '#37474F');
        bombGrad.addColorStop(0.8, '#212121'); // charcoal black
        bombGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bombGrad;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glossy glare reflection curve at top-left
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(item.x - 4, item.y - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Cute raw cross sign to look dangerous!
        ctx.fillStyle = '#EF5350';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText("✕", item.x - 3.5, item.y + 3);

      } else if (item.type === 'rotten_apple') {
        // Táo thối bốc mùi: Rotten smelly green-brown apple with toxic gas rising from it!
        const rAx = item.x;
        const rAy = item.y;
        const rad = item.radius;

        // 1. Draw 3 squiggly vertical stinky vapor lines rising above the apple (animated!)
        ctx.strokeStyle = 'rgba(139, 195, 74, 0.65)'; // soft stinky toxic green
        ctx.lineWidth = 2.5;
        const timePhase = (Date.now() / 150);
        
        ctx.beginPath();
        // left squiggly line
        ctx.moveTo(rAx - 5, rAy - 8);
        ctx.bezierCurveTo(
          rAx - 8 + Math.sin(timePhase) * 3, rAy - 16,
          rAx - 2 + Math.cos(timePhase) * 3, rAy - 22,
          rAx - 5, rAy - 28
        );
        ctx.stroke();

        ctx.beginPath();
        // center squiggly line
        ctx.moveTo(rAx, rAy - 10);
        ctx.bezierCurveTo(
          rAx + Math.cos(timePhase) * 3, rAy - 18,
          rAx - Math.sin(timePhase) * 3, rAy - 24,
          rAx, rAy - 32
        );
        ctx.stroke();

        ctx.beginPath();
        // right squiggly line
        ctx.moveTo(rAx + 5, rAy - 8);
        ctx.bezierCurveTo(
          rAx + 2 + Math.sin(timePhase) * 3, rAy - 16,
          rAx + 8 + Math.cos(timePhase) * 3, rAy - 22,
          rAx + 5, rAy - 28
        );
        ctx.stroke();

        // 2. Draw Rotten Apple shadow on back
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(rAx + 2, rAy + 2, rad, 0, Math.PI * 2);
        ctx.fill();

        // 3. Apple body: Distorted dark green/muddy brown
        const appleGrad = ctx.createRadialGradient(rAx - 2, rAy - 2, 2, rAx, rAy, rad);
        appleGrad.addColorStop(0, '#C5E1A5'); // pale yellow mold
        appleGrad.addColorStop(0.4, '#81C784'); // nauseating light green
        appleGrad.addColorStop(1, '#5D4037'); // smelly dark brown decay
        ctx.fillStyle = appleGrad;

        ctx.beginPath();
        ctx.arc(rAx, rAy, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 4. Little brown twig stem on top
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(rAx, rAy - rad + 2);
        ctx.quadraticCurveTo(rAx + 3, rAy - rad - 5, rAx + 5, rAy - rad - 4);
        ctx.stroke();

        // 5. Draw tiny stinky worm or decomposition spots
        ctx.fillStyle = '#C62828'; // red rotten spots
        ctx.beginPath();
        ctx.arc(rAx - 3, rAy + 2, 1.8, 0, Math.PI * 2);
        ctx.arc(rAx + 3, rAy - 1, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 6. Smelly buzz fly
        const flyX = rAx + Math.sin(timePhase * 2) * 12;
        const flyY = rAy - 14 + Math.cos(timePhase * 2.5) * 4;
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(flyX, flyY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(flyX - 1, flyY - 1, 1, 0, Math.PI * 2);
        ctx.arc(flyX + 1, flyY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Colllision catcher check
      const catchDist = item.radius + 15;
      const isCatchY = item.y >= (H - 52) && item.y <= (H - 30);
      const isCatchX = Math.abs(item.x - basketX.current) <= (basketWidth.current / 2 + 5);

      if (isCatchX && isCatchY) {
        // Caught!
        items.current.splice(idx, 1);
        
        if (item.type === 'white') {
          setScore(prev => prev + 5);
          floatingTexts.current.push({ x: item.x, y: item.y, text: '+5', color: '#10B981', alpha: 1.0 });
          gameSounds.playCatch();
        } else if (item.type === 'brown') {
          setChucuFragmentsEarned(prev => prev + 1);
          setScore(prev => prev + 15);
          floatingTexts.current.push({ x: item.x, y: item.y, text: '+15', color: '#8B5A2B', alpha: 1.0 });
          gameSounds.playCatch();
        } else if (item.type === 'gold') {
          setChucuGFragmentsEarned(prev => prev + 1);
          setScore(prev => prev + 35);
          floatingTexts.current.push({ x: item.x, y: item.y, text: '+35 Vàng', color: '#F59E0B', alpha: 1.0 });
          gameSounds.playCatch();
        } else if (item.type === 'milk') {
          // Sweet Milk Carton: Double scale size catcher for 7 seconds
          gameSounds.playPowerUp();
          floatingTexts.current.push({ x: item.x, y: item.y, text: 'TO LÊN!', color: '#3B82F6', alpha: 1.0 });
          basketWidth.current = 115;
          if (powerupTimer.current) clearTimeout(powerupTimer.current);
          powerupTimer.current = setTimeout(() => {
            basketWidth.current = 65;
          }, 7000) as any;
        } else if (item.type === 'bomb') {
          // Mischief bomb: Deducts 20 points score
          gameSounds.playBomb();
          screenFlash.current = 0.5;
          floatingTexts.current.push({ x: item.x, y: item.y, text: '-20', color: '#EF4444', alpha: 1.0 });
          setScore(prev => Math.max(0, prev - 20));
        } else if (item.type === 'rotten_apple') {
          // Táo thối bốc mùi decreases lives by 1, if 0 it triggers gameOver
          gameSounds.playBomb();
          screenFlash.current = 0.7;
          floatingTexts.current.push({ x: item.x, y: item.y, text: '-1 ♥', color: '#EF4444', alpha: 1.0 });
          const nextLives = livesRef.current - 1;
          setLives(nextLives);
          livesRef.current = nextLives;
          if (nextLives <= 0) {
            gameOver();
          }
        }
      }

      // Out of bounds check
      if (item.y > H + 20) {
        items.current.splice(idx, 1);
      }
    });

    // Draw Floating Texts
    for (let i = floatingTexts.current.length - 1; i >= 0; i--) {
      const ft = floatingTexts.current[i];
      ft.y -= 1.2; // Float upwards
      ft.alpha -= 0.02; // Fade out
      
      if (ft.alpha <= 0) {
        floatingTexts.current.splice(i, 1);
        continue;
      }
      
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      
      // text outline
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Draw Screen Flash
    if (screenFlash.current > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(239, 68, 68, ${screenFlash.current})`; // Red flash
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      screenFlash.current = Math.max(0, screenFlash.current - 0.05);
    }

    // Request next animation frame if playing
    if (gameStateRef.current === 'playing') {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const relativeX = clientX - rect.left;
    const scaleX = canvas.width / rect.width;
    pointerInputRef.current = relativeX * scaleX;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (gameState === 'playing') {
            if (confirm("Giao diện trò chơi đang bắt đầu! Trở ra ngoài sẽ hủy bỏ lượt chơi hiện tại của bạn. Bạn có muốn thoát?")) {
              setChucuGameOpen(false);
              if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            }
          } else {
            setChucuGameOpen(false);
          }
        }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-[#FFFDF9] dark:bg-[#1A1412] w-full max-w-xl rounded-[2.5rem] overflow-hidden border-4 border-[#3E2723] dark:border-[#5D4037] shadow-[0_4px_0_0_#3E2723] dark:shadow-[0_4px_0_0_#0D0907] flex flex-col max-h-[92vh] z-10"
      >
        {/* Header tabs row */}
        <div className="flex border-b-4 border-[#3E2723] dark:border-[#4E342E] bg-[#F1E4D6]/50 dark:bg-[#251E1B] p-2 pr-12 gap-1.5 shrink-0 select-none">
          <button
            onClick={() => setPanelTab('play')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 cursor-pointer transition-all ${
              panelTab === 'play' 
                ? 'bg-[#8D6E63] text-white shadow-inner' 
                : 'bg-white hover:bg-stone-50 text-[#3E2723] dark:bg-stone-900 dark:text-stone-300'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> Chơi game
          </button>
          
          <button
            onClick={() => setPanelTab('exchange')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 cursor-pointer transition-all ${
              panelTab === 'exchange' 
                ? 'bg-[#8D6E63] text-white shadow-inner' 
                : 'bg-white hover:bg-stone-50 text-[#3E2723] dark:bg-stone-900 dark:text-stone-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Tiệm Đổi Thưởng
          </button>

          <button
            onClick={() => setPanelTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 cursor-pointer transition-all ${
              panelTab === 'guide' 
                ? 'bg-[#8D6E63] text-white shadow-inner' 
                : 'bg-white hover:bg-stone-50 text-[#3E2723] dark:bg-stone-900 dark:text-stone-300'
            }`}
          >
            <Info className="w-4 h-4" /> Hướng dẫn
          </button>
        </div>

        {/* Absolute X Close button */}
        <button
          onClick={() => {
            if (gameState === 'playing') {
              if (confirm("Thoát bây giờ sẽ hủy bỏ kết quả chơi của vòng này. Bạn chắc chắn muốn đóng?")) {
                setChucuGameOpen(false);
                if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
              }
            } else {
              setChucuGameOpen(false);
            }
          }}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#FDF6EC] hover:bg-[#E6D8C9] dark:bg-[#1E1815] dark:hover:bg-[#2C221D] border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[0_3px_0_0_#3E2723] dark:shadow-[0_3px_0_0_#4E342E] text-[#3E2723] dark:text-[#ECE5DC] rounded-xl active:translate-y-0.5 active:shadow-none transition-all z-10 text-xl font-bold font-sans pb-0.5"
        >
          ×
        </button>

        {/* Content Tabs render */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin flex flex-col justify-between max-h-[80vh]">
          {panelTab === 'play' && (
            <div className="flex-1 flex flex-col justify-center items-center">
              {/* Top stats block */}
              <div className="w-full flex items-center justify-between px-3 py-2 bg-[#F1E4D6]/35 dark:bg-black/20 rounded-2xl border-2 border-[#D7CCC8]/60 dark:border-stone-800 mb-4 font-mono text-[11px] font-bold text-stone-500">
                <span className="flex items-center gap-1 text-amber-600">
                  🏆 Hôm nay: {chucuGamePlaysToday}/{defaultPlaysLimit} lượt có thưởng
                </span>
                <span className="flex items-center gap-1 text-[#8D6E63]">
                  🧰 {chucuGameFragments} Mảnh Choco | {chucuGameGFragments} Mảnh GChoco
                </span>
              </div>

              {gameState === 'idle' && (
                <div className="text-center py-8 px-4 w-full max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border-2 border-amber-500 animate-bounce">
                    <Gamepad2 className="w-9 h-9 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide">
                    Chucu Hứng Choco
                  </h3>
                  <p className="text-stone-500 text-xs mt-2 line-height-relaxed leading-relaxed">
                    Giúp bé Chucu mèo đáng yêu di chuyển và hứng vật phẩm rơi xuống từ bầu trời ngọt ngào!
                  </p>

                  <div className="my-5 p-3.5 rounded-2xl bg-orange-50 dark:bg-[#2A1D1A] border-2 border-dashed border-[#8D6E63] text-left text-[11px] text-[#5D4037] dark:text-stone-300 space-y-1.5 leading-relaxed">
                    <div className="font-extrabold flex items-center gap-1 text-orange-600">⚠️ Cơ chế chống lạm phát:</div>
                    <div>• <b>10 lượt đầu tiên mỗi ngày:</b> Hoàn toàn miễn phí, nhận toàn bộ điểm & mảnh Choco/Gchoco thu được.</div>
                    <div>• <b>Từ lượt thứ 11 trở đi:</b> Chơi sẽ <b>tiêu hao 10 Độ no bụng</b> của Chucu, đồng thời <b>không nhận được mảnh</b> thưởng tích lũy (chỉ để chơi giải trí).</div>
                  </div>

                  <button
                    onClick={startGame}
                    className="w-full bg-[#8D6E63] text-white py-3.5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-[0_4px_0_0_#5D4037] active:translate-y-1 active:shadow-none transition-all cursor-pointer hover:bg-[#5D4037]"
                  >
                    🚀 Bắt đầu hứng kẹo!
                  </button>
                </div>
              )}

              {gameState === 'playing' && (
                <div className="w-full flex-1 flex flex-col items-center">
                  {/* Playing score HUD */}
                  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-1.5 px-2 font-mono pb-2 text-sm font-black text-[#5D4037] dark:text-stone-300">
                    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
                      <span>🎯 Điểm: <b className="text-base text-red-500">{score}</b></span>
                      <span>🟤 Mảnh nâu: <b>{chucuFragmentsEarned}</b></span>
                      <span>🟡 Mảnh vàng: <b>{chucuGFragmentsEarned}</b></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-lg border border-red-200 dark:border-red-900 text-red-500 font-extrabold shrink-0 gap-0.5">
                        🍎 Mạng: {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                          <span key={i} className="text-sm select-none">❤️</span>
                        ))}
                        {lives <= 0 && <span className="text-[10px] uppercase text-stone-500">Hết</span>}
                      </span>
                      <div className="px-3 py-1 bg-amber-400 rounded-lg text-[#1A1412] font-black tracking-tight animate-pulse shrink-0">
                        ⏱️ {timeLeft}s
                      </div>
                    </div>
                  </div>

                  {/* HTML5 Canvas container */}
                  <div className="w-full overflow-hidden rounded-3xl border-4 border-[#3E2723] dark:border-[#5D4037] shadow-inner relative">
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={280}
                      className="w-full max-w-full aspect-[480/280] block touch-none cursor-ew-resize"
                      onMouseMove={handlePointerMove}
                      onTouchMove={handlePointerMove}
                    />
                  </div>

                  <p className="text-[10px] text-stone-500 text-center mt-3 font-medium select-none uppercase tracking-wide">
                    🖱️ Di chuột hoặc kéo vuốt ngón tay trên màn hình để di chuyển Chucu qua lại
                  </p>
                </div>
              )}

              {gameState === 'gameover' && (
                <div className="text-center py-6 px-4 w-full max-w-sm">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-7 h-7 text-emerald-600 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide">
                    Kết Thúc Lượt Chơi!
                  </h3>
                  
                  {isNoRewardPlay ? (
                    <p className="text-xs text-orange-600 font-bold mt-2">
                       (Đã đạt giới hạn 10 lượt quà nhận hôm nay (-10 Độ no Satiety))
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 font-bold mt-2">
                      ⭐ Đã lưu dữ liệu mảnh tích lũy vào tài khoản của bạn!
                    </p>
                  )}

                  {/* Show current round rewards summary */}
                  <div className="my-5 p-4 rounded-3xl bg-[#F5E6D3]/40 dark:bg-black/20 border-2 border-[#D7CCC8]/60 dark:border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="flex flex-col gap-1 border-r border-[#3E2723]/10 dark:border-white/10">
                      <span className="text-[10px] uppercase font-black text-stone-500 font-mono">Điểm Thưởng</span>
                      <strong className="text-lg text-rose-500">{scoreRef.current}</strong>
                    </div>
                    <div className="flex flex-col gap-1 border-r border-[#3E2723]/10 dark:border-white/10">
                      <span className="text-[10px] uppercase font-black text-stone-500 font-mono">Mảnh Choco Nâu</span>
                      <strong className="text-lg text-amber-800">+{isNoRewardPlay ? 0 : chucuFragmentsEarned}</strong>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-black text-stone-500 font-mono">Mảnh GChoco</span>
                      <strong className="text-lg text-yellow-600">+{isNoRewardPlay ? 0 : chucuGFragmentsEarned}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={startGame}
                      className="flex-1 bg-[#8D6E63] text-white py-3 rounded-xl font-black uppercase text-xs tracking-wider shadow-[0_3px_0_0_#5D4037] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                    >
                      🔄 Chơi lại lượt nữa!
                    </button>
                    <button
                      onClick={() => setPanelTab('exchange')}
                      className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 py-3 px-4 rounded-xl font-black uppercase text-xs border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                    >
                      🎁 Quy Đổi Quà
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {panelTab === 'exchange' && (
            <div className="flex-grow space-y-5 font-sans">
              <div className="bg-[#F5E6D3]/30 dark:bg-black/25 p-4 rounded-3xl border-2 border-[#D7CCC8] dark:border-stone-800">
                <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                  💼 Túi đồ đổi thưởng của bạn hiện tại:
                </span>
                <div className="grid grid-cols-3 gap-3 text-center mt-2">
                  <div className="p-2 bg-white dark:bg-[#1E1815] rounded-xl border border-[#3E2723]/10 dark:border-stone-800">
                    <div className="text-[10px] font-bold text-stone-500">Mảnh Choco Nâu</div>
                    <div className="text-base font-black text-amber-800 mt-1">{chucuGameFragments}</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1E1815] rounded-xl border border-[#3E2723]/10 dark:border-stone-800">
                    <div className="text-[10px] font-bold text-stone-500">Mảnh GChoco Vàng</div>
                    <div className="text-base font-black text-yellow-600 mt-1">{chucuGameGFragments}</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1E1815] rounded-xl border border-[#3E2723]/10 dark:border-stone-800">
                    <div className="text-[10px] font-bold text-stone-500">Điểm Tích Lũy</div>
                    <div className="text-base font-black text-emerald-600 mt-1">{chucuGameBonusPoints}</div>
                  </div>
                </div>
              </div>

              {/* Fragment Converter Items list */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-stone-500 tracking-wider">
                  🍬 Quy đổi mảnh Choco và Gchoco
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Exchange item 1: Choco */}
                  <div className="bg-white dark:bg-[#1E1815] p-3.5 rounded-2xl border-2 border-[#3E2723]/10 dark:border-stone-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200 shrink-0">
                        <Cookie className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#3E2723] dark:text-[#ECE5DC]">1 Choco</h4>
                        <p className="text-[10px] text-stone-500">Phí: 10 mảnh Choco</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExchangeFragments('choco')}
                      className="px-3 py-1.5 bg-[#8D6E63] hover:bg-[#5D4037] text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Đổi ngay
                    </button>
                  </div>

                  {/* Exchange item 2: Golden Choco */}
                  <div className="bg-white dark:bg-[#1E1815] p-3.5 rounded-2xl border-2 border-[#3E2723]/10 dark:border-stone-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 shrink-0">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#3E2723] dark:text-[#ECE5DC]">1 GChoco</h4>
                        <p className="text-[10px] text-stone-500">Phí: 10 mảnh GChoco</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExchangeFragments('gchoco')}
                      className="px-3 py-1.5 bg-[#8D6E63] hover:bg-[#5D4037] text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Đổi ngay
                    </button>
                  </div>
                </div>
              </div>

              {/* Points Exchange items list */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-stone-500 tracking-wider">
                  🎁 Sử Dụng Điểm Thưởng Đổi Quà Khác
                </span>

                <div className="space-y-2">
                  {/* Exchange Box */}
                  <div className="bg-white dark:bg-[#1E1815] p-3 rounded-2xl border-2 border-[#3E2723]/10 dark:border-stone-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#3E2723] dark:text-[#ECE5DC]">1 Hộp quà Sticker Bí Ẩn</h4>
                        <p className="text-[10px] text-stone-500">Để mở sticker chưa có trong cửa hàng • <b>1200 điểm</b></p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExchangePoints('mystery')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Đổi
                    </button>
                  </div>

                  {/* Exchange Ticket */}
                  <div className="bg-white dark:bg-[#1E1815] p-3 rounded-2xl border-2 border-[#3E2723]/10 dark:border-stone-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF9C4] flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#3E2723] dark:text-[#ECE5DC]">1 Vé bảo vệ điểm điểm danh</h4>
                        <p className="text-[10px] text-stone-500">Giữ streak checkin vĩnh viễn khi vắng mặt • <b>800 điểm</b></p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExchangePoints('streak_ticket')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Đổi
                    </button>
                  </div>

                  {/* Exchange instant mlem feed */}
                  <div className="bg-white dark:bg-[#1E1815] p-3 rounded-2xl border-2 border-[#3E2723]/10 dark:border-stone-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#E0F7FA] flex items-center justify-center shrink-0">
                        <Flame className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#3E2723] dark:text-[#ECE5DC]">Thức ăn hảo hạng mlem mlem Chucu</h4>
                        <p className="text-[10px] text-stone-500">Nạp đầy ngay lập tức cho Chucu thêm +25% Độ No bụng • <b>600 điểm</b></p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExchangePoints('feed_mlem')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Đổi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {panelTab === 'guide' && (
            <div className="flex-grow space-y-4 font-sans text-xs text-[#3E2723] dark:text-stone-300">
              <h3 className="text-sm font-black uppercase text-[#8D6E63] tracking-wide border-b pb-1.5 flex items-center gap-1">
                🎮 Cách Chơi Thao Tác Chucu Hứng Choco
              </h3>

              <div className="space-y-3 pl-1 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 font-bold flex items-center justify-center border shrink-0 text-[10px]">1</span>
                  <p>Sử dụng <b>kéo vuốt ngón tay (điện thoại)</b> hoặc <b>di chuyển chuột qua lại</b> để điều khiển bé Chucu đội mũ hứng kẹo ngọt rơi ở cạnh dưới màn hình.</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 font-bold flex items-center justify-center border shrink-0 text-[10px]">2</span>
                  <div>
                    <h5 className="font-extrabold uppercase text-[10px] mb-1">🍭 Phân Loại Vật Phẩm:</h5>
                    <ul className="space-y-1 text-[11px] list-disc pl-3">
                      <li><b>Choco Trắng (Sữa):</b> Điểm cộng thưởng ngọt ngào (+5 điểm).</li>
                      <li><b>Choco Nâu (Mảnh nhỏ):</b> Rơi hiếm, đổi Choco thực tế (+15 điểm).</li>
                      <li><b>Choco Vàng (Mảnh vàng):</b> Siêu hiếm, đổi GChoco thực tế (+35 điểm).</li>
                      <li><b>Hộp sữa ngọt ngào (Power-up):</b> Phóng to kích thước Chucu to gấp đôi trong 7 giây để hứng trọn kẹo dễ dàng hơn.</li>
                      <li><b>Bom nghịch ngợm (Quả bom):</b> Gây nổ phụ, trừ mạnh -20 điểm. Hãy né tránh quả bom này nhé!</li>
                      <li><b>Táo thối bốc mùi (Vật cản):</b> Vật cản bốc khói hôi rình, khiến Chucu **bị trừ đi 1 mạng** (tối đa 3 mạng). Hứng nhầm 3 quả táo thối sẽ bị Game Over ngay lập tức!</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 font-bold flex items-center justify-center border shrink-0 text-[10px]">3</span>
                  <p>Mỗi lượt chơi kéo dài trong vòng <b>30 giây</b>. Hãy hứng thật khéo léo để đạt điểm số cao nhất có thể rồi quy sang Túi Đồ thần kỳ từ Tiệm Đổi Thưởng!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

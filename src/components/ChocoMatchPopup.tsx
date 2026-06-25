import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Trophy,
  X,
  Star,
  Zap,
  RefreshCw,
  Map as MapIcon,
  Heart,
  Lock,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store";

type ViewMode = "map" | "game";
type ChocoColor =
  | "darkbrown"
  | "lightbrown"
  | "white"
  | "pink"
  | "green"
  | "rainbow"
  | "none";
type SpecialType =
  | "none"
  | "striped_h"
  | "striped_v"
  | "wrapped"
  | "color_bomb"
  | "fish"
  | "lucky_candy";

type BlockerType = "none" | "marshmallow" | "chocolate" | "mixer" | "cake_bomb";
type ItemType = "choco" | "cherry" | "hazelnut" | "rainbow_candy";

interface TileData {
  id: string;
  type: ItemType;
  color: ChocoColor;
  special: SpecialType;
  row: number;
  col: number;
  isMatched: boolean;
  isLocked: boolean; // Ice
  blocker: BlockerType;
  wrappedStage?: number;
  bombTimer?: number;
  blockerLayers?: number; // health/layers for marshmallow (1-3), mixer (3), cake_bomb (4)
}

interface CellData {
  row: number;
  col: number;
  foil: number; // 0, 1, 2 (Thạch đơn vs Thạch kép)
}

interface BoosterInventory {
  striped_wrapped: number;
  color_bomb: number;
  jellyfish: number;
  lucky_candy: number;
  lollipop: number;
  free_switch: number;
  sweet_teeth: number;
  bomb_cooler: number;
}

type GoalType = "score" | "collect" | "foil" | "cherry" | "hazelnut" | "rainbow_candy";
interface LevelGoal {
  type: GoalType;
  target: number;
  current: number;
  color?: ChocoColor;
}

type LevelType = "jelly" | "ingredients" | "order" | "rainbow";

const COLORS: ChocoColor[] = [
  "darkbrown",
  "lightbrown",
  "white",
  "pink",
  "green",
];
const BOARD_SIZE = 8;
const MAX_HEARTS = 5;
const REGEN_TIME_MS = 30 * 60 * 1000; // 30 minutes

const generateId = () => Math.random().toString(36).substr(2, 9);

const playCrunchSound = () => {
  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 0.15; // 150ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 800 + Math.random() * 400; // randomize pitch

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    noise.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start();
  } catch (e) {}
};

export interface LevelDifficulty {
  name: string;
  colorClass: string;
  badgeColor: string;
  bgClass: string;
  desc: string;
  icon: string;
}

export const getLevelDifficulty = (lvl: number): LevelDifficulty => {
  if (lvl === 1) {
    return {
      name: "Hướng dẫn",
      colorClass: "text-emerald-600 font-extrabold",
      badgeColor: "bg-emerald-500",
      bgClass: "from-emerald-50 to-emerald-100",
      desc: "Làm quen cách ghép choco ngọt ngào!",
      icon: "✨",
    };
  }
  if (lvl % 25 === 0) {
    return {
      name: "Siêu Khó",
      colorClass: "text-red-600 font-extrabold",
      badgeColor: "bg-red-600 animate-pulse",
      bgClass: "from-red-50 to-red-100",
      desc: "Thử thách cực đại! Hãy kết hợp các choco đặc biệt!",
      icon: "🔥",
    };
  }
  if (lvl % 10 === 0) {
    return {
      name: "Khó",
      colorClass: "text-purple-600 font-extrabold",
      badgeColor: "bg-purple-500",
      bgClass: "from-purple-50 to-purple-100",
      desc: "Cấp độ Khó! Đòi hỏi tính toán nước đi thông minh.",
      icon: "😈",
    };
  }
  if (lvl % 5 === 0) {
    return {
      name: "Thử Thách",
      colorClass: "text-amber-600 font-extrabold",
      badgeColor: "bg-amber-500",
      bgClass: "from-amber-50 to-amber-100",
      desc: "Mức độ thử thách cao, hãy chuẩn bị chu đáo!",
      icon: "⭐",
    };
  }
  return {
    name: "Dễ",
    colorClass: "text-[#5D4037] font-bold",
    badgeColor: "bg-green-500",
    bgClass: "from-green-50 to-green-100",
    desc: "Cấp độ thường, dễ dàng hoàn thành và thư giãn.",
    icon: "🍬",
  };
};

export const getIntroGoalsForLevel = (level: number): LevelGoal[] => {
  let goals: LevelGoal[] = [];
  
  // Score Goal
  let scoreTarget = 1000 + level * 500;
  if (level === 1) scoreTarget = 300;
  else if (level === 2) scoreTarget = 500;
  else if (level === 3) scoreTarget = 800;
  else if (level === 4) scoreTarget = 1000;
  else {
    scoreTarget = 1000 + (level - 4) * 200;
  }
  goals.push({ type: "score", target: scoreTarget, current: 0 });

  const getLevelType = (lvl: number): LevelType => {
    if (lvl === 1 || lvl === 2 || lvl === 3) return "order";
    if (lvl === 4) return "rainbow";
    if (lvl === 5) return "jelly";
    if (lvl === 6) return "ingredients";
    const types: LevelType[] = ["jelly", "ingredients", "order", "rainbow"];
    return types[lvl % 4];
  };

  const type = getLevelType(level);

  if (type === "jelly") {
    goals.push({ type: "foil", target: 8 + Math.min(24, level), current: 0 });
  } else if (type === "ingredients") {
    const cherryTarget = 1 + (level % 3 === 0 ? 1 : 0);
    const hazelnutTarget = level >= 8 ? 1 : 0;
    goals.push({ type: "cherry", target: cherryTarget, current: 0 });
    if (hazelnutTarget > 0) {
      goals.push({ type: "hazelnut", target: hazelnutTarget, current: 0 });
    }
  } else if (type === "rainbow") {
    goals.push({ type: "rainbow_candy", target: 4 + Math.min(10, Math.floor(level / 3)), current: 0 });
  } else {
    let colors = COLORS;
    if (level === 1) colors = ["darkbrown", "lightbrown", "white"];
    else if (level <= 3) colors = ["darkbrown", "lightbrown", "white", "pink"];
    const randomColor = colors[(level * 7) % colors.length];
    goals.push({
      type: "collect",
      color: randomColor,
      target: 10 + Math.floor(level * 1.5),
      current: 0,
    });
  }
  
  return goals;
};

export const ChocoMatchPopup: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const {
    chocoMatchLevel,
    chocoMatchHearts,
    chocoMatchLastHeartTick,
    updateChocoMatchState,
    choco,
    spendChoco,
    addChoco,
    addGoldenChoco,
  } = useStore();

  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [currentPlayingLevel, setCurrentPlayingLevel] = useState(1);
  const [selectedLevelForIntro, setSelectedLevelForIntro] = useState<number | null>(null);

  // Booster States
  const [boosterInventory, setBoosterInventory] = useState<BoosterInventory>(() => {
    const saved = localStorage.getItem("choco_match_boosters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      striped_wrapped: 2,
      color_bomb: 2,
      jellyfish: 2,
      lucky_candy: 2,
      lollipop: 2,
      free_switch: 2,
      sweet_teeth: 2,
      bomb_cooler: 2,
    };
  });

  useEffect(() => {
    localStorage.setItem("choco_match_boosters", JSON.stringify(boosterInventory));
  }, [boosterInventory]);

  const [equippedPreBoosters, setEquippedPreBoosters] = useState<string[]>([]);
  const [activeInGameBooster, setActiveInGameBooster] = useState<"lollipop" | "free_switch" | null>(null);

  // Game State
  const [board, setBoard] = useState<TileData[]>([]);
  const [foilBoard, setFoilBoard] = useState<CellData[]>([]);
  const [goals, setGoals] = useState<LevelGoal[]>([]);
  const goalsRef = useRef<LevelGoal[]>([]);
  const mapScrollContainerRef = useRef<HTMLDivElement>(null);
  const isFirstScrollRef = useRef(true);
  
  const updateGoalsState = (newGoals: LevelGoal[] | ((prev: LevelGoal[]) => LevelGoal[])) => {
    if (typeof newGoals === "function") {
      setGoals((prev) => {
        const next = newGoals(prev);
        goalsRef.current = next;
        return next;
      });
    } else {
      goalsRef.current = newGoals;
      setGoals(newGoals);
    }
  };

  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20);
  const [gameState, setGameState] = useState<
    "playing" | "won" | "lost" | "animating"
  >("playing");
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [lostReason, setLostReason] = useState<string>("");

  // Heart Regen Logic
  useEffect(() => {
    const checkHearts = () => {
      if (chocoMatchHearts < MAX_HEARTS && chocoMatchLastHeartTick) {
        const now = Date.now();
        const diff = now - chocoMatchLastHeartTick;
        if (diff >= REGEN_TIME_MS) {
          const heartsToAdd = Math.floor(diff / REGEN_TIME_MS);
          const newHearts = Math.min(
            MAX_HEARTS,
            chocoMatchHearts + heartsToAdd,
          );
          const newTick =
            newHearts === MAX_HEARTS
              ? null
              : chocoMatchLastHeartTick + heartsToAdd * REGEN_TIME_MS;
          updateChocoMatchState({
            chocoMatchHearts: newHearts,
            chocoMatchLastHeartTick: newTick,
          });
        }
      }
    };
    checkHearts();
    const interval = setInterval(checkHearts, 1000);
    return () => clearInterval(interval);
  }, [chocoMatchHearts, chocoMatchLastHeartTick, updateChocoMatchState]);

  // Map Auto-scroll
  useEffect(() => {
    if (viewMode === "map") {
      const scrollIntoPlace = () => {
        const container = mapScrollContainerRef.current;
        const currentEl = document.getElementById(`level-btn-${chocoMatchLevel}`);
        if (container && currentEl) {
          const containerHeight = container.clientHeight || 500;
          const maxLevels = Math.max(50, chocoMatchLevel + 20);
          const mapHeight = maxLevels * 110 + 300;
          const i = chocoMatchLevel - 1;
          const y = mapHeight - 250 - i * 110;
          const targetScrollTop = y - containerHeight / 2;
          
          container.scrollTo({
            top: targetScrollTop,
            behavior: isFirstScrollRef.current ? "auto" : "smooth"
          });
          
          if (isFirstScrollRef.current) {
            isFirstScrollRef.current = false;
          }
        }
      };

      // Run multiple times with timeouts to ensure container and elements are fully rendered
      scrollIntoPlace();
      const t1 = setTimeout(scrollIntoPlace, 50);
      const t2 = setTimeout(scrollIntoPlace, 150);
      const t3 = setTimeout(scrollIntoPlace, 350);
      const t4 = setTimeout(scrollIntoPlace, 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [viewMode, chocoMatchLevel]);

  const timeUntilNextHeart = useMemo(() => {
    if (chocoMatchHearts >= MAX_HEARTS || !chocoMatchLastHeartTick) return null;
    const now = Date.now();
    const nextTick = chocoMatchLastHeartTick + REGEN_TIME_MS;
    const diff = Math.max(0, nextTick - now);
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [chocoMatchHearts, chocoMatchLastHeartTick, gameState]);

  // Generate Board
  const generateLevel = useCallback((level: number) => {
    let newBoard: TileData[] = [];
    let newFoil: CellData[] = [];
    let newGoals: LevelGoal[] = [];

    // Let's determine number of colors based on level difficulty
    let colorsToUse = COLORS;
    if (level === 1) {
      colorsToUse = ["darkbrown", "lightbrown", "white"]; // 3 colors - extremely easy to make matches & special candies!
    } else if (level <= 3) {
      colorsToUse = ["darkbrown", "lightbrown", "white", "pink"]; // 4 colors - very easy
    } else {
      colorsToUse = COLORS; // 5 colors - standard
    }

    // Moves limit
    let newMoves = 25; // level 1-2 starts with 25 moves
    if (level === 3 || level === 4) newMoves = 24;
    else if (level >= 5) {
      newMoves = 20 + Math.floor(level / 2);
      if (newMoves > 35) newMoves = 35; // cap at 35 to maintain tension

      // Adjust moves based on difficulty
      if (level % 25 === 0) newMoves = Math.max(15, newMoves - 6); // Super hard gets tighter moves
      else if (level % 10 === 0) newMoves = Math.max(18, newMoves - 4); // Hard gets tighter moves
      else if (level % 5 === 0) newMoves = Math.max(20, newMoves - 2);
    }

    const getLevelType = (lvl: number): LevelType => {
      if (lvl === 1 || lvl === 2 || lvl === 3) return "order";
      if (lvl === 4) return "rainbow";
      if (lvl === 5) return "jelly";
      if (lvl === 6) return "ingredients";
      const types: LevelType[] = ["jelly", "ingredients", "order", "rainbow"];
      return types[lvl % 4];
    };

    const type = getLevelType(level);

    // Determine mechanics based on level
    const hasFoil = type === "jelly" || (level >= 5 && Math.random() < 0.4);
    const hasIce = level >= 10;
    const hasMarshmallow = level >= 15 || (type === "ingredients" && level >= 6);
    const hasChocolate = level >= 20;
    const hasBombs = level >= 12;
    const hasMixer = level >= 8;
    const hasCakeBomb = level >= 14;

    // Generate Board
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let isLocked = false;
        let blocker: BlockerType = "none";
        let blockerLayers = undefined;
        let foil = 0;
        let tileType: ItemType = "choco";

        // Handcrafted layouts/obstacles based on level types
        if (hasCakeBomb && r === 4 && c === 4 && Math.random() < 0.4) {
          blocker = "cake_bomb";
          blockerLayers = 4;
        } else if (hasMixer && ((r === 7 && c === 0) || (r === 7 && c === 7)) && Math.random() < 0.35) {
          blocker = "mixer";
          blockerLayers = 3;
        } else if (hasChocolate && Math.random() < Math.min(0.08, 0.03 + level * 0.001)) {
          blocker = "chocolate";
        } else if (hasMarshmallow && Math.random() < Math.min(0.12, 0.04 + level * 0.002)) {
          blocker = "marshmallow";
          blockerLayers = level >= 18 ? (Math.random() > 0.6 ? 2 : 1) : 1;
        } else if (hasIce && Math.random() < Math.min(0.15, 0.05 + level * 0.003)) {
          isLocked = true;
        }

        // Foil generation
        if (hasFoil && blocker === "none") {
          const foilProb = type === "jelly" ? 0.75 : 0.15;
          if (Math.random() < foilProb) {
            foil = (level >= 9 && Math.random() > 0.5) ? 2 : 1;
          }
        }

        if (foil > 0) newFoil.push({ row: r, col: c, foil });

        // Ingredient Placement (Cherry / Hazelnut at the top row)
        if (type === "ingredients" && r === 0 && (c === 2 || c === 5)) {
          blocker = "none";
          isLocked = false;
          tileType = Math.random() > 0.5 ? "cherry" : "hazelnut";
        } else if (type === "rainbow" && Math.random() < 0.1 && blocker === "none") {
          tileType = "rainbow_candy";
        }

        let color: ChocoColor = "none";
        let bombTimer: number | undefined = undefined;

        if (blocker === "none" && tileType !== "cherry" && tileType !== "hazelnut") {
          do {
            color = colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
            const left1 = newBoard.find((t) => t.row === r && t.col === c - 1);
            const left2 = newBoard.find((t) => t.row === r && t.col === c - 2);
            const up1 = newBoard.find((t) => t.row === r - 1 && t.col === c);
            const up2 = newBoard.find((t) => t.row === r - 2 && t.col === c);

            let isHMatch =
              left1 && left2 && left1.color === color && left2.color === color;
            let isVMatch =
              up1 && up2 && up1.color === color && up2.color === color;

            if (!isHMatch && !isVMatch) break;
          } while (true);

          if (hasBombs && !isLocked && Math.random() < 0.06) {
            bombTimer = 10 + Math.floor(Math.random() * 4); // 10-13 moves
          }
        }

        newBoard.push({
          id: generateId(),
          type: tileType,
          color,
          special: "none",
          row: r,
          col: c,
          isMatched: false,
          isLocked,
          blocker,
          bombTimer,
          blockerLayers,
        });
      }
    }

    // Score Target
    let scoreTarget = 1000 + level * 500;
    if (level === 1) scoreTarget = 300;
    else if (level === 2) scoreTarget = 500;
    else if (level === 3) scoreTarget = 800;
    else if (level === 4) scoreTarget = 1000;
    else {
      scoreTarget = 1000 + (level - 4) * 200;
    }

    newGoals.push({ type: "score", target: scoreTarget, current: 0 });

    // Level-specific goals
    if (type === "jelly") {
      newGoals.push({
        type: "foil",
        target: newFoil.reduce((acc, f) => acc + f.foil, 0),
        current: 0,
      });
    } else if (type === "ingredients") {
      const cherryTarget = 1 + (level % 3 === 0 ? 1 : 0);
      const hazelnutTarget = level >= 8 ? 1 : 0;
      newGoals.push({ type: "cherry", target: cherryTarget, current: 0 });
      if (hazelnutTarget > 0) {
        newGoals.push({ type: "hazelnut", target: hazelnutTarget, current: 0 });
      }
    } else if (type === "rainbow") {
      const rainbowTarget = 4 + Math.min(10, Math.floor(level / 3));
      newGoals.push({ type: "rainbow_candy", target: rainbowTarget, current: 0 });
    } else {
      // Order Goals (collect specific chocolate colors)
      let colors = COLORS;
      if (level === 1) colors = ["darkbrown", "lightbrown", "white"];
      else if (level <= 3) colors = ["darkbrown", "lightbrown", "white", "pink"];
      const randomColor = colors[(level * 7) % colors.length];
      newGoals.push({
        type: "collect",
        color: randomColor,
        target: 10 + Math.floor(level * 1.5),
        current: 0,
      });
    }

    return { board: newBoard, foil: newFoil, goals: newGoals, moves: newMoves };
  }, []);

  const startGame = (level: number) => {
    if (chocoMatchHearts <= 0) return;
    updateChocoMatchState({
      chocoMatchHearts: chocoMatchHearts - 1,
      chocoMatchLastHeartTick:
        chocoMatchHearts === MAX_HEARTS ? Date.now() : chocoMatchLastHeartTick,
    });

    setCurrentPlayingLevel(level);
    const {
      board: initialBoard,
      foil,
      goals: initialGoals,
      moves: initialMoves,
    } = generateLevel(level);

    // Apply pre-game boosters
    let modBoard = [...initialBoard];
    let inventoryUpdates: Partial<BoosterInventory> = {};

    const getRandomValidTiles = (count: number) => {
      const candidates = modBoard.filter(
        (t) => t.blocker === "none" && t.type === "choco" && t.special === "none" && !t.isLocked
      );
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    if (equippedPreBoosters.includes("striped_wrapped")) {
      inventoryUpdates.striped_wrapped = Math.max(0, boosterInventory.striped_wrapped - 1);
      const tiles = getRandomValidTiles(2);
      if (tiles.length >= 2) {
        const t1 = modBoard.find((x) => x.id === tiles[0].id);
        const t2 = modBoard.find((x) => x.id === tiles[1].id);
        if (t1) t1.special = Math.random() > 0.5 ? "striped_h" : "striped_v";
        if (t2) t2.special = "wrapped";
      }
    }

    if (equippedPreBoosters.includes("color_bomb")) {
      inventoryUpdates.color_bomb = Math.max(0, boosterInventory.color_bomb - 1);
      const tiles = getRandomValidTiles(1);
      if (tiles.length >= 1) {
        const t = modBoard.find((x) => x.id === tiles[0].id);
        if (t) t.special = "color_bomb";
      }
    }

    if (equippedPreBoosters.includes("jellyfish")) {
      inventoryUpdates.jellyfish = Math.max(0, boosterInventory.jellyfish - 1);
      const tiles = getRandomValidTiles(3);
      tiles.forEach((tile) => {
        const t = modBoard.find((x) => x.id === tile.id);
        if (t) t.special = "fish";
      });
    }

    if (equippedPreBoosters.includes("lucky_candy")) {
      inventoryUpdates.lucky_candy = Math.max(0, boosterInventory.lucky_candy - 1);
      const tiles = getRandomValidTiles(2);
      tiles.forEach((tile) => {
        const t = modBoard.find((x) => x.id === tile.id);
        if (t) t.special = "lucky_candy";
      });
    }

    if (Object.keys(inventoryUpdates).length > 0) {
      setBoosterInventory((prev) => ({ ...prev, ...inventoryUpdates }));
    }

    // Reset equipped selection
    setEquippedPreBoosters([]);

    setBoard(modBoard);
    setFoilBoard(foil);
    updateGoalsState(initialGoals);
    setMoves(initialMoves);
    setScore(0);
    setGameState("playing");
    setSelectedTile(null);
    setLostReason("");
    setViewMode("game");
  };

  const findMatchesAndSpecials = useCallback(
    (
      currentBoard: TileData[],
      swapContext?: { r1: number; c1: number; r2: number; c2: number },
    ) => {
      let matchedIds = new Set<string>();
      let hLines: TileData[][] = [];
      let vLines: TileData[][] = [];

      // Find horizontal lines
      for (let r = 0; r < BOARD_SIZE; r++) {
        let match: TileData[] = [];
        for (let c = 0; c < BOARD_SIZE; c++) {
          const t = currentBoard.find((x) => x.row === r && x.col === c);
          if (!t || t.isMatched) {
            if (match.length >= 3) hLines.push([...match]);
            match = [];
            continue;
          }
          if (match.length === 0) {
            if (t.blocker === "none") match.push(t);
          } else if (
            match[0].color === t.color &&
            t.color !== "rainbow" &&
            t.blocker === "none"
          ) {
            match.push(t);
          } else {
            if (match.length >= 3) hLines.push([...match]);
            match = t.blocker === "none" ? [t] : [];
          }
        }
        if (match.length >= 3) hLines.push([...match]);
      }

      // Find vertical lines
      for (let c = 0; c < BOARD_SIZE; c++) {
        let match: TileData[] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          const t = currentBoard.find((x) => x.row === r && x.col === c);
          if (!t || t.isMatched) {
            if (match.length >= 3) vLines.push([...match]);
            match = [];
            continue;
          }
          if (match.length === 0) {
            if (t.blocker === "none") match.push(t);
          } else if (
            match[0].color === t.color &&
            t.color !== "rainbow" &&
            t.blocker === "none"
          ) {
            match.push(t);
          } else {
            if (match.length >= 3) vLines.push([...match]);
            match = t.blocker === "none" ? [t] : [];
          }
        }
        if (match.length >= 3) vLines.push([...match]);
      }

      let specialsToCreate: {
        row: number;
        col: number;
        color: ChocoColor;
        special: SpecialType;
      }[] = [];

      // Process intersections for Wrapped bombs
      let hProcessed = new Set<number>();
      let vProcessed = new Set<number>();

      hLines.forEach((hline, hIdx) => {
        vLines.forEach((vline, vIdx) => {
          const intersection = hline.find((ht) =>
            vline.some((vt) => vt.id === ht.id),
          );
          if (intersection) {
            hProcessed.add(hIdx);
            vProcessed.add(vIdx);
            hline.forEach((t) => matchedIds.add(t.id));
            vline.forEach((t) => matchedIds.add(t.id));
            specialsToCreate.push({
              row: intersection.row,
              col: intersection.col,
              color: intersection.color,
              special: "wrapped",
            });
          }
        });
      });

      // Process remaining lines for Striped / Rainbow
      hLines.forEach((hline, hIdx) => {
        if (hProcessed.has(hIdx)) return;
        hline.forEach((t) => matchedIds.add(t.id));
        if (hline.length >= 5) {
          const target = swapContext
            ? hline.find(
                (t) =>
                  (t.row === swapContext.r1 && t.col === swapContext.c1) ||
                  (t.row === swapContext.r2 && t.col === swapContext.c2),
              ) || hline[2]
            : hline[2];
          specialsToCreate.push({
            row: target.row,
            col: target.col,
            color: "rainbow",
            special: "color_bomb",
          });
        } else if (hline.length === 4) {
          const target = swapContext
            ? hline.find(
                (t) =>
                  (t.row === swapContext.r1 && t.col === swapContext.c1) ||
                  (t.row === swapContext.r2 && t.col === swapContext.c2),
              ) || hline[1]
            : hline[1];
          let spec: SpecialType = "striped_h";
          if (swapContext) {
            if (swapContext.c1 === swapContext.c2) {
              spec = "striped_v"; // Swiped vertically
            } else {
              spec = "striped_h"; // Swiped horizontally
            }
          }
          specialsToCreate.push({
            row: target.row,
            col: target.col,
            color: target.color,
            special: spec,
          });
        }
      });

      vLines.forEach((vline, vIdx) => {
        if (vProcessed.has(vIdx)) return;
        vline.forEach((t) => matchedIds.add(t.id));
        if (vline.length >= 5) {
          const target = swapContext
            ? vline.find(
                (t) =>
                  (t.row === swapContext.r1 && t.col === swapContext.c1) ||
                  (t.row === swapContext.r2 && t.col === swapContext.c2),
              ) || vline[2]
            : vline[2];
          specialsToCreate.push({
            row: target.row,
            col: target.col,
            color: "rainbow",
            special: "color_bomb",
          });
        } else if (vline.length === 4) {
          const target = swapContext
            ? vline.find(
                (t) =>
                  (t.row === swapContext.r1 && t.col === swapContext.c1) ||
                  (t.row === swapContext.r2 && t.col === swapContext.c2),
              ) || vline[1]
            : vline[1];
          let spec: SpecialType = "striped_v";
          if (swapContext) {
            if (swapContext.c1 === swapContext.c2) {
              spec = "striped_v"; // Swiped vertically
            } else {
              spec = "striped_h"; // Swiped horizontally
            }
          }
          specialsToCreate.push({
            row: target.row,
            col: target.col,
            color: target.color,
            special: spec,
          });
        }
      });

      return { matchedIds: Array.from(matchedIds), specialsToCreate };
    },
    [],
  );

  const resolveExplosions = useCallback(
    (boardToCheck: TileData[], initialMatchedIds: Set<string>) => {
      let matched = new Set(initialMatchedIds);
      let queue = Array.from(initialMatchedIds);
      let processed = new Set<string>();

      while (queue.length > 0) {
        const id = queue.shift()!;
        if (processed.has(id)) continue;
        processed.add(id);

        const tile = boardToCheck.find((t) => t.id === id);
        if (!tile) continue;

        if (tile.special === "striped_h") {
          boardToCheck.forEach((t) => {
            if (t.row === tile.row && !matched.has(t.id)) {
              matched.add(t.id);
              queue.push(t.id);
            }
          });
        } else if (tile.special === "striped_v") {
          boardToCheck.forEach((t) => {
            if (t.col === tile.col && !matched.has(t.id)) {
              matched.add(t.id);
              queue.push(t.id);
            }
          });
        } else if (tile.special === "wrapped") {
          if (tile.wrappedStage !== 2) {
            // Stage 1 explosion: Explode surroundings but keep itself alive to fall
            tile.wrappedStage = 2;
            boardToCheck.forEach((t) => {
              if (
                Math.abs(t.row - tile.row) <= 1 &&
                Math.abs(t.col - tile.col) <= 1 &&
                t.id !== tile.id &&
                !matched.has(t.id)
              ) {
                matched.add(t.id);
                queue.push(t.id);
              }
            });
            // Make sure itself is NOT in matched so it isn't cleared yet
            matched.delete(tile.id);
          } else {
            // Stage 2 explosion: Explode surroundings and destroy itself
            tile.wrappedStage = undefined;
            boardToCheck.forEach((t) => {
              if (
                Math.abs(t.row - tile.row) <= 1 &&
                Math.abs(t.col - tile.col) <= 1 &&
                !matched.has(t.id)
              ) {
                matched.add(t.id);
                queue.push(t.id);
              }
            });
            // Destroy itself this time
            matched.add(tile.id);
          }
        } else if (tile.special === "color_bomb") {
          // Automatic explosion chain for color bomb: choose random active color on board and explode all of them!
          const activeColors = COLORS.filter((c) =>
            boardToCheck.some((t) => t.color === c && t.blocker === "none" && !t.isMatched && t.id !== tile.id)
          );
          const randomColor = activeColors.length > 0
            ? activeColors[Math.floor(Math.random() * activeColors.length)]
            : COLORS[0];
          boardToCheck.forEach((t) => {
            if (t.color === randomColor && !matched.has(t.id) && t.blocker === "none") {
              matched.add(t.id);
              queue.push(t.id);
            }
          });
          matched.add(tile.id);
        } else if (tile.special === "fish") {
          // Fish selects 3 random tiles with blockers/locks, or just random tiles if none
          let targets: TileData[] = boardToCheck.filter((t) => t.id !== tile.id && !matched.has(t.id) && (t.blocker !== "none" || t.isLocked));
          if (targets.length < 3) {
            // Priority 2: cells with foil under them
            const foilCells = foilBoard.filter(f => f.foil > 0);
            const foilTiles = boardToCheck.filter(t => t.id !== tile.id && !matched.has(t.id) && foilCells.some(f => f.row === t.row && f.col === t.col));
            foilTiles.forEach(t => {
              if (targets.length < 3 && !targets.some(x => x.id === t.id)) {
                targets.push(t);
              }
            });
          }
          if (targets.length < 3) {
            // Priority 3: standard candies
            const ordinaryTiles = boardToCheck.filter((t) => t.id !== tile.id && !matched.has(t.id) && t.blocker === "none");
            ordinaryTiles.forEach(t => {
              if (targets.length < 3 && !targets.some(x => x.id === t.id)) {
                targets.push(t);
              }
            });
          }
          // Pick up to 3
          const picked = targets.slice(0, 3);
          picked.forEach((t) => {
            matched.add(t.id);
            queue.push(t.id);
          });
          matched.add(tile.id);
        } else if (tile.special === "lucky_candy") {
          // Lucky Candy: explodes into a random striped, wrapped, or color bomb effect!
          const choice = Math.random();
          if (choice < 0.4) {
            // Striped horizontal/vertical
            const stType = Math.random() > 0.5 ? "striped_v" : "striped_h";
            boardToCheck.forEach((t) => {
              if (
                (stType === "striped_v" && t.col === tile.col) ||
                (stType === "striped_h" && t.row === tile.row)
              ) {
                if (!matched.has(t.id)) {
                  matched.add(t.id);
                  queue.push(t.id);
                }
              }
            });
          } else if (choice < 0.8) {
            // Wrapped explosion (3x3 surroundings)
            boardToCheck.forEach((t) => {
              if (
                Math.abs(t.row - tile.row) <= 1 &&
                Math.abs(t.col - tile.col) <= 1 &&
                !matched.has(t.id)
              ) {
                matched.add(t.id);
                queue.push(t.id);
              }
            });
          } else {
            // Color bomb: clear a whole color!
            const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            boardToCheck.forEach((t) => {
              if (t.color === randomColor && !matched.has(t.id) && t.blocker === "none") {
                matched.add(t.id);
                queue.push(t.id);
              }
            });
          }
          matched.add(tile.id);
        }
      }

      // Check for adjacent blockers to destroy
      const blockersToDestroy = new Set<string>();
      boardToCheck.forEach((t) => {
        if (t.blocker !== "none" && !matched.has(t.id)) {
          // Check if any matched tile is adjacent
          const isAdjacent = Array.from(matched).some((mId) => {
            const m = boardToCheck.find((x) => x.id === mId);
            if (!m) return false;
            const dist = Math.abs(m.row - t.row) + Math.abs(m.col - t.col);
            return dist === 1; // adjacent (up, down, left, right)
          });
          if (isAdjacent) blockersToDestroy.add(t.id);
        }
      });

      blockersToDestroy.forEach((id) => matched.add(id));

      return matched;
    },
    [foilBoard],
  );

  const processMatches = useCallback(
    async (
      currentBoard: TileData[],
      currentMoves: number = moves,
      swapContext?: { r1: number; c1: number; r2: number; c2: number },
      forcedMatches?: Set<string>,
      chocolateWasDestroyedInThisTurn: boolean = false,
    ) => {
      let boardState = [...currentBoard];
      const { matchedIds, specialsToCreate } = findMatchesAndSpecials(
        boardState,
        swapContext,
      );

      // Find any second-stage wrapped candies on the board to force their explosion
      const secondStageWrappedIds = boardState
        .filter((t) => t.special === "wrapped" && t.wrappedStage === 2)
        .map((t) => t.id);

      // Collect cherries and hazelnuts that reached the bottom row (row 7)
      let collectedCherries = 0;
      let collectedHazelnuts = 0;
      const ingredientMatches = new Set<string>();

      boardState.forEach((t) => {
        if (t.row === BOARD_SIZE - 1 && !t.isMatched) {
          if (t.type === "cherry") {
            collectedCherries++;
            ingredientMatches.add(t.id);
          } else if (t.type === "hazelnut") {
            collectedHazelnuts++;
            ingredientMatches.add(t.id);
          }
        }
      });

      const allMatches = new Set([
        ...matchedIds,
        ...(forcedMatches || []),
        ...secondStageWrappedIds,
        ...ingredientMatches,
      ]);

      if (allMatches.size === 0) {
        // TURN COMPLETED (NO MORE MATCHES/CASCADES)
        let finalBoard = [...boardState];

        // 1. Chocolate Spreading logic
        if (!chocolateWasDestroyedInThisTurn) {
          const chocolates = finalBoard.filter((t) => t.blocker === "chocolate");
          if (chocolates.length > 0) {
            const candidates: TileData[] = [];
            chocolates.forEach((ch) => {
              finalBoard.forEach((t) => {
                if (
                  t.blocker === "none" &&
                  !t.isLocked &&
                  t.special === "none" &&
                  t.type === "choco" &&
                  t.bombTimer === undefined && // do not spread onto bombs
                  Math.abs(t.row - ch.row) + Math.abs(t.col - ch.col) === 1
                ) {
                  if (!candidates.some((c) => c.id === t.id)) {
                    candidates.push(t);
                  }
                }
              });
            });
            if (candidates.length > 0) {
              const pick = candidates[Math.floor(Math.random() * candidates.length)];
              const pIdx = finalBoard.findIndex((t) => t.id === pick.id);
              if (pIdx >= 0) {
                finalBoard[pIdx] = {
                  ...finalBoard[pIdx],
                  blocker: "chocolate",
                  color: "none",
                  special: "none",
                  bombTimer: undefined,
                };
              }
            }
          }
        }

        // 1b. Magic Mixer actions (every time a move is made, they spit out obstacles)
        const mixers = finalBoard.filter((t) => t.blocker === "mixer" && !t.isMatched);
        if (mixers.length > 0 && currentMoves < moves) {
          mixers.forEach((mixer) => {
            const adjacent = finalBoard.filter(
              (t) =>
                t.blocker === "none" &&
                !t.isLocked &&
                t.type === "choco" &&
                Math.abs(t.row - mixer.row) + Math.abs(t.col - mixer.col) === 1,
            );
            if (adjacent.length > 0) {
              const pick = adjacent[Math.floor(Math.random() * adjacent.length)];
              const pIdx = finalBoard.findIndex((t) => t.id === pick.id);
              if (pIdx >= 0) {
                const rand = Math.random();
                if (rand < 0.5) {
                  finalBoard[pIdx] = {
                    ...finalBoard[pIdx],
                    blocker: "marshmallow",
                    blockerLayers: 1,
                    color: "none",
                    special: "none",
                  };
                } else {
                  finalBoard[pIdx] = {
                    ...finalBoard[pIdx],
                    isLocked: true,
                  };
                }
              }
            }
          });
        }

        // 2. Choco Bombs Timer countdown
        let bombExploded = false;
        finalBoard = finalBoard.map((t) => {
          if (t.bombTimer !== undefined) {
            const nextTimer = t.bombTimer - 1;
            if (nextTimer <= 0) {
              bombExploded = true;
            }
            return { ...t, bombTimer: nextTimer };
          }
          return t;
        });

        setBoard([...finalBoard]);

        // 3. Game Over & Win check
        const isWon = goalsRef.current.every((g) => g.current >= g.target);
        if (bombExploded) {
          setLostReason("Bùm! Bom Choco hẹn giờ đã phát nổ!");
          setGameState("lost");
        } else if (currentMoves <= 0) {
          setLostReason("Hết lượt đi. Khách hàng đã rời đi.");
          setGameState("lost");
        } else {
          setGameState(isWon ? "won" : "playing");
        }
        return;
      }

      const finalMatchedIds = resolveExplosions(boardState, allMatches);

      let chocolateDestroyed = false;
      let matchedColors: Partial<Record<ChocoColor, number>> = {};
      let foilUpdates: { row: number; col: number }[] = [];
      let rainbowCandiesCleared = 0;

      finalMatchedIds.forEach((id) => {
        const idx = boardState.findIndex((b) => b.id === id);
        if (idx >= 0) {
          const t = boardState[idx];
          if (t.isLocked) {
            t.isLocked = false;
            // Remove from matched so it doesn't get destroyed
            finalMatchedIds.delete(id);
          } else if (t.blocker === "marshmallow" && t.blockerLayers && t.blockerLayers > 1) {
            t.blockerLayers--;
            finalMatchedIds.delete(id);
          } else if (t.blocker === "mixer" && t.blockerLayers && t.blockerLayers > 1) {
            t.blockerLayers--;
            finalMatchedIds.delete(id);
            playCrunchSound();
          } else if (t.blocker === "cake_bomb" && t.blockerLayers && t.blockerLayers > 1) {
            t.blockerLayers--;
            finalMatchedIds.delete(id);
            playCrunchSound();
          } else {
            boardState[idx].isMatched = true;
            if (t.blocker === "chocolate") chocolateDestroyed = true;
            if (t.color !== "none") {
              matchedColors[t.color] = (matchedColors[t.color] || 0) + 1;
            }
            if (t.type === "rainbow_candy") {
              rainbowCandiesCleared++;
            }
            foilUpdates.push({ row: t.row, col: t.col });

            // Special blocker explosions on destruction
            if (t.blocker === "mixer") {
              boardState.forEach((other) => {
                if ((other.row === t.row || other.col === t.col) && !other.isMatched && other.id !== t.id) {
                  other.isMatched = true;
                  if (other.color !== "none") {
                    matchedColors[other.color] = (matchedColors[other.color] || 0) + 1;
                  }
                }
              });
            } else if (t.blocker === "cake_bomb") {
              boardState.forEach((other) => {
                if (!other.isMatched && other.id !== t.id) {
                  other.isMatched = true;
                  if (other.color !== "none") {
                    matchedColors[other.color] = (matchedColors[other.color] || 0) + 1;
                  }
                }
              });
            }
          }
        }
      });

      // Calculate how many layers of foil are actually destroyed to count toward goals
      let foilLayersDestroyed = 0;
      foilUpdates.forEach((fu) => {
        const f = foilBoard.find((cell) => cell.row === fu.row && cell.col === fu.col);
        if (f && f.foil > 0) {
          foilLayersDestroyed++;
        }
      });

      // Process foil
      setFoilBoard((prev) => {
        let next = [...prev];
        let changed = false;
        foilUpdates.forEach((fu) => {
          const fIdx = next.findIndex(
            (f) => f.row === fu.row && f.col === fu.col && f.foil > 0,
          );
          if (fIdx >= 0) {
            next[fIdx] = { ...next[fIdx], foil: next[fIdx].foil - 1 };
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      // Update goals
      updateGoalsState((prev) =>
        prev.map((g) => {
          if (g.type === "score") {
            return { ...g, current: g.current + finalMatchedIds.size * 10 };
          }
          if (g.type === "collect" && g.color && matchedColors[g.color]) {
            return {
              ...g,
              current: Math.min(g.target, g.current + matchedColors[g.color]!),
            };
          }
          if (g.type === "foil" && foilLayersDestroyed > 0) {
            return {
              ...g,
              current: Math.min(g.target, g.current + foilLayersDestroyed),
            };
          }
          if (g.type === "cherry" && collectedCherries > 0) {
            return {
              ...g,
              current: Math.min(g.target, g.current + collectedCherries),
            };
          }
          if (g.type === "hazelnut" && collectedHazelnuts > 0) {
            return {
              ...g,
              current: Math.min(g.target, g.current + collectedHazelnuts),
            };
          }
          if (g.type === "rainbow_candy" && rainbowCandiesCleared > 0) {
            return {
              ...g,
              current: Math.min(g.target, g.current + rainbowCandiesCleared),
            };
          }
          return g;
        }),
      );

      // Add specials
      specialsToCreate.forEach((sp) => {
        const idx = boardState.findIndex(
          (b) => b.row === sp.row && b.col === sp.col,
        );
        if (idx >= 0) {
          boardState[idx].isMatched = false; // keep it alive
          boardState[idx].color = sp.color;
          boardState[idx].special = sp.special;
          boardState[idx].type = "choco";
        }
      });

      setBoard([...boardState]);
      setScore((s) => s + finalMatchedIds.size * 10);
      if (finalMatchedIds.size > 0) playCrunchSound();

      await new Promise((resolve) => setTimeout(resolve, 300));

      let newBoardState = boardState.filter((t) => !t.isMatched);
      for (let c = 0; c < BOARD_SIZE; c++) {
        let fallRow = BOARD_SIZE - 1;
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
          const tileIdx = newBoardState.findIndex(
            (t) => t.col === c && t.row === r,
          );
          if (tileIdx !== -1) {
            const tile = newBoardState[tileIdx];
            if (tile.blocker !== "none") {
              fallRow = r - 1; // reset fall row above blocker
            } else {
              newBoardState[tileIdx].row = fallRow;
              fallRow--;
            }
          }
        }
        for (let r = fallRow; r >= 0; r--) {
          const hasBombs = currentPlayingLevel >= 12;
          const bombTimer = (hasBombs && Math.random() < 0.03) ? 10 + Math.floor(Math.random() * 4) : undefined;
          
          // Determine if we spawn ingredients or special items
          const cherryGoal = goalsRef.current.find(g => g.type === "cherry");
          const hazelnutGoal = goalsRef.current.find(g => g.type === "hazelnut");
          const currentIngredientsCount = newBoardState.filter(
            t => (t.type === "cherry" || t.type === "hazelnut") && !t.isMatched
          ).length;

          let spawnType: ItemType = "choco";
          if (r === 0 && Math.random() < 0.15 && currentIngredientsCount < 2) {
            if (cherryGoal && cherryGoal.current < cherryGoal.target && Math.random() < 0.5) {
              spawnType = "cherry";
            } else if (hazelnutGoal && hazelnutGoal.current < hazelnutGoal.target) {
              spawnType = "hazelnut";
            }
          }

          const rainbowGoal = goalsRef.current.find(g => g.type === "rainbow_candy");
          if (spawnType === "choco" && rainbowGoal && Math.random() < 0.08) {
            spawnType = "rainbow_candy";
          }

          newBoardState.push({
            id: generateId(),
            type: spawnType,
            color: spawnType === "choco" || spawnType === "rainbow_candy" ? COLORS[Math.floor(Math.random() * COLORS.length)] : "none",
            special: "none",
            row: r,
            col: c,
            isMatched: false,
            isLocked: false,
            blocker: "none",
            bombTimer,
          });
        }
      }

      setBoard([...newBoardState]);
      await new Promise((resolve) => setTimeout(resolve, 300));
      processMatches(
        newBoardState,
        currentMoves,
        undefined,
        undefined,
        chocolateWasDestroyedInThisTurn || chocolateDestroyed,
      ); // recursive cascade
    },
    [findMatchesAndSpecials, resolveExplosions, moves, score, goals, foilBoard, currentPlayingLevel],
  );

  const swapTiles = async (tile1: TileData, tile2: TileData, isFreeSwitch: boolean = false) => {
    setGameState("animating");
    let tempBoard = [...board];
    const idx1 = tempBoard.findIndex((t) => t.id === tile1.id);
    const idx2 = tempBoard.findIndex((t) => t.id === tile2.id);

    const tempRow = tempBoard[idx1].row;
    const tempCol = tempBoard[idx1].col;
    tempBoard[idx1].row = tempBoard[idx2].row;
    tempBoard[idx1].col = tempBoard[idx2].col;
    tempBoard[idx2].row = tempRow;
    tempBoard[idx2].col = tempCol;

    setBoard([...tempBoard]);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Handle Color Bomb swaps directly
    const t1 = tempBoard[idx1];
    const t2 = tempBoard[idx2];
    let isSpecialCombo = false;
    let matchedIds = new Set<string>();

    if (t1.special === "color_bomb" && t2.special === "color_bomb") {
      // Clear whole board
      tempBoard.forEach((t) => matchedIds.add(t.id));
      isSpecialCombo = true;
    } else if (t1.special === "color_bomb" || t2.special === "color_bomb") {
      const bomb = t1.special === "color_bomb" ? t1 : t2;
      const target = t1.special === "color_bomb" ? t2 : t1;
      matchedIds.add(bomb.id);

      if (
        target.special === "striped_h" ||
        target.special === "striped_v"
      ) {
        // Change all tiles of target.color to random horizontal/vertical stripes so they blast in both directions
        tempBoard.forEach((t) => {
          if (t.color === target.color && t.blocker === "none") {
            t.special = Math.random() > 0.5 ? "striped_h" : "striped_v";
            matchedIds.add(t.id);
          }
        });
      } else if (target.special === "wrapped") {
        // Change all tiles of target.color to wrapped
        tempBoard.forEach((t) => {
          if (t.color === target.color && t.blocker === "none") {
            t.special = "wrapped";
            matchedIds.add(t.id);
          }
        });
      } else {
        // Just clear all tiles of that color
        tempBoard.forEach((t) => {
          if (t.color === target.color) matchedIds.add(t.id);
        });
      }
      isSpecialCombo = true;
    } else if (
      ((t1.special === "striped_h" || t1.special === "striped_v") &&
        t2.special === "wrapped") ||
      (t1.special === "wrapped" &&
        (t2.special === "striped_h" || t2.special === "striped_v"))
    ) {
      // Sọc + Gói: Tạo ra 1 tia sét khổng lồ quét sạch 3 hàng ngang và 3 cột dọc.
      matchedIds.add(t1.id);
      matchedIds.add(t2.id);
      const row = t2.row;
      const col = t2.col;
      tempBoard.forEach((t) => {
        if (Math.abs(t.row - row) <= 1 || Math.abs(t.col - col) <= 1) {
          matchedIds.add(t.id);
        }
      });
      isSpecialCombo = true;
    } else if (
      (t1.special === "striped_h" || t1.special === "striped_v") &&
      (t2.special === "striped_h" || t2.special === "striped_v")
    ) {
      // Sọc + Sọc: Quét 1 ngang 1 dọc
      matchedIds.add(t1.id);
      matchedIds.add(t2.id);
      const row = t2.row;
      const col = t2.col;
      tempBoard.forEach((t) => {
        if (t.row === row || t.col === col) matchedIds.add(t.id);
      });
      isSpecialCombo = true;
    } else if (t1.special === "wrapped" && t2.special === "wrapped") {
      // Gói + Gói: Nổ 5x5
      matchedIds.add(t1.id);
      matchedIds.add(t2.id);
      const row = t2.row;
      const col = t2.col;
      tempBoard.forEach((t) => {
        if (Math.abs(t.row - row) <= 2 && Math.abs(t.col - col) <= 2)
          matchedIds.add(t.id);
      });
      isSpecialCombo = true;
    }

    const swapContext = { r1: t1.row, c1: t1.col, r2: t2.row, c2: t2.col };
    const matchResult = findMatchesAndSpecials(tempBoard, swapContext);

    if (!isSpecialCombo) {
      matchResult.matchedIds.forEach((id) => matchedIds.add(id));
    }

    if (matchedIds.size === 0) {
      if (isFreeSwitch) {
        // Free Switch allows invalid swaps, do not revert! And do not subtract moves.
        setGameState("playing");
      } else {
        // Invalid swap, revert
        let revertBoard = [...tempBoard];
        const rIdx1 = revertBoard.findIndex((t) => t.id === tile1.id);
        const rIdx2 = revertBoard.findIndex((t) => t.id === tile2.id);
        const rRow = revertBoard[rIdx1].row;
        const rCol = revertBoard[rIdx1].col;
        revertBoard[rIdx1].row = revertBoard[rIdx2].row;
        revertBoard[rIdx1].col = revertBoard[rIdx2].col;
        revertBoard[rIdx2].row = rRow;
        revertBoard[rIdx2].col = rCol;
        setBoard([...revertBoard]);
        setGameState("playing");
      }
    } else {
      if (isFreeSwitch) {
        // Do not subtract moves for Free Switch!
        processMatches(tempBoard, moves, swapContext, matchedIds);
      } else {
        setMoves((m) => m - 1);
        processMatches(tempBoard, moves - 1, swapContext, matchedIds);
      }
    }
  };

  const handleTileClick = (tile: TileData) => {
    if (gameState !== "playing") return;

    if (activeInGameBooster === "lollipop") {
      setBoosterInventory((prev) => ({ ...prev, lollipop: Math.max(0, prev.lollipop - 1) }));
      executeLollipopHammer(tile);
      return;
    }

    if (tile.isLocked || tile.blocker !== "none") {
      if (activeInGameBooster === "free_switch") {
        alert("Không thể tráo đổi ô chướng ngại vật!");
      }
      return;
    }

    if (!selectedTile) {
      setSelectedTile(tile);
    } else {
      if (selectedTile.id === tile.id) {
        setSelectedTile(null);
        return;
      }
      const isAdjacent =
        (Math.abs(selectedTile.row - tile.row) === 1 &&
          selectedTile.col === tile.col) ||
        (Math.abs(selectedTile.col - tile.col) === 1 &&
          selectedTile.row === tile.row);
      if (isAdjacent) {
        setSelectedTile(null);
        if (activeInGameBooster === "free_switch") {
          setBoosterInventory((prev) => ({ ...prev, free_switch: Math.max(0, prev.free_switch - 1) }));
          swapTiles(selectedTile, tile, true);
          setActiveInGameBooster(null);
        } else {
          swapTiles(selectedTile, tile);
        }
      } else {
        setSelectedTile(tile);
      }
    }
  };

  const executeLollipopHammer = async (tile: TileData) => {
    setGameState("animating");
    let tempBoard = [...board];
    const idx = tempBoard.findIndex((t) => t.id === tile.id);
    if (idx === -1) {
      setGameState("playing");
      setActiveInGameBooster(null);
      return;
    }

    const t = tempBoard[idx];
    let matchedIds = new Set<string>();

    if (t.blocker !== "none") {
      if (t.blocker === "marshmallow") {
        if (t.blockerLayers && t.blockerLayers > 1) {
          t.blockerLayers -= 1;
        } else {
          t.blocker = "none";
        }
      } else if (t.blocker === "chocolate") {
        t.blocker = "none";
      } else if (t.blocker === "mixer") {
        if (t.blockerLayers && t.blockerLayers > 1) {
          t.blockerLayers -= 1;
        }
      } else if (t.blocker === "cake_bomb") {
        if (t.blockerLayers && t.blockerLayers > 1) {
          t.blockerLayers -= 1;
        }
      }
    } else if (t.isLocked) {
      t.isLocked = false;
    } else {
      matchedIds.add(t.id);
    }

    setBoard([...tempBoard]);
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (matchedIds.size > 0) {
      processMatches(tempBoard, moves, undefined, matchedIds);
    } else {
      setGameState("playing");
    }
    setActiveInGameBooster(null);
  };

  const executeSweetTeeth = async () => {
    setGameState("animating");
    let tempBoard = [...board];
    let matchedIds = new Set<string>();

    // Choose up to 12 random tiles to destroy or damage
    const shuffled = [...tempBoard].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 12);

    selected.forEach((tile) => {
      const idx = tempBoard.findIndex((t) => t.id === tile.id);
      if (idx !== -1) {
        const t = tempBoard[idx];
        if (t.blocker !== "none") {
          if (t.blockerLayers && t.blockerLayers > 1) {
            t.blockerLayers -= 1;
          } else {
            t.blocker = "none";
          }
        } else if (t.isLocked) {
          t.isLocked = false;
        } else {
          matchedIds.add(t.id);
        }
      }
    });

    setBoard([...tempBoard]);
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (matchedIds.size > 0) {
      processMatches(tempBoard, moves, undefined, matchedIds);
    } else {
      setGameState("playing");
    }
  };

  const executeBombCooler = () => {
    let hasBombs = false;
    const nextBoard = board.map((t) => {
      if (t.bombTimer !== undefined) {
        hasBombs = true;
        return { ...t, bombTimer: t.bombTimer + 5 };
      }
      return t;
    });
    setBoard(nextBoard);
    alert("❄️ Chế độ đóng băng: Đã cộng thêm +5 lượt đếm lùi cho tất cả bom hẹn giờ trên bảng!");
  };

  const togglePreGameBooster = (key: "striped_wrapped" | "color_bomb" | "jellyfish" | "lucky_candy") => {
    if (equippedPreBoosters.includes(key)) {
      setEquippedPreBoosters((prev) => prev.filter((k) => k !== key));
    } else {
      if (boosterInventory[key] > 0) {
        setEquippedPreBoosters((prev) => [...prev, key]);
      } else {
        const prices = {
          striped_wrapped: 50,
          color_bomb: 80,
          jellyfish: 60,
          lucky_candy: 50,
        };
        const price = prices[key];
        if (spendChoco(price, `Mua trang bị Choco Match: ${key}`)) {
          setBoosterInventory((prev) => ({ ...prev, [key]: 1 }));
          setEquippedPreBoosters((prev) => [...prev, key]);
        } else {
          alert(`Bạn không đủ Choco để mua vật phẩm này! (Cần ${price} Choco)`);
        }
      }
    }
  };

  const handleUseInGameBooster = (key: "lollipop" | "free_switch" | "sweet_teeth" | "bomb_cooler") => {
    if (gameState !== "playing") return;

    const count = boosterInventory[key as keyof BoosterInventory] || 0;
    const prices = {
      lollipop: 40,
      free_switch: 45,
      sweet_teeth: 90,
      bomb_cooler: 30,
    };
    const price = prices[key];

    const performBoosterAction = () => {
      if (key === "lollipop" || key === "free_switch") {
        setActiveInGameBooster(key);
        setSelectedTile(null); // Clear selected tile
      } else if (key === "sweet_teeth") {
        setBoosterInventory((prev) => ({ ...prev, sweet_teeth: Math.max(0, prev.sweet_teeth - 1) }));
        executeSweetTeeth();
      } else if (key === "bomb_cooler") {
        setBoosterInventory((prev) => ({ ...prev, bomb_cooler: Math.max(0, prev.bomb_cooler - 1) }));
        executeBombCooler();
      }
    };

    if (count > 0) {
      performBoosterAction();
    } else {
      // Try to buy & use immediately
      if (spendChoco(price, `Sử dụng vật phẩm trong trận: ${key}`)) {
        setBoosterInventory((prev) => ({ ...prev, [key]: 1 }));
        performBoosterAction();
      } else {
        alert(`Bạn không đủ Choco để mua vật phẩm này! (Cần ${price} Choco)`);
      }
    }
  };

  const winGame = () => {
    if (currentPlayingLevel === chocoMatchLevel) {
      updateChocoMatchState({ chocoMatchLevel: chocoMatchLevel + 1 });
    }
    addChoco(3);
    if (currentPlayingLevel % 10 === 0) addGoldenChoco(1);
    setViewMode("map");
  };

  // Rendering logic
  const getColorStyle = (color: string, special: SpecialType) => {
    let baseStyle: any = { color: "#FFF" };
    switch (color) {
      case "darkbrown":
        baseStyle = {
          background: "linear-gradient(135deg, #4E342E 0%, #3E2723 100%)",
          borderColor: "#261410",
          color: "#D7CCC8",
        };
        break;
      case "lightbrown":
        baseStyle = {
          background: "linear-gradient(135deg, #8D6E63 0%, #5D4037 100%)",
          borderColor: "#3E2723",
          color: "#FFFDF9",
        };
        break;
      case "white":
        baseStyle = {
          background: "linear-gradient(135deg, #FFFDF9 0%, #E6D8C9 100%)",
          borderColor: "#D7CCC8",
          color: "#5D4037",
        };
        break;
      case "pink":
        baseStyle = {
          background: "linear-gradient(135deg, #F8BBD0 0%, #D81B60 100%)",
          borderColor: "#880E4F",
          color: "#FFF",
        };
        break;
      case "green":
        baseStyle = {
          background: "linear-gradient(135deg, #A5D6A7 0%, #388E3C 100%)",
          borderColor: "#1B5E20",
          color: "#FFF",
        };
        break;
      case "rainbow":
        baseStyle = {
          background:
            "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
          borderColor: "#FFF",
          color: "#000",
        };
        break;
      default:
        baseStyle = { background: "#9e9e9e", borderColor: "#616161" };
        break;
    }
    return baseStyle;
  };

  const renderBoosterIllustration = (key: string) => {
    switch (key) {
      case "striped_wrapped":
        return (
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            {/* Pink Striped Candy */}
            <div
              style={{
                background: "linear-gradient(135deg, #F8BBD0 0%, #D81B60 100%)",
                borderColor: "#880E4F",
              }}
              className="w-5.5 h-5.5 rounded-[40%] border-b border-r-[0.5px] absolute left-0.5 bottom-0.5 shadow-md flex items-center justify-center overflow-hidden -rotate-12"
            >
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/30 rounded-full blur-[0.5px] transform -rotate-12" />
              <div className="absolute inset-0 flex flex-col justify-evenly opacity-50">
                <div className="h-[20%] bg-white/60 w-full" />
                <div className="h-[20%] bg-white/60 w-full" />
              </div>
            </div>
            
            {/* Green Wrapped Candy */}
            <div
              style={{
                background: "linear-gradient(135deg, #A5D6A7 0%, #388E3C 100%)",
                borderColor: "#1B5E20",
              }}
              className="w-5.5 h-5.5 rounded-[40%] border-b border-r-[0.5px] absolute right-0.5 top-0.5 shadow-md flex items-center justify-center overflow-hidden rotate-12 z-10"
            >
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/30 rounded-full blur-[0.5px] transform -rotate-12" />
              <div className="absolute inset-0 m-[10%] border border-white/60 rounded-sm flex items-center justify-center bg-white/10">
                <div className="w-1/3 h-1/3 bg-white/80 rounded-full shadow-inner" />
              </div>
            </div>
          </div>
        );
      case "color_bomb":
        return (
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <div className="w-7 h-7 rounded-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] animate-spin-slow shadow-md border-2 border-white flex items-center justify-center relative">
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/40 rounded-full blur-[1px]" />
              <span className="text-[10px]">💣</span>
            </div>
          </div>
        );
      case "jellyfish":
        return (
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <div
              style={{
                background: "linear-gradient(135deg, #80DEEA 0%, #00ACC1 100%)",
                borderColor: "#006064",
              }}
              className="w-7.5 h-7.5 rounded-[40%] border-b-2 border-r-[1px] shadow-md flex items-center justify-center overflow-hidden relative"
            >
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/30 rounded-full blur-[0.5px]" />
              <span className="text-sm z-10 animate-bounce" style={{ animationDuration: "2s" }}>🐠</span>
            </div>
          </div>
        );
      case "lucky_candy":
        return (
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <div
              style={{
                background: "linear-gradient(135deg, #C8E6C9 0%, #4CAF50 100%)",
                borderColor: "#2E7D32",
              }}
              className="w-7.5 h-7.5 rounded-[40%] border-b-2 border-r-[1px] shadow-md flex items-center justify-center overflow-hidden relative"
            >
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/30 rounded-full blur-[0.5px]" />
              <div className="w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center shadow-inner border border-white">
                <span className="text-[10px] animate-pulse">🍀</span>
              </div>
            </div>
          </div>
        );
      case "lollipop":
        return (
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <div className="absolute bottom-1 w-1 h-4 bg-stone-300 border border-stone-400 rounded-sm origin-bottom rotate-[-30deg]" />
            <div className="absolute top-1 w-5.5 h-5.5 rounded-full bg-[radial-gradient(circle_at_center,red_0%,orange_40%,yellow_70%,red_100%)] border border-[#3E2723] shadow-md flex items-center justify-center overflow-hidden animate-pulse">
              <div className="w-full h-full bg-[conic-gradient(from_0deg,#FFF_0%,transparent_10%,#FFF_20%,transparent_30%,#FFF_40%,transparent_50%,#FFF_60%,transparent_70%,#FFF_80%,transparent_90%,#FFF_100%)] opacity-30 animate-spin" style={{ animationDuration: "6s" }} />
              <span className="absolute text-[8px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none">🍭</span>
            </div>
          </div>
        );
      case "free_switch":
        return (
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <span className="text-sm text-[#5D4037]/60 absolute z-0 select-none animate-spin-slow">🔄</span>
            <div
              style={{
                background: "linear-gradient(135deg, #F8BBD0 0%, #D81B60 100%)",
                borderColor: "#880E4F",
              }}
              className="w-3.5 h-3.5 rounded-[40%] border-b border-r-[0.5px] absolute left-1 top-1.5 shadow-md z-10"
            >
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/30 rounded-full blur-[0.5px]" />
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #A5D6A7 0%, #388E3C 100%)",
                borderColor: "#1B5E20",
              }}
              className="w-3.5 h-3.5 rounded-[40%] border-b border-r-[0.5px] absolute right-1 bottom-1.5 shadow-md z-10"
            >
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/30 rounded-full blur-[0.5px]" />
            </div>
          </div>
        );
      case "sweet_teeth":
        return (
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <div className="w-7.5 h-7.5 rounded-full bg-red-100 border border-red-300 shadow-md flex flex-col items-center justify-center overflow-hidden">
              <div className="w-full bg-red-600 h-2 flex justify-around items-end px-0.5 border-b border-red-800">
                <div className="w-[2px] h-[3px] bg-white rounded-b-[1px]" />
                <div className="w-[2px] h-[3px] bg-white rounded-b-[1px]" />
                <div className="w-[2px] h-[3px] bg-white rounded-b-[1px]" />
                <div className="w-[2px] h-[3px] bg-white rounded-b-[1px]" />
              </div>
              <div className="w-full bg-red-600 h-2 flex justify-around items-start px-0.5 mt-0.5 border-t border-red-800">
                <div className="w-[2px] h-[3px] bg-white rounded-t-[1px]" />
                <div className="w-[2px] h-[3px] bg-white rounded-t-[1px]" />
                <div className="w-[2px] h-[3px] bg-white rounded-t-[1px]" />
                <div className="w-[2px] h-[3px] bg-white rounded-t-[1px]" />
              </div>
            </div>
            <span className="absolute right-0 bottom-0 text-[10px] bg-amber-400 border border-amber-600 rounded-full w-3.5 h-3.5 flex items-center justify-center font-black text-amber-900 select-none">🦷</span>
          </div>
        );
      case "bomb_cooler":
        return (
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <div className="absolute w-7.5 h-7.5 rounded-full bg-cyan-50 border border-cyan-300 shadow-md flex items-center justify-center">
              <span className="text-xs select-none">💣</span>
              <span className="absolute top-0 right-0 text-[8px] animate-pulse">❄️</span>
              <span className="absolute bottom-0 left-0 text-[8px] animate-pulse" style={{ animationDelay: "0.5s" }}>❄️</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getSpecialIcon = (special: SpecialType) => {
    switch (special) {
      case "striped_h":
        return (
          <div className="absolute inset-0 flex flex-col justify-evenly opacity-40">
            <div className="h-[20%] bg-white/60 w-full" />
            <div className="h-[20%] bg-white/60 w-full" />
          </div>
        );
      case "striped_v":
        return (
          <div className="absolute inset-0 flex justify-evenly opacity-40">
            <div className="w-[20%] bg-white/60 h-full" />
            <div className="w-[20%] bg-white/60 h-full" />
          </div>
        );
      case "wrapped":
        return (
          <div className="absolute inset-0 m-[10%] border-[3px] border-white/60 rounded-md flex items-center justify-center bg-white/10">
            <div className="w-1/3 h-1/3 bg-white/80 rounded-full shadow-inner" />
          </div>
        );
      case "color_bomb":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[80%] h-[80%] rounded-full bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] animate-spin-slow shadow-lg border-2 border-white" />
          </div>
        );
      case "fish":
        return (
          <div className="absolute inset-0 flex items-center justify-center animate-bounce" style={{ animationDuration: "2s" }}>
            <span className="text-xl">🐠</span>
          </div>
        );
      case "lucky_candy":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[75%] h-[75%] rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center shadow-md animate-pulse border-2 border-white">
              <span className="text-sm">🍀</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#FFFDF9] w-full max-w-md h-[85vh] rounded-3xl flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#3E2723]">
        {/* Header - Map vs Game */}
        {viewMode === "game" ? (
          <div className="bg-[#3E2723] text-[#F5E6D3] py-2 px-3 flex justify-between items-center gap-2 relative z-20 shadow-[0_4px_12px_rgba(62,39,35,0.5)] border-b-4 border-[#5D4037] shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => setViewMode("map")}
                className="p-1.5 bg-[#5D4037] rounded-lg border border-[#4E342E] hover:bg-[#6D4C41] shrink-0 cursor-pointer"
                title="Bản đồ"
              >
                <MapIcon className="w-4 h-4 text-[#FFECB3]" />
              </button>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[11px] font-black text-[#FFECB3] truncate uppercase tracking-wider">
                  ĐƠN #{currentPlayingLevel}
                </span>
                <span className="text-[9px] text-red-400 font-extrabold flex items-center gap-0.5">
                  ❤️ {chocoMatchHearts}/5
                </span>
              </div>
            </div>

            {/* Integrated Goals in Header */}
            <div className="flex-1 flex justify-center items-center gap-1.5 px-1 overflow-x-auto no-scrollbar">
              {goals.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 bg-[#261410] rounded-full px-2 py-0.5 border border-[#5D4037] shadow-inner shrink-0"
                >
                  {g.type === "score" && (
                    <Star
                      className="w-3 h-3 text-amber-400 animate-pulse"
                      fill="currentColor"
                    />
                  )}
                  {g.type === "collect" && g.color && (
                    <div
                      style={getColorStyle(g.color, "none")}
                      className="w-3 h-3 rounded-full border-b-[1px] border-r-[0.5px] shadow-sm"
                    />
                  )}
                  {g.type === "foil" && (
                    <div className="w-3 h-3 bg-gradient-to-br from-gray-300 to-gray-400 rounded-sm border border-gray-500 shadow-sm" />
                  )}
                  {g.type === "cherry" && (
                    <span className="text-xs">🍒</span>
                  )}
                  {g.type === "hazelnut" && (
                    <span className="text-xs">🌰</span>
                  )}
                  {g.type === "rainbow_candy" && (
                    <span className="text-xs animate-spin" style={{ animationDuration: "12s" }}>🌈</span>
                  )}
                  <span className="text-[10px] font-black text-[#FFECB3] whitespace-nowrap">
                    {g.current}/{g.target}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Moves remaining */}
              <div className="flex items-center gap-1 bg-[#261410] px-2 py-1 rounded-lg border border-[#4E342E] leading-none">
                <Zap className="w-3.5 h-3.5 text-[#FFD54F]" fill="currentColor" />
                <span className="font-extrabold text-xs text-[#FFECB3]">
                  {moves}
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-[#FFFDF9] border-2 border-[#3E2723] rounded-lg flex items-center justify-center hover:bg-[#F5E6D3] shadow-[0_2px_0_0_#3E2723] transition-all active:translate-y-0.5 active:shadow-none cursor-pointer text-[#3E2723] shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#3E2723] text-[#F5E6D3] py-2.5 px-4 flex justify-between items-center relative z-20 shadow-[0_4px_12px_rgba(62,39,35,0.5)] border-b-4 border-[#5D4037]">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#D7CCC8] uppercase tracking-widest mb-1">
                  Xưởng Choco
                </span>
                <div className="flex items-center gap-2 bg-[#261410] px-3 py-1.5 rounded-xl border border-[#4E342E]">
                  <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
                  <span className="font-black text-sm text-[#FFECB3]">
                    {chocoMatchHearts}{" "}
                    <span className="text-xs opacity-60 text-[#D7CCC8]">
                      / {MAX_HEARTS}
                    </span>
                  </span>
                  {timeUntilNextHeart && (
                    <span className="text-[10px] text-stone-400 ml-1">
                      {timeUntilNextHeart}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FFFDF9] border-[3px] border-[#3E2723] rounded-xl flex items-center justify-center hover:bg-[#F5E6D3] shadow-[0_3px_0_0_#3E2723] transition-all active:translate-y-0.5 active:shadow-none z-20 cursor-pointer text-[#3E2723] shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {/* Map View */}
            {viewMode === "map" && (
              <motion.div
                key="map"
                ref={mapScrollContainerRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 overflow-y-auto bg-[#FFF8E7] custom-scrollbar scroll-smooth"
                style={{
                  backgroundImage: "radial-gradient(#D7CCC8 2px, transparent 2px)",
                  backgroundSize: "30px 30px"
                }}
              >
                {(() => {
                  const maxLevels = Math.max(50, chocoMatchLevel + 20);
                  const mapHeight = maxLevels * 110 + 300;
                  return (
                    <div className="relative w-full" style={{ height: `${mapHeight}px` }}>
                      {/* Decor elements */}
                      {Array.from({ length: Math.floor(mapHeight / 180) }).map((_, i) => {
                        const y = 100 + i * 180;
                        const isLeft = i % 2 === 0;
                        const emojis = ['🍩', '🍫', '☕', '🥐', '🧁', '🍰', '🍬', '🍭', '🍪', '🍧'];
                        const emoji = emojis[i % emojis.length];
                        return (
                          <div
                            key={`decor-${i}`}
                            className={`absolute text-5xl opacity-30 drop-shadow-sm ${isLeft ? 'left-8 rotate-12' : 'right-8 -rotate-12'}`}
                            style={{ top: `${y}px`, zIndex: 1 }}
                          >
                            {emoji}
                          </div>
                        );
                      })}

                      {/* Chocolate Shop (Bottom) */}
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#6D4C41] rounded-3xl border-8 border-[#4E342E] shadow-2xl flex flex-col items-center justify-center z-10 overflow-hidden">
                        <div className="absolute top-0 w-full flex">
                          <div className="flex-1 h-6 bg-red-400 rounded-b-full"></div>
                          <div className="flex-1 h-6 bg-white rounded-b-full"></div>
                          <div className="flex-1 h-6 bg-red-400 rounded-b-full"></div>
                          <div className="flex-1 h-6 bg-white rounded-b-full"></div>
                        </div>
                        <span className="text-4xl mt-4">🏪</span>
                        <span className="font-bold text-[#FFECB3] mt-2 text-center text-sm px-2">Choco Factory</span>
                      </div>

                      {/* Levels */}
                      {Array.from({ length: maxLevels }).map((_, i) => {
                        const lvl = i + 1;
                        const isUnlocked = lvl <= chocoMatchLevel;
                        const isCurrent = lvl === chocoMatchLevel;
                        const y = mapHeight - 250 - i * 110; // Bottom to top
                        const offset = Math.sin(i * 0.9) * 90; // Zig-zag amplitude

                        let lineSegment = null;
                        if (i < maxLevels - 1) {
                          const nextY = mapHeight - 250 - (i + 1) * 110;
                          const nextOffset = Math.sin((i + 1) * 0.9) * 90;
                          const dx = nextOffset - offset;
                          const dy = nextY - y;
                          const length = Math.sqrt(dx * dx + dy * dy);
                          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                          lineSegment = (
                            <div
                              className="absolute"
                              style={{
                                left: `calc(50% + ${offset}px)`,
                                top: `${y}px`,
                                width: `${length}px`,
                                height: '10px',
                                borderBottom: '6px dashed #8D6E63',
                                transformOrigin: '0 0',
                                transform: `rotate(${angle}deg)`,
                                zIndex: 0,
                                opacity: isUnlocked ? 0.9 : 0.3
                              }}
                            />
                          );
                        }

                        return (
                          <React.Fragment key={lvl}>
                            {lineSegment}
                            <div
                              id={`level-btn-${lvl}`}
                              className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `calc(50% + ${offset}px)`, top: `${y}px`, zIndex: 10 }}
                        >
                          {isCurrent && (
                            <div className="absolute -top-12 animate-bounce bg-[#FF5252] text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg border-2 border-white whitespace-nowrap z-30">
                              CHƠI NGAY
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FF5252] border-b-2 border-r-2 border-white rotate-45" />
                            </div>
                          )}
                          <button
                            onClick={() => isUnlocked && setSelectedLevelForIntro(lvl)}
                            disabled={!isUnlocked}
                            className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-[0_6px_0_rgba(0,0,0,0.2)] transition-all active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.2)] cursor-pointer ${
                              isCurrent
                                ? "scale-110 z-20 border-[#FFF8E7] bg-gradient-to-b from-[#FFD54F] to-[#FFA000] ring-4 ring-[#8D6E63]"
                                : isUnlocked
                                ? (() => {
                                    const diff = getLevelDifficulty(lvl);
                                    if (diff.name === "Siêu Khó") return "border-red-900 bg-gradient-to-b from-red-400 to-red-600 hover:brightness-110";
                                    if (diff.name === "Khó") return "border-purple-900 bg-gradient-to-b from-purple-400 to-purple-600 hover:brightness-110";
                                    if (diff.name === "Thử Thách") return "border-amber-800 bg-gradient-to-b from-amber-400 to-amber-600 hover:brightness-110";
                                    return "border-[#5D4037] bg-gradient-to-b from-[#EFEBE9] to-[#D7CCC8] hover:brightness-110";
                                  })()
                                : "border-[#A1887F] bg-[#D7CCC8] opacity-60"
                            }`}
                          >
                            {isUnlocked ? (
                              <span className={`font-black text-2xl drop-shadow-sm ${
                                isCurrent
                                  ? "text-[#3E2723]"
                                  : (() => {
                                      const name = getLevelDifficulty(lvl).name;
                                      return name === "Dễ" ? "text-[#5D4037]" : "text-white";
                                    })()
                              }`}>
                                {lvl}
                              </span>
                            ) : (
                              <Lock className="w-6 h-6 text-[#8D6E63]" />
                            )}
                          </button>

                          {/* Hard Level Indicator (Purple) */}
                          {lvl % 10 === 0 && lvl % 25 !== 0 && (
                            <div className="absolute -right-2 -bottom-2 w-7 h-7 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-md z-20">
                              😈
                            </div>
                          )}
                          {/* Super Hard Level Indicator (Red) */}
                          {lvl % 25 === 0 && (
                            <div className="absolute -left-2 -bottom-2 w-8 h-8 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-md z-20 animate-pulse">
                              🔥
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                );
              })()}
              </motion.div>
            )}

            {/* Game View */}
            {viewMode === "game" && (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col bg-[#F5E6D3] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] p-2"
              >
                {/* Baking Tray Wrapper to prevent overflow on small height screens */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center py-1 overflow-hidden">
                  <div
                    style={{ width: "min(100%, calc(85vh - 170px))", height: "min(100%, calc(85vh - 170px))" }}
                    className="bg-[#2C2C2C] rounded-2xl relative shadow-[inset_0_10px_20px_rgba(0,0,0,0.5),0_10px_20px_rgba(62,39,35,0.2)] border-8 border-[#1A1A1A] shrink-0 aspect-square"
                  >
                    <div className="absolute inset-1.5">
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          backgroundImage:
                            "linear-gradient(90deg, transparent 95%, #FFF 100%), linear-gradient(0deg, transparent 95%, #FFF 100%)",
                          backgroundSize: "12.5% 12.5%",
                        }}
                      ></div>

                      {/* Foil Layer */}
                      {foilBoard.map(
                        (f, i) =>
                          f.foil > 0 && (
                            <div
                              key={`foil-${f.row}-${f.col}`}
                              className="absolute w-[12.5%] h-[12.5%] p-0.5 z-0"
                              style={{
                                left: `${f.col * 12.5}%`,
                                top: `${f.row * 12.5}%`,
                              }}
                            >
                              <div
                                className={`w-full h-full rounded-md border border-gray-400 ${f.foil === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500" : "bg-gradient-to-br from-gray-200 to-gray-300 opacity-80"}`}
                              ></div>
                            </div>
                          ),
                      )}

                      {/* Ingredient Collection Zone Arrows */}
                      <div className="absolute bottom-[-14px] left-0 right-0 h-4 flex justify-between pointer-events-none z-20 px-[2.5%]">
                        {Array.from({ length: BOARD_SIZE }).map((_, col) => (
                          <div key={col} className="w-[12.5%] flex flex-col items-center justify-center animate-bounce" style={{ animationDuration: "1.5s" }}>
                            <span className="text-[10px] sm:text-xs font-black text-[#81C784] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]">▼</span>
                          </div>
                        ))}
                      </div>

                      {board.map((tile) => (
                        <motion.div
                          key={tile.id}
                          initial={false}
                          animate={{
                            x: `${tile.col * 100}%`,
                            y: `${tile.row * 100}%`,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                          className="absolute w-[12.5%] h-[12.5%] p-1 z-10 left-0 top-0"
                        >
                          <AnimatePresence>
                            {!tile.isMatched && (
                              <motion.div
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-full h-full relative cursor-pointer"
                                onClick={() => handleTileClick(tile)}
                              >
                                {tile.blocker === "marshmallow" ? (
                                  <div className="w-full h-full rounded-lg bg-[#F5F5F5] shadow-md border-b-4 border-gray-300 flex flex-col items-center justify-center relative overflow-hidden">
                                    {/* Frosting / Marshmallow layers indicator */}
                                    <div className="absolute top-1 left-1 bg-[#8D6E63] text-white font-extrabold rounded-full w-4 h-4 text-[9px] flex items-center justify-center border border-white">
                                      {tile.blockerLayers || 1}
                                    </div>
                                    <div className="w-6 h-6 rounded-md bg-white border-b-2 border-pink-200 flex items-center justify-center shadow-sm">
                                      <span className="text-xs">🧁</span>
                                    </div>
                                  </div>
                                ) : tile.blocker === "chocolate" ? (
                                  <div className="w-full h-full rounded-xl bg-[#3E2723] shadow-md border-b-4 border-[#1A0C0A] flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0.5 border border-[#4E342E]/30 rounded-lg bg-gradient-to-br from-[#4E342E] to-[#261410]" />
                                    <span className="text-xl [@media(min-height:720px)]:text-2xl z-10 select-none">🍫</span>
                                  </div>
                                ) : tile.blocker === "mixer" ? (
                                  <div className="w-full h-full rounded-xl bg-gradient-to-b from-emerald-600 to-teal-800 shadow-lg border-2 border-emerald-400 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute top-1 bg-emerald-950 px-1.5 py-0.5 rounded text-[8px] text-yellow-300 font-extrabold uppercase animate-pulse select-none leading-none scale-75">
                                      {tile.blockerLayers} HP
                                    </div>
                                    <span className="text-xl [@media(min-height:720px)]:text-2xl mt-1.5 animate-spin" style={{ animationDuration: "3s" }}>📟</span>
                                  </div>
                                ) : tile.blocker === "cake_bomb" ? (
                                  <div className="w-full h-full rounded-xl bg-[#FFF8E7] shadow-xl border-4 border-amber-600 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute top-0.5 bg-red-600 px-1 py-0.5 rounded text-[7px] text-white font-black select-none leading-none">
                                      {tile.blockerLayers} LÁT
                                    </div>
                                    <span className="text-2xl [@media(min-height:720px)]:text-3xl mt-1 select-none">🎂</span>
                                  </div>
                                ) : tile.type === "cherry" ? (
                                  <div className="w-full h-full flex items-center justify-center relative scale-110 select-none">
                                    <span className="text-2xl [@media(min-height:720px)]:text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">🍒</span>
                                  </div>
                                ) : tile.type === "hazelnut" ? (
                                  <div className="w-full h-full flex items-center justify-center relative scale-110 select-none">
                                    <span className="text-2xl [@media(min-height:720px)]:text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">🌰</span>
                                  </div>
                                ) : tile.type === "rainbow_candy" ? (
                                  <div
                                    className={`w-full h-full rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform overflow-hidden relative ${selectedTile?.id === tile.id ? "ring-4 ring-white scale-90" : "hover:brightness-110"}`}
                                    style={{
                                      background: "conic-gradient(from 0deg, #FF5252, #FFEB3B, #4CAF50, #2196F3, #9C27B0, #FF5252)",
                                    }}
                                  >
                                    <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/40 rounded-full blur-[1px]" />
                                    <span className="text-sm [@media(min-height:720px)]:text-base animate-pulse">🌟</span>
                                  </div>
                                ) : (
                                  <div
                                    style={getColorStyle(tile.color, tile.special)}
                                    className={`w-full h-full rounded-[40%] border-b-[4px] border-r-[2px] flex items-center justify-center shadow-[inset_-2px_-4px_4px_rgba(0,0,0,0.2),0_4px_6px_rgba(0,0,0,0.3)] transition-transform overflow-hidden relative ${selectedTile?.id === tile.id ? "ring-4 ring-white/80 scale-90" : "hover:brightness-110"}`}
                                  >
                                    <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-white/30 rounded-full blur-[1px] transform -rotate-12" />
                                    {getSpecialIcon(tile.special)}
                                    {tile.bombTimer !== undefined && (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 rounded-full">
                                        <span className="text-[9px] [@media(min-height:720px)]:text-xs">💣</span>
                                        <span className="text-[10px] [@media(min-height:720px)]:text-xs font-black text-red-400 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.95)] animate-pulse leading-none mt-0.5">
                                          {tile.bombTimer}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Ice Layer */}
                                {tile.isLocked && (
                                  <div className="absolute inset-0 bg-blue-300/60 rounded-md border-2 border-blue-100 backdrop-blur-[1px] shadow-[inset_0_0_8px_rgba(255,255,255,0.8)]"></div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Crumb particles when destroyed */}
                          <AnimatePresence>
                            {tile.isMatched && (
                              <motion.div
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                              >
                                {[...Array(6)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                                    animate={{
                                      scale: 0,
                                      x: (Math.random() - 0.5) * 80,
                                      y: (Math.random() - 0.5) * 80,
                                      opacity: 0,
                                      rotate: Math.random() * 360,
                                    }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="absolute w-3 h-3 rounded-sm"
                                    style={{
                                      background: getColorStyle(
                                        tile.color,
                                        tile.special,
                                      ).background,
                                    }}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Booster Prompt Overlay / Info */}
                {activeInGameBooster && (
                  <div className="w-full max-w-[400px] mx-auto bg-amber-100 border-2 border-amber-400 text-[#5D4037] text-[10px] [@media(min-height:720px)]:text-xs font-black px-3 py-1.5 rounded-xl flex justify-between items-center mb-1 shadow-md animate-pulse shrink-0">
                    <span>
                      {activeInGameBooster === "lollipop" && "🍭 Nhấn vào một ô/chướng ngại vật bất kỳ để đập vỡ!"}
                      {activeInGameBooster === "free_switch" && "🔄 Nhấn vào hai ô cạnh nhau để tráo đổi miễn phí!"}
                    </span>
                    <button
                      onClick={() => {
                        setActiveInGameBooster(null);
                        setSelectedTile(null);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-[9px] cursor-pointer font-black"
                    >
                      Hủy
                    </button>
                  </div>
                )}

                {/* In-game Boosters Panel */}
                <div className="w-full max-w-[400px] mx-auto bg-[#3E2723]/95 border-b-2 border-[#5D4037] rounded-2xl p-2 flex justify-around items-center mt-1 shadow-lg shrink-0 relative border-2 border-[#5D4037]">
                  {[
                    { key: "lollipop", label: "Búa Mút", icon: "🍭", price: 40, desc: "Đập vỡ 1 kẹo/blocker" },
                    { key: "free_switch", label: "Tráo Đổi", icon: "🔄", price: 45, desc: "Tráo 2 ô kẹo cạnh nhau" },
                    { key: "sweet_teeth", label: "Răng Hàm", icon: "🦷", price: 90, desc: "Hàm răng đồ chơi ăn 12 ô" },
                    { key: "bomb_cooler", label: "Băng Bom", icon: "❄️", price: 30, desc: "Cộng +5 lượt cho tất cả bom" },
                  ].map((b) => {
                    const count = boosterInventory[b.key as keyof BoosterInventory] || 0;
                    const isActive = activeInGameBooster === b.key;
                    return (
                      <button
                        key={b.key}
                        onClick={() => handleUseInGameBooster(b.key as any)}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all cursor-pointer relative min-w-[70px] ${
                          isActive
                            ? "bg-green-100 border-[#4CAF50] scale-[1.05] shadow-lg animate-pulse"
                            : "bg-[#FFF8E7] border-[#D7CCC8] hover:border-[#8D6E63]"
                        }`}
                        title={b.desc}
                      >
                        {renderBoosterIllustration(b.key)}
                        <span className="text-[7.5px] [@media(min-height:720px)]:text-[9px] font-black text-[#5D4037] leading-tight mt-0.5 whitespace-nowrap">
                          {b.label}
                        </span>
                        
                        <div className="absolute -top-1.5 -right-1.5 bg-[#3E2723] text-white rounded-full px-1.5 py-0.5 text-[6.5px] font-bold shadow-sm">
                          {count > 0 ? `x${count}` : `${b.price}🍫`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Overlays */}
                <AnimatePresence>
                  {gameState === "won" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-[#FFFDF9] w-full rounded-3xl p-6 flex flex-col items-center border-4 border-[#81C784]"
                      >
                        <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-4">
                          <Check className="w-10 h-10 text-[#4CAF50]" />
                        </div>
                        <h2 className="text-3xl font-black text-[#2E7D32] uppercase mb-2">
                          Tuyệt Đỉnh!
                        </h2>
                        <p className="text-stone-600 font-medium mb-6">
                          Đơn hàng hoàn tất xuất sắc.
                        </p>
                        <div className="bg-[#FDF6EC] w-full p-4 rounded-xl mb-6 flex justify-around">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-stone-500 uppercase">
                              Phần thưởng
                            </span>
                            <span className="font-bold text-[#8D6E63]">
                              +3 Choco
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={winGame}
                          className="w-full py-4 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl font-bold text-lg shadow-[0_4px_0_0_#2E7D32] active:translate-y-1 active:shadow-none transition-all"
                        >
                          Quay Về Bản Đồ
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                  {gameState === "lost" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-[#FFFDF9] w-full rounded-3xl p-6 flex flex-col items-center border-4 border-[#E57373]"
                      >
                        <div className="w-20 h-20 bg-[#FFEBEE] rounded-full flex items-center justify-center mb-4">
                          <RefreshCw className="w-10 h-10 text-[#F44336]" />
                        </div>
                        <h2 className="text-3xl font-black text-[#C62828] uppercase mb-2">
                          Hỏng Mẻ Choco!
                        </h2>
                        <p className="text-stone-600 font-medium mb-6">
                          {lostReason || "Hết lượt đi. Khách hàng đã rời đi."}
                        </p>
                        <button
                          onClick={() => setViewMode("map")}
                          className="w-full py-4 bg-[#F44336] hover:bg-[#E53935] text-white rounded-xl font-bold text-lg shadow-[0_4px_0_0_#C62828] active:translate-y-1 active:shadow-none transition-all"
                        >
                          Quay Về Bản Đồ
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pre-game intro overlay */}
          <AnimatePresence>
            {selectedLevelForIntro !== null && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-hidden flex justify-center items-center p-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-[#FFFDF9] w-[90%] max-w-[260px] [@media(min-height:560px)]:max-w-[310px] [@media(min-height:720px)]:max-w-[400px] [@media(min-height:850px)]:max-w-[460px] rounded-2xl [@media(min-height:720px)]:rounded-[32px] p-3 [@media(min-height:560px)]:p-4 [@media(min-height:720px)]:p-6 [@media(min-height:850px)]:p-8 border-4 [@media(min-height:720px)]:border-[6px] border-[#3E2723] shadow-2xl relative flex flex-col items-center text-center transition-all duration-300"
                >
                  {/* Level number header */}
                  <div className="absolute -top-3.5 [@media(min-height:720px)]:-top-6 bg-[#3E2723] text-[#F5E6D3] px-4 py-1 [@media(min-height:720px)]:px-6 [@media(min-height:720px)]:py-2 rounded-full border-4 border-[#FFFDF9] shadow-lg font-black text-[9px] [@media(min-height:560px)]:text-[10px] [@media(min-height:720px)]:text-xs [@media(min-height:850px)]:text-sm whitespace-nowrap">
                    ĐƠN HÀNG #{selectedLevelForIntro}
                  </div>

                  <div className="mt-2 [@media(min-height:560px)]:mt-3 [@media(min-height:720px)]:mt-4 flex flex-col items-center w-full">
                    {/* Difficulty Badge */}
                    {(() => {
                      const diff = getLevelDifficulty(selectedLevelForIntro);
                      return (
                        <div className="flex flex-col items-center mb-1.5 [@media(min-height:560px)]:mb-2.5 [@media(min-height:720px)]:mb-4 text-center">
                          <span className={`px-2.5 py-0.5 [@media(min-height:560px)]:px-3 [@media(min-height:560px)]:py-1 [@media(min-height:720px)]:px-4 [@media(min-height:720px)]:py-1.5 rounded-full text-[8px] [@media(min-height:560px)]:text-[9px] [@media(min-height:720px)]:text-xs font-black text-white ${diff.badgeColor} shadow-md flex items-center gap-1`}>
                            <span>{diff.icon}</span>
                            <span>{diff.name.toUpperCase()}</span>
                          </span>
                        </div>
                      );
                    })()}

                    {/* Level decoration - only on taller screens */}
                    <div className="hidden [@media(min-height:650px)]:flex w-12 h-12 sm:w-16 sm:h-16 bg-[#F5E6D3] rounded-2xl border-2 border-[#D7CCC8] shadow-inner items-center justify-center text-xl sm:text-3xl mb-3 sm:mb-4 relative">
                      <span className="animate-bounce">🍫</span>
                      <span className="absolute top-1 left-1 text-[10px] sm:text-xs">✨</span>
                      <span className="absolute bottom-1 right-1 text-[10px] sm:text-xs">✨</span>
                    </div>

                    {/* Level Goals Title */}
                    <h3 className="text-[9px] [@media(min-height:560px)]:text-[10px] [@media(min-height:720px)]:text-xs font-black text-[#5D4037] uppercase tracking-wider mb-1 [@media(min-height:560px)]:mb-1.5 [@media(min-height:720px)]:mb-2.5">
                      Mục tiêu đơn hàng:
                    </h3>

                    {/* Goal items */}
                    <div className="flex flex-wrap justify-center gap-1 [@media(min-height:560px)]:gap-1.5 [@media(min-height:720px)]:gap-2.5 w-full mb-2 [@media(min-height:560px)]:mb-3 [@media(min-height:720px)]:mb-5">
                      {(() => {
                        const lvlGoals = getIntroGoalsForLevel(selectedLevelForIntro);
                        return lvlGoals.map((g, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center justify-center gap-0.5 [@media(min-height:720px)]:gap-1.5 bg-[#FFF8E7] rounded-lg [@media(min-height:720px)]:rounded-2xl p-1 [@media(min-height:560px)]:p-1.5 [@media(min-height:720px)]:p-2.5 border border-[#D7CCC8] shadow-sm min-w-[65px] [@media(min-height:560px)]:min-w-[75px] [@media(min-height:720px)]:min-w-[90px] flex-1 max-w-[80px] [@media(min-height:560px)]:max-w-[95px] [@media(min-height:720px)]:max-w-[120px]"
                          >
                            {g.type === "score" && (
                              <>
                                <Star className="w-3.5 h-3.5 [@media(min-height:720px)]:w-6 h-6 text-amber-500" fill="currentColor" />
                                <span className="text-[8px] [@media(min-height:560px)]:text-[9px] [@media(min-height:720px)]:text-[11px] [@media(min-height:850px)]:text-xs font-black text-[#5D4037] text-center whitespace-nowrap">
                                  {g.target} Điểm
                                </span>
                              </>
                            )}
                            {g.type === "collect" && g.color && (
                              <>
                                <div
                                  style={getColorStyle(g.color, "none")}
                                  className="w-3.5 h-3.5 [@media(min-height:720px)]:w-6 [@media(min-height:720px)]:h-6 rounded-full border-b [@media(min-height:720px)]:border-b-2 border-r-[0.5px] [@media(min-height:720px)]:border-r-[1px] shadow-sm"
                                />
                                <span className="text-[8px] [@media(min-height:560px)]:text-[9px] [@media(min-height:720px)]:text-[11px] [@media(min-height:850px)]:text-xs font-black text-[#5D4037] text-center capitalize">
                                  {g.target} Choco
                                </span>
                              </>
                            )}
                            {g.type === "foil" && (
                              <>
                                <div className="w-3.5 h-3.5 [@media(min-height:720px)]:w-6 [@media(min-height:720px)]:h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md border border-gray-500 shadow-sm" />
                                <span className="text-[8px] [@media(min-height:560px)]:text-[9px] [@media(min-height:720px)]:text-[11px] [@media(min-height:850px)]:text-xs font-black text-[#5D4037] text-center whitespace-nowrap">
                                  {g.target} Thạch Choco
                                </span>
                              </>
                            )}
                            {g.type === "cherry" && (
                              <>
                                <span className="text-base [@media(min-height:720px)]:text-3xl">🍒</span>
                                <span className="text-[8px] [@media(min-height:560px)]:text-[9px] [@media(min-height:720px)]:text-[11px] [@media(min-height:850px)]:text-xs font-black text-[#5D4037] text-center whitespace-nowrap">
                                  {g.target} Anh Đào
                                </span>
                              </>
                            )}
                            {g.type === "hazelnut" && (
                              <>
                                <span className="text-base [@media(min-height:720px)]:text-3xl">🌰</span>
                                <span className="text-[8px] [@media(min-height:560px)]:text-[9px] [@media(min-height:720px)]:text-[11px] [@media(min-height:850px)]:text-xs font-black text-[#5D4037] text-center whitespace-nowrap">
                                  {g.target} Hạt Dẻ
                                </span>
                              </>
                            )}
                            {g.type === "rainbow_candy" && (
                              <>
                                <span className="text-base [@media(min-height:720px)]:text-3xl animate-spin" style={{ animationDuration: "12s" }}>🌈</span>
                                <span className="text-[8px] [@media(min-height:560px)]:text-[9px] [@media(min-height:720px)]:text-[11px] [@media(min-height:850px)]:text-xs font-black text-[#5D4037] text-center whitespace-nowrap">
                                  {g.target} Cầu Vồng
                                </span>
                              </>
                            )}
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Pre-game Boosters Panel */}
                    <div className="w-full bg-[#FFF8E7] rounded-xl border border-[#D7CCC8] p-2 mb-2 [@media(min-height:720px)]:p-3 [@media(min-height:720px)]:mb-4 flex flex-col items-center">
                      <h4 className="text-[9px] [@media(min-height:720px)]:text-[11px] font-black text-[#5D4037] uppercase mb-1.5 tracking-wider">
                        Vật phẩm hỗ trợ chọn trước:
                      </h4>
                      
                      <div className="grid grid-cols-4 gap-1.5 w-full">
                        {[
                          { key: "striped_wrapped", label: "Sọc & Gói", icon: "🍭🍬", price: 50, desc: "Tạo 1 kẹo sọc & 1 kẹo bọc đường" },
                          { key: "color_bomb", label: "Bom Màu", icon: "🌈💣", price: 80, desc: "Tạo 1 quả bom sắc màu siêu nổ" },
                          { key: "jellyfish", label: "Cá Thạch", icon: "🐠", price: 60, desc: "Thêm 3 chú cá Jellyfish dọn bảng" },
                          { key: "lucky_candy", label: "May Mắn", icon: "🍀", price: 50, desc: "Thêm 2 kẹo may mắn biến hình" },
                        ].map((b) => {
                          const isEquipped = equippedPreBoosters.includes(b.key);
                          const count = boosterInventory[b.key as keyof BoosterInventory] || 0;
                          return (
                            <button
                              key={b.key}
                              onClick={() => togglePreGameBooster(b.key as any)}
                              className={`flex flex-col items-center justify-center p-1 rounded-lg border-2 transition-all cursor-pointer relative ${
                                isEquipped
                                  ? "bg-[#E8F5E9] border-[#4CAF50] scale-[1.03] shadow-md"
                                  : "bg-white border-[#E0E0E0] hover:border-[#BDBDBD]"
                              }`}
                              title={b.desc}
                            >
                              {renderBoosterIllustration(b.key)}
                              <span className="text-[6.5px] [@media(min-height:560px)]:text-[7.5px] font-black text-[#3E2723] leading-none mt-1 text-center whitespace-nowrap">
                                {b.label}
                              </span>
                              
                              <div className="absolute -top-1.5 -right-1 bg-[#3E2723] text-white rounded-full px-1 py-0.5 text-[5.5px] [@media(min-height:560px)]:text-[6.5px] font-bold">
                                {count > 0 ? `x${count}` : `${b.price}🍫`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      <p className="text-[6px] [@media(min-height:560px)]:text-[7.5px] text-stone-500 mt-1 leading-tight text-center">
                        Nhấn để Trang bị. Nếu hết sẽ tự động mua bằng Choco của bạn.
                      </p>
                    </div>

                    {/* Hearts cost */}
                    <div className="flex items-center gap-1 text-[9px] [@media(min-height:560px)]:text-[10px] [@media(min-height:720px)]:text-xs font-bold text-stone-600 mb-2 [@media(min-height:560px)]:mb-3 [@media(min-height:720px)]:mb-5 bg-[#FDF6EC] px-2.5 py-0.5 [@media(min-height:720px)]:px-3.5 [@media(min-height:720px)]:py-1.5 rounded-lg [@media(min-height:720px)]:rounded-xl border border-[#F5E6D3]">
                      <span>Chi phí:</span>
                      <span className="flex items-center gap-0.5 font-black text-[#C62828]">
                        1 ❤️
                      </span>
                      {chocoMatchHearts <= 0 && (
                        <span className="text-[8px] [@media(min-height:560px)]:text-[9px] [@media(min-height:720px)]:text-[10px] text-red-500 font-bold ml-1">
                          (Hết!)
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1 [@media(min-height:560px)]:gap-1.5 [@media(min-height:720px)]:gap-2.5 w-full">
                      <button
                        onClick={() => {
                          if (chocoMatchHearts > 0) {
                            startGame(selectedLevelForIntro);
                            setSelectedLevelForIntro(null);
                          }
                        }}
                        disabled={chocoMatchHearts <= 0}
                        className={`w-full py-1.5 [@media(min-height:560px)]:py-2 [@media(min-height:720px)]:py-3 rounded-lg [@media(min-height:720px)]:rounded-xl font-extrabold text-[10px] [@media(min-height:560px)]:text-xs [@media(min-height:720px)]:text-base shadow-[0_2px_0_0_#3E2723] [@media(min-height:720px)]:shadow-[0_4px_0_0_#3E2723] active:translate-y-0.5 active:shadow-[0_0.5px_0_0_#3E2723] [@media(min-height:720px)]:active:shadow-[0_2px_0_0_#3E2723] transition-all text-white flex items-center justify-center gap-1 [@media(min-height:720px)]:gap-2 cursor-pointer ${
                          chocoMatchHearts > 0
                            ? "bg-gradient-to-b from-[#81C784] to-[#4CAF50] hover:brightness-105 border-b [@media(min-height:720px)]:border-b-2 border-green-600"
                            : "bg-gray-400 cursor-not-allowed shadow-none"
                        }`}
                      >
                        ▶️ BẮT ĐẦU CHƠI
                      </button>
                      
                      <button
                        onClick={() => setSelectedLevelForIntro(null)}
                        className="w-full py-1 [@media(min-height:720px)]:py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg [@media(min-height:720px)]:rounded-xl font-bold text-[9px] [@media(min-height:560px)]:text-[10px] [@media(min-height:720px)]:text-xs border border-stone-300 transition-all cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

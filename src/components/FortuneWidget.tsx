import React, { useState, useEffect } from 'react';
import { Sparkles, Dices, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { getGMT7Date } from '../types/achievements';

const FORTUNES = [
  "Hôm nay bạn sẽ nhặt được tiền... âm phủ.",
  "Đừng ra đường hôm nay nếu không muốn bị chim ỉa trúng đầu.",
  "Người yêu tương lai của bạn đang bận yêu người khác rồi.",
  "Cẩn thận, hôm nay có điềm báo bạn sẽ tăng cân!",
  "Làm việc chăm chỉ làm gì khi đằng nào cũng nghèo?",
  "Hôm nay may mắn của bạn là số 0. Chúc bạn sống sót.",
  "Bạn sẽ sớm nhận ra mình chả có tài cán gì nổi bật.",
  "Quẻ xăm Đại Hung: Đọc truyện ít thôi, đi ngủ sớm đi!",
  "Sẽ có người thầm thương trộm nhớ bạn... nói đùa đấy, làm gì có ai.",
  "Hôm nay nên cẩn thận cái mỏ, coi chừng bị vạ miệng.",
  "Quẻ xăm Bình Hoà: Hôm nay sẽ chả có rớt cục tiền nào vô mặt đâu.",
  "Quẻ Đại Cát: Bạn sẽ hắt xì 3 lần liên tục. Quá đỉnh."
];

const GENRES = [
  "Trinh Thám Kỳ Bí",
  "Kinh Dị Dân Gian",
  "Tình Cảm Lãng Mạn",
  "Phiêu Lưu Kỳ Ảo",
  "Hài Hước Vui Nhộn",
  "Học Đường Tinh Nghịch",
  "Cổ Tích Ngày Xưa",
  "Đời Thường Bình Dị",
  "Kiếm Hiệp Kỳ Tình",
  "Gia Đình Ấm Áp"
];

// Helper to seed a random number generator
function xfc32(a: number, b: number, c: number, d: number) {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
        let t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

function hashCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

export function FortuneWidget() {
  const { uid, isLoggedIn } = useStore();
  const [fortune, setFortune] = useState('');
  const [genre, setGenre] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const dateStr = format(getGMT7Date(), 'yyyy-MM-dd');

  useEffect(() => {
    // Generate daily fortune based on UID + Date String
    const seedStr = `${uid || 'guest'}-${dateStr}`;
    const seed = Math.abs(hashCode(seedStr));
    
    // Simple deterministic random
    const random = xfc32(seed, seed * 2, seed * 3, seed * 4);
    
    // Skip a few rounds
    random(); random(); random();
    
    const fortuneIndex = Math.floor(random() * FORTUNES.length);
    const genreIndex = Math.floor(random() * GENRES.length);
    
    setFortune(FORTUNES[fortuneIndex]);
    setGenre(GENRES[genreIndex]);

    // Check if drawing was already opened today
    const key = uid ? `choco_fortune_opened_date_${uid}` : 'choco_fortune_opened_date_guest';
    const savedDate = localStorage.getItem(key);
    if (savedDate === dateStr) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [uid, dateStr]);

  const handleOpenFortune = () => {
    const key = uid ? `choco_fortune_opened_date_${uid}` : 'choco_fortune_opened_date_guest';
    localStorage.setItem(key, dateStr);
    setIsOpen(true);
  };

  return (
    <div className="bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-[3px] border-[#3E2723] p-5 shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:border-[#8D6E63] transition-colors">
      <div className="absolute top-0 left-0 right-0 h-3 bg-[#D4AF37] border-b-[3px] border-[#3E2723] dark:border-[#4E342E]" />
      <div className="flex justify-between items-center mb-4 mt-2">
         <h2 className="font-black text-lg border-l-[6px] border-[#3E2723] dark:border-[#D4AF37] pl-3 uppercase tracking-widest text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-2">
           <Dices className="w-5 h-5 text-[#D4AF37] animate-bounce" />
           Quẻ Bói Hàng Ngày
         </h2>
      </div>
      
      {!isOpen ? (
        <button 
          onClick={handleOpenFortune}
          className="w-full bg-[#FFFDF9] dark:bg-[#1E1815] border-[3px] border-dashed border-[#8D6E63] text-[#3E2723] dark:text-[#ECE5DC] p-4 rounded-2xl font-black uppercase tracking-wider hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D] transition-colors"
        >
          Nhấn để xem vận mệnh hôm nay
        </button>
      ) : (
        <div className="bg-[#F5E6D3] dark:bg-[#2C221D] p-4 rounded-2xl border-2 border-[#D7CCC8] dark:border-[#5D4037] relative">
          <Sparkles className="w-6 h-6 text-[#D4AF37] absolute top-2 right-2 animate-pulse" />
          <div className="mb-4">
             <span className="text-[10px] font-black uppercase text-[#8D6E63] tracking-widest block mb-1">Dự Báo:</span>
             <p className="font-medium italic text-[#3E2723] dark:text-[#ECE5DC] leading-relaxed">
               "{fortune}"
             </p>
          </div>
          <div className="pt-3 border-t-2 border-dashed border-[#D7CCC8] dark:border-[#5D4037]">
             <span className="text-[10px] font-black uppercase text-[#8D6E63] tracking-widest block mb-1">Gợi ý đọc truyện:</span>
             <div className="flex items-center gap-2 font-black text-[#5D4037] dark:text-[#D4AF37]">
               <ArrowRight className="w-4 h-4" />
               <span className="uppercase">{genre}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Sparkles, Dices, ArrowRight, Lock } from 'lucide-react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { getGMT7Date } from '../types/achievements';
import { useFeatureRestriction } from '../types/features';

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
  "Quẻ Đại Cát: Bạn sẽ hắt xì 3 lần liên tục. Quá đỉnh.",
  "Hôm nay ví tiền của bạn sẽ mỏng đi một cách kỳ diệu, tỷ lệ nghịch với vòng eo.",
  "Quẻ Trung Cát: Hôm nay bạn thở rất đều đặn, không có biểu hiện tắc nghẽn đường thở.",
  "Người ta nói 'Cố gắng rồi sẽ thành công', nhưng hôm nay bạn có cố nằm ngủ tiếp cũng không thoát khỏi Deadline.",
  "Hãy dịu dàng với bản thân hôm nay, vì ngoài kia xã hội đã chuẩn bị phũ tơi tả bạn rồi.",
  "Quẻ Độc Đắc: Một ngày tràn đầy năng lượng... để từ chối mọi cuộc gọi đòi nợ.",
  "Có những ngày bạn cảm thấy mình thật vô dụng, đừng buồn, ngày mai bạn vẫn sẽ thấy thế thôi.",
  "Vũ trụ gửi tín hiệu: Hãy đi mua ly trà sữa full topping để sạc pin cho chiếc mỏ hỗn của bạn.",
  "Hôm nay bạn sẽ gặp một người cực kỳ đặc biệt... khi nhìn vào gương.",
  "Tử vi hôm nay: Quý nhân phù trợ không thấy đâu, chỉ thấy 'báo thủ' bao vây.",
  "Cần bổ sung gấp vitamin Choco để chữa lành tâm hồn đang rách nát vì thèm đọc truyện.",
  "Hôm nay vận đào hoa nở rộ... nhưng là đào hoa của chó mèo hàng xóm, tụi nó sẽ cứ bám lấy chân bạn.",
  "Quẻ Bình Yên: Tránh xa các thể loại 'drama' nếu không muốn bị kéo vào làm diễn viên quần chúng.",
  "Tiền tài hôm nay như làn gió thoảng qua, chưa kịp mát lòng đã cuộn sạch mọi hy vọng.",
  "Tính toán làm chi cho mệt đầu, hôm nay cứ lười biếng một cách có khoa học đi!",
  "Tử vi mách bảo: Hôm nay bạn nên ăn thật nhiều, béo đẹp béo khoẻ béo dễ thương, lo gì!",
  "Đừng buồn vì hôm nay không có ai nhắn tin thích bạn. Ngày mai, ngày kia, sang năm... cũng thế thôi mà.",
  "Quẻ May Mắn: Bạn sẽ không bị vấp té hôm nay, miễn là bạn không bước chân ra khỏi giường.",
  "Một ngày đẹp trời để nhận ra: Tiền không mua được hạnh phúc, nhưng không có tiền thì nghèo.",
  "Quẻ Vô Thưởng Vô Phạt: Hôm nay người yêu cũ của bạn đột nhiên... chẳng nghĩ gì về bạn cả.",
  "Hôm nay hứa hẹn có một cuộc hành trình dài kỳ vĩ... từ giường đến tủ lạnh rồi quay lại giường.",
  "Chiêm tinh học dự báo: Chiếc giường hôm nay có lực hấp dẫn mạnh tương đương với hố đen vũ trụ.",
  "Nếu hôm nay có ai khen bạn đẹp, hãy kiểm tra lại xem họ có đang mượn tiền bạn không nhé.",
  "Vận thế hôm nay: Thích hợp để ăn, ngủ, đọc truyện, nuôi Chucu và phớt lờ mọi trách nhiệm xã hội.",
  "Hôm nay tài lộc của bạn ở mức 'vỏ chuối', đi đứng cẩn thận không trượt té tự do.",
  "Quẻ xăm Cực Phẩm: Bạn sẽ không phải giặt đồ hôm nay, nếu bạn quyết định mặc lại đồ cũ.",
  "Vũ trụ truyền tin: Đừng tìm kiếm nửa kia của đời mình nữa, tìm chìa khóa nhà trước đi đã.",
  "Hôm nay bạn rất có duyên với... việc bị muỗi cắn. Chúc mừng sinh nhật lũ muỗi nhé.",
  "Quẻ Cảnh Báo: Đừng có hứa hẹn gì hôm nay kẻo tạo nghiệp, nói được làm không được đâu."
];

const GENRE_CATEGORIES = [
  // 1
  ["Cổ đại", "Tương lai", "Cận đại", "Giả tưởng lịch sử", "Hiện đại"],
  // 2
  ["Tình cảm", "Bí ẩn kỳ ảo", "Sinh tồn", "Trinh thám", "Kinh doanh thương mại", "Làm ruộng", "Xây dựng sự nghiệp", "Khoa học viễn tưởng", "Tranh giành quyền lực", "Kinh dị", "Quân sự", "Huyền học", "Tiên hiệp", "Tận thế", "Võ hiệp", "Quan trường", "Xây dựng", "Phim ảnh"],
  // 3
  ["Vũ trụ", "Nguyên thủy", "Vùng đất hoang tàn", "Thế giới khác", "Cyberpunk", "Người thú", "Thế giới song song", "Steampunk"],
  // 4
  ["Fantasy phương Tây", "Vu cổ", "Long tộc", "Cthulhu", "Tu chân", "Thần tiên yêu quái", "Huyết tộc", "Linh dị thần quái", "Ma pháp", "Dị năng", "Sơn Hải Kinh", "Thần thoại"],
  // 5
  ["Đô thị", "Học đường", "Ân oán giang hồ", "Chiến tranh", "Ai Cập", "Lịch sử", "Danh gia vọng tộc", "Xã hội đen", "Học viện quý tộc", "Phương Tây", "Hy Lạp", "Truyện cổ tích", "Cung đình hầu tước", "Hồng Kông", "Nông thôn"],
  // 6
  ["Khoa cử", "Cơ giáp", "Trộm mộ", "Y thuật", "Giới giải trí", "Người nổi tiếng", "Game online", "Show giải trí", "Giới thời trang", "Thể thao", "Làm giàu", "Đổ thạch", "CV", "Viết văn", "Trò chơi", "Thực tế ảo", "Đua xe", "Nghiên cứu khoa học", "Đồ ăn ngon", "Phong thủy", "Phá án", "Livestream", "Thẻ bài", "Lữ hành", "Thi đấu esports", "Bóng rổ", "Hàng không", "Tâm lý học"],
  // 7
  ["Người xuyên", "Xuyên game", "Cổ xuyên kim", "Tương lai xuyên cổ đại", "Xuyên qua thời không", "Xuyên nhanh", "Cổ đại xuyên tương lai", "Sống lại", "Xuyên sách", "Tương lai xuyên hiện đại", "Hai người xuyên", "Hai người sống lại", "Hoán đổi linh hồn", "Dân quốc"],
  // 8
  ["Hệ thống", "App", "Nhìn thấu", "Tiên tri", "Nghe hiểu động vật", "Hai hệ thống", "Thôi miên", "Đánh dấu", "Vô hiệu hóa", "Nghe hiểu thực vật", "Nhiều hệ thống", "Không gian tùy thân", "Thể chất cẩm lý", "Đọc tâm"]
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
  const { uid, isLoggedIn, setLockedFeatureId } = useStore();
  const { isFeatureLocked, getRequiredLevel } = useFeatureRestriction();
  const [fortune, setFortune] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const dateStr = format(getGMT7Date(), 'yyyy-MM-dd');
  const isLocked = isFeatureLocked('fortune');

  useEffect(() => {
    // Generate daily fortune based on UID + Date String
    const seedStr = `${uid || 'guest'}-${dateStr}`;
    const seed = Math.abs(hashCode(seedStr));
    
    // Simple deterministic random
    const random = xfc32(seed, seed * 2, seed * 3, seed * 4);
    
    // Skip a few rounds
    random(); random(); random();
    
    const fortuneIndex = Math.floor(random() * FORTUNES.length);
    
    const chosenGenres: string[] = [];
    for (const category of GENRE_CATEGORIES) {
      const idx = Math.floor(random() * category.length);
      chosenGenres.push(category[idx]);
    }
    
    setFortune(FORTUNES[fortuneIndex]);
    setGenres(chosenGenres);

    // Check if drawing was already opened today
    const key = uid ? `choco_fortune_opened_date_${uid}` : 'choco_fortune_opened_date_guest';
    const savedDate = localStorage.getItem(key);
    if (savedDate === dateStr && !isLocked) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [uid, dateStr, isLocked]);

  const handleOpenFortune = () => {
    if (isLocked) {
      setLockedFeatureId('fortune');
      return;
    }
    const key = uid ? `choco_fortune_opened_date_${uid}` : 'choco_fortune_opened_date_guest';
    localStorage.setItem(key, dateStr);
    setIsOpen(true);
  };

  return (
    <div className="bg-[#FFFDF9] dark:bg-[#211B18] rounded-3xl border-[3px] border-[#3E2723] p-5 shadow-[1px_1px_0_0_#3E2723] relative overflow-hidden group hover:border-[#8D6E63] transition-colors animate-fade-in">
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
          className={`w-full border-[3px] border-dashed p-4 rounded-2xl font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            isLocked 
              ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'
              : 'bg-[#FFFDF9] dark:bg-[#1E1815] border-[#8D6E63] text-[#3E2723] dark:text-[#ECE5DC] hover:bg-[#F5E6D3] dark:hover:bg-[#2C221D]'
          }`}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4" />
              Yêu cầu cấp {getRequiredLevel('fortune')}
            </>
          ) : (
            'Nhấn để xem vận mệnh hôm nay'
          )}
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
             <span className="text-[10px] font-black uppercase text-[#8D6E63] tracking-widest block mb-1.5">Gợi ý đọc truyện:</span>
             <div className="flex flex-wrap gap-1.5">
               {genres.map((g, i) => (
                 <div 
                   key={i} 
                   className="flex items-center gap-1 bg-[#FFFDF9] dark:bg-[#1C1613] px-2 py-1 rounded-xl border border-[#D7CCC8] dark:border-[#4E342E] shadow-[0_1px_1px_rgba(0,0,0,0.03)]"
                 >
                    <span className="text-[9px] text-[#A89086] dark:text-[#7A5E53] font-bold">#{i + 1}</span>
                    <span className="font-black text-xs text-[#3E2723] dark:text-[#ECE5DC]">{g}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

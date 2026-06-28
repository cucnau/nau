import { useState } from 'react';
import { useStore } from '../store';
import { PackageOpen, Lock, Zap, Gift, Smile, CalendarCheck } from 'lucide-react';

export function Inventory() {
  const { ownedPassTickets, ownedPriorityTickets, ownedMysteryBoxes, useMysteryBox } = useStore();
  const [usingBox, setUsingBox] = useState(false);
  const [wonSticker, setWonSticker] = useState<any | null>(null);

  const handleUseBox = async () => {
    setUsingBox(true);
    try {
      const sticker = await useMysteryBox();
      if (sticker) {
        setWonSticker(sticker);
      }
    } catch (err: any) {
      console.error("Lỗi khi mở Hộp Quà Sticker Bí Ẩn:", err);
    } finally {
      setUsingBox(false);
    }
  };

  const hasAnyItem = ownedPassTickets > 0 || ownedPriorityTickets > 0 || (ownedMysteryBoxes || 0) > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
        <div className="bg-[#3E2723] text-[#FDF6EC] p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[1px_1px_0_0_#1A1412] border-[3px] border-[#1A1412]">
           <div>
              <h1 className="text-xl sm:text-2xl font-black mb-1 flex items-center gap-2 uppercase tracking-tighter">
                 <PackageOpen className="w-6 h-6"/> Túi Đồ
              </h1>
              <p className="opacity-80 italic text-xs">Các vật phẩm bạn đang sở hữu.</p>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
           <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723] rounded-2xl p-5 flex flex-col items-center text-center shadow-[1.5px_1.5px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[1px_1px_0_0_#3E2723] transition-all">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mb-2 sm:mb-4 group-hover:-translate-y-1 transition-transform" />
              <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Pass Truyện</h3>
              <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Dùng để mở khoá chương truyện bị set password.</p>
              <div className="mt-auto bg-[#FDF6EC] dark:bg-[#34221A] p-2.5 sm:px-4 border-2 border-[#3E2723] rounded-2xl text-[10px] sm:text-xs font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-widest w-full text-center shadow-xs">
                 Sở hữu: {ownedPassTickets || 0}
              </div>
           </div>

           <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723] rounded-2xl p-5 flex flex-col items-center text-center shadow-[1.5px_1.5px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[1px_1px_0_0_#3E2723] transition-all">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mb-2 sm:mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Ưu Tiên</h3>
              <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Đọc sớm nhất các chương truyện vừa đăng.</p>
              <div className="mt-auto bg-[#FDF6EC] dark:bg-[#34221A] p-2.5 sm:px-4 border-2 border-[#3E2723] rounded-2xl text-[10px] sm:text-xs font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-widest w-full text-center shadow-xs">
                 Sở hữu: {ownedPriorityTickets || 0}
              </div>
           </div>

           <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723] rounded-2xl p-5 flex flex-col items-center text-center shadow-[1.5px_1.5px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[1px_1px_0_0_#3E2723] transition-all">
              <CalendarCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#8D6E63] mb-2 sm:mb-4 group-hover:-translate-y-1 transition-transform" />
              <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Giữ Chuỗi</h3>
              <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Tự động tiêu hao để bảo vệ chuỗi nếu lỡ quên điểm danh.</p>
              <div className="flex flex-col gap-2 w-full mt-auto">
                 <div className="bg-[#FDF6EC] dark:bg-[#34221A] p-2.5 sm:px-4 border-2 border-[#3E2723] rounded-2xl text-[10px] sm:text-xs font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-widest w-full text-center shadow-xs animate-none">
                    Sở hữu: {useStore().ownedStreakTickets || 0}
                 </div>
                 <div className="w-full bg-[#EFEBE9] dark:bg-[#34221A] text-stone-600 border-2 border-stone-400 p-2 sm:py-2 rounded-xl font-bold uppercase text-[9px] sm:text-[10px] tracking-wide text-center">Tự động sử dụng</div>
              </div>
           </div>

           {/* Hộp Quà Sticker Bí Ẩn */}
           <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723] rounded-2xl p-5 flex flex-col items-center text-center shadow-[1.5px_1.5px_0_0_#3E2723] relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[1px_1px_0_0_#3E2723] transition-all">
              <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-[#8D6E63] mb-2 sm:mb-4 animate-bounce" />
              <h3 className="text-sm sm:text-base font-black mb-1 sm:mb-2 uppercase text-[#3E2723]">Hộp Sticker Bí Ẩn</h3>
              <p className="text-stone-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Lấy Sticker màu ngẫu nhiên chưa sở hữu trong cửa hàng.</p>
              <div className="flex flex-col gap-2.5 w-full mt-auto">
                 <div className="bg-[#FAF0E6] dark:bg-[#1A1412] p-2 sm:px-4 sm:py-2.5 border-2 border-[#3E2723] rounded-2xl text-[10px] sm:text-xs font-bold text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-widest w-full text-center">
                    Sở hữu: {ownedMysteryBoxes || 0}
                 </div>
                 <button 
                    type="button"
                    onClick={handleUseBox}
                    disabled={usingBox || (ownedMysteryBoxes || 0) <= 0}
                    className="w-full bg-[#3E2723] text-white p-2.5 sm:px-4 rounded-xl font-black border-2 border-[#1A1412] shadow-[1px_1px_0_0_#1A1412] active:translate-y-[2px] active:shadow-none hover:bg-[#2D1B19] transition-all uppercase tracking-widest text-[10px] sm:text-xs disabled:bg-stone-200 disabled:text-stone-450 disabled:cursor-not-allowed disabled:border-stone-300 disabled:shadow-none disabled:translate-y-0 cursor-pointer"
                 >
                    {usingBox ? "Đang mở..." : "Sử dụng"}
                 </button>
              </div>
           </div>
        </div>

        {!hasAnyItem && (
            <div className="text-center text-stone-500 italic py-10 opacity-75 border-2 border-dashed border-[#3E2723] rounded-2xl bg-[#FFFDF9] dark:bg-black/20 font-sans">
                Bạn chưa sở hữu vật phẩm nào trong túi đồ.
            </div>
        )}

        {/* Won Sticker Modal */}
        {wonSticker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-[#FDF6EC] border-4 border-[#3E2723] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center transform scale-100 transition-all font-sans relative overflow-hidden">
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#D7CCC8]/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-[#8D6E63]/20 rounded-full blur-xl animate-pulse"></div>
                
                <div className="w-20 h-20 bg-white rounded-3xl border-2 border-[#3E2723] shadow-sm flex items-center justify-center mx-auto mb-4 p-2">
                   {wonSticker.url ? (
                      <img src={wonSticker.url} alt={wonSticker.name} className="w-16 h-16 object-contain pointer-events-none" referrerPolicy="no-referrer" />
                   ) : (
                      <Smile className="w-10 h-10 text-[#8D6E63]" />
                   )}
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#8D6E63] mb-1 block">Giải thưởng may mắn!</span>
                <h3 className="text-xl font-black text-[#3E2723] mb-1 uppercase tracking-tight">{wonSticker.name || 'Sticker'}</h3>
                <p className="text-xs text-stone-500 mb-5 italic">{wonSticker.description || 'Vào trang cá nhân nhận ngay nhé!'}</p>
                
                <button 
                   type="button"
                   onClick={() => setWonSticker(null)}
                   className="w-full bg-[#3E2723] text-[#FDF6EC] px-6 py-2.5 rounded-2xl font-black border-2 border-[#1A1412] shadow-[1.5px_1.5px_0_0_#1A1412] active:translate-y-1 active:shadow-none hover:bg-[#2D1B19] text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                   Đã hiểu
                </button>
             </div>
          </div>
        )}
    </div>
  );
}

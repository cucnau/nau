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
       <div className="bg-[#3E2723] text-[#FDF6EC] p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border-2 border-[#8D6E63]">
          <div>
             <h1 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2 uppercase tracking-tighter">
                <PackageOpen className="w-6 h-6"/> Túi Đồ
             </h1>
             <p className="opacity-80 italic text-sm">Các vật phẩm bạn đang sở hữu.</p>
          </div>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white border border-[#D7CCC8] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
             <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mb-2 sm:mb-4 group-hover:-translate-y-1 transition-transform" />
             <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Pass Truyện</h3>
             <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Dùng để mở khoá chương truyện bị set password.</p>
             <div className="mt-auto bg-[#FDF6EC] p-2 sm:px-4 sm:py-2.5 border border-[#8D6E63] rounded-xl text-[10px] sm:text-xs font-bold text-[#3E2723] uppercase tracking-widest w-full">
                Sở hữu: {ownedPassTickets || 0}
             </div>
          </div>

          <div className="bg-white border border-[#D7CCC8] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
             <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mb-2 sm:mb-4 group-hover:scale-110 transition-transform" />
             <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Ưu Tiên</h3>
             <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Đọc sớm nhất các chương truyện vừa đăng.</p>
             <div className="mt-auto bg-[#FDF6EC] p-2 sm:px-4 sm:py-2.5 border border-[#8D6E63] rounded-xl text-[10px] sm:text-xs font-bold text-[#3E2723] uppercase tracking-widest w-full">
                Sở hữu: {ownedPriorityTickets || 0}
             </div>
          </div>

          <div className="bg-white border border-[#D7CCC8] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#8D6E63] transition-colors">
             <CalendarCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#8D6E63] mb-2 sm:mb-4 group-hover:-translate-y-1 transition-transform" />
             <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Giữ Chuỗi</h3>
             <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Tự động tiêu hao để bảo vệ chuỗi nếu lỡ quên điểm danh.</p>
             <div className="flex flex-col gap-2 w-full mt-auto">
                <div className="bg-[#FDF6EC] p-2 sm:px-4 sm:py-2.5 border border-[#8D6E63] rounded-xl text-[10px] sm:text-xs font-bold text-[#3E2723] uppercase tracking-widest w-full">
                   Sở hữu: {useStore().ownedStreakTickets || 0}
                </div>
                <div className="w-full bg-gray-100 text-gray-500 p-2 sm:py-2.5 rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-wide shadow-sm text-center">Tự động sử dụng</div>
             </div>
          </div>

          {/* Hộp Quà Sticker Bí Ẩn */}
          <div className="bg-white border-2 border-amber-200 hover:border-amber-400 transition-colors rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
             <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 mb-2 sm:mb-4 animate-bounce" />
             <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 uppercase text-[#3E2723]">Hộp Quà Sticker Bí Ẩn</h3>
             <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Mở ra nhận ngay 1 Sticker ngẫu nhiên trong cửa hàng mà bạn chưa sở hữu.</p>
             <div className="flex flex-col gap-2 w-full mt-auto">
                <div className="bg-[#FAF0E6] p-2 sm:px-4 sm:py-2.5 border border-[#8D6E63] rounded-xl text-[10px] sm:text-xs font-bold text-[#3E2723] uppercase tracking-widest w-full">
                   Sở hữu: {ownedMysteryBoxes || 0}
                </div>
                <button 
                   type="button"
                   onClick={handleUseBox}
                   disabled={usingBox || (ownedMysteryBoxes || 0) <= 0}
                   className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs shadow-md transition-all cursor-pointer"
                >
                   {usingBox ? "Đang mở..." : "Sử dụng"}
                </button>
             </div>
          </div>
       </div>

       {!hasAnyItem && (
           <div className="text-center text-gray-500 italic py-10 opacity-70 border-2 border-dashed border-[#D7CCC8] rounded-2xl">
               Bạn chưa sở hữu vật phẩm nào.
           </div>
       )}

       {/* Won Sticker Modal */}
       {wonSticker && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#FDF6EC] border-4 border-[#3E2723] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center transform scale-100 transition-all font-sans relative overflow-hidden">
               <div className="absolute -top-12 -left-12 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl"></div>
               <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-400/20 rounded-full blur-xl"></div>
               
               <div className="w-20 h-20 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center justify-center mx-auto mb-4 p-2 shadow-inner">
                  {wonSticker.url ? (
                     <img src={wonSticker.url} alt={wonSticker.name} className="w-16 h-16 object-contain pointer-events-none" referrerPolicy="no-referrer" />
                  ) : (
                     <Smile className="w-10 h-10 text-amber-600" />
                  )}
               </div>
               <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 mb-1 block">Bạn đã mở được!</span>
               <h3 className="text-xl font-extrabold text-[#3E2723] mb-1 uppercase">{wonSticker.name || 'Sticker'}</h3>
               <p className="text-xs text-gray-500 mb-5 italic">{wonSticker.description || 'Vào hồ sơ để trang bị ngay nhé!'}</p>
               
               <button 
                  type="button"
                  onClick={() => setWonSticker(null)}
                  className="w-full bg-[#3E2723] hover:bg-[#2D1B19] text-[#FDF6EC] px-6 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider cursor-pointer transition-colors"
               >
                  Đã hiểu
               </button>
            </div>
         </div>
       )}
    </div>
  );
}

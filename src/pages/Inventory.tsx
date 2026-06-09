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

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-[#D7CCC8] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
             <Lock className="w-12 h-12 text-[#D4AF37] mb-4" />
             <h3 className="text-lg font-bold mb-2 uppercase text-[#3E2723]">Vé Pass Truyện</h3>
             <p className="text-gray-500 text-sm mb-6 italic">Dùng để mở khoá chương truyện bị set password.</p>
             <div className="mt-auto bg-[#FDF6EC] px-6 py-2 border border-[#8D6E63] rounded-full">
                <span className="font-bold text-[#3E2723]">Sở hữu: {ownedPassTickets || 0}</span>
             </div>
          </div>

          <div className="bg-white border border-[#D7CCC8] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
             <Zap className="w-12 h-12 text-[#D4AF37] mb-4" />
             <h3 className="text-lg font-bold mb-2 uppercase text-[#3E2723]">Vé Ưu Tiên</h3>
             <p className="text-gray-500 text-sm mb-6 italic">Đọc sớm nhất các chương truyện vừa đăng.</p>
             <div className="mt-auto bg-[#FDF6EC] px-6 py-2 border border-[#8D6E63] rounded-full">
                <span className="font-bold text-[#3E2723]">Sở hữu: {ownedPriorityTickets || 0}</span>
             </div>
          </div>

          <div className="bg-white border border-[#D7CCC8] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
             <CalendarCheck className="w-12 h-12 text-[#8D6E63] mb-4" />
             <h3 className="text-lg font-bold mb-2 uppercase text-[#3E2723]">Vé Giữ Chuỗi</h3>
             <p className="text-gray-500 text-sm mb-6 italic">Sử dụng để bảo vệ chuỗi điểm danh, giữ chuỗi nếu lỡ quên điểm danh 1 ngày.</p>
             <div className="mt-auto flex flex-col gap-2 w-full">
                <div className="bg-[#FDF6EC] px-6 py-2 border border-[#8D6E63] rounded-full">
                   <span className="font-bold text-[#3E2723]">Sở hữu: {useStore().ownedStreakTickets || 0}</span>
                </div>
                {(useStore().ownedStreakTickets || 0) > 0 && !useStore().activeStreakProtection ? (
                   <button onClick={() => {
                        if(useStore().useStreakTicket()) alert('Đã kích hoạt bảo vệ chuỗi điểm danh!');
                        else alert('Không thể dùng vé bảo vệ lúc này!');
                    }} className="w-full bg-[#3E2723] hover:bg-[#2D1B19] text-[#FDF6EC] px-6 py-2 rounded-full font-bold uppercase cursor-pointer transition-colors text-xs tracking-widest">
                       Sử dụng
                   </button>
                ) : useStore().activeStreakProtection ? (
                   <div className="w-full bg-green-100 text-green-700 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest">Đang được bảo vệ</div>
                ) : null}
             </div>
          </div>

          {/* Hộp Quà Sticker Bí Ẩn */}
          <div className="bg-white border-2 border-amber-200 hover:border-amber-400 transition-colors rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
             <Gift className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
             <h3 className="text-lg font-bold mb-2 uppercase text-[#3E2723]">Hộp Quà Sticker Bí Ẩn</h3>
             <p className="text-gray-500 text-sm mb-6 italic">Mở ra nhận ngay 1 Sticker ngẫu nhiên trong cửa hàng mà bạn chưa sở hữu.</p>
             <div className="flex flex-col gap-3 w-full mt-auto">
                <div className="bg-[#FAF0E6] px-6 py-2 border border-[#8D6E63] rounded-full text-xs font-bold text-[#3E2723] self-center">
                   Sở hữu: {ownedMysteryBoxes || 0}
                </div>
                <button 
                   type="button"
                   onClick={handleUseBox}
                   disabled={usingBox || (ownedMysteryBoxes || 0) <= 0}
                   className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-wide shadow-md transition-all shrink-0 cursor-pointer"
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

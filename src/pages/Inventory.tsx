import { useStore } from '../store';
import { PackageOpen, Lock, Zap } from 'lucide-react';

export function Inventory() {
  const { ownedPassTickets, ownedPriorityTickets } = useStore();

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
       </div>

       {(!ownedPassTickets && !ownedPriorityTickets) && (
           <div className="text-center text-gray-500 italic py-10 opacity-70 border-2 border-dashed border-[#D7CCC8] rounded-2xl">
               Bạn chưa sở hữu vật phẩm nào.
           </div>
       )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Key, Zap, Smile, Lock, Shuffle, CalendarCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../components/Layout';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

export function Store() {
  const { choco, goldenChoco, spendChoco, spendGoldenChoco, addGoldenChoco, isLoggedIn, email, buyTicket, updateUserDoc, ownedStickers, addOwnedSticker, equipSticker, firebaseUser } = useStore();
  const [storeStickers, setStoreStickers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'stickers'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchStickers = async () => {
      try {
        const q = query(collection(db, 'store_stickers'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setStoreStickers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Lỗi khi tải danh sách sticker:', err);
      }
    };
    fetchStickers();
  }, []);

  const handleExchange = () => {
    if (!isLoggedIn) { alert("Vui lòng đăng nhập!"); return; }
    const input = prompt("Nhập số lượng Gchoco muốn đổi (3 Choco = 1 Gchoco):", "1");
    if (input === null) return;
    const amount = parseInt(input, 10);
    if (isNaN(amount) || amount <= 0) {
       alert("Số lượng không hợp lệ!");
       return;
    }
    const cost = amount * 3;
    if (spendChoco(cost, `Đổi sang ${amount} GChoco`)) {
       addGoldenChoco(amount, `Đổi từ ${cost} Choco`);
       alert(`Đổi thành công ${amount} Gchoco!`);
    } else {
       alert(`Không đủ Choco (Cần ${cost} Choco để đổi ${amount} Gchoco)!`);
    }
  };

  const buyTicketWithQuantity = (name: string, pricePerUnit: number, currencyType: 'choco' | 'golden', ticketType: 'pass' | 'priority' | 'streak') => {
     if (!isLoggedIn) { alert("Vui lòng đăng nhập!"); return; }
     const input = prompt(`Nhập số lượng ${name} muốn mua:`, "1");
     if (input === null) return;
     const qty = parseInt(input, 10);
     if (isNaN(qty) || qty <= 0) {
        alert("Số lượng mua không hợp lệ!");
        return;
     }
     const totalPrice = pricePerUnit * qty;
     if (currencyType === 'choco') {
         if (spendChoco(totalPrice, `Mua ${qty} ${name}`)) {
            buyTicket(ticketType, qty);
            alert(`Đã mua thành công ${qty} ${name}!`);
         } else {
            alert(`Không đủ Choco (Cần ${totalPrice} Choco để mua ${qty} vé)`);
         }
     } else {
         if (spendGoldenChoco(totalPrice, `Mua ${qty} ${name}`)) {
            buyTicket(ticketType, qty);
            alert(`Đã mua thành công ${qty} ${name}!`);
         } else {
            alert(`Không đủ Gchoco (Cần ${totalPrice} Gchoco để mua ${qty} vé)`);
         }
     }
  };

  const handleBuyItem = (name: string, price: number, type: 'choco' | 'golden', effect?: () => void) => {
     if (!isLoggedIn) { alert("Vui lòng đăng nhập!"); return; }
     
     if (type === 'choco') {
         if (spendChoco(price, `Mua ${name}`)) {
            if (effect) effect();
            alert(`Đã mua ${name}!`);
         }
         else alert(`Không đủ Choco (Cần ${price})`);
     } else {
         if (spendGoldenChoco(price, `Mua ${name}`)) {
            if (effect) effect();
            alert(`Đã mua ${name}!`);
         }
         else alert(`Không đủ Gchoco (Cần ${price})`);
     }
  }

  const buySticker = (sticker: any) => {
     if (!sticker.url) {
        alert("Sticker này chưa có ảnh.");
        return;
     }
     
     if (ownedStickers?.includes(sticker.url)) {
        alert("Bạn đã sở hữu sticker này rồi!");
        return;
     }

     handleBuyItem(sticker.name, sticker.price, sticker.type, () => {
        addOwnedSticker(sticker.url);
        equipSticker(sticker.type as any, sticker.url);
        alert(`Bạn đã mua và tự động trang bị ${sticker.name}!`);
     });
  };

  const filteredStickers = storeStickers.filter(sticker => 
     (sticker.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredStickers.length / ITEMS_PER_PAGE);
  const displayedStickers = filteredStickers.slice(
     (currentPage - 1) * ITEMS_PER_PAGE,
     currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
       <div className="bg-[#3E2723] text-[#FDF6EC] p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border-2 border-[#8D6E63]">
          <div>
             <h1 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2 uppercase tracking-tighter">
                <ShoppingBag className="w-6 h-6"/> Cửa Hàng
             </h1>
             <p className="opacity-80 italic text-sm">Sử dụng Choco và Gchoco để mua vật phẩm.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#2D1B19] p-3 rounded-xl border border-[#5D4037]">
             <div className="flex flex-col items-center px-3">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1 text-[#FDF6EC]">Choco</span>
                <span className="text-sm font-bold bg-[#FDF6EC] text-[#3E2723] px-3 py-1 rounded-full border border-[#8D6E63]">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : choco}</span>
             </div>
             <div className="w-px h-8 bg-[#8D6E63]"></div>
             <div className="flex flex-col items-center px-3">
                <span className="text-[10px] font-bold tracking-widest opacity-80 mb-1 text-[#D4AF37]">Gchoco</span>
                <span className="text-sm font-bold bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full border border-[#D4AF37]/50">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : goldenChoco}</span>
             </div>
          </div>
       </div>

       <div className="inline-flex bg-[#FDF6EC] dark:bg-[#1A1412] border border-[#D7CCC8] dark:border-[#3C2E27] p-1 rounded-xl font-bold uppercase text-sm tracking-wide self-center sm:self-start my-4">
          <button 
             onClick={() => setActiveTab('items')} 
             className={cn("px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2", activeTab === 'items' ? 'bg-[#3E2723] dark:bg-[#C29D70] text-[#FDF6EC] dark:text-[#181311] shadow-md' : 'text-[#8D6E63] dark:text-gray-400 hover:bg-[#FDF6EC]/80 dark:hover:bg-[#2C221D] hover:text-[#5D4037] dark:hover:text-[#ECE5DC]')}
          >
             <ShoppingBag className="w-4 h-4" /> Vật Phẩm
          </button>
          <button 
             onClick={() => setActiveTab('stickers')} 
             className={cn("px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2", activeTab === 'stickers' ? 'bg-[#3E2723] dark:bg-[#C29D70] text-[#FDF6EC] dark:text-[#181311] shadow-md' : 'text-[#8D6E63] dark:text-gray-400 hover:bg-[#FDF6EC]/80 dark:hover:bg-[#2C221D] hover:text-[#5D4037] dark:hover:text-[#ECE5DC]')}
          >
             <Smile className="w-4 h-4" /> Sticker Avatar
          </button>
       </div>

       {activeTab === 'items' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
             {/* Exchange Card */}
             <div className="bg-white border-2 border-[#D7CCC8] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#8D6E63] transition-colors">
                <div className="absolute top-0 right-0 bg-[#3E2723] text-[#FDF6EC] text-[8px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3 py-1 rounded-bl-xl shadow-sm">Quy đổi</div>
                <Shuffle className="w-8 h-8 sm:w-10 sm:h-10 text-[#8D6E63] mt-2 mb-2 sm:mb-4 group-hover:rotate-180 transition-transform duration-500" />
                <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 text-[#3E2723]">Đổi Gchoco</h3>
                <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">3 Choco = 1 Gchoco.</p>
                <button onClick={handleExchange} className="bg-[#FDF6EC] text-[#3E2723] border border-[#8D6E63] p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold hover:bg-[#3E2723] hover:text-[#FDF6EC] transition-colors w-full mt-auto uppercase text-[10px] sm:text-xs tracking-widest">
                   Đổi
                </button>
             </div>

             <div className="bg-white border border-[#D7CCC8] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mb-2 sm:mb-4 group-hover:-translate-y-1 transition-transform" />
                <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Pass Truyện</h3>
                <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Mở khoá 1 chương truyện bị đặt password.</p>
                <button onClick={() => buyTicketWithQuantity('Vé Pass Truyện', 5, 'golden', 'pass')} className="bg-[#D4AF37] text-white p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold hover:bg-[#B5952F] transition-colors w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest shadow-md">
                   <span>Mua</span> <span className="bg-black/10 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap">5 Gchoco</span>
                </button>
             </div>

             <div className="bg-white border border-[#D7CCC8] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37] mb-2 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Ưu Tiên</h3>
                <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Đọc sớm các chương truyện vừa đăng.</p>
                <button onClick={() => buyTicketWithQuantity('Vé Ưu Tiên', 3, 'golden', 'priority')} className="bg-[#D4AF37] text-white p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold hover:bg-[#B5952F] transition-colors w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest shadow-md">
                   <span>Mua</span> <span className="bg-black/10 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap">3 Gchoco</span>
                </button>
             </div>

             <div className="bg-white border border-[#D7CCC8] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#8D6E63] transition-colors">
                <CalendarCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#8D6E63] mb-2 sm:mb-4 group-hover:-translate-y-1 transition-transform" />
                <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 uppercase text-[#3E2723]">Vé Giữ Chuỗi</h3>
                <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">Tự động tiêu hao để bảo vệ chuỗi khi quên điểm danh.</p>
                <button onClick={() => buyTicketWithQuantity('Vé Giữ Chuỗi', 5, 'choco', 'streak')} className="bg-[#3E2723] text-[#FDF6EC] p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold hover:bg-[#2D1B19] transition-colors w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest shadow-md">
                   <span>Mua</span> <span className="bg-[#FDF6EC]/20 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap">5 Choco</span>
                </button>
             </div>
          </div>
       )}

       {activeTab === 'stickers' && (
          <div className="flex flex-col gap-6 w-full">
             <div className="relative w-full max-w-md self-center sm:self-start">
                <input 
                   type="text" 
                   placeholder="Tìm kiếm sticker theo tên..." 
                   value={searchQuery}
                   onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                   className="w-full pl-10 pr-4 py-2 border-2 border-[#D7CCC8] dark:border-[#3C2E27] rounded-xl bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:border-[#8D6E63] transition-colors font-medium"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {displayedStickers.length === 0 && (
                   <div className="col-span-full text-center text-gray-500 py-8 italic border border-dashed border-[#D7CCC8] rounded-2xl bg-white/50 dark:bg-black/20">
                      {searchQuery ? "Không tìm thấy sticker nào phù hợp từ khóa tìm kiếm." : "Cửa hàng hiện chưa có sticker nào."}
                   </div>
                )}
                {displayedStickers.map((sticker) => (
                   <div key={sticker.id} className="bg-white border border-[#D7CCC8] rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#8D6E63] transition-colors">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 relative mb-2 sm:mb-4 p-1 sm:p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                         {sticker.url ? (
                           <img src={sticker.url} alt="Sticker" className="w-10 h-10 sm:w-12 sm:h-12 object-contain pointer-events-none" />
                         ) : (
                           <Smile className="w-6 h-6 sm:w-8 sm:h-8 text-[#A1887F]" />
                         )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 uppercase text-[#3E2723]">{sticker.name}</h3>
                      <p className="text-gray-500 text-[10px] sm:text-xs mb-3 sm:mb-6 italic">{sticker.description}</p>
                      {ownedStickers?.includes(sticker.url) ? (
                         <button disabled className="p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest bg-gray-300 text-gray-500 cursor-not-allowed">
                            Đã có
                         </button>
                      ) : (
                         <button onClick={() => buySticker(sticker)} className={cn("p-2 sm:px-4 sm:py-2.5 rounded-xl font-bold transition-colors w-full mt-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 uppercase text-[10px] sm:text-xs tracking-widest shadow-md", sticker.type === 'golden' ? "bg-[#D4AF37] text-white hover:bg-[#B5952F]" : "bg-[#3E2723] text-[#FDF6EC] hover:bg-[#2D1B19]")}>
                            <span>Mua</span> <span className={cn("px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap", sticker.type === 'golden' ? "bg-black/10" : "bg-[#FDF6EC]/20")}>{sticker.price} {sticker.type === 'golden' ? 'GChoco' : 'Choco'}</span>
                         </button>
                      )}
                   </div>
                ))}
             </div>

             {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 self-center select-none">
                   <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-2 rounded-xl border border-[#D7CCC8] dark:border-[#3C2E27] bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2C221D] transition-colors"
                   >
                      <ChevronLeft className="w-4 h-4" />
                   </button>
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                         key={pg}
                         onClick={() => setCurrentPage(pg)}
                         className={cn(
                            "w-8 h-8 rounded-xl font-bold text-xs transition-colors border",
                            currentPage === pg
                               ? "bg-[#3E2723] dark:bg-[#C29D70] border-[#3E2723] dark:border-[#C29D70] text-[#FDF6EC] dark:text-[#181311]"
                               : "bg-white dark:bg-[#1A1412] border-[#D7CCC8] dark:border-[#3C2E27] text-[#3E2723] dark:text-[#ECE5DC] hover:bg-gray-50 dark:hover:bg-[#2C221D]"
                         )}
                      >
                         {pg}
                      </button>
                   ))}
                   <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="p-2 rounded-xl border border-[#D7CCC8] dark:border-[#3C2E27] bg-white dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2C221D] transition-colors"
                   >
                      <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
             )}
          </div>
       )}
    </div>
  )
}

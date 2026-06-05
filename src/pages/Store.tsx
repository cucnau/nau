import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Key, Zap, Smile, Lock, Shuffle } from 'lucide-react';
import { cn } from '../components/Layout';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

export function Store() {
  const { choco, goldenChoco, spendChoco, spendGoldenChoco, addGoldenChoco, isLoggedIn, email, updateUserDoc, ownedStickers, addOwnedSticker, equipSticker, firebaseUser } = useStore();
  const [storeStickers, setStoreStickers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'stickers'>('items');

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
    if (spendChoco(5)) {
       addGoldenChoco(1);
       alert("Đổi thành công 1 Gchoco!");
    } else {
       alert("Không đủ Choco (Cần 5)!");
    }
  };

  const handleBuyItem = (name: string, price: number, type: 'choco' | 'golden', effect?: () => void) => {
     if (!isLoggedIn) { alert("Vui lòng đăng nhập!"); return; }
     
     if (type === 'choco') {
         if (spendChoco(price)) {
            if (effect) effect();
            alert(`Đã mua ${name}!`);
         }
         else alert(`Không đủ Choco (Cần ${price})`);
     } else {
         if (spendGoldenChoco(price)) {
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
        equipSticker(sticker.url);
        alert(`Bạn đã mua và tự động trang bị ${sticker.name}!`);
     });
  };

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

       <div className="inline-flex bg-[#FDF6EC] border border-[#D7CCC8] p-1 rounded-xl font-bold uppercase text-sm tracking-wide self-center sm:self-start my-4">
          <button 
             onClick={() => setActiveTab('items')} 
             className={cn("px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2", activeTab === 'items' ? 'bg-[#3E2723] text-[#FDF6EC] shadow-md' : 'text-[#8D6E63] hover:bg-[#FDF6EC]/80 hover:text-[#5D4037]')}
          >
             <ShoppingBag className="w-4 h-4" /> Vật Phẩm
          </button>
          <button 
             onClick={() => setActiveTab('stickers')} 
             className={cn("px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2", activeTab === 'stickers' ? 'bg-[#3E2723] text-[#FDF6EC] shadow-md' : 'text-[#8D6E63] hover:bg-[#FDF6EC]/80 hover:text-[#5D4037]')}
          >
             <Smile className="w-4 h-4" /> Sticker Avatar
          </button>
       </div>

       {activeTab === 'items' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* Exchange Card */}
             <div className="bg-white border-2 border-[#D7CCC8] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#8D6E63] transition-colors">
                <div className="absolute top-0 right-0 bg-[#3E2723] text-[#FDF6EC] text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm">Quy đổi</div>
                <Shuffle className="w-12 h-12 text-[#8D6E63] mb-4 group-hover:rotate-180 transition-transform duration-500" />
                <h3 className="text-lg font-bold mb-2 text-[#3E2723]">Đổi Gchoco</h3>
                <p className="text-gray-500 text-sm mb-6 italic">Sử dụng 5 Choco để đổi lấy 1 Gchoco.</p>
                <button onClick={handleExchange} className="bg-[#FDF6EC] text-[#3E2723] border border-[#8D6E63] px-6 py-2.5 rounded-full font-bold hover:bg-[#3E2723] hover:text-[#FDF6EC] transition-colors w-full mt-auto uppercase text-sm tracking-widest">
                   Đổi ngay
                </button>
             </div>

             <div className="bg-white border border-[#D7CCC8] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
                <Lock className="w-12 h-12 text-[#D4AF37] mb-4 group-hover:-translate-y-1 transition-transform" />
                <h3 className="text-lg font-bold mb-2 uppercase text-[#3E2723]">Vé Pass Truyện</h3>
                <p className="text-gray-500 text-sm mb-6 italic">Dùng để mở khoá 1 chương truyện bị set password.</p>
                <button onClick={() => handleBuyItem('Vé Pass Truyện', 5, 'golden')} className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#B5952F] transition-colors w-full mt-auto flex items-center justify-center gap-2 uppercase text-sm tracking-widest shadow-md">
                   Mua <span className="bg-black/10 px-2 py-0.5 rounded-full text-[10px]">5 Gchoco</span>
                </button>
             </div>

             <div className="bg-white border border-[#D7CCC8] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
                <Zap className="w-12 h-12 text-[#D4AF37] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold mb-2 uppercase text-[#3E2723]">Vé Ưu Tiên</h3>
                <p className="text-gray-500 text-sm mb-6 italic">Đọc sớm nhất các chương truyện vừa đăng.</p>
                <button onClick={() => handleBuyItem('Vé Ưu Tiên', 3, 'golden')} className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#B5952F] transition-colors w-full mt-auto flex items-center justify-center gap-2 uppercase text-sm tracking-widest shadow-md">
                   Mua <span className="bg-black/10 px-2 py-0.5 rounded-full text-[10px]">3 Gchoco</span>
                </button>
             </div>
          </div>
       )}

       {activeTab === 'stickers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {storeStickers.length === 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-gray-500 py-8 italic border border-dashed border-[#D7CCC8] rounded-2xl">
                   Cửa hàng hiện chưa có sticker nào.
                </div>
             )}
             {storeStickers.map((sticker, i) => (
                <div key={sticker.id} className="bg-white border border-[#D7CCC8] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-[#8D6E63] transition-colors">
                   <div className="w-16 h-16 relative mb-4 p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                      {sticker.url ? (
                        <img src={sticker.url} alt="Sticker" className="w-12 h-12 object-contain pointer-events-none" />
                      ) : (
                        <Smile className="w-8 h-8 text-[#A1887F]" />
                      )}
                   </div>
                   <h3 className="text-lg font-bold mb-2 uppercase text-[#3E2723]">{sticker.name}</h3>
                   <p className="text-gray-500 text-sm mb-6 italic">{sticker.description}</p>
                   {ownedStickers?.includes(sticker.url) ? (
                      <button disabled className="px-6 py-2.5 rounded-full font-bold w-full mt-auto flex items-center justify-center gap-2 uppercase text-sm tracking-widest bg-gray-300 text-gray-500 cursor-not-allowed">
                         Đã sở hữu
                      </button>
                   ) : (
                      <button onClick={() => buySticker(sticker)} className={cn("px-6 py-2.5 rounded-full font-bold transition-colors w-full mt-auto flex items-center justify-center gap-2 uppercase text-sm tracking-widest shadow-md", sticker.type === 'golden' ? "bg-[#D4AF37] text-white hover:bg-[#B5952F]" : "bg-[#3E2723] text-[#FDF6EC] hover:bg-[#2D1B19]")}>
                         Mua <span className={cn("px-2 py-0.5 rounded-full text-[10px]", sticker.type === 'golden' ? "bg-black/10" : "bg-[#FDF6EC]/20")}>{sticker.price} {sticker.type === 'golden' ? 'Gchoco' : 'Choco'}</span>
                      </button>
                   )}
                </div>
             ))}
          </div>
       )}
    </div>
  )
}

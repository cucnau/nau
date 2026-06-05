import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { ACHIEVEMENTS_LIST } from '../types/achievements';

export function Account() {
  const { isLoggedIn, uid, displayName, email, avatarUrl, equippedSticker, stickerPosition, choco, goldenChoco, level, exp, unlockedAchievements, activeTitle, setActiveTitle, ownedStickers, equipSticker, setStickerPosition, firebaseUser } = useStore();
  const nextLevelExp = (level || 1) * 100;
  const currentExp = exp || 0;
  const percent = Math.min(100, Math.round((currentExp / nextLevelExp) * 100));

  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setBarWidth(percent);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent]);

  const [tab, setTab] = useState<'profile' | 'settings'>('profile');
  const [name, setName] = useState(displayName || '');
  const [avatar, setAvatar] = useState(avatarUrl || '');
  const [pass, setPass] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [review, setReview] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (displayName && !name) setName(displayName);
    if (avatarUrl && !avatar) setAvatar(avatarUrl);
  }, [displayName, avatarUrl]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, `users/${uid}/reviews`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(arr);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}/reviews`);
    });
    return () => unsubscribe();
  }, [uid]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (file.type === 'image/gif') {
         setAvatar(dataUrl);
         return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      if (dataUrl) img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName: name,
        avatarUrl: avatar,
      });
      useStore.getState().syncFromFirebase({ displayName: name, avatarUrl: avatar });
      alert('Đã cập nhật hồ sơ thành công!');
    } catch(err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
    setSaving(false);
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !review.trim()) return;
    try {
      await addDoc(collection(db, `users/${uid}/reviews`), {
        uid,
        content: review,
        createdAt: serverTimestamp()
      });
      setReview('');
    } catch(err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/reviews`);
    }
  };

  if (!isLoggedIn) {
    return <div className="p-8 text-center">Vui lòng đăng nhập để xem hồ sơ.</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-6 border-b border-[#D7CCC8] pb-4">
        <button 
          onClick={() => setTab('profile')} 
          className={`text-xl font-bold uppercase tracking-tighter ${tab === 'profile' ? 'text-[#3E2723]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Hồ sơ 
        </button>
        <button 
          onClick={() => setTab('settings')} 
          className={`text-xl font-bold uppercase tracking-tighter ${tab === 'settings' ? 'text-[#3E2723]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Cài đặt
        </button>
      </div>
      
      {tab === 'settings' && (
        <div className="bg-white border border-[#D7CCC8] p-6 rounded-2xl shadow-sm max-w-xl mx-auto w-full">
          <h2 className="text-xl font-bold text-[#3E2723] mb-6">Cài đặt Tài khoản</h2>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 relative shrink-0">
                 <div className="w-full h-full overflow-hidden bg-gray-200 border border-[#D7CCC8] rounded-full">
                    {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2 leading-none">Chưa có ảnh</div>}
                 </div>
                 {equippedSticker && (
                    <img 
                      src={equippedSticker} 
                      alt="Sticker" 
                      className={`absolute w-8 h-8 object-contain pointer-events-none z-10 ${
                        stickerPosition === 'top-left' ? 'left-0 top-0 -translate-x-1/4 -translate-y-1/4' :
                        stickerPosition === 'top-right' ? 'right-0 top-0 translate-x-1/4 -translate-y-1/4' :
                        stickerPosition === 'bottom-left' ? 'left-0 bottom-0 -translate-x-1/4 translate-y-1/4' :
                        'right-0 bottom-0 translate-x-1/4 translate-y-1/4'
                      }`} 
                    />
                 )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-[#5D4037]">Ảnh đại diện</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} ref={fileInputRef} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-[#FDF6EC] border border-[#8D6E63] text-[#3E2723] rounded-lg text-sm font-bold hover:bg-[#3E2723] hover:text-[#FDF6EC] transition-colors">Chọn ảnh</button>
                  {avatar !== avatarUrl && <span className="text-xs text-green-600 font-medium">Chưa lưu</span>}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#5D4037]">Tên hiển thị</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-[#D7CCC8] bg-[#FDF6EC]/50 focus:outline-none focus:border-[#8D6E63] text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#5D4037]">Email</label>
              <input type="text" value={email || ''} disabled className="w-full px-4 py-2 rounded-lg border border-[#D7CCC8] bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-[#5D4037]">Sticker đại diện</label>
              {(ownedStickers || []).length === 0 ? (
                 <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border">Bạn chưa sở hữu sticker nào. Hãy vào Cửa hàng để mua!</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 p-4 bg-gray-50 border rounded-lg">
                    <div 
                       onClick={() => equipSticker(null)} 
                       title="Tháo sticker"
                       className={`w-14 h-14 cursor-pointer flex items-center justify-center border-2 border-dashed transition-all rounded-xl ${!equippedSticker ? 'border-[#8D6E63] bg-[#8D6E63]/10 shadow-sm' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                    >
                       <span className="text-xs font-bold text-gray-500">Trống</span>
                    </div>
                    {(ownedStickers || []).map(url => (
                       <div 
                         key={url} 
                         onClick={() => equipSticker(url)}
                         className={`w-14 h-14 cursor-pointer relative p-1 transition-all rounded-xl border flex items-center justify-center ${equippedSticker === url ? 'ring-2 ring-offset-2 ring-[#8D6E63] bg-white border-transparent' : 'hover:scale-105 bg-white shadow-sm'}`}
                        >
                          <img src={url} alt="Sticker preview" className="w-10 h-10 object-contain pointer-events-none" />
                       </div>
                    ))}
                  </div>

                  {equippedSticker && (
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-[#5D4037] uppercase tracking-wider">Vị trí gắn Sticker</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'top-left', label: 'Trên - Trái' },
                          { id: 'top-right', label: 'Trên - Phải' },
                          { id: 'bottom-left', label: 'Dưới - Trái' },
                          { id: 'bottom-right', label: 'Dưới - Phải' }
                        ].map(pos => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setStickerPosition(pos.id as any)}
                            className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all ${stickerPosition === pos.id ? 'bg-[#8D6E63] text-white border-[#8D6E63]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#5D4037]">Đổi mật khẩu</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Nhập để đổi mật khẩu (Chưa hỗ trợ)" disabled className="w-full px-4 py-2 rounded-lg border border-[#D7CCC8] bg-gray-100 italic text-sm" />
            </div>
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-[#3E2723] text-[#FDF6EC] rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-[#5D4037] transition-colors mt-2">
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </form>
        </div>
      )}

      {tab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 items-start">
           <div className="bg-white border border-[#D7CCC8] p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 relative mb-4">
                 <div className="w-full h-full overflow-hidden bg-gray-200 border-4 border-[#FDF6EC] shadow-sm rounded-full">
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Trống</div>}
                 </div>
                 {equippedSticker && (
                    <img 
                      src={equippedSticker} 
                      alt="Sticker" 
                      className={`absolute w-12 h-12 object-contain pointer-events-none z-10 ${
                        stickerPosition === 'top-left' ? 'left-0 top-0 -translate-x-1/4 -translate-y-1/4' :
                        stickerPosition === 'top-right' ? 'right-0 top-0 translate-x-1/4 -translate-y-1/4' :
                        stickerPosition === 'bottom-left' ? 'left-0 bottom-0 -translate-x-1/4 translate-y-1/4' :
                        'right-0 bottom-0 translate-x-1/4 translate-y-1/4'
                      }`} 
                    />
                 )}
              </div>
              <h2 className="text-xl font-bold text-[#3E2723] mb-1 flex items-center justify-center gap-1.5 flex-wrap">
                 {displayName}
                 {activeTitle && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-extrabold rounded-md uppercase tracking-tight select-none border border-yellow-200">
                       🏆 {activeTitle}
                    </span>
                 )}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{email}</p>
              
              {/* Hệ thống level độc giả */}
              <div className="w-full mb-4 bg-[#F2E5D5]/40 p-4 rounded-xl border border-[#D7CCC8]/60 text-left">
                 <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5D4037]">Level</span>
                    <span className="px-2 py-0.5 bg-[#8D6E63] text-[#FDF6EC] text-xs font-bold rounded-full shadow-sm">Lv. {level || 1}</span>
                 </div>
                 <div className="w-full bg-[#E0D4C5] rounded-full h-2.5 overflow-hidden shadow-inner relative mb-1 border border-[#D7CCC8]/20">
                    <div 
                       style={{ width: `${barWidth}%` }}
                       className="bg-gradient-to-r from-[#8D6E63] to-[#5D4037] h-full rounded-full transition-all duration-1000 ease-out"
                    />
                 </div>
                 <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold tracking-tight">
                    <span>{currentExp} / {nextLevelExp} EXP</span>
                    <span>{percent}%</span>
                 </div>
              </div>

              <div className="w-full bg-[#FDF6EC] rounded-xl p-4 border border-[#D7CCC8] flex items-center justify-between">
                 <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8D6E63] mb-1">Choco</span>
                    <span className="font-bold text-[#3E2723] text-lg">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : choco}</span>
                 </div>
                 <div className="w-px h-8 bg-[#D7CCC8]"></div>
                 <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mb-1">Gchoco</span>
                    <span className="font-bold text-[#D4AF37] text-lg">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : goldenChoco}</span>
                  </div>
               </div>

               {/* Trang bị danh hiệu */}
               <div className="w-full mt-4 bg-orange-50/40 p-4 rounded-xl border border-orange-200/50 text-left animate-fade-in">
                  <div className="flex justify-between items-center mb-1.5">
                     <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5D4037]">Danh hiệu của tôi</span>
                  </div>
                  {unlockedAchievements.length === 0 ? (
                     <p className="text-xs text-gray-400 italic">Chưa mở khóa thành tựu nào.</p>
                  ) : (
                     <div className="space-y-2">
                        <select 
                           value={activeTitle || ''} 
                           onChange={(e) => setActiveTitle(e.target.value || null)}
                           className="w-full text-xs font-bold border border-[#D7CCC8] rounded-lg p-2 bg-white text-[#3E2723] focus:outline-none focus:ring-1 focus:ring-[#8D6E63]"
                        >
                           <option value="">-- Không trang bị --</option>
                           {ACHIEVEMENTS_LIST.filter(a => unlockedAchievements.includes(a.id)).map(a => (
                              <option key={a.id} value={a.name}>{a.name}</option>
                           ))}
                        </select>
                        <div className="text-[10px] text-[#8D6E63] font-medium leading-tight">
                           Chọn danh hiệu để hiển thị cùng tên tài khoản khi bạn bình luận truyện!
                        </div>
                     </div>
                  )}
               </div>

               {/* Danh sách thành tựu đã nhận */}
               <div className="w-full mt-3 bg-stone-50/50 p-4 rounded-xl border border-stone-200 text-left">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500 block mb-2">Thành tựu đã nhận ({unlockedAchievements.length})</span>
                  {unlockedAchievements.length === 0 ? (
                     <p className="text-xs text-gray-400 italic">Chưa đạt thành tựu nào.</p>
                  ) : (
                     <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {ACHIEVEMENTS_LIST.filter(a => unlockedAchievements.includes(a.id)).map(a => (
                           <span key={a.id} className="text-[10px] px-2 py-0.5 bg-[#8D6E63]/10 text-[#5D4037] font-bold rounded-md uppercase tracking-wide border border-[#8D6E63]/20">
                              🏆 {a.name}
                           </span>
                        ))}
                     </div>
                  )}
               </div>
            </div>
            <div className="hidden">
               <div>
                  <div>
                 </div>
              </div>
           </div>

           <div className="bg-white border border-[#D7CCC8] p-6 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
             <h2 className="text-xl font-bold text-[#3E2723] mb-4">Góc cá nhân / Bài viết</h2>
             <form onSubmit={handlePostReview} className="mb-6 flex flex-col gap-2">
               <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Chia sẻ suy nghĩ, review truyện..." className="w-full min-h-[100px] p-3 rounded-xl border border-[#D7CCC8] bg-[#FDF6EC]/50 resize-none text-sm focus:outline-none focus:border-[#8D6E63]" />
               <button type="submit" className="self-end px-6 py-2 bg-[#8D6E63] text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-[#5D4037] transition-colors">
                 Đăng bài
               </button>
             </form>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {reviews.length === 0 ? <p className="text-gray-400 italic text-sm text-center py-8">Chưa có bài viết nào.</p> : null}
                {reviews.map(r => (
                  <div key={r.id} className="p-4 bg-[#F5E6D3]/30 rounded-xl border border-[#D7CCC8]/50">
                    <p className="text-sm font-semibold whitespace-pre-wrap text-[#3E2723]">{r.content}</p>
                    <p className="text-[10px] text-gray-500 mt-3 uppercase tracking-widest">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ''}</p>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

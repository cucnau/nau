import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc, setDoc, serverTimestamp, query, orderBy, onSnapshot, where, deleteDoc, limit } from 'firebase/firestore';
import { ACHIEVEMENTS_LIST } from '../types/achievements';
import { Gift } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';

export function Account() {
  const { 
    isLoggedIn, uid, displayName, email, avatarUrl,
    equippedStickerComment, stickerPositionComment,
    equippedStickerChat,
    equippedStickerPost, stickerPositionPost,
    choco, goldenChoco, level, exp, unlockedAchievements, activeTitle, setActiveTitle, 
    ownedStickers, equipSticker, setStickerPosition, firebaseUser, updateUserDoc, unlockAchievement,
    customTitles, getTitleColor, lastClaimedRewardLevel, ownedMysteryBoxes,
    equippedAccessory, accessoryPosition, ownedAccessories, equipAccessory, setAccessoryPosition,
    theme
  } = useStore();
  const isDark = theme === "dark";
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

  const [rewardClaimInfo, setRewardClaimInfo] = useState<{ gchoco: number; boxes: number; unclaimedLevels: number[] } | null>(null);
  const [claiming, setClaiming] = useState(false);

  const unclaimedLevels: number[] = [];
  const currentLvl = level || 1;
  const lastClaimedLvl = lastClaimedRewardLevel || 1;

  if (isLoggedIn && currentLvl > lastClaimedLvl) {
    for (let l = lastClaimedLvl + 1; l <= currentLvl; l++) {
      unclaimedLevels.push(l);
    }
  }

  let totalGChoco = 0;
  let totalBoxes = unclaimedLevels.length;
  unclaimedLevels.forEach(lvl => {
    totalGChoco += Math.floor((lvl - 1) / 5) + 1;
  });

  const handleClaimRewards = async () => {
    if (!rewardClaimInfo) return;
    setClaiming(true);
    try {
      await updateUserDoc({
        goldenChoco: (goldenChoco || 0) + rewardClaimInfo.gchoco,
        $gchocoDiff: rewardClaimInfo.gchoco,
        ownedMysteryBoxes: (ownedMysteryBoxes || 0) + rewardClaimInfo.boxes,
        lastClaimedRewardLevel: level
      }, "Nhận thưởng cấp độ");
      alert(`Đã nhận thành công phần thưởng lên cấp gồm:\n- ${rewardClaimInfo.gchoco} Gchoco\n- ${rewardClaimInfo.boxes} Hộp Quà Sticker Bí Ẩn!\n\nHộp quà đã được chuyển vào Túi đồ của bạn.`);
      setRewardClaimInfo(null);
    } catch (err: any) {
      console.error("Lỗi khi nhận phần thưởng:", err);
      alert("Lỗi khi nhận thưởng: " + err.message);
    } finally {
      setClaiming(false);
    }
  };

  const [tab, setTab] = useState<'profile' | 'settings' | 'transactions'>('profile');
  const [name, setName] = useState(displayName || '');
  const [avatar, setAvatar] = useState(avatarUrl || '');
  const [pass, setPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeStickerTab, setActiveStickerTab] = useState<'comment' | 'chat' | 'post'>('comment');
  
  const [review, setReview] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (displayName && !name) setName(displayName);
    if (avatarUrl && avatar !== avatarUrl) setAvatar(avatarUrl);
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

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, `users/${uid}/transactions`), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(arr);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}/transactions`);
    });
    return () => unsubscribe();
  }, [uid]);

  // Tự động đồng bộ các bài viết cũ của user sang newsFeed toàn cục bằng cách so khớp ID
  useEffect(() => {
    if (!uid || reviews.length === 0) return;
    
    // Retroactively unlock achievement if missed
    if (!unlockedAchievements?.includes('blogger_choco_new')) {
       unlockAchievement('blogger_choco_new');
    }

    const syncExistingReviews = async () => {
      try {
        for (const r of reviews) {
          await setDoc(doc(db, 'newsFeed', r.id), {
            uid: uid,
            displayName: displayName || 'Nhà lữ hành ẩn danh',
            avatarUrl: avatarUrl || null,
            activeTitle: activeTitle || null,
            content: r.content,
            createdAt: r.createdAt || serverTimestamp()
          }, { merge: true });
        }
      } catch (err) {
        console.error("Error syncing existing reviews:", err);
      }
    };
    syncExistingReviews();
  }, [uid, reviews, displayName, avatarUrl, activeTitle]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (file.type === 'image/gif') {
         if (dataUrl.length > 100000) {
             alert('Ảnh GIF quá lớn! Vui lòng chọn file dung lượng nhỏ hơn (dưới ~75KB) để lưu trữ hồ sơ của bạn an toàn và mượt mà nhất.');
             return;
         }
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
        setAvatar(canvas.toDataURL('image/jpeg', 0.85));
      };
      if (dataUrl) img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    console.log('Saving profile...', { name, avatar });
    try {
      await updateUserDoc({
        displayName: name,
        avatarUrl: avatar,
      });
      console.log('Firestore and Store updated.');
      useStore.getState().propagateEquipmentChanges().catch(console.error);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Remove alert to fix the hanging problem in iframe
      // alert('Đã cập nhật hồ sơ thành công!');
    } catch(err) {
      console.error('Error saving profile:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !review.trim()) return;
    try {
      // Post to user's local record
      const reviewRef = await addDoc(collection(db, `users/${uid}/reviews`), {
        uid,
        content: review,
        createdAt: serverTimestamp()
      });
      
      // Post to the shared global news feed with the same ID
      await setDoc(doc(db, 'newsFeed', reviewRef.id), {
        uid,
        displayName: displayName || 'Nhà lữ hành ẩn danh',
        avatarUrl: avatarUrl || null,
        activeTitle: activeTitle || null,
        content: review,
        createdAt: serverTimestamp(),
        equippedStickerComment: useStore.getState().equippedStickerComment || null,
        stickerPositionComment: useStore.getState().stickerPositionComment || 'top-right',
        equippedStickerPost: useStore.getState().equippedStickerPost || null,
        stickerPositionPost: useStore.getState().stickerPositionPost || 'top-right',
        equippedAccessory: useStore.getState().equippedAccessory || null,
        accessoryPosition: useStore.getState().accessoryPosition || null
      });

      unlockAchievement('blogger_choco_new');
      setReview('');
    } catch(err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/reviews`);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này không?')) return;
    try {
      await deleteDoc(doc(db, `users/${uid}/reviews`, reviewId));
      await deleteDoc(doc(db, 'newsFeed', reviewId));
    } catch (err: any) {
      console.error('Lỗi khi xóa bài viết:', err);
    }
  };

  if (!isLoggedIn) {
    return <div className="p-8 text-center">Vui lòng đăng nhập để xem hồ sơ.</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-wrap items-center gap-2 border-b-[3px] border-[#3E2723] dark:border-[#4E342E] pb-4">
        <button 
          onClick={() => setTab('profile')} 
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all border-2 shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] ${tab === 'profile' ? 'bg-[#E6D4BF] dark:bg-[#C29D70] border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#181311]' : 'bg-transparent border-[#3E2723]/30 dark:border-stone-700 text-stone-500 hover:border-[#3E2723]/60 dark:hover:border-stone-500 dark:text-stone-400 shadow-none'}`}
        >
          Hồ sơ 
        </button>
        <button 
          onClick={() => setTab('settings')} 
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all border-2 shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] ${tab === 'settings' ? 'bg-[#E6D4BF] dark:bg-[#C29D70] border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#181311]' : 'bg-transparent border-[#3E2723]/30 dark:border-stone-700 text-stone-500 hover:border-[#3E2723]/60 dark:hover:border-stone-500 dark:text-stone-400 shadow-none'}`}
        >
          Cài đặt
        </button>
        <button 
          onClick={() => setTab('transactions')} 
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all border-2 shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] ${tab === 'transactions' ? 'bg-[#E6D4BF] dark:bg-[#C29D70] border-[#3E2723] dark:border-[#4E342E] text-[#3E2723] dark:text-[#181311]' : 'bg-transparent border-[#3E2723]/30 dark:border-stone-700 text-stone-500 hover:border-[#3E2723]/60 dark:hover:border-stone-500 dark:text-stone-400 shadow-none'}`}
        >
          Lịch sử Choco
        </button>
      </div>
      
      {tab === 'settings' && (
        <div className="bg-white border border-[#D7CCC8] p-6 rounded-2xl shadow-sm max-w-xl mx-auto w-full">
          <h2 className="text-xl font-bold text-[#3E2723] mb-6">Cài đặt Tài khoản</h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
            <div className="order-1 sticky top-20 z-10 bg-white/95 dark:bg-[#1A1412]/95 backdrop-blur shadow-sm border border-[#D7CCC8]/60 dark:border-[#5D4037]/60 p-4 -mt-2 -mx-2 md:mx-0 rounded-2xl flex items-center gap-4">
              <UserAvatar 
                avatarUrl={avatar} 
                equippedAccessory={equippedAccessory}
                accessoryPosition={accessoryPosition}
                className="w-16 h-16 pointer-events-none" 
                fallbackIconSizeClass="w-8 h-8 text-[#A1887F]" 
                borderClass="border-2 border-[#D7CCC8] dark:border-[#5D4037]"
              />
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-[#5D4037] dark:text-[#ECE5DC]">Ảnh đại diện</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} ref={fileInputRef} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-[#FDF6EC] dark:bg-[#1D1410] border border-[#8D6E63] text-[#3E2723] dark:text-[#ECE5DC] rounded-lg text-sm font-bold hover:bg-[#3E2723] dark:hover:bg-[#ECE5DC] hover:text-[#FDF6EC] dark:hover:text-[#1D1410] transition-colors">Chọn ảnh</button>
                  {avatar !== avatarUrl && <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">Chưa lưu</span>}
                </div>
              </div>
            </div>
            <div className="order-3">
              <label className="block text-sm font-semibold mb-1 text-[#5D4037] dark:text-[#ECE5DC]">Tên hiển thị</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 rounded-xl border-2 border-[#3E2723] shadow-[inset_0_2px_0_0_#D7CCC8] bg-[#FDF6EC]/50 focus:outline-none focus:border-[#8D6E63] text-sm font-semibold" />
            </div>
            <div className="order-4">
              <label className="block text-sm font-semibold mb-1 text-[#5D4037] dark:text-[#ECE5DC]">Email</label>
              <input type="text" value={email || ''} disabled className="w-full px-4 py-2 rounded-lg border-2 border-[#3E2723] bg-[#EFEBE9] dark:bg-[#1C1310] shadow-[inset_0_2px_0_0_#D7CCC8] text-stone-500 cursor-not-allowed text-sm" />
            </div>

            <div className="order-5">
              <label className="block text-sm font-semibold mb-2 text-[#5D4037] dark:text-[#ECE5DC]">Cài đặt Sticker</label>
              {(ownedStickers || []).length === 0 ? (
                 <p className="text-xs text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-[#1A1412] p-3 rounded-lg border border-transparent dark:border-stone-800">Bạn chưa sở hữu sticker nào. Hãy vào Cửa hàng để mua!</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex border-b-[3px] border-[#3E2723] dark:border-[#4E342E] px-4">
                     <button type="button" onClick={() => setActiveStickerTab('comment')} className={`px-4 py-2 font-bold text-xs uppercase tracking-wider ${activeStickerTab === 'comment' ? 'border-b-2 border-[#8D6E63] text-[#3E2723] dark:text-[#E6D4BF]' : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'}`}>Bình Luận</button>
                     <button type="button" onClick={() => setActiveStickerTab('chat')} className={`px-4 py-2 font-bold text-xs uppercase tracking-wider ${activeStickerTab === 'chat' ? 'border-b-2 border-[#8D6E63] text-[#3E2723] dark:text-[#E6D4BF]' : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'}`}>Chat Bubble</button>
                     <button type="button" onClick={() => setActiveStickerTab('post')} className={`px-4 py-2 font-bold text-xs uppercase tracking-wider ${activeStickerTab === 'post' ? 'border-b-2 border-[#8D6E63] text-[#3E2723] dark:text-[#E6D4BF]' : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'}`}>Bài Đăng</button>
                  </div>
                  
                  {/* Common sticker picker based on active tab */}
                  <div className="flex flex-wrap gap-4 p-4 bg-stone-50 dark:bg-[#120D0C] border border-transparent dark:border-stone-800 rounded-lg animate-fade-in">
                    <div 
                       onClick={() => equipSticker(activeStickerTab, null)} 
                       title="Tháo sticker"
                       className={`w-14 h-14 cursor-pointer flex items-center justify-center border-2 border-dashed transition-all rounded-xl ${
                          !(activeStickerTab === 'comment' ? equippedStickerComment : activeStickerTab === 'chat' ? equippedStickerChat : equippedStickerPost) 
                           ? 'border-[#8D6E63] bg-[#8D6E63]/10 shadow-sm' : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 bg-white dark:bg-[#1C1310]'}`}
                    >
                       <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Trống</span>
                    </div>
                    {(ownedStickers || []).map(url => {
                       const isEquipped = (activeStickerTab === 'comment' ? equippedStickerComment : activeStickerTab === 'chat' ? equippedStickerChat : equippedStickerPost) === url;
                       return (
                          <div 
                            key={url} 
                            onClick={() => equipSticker(activeStickerTab, url)}
                            className={`w-14 h-14 cursor-pointer relative p-1 transition-all rounded-xl border flex items-center justify-center ${isEquipped ? 'ring-2 ring-offset-2 ring-[#8D6E63] dark:ring-offset-[#1A1412] bg-white dark:bg-[#1C1310] border-transparent' : 'hover:scale-105 bg-white dark:bg-[#1C1310] border-stone-200 dark:border-stone-800 shadow-sm'}`}
                           >
                             <img src={url} alt="Sticker preview" className="w-10 h-10 object-contain pointer-events-none" />
                          </div>
                       )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="order-2">
              <label className="block text-sm font-semibold mb-2 text-[#5D4037] dark:text-[#ECE5DC]">Cài đặt Phụ kiện Avatar</label>
              {(!ownedAccessories || ownedAccessories.length === 0) ? (
                <p className="text-xs text-stone-400 dark:text-stone-300 italic bg-stone-50 dark:bg-[#1A1412] border border-[#D7CCC8]/30 dark:border-stone-800 p-3 rounded-xl animate-fade-in">
                  Bạn chưa sở hữu phụ kiện nào. Hãy vào Cửa hàng để sở hữu phụ kiện!
                </p>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Accessory selector picker */}
                  <div className="flex flex-wrap gap-3 p-3 bg-stone-50 dark:bg-[#120D0C] border border-stone-200 dark:border-stone-800 rounded-xl">
                    <div 
                      type="button"
                      onClick={() => equipAccessory(null)}
                      className={`w-14 h-14 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed transition-all rounded-xl ${
                        !equippedAccessory 
                          ? 'border-[#8D6E63] bg-[#8D6E63]/10 text-[#8D6E63]' 
                          : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 bg-white dark:bg-[#1C1310] text-stone-500 dark:text-stone-400'}`}
                    >
                      <span className="text-[10px] font-extrabold uppercase text-center">Tháo ra</span>
                    </div>

                    {ownedAccessories.map((url) => {
                      const isEquipped = equippedAccessory === url;
                      return (
                        <div 
                          key={url} 
                          onClick={() => equipAccessory(url)}
                          className={`w-14 h-14 cursor-pointer relative p-1 transition-all rounded-xl border flex items-center justify-center ${
                            isEquipped 
                              ? 'ring-2 ring-offset-2 ring-[#8D6E63] dark:ring-offset-[#1A1412] bg-white dark:bg-[#1C1310] border-transparent' 
                              : 'hover:scale-105 bg-white dark:bg-[#1C1310] shadow-sm border-stone-200 dark:border-stone-800'}`}
                        >
                          <img src={url} alt="Accessory preview" className="w-10 h-10 object-contain pointer-events-none" referrerPolicy="no-referrer" />
                        </div>
                      );
                    })}
                  </div>

                  {equippedAccessory && (
                    <div className="bg-[#FDF6EC] dark:bg-[#120D0C] border border-[#F5E6D3] dark:border-stone-800 p-4 rounded-xl space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-[#8D6E63] dark:text-[#BF9F95] mb-1">
                        🛠️ Điều chỉnh vị trí phụ kiện
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Horizontal X Slider */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                            <span>Ngang (X)</span>
                            <span className="font-mono text-[#8D6E63] dark:text-pink-400">{accessoryPosition?.x || 0}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="-200" 
                            max="200" 
                            value={accessoryPosition?.x || 0} 
                            onChange={(e) => {
                              const x = parseInt(e.target.value);
                              setAccessoryPosition({
                                ...(accessoryPosition || { y: 0, scale: 100, rotate: 0 }),
                                x
                              });
                            }}
                            className="w-full accent-[#8D6E63]"
                          />
                        </div>

                        {/* Vertical Y Slider */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                            <span>Dọc (Y)</span>
                            <span className="font-mono text-[#8D6E63] dark:text-pink-400">{accessoryPosition?.y || 0}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="-200" 
                            max="200" 
                            value={accessoryPosition?.y || 0} 
                            onChange={(e) => {
                              const y = parseInt(e.target.value);
                              setAccessoryPosition({
                                ...(accessoryPosition || { x: 0, scale: 100, rotate: 0 }),
                                y
                              });
                            }}
                            className="w-full accent-[#8D6E63]"
                          />
                        </div>

                        {/* Scale Slider */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                            <span>Kích thước (Scale)</span>
                            <span className="font-mono text-[#8D6E63] dark:text-pink-400">{accessoryPosition?.scale ?? 100}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="30" 
                            max="200" 
                            value={accessoryPosition?.scale ?? 100} 
                            onChange={(e) => {
                              const scale = parseInt(e.target.value);
                              setAccessoryPosition({
                                ...(accessoryPosition || { x: 0, y: 0, rotate: 0 }),
                                scale
                              });
                            }}
                            className="w-full accent-[#8D6E63]"
                          />
                        </div>

                        {/* Rotate Slider */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                            <span>Xoay (Rotation)</span>
                            <span className="font-mono text-[#8D6E63] dark:text-pink-400">{accessoryPosition?.rotate || 0}°</span>
                          </div>
                          <input 
                            type="range" 
                            min="-180" 
                            max="180" 
                            value={accessoryPosition?.rotate || 0} 
                            onChange={(e) => {
                              const rotate = parseInt(e.target.value);
                              setAccessoryPosition({
                                ...(accessoryPosition || { x: 0, y: 0, scale: 100 }),
                                rotate
                              });
                            }}
                            className="w-full accent-[#8D6E63]"
                          />
                        </div>
                      </div>

                      <div className="text-[10px] text-stone-500 dark:text-stone-400 italic bg-white/60 dark:bg-black/30 p-2 rounded border border-dashed border-[#D7CCC8]/60 dark:border-stone-800 mt-1">
                        * Bạn có thể kéo các thanh trượt trên để dịch chuyển vật phẩm gắn tự do tới bất kỳ tọa độ, xoay góc hoặc thu phóng tùy ý trên avatar của bạn!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="order-6">
              <label className="block text-sm font-semibold mb-1 text-[#5D4037]">Đổi mật khẩu</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Nhập để đổi mật khẩu (Chưa hỗ trợ)" disabled className="w-full px-4 py-2 rounded-lg border-2 border-[#3E2723] bg-[#EFEBE9] shadow-[inset_0_2px_0_0_#D7CCC8] italic text-sm" />
            </div>
            <button type="submit" disabled={saving || saveSuccess} className="order-last w-full py-2.5 bg-[#3E2723] text-[#FDF6EC] rounded-lg font-bold uppercase tracking-widest text-[#FFFDF9] hover:bg-[#5D4037] transition-all mt-2 disabled:bg-[#8D6E63]">
              {saving ? 'Đang lưu...' : saveSuccess ? 'Đã lưu ✓' : 'Lưu Thay Đổi'}
            </button>
          </form>
        </div>
      )}

      {tab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 items-start">
            <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723] dark:border-[#4E342E] p-6 rounded-3xl shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] flex flex-col items-center text-center">
              <div className="border-2 border-[#3E2723] dark:border-[#4E342E] rounded-full p-1 shadow-md bg-white mb-4">
                <UserAvatar 
                  avatarUrl={avatarUrl} 
                  equippedAccessory={equippedAccessory}
                  accessoryPosition={accessoryPosition}
                  className="w-24 h-24 relative" 
                  fallbackIconSizeClass="w-12 h-12 text-[#A1887F]" 
                  borderClass="border-0"
                />
              </div>
              <h2 className="text-xl font-bold mb-1 flex items-center justify-center gap-1.5 flex-wrap text-[#3E2723] dark:text-[#ECE5DC]" style={{ color: getTitleColor(activeTitle) || undefined }}>
                 {displayName}
                 {activeTitle && (
                    <span className="px-2 py-0.5 bg-[#E6D4BF] dark:bg-[#C29D70] text-[#3E2723] dark:text-[#181311] text-[9px] font-extrabold rounded-md uppercase tracking-tight select-none border-2 border-[#3E2723] dark:border-[#4E342E]">
                       🏆 {activeTitle}
                    </span>
                 )}
              </h2>
              <p className="text-xs font-mono text-stone-500 mb-4">{email}</p>
              
              {/* Hệ thống level độc giả */}
              <div className="w-full mb-4 bg-[#F5E6D3]/40 dark:bg-[#34221A] p-4 rounded-2xl border-2 border-[#3E2723] text-left">
                 <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] dark:text-white/90">Level</span>
                    <div className="flex items-center gap-2">
                       {totalBoxes > 0 && (
                          <button 
                             onClick={() => setRewardClaimInfo({ gchoco: totalGChoco, boxes: totalBoxes, unclaimedLevels })}
                             className="px-2.5 py-1 bg-[#D4AF37] hover:bg-[#B5952F] hover:scale-105 active:scale-95 text-white rounded-full text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer shadow border border-[#E5C158] transition-all animate-bounce"
                             title="Bấm để nhận quà lên cấp!"
                          >
                             <Gift className="w-3.5 h-3.5" />
                             <span>Quà Lên Cấp</span>
                          </button>
                       )}
                       <span className="px-2 py-0.5 bg-[#3E2723] text-[#FDF6EC] text-xs font-bold rounded-lg border-2 border-[#3E2723] shadow-sm">Lv. {level || 1}</span>
                    </div>
                 </div>
                 <div className="w-full bg-[#E0D4C5] dark:bg-[#1A1412] rounded-full h-3 overflow-hidden shadow-inner relative mb-1 border-2 border-[#3E2723]">
                    <div 
                       style={{ width: `${barWidth}%` }}
                       className="bg-[#8D6E63] dark:from-[#967C64] dark:to-[#836355] h-full rounded-full transition-all duration-1000 ease-out"
                    />
                 </div>
                 <div className="flex justify-between items-center text-[10px] text-stone-600 dark:text-white/80 font-black tracking-tight font-mono">
                    <span>{currentExp} / {nextLevelExp} EXP</span>
                    <span>{percent}%</span>
                 </div>
              </div>

              <div className="w-full bg-[#FDF6EC] dark:bg-[#34221A] rounded-2xl p-4 border-2 border-[#3E2723] flex items-center justify-between">
                 <div className="flex flex-col items-center flex-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-[#8D6E63] dark:text-stone-400 mb-1">Choco</span>
                    <span className="font-black text-[#3E2723] dark:text-white text-lg">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : choco}</span>
                 </div>
                 <div className="w-[3px] h-8 bg-[#3E2723]/30 rounded-full"></div>
                 <div className="flex flex-col items-center flex-1">
                    <span className="text-[9px] uppercase font-black tracking-widest text-[#D4AF37] mb-1">Gchoco</span>
                    <span className="font-black text-[#D4AF37] text-lg">{(email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com') ? '∞' : goldenChoco}</span>
                  </div>
               </div>

               {/* Trang bị danh hiệu */}
               <div className="w-full mt-4 bg-[#F5E6D3] dark:bg-[#34221A] p-4 rounded-xl border border-[#D7CCC8]/30 dark:border-[#5D4037] text-left animate-fade-in">
                  <div className="flex justify-between items-center mb-1.5">
                     <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5D4037] dark:text-white/90">Danh hiệu của tôi</span>
                  </div>
                  {unlockedAchievements.length === 0 && (!customTitles || customTitles.length === 0) ? (
                     <p className="text-xs text-[#8D6E63] dark:text-white/60 italic">Chưa sở hữu danh hiệu nào.</p>
                  ) : (
                     <div className="space-y-2">
                        <select 
                           value={activeTitle || ''} 
                           onChange={(e) => setActiveTitle(e.target.value || null)}
                           className="w-full text-xs font-bold border border-[#D7CCC8] dark:border-[#5D4037] rounded-lg p-2 bg-white dark:bg-[#1C1310] text-[#3E2723] dark:text-[#ECE5DC] focus:outline-none focus:ring-1 focus:ring-[#8D6E63]"
                        >
                           <option value="">-- Không trang bị --</option>
                           {ACHIEVEMENTS_LIST.filter(a => unlockedAchievements.includes(a.id)).map(a => (
                              <option key={a.id} value={a.name}>{a.name}</option>
                           ))}
                           {customTitles && customTitles.map((t, idx) => (
                              <option key={t.id || idx} value={t.name}>{t.name}</option>
                           ))}
                        </select>
                        <div className="text-[10px] text-[#5D4037] dark:text-white/80 font-medium leading-tight">
                           Chọn danh hiệu để hiển thị cùng tên tài khoản và đổi màu tên của bạn ở mọi nơi!
                        </div>
                     </div>
                  )}
               </div>

               {/* Danh sách thành tựu đã nhận */}
               <div className="w-full mt-3 bg-[#F5E6D3] dark:bg-[#34221A] p-4 rounded-xl border border-[#D7CCC8]/30 dark:border-[#5D4037] text-left">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5D4037] dark:text-white/90 block mb-2">Thành tựu đã nhận ({unlockedAchievements.length})</span>
                  {unlockedAchievements.length === 0 ? (
                     <p className="text-xs text-[#8D6E63] dark:text-white/60 italic">Chưa đạt thành tựu nào.</p>
                  ) : (
                     <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {ACHIEVEMENTS_LIST.filter(a => unlockedAchievements.includes(a.id)).map(a => (
                           <span key={a.id} className="text-[10px] px-2 py-0.5 bg-white dark:bg-black/20 text-[#3E2723] dark:text-white/90 font-bold rounded-md uppercase tracking-wide border border-[#D7CCC8] dark:border-black/10">
                              🏆 {a.name}
                           </span>
                        ))}
                     </div>
                  )}
               </div>
            </div>
            

           <div className="bg-[#FFFDF9] dark:bg-[#211B18] border-2 border-[#3E2723] dark:border-stone-800 p-6 rounded-3xl shadow-[1px_1px_0_0_#3E2723] flex flex-col min-h-[400px]">
             <h2 className="text-xl font-black text-[#3E2723] dark:text-[#ECE5DC] mb-4 uppercase tracking-tighter">Góc cá nhân / Bài viết</h2>
             <form onSubmit={handlePostReview} className="mb-6 flex flex-col gap-2">
               <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Chia sẻ suy nghĩ, review truyện..." className="w-full min-h-[100px] p-3 rounded-2xl border-2 border-[#3E2723] bg-[#FDF6EC]/50 dark:bg-[#1A1412] text-[#3E2723] dark:text-[#ECE5DC] resize-none text-sm font-semibold focus:outline-none placeholder-stone-400" />
               <button type="submit" className="self-end px-6 py-2 bg-[#8D6E63] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#5D4037] border-2 border-[#3E2723] shadow-[1.5px_1.5px_0_0_#3E2723] active:translate-y-[1.5px] active:shadow-none transition-all">
                 Đăng bài
               </button>
             </form>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {rewardClaimInfo && (
                   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-[#FDF6EC] border-4 border-[#3E2723] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center transform scale-100 transition-all font-sans">
                         <div className="w-16 h-16 bg-amber-100 border-2 border-[#8D6E63] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Gift className="w-8 h-8 text-amber-700" />
                         </div>
                         <h3 className="text-xl font-bold uppercase text-[#3E2723] mb-2 font-black tracking-tight">Phần Thưởng Lên Cấp!</h3>
                         <p className="text-sm text-stone-600 mb-4">
                            Chúc mừng bạn đã đạt cấp độ mới! Bạn có phần thưởng chưa nhận từ level <strong>{lastClaimedRewardLevel || 1}</strong> lên <strong>{level}</strong>:
                         </p>
                         <div className="bg-[#FAF0E6] rounded-2xl p-4 border border-[#D7CCC8]/80 mb-5 flex flex-col gap-2.5 shadow-inner">
                            <div className="flex justify-between items-center text-sm font-bold text-[#5D4037]">
                               <span>Gchoco:</span>
                               <span className="bg-[#D4AF37]/15 text-[#D4AF37] px-3 py-1 rounded-full border border-[#D4AF37]/30">+{rewardClaimInfo.gchoco} Gchoco</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-[#5D4037]">
                               <span>Hộp Quà Sticker Bí Ẩn:</span>
                               <span className="bg-[#8D6E63]/15 text-[#8D6E63] px-3 py-1 rounded-full border border-[#8D6E63]/30">+{rewardClaimInfo.boxes} Hộp Quà</span>
                            </div>
                         </div>
                         <div className="flex gap-3">
                            <button 
                               type="button"
                               onClick={() => setRewardClaimInfo(null)}
                               className="px-4 py-2 border border-[#8D6E63] text-[#3E2723] hover:bg-black/5 rounded-full text-xs font-bold flex-1 cursor-pointer transition-colors"
                            >
                               Đóng
                            </button>
                            <button 
                               type="button"
                               onClick={handleClaimRewards}
                               disabled={claiming}
                               className="px-4 py-2 bg-[#D4AF37] hover:bg-[#B5952F] text-white rounded-full text-xs font-black shadow-md flex-1 uppercase tracking-wider cursor-pointer transition-colors"
                            >
                               {claiming ? "Đang nhận..." : "Nhận ngay"}
                            </button>
                         </div>
                      </div>
                   </div>
                )}
                {reviews.length === 0 ? <p className="text-stone-400 italic text-sm text-center py-8">Chưa có bài viết nào.</p> : null}
                {reviews.map(r => (
                  <div key={r.id} className="p-4 bg-[#FFFDF9] dark:bg-[#251E1B]/30 rounded-2xl border-2 border-[#3E2723] dark:border-[#5D4037] flex justify-between items-start gap-4 hover:shadow-[1px_1px_0_0_#3E2723] transition-all mb-3 text-left">
                    <div className="flex-1">
                      <p className="text-sm font-semibold whitespace-pre-wrap text-[#3E2723] dark:text-[#ECE5DC]">{r.content}</p>
                      <p className="text-[10px] text-stone-400 mt-3 uppercase tracking-widest">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(r.id)}
                      className="text-red-700 text-[10px] font-black uppercase tracking-wider hover:text-red-800 transition-colors shrink-0 bg-red-105 hover:bg-red-200/50 px-3 py-1.5 rounded-xl border-2 border-[#3E2723] shadow-[1.5px_1.5px_0_0_#3E2723] active:translate-y-[1.5px] active:shadow-none transition-all"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}

      {tab === 'transactions' && (
         <div className="bg-[#FFFDF9] dark:bg-[#211B18] border-2 border-[#3E2723] dark:border-stone-800 rounded-3xl shadow-[1px_1px_0_0_#3E2723] p-6 w-full">
            <h2 className="text-xl font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-tighter mb-6 flex items-center gap-2 border-l-4 border-[#3E2723] pl-3">
               Lịch sử giao dịch Choco
            </h2>
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
               {transactions.length === 0 ? (
                  <p className="text-stone-400 italic text-sm text-center py-8 font-serif">Chưa có giao dịch nào được ghi nhận.</p>
               ) : (
                  transactions.map(t => (
                     <div key={t.id} className="flex justify-between items-center p-4 bg-white dark:bg-[#1A1412] border-[2px] border-[#3E2723] rounded-2xl hover:bg-[#FDF6EC]/55 hover:shadow-[1.5px_1.5px_0_0_#3E2723] hover:-translate-y-0.5 transition-all mb-2">
                        <div className="flex flex-col gap-1">
                           <span className="text-sm font-bold text-[#3E2723] dark:text-[#ECE5DC]">{t.reason}</span>
                           <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-stone-500">
                              <span className="uppercase tracking-widest">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : 'Vừa xong'}</span>
                              {t.balanceAfter !== undefined && (
                                 <>
                                    <span className="opacity-40">•</span>
                                    <span className="font-semibold text-[#8D6E63] dark:text-[#BF9F95]">Số dư: {t.balanceAfter} {t.currency === 'choco' ? 'Choco' : 'GChoco'}</span>
                                 </>
                              )}
                           </div>
                        </div>
                        <div className={`font-black text-sm flex items-center gap-1 ${t.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                           {t.type === 'earn' ? '+' : '-'}{t.amount} {t.currency === 'choco' ? 'Choco' : 'GChoco'}
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      )}
    </div>
  );
}

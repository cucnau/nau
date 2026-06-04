import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { BookOpen, Users, Lock, ChevronRight, Bookmark, Gift, Heart, Sparkles, Send, MessageSquare } from 'lucide-react';
import { cn } from '../components/Layout';
import React, { useEffect, useState } from 'react';
import { db, checkIfQuotaError } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, where } from 'firebase/firestore';

export function StoryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    storyProgress, 
    isLoggedIn, 
    savedStories, 
    toggleSaveStory, 
    giftChoco, 
    choco, 
    uid, 
    displayName, 
    avatarUrl 
  } = useStore();

  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chapters' | 'comments'>('chapters');
  
  // Gift State
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState<number>(10);
  const [giftMessage, setGiftMessage] = useState<string>('');
  
  // Comment input state
  const [commentText, setCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchStory = async () => {
      try {
        const snap = await getDoc(doc(db, 'stories', id));
        if (snap.exists()) setStory({ id: snap.id, ...snap.data() });
        
        const cSnap = await getDocs(query(collection(db, `stories/${id}/chapters`), orderBy('order', 'asc')));
        setChapters(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const qComments = query(collection(db, 'comments'), where('targetId', '==', id));
    const unsub = onSnapshot(qComments, (snap) => {
       const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       list.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
       });
       setComments(list);
    });
    return () => unsub();
  }, [id]);
  
  if (loading) return <div className="p-10 text-center">Đang tải truyện...</div>;
  if (!story) return <div className="p-10 text-center">Không tìm thấy truyện</div>;

  const progressOrder = storyProgress[story.id] || 0;
  const isSaved = (savedStories || []).includes(story.id);

  // Calculate total gifted choco from comments feed real-time
  const totalGiftedChoco = comments
    .filter(c => c.type === 'choco_gift')
    .reduce((acc, curr) => acc + (curr.giftAmount || 0), 0);

  const handleSaveToggle = () => {
    if (!isLoggedIn) {
       alert("Bạn cần đăng nhập để lưu truyện vào thư viện!");
       return;
    }
    toggleSaveStory(story.id);
  };

  const handleGiftSubmit = async () => {
    if (!isLoggedIn) {
       alert("Bạn cần đăng nhập để tặng Choco!");
       return;
    }
    if (giftAmount <= 0) {
       alert("Số lượng Choco tặng phải lớn hơn 0!");
       return;
    }
    if (choco < giftAmount) {
       alert(`Bạn không đủ Choco! Số dư hiện tại là ${choco} Choco, thiếu ${giftAmount - choco} Choco.`);
       return;
    }

    const success = giftChoco(story.id, giftAmount);
    if (success) {
       try {
          await addDoc(collection(db, 'comments'), {
             targetId: story.id,
             uid,
             displayName: displayName || 'Nhà lữ hành ẩn danh',
             avatarUrl: avatarUrl || '',
             content: giftMessage.trim() || 'Gửi tặng Choco ngọt ngào ủng hộ tác phẩm!',
             type: 'choco_gift',
             activeTitle: useStore.getState().activeTitle || null,
             giftAmount: giftAmount,
             paragraphIdx: null,
             createdAt: serverTimestamp()
          });
          setShowGiftModal(false);
          setGiftMessage('');
          alert(`Tặng ${giftAmount} Choco thành công! Cám ơn bạn đã tiếp sức cho tác phẩm.`);
       } catch (err) {
          console.error(err);
          if (checkIfQuotaError(err)) {
             (window as any).__setQuotaExceeded?.(true);
             alert("Hệ thống đạt giới hạn lưu trữ đám mây hôm nay (Quota Exceeded). Nhưng số dư của bạn đã được cập nhật cục bộ thành công! Cám ơn bạn đã tiếp sức cho tác phẩm.");
             setShowGiftModal(false);
             setGiftMessage('');
          } else {
             alert("Lỗi khi ghi nhận quà tặng, nhưng số dư Choco của bạn đã được cập nhật.");
          }
       }
    } else {
       alert("Có lỗi xảy ra khi thực hiện tặng Choco.");
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!isLoggedIn) {
        alert("Bạn cần đăng nhập để viết bình luận!");
        return;
     }
     if (!commentText.trim()) return;
     setSubmittingComment(true);
     try {
        await addDoc(collection(db, 'comments'), {
           targetId: story.id,
           uid,
           displayName: displayName || 'Nhà lữ hành ẩn danh',
           avatarUrl: avatarUrl || '',
           content: commentText.trim(),
           type: 'story_review',
           activeTitle: useStore.getState().activeTitle || null,
           giftAmount: 0,
           paragraphIdx: null,
           createdAt: serverTimestamp()
        });
        setCommentText('');
     } catch (err) {
        console.error(err);
        if (checkIfQuotaError(err)) {
           (window as any).__setQuotaExceeded?.(true);
           alert("Hệ thống đạt giới hạn lưu trữ đám mây hôm nay. Bình luận của bạn chưa thể gửi lên máy chủ, nhưng bạn vẫn có thể đọc truyện bình thường!");
        } else {
           alert("Gặp sự cố khi gửi bình luận của bạn.");
        }
     } finally {
        setSubmittingComment(false);
     }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 flex flex-col gap-8 max-w-5xl mx-auto w-full">
      {/* Story Profile Card */}
      <div className="flex flex-col gap-8 bg-white border border-[#D7CCC8] p-6 lg:p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 flex-shrink-0 flex justify-center md:block">
                <img src={story.coverUrl} alt={story.title} className="w-48 md:w-full aspect-[2/3] object-cover rounded-xl shadow-lg border border-[#D7CCC8]/50" />
            </div>
            <div className="flex-1 flex flex-col">
                <h1 className="text-2xl lg:text-4xl font-bold mb-2 text-[#3E2723] uppercase tracking-tighter">{story.title}</h1>
                <div className="text-gray-600 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium italic">{story.author}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                    {story.genres?.map?.((g: string) => (
                        <span key={g} className="bg-[#FDF6EC] text-[#3E2723] px-3 py-1 text-xs font-semibold rounded-full border border-[#D7CCC8]">
                            {g}
                        </span>
                    ))}
                </div>
     
                <div className="flex items-center gap-6 mb-6">
                   <div className="flex flex-col">
                       <span className="text-[#8D6E63] text-sm uppercase font-bold">Chương</span>
                       <span className="font-black text-xl text-[#3E2723]">{Math.max(story.chapterCount || 0, chapters.length)}</span>
                   </div>
                   <div className="w-px h-8 bg-[#D7CCC8]"></div>
                   <div className="flex flex-col">
                       <span className="text-[#8D6E63] text-sm uppercase font-bold">Lượt đọc</span>
                       <span className="font-black text-xl text-[#3E2723]">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}</span>
                   </div>
                   <div className="w-px h-8 bg-[#D7CCC8]"></div>
                   <div className="flex flex-col">
                       <span className="text-[#8D6E63] text-sm uppercase font-bold">Đã tặng</span>
                       <span className="font-black text-xl text-[#3E2723] flex items-center gap-1">
                          {totalGiftedChoco} <span className="text-xs">🍫</span>
                       </span>
                   </div>
                </div>
                
                {/* Interactive Action Row */}
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <button 
                      onClick={() => navigate(`/doc/${story.id}/${chapters[0]?.id}`)} 
                      className="bg-[#3E2723] text-[#FDF6EC] px-4 py-1.5 text-sm rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#2D1B19] transition-all shadow-md border border-[#8D6E63]"
                    >
                        <BookOpen className="w-4 h-4" />
                        Đọc từ đầu
                    </button>
                    
                    <button 
                      onClick={handleSaveToggle} 
                      className={cn(
                        "px-4 py-1.5 text-sm rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-sm border",
                        isSaved 
                          ? "bg-[#E6D8C9] border-[#D7CCC8] text-[#3E2723] hover:bg-[#D5C9BB]" 
                          : "bg-white border-[#D7CCC8] text-[#5D4037] hover:bg-[#FDF6EC]"
                      )}
                    >
                        <Bookmark className={cn("w-4 h-4", isSaved && "fill-[#8D6E63] text-[#8D6E63]")} />
                        {isSaved ? 'Đã Lưu' : 'Lưu Thư Viện'}
                    </button>
    
                    <button 
                      onClick={() => setShowGiftModal(true)} 
                      className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-4 py-1.5 text-sm rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <Gift className="w-4 h-4 text-amber-700 animate-bounce" />
                        Tặng Choco
                    </button>
                </div>
            </div>
        </div>

        <div className="border-t border-[#D7CCC8] pt-6 flex-1">
            <h3 className="font-bold text-lg mb-4 uppercase text-[#3E2723]">Giới thiệu</h3>
            <div className="text-gray-700 leading-relaxed italic text-[15px] space-y-4">
               {story.description?.split('\n').map((para: string, idx: number) => (
                  <p key={idx} className={para.trim() ? "" : "hidden"}>{para}</p>
               ))}
            </div>
        </div>
      </div>

      {/* Tabs list (Chapters list vs Comments Feed) */}
      <div className="bg-white border border-[#D7CCC8] rounded-3xl p-6 lg:p-8 shadow-sm">
         <div className="flex border-b border-[#F5E6D3] mb-6">
            <button
               onClick={() => setActiveTab('chapters')}
               className={cn(
                  "px-4 py-3 font-bold text-sm uppercase tracking-tight relative transition-all",
                  activeTab === 'chapters' ? "text-[#3E2723]" : "text-gray-400 hover:text-gray-600"
               )}
            >
               Danh sách chương ({chapters.length})
               {activeTab === 'chapters' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#3E2723] rounded-t-full"></span>
               )}
            </button>
            <button
               onClick={() => setActiveTab('comments')}
               className={cn(
                  "px-4 py-3 font-bold text-sm uppercase tracking-tight relative transition-all flex items-center gap-2",
                  activeTab === 'comments' ? "text-[#3E2723]" : "text-gray-400 hover:text-gray-600"
               )}
            >
               Bình luận & Quà tặng ({comments.length})
               {activeTab === 'comments' && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#3E2723] rounded-t-full"></span>
               )}
            </button>
         </div>

         {/* Tab Content */}
         {activeTab === 'chapters' ? (
            <div className="flex flex-col">
               {chapters.map(chap => {
                  const isRead = chap.order <= progressOrder;
                  return (
                     <button 
                        key={chap.id}
                        onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                        className={cn(
                            "flex items-center justify-between p-4 border-b border-[#F5E6D3] hover:bg-[#FDF6EC] transition-colors group last:border-0 rounded-lg mb-1",
                            isRead && "text-[#A1887F]"
                        )}
                     >
                        <div className="flex items-center gap-3">
                           <span className={cn("font-bold text-left text-sm", isRead ? "" : "group-hover:text-[#8D6E63] text-[#3E2723]")}>
                               {chap.title}
                           </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {chap.isPasswordProtected && <Lock className="w-4 h-4 text-[#8D6E63]" title="Cần vé Pass" />}
                            {isRead && <span className="text-[10px] uppercase font-bold tracking-wider bg-[#F5E6D3] text-[#8D6E63] px-2 py-0.5 rounded-full">Đã đọc</span>}
                            <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", !isRead && "text-[#8D6E63]")} />
                        </div>
                     </button>
                  )
               })}
            </div>
         ) : (
            <div className="space-y-6">
               {/* Post comment box */}
               <form onSubmit={handleSendComment} className="flex gap-3">
                  <input
                     type="text"
                     placeholder={isLoggedIn ? "Nhập câu chữ bình luận của bạn về truyện tại đây..." : "Ủng hộ truyện ngay! Đăng nhập để viết cảm nhận."}
                     disabled={!isLoggedIn || submittingComment}
                     value={commentText}
                     onChange={(e) => setCommentText(e.target.value)}
                     className="flex-1 bg-[#FDF6EC] border border-[#D7CCC8]/80 text-[#3E2723] focus:border-[#8D6E63] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] rounded-xl px-4 py-3 placeholder-gray-400 text-sm"
                  />
                  <button
                     type="submit"
                     disabled={submittingComment || !commentText.trim() || !isLoggedIn}
                     className="bg-[#3E2723] hover:bg-[#2D1B19] text-[#FDF6EC] disabled:bg-gray-300 disabled:text-gray-400 px-5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                     <Send className="w-3.5 h-3.5" />
                     Gửi
                  </button>
               </form>

               {/* Comments List */}
               <div className="space-y-4">
                  {comments.length === 0 ? (
                     <div className="py-10 text-center text-gray-400 text-sm italic">
                        Chưa có cuộc thảo luận hoặc quà tặng nào cho tác phẩm này. Hãy là người đầu tiên tiếp sức!
                     </div>
                  ) : (
                     comments.map((comment) => {
                        const isGift = comment.type === 'choco_gift';
                        return (
                           <div 
                              key={comment.id} 
                              className={cn(
                                 "p-4 rounded-2xl flex gap-3.5 border transition-all shadow-sm",
                                 isGift 
                                    ? "bg-amber-50/70 border-amber-200/80 hover:bg-amber-50" 
                                    : "bg-white border-[#F5E6D3]/60 hover:border-[#D7CCC8]/50"
                              )}
                           >
                              {comment.avatarUrl ? (
                                 <img src={comment.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#D7CCC8]/30" referrerPolicy="no-referrer" />
                              ) : (
                                 <div className="w-10 h-10 rounded-full bg-[#8D6E63] text-[#FDF6EC] flex items-center justify-center shrink-0 font-bold text-xs uppercase shadow-inner">
                                    {comment.displayName?.substring(0, 2)}
                                 </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                       <span className="font-extrabold text-[#3E2723] text-sm shrink-0">
                                          {comment.displayName}
                                          {comment.activeTitle && (
                                             <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-extrabold rounded-md uppercase tracking-tight select-none border border-yellow-200 ml-1.5 inline-block align-middle">
                                                🏆 {comment.activeTitle}
                                             </span>
                                          )}
                                       </span>
                                       
                                       {isGift && (
                                          <span className="bg-amber-100 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-sm">
                                             <Sparkles className="w-3 h-3 text-amber-600 inline shrink-0" />
                                             Tặng {comment.giftAmount} Choco 🍫
                                          </span>
                                       )}
                                    </div>
                                    
                                    <span className="text-[10px] text-gray-400 font-mono shrink-0">
                                       {comment.createdAt?.toDate 
                                          ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                                          : 'Vừa xong'}
                                    </span>
                                 </div>
                                 <p className={cn(
                                    "text-sm break-words leading-relaxed",
                                    isGift ? "text-amber-900 font-medium italic" : "text-gray-700"
                                 )}>
                                    {comment.content}
                                 </p>
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>
            </div>
         )}
      </div>

      {/* Gifting Choco Modal Portal Mock overlay */}
      {showGiftModal && (
         <div className="fixed inset-0 bg-[#3E2723]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl border border-[#D7CCC8] w-full max-w-md p-6 shadow-xl relative animate-scale-up">
               {/* Header */}
               <div className="flex items-center justify-between border-b border-[#F5E6D3] pb-4 mb-5">
                  <h3 className="text-lg font-extrabold text-[#3E2723] uppercase tracking-tighter flex items-center gap-1.5">
                     <Gift className="w-5 h-5 text-amber-600 animate-pulse" />
                     Gửi Quà Tặng Choco
                  </h3>
                  <button 
                     onClick={() => setShowGiftModal(false)}
                     className="text-gray-400 hover:text-gray-600 text-xs font-bold font-mono border border-gray-200 rounded-lg px-2 py-1"
                  >
                     Đóng
                  </button>
               </div>

               {/* Choco balance stats */}
               <div className="bg-[#FDF6EC] p-4 rounded-2xl border border-[#F5E6D3] mb-5 flex items-center justify-between">
                  <div>
                     <p className="text-gray-500 text-xs font-semibold">Túi Choco của bạn</p>
                     <p className="text-xl font-black text-[#3E2723]">{choco.toLocaleString()} 🍫</p>
                  </div>
                  <Sparkles className="w-6 h-6 text-amber-500" />
               </div>

               {/* Preset amounts selection */}
               <p className="text-[#8D6E63] text-xs font-bold mb-2 uppercase">Chọn số lượng Choco</p>
               <div className="grid grid-cols-4 gap-2 mb-4">
                  {[5, 10, 20, 50, 100].map((amount) => (
                     <button
                        key={amount}
                        type="button"
                        onClick={() => setGiftAmount(amount)}
                        className={cn(
                           "py-2 px-1 rounded-xl font-extrabold text-xs border text-center transition-all",
                           giftAmount === amount
                              ? "bg-[#3E2723] border-[#3E2723] text-white shadow-md scale-105"
                              : "bg-white border-[#D7CCC8] text-[#5D4037] hover:bg-[#FDF6EC]"
                        )}
                     >
                        {amount} 🍫
                     </button>
                  ))}
                  
                  {/* Custom Amount input nested in grid */}
                  <input
                     type="number"
                     placeholder="Số khác"
                     min="1"
                     value={giftAmount || ''}
                     onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                     className="py-1 px-1 text-center bg-white border border-[#D7CCC8] text-[#3E2723] rounded-xl text-xs font-extrabold focus:outline-none focus:border-[#3E2723]"
                  />
               </div>

               {/* Sweet support message */}
               <label className="block text-[#8D6E63] text-xs font-bold mb-2 uppercase">Đôi lời yêu thương</label>
               <textarea
                  placeholder=""
                  rows={3}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full bg-[#FDF6EC] border border-[#D7CCC8]/80 text-[#3E2723] focus:border-[#8D6E63] focus:outline-none rounded-2xl p-3 text-sm mb-5"
               />

               {/* Submit buttons */}
               <div className="flex gap-3">
                  <button
                     onClick={() => setShowGiftModal(false)}
                     className="flex-1 border border-[#D7CCC8] text-[#5D4037] font-bold py-3 px-4 rounded-xl text-xs hover:bg-[#F5EADE] transition-colors"
                  >
                     Hủy
                  </button>
                  <button
                     onClick={handleGiftSubmit}
                     disabled={giftAmount <= 0}
                     className="flex-1 bg-[#3E2723] hover:bg-[#2D1B19] text-[#FDF6EC] py-3 px-4 rounded-xl text-xs font-black transition-colors shadow-md border border-[#8D6E63]"
                  >
                     Tiếp Sức ({giftAmount} 🍫)
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

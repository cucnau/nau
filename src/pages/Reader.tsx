import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { cn } from '../components/Layout';
import { Settings2, ArrowLeft, ArrowRight, List, Lock, MessageSquare } from 'lucide-react';
import { db, checkIfQuotaError } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, where, doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export function Reader() {
  const { storyId, chapterId } = useParams();
  const navigate = useNavigate();
  const { markStoryRead, isLoggedIn, addCommentProgress, uid, displayName, avatarUrl, spendGoldenChoco } = useStore();
  
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isDark, setIsDark] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null);
  const [paragraphCommentText, setParagraphCommentText] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
        setShowSettings(false); // Close settings when scrolling down
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setIsUnlocked(false);
  }, [chapterId]);

  useEffect(() => {
     if (storyId && chapterId) {
        updateDoc(doc(db, 'stories', storyId), { viewCount: increment(1) }).catch((err) => {
          console.error('Error auto-incrementing view count:', err);
          if (checkIfQuotaError(err)) {
            (window as any).__setQuotaExceeded?.(true);
          }
        });
     }
  }, [storyId, chapterId]);

  useEffect(() => {
    if (!storyId) return;
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, 'stories', storyId));
        if (snap.exists()) setStory({ id: snap.id, ...snap.data() });
        
        const cSnap = await getDocs(query(collection(db, `stories/${storyId}/chapters`), orderBy('order', 'asc')));
        setChapters(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storyId]);

  const currentChapterIndex = chapters.findIndex(c => c.id === chapterId);
  const currentChapter = chapters[currentChapterIndex];
  
  const prevChapter = chapters[currentChapterIndex - 1];
  const nextChapter = chapters[currentChapterIndex + 1];

  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (!currentChapter) return;
    const qComments = query(collection(db, 'comments'), where('targetId', '==', currentChapter.id));
    const unsub = onSnapshot(qComments, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
        const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
        return timeB - timeA;
      });
      setComments(data);
    });
    return () => unsub();
  }, [currentChapter?.id]);

  useEffect(() => {
     if (currentChapter && isLoggedIn) {
         markStoryRead(storyId!, currentChapter.order, story?.genres);
     }
  }, [currentChapter, isLoggedIn, markStoryRead, storyId, story?.genres]);
  
  const submitComment = async (content: string, type: string, paragraphIdx?: number) => {
     if (!content.trim() || !isLoggedIn) return;
     try {
         await addDoc(collection(db, 'comments'), {
             targetId: currentChapter.id,
             uid,
             displayName,
             avatarUrl,
             content,
             type,
             activeTitle: useStore.getState().activeTitle || null,
             paragraphIdx: paragraphIdx ?? null,
             createdAt: serverTimestamp()
         });
         addCommentProgress();
     } catch (err) {
         console.error(err);
         if (checkIfQuotaError(err)) {
             (window as any).__setQuotaExceeded?.(true);
             alert("Hệ thống đạt giới hạn lưu trữ đám mây hôm nay. Bình luận của bạn chưa thể gửi lên máy chủ, nhưng bạn vẫn có thể đọc truyện bình thường!");
         } else {
             alert("Lỗi khi gửi bình luận!");
         }
     }
  }

  const handleComment = (e: FormEvent) => {
     e.preventDefault();
     if (!commentText.trim()) return;
     submitComment(commentText, 'chapter');
     setCommentText('');
  };

  const handleParagraphComment = (e: FormEvent, idx: number) => {
     e.preventDefault();
     if (!paragraphCommentText.trim()) return;
     submitComment(paragraphCommentText, 'paragraph', idx);
     setParagraphCommentText('');
     setActiveParagraphIndex(null);
  }

  const paragraphs = currentChapter?.content?.split?.('\n')?.filter?.((p: string) => p.trim() !== '') || [];
  const chapterComments = comments.filter(c => c.type === 'chapter');

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleUnlockChapter = () => {
     if (!isLoggedIn) { alert("Vui lòng đăng nhập!"); return; }
     if (spendGoldenChoco(5)) {
         setIsUnlocked(true);
         alert("Đã mở khoá chương truyện thành công!");
     } else {
         alert("Không đủ Gchoco! (Cần 5 Gchoco để mở khoá chương này)");
     }
  };

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;
  if (!story || !currentChapter) return <div className="p-10 text-center">Không tìm thấy chương</div>;

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-300", isDark ? "bg-gray-900 text-gray-300" : "bg-[#FDF6EC] text-[#3E2723]")}>
       {/* Top Navigation */}
       <header className={cn("sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b transition-all duration-300 shadow-sm", 
         isDark ? "bg-gray-900 border-gray-800" : "bg-[#F5E6D3] border-[#D7CCC8]",
         showHeader ? "translate-y-0" : "-translate-y-full"
       )}>
          <div className="flex flex-col">
             <button onClick={() => navigate(`/truyen/${story.id}`)} className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100 flex items-center gap-1 mb-1">
                <ArrowLeft className="w-4 h-4" /> {story.title}
             </button>
             <h1 className="text-lg font-bold">{currentChapter.title}</h1>
          </div>
          <div className="relative flex items-center gap-2">
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-black/5">
                <Settings2 className="w-5 h-5" />
             </button>
             
             {/* Settings Panel */}
             {showSettings && (
                <div className={cn("absolute right-0 top-full mt-2 w-64 p-5 rounded-2xl shadow-xl z-20 border transition-colors", isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D7CCC8]")}>
                   <h3 className="font-bold mb-4 uppercase text-[#3E2723]">Cài đặt</h3>
             <div className="flex flex-col gap-6">
                <div>
                    <label className="text-xs font-bold uppercase mb-3 block text-[#8D6E63]">Màu nền</label>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsDark(false)} className={cn("w-10 h-10 rounded-full bg-[#FDF6EC] border-2", !isDark ? "border-[#3E2723]" : "border-[#D7CCC8]")}></button>
                        <button onClick={() => setIsDark(true)} className={cn("w-10 h-10 rounded-full bg-gray-900 border-2", isDark ? "border-[#D4AF37]" : "border-gray-600")}></button>
                    </div>
                </div>
                <div>
                   <label className="text-xs font-bold uppercase mb-3 block text-[#8D6E63]">Cỡ chữ: {fontSize}px</label>
                   <input type="range" min="14" max="28" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[#3E2723]" />
                </div>
             </div>
          </div>
       )}
       </div>
       </header>

       {/* Content */}
       <main className="flex-1 w-full max-w-3xl mx-auto p-6 sm:p-8 md:p-12">
           {currentChapter.isPasswordProtected && !isUnlocked ? (
              <div className={cn("flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2", isDark ? "border-gray-800 bg-gray-800/50" : "border-[#D4AF37] bg-[#FDF6EC]")}>
                 <Lock className="w-12 h-12 mb-4 text-[#D4AF37] animate-bounce" />
                 <h2 className="text-xl font-bold mb-2 uppercase tracking-tighter">Chương có khoá password</h2>
                 <p className="opacity-70 mb-6 italic text-[#5D4037]">Bạn cần dùng "Vé Pass Truyện" để đọc chương này.</p>
                 <button onClick={handleUnlockChapter} className="bg-[#D4AF37] hover:bg-[#B5952F] text-white px-8 py-3 rounded-full font-bold shadow-md transition-colors border-2 border-white uppercase text-sm tracking-widest flex items-center gap-2">
                    Dùng vé <span className="bg-black/15 px-2.5 py-0.5 rounded-full text-xs">5 Gchoco</span>
                 </button>
              </div>
           ) : (
              <div 
                  className="leading-relaxed text-justify space-y-6 select-none"
                  style={{ fontSize: `${fontSize}px` }}
              >
                 {paragraphs.map((p: string, idx: number) => {
                    const pComments = comments.filter(c => c.type === 'paragraph' && c.paragraphIdx === idx);
                    return (
                        <div key={idx} className="relative group/para">
                           <p className="relative w-full cursor-pointer md:cursor-auto" onClick={() => {
                               if (window.getSelection()?.toString().length === 0) {
                                  setActiveParagraphIndex(activeParagraphIndex === idx ? null : idx);
                               }
                           }}>
                               {p}
                               <button 
                                   onClick={(e) => { e.stopPropagation(); setActiveParagraphIndex(activeParagraphIndex === idx ? null : idx); }} 
                                   className={cn("inline-flex ml-3 items-center justify-center opacity-40 md:opacity-0 md:group-hover/para:opacity-100 transition-opacity hover:opacity-100 hover:text-[#8D6E63] align-baseline", pComments.length > 0 && "opacity-100 md:opacity-100 text-[#8D6E63]")}
                               >
                                  <MessageSquare className="w-[0.8em] h-[0.8em] inline-block -translate-y-[0.15em]" />
                                  {pComments.length > 0 && <span className="text-[0.55em] font-bold ml-1 -translate-y-[0.3em]">{pComments.length}</span>}
                               </button>
                           </p>

                           {activeParagraphIndex === idx && (
                               <div className={cn("mt-4 p-4 rounded-xl shadow-inner border", isDark ? "bg-gray-800/80 border-gray-700" : "bg-[#FDF6EC] border-[#D7CCC8]")}>
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className="text-sm font-bold uppercase tracking-wider text-[#8D6E63]">Bình luận đoạn</h4>
                                       <button onClick={() => setActiveParagraphIndex(null)} className="text-xs uppercase font-bold opacity-50 hover:opacity-100">Đóng</button>
                                   </div>
                                   
                                   <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                       {pComments.length === 0 ? (
                                           <div className="text-center italic text-sm opacity-50 py-2">Chưa có bình luận. Hãy là người đầu tiên!</div>
                                       ) : (
                                           pComments.map(c => (
                                               <div key={c.id} className="flex gap-3">
                                                   <img src={c.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                                   <div>
                                                       <div className="text-xs font-bold mb-0.5 flex items-center gap-1">
                                                           {c.displayName}
                                                           {c.activeTitle && (
                                                               <span className="px-1.5 py-0.5 bg-yellow-100/80 text-yellow-800 text-[8px] font-extrabold rounded-md uppercase tracking-tight select-none border border-yellow-200">
                                                                   🏆 {c.activeTitle}
                                                               </span>
                                                           )}
                                                       </div>
                                                       <div className="text-sm">{c.content}</div>
                                                   </div>
                                               </div>
                                           ))
                                       )}
                                   </div>

                                   {isLoggedIn ? (
                                       <form onSubmit={(e) => handleParagraphComment(e, idx)} className="flex gap-2">
                                           <input 
                                                type="text" 
                                                value={paragraphCommentText} 
                                                onChange={(e) => setParagraphCommentText(e.target.value)} 
                                                placeholder="Viết bình luận..." 
                                                className={cn("flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-[#8D6E63] bg-transparent", isDark ? "border-gray-700" : "border-[#D7CCC8]")}
                                           />
                                           <button type="submit" disabled={!paragraphCommentText.trim()} className="bg-[#8D6E63] text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-[#5D4037] transition-colors">Gửi</button>
                                       </form>
                                   ) : (
                                       <div className="text-xs italic opacity-70 text-center">Đăng nhập để bình luận</div>
                                   )}
                               </div>
                           )}
                        </div>
                    );
                 })}
              </div>
           )}

           {/* Navigation Buttons */}
           <div className="mt-16 mb-8 flex items-center justify-between">
              {prevChapter ? (
                 <button onClick={() => navigate(`/doc/${story.id}/${prevChapter.id}`)} className="flex items-center gap-2 hover:text-[#8D6E63] transition-colors font-bold uppercase tracking-wider text-sm border-b-2 border-transparent hover:border-[#8D6E63] pb-1">
                    <ArrowLeft className="w-5 h-5"/> Chương trước
                 </button>
              ) : <div></div>}
              
              {nextChapter ? (
                 <button onClick={() => navigate(`/doc/${story.id}/${nextChapter.id}`)} className="flex items-center gap-2 hover:text-[#8D6E63] transition-colors font-bold uppercase tracking-wider text-sm border-b-2 border-transparent hover:border-[#8D6E63] pb-1">
                    Chương sau <ArrowRight className="w-5 h-5"/>
                 </button>
              ) : <div className="text-sm opacity-50 uppercase font-bold tracking-widest">Hết truyện</div>}
           </div>
           
           <div className="w-full h-px bg-[#D7CCC8] mb-12"></div>

           {/* Comments Area (Counts for missions) */}
           <div className="mb-12">
               <h3 className="text-xl font-bold mb-6 border-l-4 border-[#3E2723] pl-3 uppercase tracking-tighter">Bình luận chương</h3>
               <form onSubmit={handleComment} className="flex flex-col gap-3 mb-8">
                  <textarea 
                     value={commentText}
                     onChange={(e) => setCommentText(e.target.value)}
                     disabled={!isLoggedIn}
                     placeholder={isLoggedIn ? "Nhập bình luận của bạn..." : "Đăng nhập để bình luận"}
                     className={cn("w-full p-4 rounded-2xl resize-none border-2 outline-none focus:border-[#8D6E63] transition-colors", isDark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D7CCC8] italic")}
                     rows={4}
                  />
                  <div className="flex justify-end">
                     <button type="submit" disabled={!isLoggedIn || !commentText.trim()} className="bg-[#3E2723] text-[#FDF6EC] px-8 py-2.5 rounded-full font-bold hover:bg-[#2D1B19] disabled:opacity-50 transition-colors uppercase text-sm tracking-wider shadow-sm border border-[#8D6E63]">
                        Gửi bình luận
                     </button>
                  </div>
               </form>

               <div className="space-y-6">
                   {chapterComments.length === 0 ? (
                       <p className="text-center italic opacity-50">Chưa có bình luận nào cho chương này.</p>
                   ) : (
                       chapterComments.map(c => (
                           <div key={c.id} className={cn("p-5 rounded-2xl border", isDark ? "bg-gray-800/80 border-gray-700" : "bg-white border-[#D7CCC8] shadow-sm")}>
                               <div className="flex items-center gap-3 mb-3">
                                   <img src={c.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#D7CCC8]" />
                                   <div>
                                       <div className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                                           {c.displayName}
                                           {c.activeTitle && (
                                               <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[8px] font-extrabold rounded-md uppercase tracking-tight select-none border border-yellow-200">
                                                   🏆 {c.activeTitle}
                                               </span>
                                           )}
                                       </div>
                                       <div className="text-[10px] opacity-60 uppercase tracking-widest">{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : 'Vừa xong'}</div>
                                   </div>
                               </div>
                               <div className="text-sm leading-relaxed whitespace-pre-wrap">{c.content}</div>
                           </div>
                       ))
                   )}
               </div>
           </div>
       </main>
    </div>
  )
}

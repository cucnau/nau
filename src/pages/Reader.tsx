import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { UserAvatar } from '../components/UserAvatar';
import { cn } from '../components/Layout';
import { Settings2, ArrowLeft, ArrowRight, List, Lock, Unlock, Zap, MessageSquare, Clock, Pause, CheckCircle } from 'lucide-react';
import { db, checkIfQuotaError } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, where, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { format } from 'date-fns';
import { getWeeklyId } from '../types/achievements';

const ParagraphCommentNode = ({
   comment,
   comments,
   replyingToId,
   setReplyingToId,
   replyText,
   setReplyText,
   submittingReply,
   handleSendReply,
   getTitleColor,
   isLoggedIn,
   isDark,
   depth = 0
}: any) => {
   const replies = comments.filter(r => r.parentId === comment.id).sort((a: any, b: any) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
      return timeA - timeB;
   });

   return (
      <div key={comment.id} className="text-xs pt-1 mt-1 border-t border-dashed border-gray-100 dark:border-[#3C2E27]/30 first:border-0">
         <div className="relative flex gap-2.5 items-start p-2 rounded-xl bg-[#FDF6EC]/40 dark:bg-[#1A1412]/20 border border-[#F5E6D3]/40 dark:border-[#3C2E27]/30">
             {comment.equippedSticker && (
               <img 
                 src={comment.equippedSticker} 
                 alt="Sticker" 
                 className={cn(
                   "absolute w-5 h-5 object-contain pointer-events-none z-10",
                   comment.stickerPosition === 'top-left' && "left-0 top-0 -translate-x-1/4 -translate-y-1/4",
                   comment.stickerPosition === 'top-right' && "right-0 top-0 translate-x-1/4 -translate-y-1/4",
                   comment.stickerPosition === 'bottom-left' && "left-0 bottom-0 -translate-x-1/4 translate-y-1/4",
                   (comment.stickerPosition === 'bottom-right' || !comment.stickerPosition) && "right-0 bottom-0 translate-x-1/4 translate-y-1/4"
                 )} 
               />
             )}
            <UserAvatar 
               avatarUrl={comment.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} 
               equippedAccessory={comment.equippedAccessory}
               accessoryPosition={comment.accessoryPosition}
               className="w-8 h-8 shrink-0 pointer-events-none" 
               fallbackIconSizeClass="w-4 h-4 text-[#A1887F]" 
               borderClass="border border-[#D7CCC8]/30"
            />
            <div className="flex-1 min-w-0">
               <div className="text-[11px] font-bold mb-0.5 flex justify-between tracking-tight" style={{ color: getTitleColor(comment.activeTitle) || undefined }}>
                  <span className="flex items-center gap-1">
                     {comment.displayName}
                     {comment.activeTitle && (
                        <span className="px-1 py-0.5 bg-yellow-101 text-yellow-800 text-[7px] font-extrabold rounded">
                           🏆 {comment.activeTitle}
                        </span>
                     )}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                     {comment.createdAt?.toDate 
                        ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Vừa xong'}
                  </span>
               </div>
               <p className={cn("text-xs leading-relaxed text-justify break-words", isDark ? "text-[#ECE5DC]" : "text-gray-700")}>
                  {comment.content}
               </p>
               
               {isLoggedIn && (
                  <button 
                     type="button"
                     onClick={() => {
                        if (replyingToId === comment.id) {
                           setReplyingToId(null);
                        } else {
                           setReplyingToId(comment.id);
                           setReplyText('');
                        }
                     }}
                     className="text-[10px] text-[#8D6E63] hover:text-[#5D4037] font-extrabold block mt-1"
                  >
                     Trả lời
                  </button>
               )}

               {replyingToId === comment.id && (
                  <div className="mt-2 flex gap-2">
                     <input 
                        type="text" 
                        placeholder={`Trả lời ${comment.displayName}...`}
                        value={replyText}
                        disabled={submittingReply}
                        onChange={(e) => setReplyText(e.target.value)}
                        className={cn("flex-1 px-2.5 py-1 text-xs rounded-lg border focus:outline-none focus:border-[#8D6E63] bg-transparent", isDark ? "border-[#3C2E27] text-[#ECE5DC]" : "border-[#D7CCC8] dark:border-[#D7CCC8] text-[#3E2723] dark:text-[#3E2723]")}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              e.preventDefault();
                              if (replyText.trim() && !submittingReply) {
                                 handleSendReply(comment);
                              }
                           }
                        }}
                     />
                     <button 
                        type="button"
                        onClick={() => handleSendReply(comment)}
                        disabled={submittingReply || !replyText.trim()}
                        className="bg-[#8D6E63] text-white px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors hover:bg-[#5D4037] disabled:opacity-50"
                     >
                        Gửi
                     </button>
                  </div>
               )}
            </div>
         </div>

         {replies.length > 0 && (
            <div className={cn(
               "mt-2 pl-4 space-y-2 border-l border-[#D7CCC8]/40",
               depth > 4 ? "pl-1 border-0" : ""
            )}>
               {replies.map(r => (
                  <ParagraphCommentNode
                     key={r.id}
                     comment={r}
                     comments={comments}
                     replyingToId={replyingToId}
                     setReplyingToId={setReplyingToId}
                     replyText={replyText}
                     setReplyText={setReplyText}
                     submittingReply={submittingReply}
                     handleSendReply={handleSendReply}
                     getTitleColor={getTitleColor}
                     isLoggedIn={isLoggedIn}
                     isDark={isDark}
                     depth={depth + 1}
                  />
               ))}
            </div>
         )}
      </div>
   );
};

const ChapterCommentNode = ({
   comment,
   comments,
   replyingToId,
   setReplyingToId,
   replyText,
   setReplyText,
   submittingReply,
   handleSendReply,
   getTitleColor,
   isLoggedIn,
   isDark,
   depth = 0
}: any) => {
   const replies = comments.filter(r => r.parentId === comment.id).sort((a: any, b: any) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
      return timeA - timeB;
   });

   return (
      <div key={comment.id} className={cn("relative p-4 rounded-2xl border flex flex-col gap-2 shadow-xs transition-colors", isDark ? "bg-[#211B18]/40 border-[#3C2E27]" : "bg-white border-[#F5E6D3]/60 hover:border-[#D7CCC8]/50")}>
         {comment.equippedSticker && (
           <img 
             src={comment.equippedSticker} 
             alt="Sticker" 
             className={cn(
               "absolute w-8 h-8 object-contain pointer-events-none z-10",
               comment.stickerPosition === 'top-left' && "left-0 top-0 -translate-x-1/4 -translate-y-1/4",
               comment.stickerPosition === 'top-right' && "right-0 top-0 translate-x-1/4 -translate-y-1/4",
               comment.stickerPosition === 'bottom-left' && "left-0 bottom-0 -translate-x-1/4 translate-y-1/4",
               (comment.stickerPosition === 'bottom-right' || !comment.stickerPosition) && "right-0 bottom-0 translate-x-1/4 translate-y-1/4"
             )} 
           />
         )}
         <div className="flex gap-3.5">
            <UserAvatar 
               avatarUrl={comment.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} 
               equippedAccessory={comment.equippedAccessory}
               accessoryPosition={comment.accessoryPosition}
               className="w-10 h-10 shrink-0 pointer-events-none" 
               fallbackIconSizeClass="w-5 h-5 text-[#A1887F]" 
               borderClass="border border-[#D7CCC8]/30"
            />
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: getTitleColor(comment.activeTitle) || undefined }}>
                     {comment.displayName}
                     {comment.activeTitle && (
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-850 text-[9px] font-black rounded uppercase tracking-tight select-none border border-yellow-200 inline-block align-middle">
                           🏆 {comment.activeTitle}
                        </span>
                     )}
                  </span>
                  
                  <span className="text-[9px] text-gray-400 font-mono shrink-0">
                     {comment.createdAt?.toDate 
                        ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Vừa xong'}
                  </span>
               </div>
               <p className={cn("text-xs leading-relaxed text-justify break-words", isDark ? "text-[#ECE5DC]" : "text-gray-700")}>
                  {comment.content}
               </p>

               {/* Reply panel button */}
               {isLoggedIn && (
                  <div className="flex items-center gap-4 mt-2">
                     <button 
                        onClick={() => {
                           if (replyingToId === comment.id) {
                              setReplyingToId(null);
                           } else {
                              setReplyingToId(comment.id);
                              setReplyText('');
                           }
                        }}
                        className="text-xs text-[#8D6E63] hover:text-[#5D4037] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                     >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Trả lời
                     </button>
                  </div>
               )}

               {/* Dynamic inline reply input */}
               {replyingToId === comment.id && (
                  <div className="mt-3 flex gap-2 animate-fade-in pl-1">
                     <input 
                        type="text"
                        placeholder={`Trả lời bình luận của ${comment.displayName}...`}
                        value={replyText}
                        disabled={submittingReply}
                        onChange={(e) => setReplyText(e.target.value)}
                        className={cn("flex-1 px-3.5 py-1.5 placeholder-gray-400 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#8D6E63] focus:border-[#8D6E63]", isDark ? "border-[#3C2E27] text-[#ECE5DC] bg-transparent" : "bg-[#FDF6EC] border-[#D7CCC8]/80 text-[#3E2723]")}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              e.preventDefault();
                              if (replyText.trim() && !submittingReply) {
                                 handleSendReply(comment);
                              }
                           }
                        }}
                     />
                     <button 
                        onClick={() => handleSendReply(comment)}
                        disabled={submittingReply || !replyText.trim()}
                        className={cn("px-4 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:bg-gray-300 disabled:text-gray-400", isDark ? "bg-[#3C2E27] hover:bg-[#5D4037] text-white" : "bg-[#3E2723] dark:bg-[#3E2723] hover:bg-[#2D1B19] dark:hover:bg-[#2D1B19] text-[#FDF6EC] dark:text-[#FDF6EC]")}
                     >
                        Gửi
                     </button>
                  </div>
               )}
            </div>
         </div>

         {replies.length > 0 && (
            <div className={cn(
               "pl-4 space-y-3 border-l-2 border-[#D7CCC8]/40 mt-1",
               depth > 4 ? "pl-1 border-0" : ""
            )}>
               {replies.map(r => (
                  <ChapterCommentNode
                     key={r.id}
                     comment={r}
                     comments={comments}
                     replyingToId={replyingToId}
                     setReplyingToId={setReplyingToId}
                     replyText={replyText}
                     setReplyText={setReplyText}
                     submittingReply={submittingReply}
                     handleSendReply={handleSendReply}
                     getTitleColor={getTitleColor}
                     isLoggedIn={isLoggedIn}
                     isDark={isDark}
                     depth={depth + 1}
                  />
               ))}
            </div>
         )}
      </div>
   );
};

export function Reader() {
  const { storyId, chapterId } = useParams();
  const navigate = useNavigate();
  const { 
    markStoryRead, isLoggedIn, addCommentProgress, uid, displayName, avatarUrl, 
    unlockedPassChapters, unlockedEarlyAccessChapters, consumePassTicket, consumePriorityTicket,
    ownedPassTickets, ownedPriorityTickets, setStoreOpen, getTitleColor, theme
  } = useStore();
  
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('reader-font-family') || 'font-reading-nunito';
  });
  const [isDark, setIsDark] = useState(theme === 'dark');

  useEffect(() => {
    localStorage.setItem('reader-font-family', fontFamily);
  }, [fontFamily]);
  const [commentText, setCommentText] = useState('');
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null);
  const [paragraphCommentText, setParagraphCommentText] = useState('');
  const [isPassUnlockedLocal, setIsPassUnlockedLocal] = useState(false);
  const [isEarlyAccessUnlockedLocal, setIsEarlyAccessUnlockedLocal] = useState(false);
  
  // Trả lời bình luận chương
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  
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

  // Active reading clock state
  const [secondsRead, setSecondsRead] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    setIsPassUnlockedLocal(false);
    setIsEarlyAccessUnlockedLocal(false);
    setSecondsRead(0);
    setIsFinished(false);
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    window.scrollTo(0, 0);
  }, [chapterId]);

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
             createdAt: serverTimestamp(),
             equippedSticker: useStore.getState().equippedStickerComment || null,
            stickerPosition: useStore.getState().stickerPositionComment || 'top-right',
            equippedAccessory: useStore.getState().equippedAccessory || null,
            accessoryPosition: useStore.getState().accessoryPosition || null
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

  const handleSendReply = async (parentComment: any) => {
     if (!isLoggedIn) {
        alert("Bạn cần đăng nhập để trả lời bình luận!");
        return;
     }
     if (!replyText.trim()) return;
     setSubmittingReply(true);
     try {
        await addDoc(collection(db, 'comments'), {
           targetId: currentChapter.id,
           uid,
           displayName: displayName || 'Nhà lữ hành ẩn danh',
           avatarUrl: avatarUrl || '',
           content: replyText.trim(),
           type: 'comment_reply',
           replyToUser: parentComment.displayName || null,
           parentId: parentComment.id,
           activeTitle: useStore.getState().activeTitle || null,
           giftAmount: 0,
           paragraphIdx: parentComment.paragraphIdx !== undefined ? parentComment.paragraphIdx : null,
            equippedSticker: useStore.getState().equippedStickerComment || null,
            stickerPosition: useStore.getState().stickerPositionComment || 'top-right',
            equippedAccessory: useStore.getState().equippedAccessory || null,
            accessoryPosition: useStore.getState().accessoryPosition || null,
           createdAt: serverTimestamp()
        });

        if (parentComment.uid && parentComment.uid !== uid) {
           await addDoc(collection(db, 'notifications'), {
              userId: parentComment.uid,
              storyId: storyId,
              chapterId: currentChapter.id,
              storyTitle: story?.title || 'Truyện',
              chapterTitle: currentChapter?.title || 'Chương',
              replierName: displayName || 'Nhà lữ hành ẩn danh',
              isRead: false,
              createdAt: Date.now(),
              type: 'comment_reply'
           });
        }

        setReplyText('');
        setReplyingToId(null);
     } catch (err) {
        console.error(err);
        if (checkIfQuotaError(err)) {
           alert("Hệ thống đạt giới hạn lưu trữ đám mây hôm nay.");
        } else {
           alert("Gặp sự cố khi trả lời bình luận.");
        }
     } finally {
        setSubmittingReply(false);
     }
  };

  const paragraphs = currentChapter?.content?.split?.('\n')?.filter?.((p: string) => p.trim() !== '') || [];
  const chapterComments = comments.filter(c => c.type === 'chapter' && !c.parentId);

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

  const handleUnlockPass = () => {
     if (!isLoggedIn) { alert("Vui lòng đăng nhập!"); return; }
     if (consumePassTicket(currentChapter.id)) {
         setIsPassUnlockedLocal(true);
         alert("Đã mở khoá chương bằng Vé Pass Truyện!");
     } else {
         alert("Bạn không đủ Vé Pass Truyện. Hãy mua thêm trong Cửa Hàng.");
         setStoreOpen(true);
     }
  };

  const handleUnlockEarlyAccess = () => {
     if (!isLoggedIn) { alert("Vui lòng đăng nhập!"); return; }
     if (consumePriorityTicket(currentChapter.id)) {
         setIsEarlyAccessUnlockedLocal(true);
         alert("Đã mở khoá chương bằng Vé Ưu Tiên!");
     } else {
         alert("Bạn không đủ Vé Ưu Tiên. Hãy mua thêm trong Cửa Hàng.");
         setStoreOpen(true);
     }
  };

  const isPassRequired = currentChapter?.requiresPass;
  const hasPassUnlocked = isPassRequired && (unlockedPassChapters || []).includes(currentChapter?.id);
  const needsPass = isPassRequired && !hasPassUnlocked && !isPassUnlockedLocal;

  const isEarlyAccess = currentChapter?.requiresEarlyAccess;
  const chapTime = currentChapter?.createdAt?.toMillis ? currentChapter.createdAt.toMillis() : (typeof currentChapter?.createdAt === 'number' ? currentChapter.createdAt : 0);
  const isStillEarlyAccess = isEarlyAccess && (Date.now() - (chapTime || 0) < 24 * 60 * 60 * 1000);
  const hasEarlyAccessUnlocked = isEarlyAccess && (unlockedEarlyAccessChapters || []).includes(currentChapter?.id);
  const needsEarlyAccess = isStillEarlyAccess && !hasEarlyAccessUnlocked && !isEarlyAccessUnlockedLocal;

  const isLocked = !!(needsPass || needsEarlyAccess);

  // Split into words to get Vietnamese word count
  const wordCount = currentChapter?.content ? currentChapter.content.split(/\s+/).filter(Boolean).length : 0;
  // Calculate average reading speed: 4 words per second (240 words/min).
  // Clamp between 15 seconds (minimum) and 90 seconds (maximum) to prevent boredom but fully block immediate spam.
  const timeRequired = Math.max(15, Math.min(90, Math.ceil(wordCount / 4)));

  const handleReadingFinished = () => {
    if (storyId && currentChapter) {
       const todayStr = format(new Date(), 'yyyy-MM-dd');
       const weekId = getWeeklyId();
       // Increment firebase view count
       updateDoc(doc(db, 'stories', storyId), { 
         viewCount: increment(1),
         [`dailyViews.${todayStr}`]: increment(1),
         [`weeklyViews.${weekId}`]: increment(1)
       }).catch((err) => {
         console.error('Error auto-incrementing view count:', err);
         if (checkIfQuotaError(err)) {
           (window as any).__setQuotaExceeded?.(true);
         }
       });

       // Mark story read to update active daily reading missions & stats
       if (isLoggedIn) {
          markStoryRead(storyId!, currentChapter.order, story?.genres);
       }
    }
  };

  // Track User Activity (resets idle status when user scrolls, touches, clicks, or moves mouse)
  useEffect(() => {
    if (isLocked || !currentChapter) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(false);
    };

    window.addEventListener('scroll', updateActivity, { passive: true });
    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('mousedown', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });
    window.addEventListener('touchmove', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('touchmove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [chapterId, isLocked, currentChapter?.id]);

  // Handle active reading timer
  useEffect(() => {
    if (isFinished || isLocked || !currentChapter) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastActivityRef.current;
      // If idle for over 6 seconds, pause countdown
      if (diff > 6000) {
        setIsIdle(true);
      } else {
        setIsIdle(false);
        setSecondsRead((prev) => {
          const next = prev + 1;
          if (next >= timeRequired) {
            setIsFinished(true);
            handleReadingFinished();
            clearInterval(interval);
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished, isLocked, timeRequired, currentChapter?.id]);

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;
  if (!story || !currentChapter) return <div className="p-10 text-center">Không tìm thấy chương</div>;

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-300", isDark ? "bg-[#1A1412] text-[#ECE5DC]" : "bg-[#FDF6EC] dark:bg-[#FDF6EC] text-[#3E2723] dark:text-[#3E2723]")}>
       {/* Top Navigation */}
       <header className={cn("sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b transition-all duration-300 shadow-sm", 
         isDark ? "bg-[#1A1412] border-[#3C2E27]" : "bg-[#F5E6D3] dark:bg-[#F5E6D3] border-[#D7CCC8] dark:border-[#D7CCC8]",
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
                <div className={cn("absolute right-0 top-full mt-2 w-64 p-5 rounded-2xl shadow-xl z-20 border transition-colors", isDark ? "bg-[#2C221D] border-[#3C2E27]" : "bg-white dark:bg-white border-[#D7CCC8] dark:border-[#D7CCC8]")}>
                   <h3 className={cn("font-bold mb-4 uppercase", isDark ? "text-[#ECE5DC]" : "text-[#3E2723] dark:text-[#3E2723]")}>Cài đặt</h3>
             <div className="flex flex-col gap-6">
                <div>
                    <label className={cn("text-xs font-bold uppercase mb-3 block", isDark ? "text-[#D7CCC8]" : "text-[#8D6E63] dark:text-[#8D6E63]")}>Màu nền</label>
                                        <div className="flex items-center gap-3">
                        <button onClick={() => setIsDark(false)} style={{ backgroundColor: '#FDF6EC' }} className={cn("w-10 h-10 rounded-full border-2", !isDark ? "border-[#3E2723]" : "border-[#D7CCC8]")}></button>
                        <button onClick={() => setIsDark(true)} style={{ backgroundColor: '#1A1412' }} className={cn("w-10 h-10 rounded-full border-2", isDark ? "border-[#D4AF37]" : "border-[#3C2E27]")}></button>
                    </div>
                </div>
                <div>
                   <label className={cn("text-xs font-bold uppercase mb-3 block", isDark ? "text-[#D7CCC8]" : "text-[#8D6E63] dark:text-[#8D6E63]")}>Cỡ chữ: {fontSize}px</label>
                   <input type="range" min="14" max="28" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[#3E2723]" />
                 </div>
                 <div>
                    <label className={cn("text-xs font-bold uppercase mb-3 block", isDark ? "text-[#D7CCC8]" : "text-[#8D6E63] dark:text-[#8D6E63]")}>Phông chữ</label>
                    <select 
                      value={fontFamily} 
                      onChange={(e) => setFontFamily(e.target.value)} 
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors",
                        isDark 
                          ? "bg-[#211B18] text-[#ECE5DC] border-[#3C2E27] focus:border-[#D4AF37]" 
                          : "bg-white text-[#3E2723] border-[#D7CCC8] dark:border-[#D7CCC8] dark:bg-white dark:text-[#3E2723] focus:border-[#8D6E63]"
                      )}
                    >
                      <option value="font-reading-nunito" className="font-reading-nunito">Nunito (Mặc định)</option>
                      <option value="font-reading-garamond" className="font-reading-garamond">EB Garamond</option>
                      <option value="font-reading-roboto" className="font-reading-roboto">Roboto</option>
                      <option value="font-reading-patrick" className="font-reading-patrick">Patrick Hand</option>
                      <option value="font-reading-iosevka" className="font-reading-iosevka">Iosevka Charon</option>
                      <option value="font-reading-notoserif" className="font-reading-notoserif">Noto Serif</option>
                    </select>
                </div>
             </div>
          </div>
       )}
       </div>
       </header>

       {/* Content */}
       <main className="flex-1 w-full max-w-3xl mx-auto p-6 sm:p-8 md:p-12">
           {isLocked ? (
              <div className="flex flex-col gap-6">
                  {needsPass && (
                    <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-3xl border-2", isDark ? "border-[#3C2E27] bg-[#2C221D]/50" : "border-[#8D6E63] dark:border-[#8D6E63] bg-[#FDF6EC] dark:bg-[#FDF6EC]")}>
                       <Lock className={cn("w-12 h-12 mb-4 animate-bounce", isDark ? "text-[#D7CCC8]" : "text-[#8D6E63] dark:text-[#8D6E63]")} />
                       <h2 className={cn("text-xl font-bold mb-2 uppercase tracking-tighter", isDark ? "text-[#ECE5DC]" : "text-[#3E2723] dark:text-[#3E2723]")}>Chương có khoá Pass</h2>
                       <p className={cn("opacity-70 mb-4 italic", isDark ? "text-[#A1887F]" : "text-[#5D4037] dark:text-[#5D4037]")}>Bạn cần dùng "Vé Pass Truyện" để đọc vĩnh viễn chương này.</p>
                       <p className={cn("text-sm font-bold mb-6", isDark ? "text-[#ECE5DC]" : "text-[#3E2723] dark:text-[#3E2723]")}>Bạn đang có: {ownedPassTickets || 0} Vé</p>
                       <button onClick={handleUnlockPass} className="bg-[#3E2723] hover:bg-[#2D1B19] text-white px-8 py-3 rounded-full font-bold shadow-md transition-colors uppercase text-sm tracking-widest flex items-center gap-2">
                          Mở khoá bằng 1 Vé Pass
                       </button>
                    </div>
                  )}

                  {needsEarlyAccess && (
                    <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-3xl border-2", isDark ? "border-[#D4AF37] bg-[#2C221D]/50" : "border-[#D4AF37] dark:border-[#D4AF37] bg-[#FFFDE7] dark:bg-[#FFFDE7]")}>
                       <Zap className="w-12 h-12 mb-4 text-[#D4AF37] animate-pulse fill-yellow-100" />
                       <h2 className="text-xl font-bold mb-2 uppercase tracking-tighter text-[#827717]">Chương Đọc Sớm</h2>
                       <p className="opacity-70 mb-4 italic text-[#827717]">Bạn cần dùng "Vé Ưu Tiên" để đọc ngay, hoặc chờ hết 24h.</p>
                       <p className="text-sm font-bold mb-6 text-[#827717]">Bạn đang có: {ownedPriorityTickets || 0} Vé</p>
                       <button onClick={handleUnlockEarlyAccess} className="bg-[#D4AF37] hover:bg-[#B5952F] text-white px-8 py-3 rounded-full font-bold shadow-md transition-colors uppercase text-sm tracking-widest flex items-center gap-2">
                          Mở khoá bằng 1 Vé Ưu Tiên
                       </button>
                    </div>
                  )}
              </div>
           ) : (
              <div 
                  className={cn("leading-relaxed text-justify space-y-6 select-none", fontFamily)}
                  style={{ fontSize: `${fontSize}px` }}
              >
                 {paragraphs.map((p: string, idx: number) => {
                    const pComments = comments.filter(c => c.type === 'paragraph' && c.paragraphIdx === idx && !c.parentId);
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
                               <div className={cn("mt-4 p-4 rounded-xl shadow-inner border", isDark ? "bg-[#2C221D]/80 border-[#3C2E27]" : "bg-[#FDF6EC] dark:bg-[#FDF6EC] border-[#D7CCC8] dark:border-[#D7CCC8]")}>
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className={cn("text-sm font-bold uppercase tracking-wider", isDark ? "text-[#D7CCC8]" : "text-[#8D6E63] dark:text-[#8D6E63]")}>Bình luận đoạn</h4>
                                       <button onClick={() => setActiveParagraphIndex(null)} className="text-xs uppercase font-bold opacity-50 hover:opacity-100">Đóng</button>
                                   </div>
                                   
                                   <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                       {pComments.length === 0 ? (
                                           <div className="text-center italic text-sm opacity-50 py-2">Chưa có bình luận. Hãy là người đầu tiên!</div>
                                       ) : (
                                           pComments.map(c => { return <ParagraphCommentNode key={c.id} comment={c} comments={comments} replyingToId={replyingToId} setReplyingToId={setReplyingToId} replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} handleSendReply={handleSendReply} getTitleColor={getTitleColor} isLoggedIn={isLoggedIn} isDark={isDark} />; if (false) { return (
                                               <div key={c.id} className="flex flex-col gap-1 w-full border-b border-gray-100/15 pb-3 last:border-0 last:pb-0">
                                                   <div className="flex gap-3">
                                                       <img src={c.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="hidden" />
                                                        <div className="w-8 h-8 shrink-0 relative bg-gray-200 rounded-full">
                                                            <img src={c.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="w-full h-full rounded-full object-cover" />
                                                            {c.equippedSticker && (
                                                                <img 
                                                                    src={c.equippedSticker} 
                                                                    alt="Sticker" 
                                                                    className={cn(
                                                                        "absolute w-3.5 h-3.5 object-contain pointer-events-none z-10",
                                                                        c.stickerPosition === 'top-left' && "left-0 top-0 -translate-x-1/4 -translate-y-1/4",
                                                                        c.stickerPosition === 'top-right' && "right-0 top-0 translate-x-1/4 -translate-y-1/4",
                                                                        c.stickerPosition === 'bottom-left' && "left-0 bottom-0 -translate-x-1/4 translate-y-1/4",
                                                                        (c.stickerPosition === 'bottom-right' || !c.stickerPosition) && "right-0 bottom-0 translate-x-1/4 translate-y-1/4"
                                                                    )} 
                                                                />
                                                            )}
                                                        </div>
                                                       <div className="flex-1 min-w-0">
                                                           <div className="text-xs font-bold mb-0.5 flex items-center gap-1" style={{ color: getTitleColor(c.activeTitle) || undefined }}>
                                                               {c.displayName}
                                                               {c.activeTitle && (
                                                                   <span className="px-1.5 py-0.5 bg-yellow-100/80 text-yellow-800 text-[8px] font-extrabold rounded-md uppercase tracking-tight select-none border border-yellow-200">
                                                                       🏆 {c.activeTitle}
                                                                   </span>
                                                               )}
                                                           </div>
                                                           <div className="text-sm break-words">{c.content}</div>
                                                           
                                                           {isLoggedIn && (
                                                              <button 
                                                                 type="button"
                                                                 onClick={() => {
                                                                    if (replyingToId === c.id) {
                                                                       setReplyingToId(null);
                                                                    } else {
                                                                       setReplyingToId(c.id);
                                                                       setReplyText('');
                                                                    }
                                                                 }}
                                                                 className={cn("text-xs mt-1 font-bold block hover:underline", isDark ? "text-[#D7CCC8] hover:text-white" : "text-[#8D6E63] dark:text-[#8D6E63] hover:text-[#5D4037] dark:hover:text-[#5D4037]")}
                                                              >
                                                                 Trả lời
                                                              </button>
                                                           )}
                                                       </div>
                                                   </div>

                                                   {/* Input trả lời */}
                                                   {replyingToId === c.id && (
                                                      <div className="mt-2 pl-11 flex gap-2">
                                                         <input 
                                                            type="text" 
                                                            placeholder={`Trả lời ${c.displayName}...`}
                                                            value={replyText}
                                                            disabled={submittingReply}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            className={cn("flex-1 px-2.5 py-1 text-xs rounded-lg border focus:outline-none focus:border-[#8D6E63] bg-transparent", isDark ? "border-[#3C2E27] text-[#ECE5DC]" : "border-[#D7CCC8] dark:border-[#D7CCC8] text-[#3E2723] dark:text-[#3E2723]")}
                                                            onKeyDown={(e) => {
                                                               if (e.key === 'Enter') {
                                                                  e.preventDefault();
                                                                  if (replyText.trim() && !submittingReply) {
                                                                     handleSendReply(c);
                                                                  }
                                                               }
                                                            }}
                                                         />
                                                         <button 
                                                            type="button"
                                                            onClick={() => handleSendReply(c)}
                                                            disabled={submittingReply || !replyText.trim()}
                                                            className="bg-[#8D6E63] text-white px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors hover:bg-[#5D4037] disabled:opacity-50"
                                                         >
                                                            Gửi
                                                         </button>
                                                      </div>
                                                   )}

                                                   {/* Các phản hồi lồng nhau */}
                                                   {(() => {
                                                      const subReplies = comments.filter(r => r.parentId === c.id).sort((a: any, b: any) => {
                                                         const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
                                                         const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
                                                         return timeA - timeB;
                                                      });
                                                      if (subReplies.length === 0) return null;
                                                      return (
                                                         <div className="mt-2 pl-11 space-y-2 border-l border-[#D7CCC8]/40">
                                                            {subReplies.map(reply => (
                                                               <div key={reply.id} className={cn("flex gap-2 p-2 rounded-lg", isDark ? "bg-[#2C221D]/40" : "bg-gray-50/50 dark:bg-gray-50/50")}>
                                                                  <img src={reply.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                                                  <div className="flex-1 min-w-0">
                                                                     <div className="text-[11px] font-bold mb-0.5 flex items-center gap-1" style={{ color: getTitleColor(reply.activeTitle) || undefined }}>
                                                                        {reply.displayName}
                                                                        {reply.activeTitle && (
                                                                           <span className="px-1 py-0.5 bg-yellow-100 text-yellow-850 text-[7px] font-extrabold rounded">
                                                                              🏆 {reply.activeTitle}
                                                                           </span>
                                                                        )}
                                                                     </div>
                                                                     <div className="text-xs text-gray-700 break-words">{reply.content}</div>
                                                                  </div>
                                                               </div>
                                                            ))}
                                                         </div>
                                                      );
                                                   })()}
                                                </div>
                                           )}})
                                       )}
                                   </div>

                                   {isLoggedIn ? (
                                       <form onSubmit={(e) => handleParagraphComment(e, idx)} className="flex gap-2">
                                           <input 
                                                type="text" 
                                                value={paragraphCommentText} 
                                                onChange={(e) => setParagraphCommentText(e.target.value)} 
                                                placeholder="Viết bình luận..." 
                                                className={cn("flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-[#8D6E63] bg-transparent", isDark ? "border-[#3C2E27]" : "border-[#D7CCC8] dark:border-[#D7CCC8]")}
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
                 <button onClick={() => navigate(`/doc/${story.id}/${prevChapter.id}`)} className={cn("flex items-center gap-2 transition-colors font-bold uppercase tracking-wider text-sm border-b-2 border-transparent pb-1", isDark ? "hover:text-[#ECE5DC] hover:border-[#ECE5DC]" : "hover:text-[#8D6E63] dark:hover:text-[#8D6E63] hover:border-[#8D6E63] dark:hover:border-[#8D6E63]")}>
                    <ArrowLeft className="w-5 h-5"/> Chương trước
                 </button>
              ) : <div></div>}
              
              {nextChapter ? (
                 <button onClick={() => navigate(`/doc/${story.id}/${nextChapter.id}`)} className={cn("flex items-center gap-2 transition-colors font-bold uppercase tracking-wider text-sm border-b-2 border-transparent pb-1", isDark ? "hover:text-[#ECE5DC] hover:border-[#ECE5DC]" : "hover:text-[#8D6E63] dark:hover:text-[#8D6E63] hover:border-[#8D6E63] dark:hover:border-[#8D6E63]")}>
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
                     className={cn("w-full p-4 rounded-2xl resize-none border-2 outline-none focus:border-[#8D6E63] transition-colors", isDark ? "bg-[#2C221D] border-[#3C2E27]" : "bg-white dark:bg-white border-[#D7CCC8] dark:border-[#D7CCC8] italic")}
                     rows={4}
                  />
                  <div className="flex justify-end">
                     <button type="submit" disabled={!isLoggedIn || !commentText.trim()} className={cn("px-8 py-2.5 rounded-full font-bold disabled:opacity-50 transition-colors uppercase text-sm tracking-wider shadow-sm border", isDark ? "bg-[#3C2E27] text-[#ECE5DC] hover:bg-[#5D4037] border-[#8D6E63]" : "bg-[#3E2723] dark:bg-[#3E2723] text-[#FDF6EC] dark:text-[#FDF6EC] hover:bg-[#2D1B19]  border-[#8D6E63] dark:border-[#8D6E63]")}>
                        Gửi bình luận
                     </button>
                  </div>
               </form>

               <div className="space-y-6">
                   {chapterComments.length === 0 ? (
                       <p className="text-center italic opacity-50">Chưa có bình luận nào cho chương này.</p>
                   ) : (
                       chapterComments.map(c => { return <ChapterCommentNode key={c.id} comment={c} comments={comments} replyingToId={replyingToId} setReplyingToId={setReplyingToId} replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} handleSendReply={handleSendReply} getTitleColor={getTitleColor} isLoggedIn={isLoggedIn} isDark={isDark} />; if (false) { return (
                           <div key={c.id} className={cn("p-5 rounded-2xl border relative overflow-visible", isDark ? "bg-[#2C221D]/80 border-[#3C2E27]" : "bg-white dark:bg-white border-[#D7CCC8] dark:border-[#D7CCC8] shadow-sm pr-8")}>
                               {c.equippedSticker && (
                                   <img 
                                       src={c.equippedSticker} 
                                       alt="Decor sticker" 
                                       className="absolute right-3 bottom-3 w-8 h-8 object-contain pointer-events-none hover:scale-125 transition-transform animate-bounce [animation-duration:4s] z-10" 
                                   />
                               )}
                               <div className="flex items-center gap-3 mb-3">
                                   <div className="w-10 h-10 shrink-0 relative">
                                       <img src={c.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="w-full h-full rounded-full object-cover border border-[#D7CCC8]" />
                                   </div>
                                   <div>
                                       <div className="font-bold text-sm tracking-wide flex items-center gap-1.5" style={{ color: getTitleColor(c.activeTitle) || undefined }}>
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
                               <div className="text-sm leading-relaxed whitespace-pre-wrap text-justify">{c.content}</div>

                               {/* Phản hồi bình luận chương */}
                               {isLoggedIn && (
                                    <div className="flex items-center gap-4 border-t border-dashed border-[#D7CCC8]/40 pt-2">
                                       <button 
                                          type="button"
                                          onClick={() => {
                                             if (replyingToId === c.id) {
                                                setReplyingToId(null);
                                             } else {
                                                setReplyingToId(c.id);
                                                setReplyText('');
                                             }
                                          }}
                                          className={cn("text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors", isDark ? "text-[#D7CCC8] hover:text-white" : "text-[#8D6E63] dark:text-[#8D6E63] hover:text-[#5D4037] dark:hover:text-[#5D4037]")}
                                       >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          Trả lời
                                       </button>
                                    </div>
                                )}

                               {/* Khung nhập phản hồi inline */}
                               {replyingToId === c.id && (
                                    <div className="mt-1 flex gap-2 pl-1.5">
                                       <input 
                                          type="text"
                                          placeholder={`Trả lời bình luận của ${c.displayName}...`}
                                          value={replyText}
                                          disabled={submittingReply}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          className={cn("flex-1 px-3 py-1.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#8D6E63]", isDark ? "bg-[#1A1412] border-[#3C2E27] text-[#ECE5DC] focus:border-[#8D6E63]" : "bg-[#FDF6EC] dark:bg-[#FDF6EC] border-[#D7CCC8]/80 dark:border-[#D7CCC8]/80 text-[#3E2723] dark:text-[#3E2723] focus:border-[#8D6E63]")}
                                          onKeyDown={(e) => {
                                             if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (replyText.trim() && !submittingReply) {
                                                   handleSendReply(c);
                                                }
                                             }
                                          }}
                                       />
                                       <button 
                                          type="button"
                                          onClick={() => handleSendReply(c)}
                                          disabled={submittingReply || !replyText.trim()}
                                          className={cn("disabled:bg-gray-300 disabled:text-gray-400 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors", isDark ? "bg-[#3C2E27] hover:bg-[#5D4037] text-white" : "bg-[#3E2723] dark:bg-[#3E2723] hover:bg-[#2D1B19] dark:hover:bg-[#2D1B19] text-[#FDF6EC] dark:text-[#FDF6EC]")}
                                       >
                                          Gửi
                                       </button>
                                       <button 
                                          type="button"
                                          onClick={() => setReplyingToId(null)}
                                          className="text-gray-400 hover:text-gray-500 border border-gray-200 px-2 rounded-xl text-xs"
                                       >
                                          Hủy
                                       </button>
                                    </div>
                                )}

                               {/* Danh sách các phản hồi phụ lồng lùi lề */}
                               {(() => {
                                    const replies = comments.filter(r => r.parentId === c.id).sort((a: any, b: any) => {
                                       const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0));
                                       const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0));
                                       return timeA - timeB;
                                    });
                                    if (replies.length === 0) return null;
                                    return (
                                       <div className="mt-2 pl-3.5 border-l-2 border-[#D7CCC8]/40 space-y-3">
                                          {replies.map((reply: any) => (
                                             <div key={reply.id} className={cn("flex gap-2.5 items-start p-3 rounded-xl border", isDark ? "bg-[#1A1412]/40 border-[#3C2E27]" : "bg-gray-50/40 dark:bg-gray-50/40 border-gray-100 dark:border-gray-100")}>
                                                <img src={reply.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200" referrerPolicy="no-referrer" />
                                                <div className="flex-1 min-w-0">
                                                   <div className="flex items-center justify-between gap-2 mb-0.5">
                                                      <span className="font-bold text-xs" style={{ color: getTitleColor(reply.activeTitle) || undefined }}>
                                                         {reply.displayName}
                                                         {reply.activeTitle && (
                                                            <span className="px-1 py-0.5 bg-yellow-101 text-yellow-800 text-[8px] font-black rounded uppercase ml-1 shadow-sm border border-yellow-250 inline-block align-middle">
                                                               🏆 {reply.activeTitle}
                                                            </span>
                                                         )}
                                                      </span>
                                                      <span className="text-[9px] text-gray-400 font-mono">
                                                         {reply.createdAt?.toDate 
                                                            ? new Date(reply.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                                                            : 'Vừa xong'}
                                                      </span>
                                                   </div>
                                                   <p className="text-xs text-gray-700 break-words leading-relaxed text-justify">
                                                      {reply.content}
                                                   </p>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    );
                                })()}
                           </div>
                       )}})
                   )}
               </div>
           </div>
       </main>

        {/* Floating active reading timer */}
        {!isLocked && (
          <div className={cn(
             "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 px-3.5 py-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 flex items-center gap-2 select-none text-xs font-semibold hover:opacity-100 opacity-80",
             isDark 
               ? "bg-[#2C221D]/95 border-[#3C2E27] text-[#ECE5DC]" 
               : "bg-white/95 border-[#8D6E63]/30 text-[#3E2723]"
          )}>
             {isFinished ? ( <div className="flex items-center gap-1.5 text-emerald-500 font-bold dark:text-emerald-400"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>Đã xong (+1 lượt đọc)</span></div> ) : false ? (
                <div className="flex items-center gap-2">
                   <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 animate-pulse">
                      <CheckCircle className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                      <p className="text-xs font-bold text-emerald-500">Hoàn thành đọc chương!</p>
                      <p className="text-[10px] opacity-70 leading-tight">Lượt đọc & nhiệm vụ ngày đã được ghi nhận.</p>
                   </div>
                </div>
             ) : (
                <div className="flex items-center gap-3">
                   <div className="hidden">
                      {/* Circular progress background */}
                      <svg className="w-10 h-10 transform -rotate-90">
                         <circle 
                            cx="20" 
                            cy="20" 
                            r="16" 
                            className="stroke-gray-200/40 dark:stroke-gray-700/40" 
                            strokeWidth="3" 
                            fill="transparent" 
                         />
                         <circle 
                            cx="20" 
                            cy="20" 
                            r="16" 
                            className={cn(isIdle ? "stroke-amber-500" : "stroke-[#8D6E63] dark:stroke-[#D4AF37] transition-all duration-300")}
                            strokeWidth="3" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={2 * Math.PI * 16 * (1 - secondsRead / timeRequired)}
                         />
                      </svg>
                      {isIdle ? (
                         <Pause className="w-3.5 h-3.5 absolute text-amber-500 animate-pulse" />
                      ) : (
                         <Clock className="w-3.5 h-3.5 absolute text-[#8D6E63] dark:text-[#D4AF37] animate-pulse" />
                      )}
                   </div>
                   <div className="flex items-center gap-1.5">

                      {isIdle ? (
                         <span className="flex items-center gap-1 text-amber-500 font-bold animate-pulse text-[11px] sm:text-xs">
                             <Pause className="w-3.5 h-3.5 flex-shrink-0" />
                             <span>Dừng (cuộn để tiếp tục)</span>
                          </span>
                      ) : (
                         <span className="flex items-center gap-1.5 text-[#3E2723] dark:text-[#ECE5DC] text-[11px] sm:text-xs">
                             <Clock className="w-3.5 h-3.5 text-[#8D6E63] dark:text-[#D4AF37] animate-pulse flex-shrink-0" />
                             <span>Còn <span className="font-mono text-xs sm:text-sm font-black text-[#8D6E63] dark:text-[#D4AF37]">{timeRequired - secondsRead}</span> giây</span>
                          </span>
                      )}
                   </div>
                </div>
             )}
          </div>
        )}
    </div>
  )
}

import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useFeatureRestriction } from '../types/features';
import { BookOpen, Users, Lock, Unlock, Zap, ChevronRight, Bookmark, Gift, Heart, Sparkles, Send, MessageSquare, ExternalLink } from 'lucide-react';
import { cn } from '../components/Layout';
import React, { useEffect, useState } from 'react';
import { db, checkIfQuotaError } from '../lib/firebase';
import { addStoryFire } from '../lib/storyFire';
import { getStoryByIdOrSlug, getStoryChapters } from '../lib/storyLoader';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, where, limit } from 'firebase/firestore';
import { UserAvatar } from '../components/UserAvatar';
import { ThemeProps } from './themes/ThemeProps';
import { HuongDanGiaNgoanTheme } from './themes/HuongDanGiaNgoan';
import { CanhCuaHomerTheme } from './themes/CanhCuaHomer';
import { NhatKyKhongTenTheme } from './themes/NhatKyKhongTen';
import { TinhYeuThuyTienTheme } from './themes/TinhYeuThuyTien';
import { RinhRapTheme } from './themes/RinhRap';
import { ThienTaiThaoTacTheme } from './themes/ThienTaiThaoTac';
import { detectStoryTheme } from '../lib/themeHelper';

interface CommentNodeProps {
   comment: any;
   comments: any[];
   replyingToId: string | null;
   setReplyingToId: (id: string | null) => void;
   replyText: string;
   setReplyText: (text: string) => void;
   submittingReply: boolean;
   handleSendReply: (comment: any) => void;
   getTitleColor: (title: string | null) => string | undefined;
   isLoggedIn: boolean;
   depth?: number;
   profilesCache?: Record<string, any>;
}

const CommentNode: React.FC<CommentNodeProps> = ({
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
   depth = 0,
   profilesCache = {}
}) => {
   const { uid: storeUid, equippedStickerComment, stickerPositionComment, displayName: storeDisplayName, avatarUrl: storeAvatarUrl, activeTitle: storeActiveTitle, equippedAccessory: storeEquippedAccessory, accessoryPosition: storeAccessoryPosition, theme } = useStore();
   const isGift = comment.type === 'choco_gift';
   const isMe = comment.uid === storeUid;
   
   const cached = comment.uid ? profilesCache[comment.uid] : null;

   const currentSticker = isMe ? equippedStickerComment : (cached?.equippedStickerComment ?? cached?.equippedSticker ?? comment.equippedSticker);
   const currentStickerPos = isMe ? stickerPositionComment : (cached?.stickerPositionComment ?? cached?.stickerPosition ?? comment.stickerPosition);
   const currentDisplayName = isMe ? storeDisplayName : (cached?.displayName ?? comment.displayName);
   const currentAvatarUrl = isMe ? storeAvatarUrl : (cached?.avatarUrl ?? comment.avatarUrl);
   const currentActiveTitle = isMe ? storeActiveTitle : (cached?.activeTitle ?? comment.activeTitle);
   const currentAccessory = isMe ? storeEquippedAccessory : (cached?.equippedAccessory ?? comment.equippedAccessory);
   const currentAccessoryPos = isMe ? storeAccessoryPosition : (cached?.accessoryPosition ?? comment.accessoryPosition);

   const replies = comments.filter(r => r.parentId === comment.id).sort((a: any, b: any) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0));
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0));
      return timeA - timeB;
   });

   return (
      <div key={comment.id} className="w-full flex flex-col gap-2">
         <div 
            className={cn(
               depth === 0 
                  ? cn(
                     "p-4 rounded-2xl flex gap-3.5 border transition-all shadow-sm relative overflow-visible pr-8",
                     isGift 
                        ? "bg-[#FDF6EC]/70 border-[#D7CCC8]/80 hover:bg-[#F5E6D3] dark:bg-[#3E2723]/30 dark:border-[#5D4037]/60 dark:hover:bg-[#3E2723]/50" 
                        : "bg-white border-[#F5E6D3]/60 hover:border-[#D7CCC8]/50 dark:bg-[#2C221D] dark:border-[#3C2E27] dark:hover:border-[#4E342E]/60",
                     currentSticker ? "pr-12" : ""
                    )
                  : cn(
                     "p-3.5 rounded-2xl flex gap-3 bg-[#FAF7F2]/60 dark:bg-[#1E1512]/50 border border-[#F5E6D3]/40 dark:border-[#3C2E27]/50 hover:border-[#D7CCC8]/40 transition-colors relative block",
                     currentSticker ? "pr-12 pb-6" : ""
                  )
            )}
         >
            {currentSticker && (
              <img 
                src={currentSticker} 
                alt="Sticker" 
                className="absolute w-12 h-12 object-contain pointer-events-none z-10 right-0 top-1/2 -translate-y-1/2" 
                referrerPolicy="no-referrer"
              />
            )}
            <UserAvatar 
               avatarUrl={currentAvatarUrl} 
               equippedAccessory={currentAccessory}
               accessoryPosition={currentAccessoryPos}
               className={depth === 0 ? "w-10 h-10 shrink-0" : "w-8.5 h-8.5 shrink-0"} 
               fallbackIconSizeClass={depth === 0 ? "w-5 h-5 text-[#A1887F]" : "w-4.5 h-4.5 text-[#A1887F]"} 
               borderClass="border border-[#D7CCC8]/30"
            />
            
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                     <span className="font-extrabold text-sm shrink-0" style={{ color: getTitleColor(currentActiveTitle) || (theme === 'dark' ? '#E6D4BF' : '#3E2723') }}>
                        {currentDisplayName}
                        {currentActiveTitle && (
                           <span className="px-1.5 py-0.5 bg-[#F5E6D3] dark:bg-[#3E2723] text-[#5D4037] dark:text-[#E6D4BF] text-[9px] font-extrabold rounded-md uppercase tracking-tight select-none border border-[#D7CCC8] dark:border-[#5D4037]/60 ml-1.5 inline-block align-middle">
                              🏆 {currentActiveTitle}
                           </span>
                        )}
                     </span>
                     
                     {isGift && (
                        <span className="bg-[#F5E6D3] dark:bg-[#3E2723] text-[#3E2723] dark:text-[#E6D4BF] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#D7CCC8] dark:border-[#5D4037]/60 flex items-center gap-1 shadow-sm">
                           <Sparkles className="w-3 h-3 text-[#8D6E63] dark:text-[#C29D70] inline shrink-0" />
                           Tặng {comment.giftAmount} Choco 🍫
                        </span>
                     )}
                  </div>
                  
                  <span className="text-[10px] text-stone-400 font-mono shrink-0">
                     {comment.createdAt?.toDate 
                        ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Vừa xong'}
                  </span>
               </div>
               <p className={cn(
                  "text-sm break-words leading-relaxed text-justify",
                  isGift ? "text-[#5D4037] dark:text-[#ECE5DC] font-medium italic" : "text-stone-700 dark:text-stone-300"
               )}>
                  {comment.replyToUser && (
                     <span className="text-[#8D6E63] dark:text-[#C29D70] font-bold text-[10px] uppercase mr-1.5 bg-[#8D6E63]/10 dark:bg-[#8D6E63]/25 px-2 py-0.5 rounded-md select-none border border-[#8D6E63]/25 dark:border-[#8D6E63]/40 align-middle inline-block">
                        @{comment.replyToUser}
                     </span>
                  )}
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
                        className="flex-1 bg-[#FDF6EC] dark:bg-[#1E1512] border border-[#D7CCC8]/80 dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] focus:border-[#8D6E63] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] rounded-xl px-3.5 py-1.5 placeholder-gray-400 dark:placeholder-stone-500 text-xs sm:text-sm"
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && replyText.trim() && !submittingReply) {
                              handleSendReply(comment);
                           }
                        }}
                     />
                     <button 
                        onClick={() => handleSendReply(comment)}
                        disabled={submittingReply || !replyText.trim()}
                        className="bg-[#3E2723] hover:bg-[#2D1B19] text-[#FDF6EC] disabled:bg-stone-300 disabled:text-stone-400 dark:disabled:bg-stone-800 dark:disabled:text-stone-600 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
                     >
                        {submittingReply ? 'Gửi...' : 'Gửi'}
                     </button>
                     <button 
                        onClick={() => setReplyingToId(null)}
                        className="text-stone-400 hover:text-stone-500 dark:hover:text-stone-300 border border-stone-200 dark:border-[#3C2E27] px-2 rounded-xl text-xs"
                     >
                        Hủy
                     </button>
                  </div>
               )}
            </div>
         </div>

         {replies.length > 0 && (
            <div className={cn(
               "pl-4 space-y-3 border-l-2 border-[#D7CCC8]/40 dark:border-[#4E342E]/40 mt-1",
               depth > 4 ? "pl-1 border-0" : ""
            )}>
               {replies.map(r => (
                  <CommentNode
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
                     depth={depth + 1}
                     profilesCache={profilesCache}
                  />
               ))}
            </div>
         )}
      </div>
   );
};

import { useUserProfilesCache } from '../hooks/useUserProfilesCache';

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
    avatarUrl,
    unlockedPassChapters,
    unlockedEarlyAccessChapters,
    getTitleColor,
    setLockedFeatureId
  } = useStore();

  const { isFeatureLocked } = useFeatureRestriction();

  useEffect(() => {
    if (isFeatureLocked('reading')) {
      setLockedFeatureId('reading');
      navigate('/');
    }
  }, [isFeatureLocked, navigate, setLockedFeatureId]);

  const [story, setStory] = useState<any>(null);
  const [actualStoryId, setActualStoryId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chapters' | 'comments'>('chapters');

  const userIds = comments.map(c => c.uid).filter(Boolean) as string[];
  const profilesCache = useUserProfilesCache(userIds);
  const [chapterPage, setChapterPage] = useState(0);
  const [chapterSortDesc, setChapterSortDesc] = useState(false);
  const CHAPTERS_PER_PAGE = 50;
  
  // Gift State
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState<number>(10);
  const [giftMessage, setGiftMessage] = useState<string>('');
  
  // Comment input state
  const [commentText, setCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Reply comment states
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  const notifyAdminOfComment = async (commentData: {
    authorName: string;
    storyTitle: string;
    chapterTitle?: string | null;
    content: string;
    storyId: string;
    chapterId?: string | null;
  }) => {
    try {
      const currentEmail = useStore.getState().email;
      if (currentEmail?.toLowerCase() === 'cucnau01@gmail.com') return;

      const qAdmin = query(collection(db, 'users'), where('email', '==', 'cucnau01@gmail.com'), limit(1));
      const adminSnap = await getDocs(qAdmin);
      if (!adminSnap.empty) {
        const adminUid = adminSnap.docs[0].id;
        await addDoc(collection(db, 'notifications'), {
          userId: adminUid,
          type: 'new_comment',
          authorName: commentData.authorName,
          storyTitle: commentData.storyTitle,
          storyId: commentData.storyId,
          chapterId: commentData.chapterId || null,
          chapterTitle: commentData.chapterTitle || null,
          content: commentData.content,
          isRead: false,
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Error creating admin notification:", err);
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchStoryData = async () => {
      setLoading(true);
      try {
        const foundStory = await getStoryByIdOrSlug(id);
        if (foundStory) {
          setStory(foundStory);
          detectStoryTheme(foundStory.title, foundStory.id);
          setActualStoryId(foundStory.id);
          const foundChapters = await getStoryChapters(foundStory.id);
          setChapters(foundChapters);
        } else {
          setStory(null);
        }
      } catch (err) {
        console.error('Error loading story:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoryData();
  }, [id]);

  useEffect(() => {
    if (!actualStoryId) return;
    const qComments = query(collection(db, 'comments'), where('targetId', '==', actualStoryId));
    const unsub = onSnapshot(qComments, (snap) => {
       const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       list.sort((a: any, b: any) => {
          const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0));
          const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0));
          return timeB - timeA;
       });
       setComments(list);
    });
    return () => unsub();
  }, [actualStoryId]);
  
  if (loading) {
    const activeCustomTheme = detectStoryTheme(story?.title, id);
    
    if (activeCustomTheme === 'rinhrap') {
      const rinhrapMode = (localStorage.getItem('reader-rinhrap-mode') as 'thodo' | 'thotrang') || 'thodo';
      if (rinhrapMode === 'thotrang') {
        return (
          <div className="min-h-screen bg-[#fff2f1] text-[#780606] flex flex-col items-center justify-center p-4 font-sans">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#facaca] border-t-[#780606] rounded-full animate-spin" />
              <div className="text-xs uppercase tracking-[0.2em] text-[#780606] animate-pulse font-black">
                ĐANG QUÉT MÀN CHƠI RÌNH RẬP...
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="min-h-screen bg-[#0B0505] text-[#D8B4B4] flex flex-col items-center justify-center p-4 font-sans">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#450A0A] border-t-[#EF4444] rounded-full animate-spin" />
            <div className="text-xs uppercase tracking-[0.2em] text-[#EF4444] animate-pulse font-black">
              ĐANG QUÉT MÀN CHƠI RÌNH RẬP...
            </div>
          </div>
        </div>
      );
    }
    if (activeCustomTheme === 'thientai') {
      return (
        <div className="min-h-screen bg-[#060406] text-[#d4c6c9] flex flex-col items-center justify-center p-4 font-mono animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#34282d] border-t-[#9a858d] rounded-full animate-spin" />
            <div className="text-xs uppercase tracking-[0.2em] text-[#9a858d] animate-pulse font-extrabold">
              THẦN THỤ OS // ĐANG TẢI THIÊN TÀI THAO TÁC...
            </div>
          </div>
        </div>
      );
    }
    if (activeCustomTheme === 'homer') {
      return (
        <div className="min-h-screen bg-[#181f2d] text-[#a0a6b3] flex flex-col items-center justify-center p-4 font-mono">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#47515f] border-t-[#a0a6b3] rounded-full animate-spin" />
            <div className="text-xs uppercase tracking-[0.2em] text-[#a0a6b3] animate-pulse font-bold">
              SYS.HOMER // TRUY XUẤT TỌA ĐỘ DỮ LIỆU...
            </div>
          </div>
        </div>
      );
    } else if (activeCustomTheme === 'giagoan') {
      return (
        <div className="min-h-screen bg-[#13120d] text-[#dbcec2] flex flex-col items-center justify-center p-4 font-sans">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#2e2a63] border-t-[#bbee1f] rounded-full animate-spin" />
            <div className="text-xs uppercase tracking-[0.2em] text-[#695b7f] animate-pulse font-bold">
              ĐANG TẢI DỮ LIỆU TÀI LIỆU...
            </div>
          </div>
        </div>
      );
    } else if (activeCustomTheme === 'nhatky') {
      return (
        <div className="min-h-screen bg-gradient-to-r from-[#DFCEB4] via-[#E8DCC4] to-[#DFCEB4] text-[#2C1814] flex flex-col items-center justify-center p-4 font-serif relative overflow-hidden">
          {/* Top & Bottom stitched lines for loading */}
          <div className="absolute top-4 left-0 right-0 border-t border-dashed border-[#BCA782]/60 pointer-events-none" />
          <div className="absolute bottom-4 left-0 right-0 border-b border-dashed border-[#BCA782]/60 pointer-events-none" />
          
          <div className="flex flex-col items-center gap-5 relative z-10">
            <div className="w-14 h-14 border-4 border-[#BCA782]/40 border-t-[#2C1814] rounded-full animate-spin shadow-md" />
            <div className="text-sm font-medium tracking-widest text-[#2C1814] animate-pulse text-center px-4 font-sans uppercase">
              <span>Đang lật giở nhật ký...</span>
            </div>
          </div>
        </div>
      );
    } else if (activeCustomTheme === 'thuytien') {
      return (
        <div className="min-h-screen bg-[#0E0C0A] text-[#EADDC9] flex flex-col items-center justify-center p-4 font-serif relative overflow-hidden">
          {/* Classical Greek corner decorations */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#9A8E7D]/30 pointer-events-none" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#9A8E7D]/30 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#9A8E7D]/30 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#9A8E7D]/30 pointer-events-none" />
          
          <div className="flex flex-col items-center gap-5 relative z-10">
            <div className="w-14 h-14 border-4 border-[#2E251E] border-t-[#9A8E7D] rounded-full animate-spin shadow-lg" />
            <div className="text-xs uppercase tracking-[0.25em] text-[#9A8E7D] animate-pulse text-center px-4 font-sans font-black">
              ĐANG KHƠI NGUỒN SỬ THI THỦY TIÊN...
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#1A1412] text-[#E0D4C3] flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3E2723] border-t-[#D7CCC8] rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-[0.2em] text-[#8D6E63] animate-pulse font-bold">
            Đang tải dữ liệu truyện...
          </div>
        </div>
      </div>
    );
  }
  
  if (!story) return <div className="p-10 text-center">Không tìm thấy truyện</div>;

  const progressData = storyProgress[story.id];
  let readChapters: number[] = [];
  if (typeof progressData === 'number') {
     readChapters = Array.from({length: progressData}, (_, i) => i + 1);
  } else if (Array.isArray(progressData)) {
     readChapters = progressData;
  }
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
             storyId: story.id,
             storyTitle: story.title || 'Truyện',
             chapterId: null,
             chapterTitle: null,
             activeTitle: useStore.getState().activeTitle || null,
            equippedSticker: useStore.getState().equippedStickerComment || null,
            stickerPosition: useStore.getState().stickerPositionComment || 'top-right',
            equippedAccessory: useStore.getState().equippedAccessory || null,
            accessoryPosition: useStore.getState().accessoryPosition || null,
             giftAmount: giftAmount,
             paragraphIdx: null,
             createdAt: serverTimestamp()
          });
          setShowGiftModal(false);
          setGiftMessage('');
          notifyAdminOfComment({
             authorName: displayName || 'Nhà lữ hành ẩn danh',
             storyTitle: story.title || 'Truyện',
             storyId: story.id,
             content: `🎁 Tặng ${giftAmount} Choco: ${giftMessage.trim() || 'Gửi tặng Choco ngọt ngào ủng hộ tác phẩm!'}`
          });
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

  const handleSendReply = async (parentComment: any) => {
     if (!isLoggedIn) {
        alert("Bạn cần đăng nhập để trả lời bình luận!");
        return;
     }
     if (!replyText.trim()) return;
     setSubmittingReply(true);
     try {
        await addDoc(collection(db, 'comments'), {
           targetId: story.id,
           uid,
           displayName: displayName || 'Nhà lữ hành ẩn danh',
           avatarUrl: avatarUrl || '',
           content: replyText.trim(),
           type: 'comment_reply',
           parentId: parentComment.id,
           storyId: story.id,
           storyTitle: story.title || 'Truyện',
           chapterId: null,
           chapterTitle: null,
           replyToUser: parentComment.displayName || null,
           activeTitle: useStore.getState().activeTitle || null,
           giftAmount: 0,
           paragraphIdx: parentComment.paragraphIdx || null,
           equippedSticker: useStore.getState().equippedStickerComment || null,
           stickerPosition: useStore.getState().stickerPositionComment || 'top-right',
           equippedAccessory: useStore.getState().equippedAccessory || null,
           accessoryPosition: useStore.getState().accessoryPosition || null,
           createdAt: serverTimestamp()
        });
        addStoryFire(story.id, 1);

        if (parentComment.uid && parentComment.uid !== uid) {
           await addDoc(collection(db, 'notifications'), {
              userId: parentComment.uid,
              storyId: story.id,
              chapterId: null,
              storyTitle: story.title || 'Truyện',
              chapterTitle: null,
              replierName: displayName || 'Nhà lữ hành ẩn danh',
               isRead: false,
               createdAt: Date.now(),
               type: 'comment_reply',
           });
        }
        
        useStore.getState().addCommentProgress();

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
            storyId: story.id,
            storyTitle: story.title || 'Truyện',
            chapterId: null,
            chapterTitle: null,
           activeTitle: useStore.getState().activeTitle || null,
           equippedSticker: useStore.getState().equippedStickerComment || null,
           stickerPosition: useStore.getState().stickerPositionComment || 'top-right',
           equippedAccessory: useStore.getState().equippedAccessory || null,
           accessoryPosition: useStore.getState().accessoryPosition || null,
           giftAmount: 0,
           paragraphIdx: null,
           createdAt: serverTimestamp()
        });
        addStoryFire(story.id, 1);
        notifyAdminOfComment({
           authorName: displayName || 'Nhà lữ hành ẩn danh',
           storyTitle: story.title || 'Truyện',
           storyId: story.id,
           content: commentText.trim()
        });
        useStore.getState().addCommentProgress();
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

  if (story.title.toLowerCase().includes('hướng dẫn giả ngoan')) {
    const themeProps: ThemeProps = {
      story,
      actualStoryId,
      chapters,
      comments,
      activeTab,
      setActiveTab,
      chapterPage,
      setChapterPage,
      chapterSortDesc,
      setChapterSortDesc,
      CHAPTERS_PER_PAGE,
      showGiftModal,
      setShowGiftModal,
      giftAmount,
      setGiftAmount,
      giftMessage,
      setGiftMessage,
      handleGiftSubmit,
      commentText,
      setCommentText,
      submittingComment,
      handleSendComment,
      replyingToId,
      setReplyingToId,
      replyText,
      setReplyText,
      submittingReply,
      handleSendReply,
      profilesCache,
      isLoggedIn,
      savedStories,
      toggleSaveStory,
      handleSaveToggle,
      choco,
      uid,
      displayName,
      avatarUrl,
      unlockedPassChapters,
      unlockedEarlyAccessChapters,
      getTitleColor,
      navigate,
    };
    return <HuongDanGiaNgoanTheme {...themeProps} />;
  }

  if (story.title.toLowerCase().includes('cánh cửa homer') || story.title.toLowerCase().includes('canh cua homer')) {
    const themeProps: ThemeProps = {
      story,
      actualStoryId,
      chapters,
      comments,
      activeTab,
      setActiveTab,
      chapterPage,
      setChapterPage,
      chapterSortDesc,
      setChapterSortDesc,
      CHAPTERS_PER_PAGE,
      showGiftModal,
      setShowGiftModal,
      giftAmount,
      setGiftAmount,
      giftMessage,
      setGiftMessage,
      handleGiftSubmit,
      commentText,
      setCommentText,
      submittingComment,
      handleSendComment,
      replyingToId,
      setReplyingToId,
      replyText,
      setReplyText,
      submittingReply,
      handleSendReply,
      profilesCache,
      isLoggedIn,
      savedStories,
      toggleSaveStory,
      handleSaveToggle,
      choco,
      uid,
      displayName,
      avatarUrl,
      unlockedPassChapters,
      unlockedEarlyAccessChapters,
      getTitleColor,
      navigate,
    };
    return <CanhCuaHomerTheme {...themeProps} />;
  }

  const currentTheme = detectStoryTheme(story.title, id);
  if (currentTheme === 'nhatky' || currentTheme === 'thuytien' || currentTheme === 'rinhrap' || currentTheme === 'thientai') {
    const themeProps: ThemeProps = {
      story,
      actualStoryId,
      chapters,
      comments,
      activeTab,
      setActiveTab,
      chapterPage,
      setChapterPage,
      chapterSortDesc,
      setChapterSortDesc,
      CHAPTERS_PER_PAGE,
      showGiftModal,
      setShowGiftModal,
      giftAmount,
      setGiftAmount,
      giftMessage,
      setGiftMessage,
      handleGiftSubmit,
      commentText,
      setCommentText,
      submittingComment,
      handleSendComment,
      replyingToId,
      setReplyingToId,
      replyText,
      setReplyText,
      submittingReply,
      handleSendReply,
      profilesCache,
      isLoggedIn,
      savedStories,
      toggleSaveStory,
      handleSaveToggle,
      choco,
      uid,
      displayName,
      avatarUrl,
      unlockedPassChapters,
      unlockedEarlyAccessChapters,
      getTitleColor,
      navigate,
    };
    if (currentTheme === 'thuytien') {
      return <TinhYeuThuyTienTheme {...themeProps} />;
    }
    if (currentTheme === 'rinhrap') {
      return <RinhRapTheme {...themeProps} />;
    }
    if (currentTheme === 'thientai') {
      return <ThienTaiThaoTacTheme {...themeProps} />;
    }
    return <NhatKyKhongTenTheme {...themeProps} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 flex flex-col gap-8 max-w-5xl mx-auto w-full">
      {/* Story Profile Card */}
      <div className="flex flex-col gap-8 bg-[#FFFDF9] dark:bg-[#211B18] border-2 border-[#3E2723] dark:border-[#4E342E] p-6 lg:p-8 rounded-3xl shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907]">
        <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 flex-shrink-0 flex justify-center md:block">
                <img src={story.coverUrl} alt={story.title} className="w-48 md:w-full aspect-[2/3] object-cover rounded-2xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[1.5px_1.5px_0_0_#3E2723] dark:shadow-[1.5px_1.5px_0_0_#0D0907]" />
            </div>
            <div className="flex-1 flex flex-col">
                <h1 className="text-2xl lg:text-4xl font-black mb-3 text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wider leading-snug">
                   {story.title}
                   {story.completed && <span className="inline-block text-[10px] lg:text-xs bg-[#E6D4BF] dark:bg-[#3C2E27]/50 text-[#3E2723] dark:text-[#E6D8C9] px-2.5 py-1 rounded-lg uppercase tracking-widest font-black ml-3 align-middle border-[2px] border-[#3E2723] dark:border-[#5D4037]">Full</span>}
                </h1>
                <div className="text-[#8D6E63] font-bold mb-4 flex items-center gap-2">
                    <Users className="w-4.5 h-4.5" />
                    <span className="font-bold italic uppercase text-xs tracking-wider">Tác giả: {story.author}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                    {story.genres?.map?.((g: string) => (
                        <span key={g} className="bg-[#FDF6EC] text-[#3E2723] dark:text-[#ECE5DC] dark:bg-stone-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl border-[2px] border-[#3E2723]">
                            {g}
                        </span>
                    ))}
                </div>
     
                <div className="flex items-center gap-6 mb-6">
                   <div className="flex flex-col">
                       <span className="text-[#8D6E63] text-xs uppercase font-extrabold tracking-widest">{"chương"}</span>
                       <span className="font-extrabold text-2xl text-[#3E2723] dark:text-[#ECE5DC]">{Math.max(story.chapterCount || 0, chapters.length)}</span>
                   </div>
                   <div className="w-[3px] h-10 bg-[#3E2723]/25 dark:bg-stone-600/40 rounded-full"></div>
                   <div className="flex flex-col">
                       <span className="text-[#8D6E63] text-xs uppercase font-extrabold tracking-widest">Hỏa lực 🔥</span>
                       <span className="font-extrabold text-2xl text-[#3E2723] dark:text-[#ECE5DC]">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(story.viewCount || 0)}</span>
                   </div>
                   <div className="w-[3px] h-10 bg-[#3E2723]/25 dark:bg-stone-600/40 rounded-full"></div>
                   <div className="flex flex-col">
                       <span className="text-[#8D6E63] text-xs uppercase font-extrabold tracking-widest">Đã tặng</span>
                       <span className="font-extrabold text-2xl text-[#3E2723] dark:text-[#ECE5DC] flex items-center gap-1">
                          {totalGiftedChoco} <span className="text-xs">🍫</span>
                       </span>
                   </div>
                </div>
                
                {/* Interactive Action Row */}
                <div className="mt-auto flex flex-wrap gap-3 pt-4">
                    <button 
                      onClick={() => navigate(`/doc/${story.id}/${chapters[0]?.id}`)} 
                      className="bg-[#8D6E63] dark:bg-[#5D4037] hover:bg-[#5D4037] dark:hover:bg-[#4E342E] text-white px-5 py-2.5 text-xs rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        <BookOpen className="w-4 h-4" />
                        Đọc từ đầu
                    </button>
                    
                    {story?.externalUrl && (
                        <a 
                           href={story.externalUrl} 
                           target="_blank" 
                           rel="noreferrer" 
                           className="bg-[#A1887F] dark:bg-[#6D4C41] hover:bg-[#8D6E63] dark:hover:bg-[#5D4037] text-white px-5 py-2.5 text-xs rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none transition-all flex h-max items-center"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Đọc truyện
                        </a>
                    )}
                    
                    <button 
                      onClick={handleSaveToggle} 
                      className={cn(
                        "px-5 py-2.5 text-xs rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none",
                        isSaved 
                          ? "bg-[#E6D8C9] dark:bg-[#3C2E27]/80 text-[#3E2723] dark:text-[#E6D8C9]" 
                          : "bg-white dark:bg-[#2C221D] text-[#5D4037] dark:text-stone-300"
                      )}
                    >
                        <Bookmark className={cn("w-4 h-4", isSaved && "fill-[#8D6E63] text-[#8D6E63] dark:text-[#C29D70] dark:fill-[#C29D70]")} />
                        {isSaved ? 'Đã Lưu' : 'Lưu Thư Viện'}
                    </button>
    
                    <button 
                      onClick={() => setShowGiftModal(true)} 
                      className="bg-[#E6D4BF] dark:bg-[#C29D70] hover:bg-[#5D4037] dark:hover:bg-[#8D6E63] hover:text-white dark:hover:text-[#ECE5DC] text-[#3E2723] dark:text-[#181311] px-5 py-2.5 text-xs rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
                    >
                        <Gift className="w-4 h-4 text-[#3E2723] dark:text-[#181311] animate-bounce shrink-0" />
                        Tặng Choco
                    </button>
                </div>
            </div>
        </div>

        <div className="border-t-[3px] border-[#3E2723]/10 dark:border-[#5D4037]/50 pt-6 flex-1 flex flex-col gap-6">
            <div>
                <h3 className="font-extrabold text-base mb-4 uppercase tracking-widest text-[#3E2723] dark:text-[#ECE5DC]">Giới thiệu</h3>
                <div className="text-stone-700 dark:text-[#D7CCC8]/90 leading-relaxed italic text-[14px] space-y-4 font-sans font-medium">
                   {story.description?.split('\n').map((para: string, idx: number) => (
                      <p key={idx} className={para.trim() ? "" : "hidden"}>{para}</p>
                   ))}
                </div>
            </div>

            {story.recommendations && (
                <div className="border-t-[2px] border-[#3E2723]/5 dark:border-[#5D4037]/20 pt-4">
                    <h4 className="font-extrabold text-xs mb-3 uppercase tracking-widest text-[#8D6E63] dark:text-[#C29D70]">
                       ✨ Đề cử truyện hay khác
                    </h4>
                    <div className="text-stone-600 dark:text-[#A1887F] leading-relaxed text-[13px] bg-[#FDF6EC]/60 dark:bg-[#2C221D]/40 p-4 rounded-2xl border border-[#3E2723]/10 dark:border-[#5D4037]/30 whitespace-pre-line font-medium">
                       {story.recommendations}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Tabs list (Chapters list vs Comments Feed) */}
      <div className="bg-[#FFFDF9] dark:bg-[#1A1412] border-2 border-[#3E2723] dark:border-[#4E342E] rounded-3xl p-6 lg:p-8 shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907]">
         <div className="flex border-b-[3px] border-[#3E2723]/20 dark:border-stone-800/40 mb-6">
            <button
               onClick={() => setActiveTab('chapters')}
               className={cn(
                  "px-4 py-3 font-black text-xs uppercase tracking-wider relative transition-all",
                  activeTab === 'chapters' ? "text-[#3E2723] dark:text-[#ECE5DC]" : "text-stone-400 hover:text-stone-600 dark:hover:text-[#ECE5DC]"
               )}
            >
               Danh sách chương ({chapters.length})
               {activeTab === 'chapters' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#3E2723] dark:bg-[#C29D70] rounded-t-full"></span>
               )}
            </button>
            <button
               onClick={() => setActiveTab('comments')}
               className={cn(
                  "px-4 py-3 font-black text-xs uppercase tracking-wider relative transition-all flex items-center gap-2",
                  activeTab === 'comments' ? "text-[#3E2723] dark:text-[#ECE5DC]" : "text-stone-400 hover:text-stone-600 dark:hover:text-[#ECE5DC]"
               )}
            >
               Bình luận & Quà tặng ({comments.length})
               {activeTab === 'comments' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#3E2723] dark:bg-[#C29D70] rounded-t-full"></span>
               )}
            </button>
         </div>

         {/* Tab Content */}
         {activeTab === 'chapters' ? (
            <div className="flex flex-col">
               {chapters.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between xl:justify-end gap-3 mb-4 bg-[#F5F2EB]/50 dark:bg-[#1C1613]/50 p-2 sm:p-3 rounded-xl border border-stone-200/50 dark:border-[#3E2D25]/50">
                     <span className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider hidden sm:inline-block mr-auto">
                        {chapters.length} {"chương"}
                     </span>
                     
                     <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                        <select
                           value={chapterPage}
                           onChange={(e) => {
                              setChapterPage(Number(e.target.value));
                              setTimeout(() => {
                                 document.getElementById('chapters-list-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                              }, 50);
                           }}
                           className="bg-[#FDF6EC] dark:bg-[#1A1412] text-[#3E2723] dark:text-[#A1887F] font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-[#3E2723]/20 dark:border-[#4E342E]/50 focus:border-[#8D6E63] flex-1 sm:flex-none"
                        >
                           {Array.from({ length: Math.ceil(chapters.length / CHAPTERS_PER_PAGE) }).map((_, i) => {
                              const start = i * CHAPTERS_PER_PAGE + 1;
                              const end = Math.min((i + 1) * CHAPTERS_PER_PAGE, chapters.length);
                              return (
                                 <option key={i} value={i}>
                                    {"chương"} {start} - {end}
                                 </option>
                              );
                           })}
                        </select>
   
                        <button 
                           onClick={() => {
                              setChapterSortDesc(!chapterSortDesc);
                              setChapterPage(0);
                              setTimeout(() => {
                                 document.getElementById('chapters-list-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                              }, 50);
                           }}
                           className="bg-[#3E2723] dark:bg-[#2C221D] text-[#FDF6EC] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all hover:bg-[#2D1B19] flex-shrink-0"
                        >
                           {chapterSortDesc ? '↓ Số lớn -> bé' : '↑ Số bé -> lớn'}
                        </button>
                     </div>
                  </div>
               )}

               <div id="chapters-list-container" className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {[...chapters].sort((a, b) => chapterSortDesc ? b.order - a.order : a.order - b.order).slice(chapterPage * CHAPTERS_PER_PAGE, (chapterPage + 1) * CHAPTERS_PER_PAGE).map(chap => {
                  const isRead = readChapters.includes(chap.order);
                  const isPassRequired = chap.requiresPass;
                  const hasPassUnlocked = isPassRequired && (unlockedPassChapters || []).includes(chap.id);
                  
                  const isEarlyAccess = chap.requiresEarlyAccess;
                  const chapTime = chap.createdAt?.toMillis ? chap.createdAt.toMillis() : (typeof chap.createdAt === 'number' ? chap.createdAt : 0);
                  const isStillEarlyAccess = isEarlyAccess && (Date.now() - chapTime < 24 * 60 * 60 * 1000);
                  const hasEarlyAccessUnlocked = isEarlyAccess && (unlockedEarlyAccessChapters || []).includes(chap.id);

                  return (
                     <button 
                        key={chap.id}
                        onClick={() => navigate(`/doc/${story.id}/${chap.id}`)}
                        className={cn(
                            "flex items-center justify-between p-4 border-[2px] border-dashed border-[#3E2723]/20 hover:border-solid hover:border-[#3E2723] hover:bg-[#FDF6EC] transition-all rounded-xl mb-2 text-left w-full",
                            isRead ? "text-[#A1887F]" : "text-[#3E2723]"
                        )}
                     >
                        <div className="flex items-center gap-3">
                           <span className={cn("font-bold text-left text-sm", isRead ? "" : "group-hover:text-[#8D6E63] text-[#3E2723]")}>
                               {chap.title}
                           </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {isPassRequired && (hasPassUnlocked ? <Unlock className="w-4 h-4 text-[#8D6E63]" title="Đã mở khóa Pass" /> : <Lock className="w-4 h-4 text-[#8D6E63]" title="Cần vé Pass" />)}
                            {(isEarlyAccess && isStillEarlyAccess) && (hasEarlyAccessUnlocked ? <Zap className="w-4 h-4 text-stone-400" title="Đã đọc sớm" /> : <Zap className="w-4 h-4 text-[#D4AF37] fill-[#F5E6D3]" title="Cần vé Ưu Tiên" />)}
                            {(isEarlyAccess && !isStillEarlyAccess) && <Zap className="w-4 h-4 text-stone-400" title="Đã chuyển sang đọc miễn phí" />}
                            
                            {chap.isLockedRead && <span className="text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900">Đã khóa</span>}
                            {isRead && <span className="text-[10px] uppercase font-bold tracking-wider bg-[#F5E6D3] text-[#8D6E63] px-2 py-0.5 rounded-full">Đã đọc</span>}
                            <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", !isRead && "text-[#8D6E63]")} />
                        </div>
                     </button>
                  )
               })}
               </div>
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
                     className="flex-1 bg-[#FDF6EC] dark:bg-[#1E1512] border border-[#D7CCC8]/80 dark:border-[#4E342E] text-[#3E2723] dark:text-[#ECE5DC] focus:border-[#8D6E63] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] rounded-xl px-4 py-3 placeholder-gray-400 dark:placeholder-stone-500 text-sm"
                  />
                  <button
                     type="submit"
                     disabled={submittingComment || !commentText.trim() || !isLoggedIn}
                     className="bg-[#3E2723] hover:bg-[#2D1B19] text-[#FDF6EC] disabled:bg-stone-300 disabled:text-stone-400 dark:disabled:bg-stone-800 dark:disabled:text-stone-600 px-5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                     <Send className="w-3.5 h-3.5" />
                     Gửi
                  </button>
               </form>

               {/* Comments List */}
               <div className="space-y-4">
                  {comments.filter(c => !c.parentId).length === 0 ? (
                     <div className="py-10 text-center text-stone-400 text-sm italic">
                        Chưa có cuộc thảo luận hoặc quà tặng nào cho tác phẩm này. Hãy là người đầu tiên tiếp sức!
                     </div>
                  ) : (
                     comments.filter(c => !c.parentId).map((comment) => {
                        return (
                           <CommentNode
                              key={comment.id}
                              comment={comment}
                              comments={comments}
                              replyingToId={replyingToId}
                              setReplyingToId={setReplyingToId}
                              replyText={replyText}
                              setReplyText={setReplyText}
                              submittingReply={submittingReply}
                              handleSendReply={handleSendReply}
                              getTitleColor={getTitleColor}
                              isLoggedIn={isLoggedIn}
                              profilesCache={profilesCache}
                           />
                        );
                        const isGift = comment.type === 'choco_gift';
                        return (
                           <div 
                              key={comment.id} 
                              className={cn(
                                 "p-4 rounded-2xl flex gap-3.5 border transition-all shadow-sm",
                                 isGift 
                                    ? "bg-[#FDF6EC]/70 border-[#D7CCC8]/80 hover:bg-[#F5E6D3]" 
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
                                       <span className="font-extrabold text-sm shrink-0" style={{ color: getTitleColor(comment.activeTitle) || '#3E2723' }}>
                                          {comment.displayName}
                                          {comment.activeTitle && (
                                             <span className="px-1.5 py-0.5 bg-[#F5E6D3] text-[#5D4037] text-[9px] font-extrabold rounded-md uppercase tracking-tight select-none border border-[#D7CCC8] ml-1.5 inline-block align-middle">
                                                🏆 {comment.activeTitle}
                                             </span>
                                          )}
                                       </span>
                                       
                                       {isGift && (
                                          <span className="bg-[#F5E6D3] text-[#3E2723] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#D7CCC8] flex items-center gap-1 shadow-sm">
                                             <Sparkles className="w-3 h-3 text-[#8D6E63] inline shrink-0" />
                                             Tặng {comment.giftAmount} Choco 🍫
                                          </span>
                                       )}
                                    </div>
                                    
                                    <span className="text-[10px] text-stone-400 font-mono shrink-0">
                                       {comment.createdAt?.toDate 
                                          ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                                          : 'Vừa xong'}
                                    </span>
                                 </div>
                                 <p className={cn(
                                    "text-sm break-words leading-relaxed",
                                    isGift ? "text-[#5D4037] font-medium italic" : "text-stone-700"
                                 )}>
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
                                          className="flex-1 bg-[#FDF6EC] border border-[#D7CCC8]/80 text-[#3E2723] focus:border-[#8D6E63] focus:outline-none focus:ring-1 focus:ring-[#8D6E63] rounded-xl px-3.5 py-1.5 placeholder-gray-400 text-xs sm:text-sm"
                                          onKeyDown={(e) => {
                                             if (e.key === 'Enter' && replyText.trim() && !submittingReply) {
                                                handleSendReply(comment);
                                             }
                                          }}
                                       />
                                       <button 
                                          onClick={() => handleSendReply(comment)}
                                          disabled={submittingReply || !replyText.trim()}
                                          className="bg-[#3E2723] hover:bg-[#2D1B19] text-[#FDF6EC] disabled:bg-stone-300 disabled:text-stone-400 dark:disabled:bg-stone-800 dark:disabled:text-stone-600 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
                                       >
                                          {submittingReply ? 'Gửi...' : 'Gửi'}
                                       </button>
                                       <button 
                                          onClick={() => setReplyingToId(null)}
                                          className="text-stone-400 hover:text-stone-500 border border-stone-200 px-2 rounded-xl text-xs"
                                       >
                                          Hủy
                                       </button>
                                    </div>
                                 )}

                                 {/* Nested Thread Replies list */}
                                 {(() => {
                                    const replies = comments.filter(r => r.parentId === comment.id).sort((a: any, b: any) => {
                                       const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0));
                                       const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0));
                                       return timeA - timeB;
                                    });
                                    if (replies.length === 0) return null;
                                    return (
                                       <div className="mt-4 pl-3.5 border-l-2 border-[#D7CCC8]/40 space-y-3 ml-1">
                                          {replies.map((reply: any) => (
                                             <div key={reply.id} className="flex gap-2.5 items-start bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
                                                {reply.avatarUrl ? (
                                                   <img src={reply.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-stone-200" referrerPolicy="no-referrer" />
                                                ) : (
                                                   <div className="w-7 h-7 rounded-full bg-[#8D6E63] text-[#FDF6EC] flex items-center justify-center shrink-0 font-bold text-[10px] uppercase shadow-inner">
                                                      {reply.displayName?.substring(0, 2)}
                                                   </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                   <div className="flex items-center justify-between gap-2 mb-0.5">
                                                      <span className="font-bold text-xs" style={{ color: getTitleColor(reply.activeTitle) || '#3E2723' }}>
                                                         {reply.displayName}
                                                         {reply.activeTitle && (
                                                            <span className="px-1 py-0.5 bg-[#F5E6D3] text-[#5D4037] text-[8px] font-black rounded uppercase ml-1 shadow-sm border border-[#D7CCC8] inline-block align-middle">
                                                               🏆 {reply.activeTitle}
                                                            </span>
                                                         )}
                                                      </span>
                                                      <span className="text-[9px] text-stone-400 font-mono">
                                                         {reply.createdAt?.toDate 
                                                            ? new Date(reply.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                                                            : 'Vừa xong'}
                                                      </span>
                                                   </div>
                                                   <p className="text-xs text-stone-700 break-words leading-relaxed">
                                                      {reply.content}
                                                   </p>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    );
                                 })()}
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
                     <Gift className="w-5 h-5 text-[#8D6E63] animate-pulse" />
                     Gửi Quà Tặng Choco
                  </h3>
                  <button 
                     onClick={() => setShowGiftModal(false)}
                     className="text-stone-400 hover:text-stone-600 text-xs font-bold font-mono border border-stone-200 rounded-lg px-2 py-1"
                  >
                     Đóng
                  </button>
               </div>

               {/* Choco balance stats */}
               <div className="bg-[#FDF6EC] p-4 rounded-2xl border border-[#F5E6D3] mb-5 flex items-center justify-between">
                  <div>
                     <p className="text-stone-500 text-xs font-semibold">Túi Choco của bạn</p>
                     <p className="text-xl font-black text-[#3E2723]">{choco.toLocaleString()} 🍫</p>
                  </div>
                  <Sparkles className="w-6 h-6 text-[#8D6E63]" />
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

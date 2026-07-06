import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useFeatureRestriction } from '../types/features';
import { UserAvatar } from '../components/UserAvatar';
import { cn } from '../components/Layout';
import { Settings2, ArrowLeft, ArrowRight, List, Lock, Unlock, Zap, MessageSquare, Clock, Pause, CheckCircle, ExternalLink } from 'lucide-react';
import { db, checkIfQuotaError } from '../lib/firebase';
import { getStoryByIdOrSlug, getStoryChapters } from '../lib/storyLoader';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, where, doc, getDoc, updateDoc, increment, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { getWeeklyId, getGMT7Date } from '../types/achievements';
import { useUserProfilesCache } from '../hooks/useUserProfilesCache';
import { addStoryFire } from '../lib/storyFire';

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
   depth = 0,
   profilesCache = {},
   isStoryTheme = null
}: any) => {
   const { uid: storeUid, equippedStickerComment, stickerPositionComment, displayName: storeDisplayName, avatarUrl: storeAvatarUrl, activeTitle: storeActiveTitle, equippedAccessory: storeEquippedAccessory, accessoryPosition: storeAccessoryPosition } = useStore();
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
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
      return timeA - timeB;
   });

   const isGift = comment.type === 'choco_gift';

   return (
      <div key={comment.id} className={cn("text-xs pt-2 mt-2 border-t-2 border-dashed first:border-0", isStoryTheme ? (isStoryTheme === 'homer' ? "border-[#47515f]/20" : "border-[#2e2a63]/20") : "border-[#3E2723]/10 dark:border-[#4E342E]/30")}>
         <div className={cn(
            "relative flex gap-2.5 items-start p-2.5 rounded-2xl border-2 transition-all hover:-translate-y-0.5", 
            isStoryTheme 
               ? (isStoryTheme === 'homer' ? "bg-[#181f2d]/50 border-[#47515f]/50 text-[#a0a6b3] shadow-[1px_1px_0_0_#47515f]" : "bg-[#13120d]/50 border-[#2e2a63]/50 text-[#dbcec2] shadow-[1px_1px_0_0_#2e2a63]")
               : isDark 
                  ? "bg-[#1C1613] border-[#3E2723] text-[#ECE5DC] shadow-[1px_1px_0_0_#1C1613]" 
                  : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723] shadow-[1px_1px_0_0_#3E2723]", 
            currentSticker ? "pr-11" : ""
         )}>
             {currentSticker && (
               <img 
                 src={currentSticker} 
                 alt="Sticker" 
                 className="absolute w-12 h-12 object-contain pointer-events-none z-10 right-0 top-1/2 -translate-y-1/2" 
                 referrerPolicy="no-referrer"
               />
             )}
            <UserAvatar 
               avatarUrl={currentAvatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} 
               equippedAccessory={currentAccessory}
               accessoryPosition={currentAccessoryPos}
               className="w-8 h-8 shrink-0 pointer-events-none" 
               fallbackIconSizeClass={isStoryTheme ? (isStoryTheme === 'homer' ? "w-4 h-4 text-[#a0a6b3]" : "w-4 h-4 text-[#bbee1f]") : "w-4 h-4 text-[#A1887F]"} 
               borderClass={isStoryTheme ? (isStoryTheme === 'homer' ? "border border-[#47515f]/50" : "border border-[#2e2a63]/50") : "border border-[#D7CCC8]/30"}
               bgClass={isStoryTheme ? (isStoryTheme === 'homer' ? "bg-[#181f2d]" : "bg-[#13120d]") : (isDark ? "bg-[#2C221D]" : "bg-[#5D4037]")}
            />
            <div className="flex-1 min-w-0">
               <div className="text-[11px] font-black mb-0.5 flex justify-between tracking-tight">
                  <span className="flex items-center gap-1 flex-wrap">
                     <span style={{ color: getTitleColor(currentActiveTitle) || (isStoryTheme ? (isStoryTheme === 'homer' ? "#a0a6b3" : "#bbee1f") : undefined) }}>
                        {currentDisplayName}
                     </span>
                     {currentActiveTitle && (
                        <span className={cn(
                           "px-1 py-0.5 text-[7px] font-black rounded border",
                           isStoryTheme 
                              ? (isStoryTheme === 'homer' ? "bg-[#47515f] text-[#a0a6b3] border-[#67707e]/40" : "bg-[#2e2a63] text-[#bbee1f] border-[#695b7f]/40")
                              : "bg-[#F5E6D3] text-[#5D4037] border-[#3E2723]"
                        )}>
                           🏆 {currentActiveTitle}
                        </span>
                     )}
                  </span>
                  <span className={cn("text-[9px] font-mono", isStoryTheme ? (isStoryTheme === 'homer' ? "text-[#67707e]" : "text-[#695b7f]") : "text-stone-400")}>
                     {comment.createdAt?.toDate 
                        ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Vừa xong'}
                  </span>
               </div>
               
               {isGift && (
                  <span className={cn("inline-flex text-[8px] font-black px-2 py-0.5 uppercase tracking-wider items-center gap-1 mb-1 border",
                     isStoryTheme === 'homer'
                        ? "text-[#181f2d] bg-[#a0a6b3] border-[#a0a6b3]/50"
                        : (isStoryTheme === 'homer' ? "text-[#181f2d] bg-[#a0a6b3] border-[#a0a6b3]/50" : "text-[#13120d] bg-[#bbee1f] border-[#bbee1f]/50")
                  )}>
                     🎁 {isStoryTheme === 'homer' ? "Tiếp tế" : "Tài trợ"} {comment.giftAmount || 0} CC
                  </span>
               )}

               <p className={cn("text-xs leading-relaxed text-justify break-words font-semibold", isStoryTheme ? (isStoryTheme === 'homer' ? "text-[#a0a6b3]" : "text-[#dbcec2]") : (isDark ? "text-[#ECE5DC]" : "text-[#5D4037]"))}>
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
                     className={cn("text-[10px] font-black uppercase tracking-wider block mt-1 cursor-pointer transition-colors", isStoryTheme ? (isStoryTheme === 'homer' ? "text-[#67707e] hover:text-[#a0a6b3]" : "text-[#695b7f] hover:text-[#bbee1f]") : "text-[#8D6E63] hover:text-[#5D4037]")}
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
                        className={cn(
                           "flex-1 px-3 py-1.5 text-xs rounded-xl border-2 focus:outline-none font-semibold", 
                           isStoryTheme ? (isStoryTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] focus:border-[#a0a6b3]" : "bg-[#13120d] border-[#2e2a63] text-[#dbcec2] focus:border-[#bbee1f]") 
                              : isDark 
                                 ? "bg-white dark:bg-[#1A1412] border-[#3E2723] text-[#ECE5DC] focus:border-[#8D6E63]" 
                                 : "bg-white border-[#3E2723] text-[#3E2723] focus:border-[#8D6E63]"
                        )}
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
                        className={cn(
                           "px-3 py-1 rounded-xl text-xs font-black uppercase transition-all cursor-pointer border-2",
                           isStoryTheme 
                              ? (isStoryTheme === 'homer' ? "bg-[#a0a6b3] hover:bg-white text-[#181f2d] border-[#47515f] disabled:bg-[#a0a6b3]/20 disabled:text-[#a0a6b3]/40 disabled:border-[#47515f]/50 disabled:shadow-none" : "bg-[#bbee1f] hover:bg-white text-[#13120d] border-[#2e2a63] disabled:bg-[#bbee1f]/20 disabled:text-[#dbcec2]/40 disabled:border-[#2e2a63]/50 disabled:shadow-none") 
                              : "disabled:opacity-50 bg-[#8D6E63] hover:bg-[#5D4037] text-white border-[#3E2723]"
                        )}
                     >
                        Gửi
                     </button>
                  </div>
               )}
            </div>
         </div>

         {replies.length > 0 && (
            <div className={cn(
               "mt-2 pl-4 space-y-2 border-l-2 border-dashed",
               isStoryTheme ? (isStoryTheme === 'homer' ? "border-[#47515f]/20" : "border-[#2e2a63]/20") : "border-[#3E2723]/20 dark:border-white/10",
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
                     isStoryTheme={isStoryTheme}
                     profilesCache={profilesCache}
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
   depth = 0,
   profilesCache = {},
   isStoryTheme = null
}: any) => {
   const { uid: storeUid, equippedStickerComment, stickerPositionComment, displayName: storeDisplayName, avatarUrl: storeAvatarUrl, activeTitle: storeActiveTitle, equippedAccessory: storeEquippedAccessory, accessoryPosition: storeAccessoryPosition } = useStore();
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
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
      return timeA - timeB;
   });

   const isGift = comment.type === 'choco_gift';

   return (
      <div key={comment.id} className={cn(
         "relative p-5 rounded-3xl border-3 flex flex-col gap-3 transition-all hover:-translate-y-0.5 whitespace-normal", 
         isStoryTheme 
            ? (isStoryTheme === 'homer' ? "bg-[#181f2d]/50 border-[#47515f]/50 text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f]" : "bg-[#13120d]/50 border-[#2e2a63]/50 text-[#dbcec2] shadow-[2px_2px_0_0_#2e2a63]")
            : isDark 
               ? "bg-[#1C1613] border-[#3E2723] text-[#ECE5DC] shadow-[2px_2px_0_0_#1A1412]" 
               : "bg-[#FFFDF9] border-[#3E2723] text-[#3E2723] shadow-[2px_2px_0_0_#3E2723]", 
         currentSticker ? "pr-14" : ""
      )}>
         {currentSticker && (
           <img 
             src={currentSticker} 
             alt="Sticker" 
             className="absolute w-14 h-14 object-contain pointer-events-none z-10 right-0 top-1/2 -translate-y-1/2" 
             referrerPolicy="no-referrer"
           />
         )}
         <div className="flex gap-3.5">
            <UserAvatar 
               avatarUrl={currentAvatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} 
               equippedAccessory={currentAccessory}
               accessoryPosition={currentAccessoryPos}
               className="w-10 h-10 shrink-0 pointer-events-none" 
               fallbackIconSizeClass={isStoryTheme ? (isStoryTheme === 'homer' ? "w-5 h-5 text-[#a0a6b3]" : "w-5 h-5 text-[#bbee1f]") : "w-5 h-5 text-[#A1887F]"} 
               borderClass={isStoryTheme ? (isStoryTheme === 'homer' ? "border border-[#47515f]/50" : "border border-[#2e2a63]/50") : "border border-[#D7CCC8]/30"}
               bgClass={isStoryTheme ? (isStoryTheme === 'homer' ? "bg-[#181f2d]" : "bg-[#13120d]") : (isDark ? "bg-[#2C221D]" : "bg-[#5D4037]")}
            />
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-black text-xs flex items-center gap-1.5 flex-wrap">
                     <span style={{ color: getTitleColor(currentActiveTitle) || (isStoryTheme ? (isStoryTheme === 'homer' ? "#a0a6b3" : "#bbee1f") : undefined) }}>
                        {currentDisplayName}
                     </span>
                     {currentActiveTitle && (
                        <span className={cn(
                           "px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-tight select-none border inline-block align-middle",
                           isStoryTheme 
                              ? (isStoryTheme === 'homer' ? "bg-[#47515f] text-[#a0a6b3] border-[#67707e]/40" : "bg-[#2e2a63] text-[#bbee1f] border-[#695b7f]/40")
                              : "bg-[#F5E6D3] text-[#5D4037] border-[#3E2723]"
                        )}>
                           🏆 {currentActiveTitle}
                        </span>
                     )}
                  </span>
                  
                  <span className={cn("text-[9px] font-mono shrink-0", isStoryTheme ? (isStoryTheme === 'homer' ? "text-[#67707e]" : "text-[#695b7f]") : "text-stone-400")}>
                     {comment.createdAt?.toDate 
                        ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Vừa xong'}
                  </span>
               </div>

               {isGift && (
                  <span className={cn("inline-flex text-[9px] font-black px-3 py-1 uppercase tracking-wider items-center gap-1.5 mb-2 border",
                     isStoryTheme === 'homer'
                        ? "text-[#181f2d] bg-[#a0a6b3] border-[#a0a6b3]/50"
                        : (isStoryTheme === 'homer' ? "text-[#181f2d] bg-[#a0a6b3] border-[#a0a6b3]/50" : "text-[#13120d] bg-[#bbee1f] border-[#bbee1f]/50")
                  )}>
                     🎁 {isStoryTheme === 'homer' ? "Tiếp tế" : "Tài trợ"} {comment.giftAmount || 0} CC
                  </span>
               )}

               <p className={cn("text-xs leading-relaxed text-justify break-words font-semibold", isStoryTheme ? (isStoryTheme === 'homer' ? "text-[#a0a6b3]" : "text-[#dbcec2]") : (isDark ? "text-[#ECE5DC]" : "text-[#5D4037]"))}>
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
                        className={cn("text-xs font-black flex items-center gap-1 cursor-pointer transition-colors uppercase tracking-wider", isStoryTheme ? (isStoryTheme === 'homer' ? "text-[#67707e] hover:text-[#a0a6b3]" : "text-[#695b7f] hover:text-[#bbee1f]") : "text-[#8D6E63] hover:text-[#5D4037]")}
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
                        className={cn(
                           "flex-1 px-3.5 py-1.5 text-xs sm:text-sm rounded-xl border-2 focus:outline-none font-semibold", 
                           isStoryTheme ? (isStoryTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] focus:border-[#a0a6b3]" : "bg-[#13120d] border-[#2e2a63] text-[#dbcec2] focus:border-[#bbee1f]") 
                              : isDark 
                                 ? "bg-white dark:bg-[#1A1412] border-[#3E2723] text-[#ECE5DC] focus:border-[#8D6E63]" 
                                 : "bg-white border-[#3E2723] text-[#3E2723] focus:border-[#8D6E63]"
                        )}
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
                        className={cn(
                           "px-4 py-1.5 font-black text-xs rounded-xl border-2 transition-all cursor-pointer",
                           isStoryTheme 
                              ? (isStoryTheme === 'homer' ? "bg-[#a0a6b3] hover:bg-white text-[#181f2d] border-[#47515f] disabled:bg-[#a0a6b3]/20 disabled:text-[#a0a6b3]/40 disabled:border-[#47515f]/50 disabled:shadow-none" : "bg-[#bbee1f] hover:bg-white text-[#13120d] border-[#2e2a63] disabled:bg-[#bbee1f]/20 disabled:text-[#dbcec2]/40 disabled:border-[#2e2a63]/50 disabled:shadow-none") 
                              : "disabled:opacity-50 bg-[#8D6E63] hover:bg-[#5D4037] text-white border-[#3E2723]"
                        )}
                     >
                        Gửi
                     </button>
                  </div>
               )}
            </div>
         </div>

         {replies.length > 0 && (
            <div className={cn(
               "pl-4 space-y-3 border-l-2 border-dashed mt-1",
               isStoryTheme ? (isStoryTheme === 'homer' ? "border-[#47515f]/20" : "border-[#2e2a63]/20") : "border-[#3E2723]/20 dark:border-white/10",
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
                     isStoryTheme={isStoryTheme}
                     profilesCache={profilesCache}
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
    ownedPassTickets, ownedPriorityTickets, setStoreOpen, getTitleColor, theme,
    setLockedFeatureId
  } = useStore();

  const { isFeatureLocked } = useFeatureRestriction();

  useEffect(() => {
    if (isFeatureLocked('reading')) {
      setLockedFeatureId('reading');
      navigate('/');
    }
  }, [isFeatureLocked, navigate, setLockedFeatureId]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('reader-font-family') || 'font-reading-nunito';
  });
  const [isDark, setIsDark] = useState(theme === 'dark');
  const [useStoryTheme, setUseStoryTheme] = useState(() => {
    const saved = localStorage.getItem('reader-use-story-theme');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('reader-use-story-theme', String(useStoryTheme));
  }, [useStoryTheme]);

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
  
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [liveChapter, setLiveChapter] = useState<any>(null);
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
    setLiveChapter(null);
    window.scrollTo(0, 0);
  }, [chapterId]);

  useEffect(() => {
    if (!storyId) return;
    const fetchData = async () => {
      try {
        const foundStory = await getStoryByIdOrSlug(storyId);
        if (foundStory) {
          setStory(foundStory);
          const foundChapters = await getStoryChapters(foundStory.id);
          setChapters(foundChapters);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storyId]);

  useEffect(() => {
    if (!storyId || !chapterId) return;

    // Nếu chapters đã tải xong, kiểm tra xem chương này ở file tĩnh đã được mở khóa/không khóa chưa
    if (chapters.length > 0) {
      const idx = chapters.findIndex(c => c.id === chapterId);
      if (idx !== -1) {
        const base = chapters[idx];
        const isStaticLocked = base.isLockedRead || base.requiresPass || base.requiresEarlyAccess;
        if (!isStaticLocked) {
          // Chương ở file tĩnh vốn không có khóa, không cần gọi Firestore nữa để tiết kiệm Quota
          setLiveChapter(null);
          return;
        }
      }
    }

    const fetchLiveChapter = async () => {
      try {
        let resolvedStoryId = storyId;
        const foundStory = await getStoryByIdOrSlug(storyId);
        if (foundStory) {
          resolvedStoryId = foundStory.id;
        }
        const docRef = doc(db, `stories/${resolvedStoryId}/chapters`, chapterId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLiveChapter({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error fetching live chapter details:", err);
      }
    };
    fetchLiveChapter();
  }, [storyId, chapterId, chapters]);

  const currentChapterIndex = chapters.findIndex(c => c.id === chapterId);
  const baseChapter = chapters[currentChapterIndex];
  const currentChapter = liveChapter ? { ...baseChapter, ...liveChapter } : baseChapter;
  
  const prevChapter = chapters[currentChapterIndex - 1];
  const nextChapter = chapters[currentChapterIndex + 1];

  const [comments, setComments] = useState<any[]>([]);

  const userIds = comments.map(c => c.uid).filter(Boolean) as string[];
  const profilesCache = useUserProfilesCache(userIds);

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
             storyId: story.id,
             storyTitle: story.title || 'Truyện',
             chapterId: currentChapter?.id || null,
             chapterTitle: currentChapter?.title || 'Chương',
             paragraphIdx: paragraphIdx ?? null,
             createdAt: serverTimestamp(),
             equippedSticker: useStore.getState().equippedStickerComment || null,
            stickerPosition: useStore.getState().stickerPositionComment || 'top-right',
            equippedAccessory: useStore.getState().equippedAccessory || null,
            accessoryPosition: useStore.getState().accessoryPosition || null
         });
         addCommentProgress();
         if (storyId) {
            addStoryFire(storyId, 1);
         }
         notifyAdminOfComment({
            authorName: displayName || 'Nhà lữ hành ẩn danh',
            storyTitle: story?.title || 'Truyện',
            storyId: storyId!,
            chapterId: currentChapter?.id || null,
            chapterTitle: currentChapter?.title || 'Chương',
            content: type === 'sticker' ? '💬 [Bình luận sticker]' : content
         });
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
           storyId: story.id,
           storyTitle: story.title || 'Truyện',
           chapterId: currentChapter?.id || null,
           chapterTitle: currentChapter?.title || 'Chương',
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

        if (storyId) {
           addStoryFire(storyId, 1);
        }

        notifyAdminOfComment({
           authorName: displayName || 'Nhà lữ hành ẩn danh',
           storyTitle: story?.title || 'Truyện',
           storyId: storyId!,
           chapterId: currentChapter?.id || null,
           chapterTitle: currentChapter?.title || 'Chương',
           content: `↩️ Trả lời [${parentComment.displayName || 'Vô danh'}]: ${replyText.trim()}`
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
        
        addCommentProgress();

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

  const isLocked = !!(needsPass || needsEarlyAccess || currentChapter?.isLockedRead);

  // Split into words to get Vietnamese word count
  const wordCount = currentChapter?.content ? currentChapter.content.split(/\s+/).filter(Boolean).length : 0;
  // Tính tốc độ đọc trung bình: 5 từ/giây (khoảng 300 từ/phút, phù hợp để đọc lướt nhanh truyện mạng).
  // Giới hạn trong khoảng từ 5 giây (với chương cực ngắn/thông báo) đến tối đa 60 giây (với chương siêu dài) để tối ưu hóa trải nghiệm đọc và chống click-farm.
  const timeRequired = Math.max(5, Math.min(60, Math.ceil(wordCount / 5)));

  const handleReadingFinished = () => {
    if (storyId && currentChapter) {
       const todayStr = format(getGMT7Date(), 'yyyy-MM-dd');
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

  if (loading || !story || !currentChapter) {
    return (
      <div className="min-h-screen bg-[#13120d] text-[#dbcec2] flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2e2a63] border-t-[#bbee1f] rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-[0.2em] text-[#695b7f] animate-pulse">
            ĐANG TẢI DỮ LIỆU TÀI LIỆU...
          </div>
        </div>
      </div>
    );
  }

  const activeCustomTheme: 'giagoan' | 'homer' | null = 
    story?.title?.toLowerCase().includes('hướng dẫn giả ngoan') ? 'giagoan' :
    (story?.title?.toLowerCase().includes('cánh cửa homer') || story?.title?.toLowerCase().includes('canh cua homer')) ? 'homer' : null;

  const hasCustomTheme = !!activeCustomTheme;
  const isCustomThemeActive = !!(hasCustomTheme && useStoryTheme);
  const effectiveIsDark = isCustomThemeActive ? true : isDark;
  const effectiveFontFamily = isCustomThemeActive ? (activeCustomTheme === 'homer' ? 'font-reading-iosevka' : 'font-reading-garamond') : fontFamily;
  const tChapterLabel = activeCustomTheme === 'homer' ? "Tọa độ" : activeCustomTheme === 'giagoan' ? "Tài liệu" : "Chương";
  const tChapterCapLabel = activeCustomTheme === 'homer' ? "TỌA ĐỘ" : activeCustomTheme === 'giagoan' ? "TÀI LIỆU" : "CHƯƠNG";
  const tPrevChapter = activeCustomTheme === 'homer' ? "Tọa độ trước" : activeCustomTheme === 'giagoan' ? "Tài liệu trước" : "Chương trước";
  const tNextChapter = activeCustomTheme === 'homer' ? "Tọa độ sau" : activeCustomTheme === 'giagoan' ? "Tài liệu sau" : "Chương sau";
  const tChapterEarly = activeCustomTheme === 'homer' ? "Tọa độ Đọc Sớm" : activeCustomTheme === 'giagoan' ? "Tài liệu Đọc Sớm" : "Chương Đọc Sớm";
  const tChapterLocked = activeCustomTheme === 'homer' ? "Đã khóa tọa độ" : activeCustomTheme === 'giagoan' ? "Đã khóa tài liệu" : "Đã khóa chương";
  const tReadThis = activeCustomTheme === 'homer' ? "Đọc tọa độ này" : activeCustomTheme === 'giagoan' ? "Đọc tài liệu này" : "Đọc chương này";
  const tChapterSingle = activeCustomTheme === 'homer' ? "tọa độ" : activeCustomTheme === 'giagoan' ? "tài liệu" : "chương";
  const tParagraphComment = activeCustomTheme === 'homer' ? "Phản hồi tọa độ" : activeCustomTheme === 'giagoan' ? "Ý kiến đoạn" : "Bình luận đoạn";
  const tNoParagraphComment = activeCustomTheme === 'homer' ? "Chưa có phản hồi nào cho tọa độ này." : activeCustomTheme === 'giagoan' ? "Chưa có ý kiến nào cho đoạn này." : "Chưa có bình luận. Hãy là người đầu tiên!";
  const tParagraphPlaceholder = activeCustomTheme === 'homer' ? "Viết phản hồi..." : activeCustomTheme === 'giagoan' ? "Viết đề xuất..." : "Viết bình luận...";
  const tParagraphSubmit = activeCustomTheme === 'homer' ? "Phát" : activeCustomTheme === 'giagoan' ? "Trình" : "Gửi";
  const tParagraphLogin = activeCustomTheme === 'homer' ? "Đăng nhập để phản hồi" : activeCustomTheme === 'giagoan' ? "Đăng nhập để trình ý kiến" : "Đăng nhập để bình luận";
  const tCommentAreaTitle = activeCustomTheme === 'homer' ? "Báo cáo sóng phản hồi" : activeCustomTheme === 'giagoan' ? "Đề xuất và ý kiến" : "Bình luận chương";
  const tCommentAreaPlaceholder = activeCustomTheme === 'homer' ? "Nhập sóng phản hồi của bạn..." : activeCustomTheme === 'giagoan' ? "Nhập đề xuất và ý kiến của bạn..." : "Nhập bình luận của bạn...";
  const tCommentAreaPlaceholderLogin = activeCustomTheme === 'homer' ? "Đăng nhập để phát sóng phản hồi" : activeCustomTheme === 'giagoan' ? "Đăng nhập để trình ý kiến" : "Đăng nhập để bình luận";
  const tCommentSubmit = activeCustomTheme === 'homer' ? "Phát sóng" : activeCustomTheme === 'giagoan' ? "Trình ý kiến" : "Gửi bình luận";
  const tNoComment = activeCustomTheme === 'homer' ? "Chưa có phản hồi nào." : activeCustomTheme === 'giagoan' ? "Chưa có đề xuất và ý kiến nào cho tài liệu này." : "Chưa có bình luận nào cho chương này.";

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 pb-32 font-medium flex flex-col items-center",
      isCustomThemeActive 
        ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] text-[#a0a6b3]" : "bg-[#13120d] text-[#dbcec2]")
        : effectiveIsDark 
          ? "bg-[#1A1412] text-[#ECE5DC]" 
          : "bg-[#FDF6EC] text-[#3E2723]"
    )}>
       <style>{`
         .reader-container-font {
           font-family: ${
             effectiveFontFamily === 'font-reading-iosevka' ? '"Iosevka", monospace' :
             effectiveFontFamily === 'font-reading-garamond' ? '"EB Garamond", serif' :
             effectiveFontFamily === 'font-reading-notoserif' ? '"Noto Serif", Georgia, serif' :
             '"Quicksand", sans-serif'
           } !important;
         }
       `}</style>
       {isCustomThemeActive && (
         <>
           <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: activeCustomTheme === 'homer' 
                   ? 'repeating-linear-gradient(45deg, #2d3745 0, #2d3745 1px, transparent 1px, transparent 60px)'
                  : 'repeating-linear-gradient(45deg, #2e2a63 0, #2e2a63 1px, transparent 1px, transparent 50px)' }} />
           <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-30 pointer-events-none"
                style={activeCustomTheme === 'homer' ? { backgroundColor: '#47515f' } : { backgroundColor: '#2e2a63' }} />
           <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[180px] opacity-10 pointer-events-none"
                style={activeCustomTheme === 'homer' ? { backgroundColor: '#67707e' } : { backgroundColor: '#bbee1f' }} />
         </>
       )}
       {/* Top Navigation */}
       <header className={cn("w-full sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b-2 transition-all duration-300 shadow-sm relative",
          isCustomThemeActive
            ? (activeCustomTheme === 'homer' ? "bg-[#181f2d]/90 border-[#47515f] backdrop-blur-md" : "bg-[#13120d]/90 border-[#2e2a63] backdrop-blur-md")
            : effectiveIsDark ? "bg-[#1A1412]/90 border-[#3E2723] backdrop-blur-md" : "bg-[#FDF6EC]/90 border-[#D7CCC8] backdrop-blur-md"
       )}>
          <button onClick={() => navigate(`/story/${story.id}`)} className={cn("p-2 rounded-xl border-2 transition-all cursor-pointer shadow-[2px_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none",
             isCustomThemeActive ? (activeCustomTheme === 'homer' ? "border-[#47515f]/50 bg-[#181f2d] hover:bg-[#47515f]/20 hover:border-[#a0a6b3] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f]" : "border-[#2e2a63]/50 bg-[#13120d] hover:bg-[#2e2a63]/20 hover:border-[#bbee1f] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63]")
                : "border-[#3E2723] bg-white dark:bg-[#2C221D] hover:bg-stone-100 dark:hover:bg-[#1A1412]"
          )}>
             <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0 text-center px-4">
             <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-0.5 truncate">{story.title}</div>
             <h1 className="text-base sm:text-lg font-black tracking-tight">{currentChapter.title}</h1>
          </div>
          
          <div className="relative flex items-center gap-2">
             <button onClick={() => setShowSettings(!showSettings)} className={cn("p-2 rounded-xl border-2 shadow-[2px_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer",
                isCustomThemeActive ? (activeCustomTheme === 'homer' ? "border-[#47515f]/50 bg-[#181f2d] hover:bg-[#47515f]/20 hover:border-[#a0a6b3] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f]" : "border-[#2e2a63]/50 bg-[#13120d] hover:bg-[#2e2a63]/20 hover:border-[#bbee1f] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63]")
                   : "border-[#3E2723] bg-white dark:bg-[#2C221D] hover:bg-stone-100 dark:hover:bg-[#1A1412]"
             )}>
                <Settings2 className="w-5 h-5" />
             </button>
             
             {/* Settings Panel */}
             {showSettings && (
                <div className={cn("absolute right-0 top-full mt-2 w-64 p-5 rounded-3xl shadow-xl z-20 border-3 transition-colors",
                    isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] text-[#a0a6b3] border-[#47515f] font-reading-garamond shadow-lg" : "bg-[#13120d] text-[#dbcec2] border-[#2e2a63] font-reading-garamond shadow-lg")
                       : effectiveIsDark ? "bg-[#211B18] text-[#ECE5DC] border-[#3E2723]" : "bg-[#FFFDF9] text-[#3E2723] border-[#3E2723]"
                )}>
                   <h3 className={cn("font-black mb-4 uppercase tracking-wider text-sm", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#a0a6b3]" : "text-[#bbee1f]") : (effectiveIsDark ? "text-[#ECE5DC]" : "text-[#3E2723]"))}>Cài đặt</h3>
                   <div className="flex flex-col gap-6">
                      {hasCustomTheme && (
                         <div className={cn("flex flex-col gap-2 pb-4 border-b-2 border-dashed", activeCustomTheme === 'homer' ? 'border-[#47515f]/20' : 'border-[#2e2a63]/20')}>
                            <label className={cn("text-xs font-black uppercase flex items-center justify-between", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#a0a6b3]" : "text-[#bbee1f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>
                               Giao diện truyện
                               {activeCustomTheme === 'homer' ? <span className="text-[9px] bg-[#a0a6b3] text-[#181f2d] font-bold px-1.5 py-0.5 rounded border border-[#a0a6b3]">PREMIUM</span> : <span className="text-[9px] bg-[#bbee1f] text-[#13120d] font-bold px-1.5 py-0.5 rounded border border-[#bbee1f]">PREMIUM</span>}
                            </label>
                            <button 
                               type="button"
                               onClick={() => setUseStoryTheme(!useStoryTheme)}
                               className={cn(
                                  "w-full py-2 text-xs font-black uppercase rounded-xl border-2 transition-all cursor-pointer",
                                  useStoryTheme
                                     ? (activeCustomTheme === 'homer' ? "bg-[#a0a6b3] text-[#181f2d] border-[#47515f] shadow-[2px_2px_0_0_#47515f] hover:bg-white" : "bg-[#bbee1f] text-[#13120d] border-[#2e2a63] shadow-[2px_2px_0_0_#2e2a63] hover:bg-white") 
                                     : (effectiveIsDark ? "bg-[#2C221D] text-[#ECE5DC] border-[#3E2723] hover:bg-[#3E2723]" : "bg-white text-[#3E2723] border-[#3E2723] hover:bg-stone-100")
                               )}
                            >
                               {useStoryTheme ? 'Tắt' : 'Bật'}
                            </button>
                         </div>
                      )}
                      <div className="flex items-center justify-between">
                         <label className={cn("text-xs font-black uppercase", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#67707e]" : "text-[#695b7f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>Chế độ nền tối</label>
                         <div className="flex items-center gap-2">
                            <button type="button" onClick={() => { setIsDark(false); if(isCustomThemeActive) setUseStoryTheme(false); }} style={{ backgroundColor: '#FDF6EC' }} className={cn("w-10 h-10 rounded-full border-3", !effectiveIsDark && !isCustomThemeActive ? (activeCustomTheme === 'homer' ? "border-[#3E2723]" : "border-[#3E2723]") : "border-[#D7CCC8]")}></button>
                            <button type="button" onClick={() => { setIsDark(true); if(isCustomThemeActive) setUseStoryTheme(false); }} style={{ backgroundColor: '#1A1412' }} className={cn("w-10 h-10 rounded-full border-3", effectiveIsDark && !isCustomThemeActive ? (activeCustomTheme === 'homer' ? "border-[#D4AF37]" : "border-[#D4AF37]") : "border-[#3C2E27]")}></button>
                         </div>
                      </div>
                      <div>
                         <label className={cn("text-xs font-black uppercase mb-3 block", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#67707e]" : "text-[#695b7f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>Cỡ chữ: {fontSize}px</label>
                         <input type="range" min="14" max="28" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className={cn("w-full accent-[#3E2723]", isCustomThemeActive && (activeCustomTheme === 'homer' ? "accent-[#a0a6b3]" : "accent-[#bbee1f]"))} />
                      </div>
                      <div>
                         <label className={cn("text-xs font-black uppercase mb-3 block", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#67707e]" : "text-[#695b7f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>Phông chữ</label>
                         <select 
                           value={fontFamily} 
                           disabled={isCustomThemeActive}
                           onChange={(e) => setFontFamily(e.target.value as any)}
                           className={cn(
                             "w-full p-2.5 rounded-xl border-2 font-black text-sm transition-all focus:outline-none focus:border-[#8D6E63]",
                             isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] text-[#a0a6b3] border-[#47515f] cursor-not-allowed opacity-75" : "bg-[#13120d] text-[#dbcec2] border-[#2e2a63] cursor-not-allowed opacity-75")
                             : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-[#ECE5DC]" : "bg-white border-[#3E2723] text-[#3E2723]"
                           )}
                         >
                            <option value="font-reading-quicksand">Quicksand (Mặc định)</option>
                            <option value="font-reading-garamond">EB Garamond (Cổ điển)</option>
                            <option value="font-reading-notoserif">Noto Serif (Truyền thống)</option>
                            <option value="font-reading-iosevka">Iosevka (Kỹ thuật)</option>
                         </select>
                         {isCustomThemeActive && <span className={cn("text-[10px] mt-1 block", activeCustomTheme === 'homer' ? "text-[#a0a6b3]" : "text-[#bbee1f]")}>{activeCustomTheme === 'homer' ? 'Khóa phông chữ Iosevka theo theme' : 'Khóa phông chữ EB Garamond theo theme'}</span>}
                      </div>
                   </div>
                </div>
             )}
          </div>
       </header>

       <main className="w-full max-w-2xl px-6 md:px-8 py-12 flex-1 relative z-0">
          <article 
              className={cn(
                  "reader-container-font prose dark:prose-invert max-w-none relative",
                  "prose-p:leading-[1.8] prose-p:mb-6",
                  "prose-h2:text-2xl prose-h2:font-black prose-h2:mt-12 prose-h2:mb-6",
                  "prose-blockquote:border-l-4 prose-blockquote:border-[#8D6E63] prose-blockquote:pl-6 prose-blockquote:italic",
                  isCustomThemeActive
                       ? (activeCustomTheme === 'homer'
                           ? "prose-p:text-[#a0a6b3] prose-h2:text-[#a0a6b3] prose-blockquote:border-[#47515f] prose-blockquote:text-[#67707e]"
                           : "prose-p:text-[#dbcec2] prose-h2:text-[#bbee1f] prose-blockquote:border-[#2e2a63] prose-blockquote:text-[#695b7f]")
                       : effectiveIsDark 
                           ? "prose-p:text-[#ECE5DC] prose-h2:text-[#ECE5DC] prose-blockquote:text-[#D7CCC8]"
                           : "prose-p:text-[#3E2723] prose-h2:text-[#3E2723] prose-blockquote:text-[#5D4037]",
                  effectiveFontFamily
              )}
             style={{ fontSize: `${fontSize}px` }}
         >
                 {paragraphs.map((p: string, idx: number) => {
                    const pComments = comments.filter(c => c.type === 'paragraph' && c.paragraphIdx === idx && !c.parentId);
                    return (
                        <div key={idx} className="relative group/para">
                           <p className="relative w-full cursor-pointer md:cursor-auto mb-6" onClick={() => {
                               if (window.getSelection()?.toString().length === 0) {
                                  setActiveParagraphIndex(activeParagraphIndex === idx ? null : idx);
                               }
                           }}>
                               {p}
                               <button 
                                   onClick={(e) => { e.stopPropagation(); setActiveParagraphIndex(activeParagraphIndex === idx ? null : idx); }} 
                                   className={cn("inline-flex ml-3 items-center justify-center opacity-40 md:opacity-0 md:group-hover/para:opacity-100 transition-opacity hover:opacity-100 align-baseline cursor-pointer", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "hover:text-[#a0a6b3]" : "hover:text-[#bbee1f]") : "hover:text-[#8D6E63]", pComments.length > 0 && (isCustomThemeActive ? (activeCustomTheme === 'homer' ? "opacity-100 md:opacity-100 text-[#a0a6b3]" : "opacity-100 md:opacity-100 text-[#bbee1f]") : "opacity-100 md:opacity-100 text-[#8D6E63]"))}
                               >
                                  <MessageSquare className="w-[0.8em] h-[0.8em] inline-block -translate-y-[0.15em]" />
                                  {pComments.length > 0 && <span className="text-[0.55em] font-bold ml-1 -translate-y-[0.3em]">{pComments.length}</span>}
                               </button>
                           </p>

                           {activeParagraphIndex === idx && (
                               <div className={cn("mt-4 p-5 rounded-2xl border-2 transition-all", 
                                    isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d]/95 border-[#47515f] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f]" : "bg-[#13120d]/95 border-[#2e2a63] text-[#dbcec2] shadow-[2px_2px_0_0_#2e2a63]") 
                                       : effectiveIsDark 
                                          ? "bg-[#120E0C] border-[#3E2723] shadow-[2px_2px_0_0_#3E2723]" 
                                          : "bg-[#FFFDF9] border-[#3E2723] shadow-[2px_2px_0_0_#3E2723]"
                                )}>
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className={cn("text-sm font-bold uppercase tracking-wider", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#a0a6b3]" : "text-[#bbee1f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>{tParagraphComment}</h4>
                                       <button onClick={() => setActiveParagraphIndex(null)} className="text-xs uppercase font-bold opacity-50 hover:opacity-100">Đóng</button>
                                   </div>
                                   
                                   <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 pt-4">
                                       {pComments.length === 0 ? (
                                           <div className="text-center italic text-sm opacity-50 py-2">{tNoParagraphComment}</div>
                                       ) : (
                                           pComments.map(c => { return <ParagraphCommentNode key={c.id} comment={c} comments={comments} replyingToId={replyingToId} setReplyingToId={setReplyingToId} replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} handleSendReply={handleSendReply} getTitleColor={getTitleColor} isLoggedIn={isLoggedIn} isDark={effectiveIsDark} isStoryTheme={activeCustomTheme} profilesCache={profilesCache} />; if (false) { return (
                                               <div key={c.id} className="flex flex-col gap-1 w-full border-b border-stone-100/15 pb-3 last:border-0 last:pb-0">
                                                   <div className="flex gap-3">
                                                       <img src={c.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="hidden" />
                                                        <div className="w-8 h-8 shrink-0 relative bg-stone-200 rounded-full">
                                                            <img src={c.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="w-full h-full rounded-full object-cover" />
                                                            {c.equippedSticker && (
                                                                <img 
                                                                    src={c.equippedSticker} 
                                                                    alt="Sticker" 
                                                                    className="absolute w-8 h-8 object-contain pointer-events-none z-10 -right-3 top-1/2 -translate-y-1/2" 
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                            )}
                                                        </div>
                                                       <div className="flex-1 min-w-0">
                                                           <div className="text-xs font-bold mb-0.5 flex items-center gap-1" style={{ color: getTitleColor(c.activeTitle) || undefined }}>
                                                               {c.displayName}
                                                               {c.activeTitle && (
                                                                   <span className="px-1.5 py-0.5 bg-[#F5E6D3]/80 text-[#5D4037] text-[8px] font-extrabold rounded-md uppercase tracking-tight select-none border border-[#D7CCC8]">
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
                                                               <div key={reply.id} className={cn("flex gap-2 p-2 rounded-lg", isDark ? "bg-[#2C221D]/40" : "bg-stone-50/50 dark:bg-stone-50/50")}>
                                                                  <img src={reply.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                                                  <div className="flex-1 min-w-0">
                                                                     <div className="text-[11px] font-bold mb-0.5 flex items-center gap-1" style={{ color: getTitleColor(reply.activeTitle) || undefined }}>
                                                                        {reply.displayName}
                                                                        {reply.activeTitle && (
                                                                           <span className="px-1 py-0.5 bg-[#F5E6D3] text-[#5D4037] text-[7px] font-extrabold rounded">
                                                                              🏆 {reply.activeTitle}
                                                                           </span>
                                                                        )}
                                                                     </div>
                                                                     <div className="text-xs text-stone-700 break-words">{reply.content}</div>
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
                                                placeholder={tParagraphPlaceholder} 
                                                className={cn("flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border-2 focus:outline-none focus:border-[#8D6E63] font-semibold", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] focus:border-[#a0a6b3]" : "bg-[#13120d] border-[#2e2a63] text-[#dbcec2] focus:border-[#bbee1f]") : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-[#ECE5DC]" : "bg-white border-[#3E2723] text-[#3E2723]")}
                                           />
                                           <button type="submit" disabled={!paragraphCommentText.trim()} className={cn("px-5 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 transition-all active:translate-y-0.5 active:shadow-none cursor-pointer shadow-[2px_2px_0_0_#3E2723]", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#a0a6b3] text-[#181f2d] border-[#47515f] shadow-[2px_2px_0_0_#47515f] hover:bg-white disabled:bg-[#a0a6b3]/20 disabled:text-[#a0a6b3]/40 disabled:border-[#47515f]/50 disabled:shadow-none" : "bg-[#bbee1f] text-[#13120d] border-[#2e2a63] shadow-[2px_2px_0_0_#2e2a63] hover:bg-white disabled:bg-[#bbee1f]/20 disabled:text-[#dbcec2]/40 disabled:border-[#2e2a63]/50 disabled:shadow-none") : "disabled:opacity-50 bg-[#8D6E63] text-white border-[#3E2723] hover:bg-[#5D4037]")}>{tParagraphSubmit}</button>
                                       </form>
                                   ) : (
                                       <div className="text-xs italic opacity-70 text-center">{tParagraphLogin}</div>
                                   )}
                               </div>
                           )}
                        </div>
                    );
                 })}
          </article>
           {/* Navigation Buttons */}
           <div className="mt-16 mb-8 flex items-center justify-between">
              {prevChapter ? (
                 <button onClick={() => navigate(`/doc/${story.id}/${prevChapter.id}`)} className={cn("px-4 py-2 border-2 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[2px_2px_0_0_#3E2723] hover:-translate-y-0.5 active:translate-y-0.5", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f] hover:border-[#a0a6b3]" : "bg-[#13120d] border-[#2e2a63] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63] hover:border-[#bbee1f]") : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-[#ECE5DC]" : "bg-white border-[#3E2723] text-[#3E2723]")}>
                    <ArrowLeft className="w-5 h-5"/> {tPrevChapter}
                 </button>
              ) : <div></div>}
              
              {nextChapter ? (
                 <button onClick={() => navigate(`/doc/${story.id}/${nextChapter.id}`)} className={cn("px-4 py-2 border-2 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[2px_2px_0_0_#3E2723] hover:-translate-y-0.5 active:translate-y-0.5", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f] hover:border-[#a0a6b3]" : "bg-[#13120d] border-[#2e2a63] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63] hover:border-[#bbee1f]") : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-[#ECE5DC]" : "bg-white border-[#3E2723] text-[#3E2723]")}>
                    {tNextChapter} <ArrowRight className="w-5 h-5"/>
                 </button>
              ) : <div className="text-sm opacity-50 uppercase font-bold tracking-widest">Hết truyện</div>}
           </div>
           
           <div className="w-full h-px bg-[#D7CCC8] mb-12"></div>

           {/* Comments Area (Counts for missions) */}
           <div className="mb-12">
               <h3 className={cn("text-xs font-black uppercase tracking-wider mb-6 px-4 py-2 border-2 inline-block rounded-xl", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "border-[#47515f] bg-[#181f2d] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f]" : "border-[#2e2a63] bg-[#13120d] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63]") : effectiveIsDark ? "border-[#3E2723] bg-[#2C221D] text-[#ECE5DC] shadow-[2px_2px_0_0_#3E2723]" : "border-[#3E2723] bg-[#F5E6D3]/65 text-[#3E2723] shadow-[2px_2px_0_0_#3E2723]")}>{tCommentAreaTitle}</h3>
               <form onSubmit={handleComment} className="flex flex-col gap-3 mb-8">
                  <textarea 
                     value={commentText}
                     onChange={(e) => setCommentText(e.target.value)}
                     disabled={!isLoggedIn}
                     placeholder={isLoggedIn ? tCommentAreaPlaceholder : tCommentAreaPlaceholderLogin}
                     className={cn("w-full p-4 rounded-2xl resize-none border-2 outline-none font-semibold text-xs sm:text-sm transition-all", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] focus:border-[#a0a6b3] focus:shadow-[2px_2px_0_0_#47515f]" : "bg-[#13120d] border-[#2e2a63] text-[#dbcec2] focus:border-[#bbee1f] focus:shadow-[2px_2px_0_0_#2e2a63]") : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-white focus:border-[#8D6E63] focus:shadow-[2px_2px_0_0_#000]" : "bg-white border-[#3E2723] text-[#3E2723] focus:border-[#8D6E63] focus:shadow-[2px_2px_0_0_#3E2723]")}
                     rows={4}
                  />
                  <div className="flex justify-end">
                     <button type="submit" disabled={!isLoggedIn || !commentText.trim()} className={cn("px-8 py-2.5 rounded-xl font-black transition-all uppercase text-xs tracking-wider border-2 active:translate-y-0.5 active:shadow-none cursor-pointer shadow-[3px_3px_0_0_#3E2723]", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#a0a6b3] text-[#181f2d] border-[#47515f] shadow-[3px_3px_0_0_#47515f] hover:bg-white disabled:bg-[#a0a6b3]/20 disabled:text-[#a0a6b3]/40 disabled:border-[#47515f]/50 disabled:shadow-none" : "bg-[#bbee1f] text-[#13120d] border-[#2e2a63] shadow-[3px_3px_0_0_#2e2a63] hover:bg-white disabled:bg-[#bbee1f]/20 disabled:text-[#dbcec2]/40 disabled:border-[#2e2a63]/50 disabled:shadow-none") : "disabled:opacity-50 bg-[#8D6E63] text-white border-[#3E2723] hover:bg-[#5D4037]")}>
                        {tCommentSubmit}
                     </button>
                  </div>
               </form>

               <div className="space-y-6">
                   {chapterComments.length === 0 ? (
                       <p className={cn("text-center italic opacity-50", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#a0a6b3]/70" : "text-[#dbcec2]/70") : "")}>{tNoComment}</p>
                   ) : (
                       chapterComments.map(c => { return <ChapterCommentNode key={c.id} comment={c} comments={comments} replyingToId={replyingToId} setReplyingToId={setReplyingToId} replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} handleSendReply={handleSendReply} getTitleColor={getTitleColor} isLoggedIn={isLoggedIn} isDark={effectiveIsDark} isStoryTheme={activeCustomTheme} profilesCache={profilesCache} />; if (false) { return (
                           <div key={c.id} className={cn("p-5 rounded-2xl border relative overflow-visible", isDark ? "bg-[#2C221D]/80 border-[#3C2E27]" : "bg-white dark:bg-white border-[#D7CCC8] dark:border-[#D7CCC8] shadow-sm pr-8")}>
                               {c.equippedSticker && (
                                   <img 
                                       src={c.equippedSticker} 
                                       alt="Decor sticker" 
                                       className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 object-contain pointer-events-none hover:scale-125 transition-transform z-10" 
                                       referrerPolicy="no-referrer"
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
                                               <span className="px-1.5 py-0.5 bg-[#F5E6D3] text-[#5D4037] text-[8px] font-extrabold rounded-md uppercase tracking-tight select-none border border-[#D7CCC8]">
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
                                          className={cn("disabled:bg-stone-300 disabled:text-stone-400 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors", isDark ? "bg-[#3C2E27] hover:bg-[#5D4037] text-white" : "bg-[#3E2723] dark:bg-[#3E2723] hover:bg-[#2D1B19] dark:hover:bg-[#2D1B19] text-[#FDF6EC] dark:text-[#FDF6EC]")}
                                       >
                                          Gửi
                                       </button>
                                       <button 
                                          type="button"
                                          onClick={() => setReplyingToId(null)}
                                          className="text-stone-400 hover:text-stone-500 border border-stone-200 px-2 rounded-xl text-xs"
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
                                             <div key={reply.id} className={cn("flex gap-2.5 items-start p-3 rounded-xl border", isDark ? "bg-[#1A1412]/40 border-[#3C2E27]" : "bg-stone-50/40 dark:bg-stone-50/40 border-stone-100 dark:border-stone-100")}>
                                                <img src={reply.avatarUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80'} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-stone-200" referrerPolicy="no-referrer" />
                                                <div className="flex-1 min-w-0">
                                                   <div className="flex items-center justify-between gap-2 mb-0.5">
                                                      <span className="font-bold text-xs" style={{ color: getTitleColor(reply.activeTitle) || undefined }}>
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
                                                   <p className="text-xs text-stone-700 break-words leading-relaxed text-justify">
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
             {isFinished ? ( <div className="flex items-center gap-1.5 text-[#8D6E63] font-bold dark:text-emerald-400"><CheckCircle className="w-4 h-4 text-[#8D6E63]" /><span>Đã xong (+1 lượt đọc)</span></div> ) : false ? (
                <div className="flex items-center gap-2">
                   <div className="w-9 h-9 rounded-full bg-[#8D6E63]/15 flex items-center justify-center text-[#8D6E63] animate-pulse">
                      <CheckCircle className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                      <p className="text-xs font-bold text-[#8D6E63]">Hoàn thành đọc chương!</p>
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
                            className={cn(isIdle ? "stroke-[#8D6E63]" : "stroke-[#8D6E63] dark:stroke-[#D4AF37] transition-all duration-300")}
                            strokeWidth="3" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={2 * Math.PI * 16 * (1 - secondsRead / timeRequired)}
                         />
                      </svg>
                      {isIdle ? (
                         <Pause className="w-3.5 h-3.5 absolute text-[#8D6E63] animate-pulse" />
                      ) : (
                         <Clock className="w-3.5 h-3.5 absolute text-[#8D6E63] dark:text-[#D4AF37] animate-pulse" />
                      )}
                   </div>
                   <div className="flex items-center gap-1.5">

                      {isIdle ? (
                         <span className="flex items-center gap-1 text-[#8D6E63] font-bold animate-pulse text-[11px] sm:text-xs">
                             <Pause className="w-3.5 h-3.5 flex-shrink-0" />
                             <span>Dừng (cuộn để tiếp tục)</span>
                          </span>
                      ) : (
                         <span className="flex items-center gap-1.5 text-[#3E2723] dark:text-[#ECE5DC] text-[11px] sm:text-xs">
                             <Clock className="w-3.5 h-3.5 text-[#8D6E63] dark:text-[#D4AF37] animate-pulse flex-shrink-0" />
                             <span>Còn <span className="font-mono text-xs sm:text-sm font-black text-[#8D6E63] dark:text-[#D4AF37]">{timeRequired - secondsRead}</span> giây <span className="text-[10px] opacity-75 font-normal">({wordCount} từ)</span></span>
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

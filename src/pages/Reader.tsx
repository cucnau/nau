import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useFeatureRestriction } from '../types/features';
import { UserAvatar } from '../components/UserAvatar';
import { cn } from '../components/Layout';
import { Settings2, ArrowLeft, ArrowRight, List, Lock, Unlock, Zap, MessageSquare, Clock, Pause, CheckCircle, ExternalLink } from 'lucide-react';
import { db, checkIfQuotaError } from '../lib/firebase';
import { getStoryByIdOrSlug, getStoryChapters } from '../lib/storyLoader';
import { detectStoryTheme } from '../lib/themeHelper';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, where, doc, getDoc, updateDoc, increment, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { getWeeklyId, getGMT7Date } from '../types/achievements';
import { useUserProfilesCache } from '../hooks/useUserProfilesCache';
import { addStoryFire } from '../lib/storyFire';

const getThemeBorderClass = (theme: string) => {
  if (theme === 'homer') return "border-[#47515f]/20";
  if (theme === 'nhatky') return "border-[#BCA782]/40";
  if (theme === 'thuytien') return "border-[#B6A996]/30";
  if (theme === 'rinhrap-thotrang') return "border-[#823323]/30";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "border-[#7F1D1D]/30";
  if (theme === 'thientai') return "border-[#9a858d]/30";
  if (theme === 'nguoidep') return "border-[#2D3D54]/40";
  return "border-[#2e2a63]/20"; // giagoan
};

const getThemeBgBorderTextClass = (theme: string) => {
  if (theme === 'homer') return "bg-[#181f2d]/50 border-[#47515f]/50 text-[#a0a6b3] shadow-[1px_1px_0_0_#47515f]";
  if (theme === 'nhatky') return "bg-[#E8DCC4] border-[#BCA782] text-[#2C1814] shadow-[1px_1px_0_0_#C9B695]";
  if (theme === 'thuytien') return "bg-[#3D362E]/60 border-[#B6A996]/50 text-[#F2E6D0] shadow-[1px_1px_0_0_#12110F] outline outline-1 outline-[#B6A996]/20 outline-offset-[-4px]";
  if (theme === 'rinhrap-thotrang') return "bg-[#fde0e0]/80 border-[#823323]/50 text-[#000000] shadow-[1px_1px_0_0_#facaca]";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "bg-[#0B0505]/60 border-[#7F1D1D]/50 text-[#D8B4B4] shadow-[1px_1px_0_0_#450A0A]";
  if (theme === 'thientai') return "bg-[#060406]/60 border-[#9a858d]/50 text-[#d4c6c9] shadow-[1px_1px_0_0_#9a858d]";
  if (theme === 'nguoidep') return "bg-[#151C28]/80 border-[#2D3D54]/40 text-[#ECEFF4] shadow-[1px_1px_0_0_#2D3D54]";
  return "bg-[#13120d]/50 border-[#2e2a63]/50 text-[#dbcec2] shadow-[1px_1px_0_0_#2e2a63]"; // giagoan
};

const getThemeAvatarFallbackIconClass = (theme: string) => {
  if (theme === 'homer') return "w-4 h-4 text-[#a0a6b3]";
  if (theme === 'nhatky') return "w-4 h-4 text-[#2C1814]";
  if (theme === 'thuytien') return "w-4 h-4 text-[#F2E6D0]";
  if (theme === 'rinhrap-thotrang') return "w-4 h-4 text-[#780606]";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "w-4 h-4 text-[#EF4444]";
  if (theme === 'thientai') return "w-4 h-4 text-[#9a858d]";
  if (theme === 'nguoidep') return "w-4 h-4 text-[#A2B6CD]";
  return "w-4 h-4 text-[#bbee1f]"; // giagoan
};

const getThemeAvatarBorderClass = (theme: string) => {
  if (theme === 'homer') return "border border-[#47515f]/50";
  if (theme === 'nhatky') return "border border-[#BCA782]/80";
  if (theme === 'thuytien') return "border border-[#B6A996]/50";
  if (theme === 'rinhrap-thotrang') return "border border-[#823323]/50";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "border border-[#7F1D1D]/50";
  if (theme === 'thientai') return "border border-[#9a858d]/50";
  if (theme === 'nguoidep') return "border border-[#2D3D54]/40";
  return "border border-[#2e2a63]/50"; // giagoan
};

const getThemeAvatarBgClass = (theme: string) => {
  if (theme === 'homer') return "bg-[#181f2d]";
  if (theme === 'nhatky') return "bg-[#DFCEB4]";
  if (theme === 'thuytien') return "bg-[#12110F]";
  if (theme === 'rinhrap-thotrang') return "bg-[#fff2f1]";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "bg-[#0B0505]";
  if (theme === 'thientai') return "bg-[#060406]";
  if (theme === 'nguoidep') return "bg-[#151C28]";
  return "bg-[#13120d]"; // giagoan
};

const getThemeAccentTextColor = (theme: string) => {
  if (theme === 'homer') return "#a0a6b3";
  if (theme === 'nhatky') return "#2C1814";
  if (theme === 'thuytien') return "#B6A996";
  if (theme === 'rinhrap-thotrang') return "#9c0800";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "#EF4444";
  if (theme === 'thientai') return "#9a858d";
  if (theme === 'nguoidep') return "#A2B6CD";
  return "#bbee1f"; // giagoan
};

const getThemeTitleBadgeClass = (theme: string) => {
  if (theme === 'homer') return "bg-[#47515f] text-[#a0a6b3] border-[#67707e]/40";
  if (theme === 'nhatky') return "bg-[#DFCEB4] text-[#2C1814] border-[#BCA782]/40";
  if (theme === 'thuytien') return "bg-[#3D362E] text-[#F2E6D0] border-[#B6A996]/30";
  if (theme === 'rinhrap-thotrang') return "bg-[#facaca] text-[#780606] border-[#823323]/40";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "bg-[#7F1D1D] text-white border-[#EF4444]/40";
  if (theme === 'thientai') return "bg-[#9a858d]/20 text-[#9a858d] border-[#9a858d]/30";
  if (theme === 'nguoidep') return "bg-[#A2B6CD]/10 text-[#A2B6CD] border-[#2D3D54]/40";
  return "bg-[#2e2a63] text-[#bbee1f] border-[#695b7f]/40"; // giagoan
};

const getThemeSubTextColor = (theme: string) => {
  if (theme === 'homer') return "text-[#67707e]";
  if (theme === 'nhatky') return "text-[#5C3627]/80";
  if (theme === 'thuytien') return "text-[#B6A996]";
  if (theme === 'rinhrap-thotrang') return "text-[#780606]";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "text-[#991B1B]";
  if (theme === 'thientai') return "text-[#9a858d]/80";
  if (theme === 'nguoidep') return "text-[#A2B6CD]/70";
  return "text-[#695b7f]"; // giagoan
};

const getThemeGiftBadgeClass = (theme: string) => {
  if (theme === 'homer') return "text-[#181f2d] bg-[#a0a6b3] border-[#a0a6b3]/50";
  if (theme === 'nhatky') return "text-[#2C1814] bg-[#DFCEB4] border-[#BCA782]/50";
  if (theme === 'thuytien') return "text-[#12110F] bg-[#B6A996] border-[#B6A996]/50";
  if (theme === 'rinhrap-thotrang') return "text-[#780606] bg-[#facaca] border-[#823323]/50";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "text-white bg-[#7F1D1D] border-[#7F1D1D]/50";
  if (theme === 'thientai') return "text-[#060406] bg-[#9a858d] border-[#9a858d]/50";
  if (theme === 'nguoidep') return "text-[#101622] bg-[#A2B6CD] border-[#2D3D54]/50";
  return "text-[#13120d] bg-[#bbee1f] border-[#bbee1f]/50"; // giagoan
};

const getThemeContentTextColor = (theme: string) => {
  if (theme === 'homer') return "text-[#a0a6b3]";
  if (theme === 'nhatky') return "text-[#2C1814]";
  if (theme === 'thuytien') return "text-[#F2E6D0]";
  if (theme === 'rinhrap-thotrang') return "text-[#000000]";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "text-[#D8B4B4]";
  if (theme === 'thientai') return "text-[#d4c6c9]";
  if (theme === 'nguoidep') return "text-[#ECEFF4]/90";
  return "text-[#dbcec2]"; // giagoan
};

const getThemeReplyButtonClass = (theme: string) => {
  if (theme === 'homer') return "text-[#67707e] hover:text-[#a0a6b3]";
  if (theme === 'nhatky') return "text-[#5C3627] hover:text-[#2C1814]";
  if (theme === 'thuytien') return "text-[#B6A996] hover:text-[#F2E6D0]";
  if (theme === 'rinhrap-thotrang') return "text-[#823323] hover:text-[#9c0800]";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "text-[#991B1B] hover:text-[#EF4444]";
  if (theme === 'thientai') return "text-[#9a858d]/70 hover:text-[#9a858d]";
  if (theme === 'nguoidep') return "text-[#A2B6CD] hover:text-[#ECEFF4]";
  return "text-[#695b7f] hover:text-[#bbee1f]"; // giagoan
};

const getThemeInputClass = (theme: string) => {
  if (theme === 'homer') return "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] focus:border-[#a0a6b3]";
  if (theme === 'nhatky') return "bg-[#E8DCC4] border-[#BCA782] text-[#2C1814] focus:border-[#C9B695]";
  if (theme === 'thuytien') return "bg-[#12110F] border-[#B6A996]/30 text-[#F2E6D0] focus:border-[#B6A996]";
  if (theme === 'rinhrap-thotrang') return "bg-[#fff2f1] border-[#823323] text-[#000000] focus:border-[#9c0800]";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "bg-[#0B0505] border-[#7F1D1D] text-[#D8B4B4] focus:border-[#EF4444]";
  if (theme === 'thientai') return "bg-[#060406] border-[#9a858d]/30 text-[#d4c6c9] focus:border-[#9a858d]";
  if (theme === 'nguoidep') return "bg-black/35 border-[#2D3D54]/30 text-[#ECEFF4] focus:border-[#A2B6CD]";
  return "bg-[#13120d] border-[#2e2a63] text-[#dbcec2] focus:border-[#bbee1f]"; // giagoan
};

const getThemeSendButtonClass = (theme: string) => {
  if (theme === 'homer') return "bg-[#a0a6b3] hover:bg-white text-[#181f2d] border-[#47515f] disabled:bg-[#a0a6b3]/20 disabled:text-[#a0a6b3]/40 disabled:border-[#47515f]/50 disabled:shadow-none";
  if (theme === 'nhatky') return "bg-[#BCA782] hover:bg-[#C9B695] text-[#2C1814] border-[#C9B695] disabled:bg-[#BCA782]/20 disabled:text-[#2C1814]/40 disabled:border-[#C9B695]/50 disabled:shadow-none";
  if (theme === 'thuytien') return "bg-[#B6A996] hover:bg-[#F2E6D0] text-[#12110F] border-[#B6A996] disabled:opacity-30 disabled:shadow-none";
  if (theme === 'rinhrap-thotrang') return "bg-[#facaca] hover:bg-[#fff2f1] text-[#780606] border-[#823323] disabled:bg-[#facaca]/20 disabled:text-[#780606]/40 disabled:border-[#823323]/50 disabled:shadow-none";
  if (theme === 'rinhrap' || theme === 'rinhrap-thodo') return "bg-[#7F1D1D] hover:bg-[#991B1B] text-white border-[#450A0A] disabled:bg-[#7F1D1D]/20 disabled:text-white/40 disabled:border-[#450A0A]/50 disabled:shadow-none";
  if (theme === 'thientai') return "bg-[#9a858d] hover:bg-[#d4c6c9] text-[#060406] border-[#34282d] disabled:bg-[#9a858d]/20 disabled:text-[#d4c6c9]/40 disabled:border-[#34282d]/50 disabled:shadow-none";
  if (theme === 'nguoidep') return "bg-[#A2B6CD] hover:bg-[#ECEFF4] text-[#101622] border-[#2D3D54]/30 disabled:opacity-30 disabled:shadow-none";
  return "bg-[#bbee1f] hover:bg-white text-[#13120d] border-[#2e2a63] disabled:bg-[#bbee1f]/20 disabled:text-[#dbcec2]/40 disabled:border-[#2e2a63]/50 disabled:shadow-none"; // giagoan
};

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
      <div key={comment.id} className={cn("text-xs pt-2 mt-2 border-t-2 border-dashed first:border-0", isStoryTheme ? getThemeBorderClass(isStoryTheme) : "border-[#3E2723]/10 dark:border-[#4E342E]/30")}>
         <div className={cn(
            "relative flex gap-2.5 items-start p-2.5 rounded-2xl border-2 transition-all hover:-translate-y-0.5", 
            isStoryTheme 
               ? getThemeBgBorderTextClass(isStoryTheme)
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
               fallbackIconSizeClass={isStoryTheme ? getThemeAvatarFallbackIconClass(isStoryTheme) : "w-4 h-4 text-[#A1887F]"} 
               borderClass={isStoryTheme ? getThemeAvatarBorderClass(isStoryTheme) : "border border-[#D7CCC8]/30"}
               bgClass={isStoryTheme ? getThemeAvatarBgClass(isStoryTheme) : (isDark ? "bg-[#2C221D]" : "bg-[#5D4037]")}
            />
            <div className="flex-1 min-w-0">
               <div className="text-[11px] font-black mb-0.5 flex justify-between tracking-tight">
                  <span className="flex items-center gap-1 flex-wrap">
                     <span style={{ color: getTitleColor(currentActiveTitle) || (isStoryTheme ? getThemeAccentTextColor(isStoryTheme) : undefined) }}>
                        {currentDisplayName}
                     </span>
                     {currentActiveTitle && (
                        <span className={cn(
                           "px-1 py-0.5 text-[7px] font-black rounded border",
                           isStoryTheme 
                              ? getThemeTitleBadgeClass(isStoryTheme)
                              : "bg-[#F5E6D3] text-[#5D4037] border-[#3E2723]"
                        )}>
                           🏆 {currentActiveTitle}
                        </span>
                     )}
                  </span>
                  <span className={cn("text-[9px] font-mono", isStoryTheme ? getThemeSubTextColor(isStoryTheme) : "text-stone-400")}>
                     {comment.createdAt?.toDate 
                        ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Vừa xong'}
                  </span>
               </div>
               
               {isGift && (
                  <span className={cn("inline-flex text-[8px] font-black px-2 py-0.5 uppercase tracking-wider items-center gap-1 mb-1 border",
                     isStoryTheme ? getThemeGiftBadgeClass(isStoryTheme) : ""
                  )}>
                     🎁 {isStoryTheme === 'homer' ? "Tiếp tế" : "Tài trợ"} {comment.giftAmount || 0} CC
                  </span>
               )}

               <p className={cn("text-xs leading-relaxed text-justify break-words font-semibold", isStoryTheme ? getThemeContentTextColor(isStoryTheme) : (isDark ? "text-[#ECE5DC]" : "text-[#5D4037]"))}>
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
                     className={cn("text-[10px] font-black uppercase tracking-wider block mt-1 cursor-pointer transition-colors", isStoryTheme ? getThemeReplyButtonClass(isStoryTheme) : "text-[#8D6E63] hover:text-[#5D4037]")}
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
                           isStoryTheme ? getThemeInputClass(isStoryTheme) 
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
                              ? getThemeSendButtonClass(isStoryTheme) 
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
               isStoryTheme ? getThemeBorderClass(isStoryTheme) : "border-[#3E2723]/20 dark:border-white/10",
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
            ? getThemeBgBorderTextClass(isStoryTheme)
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
               fallbackIconSizeClass={isStoryTheme ? getThemeAvatarFallbackIconClass(isStoryTheme) : "w-5 h-5 text-[#A1887F]"} 
               borderClass={isStoryTheme ? getThemeAvatarBorderClass(isStoryTheme) : "border border-[#D7CCC8]/30"}
               bgClass={isStoryTheme ? getThemeAvatarBgClass(isStoryTheme) : (isDark ? "bg-[#2C221D]" : "bg-[#5D4037]")}
            />
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-black text-xs flex items-center gap-1.5 flex-wrap">
                     <span style={{ color: getTitleColor(currentActiveTitle) || (isStoryTheme ? getThemeAccentTextColor(isStoryTheme) : undefined) }}>
                        {currentDisplayName}
                     </span>
                     {currentActiveTitle && (
                        <span className={cn(
                           "px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-tight select-none border inline-block align-middle",
                           isStoryTheme 
                              ? getThemeTitleBadgeClass(isStoryTheme)
                              : "bg-[#F5E6D3] text-[#5D4037] border-[#3E2723]"
                        )}>
                           🏆 {currentActiveTitle}
                        </span>
                     )}
                  </span>
                  
                  <span className={cn("text-[9px] font-mono shrink-0", isStoryTheme ? getThemeSubTextColor(isStoryTheme) : "text-stone-400")}>
                     {comment.createdAt?.toDate 
                        ? new Date(comment.createdAt.toDate()).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Vừa xong'}
                  </span>
               </div>

               {isGift && (
                  <span className={cn("inline-flex text-[9px] font-black px-3 py-1 uppercase tracking-wider items-center gap-1.5 mb-2 border",
                     isStoryTheme ? getThemeGiftBadgeClass(isStoryTheme) : ""
                  )}>
                     🎁 {isStoryTheme === 'homer' ? "Tiếp tế" : "Tài trợ"} {comment.giftAmount || 0} CC
                  </span>
               )}

               <p className={cn("text-xs leading-relaxed text-justify break-words font-semibold", isStoryTheme ? getThemeContentTextColor(isStoryTheme) : (isDark ? "text-[#ECE5DC]" : "text-[#5D4037]"))}>
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
                        className={cn("text-xs font-black flex items-center gap-1 cursor-pointer transition-colors uppercase tracking-wider", isStoryTheme ? getThemeReplyButtonClass(isStoryTheme) : "text-[#8D6E63] hover:text-[#5D4037]")}
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
                           isStoryTheme ? getThemeInputClass(isStoryTheme) 
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
                              ? getThemeSendButtonClass(isStoryTheme) 
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
               isStoryTheme ? getThemeBorderClass(isStoryTheme) : "border-[#3E2723]/20 dark:border-white/10",
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

  const [rinhrapMode, setRinhrapMode] = useState<'thodo' | 'thotrang'>(() => {
    return (localStorage.getItem('reader-rinhrap-mode') as 'thodo' | 'thotrang') || 'thodo';
  });

  useEffect(() => {
    localStorage.setItem('reader-rinhrap-mode', rinhrapMode);
  }, [rinhrapMode]);

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
          detectStoryTheme(foundStory.title, foundStory.id);
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

  const activeCustomTheme = detectStoryTheme(story?.title, storyId);

  if (loading || !story || !currentChapter) {
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
            <div className="text-sm font-medium tracking-widest text-[#2C1814] animate-pulse text-center px-4">
              <span>Đang lật giở nhật ký...</span>
            </div>
          </div>
        </div>
      );
    } else if (activeCustomTheme === 'thuytien') {
      return (
        <div className="min-h-screen bg-[#12110F] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2E251E] via-[#12110F] to-[#12110F] text-[#EADDC9] flex flex-col items-center justify-center p-4 font-serif">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#3D362E] border-t-[#B6A996] rounded-full animate-spin" />
            <div className="text-xs uppercase tracking-[0.2em] text-[#B6A996] animate-pulse font-bold">
              ĐANG KHỞI TẠO KHÚC TỰ LUYẾN...
            </div>
          </div>
        </div>
      );
    } else if (activeCustomTheme === 'rinhrap') {
      const isThoTrang = rinhrapMode === 'thotrang';
      return (
        <div className={cn(
          "min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden transition-all duration-300",
          isThoTrang ? "bg-[#fff2f1] text-[#780606]" : "bg-[#0B0505] text-[#D8B4B4]"
        )}>
          {/* Subtle toxic grid background effect */}
          <div className={cn(
            "absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]",
            isThoTrang ? "invert opacity-10" : ""
          )} />
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className={cn(
              "w-12 h-12 border-4 rounded-full animate-spin",
              isThoTrang ? "border-[#facaca] border-t-[#780606]" : "border-[#450A0A] border-t-[#EF4444]"
            )} />
            <div className={cn(
              "text-xs uppercase tracking-[0.2em] animate-pulse font-bold",
              isThoTrang ? "text-[#780606]" : "text-[#EF4444]"
            )}>
              ĐANG DÒ ĐƯỜNG TRUYỀN RÌNH RẬP...
            </div>
          </div>
        </div>
      );
    } else if (activeCustomTheme === 'thientai') {
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
    } else if (activeCustomTheme === 'nguoidep') {
      return (
        <div className="min-h-screen bg-[#101622] text-[#ECEFF4] flex flex-col items-center justify-center p-4 font-sans animate-fade-in relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 bg-[#A2B6CD] pointer-events-none" />
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-12 h-12 border-4 border-[#2D3D54]/40 border-t-[#A2B6CD] rounded-full animate-spin" />
            <div className="text-xs uppercase tracking-[0.2em] text-[#A2B6CD] animate-pulse font-extrabold">
              ĐANG TẢI TÀI LIỆU ÔN THI...
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
            Đang tải dữ liệu chương...
          </div>
        </div>
      </div>
    );
  }

  const hasCustomTheme = !!activeCustomTheme;
  const isCustomThemeActive = !!(hasCustomTheme && useStoryTheme);
  const effectiveStoryTheme = activeCustomTheme === 'rinhrap' ? `rinhrap-${rinhrapMode}` : activeCustomTheme;
  const btnThemeClass = isCustomThemeActive ? (
    activeCustomTheme === 'homer' ? "border-[#47515f]/50 bg-[#181f2d] hover:bg-[#47515f]/20 hover:border-[#a0a6b3] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f]" :
    activeCustomTheme === 'nhatky' ? "border-[#BCA782]/50 bg-[#E8DCC4] hover:bg-[#DFCEB4] hover:border-[#BCA782] text-[#2C1814] shadow-[2px_2px_0_0_#BCA782]" :
    activeCustomTheme === 'thuytien' ? "border-[#B6A996]/40 bg-[#12110F] hover:bg-[#3D362E]/50 hover:border-[#B6A996] text-[#F2E6D0] shadow-[2px_2px_0_0_#12110F]" :
    activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "border-[#823323]/50 bg-[#facaca]/20 hover:bg-[#facaca]/40 hover:border-[#780606] text-[#780606] shadow-[2px_2px_0_0_#facaca]" : "border-[#7F1D1D]/50 bg-[#0B0505] hover:bg-[#7F1D1D]/20 hover:border-[#EF4444] text-[#D8B4B4] shadow-[2px_2px_0_0_#450A0A]") :
    activeCustomTheme === 'thientai' ? "border-[#34282d]/50 bg-[#060406] hover:bg-[#34282d]/20 hover:border-[#9a858d] text-[#9a858d] shadow-[2px_2px_0_0_#34282d]" :
    activeCustomTheme === 'nguoidep' ? "border-[#808499]/40 bg-[#251e23] hover:bg-[#604239]/20 hover:border-[#c5ad97] text-[#dfdee0] shadow-[2px_2px_0_0_#808499]" :
    "border-[#2e2a63]/50 bg-[#13120d] hover:bg-[#2e2a63]/20 hover:border-[#bbee1f] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63]"
  ) : "border-[#3E2723] bg-white dark:bg-[#2C221D] hover:bg-stone-100 dark:hover:bg-[#1A1412]";
  const effectiveIsDark = isCustomThemeActive ? false : isDark; // Với theme nhatky sáng màu, ta chuyển effectiveIsDark thành false để tránh xung đột prose-invert
  const effectiveFontFamily = isCustomThemeActive ? (
    activeCustomTheme === 'homer' ? 'font-reading-iosevka' : 
    activeCustomTheme === 'nhatky' ? 'font-reading-cormorant' : 
    activeCustomTheme === 'thuytien' ? 'font-reading-cormorant' : 
    activeCustomTheme === 'rinhrap' ? 'font-reading-quicksand' : 
    activeCustomTheme === 'thientai' ? 'font-reading-iosevka' : 
    activeCustomTheme === 'nguoidep' ? 'font-reading-lora' : 'font-reading-garamond'
  ) : fontFamily;
  const tChapterLabel = activeCustomTheme === 'homer' ? "Tọa độ" : activeCustomTheme === 'giagoan' ? "Tài liệu" : activeCustomTheme === 'nhatky' ? "Trang" : activeCustomTheme === 'thuytien' ? "Khúc tự luyến" : activeCustomTheme === 'rinhrap' ? "Màn" : activeCustomTheme === 'thientai' ? "Phó bản" : activeCustomTheme === 'nguoidep' ? "Bài luyện" : "Chương";
  const tChapterCapLabel = activeCustomTheme === 'homer' ? "TỌA ĐỘ" : activeCustomTheme === 'giagoan' ? "TÀI LIỆU" : activeCustomTheme === 'nhatky' ? "TRANG NHẬT KÝ" : activeCustomTheme === 'thuytien' ? "KHÚC TỰ LUYẾN" : activeCustomTheme === 'rinhrap' ? "MÀN CHƠI" : activeCustomTheme === 'thientai' ? "PHÓ BẢN" : activeCustomTheme === 'nguoidep' ? "BÀI ÔN LUYỆN" : "CHƯƠNG";
  const tPrevChapter = activeCustomTheme === 'homer' ? "Tọa độ trước" : activeCustomTheme === 'giagoan' ? "Tài liệu trước" : activeCustomTheme === 'nhatky' ? "Trang nhật ký trước" : activeCustomTheme === 'thuytien' ? "Khúc tự luyến trước" : activeCustomTheme === 'rinhrap' ? "Màn trước" : activeCustomTheme === 'thientai' ? "Phó bản trước" : activeCustomTheme === 'nguoidep' ? "Bài ôn luyện trước" : "Chương trước";
  const tNextChapter = activeCustomTheme === 'homer' ? "Tọa độ sau" : activeCustomTheme === 'giagoan' ? "Tài liệu sau" : activeCustomTheme === 'nhatky' ? "Trang nhật ký sau" : activeCustomTheme === 'thuytien' ? "Khúc tự luyến sau" : activeCustomTheme === 'rinhrap' ? "Màn sau" : activeCustomTheme === 'thientai' ? "Phó bản sau" : activeCustomTheme === 'nguoidep' ? "Bài ôn luyện sau" : "Chương sau";
  const tChapterEarly = activeCustomTheme === 'homer' ? "Tọa độ Đọc Sớm" : activeCustomTheme === 'giagoan' ? "Tài liệu Đọc Sớm" : activeCustomTheme === 'nhatky' ? "Trang Đọc Sớm" : activeCustomTheme === 'thuytien' ? "Tự luyến Đọc Sớm" : activeCustomTheme === 'rinhrap' ? "Sinh tồn sớm" : activeCustomTheme === 'thientai' ? "Phó bản Đọc Sớm" : activeCustomTheme === 'nguoidep' ? "Bài ôn VIP" : "Chương Đọc Sớm";
  const tChapterLocked = activeCustomTheme === 'homer' ? "Đã khóa tọa độ" : activeCustomTheme === 'giagoan' ? "Đã khóa tài liệu" : activeCustomTheme === 'nhatky' ? "Ký ức bị khép lại" : activeCustomTheme === 'thuytien' ? "Bóng gương chưa hiển hiện" : activeCustomTheme === 'rinhrap' ? "Màn bị ẩn" : activeCustomTheme === 'thientai' ? "Đã khóa phó bản" : activeCustomTheme === 'nguoidep' ? "Đã khóa bài ôn" : "Đã khóa chương";
  const tReadThis = activeCustomTheme === 'homer' ? "Đọc tọa độ này" : activeCustomTheme === 'giagoan' ? "Đọc tài liệu này" : activeCustomTheme === 'nhatky' ? "Lật giở ký ức này" : activeCustomTheme === 'thuytien' ? "Chiêm ngưỡng khúc ca này" : activeCustomTheme === 'rinhrap' ? "Chơi màn này" : activeCustomTheme === 'thientai' ? "Chinh phục phó bản này" : activeCustomTheme === 'nguoidep' ? "Luyện bài này" : "Đọc chương này";
  const tChapterSingle = activeCustomTheme === 'homer' ? "tọa độ" : activeCustomTheme === 'giagoan' ? "tài liệu" : activeCustomTheme === 'nhatky' ? "trang" : activeCustomTheme === 'thuytien' ? "khúc" : activeCustomTheme === 'rinhrap' ? "màn" : activeCustomTheme === 'thientai' ? "phó bản" : activeCustomTheme === 'nguoidep' ? "đề bài" : "chương";
  const tParagraphComment = activeCustomTheme === 'homer' ? "Phản hồi tọa độ" : activeCustomTheme === 'giagoan' ? "Ý kiến đoạn" : activeCustomTheme === 'nhatky' ? "Bút tích đoạn" : activeCustomTheme === 'thuytien' ? "Lời soi bóng" : activeCustomTheme === 'rinhrap' ? "Tiếng động đoạn" : activeCustomTheme === 'thientai' ? "Phát kiến phó bản" : activeCustomTheme === 'nguoidep' ? "Nhận xét đáp án" : "Bình luận đoạn";
  const tNoParagraphComment = activeCustomTheme === 'homer' ? "Chưa có phản hồi nào cho tọa độ này." : activeCustomTheme === 'giagoan' ? "Chưa có ý kiến nào cho đoạn này." : activeCustomTheme === 'nhatky' ? "Chưa có dấu bút tích nào tại dòng ký ức này." : activeCustomTheme === 'thuytien' ? "Chưa có lời soi bóng nào được lưu lại bên đoạn tuyệt mỹ này." : activeCustomTheme === 'rinhrap' ? "Đoạn này hoàn toàn im lặng..." : activeCustomTheme === 'thientai' ? "Chưa có phát kiến nào cho tọa độ này." : activeCustomTheme === 'nguoidep' ? "Chưa có nhận xét nào cho bài giải này." : "Chưa có bình luận. Hãy là người đầu tiên!";
  const tParagraphPlaceholder = activeCustomTheme === 'homer' ? "Viết phản hồi..." : activeCustomTheme === 'giagoan' ? "Viết đề xuất..." : activeCustomTheme === 'nhatky' ? "Để lại dòng bút tích..." : activeCustomTheme === 'thuytien' ? "Để lại lời ca tụng nhan sắc..." : activeCustomTheme === 'rinhrap' ? "Tạo tiếng động..." : activeCustomTheme === 'thientai' ? "Ghi lại phát kiến..." : activeCustomTheme === 'nguoidep' ? "Ghi chú bài giải..." : "Viết bình luận...";
  const tParagraphSubmit = activeCustomTheme === 'homer' ? "Phát" : activeCustomTheme === 'giagoan' ? "Trình" : activeCustomTheme === 'nhatky' ? "Ghi" : activeCustomTheme === 'thuytien' ? "Soi" : activeCustomTheme === 'rinhrap' ? "Phát" : activeCustomTheme === 'nguoidep' ? "Nộp" : "Gửi";
  const tParagraphLogin = activeCustomTheme === 'homer' ? "Đăng nhập để phản hồi" : activeCustomTheme === 'giagoan' ? "Đăng nhập để trình ý kiến" : activeCustomTheme === 'nhatky' ? "Đăng nhập để lại bút tích" : activeCustomTheme === 'thuytien' ? "Đăng nhập để tự soi bóng" : activeCustomTheme === 'rinhrap' ? "Đăng nhập để tạo tiếng động" : activeCustomTheme === 'nguoidep' ? "Đăng nhập để nhận xét" : "Đăng nhập để bình luận";
  const tCommentAreaTitle = activeCustomTheme === 'homer' ? "Báo cáo sóng phản hồi" : activeCustomTheme === 'giagoan' ? "Đề xuất và ý kiến" : activeCustomTheme === 'nhatky' ? "Dấu vết bút tích chương" : activeCustomTheme === 'thuytien' ? "Mặt hồ tự chiêm ngưỡng" : activeCustomTheme === 'rinhrap' ? "Dấu vết để lại" : activeCustomTheme === 'thientai' ? "Báo cáo chiến thuật phó bản" : activeCustomTheme === 'nguoidep' ? "Báo cáo tiến độ ôn tập" : "Bình luận chương";
  const tCommentAreaPlaceholder = activeCustomTheme === 'homer' ? "Nhập sóng phản hồi của bạn..." : activeCustomTheme === 'giagoan' ? "Nhập đề xuất và ý kiến của bạn..." : activeCustomTheme === 'nhatky' ? "Nhập bút tích thương nhớ của bạn..." : activeCustomTheme === 'thuytien' ? "Khắc ghi dòng chiêm ngưỡng bản thân bên bờ nước thẳm..." : activeCustomTheme === 'rinhrap' ? "Để lại dấu vết của bạn..." : activeCustomTheme === 'thientai' ? "Nhập chiến thuật của bạn..." : activeCustomTheme === 'nguoidep' ? "Ghi nhận xét của bạn..." : "Nhập bình luận của bạn...";
  const tCommentAreaPlaceholderLogin = activeCustomTheme === 'homer' ? "Đăng nhập để phát sóng phản hồi" : activeCustomTheme === 'giagoan' ? "Đăng nhập để trình ý kiến" : activeCustomTheme === 'nhatky' ? "Đăng nhập để ghi lại dòng hoài niệm" : activeCustomTheme === 'thuytien' ? "Đăng nhập để ca tụng dung nhan chính mình" : activeCustomTheme === 'rinhrap' ? "Đăng nhập để để lại dấu vết" : activeCustomTheme === 'thientai' ? "Đăng nhập để chia sẻ chiến thuật" : activeCustomTheme === 'nguoidep' ? "Đăng nhập để nộp ý kiến" : "Đăng nhập để bình luận";
  const tCommentSubmit = activeCustomTheme === 'homer' ? "Phát sóng" : activeCustomTheme === 'giagoan' ? "Trình ý kiến" : activeCustomTheme === 'nhatky' ? "Khắc ghi bút tích" : activeCustomTheme === 'thuytien' ? "Khắc lời tự chiêm" : activeCustomTheme === 'rinhrap' ? "Ghi dấu vết" : activeCustomTheme === 'thientai' ? "Gửi chiến thuật" : activeCustomTheme === 'nguoidep' ? "Nộp nhận xét" : "Gửi bình luận";
  const tNoComment = activeCustomTheme === 'homer' ? "Chưa có phản hồi nào." : activeCustomTheme === 'giagoan' ? "Chưa có đề xuất và ý kiến nào cho tài liệu này." : activeCustomTheme === 'nhatky' ? "Trang ký ức này chưa lưu lại nét bút nào." : activeCustomTheme === 'thuytien' ? "Mặt hồ phẳng lặng chưa ghi nhận lời tự chiêm ngưỡng nào..." : activeCustomTheme === 'rinhrap' ? "Không có dấu vết nào được để lại..." : activeCustomTheme === 'thientai' ? "Chưa có báo cáo chiến thuật nào cho phó bản này." : activeCustomTheme === 'nguoidep' ? "Chưa có báo cáo tiến độ nào cho bài ôn này." : "Chưa có bình luận nào cho chương này.";

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 pb-32 font-medium flex flex-col items-center",
      isCustomThemeActive 
        ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] text-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "bg-[#C9B695] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D5C2A5] via-[#C9B695] to-[#BCA782] text-[#2C1814] font-serif" : activeCustomTheme === 'thuytien' ? "bg-[#12110F] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2E251E] via-[#12110F] to-[#12110F] text-[#EADDC9] font-serif" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#fff2f1] text-[#000000] font-sans" : "bg-[#0B0505] text-[#D8B4B4] font-sans") : activeCustomTheme === 'thientai' ? "bg-[#060406] text-[#d4c6c9] font-mono" : activeCustomTheme === 'nguoidep' ? "bg-[#101622] text-[#ECEFF4] font-sans" : "bg-[#13120d] text-[#dbcec2]")
        : effectiveIsDark 
          ? "bg-[#1A1412] text-[#ECE5DC]" 
          : "bg-[#FDF6EC] text-[#3E2723]"
    )}>
       <style>{`
          .reader-container-font {
            font-family: ${
              effectiveFontFamily === 'font-reading-iosevka' ? '"Iosevka", monospace' :
              effectiveFontFamily === 'font-reading-garamond' ? '"EB Garamond", serif' :
              effectiveFontFamily === 'font-reading-cormorant' ? '"Cormorant Garamond", Georgia, serif' :
              effectiveFontFamily === 'font-reading-notoserif' ? '"Noto Serif", Georgia, serif' :
              effectiveFontFamily === 'font-reading-quicksand' ? '"Quicksand", sans-serif' :
              effectiveFontFamily === 'font-reading-lora' ? '"Lora", serif' :
              effectiveFontFamily === 'font-reading-alegreya' ? '"Alegreya", serif' :
              '"Quicksand", sans-serif'
            } !important;
          }
       `}</style>
       {isCustomThemeActive && (
         <>
           <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: activeCustomTheme === 'homer' 
                   ? 'repeating-linear-gradient(45deg, #2d3745 0, #2d3745 1px, transparent 1px, transparent 60px)'
                  : activeCustomTheme === 'nhatky'
                  ? 'repeating-linear-gradient(45deg, #BCA782 0, #BCA782 1px, transparent 1px, transparent 80px)'
                  : activeCustomTheme === 'thuytien'
                  ? 'none'
                  : activeCustomTheme === 'rinhrap'
                  ? (rinhrapMode === 'thotrang'
                     ? 'repeating-linear-gradient(45deg, #facaca 0, #facaca 1px, transparent 1px, transparent 60px)'
                     : 'repeating-linear-gradient(45deg, #7F1D1D 0, #7F1D1D 1px, transparent 1px, transparent 60px)')
                  : activeCustomTheme === 'thientai'
                  ? 'repeating-linear-gradient(45deg, #34282d 0, #34282d 1px, transparent 1px, transparent 50px)'
                  : activeCustomTheme === 'nguoidep'
                  ? 'repeating-linear-gradient(45deg, #2D3D54 0, #2D3D54 1px, transparent 1px, transparent 50px)'
                  : 'repeating-linear-gradient(45deg, #2e2a63 0, #2e2a63 1px, transparent 1px, transparent 50px)' }} />
           <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-30 pointer-events-none"
                style={activeCustomTheme === 'homer' ? { backgroundColor: '#47515f' } : activeCustomTheme === 'nhatky' ? { backgroundColor: '#D5C2A5' } : activeCustomTheme === 'thuytien' ? { backgroundColor: '#2E251E' } : activeCustomTheme === 'rinhrap' ? { backgroundColor: rinhrapMode === 'thotrang' ? '#facaca' : '#450A0A' } : activeCustomTheme === 'thientai' ? { backgroundColor: '#9a858d' } : activeCustomTheme === 'nguoidep' ? { backgroundColor: '#2D3D54' } : { backgroundColor: '#2e2a63' }} />
           <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[180px] opacity-10 pointer-events-none"
                style={activeCustomTheme === 'homer' ? { backgroundColor: '#67707e' } : activeCustomTheme === 'nhatky' ? { backgroundColor: '#BCA782' } : activeCustomTheme === 'thuytien' ? { backgroundColor: '#9A8E7D' } : activeCustomTheme === 'rinhrap' ? { backgroundColor: rinhrapMode === 'thotrang' ? '#780606' : '#991B1B' } : activeCustomTheme === 'thientai' ? { backgroundColor: '#645a6c' } : activeCustomTheme === 'nguoidep' ? { backgroundColor: '#151C28' } : { backgroundColor: '#bbee1f' }} />
         </>
       )}
       {/* Top Navigation */}
       <header className={cn("w-full sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b-2 transition-all duration-300 shadow-sm relative",
          isCustomThemeActive
            ? (activeCustomTheme === 'homer' ? "bg-[#181f2d]/90 border-[#47515f] backdrop-blur-md" : activeCustomTheme === 'nhatky' ? "bg-[#DFCEB4]/90 border-[#BCA782] text-[#2C1814] backdrop-blur-md" : activeCustomTheme === 'thuytien' ? "bg-[#12110F]/90 border-[#B6A996]/30 text-[#F2E6D0] backdrop-blur-md" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#FFF2F1]/90 border-[#facaca] text-[#780606] backdrop-blur-md" : "bg-[#0B0505]/90 border-[#7F1D1D] text-[#D8B4B4] backdrop-blur-md") : activeCustomTheme === 'thientai' ? "bg-[#060406]/90 border-[#34282d] text-[#d4c6c9] backdrop-blur-md" : activeCustomTheme === 'nguoidep' ? "bg-[#101622]/90 border-[#2D3D54]/40 text-[#ECEFF4] backdrop-blur-md" : "bg-[#13120d]/90 border-[#2e2a63] backdrop-blur-md")
            : effectiveIsDark ? "bg-[#1A1412]/90 border-[#3E2723] backdrop-blur-md" : "bg-[#FDF6EC]/90 border-[#D7CCC8] backdrop-blur-md"
       )}>
          <button onClick={() => navigate(`/truyen/${story.slug || story.id}`)} className={cn("p-2 rounded-xl border-2 transition-all cursor-pointer active:translate-y-0.5 active:shadow-none", btnThemeClass)}>
             <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0 text-center px-4">
             <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-0.5 truncate">{story.title}</div>
             <h1 className={cn("text-base sm:text-lg font-black tracking-tight", isCustomThemeActive && activeCustomTheme === 'nguoidep' && "font-alegreya font-bold")}>{currentChapter.title}</h1>
          </div>
          
          <div className="relative flex items-center gap-2">
             <button onClick={() => setShowSettings(!showSettings)} className={cn("p-2 rounded-xl border-2 transition-all cursor-pointer active:translate-y-0.5 active:shadow-none", btnThemeClass)}>
                <Settings2 className="w-5 h-5" />
             </button>
             
             {/* Settings Panel */}
             {showSettings && (
                <div className={cn("absolute right-0 top-full mt-2 w-64 p-5 rounded-3xl shadow-xl z-20 border-3 transition-colors",
                    isCustomThemeActive ? (
                       activeCustomTheme === 'homer' ? "bg-[#181f2d] text-[#a0a6b3] border-[#47515f] font-reading-garamond shadow-lg" :
                       activeCustomTheme === 'nhatky' ? "bg-[#E8DCC4] text-[#2C1814] border-[#BCA782] font-reading-cormorant shadow-2xl" :
                       activeCustomTheme === 'thuytien' ? "bg-[#12110F] text-[#F2E6D0] border-[#B6A996] font-reading-cormorant shadow-lg outline outline-1 outline-[#B6A996]/20 outline-offset-[-4px]" :
                       activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#FFF2F1] text-[#780606] border-[#facaca] font-reading-garamond shadow-lg" : "bg-[#0B0505] text-[#D8B4B4] border-[#7F1D1D] font-reading-garamond shadow-lg") :
                       activeCustomTheme === 'thientai' ? "bg-[#060406] text-[#d4c6c9] border-[#34282d] font-reading-iosevka shadow-lg" : activeCustomTheme === 'nguoidep' ? "bg-[#101622] text-[#ECEFF4] border-[#2D3D54]/40 font-reading-lora shadow-lg" : "bg-[#13120d] text-[#dbcec2] border-[#2e2a63] font-reading-garamond shadow-lg"
                    ) : effectiveIsDark ? "bg-[#211B18] text-[#ECE5DC] border-[#3E2723]" : "bg-[#FFFDF9] text-[#3E2723] border-[#3E2723]"
                )}>
                   <h3 className={cn("font-black mb-4 uppercase tracking-wider text-sm", isCustomThemeActive && activeCustomTheme === 'nguoidep' && "font-alegreya font-black text-base text-[#c5ad97]", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "text-[#2C1814]" : activeCustomTheme === 'thuytien' ? "text-[#B6A996]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "text-[#780606]" : "text-[#991B1B]") : activeCustomTheme === 'thientai' ? "text-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "text-[#c5ad97]" : "text-[#bbee1f]") : (effectiveIsDark ? "text-[#ECE5DC]" : "text-[#3E2723]"))}>Cài đặt</h3>
                   <div className="flex flex-col gap-6">
                      {hasCustomTheme && (
                         <div className={cn("flex flex-col gap-2 pb-4 border-b-2 border-dashed", activeCustomTheme === 'homer' ? 'border-[#47515f]/20' : activeCustomTheme === 'nhatky' ? 'border-[#BCA782]/30' : activeCustomTheme === 'thuytien' ? 'border-[#B6A996]/20' : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? 'border-[#facaca]/30' : 'border-[#7F1D1D]/30') : activeCustomTheme === 'thientai' ? 'border-[#34282d]/30' : activeCustomTheme === 'nguoidep' ? 'border-[#2D3D54]/30' : 'border-[#2e2a63]/20')}>
                            <label className={cn("text-xs font-black uppercase flex items-center justify-between", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "text-[#2C1814]" : activeCustomTheme === 'thuytien' ? "text-[#B6A996]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "text-[#780606]" : "text-[#991B1B]") : activeCustomTheme === 'thientai' ? "text-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "text-[#ECEFF4]" : "text-[#bbee1f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>
                               Giao diện truyện
                               {activeCustomTheme === 'homer' ? <span className="text-[9px] bg-[#a0a6b3] text-[#181f2d] font-bold px-1.5 py-0.5 rounded border border-[#a0a6b3]">PREMIUM</span> : activeCustomTheme === 'nhatky' ? <span className="text-[9px] bg-[#DFCEB4] text-[#2C1814] font-bold px-1.5 py-0.5 rounded border border-[#BCA782]">PREMIUM</span> : activeCustomTheme === 'thuytien' ? <span className="text-[9px] bg-[#B6A996] text-[#12110F] font-bold px-1.5 py-0.5 rounded border border-[#B6A996]">PREMIUM</span> : activeCustomTheme === 'rinhrap' ? <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", rinhrapMode === 'thotrang' ? "bg-[#facaca] text-[#780606] border-[#facaca]" : "bg-[#7F1D1D] text-white border-[#7F1D1D]")}>PREMIUM</span> : activeCustomTheme === 'thientai' ? <span className="text-[9px] bg-[#9a858d] text-[#060406] font-bold px-1.5 py-0.5 rounded border border-[#9a858d]">VR GAME</span> : activeCustomTheme === 'nguoidep' ? <span className="text-[9px] bg-[#A2B6CD] text-[#101622] font-bold px-1.5 py-0.5 rounded border border-[#2D3D54]/50">MỸ NHÂN</span> : <span className="text-[9px] bg-[#bbee1f] text-[#13120d] font-bold px-1.5 py-0.5 rounded border border-[#bbee1f]">PREMIUM</span>}
                            </label>
                            <button 
                               type="button"
                               onClick={() => setUseStoryTheme(!useStoryTheme)}
                               className={cn(
                                  "w-full py-2 text-xs font-black uppercase rounded-xl border-2 transition-all cursor-pointer",
                                  useStoryTheme
                                     ? (activeCustomTheme === 'homer' ? "bg-[#a0a6b3] text-[#181f2d] border-[#47515f] shadow-[2px_2px_0_0_#47515f] hover:bg-white" : activeCustomTheme === 'nhatky' ? "bg-[#BCA782] text-[#2C1814] border-[#C9B695] shadow-[2px_2px_0_0_#C9B695] hover:bg-[#C9B695]" : activeCustomTheme === 'thuytien' ? "bg-[#B6A996] text-[#12110F] border-[#B6A996] shadow-[2px_2px_0_0_#12110F] hover:bg-[#F2E6D0]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#facaca] text-[#780606] border-[#facaca] shadow-[2px_2px_0_0_#facaca] hover:bg-[#FFF2F1]" : "bg-[#991B1B] text-white border-[#7F1D1D] shadow-[2px_2px_0_0_#450A0A] hover:bg-[#DC2626]") : activeCustomTheme === 'thientai' ? "bg-[#9a858d] text-[#060406] border-[#34282d] shadow-[2px_2px_0_0_#34282d] hover:bg-[#d4c6c9]" : activeCustomTheme === 'nguoidep' ? "bg-[#A2B6CD] text-[#101622] border-[#2D3D54]/40 shadow-[2px_2px_0_0_#2D3D54] hover:bg-[#ECEFF4]" : "bg-[#bbee1f] text-[#13120d] border-[#2e2a63] shadow-[2px_2px_0_0_#2e2a63] hover:bg-white") 
                                     : (effectiveIsDark ? "bg-[#2C221D] text-[#ECE5DC] border-[#3E2723] hover:bg-[#3E2723]" : "bg-white text-[#3E2723] border-[#3E2723] hover:bg-stone-100")
                               )}
                            >
                               {useStoryTheme ? 'Tắt' : 'Bật'}
                            </button>
                         </div>
                      )}
                      <div className="flex items-center justify-between">
                         <label className={cn("text-xs font-black uppercase", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#67707e]" : activeCustomTheme === 'nhatky' ? "text-[#5C3627]/80" : activeCustomTheme === 'thuytien' ? "text-[#B6A996]/80" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "text-[#780606]/80" : "text-[#7F1D1D]/80") : activeCustomTheme === 'thientai' ? "text-[#9a858d]/80" : activeCustomTheme === 'nguoidep' ? "text-[#A2B6CD]" : "text-[#695b7f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>Chế độ nền tối</label>
                         <div className="flex items-center gap-2">
                            <button type="button" onClick={() => { setIsDark(false); if(isCustomThemeActive) setUseStoryTheme(false); }} style={{ backgroundColor: '#FDF6EC' }} className={cn("w-10 h-10 rounded-full border-3", !effectiveIsDark && !isCustomThemeActive ? "border-[#3E2723]" : "border-[#D7CCC8]")}></button>
                            <button type="button" onClick={() => { setIsDark(true); if(isCustomThemeActive) setUseStoryTheme(false); }} style={{ backgroundColor: '#1A1412' }} className={cn("w-10 h-10 rounded-full border-3", effectiveIsDark && !isCustomThemeActive ? "border-[#D4AF37]" : "border-[#3C2E27]")}></button>
                         </div>
                      </div>
                      <div>
                         <label className={cn("text-xs font-black uppercase mb-3 block", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#67707e]" : activeCustomTheme === 'nhatky' ? "text-[#5C3627]/80" : activeCustomTheme === 'thuytien' ? "text-[#B6A996]/80" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "text-[#780606]/80" : "text-[#7F1D1D]/80") : activeCustomTheme === 'thientai' ? "text-[#9a858d]/80" : activeCustomTheme === 'nguoidep' ? "text-[#A2B6CD]" : "text-[#695b7f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>Cỡ chữ: {fontSize}px</label>
                         <input type="range" min="14" max="28" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className={cn("w-full accent-[#3E2723]", isCustomThemeActive && (activeCustomTheme === 'homer' ? "accent-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "accent-[#2C1814]" : activeCustomTheme === 'thuytien' ? "accent-[#B6A996]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "accent-[#780606]" : "accent-[#991B1B]") : activeCustomTheme === 'thientai' ? "accent-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "accent-[#A2B6CD]" : "accent-[#bbee1f]"))} />
                      </div>
                      <div>
                         <label className={cn("text-xs font-black uppercase mb-3 block", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#67707e]" : activeCustomTheme === 'nhatky' ? "text-[#5C3627]/80" : activeCustomTheme === 'thuytien' ? "text-[#B6A996]/80" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "text-[#780606]/80" : "text-[#7F1D1D]/80") : activeCustomTheme === 'thientai' ? "text-[#9a858d]/80" : activeCustomTheme === 'nguoidep' ? "text-[#A2B6CD]" : "text-[#695b7f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>Phông chữ</label>
                         <select 
                           value={fontFamily} 
                           disabled={isCustomThemeActive}
                           onChange={(e) => setFontFamily(e.target.value as any)}
                           className={cn(
                             "w-full p-2.5 rounded-xl border-2 font-black text-sm transition-all focus:outline-none focus:border-[#8D6E63]",
                             isCustomThemeActive ? (
                               activeCustomTheme === 'homer' ? "bg-[#181f2d] text-[#a0a6b3] border-[#47515f] cursor-not-allowed opacity-75" :
                               activeCustomTheme === 'nhatky' ? "bg-[#E8DCC4] text-[#2C1814] border-[#BCA782] cursor-not-allowed opacity-75" :
                               activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#FFF2F1] text-[#780606] border-[#facaca] cursor-not-allowed opacity-75" : "bg-[#0B0505] text-[#D8B4B4] border-[#7F1D1D] cursor-not-allowed opacity-75") :
                               activeCustomTheme === 'thientai' ? "bg-[#060406] text-[#d4c6c9] border-[#34282d] cursor-not-allowed opacity-75" :
                               activeCustomTheme === 'nguoidep' ? "bg-[#101622] text-[#ECEFF4] border-[#2D3D54]/50 cursor-not-allowed opacity-75" :
                               "bg-[#13120d] text-[#dbcec2] border-[#2e2a63] cursor-not-allowed opacity-75"
                             ) : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-[#ECE5DC]" : "bg-white border-[#3E2723] text-[#3E2723]"
                           )}
                         >
                            <option value="font-reading-quicksand">Quicksand (Mặc định)</option>
                            <option value="font-reading-garamond">EB Garamond (Cổ điển)</option>
                            <option value="font-reading-notoserif">Noto Serif (Truyền thống)</option>
                            <option value="font-reading-iosevka">Iosevka (Kỹ thuật)</option>
                         </select>
                         {isCustomThemeActive && <span className={cn("text-[10px] mt-1 block", activeCustomTheme === 'homer' ? "text-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "text-[#2C1814]" : activeCustomTheme === 'thuytien' ? "text-[#EADDC9]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "text-[#780606]" : "text-[#D8B4B4]") : activeCustomTheme === 'thientai' ? "text-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "text-[#A2B6CD]" : "text-[#bbee1f]")}>{activeCustomTheme === 'homer' ? 'Khóa phông chữ Iosevka theo theme' : activeCustomTheme === 'nhatky' ? 'Khóa phông chữ Cormorant Garamond theo theme' : activeCustomTheme === 'thuytien' ? 'Khóa phông chữ Cormorant Garamond theo theme' : activeCustomTheme === 'rinhrap' ? 'Khóa phông chữ Quicksand theo theme' : activeCustomTheme === 'thientai' ? 'Khóa phông chữ Iosevka theo theme' : activeCustomTheme === 'nguoidep' ? 'Khóa phông chữ Lora & Alegreya theo theme' : 'Khóa phông chữ EB Garamond theo theme'}</span>}
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
                           : activeCustomTheme === 'nhatky'
                               ? "prose-p:text-[#2C1814] prose-h2:text-[#2C1814] prose-blockquote:border-[#BCA782] prose-blockquote:text-[#2C1814]/80"
                               : activeCustomTheme === 'thuytien'
                                   ? "prose-p:text-[#F2E6D0] prose-h2:text-[#B6A996] prose-blockquote:border-[#B6A996]/30 prose-blockquote:text-[#B6A996]/70"
                                   : activeCustomTheme === 'rinhrap'
                                       ? "prose-p:text-[#D8B4B4] prose-h2:text-[#EF4444] prose-blockquote:border-[#7F1D1D] prose-blockquote:text-[#991B1B]"
                                       : activeCustomTheme === 'thientai' ? "prose-p:text-[#d4c6c9] prose-h2:text-[#9a858d] prose-blockquote:border-[#645a6c] prose-blockquote:text-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "prose-p:text-[#ECEFF4]/90 prose-h2:text-[#A2B6CD] prose-blockquote:border-[#2D3D54]/40 prose-blockquote:text-[#ECEFF4]/70" : "prose-p:text-[#dbcec2] prose-h2:text-[#bbee1f] prose-blockquote:border-[#2e2a63] prose-blockquote:text-[#695b7f]")
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
                                   className={cn("inline-flex ml-3 items-center justify-center opacity-40 md:opacity-0 md:group-hover/para:opacity-100 transition-opacity hover:opacity-100 align-baseline cursor-pointer", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "hover:text-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "hover:text-[#E8DCB8]" : activeCustomTheme === 'thuytien' ? "hover:text-[#B6A996]" : activeCustomTheme === 'rinhrap' ? "hover:text-[#EF4444]" : activeCustomTheme === 'thientai' ? "hover:text-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "hover:text-[#A2B6CD]" : "hover:text-[#bbee1f]") : "hover:text-[#8D6E63]", pComments.length > 0 && (isCustomThemeActive ? (activeCustomTheme === 'homer' ? "opacity-100 md:opacity-100 text-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "opacity-100 md:opacity-100 text-[#E8DCB8]" : activeCustomTheme === 'thuytien' ? "opacity-100 md:opacity-100 text-[#B6A996]" : activeCustomTheme === 'rinhrap' ? "opacity-100 md:opacity-100 text-[#EF4444]" : activeCustomTheme === 'thientai' ? "opacity-100 md:opacity-100 text-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "opacity-100 md:opacity-100 text-[#A2B6CD]" : "opacity-100 md:opacity-100 text-[#bbee1f]") : "opacity-100 md:opacity-100 text-[#8D6E63]"))}
                               >
                                  <MessageSquare className="w-[0.8em] h-[0.8em] inline-block -translate-y-[0.15em]" />
                                  {pComments.length > 0 && <span className="text-[0.55em] font-bold ml-1 -translate-y-[0.3em]">{pComments.length}</span>}
                               </button>
                           </p>

                           {activeParagraphIndex === idx && (
                               <div className={cn("mt-4 p-5 rounded-2xl border-2 transition-all", 
                                    isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d]/95 border-[#47515f] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f]" : activeCustomTheme === 'nhatky' ? "bg-[#E8DCC4] border-[#BCA782] text-[#2C1814] shadow-[2px_2px_0_0_#BCA782]" : activeCustomTheme === 'thuytien' ? "bg-[#12110F]/95 border-[#B6A996] text-[#F2E6D0] shadow-[2px_2px_0_0_#12110F]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#fff2f1]/95 border-[#facaca] text-[#780606] shadow-[2px_2px_0_0_#facaca]" : "bg-[#100707]/95 border-[#7F1D1D] text-[#D8B4B4] shadow-[2px_2px_0_0_#450A0A]") : activeCustomTheme === 'thientai' ? "bg-[#060406]/95 border-[#9a858d] text-[#d4c6c9] shadow-[2px_2px_0_0_#9a858d]" : activeCustomTheme === 'nguoidep' ? "bg-[#101622]/95 border-[#2D3D54]/40 text-[#ECEFF4] shadow-[2px_2px_0_0_#2D3D54]" : "bg-[#13120d]/95 border-[#2e2a63] text-[#dbcec2] shadow-[2px_2px_0_0_#2e2a63]") 
                                       : effectiveIsDark 
                                          ? "bg-[#120E0C] border-[#3E2723] shadow-[2px_2px_0_0_#3E2723]" 
                                          : "bg-[#FFFDF9] border-[#3E2723] shadow-[2px_2px_0_0_#3E2723]"
                                )}>
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className={cn("text-sm font-bold uppercase tracking-wider", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "text-[#2C1814]" : activeCustomTheme === 'thuytien' ? "text-[#B6A996]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "text-[#780606]" : "text-[#EF4444]") : activeCustomTheme === 'thientai' ? "text-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "text-[#A2B6CD]" : "text-[#bbee1f]") : (effectiveIsDark ? "text-[#D7CCC8]" : "text-[#8D6E63]"))}>{tParagraphComment}</h4>
                                       <button onClick={() => setActiveParagraphIndex(null)} className="text-xs uppercase font-bold opacity-50 hover:opacity-100">Đóng</button>
                                   </div>
                                   
                                   <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 pt-4">
                                       {pComments.length === 0 ? (
                                           <div className="text-center italic text-sm opacity-50 py-2">{tNoParagraphComment}</div>
                                       ) : (
pComments.map(c => (
                                                <ParagraphCommentNode 
                                                    key={c.id} 
                                                    comment={c} 
                                                    comments={comments} 
                                                    replyingToId={replyingToId} 
                                                    setReplyingToId={setReplyingToId} 
                                                    replyText={replyText} 
                                                    setReplyText={setReplyText} 
                                                    submittingReply={submittingReply} 
                                                    handleSendReply={handleSendReply} 
                                                    getTitleColor={getTitleColor} 
                                                    isLoggedIn={isLoggedIn} 
                                                    isDark={effectiveIsDark} 
                                                    isStoryTheme={effectiveStoryTheme} 
                                                    profilesCache={profilesCache} 
                                                />
                                            ))
                                        )}
                                    </div>

                                    {isLoggedIn ? (
                                       <form onSubmit={(e) => handleParagraphComment(e, idx)} className="flex gap-2">
                                           <input 
                                                type="text" 
                                                value={paragraphCommentText} 
                                                onChange={(e) => setParagraphCommentText(e.target.value)} 
                                                placeholder={tParagraphPlaceholder} 
                                                className={cn("flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border-2 focus:outline-none focus:border-[#8D6E63] font-semibold", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] focus:border-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "bg-[#E8DCC4] border-[#BCA782] text-[#2C1814] focus:border-[#C9B695]" : activeCustomTheme === 'thuytien' ? "bg-[#12110F]/40 text-[#F2E6D0] focus:border-[#B6A996]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#fff2f1] border-[#823323] text-[#000000] focus:border-[#9c0800]" : "bg-[#0B0505] border-[#7F1D1D] text-[#D8B4B4] focus:border-[#EF4444]") : activeCustomTheme === 'thientai' ? "bg-[#060406] border-[#34282d] text-[#d4c6c9] focus:border-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "bg-[#101622] border-[#2D3D54]/30 text-[#ECEFF4] focus:border-[#A2B6CD]" : "bg-[#13120d] border-[#2e2a63] text-[#dbcec2] focus:border-[#bbee1f]") : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-[#ECE5DC]" : "bg-white border-[#3E2723] text-[#3E2723]")}
                                           />
                                           <button type="submit" disabled={!paragraphCommentText.trim()} className={cn("px-5 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 transition-all active:translate-y-0.5 active:shadow-none cursor-pointer shadow-[2px_2px_0_0_#3E2723]", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#a0a6b3] text-[#181f2d] border-[#47515f] shadow-[2px_2px_0_0_#47515f] hover:bg-white disabled:bg-[#a0a6b3]/20 disabled:text-[#a0a6b3]/40 disabled:border-[#47515f]/50 disabled:shadow-none" : activeCustomTheme === 'nhatky' ? "bg-[#BCA782] text-[#2C1814] border-[#C9B695] shadow-[2px_2px_0_0_#C9B695] hover:bg-[#C9B695] disabled:bg-[#BCA782]/20 disabled:text-[#2C1814]/40 disabled:border-[#C9B695]/50 disabled:shadow-none" : activeCustomTheme === 'thuytien' ? "bg-[#B6A996] text-[#12110F] border-[#B6A996] shadow-[2px_2px_0_0_#12110F] hover:bg-[#F2E6D0] disabled:opacity-30 disabled:shadow-none" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#facaca] text-[#780606] border-[#823323] shadow-[2px_2px_0_0_#facaca] hover:bg-[#fff2f1] disabled:bg-[#facaca]/20 disabled:text-[#780606]/40 disabled:border-[#823323]/50 disabled:shadow-none" : "bg-[#7F1D1D] text-white border-[#450A0A] shadow-[2px_2px_0_0_#450A0A] hover:bg-[#991B1B] disabled:bg-[#7F1D1D]/20 disabled:text-white/40 disabled:border-[#450A0A]/50 disabled:shadow-none") : activeCustomTheme === 'thientai' ? "bg-[#9a858d] text-[#060406] border-[#34282d] shadow-[2px_2px_0_0_#34282d] hover:bg-[#d4c6c9] disabled:bg-[#9a858d]/20 disabled:text-[#d4c6c9]/40 disabled:border-[#34282d]/50 disabled:shadow-none" : activeCustomTheme === 'nguoidep' ? "bg-[#A2B6CD] text-[#101622] border-[#2D3D54]/40 shadow-[2px_2px_0_0_#2D3D54] hover:bg-[#ECEFF4] disabled:opacity-30 disabled:shadow-none" : "bg-[#bbee1f] text-[#13120d] border-[#2e2a63] shadow-[2px_2px_0_0_#2e2a63] hover:bg-white disabled:bg-[#bbee1f]/20 disabled:text-[#dbcec2]/40 disabled:border-[#2e2a63]/50 disabled:shadow-none") : "disabled:opacity-50 bg-[#8D6E63] text-white border-[#3E2723] hover:bg-[#5D4037]")}>{tParagraphSubmit}</button>
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
                 <button onClick={() => navigate(`/doc/${story.id}/${prevChapter.id}`)} className={cn("px-4 py-2 border-2 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[2px_2px_0_0_#3E2723] hover:-translate-y-0.5 active:translate-y-0.5", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f] hover:border-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "bg-[#E8DCC4] border-[#BCA782] text-[#2C1814] shadow-[2px_2px_0_0_#BCA782] hover:bg-[#DFCEB4]" : activeCustomTheme === 'thuytien' ? "bg-[#0E0C0A] border-[#9A8E7D]/40 text-[#EADDC9] shadow-[2px_2px_0_0_#0E0C0A] hover:bg-[#1C1A17]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#fff2f1] border-[#823323] text-[#780606] shadow-[2px_2px_0_0_#facaca] hover:bg-[#fde0e0]" : "bg-[#0B0505] border-[#7F1D1D] text-[#EF4444] shadow-[2px_2px_0_0_#450A0A] hover:bg-[#100707]") : activeCustomTheme === 'thientai' ? "bg-[#060406] border-[#34282d] text-[#9a858d] shadow-[2px_2px_0_0_#34282d] hover:border-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "bg-[#101622] border-[#2D3D54]/30 text-[#ECEFF4] shadow-[2px_2px_0_0_#2D3D54] hover:bg-[#151C28]" : "bg-[#13120d] border-[#2e2a63] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63] hover:border-[#bbee1f]") : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-[#ECE5DC]" : "bg-white border-[#3E2723] text-[#3E2723]")}>
                    <ArrowLeft className="w-5 h-5"/> {tPrevChapter}
                 </button>
              ) : <div></div>}
              
              {nextChapter ? (
                 <button onClick={() => navigate(`/doc/${story.id}/${nextChapter.id}`)} className={cn("px-4 py-2 border-2 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[2px_2px_0_0_#3E2723] hover:-translate-y-0.5 active:translate-y-0.5", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f] hover:border-[#a0a6b3]" : activeCustomTheme === 'nhatky' ? "bg-[#E8DCC4] border-[#BCA782] text-[#2C1814] shadow-[2px_2px_0_0_#BCA782] hover:bg-[#DFCEB4]" : activeCustomTheme === 'thuytien' ? "bg-[#0E0C0A] border-[#9A8E7D]/40 text-[#EADDC9] shadow-[2px_2px_0_0_#0E0C0A] hover:bg-[#1C1A17]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#fff2f1] border-[#823323] text-[#780606] shadow-[2px_2px_0_0_#facaca] hover:bg-[#fde0e0]" : "bg-[#0B0505] border-[#7F1D1D] text-[#EF4444] shadow-[2px_2px_0_0_#450A0A] hover:bg-[#100707]") : activeCustomTheme === 'thientai' ? "bg-[#060406] border-[#34282d] text-[#9a858d] shadow-[2px_2px_0_0_#34282d] hover:border-[#9a858d]" : activeCustomTheme === 'nguoidep' ? "bg-[#251e23] border-[#808499]/30 text-[#dfdee0] shadow-[2px_2px_0_0_#808499] hover:bg-[#1f191d]" : "bg-[#13120d] border-[#2e2a63] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63] hover:border-[#bbee1f]") : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-[#ECE5DC]" : "bg-white border-[#3E2723] text-[#3E2723]")}>
                    {tNextChapter} <ArrowRight className="w-5 h-5"/>
                 </button>
              ) : <div className="text-sm opacity-50 uppercase font-bold tracking-widest">Hết truyện</div>}
           </div>
           
           <div className="w-full h-px bg-[#D7CCC8] mb-12"></div>

           {/* Comments Area (Counts for missions) */}
           <div className="mb-12">
               <h3 className={cn("text-xs font-black uppercase tracking-wider mb-6 px-4 py-2 border-2 inline-block rounded-xl", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "border-[#47515f] bg-[#181f2d] text-[#a0a6b3] shadow-[2px_2px_0_0_#47515f]" : activeCustomTheme === 'nhatky' ? "border-[#BCA782] bg-[#E8DCC4] text-[#2C1814] shadow-[2px_2px_0_0_#BCA782]" : activeCustomTheme === 'thuytien' ? "border-[#B6A996]/30 bg-[#12110F] text-[#B6A996] shadow-[2px_2px_0_0_#12110F]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "border-[#823323] bg-[#fff2f1] text-[#780606] shadow-[2px_2px_0_0_#facaca]" : "border-[#7F1D1D] bg-[#0B0505] text-[#EF4444] shadow-[2px_2px_0_0_#450A0A]") : activeCustomTheme === 'thientai' ? "border-[#34282d] bg-[#060406] text-[#9a858d] shadow-[2px_2px_0_0_#34282d]" : activeCustomTheme === 'nguoidep' ? "border-[#2D3D54]/30 bg-[#101622] text-[#A2B6CD] shadow-[2px_2px_0_0_#2D3D54]" : "border-[#2e2a63] bg-[#13120d] text-[#bbee1f] shadow-[2px_2px_0_0_#2e2a63]") : effectiveIsDark ? "border-[#3E2723] bg-[#2C221D] text-[#ECE5DC] shadow-[2px_2px_0_0_#3E2723]" : "border-[#3E2723] bg-[#F5E6D3]/65 text-[#3E2723] shadow-[2px_2px_0_0_#3E2723]")}>{tCommentAreaTitle}</h3>
               <form onSubmit={handleComment} className="flex flex-col gap-3 mb-8">
                  <textarea 
                     value={commentText}
                     onChange={(e) => setCommentText(e.target.value)}
                     disabled={!isLoggedIn}
                     placeholder={isLoggedIn ? tCommentAreaPlaceholder : tCommentAreaPlaceholderLogin}
                     className={cn("w-full p-4 rounded-2xl resize-none border-2 outline-none font-semibold text-xs sm:text-sm transition-all", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#181f2d] border-[#47515f] text-[#a0a6b3] focus:border-[#a0a6b3] focus:shadow-[2px_2px_0_0_#47515f]" : activeCustomTheme === 'nhatky' ? "bg-[#E8DCC4] border-[#BCA782] text-[#2C1814] focus:border-[#C9B695] focus:shadow-[2px_2px_0_0_#BCA782]" : activeCustomTheme === 'thuytien' ? "bg-[#12110F] border-[#B6A996]/30 text-[#F2E6D0] focus:border-[#B6A996] focus:shadow-[2px_2px_0_0_#12110F]" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#fff2f1] border-[#823323] text-[#000000] focus:border-[#9c0800] focus:shadow-[2px_2px_0_0_#facaca]" : "bg-[#0B0505] border-[#7F1D1D] text-[#D8B4B4] focus:border-[#EF4444] focus:shadow-[2px_2px_0_0_#450A0A]") : activeCustomTheme === 'thientai' ? "bg-[#060406] border-[#34282d] text-[#d4c6c9] focus:border-[#9a858d] focus:shadow-[2px_2px_0_0_#34282d]" : activeCustomTheme === 'nguoidep' ? "bg-[#101622] border-[#2D3D54]/30 text-[#ECEFF4] focus:border-[#A2B6CD] focus:shadow-[2px_2px_0_0_#2D3D54]" : "bg-[#13120d] border-[#2e2a63] text-[#dbcec2] focus:border-[#bbee1f] focus:shadow-[2px_2px_0_0_#2e2a63]") : effectiveIsDark ? "bg-[#1A1412] border-[#3E2723] text-white focus:border-[#8D6E63] focus:shadow-[2px_2px_0_0_#000]" : "bg-white border-[#3E2723] text-[#3E2723] focus:border-[#8D6E63] focus:shadow-[2px_2px_0_0_#3E2723]")}
                     rows={4}
                  />
                  <div className="flex justify-end">
                     <button type="submit" disabled={!isLoggedIn || !commentText.trim()} className={cn("px-8 py-2.5 rounded-xl font-black transition-all uppercase text-xs tracking-wider border-2 active:translate-y-0.5 active:shadow-none cursor-pointer shadow-[3px_3px_0_0_#3E2723]", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "bg-[#a0a6b3] text-[#181f2d] border-[#47515f] shadow-[3px_3px_0_0_#47515f] hover:bg-white disabled:bg-[#a0a6b3]/20 disabled:text-[#a0a6b3]/40 disabled:border-[#47515f]/50 disabled:shadow-none" : activeCustomTheme === 'nhatky' ? "bg-[#BCA782] text-[#2C1814] border-[#C9B695] shadow-[3px_3px_0_0_#C9B695] hover:bg-[#C9B695] disabled:bg-[#BCA782]/20 disabled:text-[#2C1814]/40 disabled:border-[#C9B695]/50 disabled:shadow-none" : activeCustomTheme === 'thuytien' ? "bg-[#9A8E7D] text-[#0E0C0A] border-[#9A8E7D] shadow-[3px_3px_0_0_#0E0C0A] hover:bg-[#EADDC9] disabled:bg-[#9A8E7D]/20 disabled:text-[#EADDC9]/40 disabled:border-[#9A8E7D]/50 disabled:shadow-none" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "bg-[#facaca] text-[#780606] border-[#823323] shadow-[3px_3px_0_0_#facaca] hover:bg-[#fff2f1] disabled:bg-[#facaca]/20 disabled:text-[#780606]/40 disabled:border-[#823323]/50 disabled:shadow-none" : "bg-[#991B1B] text-white border-[#7F1D1D] shadow-[3px_3px_0_0_#450A0A] hover:bg-[#DC2626] disabled:bg-[#991B1B]/20 disabled:text-white/40 disabled:border-[#7F1D1D]/50 disabled:shadow-none") : activeCustomTheme === 'thientai' ? "bg-[#9a858d] text-[#060406] border-[#34282d] shadow-[3px_3px_0_0_#34282d] hover:bg-[#d4c6c9] disabled:bg-[#9a858d]/20 disabled:text-[#d4c6c9]/40 disabled:border-[#34282d]/50 disabled:shadow-none" : activeCustomTheme === 'nguoidep' ? "bg-[#A2B6CD] text-[#101622] border-[#2D3D54]/40 shadow-[3px_3px_0_0_#2D3D54] hover:bg-[#ECEFF4] disabled:opacity-30 disabled:shadow-none" : "bg-[#bbee1f] text-[#13120d] border-[#2e2a63] shadow-[3px_3px_0_0_#2e2a63] hover:bg-white disabled:bg-[#bbee1f]/20 disabled:text-[#dbcec2]/40 disabled:border-[#2e2a63]/50 disabled:shadow-none") : "disabled:opacity-50 bg-[#8D6E63] text-white border-[#3E2723] hover:bg-[#5D4037]")}>
                        {tCommentSubmit}
                     </button>
                  </div>
               </form>

               <div className="space-y-6">
                   {chapterComments.length === 0 ? (
                       <p className={cn("text-center italic opacity-50", isCustomThemeActive ? (activeCustomTheme === 'homer' ? "text-[#a0a6b3]/70" : activeCustomTheme === 'nhatky' ? "text-[#DFD6D3]/70" : activeCustomTheme === 'thuytien' ? "text-[#EADDC9]/70" : activeCustomTheme === 'rinhrap' ? (rinhrapMode === 'thotrang' ? "text-[#780606]/70" : "text-[#D8B4B4]/70") : "text-[#dbcec2]/70") : "")}>{tNoComment}</p>
                   ) : (
                       chapterComments.map(c => { return <ChapterCommentNode key={c.id} comment={c} comments={comments} replyingToId={replyingToId} setReplyingToId={setReplyingToId} replyText={replyText} setReplyText={setReplyText} submittingReply={submittingReply} handleSendReply={handleSendReply} getTitleColor={getTitleColor} isLoggedIn={isLoggedIn} isDark={effectiveIsDark} isStoryTheme={effectiveStoryTheme} profilesCache={profilesCache} />; if (false) { return (
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

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useStore } from '../store';
import { cn } from './Layout';
import { MessageSquare, Send, User } from 'lucide-react';
import { db, checkIfQuotaError } from '../lib/firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { UserAvatar } from './UserAvatar';

interface ChatMessage {
  id: string;
  uid: string;
  displayName: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: number | any;
  activeTitle?: string | null;
}

export function GlobalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { isLoggedIn, uid, displayName, avatarUrl, incrementSentMessages, activeTitle, getTitleColor, equippedStickerChat, equippedAccessory, accessoryPosition } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chatMessages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as ChatMessage);
      });
      setMessages(msgs.reverse());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isLoggedIn || !uid || !displayName) return;
    
    // Save locally to clear in UI quickly
    const text = input.trim();
    setInput('');
    
    try {
      await addDoc(collection(db, 'chatMessages'), {
        uid,
        displayName,
        avatarUrl: avatarUrl || null,
        content: text,
        activeTitle: activeTitle || null,
        createdAt: serverTimestamp(),
        equippedStickerChat: useStore.getState().equippedStickerChat || null,
        equippedAccessory: useStore.getState().equippedAccessory || null,
        accessoryPosition: useStore.getState().accessoryPosition || null
      });
      incrementSentMessages();
    } catch (e) {
      console.error('Lỗi khi gửi tin nhắn:', e);
      setInput(text); // reset input if failed
      if (checkIfQuotaError(e)) {
        (window as any).__setQuotaExceeded?.(true);
        alert("Hệ thống đạt giới hạn lưu trữ đám mây (Quota Exceeded) hôm nay. Gửi tin nhắn mới tạm thời chưa lưu trữ được.");
      } else {
         const errMsg = e instanceof Error ? e.message : String(e);
         alert("Lỗi nhắn tin: " + errMsg);
      }
    }
  };

  return (
    <div className="flex flex-col bg-[#3E2723] rounded-3xl shadow-xl overflow-hidden border-4 border-[#8D6E63] h-full min-h-[400px]">
      <div className="p-4 bg-[#2D1B19] text-[#FDF6EC] flex items-center justify-between">
        <span className="font-bold text-sm tracking-widest flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Choco Lounge
        </span>
        <span className="text-[10px] opacity-60">Thế giới</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs"
      >
        {messages.map((msg, i) => {
          const isMe = msg.uid === uid;
          const currentSticker = isMe ? equippedStickerChat : (msg.equippedStickerChat || msg.equippedSticker);
          const currentDisplayName = isMe ? displayName : msg.displayName;
          const currentAvatarUrl = isMe ? avatarUrl : msg.avatarUrl;
          const currentActiveTitle = isMe ? activeTitle : msg.activeTitle;
          const currentAccessory = isMe ? equippedAccessory : msg.equippedAccessory;
          const currentAccessoryPos = isMe ? accessoryPosition : msg.accessoryPosition;

          return (
             <div key={msg.id || i} className="flex flex-col w-full text-white items-start">
                <div className="flex items-end gap-2 pr-1 pl-1 max-w-[85%] flex-row">
                   <UserAvatar 
                     avatarUrl={currentAvatarUrl} 
                     equippedAccessory={currentAccessory}
                     accessoryPosition={currentAccessoryPos}
                     className="w-10 h-10 mb-0.5" 
                     fallbackIconSizeClass="w-5 h-5" 
                   />
                   <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1.5 px-1 flex-wrap">
                         <span className="font-bold text-[10px] whitespace-nowrap" style={{ color: getTitleColor(currentActiveTitle) || '#A1887F' }}>
                            {currentDisplayName}
                         </span>
                         {currentActiveTitle && (
                            <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 text-[8px] font-extrabold rounded uppercase tracking-tighter select-none border border-yellow-200">
                               🏆 {currentActiveTitle}
                            </span>
                         )}
                      </div>
                      
                      <div className={cn("p-2.5 rounded-2xl relative text-[13px] leading-relaxed shadow-sm min-w-10 break-words text-white rounded-tl-sm pr-7 overflow-visible", isMe ? "bg-[#8D6E63]" : "bg-[#5D4037]")}>
                          <p>{msg.content}</p>
                          {currentSticker && (
                             <img 
                               src={currentSticker} 
                               alt="Bouncing sticker" 
                               className="absolute right-1.5 -bottom-2 w-12 h-12 object-contain pointer-events-none hover:scale-125 transition-transform animate-bounce [animation-duration:3.5s] z-10" 
                               style={{ imageRendering: 'pixelated' }}
                               referrerPolicy="no-referrer"
                             />
                          )}
                      </div>
                   </div>
                </div>
             </div>
          );
        })}
        {messages.length === 0 && <p className="text-center text-[#D7CCC8]/50 mt-auto mb-auto italic">Chưa có tin nhắn nào</p>}
      </div>
      <form onSubmit={send} className="p-3 bg-[#2D1B19] flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoggedIn ? "Nhắn gì đó..." : "Đăng nhập để chat"}
          disabled={!isLoggedIn}
          className="flex-1 bg-[#3E2723] border border-[#5D4037] rounded-full px-4 py-2 text-white text-xs outline-none focus:border-[#8D6E63] disabled:opacity-50"
        />
        <button 
          disabled={!isLoggedIn || !input.trim()}
          type="submit"
          className="w-9 h-9 bg-[#8D6E63] rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-colors hover:bg-[#A1887F] shrink-0"
        >
           <Send className="w-4 h-4 -ml-0.5" />
        </button>
      </form>
    </div>
  );
}

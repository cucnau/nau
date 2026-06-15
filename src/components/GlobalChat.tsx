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
    <div className="flex flex-col bg-[#5D4037] dark:bg-[#2C221D] rounded-3xl overflow-hidden border-2 border-[#3E2723] dark:border-[#4E342E] h-full min-h-[400px] shadow-[1px_1px_0_0_#8D6E63] dark:shadow-[1px_1px_0_0_#0D0907] relative">
      <div className="absolute top-0 left-0 right-0 h-4 bg-[#8D6E63] dark:bg-[#3C2E27] border-b-[3px] border-[#3E2723] dark:border-[#4E342E]" />
      <div className="pt-6 pb-3 px-4 bg-[#4E342E] dark:bg-[#251E1B] text-[#FDF6EC] flex items-center justify-between border-b-[3px] border-[#3E2723] dark:border-[#4E342E]">
        <span className="font-extrabold text-lg tracking-widest flex items-center gap-2 drop-shadow-[1px_1px_0_#3E2723]">
            <MessageSquare className="w-5 h-5 text-[#D7CCC8]" /> Choco Lounge
        </span>
        <span className="text-xs font-bold opacity-60 uppercase bg-[#3E2723] px-2 py-0.5 rounded-lg border-2 border-[#1A1412]">Thế giới</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 pb-8 flex flex-col gap-4 text-xs bg-[#5D4037] dark:bg-[#2C221D]"
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
                            <span className="px-1 py-0.5 bg-[#F5E6D3] dark:bg-[#3C2E27] text-[#5D4037] dark:text-[#E6D8C9] text-[8px] font-extrabold rounded uppercase tracking-tighter select-none border border-[#D7CCC8] dark:border-[#5D4037]">
                               🏆 {currentActiveTitle}
                            </span>
                         )}
                      </div>
                      
                      <div className={cn("p-3 rounded-2xl relative text-[13px] leading-relaxed break-words rounded-tl-md flex-1 font-bold border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907]", isMe ? "bg-[#8D6E63] text-white" : "bg-[#FDF6EC] text-[#3E2723] dark:bg-[#3C2E27] dark:text-[#ECE5DC]")}>
                          <div className={currentSticker ? "pr-10" : ""}>
                             <p>{msg.content}</p>
                          </div>
                          {currentSticker && (
                             <img 
                               src={currentSticker} 
                               alt="Sticker" 
                               className="absolute -right-3 top-1/2 -translate-y-1/2 w-12 h-12 object-contain pointer-events-none hover:scale-110 transition-transform z-10" 
                               referrerPolicy="no-referrer"
                             />
                          )}
                      </div>
                   </div>
                </div>
             </div>
          );
        })}
        {messages.length === 0 && <p className="text-center text-[#D7CCC8]/50 mt-auto mb-auto italic font-bold">Chưa có tin nhắn nào</p>}
      </div>
      <form onSubmit={send} className="p-4 bg-[#4E342E] dark:bg-[#1A1412] flex gap-3 border-t-[3px] border-[#3E2723] dark:border-[#4E342E]">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoggedIn ? "Nhắn gì đó..." : "Đăng nhập để chat"}
          disabled={!isLoggedIn}
          className="flex-1 bg-[#FDF6EC] dark:bg-[#2C221D] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-xl px-4 py-2 text-[#3E2723] dark:text-[#ECE5DC] text-xs font-bold outline-none focus:border-[#8D6E63] dark:focus:border-[#5D4037] shadow-[inset_0_2px_0_0_#D7CCC8] dark:shadow-[inset_0_2px_0_0_#3C2E27] disabled:opacity-50"
        />
        <button 
          disabled={!isLoggedIn || !input.trim()}
          type="submit"
          className="w-10 h-10 bg-[#E6D8C9] dark:bg-[#5D4037] border-[3px] border-[#D7CCC8] dark:border-[#5D4037] shadow-[0_3px_0_0_#D7CCC8] dark:shadow-[0_3px_0_0_#0D0907] rounded-xl flex items-center justify-center text-[#3E2723] dark:text-[#FDF6EC] disabled:opacity-50 transition-all hover:bg-[#F5E6D3] dark:hover:bg-[#8D6E63] hover:-translate-y-1 active:translate-y-1 active:shadow-none shrink-0"
        >
           <Send className="w-5 h-5 -ml-0.5" />
        </button>
      </form>
    </div>
  );
}

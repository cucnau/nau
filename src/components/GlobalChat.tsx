import { useState, useEffect, useRef, FormEvent } from 'react';
import { useStore } from '../store';
import { cn } from './Layout';
import { MessageSquare, Send, User, Sparkles, Gift } from 'lucide-react';
import { db, checkIfQuotaError } from '../lib/firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { UserAvatar } from './UserAvatar';

interface ChatMessage {
  id: string;
  uid: string;
  displayName: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: number | any;
  activeTitle?: string | null;
  isRain?: boolean;
  chocoAmount?: number;
  claimedBy?: string[];
}

export function GlobalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { isLoggedIn, uid, displayName, avatarUrl, incrementSentMessages, activeTitle, getTitleColor, equippedStickerChat, equippedAccessory, accessoryPosition, email, firebaseUser, addChoco } = useStore();
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

  const handleClaimRain = async (msgId: string, amount: number, claimedBy: string[] = []) => {
     if (!isLoggedIn || !uid) return;
     if (claimedBy.includes(uid)) {
        alert("Bạn đã nhặt phần Choco này rồi!");
        return;
     }
     try {
        await updateDoc(doc(db, 'chatMessages', msgId), {
           claimedBy: arrayUnion(uid)
        });
        addChoco(amount, 'Nhặt mưa Choco từ Chucu');
        alert(`Bạn đã nhặt được ${amount} Choco từ cơn mưa của bé Chucu!`);
     } catch (err) {
        console.error(err);
        alert("Lỗi khi nhặt Choco!");
     }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isLoggedIn || !uid || !displayName) return;
    
    const text = input.trim();
    setInput('');
    
    const isAdmin = email?.toLowerCase() === 'cucnau01@gmail.com' || firebaseUser?.email?.toLowerCase() === 'cucnau01@gmail.com';
    let isRain = false;
    let chocoAmount = 0;
    
    if (isAdmin && text.startsWith('/rain ')) {
       const parts = text.split(' ');
       const amountStr = parts[1];
       if (amountStr && !isNaN(Number(amountStr))) {
          isRain = true;
          chocoAmount = Number(amountStr);
       }
    }
    
    try {
      await addDoc(collection(db, 'chatMessages'), {
        uid,
        displayName: isRain ? 'Chucu (Hệ thống)' : displayName,
        avatarUrl: isRain ? null : (avatarUrl || null),
        content: isRain ? `Ê mấy người kia!! Tui đang vui nên rắc mưa ${chocoAmount} Choco dằn mặt nè! Nhặt nhanh trước khi tui đổi ý! ☔🍫` : text,
        activeTitle: isRain ? 'Mascot' : (activeTitle || null),
        createdAt: serverTimestamp(),
        equippedStickerChat: useStore.getState().equippedStickerChat || null,
        equippedAccessory: useStore.getState().equippedAccessory || null,
        accessoryPosition: useStore.getState().accessoryPosition || null,
        isRain,
        chocoAmount,
        claimedBy: []
      });
      incrementSentMessages();
    } catch (e) {
      console.error('Lỗi khi gửi tin nhắn:', e);
      setInput(text);
      if (checkIfQuotaError(e)) {
        (window as any).__setQuotaExceeded?.(true);
        alert("Hệ thống đạt giới hạn lưu trữ đám mây (Quota Exceeded) hôm nay. Gửi tin nhắn mới tạm thời chưa lưu trữ được.");
      } else {
         const errMsg = e instanceof Error ? e.message : String(e);
         alert("Lỗi nhắn tin: " + errMsg);
      }
    }
  };

      const activeRain = messages.find(m => {
        if (!m.isRain || !m.createdAt) return false;
        let ts = m.createdAt;
        if (typeof ts === 'object' && ts.toMillis) {
           ts = ts.toMillis();
        }
        return (Date.now() - ts) < 3 * 60 * 1000;
      });

      return (
    <div className="flex flex-col bg-[#5D4037] dark:bg-[#2C221D] rounded-3xl overflow-hidden border-2 border-[#3E2723] dark:border-[#4E342E] h-[500px] shadow-[1px_1px_0_0_#8D6E63] dark:shadow-[1px_1px_0_0_#0D0907] relative">
      <div className="absolute top-0 left-0 right-0 h-4 bg-[#8D6E63] dark:bg-[#3C2E27] border-b-[3px] border-[#3E2723] dark:border-[#4E342E]" />
      <div className="pt-6 pb-3 px-4 bg-[#4E342E] dark:bg-[#251E1B] text-[#FDF6EC] flex items-center justify-between border-b-[3px] border-[#3E2723] dark:border-[#4E342E] z-10 relative">
        <span className="font-extrabold text-lg tracking-widest flex items-center gap-2 drop-shadow-[1px_1px_0_#3E2723]">
            <MessageSquare className="w-5 h-5 text-[#D7CCC8]" /> Choco Lounge
        </span>
        <span className="text-xs font-bold opacity-60 uppercase bg-[#3E2723] px-2 py-0.5 rounded-lg border-2 border-[#1A1412]">Thế giới</span>
      </div>
      
      {activeRain && (
        <div className="absolute inset-0 top-16 z-20 pointer-events-none overflow-hidden flex flex-col pt-4 items-center">
           <div className="absolute inset-0 bg-gradient-to-b from-[#FFF9C4]/20 to-transparent pointer-events-none" />
           <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#5D4037] rounded-xl border-2 border-[#3E2723] overflow-hidden flex items-center justify-center animate-bounce shadow-[2px_2px_0_0_#3E2723]">
                <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] translate-y-1">
                  <ellipse cx="50" cy="53" rx="26" ry="23" fill="#8D6E63" stroke="#3E2723" strokeWidth="4" />
                  <path d="M 35 30 Q 50 20 65 30" fill="none" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" />
                  <ellipse cx="32" cy="52" rx="4" ry="2" fill="#FF8A80" opacity="0.6" />
                  <ellipse cx="68" cy="52" rx="4" ry="2" fill="#FF8A80" opacity="0.6" />
                  <path d="M 38 46 Q 43 42 48 46" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 52 46 Q 57 42 62 46" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 48 55 L 48 65 Q 50 68 52 65 L 52 55" fill="#FF8A80" stroke="#3E2723" strokeWidth="2.5" />
                </svg>
              </div>
              <div className="bg-[#FFF9C4] dark:bg-[#D4AF37] border-[3px] border-[#D4AF37] dark:border-[#FFF9C4] text-[#5D4037] dark:text-[#3E2723] px-4 py-1.5 rounded-2xl font-black shadow-lg animate-bounce pointer-events-auto cursor-pointer" onClick={() => handleClaimRain(activeRain.id, activeRain.chocoAmount || 5, activeRain.claimedBy || [])} style={{ animationDelay: '0.2s' }}>
                Cơn Mưa Choco Đang Rơi! Nhấn nhặt lẹ!! ☔🍫
              </div>
           </div>
           {/* Falling chocos visual effect */}
           {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                onClick={() => handleClaimRain(activeRain.id, activeRain.chocoAmount || 5, activeRain.claimedBy || [])}
                className="absolute text-2xl animate-fall pointer-events-auto cursor-pointer hover:scale-125 transition-transform" 
                style={{ 
                   left: `${Math.random() * 90}%`, 
                   animationDuration: `${Math.random() * 2 + 2}s`, 
                   animationDelay: `${Math.random() * 2}s` 
                }}>🍫</div>
           ))}
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 pb-8 flex flex-col gap-4 text-xs bg-[#5D4037] dark:bg-[#2C221D]"
      >
        {messages.map((msg, i) => {
          if (msg.isRain) return null;

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
                      
                      <div className={cn("p-3 rounded-2xl relative text-[13px] leading-relaxed break-words rounded-tl-md flex-1 font-bold border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907]", isMe ? "bg-[#8D6E63] text-white" : "bg-[#FDF6EC] text-[#3E2723] dark:bg-[#3C2E27] dark:text-[#ECE5DC]", msg.isRain && "bg-[#FFF9C4] dark:bg-[#4E3A1D] border-[#D4AF37] animate-pulse")}>
                          <div className={currentSticker ? "pr-10" : ""}>
                             <p>{msg.content}</p>
                             {msg.isRain && (
                                <div className="mt-3">
                                   <button 
                                     onClick={() => handleClaimRain(msg.id, msg.chocoAmount || 0, msg.claimedBy)}
                                     disabled={msg.claimedBy?.includes(uid || '')}
                                     className={cn("w-full p-2 flex items-center justify-center gap-2 rounded-xl border-2 uppercase text-[10px] tracking-widest font-black transition-all", msg.claimedBy?.includes(uid || '') ? "bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed" : "bg-[#D4AF37] text-[#3E2723] border-[#3E2723] shadow-[1px_1px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none hover:bg-[#F2C94C]")}
                                   >
                                     <Gift className="w-4 h-4" />
                                     {msg.claimedBy?.includes(uid || '') ? "Đã nhặt" : `Nhặt ${msg.chocoAmount} Choco`}
                                   </button>
                                </div>
                             )}
                          </div>
                          {currentSticker && !msg.isRain && (
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

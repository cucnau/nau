import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Newspaper, User, ExternalLink, MessageSquareQuote } from 'lucide-react';
import { cn } from './Layout';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';

interface FeedPost {
  id: string;
  uid: string;
  displayName: string;
  avatarUrl?: string | null;
  activeTitle?: string | null;
  content: string;
  createdAt: any;
  equippedSticker?: string | null;
  stickerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
}

export function NewsFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const { isLoggedIn, uid, email, getTitleColor, displayName, activeTitle, avatarUrl, equippedStickerPost, stickerPositionPost, equippedAccessory, accessoryPosition } = useStore();
  const navigate = useNavigate();
  const isAdmin = email?.toLowerCase() === 'cucnau01@gmail.com';

  useEffect(() => {
    const q = query(
      collection(db, 'newsFeed'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const arr: FeedPost[] = [];
      snapshot.forEach((docSnap) => {
        arr.push({ id: docSnap.id, ...docSnap.data() } as FeedPost);
      });
      setPosts(arr);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'newsFeed');
    });

    return () => unsubscribe();
  }, []);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    try {
      await deleteDoc(doc(db, 'newsFeed', postId));
    } catch (err) {
      console.error("Lỗi khi xóa bài viết:", err);
      alert("Không thể xóa bài viết. Lỗi: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="flex flex-col bg-[#FDF6EC] dark:bg-[#2C221D] rounded-3xl border-2 border-[#3E2723] p-5 shadow-[1px_1px_0_0_#8D6E63] dark:shadow-[1px_1px_0_0_#0D0907] relative overflow-hidden">
      {/* Decorative top bar like a game menu */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-[#8D6E63] dark:bg-[#1A1412] border-b-[3px] border-[#3E2723]" />
      
      <div className="flex justify-between items-center mb-4 mt-2 pb-3 border-b-4 border-[#3E2723] dark:border-[#4E342E]/50 border-dotted">
        <h2 className="font-black text-lg text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-widest flex items-center gap-2 drop-shadow-[1px_1px_0_#D7CCC8] dark:drop-shadow-[1px_1px_0_#1A1412]">
          <Newspaper className="w-5 h-5 text-[#8D6E63] dark:text-[#C29D70]" />
          Bản tin Choco
        </h2>
        {isLoggedIn && (
          <button 
            type="button"
            onClick={() => navigate('/tai-khoan')}
            className="text-[10px] sm:text-xs font-black bg-[#E6D8C9] text-[#5D4037] hover:bg-[#D7CCC8] px-3 py-1.5 rounded-lg border-2 border-[#5D4037] shadow-[0_2px_0_0_#5D4037] active:translate-y-0.5 active:shadow-none flex items-center gap-1 transition-all"
          >
            Đăng bài ngay <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto overflow-x-hidden py-4 px-1 custom-scrollbar">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-[#FDF6EC]/40 dark:bg-[#2C221D]/40 rounded-2xl border border-dashed border-[#D7CCC8]/50 dark:border-[#5D4037]/50 text-center">
            <MessageSquareQuote className="w-8 h-8 text-[#D7CCC8] dark:text-[#5D4037] mb-1 opacity-70" />
            <p className="text-xs text-stone-400 dark:text-stone-500 italic">Chưa có bài đăng nào trên Bản tin.</p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">Hãy vào trang Hồ sơ của bạn để đăng bài viết đầu tiên!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isAuthor = post.uid === uid;
            const canDelete = isAuthor || isAdmin;
            
            const currentSticker = isAuthor ? equippedStickerPost : (post.equippedStickerPost || post.equippedSticker);
            const currentStickerPos = isAuthor ? stickerPositionPost : (post.stickerPositionPost || post.stickerPosition);
            const currentDisplayName = isAuthor ? displayName : post.displayName;
            const currentActiveTitle = isAuthor ? activeTitle : post.activeTitle;

            return (
              <div 
                key={post.id} 
                className={cn("flex gap-3 p-4 bg-[#FFFDF9] dark:bg-[#1E1815] rounded-3xl border-[3px] border-[#3E2723] dark:border-[#4E342E] shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] transition-transform hover:-translate-y-1 relative mb-2", currentSticker ? "pr-10" : "")}
              >
                {currentSticker && (
                  <img 
                    src={currentSticker} 
                    alt="Decor sticker" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 object-contain pointer-events-none hover:scale-125 transition-transform z-10" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <UserAvatar 
                  avatarUrl={isAuthor ? avatarUrl : post.avatarUrl} 
                  equippedAccessory={isAuthor ? equippedAccessory : post.equippedAccessory}
                  accessoryPosition={isAuthor ? accessoryPosition : post.accessoryPosition}
                  className="w-10 h-10" 
                  fallbackIconSizeClass="w-5 h-5" 
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs" style={{ color: getTitleColor(currentActiveTitle) || '#5D4037' }}>
                        {currentDisplayName}
                      </span>
                      {currentActiveTitle && (
                        <span className="px-1 py-0.5 bg-[#F5E6D3] dark:bg-[#3C2E27] text-[#5D4037] dark:text-[#E6D8C9] text-[7px] font-black rounded uppercase shadow-xs border border-[#D7CCC8] dark:border-[#5D4037] inline-block">
                          🏆 {currentActiveTitle}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] text-stone-400 dark:text-stone-500 font-mono">
                        {post.createdAt?.toDate 
                          ? new Date(post.createdAt.toDate()).toLocaleDateString('vi-VN', { 
                              month: 'numeric', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) 
                          : 'Vừa xong'}
                      </span>

                    </div>
                  </div>

                  <p className="text-xs text-[#3E2723] dark:text-[#ECE5DC] break-words mt-1 leading-relaxed whitespace-pre-wrap text-justify pr-1 font-medium">
                    {post.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

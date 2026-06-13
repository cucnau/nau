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
      limit(30)
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
    <div className="flex flex-col bg-white dark:bg-[#1A1412] rounded-3xl border border-[#D7CCC8]/80 dark:border-[#3C2E27] p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#D7CCC8]/30 dark:border-[#3C2E27]/50">
        <h2 className="font-bold text-sm border-l-4 border-[#8D6E63] dark:border-[#C29D70] pl-2.5 text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wider flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[#8D6E63] dark:text-[#C29D70]" />
          Bản tin Choco
        </h2>
        {isLoggedIn && (
          <button 
            type="button"
            onClick={() => navigate('/tai-khoan')}
            className="text-[10px] sm:text-xs font-bold text-[#8D6E63] dark:text-[#A1887F] hover:text-[#5D4037] dark:hover:text-[#ECE5DC] flex items-center gap-1 transition-all"
          >
            Đăng bài ngay <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 px-2 pt-3 pb-2 -mx-2">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-[#FDF6EC]/40 dark:bg-[#2C221D]/40 rounded-2xl border border-dashed border-[#D7CCC8]/50 dark:border-[#3C2E27]/50 text-center">
            <MessageSquareQuote className="w-8 h-8 text-[#D7CCC8] dark:text-[#5D4037] mb-1 opacity-70" />
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">Chưa có bài đăng nào trên Bản tin.</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Hãy vào trang Hồ sơ của bạn để đăng bài viết đầu tiên!</p>
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
                className="flex gap-3 p-3 bg-[#FDF6EC]/30 dark:bg-[#2C221D]/30 hover:bg-[#FDF6EC]/50 dark:hover:bg-[#2C221D]/60 rounded-2xl border border-[#F5E6D3]/60 dark:border-[#3C2E27] transition-colors relative overflow-visible pr-8"
              >
                {currentSticker && (
                  <img 
                    src={currentSticker} 
                    alt="Decor sticker" 
                    className={cn(
                      "absolute w-14 h-14 object-contain pointer-events-none hover:scale-125 transition-transform animate-bounce [animation-duration:4s] z-10",
                      currentStickerPos === 'top-left' && "left-3 -top-2",
                      currentStickerPos === 'bottom-left' && "left-3 -bottom-1",
                      currentStickerPos === 'top-right' && "right-3 -top-2",
                      (currentStickerPos === 'bottom-right' || !currentStickerPos) && "right-3 -bottom-1"
                    )} 
                    style={{ imageRendering: 'pixelated' }}
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
                        <span className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-[7px] font-black rounded uppercase shadow-xs border border-yellow-200 dark:border-yellow-700/50 inline-block">
                          🏆 {currentActiveTitle}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
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

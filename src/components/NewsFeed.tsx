import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Newspaper, Trash2, User, ExternalLink, MessageSquareQuote } from 'lucide-react';
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
  const { isLoggedIn, uid, email, getTitleColor } = useStore();
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
    <div className="flex flex-col bg-white rounded-3xl border border-[#D7CCC8]/80 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#D7CCC8]/30">
        <h2 className="font-bold text-sm border-l-4 border-[#8D6E63] pl-2.5 text-[#3E2723] uppercase tracking-wider flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[#8D6E63]" />
          Bản tin Choco
        </h2>
        {isLoggedIn && (
          <button 
            type="button"
            onClick={() => navigate('/tai-khoan')}
            className="text-[10px] sm:text-xs font-bold text-[#8D6E63] hover:text-[#5D4037] flex items-center gap-1 transition-all"
          >
            Đăng bài ngay <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 px-2 pt-3 pb-2 -mx-2">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-[#FDF6EC]/40 rounded-2xl border border-dashed border-[#D7CCC8]/50 text-center">
            <MessageSquareQuote className="w-8 h-8 text-[#D7CCC8] mb-1 opacity-70" />
            <p className="text-xs text-gray-400 italic">Chưa có bài đăng nào trên Bản tin.</p>
            <p className="text-[10px] text-gray-400 mt-1">Hãy vào trang Hồ sơ của bạn để đăng bài viết đầu tiên!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isAuthor = post.uid === uid;
            const canDelete = isAuthor || isAdmin;
            
            return (
              <div 
                key={post.id} 
                className="flex gap-3 p-3 bg-[#FDF6EC]/30 hover:bg-[#FDF6EC]/50 rounded-2xl border border-[#F5E6D3]/60 transition-colors relative overflow-visible pr-8"
              >
                {(post.equippedStickerPost || post.equippedSticker) && (
                  <img 
                    src={post.equippedStickerPost || post.equippedSticker} 
                    alt="Decor sticker" 
                    className={cn(
                      "absolute w-8 h-8 object-contain pointer-events-none hover:scale-125 transition-transform animate-bounce [animation-duration:4s] z-10",
                      (post.stickerPositionPost || post.stickerPosition) === 'top-left' && "left-3 -top-2",
                      (post.stickerPositionPost || post.stickerPosition) === 'bottom-left' && "left-3 -bottom-1",
                      (post.stickerPositionPost || post.stickerPosition) === 'top-right' && "right-3 -top-2",
                      ((post.stickerPositionPost || post.stickerPosition) === 'bottom-right' || !(post.stickerPositionPost || post.stickerPosition)) && "right-3 -bottom-1"
                    )} 
                  />
                )}
                <UserAvatar 
                  avatarUrl={post.avatarUrl} 
                  equippedSticker={post.equippedStickerAvatar || post.equippedSticker} 
                  stickerPosition={post.stickerPositionAvatar || post.stickerPosition} 
                  className="w-8 h-8" 
                  fallbackIconSizeClass="w-4 h-4" 
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs" style={{ color: getTitleColor(post.activeTitle) || '#5D4037' }}>
                        {post.displayName}
                      </span>
                      {post.activeTitle && (
                        <span className="px-1 py-0.5 bg-yellow-100 text-yellow-850 text-[7px] font-black rounded uppercase shadow-xs border border-yellow-250 inline-block">
                          🏆 {post.activeTitle}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] text-gray-400 font-mono">
                        {post.createdAt?.toDate 
                          ? new Date(post.createdAt.toDate()).toLocaleDateString('vi-VN', { 
                              month: 'numeric', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) 
                          : 'Vừa xong'}
                      </span>
                      {canDelete && (
                        <button 
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all"
                          title="Xóa bài viết"
                        >
                          <Trash2 className="w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#3E2723] break-words mt-1 leading-relaxed whitespace-pre-wrap text-justify pr-1 font-medium">
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

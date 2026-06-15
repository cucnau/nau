import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Bookmark, History, BookOpen, Star, Sparkles, ChevronRight, AlertCircle, Library as LibraryIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export function Library() {
  const navigate = useNavigate();
  const { savedStories, readHistoryList, isLoggedIn } = useStore();
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'stories'));
        const allStories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter saved stories
        const saved = allStories.filter(s => (savedStories || []).includes(s.id));
        setSavedDocs(saved);

        // Filter and map read history (ordering matches history array)
        const historyMap = new Map(allStories.map(s => [s.id, s]));
        const history = (readHistoryList || [])
          .map(id => historyMap.get(id))
          .filter(Boolean);
        setHistoryDocs(history);
      } catch (err) {
        console.error('Error fetching library stories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [savedStories, readHistoryList]);

  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto my-10">
        <div className="w-16 h-16 rounded-full bg-[#FFFDF9] flex items-center justify-center text-[#8D6E63] mb-6 border-2 border-[#3E2723] shadow-[1px_1px_0_0_#3E2723]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-[#3E2723] uppercase tracking-wider mb-2">Thư Viện Cá Nhân</h1>
        <p className="text-[#5D4037] text-xs font-bold mb-6 leading-relaxed">
          Vui lòng đăng nhập bằng tài khoản Google để lưu trữ tựa truyện yêu thích và đồng bộ lịch sử đọc của bạn!
        </p>
      </div>
    );
  }

  const currentList = activeTab === 'saved' ? savedDocs : historyDocs;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-[#FFFDF9] dark:bg-[#211B18] rounded-2xl p-6 border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[1.5px_1.5px_0_0_#3E2723] dark:shadow-[1.5px_1.5px_0_0_#0D0907] flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
           <h1 className="text-2xl font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-widest flex items-center gap-2">
             <LibraryIcon className="w-7 h-7 text-[#8D6E63]" />
             Thư Viện Của Tôi
           </h1>
           <p className="text-xs text-[#8D6E63] font-bold mt-1 uppercase tracking-widest">Nơi lưu kho báu bách khoa thư của bạn</p>
         </div>
         
         {/* Navigation Tabs */}
         <div className="flex bg-[#E6D4BF] dark:bg-[#1C1613] p-1 rounded-xl border-2 border-[#3E2723] dark:border-[#4E342E]">
           <button
             onClick={() => setActiveTab('saved')}
             className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${
               activeTab === 'saved'
                 ? 'bg-[#3E2723] dark:bg-[#C29D70] text-[#FFFDF9] dark:text-[#181311] shadow-inner'
                 : 'text-[#5D4037] dark:text-[#D7CCC8]/80 hover:bg-[#F5EADE]/85 dark:hover:bg-[#2C221D]'
             }`}
           >
             <Bookmark className="w-3.5 h-3.5" />
             Tủ Truyện ({savedDocs.length})
           </button>
           <button
             onClick={() => setActiveTab('history')}
             className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${
               activeTab === 'history'
                 ? 'bg-[#3E2723] dark:bg-[#C29D70] text-[#FFFDF9] dark:text-[#181311] shadow-inner'
                 : 'text-[#5D4037] dark:text-[#D7CCC8]/80 hover:bg-[#F5EADE]/85 dark:hover:bg-[#2C221D]'
             }`}
           >
             <History className="w-3.5 h-3.5" />
             Hành Trình Đọc ({historyDocs.length})
           </button>
         </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-16 text-center text-[#8D6E63] font-black uppercase tracking-widest font-sans">
          Đang kết nối tủ truyện của bạn...
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-[#FFFDF9] dark:bg-[#211B18] border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[1px_1px_0_0_#3E2723] dark:shadow-[1px_1px_0_0_#0D0907] rounded-3xl p-10 sm:p-16 text-center shadow-sm flex flex-col items-center justify-center max-w-lg mx-auto w-full self-center">
          <div className="w-16 h-16 rounded-full bg-[#FDF6EC] dark:bg-[#2C221D] flex items-center justify-center text-[#8D6E63] dark:text-[#C29D70] mb-4 border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[1px_1px_0_0_#3E2723]">
            {activeTab === 'saved' ? <Bookmark className="w-6 h-6" /> : <History className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-black uppercase text-[#3E2723] dark:text-[#ECE5DC] mb-2 tracking-wider">
            {activeTab === 'saved' ? 'Tủ sách chưa có truyện' : 'Chưa có hành trình đọc'}
          </h3>
          <p className="text-[#8D6E63] text-xs font-bold leading-relaxed mb-6">
            {activeTab === 'saved'
              ? 'Hãy bấm "Lưu truyện" ở trang chi tiết của mỗi cốt truyện để lưu trữ chúng vào đây!'
              : 'Hãy chọn và đọc một chương truyện bất kỳ để ghi lại lịch sử mạo hiểm của bạn.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#8D6E63] dark:bg-[#C29D70] text-[#FFFDF9] dark:text-[#181311] hover:bg-[#5D4037] dark:hover:bg-[#C8A982] px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-[#3E2723] dark:border-[#4E342E] shadow-[0_2px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none transition-all"
          >
            Khám phá truyện mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.map((story) => (
            <div 
              key={story.id} 
              onClick={() => navigate(`/truyen/${story.id}`)}
              className="bg-[#FFFDF9] dark:bg-[#211B18] border-2 border-[#3E2723] dark:border-[#4E342E] p-4 rounded-2xl flex gap-4 cursor-pointer shadow-[1.5px_1.5px_0_0_#3E2723] dark:shadow-[1.5px_1.5px_0_0_#0D0907] transition-all hover:-translate-y-0.5 hover:shadow-[1px_1px_0_0_#3E2723] dark:hover:shadow-[1px_1px_0_0_#1A1412]"
            >
              <img 
                src={story.coverUrl} 
                alt={story.title} 
                className="w-20 h-28 object-cover rounded-xl border-2 border-[#3E2723] dark:border-[#4E342E] shadow-sm shrink-0" 
              />
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-black text-[#3E2723] dark:text-[#ECE5DC] text-base leading-snug line-clamp-1 truncate uppercase tracking-wider">
                    {story.title}
                    {story.completed && <span className="inline-block text-[9px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-300 uppercase tracking-widest font-black ml-1.5 align-middle">Full</span>}
                  </h3>
                  <p className="text-xs text-[#8D6E63] dark:text-gray-400 italic font-bold mb-1">Tác giả: {story.author}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-1">
                    {story.genres?.slice(0, 2)?.map((g: string) => (
                      <span key={g} className="bg-[#FDF6EC] dark:bg-amber-950/40 text-[#8D6E63] dark:text-[#C29D70] border-[2px] border-[#3E2723]/30 dark:border-amber-900/30 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 border-t-[2px] border-[#3E2723]/20 dark:border-[#5D4037] pt-2 mt-2">
                  <span className="font-black text-[#8D6E63] dark:text-[#C29D70]">{story.chapterCount} Chương</span>
                  <span className="flex items-center gap-1 font-bold text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wider">
                    CHI TIẾT <ChevronRight className="w-3.5 h-3.5 text-[#3E2723] dark:text-[#C29D70]" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

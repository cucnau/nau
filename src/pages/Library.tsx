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
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 mb-4 border border-amber-200">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-[#3E2723] uppercase tracking-tight mb-2">Thư Viện Cá Nhân</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">Vui lòng đăng nhập bằng tài khoản Google để lưu trữ tựa truyện yêu thích và đồng bộ lịch sử đọc của bạn!</p>
      </div>
    );
  }

  const currentList = activeTab === 'saved' ? savedDocs : historyDocs;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-[#F5E6D3] rounded-3xl p-6 border border-[#D7CCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#3E2723] uppercase tracking-tighter flex items-center gap-2">
            <LibraryIcon className="w-6 h-6 text-[#8D6E63]" />
            Thư Viện Của Tôi
          </h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-[#E6D4BF] p-1 rounded-xl border border-[#D7CCC8]">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
              activeTab === 'saved'
                ? 'bg-[#3E2723] text-white shadow-md'
                : 'text-[#5D4037] hover:bg-[#F5EADE]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Tủ Truyện ({savedDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-[#3E2723] text-white shadow-md'
                : 'text-[#5D4037] hover:bg-[#F5EADE]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Hành Trình Đọc ({historyDocs.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-16 text-center text-gray-500 font-medium font-sans">
          Đang kết nối tủ truyện của bạn...
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white border border-[#D7CCC8] rounded-3xl p-10 sm:p-16 text-center shadow-sm flex flex-col items-center justify-center max-w-lg mx-auto w-full self-center">
          <div className="w-16 h-16 rounded-full bg-[#FDF6EC] flex items-center justify-center text-amber-800 mb-4 border border-[#F5E6D3]">
            {activeTab === 'saved' ? <Bookmark className="w-6 h-6" /> : <History className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-bold text-[#3E2723] mb-2">
            {activeTab === 'saved' ? 'Tủ sách chưa có truyện' : 'Chưa có hành trình đọc'}
          </h3>
          <p className="text-gray-500 text-xs leading-relaxed mb-6">
            {activeTab === 'saved'
              ? 'Hãy bấm "Lưu truyện" ở trang chi tiết của mỗi cốt truyện để lưu trữ chúng vào đây!'
              : 'Hãy chọn và đọc một chương truyện bất kỳ để ghi lại lịch sử mạo hiểm của bạn.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#3E2723] text-[#FDF6EC] hover:bg-[#2D1B19] px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow border border-[#8D6E63]"
          >
            Khám phá truyện mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((story) => (
            <div 
              key={story.id} 
              onClick={() => navigate(`/truyen/${story.id}`)}
              className="bg-white hover:bg-[#FDF6EC] border border-[#D7CCC8]/60 hover:border-[#D7CCC8] p-4 rounded-2xl flex gap-4 cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md"
            >
              <img 
                src={story.coverUrl} 
                alt={story.title} 
                className="w-16 h-24 object-cover rounded-xl shadow-sm border border-[#D7CCC8]" 
              />
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-extrabold text-[#3E2723] text-sm sm:text-base leading-snug line-clamp-1 truncate uppercase tracking-tight">
                    {story.title}
                  </h3>
                  <p className="text-xs text-gray-500 italic font-medium mb-1">Tác giả: {story.author}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-1">
                    {story.genres?.slice(0, 2)?.map((g: string) => (
                      <span key={g} className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-[#F5E6D3] pt-2 mt-2">
                  <span className="font-bold text-[#8D6E63]">{story.chapterCount} Chương</span>
                  <span className="flex items-center gap-1">
                    Chi tiết <ChevronRight className="w-3 h-3 text-slate-400" />
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, List, ChevronRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export function StoryList() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [allGenres, setAllGenres] = useState<string[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const fetchedStories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStories(fetchedStories);

        // Extract unique genres
        const genres = new Set<string>();
        fetchedStories.forEach(s => {
          if (Array.isArray(s.genres)) {
            s.genres.forEach((g: string) => genres.add(g));
          }
        });
        setAllGenres(Array.from(genres).sort());
      } catch (err) {
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          story.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || 
                         (Array.isArray(story.genres) && story.genres.includes(selectedGenre));
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-[#F5E6D3] rounded-3xl p-6 border border-[#D7CCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#3E2723] uppercase tracking-tighter flex items-center gap-2">
            <List className="w-6 h-6 text-[#8D6E63]" />
            Danh Sách Truyện
          </h1>
        </div>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6E63]" />
              <input 
                 type="text" 
                 placeholder="Tìm truyện, tác giả..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 pr-4 py-2 rounded-xl text-sm border border-[#D7CCC8] bg-white focus:outline-none focus:border-[#8D6E63] w-full sm:w-48 transition-colors"
              />
           </div>
           <select 
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm border border-[#D7CCC8] bg-white focus:outline-none focus:border-[#8D6E63] text-[#3E2723] cursor-pointer"
           >
              <option value="all">Tất cả thể loại</option>
              {allGenres.map(g => (
                 <option key={g} value={g}>{g}</option>
              ))}
           </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-16 text-center text-[#8D6E63] font-medium font-sans">
          Đang tải danh sách truyện...
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="bg-white border border-[#D7CCC8] rounded-3xl p-10 sm:p-16 text-center shadow-sm flex flex-col items-center justify-center max-w-lg mx-auto w-full self-center">
          <div className="w-16 h-16 rounded-full bg-[#FDF6EC] flex items-center justify-center text-[#8D6E63] mb-4 border border-[#F5E6D3]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#3E2723] mb-2">
            Không tìm thấy truyện nào
          </h3>
          <p className="text-gray-500 text-xs leading-relaxed mb-6">
            Thử thay đổi từ khóa hoặc bộ lọc thể loại xem sao!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStories.map((story) => (
             <div key={story.id} className="group flex gap-3.5 p-3 sm:p-4 bg-white rounded-2xl border border-[#D7CCC8]/60 hover:bg-[#FDF6EC] cursor-pointer hover:border-[#D7CCC8] transition-all hover:translate-y-[-2px] shadow-sm" onClick={() => navigate(`/truyen/${story.id}`)}>
                <img src={story.coverUrl} alt={story.title} className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-xl shadow-xs border border-gray-100 shrink-0 group-hover:scale-105 group-hover:border-[#8D6E63]/60 transition-all duration-300" />
                <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                   <div>
                      <p className="font-extrabold text-sm sm:text-base text-[#3E2723] hover:text-[#8D6E63] transition-colors leading-tight line-clamp-2">
                         {story.title}
                         {story.completed && <span className="inline-block text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded uppercase tracking-widest font-bold ml-1.5 align-middle">Full</span>}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 italic truncate mt-1 font-medium">Tác giả: {story.author || 'Ẩn danh'}</p>
                   </div>
                   
                   <div>
                      <div className="flex gap-1 items-center flex-wrap mb-2">
                         {story.genres && story.genres.slice(0, 2).map((g: string, i: number) => (
                            <span key={i} className="text-[8px] sm:text-[9px] font-bold bg-[#F5E6D3] text-[#8D6E63] px-1.5 py-0.5 rounded-md uppercase tracking-tight truncate max-w-[80px]">{g}</span>
                         ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-100 pt-1.5">
                         <span className="font-bold text-[#8D6E63]">{story.chapterCount || 0} Chương</span>
                         <span className="flex items-center gap-0.5 text-gray-400 group-hover:text-[#8D6E63] transition-colors">
                            Chi tiết <ChevronRight className="w-3 h-3" />
                         </span>
                      </div>
                   </div>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

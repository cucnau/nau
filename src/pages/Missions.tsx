import { useStore } from '../store';
import { Target, CheckCircle, Gift } from 'lucide-react';
import { cn } from '../components/Layout';

export function Missions() {
  const { missions, claimMission, isLoggedIn, checkInStreak } = useStore();

  const renderMissionGroup = (title: string, type: string) => {
     const items = missions.filter(m => m.type === type);
     return (
       <div className="bg-white border border-[#D7CCC8] rounded-3xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-[#3E2723] mb-6 border-l-4 border-[#8D6E63] pl-3 flex items-center gap-2 uppercase tracking-tighter">
              <Target className="w-5 h-5 text-[#8D6E63]" /> {title}
          </h2>
          <div className="flex flex-col gap-4">
             {items.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[#F5E6D3] bg-[#FDF6EC] rounded-xl hover:border-[#D7CCC8] transition-colors">
                   <div className="flex-1">
                      <h3 className="font-bold flex items-center gap-2 text-[#3E2723]">
                         {m.description}
                         {m.completed && !m.claimed && <span className="bg-[#8D6E63] text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Hoàn thành</span>}
                         {m.claimed && <span className="text-gray-400 text-[10px] px-2 py-0.5 rounded-full flex items-center uppercase tracking-widest font-bold"><CheckCircle className="w-3 h-3 mr-1"/> Đã nhận</span>}
                      </h3>
                      <div className="flex gap-2 mt-2">
                         {m.chocoReward > 0 && <span className="text-xs font-bold text-[#3E2723] dark:text-[#ECE5DC] bg-white dark:bg-[#1E1815] border border-[#D7CCC8] dark:border-[#3C2E27] px-3 py-0.5 rounded-full shadow-sm">+{m.chocoReward} Choco</span>}
                         {m.goldenReward > 0 && <span className="text-xs font-bold text-[#D4AF37] dark:text-[#E8CD78] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-0.5 rounded-full shadow-sm">+{m.goldenReward} Gchoco</span>}
                      </div>
                      
                      <div className="mt-4 bg-white border border-[#D7CCC8] rounded-full h-2.5 w-full max-w-sm overflow-hidden">
                         <div 
                           className="bg-[#8D6E63] h-full transition-all duration-500 ease-out" 
                           style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                         />
                      </div>
                      <p className="text-[10px] text-[#A1887F] font-bold uppercase tracking-widest mt-1.5">{m.progress} / {m.target}</p>
                   </div>
                   
                   <button 
                      disabled={!m.completed || m.claimed}
                      onClick={() => claimMission(m.id)}
                      className={cn(
                          "px-6 py-2.5 rounded-full font-bold flex items-center justify-center gap-2 transition-colors uppercase text-sm tracking-widest",
                          (!m.completed || m.claimed) ? "bg-gray-200 text-gray-400" : "bg-[#3E2723] text-[#FDF6EC] hover:bg-[#2D1B19] border border-[#8D6E63] shadow-md"
                      )}
                   >
                      <Gift className="w-4 h-4" />
                      {m.claimed ? "Đã Nhận" : "Nhận"}
                   </button>
                </div>
             ))}
          </div>
       </div>
     );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full flex flex-col gap-6">
       
       <div className="bg-[#3E2723] text-[#FDF6EC] p-6 lg:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border-4 border-[#8D6E63]">
           <div>
               <h1 className="text-2xl font-bold mb-2 uppercase tracking-tighter">Nhiệm Vụ & Điểm Danh</h1>
               <p className="opacity-80 italic">Hoàn thành nhiệm vụ để nhận điểm Choco và mua vật phẩm.</p>
           </div>
           {isLoggedIn ? (
               <div className="bg-[#2D1B19] text-[#FDF6EC] border border-[#5D4037] px-8 py-4 rounded-2xl flex flex-col items-center shadow-inner">
                   <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1 text-[#8D6E63]">Chuỗi điểm danh</span>
                   <span className="text-3xl font-black text-[#D4AF37]">{checkInStreak} <span className="text-sm font-bold text-[#FDF6EC]">Ngày</span></span>
               </div>
           ) : (
               <div className="bg-white/10 px-6 py-4 rounded-2xl italic">Vui lòng đăng nhập</div>
           )}
       </div>

       {renderMissionGroup('Nhiệm vụ Hằng ngày', 'daily')}
       {renderMissionGroup('Nhiệm vụ Tuần', 'weekly')}
       {renderMissionGroup('Nhiệm vụ Vĩnh viễn', 'permanent')}
    </div>
  )
}

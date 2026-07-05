import React from 'react';
import { useStore } from '../store';
import { useFeatureRestriction } from '../types/features';
import { Lock, X } from 'lucide-react';

export function FeatureLockModal() {
  const { lockedFeatureId, setLockedFeatureId, theme, level } = useStore();
  const { FEATURES_LIST, getRequiredLevel } = useFeatureRestriction();
  const isDark = theme === 'dark';

  if (!lockedFeatureId) return null;

  const feature = FEATURES_LIST.find((f) => f.id === lockedFeatureId);
  if (!feature) return null;

  const requiredLevel = getRequiredLevel(lockedFeatureId);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setLockedFeatureId(null)}
      />
      
      {/* Modal Card */}
      <div 
        className={`relative max-w-md w-full p-6 sm:p-8 rounded-[32px] border-4 shadow-[6px_6px_0_0_#3E2723] dark:shadow-[6px_6px_0_0_#0D0907] flex flex-col items-center text-center animate-in scale-in duration-300 ${
          isDark ? 'bg-[#251A15] border-[#4E342E]' : 'bg-[#FFFDF9] border-[#3E2723]'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setLockedFeatureId(null)}
          className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-[3px] shadow-[0_3px_0_0_#3E2723] dark:shadow-[0_3px_0_0_#0D0907] rounded-xl active:translate-y-0.5 active:shadow-none transition-all ${
            isDark 
              ? 'bg-[#1E1815] hover:bg-[#2C221D] border-[#4E342E] text-[#ECE5DC]' 
              : 'bg-[#FDF6EC] hover:bg-[#E6D8C9] border-[#3E2723] text-[#3E2723]'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Locked Icon Illustration */}
        <div className={`w-20 h-20 rounded-[24px] border-4 flex items-center justify-center mb-6 shadow-[3px_3px_0_0_#3E2723] dark:shadow-[3px_3px_0_0_#0D0907] ${
          isDark ? 'bg-[#3E2D25] border-[#4E342E] text-[#C29D70]' : 'bg-[#F5E6D3] border-[#3E2723] text-[#8D6E63]'
        }`}>
          <Lock className="w-10 h-10 animate-bounce" />
        </div>

        {/* Feature Title & Message */}
        <h3 className="text-xl font-black uppercase tracking-tight text-[#3E2723] dark:text-[#ECE5DC] mb-2">
          Tính năng chưa mở khóa!
        </h3>
        <p className="text-sm font-semibold text-[#8D6E63] dark:text-[#A1887F] mb-6 leading-relaxed">
          Tính năng <span className="text-[#3E2723] dark:text-[#ECE5DC] font-black">{feature.name}</span> chỉ mở khóa khi bạn đạt được cấp độ quy định.
        </p>

        {/* Level Stats Badge */}
        <div className={`w-full p-4 rounded-2xl border-2 mb-6 flex justify-around items-center ${
          isDark ? 'bg-[#1E1410] border-[#3E2D25]' : 'bg-[#FDFBF7] border-[#F1E5D8]'
        }`}>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#8D6E63] dark:text-[#A1887F] uppercase tracking-wider">Cấp độ của bạn</span>
            <span className="text-2xl font-black text-[#E65100] dark:text-[#FFB74D] mt-1">{level}</span>
          </div>
          <div className={`h-8 w-[2px] ${isDark ? 'bg-[#3E2D25]' : 'bg-[#F1E5D8]'}`} />
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#8D6E63] dark:text-[#A1887F] uppercase tracking-wider">Yêu cầu tối thiểu</span>
            <span className="text-2xl font-black text-[#D84315] dark:text-[#FF8A65] mt-1">{requiredLevel}</span>
          </div>
        </div>

        {/* Encouraging text */}
        <p className="text-xs italic text-[#8D6E63]/80 dark:text-[#A1887F]/80 mb-6 px-4">
          "Hãy tích cực hoàn thành nhiệm vụ hằng ngày, đọc truyện, và chăm sóc Chucu để tăng cấp thật nhanh nhé!"
        </p>

        {/* Okay Button */}
        <button
          onClick={() => setLockedFeatureId(null)}
          className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-wider text-sm border-[3px] border-[#3E2723] shadow-[4px_4px_0_0_#3E2723] dark:shadow-[4px_4px_0_0_#0D0907] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all ${
            isDark 
              ? 'bg-[#C29D70] hover:bg-[#B38F62] text-[#181311]' 
              : 'bg-[#E6D4BF] hover:bg-[#D4C0A8] text-[#3E2723]'
          }`}
        >
          Đồng ý
        </button>
      </div>
    </div>
  );
}

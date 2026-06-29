import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useFeatureRestriction } from '../types/features';

export function ChucuGame() {
  const navigate = useNavigate();
  const setChucuGameOpen = useStore(state => state.setChucuGameOpen);
  const setLockedFeatureId = useStore(state => state.setLockedFeatureId);
  const { isFeatureLocked } = useFeatureRestriction();

  useEffect(() => {
    if (isFeatureLocked('chucu_catch')) {
      setLockedFeatureId('chucu_catch');
    } else {
      setChucuGameOpen(true);
    }
    navigate('/', { replace: true });
  }, [navigate, setChucuGameOpen, isFeatureLocked, setLockedFeatureId]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] text-[#3E2723]">
      <p className="text-sm font-bold animate-pulse">Đang mở trò chơi...</p>
    </div>
  );
}

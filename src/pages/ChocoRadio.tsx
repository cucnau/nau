import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useFeatureRestriction } from '../types/features';

export function ChocoRadio() {
  const navigate = useNavigate();
  const setChocoRadioOpen = useStore(state => state.setChocoRadioOpen);
  const setLockedFeatureId = useStore(state => state.setLockedFeatureId);
  const { isFeatureLocked } = useFeatureRestriction();

  useEffect(() => {
    if (isFeatureLocked('choco_radio')) {
      setLockedFeatureId('choco_radio');
    } else {
      setChocoRadioOpen(true);
    }
    navigate('/', { replace: true });
  }, [navigate, setChocoRadioOpen, isFeatureLocked, setLockedFeatureId]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] text-[#3E2723]">
      <p className="text-sm font-bold animate-pulse">Đang mở Choco Radio...</p>
    </div>
  );
}

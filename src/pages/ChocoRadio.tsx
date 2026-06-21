import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export function ChocoRadio() {
  const navigate = useNavigate();
  const setChocoRadioOpen = useStore(state => state.setChocoRadioOpen);

  useEffect(() => {
    setChocoRadioOpen(true);
    navigate('/', { replace: true });
  }, [navigate, setChocoRadioOpen]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] text-[#3E2723]">
      <p className="text-sm font-bold animate-pulse">Đang mở Choco Radio...</p>
    </div>
  );
}

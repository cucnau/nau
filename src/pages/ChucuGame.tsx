import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export function ChucuGame() {
  const navigate = useNavigate();
  const setChucuGameOpen = useStore(state => state.setChucuGameOpen);

  useEffect(() => {
    setChucuGameOpen(true);
    navigate('/', { replace: true });
  }, [navigate, setChucuGameOpen]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] text-[#3E2723]">
      <p className="text-sm font-bold animate-pulse">Đang mở trò chơi...</p>
    </div>
  );
}

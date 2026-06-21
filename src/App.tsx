import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from './components/Layout';
import { Home } from './pages/Home';
import { StoryView } from './pages/StoryView';
import { Reader } from './pages/Reader';
import { AuthProvider } from './components/AuthProvider';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Library } from './pages/Library';
import { StoryList } from './pages/StoryList';
import { ChucuGame } from './pages/ChucuGame';
import { ChocoRadio } from './pages/ChocoRadio';
import { useStore } from './store';
import { Wrench } from 'lucide-react';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './lib/firebase';
import { ChocoMascot } from './components/ChocoMascot';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function MaintenanceGuard({ children }: { children: import('react').ReactNode }) {
  const { isMaintenance, email, isLoggedIn } = useStore();
  
  const isAdmin = email?.toLowerCase() === 'cucnau01@gmail.com';

  const handleAdminLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        if (popupError?.code === 'auth/popup-blocked' || popupError?.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Login failed', error);
      alert('Đăng nhập thất bại: ' + (error?.message || String(error)));
    }
  };

  if (isMaintenance && !isAdmin) {
    return (
      <div className="fixed inset-0 bg-[#FDF6EC] dark:bg-[#1A1412] flex flex-col items-center justify-center p-6 z-[9999] font-sans">
        {/* Render Chucu mascot directly in the maintenance screen but non-interactive / static or floating */}
        <div className="relative w-40 h-40 mb-8 pointer-events-none">
          <ChocoMascot />
        </div>
        
        <div className="bg-white dark:bg-[#2C221D] p-8 rounded-3xl border-4 border-[#3E2723] dark:border-[#5D4037] shadow-[8px_8px_0px_#3E2723] dark:shadow-[8px_8px_0px_#5D4037] max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
          <Wrench className="w-16 h-16 text-[#8D6E63] dark:text-[#A1887F] mx-auto mb-6 animate-bounce" />
          <h1 className="text-3xl font-black text-[#3E2723] dark:text-[#EFEBE9] mb-4 uppercase tracking-tighter">
            Bảo Trì Hệ Thống
          </h1>
          <p className="text-[#5D4037] dark:text-[#D7CCC8] font-medium leading-relaxed mb-8">
            Trang web hiện đang được cập nhật để đem lại trải nghiệm tốt hơn! Vui lòng quay lại sau nhé. Chucu xin lỗi vì sự bất tiện này ❤️
          </p>
          
          {!isLoggedIn && (
            <button 
              onClick={handleAdminLogin}
              className="text-xs text-[#8D6E63]/50 hover:text-[#8D6E63] font-bold underline underline-offset-2 decoration-dotted transition-colors"
            >
              Admin Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <MaintenanceGuard>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="truyen/:id" element={<StoryView />} />
              <Route path="doc/:storyId/:chapterId" element={<Reader />} />
              <Route path="tai-khoan" element={<Account />} />
              <Route path="admin" element={<Admin />} />
              
              <Route path="danh-sach" element={<StoryList />} />
              <Route path="thu-vien" element={<Library />} />
              <Route path="tro-choi" element={<ChucuGame />} />
              <Route path="choco-radio" element={<ChocoRadio />} />
            </Route>
          </Routes>
        </MaintenanceGuard>
      </AuthProvider>
    </BrowserRouter>
  );
}

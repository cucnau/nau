import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { Home } from './pages/Home';
import { StoryView } from './pages/StoryView';
import { Reader } from './pages/Reader';
import { AuthProvider } from './components/AuthProvider';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Library } from './pages/Library';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-10 flex-col">
      <h1 className="text-3xl font-bold text-[#4A3018] mb-4">{title}</h1>
      <p className="text-gray-500">Trang này đang được phát triển.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="truyen/:id" element={<StoryView />} />
            <Route path="doc/:storyId/:chapterId" element={<Reader />} />
            <Route path="tai-khoan" element={<Account />} />
            <Route path="admin" element={<Admin />} />
            
            <Route path="danh-sach" element={<Placeholder title="Danh Sách Truyện" />} />
            <Route path="thu-vien" element={<Library />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

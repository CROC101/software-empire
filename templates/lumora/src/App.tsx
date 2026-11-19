import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Redeem from './pages/Redeem';
import GiftCards from './pages/GiftCards';
import Profiles from './pages/Profiles';
import Browse from './pages/Browse';
import Search from './pages/Search';
import Watch from './pages/Watch';
import Account from './pages/Account';
import { Navbar } from './components/Navbar';
import { HoverPortal } from './components/HoverCard';
import { DetailModal } from './components/DetailModal';
import { useHover } from './lib/hooks';
import { useStore } from './store';

/** Signed-in area: needs an account and a chosen profile. */
function RequireProfile({ children }: { children: ReactNode }) {
  const signedIn = useStore((s) => s.signedIn);
  const activeId = useStore((s) => s.activeId);
  if (!signedIn) return <Navigate to="/th/login" replace />;
  if (!activeId) return <Navigate to="/profiles" replace />;
  return <>{children}</>;
}

const FOOTER = ['คำบรรยายเสียง', 'ศูนย์ช่วยเหลือ', 'บัตรของขวัญ', 'ศูนย์สื่อ', 'นักลงทุนสัมพันธ์', 'ร่วมงานกับเรา', 'ข้อกำหนดการใช้งาน', 'ความเป็นส่วนตัว', 'ประกาศทางกฎหมาย', 'การตั้งค่าคุกกี้', 'ข้อมูลองค์กร', 'ติดต่อเรา'];

function AppShell() {
  return (
    <RequireProfile>
      <div className="min-h-screen bg-app text-white">
        <Navbar />
        <Outlet />
        <footer className="mx-auto max-w-[980px] px-[4%] pb-8 pt-10 text-[13px] text-[#808080]">
          <ul className="grid grid-cols-2 gap-y-3 sm:grid-cols-4">
            {FOOTER.map((f) => (
              <li key={f}>
                <a href={f === 'บัตรของขวัญ' ? import.meta.env.BASE_URL + 'gift-cards' : '#'} className="hover:underline">
                  {f}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[11px]">ตัวอย่างนี้ใช้ข้อมูลจำลองทั้งหมด</p>
        </footer>
        <HoverPortal />
        <DetailModal />
      </div>
    </RequireProfile>
  );
}

function ScrollReset() {
  const { pathname } = useLocation();
  const hide = useHover((s) => s.hide);
  useEffect(() => {
    window.scrollTo(0, 0);
    hide();
  }, [pathname, hide]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollReset />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/th" element={<Landing />} />
        <Route path="/th/login" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/youraccount" element={<Account />} />
        <Route path="/redeem" element={<Redeem />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route
          path="/watch/:id"
          element={
            <RequireProfile>
              <Watch />
            </RequireProfile>
          }
        />
        <Route element={<AppShell />}>
          <Route path="/browse" element={<Browse kind="all" />} />
          <Route path="/browse/tv" element={<Browse kind="tv" />} />
          <Route path="/browse/movies" element={<Browse kind="movies" />} />
          <Route path="/latest" element={<Browse kind="latest" />} />
          <Route path="/browse/my-list" element={<Browse kind="mylist" />} />
          <Route path="/search" element={<Search />} />
        </Route>
        <Route path="*" element={<Navigate to="/th/" replace />} />
      </Routes>
    </>
  );
}

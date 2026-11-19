import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Direct } from './app/Direct';
import { Explore } from './app/Explore';
import { Home } from './app/Home';
import { Profile } from './app/Profile';
import { Reels } from './app/Reels';
import { Settings } from './app/Settings';
import { Shell } from './app/Shell';
import { Stories } from './app/Stories';
import { Privacy, Terms } from './public/Legal';
import { Login } from './public/Login';
import { PasswordReset } from './public/PasswordReset';
import { Signup } from './public/Signup';
import { useStore } from './store';

function Private({ children }: { children: ReactNode }) {
  return useStore((s) => s.loggedIn) ? <>{children}</> : <Navigate to="/" replace />;
}

export function App() {
  const loggedIn = useStore((s) => s.loggedIn);
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/" element={loggedIn ? <Shell><Home /></Shell> : <Login />} />
        <Route path="/accounts/password/reset" element={<PasswordReset />} />
        <Route path="/accounts/emailsignup" element={<Signup />} />
        <Route path="/legal/privacy" element={<Privacy />} />
        <Route path="/legal/terms" element={<Terms />} />
        <Route path="/stories/:username" element={<Private><Stories /></Private>} />
        <Route element={<Private><Shell /></Private>}>
          <Route path="/explore" element={<Explore />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/direct/inbox" element={<Direct />} />
          <Route path="/direct/t/:threadId" element={<Direct />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/accounts/edit" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

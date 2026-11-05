import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import { getProfile, getStatus, type Profile, type Status } from "./api";
import { useSession } from "./session";

type Data = {
  status: Status | null;
  profile: Profile | null;
  /** true once the signed-in reader's profile and coins have loaded (or failed) */
  loaded: boolean;
  setStatus: (s: Status) => void;
  setProfile: (p: Profile) => void;
};

const DataContext = createContext<Data>({
  status: null,
  profile: null,
  loaded: false,
  setStatus: () => {},
  setProfile: () => {},
});

/** The signed-in reader's coins and profile, loaded once per sign-in and shared by every page. */
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [status, setStatus] = useState<Status | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([getStatus(), getProfile()])
      .then(([s, p]) => {
        if (!active) return;
        setStatus(s);
        setProfileState(p);
      })
      .catch((error: unknown) => {
        console.error("โหลดข้อมูลไพ่ไม่สำเร็จ", error);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const setProfile = useCallback((p: Profile) => {
    setProfileState(p);
  }, []);

  return (
    <DataContext
      value={{
        status: user ? status : null,
        profile: user ? profile : null,
        loaded: Boolean(user) && loaded,
        setStatus,
        setProfile,
      }}
    >
      {children}
    </DataContext>
  );
}

export const useTarotData = () => use(DataContext);

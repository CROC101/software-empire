'use client';

import { useEffect, type ReactNode } from 'react';
import { useStore } from '@/store/useStore';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).then(() => useStore.getState().setHydrated());
  }, []);
  return <>{children}</>;
}

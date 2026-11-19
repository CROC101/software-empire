// Short-lived screen state (which drawer/modal is open). Not persisted on purpose.
import { create } from 'zustand';

type Drawer = 'search' | 'notifications' | null;

interface UI {
  drawer: Drawer;
  createOpen: boolean;
  postModal: string | null;
  shareModal: string | null;
  toast: string | null;
  setDrawer: (d: Drawer) => void;
  setCreate: (v: boolean) => void;
  openPost: (id: string | null) => void;
  openShare: (id: string | null) => void;
  showToast: (t: string | null) => void;
}

export const useUI = create<UI>((set) => ({
  drawer: null,
  createOpen: false,
  postModal: null,
  shareModal: null,
  toast: null,
  setDrawer: (drawer) => set({ drawer }),
  setCreate: (createOpen) => set({ createOpen, drawer: null }),
  openPost: (postModal) => set({ postModal }),
  openShare: (shareModal) => set({ shareModal }),
  showToast: (toast) => set({ toast }),
}));

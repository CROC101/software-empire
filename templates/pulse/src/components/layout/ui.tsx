'use client';

import { createContext, useContext } from 'react';

export interface UI {
  openCart: () => void;
  openCoins: () => void;
  openNotices: () => void;
  toast: (text: string) => void;
}

export const UICtx = createContext<UI>({ openCart: () => {}, openCoins: () => {}, openNotices: () => {}, toast: () => {} });
export const useUI = () => useContext(UICtx);

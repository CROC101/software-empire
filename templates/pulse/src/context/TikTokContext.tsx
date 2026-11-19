'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as seed from '@/data/seed-tiktok';
import type {
  Address, CartItem, Comment, Order, PaymentMethod, Product, ShippingMethod, Thread, Video, VariantGroup,
} from '@/types/tiktok';
import { SHIPPING_FEE, orderScan, voucherDiscount } from '@/lib/format';

interface State {
  videos: Video[];
  products: Product[];
  comments: Comment[];
  liked: string[];
  saved: string[];
  following: string[];
  cart: CartItem[];
  claimed: string[];
  selectedVouchers: string[];
  orders: Order[];
  threads: Thread[];
  coins: number;
  theme: 'light' | 'dark';
  collapsed: boolean;
  onboarded: boolean;
}

const KEY = 'pulse-state-v1';

const initial: State = {
  videos: seed.videos,
  products: seed.products,
  comments: seed.comments,
  liked: [],
  saved: [],
  following: ['mech_keyboards_th', 'synth_studio', 'nina.codes', 'tor_dev'],
  cart: [
    { id: 'ci1', productId: 'p2', variantKey: 'Black', qty: 1, selected: true },
    { id: 'ci2', productId: 'p4', variantKey: 'Black|M', qty: 1, selected: true },
  ],
  claimed: [],
  selectedVouchers: [],
  orders: seed.orders,
  threads: seed.threads,
  coins: 1250,
  theme: 'light',
  collapsed: false,
  onboarded: false,
};

export interface PlaceOrderInput {
  address: Address;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  /** buy-now line; when absent the selected cart items are ordered */
  buyNow?: { productId: string; variantKey: string; qty: number };
}

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();

function useStore() {
  const [s, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  const loaded = useRef(false);
  // ref holds the latest state so actions can compute results synchronously (order id, product id...)
  const ref = useRef<State>(initial);
  const setS = useCallback((f: State | ((p: State) => State)) => {
    const next = typeof f === 'function' ? f(ref.current) : f;
    ref.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...initial, ...(JSON.parse(raw) as Partial<State>), collapsed: false }); // sidebar collapse lasts one visit only
      else document.documentElement.dataset.theme = initial.theme;
    } catch {
      /* corrupted storage: start from seed */
    }
    loaded.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(KEY, JSON.stringify(s));
    document.documentElement.dataset.theme = s.theme;
  }, [s]);

  const up = useCallback((f: (s: State) => Partial<State>) => setS((prev) => ({ ...prev, ...f(prev) })), [setS]);
  const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const actions = useMemo(() => ({
    toggleLike: (id: string) => up((p) => ({ liked: toggleIn(p.liked, id) })),
    toggleSave: (id: string) => up((p) => ({ saved: toggleIn(p.saved, id) })),
    toggleFollow: (h: string) => up((p) => ({ following: toggleIn(p.following, h) })),
    addComment: (videoId: string, text: string) =>
      up((p) => ({ comments: [{ id: 'c' + uid(), videoId, handle: seed.ME, text, likes: 0, at: now() }, ...p.comments] })),
    setTheme: (theme: 'light' | 'dark') => up(() => ({ theme })),
    toggleCollapsed: () => up((p) => ({ collapsed: !p.collapsed })),
    finishOnboarding: () => up(() => ({ onboarded: true })),

    addToCart: (productId: string, variantKey: string, qty = 1) =>
      up((p) => {
        const hit = p.cart.find((c) => c.productId === productId && c.variantKey === variantKey);
        if (hit) return { cart: p.cart.map((c) => (c === hit ? { ...c, qty: c.qty + qty, selected: true } : c)) };
        return { cart: [...p.cart, { id: 'ci' + uid(), productId, variantKey, qty, selected: true }] };
      }),
    setQty: (id: string, qty: number) => up((p) => ({ cart: p.cart.map((c) => (c.id === id ? { ...c, qty: Math.max(1, qty) } : c)) })),
    toggleCartItem: (id: string) => up((p) => ({ cart: p.cart.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)) })),
    selectShop: (handle: string, on: boolean, products: Product[]) =>
      up((p) => ({ cart: p.cart.map((c) => (products.find((x) => x.id === c.productId)?.shopHandle === handle ? { ...c, selected: on } : c)) })),
    removeCartItem: (id: string) => up((p) => ({ cart: p.cart.filter((c) => c.id !== id) })),
    claimVoucher: (id: string) => up((p) => ({ claimed: p.claimed.includes(id) ? p.claimed : [...p.claimed, id], selectedVouchers: p.selectedVouchers.includes(id) ? p.selectedVouchers : [...p.selectedVouchers, id] })),
    toggleVoucher: (id: string) => up((p) => ({ selectedVouchers: toggleIn(p.selectedVouchers, id) })),

    rechargeCoins: (n: number) => up((p) => ({ coins: p.coins + n })),
    spendCoins: (n: number): boolean => {
      let ok = false;
      setS((p) => {
        if (p.coins < n) return p;
        ok = true;
        return { ...p, coins: p.coins - n };
      });
      return ok;
    },

    sendMessage: (threadId: string, text: string) =>
      up((p) => ({ threads: p.threads.map((t) => (t.id === threadId ? { ...t, unread: 0, messages: [...t.messages, { id: 'm' + uid(), from: 'me' as const, text, at: now() }] } : t)) })),
    receiveMessage: (threadId: string, text: string) =>
      up((p) => ({ threads: p.threads.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, { id: 'm' + uid(), from: 'them' as const, text, at: now() }] } : t)) })),
    readThread: (threadId: string) => up((p) => ({ threads: p.threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)) })),
    openThread: (handle: string): string => {
      const id = 't-' + handle;
      up((p) => (p.threads.some((t) => t.handle === handle) ? {} : { threads: [{ id, handle, kind: seed.creators.find((c) => c.handle === handle)?.isShop ? 'shop' : 'friend', unread: 0, messages: [] }, ...p.threads] }));
      return id;
    },

    /** Returns the new order id, or an error message. */
    placeOrder: (input: PlaceOrderInput): { id?: string; error?: string } => {
      let result: { id?: string; error?: string } = {};
      setS((p) => {
        const lines = input.buyNow
          ? [{ ...input.buyNow, id: 'buy' }]
          : p.cart.filter((c) => c.selected).map((c) => ({ productId: c.productId, variantKey: c.variantKey, qty: c.qty, id: c.id }));
        if (lines.length === 0) { result = { error: 'Your cart has no selected items.' }; return p; }
        for (const l of lines) {
          const pr = p.products.find((x) => x.id === l.productId);
          if (!pr || (pr.stock[l.variantKey] ?? 0) < l.qty) { result = { error: `Not enough stock for ${pr?.name ?? 'an item'}.` }; return p; }
        }
        const id = seed.ORDER_POOL.find((x) => !p.orders.some((o) => o.id === x));
        if (!id) { result = { error: 'Demo order limit reached (60 orders). Clear site data to reset.' }; return p; }
        const products = p.products.map((pr) => {
          const mine = lines.filter((l) => l.productId === pr.id);
          if (!mine.length) return pr;
          const stock = { ...pr.stock };
          mine.forEach((l) => { stock[l.variantKey] -= l.qty; });
          return { ...pr, stock, sold: pr.sold + mine.reduce((a, l) => a + l.qty, 0) };
        });
        const items = lines.map((l) => {
          const pr = p.products.find((x) => x.id === l.productId)!;
          return { productId: pr.id, name: pr.name, variantKey: l.variantKey, qty: l.qty, price: pr.price, hue: pr.hue, icon: pr.icon, shopHandle: pr.shopHandle };
        });
        const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
        const shippingFee = SHIPPING_FEE[input.shipping];
        const vs = seed.vouchers.filter((v) => p.selectedVouchers.includes(v.id) && p.claimed.includes(v.id));
        const discount = voucherDiscount(vs, subtotal, shippingFee);
        const tracking = 'TH2026TT' + String(Math.floor(100000 + Math.random() * 900000));
        const order: Order = {
          id, tracking, carrier: input.shipping === 'sameday' ? 'Kerry Express' : 'Flash Express', items, address: input.address,
          shipping: input.shipping, payment: input.payment, subtotal, shippingFee, discount, total: subtotal + shippingFee - discount,
          vouchers: vs.map((v) => v.id), createdAt: now(), events: [{ scan: 0, ...seed.SCANS[0], at: now() }], received: false, cancelled: false, reviewed: false,
        };
        result = { id };
        const usedIds = new Set(lines.map((l) => l.id));
        return {
          ...p, products, orders: [order, ...p.orders],
          cart: input.buyNow ? p.cart : p.cart.filter((c) => !usedIds.has(c.id)),
          claimed: p.claimed.filter((v) => !order.vouchers.includes(v)),
          selectedVouchers: p.selectedVouchers.filter((v) => !order.vouchers.includes(v)),
        };
      });
      return result;
    },
    /** Moves an order to the next logistics scan (or to a given scan for seller actions). */
    advanceOrder: (id: string, toScan?: number) =>
      up((p) => ({
        orders: p.orders.map((o) => {
          if (o.id !== id || o.cancelled) return o;
          const cur = orderScan(o);
          const target = Math.min(toScan ?? cur + 1, seed.SCANS.length - 1);
          if (target <= cur) return o;
          const added = [];
          for (let s = cur + 1; s <= target; s++) added.push({ scan: s, ...seed.SCANS[s], at: new Date(Date.now() + (s - target) * 60000).toISOString() });
          return { ...o, events: [...o.events, ...added] };
        }),
      })),
    confirmReceipt: (id: string) =>
      up((p) => ({
        orders: p.orders.map((o) => {
          if (o.id !== id) return o;
          const cur = orderScan(o);
          const events = cur < 7 ? [...o.events, { scan: 7, ...seed.SCANS[7], at: now() }] : o.events;
          return { ...o, events, received: true };
        }),
      })),
    cancelOrder: (id: string) =>
      up((p) => {
        const o = p.orders.find((x) => x.id === id);
        if (!o || orderScan(o) >= 2) return {};
        const products = p.products.map((pr) => {
          const back = o.items.filter((i) => i.productId === pr.id);
          if (!back.length) return pr;
          const stock = { ...pr.stock };
          back.forEach((i) => { stock[i.variantKey] = (stock[i.variantKey] ?? 0) + i.qty; });
          return { ...pr, stock };
        });
        return { products, orders: p.orders.map((x) => (x.id === id ? { ...x, cancelled: true } : x)) };
      }),
    markReviewed: (id: string) => up((p) => ({ orders: p.orders.map((o) => (o.id === id ? { ...o, reviewed: true } : o)) })),

    /** Returns the new product id, or undefined when the demo pool is full. */
    addProduct: (input: { name: string; price: number; stock: number; category: Product['category']; groups: VariantGroup[]; description: string }): string | undefined => {
      let id: string | undefined;
      setS((p) => {
        id = seed.PRODUCT_POOL.find((x) => !p.products.some((pr) => pr.id === x));
        if (!id) return p;
        const keys = input.groups.reduce<string[]>((acc, g) => acc.flatMap((a) => g.options.map((o) => (a ? a + '|' + o : o))), ['']);
        const hues: [string, string][] = [['#fe2c55', '#3f0613'], ['#25f4ee', '#063a39'], ['#ff6b00', '#3b1500'], ['#ffb800', '#3d2c00']];
        const product: Product = {
          id, name: input.name, shopHandle: seed.ME, category: input.category, price: input.price, originalPrice: Math.round(input.price * 1.25),
          rating: 5, sold: 0, freeShipping: true, flashSale: false, hue: hues[p.products.length % hues.length], icon: 'box',
          description: input.description || 'New arrival from the Croc Byte shop.', variantGroups: input.groups,
          stock: Object.fromEntries(keys.map((k) => [k, input.stock])), reviews: [],
        };
        return { ...p, products: [product, ...p.products] };
      });
      return id;
    },
    setStock: (productId: string, variantKey: string, n: number) =>
      up((p) => ({ products: p.products.map((pr) => (pr.id === productId ? { ...pr, stock: { ...pr.stock, [variantKey]: Math.max(0, n) } } : pr)) })),

    /** Returns the new video id, or undefined when the demo pool is full. */
    publishVideo: (input: { caption: string; src: string; productIds: string[]; hue: [string, string]; category: string }): string | undefined => {
      let id: string | undefined;
      setS((p) => {
        id = seed.UPLOAD_POOL.find((x) => !p.videos.some((vd) => vd.id === x));
        if (!id) return p;
        const tagList = Array.from(input.caption.matchAll(/#([\p{L}\d_]+)/gu)).map((m) => m[1].toLowerCase());
        const video: Video = {
          id, handle: seed.ME, caption: input.caption.replace(/#[\p{L}\d_]+/gu, '').trim(), tags: tagList, musicId: 'original-crocbyte', src: input.src, hue: input.hue,
          category: input.category, likes: 0, comments: 0, saves: 0, shares: 0, views: 0, productIds: input.productIds.slice(0, 3), createdAt: now(),
        };
        return { ...p, videos: [video, ...p.videos] };
      });
      return id;
    },
    resetDemo: () => { localStorage.removeItem(KEY); setS(initial); },
  }), [up, setS]);

  return { ...s, hydrated, ...actions };
}

type Store = ReturnType<typeof useStore>;
const Ctx = createContext<Store | null>(null);

export function TikTokProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useTikTok(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTikTok must be used inside TikTokProvider');
  return v;
}

/** Lookups that need the live (possibly user-extended) data. */
export function useLookup() {
  const { products, videos } = useTikTok();
  return useMemo(() => ({
    product: (id: string) => products.find((p) => p.id === id),
    video: (id: string) => videos.find((v) => v.id === id),
    creator: (h: string) => seed.creators.find((c) => c.handle === h) ?? { handle: h, name: h, bio: '', verified: false, isShop: false, hue: ['#9ca3af', '#374151'] as [string, string], followers: 0, following: 0, likes: 0 },
    music: (id: string) => seed.music.find((m) => m.id === id),
  }), [products, videos]);
}

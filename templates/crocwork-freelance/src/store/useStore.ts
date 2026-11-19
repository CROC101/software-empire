'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { seedReviews, seedServices } from '@/data/services';
import type {
  ChatAttachment,
  ChatMessage,
  Conversation,
  Order,
  OrderStatus,
  PackageTier,
  Review,
  Service,
} from '@/lib/types';

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

const autoReplies = [
  'ขอบคุณที่ทักมานะครับ ได้รับข้อความแล้ว เดี๋ยวขอดูรายละเอียดสักครู่ครับ',
  'รับทราบครับ งานแบบนี้ทำได้แน่นอน ถ้าสะดวกส่งตัวอย่างหรือ reference มาเพิ่มได้เลยครับ',
  'ได้เลยครับ ถ้าต้องการราคาที่ตรงกับงาน กด "ขอใบเสนอราคา" ได้เลยครับ',
];

interface NewOrder {
  serviceId: string;
  tier: PackageTier;
  title: string;
  price: number;
  deliveryDays: number;
}

interface QuoteRequest {
  details: string;
  budget: number;
  deliveryDays: number;
}

interface State {
  hydrated: boolean;
  favorites: string[];
  recentSearches: string[];
  orders: Order[];
  conversations: Conversation[];
  userGigs: Service[];
  addedReviews: Review[];
  setHydrated: () => void;
  toggleFavorite: (serviceId: string) => void;
  addRecent: (q: string) => void;
  clearRecent: () => void;
  createOrder: (o: NewOrder) => string;
  payOrder: (orderId: string, method: 'promptpay' | 'card') => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  ensureConversation: (serviceId: string, sellerId: string) => string;
  sendMessage: (convId: string, text: string, attachments?: ChatAttachment[]) => void;
  requestQuote: (convId: string, req: QuoteRequest) => void;
  acceptQuote: (convId: string, messageId: string) => string | undefined;
  markRead: (convId: string) => void;
  publishGig: (gig: Service) => void;
  addReview: (orderId: string, rating: number, text: string) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const pushMessage = (convId: string, msg: ChatMessage, unread = 0) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, messages: [...c.messages, msg], unread: c.unread + unread } : c,
          ),
        }));

      return {
        hydrated: false,
        favorites: [],
        recentSearches: [],
        orders: [],
        conversations: [],
        userGigs: [],
        addedReviews: [],
        setHydrated: () => set({ hydrated: true }),

        toggleFavorite: (id) =>
          set((s) => ({
            favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites],
          })),

        addRecent: (q) => {
          const t = q.trim();
          if (!t) return;
          set((s) => ({ recentSearches: [t, ...s.recentSearches.filter((x) => x !== t)].slice(0, 6) }));
        },
        clearRecent: () => set({ recentSearches: [] }),

        createOrder: (o) => {
          const id = uid('o');
          set((s) => ({ orders: [{ ...o, id, status: 'awaiting_payment', createdAt: now() }, ...s.orders] }));
          return id;
        },
        payOrder: (orderId, method) =>
          set((s) => ({
            orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'in_progress', paidWith: method } : o)),
          })),
        updateOrderStatus: (orderId, status) =>
          set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) })),

        ensureConversation: (serviceId, sellerId) => {
          const existing = get().conversations.find((c) => c.serviceId === serviceId);
          if (existing) return existing.id;
          const id = uid('c');
          const welcome: ChatMessage = {
            id: uid('m'),
            from: 'seller',
            text: 'สวัสดีครับ ยินดีให้บริการครับ สนใจงานแบบไหน เล่ารายละเอียดได้เลยครับ',
            at: now(),
          };
          set((s) => ({ conversations: [{ id, sellerId, serviceId, messages: [welcome], unread: 0 }, ...s.conversations] }));
          return id;
        },

        sendMessage: (convId, text, attachments) => {
          pushMessage(convId, { id: uid('m'), from: 'me', text, at: now(), attachments });
          const count = get().conversations.find((c) => c.id === convId)?.messages.filter((m) => m.from === 'me').length ?? 1;
          setTimeout(() => {
            pushMessage(
              convId,
              { id: uid('m'), from: 'seller', text: autoReplies[(count - 1) % autoReplies.length] ?? '', at: now() },
              1,
            );
          }, 1200);
        },

        requestQuote: (convId, req) => {
          pushMessage(convId, {
            id: uid('m'),
            from: 'me',
            text: `ขอใบเสนอราคา: ${req.details}\nงบประมาณ ฿${req.budget.toLocaleString('th-TH')} · ภายใน ${req.deliveryDays} วัน`,
            at: now(),
          });
          setTimeout(() => {
            pushMessage(
              convId,
              {
                id: uid('m'),
                from: 'seller',
                text: 'จัดทำใบเสนอราคาให้แล้วครับ ตรวจสอบรายละเอียดได้เลยครับ',
                at: now(),
                quote: {
                  title: req.details.slice(0, 60) || 'งานตามที่ตกลง',
                  price: Math.max(100, Math.round(req.budget / 10) * 10),
                  deliveryDays: req.deliveryDays,
                  details: req.details,
                  status: 'pending',
                },
              },
              1,
            );
          }, 1500);
        },

        acceptQuote: (convId, messageId) => {
          const conv = get().conversations.find((c) => c.id === convId);
          const quote = conv?.messages.find((m) => m.id === messageId)?.quote;
          if (!conv || !quote) return undefined;
          if (quote.orderId) return quote.orderId;
          const orderId = get().createOrder({
            serviceId: conv.serviceId,
            tier: 'basic',
            title: quote.title,
            price: quote.price,
            deliveryDays: quote.deliveryDays,
          });
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id !== convId
                ? c
                : {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === messageId && m.quote ? { ...m, quote: { ...m.quote, status: 'accepted', orderId } } : m,
                    ),
                  },
            ),
          }));
          pushMessage(convId, { id: uid('m'), from: 'system', text: 'ยอมรับใบเสนอราคาแล้ว กรุณาชำระเงินเพื่อเริ่มงาน', at: now() });
          return orderId;
        },

        markRead: (convId) =>
          set((s) => ({ conversations: s.conversations.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)) })),

        publishGig: (gig) => set((s) => ({ userGigs: [gig, ...s.userGigs] })),

        addReview: (orderId, rating, text) => {
          const order = get().orders.find((o) => o.id === orderId);
          if (!order || order.reviewed) return;
          const review: Review = {
            id: uid('r'),
            serviceId: order.serviceId,
            author: 'คุณ (ผู้ว่าจ้าง)',
            rating,
            text,
            date: now().slice(0, 10),
          };
          set((s) => ({
            addedReviews: [review, ...s.addedReviews],
            orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'completed', reviewed: true } : o)),
          }));
        },
      };
    },
    {
      name: 'crocwork-store',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ favorites, recentSearches, orders, conversations, userGigs, addedReviews }) => ({
        favorites,
        recentSearches,
        orders,
        conversations,
        userGigs,
        addedReviews,
      }),
    },
  ),
);

/** Applies the person's own reviews on top of the seed rating and count. */
function withReviews(svc: Service, added: Review[]): Service {
  const mine = added.filter((r) => r.serviceId === svc.id);
  if (!mine.length) return svc;
  const total = svc.rating * svc.reviewCount + mine.reduce((a, r) => a + r.rating, 0);
  const count = svc.reviewCount + mine.length;
  return { ...svc, rating: Math.round((total / count) * 10) / 10, reviewCount: count };
}

export function useAllServices(): Service[] {
  const userGigs = useStore((s) => s.userGigs);
  const added = useStore((s) => s.addedReviews);
  return useMemo(() => [...userGigs, ...seedServices].map((x) => withReviews(x, added)), [userGigs, added]);
}

export function useService(id: string | null | undefined): Service | undefined {
  const all = useAllServices();
  return useMemo(() => all.find((x) => x.id === id), [all, id]);
}

export function useServiceReviews(id: string): Review[] {
  const added = useStore((s) => s.addedReviews);
  return useMemo(
    () => [...added.filter((r) => r.serviceId === id), ...seedReviews.filter((r) => r.serviceId === id)],
    [added, id],
  );
}

export function serviceHref(s: Pick<Service, 'id' | 'userCreated'>): string {
  return s.userCreated ? `/service/local/?id=${encodeURIComponent(s.id)}` : `/service/${s.id}/`;
}

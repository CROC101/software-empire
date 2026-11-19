export type CategorySlug =
  | 'graphic-design'
  | 'web-programming'
  | 'marketing'
  | 'writing-translation'
  | 'video-audio'
  | 'business-consulting'
  | 'lifestyle';

export interface Subcategory {
  slug: string;
  name: string;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  nameEn: string;
  icon: string;
  /** Hue used for generated covers and tiles. */
  hue: number;
  subcategories: Subcategory[];
}

export type SellerLevel = 'new' | 'verified' | 'top' | 'pro';

export interface Seller {
  id: string;
  name: string;
  hue: number;
  level: SellerLevel;
  responseMinutes: number;
  memberSince: string;
  location: string;
  bio: string;
  languages: string[];
}

export type BadgeKey = 'repeat' | 'business' | 'installment' | 'expert' | 'pro';

export type PackageTier = 'basic' | 'standard' | 'premium';

export interface ServicePackage {
  tier: PackageTier;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface Review {
  id: string;
  serviceId: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface Service {
  id: string;
  title: string;
  category: CategorySlug;
  subcategory: string;
  sellerId: string;
  /** Cover motif: index into the cover art set. */
  motif: number;
  rating: number;
  reviewCount: number;
  sold: number;
  badges: BadgeKey[];
  description: string;
  packages: ServicePackage[];
  faqs: Faq[];
  createdAt: string;
  /** True for gigs published from the seller dashboard. */
  userCreated?: boolean;
}

export type OrderStatus = 'awaiting_payment' | 'in_progress' | 'delivered' | 'completed';

export interface Order {
  id: string;
  serviceId: string;
  tier: PackageTier;
  title: string;
  price: number;
  deliveryDays: number;
  status: OrderStatus;
  createdAt: string;
  paidWith?: 'promptpay' | 'card';
  reviewed?: boolean;
}

export interface ChatAttachment {
  name: string;
  size: number;
}

export interface Quote {
  title: string;
  price: number;
  deliveryDays: number;
  details: string;
  status: 'pending' | 'accepted';
  orderId?: string;
}

export interface ChatMessage {
  id: string;
  from: 'me' | 'seller' | 'system';
  text: string;
  at: string;
  attachments?: ChatAttachment[];
  quote?: Quote;
}

export interface Conversation {
  id: string;
  sellerId: string;
  serviceId: string;
  messages: ChatMessage[];
  unread: number;
}

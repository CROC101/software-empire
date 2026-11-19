export type Hue = [string, string];

export interface Creator {
  handle: string; // without "@"
  name: string;
  bio: string;
  link?: string;
  verified: boolean;
  isShop: boolean;
  hue: Hue;
  followers: number;
  following: number;
  likes: number;
  rating?: number;
}

export interface Music {
  id: string;
  title: string;
  artist: string;
  hue: Hue;
}

export interface Video {
  id: string;
  handle: string;
  caption: string;
  tags: string[];
  musicId: string;
  src: string;
  hue: Hue;
  category: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  views: number;
  productIds: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  videoId: string;
  handle: string;
  text: string;
  likes: number;
  at: string;
}

export interface VariantGroup {
  name: string; // e.g. "Switch Type"
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  shopHandle: string;
  category: ProductCategory;
  price: number;
  originalPrice: number;
  rating: number;
  sold: number;
  freeShipping: boolean;
  flashSale: boolean;
  hue: Hue;
  icon: ProductIcon;
  description: string;
  variantGroups: VariantGroup[];
  /** stock per variant key ("Red|M"); key "" when there are no variants */
  stock: Record<string, number>;
  reviews: Review[];
}

export type ProductCategory = 'Electronics' | 'Keyboards & Gear' | 'Apparel' | 'Audio' | 'Accessories';
export type ProductIcon = 'keyboard' | 'lamp' | 'headphones' | 'shirt' | 'plug' | 'mouse' | 'watch' | 'speaker' | 'backpack' | 'camera' | 'cable' | 'mic' | 'box';

export interface Review {
  id: string;
  user: string;
  stars: number;
  text: string;
  variant: string;
  at: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantKey: string;
  qty: number;
  selected: boolean;
}

export interface Voucher {
  id: string;
  label: string;
  detail: string;
  kind: 'amount' | 'shipping' | 'percent';
  value: number;
  minSpend: number;
  cap?: number;
}

export type PaymentMethod = 'promptpay' | 'card' | 'cod' | 'wallet';
export type ShippingMethod = 'standard' | 'sameday';

export interface Address {
  name: string;
  phone: string;
  province: string;
  district: string;
  postal: string;
  street: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  variantKey: string;
  qty: number;
  price: number;
  hue: Hue;
  icon: ProductIcon;
  shopHandle: string;
}

export interface LogisticsEvent {
  scan: number; // 0..7
  stage: number; // 0..4
  title: string;
  location: string;
  at: string;
}

export interface Order {
  id: string;
  tracking: string;
  carrier: string;
  items: OrderItem[];
  address: Address;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  vouchers: string[];
  createdAt: string;
  events: LogisticsEvent[];
  received: boolean;
  cancelled: boolean;
  reviewed: boolean;
}

export type OrderTab = 'all' | 'to_pay' | 'to_ship' | 'to_receive' | 'completed' | 'cancelled';

export interface ChatMessage {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: string;
  card?: { kind: 'product'; productId: string } | { kind: 'order'; orderId: string };
}

export interface Thread {
  id: string;
  handle: string;
  kind: 'friend' | 'shop';
  messages: ChatMessage[];
  unread: number;
}

export interface Notice {
  id: string;
  text: string;
  at: string;
  href: string;
}

export interface Drama {
  id: string;
  title: string;
  views: string;
  episodes: number;
  genre: string;
  isNew: boolean;
  hue: Hue;
}

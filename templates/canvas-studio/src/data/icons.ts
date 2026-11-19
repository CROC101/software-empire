import {
  Anchor, Award, Bell, BookOpen, Bookmark, Briefcase, Brush, Building2, Calendar, Camera, Car, ChartColumn, ChartPie, CircleCheck, CircleX, Clock, Cloud, Code,
  Coffee, Compass, Cpu, CreditCard, Crown, Database, DollarSign, Droplet, Flag, Flame, Flower2, Gift, Globe, GraduationCap, Headphones, Heart, House, Image,
  Info, Key, Laptop, Leaf, Lightbulb, Lock, Mail, MapPin, MessageCircle, Mic, Moon, Mountain, Music, Palette, Pause, PenTool, Phone, Plane, Play, Rocket,
  Scissors, Send, Shield, ShoppingBag, ShoppingCart, Smartphone, Smile, Snowflake, Sparkles, Star, Sun, Target, Terminal, ThumbsUp, TrendingUp, TriangleAlert,
  Trophy, Umbrella, User, Users, Video, Wifi, Zap, type LucideIcon,
} from 'lucide-react';

const pack: Record<string, LucideIcon> = {
  Heart, Star, Zap, Camera, Music, Video, Phone, Mail, MapPin, Calendar, Clock, Cloud, Sun, Moon, Coffee, Gift, ShoppingCart, ShoppingBag, CreditCard,
  DollarSign, TrendingUp, ChartColumn, ChartPie, Rocket, Lightbulb, Target, Award, Trophy, Crown, Shield, Lock, Key, User, Users, Smile, ThumbsUp,
  MessageCircle, Send, Bell, Bookmark, Flag, Globe, Wifi, Code, Terminal, Cpu, Database, Laptop, Smartphone, Headphones, Mic, Image, Palette, PenTool,
  Brush, Scissors, Leaf, Flower2, Mountain, Plane, Car, House, Building2, Briefcase, GraduationCap, BookOpen, Sparkles, Flame, Droplet, Snowflake,
  Umbrella, Anchor, Compass, CircleCheck, CircleX, TriangleAlert, Info, Play, Pause,
};

export const ICON_PACK = Object.entries(pack).map(([name, Icon]) => ({ name, Icon }));

/** Serialise a rendered lucide <svg> into a coloured, standalone data-URI image. */
export function iconSvgFromNode(node: SVGSVGElement, color: string, size = 240): string {
  const clone = node.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(size));
  clone.setAttribute('height', String(size));
  clone.setAttribute('stroke', color);
  clone.removeAttribute('class');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clone.outerHTML)}`;
}

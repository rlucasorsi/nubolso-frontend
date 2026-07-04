import {
  Wallet,
  Droplet,
  Zap,
  Smartphone,
  Wifi,
  Building2,
  Landmark,
  Tag,
  Home,
  Car,
  ShoppingCart,
  ShoppingBag,
  Utensils,
  Coffee,
  Heart,
  Gift,
  Plane,
  GraduationCap,
  Briefcase,
  PiggyBank,
  CreditCard,
  Dumbbell,
  Shirt,
  Fuel,
  Bus,
  Baby,
  Dog,
  Music,
  Film,
  Gamepad2,
  Stethoscope,
  Pill,
  Scissors,
  Wrench,
  TreePine,
  Sparkles,
  TrendingUp,
  DollarSign,
  Receipt,
  Phone,
  type LucideIcon,
} from 'lucide-react';

// Conjunto curado de ícones (lucide) disponíveis para categorias. A string do nome
// é o que fica salvo em Category.icon.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Wallet,
  Droplet,
  Zap,
  Smartphone,
  Wifi,
  Building2,
  Landmark,
  Tag,
  Home,
  Car,
  ShoppingCart,
  ShoppingBag,
  Utensils,
  Coffee,
  Heart,
  Gift,
  Plane,
  GraduationCap,
  Briefcase,
  PiggyBank,
  CreditCard,
  Dumbbell,
  Shirt,
  Fuel,
  Bus,
  Baby,
  Dog,
  Music,
  Film,
  Gamepad2,
  Stethoscope,
  Pill,
  Scissors,
  Wrench,
  TreePine,
  Sparkles,
  TrendingUp,
  DollarSign,
  Receipt,
  Phone,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

// Cores sugeridas para o color picker.
export const CATEGORY_COLORS = [
  '#22c55e',
  '#38bdf8',
  '#f59e0b',
  '#a855f7',
  '#3b82f6',
  '#f97316',
  '#ef4444',
  '#14b8a6',
  '#ec4899',
  '#eab308',
  '#6366f1',
  '#10b981',
  '#f43f5e',
  '#0ea5e9',
  '#8b5cf6',
  '#94a3b8',
];

export const DEFAULT_CATEGORY_COLOR = '#94a3b8';

interface CategoryIconProps {
  name?: string | null;
  className?: string;
}

// Renderiza o ícone da categoria (fallback: Tag) a partir do nome salvo.
export function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = (name && CATEGORY_ICONS[name]) || Tag;
  return <Icon className={className} />;
}

import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

export const TYPE_CONFIG = {
  income: {
    label: 'Receita',
    color: 'text-emerald-500',
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
    icon: (size: 'sm' | 'md') =>
      size === 'md'
        ? <TrendingUp className="h-4 w-4 text-emerald-500" />
        : <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />,
    sign: '+',
  },
  expense: {
    label: 'Despesa',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    bar: 'bg-red-500',
    icon: (size: 'sm' | 'md') =>
      size === 'md'
        ? <TrendingDown className="h-4 w-4 text-red-500" />
        : <TrendingDown className="h-3.5 w-3.5 text-red-500" />,
    sign: '-',
  },
  spending: {
    label: 'Gasto',
    color: 'text-orange-400',
    bar: 'bg-orange-400',
    bg: 'bg-orange-400/10',
    icon: (size: 'sm' | 'md') =>
      size === 'md'
        ? <BarChart2 className="h-4 w-4 text-orange-400" />
        : <BarChart2 className="h-3.5 w-3.5 text-orange-400" />,
    sign: '-',
  },
} as const;

export const DAY_NAMES: Record<number, string> = {
  0: 'DOMINGO',
  1: 'SEGUNDA',
  2: 'TERÇA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SÁBADO',
};

export const MONTH_SHORT: Record<number, string> = {
  0: 'JAN', 1: 'FEV', 2: 'MAR', 3: 'ABR', 4: 'MAI', 5: 'JUN',
  6: 'JUL', 7: 'AGO', 8: 'SET', 9: 'OUT', 10: 'NOV', 11: 'DEZ',
};

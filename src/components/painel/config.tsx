import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

export const TYPE_CONFIG = {
  income: {
    label: 'Income',
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
    label: 'Expense',
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
    label: 'Spending',
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
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

export const WEEK_DAYS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const MONTH_SHORT: Record<number, string> = {
  0: 'JAN', 1: 'FEB', 2: 'MAR', 3: 'APR', 4: 'MAY', 5: 'JUN',
  6: 'JUL', 7: 'AUG', 8: 'SEP', 9: 'OCT', 10: 'NOV', 11: 'DEC',
};

import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

export const TYPE_CONFIG = {
  income: {
    color: 'text-emerald-500',
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
    icon: (size: 'sm' | 'md') =>
      size === 'md' ? (
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      ) : (
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
      ),
    sign: '+',
  },
  expense: {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    bar: 'bg-red-500',
    icon: (size: 'sm' | 'md') =>
      size === 'md' ? (
        <TrendingDown className="h-4 w-4 text-red-500" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
      ),
    sign: '-',
  },
  investment: {
    color: 'text-blue-500',
    bar: 'bg-blue-500',
    bg: 'bg-blue-500/10',
    icon: (size: 'sm' | 'md') =>
      size === 'md' ? (
        <PiggyBank className="h-4 w-4 text-blue-500" />
      ) : (
        <PiggyBank className="h-3.5 w-3.5 text-blue-500" />
      ),
    sign: '-',
  },
} as const;

export const MONTH_KEYS = [
  'monthJan',
  'monthFeb',
  'monthMar',
  'monthApr',
  'monthMay',
  'monthJun',
  'monthJul',
  'monthAug',
  'monthSep',
  'monthOct',
  'monthNov',
  'monthDec',
] as const;

export const WEEKDAY_KEYS = [
  'weekdaySun',
  'weekdayMon',
  'weekdayTue',
  'weekdayWed',
  'weekdayThu',
  'weekdayFri',
  'weekdaySat',
] as const;

'use client';

import type { Goal } from '@/modules/goals/model/api/goal';
import {
  Shield,
  Plane,
  Smartphone,
  Home,
  Car,
  GraduationCap,
  Wallet,
  Heart,
  Laptop,
  Calendar,
  Clock,
  PartyPopper,
  Timer,
  PiggyBank,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useTranslations } from 'next-intl';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  flight_takeoff: Plane,
  flight: Plane,
  smartphone: Smartphone,
  home: Home,
  directions_car: Car,
  school: GraduationCap,
  payments: Wallet,
  volunteer_activism: Heart,
  laptop_mac: Laptop,
  savings: PiggyBank,
};

function getGoalIcon(iconName: string) {
  return ICON_MAP[iconName] ?? Shield;
}

function formatCurrency(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCurrencyFull(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const COLOR_MAP = {
  primary: { iconBg: 'bg-primary/10', iconText: 'text-primary', badgeBg: 'bg-primary/10', badgeText: 'text-primary' },
  secondary: { iconBg: 'bg-accent/10', iconText: 'text-accent', badgeBg: 'bg-accent/10', badgeText: 'text-accent' },
  tertiary: { iconBg: 'bg-status-warning/10', iconText: 'text-status-warning', badgeBg: 'bg-status-warning/10', badgeText: 'text-status-warning' },
};

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  onAddFunds: () => void;
}

export function GoalCard({ goal, onClick, onAddFunds }: GoalCardProps) {
  const t = useTranslations('goals');
  const Icon = getGoalIcon(goal.icon);
  const colors = COLOR_MAP[goal.color] ?? COLOR_MAP.primary;
  const percent = Math.round((goal.savedAmount / goal.targetAmount) * 100);

  function getDeadlineInfo() {
    const now = new Date();
    const deadline = new Date(goal.deadline + 'T00:00:00');
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (percent >= 90) {
      return {
        icon: PartyPopper,
        text: diffDays > 0 ? t('almostThere', { days: diffDays }) : t('achieved'),
        highlight: true,
      };
    }

    if (diffDays < 0) {
      return { icon: Clock, text: t('deadlineExpired'), highlight: false };
    }

    if (diffDays <= 365) {
      const monthKey = String(deadline.getMonth()) as keyof typeof t;
      return {
        icon: Calendar,
        text: t('forecast', { month: t(`months.${deadline.getMonth()}`), year: deadline.getFullYear() }),
        highlight: false,
      };
    }

    return {
      icon: Timer,
      text: t('longTerm', { year: deadline.getFullYear() }),
      highlight: false,
    };
  }

  const deadlineInfo = getDeadlineInfo();
  const DeadlineIcon = deadlineInfo.icon;

  return (
    <div
      onClick={onClick}
      className="bg-surface-container border border-white/5 rounded-base shadow-lg hover:shadow-xl p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col h-full"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display group-hover:text-primary transition-colors line-clamp-1">
              {goal.name}
            </h3>
            <p className="text-xs font-medium text-muted-foreground line-clamp-1">
              {goal.description || t('financialGoal')}
            </p>
          </div>
        </div>
        <CircularProgress percent={percent} size={60} strokeWidth={8}>
          <span className="text-xs font-bold text-white">{percent}%</span>
        </CircularProgress>
      </div>

      <div className="space-y-6 mt-auto">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('saved')}</span>
              <span className="text-lg font-bold text-foreground">{formatCurrencyFull(goal.savedAmount)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">{t('target')}</span>
              <span className="text-sm font-bold text-primary/80">{formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>

          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-variant rounded-full transition-all duration-1000 ease-out shadow-[0_4px_15px_rgba(123,92,255,0.3)]"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>

        <Button
          onClick={(e) => { e.stopPropagation(); onAddFunds(); }}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary-variant text-white font-bold transition-all duration-300 rounded-base shadow-[0_4px_15px_rgba(123,92,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('addFunds')}
        </Button>
      </div>
    </div>
  );
}

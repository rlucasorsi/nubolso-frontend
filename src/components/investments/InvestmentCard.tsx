'use client';

import type { Investment } from '@/modules/investments/model/api/investment';
import {
  Landmark,
  Building2,
  TrendingUp,
  PieChart,
  Wallet,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/i18n/useTranslations';
import {
  formatCurrency,
  getTotalContributed,
  getTotalYield,
  getYieldPercentage,
  isVariableIncome,
} from './investment-helpers';
import { VariableInvestmentSummary } from './VariableInvestmentSummary';

const TYPE_ICON: Record<Investment['type'], React.ComponentType<{ className?: string }>> = {
  CDB: Landmark,
  FII: Building2,
  STOCK: TrendingUp,
  ETF: PieChart,
  OTHER: Wallet,
};

interface InvestmentCardProps {
  investment: Investment;
  onClick: () => void;
  onAddMovement: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function InvestmentCard({
  investment,
  onClick,
  onAddMovement,
  onEdit,
  onDelete,
}: InvestmentCardProps) {
  const t = useTranslations('investmentCard');
  const tt = useTranslations('investmentTypes');
  const Icon = TYPE_ICON[investment.type];
  const totalContributed = getTotalContributed(investment);
  const totalYield = getTotalYield(investment);
  const yieldPercentage = getYieldPercentage(investment);
  const isPositiveYield = totalYield >= 0;
  const hasTicker = isVariableIncome(investment.type);

  return (
    <div
      onClick={onClick}
      className="bg-surface-container border border-white/5 rounded-base shadow-lg hover:shadow-xl p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display group-hover:text-primary transition-colors line-clamp-1">
              {investment.name}
            </h3>
            <p className="text-xs font-medium text-muted-foreground line-clamp-1">
              {tt(investment.type)}
              {investment.institution ? ` · ${investment.institution}` : ''}
              {investment.ticker ? ` · ${investment.ticker}` : ''}
              {investment.cdiPercentage
                ? ` · ${t('cdiLabel', { percent: investment.cdiPercentage })}`
                : ''}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-all"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 bg-card border-white/10 rounded-xl shadow-xl"
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="gap-2 text-sm cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4 mt-auto">
        {hasTicker && investment.ticker ? (
          <VariableInvestmentSummary investment={investment} variant="card" />
        ) : (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('current')}
            </span>
            <p className="text-lg font-bold text-foreground -mt-0.5 mb-1">
              {formatCurrency(investment.currentBalance)}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('invested')}</span>
              <span className="font-bold text-right">{formatCurrency(totalContributed)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('yield')}</span>
              <span
                className={`font-bold text-right ${isPositiveYield ? 'text-success' : 'text-destructive'}`}
              >
                {isPositiveYield ? '+' : ''}
                {formatCurrency(totalYield)}
                {yieldPercentage !== null &&
                  ` (${isPositiveYield ? '+' : ''}${yieldPercentage.toFixed(2)}%)`}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onAddMovement();
          }}
          className="w-full h-12 bg-primary text-white font-bold transition-all duration-300 rounded-base hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('manage')}
        </Button>
      </div>
    </div>
  );
}

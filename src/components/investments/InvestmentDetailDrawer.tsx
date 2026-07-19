'use client';

import { useMemo, useState } from 'react';
import type { Investment, InvestmentMovement } from '@/modules/investments/model/api/investment';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Plus,
  ArrowUpRight,
  Coins,
  Scale,
  Trash2,
  Landmark,
  Building2,
  TrendingUp,
  PieChart,
  Wallet,
} from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import { getDateFnsLocale } from '@/i18n/dateFnsLocale';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRemoveInvestmentMovement } from '@/modules/investments/hooks/use-remove-investment-movement';
import { clearMovementSharePosition } from '@/lib/investmentShareLedger';
import { VariableInvestmentSummary } from './VariableInvestmentSummary';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import {
  formatCurrency,
  getTotalContributed,
  getTotalYield,
  getYieldPercentage,
  isVariableIncome,
} from './investment-helpers';

function formatDate(dateStr: string, dateFnsLocale: Locale) {
  const date = new Date(dateStr + 'T00:00:00');
  return format(date, 'dd MMM, yyyy', { locale: dateFnsLocale });
}

const TYPE_ICON: Record<Investment['type'], React.ComponentType<{ className?: string }>> = {
  CDB: Landmark,
  FII: Building2,
  STOCK: TrendingUp,
  ETF: PieChart,
  OTHER: Wallet,
};

const MOVEMENT_ICON: Record<InvestmentMovement['type'], React.ComponentType<{ className?: string }>> = {
  CONTRIBUTION: ArrowUpRight,
  YIELD: Coins,
  ADJUSTMENT: Scale,
};

const MOVEMENT_COLOR: Record<InvestmentMovement['type'], string> = {
  CONTRIBUTION: 'text-primary',
  YIELD: 'text-accent',
  ADJUSTMENT: 'text-status-warning',
};

interface InvestmentDetailDrawerProps {
  open: boolean;
  investment: Investment | null;
  onClose: () => void;
  onAddMovement: (investment: Investment) => void;
  onMovementRemoved: (investment: Investment) => void;
}

export function InvestmentDetailDrawer({
  open,
  investment,
  onClose,
  onAddMovement,
  onMovementRemoved,
}: InvestmentDetailDrawerProps) {
  const t = useTranslations('investmentDetail');
  const tt = useTranslations('investmentTypes');
  const { locale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale(locale);
  const removeMovementMutation = useRemoveInvestmentMovement();
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalContributed = useMemo(
    () => (investment ? getTotalContributed(investment) : 0),
    [investment],
  );
  const totalYield = useMemo(() => (investment ? getTotalYield(investment) : 0), [investment]);
  const yieldPercentage = useMemo(
    () => (investment ? getYieldPercentage(investment) : null),
    [investment],
  );

  if (!investment) return null;

  const Icon = TYPE_ICON[investment.type];
  const sortedMovements = [...investment.movements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const hasTicker = isVariableIncome(investment.type);

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  const handleDelete = async () => {
    if (!deletingMovementId) return;
    setError(null);
    try {
      const updated = await removeMovementMutation.mutateAsync({
        investmentId: investment.id,
        movementId: deletingMovementId,
      });
      clearMovementSharePosition(investment.id, deletingMovementId);
      onMovementRemoved(updated);
      setDeletingMovementId(null);
    } catch (err) {
      setError(extractErrorMessage(err, t('deleteError')));
      setDeletingMovementId(null);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerHeader onClose={onClose}>
            <SheetTitle className="text-xl font-bold font-display text-primary">
              {t('title')}
            </SheetTitle>
            <p className="text-base font-bold text-white">{investment.name}</p>
            <SheetDescription className="sr-only">
              {t('title')} {investment.name}
            </SheetDescription>
          </DrawerHeader>

          <div className="flex-1 px-6 pb-6 space-y-8 mt-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-4">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <span className="text-3xl font-bold font-display">
                {formatCurrency(investment.currentBalance)}
              </span>
              <p className="text-sm text-muted-foreground mt-1">
                {tt(investment.type)}
                {investment.institution ? ` · ${investment.institution}` : ''}
                {investment.ticker ? ` · ${investment.ticker}` : ''}
                {investment.cdiPercentage
                  ? ` · ${t('cdiLabel', { percent: investment.cdiPercentage })}`
                  : ''}
              </p>
            </div>

            {hasTicker ? (
              <VariableInvestmentSummary investment={investment} variant="detail" />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('totalInvested')}
                  </span>
                  <p className="text-sm font-bold">{formatCurrency(totalContributed)}</p>
                </div>
                <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('totalYield')}
                  </span>
                  <p
                    className={cn(
                      'text-sm font-bold',
                      totalYield >= 0 ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {totalYield >= 0 ? '+' : ''}
                    {formatCurrency(totalYield)}
                    {yieldPercentage !== null && (
                      <span className="ml-1 font-normal">
                        ({yieldPercentage >= 0 ? '+' : ''}
                        {yieldPercentage.toFixed(2)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-base font-bold font-display">{t('history')}</h3>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <div className="space-y-2">
                {sortedMovements.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">{t('noMovements')}</p>
                  </div>
                ) : (
                  sortedMovements.map((m) => {
                    const MIcon = MOVEMENT_ICON[m.type];
                    const isNegative = m.amount < 0;
                    return (
                      <div
                        key={m.id}
                        className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <MIcon className={cn('h-4 w-4', MOVEMENT_COLOR[m.type])} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{m.description}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatDate(m.date, dateFnsLocale)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p
                            className={cn(
                              'text-sm font-bold',
                              isNegative ? 'text-destructive' : MOVEMENT_COLOR[m.type],
                            )}
                          >
                            {isNegative ? '-' : '+'}
                            {formatCurrency(Math.abs(m.amount))}
                          </p>
                          <button
                            onClick={() => setDeletingMovementId(m.id)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                            title={t('delete')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button
              onClick={() => onAddMovement(investment)}
              className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {t('addMovement')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Sheet>

      <ConfirmDialog
        open={!!deletingMovementId}
        onOpenChange={(o) => !o && setDeletingMovementId(null)}
        variant="destructive"
        icon={<Trash2 className="w-8 h-8" />}
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        cancelLabel={t('cancel')}
        actionLabel={t('delete')}
        onAction={handleDelete}
        actionDisabled={removeMovementMutation.isPending}
      />
    </>
  );
}

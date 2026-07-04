'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CircleDollarSign,
  AlertTriangle,
  CopyCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ServerErrorState } from '@/components/ui/server-error-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/cashflow';
import { TYPE_CONFIG } from '@/components/painel/config';
import { useGetImportBatch } from '@/modules/imports/hooks/use-get-import-batch';
import { useConfirmImport } from '@/modules/imports/hooks/use-confirm-import';
import { useCancelImport } from '@/modules/imports/hooks/use-cancel-import';
import type { ImportBatchDetail, ImportItemDecision } from '@/modules/imports/model/api/ofx-import';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import { getDateFnsLocale } from '@/i18n/dateFnsLocale';

const TYPE_ICON: Record<string, React.ReactNode> = {
  INCOME: <ArrowUpRight className="h-4 w-4" />,
  EXPENSE: <ArrowDownLeft className="h-4 w-4" />,
  INVESTMENT: <CircleDollarSign className="h-4 w-4" />,
};

function typeConfigFor(type: string) {
  const key = type.toLowerCase() as keyof typeof TYPE_CONFIG;
  return TYPE_CONFIG[key] ?? TYPE_CONFIG.investment;
}

interface ImportReviewStepProps {
  batchId: string;
  onConfirmed: (batch: ImportBatchDetail) => void;
  onCanceled: () => void;
  onBack: () => void;
}

export function ImportReviewStep({
  batchId,
  onConfirmed,
  onCanceled,
  onBack,
}: ImportReviewStepProps) {
  const t = useTranslations('importReview');
  const typeT = useTranslations('entry');
  const { locale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale(locale);
  const { data: batch, isLoading, isError, refetch } = useGetImportBatch(batchId);
  const confirmImport = useConfirmImport();
  const cancelImport = useCancelImport();

  const [decisions, setDecisions] = useState<Record<string, ImportItemDecision>>({});

  useEffect(() => {
    if (!batch) return;
    setDecisions((prev) => {
      const next = { ...prev };
      for (const item of batch.items) {
        if (next[item.id] === undefined && item.status !== 'DUPLICATE_EXACT') {
          next[item.id] =
            item.decision ?? (item.status === 'POSSIBLE_DUPLICATE' ? 'SKIP' : 'IMPORT');
        }
      }
      return next;
    });
  }, [batch]);

  const reviewableItems = useMemo(
    () => (batch?.items ?? []).filter((i) => i.status !== 'DUPLICATE_EXACT'),
    [batch],
  );
  const importCount = useMemo(
    () => reviewableItems.filter((i) => decisions[i.id] === 'IMPORT').length,
    [reviewableItems, decisions],
  );

  function toggle(itemId: string, checked: boolean) {
    setDecisions((prev) => ({ ...prev, [itemId]: checked ? 'IMPORT' : 'SKIP' }));
  }

  async function handleConfirm() {
    if (!batch) return;
    try {
      const result = await confirmImport.mutateAsync({
        id: batch.id,
        data: {
          decisions: reviewableItems.map((item) => ({
            itemId: item.id,
            action: decisions[item.id] ?? 'SKIP',
          })),
        },
      });
      onConfirmed(result);
    } catch {
      // erro já sinalizado via estado da mutação (confirmImport.isError)
    }
  }

  async function handleCancel() {
    if (!batch) return;
    try {
      await cancelImport.mutateAsync(batch.id);
      onCanceled();
    } catch {
      // erro já sinalizado via estado da mutação (cancelImport.isError)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 px-6 py-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-full bg-card/50 animate-pulse rounded-2xl border border-white/5"
          />
        ))}
      </div>
    );
  }

  if (isError || !batch) {
    return <ServerErrorState onRetry={refetch} />;
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/10 text-muted-foreground gap-1.5">
            {t('transactions', { n: batch.totalCount })}
          </Badge>
          {batch.duplicateExactCount > 0 && (
            <Badge variant="outline" className="border-white/10 text-muted-foreground gap-1.5">
              <CopyCheck className="h-3 w-3" />
              {batch.duplicateExactCount} {t('alreadyImported')}
            </Badge>
          )}
          {batch.possibleDuplicateCount > 0 && (
            <Badge
              variant="outline"
              className="border-amber-400/30 text-amber-400 bg-amber-400/10 gap-1.5"
            >
              <AlertTriangle className="h-3 w-3" />
              {batch.possibleDuplicateCount} {t('possibleDuplicates')}
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{t('instructions')}</p>

        <div className="space-y-2">
          {batch.items.map((item) => {
            const cfg = typeConfigFor(item.type);
            const isExactDuplicate = item.status === 'DUPLICATE_EXACT';
            const checked = isExactDuplicate ? false : decisions[item.id] === 'IMPORT';

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3 transition-colors',
                  isExactDuplicate
                    ? 'border-white/5 bg-white/[0.02] opacity-50'
                    : 'border-white/5 bg-card/40',
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={isExactDuplicate}
                  onCheckedChange={(value) => toggle(item.id, value === true)}
                />

                <div className={cn('p-2 rounded-xl', cfg.bg)}>{TYPE_ICON[item.type]}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">
                      {item.description ||
                        typeT(item.type.toLowerCase() as 'income' | 'expense' | 'investment')}
                    </p>
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.date.split('T')[0] + 'T12:00:00'), 'dd MMM yy', {
                        locale: dateFnsLocale,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className={cn('text-sm font-bold', cfg.color)}>
                      {cfg.sign} {formatCurrency(item.amount)}
                    </p>
                    {isExactDuplicate ? (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">
                        {t('alreadyImportedBadge')}
                      </span>
                    ) : item.status === 'POSSIBLE_DUPLICATE' ? (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400">
                        {t('possibleDuplicateBadge')}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-border/10 mt-auto sticky bottom-0 z-10 bg-card flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{t('count', { count: importCount, total: reviewableItems.length })}</span>
          <button
            type="button"
            onClick={onBack}
            className="font-medium hover:text-foreground transition-colors"
          >
            {t('back')}
          </button>
        </div>

        {confirmImport.isError && (
          <p className="text-xs font-medium text-destructive px-1">
            {(confirmImport.error as Error)?.message ?? t('confirmError')}
          </p>
        )}

        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
                disabled={cancelImport.isPending}
              >
                {t('cancelImport')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('cancelTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('cancelDesc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('goBack')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>{t('cancelImport')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
            onClick={handleConfirm}
            disabled={confirmImport.isPending}
          >
            {confirmImport.isPending ? t('confirming') : t('importBtn', { count: importCount })}
          </Button>
        </div>
      </div>
    </>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { addFundsSchema } from '@/lib/schemas/goals';
import { Button } from '@/components/ui/button';
import { AmountInputField, DateInputField } from '@/components/ui/form-field';
import { useGoalContributions } from '@/modules/goals/hooks/use-goal-contributions';
import type { Goal } from '@/modules/goals/model/api/goal';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ArrowDownLeft, ArrowUpRight, Check, CheckCircle2, Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { MONTH_KEYS } from '@/components/painel/config';

type OperationType = 'deposit' | 'withdrawal';

interface AddFundsDrawerProps {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (goalId: string, amount: number, date: string) => Promise<void>;
  isLoading: boolean;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number) {
  return Math.abs(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string, td: (key: string) => string) {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getDate().toString().padStart(2, '0')} ${td(MONTH_KEYS[date.getMonth()])}, ${date.getFullYear()}`;
}

export function AddFundsDrawer({
  open,
  goal,
  onClose,
  onSubmit,
  isLoading,
}: AddFundsDrawerProps) {
  const t = useTranslations('addFunds');
  const tCommon = useTranslations('common');
  const td = useTranslations('dateNames');
  const [operationType, setOperationType] = useState<OperationType>('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingContributions,
  } = useGoalContributions(goal?.id, open);

  const contributions = data?.pages.flatMap((page) => page.data) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, contributions.length]);

  const numericAmount = parseFloat(amount.replace(',', '.'));
  const isFormValid = amount !== '' && !Number.isNaN(numericAmount) && numericAmount > 0 && date !== '';

  const handleConfirm = async () => {
    if (!goal) return;

    const result = addFundsSchema.safeParse({ amount, date });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? tCommon('invalidData'));
      return;
    }

    setError(null);

    const signedAmount = operationType === 'withdrawal' ? -numericAmount : numericAmount;

    try {
      await onSubmit(goal.id, signedAmount, date);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        setDate(getTodayDateString());
        onClose();
      }, 1500);
    } catch (err) {
      setError(extractErrorMessage(err, t('operationError')));
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setAmount('');
      setDate(getTodayDateString());
      setShowSuccess(false);
      setError(null);
      setOperationType('deposit');
      onClose();
    }
  };

  if (!goal) return null;

  const isWithdrawal = operationType === 'withdrawal';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <DrawerContent ref={scrollContainerRef}>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {isWithdrawal ? t('withdrawTitle') : t('depositTitle')}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {goal.name}
          </SheetDescription>
        </DrawerHeader>

        {showSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 animate-fade-in">
            <div className={cn(
              "w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4",
              isWithdrawal
                ? "bg-destructive/10 border-destructive/20"
                : "bg-primary/10 border-primary/20"
            )}>
              <Check className={cn("h-10 w-10", isWithdrawal ? "text-destructive" : "text-primary")} />
            </div>
            <h2 className={cn(
              "text-xl font-bold font-display mb-1",
              isWithdrawal ? "text-destructive" : "text-primary"
            )}>
              {isWithdrawal ? t('withdrawDone') : t('depositDone')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isWithdrawal ? t('withdrawDoneNote') : t('depositDoneNote')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 px-6 pb-6 space-y-4">
              {/* Toggle depositar / retirar */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => setOperationType('deposit')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-all",
                    operationType === 'deposit'
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {t('deposit')}
                </button>
                <button
                  onClick={() => setOperationType('withdrawal')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-all",
                    operationType === 'withdrawal'
                      ? "bg-destructive text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  {t('withdraw')}
                </button>
              </div>

              <DateInputField
                label={isWithdrawal ? t('withdrawDate') : t('depositDate')}
                value={date}
                onChange={setDate}
              />

              <AmountInputField
                label={isWithdrawal ? t('withdrawAmount') : t('depositAmount')}
                value={amount}
                onChange={setAmount}
                autoFocus
              />

              {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}

              {/* History */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1">
                  {t('history')}
                </h3>

                <div className="space-y-2">
                  {isLoadingContributions ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  ) : contributions.length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center">
                      <p className="text-sm text-muted-foreground">{t('noMovements')}</p>
                    </div>
                  ) : (
                    <>
                      {contributions.map((c) => {
                        const isNegative = c.amount < 0;
                        return (
                          <div
                            key={c.id}
                            className="glass-card rounded-2xl p-3 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                isNegative ? "bg-destructive/10" : "bg-primary/10"
                              )}>
                                {isNegative
                                  ? <Minus className="h-4 w-4 text-destructive" />
                                  : <CheckCircle2 className="h-4 w-4 text-primary" />
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{c.description}</p>
                                <p className="text-[11px] text-muted-foreground">{formatDate(c.date, td)}</p>
                              </div>
                            </div>
                            <p className={cn(
                              "text-sm font-bold shrink-0",
                              isNegative ? "text-destructive" : "text-primary"
                            )}>
                              {isNegative ? '-' : '+'}{formatCurrency(c.amount)}
                            </p>
                          </div>
                        );
                      })}

                      <div ref={sentinelRef} />

                      {isFetchingNextPage && (
                        <div className="flex justify-center py-2">
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <DrawerFooter>
              <Button
                onClick={handleConfirm}
                disabled={!isFormValid || isLoading}
                className={cn(
                  "w-full h-11 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                  isWithdrawal
                    ? "bg-destructive hover:bg-red-600 shadow-lg shadow-destructive/20"
                    : "bg-gradient-primary shadow-glow"
                )}
              >
                {isWithdrawal
                  ? <ArrowDownLeft className="h-5 w-5" />
                  : <Plus className="h-5 w-5" />
                }
                {isLoading
                  ? t('processing')
                  : isWithdrawal ? t('confirmWithdraw') : t('confirmDeposit')
                }
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Sheet>
  );
}


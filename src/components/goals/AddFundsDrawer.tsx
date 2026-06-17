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
import { Check, CheckCircle2, Loader2, Plus } from 'lucide-react';

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
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

export function AddFundsDrawer({
  open,
  goal,
  onClose,
  onSubmit,
  isLoading,
}: AddFundsDrawerProps) {
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
      setError(result.error.errors[0]?.message ?? 'Dados inválidos');
      return;
    }

    setError(null);

    try {
      await onSubmit(goal.id, numericAmount, date);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        setDate(getTodayDateString());
        onClose();
      }, 1500);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setAmount('');
      setDate(getTodayDateString());
      setShowSuccess(false);
      setError(null);
      onClose();
    }
  };

  if (!goal) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <DrawerContent ref={scrollContainerRef}>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            Adicionar Valor
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Para: {goal.name}
          </SheetDescription>
        </DrawerHeader>

        {showSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-display text-primary mb-1">
              Aporte Realizado!
            </h2>
            <p className="text-sm text-muted-foreground">
              Seu objetivo está mais próximo.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 px-6 pb-6 space-y-4">
              <DateInputField
                label="Data do Aporte"
                value={date}
                onChange={setDate}
              />

              <AmountInputField
                label="Valor do Aporte"
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
                  Histórico de Aportes
                </h3>

                <div className="space-y-2">
                  {isLoadingContributions ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  ) : contributions.length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center">
                      <p className="text-sm text-muted-foreground">Nenhum aporte realizado ainda.</p>
                    </div>
                  ) : (
                    <>
                      {contributions.map((c) => (
                        <div
                          key={c.id}
                          className="glass-card rounded-2xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{c.description}</p>
                              <p className="text-[11px] text-muted-foreground">{formatDate(c.date)}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-primary shrink-0">
                            +{formatCurrency(c.amount)}
                          </p>
                        </div>
                      ))}

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
                className="w-full h-11 bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                {isLoading ? 'Processando...' : 'Confirmar Aporte'}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Sheet>
  );
}

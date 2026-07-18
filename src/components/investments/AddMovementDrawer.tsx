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
import { addMovementSchema } from '@/lib/schemas/investments';
import { Button } from '@/components/ui/button';
import { AmountInputField, DateInputField, NumberInputField } from '@/components/ui/form-field';
import { useInvestmentMovements } from '@/modules/investments/hooks/use-investment-movements';
import { useInvestmentQuote } from '@/modules/investments/hooks/use-investment-quote';
import type {
  Investment,
  InvestmentMovementType,
} from '@/modules/investments/model/api/investment';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ArrowDownLeft, ArrowUpRight, Check, Coins, Loader2, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { MONTH_KEYS } from '@/components/painel/config';
import { formatCurrency, getSharePosition, isVariableIncome } from './investment-helpers';

type MovementTab = 'contribution' | 'dividend' | 'adjustment';

interface AddMovementDrawerProps {
  open: boolean;
  investment: Investment | null;
  onClose: () => void;
  onSubmit: (
    investmentId: string,
    type: InvestmentMovementType,
    amount: number,
    date: string,
    shareInfo?: { quantity: number; pricePerShare: number },
  ) => Promise<void>;
  isLoading: boolean;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr: string, td: (key: string) => string) {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getDate().toString().padStart(2, '0')} ${td(MONTH_KEYS[date.getMonth()])}, ${date.getFullYear()}`;
}

export function AddMovementDrawer({
  open,
  investment,
  onClose,
  onSubmit,
  isLoading,
}: AddMovementDrawerProps) {
  const t = useTranslations('addMovementDrawer');
  const tc = useTranslations('createInvestmentDrawer');
  const tCommon = useTranslations('common');
  const td = useTranslations('dateNames');
  const [tab, setTab] = useState<MovementTab>('contribution');
  const [isWithdrawal, setIsWithdrawal] = useState(false);
  const [amount, setAmount] = useState('');
  const [dividendAmount, setDividendAmount] = useState('');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentShareQuantity, setAdjustmentShareQuantity] = useState(0);
  const [adjustmentPricePerShare, setAdjustmentPricePerShare] = useState('');
  const [shareQuantity, setShareQuantity] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState('');
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
    isLoading: isLoadingMovements,
  } = useInvestmentMovements(investment?.id, open);

  const movements = data?.pages.flatMap((page) => page.data) ?? [];

  // Pra FII/Ação, aporte/retirada e ajuste usam quantidade de cotas x preço,
  // não um valor solto — reflete como a operação realmente aconteceu e evita
  // a pessoa ter que calcular o total de cabeça.
  const isSharesBasedType = !!investment && isVariableIncome(investment);
  const isSharesBased = tab === 'contribution' && isSharesBasedType;
  const isAdjustmentSharesBased = tab === 'adjustment' && isSharesBasedType;

  // Quantas cotas a pessoa realmente tem hoje (pelo que este navegador
  // rastreou) — usado pra não deixar vender mais do que possui.
  const heldQuantity =
    investment && isSharesBasedType ? getSharePosition(investment).quantity : null;

  // Cotação da bolsa (informativa) pra preencher o preço da cota com um clique,
  // sem a pessoa precisar consultar em outro lugar.
  const investmentQuote = useInvestmentQuote(isSharesBasedType ? (investment?.ticker ?? null) : null);
  const quotePrice = investmentQuote.data?.available ? investmentQuote.data.price : null;

  // Ao abrir o ajuste de investimentos sem cotas (CDB/outros), pré-preenche
  // com o saldo atual pra pessoa só digitar o valor novo — não precisa
  // calcular a diferença de cabeça.
  useEffect(() => {
    if (investment && tab === 'adjustment' && !isSharesBasedType) {
      setAdjustmentValue(investment.currentBalance.toFixed(2).replace('.', ','));
    }
  }, [investment, tab, isSharesBasedType]);

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, movements.length]);

  const numericPricePerUnit = parseFloat(pricePerUnit.replace(',', '.'));
  const sharesAmount =
    shareQuantity > 0 && !isNaN(numericPricePerUnit) && numericPricePerUnit > 0
      ? shareQuantity * numericPricePerUnit
      : 0;

  const numericAdjustmentValue = parseFloat(adjustmentValue.replace(',', '.'));
  const numericAdjustmentPricePerShare = parseFloat(adjustmentPricePerShare.replace(',', '.'));
  const adjustmentSharesTotal =
    adjustmentShareQuantity > 0 &&
    !isNaN(numericAdjustmentPricePerShare) &&
    numericAdjustmentPricePerShare > 0
      ? adjustmentShareQuantity * numericAdjustmentPricePerShare
      : 0;

  const hasValidAdjustmentInput = isAdjustmentSharesBased
    ? adjustmentShareQuantity > 0 && numericAdjustmentPricePerShare > 0
    : !isNaN(numericAdjustmentValue) && numericAdjustmentValue >= 0;

  const adjustmentNewTotal = isAdjustmentSharesBased ? adjustmentSharesTotal : numericAdjustmentValue;
  const adjustmentDelta =
    investment && hasValidAdjustmentInput ? adjustmentNewTotal - investment.currentBalance : 0;

  const numericDividendAmount = parseFloat(dividendAmount.replace(',', '.'));
  const numericAmount = isSharesBased ? sharesAmount : parseFloat(amount.replace(',', '.'));
  const exceedsHeldShares =
    isSharesBased && isWithdrawal && heldQuantity !== null && shareQuantity > heldQuantity;
  const isFormValid = isSharesBased
    ? shareQuantity >= 1 && numericPricePerUnit > 0 && date !== '' && !exceedsHeldShares
    : tab === 'adjustment'
      ? hasValidAdjustmentInput && adjustmentDelta !== 0 && date !== ''
      : tab === 'dividend'
        ? dividendAmount !== '' && !Number.isNaN(numericDividendAmount) && numericDividendAmount > 0 && date !== ''
        : amount !== '' && !Number.isNaN(numericAmount) && numericAmount > 0 && date !== '';

  const handleConfirm = async () => {
    if (!investment) return;

    if (isSharesBased) {
      if (shareQuantity < 1 || isNaN(numericPricePerUnit) || numericPricePerUnit <= 0) {
        setError(tCommon('invalidData'));
        return;
      }
      if (exceedsHeldShares) {
        setError(t('insufficientShares', { available: String(heldQuantity) }));
        return;
      }
    } else if (tab === 'adjustment') {
      if (!hasValidAdjustmentInput) {
        setError(tCommon('invalidData'));
        return;
      }
      if (adjustmentDelta === 0) {
        setError(t('adjustmentNoChange'));
        return;
      }
    } else if (tab === 'dividend') {
      const result = addMovementSchema.safeParse({ amount: dividendAmount, date });
      if (!result.success) {
        setError(result.error.errors[0]?.message ?? tCommon('invalidData'));
        return;
      }
    } else {
      const result = addMovementSchema.safeParse({ amount, date });
      if (!result.success) {
        setError(result.error.errors[0]?.message ?? tCommon('invalidData'));
        return;
      }
    }

    if (tab === 'contribution' && isWithdrawal && numericAmount > investment.currentBalance) {
      setError(t('insufficientBalance'));
      return;
    }

    setError(null);

    const type: InvestmentMovementType =
      tab === 'contribution' ? 'CONTRIBUTION' : tab === 'dividend' ? 'YIELD' : 'ADJUSTMENT';
    const signedAmount =
      tab === 'adjustment'
        ? adjustmentDelta
        : tab === 'dividend'
          ? numericDividendAmount
          : tab === 'contribution' && isWithdrawal
            ? -numericAmount
            : numericAmount;

    const shareInfo = isSharesBased
      ? { quantity: shareQuantity, pricePerShare: numericPricePerUnit }
      : isAdjustmentSharesBased
        ? { quantity: adjustmentShareQuantity, pricePerShare: numericAdjustmentPricePerShare }
        : undefined;

    try {
      await onSubmit(investment.id, type, signedAmount, date, shareInfo);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        setDividendAmount('');
        setAdjustmentValue('');
        setAdjustmentShareQuantity(0);
        setAdjustmentPricePerShare('');
        setShareQuantity(0);
        setPricePerUnit('');
        setDate(getTodayDateString());
        onClose();
      }, 1200);
    } catch (err) {
      setError(extractErrorMessage(err, t('operationError')));
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setAmount('');
      setDividendAmount('');
      setAdjustmentValue('');
      setAdjustmentShareQuantity(0);
      setAdjustmentPricePerShare('');
      setShareQuantity(0);
      setPricePerUnit('');
      setDate(getTodayDateString());
      setShowSuccess(false);
      setError(null);
      setTab('contribution');
      setIsWithdrawal(false);
      onClose();
    }
  };

  if (!investment) return null;

  const movementIcon: Record<string, React.ComponentType<{ className?: string }>> = {
    CONTRIBUTION: ArrowUpRight,
    YIELD: Coins,
    ADJUSTMENT: Scale,
  };

  const movementColor: Record<string, string> = {
    CONTRIBUTION: 'text-primary',
    YIELD: 'text-accent',
    ADJUSTMENT: 'text-status-warning',
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <DrawerContent ref={scrollContainerRef}>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {t('title')}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {investment.name}
          </SheetDescription>
        </DrawerHeader>

        {showSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full border-2 bg-primary/10 border-primary/20 flex items-center justify-center mb-4">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-display mb-1 text-primary">{t('done')}</h2>
          </div>
        ) : (
          <>
            <div className="flex-1 px-6 pb-6 space-y-4">
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => setTab('contribution')}
                  className={cn(
                    'flex-1 h-9 rounded-lg text-[11px] font-bold transition-all',
                    tab === 'contribution'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t('contributionTab')}
                </button>
                {isSharesBasedType && (
                  <button
                    onClick={() => setTab('dividend')}
                    className={cn(
                      'flex-1 h-9 rounded-lg text-[11px] font-bold transition-all',
                      tab === 'dividend'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t('dividendTab')}
                  </button>
                )}
                <button
                  onClick={() => setTab('adjustment')}
                  className={cn(
                    'flex-1 h-9 rounded-lg text-[11px] font-bold transition-all',
                    tab === 'adjustment'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t('adjustmentTab')}
                </button>
              </div>

              {tab === 'contribution' && (
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                  <button
                    onClick={() => setIsWithdrawal(false)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-all',
                      !isWithdrawal
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {t('contribution')}
                  </button>
                  <button
                    onClick={() => setIsWithdrawal(true)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-all',
                      isWithdrawal
                        ? 'bg-destructive text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    {t('withdrawal')}
                  </button>
                </div>
              )}

              {tab === 'adjustment' && (
                <p className="text-xs text-muted-foreground">
                  {isAdjustmentSharesBased ? t('adjustmentHintShares') : t('adjustmentHint')}
                </p>
              )}

              {tab === 'dividend' && (
                <p className="text-xs text-muted-foreground">{t('dividendHint')}</p>
              )}

              <DateInputField label={t('date')} value={date} onChange={setDate} />

              {isSharesBased ? (
                <>
                  <NumberInputField
                    label={t('sharesQuantity')}
                    value={shareQuantity}
                    onChange={setShareQuantity}
                    min={1}
                    max={isWithdrawal && heldQuantity !== null ? heldQuantity : 1000000}
                    step={1}
                  />
                  {exceedsHeldShares && (
                    <p className="text-xs text-destructive font-medium">
                      {t('insufficientShares', { available: String(heldQuantity) })}
                    </p>
                  )}
                  <AmountInputField
                    label={isWithdrawal ? t('sellPrice') : t('buyPrice')}
                    required
                    value={pricePerUnit}
                    onChange={setPricePerUnit}
                    autoFocus
                  />
                  {quotePrice !== null && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {tc('quoteFound', { amount: formatCurrency(quotePrice) })}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPricePerUnit(quotePrice.toFixed(2).replace('.', ','))}
                        className="text-xs font-bold text-primary hover:underline shrink-0"
                      >
                        {tc('useQuote')}
                      </button>
                    </div>
                  )}
                  {sharesAmount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('totalPreview', { amount: formatCurrency(sharesAmount) })}
                    </p>
                  )}
                </>
              ) : isAdjustmentSharesBased ? (
                <>
                  <NumberInputField
                    label={t('sharesQuantity')}
                    value={adjustmentShareQuantity}
                    onChange={setAdjustmentShareQuantity}
                    min={0}
                    max={1000000}
                    step={1}
                  />
                  <AmountInputField
                    label={t('currentPricePerShare')}
                    required
                    value={adjustmentPricePerShare}
                    onChange={setAdjustmentPricePerShare}
                    autoFocus
                  />
                  {quotePrice !== null && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {tc('quoteFound', { amount: formatCurrency(quotePrice) })}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setAdjustmentPricePerShare(quotePrice.toFixed(2).replace('.', ','))
                        }
                        className="text-xs font-bold text-primary hover:underline shrink-0"
                      >
                        {tc('useQuote')}
                      </button>
                    </div>
                  )}
                  {adjustmentSharesTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('totalPreview', { amount: formatCurrency(adjustmentSharesTotal) })}
                    </p>
                  )}
                  {adjustmentDelta !== 0 && (
                    <p
                      className={cn(
                        'text-xs font-medium',
                        adjustmentDelta > 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {t('adjustmentDiff', {
                        amount: `${adjustmentDelta > 0 ? '+' : '-'}${formatCurrency(Math.abs(adjustmentDelta))}`,
                      })}
                    </p>
                  )}
                </>
              ) : tab === 'adjustment' ? (
                <>
                  <AmountInputField
                    label={t('currentValue')}
                    value={adjustmentValue}
                    onChange={setAdjustmentValue}
                    autoFocus
                  />
                  {adjustmentDelta !== 0 && (
                    <p
                      className={cn(
                        'text-xs font-medium',
                        adjustmentDelta > 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {t('adjustmentDiff', {
                        amount: `${adjustmentDelta > 0 ? '+' : '-'}${formatCurrency(Math.abs(adjustmentDelta))}`,
                      })}
                    </p>
                  )}
                </>
              ) : tab === 'dividend' ? (
                <AmountInputField
                  label={t('dividendAmount')}
                  value={dividendAmount}
                  onChange={setDividendAmount}
                  autoFocus
                />
              ) : (
                <AmountInputField label={t('amount')} value={amount} onChange={setAmount} autoFocus />
              )}

              {error && <p className="text-xs text-destructive text-center">{error}</p>}

              <div className="pt-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1">
                  {t('history')}
                </h3>

                <div className="space-y-2">
                  {isLoadingMovements ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  ) : movements.length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center">
                      <p className="text-sm text-muted-foreground">{t('noMovements')}</p>
                    </div>
                  ) : (
                    <>
                      {movements.map((m) => {
                        const Icon = movementIcon[m.type];
                        const isNegative = m.amount < 0;
                        return (
                          <div
                            key={m.id}
                            className="glass-card rounded-2xl p-3 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                <Icon className={cn('h-4 w-4', movementColor[m.type])} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{m.description}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatDate(m.date, td)}
                                </p>
                              </div>
                            </div>
                            <p
                              className={cn(
                                'text-sm font-bold shrink-0',
                                isNegative ? 'text-destructive' : movementColor[m.type],
                              )}
                            >
                              {isNegative ? '-' : '+'}
                              {formatCurrency(Math.abs(m.amount))}
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
                className="w-full h-11 bg-primary text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? t('processing') : t('confirm')}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Sheet>
  );
}

'use client';

import { useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { AmountInputField, NumberInputField } from '@/components/ui/form-field';
import { usePayInvoice } from '@/modules/credit-cards/hooks/use-pay-invoice';
import { useGetCardInvoices } from '@/modules/credit-cards/hooks/use-get-card-invoices';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { formatCurrency } from '@/lib/cashflow';
import { MONTH_KEYS } from '@/components/painel/config';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';

type InterestMode = 'none' | 'rate' | 'amount';

function priceInstallment(principal: number, monthlyRatePct: number, n: number): number {
  if (monthlyRatePct === 0 || n === 0) return principal / n;
  const r = monthlyRatePct / 100;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function distributeAmounts(total: number, count: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const rem = cents - base * count;
  const arr = Array(count).fill(base);
  for (let i = 0; i < rem; i++) arr[count - 1 - i] += 1;
  return arr.map((c: number) => c / 100);
}

function addMonths(year: number, month: number, offset: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + offset;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

interface PartialPaymentDrawerProps {
  invoice: CreditCardInvoice;
  open: boolean;
  onClose: () => void;
}

export function PartialPaymentDrawer({ invoice, open, onClose }: PartialPaymentDrawerProps) {
  const t = useTranslations('partialPayment');
  const td = useTranslations('dateNames');
  const [partialAmount, setPartialAmount] = useState('');
  const [remainderInstallments, setRemainderInstallments] = useState(1);
  const [interestMode, setInterestMode] = useState<InterestMode>('none');
  const [interestRate, setInterestRate] = useState(0);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const payMutation = usePayInvoice();
  const cardInvoicesQuery = useGetCardInvoices(invoice.cardId, open);

  const numericPartial = parseFloat(partialAmount.replace(',', '.'));
  const amountExceedsTotal =
    !Number.isNaN(numericPartial) && numericPartial >= invoice.totalAmount - 0.005;
  const isPartialAmountValid =
    !Number.isNaN(numericPartial) && numericPartial > 0 && !amountExceedsTotal;
  const remainderAmount = isPartialAmountValid ? invoice.totalAmount - numericPartial : 0;
  const numericInstallmentAmount = parseFloat(installmentAmount.replace(',', '.'));

  // Compute total with interest and per-installment amounts
  let previewTotal = 0;
  let installmentAmounts: number[] = [];

  if (isPartialAmountValid && remainderInstallments > 0) {
    if (interestMode === 'rate') {
      const pmt = priceInstallment(remainderAmount, interestRate, remainderInstallments);
      previewTotal = pmt * remainderInstallments;
      installmentAmounts = distributeAmounts(previewTotal, remainderInstallments);
    } else if (
      interestMode === 'amount' &&
      !Number.isNaN(numericInstallmentAmount) &&
      numericInstallmentAmount > 0
    ) {
      previewTotal = numericInstallmentAmount * remainderInstallments;
      installmentAmounts = Array(remainderInstallments).fill(numericInstallmentAmount);
    } else {
      previewTotal = remainderAmount;
      installmentAmounts = distributeAmounts(remainderAmount, remainderInstallments);
    }
  }

  const previewInterest = previewTotal - remainderAmount;
  const showPreview = isPartialAmountValid && installmentAmounts.length > 0;

  // Future invoice impact: merge new installments with existing future invoice totals
  const existingInvoices = cardInvoicesQuery.data ?? [];
  const futureImpact = showPreview
    ? installmentAmounts.map((newInstallment, i) => {
        const { year, month } = addMonths(invoice.referenceYear, invoice.referenceMonth, i + 1);
        const existing = existingInvoices.find(
          (inv) => inv.referenceYear === year && inv.referenceMonth === month && !inv.isPaid,
        );
        return {
          year,
          month,
          newInstallment,
          existingTotal: existing?.totalAmount ?? 0,
          total: (existing?.totalAmount ?? 0) + newInstallment,
          number: i + 1,
        };
      })
    : [];

  const isFormValid =
    isPartialAmountValid &&
    (interestMode === 'none' ||
      (interestMode === 'rate' && interestRate > 0) ||
      (interestMode === 'amount' &&
        !Number.isNaN(numericInstallmentAmount) &&
        numericInstallmentAmount > 0));

  function handleClose() {
    setPartialAmount('');
    setRemainderInstallments(1);
    setInterestMode('none');
    setInterestRate(0);
    setInstallmentAmount('');
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setError(null);
    try {
      await payMutation.mutateAsync({
        id: invoice.id,
        amount: numericPartial,
        remainderInstallments,
        ...(interestMode === 'rate' && interestRate > 0 && { interestRate }),
        ...(interestMode === 'amount' &&
          numericInstallmentAmount > 0 && { installmentAmount: numericInstallmentAmount }),
      });
      handleClose();
    } catch (err) {
      setError(extractErrorMessage(err, t('payError')));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <DrawerContent>
        <DrawerHeader onClose={handleClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {t('title')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {t('invoiceHeader', {
              month: td(MONTH_KEYS[invoice.referenceMonth - 1]),
              year: invoice.referenceYear,
            })}{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(invoice.totalAmount)}
            </span>
          </p>
          <SheetDescription className="sr-only">{t('srDescription')}</SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-4">
          <AmountInputField
            label={t('amountNow')}
            required
            value={partialAmount}
            onChange={setPartialAmount}
            error={
              amountExceedsTotal
                ? t('amountExceeds', { amount: formatCurrency(invoice.totalAmount) })
                : undefined
            }
          />

          <NumberInputField
            label={t('reinstall')}
            value={remainderInstallments}
            onChange={setRemainderInstallments}
            min={1}
            max={48}
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              {t('bankInterest')}
            </label>
            <div className="flex gap-2">
              {(
                [
                  ['none', t('noInterest')],
                  ['rate', t('interestRate')],
                  ['amount', t('installmentValue')],
                ] as [InterestMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInterestMode(mode)}
                  className={cn(
                    'flex-1 py-2 text-[11px] font-bold rounded-xl transition-all duration-200 border',
                    interestMode === mode
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {interestMode === 'rate' && (
            <NumberInputField
              label={t('interestRate')}
              value={interestRate}
              onChange={setInterestRate}
              min={0}
              max={100}
              step={0.01}
              suffix="%"
            />
          )}

          {interestMode === 'amount' && (
            <AmountInputField
              label={t('installmentValue')}
              required
              value={installmentAmount}
              onChange={setInstallmentAmount}
            />
          )}

          {/* Summary */}
          {showPreview && (
            <div className="rounded-xl bg-white/5 px-4 py-3 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('remainder')}</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(remainderAmount)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('total')}</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(previewTotal)}
                </span>
              </div>
              {previewInterest > 0.005 && (
                <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                  <span className="text-muted-foreground">{t('interest')}</span>
                  <span className="font-semibold text-balance-danger">
                    + {formatCurrency(previewInterest)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Future impact */}
          {futureImpact.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                {t('futureImpact')}
              </p>
              <div className="space-y-1.5">
                {futureImpact.map(
                  ({ year, month, newInstallment, existingTotal, total, number }) => (
                    <div
                      key={number}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {td(MONTH_KEYS[month - 1])}/{year}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {existingTotal > 0
                            ? `${formatCurrency(existingTotal)} + ${formatCurrency(newInstallment)} (${t('installment', { n: number, total: remainderInstallments })})`
                            : t('installment', { n: number, total: remainderInstallments })}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-balance-danger">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive text-center">{error}</p>}
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={payMutation.isPending}
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isFormValid || payMutation.isPending}
            className="flex-1 h-11 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {payMutation.isPending ? t('processing') : t('confirm')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

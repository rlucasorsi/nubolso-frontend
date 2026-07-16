'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DateInputField } from '@/components/ui/form-field';
import { usePayInvoice } from '@/modules/credit-cards/hooks/use-pay-invoice';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { formatCurrency } from '@/lib/cashflow';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import { PartialPaymentDrawer } from './PartialPaymentDrawer';
import { useTranslations } from '@/i18n/useTranslations';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface PayInvoiceFormProps {
  invoice: CreditCardInvoice;
}

export function PayInvoiceForm({ invoice }: PayInvoiceFormProps) {
  const t = useTranslations('payInvoice');
  const [partialOpen, setPartialOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [error, setError] = useState<string | null>(null);

  const payMutation = usePayInvoice();

  const advancedAmount = invoice.advancedAmount ?? 0;
  const remainingAmount = Math.max(invoice.totalAmount - advancedAmount, 0);

  async function handleFullPayment() {
    setError(null);
    try {
      await payMutation.mutateAsync({
        id: invoice.id,
        amount: remainingAmount,
        paymentDate,
      });
    } catch (err) {
      setError(extractErrorMessage(err, t('payError')));
    }
  }

  return (
    <>
      <div className="w-full space-y-3">
        <DateInputField label={t('paymentDate')} value={paymentDate} onChange={setPaymentDate} />

        {advancedAmount > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 text-xs">
            <span className="text-muted-foreground">{t('advancedSoFar')}</span>
            <span className="font-bold text-foreground">{formatCurrency(advancedAmount)}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => setPartialOpen(true)}
            variant="outline"
            disabled={payMutation.isPending}
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5 font-bold"
          >
            {t('partialPayment')}
          </Button>

          <Button
            onClick={handleFullPayment}
            disabled={payMutation.isPending}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {payMutation.isPending
              ? t('processing')
              : `${t('payAll')} ${formatCurrency(remainingAmount)}`}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">{t('closeInvoiceNote')}</p>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>

      <PartialPaymentDrawer
        invoice={invoice}
        remainingAmount={remainingAmount}
        open={partialOpen}
        onClose={() => setPartialOpen(false)}
      />
    </>
  );
}

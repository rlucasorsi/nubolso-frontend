'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePayInvoice } from '@/modules/credit-cards/hooks/use-pay-invoice';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import { PartialPaymentDrawer } from './PartialPaymentDrawer';
import { useTranslations } from '@/i18n/useTranslations';

interface PayInvoiceFormProps {
  invoice: CreditCardInvoice;
}

export function PayInvoiceForm({ invoice }: PayInvoiceFormProps) {
  const t = useTranslations('payInvoice');
  const [partialOpen, setPartialOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payMutation = usePayInvoice();

  async function handleFullPayment() {
    setError(null);
    try {
      await payMutation.mutateAsync({ id: invoice.id, amount: invoice.totalAmount });
    } catch (err) {
      setError(extractErrorMessage(err, t('payError')));
    }
  }

  return (
    <>
      <div className="w-full space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={handleFullPayment}
            disabled={payMutation.isPending}
            className="flex-1 h-11 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {payMutation.isPending ? t('processing') : t('payAll')}
          </Button>

          <Button
            onClick={() => setPartialOpen(true)}
            variant="outline"
            disabled={payMutation.isPending}
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5 font-bold"
          >
            {t('partialPayment')}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>

      <PartialPaymentDrawer
        invoice={invoice}
        open={partialOpen}
        onClose={() => setPartialOpen(false)}
      />
    </>
  );
}


'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateLong } from '@/lib/cashflow';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import { AdvancePaymentDrawer } from './AdvancePaymentDrawer';
import { useTranslations } from '@/i18n/useTranslations';

interface OpenInvoiceAdvancePanelProps {
  invoice: CreditCardInvoice;
}

export function OpenInvoiceAdvancePanel({ invoice }: OpenInvoiceAdvancePanelProps) {
  const t = useTranslations('payInvoice');
  const [advanceOpen, setAdvanceOpen] = useState(false);

  const advancedAmount = invoice.advancedAmount ?? 0;
  const remainingAmount = Math.max(invoice.totalAmount - advancedAmount, 0);

  return (
    <>
      <div className="w-full space-y-3">
        <p className="text-xs text-muted-foreground text-center">
          {t('openInvoiceNote', { date: formatDateLong(invoice.closingDate) })}
        </p>

        <Button
          onClick={() => setAdvanceOpen(true)}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {t('advancePayment')}
        </Button>
      </div>

      <AdvancePaymentDrawer
        invoice={invoice}
        remainingAmount={remainingAmount}
        open={advanceOpen}
        onClose={() => setAdvanceOpen(false)}
      />
    </>
  );
}

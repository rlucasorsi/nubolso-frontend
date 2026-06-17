'use client';

import type { CreditCard as CreditCardType } from '@/modules/credit-cards/model/api/credit-card';
import { useGetCardInvoices } from '@/modules/credit-cards/hooks/use-get-card-invoices';
import { formatCurrency, formatDateLong } from '@/lib/cashflow';
import { CreditCard as CreditCardIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditCardCardProps {
  card: CreditCardType;
  onClick: () => void;
}

export function CreditCardCard({ card, onClick }: CreditCardCardProps) {
  const { data: invoices } = useGetCardInvoices(card.id);

  const unpaidInvoices = (invoices ?? [])
    .filter((invoice) => !invoice.isPaid)
    .sort((a, b) => a.referenceYear - b.referenceYear || a.referenceMonth - b.referenceMonth);

  const currentInvoice = unpaidInvoices[0];
  const nextInvoice = unpaidInvoices[1];

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface-container border border-white/5 rounded-base shadow-lg hover:shadow-xl p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col h-full',
        !card.isActive && 'opacity-50',
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <CreditCardIcon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display group-hover:text-primary transition-colors line-clamp-1">
              {card.name}
            </h3>
            <p className="text-xs font-medium text-muted-foreground line-clamp-1">
              Fecha dia {card.closingDay} · Vence dia {card.dueDay}
            </p>
          </div>
        </div>
        {!card.isActive && (
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg shrink-0">
            Inativo
          </span>
        )}
      </div>

      <div className="space-y-4 mt-auto">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
              Fatura Atual
            </span>
            {currentInvoice ? (
              <span className="text-xs text-muted-foreground">
                A pagar em {formatDateLong(currentInvoice.paymentDate)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Sem faturas em aberto</span>
            )}
          </div>
          <span className="text-lg font-bold text-foreground shrink-0">
            {formatCurrency(currentInvoice?.totalAmount ?? 0)}
          </span>
        </div>

        <div className="flex justify-between items-end px-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Próxima Fatura
          </span>
          <span className="text-sm font-bold text-primary/80">
            {formatCurrency(nextInvoice?.totalAmount ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

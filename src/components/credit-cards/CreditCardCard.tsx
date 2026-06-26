'use client';

import type { CreditCard as CreditCardType } from '@/modules/credit-cards/model/api/credit-card';
import { useGetCardInvoices } from '@/modules/credit-cards/hooks/use-get-card-invoices';
import { formatCurrency, formatDateLong } from '@/lib/cashflow';
import { CreditCard as CreditCardIcon, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/i18n/useTranslations';

interface CreditCardCardProps {
  card: CreditCardType;
  onClick: () => void;
  onDelete: () => void;
}

export function CreditCardCard({ card, onClick, onDelete }: CreditCardCardProps) {
  const t = useTranslations('creditCard');
  const td = useTranslations('creditCardDetail');
  const { data: invoices, isLoading } = useGetCardInvoices(card.id);

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
              {t('closingDueDay', { closing: card.closingDay, due: card.dueDay })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {card.isActive ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 bg-card border-white/10 rounded-xl shadow-xl"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {td('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
              {t('inactive')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 mt-auto">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
              {t('currentInvoice')}
            </span>
            {isLoading ? (
              <Skeleton className="h-3 w-28 mt-1" />
            ) : currentInvoice ? (
              <span className="text-xs text-muted-foreground">
                {t('payOn', { date: formatDateLong(currentInvoice.paymentDate) })}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{t('noOpenInvoices')}</span>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-20 shrink-0" />
          ) : (
            <span className="text-lg font-bold text-foreground shrink-0">
              {formatCurrency(currentInvoice?.totalAmount ?? 0)}
            </span>
          )}
        </div>

        <div className="flex justify-between items-end px-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t('nextInvoice')}
          </span>
          {isLoading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span className="text-sm font-bold text-primary/80">
              {formatCurrency(nextInvoice?.totalAmount ?? 0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

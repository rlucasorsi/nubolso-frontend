'use client';

import { useMemo } from 'react';
import type { CreditCard as CreditCardType } from '@/modules/credit-cards/model/api/credit-card';
import { useGetCardInvoices } from '@/modules/credit-cards/hooks/use-get-card-invoices';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { useGetEntries } from '@/modules/entries/hooks/use-get-entries';
import {
  formatCurrency,
  formatDateLong,
  getProjectedCardTemplatesForInvoiceCycle,
  generateVirtualCardInvoiceCycles,
  type RecurringTemplateLike,
  type FlowType,
} from '@/lib/cashflow';
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

// Unifica fatura real e ciclo virtual (ainda sem fatura no backend, só recorrência
// prevista) num único formato pra achar a fatura "atual" de verdade — mesma lógica
// do CreditCardDetailDrawer, senão uma fatura vencida antiga ou um ciclo sem fatura
// ainda (só recorrência pendente) bagunça qual é a fatura atual/próxima.
interface Cycle {
  referenceYear: number;
  referenceMonth: number;
  paymentDate: string;
  totalAmount: number;
  advancedAmount: number;
  purchaseTemplateIds: string[];
  isVirtual: boolean;
}

export function CreditCardCard({ card, onClick, onDelete }: CreditCardCardProps) {
  const t = useTranslations('creditCard');
  const td = useTranslations('creditCardDetail');
  const { data: invoices, isLoading } = useGetCardInvoices(card.id);
  const { data: templatesData } = useGetRecurringTemplates();
  const { data: entriesData } = useGetEntries();

  const templates: RecurringTemplateLike[] = useMemo(
    () =>
      (templatesData ?? []).map((tpl) => ({
        id: tpl.id,
        description: tpl.description,
        estimatedAmount: tpl.estimatedAmount,
        type: tpl.type.toLowerCase() as FlowType,
        dayOfMonth: tpl.dayOfMonth,
        isActive: tpl.isActive,
        categoryId: tpl.categoryId,
        category: tpl.category,
        endDate: tpl.endDate,
        totalOccurrences: tpl.totalOccurrences,
        occurrenceCount: tpl.occurrenceCount,
        creditCardId: tpl.creditCardId,
      })),
    [templatesData],
  );

  const existingEntries = useMemo(
    () =>
      (entriesData?.data ?? []).map((item) => ({
        id: item.id,
        date: item.date.split('T')[0],
        type: item.type as FlowType,
        amount: item.amount,
        templateId: item.templateId,
      })),
    [entriesData],
  );

  const { currentCycle, nextCycle } = useMemo(() => {
    const realUnpaid: Cycle[] = (invoices ?? [])
      .filter((invoice) => !invoice.isPaid)
      .map((invoice) => ({
        referenceYear: invoice.referenceYear,
        referenceMonth: invoice.referenceMonth,
        paymentDate: invoice.paymentDate,
        totalAmount: invoice.totalAmount,
        advancedAmount: invoice.advancedAmount ?? 0,
        purchaseTemplateIds: invoice.purchaseTemplateIds ?? [],
        isVirtual: false,
      }));

    const virtualCycles: Cycle[] = generateVirtualCardInvoiceCycles(
      card,
      templates,
      existingEntries,
      invoices ?? [],
    ).map((cycle) => ({
      referenceYear: cycle.referenceYear,
      referenceMonth: cycle.referenceMonth,
      paymentDate: cycle.paymentDate,
      totalAmount: 0,
      advancedAmount: 0,
      purchaseTemplateIds: [],
      isVirtual: true,
    }));

    const unpaid = [...realUnpaid, ...virtualCycles].sort(
      (a, b) => a.referenceYear - b.referenceYear || a.referenceMonth - b.referenceMonth,
    );

    return { currentCycle: unpaid[0], nextCycle: unpaid[1] };
  }, [invoices, card, templates, existingEntries]);

  // Recorrentes de cartão que ainda vão cair na fatura atual (não lançados),
  // mesmo cálculo usado no InvoiceDetailDrawer/CreditCardDetailDrawer.
  const projectedRecurrences = useMemo(() => {
    if (!currentCycle) return [];

    return getProjectedCardTemplatesForInvoiceCycle(
      templates,
      card,
      currentCycle.referenceYear,
      currentCycle.referenceMonth,
      existingEntries,
      currentCycle.purchaseTemplateIds,
    );
  }, [currentCycle, card, templates, existingEntries]);

  const currentAdvancedAmount = currentCycle?.advancedAmount ?? 0;
  const currentAmount = Math.max((currentCycle?.totalAmount ?? 0) - currentAdvancedAmount, 0);
  const projectedTotal = Math.max(
    currentAmount + projectedRecurrences.reduce((sum, r) => sum + r.estimatedAmount, 0),
    0,
  );

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
            ) : currentCycle ? (
              <span className="text-xs text-muted-foreground">
                {t('payOn', { date: formatDateLong(currentCycle.paymentDate) })}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{t('noOpenInvoices')}</span>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-20 shrink-0" />
          ) : (
            <div className="flex flex-col items-end shrink-0">
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(currentAmount)}
              </span>
              {projectedRecurrences.length > 0 ? (
                <span className="text-[11px] font-semibold text-primary">
                  {td('projected')} {formatCurrency(projectedTotal)}
                </span>
              ) : currentAdvancedAmount > 0 ? (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {td('advanced')} {formatCurrency(currentAdvancedAmount)}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-primary invisible">
                  {td('projected')} {formatCurrency(projectedTotal)}
                </span>
              )}
            </div>
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
              {formatCurrency(nextCycle?.totalAmount ?? 0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useRef, useState } from 'react';
import { CreditCard as CreditCardIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCurrency,
  formatDateLong,
  formatDateShort,
  getProjectedCardTemplatesForInvoiceCycle,
  type RecurringTemplateLike,
  type FlowType,
} from '@/lib/cashflow';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { useGetAllInvoices } from '@/modules/credit-cards/hooks/use-get-all-invoices';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { useGetEntries } from '@/modules/entries/hooks/use-get-entries';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import { cn, localDateStr } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';

interface CreditCardSummaryCardProps {
  onSelectCard: (cardId: string) => void;
}

export function CreditCardSummaryCard({ onSelectCard }: CreditCardSummaryCardProps) {
  const t = useTranslations('creditCardSummaryCard');
  const { data: cardsData, isLoading: isLoadingCards } = useGetCreditCards();
  const { data: invoicesData, isLoading: isLoadingInvoices } = useGetAllInvoices();
  const { data: templatesData } = useGetRecurringTemplates();
  const { data: entriesData } = useGetEntries();

  const isLoading = isLoadingCards || isLoadingInvoices;

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

  const rows = useMemo(() => {
    const cards = (cardsData ?? []).filter((c) => c.isActive);
    const invoices = invoicesData ?? [];
    const now = new Date();
    const todayKey = now.getFullYear() * 12 + now.getMonth();

    return cards
      .map((card) => {
        const unpaid = invoices
          .filter((inv) => inv.cardId === card.id && !inv.isPaid)
          .sort(
            (a, b) =>
              a.referenceYear * 12 + a.referenceMonth - (b.referenceYear * 12 + b.referenceMonth),
          );
        const openFuture = unpaid.filter(
          (inv) => inv.referenceYear * 12 + (inv.referenceMonth - 1) >= todayKey,
        );
        const currentInvoice: CreditCardInvoice | undefined = openFuture[0] ?? unpaid[0];
        const nextInvoice: CreditCardInvoice | undefined = currentInvoice
          ? unpaid.find((inv) => inv.id !== currentInvoice.id)
          : undefined;

        const projectedRecurrences = currentInvoice
          ? getProjectedCardTemplatesForInvoiceCycle(
              templates,
              card,
              currentInvoice.referenceYear,
              currentInvoice.referenceMonth,
              existingEntries,
              currentInvoice.purchaseTemplateIds ?? [],
            )
          : [];
        const projectedTotal =
          (currentInvoice?.totalAmount ?? 0) +
          projectedRecurrences.reduce((sum, r) => sum + r.estimatedAmount, 0);

        return { card, currentInvoice, nextInvoice, projectedTotal, hasProjected: projectedRecurrences.length > 0 };
      })
      .sort((a, b) => {
        if (!a.currentInvoice && !b.currentInvoice) return 0;
        if (!a.currentInvoice) return 1;
        if (!b.currentInvoice) return -1;
        return a.currentInvoice.paymentDate.localeCompare(b.currentInvoice.paymentDate);
      });
  }, [cardsData, invoicesData, templates, existingEntries]);

  const totalCurrent = rows.reduce((sum, r) => sum + (r.currentInvoice?.totalAmount ?? 0), 0);
  const nextDueDate = rows.find((r) => r.currentInvoice)?.currentInvoice?.paymentDate;
  const today = localDateStr();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-3">
            <Skeleton className="h-32 flex-1 min-w-[152px] rounded-2xl" />
            <Skeleton className="h-32 flex-1 min-w-[152px] rounded-2xl" />
          </div>
        </div>
      </Card>
    );
  }

  if (rows.length === 0) return null;

  return (
    <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-8 overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1.5">
            <CreditCardIcon className="w-3 h-3 shrink-0" />
            <span>{t('currentTotal')}</span>
          </div>
          <h3 className="text-[20px] font-bold tracking-tight text-white font-display truncate">
            {formatCurrency(totalCurrent)}
          </h3>
          <p className="text-[11px] text-muted-foreground/50 font-medium mt-1">
            {rows.length} {rows.length === 1 ? t('card') : t('cards')}
            {nextDueDate && ` · ${t('dueOn', { date: formatDateLong(nextDueDate) })}`}
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {rows.map(({ card, currentInvoice, nextInvoice, projectedTotal, hasProjected }) => {
          const isOverdue = !!currentInvoice && currentInvoice.paymentDate < today;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCard(card.id)}
              className="group w-full shrink-0 snap-center sm:w-auto sm:shrink sm:flex-1 sm:min-w-[156px] sm:snap-start rounded-2xl p-4 text-left bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent border border-violet-500/15 hover:border-violet-400/40 hover:from-violet-500/20 transition-all flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-300 shrink-0">
                  <CreditCardIcon className="h-3.5 w-3.5" />
                </div>
                {isOverdue && (
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
                    {t('overdue')}
                  </span>
                )}
              </div>

              <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate mb-1">
                {card.name}
              </p>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-base font-bold text-white font-display truncate">
                  {formatCurrency(currentInvoice?.totalAmount ?? 0)}
                </p>
                {currentInvoice && (
                  <p className="text-[9px] text-muted-foreground/50 font-medium shrink-0 whitespace-nowrap">
                    {formatDateShort(currentInvoice.paymentDate)}
                  </p>
                )}
              </div>
              {!currentInvoice && (
                <p className="text-[9px] text-muted-foreground/50 font-medium mt-1 truncate">
                  {t('noOpenInvoices')}
                </p>
              )}
              {currentInvoice && (
                <p
                  className={cn(
                    'text-[9px] font-semibold mt-1 truncate',
                    hasProjected ? 'text-primary' : 'text-muted-foreground/50 font-medium',
                  )}
                >
                  {hasProjected
                    ? t('projected', { amount: formatCurrency(projectedTotal) })
                    : t('noProjected')}
                </p>
              )}

              {nextInvoice && (
                <p className="text-[9px] font-semibold text-violet-300/70 mt-2.5 pt-2.5 border-t border-white/10 truncate">
                  {t('next', { amount: formatCurrency(nextInvoice.totalAmount) })}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {rows.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3 sm:hidden">
          {rows.map((row, index) => (
            <button
              key={row.card.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={row.card.name}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/20',
              )}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

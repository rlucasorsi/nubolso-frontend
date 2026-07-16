'use client';

import type { CreditCard } from '@/modules/credit-cards/model/api/credit-card';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import { useMemo } from 'react';
import {
  formatCurrency,
  formatDateLong,
  getProjectedCardTemplatesForInvoiceCycle,
  generateVirtualCardInvoiceCycles,
  isVirtualInvoiceId,
  VIRTUAL_INVOICE_PREFIX,
  type RecurringTemplateLike,
  type FlowType,
} from '@/lib/cashflow';
import { MONTH_KEYS, TYPE_CONFIG } from '@/components/painel/config';
import { useGetCardInvoices } from '@/modules/credit-cards/hooks/use-get-card-invoices';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { useGetEntries } from '@/modules/entries/hooks/use-get-entries';
import { cn, localDateStr } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/i18n/useTranslations';

interface CreditCardDetailDrawerProps {
  open: boolean;
  card: CreditCard | null;
  onClose: () => void;
  onEdit: (card: CreditCard) => void;
  onAddPurchase: (cardId: string) => void;
  onSelectInvoice: (invoice: CreditCardInvoice) => void;
}

function getTodayDateString() {
  return localDateStr();
}

export function CreditCardDetailDrawer({
  open,
  card,
  onClose,
  onEdit,
  onAddPurchase,
  onSelectInvoice,
}: CreditCardDetailDrawerProps) {
  const t = useTranslations('creditCardDetail');
  const td = useTranslations('dateNames');
  const { data: invoices, isLoading } = useGetCardInvoices(card?.id, open);
  const { data: templatesData } = useGetRecurringTemplates();
  const { data: entriesData } = useGetEntries();

  const templates = useMemo<RecurringTemplateLike[]>(
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

  if (!card) return null;

  const today = getTodayDateString();
  const cfg = TYPE_CONFIG.expense;

  const sorted = [...(invoices ?? [])].sort(
    (a, b) => a.referenceYear - b.referenceYear || a.referenceMonth - b.referenceMonth,
  );
  const paid = sorted.filter((invoice) => invoice.isPaid).reverse();
  const realUnpaid = sorted.filter((invoice) => !invoice.isPaid);

  // For a card whose only future activity is a linked recurrence, no real invoice
  // exists yet. Synthesize month cards so the projected commitment is visible.
  const virtualInvoices: CreditCardInvoice[] = generateVirtualCardInvoiceCycles(
    card,
    templates,
    existingEntries,
    invoices ?? [],
  ).map((cycle) => ({
    id: `${VIRTUAL_INVOICE_PREFIX}${card.id}:${cycle.referenceYear}-${cycle.referenceMonth}`,
    cardId: card.id,
    cardName: card.name,
    cardIsActive: card.isActive,
    referenceMonth: cycle.referenceMonth,
    referenceYear: cycle.referenceYear,
    closingDate: cycle.closingDate,
    dueDate: cycle.dueDate,
    paymentDate: cycle.paymentDate,
    paymentDateOverridden: false,
    isPaid: false,
    totalAmount: 0,
    installments: [],
    advances: [],
    advancedAmount: 0,
    advancePayments: [],
    purchaseTemplateIds: [],
  }));

  const unpaid = [...realUnpaid, ...virtualInvoices].sort(
    (a, b) => a.referenceYear - b.referenceYear || a.referenceMonth - b.referenceMonth,
  );
  const current = unpaid[0];
  const future = unpaid.slice(1);

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  function InvoiceRowSkeleton() {
    return (
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-2 shrink-0 items-end flex flex-col">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      </div>
    );
  }

  function renderInvoiceRow(invoice: CreditCardInvoice) {
    const isVirtual = isVirtualInvoiceId(invoice.id);
    const isOverdue = !invoice.isPaid && !isVirtual && invoice.paymentDate < today;
    const projected = invoice.isPaid
      ? []
      : getProjectedCardTemplatesForInvoiceCycle(
          templates,
          card!,
          invoice.referenceYear,
          invoice.referenceMonth,
          existingEntries,
          invoice.purchaseTemplateIds ?? [],
        );
    const projectedTotal =
      invoice.totalAmount + projected.reduce((sum, r) => sum + r.estimatedAmount, 0);
    const hasProjection = projected.length > 0;
    const advancedAmount = invoice.advancedAmount ?? 0;
    const remainingAmount = Math.max(invoice.totalAmount - advancedAmount, 0);
    const projectedRemaining = Math.max(projectedTotal - advancedAmount, 0);
    return (
      <button
        key={invoice.id}
        onClick={() => onSelectInvoice(invoice)}
        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('p-2 rounded-xl shrink-0', cfg.bg)}>{cfg.icon('sm')}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {t('invoiceMonth', {
                month: td(MONTH_KEYS[invoice.referenceMonth - 1]),
                year: invoice.referenceYear,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {invoice.isPaid ? t('paidOn') : t('dueOn')} {formatDateLong(invoice.paymentDate)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">
            {formatCurrency(isVirtual ? projectedTotal : remainingAmount)}
          </p>
          {isVirtual ? (
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {t('projected')}
            </span>
          ) : hasProjection ? (
            <p className="text-[11px] font-semibold text-primary">
              {t('projected')} {formatCurrency(projectedRemaining)}
            </p>
          ) : advancedAmount > 0 ? (
            <p className="text-[11px] font-semibold text-muted-foreground">
              {t('advanced')} {formatCurrency(advancedAmount)}
            </p>
          ) : null}
          {invoice.isPaid ? (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
              {t('paid')}
            </span>
          ) : isOverdue ? (
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
              {t('overdue')}
            </span>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader
          onClose={onClose}
          actions={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(card)}
              title={t('editCardTitle')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          }
        >
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {card.name}
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t('closingDay', { day: card.closingDay })} · {t('dueDay', { day: card.dueDay })} ·{' '}
            {t('paymentDay', { day: card.paymentDay })}
          </p>
          <SheetDescription className="sr-only">{card.name}</SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 pb-6 space-y-6 mt-4">
          {!card.isActive && (
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {t('inactive')}
              </p>
            </div>
          )}

          {isLoading ? (
            <>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 ml-1" />
                <InvoiceRowSkeleton />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-32 ml-1" />
                <div className="space-y-2">
                  <InvoiceRowSkeleton />
                  <InvoiceRowSkeleton />
                </div>
              </div>
            </>
          ) : (
            <>
              {current && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    {t('currentInvoice')}
                  </h3>
                  {renderInvoiceRow(current)}
                </div>
              )}

              {future.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    {t('upcomingInvoices')}
                  </h3>
                  <div className="space-y-2">{future.map(renderInvoiceRow)}</div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  {t('history')}
                </h3>
                {paid.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">{t('noInvoices')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">{paid.map(renderInvoiceRow)}</div>
                )}
              </div>
            </>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={() => onAddPurchase(card.id)}
            disabled={!card.isActive}
            className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {t('addPurchase')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

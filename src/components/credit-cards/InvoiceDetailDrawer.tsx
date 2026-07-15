'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Loader2, Plus, RotateCcw, Trash2, FastForward, Undo2, Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateInputField, AmountInputField } from '@/components/ui/form-field';
import { format } from 'date-fns';
import {
  formatCurrency,
  formatDateLong,
  getInvoiceOpeningDate,
  getProjectedCardTemplatesForInvoiceCycle,
  type ProjectedCardTemplate,
  type RecurringTemplateLike,
  type FlowType,
} from '@/lib/cashflow';
import { isVirtualInvoiceId } from '@/lib/cashflow';
import { useLanguage } from '@/i18n/LanguageContext';
import { getDateFnsLocale } from '@/i18n/dateFnsLocale';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import { MONTH_KEYS } from '@/components/painel/config';
import { useGetInvoice } from '@/modules/credit-cards/hooks/use-get-invoice';
import { useGetCardInvoices } from '@/modules/credit-cards/hooks/use-get-card-invoices';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { useGetEntries } from '@/modules/entries/hooks/use-get-entries';
import { useUpdateInvoicePaymentDate } from '@/modules/credit-cards/hooks/use-update-invoice-payment-date';
import { useReopenInvoice } from '@/modules/credit-cards/hooks/use-reopen-invoice';
import { useDeletePurchase } from '@/modules/credit-cards/hooks/use-delete-purchase';
import { useRevertAdvance } from '@/modules/credit-cards/hooks/use-revert-advance';
import { useRealizeRecurringTemplate } from '@/modules/recurring-templates/hooks/use-realize-recurring-template';
import { useSkipRecurringTemplate } from '@/modules/recurring-templates/hooks/use-skip-recurring-template';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { PayInvoiceForm } from './PayInvoiceForm';
import { AddPurchaseDrawer } from './AddPurchaseDrawer';
import { AnticipateInstallmentsDrawer } from './AnticipateInstallmentsDrawer';
import { useTranslations } from '@/i18n/useTranslations';

interface InvoiceDetailDrawerProps {
  invoiceId: string | null;
  // Set when opening a synthesized cycle that has no real backend invoice yet;
  // rendered directly instead of being fetched.
  virtualInvoice?: CreditCardInvoice | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceDetailDrawer({
  invoiceId,
  virtualInvoice,
  open,
  onClose,
}: InvoiceDetailDrawerProps) {
  const t = useTranslations('invoiceDetail');
  const td = useTranslations('dateNames');
  const { locale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale(locale);
  const { data: fetchedInvoice, isLoading } = useGetInvoice(invoiceId ?? undefined, open);
  const invoice = virtualInvoice ?? fetchedInvoice;
  const isVirtual = isVirtualInvoiceId(invoice?.id);
  const { data: cardInvoices } = useGetCardInvoices(isVirtual ? undefined : invoice?.cardId, open);
  const { data: cardsData } = useGetCreditCards();
  const { data: templatesData } = useGetRecurringTemplates();
  const { data: entriesData } = useGetEntries();
  const updatePaymentDateMutation = useUpdateInvoicePaymentDate();
  const reopenMutation = useReopenInvoice();
  const deletePurchaseMutation = useDeletePurchase();
  const revertAdvanceMutation = useRevertAdvance();
  const [paymentDate, setPaymentDate] = useState('');
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [deletePurchaseId, setDeletePurchaseId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [addPurchaseOpen, setAddPurchaseOpen] = useState(false);
  const [anticipateTarget, setAnticipateTarget] = useState<{
    purchaseId: string;
    description: string;
  } | null>(null);
  const [revertError, setRevertError] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) setPaymentDate(invoice.paymentDate);
  }, [invoice]);

  useEffect(() => {
    if (open) {
      setReopenError(null);
      setDeleteError(null);
      setRevertError(null);
    }
  }, [open]);

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  const handleReopen = async () => {
    if (!invoice) return;

    setReopenError(null);
    try {
      await reopenMutation.mutateAsync(invoice.id);
    } catch (err) {
      setReopenError(extractErrorMessage(err, t('reopenError')));
    }
  };

  const handlePaymentDateChange = (date: string) => {
    setPaymentDate(date);
    if (invoice && date && date !== invoice.paymentDate) {
      updatePaymentDateMutation.mutate({ id: invoice.id, paymentDate: date });
    }
  };

  const handleDeletePurchase = async () => {
    if (!deletePurchaseId || !invoice) return;
    setDeleteError(null);
    try {
      await deletePurchaseMutation.mutateAsync({
        purchaseId: deletePurchaseId,
        invoiceId: invoice.id,
        cardId: invoice.cardId,
      });
      setDeletePurchaseId(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('deleteError')));
      setDeletePurchaseId(null);
    }
  };

  type InstallmentGroup = {
    purchaseId: string;
    description: string;
    installments: NonNullable<typeof invoice>['installments'];
    total: number;
    isCredit: boolean;
    displayDate: string;
    createdAt: string;
  };

  const card = useMemo(
    () => (cardsData ?? []).find((c) => c.id === invoice?.cardId),
    [cardsData, invoice],
  );

  const invoiceOpeningDate = useMemo(
    () =>
      card && invoice
        ? getInvoiceOpeningDate(card, invoice.referenceYear, invoice.referenceMonth)
        : undefined,
    [card, invoice],
  );

  const { activeGroups, anticipatedGroups } = useMemo(() => {
    const activeMap = new Map<string, InstallmentGroup>();
    const anticipatedMap = new Map<string, InstallmentGroup>();

    for (const inst of invoice?.installments ?? []) {
      const targetMap = inst.isAnticipated ? anticipatedMap : activeMap;
      const displayDate =
        inst.number === 1 ? inst.purchaseDate : (invoiceOpeningDate ?? inst.purchaseDate);
      if (!targetMap.has(inst.purchaseId)) {
        targetMap.set(inst.purchaseId, {
          purchaseId: inst.purchaseId,
          description: inst.purchaseDescription ?? t('otherPurchase'),
          installments: [],
          total: 0,
          isCredit: inst.isCredit,
          displayDate,
          createdAt: inst.purchaseCreatedAt,
        });
      }
      const g = targetMap.get(inst.purchaseId)!;
      g.installments.push(inst);
      g.total += inst.amount;
    }

    const byDateDesc = (a: InstallmentGroup, b: InstallmentGroup) =>
      b.displayDate.localeCompare(a.displayDate) || b.createdAt.localeCompare(a.createdAt);

    return {
      activeGroups: [...activeMap.values()].sort(byDateDesc),
      anticipatedGroups: [...anticipatedMap.values()].sort(byDateDesc),
    };
  }, [invoice, t, invoiceOpeningDate]);

  // Conta parcelas antecipadas e restantes por purchaseId varrendo TODAS as faturas do cartão.
  // Necessário porque o advance fica na fatura onde foi feita a antecipação, não nas subsequentes.
  // "remaining" = faturas não pagas e não antecipadas com paymentDate DEPOIS da fatura atual.
  const anticipationByPurchase = useMemo(() => {
    const map = new Map<string, { anticipated: number; remaining: number }>();
    if (!cardInvoices || !invoice) return map;

    for (const inv of cardInvoices) {
      for (const inst of inv.installments) {
        if (!map.has(inst.purchaseId)) {
          map.set(inst.purchaseId, { anticipated: 0, remaining: 0 });
        }
        const entry = map.get(inst.purchaseId)!;
        if (inst.isAnticipated) {
          entry.anticipated += 1;
        } else if (!inv.isPaid && inv.paymentDate > invoice.paymentDate) {
          entry.remaining += 1;
        }
      }
    }
    return map;
  }, [cardInvoices, invoice]);

  const formatItemDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return format(date, 'dd MMM', { locale: dateFnsLocale }).toUpperCase();
  };

  const hasFutureInstallments = (group: InstallmentGroup) => {
    const anticipatedGroup = anticipatedGroups.find((g) => g.purchaseId === group.purchaseId);
    const allNums = [
      ...group.installments.map((i) => i.number),
      ...(anticipatedGroup?.installments.map((i) => i.number) ?? []),
    ];
    const maxNumber = allNums.length > 0 ? Math.max(...allNums) : 0;
    const totalCount =
      (group.installments[0] ?? anticipatedGroup?.installments[0])?.totalCount ?? 0;
    return maxNumber < totalCount;
  };

  const isCurrentInvoice = (() => {
    if (!invoice) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const closing = new Date(invoice.closingDate + 'T00:00:00');
    const prevClosing = new Date(closing);
    prevClosing.setMonth(prevClosing.getMonth() - 1);
    // A fatura vigente é a primeira cujo fechamento ainda não ocorreu,
    // ou seja, o fechamento do ciclo anterior já passou.
    return closing >= now && prevClosing < now;
  })();

  // Recorrentes de cartão que ainda vão cair nesta fatura (não lançados).
  // Só faz sentido para faturas em aberto — pagas não recebem mais cobranças.
  const projectedRecurrences = useMemo(() => {
    if (!invoice || invoice.isPaid || !card) return [];

    const templates: RecurringTemplateLike[] = (templatesData ?? []).map((tpl) => ({
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
    }));

    const existingEntries = (entriesData?.data ?? []).map((item) => ({
      id: item.id,
      date: item.date.split('T')[0],
      type: item.type as FlowType,
      amount: item.amount,
      templateId: item.templateId,
    }));

    return getProjectedCardTemplatesForInvoiceCycle(
      templates,
      card,
      invoice.referenceYear,
      invoice.referenceMonth,
      existingEntries,
      invoice.purchaseTemplateIds ?? [],
    );
  }, [invoice, card, templatesData, entriesData]);

  const projectedTotal =
    (invoice?.totalAmount ?? 0) +
    projectedRecurrences.reduce((sum, r) => sum + r.estimatedAmount, 0);
  const hasProjection = !!invoice && !invoice.isPaid && projectedRecurrences.length > 0;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerHeader onClose={onClose}>
            <SheetTitle className="text-xl font-bold font-display text-primary">
              {invoice
                ? t('invoiceMonth', {
                    month: td(MONTH_KEYS[invoice.referenceMonth - 1]),
                    year: invoice.referenceYear,
                  })
                : t('title')}
            </SheetTitle>
            <p className="text-base font-bold text-white">{invoice?.cardName}</p>
            <SheetDescription className="sr-only">{t('title')}</SheetDescription>
          </DrawerHeader>

          {isLoading || !invoice ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex-1 px-6 pb-6 space-y-6 mt-4">
                {hasProjection ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center text-center glass-card rounded-2xl p-5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        {t('currentValue')}
                      </span>
                      <span className="text-2xl font-bold font-display">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center text-center glass-card rounded-2xl p-5 border border-dashed border-primary/30">
                      <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-1">
                        {t('projectedValue')}
                      </span>
                      <span className="text-2xl font-bold font-display text-primary">
                        {formatCurrency(projectedTotal)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center glass-card rounded-2xl p-6">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      {invoice.isPaid ? t('paidAmount') : t('invoiceTotal')}
                    </span>
                    <span className="text-3xl font-bold font-display">
                      {formatCurrency(
                        invoice.isPaid
                          ? (invoice.paidAmount ?? invoice.totalAmount)
                          : invoice.totalAmount,
                      )}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {t('closing')}
                    </span>
                    <p className="text-sm font-bold">{formatDateLong(invoice.closingDate)}</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {t('dueDate')}
                    </span>
                    <p className="text-sm font-bold">{formatDateLong(invoice.dueDate)}</p>
                  </div>
                </div>

                {invoice.isPaid || isVirtual ? (
                  <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {invoice.isPaid ? t('paidOn') : t('paymentDate')}
                    </span>
                    <p className="text-sm font-bold">{formatDateLong(invoice.paymentDate)}</p>
                  </div>
                ) : (
                  <DateInputField
                    label={t('paymentDate')}
                    value={paymentDate}
                    onChange={handlePaymentDateChange}
                  />
                )}

                {hasProjection && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary/80 uppercase tracking-wider">
                      {t('projectedRecurrences')}
                    </h4>
                    {projectedRecurrences.map((rec) => (
                      <ProjectedRecurrenceItem key={rec.templateId} rec={rec} t={t} />
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-display">{t('invoiceItems')}</h3>
                    <button
                      onClick={() => setAddPurchaseOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-bold hover:bg-primary/25 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t('add')}
                    </button>
                  </div>
                  {deleteError && (
                    <p className="text-xs text-destructive font-medium">{deleteError}</p>
                  )}
                  {revertError && (
                    <p className="text-xs text-destructive font-medium">{revertError}</p>
                  )}
                  <div className="space-y-2">
                    {activeGroups.length === 0 ? (
                      <div className="glass-card rounded-2xl p-8 text-center">
                        <p className="text-sm text-muted-foreground">{t('noItems')}</p>
                      </div>
                    ) : (
                      activeGroups.map((group) => (
                        <div
                          key={group.purchaseId}
                          className="glass-card rounded-2xl p-4 space-y-2"
                        >
                          {formatItemDate(group.displayDate) && (
                            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {formatItemDate(group.displayDate)}
                            </span>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="text-sm font-bold truncate">{group.description}</p>
                              {group.isCredit && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400">
                                  {t('creditBadge')}
                                </span>
                              )}
                            </div>
                            {!invoice.isPaid && (
                              <button
                                onClick={() => setDeletePurchaseId(group.purchaseId)}
                                disabled={deletePurchaseMutation.isPending}
                                className="shrink-0 w-7 h-7 rounded-lg bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                title={t('deletePurchase')}
                              >
                                {deletePurchaseMutation.isPending &&
                                deletePurchaseMutation.variables?.purchaseId ===
                                  group.purchaseId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                          {group.installments.map((item) => {
                            const stats = anticipationByPurchase.get(item.purchaseId);
                            const totalAnticipated = stats?.anticipated ?? 0;
                            const remainingOther = stats?.remaining ?? 0;

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs text-muted-foreground"
                              >
                                <span className="flex items-center gap-1.5 flex-wrap">
                                  {t('installment', { n: item.number, total: item.totalCount })}
                                  {totalAnticipated > 0 && remainingOther >= 0 && (
                                    <span className="text-amber-400/80 font-medium">
                                      ·{' '}
                                      {t('anticipatedContext', {
                                        n: totalAnticipated,
                                        remaining: remainingOther,
                                      })}
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`font-bold ${group.isCredit ? 'text-green-400' : 'text-foreground'}`}
                                >
                                  {group.isCredit ? '+' : ''}
                                  {formatCurrency(Math.abs(item.amount))}
                                </span>
                              </div>
                            );
                          })}
                          {!invoice.isPaid && hasFutureInstallments(group) && isCurrentInvoice && (
                            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                              <button
                                type="button"
                                onClick={() =>
                                  setAnticipateTarget({
                                    purchaseId: group.purchaseId,
                                    description: group.description,
                                  })
                                }
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                              >
                                <FastForward className="h-3 w-3" />
                                {t('anticipate')}
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {anticipatedGroups.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t('anticipatedSection')}
                      </h4>
                      {anticipatedGroups.map((group) => (
                        <div
                          key={group.purchaseId}
                          className="glass-card rounded-2xl p-4 space-y-2 opacity-60"
                        >
                          {formatItemDate(group.displayDate) && (
                            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {formatItemDate(group.displayDate)}
                            </span>
                          )}
                          <p className="text-sm font-bold truncate line-through text-muted-foreground">
                            {group.description}
                          </p>
                          {group.installments.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs text-muted-foreground"
                            >
                              <span className="line-through">
                                {t('installment', { n: item.number, total: item.totalCount })}
                              </span>
                              <span className="font-bold line-through">
                                {formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {invoice.advances && invoice.advances.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {t('advancesSection')}
                      </h4>
                      {invoice.advances.map((adv) => (
                        <div key={adv.id} className="glass-card rounded-2xl p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold">
                              {t('advanceSummary', {
                                n: adv.installmentsCount,
                                desc: adv.purchaseDescription ?? '',
                              })}
                            </p>
                            {!invoice.isPaid && (
                              <button
                                type="button"
                                onClick={async () => {
                                  setRevertError(null);
                                  try {
                                    await revertAdvanceMutation.mutateAsync({
                                      advanceId: adv.id,
                                      invoiceId: invoice.id,
                                      cardId: invoice.cardId,
                                    });
                                  } catch (err) {
                                    setRevertError(extractErrorMessage(err, t('revertError')));
                                  }
                                }}
                                disabled={revertAdvanceMutation.isPending}
                                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-muted-foreground text-xs font-bold hover:bg-white/10 hover:text-white transition-colors"
                                title={t('revertAdvance')}
                              >
                                {revertAdvanceMutation.isPending &&
                                revertAdvanceMutation.variables?.advanceId === adv.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Undo2 className="h-3 w-3" />
                                )}
                                {revertAdvanceMutation.isPending &&
                                revertAdvanceMutation.variables?.advanceId === adv.id
                                  ? t('reverting')
                                  : t('revertAdvance')}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span>
                              {t('advanceOriginal')}:{' '}
                              <span className="font-bold text-foreground">
                                {formatCurrency(adv.originalAmount)}
                              </span>
                            </span>
                            <span>
                              {t('advanceSavings')}:{' '}
                              <span className="font-bold text-green-400">
                                {formatCurrency(adv.discount)}
                              </span>
                            </span>
                            <span>
                              {t('advancePaid')}:{' '}
                              <span className="font-bold text-foreground">
                                {formatCurrency(adv.paidAmount)}
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DrawerFooter className="flex-col sm:flex-col gap-3">
                {isVirtual ? (
                  <p className="text-xs text-muted-foreground text-center">{t('projectedNote')}</p>
                ) : invoice.isPaid ? (
                  <>
                    <p className="text-xs text-muted-foreground text-center">{t('paidNote')}</p>
                    <Button
                      variant="outline"
                      onClick={() => setReopenDialogOpen(true)}
                      disabled={reopenMutation.isPending}
                      className="w-full h-11 rounded-xl border-white/10 hover:bg-white/5 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {reopenMutation.isPending ? t('reopening') : t('reopenInvoice')}
                    </Button>
                    {reopenError && (
                      <p className="text-xs text-destructive text-center">{reopenError}</p>
                    )}
                  </>
                ) : (
                  <PayInvoiceForm invoice={invoice} />
                )}
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Sheet>

      <ConfirmDialog
        open={!!deletePurchaseId}
        onOpenChange={(open) => !open && setDeletePurchaseId(null)}
        variant="destructive"
        icon={<Trash2 className="w-8 h-8" />}
        title={t('deleteTitle')}
        description={t('deleteDesc')}
        cancelLabel={t('cancel')}
        actionLabel={t('delete')}
        onAction={handleDeletePurchase}
      />

      <AddPurchaseDrawer
        open={addPurchaseOpen}
        onClose={() => setAddPurchaseOpen(false)}
        cardId={invoice?.cardId ?? null}
      />

      {invoice && anticipateTarget && (
        <AnticipateInstallmentsDrawer
          open={!!anticipateTarget}
          onClose={() => setAnticipateTarget(null)}
          cardId={invoice.cardId}
          invoiceId={invoice.id}
          invoicePaymentDate={invoice.paymentDate}
          purchaseId={anticipateTarget.purchaseId}
          purchaseDescription={anticipateTarget.description}
        />
      )}

      <ConfirmDialog
        open={reopenDialogOpen}
        onOpenChange={setReopenDialogOpen}
        variant="warning"
        icon={<RotateCcw className="w-8 h-8" />}
        title={t('reopenTitle')}
        description={t('reopenDescription')}
        cancelLabel={t('cancel')}
        actionLabel={t('reopen')}
        onAction={handleReopen}
      />
    </>
  );
}

// Recorrência de cartão ainda não lançada nesta fatura, com ações para efetivá-la
// (vira compra na fatura) ou excluí-la do ciclo (skip da ocorrência) — mesmo fluxo
// das recorrências em Pendências.
function ProjectedRecurrenceItem({
  rec,
  t,
}: {
  rec: ProjectedCardTemplate;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [mode, setMode] = useState<'view' | 'realize' | 'exclude'>('view');
  const [amount, setAmount] = useState(rec.estimatedAmount.toFixed(2).replace('.', ','));
  const [error, setError] = useState<string | null>(null);
  const realizeMutation = useRealizeRecurringTemplate();
  const skipMutation = useSkipRecurringTemplate();
  const busy = realizeMutation.isPending || skipMutation.isPending;

  const startRealize = () => {
    setAmount(rec.estimatedAmount.toFixed(2).replace('.', ','));
    setError(null);
    setMode('realize');
  };

  const confirmRealize = async () => {
    setError(null);
    try {
      await realizeMutation.mutateAsync({
        id: rec.templateId,
        amount: parseFloat(amount.replace(',', '.')),
        date: rec.occurrenceDate,
      });
      // O item some da lista quando as queries são revalidadas.
    } catch (err) {
      setError(extractErrorMessage(err, t('confirmRecurrenceError')));
    }
  };

  const confirmExclude = async () => {
    setError(null);
    try {
      await skipMutation.mutateAsync({ id: rec.templateId, date: rec.occurrenceDate });
    } catch (err) {
      setError(extractErrorMessage(err, t('excludeRecurrenceError')));
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-dashed border-primary/25 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{rec.description}</p>
          <p className="text-xs text-muted-foreground">
            {t('recurrenceOnDay', { day: rec.dayOfMonth })}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-primary">
          {formatCurrency(rec.estimatedAmount)}
        </span>
      </div>

      {error && <p className="text-xs text-destructive font-medium">{error}</p>}

      {mode === 'view' && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode('exclude');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-muted-foreground text-xs font-bold hover:bg-white/10 hover:text-white transition-colors"
          >
            <Ban className="h-3 w-3" />
            {t('excludeRecurrence')}
          </button>
          <button
            type="button"
            onClick={startRealize}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15 text-primary text-xs font-bold hover:bg-primary/25 transition-colors"
          >
            <Check className="h-3 w-3" />
            {t('confirmRecurrence')}
          </button>
        </div>
      )}

      {mode === 'realize' && (
        <div className="pt-1 border-t border-white/5 space-y-3">
          <AmountInputField label={t('recurrenceAmount')} value={amount} onChange={setAmount} />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setMode('view')}
              disabled={busy}
              className="h-9 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-semibold disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={confirmRealize}
              disabled={busy}
              className="h-9 px-4 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
            >
              {realizeMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('confirm')}
            </button>
          </div>
        </div>
      )}

      {mode === 'exclude' && (
        <div className="pt-1 border-t border-white/5 space-y-3">
          <p className="text-xs text-muted-foreground/70">{t('excludeRecurrenceHint')}</p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setMode('view')}
              disabled={busy}
              className="h-9 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-semibold disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={confirmExclude}
              disabled={busy}
              className="h-9 px-4 rounded-xl bg-amber-500 text-white hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
            >
              {skipMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('excludeRecurrence')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

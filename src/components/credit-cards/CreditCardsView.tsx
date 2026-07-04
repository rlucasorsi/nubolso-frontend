'use client';

import { useCallback, useMemo, useState } from 'react';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { useGetAllInvoices } from '@/modules/credit-cards/hooks/use-get-all-invoices';
import { useDeleteCreditCard } from '@/modules/credit-cards/hooks/use-delete-credit-card';
import { ServerErrorState } from '@/components/ui/server-error-state';
import type { CreditCard } from '@/modules/credit-cards/model/api/credit-card';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import { isVirtualInvoiceId } from '@/lib/cashflow';
import { CreditCardCard } from '@/components/credit-cards/CreditCardCard';
import { CreditCardDrawer } from '@/components/credit-cards/CreditCardDrawer';
import { CreditCardDetailDrawer } from '@/components/credit-cards/CreditCardDetailDrawer';
import { AddPurchaseDrawer } from '@/components/credit-cards/AddPurchaseDrawer';
import { InvoiceDetailDrawer } from '@/components/credit-cards/InvoiceDetailDrawer';
import { CreditCardsSummary } from '@/components/credit-cards/CreditCardsSummary';
import { AddButton } from '@/components/ui/add-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreditCard as CreditCardIcon } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { usePlan } from '@/modules/billing/hooks/use-plan';
import { UpgradeDrawer } from '@/components/billing/UpgradeDrawer';

export function CreditCardsView() {
  const t = useTranslations('creditCardsView');
  const td = useTranslations('creditCardDetail');
  const cardsQuery = useGetCreditCards();
  const invoicesQuery = useGetAllInvoices();
  const deleteMutation = useDeleteCreditCard();
  const { isFree, limits } = usePlan();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>(undefined);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [addPurchaseCardId, setAddPurchaseCardId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [virtualInvoice, setVirtualInvoice] = useState<CreditCardInvoice | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<CreditCard | null>(null);

  const cards = useMemo(() => cardsQuery.data ?? [], [cardsQuery.data]);
  const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data]);

  const isLoading = cardsQuery.isLoading || invoicesQuery.isLoading;
  const isError = cardsQuery.isError || invoicesQuery.isError;
  const refetchAll = useCallback(
    () => Promise.all([cardsQuery.refetch(), invoicesQuery.refetch()]),
    [cardsQuery, invoicesQuery],
  );

  const detailCard = cards.find((c) => c.id === detailCardId) ?? null;

  const handleNewCard = () => {
    if (isFree && summary.activeCardsCount >= limits.creditCards) {
      setUpgradeOpen(true);
      return;
    }
    setEditingCard(undefined);
    setDrawerOpen(true);
  };

  const handleCardClick = (card: CreditCard) => {
    setDetailCardId(card.id);
  };

  const handleEditFromDetail = (card: CreditCard) => {
    setDetailCardId(null);
    setEditingCard(card);
    setDrawerOpen(true);
  };

  const summary = useMemo(() => {
    const activeCardIds = new Set(cards.filter((c) => c.isActive).map((c) => c.id));
    const activeInvoices = invoices.filter((invoice) => activeCardIds.has(invoice.cardId));

    const unpaidInvoices = activeInvoices.filter((invoice) => !invoice.isPaid);
    const totalOpenInvoices = unpaidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const sortedUnpaid = [...unpaidInvoices].sort((a, b) =>
      a.paymentDate.localeCompare(b.paymentDate),
    );
    const nextDueDate = sortedUnpaid[0]?.paymentDate ?? null;

    // Current invoice = first open invoice at or after today (by referenceYear/Month).
    const now = new Date();
    const todayKey = now.getFullYear() * 12 + now.getMonth();
    const openFuture = unpaidInvoices
      .filter((inv) => inv.referenceYear * 12 + (inv.referenceMonth - 1) >= todayKey)
      .sort(
        (a, b) =>
          a.referenceYear * 12 + a.referenceMonth - (b.referenceYear * 12 + b.referenceMonth),
      );
    const anchor = openFuture[0];
    const currentInvoiceTotal = anchor
      ? invoices
          .filter(
            (inv) =>
              inv.referenceYear === anchor.referenceYear &&
              inv.referenceMonth === anchor.referenceMonth,
          )
          .reduce((sum, inv) => sum + inv.totalAmount, 0)
      : 0;

    return {
      activeCardsCount: activeCardIds.size,
      totalOpenInvoices,
      nextDueDate,
      currentInvoiceTotal,
    };
  }, [cards, invoices]);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isFree && (
            <p className="text-xs text-muted-foreground">
              {summary.activeCardsCount}/{limits.creditCards} cartões
            </p>
          )}
          <AddButton
            onClick={handleNewCard}
            title={t('addCardTitle')}
            label={t('addCard')}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {isError ? (
        <ServerErrorState onRetry={refetchAll} />
      ) : isLoading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[96px] sm:h-[124px] bg-card/50 animate-pulse rounded-base border border-white/5"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[280px] bg-card/50 animate-pulse rounded-2xl border border-white/5"
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <CreditCardsSummary {...summary} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <CreditCardCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
                onDelete={() => setDeletingCard(card)}
              />
            ))}

            <button
              onClick={handleNewCard}
              className="border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-all cursor-pointer min-h-[280px] group"
            >
              <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <CreditCardIcon className="h-6 w-6" />
              </div>
              <span className="font-medium text-sm">{t('addNewCard')}</span>
            </button>
          </div>
        </>
      )}

      <CreditCardDrawer open={drawerOpen} onOpenChange={setDrawerOpen} card={editingCard} />

      <CreditCardDetailDrawer
        open={!!detailCard}
        card={detailCard}
        onClose={() => setDetailCardId(null)}
        onEdit={handleEditFromDetail}
        onAddPurchase={(cardId) => setAddPurchaseCardId(cardId)}
        onSelectInvoice={(invoice) => {
          if (isVirtualInvoiceId(invoice.id)) {
            setVirtualInvoice(invoice);
          } else {
            setSelectedInvoiceId(invoice.id);
          }
        }}
      />

      <AddPurchaseDrawer
        open={!!addPurchaseCardId}
        cardId={addPurchaseCardId}
        onClose={() => setAddPurchaseCardId(null)}
      />

      <InvoiceDetailDrawer
        invoiceId={selectedInvoiceId}
        virtualInvoice={virtualInvoice}
        open={!!selectedInvoiceId || !!virtualInvoice}
        onClose={() => {
          setSelectedInvoiceId(null);
          setVirtualInvoice(null);
        }}
      />

      <UpgradeDrawer
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        featureKey="featureCreditCards"
      />

      <AlertDialog
        open={deletingCard !== null}
        onOpenChange={(open) => !open && setDeletingCard(null)}
      >
        <AlertDialogContent className="bg-card border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{td('removeConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{td('removeDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl border-white/10 hover:bg-white/5"
              onClick={() => setDeletingCard(null)}
            >
              {td('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={async () => {
                if (deletingCard) {
                  await deleteMutation.mutateAsync({ id: deletingCard.id });
                  setDeletingCard(null);
                }
              }}
            >
              {deleteMutation.isPending ? td('removing') : td('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

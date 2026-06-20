'use client';

import { useCallback, useMemo, useState } from 'react';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { useGetAllInvoices } from '@/modules/credit-cards/hooks/use-get-all-invoices';
import { ServerErrorState } from '@/components/ui/server-error-state';
import type { CreditCard } from '@/modules/credit-cards/model/api/credit-card';
import { CreditCardCard } from '@/components/credit-cards/CreditCardCard';
import { CreditCardDrawer } from '@/components/credit-cards/CreditCardDrawer';
import { CreditCardDetailDrawer } from '@/components/credit-cards/CreditCardDetailDrawer';
import { AddPurchaseDrawer } from '@/components/credit-cards/AddPurchaseDrawer';
import { InvoiceDetailDrawer } from '@/components/credit-cards/InvoiceDetailDrawer';
import { CreditCardsSummary } from '@/components/credit-cards/CreditCardsSummary';
import { AddButton } from '@/components/ui/add-button';
import { CreditCard as CreditCardIcon } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';

export function CreditCardsView() {
  const t = useTranslations('creditCardsView');
  const cardsQuery = useGetCreditCards();
  const invoicesQuery = useGetAllInvoices();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>(undefined);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [addPurchaseCardId, setAddPurchaseCardId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

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

    const sortedUnpaid = [...unpaidInvoices].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
    const nextDueDate = sortedUnpaid[0]?.paymentDate ?? null;

    const now = new Date();
    const currentMonthTotal = invoices
      .filter((invoice) => invoice.referenceMonth === now.getMonth() + 1 && invoice.referenceYear === now.getFullYear())
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    return {
      activeCardsCount: activeCardIds.size,
      totalOpenInvoices,
      nextDueDate,
      currentMonthTotal,
    };
  }, [cards, invoices]);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <AddButton
          onClick={handleNewCard}
          title={t('addCardTitle')}
          label={t('addCard')}
          className="w-full sm:w-auto"
        />
      </div>

      {isError ? (
        <ServerErrorState onRetry={refetchAll} />
      ) : isLoading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[124px] bg-card/50 animate-pulse rounded-base border border-white/5" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-h-[280px] bg-card/50 animate-pulse rounded-2xl border border-white/5" />
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

      <CreditCardDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        card={editingCard}
      />

      <CreditCardDetailDrawer
        open={!!detailCard}
        card={detailCard}
        onClose={() => setDetailCardId(null)}
        onEdit={handleEditFromDetail}
        onAddPurchase={(cardId) => setAddPurchaseCardId(cardId)}
        onSelectInvoice={(invoiceId) => setSelectedInvoiceId(invoiceId)}
      />

      <AddPurchaseDrawer
        open={!!addPurchaseCardId}
        cardId={addPurchaseCardId}
        onClose={() => setAddPurchaseCardId(null)}
      />

      <InvoiceDetailDrawer
        invoiceId={selectedInvoiceId}
        open={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </div>
  );
}


'use client';

import { useState } from 'react';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDateLong } from '@/lib/cashflow';
import { MONTH_SHORT, TYPE_CONFIG } from '@/components/painel/config';
import { useGetCardInvoices } from '@/modules/credit-cards/hooks/use-get-card-invoices';
import { useDeleteCreditCard } from '@/modules/credit-cards/hooks/use-delete-credit-card';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CreditCardDetailDrawerProps {
  open: boolean;
  card: CreditCard | null;
  onClose: () => void;
  onEdit: (card: CreditCard) => void;
  onAddPurchase: (cardId: string) => void;
  onSelectInvoice: (invoiceId: string) => void;
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function CreditCardDetailDrawer({
  open,
  card,
  onClose,
  onEdit,
  onAddPurchase,
  onSelectInvoice,
}: CreditCardDetailDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { data: invoices, isLoading } = useGetCardInvoices(card?.id, open);
  const deleteMutation = useDeleteCreditCard();

  if (!card) return null;

  const today = getTodayDateString();
  const cfg = TYPE_CONFIG.expense;

  const sorted = [...(invoices ?? [])].sort(
    (a, b) => a.referenceYear - b.referenceYear || a.referenceMonth - b.referenceMonth,
  );
  const unpaid = sorted.filter((invoice) => !invoice.isPaid);
  const paid = sorted.filter((invoice) => invoice.isPaid).reverse();
  const current = unpaid[0];
  const future = unpaid.slice(1);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setConfirmDelete(false);
      setDeleteError(null);
      onClose();
    }
  };

  const handleDeactivate = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync({ id: card.id });
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, 'Não foi possível remover o cartão'));
    }
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
    const isOverdue = !invoice.isPaid && invoice.paymentDate < today;
    return (
      <button
        key={invoice.id}
        onClick={() => onSelectInvoice(invoice.id)}
        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('p-2 rounded-xl shrink-0', cfg.bg)}>{cfg.icon('sm')}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              Fatura {MONTH_SHORT[invoice.referenceMonth - 1]}/{invoice.referenceYear}
            </p>
            <p className="text-xs text-muted-foreground">
              {invoice.isPaid ? 'Paga em' : 'Vence em'} {formatDateLong(invoice.paymentDate)}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">{formatCurrency(invoice.totalAmount)}</p>
          {invoice.isPaid ? (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Paga</span>
          ) : isOverdue ? (
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Atrasada</span>
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
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(card)} title="Editar cartão">
              <Pencil className="h-4 w-4" />
            </Button>
          }
        >
          <SheetTitle className="text-xl font-bold font-display text-primary">{card.name}</SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Fecha dia {card.closingDay} · Vence dia {card.dueDay} · Paga dia {card.paymentDay}
          </p>
          <SheetDescription className="sr-only">Detalhes do cartão {card.name}</SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 pb-6 space-y-6 mt-4">
          {!card.isActive && (
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cartão Inativo</p>
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
                    Fatura Atual
                  </h3>
                  {renderInvoiceRow(current)}
                </div>
              )}

              {future.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    Próximas Faturas
                  </h3>
                  <div className="space-y-2">{future.map(renderInvoiceRow)}</div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Histórico</h3>
                {paid.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma fatura paga ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">{paid.map(renderInvoiceRow)}</div>
                )}
              </div>
            </>
          )}
        </div>

        <DrawerFooter className="flex-col sm:flex-col gap-3">
          {confirmDelete ? (
            <div className="glass-card rounded-2xl p-4 space-y-4 border border-destructive/30 w-full">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 pt-1.5">
                  <p className="text-sm font-bold text-white tracking-tight">Remover este cartão?</p>
                  <p className="text-xs text-muted-foreground/60 font-medium mt-1">
                    O cartão será desativado e deixará de gerar novas faturas. O histórico de compras e faturas
                    pagas será preservado.
                  </p>
                  {deleteError && (
                    <p className="text-xs text-red-500 font-medium mt-2">{deleteError}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={deleteMutation.isPending}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-xs font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Button
                onClick={() => onAddPurchase(card.id)}
                disabled={!card.isActive}
                className="w-full h-11 bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Adicionar Compra
              </Button>

              {card.isActive && (
                <button
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmDelete(true);
                  }}
                  className="w-full h-11 rounded-xl border border-destructive/20 text-destructive font-bold text-sm hover:bg-destructive/10 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover Cartão
                </button>
              )}
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

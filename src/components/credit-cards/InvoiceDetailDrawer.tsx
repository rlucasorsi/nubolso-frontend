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
import { Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { DateInputField } from '@/components/ui/form-field';
import { formatCurrency, formatDateLong } from '@/lib/cashflow';
import { MONTH_SHORT } from '@/components/painel/config';
import { useGetInvoice } from '@/modules/credit-cards/hooks/use-get-invoice';
import { useUpdateInvoicePaymentDate } from '@/modules/credit-cards/hooks/use-update-invoice-payment-date';
import { useReopenInvoice } from '@/modules/credit-cards/hooks/use-reopen-invoice';
import { useDeletePurchase } from '@/modules/credit-cards/hooks/use-delete-purchase';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { PayInvoiceForm } from './PayInvoiceForm';
import { AddPurchaseDrawer } from './AddPurchaseDrawer';

interface InvoiceDetailDrawerProps {
  invoiceId: string | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceDetailDrawer({ invoiceId, open, onClose }: InvoiceDetailDrawerProps) {
  const { data: invoice, isLoading } = useGetInvoice(invoiceId ?? undefined, open);
  const updatePaymentDateMutation = useUpdateInvoicePaymentDate();
  const reopenMutation = useReopenInvoice();
  const deletePurchaseMutation = useDeletePurchase();
  const [paymentDate, setPaymentDate] = useState('');
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [deletePurchaseId, setDeletePurchaseId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [addPurchaseOpen, setAddPurchaseOpen] = useState(false);

  useEffect(() => {
    if (invoice) setPaymentDate(invoice.paymentDate);
  }, [invoice]);

  useEffect(() => {
    if (open) {
      setReopenError(null);
      setDeleteError(null);
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
      setReopenError(extractErrorMessage(err, 'Não foi possível reabrir a fatura'));
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
      setDeleteError(extractErrorMessage(err, 'Não foi possível excluir a compra'));
      setDeletePurchaseId(null);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, { purchaseId: string; description: string; installments: typeof invoice.installments; total: number }>();
    for (const inst of invoice?.installments ?? []) {
      if (!map.has(inst.purchaseId)) {
        map.set(inst.purchaseId, { purchaseId: inst.purchaseId, description: inst.purchaseDescription ?? 'Outros', installments: [], total: 0 });
      }
      const g = map.get(inst.purchaseId)!;
      g.installments.push(inst);
      g.total += inst.amount;
    }
    return [...map.values()];
  }, [invoice?.installments]);

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerHeader onClose={onClose}>
            <SheetTitle className="text-xl font-bold font-display text-primary">
              {invoice ? `Fatura ${MONTH_SHORT[invoice.referenceMonth - 1]}/${invoice.referenceYear}` : 'Fatura'}
            </SheetTitle>
            <p className="text-base font-bold text-white">{invoice?.cardName}</p>
            <SheetDescription className="sr-only">Detalhes da fatura</SheetDescription>
          </DrawerHeader>

          {isLoading || !invoice ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex-1 px-6 pb-6 space-y-6 mt-4">
                <div className="flex flex-col items-center text-center glass-card rounded-2xl p-6">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    {invoice.isPaid ? 'Valor Pago' : 'Total da Fatura'}
                  </span>
                  <span className="text-3xl font-bold font-display">
                    {formatCurrency(invoice.isPaid ? invoice.paidAmount ?? invoice.totalAmount : invoice.totalAmount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Fechamento
                    </span>
                    <p className="text-sm font-bold">{formatDateLong(invoice.closingDate)}</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Vencimento
                    </span>
                    <p className="text-sm font-bold">{formatDateLong(invoice.dueDate)}</p>
                  </div>
                </div>

                {invoice.isPaid ? (
                  <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Pago em
                    </span>
                    <p className="text-sm font-bold">{formatDateLong(invoice.paymentDate)}</p>
                  </div>
                ) : (
                  <DateInputField label="Data de Pagamento" value={paymentDate} onChange={handlePaymentDateChange} />
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-display">Itens da Fatura</h3>
                    <button
                      onClick={() => setAddPurchaseOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-bold hover:bg-primary/25 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </button>
                  </div>
                  {deleteError && (
                    <p className="text-xs text-destructive font-medium">{deleteError}</p>
                  )}
                  <div className="space-y-2">
                    {groups.length === 0 ? (
                      <div className="glass-card rounded-2xl p-8 text-center">
                        <p className="text-sm text-muted-foreground">Nenhum item nesta fatura.</p>
                      </div>
                    ) : (
                      groups.map((group) => (
                        <div key={group.purchaseId} className="glass-card rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold truncate">{group.description}</p>
                            {!invoice.isPaid && (
                              <button
                                onClick={() => setDeletePurchaseId(group.purchaseId)}
                                disabled={deletePurchaseMutation.isPending}
                                className="shrink-0 w-7 h-7 rounded-lg bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                title="Excluir compra"
                              >
                                {deletePurchaseMutation.isPending && deletePurchaseMutation.variables?.purchaseId === group.purchaseId
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                          {group.installments.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Parcela {item.number}/{item.totalCount}</span>
                              <span className="font-bold text-foreground">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <DrawerFooter className="flex-col sm:flex-col gap-3">
                {invoice.isPaid ? (
                  <>
                    <p className="text-xs text-muted-foreground text-center">
                      Esta fatura já foi paga. Para alterar o valor, reabra a fatura.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setReopenDialogOpen(true)}
                      disabled={reopenMutation.isPending}
                      className="w-full h-11 rounded-xl border-white/10 hover:bg-white/5 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {reopenMutation.isPending ? 'Reabrindo...' : 'Reabrir Fatura'}
                    </Button>
                    {reopenError && <p className="text-xs text-destructive text-center">{reopenError}</p>}
                  </>
                ) : (
                  <PayInvoiceForm invoice={invoice} />
                )}
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Sheet>

      <AlertDialog open={!!deletePurchaseId} onOpenChange={(open) => !open && setDeletePurchaseId(null)}>
        <AlertDialogContent className="bg-[#1c1a24] border-white/10 rounded-[2rem] p-8 max-w-[400px]">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center mx-auto mb-2 text-red-500">
              <Trash2 className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-black font-display text-white text-center">
              Excluir Compra?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center text-sm font-medium">
              Todas as parcelas desta compra serão removidas de todas as faturas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-2xl bg-white/5 border-none text-white hover:bg-white/10 transition-all font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePurchase}
              className="flex-1 h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all font-bold shadow-lg shadow-red-500/20"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddPurchaseDrawer
        open={addPurchaseOpen}
        onClose={() => setAddPurchaseOpen(false)}
        cardId={invoice?.cardId ?? null}
      />

      <AlertDialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <AlertDialogContent className="bg-[#1c1a24] border-white/10 rounded-[2rem] p-8 max-w-[400px]">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center mx-auto mb-2 text-amber-500">
              <RotateCcw className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-black font-display text-white text-center">
              Reabrir Fatura?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center text-sm font-medium">
              O pagamento será revertido e o lançamento será removido do fluxo de caixa. A fatura voltará a aparecer
              como pendente e você poderá registrar o pagamento com um novo valor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-2xl bg-white/5 border-none text-white hover:bg-white/10 transition-all font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReopen}
              className="flex-1 h-12 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-all font-bold shadow-lg shadow-amber-500/20"
            >
              Reabrir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

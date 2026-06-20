'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownLeft, CircleDollarSign, AlertTriangle, CopyCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ServerErrorState } from '@/components/ui/server-error-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/cashflow';
import { TYPE_CONFIG } from '@/components/painel/config';
import { useGetImportBatch } from '@/modules/imports/hooks/use-get-import-batch';
import { useConfirmImport } from '@/modules/imports/hooks/use-confirm-import';
import { useCancelImport } from '@/modules/imports/hooks/use-cancel-import';
import type { ImportBatchDetail, ImportItemDecision } from '@/modules/imports/model/api/ofx-import';

const TYPE_ICON: Record<string, React.ReactNode> = {
  INCOME: <ArrowUpRight className="h-4 w-4" />,
  EXPENSE: <ArrowDownLeft className="h-4 w-4" />,
  SPENDING: <CircleDollarSign className="h-4 w-4" />,
};

function typeConfigFor(type: string) {
  const key = type.toLowerCase() as keyof typeof TYPE_CONFIG;
  return TYPE_CONFIG[key] ?? TYPE_CONFIG.spending;
}

interface ImportReviewStepProps {
  batchId: string;
  onConfirmed: (batch: ImportBatchDetail) => void;
  onCanceled: () => void;
  onBack: () => void;
}

export function ImportReviewStep({ batchId, onConfirmed, onCanceled, onBack }: ImportReviewStepProps) {
  const { data: batch, isLoading, isError, refetch } = useGetImportBatch(batchId);
  const confirmImport = useConfirmImport();
  const cancelImport = useCancelImport();

  const [decisions, setDecisions] = useState<Record<string, ImportItemDecision>>({});

  useEffect(() => {
    if (!batch) return;
    setDecisions((prev) => {
      const next = { ...prev };
      for (const item of batch.items) {
        if (next[item.id] === undefined && item.status !== 'DUPLICATE_EXACT') {
          next[item.id] = item.decision ?? (item.status === 'POSSIBLE_DUPLICATE' ? 'SKIP' : 'IMPORT');
        }
      }
      return next;
    });
  }, [batch]);

  const reviewableItems = useMemo(() => (batch?.items ?? []).filter((i) => i.status !== 'DUPLICATE_EXACT'), [batch]);
  const importCount = useMemo(
    () => reviewableItems.filter((i) => decisions[i.id] === 'IMPORT').length,
    [reviewableItems, decisions],
  );

  function toggle(itemId: string, checked: boolean) {
    setDecisions((prev) => ({ ...prev, [itemId]: checked ? 'IMPORT' : 'SKIP' }));
  }

  async function handleConfirm() {
    if (!batch) return;
    try {
      const result = await confirmImport.mutateAsync({
        id: batch.id,
        data: {
          decisions: reviewableItems.map((item) => ({ itemId: item.id, action: decisions[item.id] ?? 'SKIP' })),
        },
      });
      onConfirmed(result);
    } catch {
      // erro já sinalizado via estado da mutação (confirmImport.isError)
    }
  }

  async function handleCancel() {
    if (!batch) return;
    try {
      await cancelImport.mutateAsync(batch.id);
      onCanceled();
    } catch {
      // erro já sinalizado via estado da mutação (cancelImport.isError)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 px-6 py-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 w-full bg-card/50 animate-pulse rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (isError || !batch) {
    return <ServerErrorState onRetry={refetch} />;
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/10 text-muted-foreground gap-1.5">
            {batch.totalCount} transações
          </Badge>
          {batch.duplicateExactCount > 0 && (
            <Badge variant="outline" className="border-white/10 text-muted-foreground gap-1.5">
              <CopyCheck className="h-3 w-3" />
              {batch.duplicateExactCount} já importadas
            </Badge>
          )}
          {batch.possibleDuplicateCount > 0 && (
            <Badge variant="outline" className="border-amber-400/30 text-amber-400 bg-amber-400/10 gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              {batch.possibleDuplicateCount} possíveis duplicadas
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Desmarque os itens que não devem ser importados. Transações já importadas anteriormente são ignoradas automaticamente.
        </p>

        <div className="space-y-2">
          {batch.items.map((item) => {
            const cfg = typeConfigFor(item.type);
            const isExactDuplicate = item.status === 'DUPLICATE_EXACT';
            const checked = isExactDuplicate ? false : decisions[item.id] === 'IMPORT';

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3 transition-colors',
                  isExactDuplicate ? 'border-white/5 bg-white/[0.02] opacity-50' : 'border-white/5 bg-card/40',
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={isExactDuplicate}
                  onCheckedChange={(value) => toggle(item.id, value === true)}
                />

                <div className={cn('p-2 rounded-xl', cfg.bg)}>{TYPE_ICON[item.type]}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{item.description || cfg.label}</p>
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.date.split('T')[0] + 'T12:00:00'), 'dd MMM yy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className={cn('text-sm font-bold', cfg.color)}>
                      {cfg.sign} {formatCurrency(item.amount)}
                    </p>
                    {isExactDuplicate ? (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">
                        Já importada
                      </span>
                    ) : item.status === 'POSSIBLE_DUPLICATE' ? (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400">
                        Possível duplicada
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-border/10 mt-auto sticky bottom-0 z-10 bg-card flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{importCount} de {reviewableItems.length} serão importadas</span>
          <button type="button" onClick={onBack} className="font-medium hover:text-foreground transition-colors">
            Voltar
          </button>
        </div>

        {confirmImport.isError && (
          <p className="text-xs font-medium text-destructive px-1">
            {(confirmImport.error as Error)?.message ?? 'Não foi possível confirmar a importação'}
          </p>
        )}

        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5" disabled={cancelImport.isPending}>
                Cancelar importação
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar esta importação?</AlertDialogTitle>
                <AlertDialogDescription>
                  Nenhuma transação será criada e este lote ficará marcado como cancelado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>Cancelar importação</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
            onClick={handleConfirm}
            disabled={confirmImport.isPending}
          >
            {confirmImport.isPending ? 'Confirmando...' : `Importar ${importCount}`}
          </Button>
        </div>
      </div>
    </>
  );
}

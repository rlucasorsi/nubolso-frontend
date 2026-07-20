'use client';

import { useState } from 'react';
import { useGetInvestments } from '@/modules/investments/hooks/use-get-investments';
import { ServerErrorState } from '@/components/ui/server-error-state';
import { useCreateInvestment } from '@/modules/investments/hooks/use-create-investment';
import { useUpdateInvestment } from '@/modules/investments/hooks/use-update-investment';
import { useDeleteInvestment } from '@/modules/investments/hooks/use-delete-investment';
import { useAddInvestmentMovement } from '@/modules/investments/hooks/use-add-investment-movement';
import { useInvestmentQuotesMap } from '@/modules/investments/hooks/use-investment-quotes-map';
import type {
  Investment,
  InvestmentMovementType,
} from '@/modules/investments/model/api/investment';
import { InvestmentCard } from '@/components/investments/InvestmentCard';
import { InvestmentDetailDrawer } from '@/components/investments/InvestmentDetailDrawer';
import { CreateInvestmentDrawer } from '@/components/investments/CreateInvestmentDrawer';
import { EditInvestmentDrawer } from '@/components/investments/EditInvestmentDrawer';
import { AddMovementDrawer } from '@/components/investments/AddMovementDrawer';
import { InvestmentsSummary } from '@/components/investments/InvestmentsSummary';
import {
  formatCurrency,
  getDividendsTotal,
  getFixedCategorySummary,
  getVariableCategorySummary,
  getVariableResult,
  groupInvestments,
  isVariableIncome,
  type InvestmentGroup,
} from '@/components/investments/investment-helpers';
import {
  clearInvestmentSharePositions,
  setMovementSharePosition,
} from '@/lib/investmentShareLedger';
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
import { cn } from '@/lib/utils';
import { ChevronDown, Wallet } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';

export function InvestmentsView() {
  const t = useTranslations('investmentsView');
  const ti = useTranslations('investmentCard');
  const tc = useTranslations('createInvestmentDrawer');
  const investmentsQuery = useGetInvestments();
  const createInvestmentMutation = useCreateInvestment();
  const updateInvestmentMutation = useUpdateInvestment();
  const deleteInvestmentMutation = useDeleteInvestment();
  const addMovementMutation = useAddInvestmentMovement();

  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [movementInvestment, setMovementInvestment] = useState<Investment | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null);
  const [groupByInstitutionOn, setGroupByInstitutionOn] = useState(false);
  const [fixedCollapsed, setFixedCollapsed] = useState(false);
  const [variableCollapsed, setVariableCollapsed] = useState(false);

  const investments = investmentsQuery.data ?? [];
  const isLoading = investmentsQuery.isLoading;
  const isError = investmentsQuery.isError;

  const handleCreateInvestment = async (data: {
    name: string;
    type: Investment['type'];
    ticker?: string;
    cdiPercentage?: number;
    institution: string;
  }) => {
    const created = await createInvestmentMutation.mutateAsync(data);
    setShowCreateDrawer(false);
    // Sem valor inicial na criação — leva direto pro fluxo de aporte, já
    // que o investimento nasce sem saldo.
    setMovementInvestment(created);
  };

  const handleUpdateInvestment = async (data: {
    name: string;
    institution: string;
    ticker?: string;
    cdiPercentage?: number;
  }) => {
    if (!editingInvestment) return;
    const updated = await updateInvestmentMutation.mutateAsync({
      id: editingInvestment.id,
      ...data,
    });
    if (selectedInvestment?.id === updated.id) {
      setSelectedInvestment(updated);
    }
    setEditingInvestment(null);
  };

  const handleAddMovement = async (
    investmentId: string,
    type: InvestmentMovementType,
    amount: number,
    date: string,
    shareInfo?: { quantity: number; pricePerShare: number },
  ) => {
    const previousIds = new Set((movementInvestment?.movements ?? []).map((m) => m.id));
    const updated = await addMovementMutation.mutateAsync({
      investmentId,
      type,
      amount,
      date,
      ...(shareInfo && shareInfo.quantity > 0 && shareInfo.pricePerShare > 0
        ? { shareQuantity: shareInfo.quantity, pricePerShare: shareInfo.pricePerShare }
        : {}),
    });

    // Mantém localStorage como cache local para acesso offline/imediato,
    // mesmo com os dados já persistidos no backend.
    if (shareInfo && shareInfo.quantity > 0 && shareInfo.pricePerShare > 0) {
      const newMovement = updated.movements.find((m) => !previousIds.has(m.id));
      if (newMovement) {
        setMovementSharePosition(
          investmentId,
          newMovement.id,
          shareInfo.quantity,
          shareInfo.pricePerShare,
        );
      }
    }

    if (selectedInvestment?.id === investmentId) {
      setSelectedInvestment(updated);
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    await deleteInvestmentMutation.mutateAsync({ id: investmentId });
    clearInvestmentSharePositions(investmentId);
    setShowDetailDrawer(false);
    setSelectedInvestment(null);
  };

  const handleInvestmentClick = (investment: Investment) => {
    setSelectedInvestment(investment);
    setShowDetailDrawer(true);
  };

  const handleAddMovementFromDetail = (investment: Investment) => {
    setShowDetailDrawer(false);
    setMovementInvestment(investment);
  };

  const institutionOptions = Array.from(
    new Set(
      investments
        .map((inv) => inv.institution)
        .filter((v): v is string => !!v && v.trim() !== ''),
    ),
  ).sort((a, b) => a.localeCompare(b));

  // Renda fixa e renda variável têm estruturas de card bem diferentes (a
  // primeira é enxuta, a segunda tem posição/mercado/resultado) — misturadas
  // no mesmo grid, as linhas ficam com alturas desiguais e desalinhadas.
  // Por isso a listagem sempre separa as duas categorias em grids próprios.
  const fixedInvestments = investments.filter((inv) => !isVariableIncome(inv.type));
  const variableInvestments = investments.filter((inv) => isVariableIncome(inv.type));
  const fixedBalance = fixedInvestments.reduce((s, inv) => s + inv.currentBalance, 0);

  // Preços ao vivo pra que o rendimento de renda variável (ganho/perda de
  // mercado, não só YIELD/ADJUSTMENT manual) entre no total — mesmo cálculo
  // usado em cada card (VariableInvestmentSummary).
  const { pricesByTicker, isLoading: isQuotesLoading } = useInvestmentQuotesMap(
    variableInvestments.map((inv) => inv.ticker),
  );
  // Enquanto as cotações ainda não resolveram, rendimento/proventos/totais de
  // renda variável ficariam mudando de valor à medida que cada uma chega —
  // melhor mostrar o esqueleto até tudo estabilizar.
  const showLoadingState = isLoading || isQuotesLoading;

  // Valor de mercado (quantidade x cotação atual), não o saldo bruto do
  // backend — senão o total da categoria não acompanha a cotação em tempo
  // real, como cada card já faz via getVariableResult.
  const variableBalance = variableInvestments.reduce((s, inv) => {
    const currentPrice = inv.ticker ? (pricesByTicker[inv.ticker] ?? null) : null;
    return s + getVariableResult(inv, currentPrice).totalValue;
  }, 0);
  const totalBalance = fixedBalance + variableBalance;

  const fixedSummary = getFixedCategorySummary(fixedInvestments);
  const variableSummary = getVariableCategorySummary(variableInvestments, pricesByTicker);
  const totalYield = fixedSummary.yieldTotal + variableSummary.yieldTotal;
  const totalContributed = fixedSummary.investedTotal + variableSummary.investedTotal;
  const totalDividends = investments.reduce((s, inv) => s + getDividendsTotal(inv), 0);

  const groupModeArg = groupByInstitutionOn ? 'institution' : 'none';
  const fixedGroups = groupInvestments(fixedInvestments, groupModeArg, t('noInstitution'));
  const variableGroups = groupInvestments(variableInvestments, groupModeArg, t('noInstitution'));

  const renderInvestmentGrid = (items: Investment[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((investment) => (
        <InvestmentCard
          key={investment.id}
          investment={investment}
          onClick={() => handleInvestmentClick(investment)}
          onAddMovement={() => setMovementInvestment(investment)}
          onEdit={() => setEditingInvestment(investment)}
          onDelete={() => setDeletingInvestment(investment)}
        />
      ))}
    </div>
  );

  const renderCategorySection = (
    title: string,
    items: Investment[],
    groups: InvestmentGroup[],
    totalValue: number,
    yieldTotal: number,
    yieldPercent: number | null,
    collapsed: boolean,
    onToggle: () => void,
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                collapsed && '-rotate-90',
              )}
            />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h2>
            <span className="text-xs text-muted-foreground">({items.length})</span>
          </div>
          <span className="flex flex-col items-end">
            <span className="text-sm font-bold text-foreground">{formatCurrency(totalValue)}</span>
            {yieldPercent !== null && (
              <span
                className={cn(
                  'text-xs font-bold whitespace-nowrap',
                  yieldPercent >= 0 ? 'text-success' : 'text-destructive',
                )}
              >
                {yieldTotal >= 0 ? '+' : ''}
                {formatCurrency(yieldTotal)} ({yieldPercent >= 0 ? '+' : ''}
                {yieldPercent.toFixed(2)}%)
              </span>
            )}
          </span>
        </button>

        {!collapsed &&
          (groupByInstitutionOn ? (
            <div className="space-y-6 pl-1">
              {groups.map((group) => (
                <div key={group.key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">({group.items.length})</span>
                  </div>
                  {renderInvestmentGrid(group.items)}
                </div>
              ))}
            </div>
          ) : (
            renderInvestmentGrid(items)
          ))}
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <AddButton
          onClick={() => setShowCreateDrawer(true)}
          title={t('addInvestmentTitle')}
          label={t('addInvestment')}
          className="w-full sm:w-auto"
        />
      </div>

      {isError ? (
        <ServerErrorState onRetry={() => investmentsQuery.refetch()} />
      ) : showLoadingState ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[124px] bg-card/50 animate-pulse rounded-base border border-white/5"
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
          <InvestmentsSummary
            totalBalance={totalBalance}
            totalYield={totalYield}
            totalContributed={totalContributed}
            totalDividends={totalDividends}
            fixedBalance={fixedBalance}
            variableBalance={variableBalance}
            count={investments.length}
          />

          {investments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t('groupBy')}
              </span>
              <div className="flex gap-1 bg-surface-container border border-white/5 rounded-xl p-1">
                {([false, true] as const).map((on) => (
                  <button
                    key={String(on)}
                    type="button"
                    onClick={() => setGroupByInstitutionOn(on)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      groupByInstitutionOn === on
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-white/5',
                    )}
                  >
                    {on ? t('groupByInstitution') : t('groupByNone')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {renderCategorySection(
              tc('fixedIncome'),
              fixedInvestments,
              fixedGroups,
              fixedBalance,
              fixedSummary.yieldTotal,
              fixedSummary.yieldPercent,
              fixedCollapsed,
              () => setFixedCollapsed((c) => !c),
            )}
            {renderCategorySection(
              tc('variableIncome'),
              variableInvestments,
              variableGroups,
              variableBalance,
              variableSummary.yieldTotal,
              variableSummary.yieldPercent,
              variableCollapsed,
              () => setVariableCollapsed((c) => !c),
            )}

            <button
              onClick={() => setShowCreateDrawer(true)}
              className="w-full border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-all cursor-pointer min-h-[120px] group"
            >
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm">{t('createNew')}</span>
            </button>
          </div>
        </>
      )}

      <CreateInvestmentDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateInvestment}
        isLoading={createInvestmentMutation.isPending}
        institutionOptions={institutionOptions}
      />

      <EditInvestmentDrawer
        open={!!editingInvestment}
        investment={editingInvestment}
        onClose={() => setEditingInvestment(null)}
        onSubmit={handleUpdateInvestment}
        isLoading={updateInvestmentMutation.isPending}
        institutionOptions={institutionOptions}
      />

      <InvestmentDetailDrawer
        open={showDetailDrawer}
        investment={selectedInvestment}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedInvestment(null);
        }}
        onAddMovement={handleAddMovementFromDetail}
        onMovementRemoved={setSelectedInvestment}
      />

      <AddMovementDrawer
        open={!!movementInvestment}
        investment={movementInvestment}
        onClose={() => setMovementInvestment(null)}
        onSubmit={handleAddMovement}
        isLoading={addMovementMutation.isPending}
      />

      <AlertDialog
        open={deletingInvestment !== null}
        onOpenChange={(open) => !open && setDeletingInvestment(null)}
      >
        <AlertDialogContent className="bg-card border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{ti('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{ti('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl border-white/10 hover:bg-white/5"
              onClick={() => setDeletingInvestment(null)}
            >
              {ti('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteInvestmentMutation.isPending}
              onClick={() => {
                if (deletingInvestment) {
                  handleDeleteInvestment(deletingInvestment.id).then(() =>
                    setDeletingInvestment(null),
                  );
                }
              }}
            >
              {ti('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

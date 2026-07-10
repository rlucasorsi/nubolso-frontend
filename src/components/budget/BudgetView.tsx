'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Wallet,
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  CheckCircle2,
  Clock,
  Ban,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCashFlow } from '@/hooks/useCashFlow';
import { useGetCategories } from '@/modules/categories/hooks/use-get-categories';
import { useGetCategoryBudgets } from '@/modules/category-budgets/hooks/use-get-category-budgets';
import { useIncomeBaseConfig } from '@/hooks/useIncomeBaseConfig';
import { CashFlowEntry, FlowType, formatCurrency } from '@/lib/cashflow';
import {
  entriesInPeriod,
  getCategorySpent,
  getCommittedTotals,
  getRecurringEntriesInPeriod,
  getInvoiceGroups,
  getBudgetStatus,
  BudgetStatus,
  InvoiceGroup,
} from '@/lib/budget';
import { cn, localDateStr } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { IncomeBaseCard } from '@/components/painel/CategoryCharts';
import { CategoryEntriesDrawer } from '@/components/painel/CategoryEntriesDrawer';
import { EditEntryDrawer } from '@/components/painel/EditEntryDrawer';
import { PeriodNav } from '@/components/painel/PeriodNav';
import { CategoryDrawer } from '@/components/categories/CategoryDrawer';
import { BudgetAmountDrawer } from './BudgetAmountDrawer';
import { AddCategoryBudgetDrawer } from './AddCategoryBudgetDrawer';
import { CategoryIcon } from '@/components/categories/category-icons';
import { Category } from '@/modules/categories/service/categories-service';
import { CategoryBudget } from '@/modules/category-budgets/service/category-budgets-service';
import { ServerErrorState } from '@/components/ui/server-error-state';

// Mesmo critério de edição usado em CategoryEntriesDrawer.tsx — só lançamento
// real (não estimativa, não fatura, não ignorado) pode ser editado direto.
function isEditableEntry(e: CashFlowEntry): boolean {
  return !e.isVirtual && !e.creditCardInvoiceId && !e.isSkipped;
}

const STATUS_COLORS: Record<BudgetStatus, { text: string; bar: string }> = {
  ok: { text: 'text-emerald-500', bar: '#10b981' },
  warning: { text: 'text-amber-400', bar: '#f59e0b' },
  danger: { text: 'text-red-500', bar: '#ef4444' },
  progress: { text: 'text-blue-400', bar: '#3b82f6' },
};

// Categorias de receita nunca têm orçamento (é a base de entrada, não um limite
// de gasto) — só despesa e investimento aparecem no fluxo de "adicionar orçamento".
const BUDGETABLE_TYPES: FlowType[] = ['expense', 'investment'];

export function BudgetView() {
  const t = useTranslations('budget');
  const {
    entries,
    virtualEntries,
    periods,
    isLoading: isCashFlowLoading,
    isError,
    refetchAll,
  } = useCashFlow();
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  const [budgetDrawerCategory, setBudgetDrawerCategory] = useState<Category | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashFlowEntry | null>(null);
  const [invoiceDrawerGroup, setInvoiceDrawerGroup] = useState<InvoiceGroup | null>(null);

  const today = localDateStr();
  const [periodIdx, setPeriodIdx] = useState(0);
  const userNavigatedRef = useRef(false);

  const findTodayPeriodIdx = useCallback(() => {
    const idx = periods.findIndex((p) => p.startDate <= today && p.endDate >= today);
    return idx >= 0 ? idx : 0;
  }, [periods, today]);

  useEffect(() => {
    if (!userNavigatedRef.current) {
      setPeriodIdx(findTodayPeriodIdx());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods]);

  const period = periods[periodIdx];
  const isCurrentPeriod = period ? period.startDate <= today && period.endDate >= today : false;

  const handlePrev = () => {
    userNavigatedRef.current = true;
    setPeriodIdx((i) => Math.max(0, i - 1));
  };
  const handleNext = () => {
    userNavigatedRef.current = true;
    setPeriodIdx((i) => Math.min(periods.length - 1, i + 1));
  };
  const handleToday = () => {
    userNavigatedRef.current = true;
    setPeriodIdx(findTodayPeriodIdx());
  };

  const { data: categoryBudgets, isLoading: isBudgetsLoading } = useGetCategoryBudgets(
    period?.startDate ?? '',
  );

  const { overrides, setEntryOverride, manualValue, setManualValue } = useIncomeBaseConfig(
    period?.startDate ?? today,
  );

  const catMap = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);

  const periodEntries = useMemo(
    () => (period ? entriesInPeriod(entries, virtualEntries, period) : []),
    [entries, virtualEntries, period],
  );
  const incomeEntries = useMemo(
    () => periodEntries.filter((e) => e.type === 'income'),
    [periodEntries],
  );
  const entryCounts = useCallback(
    (e: (typeof periodEntries)[number]) => {
      if (e.id in overrides) return overrides[e.id];
      return e.categoryId ? catMap.get(e.categoryId)?.includeInBalanceBase !== false : true;
    },
    [overrides, catMap],
  );
  const isManualBase = manualValue !== null;
  const baseIncome = isManualBase
    ? (manualValue as number)
    : incomeEntries.filter(entryCounts).reduce((sum, e) => sum + e.amount, 0);

  // Orçamento é escopado ao período selecionado — sem repetir automaticamente
  // o valor de períodos anteriores.
  const budgetByCategoryId = useMemo(
    () => new Map((categoryBudgets ?? []).map((b) => [b.categoryId, b])),
    [categoryBudgets],
  );
  const budgetedCategories = useMemo(
    () => (categories ?? []).filter((c) => budgetByCategoryId.has(c.id)),
    [categories, budgetByCategoryId],
  );
  const unbudgetedCategories = useMemo(
    () =>
      (categories ?? []).filter(
        (c) => BUDGETABLE_TYPES.includes(c.type) && !budgetByCategoryId.has(c.id),
      ),
    [categories, budgetByCategoryId],
  );
  const budgetedCategoryIds = useMemo(
    () => new Set(budgetByCategoryId.keys()),
    [budgetByCategoryId],
  );

  const committed = useMemo(
    () =>
      period
        ? getCommittedTotals(entries, virtualEntries, period, budgetedCategoryIds)
        : {
            recurring: 0,
            recurringRealized: 0,
            recurringPending: 0,
            invoice: 0,
            invoiceRealized: 0,
            invoicePending: 0,
          },
    [entries, virtualEntries, period, budgetedCategoryIds],
  );
  const recurringEntries = useMemo(
    () =>
      period
        ? [...getRecurringEntriesInPeriod(entries, virtualEntries, period, budgetedCategoryIds)].sort(
            (a, b) => a.date.localeCompare(b.date),
          )
        : [],
    [entries, virtualEntries, period, budgetedCategoryIds],
  );
  const invoiceGroups = useMemo(
    () => (period ? getInvoiceGroups(entries, virtualEntries, period) : []),
    [entries, virtualEntries, period],
  );
  const totalBudgeted = (categoryBudgets ?? []).reduce((sum, b) => sum + b.amount, 0);
  const committedTotal = committed.recurring + committed.invoice;
  const committedRealizedTotal = committed.recurringRealized + committed.invoiceRealized;
  const committedPendingTotal = committed.recurringPending + committed.invoicePending;
  const sobra = baseIncome - committedTotal - totalBudgeted;
  const sobraStatus: BudgetStatus =
    sobra < 0 ? 'danger' : baseIncome > 0 && sobra < baseIncome * 0.1 ? 'warning' : 'ok';

  const isLoading = isCashFlowLoading || isCategoriesLoading || isBudgetsLoading;

  if (isError) {
    return <ServerErrorState onRetry={refetchAll} />;
  }

  if (isLoading || !period) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm font-medium">{t('loading')}</p>
      </div>
    );
  }

  const budgetDrawerExisting: CategoryBudget | null = budgetDrawerCategory
    ? (budgetByCategoryId.get(budgetDrawerCategory.id) ?? null)
    : null;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-primary shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white font-display leading-tight">
              {t('title')}
            </h1>
            <p className="text-sm text-muted-foreground/60">{t('subtitle')}</p>
          </div>
        </div>

        <PeriodNav
          periods={periods}
          periodIdx={periodIdx}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          isCurrentPeriod={isCurrentPeriod}
        />
      </div>

      {/* Renda e sobra em evidência, lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7">
          <IncomeBaseCard
            baseIncome={baseIncome}
            isManual={isManualBase}
            manualValue={manualValue}
            setManualValue={setManualValue}
            incomeEntries={incomeEntries}
            entryCounts={entryCounts}
            setEntryOverride={setEntryOverride}
          />
        </Card>

        <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
              {t('leftoverLabel')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Wallet className={cn('w-4 h-4', STATUS_COLORS[sobraStatus].text)} />
            </div>
          </div>
          <p className={cn('text-3xl font-bold font-display', STATUS_COLORS[sobraStatus].text)}>
            {formatCurrency(sobra)}
          </p>
        </Card>
      </div>

      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">
            {t('committedSection')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold">
              <span className="uppercase tracking-wider text-muted-foreground/50">
                {t('committedRecurringRealized')}
              </span>
              <span className="text-emerald-400 font-display">
                {formatCurrency(committedRealizedTotal)}
              </span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold">
              <span className="uppercase tracking-wider text-muted-foreground/50">
                {t('committedPending')}
              </span>
              <span className="text-amber-400 font-display">
                {formatCurrency(committedPendingTotal)}
              </span>
            </span>
          </div>
        </div>

        {recurringEntries.length === 0 && invoiceGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 py-4 text-center">
            {t('noCommitments')}
          </p>
        ) : (
          <div className="space-y-1">
            {recurringEntries.map((entry) => (
              <CommittedEntryRow
                key={entry.id}
                entry={entry}
                onClick={() => isEditableEntry(entry) && setEditingEntry(entry)}
              />
            ))}
            {invoiceGroups.map((group) => (
              <CommittedInvoiceRow
                key={group.id}
                group={group}
                onClick={() => setInvoiceDrawerGroup(group)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">
            {t('categoriesSection')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg border-white/10 text-xs hover:bg-white/5"
            onClick={() => setAddDrawerOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t('add')}
          </Button>
        </div>

        {budgetedCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 py-4 text-center">{t('noBudgetsYet')}</p>
        ) : (
          <div className="space-y-4">
            {budgetedCategories.map((c) => (
              <BudgetCategoryRow
                key={c.id}
                category={c}
                budget={budgetByCategoryId.get(c.id)?.amount ?? 0}
                spent={getCategorySpent(entries, virtualEntries, c.id, period)}
                onEdit={() => setBudgetDrawerCategory(c)}
              />
            ))}
          </div>
        )}
      </Card>

      <EditEntryDrawer
        entry={editingEntry}
        open={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
      />

      <CategoryEntriesDrawer
        open={invoiceDrawerGroup !== null}
        onClose={() => setInvoiceDrawerGroup(null)}
        categoryName={invoiceDrawerGroup?.cardName ?? t('committedInvoice')}
        categoryColor="#7b5cff"
        periodLabel={period.label}
        entries={invoiceDrawerGroup?.entries ?? []}
      />

      <AddCategoryBudgetDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        categories={unbudgetedCategories}
        onSelectCategory={(c) => {
          setAddDrawerOpen(false);
          setBudgetDrawerCategory(c);
        }}
        onCreateNew={() => {
          setAddDrawerOpen(false);
          setCreatingCategory(true);
        }}
      />

      <BudgetAmountDrawer
        open={budgetDrawerCategory !== null}
        onClose={() => setBudgetDrawerCategory(null)}
        category={budgetDrawerCategory}
        periodStart={period.startDate}
        existingBudget={budgetDrawerExisting}
      />

      <CategoryDrawer
        open={creatingCategory}
        onClose={() => setCreatingCategory(false)}
        category={null}
        defaultType="expense"
        onCreated={(created) => {
          setCreatingCategory(false);
          setBudgetDrawerCategory(created);
        }}
      />
    </div>
  );
}

function BudgetCategoryRow({
  category,
  budget,
  spent,
  onEdit,
}: {
  category: Category;
  budget: number;
  spent: number;
  onEdit: () => void;
}) {
  const t = useTranslations('budget');
  const status = getBudgetStatus(spent, budget, category.budgetDirection);
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const colors = STATUS_COLORS[status];

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group w-full text-left space-y-1.5 rounded-lg px-1.5 -mx-1.5 py-1.5 hover:bg-white/[0.03] transition-colors"
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${category.color ?? '#94a3b8'}22`,
              color: category.color ?? '#94a3b8',
            }}
          >
            <CategoryIcon name={category.icon} className="h-3 w-3" />
          </span>
          <span className="font-medium text-white truncate">{category.name}</span>
          {category.budgetDirection === 'goal' && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 rounded px-1.5 py-0.5">
              {t('directionGoal')}
            </span>
          )}
          <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors shrink-0" />
        </div>
        <div className="flex items-baseline gap-1 shrink-0">
          <span className={cn('text-sm font-bold font-display tabular-nums', colors.text)}>
            {formatCurrency(spent)}
          </span>
          <span className="text-xs text-muted-foreground/50">/ {formatCurrency(budget)}</span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: colors.bar }}
        />
      </div>
    </button>
  );
}

function CommittedRowShell({
  icon,
  iconColor,
  title,
  categoryLabel,
  amount,
  statusIcon,
  statusTitle,
  editable,
  onClick,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  categoryLabel?: string;
  amount: number;
  statusIcon: React.ReactNode;
  statusTitle: string;
  editable: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!editable}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg -mx-1.5 px-1.5 py-2 transition-colors text-left',
        editable ? 'hover:bg-white/[0.03] cursor-pointer' : 'cursor-default',
      )}
    >
      <span
        className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${iconColor ?? '#94a3b8'}22`, color: iconColor ?? '#94a3b8' }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        {categoryLabel && (
          <span className="inline-block mt-0.5 text-[10px] font-semibold text-muted-foreground/60 bg-white/5 rounded px-1.5 py-0.5">
            {categoryLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-white font-display tabular-nums">
          {formatCurrency(amount)}
        </span>
        <span title={statusTitle}>{statusIcon}</span>
      </div>
    </button>
  );
}

function CommittedEntryRow({ entry, onClick }: { entry: CashFlowEntry; onClick: () => void }) {
  const typeT = useTranslations('entry');
  const badgeT = useTranslations('dailyEntries');
  const editable = isEditableEntry(entry);

  const status = entry.isSkipped
    ? { icon: <Ban className="h-4 w-4 text-muted-foreground/40" />, title: badgeT('skipped') }
    : entry.isVirtual
      ? { icon: <Clock className="h-4 w-4 text-amber-400" />, title: badgeT('estimated') }
      : { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, title: badgeT('confirmed') };

  return (
    <CommittedRowShell
      icon={<CategoryIcon name={entry.category?.icon} className="h-3.5 w-3.5" />}
      iconColor={entry.category?.color}
      title={entry.description || typeT(entry.type)}
      categoryLabel={entry.category?.name}
      amount={entry.amount}
      statusIcon={status.icon}
      statusTitle={status.title}
      editable={editable}
      onClick={onClick}
    />
  );
}

function CommittedInvoiceRow({ group, onClick }: { group: InvoiceGroup; onClick: () => void }) {
  const t = useTranslations('budget');
  const badgeT = useTranslations('dailyEntries');

  return (
    <CommittedRowShell
      icon={<CreditCard className="h-3.5 w-3.5" />}
      iconColor="#7b5cff"
      title={t('committedInvoice')}
      categoryLabel={group.cardName}
      amount={group.amount}
      statusIcon={<Info className="h-4 w-4 text-muted-foreground/50" />}
      statusTitle={badgeT('invoice')}
      editable
      onClick={onClick}
    />
  );
}

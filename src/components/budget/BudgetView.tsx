'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Wallet, RotateCw, CreditCard, Loader2, Pencil, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCashFlow } from '@/hooks/useCashFlow';
import { useGetCategories } from '@/modules/categories/hooks/use-get-categories';
import { useGetCategoryBudgets } from '@/modules/category-budgets/hooks/use-get-category-budgets';
import { useIncomeBaseConfig } from '@/hooks/useIncomeBaseConfig';
import { FlowType, formatCurrency } from '@/lib/cashflow';
import {
  entriesInPeriod,
  getCategorySpent,
  getCommittedTotals,
  getBudgetStatus,
  BudgetStatus,
} from '@/lib/budget';
import { cn, localDateStr } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { IncomeBaseCard } from '@/components/painel/CategoryCharts';
import { PeriodNav } from '@/components/painel/PeriodNav';
import { CategoryDrawer } from '@/components/categories/CategoryDrawer';
import { BudgetAmountDrawer } from './BudgetAmountDrawer';
import { AddCategoryBudgetDrawer } from './AddCategoryBudgetDrawer';
import { CategoryIcon } from '@/components/categories/category-icons';
import { Category } from '@/modules/categories/service/categories-service';
import { CategoryBudget } from '@/modules/category-budgets/service/category-budgets-service';
import { ServerErrorState } from '@/components/ui/server-error-state';

const STATUS_COLORS: Record<BudgetStatus, { text: string; bar: string }> = {
  ok: { text: 'text-emerald-500', bar: '#10b981' },
  warning: { text: 'text-amber-400', bar: '#f59e0b' },
  danger: { text: 'text-red-500', bar: '#ef4444' },
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
        : { recurring: 0, invoice: 0 },
    [entries, virtualEntries, period, budgetedCategoryIds],
  );
  const totalBudgeted = (categoryBudgets ?? []).reduce((sum, b) => sum + b.amount, 0);
  const committedTotal = committed.recurring + committed.invoice;
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">
          {t('committedSection')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-white/80">
              <RotateCw className="h-3.5 w-3.5 text-muted-foreground/50" />
              {t('committedRecurring')}
            </span>
            <span className="text-sm font-bold text-white font-display">
              {formatCurrency(committed.recurring)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-white/80">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground/50" />
              {t('committedInvoice')}
            </span>
            <span className="text-sm font-bold text-white font-display">
              {formatCurrency(committed.invoice)}
            </span>
          </div>
        </div>
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
  const status = getBudgetStatus(spent, budget);
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

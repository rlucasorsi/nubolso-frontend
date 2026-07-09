'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Wallet, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CategoryIcon } from '@/components/categories/category-icons';
import { useGetCategories } from '@/modules/categories/hooks/use-get-categories';
import { useGetCategoryBudgets } from '@/modules/category-budgets/hooks/use-get-category-budgets';
import { useIncomeBaseConfig } from '@/hooks/useIncomeBaseConfig';
import { CashFlowEntry, Period, formatCurrency } from '@/lib/cashflow';
import {
  entriesInPeriod,
  getCategorySpent,
  getCommittedTotals,
  getBudgetStatus,
  BudgetStatus,
} from '@/lib/budget';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';

const STATUS_COLORS: Record<BudgetStatus, { text: string; bar: string }> = {
  ok: { text: 'text-emerald-500', bar: '#10b981' },
  warning: { text: 'text-amber-400', bar: '#f59e0b' },
  danger: { text: 'text-red-500', bar: '#ef4444' },
  progress: { text: 'text-blue-400', bar: '#3b82f6' },
};

// Prioriza mostrar primeiro quem precisa de atenção (estourado/quase estourando).
const STATUS_PRIORITY: Record<BudgetStatus, number> = {
  danger: 0,
  warning: 1,
  progress: 2,
  ok: 3,
};

interface BudgetSummaryCardProps {
  period: Pick<Period, 'startDate' | 'endDate'>;
  entries: CashFlowEntry[];
  virtualEntries: CashFlowEntry[];
}

// Card de leitura (sem edição) na dashboard: mostra de relance quanto sobra
// no período, quanto já está comprometido/orçado, e como estão as categorias
// orçadas — tudo linkando pra tela /orcamento pra qualquer ajuste.
export function BudgetSummaryCard({ period, entries, virtualEntries }: BudgetSummaryCardProps) {
  const t = useTranslations('budget');
  const { data: categories } = useGetCategories();
  const { data: categoryBudgets } = useGetCategoryBudgets(period.startDate);
  const { overrides, manualValue } = useIncomeBaseConfig(period.startDate);

  const catMap = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);

  const periodEntries = useMemo(
    () => entriesInPeriod(entries, virtualEntries, period),
    [entries, virtualEntries, period],
  );
  const incomeEntries = useMemo(
    () => periodEntries.filter((e) => e.type === 'income'),
    [periodEntries],
  );
  const baseIncome = useMemo(() => {
    if (manualValue !== null) return manualValue;
    return incomeEntries
      .filter((e) =>
        e.id in overrides
          ? overrides[e.id]
          : e.categoryId
            ? catMap.get(e.categoryId)?.includeInBalanceBase !== false
            : true,
      )
      .reduce((sum, e) => sum + e.amount, 0);
  }, [incomeEntries, overrides, manualValue, catMap]);

  const budgetByCategoryId = useMemo(
    () => new Map((categoryBudgets ?? []).map((b) => [b.categoryId, b])),
    [categoryBudgets],
  );
  const budgetedCategoryIds = useMemo(
    () => new Set(budgetByCategoryId.keys()),
    [budgetByCategoryId],
  );
  const budgetedCategories = useMemo(
    () => (categories ?? []).filter((c) => budgetByCategoryId.has(c.id)),
    [categories, budgetByCategoryId],
  );

  const committed = useMemo(
    () => getCommittedTotals(entries, virtualEntries, period, budgetedCategoryIds),
    [entries, virtualEntries, period, budgetedCategoryIds],
  );
  const totalBudgeted = (categoryBudgets ?? []).reduce((sum, b) => sum + b.amount, 0);
  const committedTotal = committed.recurring + committed.invoice;
  const sobra = baseIncome - committedTotal - totalBudgeted;
  const sobraStatus: BudgetStatus =
    sobra < 0 ? 'danger' : baseIncome > 0 && sobra < baseIncome * 0.1 ? 'warning' : 'ok';

  const categoryRows = useMemo(() => {
    return budgetedCategories
      .map((c) => {
        const budget = budgetByCategoryId.get(c.id)?.amount ?? 0;
        const spent = getCategorySpent(entries, virtualEntries, c.id, period);
        const status = getBudgetStatus(spent, budget, c.budgetDirection);
        return {
          category: c,
          budget,
          spent,
          status,
          percent: budget > 0 ? (spent / budget) * 100 : 0,
        };
      })
      .sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])
      .slice(0, 6);
  }, [budgetedCategories, budgetByCategoryId, entries, virtualEntries, period]);

  // Barra de alocação: comprometido (recorrentes + fatura) + orçado por categoria
  // + sobra, sempre somando o "todo" visível (renda, ou o gasto total se ele
  // já ultrapassou a renda, pra não sumir a barra quando estourado).
  const allocationTotal = Math.max(baseIncome, committedTotal + totalBudgeted, 1);
  const committedPct = Math.min(100, (committedTotal / allocationTotal) * 100);
  const budgetedPct = Math.min(100 - committedPct, (totalBudgeted / allocationTotal) * 100);
  const leftoverPct = Math.max(0, 100 - committedPct - budgetedPct);

  return (
    <div className="px-5 pb-4">
      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-display">{t('title')}</h3>
          </div>
          <Link
            href="/orcamento"
            className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground/70 hover:text-primary transition-colors shrink-0"
          >
            {t('summaryViewAll')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">
              {t('leftoverLabel')}
            </p>
            <p
              className={cn(
                'text-2xl sm:text-3xl font-bold font-display',
                STATUS_COLORS[sobraStatus].text,
              )}
            >
              {formatCurrency(sobra)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">
              {t('summaryIncome')}
            </p>
            <p className="text-sm font-bold text-white font-display">
              {formatCurrency(baseIncome)}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden flex">
            <div
              className="h-full bg-white/30 transition-all"
              style={{ width: `${committedPct}%` }}
            />
            <div className="h-full bg-primary transition-all" style={{ width: `${budgetedPct}%` }} />
            <div
              className={cn('h-full transition-all', sobra < 0 ? 'bg-red-500' : 'bg-emerald-500')}
              style={{ width: `${leftoverPct}%` }}
            />
          </div>

          <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap">
            <LegendItem
              swatchClassName="bg-white/30"
              label={t('committedSection')}
              value={formatCurrency(committedTotal)}
            />
            <LegendItem
              swatchClassName="bg-primary"
              label={t('summaryBudgeted')}
              value={formatCurrency(totalBudgeted)}
            />
            <LegendItem
              swatchClassName={sobra < 0 ? 'bg-red-500' : 'bg-emerald-500'}
              label={t('leftoverLabel')}
              value={formatCurrency(sobra)}
            />
          </div>
        </div>

        {categoryRows.length === 0 ? (
          <Link
            href="/orcamento"
            className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground/60 hover:text-primary transition-colors py-2"
          >
            {t('summaryNoBudgets')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {categoryRows.map(({ category, spent, budget, status, percent }) => (
              <div
                key={category.id}
                className="shrink-0 w-[124px] rounded-xl bg-white/[0.03] border border-white/5 p-2.5 space-y-1.5"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-5 w-5 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${category.color ?? '#94a3b8'}22`,
                      color: category.color ?? '#94a3b8',
                    }}
                  >
                    <CategoryIcon name={category.icon} className="h-2.5 w-2.5" />
                  </span>
                  <span className="text-[11px] font-semibold text-white truncate">
                    {category.name}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(percent, 100)}%`,
                      backgroundColor: STATUS_COLORS[status].bar,
                    }}
                  />
                </div>
                <p className={cn('text-[10px] font-bold font-display', STATUS_COLORS[status].text)}>
                  {formatCurrency(spent)}
                  <span className="text-muted-foreground/40 font-medium">
                    {' '}
                    / {formatCurrency(budget)}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function LegendItem({
  swatchClassName,
  label,
  value,
}: {
  swatchClassName: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className={cn('h-2 w-2 rounded-full shrink-0', swatchClassName)} />
      <span className="text-muted-foreground/60 font-medium">{label}</span>
      <span className="text-white font-bold font-display">{value}</span>
    </div>
  );
}

'use client';

import { useCallback, useMemo, useState } from 'react';
import { PieChart as PieIcon, BarChart3, Percent, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  ChartHeader,
  DonutChart,
  EmptyState,
  RankingChart,
  type ChartSlice,
} from '@/components/charts/SliceCharts';
import { Checkbox } from '@/components/ui/checkbox';
import { AmountInputField } from '@/components/ui/form-field';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { CashFlowEntry, FlowType, Period, formatCurrency } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { useGetCategories } from '@/modules/categories/hooks/use-get-categories';
import { useIncomeBaseConfig } from '@/hooks/useIncomeBaseConfig';
import { CategoryEntriesDrawer } from './CategoryEntriesDrawer';

const UNCAT_COLOR = '#94a3b8';
const UNCAT_KEY = '__uncategorized__';

// Faturas de cartão (abertas ou pagas) são agrupadas numa categoria fixa
// "Cartão de crédito", já que a fatura agrega compras de várias categorias.
const CREDIT_CARD_COLOR = '#6366f1';
const CREDIT_CARD_KEY = '__credit_card__';

interface CategoryChartsProps {
  period: Period;
  entries: CashFlowEntry[];
  virtualEntries: CashFlowEntry[];
  minDate?: string;
}

type CategorySlice = ChartSlice;

interface SelectedCategory {
  key: string;
  name: string;
  color: string;
  types: Set<FlowType>;
}

export function CategoryCharts({ period, entries, virtualEntries, minDate }: CategoryChartsProps) {
  const t = useTranslations('dashboard');
  const { data: categories } = useGetCategories();
  const [selected, setSelected] = useState<SelectedCategory | null>(null);

  const catMap = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);

  // Entradas reais + virtuais que caem no período selecionado. Ocorrências de
  // recorrente de cartão (isCardBilled) não impactam o caixa aqui — o efeito vem
  // pela fatura — então são excluídas para não duplicar.
  const periodEntries = useMemo(() => {
    return [...entries, ...virtualEntries].filter(
      (e) => !e.isCardBilled && e.date >= period.startDate && e.date <= period.endDate,
    );
  }, [entries, virtualEntries, period.startDate, period.endDate]);

  const groupByCategory = useMemo(
    () =>
      (types: Set<FlowType>): CategorySlice[] => {
        const map = new Map<string, CategorySlice>();
        for (const e of periodEntries) {
          if (!types.has(e.type)) continue;
          const isCard = !!e.creditCardInvoiceId;
          const meta = !isCard && e.categoryId ? catMap.get(e.categoryId) : undefined;
          const key = isCard ? CREDIT_CARD_KEY : (e.categoryId ?? UNCAT_KEY);
          const existing = map.get(key);
          if (existing) {
            existing.total += e.amount;
          } else {
            map.set(key, {
              key,
              name: isCard
                ? t('chartsCreditCard')
                : (meta?.name ?? e.category?.name ?? t('chartsUncategorized')),
              color: isCard ? CREDIT_CARD_COLOR : (meta?.color ?? e.category?.color ?? UNCAT_COLOR),
              total: e.amount,
            });
          }
        }
        return [...map.values()].filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
      },
    [periodEntries, catMap, t],
  );

  // 4.3 — configuração da base de entradas válidas (persistida em localStorage).
  const { overrides, setEntryOverride, manualValue, setManualValue } = useIncomeBaseConfig(
    period.startDate,
  );

  const incomeEntries = useMemo(
    () => periodEntries.filter((e) => e.type === 'income'),
    [periodEntries],
  );

  // Uma entrada conta na base se: o usuário marcou explicitamente (override),
  // senão pelo padrão da categoria (includeInBalanceBase !== false; uncategorized conta).
  const entryCounts = useCallback(
    (e: CashFlowEntry) => {
      if (e.id in overrides) return overrides[e.id];
      return e.categoryId ? catMap.get(e.categoryId)?.includeInBalanceBase !== false : true;
    },
    [overrides, catMap],
  );

  const isManualBase = manualValue !== null;

  const baseIncome = useMemo(() => {
    if (isManualBase) return manualValue as number;
    return incomeEntries.filter(entryCounts).reduce((sum, e) => sum + e.amount, 0);
  }, [isManualBase, manualValue, incomeEntries, entryCounts]);

  const expenseByCategory = useMemo(
    () => groupByCategory(new Set<FlowType>(['expense'])),
    [groupByCategory],
  );

  const investmentByCategory = useMemo(
    () => groupByCategory(new Set<FlowType>(['investment'])),
    [groupByCategory],
  );

  const openCategory = (slice: CategorySlice, types: Set<FlowType>) =>
    setSelected({ key: slice.key, name: slice.name, color: slice.color, types });

  // Derivado ao vivo de periodEntries: após editar um lançamento (React Query
  // invalida e o useCashFlow recalcula), a lista do drawer se atualiza sozinha.
  const selectedEntries = useMemo(() => {
    if (!selected) return [];
    return periodEntries.filter((e) => {
      if (!selected.types.has(e.type)) return false;
      const key = e.creditCardInvoiceId ? CREDIT_CARD_KEY : (e.categoryId ?? UNCAT_KEY);
      return key === selected.key;
    });
  }, [selected, periodEntries]);

  return (
    <div className="px-5 space-y-6 pb-4">
      <DistributionChart
        title={t('chartsCategoryTitle')}
        subtitle={t('chartsCategorySubtitle')}
        allowAll={false}
      >
        {(types) => {
          const data = groupByCategory(types);
          return (
            <DonutChart
              data={data}
              emptyLabel={t('chartsEmpty')}
              totalLabel={t('chartsTotal')}
              onSelect={(slice) => openCategory(slice, types)}
            />
          );
        }}
      </DistributionChart>

      <DistributionChart
        title={t('chartsRankingTitle')}
        subtitle={t('chartsRankingSubtitle')}
        allowAll={false}
      >
        {(types) => {
          const data = groupByCategory(types);
          return (
            <RankingChart
              data={data}
              emptyLabel={t('chartsEmpty')}
              onSelect={(slice) => openCategory(slice, types)}
            />
          );
        }}
      </DistributionChart>

      {/* 4.3 — Percentual de despesas sobre entradas válidas */}
      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <ChartHeader
          icon={<Percent className="w-4 h-4" />}
          title={t('chartsPercentTitle')}
          subtitle={t('chartsPercentSubtitle')}
        />

        <IncomeBaseCard
          baseIncome={baseIncome}
          isManual={isManualBase}
          manualValue={manualValue}
          setManualValue={setManualValue}
          incomeEntries={incomeEntries}
          entryCounts={entryCounts}
          setEntryOverride={setEntryOverride}
        />

        {baseIncome <= 0 ? (
          <EmptyState label={t('chartsNoValidIncome')} />
        ) : expenseByCategory.length === 0 && investmentByCategory.length === 0 ? (
          <EmptyState label={t('chartsEmpty')} />
        ) : (
          <div className="space-y-6">
            <PercentSection
              label={t('chartsExpensesSection')}
              items={expenseByCategory}
              base={baseIncome}
              onSelect={(slice) => openCategory(slice, new Set(['expense']))}
            />
            <PercentSection
              label={t('chartsInvestmentsSection')}
              items={investmentByCategory}
              base={baseIncome}
              onSelect={(slice) => openCategory(slice, new Set(['investment']))}
            />
          </div>
        )}

        <p className="text-[11px] leading-snug text-muted-foreground/50">
          {t('chartsValidIncomeNote')}
        </p>
      </Card>

      <CategoryEntriesDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        categoryName={selected?.name ?? ''}
        categoryColor={selected?.color ?? UNCAT_COLOR}
        periodLabel={period.label}
        entries={selectedEntries}
        minDate={minDate}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card com filtro de tipo (multi-seleção) compartilhado por 4.1 e 4.2 */
/* ------------------------------------------------------------------ */

const ALL_TYPES: FlowType[] = ['income', 'expense', 'investment'];

function DistributionChart({
  title,
  subtitle,
  allowAll = true,
  children,
}: {
  title: string;
  subtitle: string;
  // Quando false, remove o chip "Todas" e força seleção única entre os tipos.
  allowAll?: boolean;
  children: (types: Set<FlowType>) => React.ReactNode;
}) {
  const t = useTranslations('dashboard');
  const typeT = useTranslations('entry');
  const [selected, setSelected] = useState<Set<FlowType>>(
    allowAll ? new Set(ALL_TYPES) : new Set(['expense']),
  );

  const isAll = allowAll && selected.size === ALL_TYPES.length;

  const toggle = (type: FlowType) => {
    if (!allowAll) {
      setSelected(new Set([type]));
      return;
    }
    setSelected((prev) => {
      // Vindo de "Todas", clicar num tipo seleciona apenas ele (intuitivo),
      // em vez de removê-lo do conjunto completo.
      if (prev.size === ALL_TYPES.length) return new Set([type]);

      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
        if (next.size === 0) return new Set(ALL_TYPES);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const icon =
    title === t('chartsRankingTitle') ? (
      <BarChart3 className="w-4 h-4" />
    ) : (
      <PieIcon className="w-4 h-4" />
    );

  return (
    <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
      <div className="flex flex-col gap-4">
        <ChartHeader icon={icon} title={title} subtitle={subtitle} />

        <div className="flex items-center gap-1.5 flex-wrap">
          {allowAll && (
            <FilterChip active={isAll} onClick={() => setSelected(new Set(ALL_TYPES))}>
              {t('chartsAll')}
            </FilterChip>
          )}
          {ALL_TYPES.map((type) => (
            <FilterChip
              key={type}
              active={allowAll ? !isAll && selected.has(type) : selected.has(type)}
              onClick={() => toggle(type)}
            >
              {typeT(type)}
            </FilterChip>
          ))}
        </div>
      </div>

      {children(selected)}
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
        active
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}


function PercentSection({
  label,
  items,
  base,
  onSelect,
}: {
  label: string;
  items: CategorySlice[];
  base: number;
  onSelect?: (slice: CategorySlice) => void;
}) {
  if (items.length === 0) return null;

  const sectionTotal = items.reduce((sum, c) => sum + c.total, 0);
  const sectionPct = base > 0 ? (sectionTotal / base) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 shrink-0">
          {label}
        </span>
        <span className="h-px flex-1 bg-white/5" />
        <span className="text-xs font-bold text-white/70 tabular-nums shrink-0">
          {sectionPct.toFixed(sectionPct >= 100 ? 0 : 1)}%
        </span>
      </div>

      <div className="space-y-4">
        {items.map((c) => {
          const percent = base > 0 ? (c.total / base) * 100 : 0;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelect?.(c)}
              className="w-full text-left space-y-1.5 rounded-lg px-1.5 -mx-1.5 py-1 cursor-pointer transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-medium text-white truncate">{c.name}</span>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground/60">
                    {formatCurrency(c.total)}
                  </span>
                  <span className="text-sm font-bold text-white font-display tabular-nums">
                    {percent.toFixed(percent >= 100 ? 0 : 1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: c.color }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

export function IncomeBaseCard({
  baseIncome,
  isManual,
  manualValue,
  setManualValue,
  incomeEntries,
  entryCounts,
  setEntryOverride,
}: {
  baseIncome: number;
  isManual: boolean;
  manualValue: number | null;
  setManualValue: (value: number | null) => void;
  incomeEntries: CashFlowEntry[];
  entryCounts: (e: CashFlowEntry) => boolean;
  setEntryOverride: (id: string, counts: boolean) => void;
}) {
  const t = useTranslations('dashboard');
  const typeT = useTranslations('entry');
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
          {t('chartsValidIncomeBase')}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white transition-all"
          title={t('chartsBaseAdjust')}
          aria-label={t('chartsBaseAdjust')}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-3xl font-bold text-emerald-400 font-display truncate">
        {formatCurrency(baseIncome)}
      </p>

      <Sheet open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader onClose={() => setOpen(false)}>
            <SheetTitle className="text-2xl font-bold font-display text-primary">
              {t('chartsBaseAdjust')}
            </SheetTitle>
          </DrawerHeader>

          <div className="flex-1 px-6 py-4 space-y-4">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setManualValue(null)}
                className={cn(
                  'flex-1 h-9 rounded-xl text-xs font-bold transition-all',
                  !isManual
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                {t('chartsBaseAuto')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isManual) setManualValue(Math.round(baseIncome * 100) / 100);
                }}
                className={cn(
                  'flex-1 h-9 rounded-xl text-xs font-bold transition-all',
                  isManual
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                {t('chartsBaseManual')}
              </button>
            </div>

            {isManual ? (
              <AmountInputField
                label={t('chartsBaseManualLabel')}
                value={manualValue !== null ? manualValue.toFixed(2).replace('.', ',') : ''}
                onChange={(v) => setManualValue(parseFloat(v.replace(',', '.')) || 0)}
                inputClassName="text-sm h-10"
              />
            ) : (
              <div className="space-y-1.5">
                <p className="text-2xl font-bold text-emerald-400 font-display">
                  {formatCurrency(baseIncome)}
                </p>
                <p className="text-[11px] text-muted-foreground/60">{t('chartsBaseAutoHint')}</p>
                {incomeEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 py-2">
                    {t('chartsBaseNoIncome')}
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {[...incomeEntries]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((e) => {
                        const counts = entryCounts(e);
                        return (
                          <label
                            key={e.id}
                            className="flex items-center gap-3 py-1.5 px-1.5 -mx-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer"
                          >
                            <Checkbox
                              checked={counts}
                              onCheckedChange={(c) => setEntryOverride(e.id, c === true)}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white truncate">
                                {e.description || typeT('income')}
                              </p>
                              <p className="text-[10px] text-muted-foreground/50">
                                {shortDate(e.date)}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'text-sm font-semibold tabular-nums shrink-0',
                                counts ? 'text-white' : 'text-muted-foreground/40 line-through',
                              )}
                            >
                              {formatCurrency(e.amount)}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Sheet>
    </div>
  );
}


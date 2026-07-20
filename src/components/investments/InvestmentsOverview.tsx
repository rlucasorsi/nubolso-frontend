'use client';

import { useMemo } from 'react';
import { PieChart as PieIcon, BarChart3, LineChart as LineIcon, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/i18n/useTranslations';
import type { Investment, InvestmentType } from '@/modules/investments/model/api/investment';
import {
  ChartHeader,
  DonutChart,
  EmptyState,
  RankingChart,
  type ChartSlice,
} from '@/components/charts/SliceCharts';
import { formatCurrencyCompact } from '@/lib/cashflow';
import { formatCurrency, getVariableResult, isVariableIncome } from './investment-helpers';

interface InvestmentsOverviewProps {
  investments: Investment[];
  pricesByTicker: Record<string, number | null>;
}

// Ordem fixa (nunca reciclada por valor/ranking), validada CVD-safe contra o
// fundo escuro do app (node scripts/validate_palette.js — 0 WARN/FAIL nesse
// conjunto). CDB usa o roxo primário do tema; os demais tons são acentos
// harmônicos com ele (teal/âmbar/vinho) em vez do verde/rosa genéricos de
// dashboard financeiro. "Outro" fica cinza neutro, mesmo padrão de "sem
// categoria" do dashboard.
const TYPE_COLORS: Record<InvestmentType, string> = {
  CDB: '#7b5cff',
  FII: '#0d9488',
  STOCK: '#d97706',
  ETF: '#e11d48',
  OTHER: '#94a3b8',
};
const TYPE_ORDER: InvestmentType[] = ['CDB', 'FII', 'STOCK', 'ETF', 'OTHER'];
const VARIABLE_TYPE_ORDER: InvestmentType[] = ['FII', 'STOCK', 'ETF'];
// Mesmas duas primeiras cores categóricas, num par isolado (renda fixa vs
// variável) — distinto do uso de FII/Ação/ETF no gráfico de baixo, já que são
// dois gráficos com legendas/rótulos próprios, não uma paleta compartilhada.
const FIXED_COLOR = '#7b5cff';
const VARIABLE_COLOR = '#0d9488';
const DIVIDEND_MONTHS = 6;
const DIVIDEND_COLOR = '#4ade80';
const EVOLUTION_MONTHS = 12;
// Total em destaque (neutro, não compete com as cores das fatias que ele
// soma); fixa/variável reaproveitam as mesmas cores do gráfico de alocação
// por tipo, reforçando a mesma associação entre os gráficos.
const EVOLUTION_TOTAL_COLOR = '#e2e8f0';

function getMarketValue(investment: Investment, currentPrice: number | null): number {
  return isVariableIncome(investment.type)
    ? getVariableResult(investment, currentPrice).totalValue
    : investment.currentBalance;
}

export function InvestmentsOverview({ investments, pricesByTicker }: InvestmentsOverviewProps) {
  const t = useTranslations('investmentsOverview');
  const tt = useTranslations('investmentTypes');
  const tc = useTranslations('createInvestmentDrawer');

  const valueByInvestment = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of investments) {
      const price = inv.ticker ? (pricesByTicker[inv.ticker] ?? null) : null;
      map.set(inv.id, getMarketValue(inv, price));
    }
    return map;
  }, [investments, pricesByTicker]);

  // Renda fixa vs renda variável — a divisão de mais alto nível da carteira.
  const fixedVsVariableData: ChartSlice[] = useMemo(() => {
    let fixedTotal = 0;
    let variableTotal = 0;
    for (const inv of investments) {
      const value = valueByInvestment.get(inv.id) ?? 0;
      if (isVariableIncome(inv.type)) variableTotal += value;
      else fixedTotal += value;
    }
    const slices: ChartSlice[] = [];
    if (fixedTotal > 0) {
      slices.push({ key: 'fixed', name: tc('fixedIncome'), color: FIXED_COLOR, total: fixedTotal });
    }
    if (variableTotal > 0) {
      slices.push({
        key: 'variable',
        name: tc('variableIncome'),
        color: VARIABLE_COLOR,
        total: variableTotal,
      });
    }
    return slices;
  }, [investments, valueByInvestment, tc]);

  // Distribuição completa da carteira por tipo (CDB/FII/Ação/ETF/Outro).
  const portfolioAllocationData: ChartSlice[] = useMemo(() => {
    const totals = new Map<InvestmentType, number>();
    for (const inv of investments) {
      const value = valueByInvestment.get(inv.id) ?? 0;
      totals.set(inv.type, (totals.get(inv.type) ?? 0) + value);
    }
    return TYPE_ORDER.filter((type) => (totals.get(type) ?? 0) > 0).map((type) => ({
      key: type,
      name: tt(type),
      color: TYPE_COLORS[type],
      total: totals.get(type) ?? 0,
    }));
  }, [investments, valueByInvestment, tt]);

  // Distribuição só dentro da renda variável (FII/Ação/ETF) — a divisão de
  // mais alto nível já é o gráfico acima; este detalha o que compõe a fatia
  // "renda variável".
  const variableAllocationData: ChartSlice[] = useMemo(() => {
    const totals = new Map<InvestmentType, number>();
    for (const inv of investments) {
      if (!isVariableIncome(inv.type)) continue;
      const value = valueByInvestment.get(inv.id) ?? 0;
      totals.set(inv.type, (totals.get(inv.type) ?? 0) + value);
    }
    return VARIABLE_TYPE_ORDER.filter((type) => (totals.get(type) ?? 0) > 0).map((type) => ({
      key: type,
      name: tt(type),
      color: TYPE_COLORS[type],
      total: totals.get(type) ?? 0,
    }));
  }, [investments, valueByInvestment, tt]);

  // Cada barra é colorida pelo tipo do investimento (não por identidade
  // própria), então precisa de legenda — a cor sozinha não diferencia "qual
  // ativo" (isso já está no rótulo do eixo), mas sim "qual tipo".
  const topHoldings = useMemo(() => {
    return investments
      .map((inv) => ({
        key: inv.id,
        name: inv.ticker ?? inv.name,
        color: TYPE_COLORS[inv.type],
        total: valueByInvestment.get(inv.id) ?? 0,
        type: inv.type,
      }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [investments, valueByInvestment]);

  const topHoldingsData: ChartSlice[] = topHoldings;

  const topHoldingsTypes = useMemo(() => {
    const present = new Set(topHoldings.map((h) => h.type));
    return TYPE_ORDER.filter((type) => present.has(type));
  }, [topHoldings]);

  const dividendsByMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = DIVIDEND_MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        total: 0,
      });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const inv of investments) {
      for (const mv of inv.movements) {
        if (mv.type !== 'YIELD') continue;
        const bucket = byKey.get(mv.date.slice(0, 7));
        if (bucket) bucket.total += mv.amount;
      }
    }
    return months;
  }, [investments]);

  const hasDividends = dividendsByMonth.some((m) => m.total > 0);

  // Evolução da carteira: soma acumulada de todas as movimentações (aportes +
  // proventos + ajustes) até o fim de cada mês, por investimento, agregada em
  // total/renda fixa/renda variável. É uma aproximação por capital investido
  // (o que o backend já rastreia via movimentações) — NÃO é valor de mercado
  // histórico dia a dia, já que cotações de FII/ação só existem em tempo real
  // (não há preço histórico salvo pra reconstruir isso de verdade).
  const portfolioEvolution = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; total: number; fixed: number; variable: number }[] =
      [];
    for (let i = EVOLUTION_MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d
        .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        .replace('.', '')
        .replace(' de ', '/');
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        total: 0,
        fixed: 0,
        variable: 0,
      });
    }

    for (const inv of investments) {
      const sorted = [...inv.movements].sort((a, b) => a.date.localeCompare(b.date));
      const isVar = isVariableIncome(inv.type);
      let cumulative = 0;
      let movementIdx = 0;
      for (const month of months) {
        const monthEnd = `${month.key}-31`;
        while (
          movementIdx < sorted.length &&
          sorted[movementIdx].date.slice(0, 10) <= monthEnd
        ) {
          cumulative += sorted[movementIdx].amount;
          movementIdx++;
        }
        month.total += cumulative;
        if (isVar) month.variable += cumulative;
        else month.fixed += cumulative;
      }
    }

    return months;
  }, [investments]);

  const hasEvolutionData = portfolioEvolution.some((m) => m.total !== 0);

  return (
    <div className="space-y-6">
      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <ChartHeader
          icon={<LineIcon className="w-4 h-4" />}
          title={t('evolutionTitle')}
          subtitle={t('evolutionSubtitle')}
        />
        {!hasEvolutionData ? (
          <EmptyState label={t('emptyState')} />
        ) : (
          <>
            <div style={{ height: 220 }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={portfolioEvolution}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    width={44}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v: number) => formatCurrencyCompact(v).replace('R$', '').trim()}
                  />
                  <Tooltip content={<EvolutionTooltip />} />
                  <Line
                    dataKey="total"
                    name={t('evolutionTotalLabel')}
                    stroke={EVOLUTION_TOTAL_COLOR}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    dataKey="fixed"
                    name={tc('fixedIncome')}
                    stroke={FIXED_COLOR}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    dataKey="variable"
                    name={tc('variableIncome')}
                    stroke={VARIABLE_COLOR}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center">
              <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 w-full max-w-sm">
                {[
                  { key: 'total', label: t('evolutionTotalLabel'), color: EVOLUTION_TOTAL_COLOR },
                  { key: 'fixed', label: tc('fixedIncome'), color: FIXED_COLOR },
                  { key: 'variable', label: tc('variableIncome'), color: VARIABLE_COLOR },
                ].map((item) => (
                  <span
                    key={item.key}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[11px] leading-snug text-muted-foreground/50">
              {t('evolutionDisclaimer')}
            </p>
          </>
        )}
      </Card>

      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <ChartHeader
          icon={<PieIcon className="w-4 h-4" />}
          title={t('allocationTitle')}
          subtitle={t('allocationSubtitle')}
        />
        <DonutChart
          data={fixedVsVariableData}
          emptyLabel={t('emptyState')}
          totalLabel={t('allocationTotalLabel')}
        />
      </Card>

      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <ChartHeader
          icon={<PieIcon className="w-4 h-4" />}
          title={t('portfolioAllocationTitle')}
          subtitle={t('portfolioAllocationSubtitle')}
        />
        <DonutChart
          data={portfolioAllocationData}
          emptyLabel={t('emptyState')}
          totalLabel={t('allocationTotalLabel')}
        />
      </Card>

      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <ChartHeader
          icon={<PieIcon className="w-4 h-4" />}
          title={t('variableAllocationTitle')}
          subtitle={t('variableAllocationSubtitle')}
        />
        <DonutChart
          data={variableAllocationData}
          emptyLabel={t('emptyVariableState')}
          totalLabel={t('allocationTotalLabel')}
        />
      </Card>

      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <ChartHeader
          icon={<BarChart3 className="w-4 h-4" />}
          title={t('topHoldingsTitle')}
          subtitle={t('topHoldingsSubtitle')}
        />
        <RankingChart
          data={topHoldingsData}
          emptyLabel={t('emptyState')}
          showValues
          orientation="vertical"
        />
        {topHoldingsTypes.length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 w-full max-w-sm">
              {topHoldingsTypes.map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                  />
                  {tt(type)}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
        <ChartHeader
          icon={<TrendingUp className="w-4 h-4" />}
          title={t('dividendsTitle')}
          subtitle={t('dividendsSubtitle')}
        />
        {!hasDividends ? (
          <EmptyState label={t('emptyDividends')} />
        ) : (
          <div style={{ height: 180 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dividendsByMonth} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<MonthTooltip />} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill={DIVIDEND_COLOR} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

function MonthTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as { label: string; total: number };
  if (item.total <= 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#13121a] px-3 py-2 shadow-xl">
      <span className="text-xs font-semibold text-white">{item.label}</span>
      <p className="text-sm font-bold text-success font-display mt-1">
        {formatCurrency(item.total)}
      </p>
    </div>
  );
}

function EvolutionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#13121a] px-3 py-2 shadow-xl space-y-1">
      <span className="text-xs font-semibold text-white">{label}</span>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.stroke }}
            />
            {entry.name}
          </span>
          <span className="font-bold text-white">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

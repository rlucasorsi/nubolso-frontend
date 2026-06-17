import { useMemo } from 'react';
import { Period, formatCurrency, formatCurrencyCompact, formatDateAxis, formatDateLong } from '@/lib/cashflow';
import { BalanceSettings } from '@/hooks/useCashFlow';
import { Card } from '@/components/ui/card';
import { TrendingUp, Info, AlertTriangle, HelpCircle, Wallet } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';

interface DashboardSummaryProps {
  period: Period;
  currentBalance: number;
  today: string;
  balanceSettings: BalanceSettings;
}

const ZONE_COLORS = {
  positive: '#10b981',
  warning: '#F97316',
  danger: '#ef4444',
};

export function DashboardSummary({
  period,
  currentBalance,
  today,
  balanceSettings,
}: DashboardSummaryProps) {
  const { maxExpenseDay, maxExpenseAmount, bestDay, bestDayAmount, dangerDay, warningDay, chartData, yDomain, yTicks } =
    useMemo(() => {
      let maxExpenseDay = period.days[0];
      let maxExpenseAmount = 0;
      let bestDay = period.days[0];
      let bestDayAmount = -Infinity;

      period.days.forEach((day) => {
        const totalExp = day.expense + day.spending;
        if (totalExp > maxExpenseAmount) {
          maxExpenseAmount = totalExp;
          maxExpenseDay = day;
        }
        if (day.saldoDiario > bestDayAmount) {
          bestDayAmount = day.saldoDiario;
          bestDay = day;
        }
      });

      const dangerDay = period.days.find(
        (d) => d.date >= today && d.saldoAcumulado < balanceSettings.yellowThreshold,
      );
      const warningDay = period.days.find(
        (d) =>
          d.date >= today &&
          d.saldoAcumulado >= balanceSettings.yellowThreshold &&
          d.saldoAcumulado < balanceSettings.greenThreshold,
      );

      const chartData = period.days.map((d) => ({
        date: d.date,
        saldoPast: d.date <= today ? d.saldoAcumulado : null,
        saldoFuture: d.date >= today ? d.saldoAcumulado : null,
        income: d.income,
        totalExpense: d.expense + d.spending,
      }));

      const saldoValues = period.days.map((d) => d.saldoAcumulado);
      const rawMin = Math.min(...saldoValues, balanceSettings.yellowThreshold);
      const rawMax = Math.max(...saldoValues, balanceSettings.greenThreshold);
      const range = Math.max(rawMax - rawMin, 1);
      const rough = range / 4;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
      const normalized = rough / magnitude;
      const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
      const niceStep = multiplier * magnitude;
      const yMin = Math.floor(rawMin / niceStep) * niceStep;
      const yMax = Math.ceil(rawMax / niceStep) * niceStep;
      const yDomain: [number, number] = yMin === yMax ? [yMin - niceStep, yMax + niceStep] : [yMin, yMax];
      const yTicks: number[] = [];
      for (let v = yDomain[0]; v <= yDomain[1] + 1e-6; v += niceStep) yTicks.push(v);

      return { maxExpenseDay, maxExpenseAmount, bestDay, bestDayAmount, dangerDay, warningDay, chartData, yDomain, yTicks };
    }, [period, today, balanceSettings]);

  const getZoneColor = (value: number) => {
    if (value >= balanceSettings.greenThreshold) return ZONE_COLORS.positive;
    if (value >= balanceSettings.yellowThreshold) return ZONE_COLORS.warning;
    return ZONE_COLORS.danger;
  };

  const chartConfig = {
    saldoPast: { label: 'Realizado', color: '#7b5cff' },
    saldoFuture: { label: 'Projetado', color: '#FEF08A' },
  };

  const renderTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload.find((p: any) => p.value !== null && p.value !== undefined);
    if (!entry) return null;

    const value = entry.value as number;
    const row = entry.payload as { income: number; totalExpense: number };
    const [y, m, d] = (label as string).split('-').map(Number);
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });

    return (
      <div className="rounded-xl border border-white/10 bg-[#13121a] px-3 py-2.5 shadow-xl min-w-[150px]">
        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2">
          {dateLabel}
        </p>
        <div className="space-y-1">
          {row.income > 0 && (
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-emerald-400/70 font-medium">Entradas</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(row.income)}</span>
            </div>
          )}
          {row.totalExpense > 0 && (
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-red-400/70 font-medium">Saídas</span>
              <span className="text-red-400 font-bold">{formatCurrency(row.totalExpense)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 mt-1.5 pt-1.5 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getZoneColor(value) }} />
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-wide">Saldo</span>
          </div>
          <span className="text-sm font-bold text-white font-display">{formatCurrency(value)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="px-5 space-y-6 pb-4">
      {/* Cards Row */}
      <div className="flex flex-col gap-4">
        {/* Saldo Atual */}
        <Card className="bg-[#1c1a24] border-none rounded-[2rem] overflow-hidden relative p-8 py-6">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                <span>Saldo Atual</span>
                <HelpCircle className="w-3 h-3" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-bold tracking-tight text-white font-display">
                  {formatCurrency(currentBalance).replace('R$', 'R$ ')}
                </h3>
                <p className="text-[10px] text-muted-foreground/40 font-medium">
                  Até hoje, {formatDateLong(today)}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#2a2440] flex items-center justify-center text-primary-variant">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Previsão Final */}
        <Card className="bg-[#1c1a24] border-none rounded-[2rem] overflow-hidden relative p-8 py-6">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                <span>Previsão Final do Mês</span>
                <HelpCircle className="w-3 h-3" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-bold tracking-tight text-[#fb923c] font-display">
                  {formatCurrency(period.saldoFinal).replace('R$', 'R$ ')}
                </h3>
                <p className="text-[10px] text-muted-foreground/40 font-medium">
                  Projeta seu saldo em {formatDateLong(period.endDate)}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#32231c] flex items-center justify-center text-[#fb923c]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-8">
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white font-display">Projeção de saldo no mês</h3>

          <div className="h-[260px] mt-4">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={chartData} margin={{ top: 16, right: 54, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7b5cff" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#7b5cff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-white/[0.06]" />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={formatDateAxis}
                  interval={Math.ceil(period.days.length / 5) - 1}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  ticks={yTicks}
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={formatCurrencyCompact}
                />
                <ChartTooltip
                  content={renderTooltipContent}
                  cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '3 3' }}
                />

                {/* Threshold markers */}
                <ReferenceLine
                  y={balanceSettings.greenThreshold}
                  stroke={ZONE_COLORS.warning}
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                  label={{ value: 'Atenção', position: 'right', fill: ZONE_COLORS.warning, fontSize: 9, fontWeight: 700, opacity: 0.8 }}
                />
                <ReferenceLine
                  y={balanceSettings.yellowThreshold}
                  stroke={ZONE_COLORS.danger}
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                  label={{ value: 'Crítico', position: 'right', fill: ZONE_COLORS.danger, fontSize: 9, fontWeight: 700, opacity: 0.8 }}
                />

                {/* Realized Data */}
                <Area
                  type="monotone"
                  dataKey="saldoPast"
                  name="Saldo realizado"
                  stroke="#7b5cff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                  dot={false}
                />

                {/* Projected without forecast */}
                <Area
                  type="monotone"
                  dataKey="saldoFuture"
                  name="Saldo projetado"
                  stroke="#FEF08A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="5 5"
                  fill="transparent"
                  dot={false}
                />

                {/* Today marker */}
                <ReferenceLine
                  x={today}
                  stroke="#cbd5e1"
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                  label={{ value: 'Hoje', position: 'insideTopRight', fill: '#cbd5e1', fontSize: 10, fontWeight: 700, opacity: 0.7, dy: -4 }}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary rounded-full" />
              <span>Realizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-[2px] border-t-2 border-dashed" style={{ borderColor: '#FEF08A' }} />
              <span>Futuro real</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 border-t border-dashed border-white/30" />
              <span>Hoje</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts & Insights List (Vertical Cards) */}
      <div className="space-y-3">
        {dangerDay && (
          <Card className="bg-[#1c1a24] border-none rounded-2xl p-5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-white">Você ficará no vermelho</p>
              <p className="text-xs text-red-400 font-medium tracking-wide">
                dia {formatDateLong(dangerDay.date)} | {formatCurrency(dangerDay.saldoAcumulado)}
              </p>
            </div>
          </Card>
        )}

        {warningDay && (
          <Card className="bg-[#1c1a24] border-none rounded-2xl p-5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-white">Saldo entra na zona de atenção</p>
              <p className="text-xs text-amber-400 font-medium tracking-wide">
                dia {formatDateLong(warningDay.date)} | {formatCurrency(warningDay.saldoAcumulado)}
              </p>
            </div>
          </Card>
        )}

        <Card className="bg-[#1c1a24] border-none rounded-2xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
             <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white">Maior despesa</p>
            <p className="text-xs text-muted-foreground/60 font-medium">
              dia {formatDateLong(maxExpenseDay.date)} | - {formatCurrency(maxExpenseAmount)}
            </p>
          </div>
        </Card>

        <Card className="bg-[#1c1a24] border-none rounded-2xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
             <TrendingUp className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white">Melhor dia</p>
            <p className="text-xs text-muted-foreground/60 font-medium">
              dia {formatDateLong(bestDay.date)} | + {formatCurrency(bestDayAmount)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

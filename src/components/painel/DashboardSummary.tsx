import { useMemo, useState } from 'react';
import { Period, formatCurrency, formatDateAxis, formatDateLong } from '@/lib/cashflow';
import { BalanceSettings } from '@/hooks/useCashFlow';
import { Card } from '@/components/ui/card';
import { TrendingUp, Info, HelpCircle, Wallet } from 'lucide-react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { InvoiceMonthlyChart } from '@/components/credit-cards/InvoiceMonthlyChart';
import { DashboardAlerts } from './DashboardAlerts';

interface DashboardSummaryProps {
  period: Period;
  allDays: Period['days'];
  currentBalance: number;
  today: string;
  balanceSettings: BalanceSettings;
  onSelectInvoice: (invoiceId: string) => void;
}

const ZONE_COLORS = {
  positive: '#10b981',
  warning: '#F97316',
  danger: '#ef4444',
};

type ChartView = 'period' | '60' | '90';

export function DashboardSummary({
  period,
  allDays,
  currentBalance,
  today,
  balanceSettings,
  onSelectInvoice,
}: DashboardSummaryProps) {
  const t = useTranslations('dashboard');
  const [chartView, setChartView] = useState<ChartView>('period');

  const activeChartDays = useMemo(() => {
    if (chartView === 'period') return period.days;
    const n = chartView === '60' ? 60 : 90;
    const start = period.startDate;
    const endDate = new Date(start + 'T00:00:00');
    endDate.setDate(endDate.getDate() + n - 1);
    const endStr = endDate.toISOString().split('T')[0];
    return allDays.filter((d) => d.date >= start && d.date <= endStr);
  }, [chartView, period, allDays]);

  const { maxExpenseDay, maxExpenseAmount, bestDay, bestDayAmount, chartData, yDomain, yTicks } =
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

      const chartData = activeChartDays.map((d) => ({
        date: d.date,
        saldoPast: d.date <= today ? d.saldoAcumulado : null,
        saldoFuture: d.date >= today ? d.saldoAcumulado : null,
        income: d.income,
        totalExpense: d.expense + d.spending,
      }));

      const saldoValues = activeChartDays.map((d) => d.saldoAcumulado);
      const rawMin = Math.min(...saldoValues, balanceSettings.yellowThreshold, 0);
      const rawMax = Math.max(...saldoValues, balanceSettings.greenThreshold, 0);
      const range = Math.max(rawMax - rawMin, 1);
      const rough = range / 4;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
      const normalized = rough / magnitude;
      const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
      const niceStep = multiplier * magnitude;
      const yMin = Math.floor(rawMin / niceStep) * niceStep;
      const yMax = Math.ceil(rawMax / niceStep) * niceStep;
      const yDomain: [number, number] =
        yMin === yMax ? [yMin - niceStep, yMax + niceStep] : [yMin, yMax];
      const yTicks: number[] = [];
      for (let v = yDomain[0]; v <= yDomain[1] + 1e-6; v += niceStep) yTicks.push(v);

      return {
        maxExpenseDay,
        maxExpenseAmount,
        bestDay,
        bestDayAmount,
        chartData,
        yDomain,
        yTicks,
      };
    }, [period, activeChartDays, today, balanceSettings]);

  const getZoneColor = (value: number) => {
    if (value >= balanceSettings.greenThreshold) return ZONE_COLORS.positive;
    if (value >= balanceSettings.yellowThreshold) return ZONE_COLORS.warning;
    return ZONE_COLORS.danger;
  };

  const chartConfig = {
    saldoPast: { label: t('realized'), color: '#7b5cff' },
    saldoFuture: { label: t('future'), color: '#7b5cff' },
  };

  const formatYAxis = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1000) {
      const thousands = abs / 1000;
      const formatted =
        thousands >= 10 ? thousands.toFixed(0) : thousands.toFixed(1).replace('.', ',');
      return `${sign}${formatted}k`;
    }
    return `${sign}${abs.toFixed(0)}`;
  };

  const xTickInterval = Math.max(Math.ceil(activeChartDays.length / 6) - 1, 0);

  const renderTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload.find((p: any) => p.value !== null && p.value !== undefined);
    if (!entry) return null;

    const value = entry.value as number;
    const row = entry.payload as { income: number; totalExpense: number };
    const [y, m, d] = (label as string).split('-').map(Number);
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString(undefined, {
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
              <span className="text-emerald-400/70 font-medium">{t('income')}</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(row.income)}</span>
            </div>
          )}
          {row.totalExpense > 0 && (
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-red-400/70 font-medium">{t('expenses')}</span>
              <span className="text-red-400 font-bold">{formatCurrency(row.totalExpense)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 mt-1.5 pt-1.5 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: getZoneColor(value) }}
            />
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-wide">
              {t('balance')}
            </span>
          </div>
          <span className="text-sm font-bold text-white font-display">{formatCurrency(value)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="px-5 space-y-6 pb-4">
      <DashboardAlerts period={period} today={today} balanceSettings={balanceSettings} />

      {/* Cards Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Saldo Atual */}
        <Card className="bg-[#1c1a24] border-none rounded-[1.75rem] overflow-hidden p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
              <span>{t('currentBalance')}</span>
              <HelpCircle className="w-3 h-3 shrink-0" />
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#2a2440] flex items-center justify-center text-primary-variant shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display truncate">
            {formatCurrency(currentBalance).replace('R$', 'R$ ')}
          </h3>
          <p className="text-[9px] text-muted-foreground/40 font-medium mt-0.5 truncate">
            {t('upToToday', { date: formatDateLong(today) })}
          </p>
        </Card>

        {/* Previsão Final */}
        <Card className="bg-[#1c1a24] border-none rounded-[1.75rem] overflow-hidden p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
              <span>{t('monthForecast')}</span>
              <HelpCircle className="w-3 h-3 shrink-0" />
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#32231c] flex items-center justify-center text-[#fb923c] shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display truncate">
            {formatCurrency(period.saldoFinal).replace('R$', 'R$ ')}
          </h3>
          <p className="text-[9px] text-muted-foreground/40 font-medium mt-0.5 truncate">
            {t('projectsBalance', { date: formatDateLong(period.endDate) })}
          </p>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-2 sm:p-8">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-3 px-1 sm:px-0">
            <h3 className="text-base font-bold text-white font-display">
              {t('balanceProjection')}
            </h3>
            <div className="flex gap-0.5 bg-white/5 rounded-xl p-1">
              {(['period', '60', '90'] as ChartView[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setChartView(v)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all',
                    chartView === v
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-white',
                  )}
                >
                  {v === 'period' ? t('period') : `${v}d`}
                </button>
              ))}
            </div>
          </div>

          <div className="relative h-[240px] w-full">
            <span className="absolute top-0 left-0 w-[36px] text-right pr-1 text-[9px] font-bold text-[#94a3b8] leading-none pointer-events-none">
              R$
            </span>
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={chartData} margin={{ top: 14, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7b5cff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7b5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-white/[0.06]"
                />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  tickFormatter={formatDateAxis}
                  interval={xTickInterval}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  ticks={yTicks}
                  domain={yDomain}
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  tickFormatter={formatYAxis}
                />
                <ChartTooltip
                  content={renderTooltipContent}
                  cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '3 3' }}
                />

                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />

                <ReferenceLine
                  y={balanceSettings.greenThreshold}
                  stroke={ZONE_COLORS.warning}
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={balanceSettings.yellowThreshold}
                  stroke={ZONE_COLORS.danger}
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                />

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

                <Area
                  type="monotone"
                  dataKey="saldoFuture"
                  name="Saldo projetado"
                  stroke="#7b5cff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                  fill="transparent"
                  dot={false}
                />

                <ReferenceLine
                  x={today}
                  stroke="#cbd5e1"
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                  label={{
                    value: t('today'),
                    position: 'insideTopRight',
                    fill: '#cbd5e1',
                    fontSize: 9,
                    fontWeight: 700,
                    opacity: 0.7,
                    dy: -4,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1 sm:px-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary rounded-full" />
              <span>{t('realized')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-[2px] border-t-2 border-dashed border-primary opacity-60" />
              <span>{t('future')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 border-t border-dashed border-white/30" />
              <span>{t('today')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 border-t-2 border-dashed"
                style={{ borderColor: ZONE_COLORS.warning }}
              />
              <span style={{ color: ZONE_COLORS.warning }}>{t('warning')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 border-t-2 border-dashed"
                style={{ borderColor: ZONE_COLORS.danger }}
              />
              <span style={{ color: ZONE_COLORS.danger }}>{t('critical')}</span>
            </div>
          </div>
        </div>
      </Card>

      <InvoiceMonthlyChart onSelectInvoice={onSelectInvoice} />

      {/* Alerts & Insights List */}
      <div className="space-y-3">
        <Card className="bg-[#1c1a24] border-none rounded-2xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white">{t('largestExpense')}</p>
            <p className="text-xs text-muted-foreground/60 font-medium">
              {t('onDay', { date: formatDateLong(maxExpenseDay.date) })} | -{' '}
              {formatCurrency(maxExpenseAmount)}
            </p>
          </div>
        </Card>

        <Card className="bg-[#1c1a24] border-none rounded-2xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white">{t('bestDay')}</p>
            <p className="text-xs text-muted-foreground/60 font-medium">
              {t('onDay', { date: formatDateLong(bestDay.date) })} | +{' '}
              {formatCurrency(bestDayAmount)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

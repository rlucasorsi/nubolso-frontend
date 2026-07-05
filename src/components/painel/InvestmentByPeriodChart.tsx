'use client';

import { useMemo, useState } from 'react';
import { PiggyBank } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { CashFlowEntry, Period, formatCurrency, formatCurrencyCompact } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';

const INVEST_COLOR = '#3b82f6';
// Janela de períodos exibidos, centrada no período selecionado, para manter legível.
const WINDOW = 12;

// Soma dos investimentos (por data) de uma lista de lançamentos dentro do período.
function sumInvestment(list: CashFlowEntry[], start: string, end: string): number {
  let sum = 0;
  for (const e of list) {
    if (e.type === 'investment' && !e.isCardBilled && e.date >= start && e.date <= end) {
      sum += e.amount;
    }
  }
  return sum;
}

interface InvestmentByPeriodChartProps {
  periods: Period[];
  entries: CashFlowEntry[];
  virtualEntries: CashFlowEntry[];
  selectedIndex: number;
  onSelectPeriod?: (index: number) => void;
}

export function InvestmentByPeriodChart({
  periods,
  entries,
  virtualEntries,
  selectedIndex,
  onSelectPeriod,
}: InvestmentByPeriodChartProps) {
  const t = useTranslations('dashboard');
  // Recorrências = estimativas virtuais de recorrentes. Reais (inclui recorrentes
  // já efetivados) sempre aparecem; o flag liga/desliga só as projeções.
  const [showRecurrences, setShowRecurrences] = useState(true);

  const data = useMemo(() => {
    if (periods.length === 0) return [];
    let start = 0;
    let end = periods.length;
    if (periods.length > WINDOW) {
      start = Math.min(
        Math.max(selectedIndex - Math.floor(WINDOW / 2), 0),
        periods.length - WINDOW,
      );
      end = start + WINDOW;
    }
    return periods.slice(start, end).map((p, i) => {
      const [, sMonth, sDay] = p.startDate.split('-');
      const [, eMonth, eDay] = p.endDate.split('-');
      // Período alinhado ao mês (começa no dia 1): rótulo é o mês.
      // Período que começa no meio do mês: rótulo é a data inicial (ex.: 20/07).
      const startsOnFirst = sDay === '01';
      const axisLabel = startsOnFirst
        ? new Date(p.startDate + 'T00:00:00')
            .toLocaleDateString(undefined, { month: 'short' })
            .replace('.', '')
        : `${sDay}/${sMonth}`;
      const realInv = sumInvestment(entries, p.startDate, p.endDate);
      const virtInv = showRecurrences ? sumInvestment(virtualEntries, p.startDate, p.endDate) : 0;
      return {
        idx: start + i,
        label: axisLabel,
        range: `${sDay}/${sMonth} – ${eDay}/${eMonth}`,
        value: realInv + virtInv,
      };
    });
  }, [periods, selectedIndex, entries, virtualEntries, showRecurrences]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = data.some((d) => d.value > 0);

  const formatY = (v: number) => formatCurrencyCompact(v).replace('R$', '').trim();

  return (
    <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-blue-500 shrink-0">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white font-display leading-tight">
              {t('investedByPeriodTitle')}
            </h3>
            <p className="text-xs text-muted-foreground/60">{t('investedByPeriodSubtitle')}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
            {t('investedTotal')}
          </p>
          <p className="text-sm font-bold text-blue-500 font-display">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowRecurrences((v) => !v)}
          aria-pressed={showRecurrences}
          className={cn(
            'h-7 px-3 rounded-lg text-[11px] font-bold border transition-all',
            showRecurrences
              ? 'bg-primary/20 text-primary border-primary/40'
              : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white',
          )}
        >
          {t('investedRecurrences')}
        </button>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground/50 font-medium">
            {t('investedByPeriodEmpty')}
          </p>
        </div>
      ) : (
        <div className="h-[220px] w-full [&_.recharts-surface]:cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 24, left: 12, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-white/[0.06]"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={40}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickFormatter={formatY}
              />
              <Tooltip cursor={false} content={<InvestTooltip />} />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                onClick={(_, index) => onSelectPeriod?.(data[index].idx)}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  fill="#ffffff"
                  fontSize={9}
                  fontWeight={700}
                  formatter={(v: number) => (v > 0 ? formatCurrencyCompact(v) : '')}
                />
                {data.map((d) => (
                  <Cell
                    key={d.idx}
                    fill={INVEST_COLOR}
                    fillOpacity={d.idx === selectedIndex ? 1 : 0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function InvestTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { range: string; value: number };
  return (
    <div className="rounded-xl border border-white/10 bg-[#13121a] px-3 py-2 shadow-xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
        {d.range}
      </p>
      <p className="text-sm font-bold text-white font-display mt-0.5">{formatCurrency(d.value)}</p>
    </div>
  );
}

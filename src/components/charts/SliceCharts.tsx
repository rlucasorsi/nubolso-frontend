'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatCurrencyCompact } from '@/lib/cashflow';
import { cn } from '@/lib/utils';

// Formato genérico de "fatia" consumido pelos gráficos abaixo — usado tanto
// pelas categorias do dashboard quanto por outras origens de dados (ex.:
// alocação de investimentos), daí não ter nada de "Category" no nome.
export interface ChartSlice {
  key: string;
  name: string;
  color: string;
  total: number;
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="text-sm text-muted-foreground/50 font-medium">{label}</p>
    </div>
  );
}

export function ChartHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-white font-display leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground/60">{subtitle}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rosca                                                               */
/* ------------------------------------------------------------------ */

function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 7}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={2}
    />
  );
}

export function DonutChart({
  data,
  emptyLabel,
  totalLabel,
  onSelect,
}: {
  data: ChartSlice[];
  emptyLabel: string;
  totalLabel: string;
  onSelect?: (slice: ChartSlice) => void;
}) {
  const total = data.reduce((sum, d) => sum + d.total, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0) return <EmptyState label={emptyLabel} />;

  const active = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              className="cursor-pointer focus:outline-none"
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(_, index) => onSelect?.(data[index])}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.key}
                  fill={d.color}
                  fillOpacity={activeIndex === null || activeIndex === i ? 1 : 0.28}
                  style={{ transition: 'fill-opacity 150ms' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
          {active ? (
            <>
              <div className="flex items-center gap-1.5 max-w-full">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: active.color }}
                />
                <span className="text-[10px] font-semibold text-white/70 truncate">
                  {active.name}
                </span>
              </div>
              <span className="text-sm font-bold text-white font-display mt-0.5">
                {formatCurrency(active.total)}
              </span>
              <span className="text-[11px] font-bold text-primary tabular-nums">
                {total > 0 ? ((active.total / total) * 100).toFixed(1) : 0}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
                {totalLabel}
              </span>
              <span className="text-sm font-bold text-white font-display">
                {formatCurrency(total)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 w-full space-y-1 min-w-0">
        {data.map((d, i) => (
          <button
            key={d.key}
            type="button"
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={() => onSelect?.(d)}
            className={cn(
              'w-full flex items-center justify-between gap-3 text-sm rounded-lg px-1.5 -mx-1.5 py-1 cursor-pointer transition-colors',
              activeIndex === i && 'bg-white/5',
            )}
            style={{ opacity: activeIndex === null || activeIndex === i ? 1 : 0.45 }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-white/80 truncate">{d.name}</span>
            </div>
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="text-xs text-muted-foreground/50 tabular-nums">
                {total > 0 ? ((d.total / total) * 100).toFixed(0) : 0}%
              </span>
              <span className="font-semibold text-white/90 tabular-nums">
                {formatCurrency(d.total)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ranking (barras horizontais)                                       */
/* ------------------------------------------------------------------ */

export function RankingChart({
  data,
  emptyLabel,
  onSelect,
  showValues = false,
  orientation = 'horizontal',
}: {
  data: ChartSlice[];
  emptyLabel: string;
  onSelect?: (slice: ChartSlice) => void;
  // Rotula cada barra com o valor formatado (label direto), em vez de exigir
  // hover no tooltip pra ver o número — útil quando o valor em si é o ponto
  // principal do gráfico (ex.: maiores posições de uma carteira).
  showValues?: boolean;
  // 'horizontal' (padrão) = barras deitadas, nome no eixo Y — melhor pra listas
  // com nomes longos. 'vertical' = colunas, nome no eixo X — melhor pra
  // comparar poucos itens lado a lado.
  orientation?: 'horizontal' | 'vertical';
}) {
  if (data.length === 0) return <EmptyState label={emptyLabel} />;

  if (orientation === 'vertical') {
    return (
      <div style={{ height: 220 }} className="w-full [&_.recharts-surface]:cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: showValues ? 22 : 4, right: 4, left: 4, bottom: 4 }}>
            <XAxis
              dataKey="name"
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)}
            />
            <YAxis hide domain={[0, 'dataMax']} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<SliceTooltip />} />
            <Bar
              dataKey="total"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
              onClick={(_, index) => onSelect?.(data[index])}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
              {showValues && (
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(v: number) => formatCurrencyCompact(v)}
                  style={{ fill: '#e2e8f0', fontSize: 10, fontWeight: 700 }}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const height = Math.max(data.length * 42 + 8, 90);

  return (
    <div style={{ height }} className="w-full [&_.recharts-surface]:cursor-pointer">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: showValues ? 72 : 12, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
          />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<SliceTooltip />} />
          <Bar
            dataKey="total"
            radius={[0, 6, 6, 0]}
            barSize={18}
            onClick={(_, index) => onSelect?.(data[index])}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
            {showValues && (
              <LabelList
                dataKey="total"
                position="right"
                formatter={(v: number) => formatCurrency(v)}
                style={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SliceTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload as ChartSlice;
  return (
    <div className="rounded-xl border border-white/10 bg-[#13121a] px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: slice.color }}
        />
        <span className="text-xs font-semibold text-white">{slice.name}</span>
      </div>
      <p className="text-sm font-bold text-white font-display mt-1">
        {formatCurrency(slice.total)}
      </p>
      {typeof total === 'number' && total > 0 && (
        <p className="text-[10px] text-muted-foreground/50">
          {((slice.total / total) * 100).toFixed(1)}%
        </p>
      )}
    </div>
  );
}

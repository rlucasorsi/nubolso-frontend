'use client';

import { TrendingUp } from 'lucide-react';

interface GoalsSummaryProps {
  totalPlanned: number;
  totalSaved: number;
  activeGoals: number;
  nearCompletion: number;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function GoalsSummary({
  totalPlanned,
  totalSaved,
  activeGoals,
  nearCompletion,
}: GoalsSummaryProps) {
  const progressPercent =
    totalPlanned > 0 ? Math.round((totalSaved / totalPlanned) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Planejado */}
      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Total Planejado
        </span>
        <span className="text-2xl font-bold font-display text-primary">
          {formatCurrency(totalPlanned)}
        </span>
        <div className="flex items-center gap-2 text-success text-xs mt-2">
          <TrendingUp className="h-4 w-4" />
          <span className="font-bold">Em crescimento</span>
        </div>
      </div>

      {/* Total Poupado */}
      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Total Poupado
        </span>
        <span className="text-2xl font-bold font-display">
          {formatCurrency(totalSaved)}
        </span>
        <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-variant rounded-full transition-all duration-1000 ease-out shadow-[0_4px_15px_rgba(123,92,255,0.3)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Metas Ativas */}
      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Metas Ativas
        </span>
        <span className="text-2xl font-bold font-display">
          {activeGoals} {activeGoals !== 1 ? 'Objetivos' : 'Objetivo'}
        </span>
        <span className="text-xs font-medium text-muted-foreground mt-2">
          {nearCompletion > 0
            ? `${nearCompletion} meta${nearCompletion > 1 ? 's' : ''} perto da conclusão ✨`
            : 'Foco total nos objetivos'}
        </span>
      </div>
    </div>
  );
}

'use client';

import { CreditCard, Wallet, Calendar, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDateLong } from '@/lib/cashflow';

interface CreditCardsSummaryProps {
  activeCardsCount: number;
  totalOpenInvoices: number;
  nextDueDate: string | null;
  currentMonthTotal: number;
}

export function CreditCardsSummary({
  activeCardsCount,
  totalOpenInvoices,
  nextDueDate,
  currentMonthTotal,
}: CreditCardsSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Cartões Ativos
        </span>
        <span className="text-2xl font-bold font-display text-primary">
          {activeCardsCount}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <CreditCard className="h-4 w-4" />
          <span className="font-bold">
            {activeCardsCount === 1 ? 'Cartão cadastrado' : 'Cartões cadastrados'}
          </span>
        </div>
      </div>

      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Faturas em Aberto
        </span>
        <span className="text-2xl font-bold font-display text-red-500">
          {formatCurrency(totalOpenInvoices)}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <Wallet className="h-4 w-4" />
          <span className="font-bold">Soma de todas as faturas não pagas</span>
        </div>
      </div>

      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Próximo Vencimento
        </span>
        <span className="text-2xl font-bold font-display">
          {nextDueDate ? formatDateLong(nextDueDate) : '—'}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <Calendar className="h-4 w-4" />
          <span className="font-bold">
            {nextDueDate ? 'Data da próxima fatura a pagar' : 'Nenhuma fatura pendente'}
          </span>
        </div>
      </div>

      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Total no Mês Atual
        </span>
        <span className="text-2xl font-bold font-display">
          {formatCurrency(currentMonthTotal)}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <TrendingDown className="h-4 w-4" />
          <span className="font-bold">Compras com vencimento neste mês</span>
        </div>
      </div>
    </div>
  );
}

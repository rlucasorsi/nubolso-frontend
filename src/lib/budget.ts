import { CashFlowEntry, Period } from './cashflow';

export type BudgetStatus = 'ok' | 'warning' | 'danger';

const WARNING_THRESHOLD = 0.8;

// Lançamentos reais+virtuais dentro do período, excluindo ocorrências de
// recorrente de cartão (isCardBilled) — mesmo critério de CategoryCharts.tsx.
export function entriesInPeriod(
  entries: CashFlowEntry[],
  virtualEntries: CashFlowEntry[],
  period: Pick<Period, 'startDate' | 'endDate'>,
): CashFlowEntry[] {
  return [...entries, ...virtualEntries].filter(
    (e) => !e.isCardBilled && e.date >= period.startDate && e.date <= period.endDate,
  );
}

// Gasto total de uma categoria no período (real + virtual/recorrente), igual ao
// que CategoryCharts.tsx mostra no gráfico de distribuição. Compras de cartão
// entram como uma fatura agregada (creditCardInvoiceId), não por categoria —
// mesma limitação já existente no resto do app.
export function getCategorySpent(
  entries: CashFlowEntry[],
  virtualEntries: CashFlowEntry[],
  categoryId: string,
  period: Pick<Period, 'startDate' | 'endDate'>,
): number {
  return entriesInPeriod(entries, virtualEntries, period)
    .filter((e) => !e.creditCardInvoiceId && e.categoryId === categoryId)
    .reduce((sum, e) => sum + e.amount, 0);
}

// "Comprometido" automático no período: recorrentes (excluindo categorias já
// orçadas manualmente, pra não somar duas vezes na conta de sobra) e fatura de
// cartão (sempre à parte, é um meio de pagamento, não uma categoria).
export function getCommittedTotals(
  entries: CashFlowEntry[],
  virtualEntries: CashFlowEntry[],
  period: Pick<Period, 'startDate' | 'endDate'>,
  budgetedCategoryIds: Set<string>,
): { recurring: number; invoice: number } {
  const periodEntries = entriesInPeriod(entries, virtualEntries, period).filter(
    (e) => e.type === 'expense' || e.type === 'investment',
  );

  let recurring = 0;
  let invoice = 0;
  for (const e of periodEntries) {
    if (e.creditCardInvoiceId) {
      invoice += e.amount;
    } else if (!e.categoryId || !budgetedCategoryIds.has(e.categoryId)) {
      recurring += e.amount;
    }
  }
  return { recurring, invoice };
}

export function getBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget <= 0) return 'ok';
  const ratio = spent / budget;
  if (ratio >= 1) return 'danger';
  if (ratio >= WARNING_THRESHOLD) return 'warning';
  return 'ok';
}

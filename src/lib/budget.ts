import { CashFlowEntry, Period } from './cashflow';
import { BudgetDirection } from '@/modules/categories/service/categories-service';

// 'progress' = meta (goal) ainda não atingida — neutro, não é um alerta.
export type BudgetStatus = 'ok' | 'warning' | 'danger' | 'progress';

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

// Lançamentos de recorrência (real já efetivado ou estimativa virtual) no
// período — identificados por templateId, não por "tudo que sobra". Exclui
// categorias já orçadas manualmente, pra não contar duas vezes na conta de
// sobra, e ocorrências de cartão (entram pela fatura, não aqui).
//
// Uma recorrência confirmada vira um lançamento real, mas continua sendo a
// MESMA ocorrência — nunca soma o real e o virtual da mesma recorrência no
// mesmo período. Normalmente synthesizeVirtualEntry (cashflow.ts) já evita
// gerar a estimativa quando existe um real com a mesma data, mas isso falha
// se a data foi alterada ao confirmar (o usuário pode editar a data na hora
// de efetivar) — então deduplicamos aqui por templateId, priorizando sempre
// o lançamento real sobre a estimativa.
export function getRecurringEntriesInPeriod(
  entries: CashFlowEntry[],
  virtualEntries: CashFlowEntry[],
  period: Pick<Period, 'startDate' | 'endDate'>,
  budgetedCategoryIds: Set<string>,
): CashFlowEntry[] {
  const candidates = entriesInPeriod(entries, virtualEntries, period).filter(
    (e) =>
      (e.type === 'expense' || e.type === 'investment') &&
      !!e.templateId &&
      !e.creditCardInvoiceId &&
      (!e.categoryId || !budgetedCategoryIds.has(e.categoryId)),
  );

  const byTemplate = new Map<string, CashFlowEntry>();
  for (const e of candidates) {
    const key = e.templateId as string;
    const existing = byTemplate.get(key);
    if (!existing || (existing.isVirtual && !e.isVirtual)) {
      byTemplate.set(key, e);
    }
  }
  return [...byTemplate.values()];
}

// "Comprometido" automático no período: recorrentes (só o que realmente vem de
// um template — lançamentos avulsos não entram aqui) e fatura de cartão
// (sempre à parte, é um meio de pagamento, não uma categoria). Recorrentes
// vem quebrado em já efetivado (lançamento real, isVirtual false) x pendente
// (estimativa virtual, ainda não confirmado) — soma dos dois = recurring.
export function getCommittedTotals(
  entries: CashFlowEntry[],
  virtualEntries: CashFlowEntry[],
  period: Pick<Period, 'startDate' | 'endDate'>,
  budgetedCategoryIds: Set<string>,
): {
  recurring: number;
  recurringRealized: number;
  recurringPending: number;
  invoice: number;
  invoiceRealized: number;
  invoicePending: number;
} {
  const periodEntries = entriesInPeriod(entries, virtualEntries, period).filter(
    (e) => e.type === 'expense' || e.type === 'investment',
  );

  const recurringEntries = getRecurringEntriesInPeriod(
    entries,
    virtualEntries,
    period,
    budgetedCategoryIds,
  );
  const recurringRealized = recurringEntries
    .filter((e) => !e.isVirtual)
    .reduce((sum, e) => sum + e.amount, 0);
  const recurringPending = recurringEntries
    .filter((e) => e.isVirtual)
    .reduce((sum, e) => sum + e.amount, 0);

  const invoiceEntries = periodEntries.filter((e) => !!e.creditCardInvoiceId);
  const invoiceRealized = invoiceEntries
    .filter((e) => !e.isVirtual)
    .reduce((sum, e) => sum + e.amount, 0);
  const invoicePending = invoiceEntries
    .filter((e) => e.isVirtual)
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    recurring: recurringRealized + recurringPending,
    recurringRealized,
    recurringPending,
    invoice: invoiceRealized + invoicePending,
    invoiceRealized,
    invoicePending,
  };
}

// Uma linha por fatura de cartão com atividade no período — várias compras da
// mesma fatura (parcelas, projeções de recorrente já faturadas) somadas numa
// única linha "Comprometido", igual ao card já agrega hoje.
export interface InvoiceGroup {
  id: string;
  cardName?: string;
  amount: number;
  entries: CashFlowEntry[];
}

export function getInvoiceGroups(
  entries: CashFlowEntry[],
  virtualEntries: CashFlowEntry[],
  period: Pick<Period, 'startDate' | 'endDate'>,
): InvoiceGroup[] {
  const invoiceEntries = entriesInPeriod(entries, virtualEntries, period).filter(
    (e) => (e.type === 'expense' || e.type === 'investment') && !!e.creditCardInvoiceId,
  );

  const byInvoice = new Map<string, CashFlowEntry[]>();
  for (const e of invoiceEntries) {
    const key = e.creditCardInvoiceId as string;
    const list = byInvoice.get(key);
    if (list) list.push(e);
    else byInvoice.set(key, [e]);
  }

  return [...byInvoice.entries()].map(([id, groupEntries]) => ({
    id,
    cardName: groupEntries[0]?.creditCardName,
    amount: groupEntries.reduce((sum, e) => sum + e.amount, 0),
    entries: groupEntries,
  }));
}

// Categoria tipo 'goal' (ex.: Investimento) inverte a leitura: atingir/ultrapassar
// o valor é bom (verde), não bater ainda é só "em andamento" (neutro) — nunca
// vermelho/âmbar, já que não há motivo de alerta em não ter investido o suficiente.
export function getBudgetStatus(
  spent: number,
  budget: number,
  direction: BudgetDirection = 'limit',
): BudgetStatus {
  if (budget <= 0) return 'ok';
  const ratio = spent / budget;

  if (direction === 'goal') {
    return ratio >= 1 ? 'ok' : 'progress';
  }

  if (ratio >= 1) return 'danger';
  if (ratio >= WARNING_THRESHOLD) return 'warning';
  return 'ok';
}

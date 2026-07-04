import { localDateStr } from '@/lib/utils';

export type FlowType = 'income' | 'expense' | 'investment';

// Classificação adicional de despesas (só se aplica quando type === 'expense').
export type ExpenseType = 'fixa' | 'variavel' | null;

export interface CashFlowEntry {
  id: string;
  date: string;
  type: FlowType;
  amount: number;
  description?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  isPaid?: boolean;
  tipoDespesa?: ExpenseType;
  templateId?: string | null;
  isVirtual?: boolean;
  isSkipped?: boolean;
  creditCardInvoiceId?: string;
  // Ocorrência de recorrente vinculado a cartão: aparece nas pendências, mas o
  // impacto no fluxo de caixa acontece via fatura (nunca entra em generatePeriods)
  isCardBilled?: boolean;
  creditCardName?: string;
}

export interface DayData {
  date: string;
  income: number;
  expense: number;
  investment: number;
  saldoDiario: number;
  saldoAcumulado: number;
  descriptions: string[];
  entryIds: string[];
  isBeforeStartDate: boolean;
  hasPendingRecurring: boolean;
}

export interface Period {
  label: string;
  startDate: string;
  endDate: string;
  saldoInicial: number;
  days: DayData[];
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  saldoFinal: number;
}

// Decouples cashflow.ts from modules/recurring-templates
export interface RecurringTemplateLike {
  id: string;
  description: string;
  estimatedAmount: number;
  type: FlowType;
  dayOfMonth: number;
  isActive: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  endDate?: string;
  totalOccurrences?: number;
  occurrenceCount?: number;
  creditCardId?: string | null;
}

// Decouples cashflow.ts from modules/credit-cards
export interface CreditCardInvoiceLike {
  id: string;
  cardId: string;
  cardName: string;
  cardIsActive: boolean;
  referenceMonth: number;
  referenceYear: number;
  paymentDate: string;
  totalAmount: number;
  isPaid: boolean;
  transactionId?: string;
  // templateIds dos recorrentes de cartão já materializados como compra nesta fatura
  purchaseTemplateIds?: string[];
}

// Decouples cashflow.ts from modules/credit-cards
export interface CreditCardLike {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  paymentDay: number;
  isActive: boolean;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatCurrencyShort(value: number): string {
  if (value === 0) return '-';
  return formatCurrency(value);
}

export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000) {
    const thousands = abs / 1000;
    const formatted =
      thousands >= 10 ? thousands.toFixed(0) : thousands.toFixed(1).replace('.', ',');
    return `${sign}R$ ${formatted}k`;
  }
  return `${sign}R$ ${abs.toFixed(0)}`;
}

export function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

export function formatDateAxis(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function getBalanceStatus(value: number): 'positive' | 'warning' | 'danger' {
  if (value > 500) return 'positive';
  if (value > 300) return 'warning';
  return 'danger';
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const MONTH_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

// Periods can run from day 1 (standard month) or a custom day (e.g. 20 to 19 of next month)
export function getPeriodForDate(
  dateStr: string,
  startDay: number = 1,
): {
  label: string;
  startDate: string;
  endDate: string;
} {
  const [y, m, d] = dateStr.split('-').map(Number);

  // Helper to get a date string with day clamped to month maximum
  const getClampedDate = (year: number, month: number, targetDay: number) => {
    const lastDay = new Date(year, month, 0).getDate();
    const day = Math.min(targetDay, lastDay);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  if (startDay === 1) {
    const lastDay = new Date(y, m, 0).getDate();
    return {
      label: `${MONTH_NAMES[m - 1]} / ${y}`,
      startDate: `${y}-${String(m).padStart(2, '0')}-01`,
      endDate: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  // Find the effective start day for the current month context
  // If today is 31 and month has 30 days, we treat today as after the start
  const currentMonthLastDay = new Date(y, m, 0).getDate();
  const effectiveStartDay = Math.min(startDay, currentMonthLastDay);

  if (d >= effectiveStartDay) {
    // Period is this month / next month
    const m2 = m === 12 ? 1 : m + 1;
    const y2 = m === 12 ? y + 1 : y;
    return {
      label: `${MONTH_NAMES[m - 1]} / ${MONTH_NAMES[m2 - 1]}`,
      startDate: getClampedDate(y, m, startDay),
      endDate: getClampedDate(y2, m2, startDay - 1),
    };
  } else {
    // Period is previous month / this month
    const m0 = m === 1 ? 12 : m - 1;
    const y0 = m === 1 ? y - 1 : y;
    return {
      label: `${MONTH_NAMES[m0 - 1]} / ${MONTH_NAMES[m - 1]}`,
      startDate: getClampedDate(y0, m0, startDay),
      endDate: getClampedDate(y, m, startDay - 1),
    };
  }
}

// Computes the day on which a recurring template falls in a given month,
// clamping to the last day of the month (e.g. dayOfMonth=31 in February -> 28/29)
export function getTemplateOccurrenceDate(year: number, month: number, dayOfMonth: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(dayOfMonth, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Builds a virtual (not-yet-realized) entry for a template's occurrence in a given
// month, or returns null if that occurrence has already been realized (a real
// Transaction with this templateId + date already exists in existingEntries).
export function synthesizeVirtualEntry(
  template: RecurringTemplateLike,
  year: number,
  month: number,
  existingEntries: CashFlowEntry[],
  today?: string,
): CashFlowEntry | null {
  const occurrenceDate = getTemplateOccurrenceDate(year, month, template.dayOfMonth);

  const todayStr = today ?? localDateStr();
  if (occurrenceDate < todayStr) return null;

  if (template.endDate && occurrenceDate > template.endDate.slice(0, 10)) return null;

  if (template.totalOccurrences && (template.occurrenceCount ?? 0) >= template.totalOccurrences)
    return null;

  const realized = existingEntries.find(
    (e) => e.templateId === template.id && e.date === occurrenceDate,
  );
  if (realized) return null;

  return {
    id: `virtual_${template.id}_${occurrenceDate}`,
    date: occurrenceDate,
    type: template.type,
    amount: template.estimatedAmount,
    description: template.description,
    categoryId: template.categoryId,
    category: template.category,
    isPaid: false,
    templateId: template.id,
    isVirtual: true,
  };
}

// Generates virtual entries for every active template, for every month touched by
// [startDate, endDate], filtering occurrences outside that range.
export function generateVirtualEntriesForRange(
  templates: RecurringTemplateLike[],
  existingEntries: CashFlowEntry[],
  startDate: string,
  endDate: string,
): CashFlowEntry[] {
  const result: CashFlowEntry[] = [];
  const activeTemplates = templates.filter((t) => t.isActive);
  if (activeTemplates.length === 0) return result;

  const [startY, startM] = startDate.split('-').map(Number);
  const [endY, endM] = endDate.split('-').map(Number);

  let year = startY;
  let month = startM;

  while (year < endY || (year === endY && month <= endM)) {
    for (const template of activeTemplates) {
      const entry = synthesizeVirtualEntry(template, year, month, existingEntries);
      if (entry && entry.date >= startDate && entry.date <= endDate) {
        result.push(entry);
      }
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return result;
}

// Builds a virtual (not-yet-paid) entry for a credit card invoice on its payment
// date, or returns null once the invoice is paid (its linked Transaction takes
// over) or its card has been deactivated.
export function synthesizeInvoiceEntry(invoice: CreditCardInvoiceLike): CashFlowEntry | null {
  if (invoice.isPaid || invoice.transactionId || !invoice.cardIsActive) return null;
  if (invoice.totalAmount <= 0) return null;

  return {
    id: `invoice_${invoice.id}`,
    date: invoice.paymentDate,
    type: 'expense',
    amount: invoice.totalAmount,
    description: `Fatura ${invoice.cardName} - ${String(invoice.referenceMonth).padStart(2, '0')}/${invoice.referenceYear}`,
    isPaid: false,
    isVirtual: true,
    creditCardInvoiceId: invoice.id,
  };
}

// Generates one virtual entry per unpaid invoice whose paymentDate falls within
// [startDate, endDate].
export function generateInvoiceEntriesForRange(
  invoices: CreditCardInvoiceLike[],
  startDate: string,
  endDate: string,
): CashFlowEntry[] {
  return invoices
    .map(synthesizeInvoiceEntry)
    .filter(
      (entry): entry is CashFlowEntry =>
        entry !== null && entry.date >= startDate && entry.date <= endDate,
    );
}

// Port of the backend's getBaseInvoiceMonth (src/credit-cards/utils/date-helpers.ts):
// a charge on/after the closing day belongs to the NEXT month's invoice.
export function getInvoiceCycleForDate(
  dateStr: string,
  closingDay: number,
): { year: number; month: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const closingThisMonth = Math.min(closingDay, lastDay);
  if (day < closingThisMonth) return { year, month };
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

// Port of the backend's computeInvoiceDates rolling rule: a target day that is at
// or before the closing day belongs to the month AFTER the reference month.
export function getCycleDateForDay(
  card: CreditCardLike,
  year: number,
  month: number,
  day: number,
): string {
  let y = year;
  let m = month;
  if (day <= card.closingDay) {
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return getTemplateOccurrenceDate(y, m, day);
}

// Port of the paymentDate branch of the backend's computeInvoiceDates:
// paymentDay <= closingDay rolls the payment to the month after closing.
export function getCyclePaymentDate(card: CreditCardLike, year: number, month: number): string {
  return getCycleDateForDay(card, year, month, card.paymentDay);
}

// For templates linked to a credit card, one monthly occurrence yields two views:
// - pendingEntries: dated on the occurrence day, for the pending-confirmation list
//   (isCardBilled: true — they never enter generatePeriods directly);
// - projectionEntries: dated on the payment date of the invoice cycle the charge
//   falls into, so the "Projetado" chart mode shows the committed amount.
// Occurrences already materialized as a purchase in the cycle's invoice
// (invoice.purchaseTemplateIds) or skipped (Transaction templateId+date in
// existingEntries) produce neither.
export function generateCardTemplateEntriesForRange(
  templates: RecurringTemplateLike[],
  cards: CreditCardLike[],
  invoices: CreditCardInvoiceLike[],
  existingEntries: CashFlowEntry[],
  startDate: string,
  endDate: string,
  today?: string,
): { pendingEntries: CashFlowEntry[]; projectionEntries: CashFlowEntry[] } {
  const pendingEntries: CashFlowEntry[] = [];
  const projectionEntries: CashFlowEntry[] = [];

  const cardById = new Map(cards.map((c) => [c.id, c]));
  const invoiceByCycle = new Map(
    invoices.map((inv) => [`${inv.cardId}:${inv.referenceYear}-${inv.referenceMonth}`, inv]),
  );

  const activeTemplates = templates.filter(
    (t) => t.isActive && t.creditCardId && cardById.get(t.creditCardId)?.isActive,
  );
  if (activeTemplates.length === 0) return { pendingEntries, projectionEntries };

  const todayStr = today ?? new Date().toISOString().split('T')[0];
  const [startY, startM] = startDate.split('-').map(Number);
  const [endY, endM] = endDate.split('-').map(Number);

  let year = startY;
  let month = startM;

  while (year < endY || (year === endY && month <= endM)) {
    for (const template of activeTemplates) {
      const card = cardById.get(template.creditCardId!)!;
      const occurrenceDate = getTemplateOccurrenceDate(year, month, template.dayOfMonth);

      // Same guards as synthesizeVirtualEntry
      if (template.endDate && occurrenceDate > template.endDate.slice(0, 10)) continue;
      if (template.totalOccurrences && (template.occurrenceCount ?? 0) >= template.totalOccurrences)
        continue;
      if (existingEntries.some((e) => e.templateId === template.id && e.date === occurrenceDate))
        continue;

      const cycle = getInvoiceCycleForDate(occurrenceDate, card.closingDay);
      const invoice = invoiceByCycle.get(`${card.id}:${cycle.year}-${cycle.month}`);

      // Already materialized as a purchase in this cycle's invoice
      if (invoice?.purchaseTemplateIds?.includes(template.id)) continue;

      // The invoice absorbing this charge closes on the cycle's closing day; once
      // that date passes the invoice is final and the charge no longer projects.
      const cycleClosingDate = getTemplateOccurrenceDate(cycle.year, cycle.month, card.closingDay);
      if (cycleClosingDate < todayStr) continue;

      // Pending-confirmation list only shows genuinely upcoming occurrences.
      if (occurrenceDate >= todayStr && occurrenceDate >= startDate && occurrenceDate <= endDate) {
        pendingEntries.push({
          id: `cardpending_${template.id}_${occurrenceDate}`,
          date: occurrenceDate,
          type: template.type,
          amount: template.estimatedAmount,
          description: template.description,
          categoryId: template.categoryId,
          category: template.category,
          isPaid: false,
          templateId: template.id,
          isVirtual: true,
          isCardBilled: true,
          creditCardName: card.name,
        });
      }

      // A paid invoice can no longer absorb this charge; skip the projection
      if (invoice?.isPaid || invoice?.transactionId) continue;

      const projectedDate =
        invoice?.paymentDate ?? getCyclePaymentDate(card, cycle.year, cycle.month);
      if (projectedDate >= startDate && projectedDate <= endDate) {
        projectionEntries.push({
          id: `cardproj_${template.id}_${occurrenceDate}`,
          date: projectedDate,
          type: 'expense',
          amount: template.estimatedAmount,
          description: `${template.description} (${card.name})`,
          isPaid: false,
          templateId: template.id,
          isVirtual: true,
          creditCardInvoiceId: invoice?.id,
        });
      }
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return { pendingEntries, projectionEntries };
}

// One card-linked recurring template projected onto a specific invoice cycle.
export interface ProjectedCardTemplate {
  templateId: string;
  description: string;
  estimatedAmount: number;
  occurrenceDate: string;
  dayOfMonth: number;
}

// For a single invoice cycle (refYear/refMonth of `card`), returns the active
// card-linked recurring templates whose monthly occurrence falls into that cycle
// and hasn't yet been materialized. Used by the invoice detail drawer to show the
// projected commitment ("valor projetado") alongside the current total.
// Mirrors the guards in generateCardTemplateEntriesForRange so the numbers stay
// consistent with the chart's "Projetado" mode.
export function getProjectedCardTemplatesForInvoiceCycle(
  templates: RecurringTemplateLike[],
  card: CreditCardLike,
  refYear: number,
  refMonth: number,
  existingEntries: CashFlowEntry[],
  purchaseTemplateIds: string[],
  today?: string,
): ProjectedCardTemplate[] {
  const todayStr = today ?? localDateStr();
  const result: ProjectedCardTemplate[] = [];

  // Once the cycle has closed the invoice is final and no longer accepts projected
  // commitments. Until then it stays open even for occurrences already in the past
  // (e.g. closingDay 1 + recurrence on day 2: the day-2 charge lands in an invoice
  // that only closes a month later, so it must project even a few days after it).
  const cycleClosingDate = getTemplateOccurrenceDate(refYear, refMonth, card.closingDay);
  if (cycleClosingDate < todayStr) return result;

  const activeTemplates = templates.filter((t) => t.isActive && t.creditCardId === card.id);

  // A monthly occurrence reaches this invoice from either the reference month
  // (day < closingDay) or the previous month (day >= closingDay rolls forward).
  const candidates = [
    refMonth === 1 ? { year: refYear - 1, month: 12 } : { year: refYear, month: refMonth - 1 },
    { year: refYear, month: refMonth },
  ];

  for (const template of activeTemplates) {
    for (const c of candidates) {
      const occurrenceDate = getTemplateOccurrenceDate(c.year, c.month, template.dayOfMonth);
      const cycle = getInvoiceCycleForDate(occurrenceDate, card.closingDay);
      if (cycle.year !== refYear || cycle.month !== refMonth) continue;

      // Same guards as generateCardTemplateEntriesForRange / synthesizeVirtualEntry
      if (template.endDate && occurrenceDate > template.endDate.slice(0, 10)) break;
      if (template.totalOccurrences && (template.occurrenceCount ?? 0) >= template.totalOccurrences)
        break;
      if (existingEntries.some((e) => e.templateId === template.id && e.date === occurrenceDate))
        break;
      if (purchaseTemplateIds.includes(template.id)) break;

      result.push({
        templateId: template.id,
        description: template.description,
        estimatedAmount: template.estimatedAmount,
        occurrenceDate,
        dayOfMonth: template.dayOfMonth,
      });
      break; // at most one candidate month maps to this cycle
    }
  }

  return result;
}

// Synthetic invoice ids are prefixed so drawers can tell them apart from real
// backend invoices (which must never be fetched/mutated for a virtual cycle).
export const VIRTUAL_INVOICE_PREFIX = 'virtual:';

export function isVirtualInvoiceId(id: string | null | undefined): boolean {
  return !!id && id.startsWith(VIRTUAL_INVOICE_PREFIX);
}

// A future invoice cycle that has no real invoice yet but already carries a
// projected commitment from card-linked recurring templates. Lets the UI render
// month cards for a brand-new card whose only activity is a linked recurrence.
export interface VirtualInvoiceCycle {
  referenceYear: number;
  referenceMonth: number;
  closingDate: string;
  dueDate: string;
  paymentDate: string;
  projected: ProjectedCardTemplate[];
  projectedTotal: number;
}

// Walks the next `monthsAhead` reference cycles of `card` and, for each cycle that
// has no real invoice but does have projected card recurrences, emits a virtual
// cycle. Real invoices already surface their own projection via
// getProjectedCardTemplatesForInvoiceCycle, so those cycles are skipped here.
export function generateVirtualCardInvoiceCycles(
  card: CreditCardLike,
  templates: RecurringTemplateLike[],
  existingEntries: CashFlowEntry[],
  realInvoices: { referenceYear: number; referenceMonth: number }[],
  monthsAhead = 12,
  today?: string,
): VirtualInvoiceCycle[] {
  const todayStr = today ?? localDateStr();
  const [startY, startM] = todayStr.split('-').map(Number);
  const realKeys = new Set(realInvoices.map((i) => `${i.referenceYear}-${i.referenceMonth}`));
  const result: VirtualInvoiceCycle[] = [];

  let year = startY;
  let month = startM;
  for (let i = 0; i < monthsAhead; i++) {
    if (!realKeys.has(`${year}-${month}`)) {
      const projected = getProjectedCardTemplatesForInvoiceCycle(
        templates,
        card,
        year,
        month,
        existingEntries,
        [],
        todayStr,
      );
      if (projected.length > 0) {
        result.push({
          referenceYear: year,
          referenceMonth: month,
          closingDate: getTemplateOccurrenceDate(year, month, card.closingDay),
          dueDate: getCycleDateForDay(card, year, month, card.dueDay),
          paymentDate: getCyclePaymentDate(card, year, month),
          projected,
          projectedTotal: projected.reduce((sum, r) => sum + r.estimatedAmount, 0),
        });
      }
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return result;
}

// Computes the list of period start/end ranges covering all entries (+ saldoInicial)
// through `numFuturePeriods` ahead of the current period.
export function getPeriodRanges(
  entries: CashFlowEntry[],
  saldoInicial: { value: number; date: string },
  numFuturePeriods: number = 3,
  startDay: number = 1,
): { start: string; end: string; label: string }[] {
  // Find date range from entries
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Determine start period
  const entryDate = sorted.length > 0 ? sorted[0].date : localDateStr();
  const firstDate = entryDate < saldoInicial.date ? entryDate : saldoInicial.date;
  const firstPeriod = getPeriodForDate(firstDate, startDay);

  // Determine how many periods to show (historical + future)
  const today = localDateStr();
  const todayPeriod = getPeriodForDate(today, startDay);

  // Generate period start dates
  const periodStarts: { start: string; end: string; label: string }[] = [];
  let currentPos = new Date(firstPeriod.startDate + 'T00:00:00');
  const futureEnd = new Date(todayPeriod.endDate + 'T00:00:00');
  futureEnd.setMonth(futureEnd.getMonth() + numFuturePeriods);

  while (currentPos <= futureEnd) {
    const dateStr = currentPos.toISOString().split('T')[0];
    const p = getPeriodForDate(dateStr, startDay);

    // Avoid duplicates or infinite loops
    if (periodStarts.length === 0 || periodStarts[periodStarts.length - 1].start !== p.startDate) {
      periodStarts.push({ start: p.startDate, end: p.endDate, label: p.label });
    }

    // Move to the day after the current period ends to find the next one
    const nextDate = new Date(p.endDate + 'T00:00:00');
    nextDate.setDate(nextDate.getDate() + 1);
    currentPos = nextDate;
  }

  return periodStarts;
}

export function generatePeriods(
  entries: CashFlowEntry[],
  virtualEntries: CashFlowEntry[],
  saldoInicial: { value: number; date: string },
  numFuturePeriods: number = 3,
  startDay: number = 1,
): Period[] {
  const periodStarts = getPeriodRanges(entries, saldoInicial, numFuturePeriods, startDay);
  const allEntries = [...entries, ...virtualEntries];

  const periods: Period[] = [];
  let runningBalance = 0;
  let started = false;

  for (const ps of periodStarts) {
    const days: DayData[] = [];
    const start = new Date(ps.start + 'T00:00:00');
    const end = new Date(ps.end + 'T00:00:00');
    const periodSaldoInicial = runningBalance;
    let acumulado = runningBalance;
    let totalIncome = 0;
    let totalExpense = 0;
    let totalInvestment = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = allEntries.filter((e) => e.date === dateStr);

      const income = dayEntries
        .filter((e) => e.type === 'income' || (e.type as any) === 'receita')
        .reduce((s, e) => s + e.amount, 0);
      const expense = dayEntries
        .filter((e) => e.type === 'expense' || (e.type as any) === 'despesa')
        .reduce((s, e) => s + e.amount, 0);
      // Reconhece valores legados ('spending'/'gasto') durante o rollout do rename.
      const investment = dayEntries
        .filter(
          (e) =>
            e.type === 'investment' ||
            (e.type as any) === 'spending' ||
            (e.type as any) === 'gasto',
        )
        .reduce((s, e) => s + e.amount, 0);
      const descriptions = dayEntries.map((e) => e.description || '').filter(Boolean);
      const entryIds = dayEntries.map((e) => e.id);
      const isBeforeStartDate = dateStr < saldoInicial.date;
      const hasPendingRecurring =
        !isBeforeStartDate && dayEntries.some((e) => e.isVirtual === true);

      const saldoDiario = income - expense - investment;

      if (isBeforeStartDate) {
        acumulado = 0;
      } else if (!started && dateStr === saldoInicial.date) {
        acumulado = saldoInicial.value + saldoDiario;
        started = true;
      } else if (started) {
        acumulado += saldoDiario;
      } else {
        acumulado = 0;
      }
      totalIncome += income;
      totalExpense += expense;
      totalInvestment += investment;

      days.push({
        date: dateStr,
        income,
        expense,
        investment,
        saldoDiario,
        saldoAcumulado: acumulado,
        descriptions,
        entryIds,
        isBeforeStartDate,
        hasPendingRecurring,
      });
    }

    periods.push({
      label: ps.label,
      startDate: ps.start,
      endDate: ps.end,
      saldoInicial: periodSaldoInicial,
      days,
      totalIncome,
      totalExpense,
      totalInvestment,
      saldoFinal: acumulado,
    });

    runningBalance = acumulado;
  }

  return periods;
}

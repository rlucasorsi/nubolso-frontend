export type FlowType = 'income' | 'expense' | 'spending';

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
  };
  isPaid?: boolean;
  templateId?: string | null;
  isVirtual?: boolean;
  isSkipped?: boolean;
  creditCardInvoiceId?: string;
}

export interface DayData {
  date: string;
  income: number;
  expense: number;
  spending: number;
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
  totalSpending: number;
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

  const todayStr = today ?? new Date().toISOString().split('T')[0];
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
  const entryDate = sorted.length > 0 ? sorted[0].date : new Date().toISOString().split('T')[0];
  const firstDate = entryDate < saldoInicial.date ? entryDate : saldoInicial.date;
  const firstPeriod = getPeriodForDate(firstDate, startDay);

  // Determine how many periods to show (historical + future)
  const today = new Date().toISOString().split('T')[0];
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
    let totalSpending = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = allEntries.filter((e) => e.date === dateStr);

      const income = dayEntries
        .filter((e) => e.type === 'income' || (e.type as any) === 'receita')
        .reduce((s, e) => s + e.amount, 0);
      const expense = dayEntries
        .filter((e) => e.type === 'expense' || (e.type as any) === 'despesa')
        .reduce((s, e) => s + e.amount, 0);
      const spending = dayEntries
        .filter((e) => e.type === 'spending' || (e.type as any) === 'gasto')
        .reduce((s, e) => s + e.amount, 0);
      const descriptions = dayEntries.map((e) => e.description || '').filter(Boolean);
      const entryIds = dayEntries.map((e) => e.id);
      const isBeforeStartDate = dateStr < saldoInicial.date;
      const hasPendingRecurring =
        !isBeforeStartDate && dayEntries.some((e) => e.isVirtual === true);

      const saldoDiario = income - expense - spending;

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
      totalSpending += spending;

      days.push({
        date: dateStr,
        income,
        expense,
        spending,
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
      totalSpending,
      saldoFinal: acumulado,
    });

    runningBalance = acumulado;
  }

  return periods;
}

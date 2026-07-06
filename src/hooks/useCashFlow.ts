import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { localDateStr } from '@/lib/utils';
import {
  CashFlowEntry,
  CreditCardInvoiceLike,
  CreditCardLike,
  FlowType,
  RecurringTemplateLike,
  generateCardTemplateEntriesForRange,
  generateInvoiceEntriesForRange,
  generatePeriods,
  generateVirtualEntriesForRange,
  getPeriodForDate,
  getPeriodRanges,
} from '@/lib/cashflow';
import { useGetEntries } from '@/modules/entries/hooks/use-get-entries';
import { useCreateEntry } from '@/modules/entries/hooks/use-create-entry';
import { useUpdateEntry } from '@/modules/entries/hooks/use-update-entry';
import { useDeleteEntry } from '@/modules/entries/hooks/use-delete-entry';
import { useGetMe } from '@/modules/users/hooks/use-get-me';
import { useUpdateMe } from '@/modules/users/hooks/use-update-me';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { useGetAllInvoices } from '@/modules/credit-cards/hooks/use-get-all-invoices';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { logger } from '@/lib/logger';

export interface BalanceSettings {
  greenThreshold: number;
  yellowThreshold: number;
}

export function useCashFlow() {
  const entriesQuery = useGetEntries();
  const addEntryMutation = useCreateEntry();
  const updateEntryMutation = useUpdateEntry();
  const deleteEntryMutation = useDeleteEntry();
  const { data: me, isLoading: isMeLoading, isError: isMeError, refetch: refetchMe } = useGetMe();
  const updateMeMutation = useUpdateMe();
  const recurringTemplatesQuery = useGetRecurringTemplates();
  const creditCardInvoicesQuery = useGetAllInvoices();
  const creditCardsQuery = useGetCreditCards();

  const saldoInicial = useMemo(
    () => ({
      value: me?.currentBalance ?? 0,
      date: me?.balanceStartDate ? me.balanceStartDate.split('T')[0] : localDateStr(),
    }),
    [me],
  );
  const startDay = useMemo(() => me?.cashflowStartDay ?? 1, [me]);
  const balanceSettings: BalanceSettings = useMemo(
    () => ({
      greenThreshold: me?.greenThreshold ?? 0,
      yellowThreshold: me?.yellowThreshold ?? 0,
    }),
    [me],
  );
  const [simulationAdjustment, setSimulationAdjustment] = useState(0);

  // Maps a paid invoice's linked Transaction id back to its invoice id, so the
  // resulting CashFlowEntry can be identified as a credit card invoice payment
  // (and treated as such in the daily entries drawer).
  const transactionToInvoiceId = useMemo(() => {
    const map = new Map<string, string>();
    (creditCardInvoicesQuery.data ?? []).forEach((invoice) => {
      if (invoice.transactionId) map.set(invoice.transactionId, invoice.id);
    });
    return map;
  }, [creditCardInvoicesQuery.data]);

  // Flatten and map entries from API (includes isSkipped = "ignorado" instances)
  const rawEntries = useMemo(() => {
    if (!entriesQuery.data) return [];

    return (entriesQuery.data?.data ?? []).map((item) => ({
      id: item.id,
      date: item.date.split('T')[0], // Garante formato YYYY-MM-DD
      type: item.type as FlowType,
      amount: item.amount,
      description: item.description,
      categoryId: item.categoryId,
      category: item.category,
      isPaid: item.isPaid,
      tipoDespesa: item.tipoDespesa,
      templateId: item.templateId,
      isSkipped: item.isSkipped,
      creditCardInvoiceId: transactionToInvoiceId.get(item.id),
    }));
  }, [entriesQuery.data, transactionToInvoiceId]);

  // Entries that count toward balances/totals: skipped ("ignorado") instances
  // are excluded, since they represent an explicitly-empty occurrence.
  const entries = useMemo(() => rawEntries.filter((e) => !e.isSkipped), [rawEntries]);

  // Map recurring templates from API (backend, uppercase type) to RecurringTemplateLike (lowercase)
  const recurringTemplates = useMemo<RecurringTemplateLike[]>(() => {
    if (!recurringTemplatesQuery.data) return [];

    return recurringTemplatesQuery.data.map((t) => ({
      id: t.id,
      description: t.description,
      estimatedAmount: t.estimatedAmount,
      type: t.type.toLowerCase() as FlowType,
      dayOfMonth: t.dayOfMonth,
      isActive: t.isActive,
      categoryId: t.categoryId,
      category: t.category,
      endDate: t.endDate,
      totalOccurrences: t.totalOccurrences,
      occurrenceCount: t.occurrenceCount,
      creditCardId: t.creditCardId,
    }));
  }, [recurringTemplatesQuery.data]);

  const creditCards = useMemo<CreditCardLike[]>(
    () =>
      (creditCardsQuery.data ?? []).map((card) => ({
        id: card.id,
        name: card.name,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        paymentDay: card.paymentDay,
        isActive: card.isActive,
      })),
    [creditCardsQuery.data],
  );

  const addEntry = useCallback(
    (entry: Omit<CashFlowEntry, 'id'>) => {
      const { category, ...rest } = entry;
      addEntryMutation.mutate({ ...rest, description: rest.description ?? '' });
    },
    [addEntryMutation],
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<CashFlowEntry>) => {
      updateEntryMutation.mutate({ id, ...updates });
    },
    [updateEntryMutation],
  );

  const deleteEntry = useCallback(
    (id: string) => {
      deleteEntryMutation.mutate({ id });
    },
    [deleteEntryMutation],
  );

  const updateSaldoInicial = useCallback(
    (data: { value: number; date: string }) => {
      updateMeMutation.mutate({
        currentBalance: data.value,
        balanceStartDate: data.date,
      });
    },
    [updateMeMutation],
  );

  const updateStartDay = useCallback(
    (day: number) => {
      updateMeMutation.mutate({ cashflowStartDay: day });
    },
    [updateMeMutation],
  );

  const updateBalanceSettings = useCallback(
    (settings: BalanceSettings) => {
      updateMeMutation.mutate({
        greenThreshold: settings.greenThreshold,
        yellowThreshold: settings.yellowThreshold,
      });
    },
    [updateMeMutation],
  );

  // Range covered by all periods (historical + future), used to synthesize
  // virtual entries from recurring templates for that whole window.
  const periodRanges = useMemo(
    () => getPeriodRanges(entries, saldoInicial, 60, startDay),
    [entries, saldoInicial, startDay],
  );

  // Início do período atual: ocorrências não realizadas a partir daqui continuam
  // sendo geradas mesmo já vencidas (aparecem como "vencida" nas pendências, em
  // vez de sumir). Limitado a partir da data do saldo inicial para não ressuscitar
  // recorrências anteriores ao saldo conhecido.
  const overdueFrom = useMemo(() => {
    const periodStart = getPeriodForDate(localDateStr(), startDay).startDate;
    return periodStart > saldoInicial.date ? periodStart : saldoInicial.date;
  }, [startDay, saldoInicial.date]);

  // Map credit card invoices from API to CreditCardInvoiceLike
  const creditCardInvoices = useMemo<CreditCardInvoiceLike[]>(() => {
    if (!creditCardInvoicesQuery.data) return [];

    return creditCardInvoicesQuery.data.map((invoice) => ({
      id: invoice.id,
      cardId: invoice.cardId,
      cardName: invoice.cardName,
      cardIsActive: invoice.cardIsActive,
      referenceMonth: invoice.referenceMonth,
      referenceYear: invoice.referenceYear,
      paymentDate: invoice.paymentDate,
      totalAmount: invoice.totalAmount,
      isPaid: invoice.isPaid,
      transactionId: invoice.transactionId,
      purchaseTemplateIds: invoice.purchaseTemplateIds,
    }));
  }, [creditCardInvoicesQuery.data]);

  const virtualEntries = useMemo(() => {
    if (periodRanges.length === 0) return [];
    const firstStart = periodRanges[0].start;
    const lastEnd = periodRanges[periodRanges.length - 1].end;
    // Uses rawEntries so a skipped ("ignorado") instance also blocks regenerating
    // the virtual estimate for that month.
    // Templates linked to a credit card are excluded here: their impact reaches
    // the cashflow via the invoice (see cardProjectionEntries below).
    const recurringEntries = generateVirtualEntriesForRange(
      recurringTemplates.filter((t) => !t.creditCardId),
      rawEntries,
      firstStart,
      lastEnd,
      overdueFrom,
    );
    const invoiceEntries = generateInvoiceEntriesForRange(creditCardInvoices, firstStart, lastEnd);
    return [...recurringEntries, ...invoiceEntries];
  }, [recurringTemplates, rawEntries, creditCardInvoices, periodRanges, overdueFrom]);

  // Future occurrences of card-linked recurring templates: pending confirmations
  // (occurrence date) and projected invoice charges (invoice payment date).
  const { pendingEntries: cardPendingEntries, projectionEntries: cardProjectionEntries } =
    useMemo(() => {
      if (periodRanges.length === 0) return { pendingEntries: [], projectionEntries: [] };
      return generateCardTemplateEntriesForRange(
        recurringTemplates,
        creditCards,
        creditCardInvoices,
        rawEntries,
        periodRanges[0].start,
        periodRanges[periodRanges.length - 1].end,
        undefined,
        overdueFrom,
      );
    }, [
      recurringTemplates,
      creditCards,
      creditCardInvoices,
      rawEntries,
      periodRanges,
      overdueFrom,
    ]);

  const periods = useMemo(
    () => generatePeriods(entries, virtualEntries, saldoInicial, 60, startDay),
    [entries, virtualEntries, saldoInicial, startDay],
  );

  // "Projetado": também compromete as ocorrências futuras de recorrentes de
  // cartão, lançadas na data de pagamento da fatura do ciclo correspondente.
  const periodsProjected = useMemo(
    () =>
      cardProjectionEntries.length === 0
        ? null
        : generatePeriods(
            entries,
            [...virtualEntries, ...cardProjectionEntries],
            saldoInicial,
            60,
            startDay,
          ),
    [entries, virtualEntries, cardProjectionEntries, saldoInicial, startDay],
  );

  // Includes skipped entries so the drawer can show them as "Ignorado" with a
  // "Reativar" action; they're excluded from `entries`/`periods` totals above.
  const allEntries = useMemo(
    () => [...rawEntries, ...virtualEntries],
    [rawEntries, virtualEntries],
  );

  // Current balance: last historical day
  const today = localDateStr();
  const currentBalance = useMemo(() => {
    for (const p of periods) {
      for (const d of p.days) {
        if (d.date === today) return d.saldoAcumulado;
      }
    }
    // Fallback: last day with data
    const allDays = periods.flatMap((p) => p.days);
    const pastDays = allDays.filter((d) => d.date <= today);
    return pastDays.length > 0 ? pastDays[pastDays.length - 1].saldoAcumulado : saldoInicial.value;
  }, [periods, today, saldoInicial]);

  // Monthly summary for current month
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const monthEntries = entries.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      totalIncome: monthEntries
        .filter((e) => e.type === 'income')
        .reduce((s, e) => s + e.amount, 0),
      totalExpense: monthEntries
        .filter((e) => e.type === 'expense')
        .reduce((s, e) => s + e.amount, 0),
      totalInvestment: monthEntries
        .filter((e) => e.type === 'investment')
        .reduce((s, e) => s + e.amount, 0),
    };
  }, [entries]);

  // Chart data from all periods
  const allDays = useMemo(() => periods.flatMap((p) => p.days), [periods]);
  const allDaysProjected = useMemo(
    () => (periodsProjected ? periodsProjected.flatMap((p) => p.days) : allDays),
    [periodsProjected, allDays],
  );

  // Alerts
  const alerts = useMemo(() => {
    const result: string[] = [];
    const futureDays = allDays.filter((d) => d.date > today);
    const negDay = futureDays.find((d) => d.saldoAcumulado < 0);
    if (negDay) {
      const daysUntil = Math.ceil(
        (new Date(negDay.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      result.push(`⚠️ Saldo ficará negativo em ${daysUntil} dias (${negDay.date})`);
      result.push(
        `💡 Reduza R$ ${Math.abs(negDay.saldoAcumulado).toFixed(2)} em gastos para evitar saldo negativo`,
      );
    }
    if (currentBalance < 300) {
      result.push('🔴 Saldo atual está em nível crítico (< R$ 300)');
    } else if (currentBalance < 500) {
      result.push('🟡 Saldo atual está em nível de atenção (< R$ 500)');
    }
    return result;
  }, [allDays, today, currentBalance]);

  const hasLoggedLoad = useRef(false);

  // True while any of the data this projection depends on is loading for the
  // first time — used to avoid flashing a zero-balance/empty period before
  // real data arrives.
  const isLoading =
    entriesQuery.isLoading ||
    isMeLoading ||
    recurringTemplatesQuery.isLoading ||
    creditCardInvoicesQuery.isLoading ||
    creditCardsQuery.isLoading;

  const isError =
    entriesQuery.isError ||
    isMeError ||
    recurringTemplatesQuery.isError ||
    creditCardInvoicesQuery.isError ||
    creditCardsQuery.isError;

  useEffect(() => {
    if (!isLoading && !isError && !hasLoggedLoad.current) {
      hasLoggedLoad.current = true;
      logger.info('Dashboard loaded', {
        entriesCount: entries.length,
        periodsCount: periods.length,
        currentBalance,
      });
    }
  }, [isLoading, isError, entries.length, periods.length, currentBalance]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      entriesQuery.refetch(),
      refetchMe(),
      recurringTemplatesQuery.refetch(),
      creditCardInvoicesQuery.refetch(),
      creditCardsQuery.refetch(),
    ]);
  }, [entriesQuery, refetchMe, recurringTemplatesQuery, creditCardInvoicesQuery, creditCardsQuery]);

  return {
    entries,
    allEntries,
    virtualEntries,
    cardPendingEntries,
    recurringTemplates,
    saldoInicial,
    periods,
    allDays,
    allDaysProjected,
    currentBalance,
    monthlySummary,
    alerts,
    simulationAdjustment,
    isLoading,
    isError,
    refetchAll,
    isSavingBalance: updateMeMutation.isPending,
    addEntry,
    updateEntry,
    deleteEntry,
    updateSaldoInicial,
    updateStartDay,
    startDay,
    balanceSettings,
    updateBalanceSettings,
    setSimulationAdjustment,
  };
}

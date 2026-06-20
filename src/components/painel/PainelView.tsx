import { useEffect, useRef, useState } from 'react';
import { CashFlowEntry, FlowType } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { PeriodNav } from './PeriodNav';
import { DayList } from './DayList';
import { DailyEntriesDrawer, DailyEntriesState } from './DailyEntriesDrawer';
import { DashboardSummary } from './DashboardSummary';
import { AddEntryDrawer } from './AddEntryDrawer';
import { useCashFlow } from '@/hooks/useCashFlow';
import { EntryFormValues } from './EntryForm';
import { ChevronDown, Filter, Loader2, Plus } from 'lucide-react';
import { setQuickAddHandler } from '@/lib/quickAdd';
import { InvoiceDetailDrawer } from '@/components/credit-cards/InvoiceDetailDrawer';
import { ServerErrorState } from '@/components/ui/server-error-state';
import { ActionsSection } from './ActionsSection';
import { ImportOfxDrawer } from '@/components/imports/ImportOfxDrawer';
import { useTranslations } from '@/i18n/useTranslations';

interface PainelViewProps {
  onAddEntry: (entry: Omit<CashFlowEntry, 'id'>) => void;
  onUpdateEntry: (id: string, updates: Partial<CashFlowEntry>) => void;
  onDeleteEntry: (id: string) => void;
}

export function PainelView({
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: PainelViewProps) {
  const t = useTranslations('dashboard');
  const { periods, allDays, currentBalance, balanceSettings, saldoInicial, allEntries, isLoading, isError, refetchAll } = useCashFlow();

  const [periodIdx, setPeriodIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [sheet, setSheet] = useState<DailyEntriesState | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isAddingInHeader, setIsAddingInHeader] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showPastDays, setShowPastDays] = useState(false);
  const userNavigatedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const findTodayPeriodIdx = () => {
    const today = new Date().toISOString().split('T')[0];
    const idx = periods.findIndex(
      (p) => p.startDate <= today && p.endDate >= today,
    );
    return idx >= 0 ? idx : 0;
  };

  // Date-dependent initial period must be resolved on the client only,
  // otherwise SSR and hydration can pick different periods if "now" crosses
  // a period boundary between the two renders. Re-runs whenever `periods`
  // changes (e.g. once real entries/balance data load and shift today's
  // index) until the user manually navigates away.
  useEffect(() => {
    if (!userNavigatedRef.current) {
      setPeriodIdx(findTodayPeriodIdx());
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods]);

  // Show the floating "new entry" button once the user scrolls past the
  // header/summary, giving quick access while browsing "Dias do perÃ­odo".
  // Depends on `mounted` because the root element (and its ref) only exists
  // once the component renders past the hydration guard below.
  useEffect(() => {
    const scrollEl = rootRef.current?.closest('main');
    if (!scrollEl) return;
    const onScroll = () => setShowFab(scrollEl.scrollTop > 160);
    scrollEl.addEventListener('scroll', onScroll);
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, [mounted]);

  // Let the mobile bottom nav's "+" button open this page's add-entry drawer.
  useEffect(() => {
    setQuickAddHandler(() => setIsAddingInHeader(true));
    return () => setQuickAddHandler(null);
  }, []);

  const period = periods[periodIdx];

  if (!mounted) return null;

  if (isError) {
    return <ServerErrorState onRetry={refetchAll} />;
  }

  if (isLoading || !period) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm font-medium">{t('loadingCashflow')}</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isCurrentPeriod = period.startDate <= today && period.endDate >= today;

  const pendingDaysCount = period.days.filter((d) => d.hasPendingRecurring).length;
  const displayedDays = showPendingOnly
    ? period.days.filter((d) => d.hasPendingRecurring)
    : period.days;

  const pastDays = isCurrentPeriod ? displayedDays.filter((d) => d.date < today) : [];
  const fromTodayDays = isCurrentPeriod ? displayedDays.filter((d) => d.date >= today) : displayedDays;

  const handleHeaderAddSave = (values: EntryFormValues) => {
    onAddEntry({
      date: values.date,
      amount: parseFloat(values.amount.replace(',', '.')),
      type: values.type,
      description: values.description,
      categoryId: values.categoryId,
    });
    setIsAddingInHeader(false);
  };

  const handlePrev = () => {
    userNavigatedRef.current = true;
    setShowPastDays(false);
    setPeriodIdx((i) => Math.max(0, i - 1));
  };
  const handleNext = () => {
    userNavigatedRef.current = true;
    setShowPastDays(false);
    setPeriodIdx((i) => Math.min(periods.length - 1, i + 1));
  };
  const handleToday = () => {
    userNavigatedRef.current = true;
    setShowPastDays(false);
    setPeriodIdx(findTodayPeriodIdx());
  };

  return (
    <div ref={rootRef} className="flex flex-col w-full pb-24 overflow-x-hidden">
      {/* Premium Header */}
      <div className="px-5 pt-10 pb-4 space-y-2">
         <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-black font-display tracking-tight text-white leading-none">
              <span className="text-white">Nu</span><span className="text-brand-gradient">Bolso</span>
            </h1>
            <div className="shrink-0 flex items-center gap-2">
               <ImportOfxDrawer />
               <AddEntryDrawer
                 isOpen={isAddingInHeader}
                 onOpen={() => setIsAddingInHeader(true)}
                 onSave={handleHeaderAddSave}
                 onCancel={() => setIsAddingInHeader(false)}
                 minDate={saldoInicial.date}
               />
            </div>
         </div>
         
         <div className="flex items-center gap-1 -ml-1 w-full pr-1">
           <PeriodNav
             periods={periods}
             periodIdx={periodIdx}
             onPrev={handlePrev}
             onNext={handleNext}
             onToday={handleToday}
             isCurrentPeriod={isCurrentPeriod}
           />
         </div>
      </div>

      <div className="mt-2">
        <DashboardSummary
          period={period}
          allDays={allDays}
          currentBalance={currentBalance}
          today={today}
          balanceSettings={balanceSettings}
        />
      </div>

      <div className="px-5 py-4 flex items-center justify-between">
        <h3 className="text-xl font-bold font-display text-white">
          {t('periodDays')}
        </h3>
        <button
          onClick={() => setShowPendingOnly((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-colors",
            showPendingOnly
              ? "bg-primary/20 text-primary border-primary/50 shadow-glow"
              : "bg-card border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground",
          )}
        >
          <Filter className="w-4 h-4" />
          <span>{showPendingOnly ? t('withPending') : t('filter')}</span>
          {pendingDaysCount > 0 && (
            <span
              className={cn(
                "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                showPendingOnly ? "bg-primary text-primary-foreground" : "bg-amber-400/20 text-amber-400",
              )}
            >
              {pendingDaysCount}
            </span>
          )}
        </button>
      </div>

      {displayedDays.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground/60 font-medium">
            {t('noPendingDays')}
          </p>
        </div>
      ) : (
        <>
          {isCurrentPeriod && pastDays.length > 0 && (
            <div className="px-5 mb-1">
              <button
                onClick={() => setShowPastDays((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
              >
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showPastDays && 'rotate-180')} />
                {pastDays.length === 1
                  ? `${showPastDays ? t('hide') : t('show')} 1 ${t('previousDay')}`
                  : `${showPastDays ? t('hide') : t('show')} ${pastDays.length} ${t('previousDays')}`}
              </button>
              {showPastDays && (
                <DayList
                  period={{ ...period, days: pastDays }}
                  today={today}
                  onOpenSheet={setSheet}
                  onAddEntry={onAddEntry}
                />
              )}
            </div>
          )}
          <DayList
            period={{ ...period, days: fromTodayDays }}
            today={today}
            onOpenSheet={setSheet}
            onAddEntry={onAddEntry}
          />
        </>
      )}

      {/* Subtle period nav at the end of the day list */}
      <div className="px-5 pt-4 mt-2 border-t border-white/5 opacity-70">
        <PeriodNav
          periods={periods}
          periodIdx={periodIdx}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          isCurrentPeriod={isCurrentPeriod}
        />
      </div>

      {sheet && (
        <DailyEntriesDrawer
          sheet={sheet}
          entries={allEntries}
          onClose={() => setSheet(null)}
          onAddEntry={onAddEntry}
          onUpdateEntry={onUpdateEntry}
          onDeleteEntry={onDeleteEntry}
          onPayInvoice={setSelectedInvoiceId}
          minDate={saldoInicial.date}
        />
      )}

      <InvoiceDetailDrawer
        invoiceId={selectedInvoiceId}
        open={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />

      {/* Floating quick-add button (desktop only), appears once the user scrolls down */}
      {showFab && !isAddingInHeader && !sheet && (
        <button
          onClick={() => setIsAddingInHeader(true)}
          aria-label={t('loadingCashflow')}
          className="hidden sm:flex fixed z-[60] bottom-8 right-8 w-12 h-12 rounded-full bg-gradient-primary text-white shadow-glow items-center justify-center hover:scale-105 active:scale-95 transition-all animate-fade-in"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

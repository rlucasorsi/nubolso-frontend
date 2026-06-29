'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCashFlow } from '@/hooks/useCashFlow';
import { CashFlowEntry, FlowType, formatCurrency, Period } from '@/lib/cashflow';
import { TYPE_CONFIG } from './config';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { TextInputField, AmountInputField, DateInputField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import { ChevronDown, Search, X, CheckCircle2, RotateCw } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import { getDateFnsLocale } from '@/i18n/dateFnsLocale';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { useRealizeRecurringTemplate } from '@/modules/recurring-templates/hooks/use-realize-recurring-template';
import { useRealizeAllRecurringTemplates } from '@/modules/recurring-templates/hooks/use-realize-all-recurring-templates';
import {
  usePendingAlertDays,
  getPendingAlertStatus,
  daysUntil,
  AlertStatus,
} from '@/hooks/usePendingAlertDays';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCheck } from 'lucide-react';

interface PendingEntriesViewProps {
  period: Period;
}

type TypeFilter = FlowType | 'all';

function formatDayHeader(dateStr: string, dateFnsLocale: Locale) {
  const date = new Date(dateStr + 'T12:00:00');
  const label = format(date, 'EEEE, dd MMM', { locale: dateFnsLocale });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function AlertBadge({
  status,
  entryDate,
  today,
  t,
}: {
  status: AlertStatus;
  entryDate: string;
  today: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (status === 'overdue') {
    return (
      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
        {t('pendingOverdue')}
      </span>
    );
  }

  const days = daysUntil(today, entryDate);
  let label: string;
  if (days === 0) label = t('pendingDueToday');
  else if (days === 1) label = t('pendingDueTomorrow');
  else label = t('pendingDueInDays', { days });

  return (
    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-400 border border-amber-400/20">
      {label}
    </span>
  );
}

export function PendingEntriesView({ period }: PendingEntriesViewProps) {
  const t = useTranslations('dashboard');
  const td = useTranslations('dailyEntries');
  const typeT = useTranslations('entry');
  const { locale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale(locale);
  const { virtualEntries } = useCashFlow();
  const { alertDays } = usePendingAlertDays();

  const today = new Date().toISOString().split('T')[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [alertOnly, setAlertOnly] = useState(false);
  const [realizingId, setRealizingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ amount: '', date: '', description: '' });
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  const { mutate: realize, isPending: isSubmitting } = useRealizeRecurringTemplate();
  const { mutate: realizeAll, isPending: isRealizingAll } = useRealizeAllRecurringTemplates();

  const [confirmAllDialogOpen, setConfirmAllDialogOpen] = useState(false);
  const [confirmAllMode, setConfirmAllMode] = useState<'all' | 'overdue'>('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // All pending entries for the period
  const allPendingEntries = useMemo(
    () =>
      virtualEntries.filter((e) => {
        if (!e.isVirtual || !e.templateId) return false;
        return e.date >= period.startDate && e.date <= period.endDate;
      }),
    [virtualEntries, period],
  );

  const filteredEntries = useMemo(() => {
    let list = allPendingEntries;
    if (alertOnly)
      list = list.filter((e) => getPendingAlertStatus(e.date, today, alertDays) !== null);
    if (typeFilter !== 'all') list = list.filter((e) => e.type === typeFilter);
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      list = list.filter(
        (e) => e.description?.toLowerCase().includes(s) || String(e.amount).includes(s),
      );
    }
    return list;
  }, [allPendingEntries, alertOnly, typeFilter, debouncedSearch, today, alertDays]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, CashFlowEntry[]>();
    for (const entry of filteredEntries) {
      const list = map.get(entry.date);
      if (list) list.push(entry);
      else map.set(entry.date, [entry]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEntries]);

  const overdueEntries = useMemo(
    () =>
      allPendingEntries.filter(
        (e) => getPendingAlertStatus(e.date, today, alertDays) === 'overdue',
      ),
    [allPendingEntries, today, alertDays],
  );

  const dialogEntries = confirmAllMode === 'overdue' ? overdueEntries : allPendingEntries;

  const dialogSummary = useMemo(() => {
    let income = 0;
    let outflow = 0;
    for (const e of dialogEntries) {
      if (e.type === 'income') income += e.amount;
      else outflow += e.amount;
    }
    return { income, outflow, count: dialogEntries.length };
  }, [dialogEntries]);

  const openConfirmAllDialog = (mode: 'all' | 'overdue') => {
    setConfirmAllMode(mode);
    setConfirmAllDialogOpen(true);
  };

  const handleRealizeAll = () => {
    const items = dialogEntries
      .filter((e) => e.templateId != null)
      .map((e) => ({ id: e.templateId!, amount: e.amount, date: e.date }));

    realizeAll(items, {
      onSuccess: () => {
        setConfirmAllDialogOpen(false);
        toast({ title: t('pendingConfirmAllSuccess', { count: items.length }) });
      },
      onError: () => {
        toast({ title: t('pendingConfirmAllError'), variant: 'destructive' });
      },
    });
  };

  const startRealize = (entry: CashFlowEntry) => {
    setRealizingId(entry.id);
    setEditValues({
      amount: entry.amount.toFixed(2).replace('.', ','),
      date: entry.date,
      description: entry.description || '',
    });
  };

  const cancelRealize = () => setRealizingId(null);

  const confirmRealize = (entry: CashFlowEntry) => {
    if (!entry.templateId) return;
    realize(
      {
        id: entry.templateId,
        amount: parseFloat(editValues.amount.replace(',', '.')),
        date: editValues.date,
      },
      { onSuccess: () => setRealizingId(null) },
    );
  };

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: t('pendingFilterAll') },
    { value: 'income', label: typeT('income') },
    { value: 'expense', label: typeT('expense') },
    { value: 'spending', label: typeT('spending') },
  ];

  return (
    <>
      <div className="px-4 pb-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          {allPendingEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-5">
              <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{t('pendingEmpty')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('pendingEmptyHint')}</p>
            </div>
          ) : (
            <>
              <div className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('pendingSearchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 bg-[#1c1a24] border-none focus:ring-primary/20 rounded-xl"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTypeFilter(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                        typeFilter === opt.value
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'border-white/10 text-muted-foreground hover:bg-white/5',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button
                    onClick={() => setAlertOnly((v) => !v)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                      alertOnly
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-400'
                        : 'border-white/10 text-muted-foreground hover:bg-white/5',
                    )}
                  >
                    {t('pendingFilterAlert')}
                  </button>
                </div>

                {/* Bulk-confirm actions */}
                {allPendingEntries.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {overdueEntries.length > 0 && (
                      <button
                        onClick={() => openConfirmAllDialog('overdue')}
                        disabled={isRealizingAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {t('pendingConfirmOverdue', { count: overdueEntries.length })}
                      </button>
                    )}
                    <button
                      onClick={() => openConfirmAllDialog('all')}
                      disabled={isRealizingAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {t('pendingConfirmAll', { count: allPendingEntries.length })}
                    </button>
                  </div>
                )}
              </div>

              <div className="px-4 space-y-1 pb-4">
                {filteredEntries.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground/60">{t('pendingNoneFound')}</p>
                  </div>
                ) : (
                  groupedByDay.map(([date, dayEntries]) => {
                    const isOpen = !collapsedDays.has(date);
                    return (
                      <Collapsible
                        key={date}
                        open={isOpen}
                        onOpenChange={(open) =>
                          setCollapsedDays((prev) => {
                            const next = new Set(prev);
                            if (!open) next.add(date);
                            else next.delete(date);
                            return next;
                          })
                        }
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                            {formatDayHeader(date, dateFnsLocale)}
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </CollapsibleTrigger>

                        <CollapsibleContent className="space-y-3 pb-3">
                          {dayEntries.map((entry) => {
                            const cfg =
                              TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG] ||
                              TYPE_CONFIG.spending;
                            const isConfirming = realizingId === entry.id;
                            const alertStatus = getPendingAlertStatus(entry.date, today, alertDays);

                            return (
                              <div
                                key={entry.id}
                                className={cn(
                                  'bg-[#1c1a24] border rounded-2xl p-4 transition-all duration-200',
                                  isConfirming ? 'border-primary/30' : 'border-transparent',
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn('p-3 rounded-2xl shrink-0', cfg.bg)}>
                                    {cfg.icon('md')}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-semibold truncate">
                                        {entry.description || '—'}
                                      </p>
                                      {alertStatus && (
                                        <AlertBadge
                                          status={alertStatus}
                                          entryDate={entry.date}
                                          today={today}
                                          t={t}
                                        />
                                      )}
                                    </div>
                                    <p className={cn('text-base font-bold mt-0.5', cfg.color)}>
                                      {cfg.sign} {formatCurrency(entry.amount)}
                                    </p>
                                  </div>
                                  {!isConfirming && (
                                    <button
                                      onClick={() => startRealize(entry)}
                                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                                    >
                                      <RotateCw className="h-3.5 w-3.5" />
                                      {td('apply')}
                                    </button>
                                  )}
                                </div>

                                {isConfirming && (
                                  <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                                    <TextInputField
                                      label={typeT('descriptionLabel')}
                                      value={editValues.description}
                                      onChange={(v) =>
                                        setEditValues((prev) => ({ ...prev, description: v }))
                                      }
                                    />
                                    <div>
                                      <DateInputField
                                        label={td('realizationDate')}
                                        value={editValues.date}
                                        onChange={(v) =>
                                          setEditValues((prev) => ({ ...prev, date: v }))
                                        }
                                      />
                                      <p className="text-xs text-muted-foreground/60 mt-1.5">
                                        {td('dateNote')}
                                      </p>
                                    </div>
                                    <AmountInputField
                                      label={typeT('amount')}
                                      value={editValues.amount}
                                      onChange={(v) =>
                                        setEditValues((prev) => ({ ...prev, amount: v }))
                                      }
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={cancelRealize}
                                        disabled={isSubmitting}
                                        className="h-9 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-semibold"
                                      >
                                        {td('cancel')}
                                      </button>
                                      <button
                                        onClick={() => confirmRealize(entry)}
                                        disabled={isSubmitting}
                                        className="h-9 px-4 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 text-xs font-bold disabled:opacity-50"
                                      >
                                        {td('confirm')}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={confirmAllDialogOpen} onOpenChange={setConfirmAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAllMode === 'overdue'
                ? t('pendingConfirmOverdueDialogTitle', { count: dialogSummary.count })
                : t('pendingConfirmAllDialogTitle', { count: dialogSummary.count })}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <span className="block">{t('pendingConfirmDialogHint')}</span>
              {dialogSummary.income > 0 && (
                <span className="block text-emerald-400 font-semibold">
                  + {formatCurrency(dialogSummary.income)}
                </span>
              )}
              {dialogSummary.outflow > 0 && (
                <span className="block text-red-400 font-semibold">
                  − {formatCurrency(dialogSummary.outflow)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRealizingAll}>
              {t('pendingConfirmDialogCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRealizeAll();
              }}
              disabled={isRealizingAll}
              className="bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 hover:text-white"
            >
              {isRealizingAll
                ? t('pendingConfirmDialogConfirming')
                : t('pendingConfirmDialogConfirm', { count: dialogSummary.count })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

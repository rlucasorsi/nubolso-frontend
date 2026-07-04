'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGetEntries } from '@/modules/entries/hooks/use-get-entries';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { useDeleteEntry } from '@/modules/entries/hooks/use-delete-entry';
import { ServerErrorState } from '@/components/ui/server-error-state';
import {
  CashFlowEntry,
  FlowType,
  RecurringTemplateLike,
  formatCurrency,
  generateVirtualEntriesForRange,
} from '@/lib/cashflow';
import { TYPE_CONFIG } from './config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  CircleDollarSign,
  RotateCw,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { ImportOfxDrawer } from '@/components/imports/ImportOfxDrawer';
import { EditEntryDrawer } from './EditEntryDrawer';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import { getDateFnsLocale } from '@/i18n/dateFnsLocale';
import { useGetMe } from '@/modules/users/hooks/use-get-me';

function formatDayHeader(dateStr: string, dateFnsLocale: Locale) {
  const date = new Date(dateStr + 'T12:00:00');
  const label = format(date, 'EEEE, dd MMM', { locale: dateFnsLocale });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function EntriesView() {
  const t = useTranslations('entries');
  const typeT = useTranslations('entry');
  const dailyT = useTranslations('dailyEntries');
  const { locale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale(locale);
  const { data: me } = useGetMe();
  const minDate = me?.balanceStartDate ? me.balanceStartDate.split('T')[0] : undefined;
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showRecurring] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<'all' | 'fixa' | 'variavel' | 'none'>(
    'all',
  );
  const [editingEntry, setEditingEntry] = useState<CashFlowEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<CashFlowEntry | null>(null);
  const { mutate: deleteEntry, isPending: isDeleting } = useDeleteEntry();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateRange, pageSize, expenseTypeFilter]);

  const filters = useMemo(() => {
    const params: {
      startDate?: string;
      endDate?: string;
      tipoDespesa?: 'fixa' | 'variavel';
      page: number;
      limit: number;
    } = {
      page,
      limit: pageSize,
    };
    if (dateRange?.from) params.startDate = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange?.to) params.endDate = format(dateRange.to, 'yyyy-MM-dd');
    // Envia ao backend quando aplicável (ignorado até o backend suportar). O filtro
    // client-side abaixo garante feedback imediato sobre a página carregada.
    if (expenseTypeFilter === 'fixa' || expenseTypeFilter === 'variavel') {
      params.tipoDespesa = expenseTypeFilter;
    }
    return params;
  }, [dateRange, page, pageSize, expenseTypeFilter]);

  const { data, isLoading, isError, refetch } = useGetEntries(filters);

  const { data: recurringTemplatesData } = useGetRecurringTemplates();

  const recurringTemplates = useMemo<RecurringTemplateLike[]>(() => {
    return (recurringTemplatesData ?? []).map((template) => ({
      id: template.id,
      description: template.description,
      estimatedAmount: template.estimatedAmount,
      type: template.type.toLowerCase() as FlowType,
      dayOfMonth: template.dayOfMonth,
      isActive: template.isActive,
      categoryId: template.categoryId,
      category: template.category,
    }));
  }, [recurringTemplatesData]);

  const entries = useMemo(() => {
    const list: CashFlowEntry[] = (data?.data ?? []).map((item) => ({
      id: item.id,
      date: item.date.split('T')[0],
      type: item.type as FlowType,
      amount: item.amount,
      description: item.description,
      categoryId: item.categoryId,
      category: item.category,
      isPaid: item.isPaid,
      tipoDespesa: item.tipoDespesa,
      templateId: item.templateId,
    }));

    if (showRecurring) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const effStart = filters.startDate ?? `${year}-${String(month).padStart(2, '0')}-01`;
      const effEnd =
        filters.endDate ??
        `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

      list.push(...generateVirtualEntriesForRange(recurringTemplates, list, effStart, effEnd));
    }

    const dateFiltered = minDate ? list.filter((e) => e.date >= minDate) : list;

    // Filtro "Tipo de Despesa" — só se aplica a despesas; qualquer opção diferente de
    // "Todas" oculta lançamentos que não são despesa.
    const typeFiltered =
      expenseTypeFilter === 'all'
        ? dateFiltered
        : dateFiltered.filter((e) => {
            if (e.type !== 'expense') return false;
            if (expenseTypeFilter === 'none') return !e.tipoDespesa;
            return e.tipoDespesa === expenseTypeFilter;
          });

    // Ordena do mais recente para o mais antigo
    const sorted = [...typeFiltered].sort((a, b) => b.date.localeCompare(a.date));

    if (!debouncedSearch) return sorted;

    const search = debouncedSearch.toLowerCase();
    return sorted.filter((entry) => {
      const descMatch = entry.description?.toLowerCase().includes(search);
      const amountMatch = String(entry.amount).includes(search);
      return descMatch || amountMatch;
    });
  }, [
    data,
    debouncedSearch,
    showRecurring,
    recurringTemplates,
    filters,
    expenseTypeFilter,
    minDate,
  ]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, CashFlowEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date);
      if (list) list.push(entry);
      else map.set(entry.date, [entry]);
    }
    return Array.from(map.entries());
  }, [entries]);

  const setDayCollapsed = (date: string, collapsed: boolean) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (collapsed) next.add(date);
      else next.delete(date);
      return next;
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <ImportOfxDrawer />
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[120px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
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

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-10 px-3 justify-start text-left font-normal bg-background/50 border-white/10 hover:bg-white/5 rounded-xl transition-all shrink-0 whitespace-nowrap',
                    !dateRange && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yy')
                    )
                  ) : (
                    <span className="hidden sm:inline">{t('filterPeriod')}</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-2xl border-white/10 shadow-2xl bg-card overflow-hidden"
                collisionPadding={{ top: 72, bottom: 8, left: 8, right: 8 }}
                align="end"
              >
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={dateFnsLocale}
                />
                <div className="p-3 border-t border-white/5 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(undefined)}
                    className="text-xs hover:bg-white/5"
                  >
                    {t('clearFilter')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { value: 'all', label: t('filterAll') },
                { value: 'fixa', label: t('filterFixed') },
                { value: 'variavel', label: t('filterVariable') },
                { value: 'none', label: t('filterNoType') },
              ] as { value: typeof expenseTypeFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExpenseTypeFilter(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                  expenseTypeFilter === opt.value
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 pb-4 space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 w-full bg-card/50 animate-pulse rounded-2xl border border-white/5 mb-3"
              />
            ))
          ) : isError ? (
            <ServerErrorState onRetry={refetch} />
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-full bg-muted/20 mb-4">
                <Search className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-medium">{t('noResults')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('noResultsHint')}</p>
            </div>
          ) : (
            groupedByDay.map(([date, dayEntries]) => {
              const isOpen = !collapsedDays.has(date);
              return (
                <Collapsible
                  key={date}
                  open={isOpen}
                  onOpenChange={(open) => setDayCollapsed(date, !open)}
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
                        TYPE_CONFIG.investment;

                      return (
                        <div
                          key={entry.id}
                          className="group bg-[#1c1a24] border-none rounded-2xl p-3 sm:p-4 transition-all duration-300 flex items-center gap-2.5 sm:gap-4"
                        >
                          <div
                            className={cn(
                              'p-2.5 sm:p-3 rounded-2xl transition-transform group-hover:scale-110 shrink-0',
                              cfg.bg,
                            )}
                          >
                            {entry.type === 'income' ? (
                              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : entry.type === 'expense' ? (
                              <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                              {entry.description || typeT(entry.type)}
                            </p>
                            <p
                              className={cn(
                                'text-sm sm:text-base font-bold whitespace-nowrap mt-0.5',
                                cfg.color,
                              )}
                            >
                              {cfg.sign} {formatCurrency(entry.amount)}
                            </p>
                            {/* badges — visíveis apenas no mobile */}
                            <div className="flex sm:hidden items-center flex-wrap gap-1 mt-1">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-bold whitespace-nowrap">
                                {typeT(entry.type)}
                              </span>
                              {entry.type === 'expense' && entry.tipoDespesa && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'h-4 px-1.5 text-[8px] font-bold whitespace-nowrap',
                                    entry.tipoDespesa === 'fixa'
                                      ? 'border-sky-400/30 text-sky-400 bg-sky-400/10'
                                      : 'border-fuchsia-400/30 text-fuchsia-400 bg-fuchsia-400/10',
                                  )}
                                >
                                  {typeT(
                                    entry.tipoDespesa === 'fixa'
                                      ? 'expenseTypeFixed'
                                      : 'expenseTypeVariable',
                                  )}
                                </Badge>
                              )}
                              {entry.templateId && (
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1.5 gap-1 text-[8px] font-bold border-white/10 text-muted-foreground/70 bg-white/[0.02] whitespace-nowrap"
                                >
                                  <RotateCw className="h-2 w-2" />
                                  {dailyT('recurring')}
                                </Badge>
                              )}
                              {entry.isVirtual ? (
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1.5 text-[8px] font-bold border-amber-400/30 text-amber-400 bg-amber-400/10 whitespace-nowrap"
                                >
                                  {dailyT('estimated')}
                                </Badge>
                              ) : entry.templateId ? (
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1.5 text-[8px] font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/10 whitespace-nowrap"
                                >
                                  {dailyT('confirmed')}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          {/* coluna de badges — visível apenas em telas maiores */}
                          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold whitespace-nowrap">
                              {typeT(entry.type)}
                            </span>
                            <div className="flex items-center gap-1">
                              {entry.type === 'expense' && entry.tipoDespesa && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'h-5 px-1.5 text-[9px] font-bold whitespace-nowrap',
                                    entry.tipoDespesa === 'fixa'
                                      ? 'border-sky-400/30 text-sky-400 bg-sky-400/10'
                                      : 'border-fuchsia-400/30 text-fuchsia-400 bg-fuchsia-400/10',
                                  )}
                                >
                                  {typeT(
                                    entry.tipoDespesa === 'fixa'
                                      ? 'expenseTypeFixed'
                                      : 'expenseTypeVariable',
                                  )}
                                </Badge>
                              )}
                              {entry.templateId && (
                                <Badge
                                  variant="outline"
                                  className="h-5 px-1.5 gap-1 text-[9px] font-bold border-white/10 text-muted-foreground/70 bg-white/[0.02] whitespace-nowrap"
                                >
                                  <RotateCw className="h-2.5 w-2.5" />
                                  {dailyT('recurring')}
                                </Badge>
                              )}
                              {entry.isVirtual ? (
                                <Badge
                                  variant="outline"
                                  className="h-5 px-1.5 text-[9px] font-bold border-amber-400/30 text-amber-400 bg-amber-400/10 whitespace-nowrap"
                                >
                                  {dailyT('estimated')}
                                </Badge>
                              ) : entry.templateId ? (
                                <Badge
                                  variant="outline"
                                  className="h-5 px-1.5 text-[9px] font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/10 whitespace-nowrap"
                                >
                                  {dailyT('confirmed')}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          {!entry.isVirtual && (
                            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                              <button
                                onClick={() => setEditingEntry(entry)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
                              >
                                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingEntry(entry)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                              >
                                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
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

        {data && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t('perPage')}</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#1c1a24] border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 [&>option]:bg-[#1c1a24] [&>option]:text-foreground"
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)}{' '}
                {t('total', { total: data.total })}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.hasMore}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <EditEntryDrawer
        entry={editingEntry}
        open={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        minDate={minDate}
      />

      <AlertDialog
        open={deletingEntry !== null}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent className="bg-card border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl border-white/10 hover:bg-white/5"
              onClick={() => setDeletingEntry(null)}
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (deletingEntry) {
                  deleteEntry(
                    { id: deletingEntry.id },
                    { onSuccess: () => setDeletingEntry(null) },
                  );
                }
              }}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

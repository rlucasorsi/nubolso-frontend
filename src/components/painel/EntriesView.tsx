'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGetEntries } from '@/modules/entries/hooks/use-get-entries';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { ServerErrorState } from '@/components/ui/server-error-state';
import { CashFlowEntry, FlowType, RecurringTemplateLike, formatCurrency, generateVirtualEntriesForRange } from '@/lib/cashflow';
import { TYPE_CONFIG } from './config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  CircleDollarSign,
  RotateCw,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { ImportOfxDrawer } from '@/components/imports/ImportOfxDrawer';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import { getDateFnsLocale } from '@/i18n/dateFnsLocale';

export function EntriesView() {
  const t = useTranslations('entries');
  const typeT = useTranslations('entry');
  const dailyT = useTranslations('dailyEntries');
  const { locale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale(locale);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showRecurring, setShowRecurring] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filters = useMemo(() => {
    const params: { startDate?: string; endDate?: string } = {};
    if (dateRange?.from) {
      params.startDate = format(dateRange.from, 'yyyy-MM-dd');
    }
    if (dateRange?.to) {
      params.endDate = format(dateRange.to, 'yyyy-MM-dd');
    }
    return params;
  }, [dateRange]);

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
    const list: CashFlowEntry[] = (data ?? []).map((item) => ({
      id: item.id,
      date: item.date.split('T')[0],
      type: item.type as FlowType,
      amount: item.amount,
      description: item.description,
      categoryId: item.categoryId,
      category: item.category,
      isPaid: item.isPaid,
      templateId: item.templateId,
    }));

    if (showRecurring) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const effStart = filters.startDate ?? `${year}-${String(month).padStart(2, '0')}-01`;
      const effEnd = filters.endDate ?? `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

      list.push(...generateVirtualEntriesForRange(recurringTemplates, list, effStart, effEnd));
    }

    // Ordena do mais recente para o mais antigo
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));

    if (!debouncedSearch) return sorted;

    const search = debouncedSearch.toLowerCase();
    return sorted.filter((entry) => {
      const descMatch = entry.description?.toLowerCase().includes(search);
      const amountMatch = String(entry.amount).includes(search);
      return descMatch || amountMatch;
    });
  }, [data, debouncedSearch, showRecurring, recurringTemplates, filters]);

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      <div className="px-4 py-6 space-y-4 border-b bg-card/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <ImportOfxDrawer />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 bg-background/50 border-white/10 focus:ring-primary/20 transition-all rounded-xl"
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
                  "h-11 px-4 justify-start text-left font-normal bg-background/50 border-white/10 hover:bg-white/5 rounded-xl transition-all min-w-[240px]",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} -{" "}
                      {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy")
                  )
                ) : (
                  <span>{t('filterPeriod')}</span>
                )}
                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-white/10 shadow-2xl bg-card overflow-hidden" align="end">
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

          <div className="flex items-center gap-2 px-1 h-11 shrink-0">
            <Switch id="show-recurring" checked={showRecurring} onCheckedChange={setShowRecurring} />
            <label htmlFor="show-recurring" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
              {t('showEstimated')}
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 w-full bg-card/50 animate-pulse rounded-2xl border border-white/5" />
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
          entries.map((entry) => {
            const cfg = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.spending;

            return (
              <div
                key={entry.id}
                className="group bg-card/40 hover:bg-card/60 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all duration-300 flex items-center gap-4"
              >
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", cfg.bg)}>
                  {entry.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> :
                   entry.type === 'expense' ? <ArrowDownLeft className="h-5 w-5" /> :
                   <CircleDollarSign className="h-5 w-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {entry.description || typeT(entry.type)}
                    </p>
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-full">
                      {format(new Date(entry.date.split('T')[0] + 'T12:00:00'), 'dd MMM yy', { locale: dateFnsLocale })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className={cn("text-base font-bold", cfg.color)}>
                      {cfg.sign} {formatCurrency(entry.amount)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {entry.templateId && (
                        <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[9px] font-bold border-white/10 text-muted-foreground/70 bg-white/[0.02]">
                          <RotateCw className="h-2.5 w-2.5" />
                          {dailyT('recurring')}
                        </Badge>
                      )}
                      {entry.isVirtual ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold border-amber-400/30 text-amber-400 bg-amber-400/10">
                          {dailyT('estimated')}
                        </Badge>
                      ) : entry.templateId ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                          {dailyT('confirmed')}
                        </Badge>
                      ) : null}
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold">
                        {typeT(entry.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


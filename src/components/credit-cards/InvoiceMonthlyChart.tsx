'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard as CreditCardIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { useGetAllInvoices } from '@/modules/credit-cards/hooks/use-get-all-invoices';
import { formatCurrencyCompact } from '@/lib/cashflow';
import { MONTH_KEYS } from '@/components/painel/config';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';

interface InvoiceMonthlyChartProps {
  onSelectInvoice: (invoiceId: string) => void;
}

type CardFilter = 'all' | string[];

const PAST_MONTHS = 6;
const FUTURE_MONTHS = 6;
const ITEM_WIDTH = 56;
const MAX_BAR_HEIGHT = 104;
const MIN_BAR_HEIGHT = 6;

function monthKey(year: number, month: number) {
  return year * 12 + (month - 1);
}

export function InvoiceMonthlyChart({ onSelectInvoice }: InvoiceMonthlyChartProps) {
  const t = useTranslations('creditCardChart');
  const td = useTranslations('dateNames');
  const { data: cardsData } = useGetCreditCards();
  const { data: invoicesData } = useGetAllInvoices();

  const cards = cardsData ?? [];

  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
  const [openMonthKey, setOpenMonthKey] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didScrollRef = useRef(false);

  const isCardSelected = (cardId: string) => cardFilter === 'all' || cardFilter.includes(cardId);

  const toggleCard = (cardId: string, checked: boolean) => {
    setCardFilter((prev) => {
      if (prev === 'all') return checked ? [cardId] : 'all';
      const next = checked ? [...prev, cardId] : prev.filter((id) => id !== cardId);
      return next.length === 0 ? 'all' : next;
    });
  };

  const buckets = useMemo(() => {
    const invoices = invoicesData ?? [];
    const now = new Date();
    const todayKey = monthKey(now.getFullYear(), now.getMonth() + 1);

    const invoiceKeys = invoices.map((inv) => monthKey(inv.referenceYear, inv.referenceMonth));
    const minKey = Math.min(todayKey - PAST_MONTHS, ...(invoiceKeys.length ? invoiceKeys : [todayKey]));
    const maxKey = Math.max(todayKey + FUTURE_MONTHS, ...(invoiceKeys.length ? invoiceKeys : [todayKey]));

    const filteredInvoices = invoices.filter(
      (inv) => cardFilter === 'all' || cardFilter.includes(inv.cardId),
    );

    const list = [];
    for (let key = minKey; key <= maxKey; key++) {
      const year = Math.floor(key / 12);
      const month = (key % 12) + 1;
      const monthInvoices = filteredInvoices.filter(
        (inv) => inv.referenceYear === year && inv.referenceMonth === month,
      );
      const total = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      list.push({ key, year, month, total, invoices: monthInvoices, isCurrentMonth: key === todayKey });
    }
    return list;
  }, [invoicesData, cardFilter]);

  const maxTotal = Math.max(1, ...buckets.map((b) => b.total));

  // Centers the scroller on the current month once, the first time the
  // range has bars to scroll to (tab content unmounts/remounts on switch,
  // so this naturally re-centers each time the user opens this tab).
  useEffect(() => {
    if (didScrollRef.current || !scrollRef.current) return;
    const idx = buckets.findIndex((b) => b.isCurrentMonth);
    if (idx < 0) return;
    const frame = requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const target = idx * ITEM_WIDTH - scrollRef.current.clientWidth / 2 + ITEM_WIDTH / 2;
      scrollRef.current.scrollLeft = Math.max(target, 0);
      didScrollRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [buckets]);

  const scrollByMonths = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * ITEM_WIDTH * 3, behavior: 'smooth' });
  };

  const handleBarClick = (bucket: (typeof buckets)[number]) => {
    if (bucket.invoices.length === 0) return;
    if (bucket.invoices.length === 1) {
      onSelectInvoice(bucket.invoices[0].id);
      return;
    }
    setOpenMonthKey(bucket.key);
  };

  if (cards.length === 0) return null;

  const filterLabel =
    cardFilter === 'all'
      ? t('allCards')
      : cardFilter.length === 1
        ? cards.find((c) => c.id === cardFilter[0])?.name ?? t('allCards')
        : t('cardsSelected', { count: cardFilter.length });

  return (
    <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white font-display">{t('title')}</h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/10 transition-colors max-w-[160px]"
              >
                <CreditCardIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{filterLabel}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1c1a24] border-white/10 text-white">
              <DropdownMenuCheckboxItem
                checked={cardFilter === 'all'}
                onCheckedChange={() => setCardFilter('all')}
                className="focus:bg-white/10 focus:text-white"
              >
                {t('allCards')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator className="bg-white/10" />
              {cards.map((card) => (
                <DropdownMenuCheckboxItem
                  key={card.id}
                  checked={isCardSelected(card.id)}
                  onCheckedChange={(checked) => toggleCard(card.id, Boolean(checked))}
                  className="focus:bg-white/10 focus:text-white"
                >
                  {card.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative -mx-1">
          <button
            type="button"
            onClick={() => scrollByMonths(-1)}
            aria-label={t('previousMonths')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg bg-[#1c1a24]/90 text-muted-foreground/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto px-7 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {buckets.map((bucket) => {
              const hasInvoice = bucket.invoices.length > 0;
              const barHeight = hasInvoice
                ? Math.max(MIN_BAR_HEIGHT, (bucket.total / maxTotal) * MAX_BAR_HEIGHT)
                : MIN_BAR_HEIGHT;

              return (
                <Popover
                  key={bucket.key}
                  open={openMonthKey === bucket.key}
                  onOpenChange={(o) => !o && setOpenMonthKey(null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleBarClick(bucket)}
                      disabled={!hasInvoice}
                      className={cn(
                        'shrink-0 w-14 flex flex-col items-center justify-end gap-2 pt-2 pb-1',
                        hasInvoice ? 'cursor-pointer' : 'cursor-default opacity-50',
                      )}
                      style={{ height: MAX_BAR_HEIGHT + 36 }}
                    >
                      {hasInvoice && (
                        <span className="text-[8px] font-bold text-muted-foreground/60 leading-none">
                          {formatCurrencyCompact(bucket.total)}
                        </span>
                      )}
                      <div
                        className={cn(
                          'w-8 rounded-[1.5px] transition-all',
                          bucket.isCurrentMonth
                            ? 'bg-[#7b5cff]'
                            : hasInvoice
                              ? 'bg-[#7b5cff]/40'
                              : 'bg-white/10',
                        )}
                        style={{
                          height: barHeight,
                          boxShadow: bucket.isCurrentMonth ? '0 0 16px rgba(123,92,255,0.45)' : undefined,
                        }}
                      />
                      <span
                        className={cn(
                          'text-[9px] font-bold leading-none',
                          bucket.isCurrentMonth ? 'text-[#7b5cff]' : 'text-muted-foreground/60',
                        )}
                      >
                        {td(MONTH_KEYS[bucket.month - 1])}
                      </span>
                      <span className="text-[8px] font-medium text-muted-foreground/40 leading-none">
                        {String(bucket.year).slice(-2)}
                      </span>
                    </button>
                  </PopoverTrigger>

                  {bucket.invoices.length > 1 && (
                    <PopoverContent className="bg-[#1c1a24] border-white/10 text-white w-56 p-2">
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-2 pb-1">
                        {t('chooseInvoice')}
                      </p>
                      <div className="space-y-1">
                        {bucket.invoices.map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => {
                              onSelectInvoice(inv.id);
                              setOpenMonthKey(null);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                          >
                            <span className="text-xs font-semibold truncate">{inv.cardName}</span>
                            <span className="text-xs font-bold text-muted-foreground shrink-0">
                              {formatCurrencyCompact(inv.totalAmount)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollByMonths(1)}
            aria-label={t('nextMonths')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg bg-[#1c1a24]/90 text-muted-foreground/60 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

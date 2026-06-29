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

const PAST_MONTHS = 5;
const FUTURE_MONTHS = 12;
const ARROW_PADDING = 56; // px-7 on each side (28px × 2)
const MAX_BAR_HEIGHT = 160;
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

  const isCardSelected = (id: string) => cardFilter === 'all' || cardFilter.includes(id);

  const toggleCard = (id: string) => {
    if (cardFilter === 'all') {
      setCardFilter(cards.filter((c) => c.id !== id).map((c) => c.id));
      return;
    }
    const next = cardFilter.includes(id) ? cardFilter.filter((c) => c !== id) : [...cardFilter, id];
    setCardFilter(next.length === 0 || next.length === cards.length ? 'all' : next);
  };
  const [openMonthKey, setOpenMonthKey] = useState<number | null>(null);
  const [itemWidth, setItemWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didScrollRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, hasDragged: false });

  const onDragStart = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragRef.current = {
      active: true,
      startX: e.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
      hasDragged: false,
    };
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.scrollBehavior = 'auto';
  };

  const onDragMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    const delta = e.pageX - dragRef.current.startX;
    if (Math.abs(delta) > 4) dragRef.current.hasDragged = true;
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const onDragEnd = () => {
    dragRef.current.active = false;
    if (!scrollRef.current) return;
    scrollRef.current.style.cursor = '';
    scrollRef.current.style.scrollBehavior = '';
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.hasDragged) {
      e.stopPropagation();
      dragRef.current.hasDragged = false;
    }
  };

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;

    const measure = () => {
      if (!el || el.clientWidth <= 0) return;
      const visibleMonths = el.clientWidth < 480 ? 6 : 12;
      setItemWidth((el.clientWidth - ARROW_PADDING) / visibleMonths);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(el);

    // Double-RAF: Radix UI Tabs may briefly hide the active content during
    // initialization, causing the first ResizeObserver fire to see clientWidth=0.
    // This forces a fresh measurement after the browser has fully painted.
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(measure);
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, []);

  const buckets = useMemo(() => {
    const invoices = invoicesData ?? [];
    const now = new Date();
    const todayKey = monthKey(now.getFullYear(), now.getMonth() + 1);

    // Anchor = first open invoice at or after today (fatura atual), or today if none.
    const openFutureKeys = invoices
      .filter((inv) => !inv.isPaid)
      .map((inv) => monthKey(inv.referenceYear, inv.referenceMonth))
      .filter((k) => k >= todayKey);
    const anchorKey = openFutureKeys.length > 0 ? Math.min(...openFutureKeys) : todayKey;

    const minKey = anchorKey - PAST_MONTHS;
    const maxKey = anchorKey + FUTURE_MONTHS;

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
      const hasOpenInvoice = monthInvoices.some((inv) => !inv.isPaid);
      list.push({
        key,
        year,
        month,
        total,
        invoices: monthInvoices,
        isCurrentMonth: key === todayKey,
        hasOpenInvoice,
      });
    }
    return list;
  }, [invoicesData, cardFilter]);

  const maxTotal = Math.max(1, ...buckets.map((b) => b.total));

  useEffect(() => {
    if (!invoicesData || didScrollRef.current || !scrollRef.current || itemWidth <= 0) return;
    const currentIdx = buckets.findIndex((b) => b.isCurrentMonth);
    if (currentIdx < 0) return;
    // Scroll so the first open invoice at or after today is the leftmost visible bar.
    const openIdx = buckets.findIndex((b, i) => i >= currentIdx && b.hasOpenInvoice);
    const idx = openIdx >= 0 ? openIdx : currentIdx;
    const frame = requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const SIDE_PAD = 28; // px-7 padding on each side of the scroll container
      scrollRef.current.scrollLeft = Math.max(idx * itemWidth - SIDE_PAD, 0);
      didScrollRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [buckets, itemWidth]);

  const scrollByMonths = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * itemWidth * 3, behavior: 'smooth' });
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
        ? (cards.find((c) => c.id === cardFilter[0])?.name ?? t('allCards'))
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
                  onCheckedChange={() => toggleCard(card.id)}
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
            className="flex overflow-x-auto px-7 scroll-smooth cursor-grab"
            style={{ scrollbarWidth: 'none' }}
            onMouseDown={onDragStart}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onClickCapture={onClickCapture}
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
                        'shrink-0 flex flex-col items-center justify-end gap-2 pt-2 pb-1',
                        hasInvoice ? 'cursor-pointer' : 'cursor-default opacity-50',
                      )}
                      style={{ height: MAX_BAR_HEIGHT + 36, minWidth: itemWidth || 56 }}
                    >
                      {hasInvoice && (
                        <span className="text-[8px] font-bold text-muted-foreground/60 leading-none">
                          {formatCurrencyCompact(bucket.total)}
                        </span>
                      )}
                      <div
                        className={cn(
                          'rounded-[4px] transition-all',
                          bucket.hasOpenInvoice
                            ? 'bg-[#7b5cff]'
                            : hasInvoice
                              ? 'bg-[#7b5cff]/40'
                              : 'bg-white/10',
                        )}
                        style={{ height: barHeight, width: Math.max(8, (itemWidth || 56) * 0.55) }}
                      />
                      <span
                        className={cn(
                          'text-[9px] font-bold leading-none',
                          bucket.hasOpenInvoice ? 'text-[#7b5cff]' : 'text-muted-foreground/60',
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

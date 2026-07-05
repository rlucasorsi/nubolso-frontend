'use client';

import { useState } from 'react';
import { Pencil, RotateCw, CreditCard, Ban } from 'lucide-react';
import { Sheet, DrawerContent, DrawerHeader, SheetTitle } from '@/components/ui/app-drawer';
import { Badge } from '@/components/ui/badge';
import { CashFlowEntry, formatCurrency } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { EditEntryDrawer } from './EditEntryDrawer';
import { MONTH_KEYS } from './config';

interface CategoryEntriesDrawerProps {
  open: boolean;
  onClose: () => void;
  categoryName: string;
  categoryColor: string;
  periodLabel: string;
  entries: CashFlowEntry[];
  minDate?: string;
}

// Lançamentos reais (persistidos) são editáveis. Estimativas de recorrente
// (isVirtual), faturas e ocorrências ignoradas não são editadas diretamente aqui.
function isEditable(e: CashFlowEntry): boolean {
  return !e.isVirtual && !e.creditCardInvoiceId && !e.isSkipped;
}

function formatShortDate(dateStr: string, monthLabel: (key: string) => string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${monthLabel(MONTH_KEYS[m - 1])}`;
}

export function CategoryEntriesDrawer({
  open,
  onClose,
  categoryName,
  categoryColor,
  periodLabel,
  entries,
  minDate,
}: CategoryEntriesDrawerProps) {
  const t = useTranslations('dashboard');
  const typeT = useTranslations('entry');
  const badgeT = useTranslations('dailyEntries');
  const td = useTranslations('dateNames');
  const [editing, setEditing] = useState<CashFlowEntry | null>(null);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader onClose={onClose}>
            <SheetTitle className="flex items-center gap-2 text-2xl font-bold font-display text-white">
              <span
                className="h-3.5 w-3.5 rounded-full shrink-0"
                style={{ backgroundColor: categoryColor }}
              />
              <span className="truncate">{categoryName}</span>
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {periodLabel} —{' '}
              <span className="font-semibold text-white">{formatCurrency(total)}</span> ·{' '}
              {t('chartsDrawerCount', { count: sorted.length })}
            </p>
          </DrawerHeader>

          <div className="flex-1 px-6 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            {sorted.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground/50 font-medium">{t('chartsEmpty')}</p>
              </div>
            ) : (
              sorted.map((entry) => {
                const editable = isEditable(entry);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    disabled={!editable}
                    onClick={() => editable && setEditing(entry)}
                    className={cn(
                      'w-full text-left bg-[#1c1a24] rounded-2xl p-4 flex items-center gap-3 border border-transparent transition-all',
                      editable
                        ? 'hover:border-white/10 cursor-pointer'
                        : 'cursor-default opacity-80',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {entry.description || typeT(entry.type)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] font-semibold text-muted-foreground/60">
                          {formatShortDate(entry.date, td)}
                        </span>
                        {entry.templateId && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 gap-1 text-[9px] font-bold border-white/10 text-muted-foreground/70 bg-white/[0.02]"
                          >
                            <RotateCw className="h-2.5 w-2.5" />
                            {badgeT('recurring')}
                          </Badge>
                        )}
                        {entry.creditCardInvoiceId && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 gap-1 text-[9px] font-bold border-white/10 text-muted-foreground/70 bg-white/[0.02]"
                          >
                            <CreditCard className="h-2.5 w-2.5" />
                            {badgeT('invoice')}
                          </Badge>
                        )}
                        {entry.isSkipped ? (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 gap-1 text-[9px] font-bold border-white/10 text-muted-foreground/50 bg-white/[0.02]"
                          >
                            <Ban className="h-2.5 w-2.5" />
                            {badgeT('skipped')}
                          </Badge>
                        ) : entry.isVirtual ? (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[9px] font-bold border-amber-400/30 text-amber-400 bg-amber-400/10"
                          >
                            {badgeT('estimated')}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black font-display text-white tabular-nums">
                        {formatCurrency(entry.amount)}
                      </span>
                      {editable && (
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 bg-white/5">
                          <Pencil className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DrawerContent>
      </Sheet>

      <EditEntryDrawer
        entry={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
        minDate={minDate}
      />
    </>
  );
}

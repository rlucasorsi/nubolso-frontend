import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CashFlowEntry, FlowType, formatCurrency } from '@/lib/cashflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TextInputField, AmountInputField, DateInputField } from '@/components/ui/form-field';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  RotateCw,
  RotateCcw,
  Ban,
  X,
  CreditCard,
} from 'lucide-react';
import { EntryFormValues } from './EntryForm';
import { AddEntryDrawer } from './AddEntryDrawer';
import { TYPE_CONFIG, MONTH_KEYS, WEEKDAY_KEYS } from './config';
import { useTranslations } from '@/i18n/useTranslations';
import { useRealizeRecurringTemplate } from '@/modules/recurring-templates/hooks/use-realize-recurring-template';
import { useSkipRecurringTemplate } from '@/modules/recurring-templates/hooks/use-skip-recurring-template';
import { useReopenInvoice } from '@/modules/credit-cards/hooks/use-reopen-invoice';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
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

const TYPE_ORDER: Record<FlowType, number> = {
  income: 0,
  expense: 1,
  spending: 2,
};

function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export interface DailyEntriesState {
  date: string;
  filter: FlowType | 'all';
}

interface DailyEntriesDrawerProps {
  sheet: DailyEntriesState;
  entries: CashFlowEntry[];
  onClose: () => void;
  onAddEntry: (entry: Omit<CashFlowEntry, 'id'>) => void;
  onUpdateEntry: (id: string, updates: Partial<CashFlowEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onPayInvoice?: (invoiceId: string) => void;
  minDate?: string;
}

export function DailyEntriesDrawer({
  sheet,
  entries,
  onClose,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onPayInvoice,
  minDate,
}: DailyEntriesDrawerProps) {
  const canAdd = !minDate || sheet.date >= minDate;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [realizingId, setRealizingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    income: true,
    expense: true,
    spending: true,
  });

  const t = useTranslations('dailyEntries');
  const typeT = useTranslations('entry');
  const td = useTranslations('dateNames');
  const realizeMutation = useRealizeRecurringTemplate();
  const skipMutation = useSkipRecurringTemplate();
  const reopenInvoiceMutation = useReopenInvoice();
  const [reopenInvoiceId, setReopenInvoiceId] = useState<string | null>(null);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const [editValues, setEditValues] = useState<EntryFormValues>({
    date: sheet.date,
    amount: '',
    type: 'income',
    description: '',
  });

  const sheetEntries = entries
    .filter((e) => e.date === sheet.date && (sheet.filter === 'all' || e.type === sheet.filter))
    .sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);

  const d = parseLocal(sheet.date);

  function startEdit(entry: CashFlowEntry) {
    setEditingId(entry.id);
    setEditValues({
      date: entry.date,
      amount: entry.amount.toFixed(2).replace('.', ','),
      type: entry.type,
      description: entry.description || '',
    });
  }

  function handleSaveEdit() {
    if (!editingId) return;

    onUpdateEntry(editingId, {
      amount: parseFloat(editValues.amount.replace(',', '.')) || 0,
      type: editValues.type,
      description: editValues.description || undefined,
    });

    setEditingId(null);
  }

  function startRealize(entry: CashFlowEntry) {
    setRealizingId(entry.id);
    setEditingId(null);
    setEditValues({
      date: entry.date,
      amount: entry.amount.toFixed(2).replace('.', ','),
      type: entry.type,
      description: entry.description || '',
    });
  }

  function handleConfirmRealize(entry: CashFlowEntry) {
    if (!entry.templateId) return;

    realizeMutation.mutate({
      id: entry.templateId,
      amount: parseFloat(editValues.amount.replace(',', '.')) || 0,
      date: editValues.date,
    });

    setRealizingId(null);
  }

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Reverts a realized recurring transaction back to "não efetivado": deletes
  // the real Transaction so the projection regenerates the estimate again.
  const handleDelete = () => {
    if (deleteConfirmId) {
      onDeleteEntry(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Marks this month's occurrence as permanently "Ignorado": works both for a
  // pending estimate (creates a skip record) and a realized transaction
  // (converts it into a skip record), in both cases stopping it from
  // generating an estimate again until the user clicks "Reativar".
  const handlePermanentSkip = () => {
    const target = sheetEntries.find((e) => e.id === deleteConfirmId);
    if (target?.templateId) {
      skipMutation.mutate({ id: target.templateId, date: target.date });
    }
    setDeleteConfirmId(null);
  };

  const handleReopenInvoice = async () => {
    if (!reopenInvoiceId) return;

    setReopenError(null);
    try {
      await reopenInvoiceMutation.mutateAsync(reopenInvoiceId);
      setReopenInvoiceId(null);
    } catch (err) {
      setReopenError(extractErrorMessage(err, t('reopenError')));
    }
  };

  return (
    <>
      <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader onClose={onClose}>
            <SheetTitle className="text-2xl font-bold font-display text-primary">
              {sheet.filter === 'all' ? t('dayView') : typeT(sheet.filter)}
            </SheetTitle>
            <p className="text-sm text-white font-semibold">
              {String(d.getDate()).padStart(2, '0')} {td(MONTH_KEYS[d.getMonth()]).toUpperCase()}{' '}
              {d.getFullYear()} — {td(WEEKDAY_KEYS[d.getDay()])}
            </p>
          </DrawerHeader>

          <div className="flex-1 px-6 py-4 space-y-8 overflow-y-auto custom-scrollbar">
            {sheetEntries.length === 0 && !isAdding && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30">
                <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                  <Plus className="h-10 w-10 opacity-10" />
                </div>
                <p className="text-base font-semibold tracking-tight">{t('noRecords')}</p>
                <p className="text-xs mt-1">{t('cleanSlate')}</p>
              </div>
            )}

            {(['income', 'expense', 'spending'] as FlowType[]).map((type) => {
              const typeEntries = sheetEntries.filter((e) => e.type === type);
              if (typeEntries.length === 0) return null;

              const cfg = TYPE_CONFIG[type];
              const total = typeEntries.reduce((acc, e) => acc + e.amount, 0);
              const isExpanded = expandedGroups[type];

              return (
                <div key={type} className="space-y-5">
                  <button
                    onClick={() => toggleGroup(type)}
                    className="w-full flex items-center gap-4 group/header"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl ${cfg.bg} flex items-center justify-center shadow-lg transition-transform group-hover/header:scale-110`}
                    >
                      {cfg.icon('md')}
                    </div>
                    <h4 className={`text-xs font-black uppercase tracking-[0.25em] ${cfg.color}`}>
                      {typeT(type)}
                    </h4>

                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent/0 mx-2"></div>

                    <div className="text-right flex items-center gap-4">
                      <p className="text-sm font-black text-white font-display">
                        {formatCurrency(total)}
                      </p>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-muted-foreground/30 transition-transform duration-300',
                          isExpanded ? 'rotate-180' : '',
                        )}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      {typeEntries.map((entry) => {
                        const isEditing = editingId === entry.id;
                        const isRealizing = realizingId === entry.id;
                        const isConfirmingDelete = deleteConfirmId === entry.id;
                        const isRealizedRecurring =
                          !!entry.templateId && !entry.isVirtual && !entry.isSkipped;
                        const isPendingRecurring = !!entry.templateId && !!entry.isVirtual;
                        const isPendingInvoice = !!entry.creditCardInvoiceId && !!entry.isVirtual;
                        const isPaidInvoice = !!entry.creditCardInvoiceId && !entry.isVirtual;

                        return (
                          <div key={entry.id} className="relative group/card">
                            <div
                              className={cn(
                                'relative bg-[#1c1a24] rounded-2xl p-4 border border-transparent transition-all duration-300',
                                isEditing || isRealizing || isConfirmingDelete
                                  ? 'ring-1 ring-primary/20'
                                  : 'hover:border-white/5',
                                entry.isSkipped && 'opacity-60',
                              )}
                            >
                              <div
                                className={cn(
                                  'absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-all duration-300',
                                  isConfirmingDelete ? 'bg-red-500' : cfg.bar,
                                )}
                              />

                              {isConfirmingDelete ? (
                                <div className="pl-2 space-y-4">
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={cn(
                                        'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                                        isPendingRecurring
                                          ? 'bg-amber-400/10 text-amber-400'
                                          : 'bg-red-500/10 text-red-500',
                                      )}
                                    >
                                      {isPendingRecurring ? (
                                        <Ban className="h-5 w-5" />
                                      ) : (
                                        <Trash2 className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div className="min-w-0 pt-1.5">
                                      <p className="text-sm font-bold text-white tracking-tight">
                                        {isPendingRecurring
                                          ? t('ignoreMonth')
                                          : isRealizedRecurring
                                            ? t('deleteRecurring')
                                            : t('deleteEntry')}
                                      </p>
                                      <p className="text-xs text-muted-foreground/60 font-medium mt-1">
                                        {isPendingRecurring
                                          ? t('ignoreDescription')
                                          : isRealizedRecurring
                                            ? t('deleteRecurringDescription')
                                            : t('deleteDescription')}
                                      </p>
                                    </div>
                                  </div>

                                  {isRealizedRecurring ? (
                                    <div className="flex flex-col gap-2">
                                      <button
                                        onClick={handleDelete}
                                        className="h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-bold"
                                      >
                                        {t('backToEstimate')}
                                      </button>
                                      <button
                                        onClick={handlePermanentSkip}
                                        className="h-10 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-xs font-bold shadow-lg shadow-red-500/20"
                                      >
                                        {t('deletePermanently')}
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="h-10 rounded-xl bg-transparent text-muted-foreground/60 hover:bg-white/5 hover:text-white transition-all text-xs font-bold"
                                      >
                                        {t('cancel')}
                                      </button>
                                    </div>
                                  ) : isPendingRecurring ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="flex-1 h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-bold"
                                      >
                                        {t('cancel')}
                                      </button>
                                      <button
                                        onClick={handlePermanentSkip}
                                        className="flex-1 h-10 rounded-xl bg-amber-400 text-[#1c1a24] hover:bg-amber-300 transition-all text-xs font-bold shadow-lg shadow-amber-400/20"
                                      >
                                        {t('ignore')}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="flex-1 h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-bold"
                                      >
                                        {t('cancel')}
                                      </button>
                                      <button
                                        onClick={handleDelete}
                                        className="flex-1 h-10 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-xs font-bold shadow-lg shadow-red-500/20"
                                      >
                                        {t('delete')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pl-2">
                                    <div className="flex-1">
                                      {isEditing || isRealizing ? (
                                        <div className="space-y-4">
                                          <TextInputField
                                            label={t('entries')}
                                            value={editValues.description}
                                            onChange={(description) =>
                                              setEditValues((prev) => ({ ...prev, description }))
                                            }
                                            autoFocus
                                          />
                                          <AmountInputField
                                            value={editValues.amount}
                                            onChange={(amount) =>
                                              setEditValues((prev) => ({ ...prev, amount }))
                                            }
                                          />
                                          {isRealizing && (
                                            <>
                                              <DateInputField
                                                label={t('realizationDate')}
                                                value={editValues.date}
                                                onChange={(date) =>
                                                  setEditValues((prev) => ({ ...prev, date }))
                                                }
                                              />
                                              <p className="text-[10px] text-muted-foreground/40 font-medium pl-1">
                                                {t('dateNote')}
                                              </p>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between gap-2">
                                          <div>
                                            <p className="text-sm font-bold text-white tracking-tight">
                                              {entry.description || typeT(entry.type)}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                              {entry.category && (
                                                <p className="text-[10px] font-semibold text-muted-foreground/60 flex items-center gap-1.5">
                                                  <span
                                                    className="h-1.5 w-1.5 rounded-full"
                                                    style={{
                                                      backgroundColor: entry.category.color,
                                                    }}
                                                  />
                                                  {entry.category.name}
                                                </p>
                                              )}
                                              {entry.templateId && (
                                                <Badge
                                                  variant="outline"
                                                  className="h-5 px-1.5 gap-1 text-[9px] font-bold border-white/10 text-muted-foreground/70 bg-white/[0.02]"
                                                >
                                                  <RotateCw className="h-2.5 w-2.5" />
                                                  {t('recurring')}
                                                </Badge>
                                              )}
                                              {entry.creditCardInvoiceId && (
                                                <Badge
                                                  variant="outline"
                                                  className="h-5 px-1.5 gap-1 text-[9px] font-bold border-white/10 text-muted-foreground/70 bg-white/[0.02]"
                                                >
                                                  <CreditCard className="h-2.5 w-2.5" />
                                                  {t('invoice')}
                                                </Badge>
                                              )}
                                              {entry.isSkipped ? (
                                                <Badge
                                                  variant="outline"
                                                  className="h-5 px-1.5 gap-1 text-[9px] font-bold border-white/10 text-muted-foreground/50 bg-white/[0.02]"
                                                >
                                                  <Ban className="h-2.5 w-2.5" />
                                                  {t('skipped')}
                                                </Badge>
                                              ) : entry.isVirtual ? (
                                                <Badge
                                                  variant="outline"
                                                  className="h-5 px-1.5 text-[9px] font-bold border-amber-400/30 text-amber-400 bg-amber-400/10"
                                                >
                                                  {t('estimated')}
                                                </Badge>
                                              ) : entry.templateId ? (
                                                <Badge
                                                  variant="outline"
                                                  className="h-5 px-1.5 text-[9px] font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                                                >
                                                  {t('confirmed')}
                                                </Badge>
                                              ) : null}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div
                                              className={cn(
                                                'px-3 py-1.5 rounded-xl border bg-white/[0.02] transition-all duration-300',
                                                type === 'income'
                                                  ? 'border-emerald-500/20'
                                                  : type === 'expense'
                                                    ? 'border-red-500/20'
                                                    : 'border-orange-400/20',
                                              )}
                                            >
                                              <p className="text-sm font-black font-display text-white">
                                                <span className="text-[10px] font-black opacity-40 mr-1">
                                                  {cfg.sign} R$
                                                </span>
                                                {formatCurrency(entry.amount)
                                                  .replace('R$', '')
                                                  .trim()}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-white/5 sm:border-0">
                                      {entry.isSkipped ? (
                                        <button
                                          onClick={() => onDeleteEntry(entry.id)}
                                          className="flex-1 h-10 rounded-xl bg-white/5 text-muted-foreground/60 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm text-xs font-bold px-4"
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                          {t('reactivate')}
                                        </button>
                                      ) : isPendingInvoice ? (
                                        <button
                                          onClick={() =>
                                            onPayInvoice?.(entry.creditCardInvoiceId as string)
                                          }
                                          className="flex-1 h-10 rounded-xl bg-amber-400/10 text-amber-400 hover:bg-amber-400 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm text-xs font-bold px-4"
                                        >
                                          <CreditCard className="h-4 w-4" />
                                          {t('payInvoice')}
                                        </button>
                                      ) : entry.isVirtual ? (
                                        isRealizing ? (
                                          <>
                                            <button
                                              onClick={() => handleConfirmRealize(entry)}
                                              className="flex-1 h-10 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-xs font-bold px-4"
                                            >
                                              <Check className="h-4 w-4" />
                                              {t('confirm')}
                                            </button>
                                            <button
                                              onClick={() => setRealizingId(null)}
                                              className="shrink-0 w-10 h-10 rounded-xl bg-white/5 text-muted-foreground/40 hover:bg-white/10 transition-all flex items-center justify-center shadow-sm"
                                            >
                                              <X className="h-4 w-4" />
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => startRealize(entry)}
                                              className="flex-1 h-10 rounded-xl bg-amber-400/10 text-amber-400 hover:bg-amber-400 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm text-xs font-bold px-4"
                                            >
                                              <RotateCw className="h-4 w-4" />
                                              {t('apply')}
                                            </button>
                                            <button
                                              onClick={() => setDeleteConfirmId(entry.id)}
                                              className="shrink-0 w-10 h-10 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </>
                                        )
                                      ) : isPaidInvoice ? (
                                        <button
                                          onClick={() => {
                                            setReopenError(null);
                                            setReopenInvoiceId(entry.creditCardInvoiceId as string);
                                            setReopenDialogOpen(true);
                                          }}
                                          className="flex-1 h-10 rounded-xl bg-white/5 text-muted-foreground/60 hover:bg-amber-400 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm text-xs font-bold px-4"
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                          {t('reopenInvoice')}
                                        </button>
                                      ) : (
                                        <>
                                          {isEditing ? (
                                            <button
                                              onClick={handleSaveEdit}
                                              className="flex-1 sm:w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg flex items-center justify-center p-0"
                                            >
                                              <Check className="h-5 w-5" />
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => startEdit(entry)}
                                              className="flex-1 sm:w-10 h-10 rounded-xl bg-white/5 text-muted-foreground/40 hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center shadow-sm"
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </button>
                                          )}

                                          <button
                                            onClick={() => setDeleteConfirmId(entry.id)}
                                            className="flex-1 sm:w-10 h-10 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {isPaidInvoice &&
                                    reopenError &&
                                    reopenInvoiceId === entry.creditCardInvoiceId && (
                                      <p className="text-[10px] text-destructive font-medium mt-3 pl-2">
                                        {reopenError}
                                      </p>
                                    )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {canAdd && (
            <DrawerFooter>
              <Button
                className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
                onClick={() => {
                  setIsAdding(true);
                  setEditingId(null);
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {t('addEntry')}
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Sheet>

      <AddEntryDrawer
        isOpen={isAdding}
        onOpen={() => setIsAdding(true)}
        onCancel={() => setIsAdding(false)}
        defaultType={sheet.filter !== 'all' ? sheet.filter : 'income'}
        defaultDate={sheet.date}
        minDate={minDate}
        onSave={(values) => {
          onAddEntry({
            date: values.date,
            amount: parseFloat(values.amount.replace(',', '.')) || 0,
            type: values.type,
            description: values.description || undefined,
            categoryId: values.categoryId,
          });
          setIsAdding(false);
        }}
      />

      <AlertDialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <AlertDialogContent className="bg-[#1c1a24] border-white/10 rounded-[2rem] p-8 max-w-[400px]">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center mx-auto mb-2 text-amber-500">
              <RotateCcw className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-black font-display text-white text-center">
              {t('reopenTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center text-sm font-medium">
              {t('reopenDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-2xl bg-white/5 border-none text-white hover:bg-white/10 transition-all font-bold">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReopenInvoice}
              disabled={reopenInvoiceMutation.isPending}
              className="flex-1 h-12 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-all font-bold shadow-lg shadow-amber-500/20"
            >
              {reopenInvoiceMutation.isPending ? t('reopening') : t('reopen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

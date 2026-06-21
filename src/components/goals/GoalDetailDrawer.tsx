'use client';

import { useState, useMemo } from 'react';
import type { Goal, GoalContribution } from '@/modules/goals/model/api/goal';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import {
  X,
  Plus,
  TrendingUp,
  Calendar,
  Trash2,
  CheckCircle2,
  Sparkles,
  PiggyBank,
  Edit2,
} from 'lucide-react';
import { AmountInputField, DateInputField } from '@/components/ui/form-field';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import { getDateFnsLocale } from '@/i18n/dateFnsLocale';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string, dateFnsLocale: Locale) {
  const date = new Date(dateStr + 'T00:00:00');
  return format(date, 'dd MMM, yyyy', { locale: dateFnsLocale });
}

function getDeadlineLabel(deadline: string, dateFnsLocale: Locale) {
  const date = new Date(deadline + 'T00:00:00');
  return format(date, 'MMMM yyyy', { locale: dateFnsLocale });
}

interface GoalDetailDrawerProps {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onAddFunds: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onUpdateGoal?: (goal: Goal) => void;
  isDeleting?: boolean;
}

export function GoalDetailDrawer({
  open,
  goal,
  onClose,
  onAddFunds,
  onDelete,
  onUpdateGoal,
  isDeleting = false,
}: GoalDetailDrawerProps) {
  const t = useTranslations('goalDetail');
  const { locale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale(locale);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState(false);

  const percent = useMemo(
    () => (goal ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0),
    [goal]
  );

  const remaining = useMemo(
    () => (goal ? goal.targetAmount - goal.savedAmount : 0),
    [goal]
  );

  const monthlySavings = useMemo(() => {
    if (!goal || goal.contributions.length === 0) return 0;
    const recent = goal.contributions.slice(-3);
    return recent.reduce((sum, c) => sum + c.amount, 0) / recent.length;
  }, [goal]);

  const handleDeleteEntry = async (entryId: string) => {
    if (!goal || !onUpdateGoal) return;
    const filtered = goal.contributions.filter((c) => c.id !== entryId);
    const newTotal = filtered.reduce((s, c) => s + c.amount, 0);
    onUpdateGoal({
      ...goal,
      contributions: filtered,
      savedAmount: newTotal,
    });
  };

  const startEdit = (c: GoalContribution) => {
    setEditingEntryId(c.id);
    setEditAmount(c.amount.toFixed(2).replace('.', ','));
    setEditDate(c.date);
  };

  const handleUpdateEntry = () => {
    if (!goal || !onUpdateGoal || !editingEntryId) return;
    const updated = goal.contributions.map((c) => {
      if (c.id === editingEntryId) {
        return { ...c, amount: parseFloat(editAmount.replace(',', '.')) || 0, date: editDate };
      }
      return c;
    });
    const newTotal = updated.reduce((s, c) => s + c.amount, 0);
    onUpdateGoal({
      ...goal,
      contributions: updated,
      savedAmount: newTotal,
    });
    setEditingEntryId(null);
  };

  if (!goal) return null;

  const sortedContributions = [...goal.contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setEditingEntryId(null);
      setConfirmDeleteGoal(false);
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {t('title')}
          </SheetTitle>
          <p className="text-base font-bold text-white">{goal.name}</p>
          <SheetDescription className="sr-only">
            {t('title')} {goal.name}
          </SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 pb-6 space-y-8 mt-4">
          {/* Progress Ring */}
          <div className="flex flex-col items-center text-center">
            <CircularProgress
              percent={percent}
              size={192}
              strokeWidth={6}
              className="mb-4"
            >
              <span className="text-3xl font-bold font-display text-white">
                {percent}%
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t('completed')}
              </span>
            </CircularProgress>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-display">
                {formatCurrency(goal.savedAmount)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {formatCurrency(goal.targetAmount)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('remaining', { amount: formatCurrency(remaining) })}
            </p>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('pace')}
                </span>
              </div>
              <p className="text-sm font-bold">
                {t('perMonth', { amount: formatCurrency(monthlySavings) })}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('deadline')}
                </span>
              </div>
              <p className="text-sm font-bold">
                {getDeadlineLabel(goal.deadline, dateFnsLocale)}
              </p>
            </div>
          </div>

          {/* Recent Contributions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {t('history')}
              </h3>
            </div>

            <div className="space-y-2">
              {sortedContributions.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('noContributions')}
                  </p>
                </div>
              ) : (
                sortedContributions.map((c) => (
                  <div
                    key={c.id}
                    className="glass-card rounded-2xl p-4 transition-all group relative overflow-hidden"
                  >
                    {editingEntryId === c.id ? (
                      <div className="space-y-3">
                        <p className="text-sm font-bold">{c.description}</p>
                        <div className="space-y-3">
                          <DateInputField
                            label={t('dateLabel')}
                            value={editDate}
                            onChange={setEditDate}
                          />
                          <AmountInputField
                            label={t('amountLabel')}
                            value={editAmount}
                            onChange={setEditAmount}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleUpdateEntry}
                            className="h-8 flex-1"
                          >
                            {t('save')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingEntryId(null)}
                            className="h-8 flex-1"
                          >
                            {t('cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">
                                {c.description}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatDate(c.date, dateFnsLocale)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <p className="text-sm font-bold text-primary">
                              +{formatCurrency(c.amount)}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(c)}
                                className="p-1 hover:text-primary transition-colors"
                                title={t('editContribution')}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(c.id)}
                                className="p-1 hover:text-destructive transition-colors"
                                title={t('delete')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-col sm:flex-col gap-3">
          {confirmDeleteGoal ? (
            <div className="glass-card rounded-2xl p-4 space-y-4 border border-destructive/30 w-full">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 pt-1.5">
                  <p className="text-sm font-bold text-white tracking-tight">
                    {t('confirmDelete')}
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-medium mt-1">
                    {t('confirmDeleteDesc')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteGoal(false)}
                  disabled={isDeleting}
                  className="flex-1 h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => onDelete(goal.id)}
                  disabled={isDeleting}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-xs font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? t('deleting') : t('delete')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Button
                onClick={() => onAddFunds(goal)}
                className="w-full h-11 bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                {t('addContribution')}
              </Button>

              <button
                onClick={() => setConfirmDeleteGoal(true)}
                className="w-full h-11 rounded-xl border border-destructive/20 text-destructive font-bold text-sm hover:bg-destructive/10 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('deleteGoal')}
              </button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}



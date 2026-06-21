'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddButton } from '@/components/ui/add-button';
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
import { RotateCw, Pencil, Trash2, Archive, Loader2, Search, ChevronDown, CalendarClock, Hash } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslations } from '@/i18n/useTranslations';
import { ServerErrorState } from '@/components/ui/server-error-state';
import { formatCurrency } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { TYPE_CONFIG } from '@/components/painel/config';
import { RecurringTemplateDrawer } from '@/components/painel/RecurringTemplateDrawer';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { useDeleteRecurringTemplate } from '@/modules/recurring-templates/hooks/use-delete-recurring-template';
import { useUpdateRecurringTemplate } from '@/modules/recurring-templates/hooks/use-update-recurring-template';
import { RecurringTemplate } from '@/modules/recurring-templates/service/recurring-templates-service';

type TypeFilter = 'all' | 'income' | 'expense' | 'spending';

const TYPE_ORDER = ['income', 'expense', 'spending'] as const;

export function RecurringTemplatesView() {
  const t = useTranslations('recurring');
  const typeT = useTranslations('entry');
  const { data: recurringTemplates, isLoading, isError, refetch } = useGetRecurringTemplates();
  const archiveMutation = useUpdateRecurringTemplate();
  const reactivateMutation = useUpdateRecurringTemplate();
  const deleteMutation = useDeleteRecurringTemplate();

  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | undefined>(undefined);
  const [archiveTemplateId, setArchiveTemplateId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    income: true,
    expense: true,
    spending: true,
  });

  const TYPE_FILTER_LABELS: Record<TypeFilter, string> = {
    all: t('filterAll'),
    income: t('filterIncome'),
    expense: t('filterExpense'),
    spending: t('filterSpending'),
  };

  const handleNewTemplate = () => {
    setEditingTemplate(undefined);
    setTemplateDrawerOpen(true);
  };

  const handleEditTemplate = (template: RecurringTemplate) => {
    setEditingTemplate(template);
    setTemplateDrawerOpen(true);
  };

  const handleArchiveTemplate = async () => {
    if (!archiveTemplateId) return;
    const id = archiveTemplateId;
    setArchiveTemplateId(null);
    setActionError(null);
    try {
      await archiveMutation.mutateAsync({ id, isActive: false });
    } catch (err: any) {
      setActionError(err?.message ?? t('archiveError'));
    }
  };

  const handleReactivateTemplate = async (id: string) => {
    setActionError(null);
    try {
      await reactivateMutation.mutateAsync({ id, isActive: true });
    } catch (err: any) {
      setActionError(err?.message ?? t('reactivateError'));
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateId) return;
    const id = deleteTemplateId;
    setDeleteTemplateId(null);
    setActionError(null);
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (err: any) {
      setActionError(err?.message ?? t('deleteError'));
    }
  };

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const filtered = useMemo(() => {
    if (!recurringTemplates) return [];
    const q = query.trim().toLowerCase();
    return recurringTemplates.filter((tmpl) => {
      const matchesType = typeFilter === 'all' || tmpl.type.toLowerCase() === typeFilter;
      const matchesQuery = !q || tmpl.description.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [recurringTemplates, typeFilter, query]);

  const groups = useMemo(
    () =>
      TYPE_ORDER.map((type) => ({
        type,
        cfg: TYPE_CONFIG[type],
        templates: filtered.filter((tmpl) => tmpl.type.toLowerCase() === type),
      })).filter((g) => g.templates.length > 0),
    [filtered],
  );

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold font-display">{t('title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <AddButton onClick={handleNewTemplate} title={t('add')} label={t('add')} />
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-white/[0.03] border-white/10 focus-visible:ring-primary/30 placeholder:text-muted-foreground/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'income', 'expense', 'spending'] as TypeFilter[]).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                typeFilter === type
                  ? type === 'all'
                    ? 'bg-primary text-white shadow-glow'
                    : cn(
                        type === 'income' && 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
                        type === 'expense' && 'bg-red-500 text-white shadow-lg shadow-red-500/20',
                        type === 'spending' && 'bg-orange-400 text-white shadow-lg shadow-orange-400/20',
                      )
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
              )}
            >
              {TYPE_FILTER_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {actionError && <p className="text-sm text-red-400 font-medium px-1">{actionError}</p>}

      <div className="space-y-8">
        {isError ? (
          <ServerErrorState onRetry={refetch} />
        ) : isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[68px] w-full bg-card/50 animate-pulse rounded-2xl border border-white/5" />
          ))
        ) : !recurringTemplates || recurringTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noTemplates')}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noResults')}</p>
        ) : (
          groups.map(({ type, cfg, templates }) => {
            const isExpanded = expandedGroups[type];
            const total = templates.reduce((acc, tmpl) => acc + tmpl.estimatedAmount, 0);

            return (
              <div key={type} className="space-y-3">
                <button
                  onClick={() => toggleGroup(type)}
                  className="w-full flex items-center gap-4 group/header"
                >
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover/header:scale-110', cfg.bg)}>
                    {cfg.icon('md')}
                  </div>
                  <h4 className={cn('text-xs font-black uppercase tracking-[0.25em]', cfg.color)}>
                    {typeT(type)}
                  </h4>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent mx-2" />
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black text-white font-display">{formatCurrency(total)}</p>
                    <ChevronDown className={cn('w-4 h-4 text-muted-foreground/30 transition-transform duration-300', isExpanded ? 'rotate-180' : '')} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {templates.map((template) => {
                      const isArchiving = archiveMutation.isPending && archiveMutation.variables?.id === template.id;
                      const isReactivating = reactivateMutation.isPending && reactivateMutation.variables?.id === template.id;
                      const isDeleting = deleteMutation.isPending && deleteMutation.variables?.id === template.id;

                      return (
                        <div
                          key={template.id}
                          className={cn(
                            'relative flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#1c1a24] border border-transparent hover:border-white/5 transition-all',
                            !template.isActive && 'opacity-50',
                          )}
                        >
                          <div className={cn('absolute left-0 top-4 bottom-4 w-1 rounded-r-full', cfg.bar)} />

                          <div className="flex items-center gap-3 min-w-0 pl-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{template.description}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {template.category && (
                                  <p className="text-[10px] font-semibold text-muted-foreground/60 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: template.category.color }} />
                                    {template.category.name}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                                  {t('day', { day: template.dayOfMonth })} · {formatCurrency(template.estimatedAmount)}
                                  {template.endDate && (
                                    <>
                                      {' · '}
                                      <CalendarClock className="h-3 w-3 inline" />
                                      {' '}
                                      {format(parseISO(template.endDate), 'MMM/yyyy')}
                                    </>
                                  )}
                                  {template.totalOccurrences && (
                                    <>
                                      {' · '}
                                      <Hash className="h-3 w-3 inline" />
                                      {' '}
                                      {template.occurrenceCount ?? 0}/{template.totalOccurrences}x
                                    </>
                                  )}
                                  {!template.isActive && ` · ${t('archived')}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                              <Pencil className="h-4 w-4" />
                            </Button>

                            {template.isActive ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setArchiveTemplateId(template.id)}
                                disabled={isArchiving}
                              >
                                {isArchiving
                                  ? <Loader2 className="h-4 w-4 text-amber-500/60 animate-spin" />
                                  : <Archive className="h-4 w-4 text-amber-500/60" />}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReactivateTemplate(template.id)}
                                disabled={isReactivating}
                              >
                                {isReactivating
                                  ? <Loader2 className="h-4 w-4 text-emerald-500/60 animate-spin" />
                                  : <RotateCw className="h-4 w-4 text-emerald-500/60" />}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTemplateId(template.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting
                                ? <Loader2 className="h-4 w-4 text-red-500/60 animate-spin" />
                                : <Trash2 className="h-4 w-4 text-red-500/60" />}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <RecurringTemplateDrawer
        open={templateDrawerOpen}
        onOpenChange={setTemplateDrawerOpen}
        template={editingTemplate}
      />

      <AlertDialog open={!!archiveTemplateId} onOpenChange={(open) => !open && setArchiveTemplateId(null)}>
        <AlertDialogContent className="bg-[#1c1a24] border-white/10 rounded-[2rem] p-8 max-w-[400px]">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center mx-auto mb-2 text-amber-500">
              <Archive className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-black font-display text-white text-center">
              {t('archiveTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center text-sm font-medium">
              {t('archiveDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-2xl bg-white/5 border-none text-white hover:bg-white/10 transition-all font-bold">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveTemplate}
              className="flex-1 h-12 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-all font-bold shadow-lg shadow-amber-500/20"
            >
              {t('archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent className="bg-[#1c1a24] border-white/10 rounded-[2rem] p-8 max-w-[400px]">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center mx-auto mb-2 text-red-500">
              <Trash2 className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-black font-display text-white text-center">
              {t('deleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center text-sm font-medium">
              {t('deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-2xl bg-white/5 border-none text-white hover:bg-white/10 transition-all font-bold">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="flex-1 h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all font-bold shadow-lg shadow-red-500/20"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

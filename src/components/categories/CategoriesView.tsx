'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServerErrorState } from '@/components/ui/server-error-state';
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
import { useTranslations } from '@/i18n/useTranslations';
import { toast } from 'sonner';
import { useGetCategories } from '@/modules/categories/hooks/use-get-categories';
import { useDeleteCategory } from '@/modules/categories/hooks/use-delete-category';
import { Category } from '@/modules/categories/service/categories-service';
import { CategoryDrawer } from './CategoryDrawer';
import { CategoryIcon } from './category-icons';

function isProtected(c: Category) {
  return c.isDefault && c.name === 'Outros';
}

export function CategoriesView() {
  const t = useTranslations('categories');
  const { data: categories, isLoading, isError, refetch } = useGetCategories();
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setDrawerOpen(true);
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>
        <Button
          onClick={openCreate}
          className="h-10 px-4 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t('newCategory')}
        </Button>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-card/50 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6">
            <ServerErrorState onRetry={refetch} />
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <h3 className="text-lg font-medium">{t('empty')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {categories.map((c) => {
              const locked = isProtected(c);
              return (
                <div
                  key={c.id}
                  className="group bg-[#1c1a24] rounded-2xl p-3 flex items-center gap-3"
                >
                  <div
                    className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${c.color ?? '#94a3b8'}22`,
                      color: c.color ?? '#94a3b8',
                    }}
                  >
                    <CategoryIcon name={c.icon} className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {c.isDefault && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[8px] font-bold border-white/10 text-muted-foreground/70 bg-white/[0.02]"
                        >
                          {t('defaultBadge')}
                        </Badge>
                      )}
                      {c.includeInBalanceBase && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[8px] font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                        >
                          {t('validIncomeBadge')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {locked ? (
                    <div
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground/30"
                      title={t('protectedHint')}
                    >
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openEdit(c)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(c)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} category={editing} />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-card border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription', { name: deleting?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl border-white/10 hover:bg-white/5"
              onClick={() => setDeleting(null)}
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (!deleting) return;
                deleteCategory(deleting.id, {
                  onSuccess: () => setDeleting(null),
                  onError: (e: Error) => toast.error(e.message || t('deleteError')),
                });
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

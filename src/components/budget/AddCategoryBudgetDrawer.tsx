'use client';

import { Plus } from 'lucide-react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/categories/category-icons';
import { Category } from '@/modules/categories/service/categories-service';
import { FlowType } from '@/lib/cashflow';
import { useTranslations } from '@/i18n/useTranslations';

const BUDGETABLE_TYPES: FlowType[] = ['expense', 'investment'];

interface AddCategoryBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (category: Category) => void;
  onCreateNew: () => void;
}

// Ponto único de entrada pra orçar uma categoria: escolher uma já existente
// (agrupada por tipo) ou criar uma nova — centraliza o que antes ficava
// espalhado direto no card de "Categorias orçadas".
export function AddCategoryBudgetDrawer({
  open,
  onClose,
  categories,
  onSelectCategory,
  onCreateNew,
}: AddCategoryBudgetDrawerProps) {
  const t = useTranslations('budget');
  const typeT = useTranslations('entry');

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            {t('addCategoryBudget')}
          </SheetTitle>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-5">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground/50 py-4 text-center">
              {t('noCategoriesToAdd')}
            </p>
          ) : (
            BUDGETABLE_TYPES.map((type) => {
              const typeCategories = categories.filter((c) => c.type === type);
              if (typeCategories.length === 0) return null;
              return (
                <div key={type} className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 px-1">
                    {typeT(type)}
                  </p>
                  <div className="space-y-0.5">
                    {typeCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectCategory(c)}
                        className="w-full flex items-center gap-3 px-1.5 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <span
                          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${c.color ?? '#94a3b8'}22`,
                            color: c.color ?? '#94a3b8',
                          }}
                        >
                          <CategoryIcon name={c.icon} className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-white">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={onCreateNew}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t('createNewCategory')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

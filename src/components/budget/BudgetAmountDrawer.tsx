'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AmountInputField } from '@/components/ui/form-field';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { useTranslations } from '@/i18n/useTranslations';
import { toast } from 'sonner';
import { useUpsertCategoryBudget } from '@/modules/category-budgets/hooks/use-upsert-category-budget';
import { useDeleteCategoryBudget } from '@/modules/category-budgets/hooks/use-delete-category-budget';
import { CategoryIcon } from '@/components/categories/category-icons';
import { Category } from '@/modules/categories/service/categories-service';
import { CategoryBudget } from '@/modules/category-budgets/service/category-budgets-service';

interface BudgetAmountDrawerProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  // Ciclo ao qual esse orçamento se aplica — cada período tem seu próprio valor.
  periodStart: string;
  // Orçamento já definido para essa categoria neste período, se houver.
  existingBudget: CategoryBudget | null;
}

// Editor leve para o valor do orçamento de uma categoria já existente, escopado
// ao período selecionado — nome, cor e ícone continuam só editáveis na tela de
// Categorias (CategoryDrawer).
export function BudgetAmountDrawer({
  open,
  onClose,
  category,
  periodStart,
  existingBudget,
}: BudgetAmountDrawerProps) {
  const t = useTranslations('budget');
  const tc = useTranslations('categories');
  const [amount, setAmount] = useState('');
  const upsertMutation = useUpsertCategoryBudget();
  const deleteMutation = useDeleteCategoryBudget();
  const isPending = upsertMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setAmount(existingBudget ? existingBudget.amount.toFixed(2).replace('.', ',') : '');
  }, [open, existingBudget]);

  function handleRemove() {
    if (!existingBudget) return;
    deleteMutation.mutate(existingBudget.id, {
      onSuccess: onClose,
      onError: () => toast.error(tc('saveError')),
    });
  }

  function handleSave() {
    if (!category) return;
    const parsed = amount.trim() ? parseFloat(amount.replace(',', '.')) : null;

    if (!parsed || parsed <= 0) {
      if (existingBudget) handleRemove();
      else onClose();
      return;
    }

    upsertMutation.mutate(
      { categoryId: category.id, periodStart, amount: parsed },
      { onSuccess: onClose, onError: () => toast.error(tc('saveError')) },
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            {t('setBudgetTitle')}
          </SheetTitle>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-5">
          {category && (
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${category.color ?? '#94a3b8'}22`,
                  color: category.color ?? '#94a3b8',
                }}
              >
                <CategoryIcon name={category.icon} className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{category.name}</p>
            </div>
          )}

          <AmountInputField
            label={t('budgetAmountLabel')}
            value={amount}
            onChange={setAmount}
          />
        </div>

        <DrawerFooter>
          {existingBudget && (
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
              onClick={handleRemove}
              disabled={isPending}
            >
              {t('removeBudget')}
            </Button>
          )}
          <Button
            className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
            onClick={handleSave}
            disabled={isPending}
          >
            {t('saveBudget')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TextInputField } from '@/components/ui/form-field';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { cn } from '@/lib/utils';
import { FlowType } from '@/lib/cashflow';
import { useTranslations } from '@/i18n/useTranslations';
import { toast } from 'sonner';
import { TypeToggle } from '@/components/painel/TypeToggle';
import { Category } from '@/modules/categories/service/categories-service';
import { useCreateCategory } from '@/modules/categories/hooks/use-create-category';
import { useUpdateCategory } from '@/modules/categories/hooks/use-update-category';
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_NAMES,
  CategoryIcon,
  DEFAULT_CATEGORY_COLOR,
} from './category-icons';

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoryDrawer({ open, onClose, category }: CategoryDrawerProps) {
  const t = useTranslations('categories');
  const isEdit = !!category;

  const [name, setName] = useState('');
  const [type, setType] = useState<FlowType>('expense');
  const [icon, setIcon] = useState<string>('Tag');
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [includeInBalanceBase, setIncludeInBalanceBase] = useState(true);
  const [nameError, setNameError] = useState<string | undefined>();

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? '');
    setType(category?.type ?? 'expense');
    setIcon(category?.icon ?? 'Tag');
    setColor(category?.color ?? DEFAULT_CATEGORY_COLOR);
    setIncludeInBalanceBase(category?.includeInBalanceBase ?? true);
    setNameError(undefined);
  }, [open, category]);

  const swatches = useMemo(
    () =>
      color && !CATEGORY_COLORS.includes(color) ? [color, ...CATEGORY_COLORS] : CATEGORY_COLORS,
    [color],
  );

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('nameRequired'));
      return;
    }
    setNameError(undefined);

    const payload = { name: trimmed, type, icon, color, includeInBalanceBase };
    const onSuccess = () => onClose();
    const onError = (e: Error) => toast.error(e.message || t('saveError'));

    if (isEdit && category) {
      updateMutation.mutate({ id: category.id, ...payload }, { onSuccess, onError });
    } else {
      createMutation.mutate(payload, { onSuccess, onError });
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            {isEdit ? t('editCategory') : t('newCategory')}
          </SheetTitle>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}22`, color }}
            >
              <CategoryIcon name={icon} className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {name.trim() || t('namePlaceholder')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('typeLabel')} <span className="text-balance-danger">*</span>
            </label>
            <TypeToggle value={type} onChange={setType} />
          </div>

          <TextInputField
            label={t('nameLabel')}
            required
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={setName}
            error={nameError}
          />

          {/* Cor */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('colorLabel')}
            </label>
            <div className="flex items-center flex-wrap gap-2">
              {swatches.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all',
                    color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label
                className="h-7 w-7 rounded-full border border-white/20 overflow-hidden cursor-pointer relative"
                title={t('customColor')}
                style={{
                  background: 'conic-gradient(red, orange, yellow, lime, aqua, blue, magenta, red)',
                }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Ícone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('iconLabel')}
            </label>
            <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto pr-1">
              {CATEGORY_ICON_NAMES.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={cn(
                    'aspect-square rounded-xl flex items-center justify-center border transition-all',
                    icon === iconName
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-white/5 bg-white/[0.03] text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <CategoryIcon name={iconName} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Considerar como entrada válida — só faz sentido para categorias de receita */}
          {type === 'income' && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t('includeInBalanceLabel')}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground/70 mt-0.5">
                  {t('includeInBalanceHint')}
                </p>
              </div>
              <Switch
                checked={includeInBalanceBase}
                onCheckedChange={setIncludeInBalanceBase}
                className="mt-0.5 shrink-0"
              />
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={onClose}
            disabled={isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? t('saving') : t('save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

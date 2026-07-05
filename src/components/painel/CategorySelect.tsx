import * as React from 'react';
import { Plus } from 'lucide-react';
import { useGetCategories } from '@/modules/categories/hooks/use-get-categories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryIcon } from '@/components/categories/category-icons';
import { CategoryDrawer } from '@/components/categories/CategoryDrawer';
import { FlowType } from '@/lib/cashflow';
import { useTranslations } from '@/i18n/useTranslations';

const NONE_VALUE = '__none__';
const CREATE_VALUE = '__create__';

interface CategorySelectProps {
  value?: string;
  onChange: (value?: string) => void;
  // Categorias são escopadas por tipo: só as do mesmo tipo do lançamento aparecem.
  type: FlowType;
}

export function CategorySelect({ value, onChange, type }: CategorySelectProps) {
  const t = useTranslations('category');
  const { data: categories, isLoading } = useGetCategories();
  const filtered = (categories ?? []).filter((c) => c.type === type);

  const [createOpen, setCreateOpen] = React.useState(false);

  const handleValueChange = (v: string) => {
    if (v === CREATE_VALUE) {
      // Abre o drawer de criação sem alterar a seleção atual, mantendo o contexto.
      setCreateOpen(true);
      return;
    }
    onChange(v === NONE_VALUE ? undefined : v);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t('label')}
      </label>
      <Select value={value ?? NONE_VALUE} onValueChange={handleValueChange} disabled={isLoading}>
        <SelectTrigger className="glass-input h-12 w-full rounded-xl border-none bg-white/5 px-4 focus:ring-1 focus:ring-white/20">
          <SelectValue placeholder={isLoading ? t('loading') : t('placeholder')} />
        </SelectTrigger>
        <SelectContent className="glass-card border-white/10 bg-surface/95 backdrop-blur-xl">
          <SelectItem value={NONE_VALUE} className="focus:bg-white/10 focus:text-foreground">
            <span className="text-muted-foreground">{t('none')}</span>
          </SelectItem>
          {filtered.map((category) => (
            <SelectItem
              key={category.id}
              value={category.id}
              className="focus:bg-white/10 focus:text-foreground"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-5 w-5 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${category.color ?? '#94a3b8'}22`,
                    color: category.color ?? '#94a3b8',
                  }}
                >
                  <CategoryIcon name={category.icon} className="h-3 w-3" />
                </span>
                {category.name}
              </div>
            </SelectItem>
          ))}
          <SelectSeparator className="bg-white/10" />
          <SelectItem
            value={CREATE_VALUE}
            className="text-primary focus:bg-primary/10 focus:text-primary"
          >
            <div className="flex items-center gap-2 font-semibold">
              <span className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 bg-primary/15">
                <Plus className="h-3 w-3" />
              </span>
              {t('createNew')}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <CategoryDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultType={type}
        lockType
        onCreated={(created) => onChange(created.id)}
      />
    </div>
  );
}

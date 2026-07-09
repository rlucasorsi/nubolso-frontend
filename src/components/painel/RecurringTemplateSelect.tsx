import { RotateCw } from 'lucide-react';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlowType } from '@/lib/cashflow';
import { useTranslations } from '@/i18n/useTranslations';

const NONE_VALUE = '__none__';

interface RecurringTemplateSelectProps {
  value?: string | null;
  onChange: (value?: string) => void;
  // Recorrências são escopadas por tipo: só as do mesmo tipo do lançamento aparecem.
  type: FlowType;
}

export function RecurringTemplateSelect({ value, onChange, type }: RecurringTemplateSelectProps) {
  const t = useTranslations('entry');
  const { data: templates, isLoading } = useGetRecurringTemplates();
  const filtered = (templates ?? []).filter((tpl) => tpl.type.toLowerCase() === type);

  const handleValueChange = (v: string) => {
    onChange(v === NONE_VALUE ? undefined : v);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t('linkTemplateLabel')}
      </label>
      <Select value={value ?? NONE_VALUE} onValueChange={handleValueChange} disabled={isLoading}>
        <SelectTrigger className="glass-input h-12 w-full rounded-xl border-none bg-white/5 px-4 focus:ring-1 focus:ring-white/20">
          <SelectValue placeholder={isLoading ? t('loading') : t('linkTemplateNone')} />
        </SelectTrigger>
        <SelectContent className="glass-card border-white/10 bg-surface/95 backdrop-blur-xl">
          <SelectItem value={NONE_VALUE} className="focus:bg-white/10 focus:text-foreground">
            <span className="text-muted-foreground">{t('linkTemplateNone')}</span>
          </SelectItem>
          {filtered.map((tpl) => (
            <SelectItem key={tpl.id} value={tpl.id} className="focus:bg-white/10 focus:text-foreground">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 bg-primary/15 text-primary">
                  <RotateCw className="h-3 w-3" />
                </span>
                {tpl.description}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[11px] text-muted-foreground/60 pl-1">{t('linkTemplateHint')}</p>
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreditCard } from '@/modules/credit-cards/model/api/credit-card';
import { useTranslations } from '@/i18n/useTranslations';

interface CreditCardSelectProps {
  cards: CreditCard[];
  value?: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function CreditCardSelect({ cards, value, onChange, isLoading }: CreditCardSelectProps) {
  const t = useTranslations('creditCardSelect');

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
        {t('label')} <span className="text-balance-danger">*</span>
      </label>
      <Select value={value} onValueChange={onChange} disabled={isLoading || cards.length === 0}>
        <SelectTrigger className="glass-input h-12 w-full rounded-xl border-none bg-white/5 px-4 focus:ring-1 focus:ring-white/20">
          <SelectValue placeholder={isLoading ? t('loading') : t('placeholder')} />
        </SelectTrigger>
        <SelectContent className="glass-card border-white/10 bg-surface/95 backdrop-blur-xl">
          {cards.map((card) => (
            <SelectItem key={card.id} value={card.id} className="focus:bg-white/10 focus:text-foreground">
              {card.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

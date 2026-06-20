import { Button } from '@/components/ui/button';
import { Filter, Calendar, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ActionsSectionProps {
  onFilterClick: () => void;
  onNavigateClick: () => void;
}

export function ActionsSection({ onFilterClick, onNavigateClick }: ActionsSectionProps) {
  const t = useTranslations('actions');

  return (
    <div className="px-5 py-8 space-y-4">
      <h3 className="text-sm font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
        <Settings className="w-4 h-4" />
        {t('title')}
      </h3>

      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 rounded-xl border-border/50 bg-card/50 hover:bg-card"
          onClick={onFilterClick}
        >
          <Filter className="w-4 h-4 text-primary" />
          <span className="font-medium">{t('filterDays')}</span>
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 rounded-xl border-border/50 bg-card/50 hover:bg-card"
          onClick={onNavigateClick}
        >
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium">{t('navigateMonths')}</span>
        </Button>
      </div>
    </div>
  );
}

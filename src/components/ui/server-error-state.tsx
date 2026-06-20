'use client';

import { ServerCrash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/i18n/useTranslations';

interface ServerErrorStateProps {
  onRetry?: () => void;
}

export function ServerErrorState({ onRetry }: ServerErrorStateProps) {
  const t = useTranslations('serverError');

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-8 text-center gap-6">
      <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center">
        <ServerCrash className="w-10 h-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold font-display">{t('title')}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t('description')}
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2 rounded-xl border-white/10 hover:bg-white/5">
          <RefreshCw className="w-4 h-4" />
          {t('retry')}
        </Button>
      )}
    </div>
  );
}


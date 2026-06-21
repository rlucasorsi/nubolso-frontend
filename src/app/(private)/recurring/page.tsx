'use client';

import { useEffect } from 'react';
import { RecurringTemplatesView } from '@/components/painel/RecurringTemplatesView';
import { useTranslations } from '@/i18n/useTranslations';

export default function RecurringPage() {
  const t = useTranslations('recurring');

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  return <RecurringTemplatesView />;
}

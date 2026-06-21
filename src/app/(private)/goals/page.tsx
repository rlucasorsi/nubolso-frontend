'use client';

import { GoalsView } from '@/components/goals/GoalsView';
import { useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';

export default function GoalsPage() {
  const t = useTranslations('goalsView');

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  return <GoalsView />;
}

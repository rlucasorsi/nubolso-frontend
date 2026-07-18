'use client';

import { InvestmentsView } from '@/components/investments/InvestmentsView';
import { useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';

export default function InvestmentsPage() {
  const t = useTranslations('investmentsView');

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  return <InvestmentsView />;
}

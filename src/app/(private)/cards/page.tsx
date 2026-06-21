'use client';

import { useEffect } from 'react';
import { CreditCardsView } from '@/components/credit-cards/CreditCardsView';
import { useTranslations } from '@/i18n/useTranslations';

export default function CardsPage() {
  const t = useTranslations('creditCardsView');

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  return <CreditCardsView />;
}

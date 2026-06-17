'use client';

import { useEffect } from 'react';
import { CreditCardsView } from '@/components/credit-cards/CreditCardsView';

export default function CartoesPage() {
  useEffect(() => {
    document.title = 'Cartões de Crédito — nubolso';
  }, []);

  return <CreditCardsView />;
}

'use client';

import { useEffect } from 'react';
import { CreditCardsView } from '@/components/credit-cards/CreditCardsView';

export default function CardsPage() {
  useEffect(() => {
    document.title = 'Credit Cards — nubolso';
  }, []);

  return <CreditCardsView />;
}

'use client';

import { useEffect } from 'react';
import { RecurringTemplatesView } from '@/components/painel/RecurringTemplatesView';

export default function RecurringPage() {
  useEffect(() => {
    document.title = 'Recurring — nubolso';
  }, []);

  return <RecurringTemplatesView />;
}

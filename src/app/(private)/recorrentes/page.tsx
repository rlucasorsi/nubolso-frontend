'use client';

import { useEffect } from 'react';
import { RecurringTemplatesView } from '@/components/painel/RecurringTemplatesView';

export default function RecorrentesPage() {
  useEffect(() => {
    document.title = 'Contas Recorrentes — Fluxo de Caixa';
  }, []);

  return <RecurringTemplatesView />;
}

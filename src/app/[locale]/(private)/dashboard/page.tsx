'use client';

import { useCashFlow } from '@/hooks/useCashFlow';
import { PainelView } from '@/components/painel/PainelView';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { addEntry, updateEntry, deleteEntry } = useCashFlow();

  useEffect(() => {
    document.title = 'Dashboard — nubolso';
  }, []);

  return (
    <PainelView
      onAddEntry={addEntry}
      onUpdateEntry={updateEntry}
      onDeleteEntry={deleteEntry}
    />
  );
}

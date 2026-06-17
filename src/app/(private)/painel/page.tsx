'use client';

import { useCashFlow } from '@/hooks/useCashFlow';
import { PainelView } from '@/components/painel/PainelView';
import { useEffect } from 'react';

export default function PainelPage() {
  const { addEntry, updateEntry, deleteEntry } = useCashFlow();

  useEffect(() => {
    document.title = 'Painel — Fluxo de Caixa';
  }, []);

  return (
    <PainelView
      onAddEntry={addEntry}
      onUpdateEntry={updateEntry}
      onDeleteEntry={deleteEntry}
    />
  );
}

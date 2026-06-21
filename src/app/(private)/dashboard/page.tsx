'use client';

import { useCashFlow } from '@/hooks/useCashFlow';
import { PainelView } from '@/components/painel/PainelView';
import { useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';

export default function DashboardPage() {
  const { addEntry, updateEntry, deleteEntry } = useCashFlow();
  const t = useTranslations('dashboard');

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  return (
    <PainelView
      onAddEntry={addEntry}
      onUpdateEntry={updateEntry}
      onDeleteEntry={deleteEntry}
    />
  );
}

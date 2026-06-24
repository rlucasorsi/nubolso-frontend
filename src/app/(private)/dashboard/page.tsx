'use client';

import { useCashFlow } from '@/hooks/useCashFlow';
import { PainelView } from '@/components/painel/PainelView';
import { useEffect } from 'react';
import { useTranslations } from '@/i18n/useTranslations';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { addEntry, updateEntry, deleteEntry } = useCashFlow();
  const t = useTranslations('dashboard');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast.success('Bem-vindo ao PRO! Sua assinatura está ativa.');
      const url = new URL(window.location.href);
      url.searchParams.delete('upgraded');
      router.replace(url.pathname + (url.search || ''));
    }
  }, [searchParams, router]);

  return (
    <PainelView onAddEntry={addEntry} onUpdateEntry={updateEntry} onDeleteEntry={deleteEntry} />
  );
}

'use client';

import { Suspense, useEffect } from 'react';
import { useCashFlow } from '@/hooks/useCashFlow';
import { PainelView } from '@/components/painel/PainelView';
import { useTranslations } from '@/i18n/useTranslations';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ME_QUERY_KEY } from '@/modules/users/hooks/use-get-me';

function UpgradeHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast.success('Bem-vindo ao PRO! Sua assinatura está ativa.');
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      const url = new URL(window.location.href);
      url.searchParams.delete('upgraded');
      router.replace(url.pathname + (url.search || ''));
    }
  }, [searchParams, router, queryClient]);

  return null;
}

export default function DashboardPage() {
  const { addEntry, updateEntry, deleteEntry } = useCashFlow();
  const t = useTranslations('dashboard');

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  return (
    <>
      <Suspense>
        <UpgradeHandler />
      </Suspense>
      <PainelView onAddEntry={addEntry} onUpdateEntry={updateEntry} onDeleteEntry={deleteEntry} />
    </>
  );
}

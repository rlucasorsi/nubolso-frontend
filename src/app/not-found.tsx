'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';

export default function NotFound() {
  const t = useTranslations('notFound');

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">{t('title')}</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {t('goToDashboard')}
      </Link>
    </div>
  );
}

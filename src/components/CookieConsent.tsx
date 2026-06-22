'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';

const STORAGE_KEY = 'nubolso-cookie-consent';

export function CookieConsent() {
  const t = useTranslations('cookieConsent');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="mx-auto max-w-2xl pointer-events-auto">
        <div className="glass-card border border-white/10 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-card-elegant">
          <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
            {t('message')}{' '}
            <Link href="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
              {t('privacyPolicy')}
            </Link>
            .
          </p>
          <button
            onClick={handleAccept}
            className="shrink-0 h-9 px-5 rounded-xl bg-primary text-white text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

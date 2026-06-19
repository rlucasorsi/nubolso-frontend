'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { COOKIE_KEYS } from '@/shared/constants/cookie-keys.constant';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    router.replace(token ? '/painel' : '/login');
  }, [router]);

  return null;
}

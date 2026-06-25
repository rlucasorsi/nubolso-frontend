'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useGetMe } from '@/modules/users/hooks/use-get-me';

export function SentryUserContext() {
  const { data: me } = useGetMe();

  useEffect(() => {
    if (me) {
      Sentry.setUser({ id: me.id, email: me.email, username: me.name });
    } else {
      Sentry.setUser(null);
    }
  }, [me]);

  return null;
}

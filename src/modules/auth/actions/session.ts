'use server';

import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '@/shared/constants/cookie-keys.constant';

const THIRTY_DAYS = 30 * 24 * 60 * 60;

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export async function setSessionTokenAction(token: string, options?: { remember?: boolean }) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_KEYS.ACCESS_TOKEN, token, {
    ...baseOptions,
    ...(options?.remember && { maxAge: THIRTY_DAYS }),
  });
}

export async function clearSessionTokenAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_KEYS.ACCESS_TOKEN);
}

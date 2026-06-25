import { NextRequest, NextResponse } from 'next/server';
import { setSessionTokenAction, clearSessionTokenAction } from '@/modules/auth/actions/session';

// Client Components calling a 'use server' action directly send the POST to
// the *current page's* URL (e.g. /login), which is a statically prerendered
// page. A real Route Handler here keeps that POST off the static page so it
// can't collide with the page's edge cache.
export async function POST(request: NextRequest) {
  const { token, remember } = await request.json();

  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ message: 'token is required' }, { status: 400 });
  }

  await setSessionTokenAction(token, { remember });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSessionTokenAction();

  return NextResponse.json({ ok: true });
}

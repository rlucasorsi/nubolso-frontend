import { NextRequest, NextResponse } from 'next/server';
import { HttpClient } from '@/network/http-client';
import { setSessionTokenAction } from '@/modules/auth/actions/session';
import type { AuthResponse, GoogleLoginPayload } from '@/services/auth';

// Fallback target for Google Identity Services' redirect UX mode. Safari (ITP)
// can fall back from the popup/FedCM flow to posting the credential as a real
// HTML form submission instead of calling our JS onSuccess handler. Without a
// dedicated login_uri, that POST lands on the (static, GET-only) /login page
// and gets a 405. This route gives that fallback a real handler.
//
// Calls the backend and sets the session cookie directly (instead of going
// through authService.googleLogin, which posts to /api/auth/session via a
// relative fetch — that only resolves in the browser, not in this server
// context).
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const credential = formData.get('credential');

  if (typeof credential !== 'string' || !credential) {
    return NextResponse.redirect(new URL('/login?error=google', request.url), 303);
  }

  try {
    const data = await HttpClient.post<AuthResponse, GoogleLoginPayload>(
      '/auth/google',
      { idToken: credential },
      { includeToken: false },
    );

    await setSessionTokenAction(data.accessToken);

    return NextResponse.redirect(new URL('/dashboard', request.url), 303);
  } catch {
    return NextResponse.redirect(new URL('/login?error=google', request.url), 303);
  }
}

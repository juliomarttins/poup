
'use server';

import { cookies } from 'next/headers';

export async function setCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const cookieStore = cookies();
  cookieStore.set('__session', idToken, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'lax',
  });
}

export async function removeCookie() {
    const cookieStore = cookies();
    cookieStore.delete('__session');
}

'use server';

import { cookies } from 'next/headers';

export async function setCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  // [CORREÇÃO] Adicionado 'await' antes de cookies(), obrigatório no Next.js 15
  const cookieStore = await cookies(); 
  
  cookieStore.set('__session', idToken, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'lax',
  });
}

export async function removeCookie() {
    // [CORREÇÃO] Adicionado 'await' aqui também para garantir compatibilidade
    const cookieStore = await cookies();
    cookieStore.delete('__session');
}
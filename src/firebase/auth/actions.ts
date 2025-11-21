'use server';

import { cookies } from 'next/headers';

export async function setCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias
  
  // [CORREÇÃO 1] Adicionado 'await', obrigatório no Next.js 15
  const cookieStore = await cookies(); 
  
  // [CORREÇÃO 2] Ajuste de segurança: 'secure' deve ser false em localhost (dev)
  // e true em produção. Se for true em http://localhost, o navegador REJEITA o cookie.
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set('__session', idToken, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: isProduction, // Dinâmico para evitar erros em dev
    path: '/',
    sameSite: 'lax',
  });
}

export async function removeCookie() {
    // [CORREÇÃO 1] Adicionado 'await' aqui também
    const cookieStore = await cookies();
    cookieStore.delete('__session');
}
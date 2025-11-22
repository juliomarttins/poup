'use client';
import { useEffect, useState, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

import { useAuth } from '@/firebase/provider';
import { setCookie, removeCookie } from './actions';

export interface UseUser {
  user: User | null;
  loading: boolean;
}

export const UserContext = createContext<UseUser>({
  user: null,
  loading: true,
});

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        try {
          const idToken = await user.getIdToken();
          await setCookie(idToken);
        } catch (error) {
          console.error('Failed to set session cookie:', error);
          // Handle error, maybe sign out user
          await removeCookie();
        }
      } else {
        await removeCookie();
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    // [CORREÇÃO] Adicionei '/login' aqui. Sem isso, o loop infinito acontece.
    // Adicionei também '/forgot-password' caso você crie essa rota no futuro.
    const publicRoutes = ['/', '/signup', '/login', '/forgot-password'];
    
    // Verifica se a rota atual COMEÇA com alguma das rotas públicas 
    // (útil se tiver sub-rotas ou query params, mas includes funciona para exatos)
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    if (!loading) {
        // Se NÃO tem usuário E NÃO está numa rota pública -> Chuta pra home
        if (!user && !isPublicRoute) {
            router.push('/');
        }
        
        // [SUGESTÃO DE MELHORIA] Opcional: Se o usuário TÁ logado e tenta ir pro login,
        // joga ele pro dashboard pra não ficar igual bobo na tela de login.
        // Descomente abaixo se quiser esse comportamento:
        /*
        if (user && (pathname === '/login' || pathname === '/signup')) {
             router.push('/dashboard'); // ou /select-profile
        }
        */
    }
  }, [user, loading, pathname, router]);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};
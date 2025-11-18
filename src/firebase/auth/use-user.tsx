
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
    const publicRoutes = ['/', '/signup'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!loading) {
        if (!user && !isPublicRoute) {
            router.push('/');
        }
    }
  }, [user, loading, pathname, router]);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

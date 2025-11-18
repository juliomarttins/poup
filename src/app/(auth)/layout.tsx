
import type { ReactNode } from 'react';
import { ProfileProvider } from '@/contexts/profile-context';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      {children}
    </ProfileProvider>
  );
}

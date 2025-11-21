
import type { ReactNode } from 'react';
import { ProfileProvider } from '@/contexts/profile-context';
import { ThemeProvider } from '@/components/theme-provider';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark">
      <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          defaultColor="default"
          enableSystem={false}
      >
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </ThemeProvider>
    </div>
  );
}

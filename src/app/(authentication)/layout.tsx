import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  // [CORREÇÃO 3] Removemos todos os Providers daqui. 
  // Eles já estão no RootLayout e cobrem toda a aplicação.
  return (
    <div className="flex min-h-screen flex-col">
      {children}
    </div>
  );
}
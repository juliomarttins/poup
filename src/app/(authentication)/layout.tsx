import type { ReactNode } from 'react';

// Providers já estão no RootLayout, não precisamos repetir aqui
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {children}
    </div>
  );
}

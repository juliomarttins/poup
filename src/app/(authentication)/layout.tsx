import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // Os Providers (Theme, Profile, User) já estão no RootLayout.
    // Não devemos repeti-los aqui para evitar resetar o estado do perfil.
    <div className="flex min-h-screen flex-col">
      {children}
    </div>
  );
}
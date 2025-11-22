'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// [CORREÇÃO] Usar o hook useUser que tem o estado de 'loading'
import { useUser } from '@/firebase/auth/use-user';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DashboardLayoutContent } from './_components/dashboard-layout-content';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSettingsProvider } from '@/contexts/dashboard-settings-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // [CORREÇÃO] Pegamos o estado de carregamento e o usuário do contexto global
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Só redireciona SE o carregamento terminou (loading = false) E não tem usuário
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Enquanto o Firebase está pensando (F5), não mostramos nada (ou poderíamos mostrar um spinner)
  // Isso impede que o layout "pisque" ou redirecione errado
  if (loading) return null;
  
  // Se carregou e não tem usuário, o useEffect acima já vai ter redirecionado.
  // Se chegou aqui e não tem usuário, retornamos null para evitar renderizar o dashboard protegido.
  if (!user) return null;

  return (
    <DashboardSettingsProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
              <DashboardLayoutContent>
                  {children}
              </DashboardLayoutContent>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </DashboardSettingsProvider>
  );
}
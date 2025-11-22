'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DashboardLayoutContent } from './_components/dashboard-layout-content';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // <--- IMPORTAR ISSO
import { ProfileProvider } from '@/contexts/profile-context';
import { DashboardSettingsProvider } from '@/contexts/dashboard-settings-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth && !auth.currentUser) {
      router.push('/');
    }
  }, [auth, router]);

  // Se não estiver autenticado, retorna null (ou loading) enquanto redireciona
  // Para evitar flash de conteúdo
  if (auth && !auth.currentUser) return null;

  return (
    <ProfileProvider>
      <DashboardSettingsProvider>
        {/* O SidebarProvider TEM que ficar aqui em volta de tudo */}
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
    </ProfileProvider>
  );
}
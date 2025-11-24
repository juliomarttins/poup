'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DashboardLayoutContent } from './_components/dashboard-layout-content';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSettingsProvider } from '@/contexts/dashboard-settings-context';
import { OnboardingWizard } from '@/components/dashboard/onboarding-wizard'; // [NOVO]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) return null;
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
              {/* [NOVO] Wizard injetado aqui para aparecer em cima de tudo quando necessário */}
              <OnboardingWizard />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </DashboardSettingsProvider>
  );
}
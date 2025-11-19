
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { DashboardSettingsProvider } from '@/contexts/dashboard-settings-context';
import { ProfileProvider } from '@/contexts/profile-context';
import { DashboardLayoutContent } from './_components/dashboard-layout-content';
import { ThemeProvider } from '@/components/theme-provider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          defaultColor="default"
          enableSystem={false}
      >
          <DashboardSettingsProvider>
              <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                <AppSidebar />
                <div className="flex flex-col">
                  <Header />
                  <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <DashboardLayoutContent>
                      {children}
                    </DashboardLayoutContent>
                  </main>
                </div>
              </div>
          </DashboardSettingsProvider>
      </ThemeProvider>
    </ProfileProvider>
  );
}


"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useProfile } from '@/contexts/profile-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoading } from '@/contexts/loading-context';

export function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { activeProfile, isLoading: isProfileLoading } = useProfile();
  const { hideLoading } = useLoading();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect on settings page
    if (pathname.startsWith('/dashboard/settings')) {
      return;
    }
    
    // Only redirect if profile context has finished loading and there's no active profile
    if (!isProfileLoading && !activeProfile) {
      router.push('/select-profile');
    }
  }, [activeProfile, isProfileLoading, router, pathname]);

  // When content is ready to be shown, hide the global loading screen.
  useEffect(() => {
    if (!isProfileLoading && activeProfile) {
      hideLoading();
    }
  }, [isProfileLoading, activeProfile, hideLoading]);

  // While profile context is loading, show a skeleton UI.
  // This prevents content flashes and provides a better loading experience.
  if (isProfileLoading) {
     return (
        <div className="flex flex-1 flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="lg:col-span-2 h-[500px]" />
            <Skeleton className="lg:col-span-1 h-[500px]" />
          </div>
        </div>
      )
  }

  // If there's no active profile (but loading is finished), we are likely about to redirect.
  // Render nothing to avoid a flash of content. The settings page has its own profile loading.
  if (!activeProfile && !pathname.startsWith('/dashboard/settings')) {
    return null;
  }
  
  return <>{children}</>;
}

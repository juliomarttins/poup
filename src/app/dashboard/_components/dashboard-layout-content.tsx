
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/contexts/profile-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoading } from '@/contexts/loading-context';

export function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { activeProfile, isLoading: isProfileLoading } = useProfile();
  const { hideLoading } = useLoading();
  const pathname = usePathname();

  // Hide the global loading screen once the profile state is resolved.
  useEffect(() => {
    if (!isProfileLoading) {
      hideLoading();
    }
  }, [isProfileLoading, hideLoading]);


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

  // If loading is finished, render the children.
  // The logic to redirect to /select-profile if no profile is active
  // should be handled by the page itself, or a higher-level component
  // that understands the page's requirements.
  return <>{children}</>;
}

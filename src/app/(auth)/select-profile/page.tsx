

'use client';

import { useRouter } from 'next/navigation';
import { useProfile } from '@/contexts/profile-context';
import { AvatarIcon } from '@/components/icons/avatar-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Info } from 'lucide-react';
import type { Profile, UserProfile } from '@/lib/types';
import { Logo } from '@/components/icons';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function SelectProfilePage() {
  const router = useRouter();
  const { setActiveProfile } = useProfile();
  const { user, loading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;

  const handleProfileSelect = (profile: Profile) => {
    setActiveProfile(profile);
    router.push('/dashboard');
  };

  const handleManageProfilesClick = () => {
    router.push('/dashboard/settings');
  };

  const ProfileSkeleton = () => (
    <div className="flex flex-col items-center gap-4 w-40">
      <Skeleton className="h-40 w-40 rounded-md" />
      <Skeleton className="h-6 w-24" />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4 sm:p-8">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="mb-4">
            <Logo className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-center md:text-5xl">
          Quem está acessando?
        </h1>
        
        <div className="mt-4 mb-10 flex items-center justify-center gap-2 rounded-lg border bg-muted p-3 text-sm text-muted-foreground max-w-md mx-auto">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-center">Todos os perfis compartilham as mesmas transações, dívidas e orçamentos.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {isLoading ? (
            <>
              <ProfileSkeleton />
              <ProfileSkeleton />
              <ProfileSkeleton />
            </>
          ) : (
            <>
              {userProfile?.profiles?.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className="group flex w-40 cursor-pointer flex-col items-center gap-3 text-muted-foreground transition-all "
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleProfileSelect(profile);
                  }}
                >
                  <Avatar 
                    className="h-40 w-40 overflow-hidden rounded-md border-4 border-transparent transition-all group-hover:scale-105 group-hover:border-primary flex items-center justify-center" 
                    style={{ background: profile.avatarBackground || 'hsl(var(--muted))' }}
                  >
                    <AvatarIcon
                      iconName={profile.photoURL}
                      fallbackName={profile.name}
                      className="h-2/3 w-2/3"
                      style={{ color: profile.avatarColor || 'hsl(var(--primary-foreground))' }}
                    />
                  </Avatar>
                  <p className="text-xl font-medium transition-colors group-hover:text-foreground">{profile.name}</p>
                </div>
              ))}
              
              <div onClick={handleManageProfilesClick} className="group flex w-40 cursor-pointer flex-col items-center gap-3 text-muted-foreground transition-all" role="button" tabIndex={0}>
                  <div className="flex h-40 w-40 items-center justify-center rounded-md border-4 border-transparent bg-muted/50 transition-all group-hover:scale-105 group-hover:border-primary group-hover:bg-muted">
                      <Plus className="h-16 w-16 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                  </div>
                  <p className="text-xl font-medium transition-colors group-hover:text-foreground">Adicionar Perfil</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-16">
          <Button size="lg" variant="outline" onClick={handleManageProfilesClick}>Gerenciar Perfis</Button>
        </div>
      </div>
    </div>
  );
}

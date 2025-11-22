'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { useProfile } from '@/contexts/profile-context';
import { useUser } from '@/firebase/auth/use-user';
import { useLoading } from '@/contexts/loading-context';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/ui/avatar';
import { AvatarIcon } from '@/components/icons/avatar-icon';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';

export function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { activeProfile, isLoading: isProfileLoading } = useProfile();
  const { hideLoading } = useLoading();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isProfileLoading) {
      hideLoading();
    }
  }, [isProfileLoading, hideLoading]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  const displayName = activeProfile?.name || user?.displayName || 'Usuário';
  const displayImage = activeProfile?.photoURL || user?.photoURL || undefined;
  const displayEmail = user?.email;

  // Estilo do avatar baseado no perfil selecionado
  const avatarStyle = activeProfile ? {
      background: activeProfile.avatarBackground || 'hsl(var(--muted))',
      color: activeProfile.avatarColor || 'hsl(var(--foreground))'
  } : undefined;

  if (isProfileLoading) {
     return (
        <div className="flex flex-1 flex-col gap-6 p-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
          </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* CABEÇALHO DO DASHBOARD */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-10">
        {/* Botão para abrir/fechar Sidebar */}
        <div className="flex items-center gap-2">
           <SidebarTrigger className="-ml-1" />
           <Separator orientation="vertical" className="mr-2 h-4" />
        </div>
        
        {/* Menu do Usuário (Avatar) na direita */}
        <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border border-border/50 focus-visible:ring-1">
                  <Avatar className="h-9 w-9 flex items-center justify-center">
                     <div 
                        className="flex items-center justify-center w-full h-full"
                        style={avatarStyle}
                     >
                        <AvatarIcon 
                            iconName={displayImage} 
                            fallbackName={displayName} 
                            className="h-5 w-5" 
                        />
                     </div>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {displayEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                   <Link href="/select-profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Trocar Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      {/* CONTEÚDO DA PÁGINA */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
         {children}
      </div>
    </div>
  );
}
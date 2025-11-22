'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase/provider';
import { useProfile } from '@/contexts/profile-context';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { AvatarIcon } from '@/components/icons/avatar-icon'; 

export function Header() {
  const { user, loading } = useUser();
  const { activeProfile } = useProfile(); 
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // [CORREÇÃO DEFINITIVA - LÓGICA DE EXIBIÇÃO]
  // 1. Home ('/'): Retorna NULL (A Home tem seu próprio header).
  // 2. Dashboard ('/dashboard...'): Retorna NULL (O Dashboard tem seu próprio layout com sidebar e header).
  // 3. Select Profile ('/select-profile'): Retorna NULL (Design limpo).
  // O Header Global só deve aparecer em páginas "órfãs" (como 404, termos de uso, etc).
  if (pathname === '/' || pathname?.startsWith('/dashboard') || pathname === '/select-profile') {
    return null;
  }

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/'); 
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const displayName = activeProfile?.name || user?.displayName || 'Usuário';
  const displayImage = activeProfile?.photoURL || user?.photoURL || undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        
        {/* LADO ESQUERDO - Logo sempre visível se o header aparecer */}
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight font-headline hidden sm:inline-block">Poupp</span>
            </Link>
        </div>

        {/* LADO DIREITO */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {loading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                     <div className="flex items-center justify-center w-full h-full bg-muted">
                        <AvatarIcon iconName={displayImage} fallbackName={displayName} className="h-5 w-5" />
                     </div>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <Link href="/select-profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Trocar Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-sm font-medium">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild className="text-sm font-medium">
                <Link href="/signup">Teste Grátis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
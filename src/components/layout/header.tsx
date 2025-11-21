"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useState } from "react";
import {
  Menu,
  LayoutDashboard,
  ArrowRightLeft,
  PiggyBank,
  Settings,
  Sun,
  Moon,
  Palette,
  LogOut,
  FileText,
  Users,
  Bot,
} from "lucide-react";
import { doc } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { Logo } from "@/components/icons";
import { AvatarIcon } from "../icons/avatar-icon";
import { Avatar } from "../ui/avatar";
import { useProfile } from "@/contexts/profile-context";
import { useLoading } from "@/contexts/loading-context";
import type { UserProfile, Profile } from "@/lib/types";
import { APP_VERSION, APP_NAME } from "@/lib/constants"; // [NOVO IMPORT]

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { href: "/dashboard/transactions", icon: ArrowRightLeft, label: "Transações" },
  { href: "/dashboard/debts", icon: PiggyBank, label: "Minhas Dívidas" },
  { href: "/dashboard/situation", icon: FileText, label: "Minha Situação" },
  { href: "/dashboard/poupp-ia", icon: Bot, label: "Poupp - IA" },
];

const pageTitles: { [key: string]: string } = {
    "/dashboard": "Painel",
    "/dashboard/transactions": "Transações",
    "/dashboard/debts": "Minhas Dívidas",
    "/dashboard/situation": "Minha Situação",
    "/dashboard/poupp-ia": "Poupp - IA",
    "/dashboard/settings": "Configurações",
    "/dashboard/settings/appearance": "Aparência",
    "/dashboard/settings/dashboard": "Painel",
};


function HeaderComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const { setTheme, colorTheme, setColorTheme } = useTheme();
  const { showLoading } = useLoading();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeProfile, setActiveProfile } = useProfile();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);


  let pageTitle = "Painel";
  Object.keys(pageTitles).forEach((path) => {
    if (pathname.startsWith(path) && path.length > (Object.keys(pageTitles).find(p => pageTitles[p as keyof typeof pageTitles] === pageTitle)?.length || 0)) {
        pageTitle = pageTitles[path as keyof typeof pageTitles];
    }
  });
  if (pathname === '/dashboard/settings') pageTitle = 'Perfis';


  const handleLogout = () => {
    if (!auth) return;
    setActiveProfile(null);
    signOut(auth);
    window.location.href = '/';
  };

  const handleProfileSwitch = (profileId: string) => {
    const profile = userProfile?.profiles?.find(p => p.id === profileId);
    if(profile) {
      setActiveProfile(profile);
      showLoading();
      router.push('/dashboard');
    }
  }

  const handleMobileNavClick = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  }
  
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Alternar menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
              onClick={() => handleMobileNavClick('/dashboard')}
            >
              <Logo className="h-8 w-8 text-primary" />
              <span >{APP_NAME}</span>
            </Link>
            {navItems.map(({ href, icon: Icon, label }) => (
              <Button
                key={href}
                variant="ghost"
                onClick={() => handleMobileNavClick(href)}
                className={cn(
                  "justify-start mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                  pathname.startsWith(href) && (href === "/dashboard" && pathname === href || href !== "/dashboard") ? "bg-muted text-primary" : ""
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Button>
            ))}
             <Button
                variant="ghost"
                onClick={() => handleMobileNavClick('/dashboard/settings')}
                className={cn(
                  "justify-start mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                  pathname.startsWith("/dashboard/settings") && "bg-muted text-primary"
                )}
              >
                <Settings className="h-5 w-5" />
                Configurações
              </Button>
          </nav>
          <div className="mt-auto p-4 text-center text-xs text-muted-foreground">
            {APP_VERSION}
          </div>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <h1 className="font-semibold text-xl">{pageTitle}</h1>
      </div>
      
        <div className="flex items-center gap-2">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Alternar Tema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Escuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("neutral")}>
                  Neutro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Palette className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">Cor do Tema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={colorTheme} onValueChange={setColorTheme}>
                  <DropdownMenuRadioItem value="default">Padrão</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="verde">Verde</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="roxo">Roxo</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rosa">Rosa</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar
                        className="h-10 w-10 flex items-center justify-center rounded-full"
                        style={{ background: activeProfile?.avatarBackground || 'hsl(var(--muted))' }}
                    >
                        <AvatarIcon
                            iconName={activeProfile?.photoURL}
                            fallbackName={activeProfile?.name}
                            className="h-6 w-6"
                            style={{ color: activeProfile?.avatarColor || 'hsl(var(--primary-foreground))' }}
                        />
                    </Avatar>
                    <span className="sr-only">Alternar menu de usuário</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{activeProfile?.name || 'Carregando...'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                  {userProfile?.profiles && userProfile.profiles.map((profile: Profile) => (
                    <DropdownMenuItem key={profile.id} onClick={() => handleProfileSwitch(profile.id)}>
                      <Avatar
                          className="h-6 w-6 mr-2 flex items-center justify-center rounded-full"
                          style={{background: profile.avatarBackground || 'hsl(var(--muted))'}}
                      >
                          <AvatarIcon
                              iconName={profile.photoURL}
                              fallbackName={profile.name}
                              className="h-4 w-4"
                              style={{ color: profile.avatarColor || 'hsl(var(--primary-foreground))' }}
                          />
                      </Avatar>
                      <span>{profile.name}</span>
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                  <Link href="/select-profile">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Trocar de Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Gerenciar Perfis</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  );
}

export const Header = memo(HeaderComponent);
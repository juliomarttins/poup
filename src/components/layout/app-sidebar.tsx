'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Bot,
  FileText,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { useAuth } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

const mainNavItems = [
  { title: 'Visão Geral', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Transações', url: '/dashboard/transactions', icon: ArrowRightLeft },
  { title: 'Dívidas', url: '/dashboard/debts', icon: CreditCard },
  { title: 'Situação', url: '/dashboard/situation', icon: BarChart3 },
  { title: 'Relatórios', url: '/dashboard/reports', icon: FileText },
  { title: 'Poupp IA', url: '/dashboard/poupp-ia', icon: Bot },
];

// [ATUALIZADO] Adicionado Novidades
const settingsNavItems = [
  { title: 'Configurações', url: '/dashboard/settings', icon: Settings },
  { title: 'Novidades', url: '/dashboard/changelog', icon: Sparkles },
  { title: 'Ajuda', url: '/dashboard/help', icon: HelpCircle },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const auth = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  
  const { user } = useUser();
  const firestore = useFirestore();
  
  const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const isAdmin = userProfile?.role === 'admin';

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
  };

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" onClick={handleLinkClick}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Logo className="size-8 text-yellow-500" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">Poupp</span>
                  <span className="truncate text-xs text-muted-foreground">Gestão Financeira</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link href={item.url} onClick={handleLinkClick}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {isAdmin && (
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard/admin'} tooltip="Painel Admin">
                    <Link href="/dashboard/admin" onClick={handleLinkClick} className="text-red-500 hover:text-red-600 hover:bg-red-50/50">
                        <ShieldAlert className="size-4" />
                        <span>Administração</span>
                    </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
          )}
        </SidebarMenu>
        
        <SidebarSeparator className="mx-2 my-2" />
        
        <SidebarMenu>
          {settingsNavItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                <Link href={item.url} onClick={handleLinkClick}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              tooltip="Sair"
              className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
            >
              <LogOut className="size-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
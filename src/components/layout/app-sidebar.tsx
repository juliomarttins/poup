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
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase/provider';
import { signOut } from 'firebase/auth';

// Definição dos itens do menu
const mainNavItems = [
  {
    title: 'Visão Geral',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Transações',
    url: '/dashboard/transactions',
    icon: ArrowRightLeft,
  },
  {
    title: 'Dívidas',
    url: '/dashboard/debts',
    icon: CreditCard,
  },
  {
    title: 'Situação',
    url: '/dashboard/situation',
    icon: BarChart3,
  },
];

const settingsNavItems = [
  {
    title: 'Configurações',
    url: '/dashboard/settings',
    icon: Settings,
  },
  {
    title: 'Ajuda',
    url: '/dashboard/help',
    icon: HelpCircle,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                {/* LOGO AMARELO AQUI */}
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
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarSeparator className="mx-2 my-2" />
        
        <SidebarMenu>
          {settingsNavItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                <Link href={item.url}>
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
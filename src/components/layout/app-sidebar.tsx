

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import {
  FileText,
  LayoutDashboard,
  PiggyBank,
  Settings,
  ArrowRightLeft,
  Bot,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/icons";


const navItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transações", icon: ArrowRightLeft },
  { href: "/dashboard/debts", label: "Minhas Dívidas", icon: PiggyBank },
  { href: "/dashboard/situation", label: "Minha Situação", icon: FileText },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

function SidebarComponent() {
  const pathname = usePathname();
  const appVersion = "v.1.0.4"; // Versão da aplicação

  return (
    <div className="hidden border-r bg-background md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8 w-8 text-primary" />
            <span className="">Poupp</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname.startsWith(href) && (href === "/dashboard" && pathname === href || href !== "/dashboard") ? "bg-muted text-primary" : ""
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
              <Card>
                <CardHeader className="p-2 pt-0 md:p-4">
                  <CardTitle>Precisa de Ajuda?</CardTitle>
                  <CardDescription>
                    Contate o suporte para assistência com o gerenciamento de suas finanças.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                  <Button size="sm" className="w-full" asChild>
                    <Link href="https://wa.me/5562998413382" target="_blank">Contatar Suporte</Link>
                  </Button>
                </CardContent>
              </Card>
        </div>
         <div className="p-4 pt-0 text-center text-xs text-muted-foreground">
            {appVersion}
        </div>
      </div>
    </div>
  );
}

export const AppSidebar = memo(SidebarComponent);

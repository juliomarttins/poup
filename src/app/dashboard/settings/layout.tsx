

import { Metadata } from "next"

import { Separator } from "@/components/ui/separator"
import { SettingsNav } from "@/components/settings/settings-nav"

export const metadata: Metadata = {
  title: "Configurações",
  description: "Gerencie as configurações e preferências da sua conta.",
}

const sidebarNavItems = [
  {
    title: "Perfis",
    href: "/dashboard/settings",
  },
  {
    title: "Aparência",
    href: "/dashboard/settings/appearance",
  },
  {
    title: "Painel",
    href: "/dashboard/settings/dashboard",
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="space-y-6">
       <div>
        <h3 className="text-lg font-medium">Configurações</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações e preferências da sua conta.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SettingsNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  )
}

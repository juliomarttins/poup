
"use client";

import { DashboardForm } from "@/components/settings/dashboard-form";

export default function SettingsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Painel</h3>
        <p className="text-sm text-muted-foreground">
          Personalize as informações exibidas em seu painel.
        </p>
      </div>
      <DashboardForm />
    </div>
  )
}

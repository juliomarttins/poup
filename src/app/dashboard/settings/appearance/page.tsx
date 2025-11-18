
"use client";

import { AppearanceForm } from "@/components/settings/appearance-form";

export default function SettingsAppearancePage() {
  return (
     <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Aparência</h3>
        <p className="text-sm text-muted-foreground">
          Personalize a aparência do aplicativo.
        </p>
      </div>
      <AppearanceForm />
    </div>
  )
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useDashboardSettings } from "@/contexts/dashboard-settings-context";

const dashboardFormSchema = z.object({
  showStats: z.boolean().default(true),
  showOverviewChart: z.boolean().default(true),
  showDebtChart: z.boolean().default(true),
  showRecentTransactions: z.boolean().default(true),
});

type DashboardFormValues = z.infer<typeof dashboardFormSchema>;

export function DashboardForm() {
  const { settings, setSettings } = useDashboardSettings();

  const form = useForm<DashboardFormValues>({
    resolver: zodResolver(dashboardFormSchema),
    defaultValues: settings,
  });

  function onSubmit(data: DashboardFormValues) {
    setSettings(data);
    toast({
      title: "Painel atualizado!",
      description: "Suas preferências do painel foram salvas.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <div>
          <h3 className="text-lg font-medium">Painel</h3>
          <p className="text-sm text-muted-foreground">
            Personalize as informações exibidas em seu painel.
          </p>
        </div>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="showStats"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Cartões de Estatísticas</FormLabel>
                  <FormDescription>
                    Mostrar cartões para renda, despesas, saldo e dívidas.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="showOverviewChart"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Gráfico de Visão Geral</FormLabel>
                  <FormDescription>
                    Mostrar o gráfico de Renda vs. Despesas.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="showDebtChart"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Gráfico de Progresso da Dívida</FormLabel>
                  <FormDescription>
                    Mostrar o gráfico que acompanha a redução total da dívida.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="showRecentTransactions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Transações Recentes</FormLabel>
                  <FormDescription>
                    Mostrar a lista de atividades financeiras recentes.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Atualizar painel</Button>
      </form>
    </Form>
  );
}

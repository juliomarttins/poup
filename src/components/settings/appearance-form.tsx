
"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Moon, Sun, SunMoon } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "neutral"], {
    required_error: "Por favor, selecione um tema.",
  }),
  colorTheme: z.enum(["default", "verde", "roxo", "rosa"], {
    required_error: "Por favor, selecione uma cor.",
  })
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const colorOptions = [
    { value: "default", label: "Padrão", colorLight: "hsl(48 96% 50%)", colorDark: "hsl(48 96% 50%)" },
    { value: "verde", label: "Verde", colorLight: "hsl(142.1 76.2% 36.3%)", colorDark: "hsl(142.1 70.6% 45.3%)" },
    { value: "roxo", label: "Roxo", colorLight: "hsl(262.1 83.3% 57.8%)", colorDark: "hsl(263.4 95.2% 58.4%)" },
    { value: "rosa", label: "Rosa", colorLight: "hsl(346.8 97.7% 49.8%)", colorDark: "hsl(346.8 97.7% 49.8%)" },
] as const;

export function AppearanceForm() {
  const { setTheme, theme, setColorTheme, colorTheme } = useTheme();

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: { theme, colorTheme },
    mode: "onChange",
  });

  const currentMode = theme;
    
  const watchedTheme = form.watch("theme");
  const watchedColorTheme = form.watch("colorTheme");

  useEffect(() => {
    form.reset({ theme, colorTheme });
  }, [theme, colorTheme, form]);

  useEffect(() => {
    if (watchedTheme && watchedTheme !== theme) {
      setTheme(watchedTheme);
    }
  }, [watchedTheme, theme, setTheme]);

  useEffect(() => {
    if (watchedColorTheme && watchedColorTheme !== colorTheme) {
      setColorTheme(watchedColorTheme);
    }
  }, [watchedColorTheme, colorTheme, setColorTheme]);


  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Tema</FormLabel>
              <FormDescription>
                Selecione o tema para o painel.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 pt-2 sm:grid-cols-3 gap-8"
              >
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="light" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Claro
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="dark" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Escuro
                    </span>
                  </FormLabel>
                </FormItem>
                 <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="neutral" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                       <div className="flex items-center justify-center h-full text-muted-foreground p-12">
                          <SunMoon className="h-6 w-6" />
                       </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Neutro
                    </span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorTheme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Paleta de Cores</FormLabel>
              <FormDescription>
                Selecione a paleta de cores para a aplicação.
              </FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-2 pt-2 sm:grid-cols-4 gap-4"
              >
                {colorOptions.map(option => (
                    <FormItem key={option.value}>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                            <FormControl>
                                <RadioGroupItem value={option.value} className="sr-only" />
                            </FormControl>
                            <div
                            className={cn(
                                "items-center rounded-md border-2 border-muted p-1 hover:border-accent"
                            )}
                            >
                                <div className={cn("flex justify-center items-center h-20 rounded-lg", currentMode === 'light' ? 'bg-card' : 'bg-background')}>
                                    <div
                                    className="w-10 h-10 rounded-full"
                                    style={{ backgroundColor: currentMode === 'light' ? option.colorLight : option.colorDark }}
                                    />
                                </div>
                            </div>
                            <span className="block w-full p-2 text-center font-normal">
                                {option.label}
                            </span>
                        </FormLabel>
                    </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

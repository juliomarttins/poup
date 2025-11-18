
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ManagedDebt } from "@/lib/types";
import { useEffect } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { useUser } from "@/firebase";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  category: z.string().min(2, { message: "A categoria deve ter pelo menos 2 caracteres." }),
  totalInstallments: z.coerce.number().int().positive({ message: "Deve ser um número inteiro positivo." }),
  installmentAmount: z.coerce.number().positive({ message: "O valor da parcela deve ser positivo." }),
  paidInstallments: z.coerce.number().int().min(0, { message: "Não pode ser negativo." }),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  totalAmount: z.coerce.number(),
  paidAmount: z.coerce.number(),
}).refine(data => data.paidInstallments <= data.totalInstallments, {
  message: "As parcelas pagas não podem exceder o total de parcelas.",
  path: ["paidInstallments"],
});

type FormValues = z.infer<typeof formSchema>;

interface EditDebtFormProps {
  debt: ManagedDebt;
  onSave: (debt: ManagedDebt) => void;
  onCancel: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export function EditDebtForm({ debt, onSave, onCancel }: EditDebtFormProps) {
  const { user } = useUser();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...debt, dueDate: new Date(debt.dueDate) },
  });

  const { control, setValue } = form;
  const watchedValues = useWatch({ control });

  useEffect(() => {
    const totalInstallments = Number(watchedValues.totalInstallments) || 0;
    const installmentAmount = Number(watchedValues.installmentAmount) || 0;
    const paidInstallments = Number(watchedValues.paidInstallments) || 0;
    
    const totalAmount = totalInstallments * installmentAmount;
    const paidAmount = paidInstallments * installmentAmount;

    setValue("totalAmount", totalAmount, { shouldValidate: true });
    setValue("paidAmount", paidAmount, { shouldValidate: true });
  }, [watchedValues.totalInstallments, watchedValues.installmentAmount, watchedValues.paidInstallments, setValue]);


  function onSubmit(data: FormValues) {
    if (!user) return;
    onSave({ 
        ...debt, 
        ...data, 
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
        userId: user.uid,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Dívida</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="installmentAmount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Valor da Parcela</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="totalInstallments"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Total de Parcelas</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="paidInstallments"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Parcelas Pagas</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                     <FormItem className="flex flex-col">
                        <FormLabel>Primeiro Vencimento</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="rounded-md border bg-muted/50 p-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Resumo Calculado</h4>
            <div className="flex justify-between items-center">
                <span className="text-sm">Valor Total da Dívida</span>
                <span className="font-semibold text-lg">{formatCurrency(watchedValues.totalAmount || 0)}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-sm">Total Já Pago</span>
                <span className="font-semibold">{formatCurrency(watchedValues.paidAmount || 0)}</span>
            </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto">Salvar Alterações</Button>
        </div>
      </form>
    </Form>
  );
}

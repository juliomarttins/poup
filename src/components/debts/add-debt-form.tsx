"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ManagedDebt } from "@/lib/types";
import { doc, collection } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ScanLine, Loader2, Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  category: z.string().min(2, { message: "A categoria deve ter pelo menos 2 caracteres." }),
  totalInstallments: z.coerce.number().int().positive({ message: "Deve ser um número inteiro positivo." }),
  installmentAmount: z.coerce.number().positive({ message: "O valor da parcela deve ser positivo." }),
  paidInstallments: z.coerce.number().int().min(0, { message: "Não pode ser negativo." }).default(0),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  totalAmount: z.coerce.number(),
  paidAmount: z.coerce.number(),
}).refine(data => data.paidInstallments <= data.totalInstallments, {
  message: "As parcelas pagas não podem exceder o total de parcelas.",
  path: ["paidInstallments"],
});

type FormValues = z.infer<typeof formSchema>;

interface AddDebtFormProps {
  onSave: (debt: ManagedDebt) => void;
  onCancel: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export function AddDebtForm({ onSave, onCancel }: AddDebtFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      paidInstallments: 0,
      totalInstallments: 1,
      dueDate: new Date(),
    },
  });

  const { control, setValue } = form;
  const watchedValues = useWatch({ control });

  // Recalcula totais quando parcelas mudam
  useEffect(() => {
    const totalInstallments = Number(watchedValues.totalInstallments) || 0;
    const installmentAmount = Number(watchedValues.installmentAmount) || 0;
    const paidInstallments = Number(watchedValues.paidInstallments) || 0;
    
    const totalAmount = totalInstallments * installmentAmount;
    const paidAmount = paidInstallments * installmentAmount;

    setValue("totalAmount", totalAmount, { shouldValidate: true });
    setValue("paidAmount", paidAmount, { shouldValidate: true });
  }, [watchedValues.totalInstallments, watchedValues.installmentAmount, watchedValues.paidInstallments, setValue]);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/extract-invoice', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error("Falha ao processar imagem");

        const data = await response.json();

        // Popula o formulário com os dados da IA
        if (data.name) setValue("name", data.name);
        if (data.category) setValue("category", data.category);
        if (data.totalInstallments) setValue("totalInstallments", data.totalInstallments);
        if (data.installmentAmount) setValue("installmentAmount", data.installmentAmount);
        if (data.paidInstallments !== undefined) setValue("paidInstallments", data.paidInstallments);
        
        if (data.dueDate) {
            // Corrige fuso horário simples adicionando horas para garantir o dia correto
            const dateObj = new Date(data.dueDate);
            dateObj.setHours(12, 0, 0, 0);
            setValue("dueDate", dateObj);
        }

        toast({
            title: "Leitura concluída!",
            description: "Verifique os dados e salve a dívida.",
        });

    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Erro na leitura",
            description: "Não foi possível extrair os dados. Tente digitar manualmente.",
        });
    } finally {
        setIsScanning(false);
        // Limpa o input para permitir selecionar o mesmo arquivo se falhar
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  function onSubmit(data: FormValues) {
    if (!firestore || !user) return;
    const newDocRef = doc(collection(firestore, '_'));
    const newDebt: ManagedDebt = {
        id: newDocRef.id,
        ...data,
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
        userId: user.uid,
    };
    onSave(newDebt);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* BOTÃO DE ESCANEAR - MAGIC HAPPENS HERE */}
        <div className="bg-muted/40 p-4 rounded-lg border border-dashed border-primary/20 flex flex-col items-center justify-center gap-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,application/pdf" 
                onChange={handleFileChange}
            />
            <Button 
                type="button" 
                variant="secondary" 
                className="w-full gap-2 border-primary/20 hover:border-primary/50 transition-colors"
                onClick={handleScanClick}
                disabled={isScanning}
            >
                {isScanning ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Lendo Arquivo...</>
                ) : (
                    <><ScanLine className="h-4 w-4 text-primary" /> Escanear Conta / Boleto</>
                )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
                Tire uma foto ou envie um PDF. A IA preencherá os dados para você.
            </p>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Dívida</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Financiamento do Carro" {...field} />
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
                <Input placeholder="Ex: Veículo" {...field} />
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
          <Button type="submit" className="w-full sm:w-auto">Adicionar Dívida</Button>
        </div>
      </form>
    </Form>
  );
}
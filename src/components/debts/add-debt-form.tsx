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
import { doc, collection } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Camera, Upload, FileText, Scan } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Mínimo 2 caracteres." }),
  category: z.string().min(2, { message: "Mínimo 2 caracteres." }),
  totalInstallments: z.coerce.number().int().positive(),
  installmentAmount: z.coerce.number().positive(),
  paidInstallments: z.coerce.number().int().min(0).default(0),
  dueDate: z.date({ required_error: "Data obrigatória." }),
  totalAmount: z.coerce.number(),
  paidAmount: z.coerce.number(),
}).refine(data => data.paidInstallments <= data.totalInstallments, {
  message: "Parcelas pagas excedem o total.",
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      paidInstallments: 0,
      totalInstallments: 1,
      installmentAmount: 0,
      dueDate: new Date(),
    },
  });

  const { control, setValue } = form;
  const watchedValues = useWatch({ control });

  // Atualiza totais automaticamente
  useEffect(() => {
    const total = (Number(watchedValues.totalInstallments) || 0) * (Number(watchedValues.installmentAmount) || 0);
    const paid = (Number(watchedValues.paidInstallments) || 0) * (Number(watchedValues.installmentAmount) || 0);
    setValue("totalAmount", total);
    setValue("paidAmount", paid);
  }, [watchedValues.totalInstallments, watchedValues.installmentAmount, watchedValues.paidInstallments, setValue]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpa o input para permitir selecionar o mesmo arquivo depois
    e.target.value = "";

    if (file.size > 4 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande", description: "Máximo 4MB. Tente outra foto." });
        return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = await user?.getIdToken();
        const response = await fetch('/api/extract-invoice', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro ao processar arquivo.");
        }

        // Preencher campos com dados da IA
        if (data.name) setValue("name", data.name);
        if (data.category) setValue("category", data.category);
        
        if (data.totalAmount && (!data.installmentAmount || data.installmentAmount === 0)) {
             setValue("installmentAmount", data.totalAmount);
             setValue("totalInstallments", 1);
        } else if (data.installmentAmount) {
             setValue("installmentAmount", data.installmentAmount);
             setValue("totalInstallments", data.totalInstallments || 1);
        }

        if (typeof data.paidInstallments === 'number') setValue("paidInstallments", data.paidInstallments);
        
        if (data.dueDate) {
            const [y, m, d] = data.dueDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            if (!isNaN(dateObj.getTime())) {
                // Ajusta para meio-dia para evitar problemas de fuso horário
                dateObj.setHours(12, 0, 0, 0);
                setValue("dueDate", dateObj);
            }
        }

        toast({ title: "Leitura concluída!", description: "Confira os dados extraídos." });

    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Erro na leitura",
            description: error.message || "Tente digitar manualmente.",
        });
    } finally {
        setIsScanning(false);
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
        
        {/* ÁREA DE UPLOAD CORRIGIDA - VISÍVEL EM TODOS OS TEMAS */}
        <div className="bg-secondary p-4 rounded-lg border border-dashed border-primary/40 flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-foreground/80">
                <Scan className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide">IA Scanner</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Botão CÂMERA (Mobile) */}
                <div className="w-full">
                    <input 
                        ref={cameraInputRef}
                        type="file" 
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Button 
                        type="button" 
                        variant="outline"
                        className="w-full h-12 flex flex-col items-center justify-center gap-1 bg-background hover:bg-accent border-input"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isScanning}
                    >
                        {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5 text-primary" />}
                        <span className="text-[10px] font-medium">Câmera</span>
                    </Button>
                </div>

                {/* Botão ARQUIVO (PC/Galeria) */}
                <div className="w-full">
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Button 
                        type="button" 
                        variant="outline"
                        className="w-full h-12 flex flex-col items-center justify-center gap-1 bg-background hover:bg-accentNQ border-input"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                    >
                        {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-5 h-5 text-primary" />}
                        <span className="text-[10px] font-medium">Arquivo/PDF</span>
                    </Button>
                </div>
            </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Dívida</FormLabel>
              <FormControl><Input placeholder="Ex: Financiamento" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl><Input placeholder="Ex: Veículo" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="installmentAmount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Valor Parcela</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="totalInstallments"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Total Parc.</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="paidInstallments"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Pagas</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-between items-center px-1 pb-2 bg-muted/30 p-2 rounded-md">
             <span className="text-xs text-muted-foreground">Total:</span>
             <span className="font-bold text-primary">{formatCurrency(watchedValues.totalAmount || 0)}</span>
        </div>

        <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>1º Vencimento</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal w-full", !field.value && "text-muted-foreground")}
                            >
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
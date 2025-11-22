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
import { CalendarIcon, Loader2, Camera, UploadCloud, FileText } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  category: z.string().min(2, { message: "A categoria deve ter pelo menos 2 caracteres." }),
  totalInstallments: z.coerce.number().int().positive({ message: "Deve ser positivo." }),
  installmentAmount: z.coerce.number().positive({ message: "Deve ser positivo." }),
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
  
  // Refs separados para Câmera e Arquivo para garantir compatibilidade mobile
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

  useEffect(() => {
    const totalInstallments = Number(watchedValues.totalInstallments) || 0;
    const installmentAmount = Number(watchedValues.installmentAmount) || 0;
    const paidInstallments = Number(watchedValues.paidInstallments) || 0;
    
    const totalAmount = totalInstallments * installmentAmount;
    const paidAmount = paidInstallments * installmentAmount;

    setValue("totalAmount", totalAmount);
    setValue("paidAmount", paidAmount);
  }, [watchedValues.totalInstallments, watchedValues.installmentAmount, watchedValues.paidInstallments, setValue]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validação de Tamanho no Cliente (4MB)
    if (file.size > 4 * 1024 * 1024) {
        toast({
            variant: "destructive",
            title: "Arquivo muito grande",
            description: "Por favor, envie uma imagem ou PDF menor que 4MB.",
        });
        return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/extract-invoice', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro desconhecido na leitura.");
        }

        // Preenchimento Inteligente
        if (data.name) setValue("name", data.name);
        if (data.category) setValue("category", data.category);
        
        // Lógica para valores
        if (data.totalAmount && (!data.installmentAmount || data.installmentAmount === 0)) {
             // Se veio só o total, assume parcela única
             setValue("installmentAmount", data.totalAmount);
             setValue("totalInstallments", 1);
        } else if (data.installmentAmount) {
             setValue("installmentAmount", data.installmentAmount);
             setValue("totalInstallments", data.totalInstallments || 1);
        }

        if (data.paidInstallments !== undefined) setValue("paidInstallments", data.paidInstallments);
        
        if (data.dueDate) {
            const dateObj = new Date(data.dueDate);
            // Ajuste simples de timezone
            dateObj.setHours(12, 0, 0, 0); 
            if (!isNaN(dateObj.getTime())) {
                setValue("dueDate", dateObj);
            }
        }

        toast({
            title: "Leitura concluída!",
            description: "Confira os dados e salve a dívida.",
        });

    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Erro na leitura",
            description: error.message || "Tente digitar manualmente.",
        });
    } finally {
        setIsScanning(false);
        // Limpa inputs
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
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
        
        {/* ÁREA DE SCAN INTELIGENTE */}
        <div className="bg-primary/5 p-4 rounded-lg border border-dashed border-primary/20 flex flex-col gap-3">
            <p className="text-xs font-medium text-primary text-center mb-1">
                Preenchimento Automático com IA
            </p>
            
            {/* Inputs Ocultos */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,application/pdf" 
                onChange={handleFileChange}
            />
            <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" // Força câmera traseira no mobile
                onChange={handleFileChange}
            />

            <div className="grid grid-cols-2 gap-3">
                <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full gap-2 h-12 border-primary/30 hover:bg-primary/10 hover:text-primary"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isScanning}
                >
                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    <span className="text-xs">Câmera</span>
                </Button>
                
                <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full gap-2 h-12 border-primary/30 hover:bg-primary/10 hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                >
                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    <span className="text-xs">Arquivo/PDF</span>
                </Button>
            </div>
        </div>

        <div className="space-y-4 pt-2">
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
            
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="totalInstallments"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Total Parc.</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
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
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <div className="flex flex-col justify-end pb-2">
                     <div className="text-xs text-muted-foreground text-right">Total Calculado</div>
                     <div className="font-bold text-primary text-right text-sm">{formatCurrency(watchedValues.totalAmount || 0)}</div>
                </div>
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
                                className={cn(
                                    "pl-3 text-left font-normal w-full",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
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

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto">Salvar Dívida</Button>
        </div>
      </form>
    </Form>
  );
}
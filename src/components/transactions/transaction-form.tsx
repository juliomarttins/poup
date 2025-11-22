"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Transaction } from "@/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Camera, Upload, Loader2, ScanLine } from "lucide-react";
import { ptBR } from 'date-fns/locale';
import { useFirestore, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useProfile } from "@/contexts/profile-context";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: "O tipo é obrigatório."}),
  description: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser maior que zero." }),
  date: z.date({ required_error: "A data é obrigatória." }),
  category: z.string().min(2, { message: "A categoria é obrigatória." }),
  customCategory: z.string().optional(),
}).refine(data => {
    if (data.category === 'Outros' && (!data.customCategory || data.customCategory.length < 2)) {
        return false;
    }
    return true;
}, {
    message: "A nova categoria deve ter pelo menos 2 caracteres.",
    path: ['customCategory'],
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  initialData?: Transaction;
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
}

export function TransactionForm({ initialData, onSave, onCancel }: TransactionFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { activeProfile } = useProfile();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const isDefaultCategory = initialData 
    ? (DEFAULT_CATEGORIES.income.includes(initialData.category) || DEFAULT_CATEGORIES.expense.includes(initialData.category))
    : true;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData?.type || 'expense',
      description: initialData?.description || "",
      amount: initialData ? Math.abs(initialData.amount) : 0,
      category: initialData ? (isDefaultCategory ? initialData.category : 'Outros') : "",
      customCategory: initialData && !isDefaultCategory ? initialData.category : "",
      date: initialData ? new Date(initialData.date) : new Date(),
    },
  });

  const transactionType = form.watch('type');
  const selectedCategory = form.watch('category');
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 4.5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Erro", description: "Arquivo > 4.5MB." });
        e.target.value = "";
        return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = await user.getIdToken();
        const res = await fetch('/api/extract-invoice', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Erro na leitura.");

        let fieldsFilled = 0;

        if (data.name) {
            form.setValue("description", data.name, { shouldValidate: true });
            fieldsFilled++;
        }
        
        const amountVal = Number(data.totalAmount);
        if (amountVal && amountVal > 0) {
            form.setValue("amount", amountVal, { shouldValidate: true });
            fieldsFilled++;
        }

        if (data.category) {
            const hasCat = DEFAULT_CATEGORIES[transactionType].includes(data.category);
            if (hasCat) {
                form.setValue("category", data.category, { shouldValidate: true });
                form.setValue("customCategory", "");
                fieldsFilled++;
            } else {
                 form.setValue("category", "Outros");
                 form.setValue("customCategory", data.category, { shouldValidate: true });
                 fieldsFilled++;
            }
        }
        
        if (data.dueDate) {
            const [y, m, d] = data.dueDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            dateObj.setHours(12, 0, 0, 0);
            if (!isNaN(dateObj.getTime())) {
                form.setValue("date", dateObj, { shouldValidate: true });
                fieldsFilled++;
            }
        }

        if (fieldsFilled > 0) {
            toast({ title: "Leitura realizada!", description: "Verifique os campos importados." });
        } else {
            toast({ variant: "warning", title: "Atenção", description: "Não foi possível identificar os dados com clareza." });
        }

    } catch (error: any) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  function onSubmit(data: FormValues) {
    if (!firestore || !user || !activeProfile) return;
    
    const amount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
    const finalCategory = data.category === 'Outros' ? data.customCategory! : data.category;
    const id = initialData?.id || doc(collection(firestore, '_')).id;

    const transactionData: Transaction = {
        id,
        description: capitalize(data.description),
        amount,
        type: data.type,
        date: format(data.date, "yyyy-MM-dd"),
        category: capitalize(finalCategory),
        userId: user.uid,
        profileId: initialData?.profileId || activeProfile.id,
    };
    onSave(transactionData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3"> {/* Espaçamento reduzido de 4 para 3 */}
        
        {/* ÁREA DE SCAN COMPACTA */}
        <div className="bg-secondary/30 p-3 rounded-lg border border-dashed border-primary/30 flex flex-col gap-2">
             <div className="flex items-center justify-center gap-2 text-primary font-semibold text-[10px] uppercase tracking-wide">
                <ScanLine className="w-3 h-3" /> Importar Boleto / Recibo
            </div>

            <div className="grid grid-cols-1 gap-2">
                <div className="md:hidden grid grid-cols-2 gap-2">
                     <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                     <Button 
                        type="button" variant="outline" 
                        className="h-9 gap-2 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary font-normal text-xs"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isScanning}
                    >
                        {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        Câmera
                    </Button>

                    <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                    <Button 
                        type="button" variant="outline" 
                        className="h-9 gap-2 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary font-normal text-xs"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                    >
                        {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Arquivo
                    </Button>
                </div>

                <div className="hidden md:block">
                    <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                    <Button 
                        type="button" variant="outline" 
                        className="w-full h-9 gap-2 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary font-normal text-xs"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                    >
                         {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                         Carregar Imagem ou PDF
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem className="space-y-1">
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-2">
                    <FormItem>
                        <FormControl><RadioGroupItem value="income" className="sr-only" /></FormControl>
                        <FormLabel className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-xs hover:bg-accent cursor-pointer transition-colors h-9", field.value === 'income' && "border-accent bg-accent/10")}>
                        Renda
                        </FormLabel>
                    </FormItem>
                    <FormItem>
                        <FormControl><RadioGroupItem value="expense" className="sr-only" /></FormControl>
                        <FormLabel className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-xs hover:bg-destructive/10 cursor-pointer transition-colors h-9", field.value === 'expense' && "border-destructive bg-destructive/10")}>
                        Despesa
                        </FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col space-y-1">
                <FormLabel>Data</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal h-10", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem className="space-y-1">
                <FormLabel>Descrição</FormLabel>
                <FormControl><Input {...field} placeholder="Ex: Mercado" className="h-10" /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem className="space-y-1">
                <FormLabel>Valor</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} className="h-10" /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem className="space-y-1">
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {DEFAULT_CATEGORIES[transactionType].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            <SelectItem value="Outros">Outra...</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        {selectedCategory === 'Outros' && (
            <FormField
                control={form.control}
                name="customCategory"
                render={({ field }) => (
                    <FormItem className="space-y-1">
                    <FormLabel>Nova Categoria</FormLabel>
                    <FormControl><Input {...field} placeholder="Nome da categoria" className="h-10" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 pb-2">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto h-10">Cancelar</Button>
            <Button type="submit" className="w-full sm:w-auto h-10">{initialData ? "Salvar" : "Adicionar"}</Button>
        </div>
      </form>
    </Form>
  );
}
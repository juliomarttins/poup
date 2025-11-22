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
import { Calendar as CalendarIcon, Camera, UploadCloud, Sparkles, ScanLine, Check, Plus } from "lucide-react";
import { ptBR } from 'date-fns/locale';
import { useFirestore, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useProfile } from "@/contexts/profile-context";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(2, "Mínimo 2 caracteres"),
  amount: z.coerce.number().positive("Valor inválido"),
  date: z.date(),
  category: z.string().min(1, "Selecione uma categoria"),
  customCategory: z.string().optional(),
}).refine(data => {
    if (data.category === 'custom' && (!data.customCategory || data.customCategory.length < 2)) {
        return false;
    }
    return true;
}, {
    message: "Nome da categoria obrigatório",
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
  const [uploadProgress, setUploadProgress] = useState(0);

  const isDefaultCategory = initialData 
    ? (DEFAULT_CATEGORIES.income.includes(initialData.category) || DEFAULT_CATEGORIES.expense.includes(initialData.category))
    : true;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData?.type || 'expense',
      description: initialData?.description || "",
      amount: initialData ? Math.abs(initialData.amount) : 0,
      category: initialData ? (isDefaultCategory ? initialData.category : 'custom') : "",
      customCategory: initialData && !isDefaultCategory ? initialData.category : "",
      date: initialData ? new Date(initialData.date) : new Date(),
    },
  });

  const transactionType = form.watch('type');
  const selectedCategory = form.watch('category');
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  // Animação fake de progresso para UX
  useEffect(() => {
    if (isScanning) {
        setUploadProgress(10);
        const timer = setInterval(() => {
            setUploadProgress((prev) => prev >= 90 ? 90 : prev + 15);
        }, 300);
        return () => clearInterval(timer);
    } else {
        setUploadProgress(0);
    }
  }, [isScanning]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 4.5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo grande", description: "Limite de 4.5MB" });
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

        if (data.name) form.setValue("description", data.name);
        if (data.totalAmount) form.setValue("amount", Number(data.totalAmount));
        
        if (data.category) {
            const hasCat = DEFAULT_CATEGORIES[transactionType].includes(data.category);
            if (hasCat) {
                form.setValue("category", data.category);
                form.setValue("customCategory", ""); 
            } else {
                // Mapeamento inteligente
                const map: Record<string, string> = {
                    'Internet': 'Contas', 'Energia': 'Contas', 'Água': 'Contas'
                };
                const mappedCat = map[data.category] || 'custom';
                
                form.setValue("category", mappedCat);
                if (mappedCat === 'custom') form.setValue("customCategory", data.category);
            }
        }
        
        if (data.dueDate) {
            const [y, m, d] = data.dueDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            dateObj.setHours(12, 0, 0, 0);
            if (!isNaN(dateObj.getTime())) form.setValue("date", dateObj);
        }

        setUploadProgress(100);
        setTimeout(() => setIsScanning(false), 500);
        toast({ title: "Lido com sucesso!", duration: 2000 });

    } catch (error: any) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível ler o arquivo." });
        setIsScanning(false);
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  function onSubmit(data: FormValues) {
    if (!firestore || !user || !activeProfile) return;
    
    const amount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
    const finalCategory = data.category === 'custom' ? data.customCategory! : data.category;
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        
        {/* SCANNER MODERNO & COMPACTO */}
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
             {isScanning && <Progress value={uploadProgress} className="absolute top-0 left-0 right-0 h-1 z-10 rounded-none" />}
             
             <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                        {isScanning ? <Sparkles className="w-4 h-4 animate-pulse" /> : <ScanLine className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold">Preenchimento com IA</span>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline-block">Carregue um comprovante</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                    
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs gap-1.5 px-3 md:hidden" onClick={() => cameraInputRef.current?.click()} disabled={isScanning}>
                        <Camera className="w-3.5 h-3.5" /> Foto
                    </Button>
                    <Button type="button" size="sm" variant="secondary" className="h-8 text-xs gap-1.5 px-3" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                        <UploadCloud className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Carregar</span> Arquivo
                    </Button>
                </div>
             </div>
        </div>

        {/* TIPO (SEGMENTED CONTROL) */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex p-1 bg-muted/50 rounded-lg">
                  <FormItem className="flex-1 space-y-0">
                    <FormControl><RadioGroupItem value="income" className="sr-only" /></FormControl>
                    <FormLabel className={cn(
                        "flex items-center justify-center py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all",
                        field.value === 'income' ? "bg-background text-green-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                        Receita
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex-1 space-y-0">
                    <FormControl><RadioGroupItem value="expense" className="sr-only" /></FormControl>
                    <FormLabel className={cn(
                        "flex items-center justify-center py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all",
                        field.value === 'expense' ? "bg-background text-red-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                        Despesa
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        
        {/* GRID PRINCIPAL (ALINHADA) */}
        <div className="grid gap-4">
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem className="space-y-1">
                    <FormLabel className="text-xs text-muted-foreground font-medium uppercase">Descrição</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder="Ex: Compras no mercado" className="h-9 text-sm bg-transparent focus-visible:ring-offset-0" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem className="space-y-1">
                    <FormLabel className="text-xs text-muted-foreground font-medium uppercase">Valor (R$)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-9 text-sm bg-transparent font-mono" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="space-y-1">
                    <FormLabel className="text-xs text-muted-foreground font-medium uppercase">Data</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant="outline" className={cn("w-full h-9 pl-3 text-left font-normal text-sm bg-transparent", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Data</span>}
                            <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                        </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                    </FormItem>
                )}
                />
            </div>

            <div className="space-y-2">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                        <FormLabel className="text-xs text-muted-foreground font-medium uppercase">Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-9 text-sm bg-transparent">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                            </FormControl>
                            {/* CORREÇÃO DO BUG: SelectContent limpo */}
                            <SelectContent position="popper" sideOffset={5} className="max-h-[180px] w-[var(--radix-select-trigger-width)] rounded-lg border shadow-lg bg-popover">
                                {DEFAULT_CATEGORIES[transactionType].map(cat => (
                                    <SelectItem key={cat} value={cat} className="text-sm py-1.5 cursor-pointer focus:bg-accent/50">{cat}</SelectItem>
                                ))}
                                <div className="h-px bg-border my-1" />
                                <SelectItem value="custom" className="text-sm py-1.5 cursor-pointer font-medium text-primary focus:bg-primary/10 focus:text-primary">
                                    <div className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Criar nova...</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {selectedCategory === 'custom' && (
                    <FormField
                        control={form.control}
                        name="customCategory"
                        render={({ field }) => (
                            <FormItem className="animate-in slide-in-from-top-1 fade-in duration-200 space-y-1">
                                <FormControl>
                                    <Input {...field} placeholder="Digite o nome da categoria..." className="h-9 text-sm bg-primary/5 border-primary/30 focus-visible:ring-primary/30" autoFocus />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        </div>
        
        <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-9 text-sm">Cancelar</Button>
            <Button type="submit" className="flex-1 h-9 text-sm font-semibold shadow-md">{initialData ? "Salvar" : "Adicionar"}</Button>
        </div>
      </form>
    </Form>
  );
}
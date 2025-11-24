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
import { Calendar as CalendarIcon, Camera, UploadCloud, Sparkles, ScanLine, Plus, Loader2, FileText } from "lucide-react";
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
  const [scanStatus, setScanStatus] = useState("IA Pronta");

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

  // Simulação de progresso mais suave
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
        setUploadProgress(5);
        interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) return 90; 
                // Desacelera conforme chega perto dos 90
                const increment = Math.max(1, (90 - prev) / 10); 
                return prev + increment;
            });
        }, 200);
    } else {
        setUploadProgress(0);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 4.5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande", description: "O limite é de 4.5MB." });
        e.target.value = "";
        return;
    }

    setIsScanning(true);
    setScanStatus("Lendo documento...");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Feedback visual de troca de estado
        setTimeout(() => setScanStatus("Extraindo dados..."), 1500);
        setTimeout(() => setScanStatus("Categorizando..."), 3000);

        const token = await user.getIdToken();
        const res = await fetch('/api/extract-invoice', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro na leitura.");

        // Auto-fill com animação suave (o React cuida disso)
        if (data.name) form.setValue("description", data.name, { shouldValidate: true });
        if (data.totalAmount) form.setValue("amount", Number(data.totalAmount), { shouldValidate: true });
        
        if (data.category) {
            const hasCat = DEFAULT_CATEGORIES[transactionType].filter(c => c !== 'Outros').includes(data.category);
            if (hasCat) {
                form.setValue("category", data.category);
                form.setValue("customCategory", ""); 
            } else {
                // Mapeamento simples
                const map: Record<string, string> = { 'Internet': 'Contas', 'Energia': 'Contas', 'Água': 'Contas', 'Luz': 'Contas' };
                const mappedCat = map[data.category] || 'custom';
                form.setValue("category", mappedCat);
                if (mappedCat === 'custom') form.setValue("customCategory", data.category);
            }
        }
        
        if (data.dueDate) {
            const [y, m, d] = data.dueDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            dateObj.setHours(12, 0, 0, 0); // Evita problemas de fuso
            if (!isNaN(dateObj.getTime())) form.setValue("date", dateObj);
        }

        setUploadProgress(100);
        toast({ 
            title: "Leitura Concluída!", 
            description: "Verifique os dados antes de salvar.",
            className: "bg-green-500 text-white border-none"
        });

    } catch (error: any) {
        console.error(error);
        toast({ variant: "destructive", title: "Falha na leitura", description: "Tente uma foto mais nítida." });
    } finally {
        // Delay para o usuário ver o 100%
        setTimeout(() => {
            setIsScanning(false);
            setScanStatus("IA Pronta");
        }, 800);
        
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        
        {/* SCANNER PREMIUM STYLE */}
        <div className={cn(
            "relative overflow-hidden rounded-xl border transition-all duration-300",
            isScanning ? "border-primary/50 bg-primary/5 shadow-inner" : "border-border bg-muted/20"
        )}>
             {isScanning && (
                 <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
             )}
             {isScanning && <Progress value={uploadProgress} className="absolute top-0 left-0 right-0 h-1 z-10 rounded-none bg-transparent" />}
             
             <div className="relative z-10 flex flex-col p-4 gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg transition-colors",
                            isScanning ? "bg-primary text-primary-foreground" : "bg-background border shadow-sm text-muted-foreground"
                        )}>
                            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-none mb-1">
                                {isScanning ? scanStatus : "Preenchimento Inteligente"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                {isScanning ? "Nossa IA está lendo seu comprovante..." : "Carregue uma foto ou PDF para preencher"}
                            </span>
                        </div>
                    </div>
                </div>
                
                {!isScanning && (
                    <div className="grid grid-cols-2 gap-3 mt-1">
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                        
                        <Button type="button" variant="outline" className="h-9 text-xs gap-2 border-dashed md:hidden" onClick={() => cameraInputRef.current?.click()}>
                            <Camera className="w-3.5 h-3.5" /> Tirar Foto
                        </Button>
                        <Button type="button" variant="outline" className="h-9 text-xs gap-2 border-dashed col-span-2 md:col-span-1" onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud className="w-3.5 h-3.5" /> Carregar Arquivo
                        </Button>
                    </div>
                )}
             </div>
        </div>

        {/* TIPO - Segmented Control Style */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 p-1 bg-muted rounded-xl">
                  <FormItem className="space-y-0">
                    <FormControl><RadioGroupItem value="income" className="sr-only" /></FormControl>
                    <FormLabel className={cn(
                        "flex items-center justify-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 select-none",
                        field.value === 'income' 
                            ? "bg-background text-green-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}>
                        Receita
                    </FormLabel>
                  </FormItem>
                  <FormItem className="space-y-0">
                    <FormControl><RadioGroupItem value="expense" className="sr-only" /></FormControl>
                    <FormLabel className={cn(
                        "flex items-center justify-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 select-none",
                        field.value === 'expense' 
                            ? "bg-background text-red-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}>
                        Despesa
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        
        {/* CAMPOS PRINCIPAIS */}
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem className="space-y-1">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0,00" 
                                    {...field} 
                                    className="pl-10 h-14 text-2xl font-bold bg-transparent border-muted focus:border-primary transition-colors" 
                                />
                            </FormControl>
                        </div>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="Ex: Compras no mercado" className="pl-9" />
                        </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                            <SelectTrigger className={cn(!field.value && "text-muted-foreground")}>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="max-h-[200px]">
                            {DEFAULT_CATEGORIES[transactionType].filter(c => c !== 'Outros').map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                            <div className="h-px bg-border my-1" />
                            <SelectItem value="custom" className="font-medium text-primary">
                                <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Criar nova...</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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

            {selectedCategory === 'custom' && (
                <FormField
                    control={form.control}
                    name="customCategory"
                    render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-top-2 fade-in duration-300">
                            <FormControl>
                                <Input {...field} placeholder="Digite o nome da nova categoria" className="bg-accent/20 border-accent/50 focus:border-accent" autoFocus />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}
        </div>
        
        <div className="flex gap-3 pt-4 mt-auto">
            <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-11">Cancelar</Button>
            <Button type="submit" className="flex-1 h-11 font-bold shadow-md text-base">{initialData ? "Salvar Alterações" : "Adicionar"}</Button>
        </div>
      </form>
    </Form>
  );
}
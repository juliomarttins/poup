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
import { Calendar as CalendarIcon, Camera, UploadCloud, Sparkles, ScanLine, CheckCircle2 } from "lucide-react";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Iniciando...");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData?.type || 'expense',
      description: initialData?.description || "",
      amount: initialData ? Math.abs(initialData.amount) : 0,
      category: initialData ? (DEFAULT_CATEGORIES.income.includes(initialData.category) || DEFAULT_CATEGORIES.expense.includes(initialData.category) ? initialData.category : 'Outros') : "",
      customCategory: initialData && !(DEFAULT_CATEGORIES.income.includes(initialData.category) || DEFAULT_CATEGORIES.expense.includes(initialData.category)) ? initialData.category : "",
      date: initialData ? new Date(initialData.date) : new Date(),
    },
  });

  const transactionType = form.watch('type');
  const selectedCategory = form.watch('category');
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  // Simulação de progresso
  useEffect(() => {
    if (isScanning) {
        setUploadProgress(10);
        const timer = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) return 90;
                return prev + Math.random() * 15;
            });
        }, 400);
        return () => clearInterval(timer);
    } else {
        setUploadProgress(0);
    }
  }, [isScanning]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 4.5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande", description: "O limite é 4.5MB." });
        e.target.value = "";
        return;
    }

    setIsScanning(true);
    setScanStatus("Enviando arquivo...");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        setTimeout(() => setScanStatus("IA analisando documento..."), 1500);
        
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
            } else {
                 const fallbackCat = DEFAULT_CATEGORIES[transactionType].includes("Contas") ? "Contas" : "Outros";
                 
                 if (fallbackCat === "Outros") {
                    form.setValue("category", "Outros", { shouldValidate: true });
                    form.setValue("customCategory", data.category, { shouldValidate: true });
                 } else {
                    form.setValue("category", fallbackCat, { shouldValidate: true });
                 }
            }
            fieldsFilled++;
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

        setUploadProgress(100);
        setTimeout(() => {
             if (fieldsFilled > 0) {
                toast({ 
                    title: "Sucesso!", 
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> 
                            <span>Dados preenchidos automaticamente.</span>
                        </div>
                    )
                });
            } else {
                toast({ variant: "warning", title: "Atenção", description: "A IA leu o arquivo mas não encontrou dados claros." });
            }
            setIsScanning(false);
        }, 500);

    } catch (error: any) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro na leitura", description: error.message });
        setIsScanning(false);
    } finally {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        
        {/* ÁREA DE SCAN PREMIUM */}
        <div className="relative group overflow-hidden rounded-xl border border-border bg-gradient-to-b from-background/80 to-muted/20 p-0 shadow-sm transition-all hover:shadow-md">
             {isScanning ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 space-y-3">
                    <div className="w-full max-w-[200px] space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-primary uppercase tracking-wider">
                            <span>{scanStatus}</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1.5 w-full bg-muted/50" />
                    </div>
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </div>
             ) : (
                <div className="flex flex-col p-4 gap-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <span>Preenchimento Inteligente</span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">IA PRO</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                        <div className="md:hidden grid grid-cols-2 gap-3">
                            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                            <Button 
                                type="button" variant="outline" 
                                className="h-12 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 active:scale-95 transition-all flex flex-col gap-1"
                                onClick={() => cameraInputRef.current?.click()}
                            >
                                <Camera className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-medium text-muted-foreground">Fotografar</span>
                            </Button>

                            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                            <Button 
                                type="button" variant="outline" 
                                className="h-12 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 active:scale-95 transition-all flex flex-col gap-1"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-medium text-muted-foreground">Arquivo</span>
                            </Button>
                        </div>

                        <div className="hidden md:block">
                            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                            <Button 
                                type="button" variant="ghost" 
                                className="w-full h-16 border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Clique para carregar PDF ou Imagem</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
             )}
        </div>

        {/* CAMPOS DO FORMULÁRIO */}
        <div className="space-y-4">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem className="space-y-2">
                <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground font-bold ml-1">Tipo de Movimentação</FormLabel>
                <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-3">
                    <FormItem>
                        <FormControl><RadioGroupItem value="income" className="sr-only" /></FormControl>
                        <FormLabel className={cn("flex items-center justify-center rounded-lg border border-border bg-card p-3 text-sm font-medium hover:bg-accent cursor-pointer transition-all active:scale-95", field.value === 'income' && "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20")}>
                        Renda
                        </FormLabel>
                    </FormItem>
                    <FormItem>
                        <FormControl><RadioGroupItem value="expense" className="sr-only" /></FormControl>
                        <FormLabel className={cn("flex items-center justify-center rounded-lg border border-border bg-card p-3 text-sm font-medium hover:bg-accent cursor-pointer transition-all active:scale-95", field.value === 'expense' && "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20")}>
                        Despesa
                        </FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="ml-1">Descrição</FormLabel>
                        <FormControl><Input {...field} placeholder="Ex: Mercado, Salário..." className="h-11 bg-muted/30" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {/* CORREÇÃO 2: Grid para Valor e Data Alinhados */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="ml-1">Valor</FormLabel>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
                            <FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} className="h-11 pl-9 bg-muted/30 font-mono font-medium" /></FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel className="ml-1">Data</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal h-11 bg-muted/30 border-input w-full", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
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
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="ml-1">Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-11 bg-muted/30">
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                            </FormControl>
                            {/* CORREÇÃO 3: Menu Estilizado e Opção Única */}
                            <SelectContent className="max-h-[200px] rounded-xl border-border/50 bg-popover/95 backdrop-blur-lg shadow-xl">
                                {DEFAULT_CATEGORIES[transactionType].map(cat => <SelectItem key={cat} value={cat} className="cursor-pointer focus:bg-accent/50 rounded-md my-0.5">{cat}</SelectItem>)}
                                {/* Opção de Criar Nova */}
                                <SelectItem value="Outros" className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10 rounded-md mt-1 border-t border-border/40">
                                    Adicionar uma nova...
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedCategory === 'Outros' && (
                    <FormField
                        control={form.control}
                        name="customCategory"
                        render={({ field }) => (
                            <FormItem className="animate-in slide-in-from-top-2 fade-in duration-300">
                            <FormLabel className="ml-1 text-primary">Qual o nome da categoria?</FormLabel>
                            <FormControl><Input {...field} placeholder="Digite aqui..." className="h-11 border-primary/30 bg-primary/5" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto h-11">Cancelar</Button>
            <Button type="submit" className="w-full sm:w-auto h-11 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">{initialData ? "Salvar Alterações" : "Adicionar Transação"}</Button>
        </div>
      </form>
    </Form>
  );
}

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
import { Calendar as CalendarIcon } from "lucide-react";
import { ptBR } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUser } from "@/firebase";

const formSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: "O tipo é obrigatório."}),
  description: z.string().min(2, { message: "A descrição deve ter pelo menos 2 caracteres." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser maior que zero." }),
  date: z.date({ required_error: "A data é obrigatória." }),
  category: z.string().min(2, { message: "A categoria é obrigatória." }),
  customCategory: z.string().optional(),
}).refine(data => {
    if (data.category === 'other' && (!data.customCategory || data.customCategory.length < 2)) {
        return false;
    }
    return true;
}, {
    message: "A nova categoria deve ter pelo menos 2 caracteres.",
    path: ['customCategory'],
});

type FormValues = z.infer<typeof formSchema>;

const defaultCategories = {
    income: ['Salário', 'Bônus', 'Freelance', 'Investimentos'],
    expense: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação']
};

interface EditTransactionFormProps {
  transaction: Transaction;
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
}

export function EditTransactionForm({ transaction, onSave, onCancel }: EditTransactionFormProps) {
  const { user } = useUser();
  const isDefaultCategory = 
    defaultCategories.income.includes(transaction.category) || 
    defaultCategories.expense.includes(transaction.category);
    
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...transaction,
      date: new Date(transaction.date),
      amount: Math.abs(transaction.amount), // Ensure amount is positive for the form
      category: isDefaultCategory ? transaction.category : 'other',
      customCategory: isDefaultCategory ? '' : transaction.category,
    },
  });

  const transactionType = form.watch('type');
  const selectedCategory = form.watch('category');

  function onSubmit(data: FormValues) {
    if (!user) return;
    const amount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
    const finalCategory = data.category === 'other' ? data.customCategory! : data.category;
    
    onSave({ 
        ...transaction, 
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
        amount,
        category: finalCategory,
        userId: user.uid,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Qual o tipo de transação?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="income" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        field.value === 'income' && "border-accent"
                      )}
                    >
                      Renda
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="expense" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-destructive hover:text-destructive-foreground cursor-pointer",
                        field.value === 'expense' && "border-destructive"
                      )}
                    >
                      Despesa
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {transactionType && (
            <>
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{transactionType === 'income' ? 'Nome da Renda' : 'Nome da Despesa'}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={transactionType === 'income' ? 'Ex: Salário do Mês' : 'Ex: Compras no mercado'}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field}
                              onFocus={(e) => e.target.select()}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data da Transação</FormLabel>
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

                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {defaultCategories[transactionType].map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                                <SelectItem value="other">Outra...</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedCategory === 'other' && (
                    <FormField
                        control={form.control}
                        name="customCategory"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nova Categoria</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Digite o nome da nova categoria"/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                    Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">Salvar Alterações</Button>
                </div>
          </>
        )}
      </form>
    </Form>
  );
}

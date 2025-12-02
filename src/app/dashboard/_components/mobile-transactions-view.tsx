'use client';

import { useState, useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, FileDown, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { generateTransactionsPDF } from '@/lib/generate-pdf';
import { useUser, useFirestore } from '@/firebase';
import { saveReportHistory } from '@/firebase/firestore/actions';
import { Badge } from '@/components/ui/badge';

interface MobileTransactionsViewProps {
    transactions: Transaction[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (transactionId: string) => void;
    onAdd: () => void;
}

export function MobileTransactionsView({ transactions, onEdit, onDelete, onAdd }: MobileTransactionsViewProps) {
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const categories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const descriptionMatch = t.description.toLowerCase().includes(descriptionFilter.toLowerCase());
      const typeMatch = typeFilter === 'all' || t.type === typeFilter;
      const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || (t.status || 'paid') === statusFilter;

      const date = new Date(t.date);
      const dateMatch = (() => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
        const { from, to } = dateRange;
         const toEndOfDay = to ? new Date(to) : null;
        if (toEndOfDay) toEndOfDay.setHours(23, 59, 59, 999);

        if (from && !toEndOfDay) return date >= from;
        if (!from && toEndOfDay) return date <= toEndOfDay;
        if (from && toEndOfDay) return date >= from && date <= toEndOfDay;
        return true;
      })();
      
      return descriptionMatch && typeMatch && categoryMatch && dateMatch && statusMatch;
    });
  }, [transactions, descriptionFilter, typeFilter, categoryFilter, statusFilter, dateRange]);

  const resetMobileFilters = () => {
    setDescriptionFilter("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setDateRange(undefined);
    setIsFiltersOpen(false);
  }
  
  const handleExport = async () => {
      generateTransactionsPDF(filteredTransactions, "Relatório Mobile");
      if (user && firestore) {
        await saveReportHistory(firestore, user.uid, 'transacoes', 'Exportação Mobile');
      }
  }

  const activeFiltersCount = [
      typeFilter !== 'all', 
      categoryFilter !== 'all', 
      statusFilter !== 'all', 
      dateRange !== undefined
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* BARRA SUPERIOR MOBILE */}
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Buscar..."
          value={descriptionFilter}
          onChange={(event) => setDescriptionFilter(event.target.value)}
          className="h-10 flex-1 bg-background"
        />
        
        {/* BOTÃO DE FILTROS COM BADGE */}
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 relative">
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                            {activeFiltersCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl h-[85vh]">
                <SheetHeader className="text-left mb-4">
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>Refine sua busca de transações.</SheetDescription>
                </SheetHeader>
                
                <div className="flex flex-col gap-6 overflow-y-auto pb-20">
                    {/* DATA */}
                    <div className="space-y-2">
                        <Label>Período</Label>
                        <DateRangePicker
                            onUpdate={({ range }) => setDateRange(range)}
                            initialDateFrom={dateRange?.from}
                            initialDateTo={dateRange?.to}
                            align="start"
                            locale="pt-BR"
                            showCompare={false}
                        />
                    </div>

                    {/* TIPO */}
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <RadioGroup defaultValue="all" value={typeFilter} onValueChange={setTypeFilter} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="t-all" />
                                <Label htmlFor="t-all">Todos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="income" id="t-inc" />
                                <Label htmlFor="t-inc">Receita</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="expense" id="t-exp" />
                                <Label htmlFor="t-exp">Despesa</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* STATUS */}
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <RadioGroup defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="s-all" />
                                <Label htmlFor="s-all">Todos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="paid" id="s-pd" />
                                <Label htmlFor="s-pd">Pago</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pending" id="s-pen" />
                                <Label htmlFor="s-pen">Pendente</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* CATEGORIA */}
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* AÇÕES FILTRO */}
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={resetMobileFilters}>Limpar</Button>
                        <Button className="flex-1" onClick={() => setIsFiltersOpen(false)}>Ver Resultados</Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>

        <Button size="sm" className="h-10 gap-1" onClick={onAdd}>
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Adicionar</span>
        </Button>
      </div>

      {/* LISTA */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
            <span>{filteredTransactions.length} resultados</span>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleExport}>
                <FileDown className="h-3 w-3 mr-1" /> PDF
            </Button>
        </div>

        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(transaction => (
            <TransactionCard 
              key={transaction.id}
              transaction={transaction}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
           <div className="text-center text-muted-foreground pt-10">
              Nenhum resultado para os filtros aplicados.
            </div>
        )}
      </div>
    </div>
  );
}
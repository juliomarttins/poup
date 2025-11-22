'use client';

import { useState, useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, FileDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { generateTransactionsPDF } from '@/lib/generate-pdf';
import { useUser, useFirestore } from '@/firebase'; // [NOVO]
import { saveReportHistory } from '@/firebase/firestore/actions'; // [NOVO]

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const categories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const descriptionMatch = t.description.toLowerCase().includes(descriptionFilter.toLowerCase());
      const typeMatch = typeFilter === 'all' || t.type === typeFilter;
      const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;

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
      
      return descriptionMatch && typeMatch && categoryMatch && dateMatch;
    });
  }, [transactions, descriptionFilter, typeFilter, categoryFilter, dateRange]);

  const resetMobileFilters = () => {
    setDescriptionFilter("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDateRange(undefined);
  }
  
  // [EDIT] Função de exportar com Histórico
  const handleExport = async () => {
      generateTransactionsPDF(filteredTransactions, "Relatório de Transações (Mobile)");
      if (user && firestore) {
        await saveReportHistory(firestore, user.uid, 'transacoes', 'Exportação de Transações (Mobile)');
      }
  }

  const isMobileFiltered = descriptionFilter || typeFilter !== 'all' || categoryFilter !== 'all' || dateRange;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Filtrar por descrição..."
          value={descriptionFilter}
          onChange={(event) => setDescriptionFilter(event.target.value)}
          className="h-9 flex-1"
        />
        <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-9 px-2" onClick={handleExport}>
                <FileDown className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-9 gap-1" onClick={onAdd}>
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar
            </span>
            </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="income">Renda</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
          </SelectContent>
        </Select>
         <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
       <div className="flex items-center gap-2">
        <DateRangePicker
            onUpdate={({ range }) => setDateRange(range)}
            initialDateFrom={dateRange?.from}
            initialDateTo={dateRange?.to}
            align="start"
            locale="pt-BR"
            showCompare={false}
          />
        {isMobileFiltered && (
          <Button
            variant="ghost"
            onClick={resetMobileFilters}
            className="h-9 px-2 lg:px-3"
          >
            Limpar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
       </div>


      <div className="space-y-3 pt-4">
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
'use client';

import { useState, useMemo } from 'react';
import type { Transaction, Profile } from '@/lib/types';
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { saveReportHistory } from '@/firebase/firestore/actions';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

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
  const [profileFilter, setProfileFilter] = useState("all"); // [NOVO] Filtro de Perfil
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();

  // Buscar perfis para o filtro mobile
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const profiles = userProfile?.profiles || [];

  const categories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))).sort(), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const descriptionMatch = t.description.toLowerCase().includes(descriptionFilter.toLowerCase());
      const typeMatch = typeFilter === 'all' || t.type === typeFilter;
      const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || (t.status || 'paid') === statusFilter;
      const profileMatch = profileFilter === 'all' || t.profileId === profileFilter; // [NOVO]

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
      
      return descriptionMatch && typeMatch && categoryMatch && dateMatch && statusMatch && profileMatch;
    });
  }, [transactions, descriptionFilter, typeFilter, categoryFilter, statusFilter, profileFilter, dateRange]);

  const resetMobileFilters = () => {
    setDescriptionFilter("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setProfileFilter("all");
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
      profileFilter !== 'all',
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
                    <SheetTitle>Filtros Avançados</SheetTitle>
                    <SheetDescription>Refine a visualização das suas finanças.</SheetDescription>
                </SheetHeader>
                
                <div className="flex flex-col gap-6 overflow-y-auto pb-20 px-1">
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

                    {/* STATUS */}
                    <div className="space-y-2">
                        <Label>Situação</Label>
                        <RadioGroup defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="flex gap-2">
                            <div className="flex items-center space-x-2 border rounded-md p-2 flex-1 justify-center">
                                <RadioGroupItem value="all" id="s-all" />
                                <Label htmlFor="s-all">Todos</Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-md p-2 flex-1 justify-center">
                                <RadioGroupItem value="paid" id="s-pd" />
                                <Label htmlFor="s-pd">Pago</Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-md p-2 flex-1 justify-center">
                                <RadioGroupItem value="pending" id="s-pen" />
                                <Label htmlFor="s-pen">Pendente</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* PERFIL (QUEM GASTOU) - NOVO */}
                    <div className="space-y-2">
                        <Label>Quem gastou?</Label>
                        <Select value={profileFilter} onValueChange={setProfileFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Todos os perfis" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os perfis</SelectItem>
                                {profiles.map(profile => (
                                    <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* CATEGORIA */}
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Todas as categorias" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as categorias</SelectItem>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* TIPO */}
                    <div className="space-y-2">
                        <Label>Tipo de Movimentação</Label>
                        <RadioGroup defaultValue="all" value={typeFilter} onValueChange={setTypeFilter} className="flex gap-2">
                            <div className="flex items-center space-x-2 border rounded-md p-2 flex-1 justify-center">
                                <RadioGroupItem value="all" id="t-all" />
                                <Label htmlFor="t-all">Tudo</Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-md p-2 flex-1 justify-center">
                                <RadioGroupItem value="income" id="t-inc" />
                                <Label htmlFor="t-inc">Renda</Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-md p-2 flex-1 justify-center">
                                <RadioGroupItem value="expense" id="t-exp" />
                                <Label htmlFor="t-exp">Despesa</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* AÇÕES FILTRO */}
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={resetMobileFilters}>Limpar</Button>
                        <Button className="flex-1" onClick={() => setIsFiltersOpen(false)}>Ver {filteredTransactions.length} Resultados</Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>

        <Button size="sm" className="h-10 gap-1" onClick={onAdd}>
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Add</span>
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
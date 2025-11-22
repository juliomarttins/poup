// ARQUIVO 2/2: src/app/dashboard/reports/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, History, ArrowRightLeft, CreditCard, Filter } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { generateGeneralReportPDF, generateDebtsPDF, generateTransactionsPDF } from '@/lib/generate-pdf';
import { saveReportHistory } from '@/firebase/firestore/actions';
import type { Report, Transaction, ManagedDebt } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DateRange } from 'react-day-picker';
import { Separator } from '@/components/ui/separator';

export default function ReportsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Filtros Locais
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // 1. Buscar Histórico
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'users', user.uid, 'reports'), 
        orderBy('generatedAt', 'desc'), 
        limit(15) // [EDIT] Aumentado para 15
    );
  }, [firestore, user?.uid]);
  
  const { data: history, isLoading: historyLoading } = useCollection<Report>(historyQuery);

  // 2. Buscar Dados (Todas as transações e dívidas para filtrar no cliente)
  const transactionsQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      // Buscamos todas as transações para que o filtro local funcione em todos os dados.
      return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc')); 
  }, [firestore, user?.uid]);
  const { data: allTransactions } = useCollection<Transaction>(transactionsQuery);

  const debtsQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'debts'));
  }, [firestore, user?.uid]);
  const { data: debts } = useCollection<ManagedDebt>(debtsQuery);

  // 3. Aplicar Filtros
  const filteredTransactions = useMemo(() => {
      if (!allTransactions) return [];
      return allTransactions.filter(t => {
          // Filtro de Data
          if (dateRange?.from) {
              const tDate = new Date(t.date);
              if (tDate < dateRange.from) return false;
              if (dateRange.to) {
                  const endDate = new Date(dateRange.to);
                  endDate.setHours(23, 59, 59);
                  if (tDate > endDate) return false;
              }
          }
          // Filtro de Tipo
          if (typeFilter !== 'all' && t.type !== typeFilter) return false;
          // Filtro de Categoria
          if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

          return true;
      });
  }, [allTransactions, dateRange, typeFilter, categoryFilter]);

  // Categorias únicas para o Select
  const categories = useMemo(() => {
      if (!allTransactions) return [];
      return Array.from(new Set(allTransactions.map(t => t.category)));
  }, [allTransactions]);

  // Descrição do Filtro para o PDF e Histórico
  const getFilterDescription = () => {
      const parts = [];
      if (dateRange?.from) parts.push(`Período: ${dateRange.from.toLocaleDateString('pt-BR')} - ${dateRange.to?.toLocaleDateString('pt-BR') || '...'}`);
      if (typeFilter !== 'all') parts.push(`Tipo: ${typeFilter === 'income' ? 'Renda' : 'Despesa'}`);
      if (categoryFilter !== 'all') parts.push(`Cat: ${categoryFilter}`);
      return parts.join(' | ') || "Sem filtros";
  }

  // 4. Gerar Relatório
  const handleGenerateReport = async (type: Report['type']) => {
      if (!user || !firestore || !allTransactions || !debts) return;

      let title = "";
      const filterDesc = getFilterDescription();
      
      if (type === 'geral') {
          title = "Relatório Geral Completo";
          generateGeneralReportPDF(filteredTransactions, debts, filterDesc);
      } else if (type === 'transacoes') {
          title = "Relatório de Transações";
          generateTransactionsPDF(filteredTransactions, filterDesc);
      } else if (type === 'dividas') {
          title = "Relatório de Dívidas";
          generateDebtsPDF(debts);
      }

      // Salvar no histórico
      await saveReportHistory(firestore, user.uid, type, title, filterDesc);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Central de Relatórios</h1>
        <p className="text-muted-foreground">
          Filtre seus dados e gere relatórios detalhados em PDF.
        </p>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/> Filtros de Relatório</CardTitle>
              <CardDescription>Selecione o que você quer incluir nos relatórios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                      <DateRangePicker 
                        initialDateFrom={dateRange?.from}
                        initialDateTo={dateRange?.to}
                        onUpdate={({range}) => setDateRange(range)}
                        align="start"
                        locale="pt-BR"
                      />
                  </div>
                  <div className="w-full md:w-[200px]">
                       <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger>
                              <SelectValue placeholder="Tipo de Movimentação" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todas as Movimentações</SelectItem>
                              <SelectItem value="income">Apenas Rendas</SelectItem>
                              <SelectItem value="expense">Apenas Despesas</SelectItem>
                          </SelectContent>
                       </Select>
                  </div>
                   <div className="w-full md:w-[200px]">
                       <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger>
                              <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todas as Categorias</SelectItem>
                              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                       </Select>
                  </div>
              </div>
          </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => handleGenerateReport('geral')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Geral
            </CardTitle>
            <CardDescription>Painel completo + Dívidas + Transações filtradas.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground font-mono">{filteredTransactions.length} registros selecionados</p>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleGenerateReport('transacoes')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" /> Apenas Transações
            </CardTitle>
            <CardDescription>Lista detalhada das movimentações filtradas.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleGenerateReport('dividas')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Apenas Dívidas
            </CardTitle>
            <CardDescription>Relatório de progresso das dívidas ativas.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Histórico de Geração</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            {historyLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : history && history.length > 0 ? (
                <div className="space-y-1">
                    {history.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{item.title}</span>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>{item.generatedAt?.toDate ? item.generatedAt.toDate().toLocaleString('pt-BR') : 'Data desconhecida'}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-[200px]">{item.filterDescription || 'Sem filtros'}</span>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-primary gap-2 h-8"
                                onClick={() => handleGenerateReport(item.type)} 
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Regerar
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum relatório gerado recentemente.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
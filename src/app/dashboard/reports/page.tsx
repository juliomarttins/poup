'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, History, ArrowRightLeft, CreditCard } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { generateGeneralReportPDF, generateDebtsPDF, generateTransactionsPDF } from '@/lib/generate-pdf';
import { saveReportHistory } from '@/firebase/firestore/actions';
import type { Report, Transaction, ManagedDebt } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  // Buscando histórico
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'users', user.uid, 'reports'), 
        orderBy('generatedAt', 'desc'), 
        limit(10)
    );
  }, [firestore, user?.uid]);
  
  const { data: history, isLoading: historyLoading } = useCollection<Report>(historyQuery);

  // Buscando dados para geração
  const transactionsQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(100));
  }, [firestore, user?.uid]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const debtsQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      return query(collection(firestore, 'users', user.uid, 'debts'));
  }, [firestore, user?.uid]);
  const { data: debts } = useCollection<ManagedDebt>(debtsQuery);

  const handleGenerateReport = async (type: Report['type']) => {
      if (!user || !firestore || !transactions || !debts) return;

      let title = "";
      
      if (type === 'geral') {
          title = "Relatório Geral";
          generateGeneralReportPDF(transactions, debts, "Geral");
      } else if (type === 'transacoes') {
          title = "Relatório de Transações";
          generateTransactionsPDF(transactions, "Últimas 100");
      } else if (type === 'dividas') {
          title = "Relatório de Dívidas";
          generateDebtsPDF(debts);
      }

      // Salvar no histórico
      await saveReportHistory(firestore, user.uid, type, title);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Gere PDFs detalhados e visualize o histórico de emissões.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Geral
            </CardTitle>
            <CardDescription>Resumo completo de fluxo e dívidas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => handleGenerateReport('geral')} className="w-full" disabled={!transactions}>
                Gerar PDF Geral
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" /> Transações
            </CardTitle>
            <CardDescription>Extrato detalhado das movimentações.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => handleGenerateReport('transacoes')} className="w-full" disabled={!transactions}>
                Gerar Extrato
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Dívidas
            </CardTitle>
            <CardDescription>Status de pagamentos e saldos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => handleGenerateReport('dividas')} className="w-full" disabled={!debts}>
                Gerar Relatório de Dívidas
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Histórico Recente</CardTitle>
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
                                <span className="text-xs text-muted-foreground">
                                    {item.generatedAt?.toDate ? item.generatedAt.toDate().toLocaleString('pt-BR') : 'Data desconhecida'}
                                </span>
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
'use client';

import { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { StatCard } from '@/components/dashboard/stat-card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { DebtProgressChart } from '@/components/dashboard/debt-progress-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { getDashboardStats } from './_actions/data';
import { DashboardClientPage } from './_components/dashboard-client-page';
import { WelcomeEmptyState } from '@/components/dashboard/welcome-empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProfile } from '@/contexts/profile-context';
import type { Transaction, ManagedDebt } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // [CORREÇÃO] Import que faltava
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, DollarSign, CreditCard, Command, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setTransaction } from '@/firebase/firestore/actions';
import { doc } from 'firebase/firestore';
import { parseTransactionInput } from '@/lib/smart-parser';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function QuickAddInput() {
    const [value, setValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();
    const { activeProfile } = useProfile();
    const { toast } = useToast();

    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim() || !user || !firestore) return;

        setIsProcessing(true);
        
        try {
            const parsedData = parseTransactionInput(value);

            const newTx: Transaction = {
                id: doc(collection(firestore, '_')).id,
                amount: parsedData.amount,
                description: parsedData.description,
                category: parsedData.category,
                date: new Date().toISOString().split('T')[0],
                type: parsedData.type,
                userId: user.uid,
                profileId: activeProfile?.id
            };

            await setTransaction(firestore, user.uid, newTx);
            
            toast({
                title: "Salvo com Sucesso!",
                description: (
                    <div className="flex flex-col gap-1">
                        <span className="font-bold">{newTx.description}</span>
                        <span className="text-xs opacity-90">Categoria detectada: {newTx.category}</span>
                    </div>
                ),
                className: "bg-primary text-primary-foreground border-none"
            });
            setValue("");

        } catch (error: any) {
            toast({ variant: "destructive", title: "Não entendi", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" /> Adicionar Movimentação
                </span>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Digite o valor e o nome. Ex: "50 pastel". A IA categoriza sozinha.</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/20 shadow-sm hover:shadow-md transition-all ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <CardContent className="p-3">
                    <form onSubmit={handleQuickAdd} className="flex gap-2 relative items-center">
                        <div className="absolute left-3 text-muted-foreground pointer-events-none hidden sm:block">
                            <Command className="w-4 h-4" />
                        </div>
                        <Input 
                            placeholder="Ex: 56 pastel... (Enter para salvar)" 
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="bg-transparent border-none shadow-none h-10 focus-visible:ring-0 sm:pl-8 text-base placeholder:text-muted-foreground/60"
                            disabled={isProcessing}
                            autoComplete="off"
                        />
                        <Button size="icon" type="submit" disabled={isProcessing || !value} className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95">
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
            {/* Texto explicativo melhorado */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <Badge variant="outline" className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/20 border-dashed">Ex: 1200 amortecedor</Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/20 border-dashed">Ex: 3500 salário</Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/20 border-dashed">Ex: 45 ifood</Badge>
            </div>
        </div>
    )
}

function AiInsightCard() {
    return (
        <div className="mb-6 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 text-sm text-blue-600 dark:text-blue-400 animate-fade-up">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
                <span className="font-bold block mb-0.5">Insight da Semana</span>
                <p className="opacity-90">Notei que você gastou com <strong>Lazer</strong> ontem. Que tal revisar sua meta mensal?</p>
            </div>
        </div>
    )
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeProfile, isLoading: isProfileLoading } = useProfile();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
  }, [firestore, user?.uid]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const debtsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'debts'), orderBy('dueDate', 'asc'));
  }, [firestore, user?.uid]);
  const { data: debts, isLoading: isLoadingDebts } = useCollection<ManagedDebt>(debtsQuery);
  
  const isDataLoading = isLoadingTransactions || isLoadingDebts || isProfileLoading;
  const isDataEmpty = !isDataLoading && !transactions?.length && !debts?.length;

  if (isDataLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-[500px]" />
          <Skeleton className="lg:col-span-1 h-[500px]" />
        </div>
      </div>
    );
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
  }

  return (
    <DashboardClientPage initialData={{ transactions: transactions || [], debts: debts || [] }}>
      {(filteredData, descriptionText) => {
        const { totalIncome, totalExpenses, netBalance, totalDebt } = getDashboardStats(filteredData.transactions, filteredData.debts, undefined);
        
        return (
          <div className="animate-in fade-in duration-500">
            
            <QuickAddInput />
            
            {transactions && transactions.length > 3 && Math.random() > 0.7 && <AiInsightCard />}

            {isDataEmpty ? (
                 <WelcomeEmptyState />
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    <StatCard 
                        title="Renda" 
                        value={formatCurrency(totalIncome)}
                        icon={TrendingUp}
                        description={descriptionText}
                        valueClassName="text-positive"
                    />
                    <StatCard 
                        title="Despesas" 
                        value={formatCurrency(totalExpenses)}
                        icon={TrendingDown}
                        description={descriptionText}
                        valueClassName="text-negative"
                    />
                    <StatCard 
                        title="Saldo" 
                        value={formatCurrency(netBalance)}
                        icon={DollarSign}
                        description={descriptionText}
                        valueClassName={netBalance >= 0 ? 'text-positive' : 'text-negative'}
                    />
                    <StatCard 
                        title="Dívida Total" 
                        value={formatCurrency(totalDebt)}
                        icon={CreditCard}
                        description="Saldo restante"
                    />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <OverviewChart transactions={filteredData.transactions}/>
                        <DebtProgressChart debts={filteredData.debts} />
                    </div>
                    <div className="lg:col-span-1">
                        <RecentTransactions transactions={(transactions || []).slice(0, 5)} />
                    </div>
                    </div>
                </>
            )}
          </div>
        );
      }}
    </DashboardClientPage>
  );
}
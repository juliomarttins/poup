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
import { Sparkles, ArrowRight, Plus, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setTransaction } from '@/firebase/firestore/actions';
import { doc } from 'firebase/firestore';

// --- COMPONENTE DE QUICK ADD (O Coração do App) ---
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
        
        // Lógica "Burra" mas rápida para MVP: 
        // Se começa com número, é valor. Resto é descrição.
        // Ex: "50 Padaria" -> R$ 50,00 - Padaria (Despesa)
        
        try {
            const parts = value.split(' ');
            const firstPart = parts[0].replace(',', '.');
            const amount = parseFloat(firstPart);
            
            if (isNaN(amount)) {
                throw new Error("Comece com o valor (ex: '50 almoço')");
            }

            const description = parts.slice(1).join(' ') || "Gasto Rápido";
            const newTx: Transaction = {
                id: doc(collection(firestore, '_')).id,
                amount: -Math.abs(amount), // Assume despesa por padrão no quick add
                description: description.charAt(0).toUpperCase() + description.slice(1),
                category: 'Outros', // AI categorizaria aqui no futuro
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                userId: user.uid,
                profileId: activeProfile?.id
            };

            await setTransaction(firestore, user.uid, newTx);
            
            toast({
                title: "Salvo!",
                description: `R$ ${amount} em ${description}`,
                className: "bg-green-600 text-white border-none"
            });
            setValue("");

        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro", description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Sparkles className="w-5 h-5" />
                </div>
                <form onSubmit={handleQuickAdd} className="flex-1 flex gap-2 relative">
                    <Input 
                        placeholder="Ex: 25.90 Uber (Enter para salvar)" 
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="bg-background/50 border-0 shadow-inner h-10 focus-visible:ring-primary/30"
                        disabled={isProcessing}
                    />
                    <Button size="icon" type="submit" disabled={isProcessing || !value} className="h-10 w-10 shrink-0 rounded-xl">
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

// --- COMPONENTE DE INSIGHT ATIVO (IA Passiva) ---
function AiInsightCard() {
    // Mockup visual para "IA Ativa" - No futuro isso vem do backend
    return (
        <div className="mb-6 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 text-sm text-blue-600 dark:text-blue-400 animate-fade-up">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
                <span className="font-bold block mb-0.5">Insight da Semana</span>
                <p className="opacity-90">Seus gastos com <span className="font-semibold underline decoration-blue-500/30">Alimentação</span> estão 15% menores que a média. Continue assim!</p>
            </div>
        </div>
    )
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeProfile, isLoading: isProfileLoading } = useProfile();

  // Fetch Transactions
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
  }, [firestore, user?.uid]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  // Fetch Debts
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
        <Skeleton className="h-16 w-full rounded-xl" /> {/* Quick Add Skeleton */}
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
  
  if (isDataEmpty) {
    return <WelcomeEmptyState />;
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
            
            {/* [FEATURE 7] Quick Add Input (Fluxo Rápido) */}
            <QuickAddInput />
            
            {/* [FEATURE 6] AI Insight (IA Ativa) */}
            {transactions && transactions.length > 5 && <AiInsightCard />}

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
              {/* [CORREÇÃO 4] Gráficos mais limpos */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <OverviewChart transactions={filteredData.transactions}/>
                <DebtProgressChart debts={filteredData.debts} />
              </div>
              <div className="lg:col-span-1">
                <RecentTransactions transactions={(transactions || []).slice(0, 5)} />
              </div>
            </div>
          </div>
        );
      }}
    </DashboardClientPage>
  );
}
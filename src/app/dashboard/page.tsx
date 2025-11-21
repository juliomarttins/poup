'use client';

import { DollarSign, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
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


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeProfile, isLoading: isProfileLoading } = useProfile();


  // Fetch all Transactions for the user
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
  }, [firestore, user?.uid]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  // Fetch all Debts for the user
  const debtsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'debts'), orderBy('dueDate', 'asc'));
  }, [firestore, user?.uid]);
  const { data: debts, isLoading: isLoadingDebts } = useCollection<ManagedDebt>(debtsQuery);
  
  // [CORREÇÃO] Removido o useEffect que redirecionava para /select-profile
  // Isso evita o loop infinito quando o activeProfile pisca como null

  const isDataLoading = isLoadingTransactions || isLoadingDebts || isProfileLoading;
  const isDataEmpty = !isDataLoading && !transactions?.length && !debts?.length;

  if (isDataLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Skeleton className="h-48 w-full" />
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
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 flex flex-col gap-4">
                <OverviewChart transactions={filteredData.transactions}/>
                <DebtProgressChart debts={filteredData.debts} />
              </div>
              <div className="lg:col-span-1">
                <RecentTransactions transactions={(transactions || []).slice(0, 5)} />
              </div>
            </div>
          </>
        );
      }}
    </DashboardClientPage>
  );
}
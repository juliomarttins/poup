'use client'

import { useState } from 'react'; // [NOVO] Importar useState
import { collection, query, orderBy, limit } from 'firebase/firestore'; // [NOVO] Importar limit
import { TransactionsClientPage } from '../_components/transactions-client-page';
import { TransactionsEmptyState } from '@/components/transactions/transactions-empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Transaction } from '@/lib/types';


export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  // [NOVO] Estado para controlar quantos itens exibimos. Começa com 20.
  const [limitCount, setLimitCount] = useState(20);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'transactions'), 
      orderBy('date', 'desc'),
      limit(limitCount) // [NOVO] Aplica o limite na query
    );
  }, [firestore, user?.uid, limitCount]); // [NOVO] Recarrega se o limite mudar
  
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  // [NOVO] Função para carregar mais itens
  const handleLoadMore = () => {
    setLimitCount((prev) => prev + 20);
  };

  if (isLoadingTransactions && limitCount === 20) { // Carregamento inicial apenas
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center space-x-2">
                        <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
                        <Skeleton className="h-8 w-[120px] lg:w-[150px]" />
                        <Skeleton className="h-8 w-[120px] lg:w-[180px] hidden md:flex" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-8 w-[70px] hidden lg:flex" />
                        <Skeleton className="h-8 w-[100px]" />
                    </div>
                </div>
                 <Skeleton className="h-8 w-64" />
            </div>
            <div className="rounded-md border">
                <Skeleton className="h-96 w-full" />
            </div>
            <div className="flex items-center justify-between">
                 <Skeleton className="h-8 w-32" />
                 <Skeleton className="h-8 w-40" />
            </div>
        </div>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return <TransactionsEmptyState />;
  }

  return (
    <TransactionsClientPage 
      initialTransactions={transactions} 
      onLoadMore={handleLoadMore} // [NOVO] Passando a função
      hasMore={transactions.length === limitCount} // [NOVO] Se veio menos que o limite, acabou a lista
    />
  );
}
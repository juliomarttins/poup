'use client'

import { useState } from 'react';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { TransactionsClientPage } from '../_components/transactions-client-page';
import { TransactionsEmptyState } from '@/components/transactions/transactions-empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { Transaction, UserProfile } from '@/lib/types';


export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [limitCount, setLimitCount] = useState(20);

  // [CORREÇÃO CRÍTICA] Removido o segundo orderBy('createdAt') pois ele exige
  // criação manual de índice no Firebase Console e estava derrubando o site.
  // Voltamos para ordenação simples por Data (ASC) que é segura.
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'transactions'), 
      orderBy('date', 'asc'), 
      limit(limitCount)
    );
  }, [firestore, user?.uid, limitCount]);
  
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const handleLoadMore = () => {
    setLimitCount((prev) => prev + 20);
  };

  if (isLoadingTransactions && limitCount === 20) {
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
      profiles={userProfile?.profiles || []} 
      onLoadMore={handleLoadMore}
      hasMore={transactions.length === limitCount}
    />
  );
}

'use client'

import { collection, query, orderBy } from 'firebase/firestore';
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

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    // Order by date first, then by the creation timestamp to ensure correct order for same-day transactions.
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
  }, [firestore, user?.uid]);
  
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  if (isLoadingTransactions) {
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

  return <TransactionsClientPage initialTransactions={transactions} />;
}

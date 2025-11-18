
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { DebtsClientPage } from '../_components/debts-client-page';
import { DebtsEmptyState } from '@/components/debts/debts-empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ManagedDebt } from '@/lib/types';


export default function MyDebtsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const debtsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'debts'), orderBy('dueDate', 'asc'));
    }, [firestore, user?.uid]);
    
    const { data: debts, isLoading: isLoadingDebts } = useCollection<ManagedDebt>(debtsQuery);

    if (isLoadingDebts) {
        return (
             <div className="flex flex-1 flex-col gap-6">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="h-10 w-full sm:w-52" />
                </header>
                <Skeleton className="h-48 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 mt-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        )
    }

    if (!debts || debts.length === 0) {
        return <DebtsEmptyState />;
    }

    return <DebtsClientPage initialDebts={debts} />;
}

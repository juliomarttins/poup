'use client';

import { useState } from 'react';
import { DataTable } from '@/components/transactions/data-table';
import { columns } from '@/components/transactions/columns';
import type { Transaction } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
// [ALTERADO] Importar apenas o novo TransactionForm
import { TransactionForm } from '@/components/transactions/transaction-form';
import { setTransaction, deleteTransaction } from '@/firebase/firestore/actions';
import { useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { MobileTransactionsView } from './mobile-transactions-view';

interface TransactionsClientPageProps {
  initialTransactions: Transaction[];
}

export function TransactionsClientPage({ initialTransactions }: TransactionsClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = (transactionId: string) => {
    if (!user?.uid || !firestore) return;
    deleteTransaction(firestore, user.uid, transactionId);
    toast({
      title: "Transação excluída",
      description: "A transação foi removida com sucesso.",
    });
    router.refresh();
  };

  const handleSave = (transaction: Transaction) => {
    if (!user?.uid || !firestore) return;
    setTransaction(firestore, user.uid, transaction);
    setEditingTransaction(null);
    setIsAddDialogOpen(false);
    toast({
      title: transaction.id ? "Transação atualizada" : "Transação adicionada",
      description: "As informações da transação foram salvas.",
    });
    router.refresh();
  };

  return (
    <div className="w-full">
      {isMobile ? (
        <MobileTransactionsView 
          transactions={initialTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => setIsAddDialogOpen(true)}
        />
      ) : (
        <DataTable 
          columns={columns({ onEdit: handleEdit, onDelete: handleDelete })} 
          data={initialTransactions}
          onAdd={() => setIsAddDialogOpen(true)}
          isLoading={false} 
        />
      )}

      <Dialog open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da sua transação.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            // [USO] Componente unificado
            <TransactionForm 
              initialData={editingTransaction}
              onSave={handleSave}
              onCancel={() => setEditingTransaction(null)}
            />
          )}
        </DialogContent>
      </Dialog>

       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
         <DialogContent className="sm:max-w-md w-[90vw] rounded-md">
           <DialogHeader>
             <DialogTitle>Adicionar Transação</DialogTitle>
             <DialogDescription>
               Preencha os detalhes da sua nova transação.
             </DialogDescription>
           </DialogHeader>
           // [USO] Componente unificado (sem initialData)
           <TransactionForm onSave={handleSave} onCancel={() => setIsAddDialogOpen(false)} />
         </DialogContent>
       </Dialog>
    </div>
  );
}
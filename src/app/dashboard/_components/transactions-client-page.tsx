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
import { TransactionForm } from '@/components/transactions/transaction-form';
import { setTransaction, deleteTransaction } from '@/firebase/firestore/actions';
import { useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { MobileTransactionsView } from './mobile-transactions-view';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface TransactionsClientPageProps {
  initialTransactions: Transaction[];
  onLoadMore: () => void;
  hasMore: boolean;
}

export function TransactionsClientPage({ initialTransactions, onLoadMore, hasMore }: TransactionsClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
    <div className="w-full flex flex-col gap-4">
      
      {/* VISÃO MOBILE (Visível apenas em telas pequenas via CSS) */}
      <div className="block md:hidden">
        <MobileTransactionsView 
          transactions={initialTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => setIsAddDialogOpen(true)}
        />
      </div>

      {/* VISÃO DESKTOP (Visível apenas em telas médias ou maiores via CSS) */}
      <div className="hidden md:block">
        <DataTable 
          columns={columns({ onEdit: handleEdit, onDelete: handleDelete })} 
          data={initialTransactions}
          onAdd={() => setIsAddDialogOpen(true)}
          isLoading={false} 
        />
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4 pb-8">
          <Button variant="outline" onClick={onLoadMore} className="gap-2">
            Carregar Mais Antigas
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* MODAL DE EDIÇÃO - Ajustado para Mobile */}
      <Dialog open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[80vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da sua transação.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm 
              initialData={editingTransaction}
              onSave={handleSave}
              onCancel={() => setEditingTransaction(null)}
            />
          )}
        </DialogContent>
      </Dialog>

       {/* MODAL DE ADICIONAR - Ajustado para Mobile */}
       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
         <DialogContent className="w-[95vw] max-w-md max-h-[80vh] overflow-y-auto rounded-lg">
           <DialogHeader>
             <DialogTitle>Adicionar Transação</DialogTitle>
             <DialogDescription>
               Preencha os detalhes da sua nova transação.
             </DialogDescription>
           </DialogHeader>
           <TransactionForm onSave={handleSave} onCancel={() => setIsAddDialogOpen(false)} />
         </DialogContent>
       </Dialog>
    </div>
  );
}
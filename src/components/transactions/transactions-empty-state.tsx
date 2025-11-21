"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
// [ALTERADO] Importar o novo TransactionForm
import { TransactionForm } from "./transaction-form";
import type { Transaction } from "@/lib/types";
import { useFirestore, useUser } from "@/firebase";
import { setTransaction } from "@/firebase/firestore/actions";
import { useToast } from "@/hooks/use-toast";


export function TransactionsEmptyState() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleSave = (newTransaction: Transaction) => {
    if (!firestore || !user?.uid) return;
    setTransaction(firestore, user.uid, newTransaction);
    setIsAddDialogOpen(false);
    toast({
      title: "Transação adicionada",
      description: "Sua nova transação foi salva com sucesso.",
    });
    router.refresh();
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="bg-primary/10 text-primary p-4 rounded-full">
            <ArrowRightLeft className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-primary">
            Nenhuma transação encontrada
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Você ainda não adicionou nenhuma transação. Comece a registrar suas
            rendas e despesas para ter uma visão completa de suas finanças.
          </p>
          <DialogTrigger asChild>
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeira Transação
            </Button>
          </DialogTrigger>
        </div>
      </div>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-md">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua nova transação.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          onSave={handleSave}
          onCancel={() => setIsAddDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
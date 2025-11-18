
"use client";
import React, { useState } from "react";
import { PlusCircle, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddDebtForm } from "./add-debt-form";
import type { ManagedDebt } from "@/lib/types";
import { useFirestore, useUser } from "@/firebase";
import { setDebt } from "@/firebase/firestore/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


export function DebtsEmptyState() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleSave = (newDebt: ManagedDebt) => {
    if (!user?.uid || !firestore) return;
    setDebt(firestore, user.uid, newDebt);
    setIsAddDialogOpen(false);
    toast({
      title: "Dívida adicionada",
      description: `A dívida "${newDebt.name}" foi adicionada com sucesso.`,
    });
    router.refresh(); // Refresh the page to show the new data
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="bg-primary/10 text-primary p-4 rounded-full">
            <PiggyBank className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-primary">
            Nenhuma dívida cadastrada
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Você parece estar livre de dívidas! Se tiver alguma, adicione-a
            aqui para começar a acompanhar seu progresso para quitá-la.
          </p>
          <DialogTrigger asChild>
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeira Dívida
            </Button>
          </DialogTrigger>
        </div>
      </div>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Dívida</DialogTitle>
          <DialogDescription>
            Preencha as informações da sua nova dívida.
          </DialogDescription>
        </DialogHeader>
        <AddDebtForm
          onSave={handleSave}
          onCancel={() => setIsAddDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

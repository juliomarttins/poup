'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ManagedDebt } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditDebtForm } from "@/components/debts/edit-debt-form";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { deleteDebt, setDebt, saveReportHistory } from "@/firebase/firestore/actions"; // [EDIT] Importado saveReportHistory
import { AddDebtForm } from "@/components/debts/add-debt-form";
import { generateDebtsPDF } from "@/lib/generate-pdf";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
}

const DebtCard = ({ debt, onEdit, onDelete }: { debt: ManagedDebt; onEdit: (debt: ManagedDebt) => void; onDelete: (debtId: string) => void; }) => {
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const progress = (debt.totalAmount > 0) ? (debt.paidAmount / debt.totalAmount) * 100 : 0;
    const remainingAmount = debt.totalAmount - debt.paidAmount;

    return (
        <>
            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-start pb-4">
                    <div className="flex-1">
                        <CardTitle className="text-xl">{debt.name}</CardTitle>
                        <CardDescription>{debt.category}</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(debt)}>Editar Dívida</DropdownMenuItem>
                            <DropdownMenuItem>Registrar Pagamento</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteAlert(true)}>Excluir Dívida</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-muted-foreground">Progresso</span>
                            <span className="font-bold text-lg text-primary">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} aria-label={`${progress.toFixed(1)}% pago`} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <p className="text-muted-foreground">Valor Total</p>
                            <p className="font-semibold">{formatCurrency(debt.totalAmount)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Valor Restante</p>
                            <p className="font-semibold">{formatCurrency(remainingAmount)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Parcelas</p>
                            <p className="font-semibold">{debt.paidInstallments} / {debt.totalInstallments}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Próximo Vencimento</p>
                            <p className="font-semibold">{formatDate(debt.dueDate)}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="w-full">
                        <p className="text-muted-foreground text-sm">Valor da Parcela</p>
                        <p className="font-bold text-xl">{formatCurrency(debt.installmentAmount)}</p>
                    </div>
                </CardFooter>
            </Card>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente a dívida
                             <span className="font-semibold">{debt.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(debt.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

interface DebtsClientPageProps {
  initialDebts: ManagedDebt[];
}

export function DebtsClientPage({ initialDebts }: DebtsClientPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    
    const [editingDebt, setEditingDebt] = useState<ManagedDebt | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const handleEdit = (debt: ManagedDebt) => {
        setEditingDebt(debt);
    };

    const handleDelete = (debtId: string) => {
        if (!user?.uid || !firestore) return;
        deleteDebt(firestore, user.uid, debtId);
        toast({
            title: "Dívida excluída",
            description: "A dívida foi removida com sucesso.",
        });
        router.refresh();
    };

    const handleSave = (updatedDebt: ManagedDebt) => {
        if (!user?.uid || !firestore) return;
        setDebt(firestore, user.uid, updatedDebt);
        setEditingDebt(null);
        setIsAddDialogOpen(false);
        toast({
            title: updatedDebt.id ? "Dívida atualizada" : "Dívida adicionada",
            description: `As informações da dívida "${updatedDebt.name}" foram salvas.`,
        });
        router.refresh();
    };

    const handleExport = async () => {
        generateDebtsPDF(initialDebts);
        if (user && firestore) {
            await saveReportHistory(firestore, user.uid, 'dividas', 'Relatório de Dívidas');
        }
    }

    const totalDebtAmount = initialDebts.reduce((acc, debt) => acc + debt.totalAmount, 0);
    const totalPaidAmount = initialDebts.reduce((acc, debt) => acc + debt.paidAmount, 0);
    const overallProgress = totalDebtAmount > 0 ? (totalPaidAmount / totalDebtAmount) * 100 : 0;
    const remainingOverallAmount = totalDebtAmount - totalPaidAmount;
    
    return (
        <div className="flex flex-1 flex-col gap-6">
             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Minhas Dívidas</h1>
                        <p className="text-muted-foreground">Sua central para gerenciar e quitar suas dívidas.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nova Dívida
                            </Button>
                        </DialogTrigger>
                    </div>
                </header>

                 <DialogContent className="sm:max-w-md w-[90vw] rounded-md">
                    <DialogHeader>
                        <DialogTitle>Adicionar Nova Dívida</DialogTitle>
                        <DialogDescription>
                            Preencha as informações da sua nova dívida.
                        </DialogDescription>
                    </DialogHeader>
                    <AddDebtForm onSave={handleSave} onCancel={() => setIsAddDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>Progresso Total</CardTitle>
                    <CardDescription>Sua jornada para uma vida livre de dívidas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                     <Progress value={overallProgress} className="h-4" />
                     <div className="flex justify-between text-sm font-medium">
                        <span>{formatCurrency(totalPaidAmount)} <span className="text-muted-foreground">pago</span></span>
                         <span className="text-primary">{overallProgress.toFixed(1)}%</span>
                        <span>{formatCurrency(totalDebtAmount)} <span className="text-muted-foreground">total</span></span>
                     </div>
                </CardContent>
                <CardFooter>
                     <p className="text-lg">Faltam <span className="font-bold text-primary">{formatCurrency(remainingOverallAmount)}</span> para você ficar livre de dívidas!</p>
                </CardFooter>
            </Card>

            <Separator />
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {initialDebts.map(debt => (
                    <DebtCard key={debt.id} debt={debt} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
            </div>

            <Dialog open={!!editingDebt} onOpenChange={(isOpen) => !isOpen && setEditingDebt(null)}>
                <DialogContent className="sm:max-w-md w-[90vw] rounded-md">
                    <DialogHeader>
                        <DialogTitle>Editar Dívida</DialogTitle>
                        <DialogDescription>
                            Atualize as informações da sua dívida.
                        </DialogDescription>
                    </DialogHeader>
                    {editingDebt && <EditDebtForm debt={editingDebt} onSave={handleSave} onCancel={() => setEditingDebt(null)} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
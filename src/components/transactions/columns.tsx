"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Check, Clock, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { Transaction, UserProfile } from "@/lib/types"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from 'firebase/firestore';
import { AvatarIcon } from '../icons/avatar-icon';
import { Avatar } from '../ui/avatar';
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ActionsCellProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

const ActionsCell = ({ transaction, onEdit, onDelete }: ActionsCellProps) => {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(transaction)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => setShowDeleteAlert(true)}
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(transaction.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const StatusCell = ({ transaction }: { transaction: Transaction }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const isPaid = transaction.status === 'paid';

    const toggleStatus = async () => {
        if (!user || !firestore) return;
        const newStatus = isPaid ? 'pending' : 'paid';
        const docRef = doc(firestore, 'users', user.uid, 'transactions', transaction.id);
        try {
            await updateDoc(docRef, { status: newStatus });
        } catch (e) {
            console.error("Erro status", e);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div 
                        onClick={(e) => { e.stopPropagation(); toggleStatus(); }}
                        className={`cursor-pointer inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium border transition-all ${
                            isPaid 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900'
                        }`}
                    >
                        {isPaid ? <Check className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {isPaid ? 'Pago' : 'Pendente'}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Clique para alterar status</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const ProfileCell = ({ profileId }: { profileId?: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

    if (isLoading) return <Skeleton className="h-6 w-20" />;

    const profile = userProfile?.profiles?.find(p => p.id === profileId);
    const display = profile || userProfile?.profiles?.[0] || { name: 'Conta' };
    
    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6" style={{ background: display.avatarBackground || 'hsl(var(--muted))' }}>
                <AvatarIcon iconName={display.photoURL} className="h-4 w-4" style={{ color: display.avatarColor }} />
            </Avatar>
            <span className="truncate max-w-[100px]">{display.name}</span>
        </div>
    );
};

// Componente auxiliar para Headers Ordenáveis
const SortableHeader = ({ column, title }: { column: any, title: string }) => {
    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
                <ArrowUpDown className="ml-2 h-4 w-4 rotate-180 transition-transform" />
            ) : column.getIsSorted() === "asc" ? (
                <ArrowUpDown className="ml-2 h-4 w-4 transition-transform" />
            ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
        </Button>
    )
}

type GetColumnsParams = {
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export const columns = ({ onEdit, onDelete }: GetColumnsParams): ColumnDef<Transaction>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => <SortableHeader column={column} title="Data" />,
    cell: ({ row }) => {
      const dateString = row.getValue("date") as string;
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return <div className="font-medium text-muted-foreground">{date.toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</div>
    }
  },
  {
    accessorKey: "profileId",
    header: ({ column }) => <SortableHeader column={column} title="Perfil" />,
    cell: ({ row }) => <ProfileCell profileId={row.getValue("profileId")} />,
    // Permitir filtrar pelo ID do perfil
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: "description",
    header: ({ column }) => <SortableHeader column={column} title="Descrição" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue("description")}</span>,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column} title="Categoria" />,
    cell: ({ row }) => <Badge variant="outline" className="font-normal">{row.getValue("category")}</Badge>,
    filterFn: (row, id, value) => value.includes(row.getValue(id))
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusCell transaction={row.original} />,
    filterFn: (row, id, value) => value.includes(row.original.status || 'paid')
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column} title="Tipo" />,
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant={type === "income" ? "secondary" : "destructive"} className="uppercase text-[10px]">{type === 'income' ? 'Renda' : 'Despesa'}</Badge>
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id))
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <div className="text-right"><SortableHeader column={column} title="Valor" /></div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className={`text-right font-bold ${row.original.type === 'income' ? 'text-positive' : 'text-negative'}`}>{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell transaction={row.original} onEdit={onEdit} onDelete={onDelete} />,
  },
]
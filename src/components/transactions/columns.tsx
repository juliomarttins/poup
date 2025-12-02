"use client"

import { useState } from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Check, Clock } from "lucide-react"

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
import type { Transaction, UserProfile, Profile } from "@/lib/types"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from 'firebase/firestore'; // [NOVO] Import updateDoc
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
            Editar transação
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(transaction.id)}
          >
            Copiar ID da transação
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => setShowDeleteAlert(true)}
          >
            Excluir transação
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente a transação.
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

// [NOVO] Célula de Status Interativa
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
            console.error("Erro ao atualizar status", e);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); toggleStatus(); }}
                        className={`h-7 px-2 gap-1.5 transition-all ${
                            isPaid 
                            ? 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30' 
                            : 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
                        }`}
                    >
                        {isPaid ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span className="text-xs font-medium">{isPaid ? 'Pago' : 'Pendente'}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}</p>
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

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-20" />
            </div>
        );
    }

    const profile = userProfile?.profiles?.find(p => p.id === profileId);
    
    if (!profile) {
        const mainProfile = userProfile?.profiles?.[0] || { name: 'Conta' };
        return (
            <div className="flex items-center gap-2">
                 <Avatar 
                    className="h-6 w-6 flex items-center justify-center rounded-full"
                    style={{ background: mainProfile.avatarBackground || 'hsl(var(--muted))' }}
                >
                    <AvatarIcon
                        iconName={mainProfile.photoURL}
                        fallbackName={mainProfile.name}
                        className="h-4 w-4"
                        style={{ color: mainProfile.avatarColor || 'hsl(var(--foreground))' }}
                    />
                </Avatar>
                <span className="truncate">{mainProfile.name}</span>
            </div>
        );
    }
    
    return (
        <div className="flex items-center gap-2">
            <Avatar 
                className="h-6 w-6 flex items-center justify-center rounded-full"
                style={{ background: profile.avatarBackground || 'hsl(var(--muted))' }}
            >
                <AvatarIcon
                    iconName={profile.photoURL}
                    fallbackName={profile.name}
                    className="h-4 w-4"
                    style={{ color: profile.avatarColor || 'hsl(var(--foreground))' }}
                />
            </Avatar>
            <span className="truncate">{profile.name}</span>
        </div>
    );
};


type GetColumnsParams = {
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export const columns = ({ onEdit, onDelete }: GetColumnsParams): ColumnDef<Transaction>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    filterFn: 'dateBetween',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const dateString = row.getValue("date") as string;
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      const formatted = date.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
      return <div className="pl-4">{formatted}</div>
    }
  },
  {
    accessorKey: "profileId",
    header: "Perfil",
    cell: ({ row }) => {
      return <ProfileCell profileId={row.getValue("profileId")} />;
    }
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => {
      return <Badge variant="outline">{row.getValue("category")}</Badge>
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        return <StatusCell transaction={row.original} />;
    }
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const translatedType = type === 'income' ? 'renda' : 'despesa';
      return <Badge variant={type === "income" ? "secondary" : "destructive"}>{translatedType}</Badge>
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount)

      return <div className={`text-right font-medium ${row.original.type === 'income' ? 'text-positive' : 'text-negative'}`}>{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original;
      return <ActionsCell transaction={transaction} onEdit={onEdit} onDelete={onDelete} />;
    },
  },
]
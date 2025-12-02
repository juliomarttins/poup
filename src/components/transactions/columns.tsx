"use client"

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Check, Clock, Wallet } from "lucide-react"

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
import type { Transaction, Profile } from "@/lib/types"
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from 'firebase/firestore';
import { AvatarIcon } from '../icons/avatar-icon';
import { Avatar } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const ProfileCell = ({ profileId, tableMeta }: { profileId?: string, tableMeta: any }) => {
    const profiles = tableMeta?.profiles as Profile[] || [];
    const profile = profiles.find(p => p.id === profileId);
    
    const display = profile || { 
        name: 'Conta', 
        photoURL: null, 
        avatarColor: 'hsl(var(--foreground))', 
        avatarBackground: 'hsl(var(--muted))' 
    };
    
    return (
        <div className="flex items-center gap-2">
            <Avatar 
                className="h-6 w-6 flex items-center justify-center" 
                style={{ background: display.avatarBackground || 'hsl(var(--muted))' }}
            >
                <AvatarIcon 
                    iconName={display.photoURL} 
                    className="h-3.5 w-3.5" 
                    style={{ color: display.avatarColor || 'hsl(var(--foreground))' }} 
                />
            </Avatar>
            <span className="truncate max-w-[100px] text-sm">{display.name}</span>
        </div>
    );
};

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

// Mapa simples para labels de pagamento
const paymentLabels: Record<string, string> = {
    pix: 'Pix',
    card: 'Cartão',
    debit: 'Débito',
    cash: 'Dinheiro',
    boleto: 'Boleto',
    transfer: 'Transf.',
    other: 'Outro'
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
    header: ({ column }) => <SortableHeader column={column} title="Data/Hora" />,
    cell: ({ row }) => {
      const dateString = row.getValue("date") as string;
      try {
          // [CORREÇÃO] Parse robusto: Se for ISO, formata com hora. Se for antigo (só data), ajusta.
          // O replace garante que a barra seja interpretada corretamente se vier formato legado.
          const date = dateString.includes('T') ? parseISO(dateString) : new Date(dateString);
          
          return (
            <div className="flex flex-col text-xs">
                <span className="font-medium text-foreground">
                    {format(date, "dd/MM/yy", { locale: ptBR })}
                </span>
                <span className="text-muted-foreground">
                    {format(date, "HH:mm", { locale: ptBR })}
                </span>
            </div>
          );
      } catch (e) {
          return <span className="text-xs text-muted-foreground">{dateString}</span>;
      }
    }
  },
  {
    accessorKey: "profileId",
    header: ({ column }) => <SortableHeader column={column} title="Perfil" />,
    cell: ({ row, table }) => <ProfileCell profileId={row.getValue("profileId")} tableMeta={table.options.meta} />,
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: "description",
    header: ({ column }) => <SortableHeader column={column} title="Descrição" />,
    cell: ({ row }) => (
        <div className="flex flex-col">
            <span className="font-medium">{row.getValue("description")}</span>
            {/* [NOVO] Badge de Método de Pagamento */}
            {row.original.paymentMethod && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Wallet className="h-3 w-3" /> {paymentLabels[row.original.paymentMethod] || row.original.paymentMethod}
                </span>
            )}
        </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column} title="Categoria" />,
    cell: ({ row }) => <Badge variant="outline" className="font-normal text-[10px] sm:text-xs">{row.getValue("category")}</Badge>,
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
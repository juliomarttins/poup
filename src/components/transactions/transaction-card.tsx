
"use client";

import { useState } from "react";
import type { Transaction, UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { Avatar } from '../ui/avatar';
import { AvatarIcon } from '../icons/avatar-icon';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

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

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  
  const profile = userProfile?.profiles?.find(p => p.id === transaction.profileId);
  const fallbackProfile = { name: 'Conta', photoURL: 'User', avatarColor: 'hsl(var(--foreground))', avatarBackground: 'hsl(var(--muted))'};
  const displayProfile = profile || fallbackProfile;

  return (
    <>
      <Card>
        <CardContent className="p-4 flex items-start gap-4">
            <Avatar 
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center"
                style={{ background: displayProfile.avatarBackground }}
            >
                <AvatarIcon
                    iconName={displayProfile.photoURL}
                    fallbackName={displayProfile.name}
                    className="h-6 w-6"
                    style={{ color: displayProfile.avatarColor || 'hsl(var(--primary-foreground))' }}
                />
            </Avatar>
            <div className="flex-1 grid gap-1">
                <p className="font-medium leading-tight">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">{displayProfile.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                    <Badge variant="outline">{transaction.category}</Badge>
                    <span>-</span>
                    <p>{formatDate(transaction.date)}</p>
                </div>
            </div>
            <div className="flex flex-col items-end justify-between h-full">
                <div className={`font-bold text-lg ${transaction.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(transaction.amount)}
                </div>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mb-2 -mr-2">
                    <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(transaction)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteAlert(true)}
                    >
                    Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardContent>
      </Card>
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
}

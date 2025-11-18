import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { useUser } from '@/firebase';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { user } = useUser();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Uma rápida olhada na sua atividade financeira mais recente.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/dashboard/transactions">
            Ver Tudo
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma transação recente encontrada.</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  {transaction.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transaction.category}
                </p>
              </div>
              <div className={`ml-auto font-medium ${transaction.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

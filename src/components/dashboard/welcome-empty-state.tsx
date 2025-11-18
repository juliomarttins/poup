
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useUser } from '@/firebase';

export function WelcomeEmptyState() {
  const { user } = useUser();

  return (
    <div className="flex flex-1 flex-col gap-8 items-center justify-center text-center p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo(a) ao Poupp, {user?.displayName?.split(' ')[0] || 'usuário'}!
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Vamos organizar suas finanças em três passos simples. Siga o guia abaixo para assumir o controle do seu dinheiro.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl w-full">
        <Card className="text-left flex flex-col">
          <CardHeader className="flex-grow">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full flex-shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-primary">1. Adicione sua Primeira Receita</CardTitle>
                <CardDescription>
                  Comece registrando seus ganhos. Isso inclui salários, bônus ou qualquer dinheiro que você recebe.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/transactions">Registrar Receita <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="text-left flex flex-col">
          <CardHeader className="flex-grow">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full flex-shrink-0">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-primary">2. Lance suas Despesas</CardTitle>
                <CardDescription>
                  Agora, adicione seus gastos do dia a dia. Isso ajuda a entender para onde seu dinheiro está indo.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/transactions">Lançar Despesa <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="text-left md:col-span-2 lg:col-span-1 flex flex-col">
          <CardHeader className="flex-grow">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full flex-shrink-0">
                <PiggyBank className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-primary">3. Organize suas Dívidas</CardTitle>
                <CardDescription>
                  Tem um empréstimo ou financiamento? Cadastre aqui para acompanhar o pagamento e quitar mais rápido.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/debts">Gerenciar Dívidas <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

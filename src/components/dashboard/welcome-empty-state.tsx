'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, TrendingUp, TrendingDown, PiggyBank, Bot, Sparkles, FileText } from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

export function WelcomeEmptyState() {
  const { user } = useUser();
  const firstName = user?.displayName?.split(' ')[0] || 'usuário';

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
      
      {/* HERO SECTION */}
      <div className="text-center space-y-4 mb-12 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-2">
            <Sparkles className="w-3 h-3" /> <span>Painel Financeiro Inteligente</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          Bem-vindo, {firstName}!
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          Seu sistema financeiro está pronto. A partir de agora, a <strong className="text-foreground">IA aprende com seus hábitos</strong> e gera relatórios precisos para sua liberdade financeira.
        </p>
      </div>

      {/* GRID DE DESTAQUES & AÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        
        {/* CARD 1: IA */}
        <Card className="relative overflow-hidden border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bot className="w-24 h-24" />
            </div>
            <div className="p-6 flex flex-col h-full">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 text-purple-500">
                    <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">IA que Evolui</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-grow">
                    Nossa IA analisa cada transação. Quanto mais você usa, mais ela entende seu perfil e dá dicas personalizadas.
                </p>
                <Button variant="outline" className="w-full justify-between border-white/5 bg-white/5 hover:bg-white/10" asChild>
                    <Link href="/dashboard/poupp-ia">Conhecer a IA <ArrowRight className="w-4 h-4" /></Link>
                </Button>
            </div>
        </Card>

        {/* CARD 2: RELATÓRIOS */}
        <Card className="relative overflow-hidden border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="w-24 h-24" />
            </div>
            <div className="p-6 flex flex-col h-full">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20 text-blue-500">
                    <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Relatórios Premium</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-grow">
                    Gere PDFs detalhados, visualize gráficos de tendência e tenha controle total sobre o fluxo do seu dinheiro.
                </p>
                <Button variant="outline" className="w-full justify-between border-white/5 bg-white/5 hover:bg-white/10" asChild>
                    <Link href="/dashboard/reports">Ver Relatórios <ArrowRight className="w-4 h-4" /></Link>
                </Button>
            </div>
        </Card>

        {/* CARD 3: AÇÃO RÁPIDA (Start) */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="p-6 flex flex-col h-full justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1">Comece Agora</h3>
                    <p className="text-sm text-muted-foreground">Registre sua primeira movimentação para ativar o dashboard.</p>
                </div>
                
                <div className="space-y-2">
                    <Button className="w-full justify-start gap-3 font-semibold shadow-lg shadow-primary/10" asChild>
                        <Link href="/dashboard/transactions">
                            <TrendingUp className="w-4 h-4" /> Adicionar Receita
                        </Link>
                    </Button>
                    <Button variant="secondary" className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 border border-white/5" asChild>
                        <Link href="/dashboard/transactions">
                             <TrendingDown className="w-4 h-4 text-red-400" /> Adicionar Despesa
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" asChild>
                        <Link href="/dashboard/debts">
                             <PiggyBank className="w-4 h-4" /> Gerenciar Dívidas
                        </Link>
                    </Button>
                </div>
            </div>
        </Card>

      </div>
    </div>
  );
}
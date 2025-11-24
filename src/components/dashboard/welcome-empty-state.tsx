'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Import corrigido
import { ArrowRight, PlusCircle, Sparkles, Target } from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

export function WelcomeEmptyState() {
  const { user } = useUser();
  const firstName = user?.displayName?.split(' ')[0] || 'usuário';

  return (
    <div className="relative flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-700">
      
      {/* BACKGROUND BLURRED PREVIEW (O "Truque" Apple) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none select-none overflow-hidden blur-xl grayscale">
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto mt-20">
             <div className="h-32 bg-primary/20 rounded-xl"></div>
             <div className="h-32 bg-primary/20 rounded-xl"></div>
             <div className="h-32 bg-primary/20 rounded-xl"></div>
             <div className="col-span-2 h-64 bg-primary/10 rounded-xl"></div>
             <div className="h-64 bg-primary/10 rounded-xl"></div>
          </div>
      </div>

      {/* HERO CONTENT */}
      <div className="relative z-10 text-center max-w-lg mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2 shadow-sm">
            <Sparkles className="w-3 h-3" /> <span>Painel Inteligente</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline text-foreground">
          Olá, {firstName}!
        </h1>
        
        <p className="text-muted-foreground text-lg leading-relaxed">
          Seu painel está vazio, mas não por muito tempo. Vamos configurar sua vida financeira em segundos?
        </p>

        <div className="grid gap-3 pt-4 w-full max-w-sm mx-auto">
            <Button size="lg" className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 text-base gap-2 group" asChild>
                <Link href="/dashboard/transactions">
                   <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   Adicionar Primeira Transação
                </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="w-full h-12 rounded-xl border-dashed border-2 gap-2 hover:bg-muted/50" asChild>
                <Link href="/dashboard/debts">
                   <Target className="w-4 h-4" />
                   Definir Meta de Dívida
                </Link>
            </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-8 opacity-60">
            Dica: Você pode usar a IA para escanear notas fiscais automaticamente.
        </p>
      </div>
    </div>
  );
}
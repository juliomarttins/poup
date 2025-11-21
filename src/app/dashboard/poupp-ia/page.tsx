'use client';

import { Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PouppIAPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4 text-center p-8 max-w-md">
          <div className="bg-primary/10 text-primary p-6 rounded-full">
            <Bot className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-primary">
                PouppIA
            </h3>
            <p className="text-lg font-semibold text-foreground">
                Sua Inteligência Financeira
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Estamos preparando uma inteligência artificial exclusiva para analisar suas contas, tirar dúvidas e te ajudar a economizar de verdade.
          </p>
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground mt-4">
             🚧 Em breve
          </div>
        </div>
    </div>
  );
}
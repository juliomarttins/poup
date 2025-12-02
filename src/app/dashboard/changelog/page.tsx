// ARQUIVO NOVO: src/app/dashboard/changelog/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Rocket, Sparkles, Bug, Cog } from "lucide-react";

export default function ChangelogPage() {
  const changes = [
    {
      version: "1.3.0",
      date: "01/12/2025",
      title: "Recorrência e Controle de Status",
      items: [
        { type: 'feat', text: "Adicionada opção de 'Repetir Lançamento' ao criar transações. Agora você pode lançar contas fixas para o ano todo." },
        { type: 'feat', text: "Novo controle de Status (Pago/Pendente) na lista de transações com botão rápido." },
        { type: 'fix', text: "Correção na usabilidade do campo de valor: agora seleciona o texto automaticamente ao clicar." },
        { type: 'imp', text: "Melhoria na detecção automática de categorias pela IA." }
      ]
    },
    {
      version: "1.2.0",
      date: "20/11/2025",
      title: "PDFs e Filtros",
      items: [
        { type: 'feat', text: "Exportação de relatórios PDF aprimorada com gráficos." },
        { type: 'feat', text: "Filtros avançados de data e categoria no painel de relatórios." }
      ]
    }
  ];

  const getIcon = (type: string) => {
      switch(type) {
          case 'feat': return <Rocket className="w-4 h-4 text-green-500" />;
          case 'fix': return <Bug className="w-4 h-4 text-red-500" />;
          case 'imp': return <Cog className="w-4 h-4 text-blue-500" />;
          default: return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
      }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="text-yellow-500" /> Novidades
        </h1>
        <p className="text-muted-foreground">
          Fique por dentro das últimas atualizações do Poupp.
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pb-10">
            {changes.map((change, index) => (
                <Card key={index} className="border-l-4 border-l-primary/50">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-3">
                                    {change.title} 
                                    <Badge variant="outline" className="text-xs font-normal font-mono">{change.version}</Badge>
                                </CardTitle>
                                <CardDescription>{change.date}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {change.items.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm">
                                    <div className="mt-0.5 shrink-0 bg-muted p-1 rounded-full">
                                        {getIcon(item.type)}
                                    </div>
                                    <span className="leading-relaxed opacity-90">{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
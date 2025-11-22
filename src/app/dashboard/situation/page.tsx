'use client';

import { useState, useEffect } from 'react';
import { AnalysisCard } from '@/components/situation/analysis-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth/use-user';
import { useProfile } from '@/contexts/profile-context';
import type { FinancialAnalysis } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

export default function SituationPage() {
    const { user } = useUser();
    const { activeProfile } = useProfile();
    const [analyses, setAnalyses] = useState<FinancialAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!user || !activeProfile) return;
            
            setIsLoading(true);
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    // Envia tipo 'situation' e o nome do perfil para personalização
                    body: JSON.stringify({ type: 'situation', profileName: activeProfile.name }),
                });

                if (!res.ok) throw new Error("Falha na análise");
                
                const data = await res.json();
                // A API retorna um array direto de análises
                if (Array.isArray(data)) {
                    setAnalyses(data);
                }
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [user, activeProfile]);
    
    if (isLoading) {
       return (
            <div className="flex flex-1 flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Diagnóstico Financeiro</h1>
                    <p className="text-muted-foreground">A IA está analisando suas contas...</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                </div>
            </div>
       );
    }

    if (error || analyses.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
                <div className="flex flex-col items-center gap-4 text-center p-8">
                    <AlertTriangle className="h-10 w-10 text-yellow-500" />
                    <h3 className="text-2xl font-bold tracking-tight">
                        Análise Indisponível
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Não consegui gerar o diagnóstico agora. Tente adicionar mais transações ou volte mais tarde.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Diagnóstico da IA</h1>
                <p className="text-muted-foreground">Análise personalizada para {activeProfile?.name || 'você'}.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {analyses.map((analysis, idx) => (
                    <AnalysisCard key={analysis.id || idx} analysis={analysis} />
                ))}
            </div>
        </div>
    );
}
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertTriangle, CreditCard, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AccountSettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: profile, isLoading } = useDoc<UserProfile>(userProfileRef);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    // Defaults
    const plan = profile?.subscription?.plan || 'free';
    const status = profile?.subscription?.status || 'trial';
    // Data segura
    const expiresAt = profile?.subscription?.expiresAt 
        ? (profile.subscription.expiresAt.toDate ? profile.subscription.expiresAt.toDate() : new Date(profile.subscription.expiresAt))
        : new Date(); 
        
    const isExpired = expiresAt < new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Minha Assinatura</h3>
                <p className="text-sm text-muted-foreground">
                    Gerencie o status da sua conta e plano.
                </p>
            </div>
            <Separator />

            <Card className={isExpired ? "border-destructive/50 bg-destructive/5" : "border-primary/20 bg-primary/5"}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {plan === 'pro' ? 'Plano Pro' : 'Plano Gratuito'}
                                <Badge variant={isExpired ? "destructive" : "default"}>
                                    {isExpired ? 'Expirado' : status === 'trial' ? 'Período de Teste' : 'Ativo'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {isExpired 
                                    ? "Sua assinatura venceu. Renove para continuar usando a IA."
                                    : "Você tem acesso total a todos os recursos."}
                            </CardDescription>
                        </div>
                        {plan === 'pro' && !isExpired && <CheckCircle2 className="text-green-500 h-8 w-8" />}
                        {isExpired && <AlertTriangle className="text-red-500 h-8 w-8" />}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Vence em:</span>
                            <span>{expiresAt.toLocaleDateString('pt-BR')}</span>
                        </div>
                        {!isExpired && (
                            <span className="text-muted-foreground">({daysLeft} dias restantes)</span>
                        )}
                    </div>
                    
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> <span>Categorização com IA Ilimitada</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> <span>Painel Personalizado</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> <span>Suporte Prioritário</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full sm:w-auto gap-2" variant={isExpired ? "destructive" : "default"}>
                        <CreditCard className="h-4 w-4" />
                        {isExpired ? "Renovar Agora" : "Gerenciar Pagamento"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
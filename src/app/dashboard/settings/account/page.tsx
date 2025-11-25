'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertTriangle, MessageCircle, Crown, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WHATSAPP_NUMBER, SUBSCRIPTION_PLANS } from '@/lib/constants';

export default function AccountSettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: profile, isLoading } = useDoc<UserProfile>(userProfileRef);

    if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;

    const planId = profile?.subscription?.plan || 'trial';
    const planDetails = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId) || SUBSCRIPTION_PLANS.TRIAL;
    
    const expiresAt = profile?.subscription?.expiresAt 
        ? (profile.subscription.expiresAt.toDate ? profile.subscription.expiresAt.toDate() : new Date(profile.subscription.expiresAt))
        : new Date(); 
        
    const isExpired = expiresAt < new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const handleRenovate = () => {
        const text = `Olá! Gostaria de renovar minha assinatura do Poupp. (Email: ${user?.email})`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Minha Conta</h3>
                <p className="text-sm text-muted-foreground">Status da sua assinatura e plano.</p>
            </div>
            <Separator />

            {profile?.adminMessage && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                    <MessageCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-sm text-yellow-700 dark:text-yellow-500">Mensagem do Suporte</h4>
                        <p className="text-sm opacity-90">{profile.adminMessage}</p>
                    </div>
                </div>
            )}

            <Card className={isExpired ? "border-destructive/50 bg-destructive/5" : "border-primary/20 bg-primary/5"}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {planDetails.label}
                                <Badge variant={isExpired ? "destructive" : "default"}>{isExpired ? 'Vencido' : 'Ativo'}</Badge>
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {isExpired ? "Sua assinatura venceu. Renove para continuar usando." : "Acesso total liberado."}
                            </CardDescription>
                        </div>
                        {planId !== 'trial' && !isExpired && <Crown className="text-yellow-500 h-8 w-8" />}
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
                            <span className={`text-xs font-bold ${daysLeft < 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                ({daysLeft} dias restantes)
                            </span>
                        )}
                    </div>
                    
                    <div className="grid gap-2 mt-2">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> <span>Categorização com IA Ilimitada</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> <span>Painel Personalizado</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleRenovate} className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white">
                        <MessageCircle className="h-4 w-4" />
                        {isExpired ? "Renovar Agora no WhatsApp" : "Alterar Plano / Renovar"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
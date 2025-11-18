
"use client";

import { useState } from 'react';
import { useDashboardData } from '@/contexts/dashboard-data-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AvatarIcon } from '@/components/icons/avatar-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Copy, Check, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { joinFamilyByCode } from '@/firebase/firestore/actions';
import { Skeleton } from '../ui/skeleton';

function FamilyCard() {
    const { familyMembers, userProfile } = useDashboardData();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!userProfile?.familyCode) return;
        navigator.clipboard.writeText(userProfile.familyCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary"/>
                        <CardTitle>Membros da Família</CardTitle>
                    </div>
                </div>
                <CardDescription>
                    As pessoas listadas abaixo têm acesso ao painel financeiro compartilhado. Use o código abaixo para convidar mais pessoas.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Seu código de convite</label>
                    <div className="flex items-center space-x-2">
                        <Input value={userProfile?.familyCode || "..."} readOnly className="flex-1 font-mono"/>
                        <Button variant="outline" size="icon" onClick={handleCopy} disabled={!userProfile?.familyCode || copied}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Membros Atuais</h4>
                    {familyMembers.length > 0 ? (
                        familyMembers.map(member => (
                            <div key={member.uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarIcon 
                                            iconName={member.photoURL} 
                                            color={member.avatarColor}
                                            className="h-full w-full"
                                        />
                                        <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Você é o único membro da sua família por enquanto.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function JoinFamilyCard() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { userProfile } = useDashboardData();
    const [familyCode, setFamilyCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleJoinFamily = async () => {
        if (!firestore || !userProfile?.uid || !familyCode) {
            toast({ variant: 'destructive', title: 'Erro', description: 'O código da família é obrigatório.' });
            return;
        }
        setIsJoining(true);
        try {
            await joinFamilyByCode(firestore, userProfile.uid, familyCode);
            toast({ title: 'Sucesso!', description: 'Você entrou na família. A página será recarregada.' });
            // The data context will automatically update, showing the new family view.
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao entrar na família', description: error.message });
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Entrar em uma Família</CardTitle>
                <CardDescription>
                   Para compartilhar suas finanças, peça o código de convite para um membro da família e insira-o abaixo.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="font-medium text-sm">Código de Convite</p>
                    <div className="flex items-center space-x-2">
                        <Input
                            placeholder="Cole o código aqui"
                            value={familyCode}
                            onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                            disabled={isJoining}
                            className="font-mono"
                        />
                        <Button onClick={handleJoinFamily} disabled={isJoining || !familyCode}>
                            <LogIn className="mr-2 h-4 w-4" />
                            {isJoining ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function FamilyForm() {
    const { userProfile, loading, familyMembers } = useDashboardData();

    if (loading || !userProfile) {
        return (
            <div className="space-y-6">
                 <div>
                    <h3 className="text-lg font-medium">Família</h3>
                    <p className="text-sm text-muted-foreground">
                        Convide e gerencie os membros que compartilham as finanças com você.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-24 w-full mt-4" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    // A user is alone if their familyId is their own uid OR if they are the only one in the family members list.
    // The second condition is a fallback for cases where the familyId might not be perfectly in sync yet.
    const isUserAlone = userProfile.familyId === userProfile.uid || familyMembers.length <= 1;

    // A user has joined another family if their familyId is NOT their own uid
    const hasJoinedFamily = userProfile.familyId !== userProfile.uid;


    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Família</h3>
                <p className="text-sm text-muted-foreground">
                    {isUserAlone
                        ? "Convide membros para sua família usando o código abaixo ou entre em uma família existente."
                        : "Veja os membros da família com quem você compartilha suas finanças."
                    }
                </p>
            </div>
            {/* If the user is the owner of the family group (their familyId is their own uid) */}
            {userProfile.familyId === userProfile.uid && <FamilyCard />}
            
            {/* If the user has joined another family */}
            {hasJoinedFamily && <FamilyCard />}

            {/* If the user is alone and has not joined a family, they can join one */}
            {!hasJoinedFamily && isUserAlone && <JoinFamilyCard />}
        </div>
    );
}

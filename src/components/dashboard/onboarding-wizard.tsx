"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore } from "@/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Target, Wallet, Sparkles } from "lucide-react";
import { doc, setDoc, collection } from "firebase/firestore";
import type { Transaction, ManagedDebt } from "@/lib/types";
import { useProfile } from "@/contexts/profile-context";

const STEPS = [
    { id: 'welcome', title: 'Bem-vindo ao Poupp', desc: 'Vamos configurar seu painel em menos de 1 minuto.' },
    { id: 'income', title: 'Renda Mensal', desc: 'Qual sua estimativa de ganhos mensais?' },
    { id: 'debts', title: 'Dívidas', desc: 'Você possui alguma dívida ativa para monitorar?' },
    { id: 'tutorial', title: 'Como usar', desc: 'Aprenda o básico para dominar suas finanças.' },
];

export function OnboardingWizard() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { activeProfile } = useProfile();
    
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [income, setIncome] = useState("");
    const [hasDebt, setHasDebt] = useState<boolean | null>(null);

    // Verifica se já fez o onboarding (usando localStorage para MVP, idealmente no perfil do user)
    useEffect(() => {
        const hasOnboarded = localStorage.getItem(`poup_onboarded_${user?.uid}`);
        if (user && !hasOnboarded) {
            // Pequeno delay para não ser agressivo
            setTimeout(() => setIsOpen(true), 1000);
        }
    }, [user]);

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            await finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        if (!user || !firestore) return;

        // Salvar Renda Inicial se informada
        if (income) {
            const amount = parseFloat(income.replace(',', '.'));
            if (!isNaN(amount)) {
                const newTx: Transaction = {
                    id: doc(collection(firestore, '_')).id,
                    amount: Math.abs(amount),
                    description: "Salário / Renda Mensal",
                    category: "Salário",
                    date: new Date().toISOString().split('T')[0],
                    type: 'income',
                    userId: user.uid,
                    profileId: activeProfile?.id
                };
                await setDoc(doc(firestore, 'users', user.uid, 'transactions', newTx.id), newTx);
            }
        }

        localStorage.setItem(`poup_onboarded_${user?.uid}`, 'true');
        setIsOpen(false);
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const renderContent = () => {
        switch (STEPS[currentStep].id) {
            case 'welcome':
                return (
                    <div className="flex flex-col items-center text-center py-4 space-y-4">
                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 animate-bounce">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-muted-foreground">
                            O Poupp usa IA para organizar seu dinheiro. Para começar, precisamos de alguns dados básicos.
                        </p>
                    </div>
                );
            case 'income':
                return (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                            <Wallet className="text-green-500" />
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Salário / Entradas</label>
                                <Input 
                                    autoFocus
                                    type="number" 
                                    placeholder="Ex: 3500.00" 
                                    value={income} 
                                    onChange={e => setIncome(e.target.value)}
                                    className="border-0 bg-transparent text-2xl font-bold p-0 h-auto placeholder:text-muted-foreground/50 focus-visible:ring-0"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">Isso ajuda a calcular seu saldo inicial.</p>
                    </div>
                );
            case 'debts':
                return (
                    <div className="space-y-4 py-4">
                         <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setHasDebt(true)}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${hasDebt === true ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                            >
                                <Target className="h-8 w-8 text-red-500" />
                                <span className="font-bold">Sim, tenho</span>
                            </button>
                            <button 
                                onClick={() => setHasDebt(false)}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${hasDebt === false ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                            >
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                                <span className="font-bold">Estou livre</span>
                            </button>
                         </div>
                         {hasDebt && (
                             <p className="text-sm text-center text-muted-foreground animate-in fade-in">
                                 Sem problemas! Vamos cadastrar suas dívidas na aba "Dívidas" após finalizar.
                             </p>
                         )}
                    </div>
                );
            case 'tutorial':
                return (
                    <div className="space-y-4 py-2">
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-3 items-start">
                                <div className="bg-primary/10 p-2 rounded-md shrink-0"><Sparkles className="w-4 h-4 text-primary"/></div>
                                <p>Use o <strong>Quick Add</strong> no topo para digitar gastos como "50 padaria". A IA faz o resto.</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="bg-blue-500/10 p-2 rounded-md shrink-0"><Target className="w-4 h-4 text-blue-500"/></div>
                                <p>Defina metas na aba <strong>Dívidas</strong> para o sistema criar um plano de pagamento.</p>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Passo {currentStep + 1} de {STEPS.length}</span>
                    </div>
                    <DialogTitle className="text-2xl">{STEPS[currentStep].title}</DialogTitle>
                    <DialogDescription>{STEPS[currentStep].desc}</DialogDescription>
                </DialogHeader>

                <div className="mt-2">
                     {renderContent()}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    {currentStep === 0 && (
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Pular Configuração</Button>
                    )}
                    <Button onClick={handleNext} className="w-full sm:w-auto gap-2" disabled={currentStep === 2 && hasDebt === null}>
                        {currentStep === STEPS.length - 1 ? 'Começar a usar' : 'Continuar'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </DialogFooter>
                
                <Progress value={progress} className="h-1 w-full absolute bottom-0 left-0 rounded-none" />
            </DialogContent>
        </Dialog>
    );
}
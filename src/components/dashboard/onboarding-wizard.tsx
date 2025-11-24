"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore } from "@/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Target, Wallet, Sparkles, X } from "lucide-react";
import { doc, setDoc, collection } from "firebase/firestore";
import type { Transaction } from "@/lib/types";
import { useProfile } from "@/contexts/profile-context";

const STEPS = [
    { id: 'welcome', title: 'Bem-vindo ao Poupp', desc: 'Vamos configurar seu painel para você não começar do zero.' },
    { id: 'income', title: 'Renda Mensal', desc: 'Qual sua estimativa de ganhos mensais?' },
    { id: 'debts', title: 'Dívidas', desc: 'Você possui alguma dívida ativa para monitorar?' },
    { id: 'tutorial', title: 'Dicas Rápidas', desc: 'Aprenda a usar a IA a seu favor.' },
];

export function OnboardingWizard() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { activeProfile } = useProfile();
    
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [income, setIncome] = useState("");
    const [hasDebt, setHasDebt] = useState<boolean | null>(null);

    const STORAGE_KEY = `poup_onboarding_status_${user?.uid}`;

    useEffect(() => {
        if (!user) return;
        
        // Status: 'completed' | 'skipped' | null (pending)
        const status = localStorage.getItem(STORAGE_KEY);
        
        if (!status) {
            // Se não tem status, é a primeira vez ou clicou em "Fazer depois"
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user, STORAGE_KEY]);

    const handleSkipForever = () => {
        localStorage.setItem(STORAGE_KEY, 'skipped');
        setIsOpen(false);
    };

    const handleDoLater = () => {
        // Não salva nada no localStorage, então vai aparecer de novo no próximo reload
        setIsOpen(false);
    };

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
                    description: "Salário / Renda Inicial",
                    category: "Salário",
                    date: new Date().toISOString().split('T')[0],
                    type: 'income',
                    userId: user.uid,
                    profileId: activeProfile?.id
                };
                await setDoc(doc(firestore, 'users', user.uid, 'transactions', newTx.id), newTx);
            }
        }

        // Marca como completado para não aparecer mais
        localStorage.setItem(STORAGE_KEY, 'completed');
        setIsOpen(false);
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const renderContent = () => {
        switch (STEPS[currentStep].id) {
            case 'welcome':
                return (
                    <div className="flex flex-col items-center text-center py-6 space-y-4">
                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 animate-bounce">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            O Poupp usa inteligência artificial para categorizar seus gastos automaticamente. Precisamos de alguns dados para calibrar o sistema.
                        </p>
                    </div>
                );
            case 'income':
                return (
                    <div className="space-y-4 py-6">
                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/30 transition-all hover:border-primary/30">
                            <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Salário / Entradas</label>
                                <Input 
                                    autoFocus
                                    type="number" 
                                    placeholder="0,00" 
                                    value={income} 
                                    onChange={e => setIncome(e.target.value)}
                                    className="border-0 bg-transparent text-3xl font-bold p-0 h-auto placeholder:text-muted-foreground/30 focus-visible:ring-0"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'debts':
                return (
                    <div className="space-y-6 py-6">
                         <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setHasDebt(true)}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-200 ${hasDebt === true ? 'border-red-500/50 bg-red-500/5 scale-[1.02]' : 'border-muted hover:border-red-500/20'}`}
                            >
                                <Target className="h-8 w-8 text-red-500" />
                                <span className="font-semibold text-sm">Sim, tenho</span>
                            </button>
                            <button 
                                onClick={() => setHasDebt(false)}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-200 ${hasDebt === false ? 'border-green-500/50 bg-green-500/5 scale-[1.02]' : 'border-muted hover:border-green-500/20'}`}
                            >
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                                <span className="font-semibold text-sm">Estou livre</span>
                            </button>
                         </div>
                         {hasDebt && (
                             <p className="text-sm text-center text-muted-foreground bg-muted/30 p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                 Ok! Após finalizar aqui, vá na aba <strong>Dívidas</strong> para cadastrar os detalhes e criarmos um plano.
                             </p>
                         )}
                    </div>
                );
            case 'tutorial':
                return (
                    <div className="space-y-6 py-4">
                        <div className="space-y-4 text-sm">
                            <div className="flex gap-4 p-3 rounded-lg bg-muted/20">
                                <div className="bg-primary/20 p-2 rounded-md h-fit"><Sparkles className="w-5 h-5 text-primary"/></div>
                                <div>
                                    <strong className="block text-foreground mb-1">Quick Add Inteligente</strong>
                                    <p className="text-muted-foreground">No topo da tela, digite coisas como "56 pastel" ou "1200 amortecedor". A IA detecta o valor, o nome e a categoria (Veículo) sozinha.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleDoLater()}>
            <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0 border-none shadow-2xl">
                <div className="px-6 pt-6 pb-4">
                    <DialogHeader className="mb-4">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold">{STEPS[currentStep].title}</DialogTitle>
                            {currentStep === 0 && (
                                <Button variant="ghost" size="sm" onClick={handleSkipForever} className="text-xs text-muted-foreground h-8">
                                    Não mostrar mais
                                </Button>
                            )}
                        </div>
                        <DialogDescription className="text-base">{STEPS[currentStep].desc}</DialogDescription>
                    </DialogHeader>

                    <div className="min-h-[180px] flex flex-col justify-center">
                        {renderContent()}
                    </div>
                </div>

                <div className="bg-muted/30 p-4 px-6 flex justify-between items-center">
                     {currentStep === 0 ? (
                        <Button variant="ghost" onClick={handleDoLater} className="text-muted-foreground hover:text-foreground">Fazer depois</Button>
                     ) : (
                        <Button variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0}>Voltar</Button>
                     )}
                    
                    <Button onClick={handleNext} className="gap-2 pl-6 pr-6" disabled={currentStep === 2 && hasDebt === null}>
                        {currentStep === STEPS.length - 1 ? 'Finalizar' : 'Próximo'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
                
                <Progress value={progress} className="h-1 w-full rounded-none bg-muted" />
            </DialogContent>
        </Dialog>
    );
}
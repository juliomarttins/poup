
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import type { FinancialAnalysis, Transaction, ManagedDebt } from '@/lib/types';
import { AnalysisCard } from '@/components/situation/analysis-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';


// Helper function to calculate financial metrics
const getFinancialAnalysis = (transactions: any[], debts: any[]): FinancialAnalysis[] => {
    if (!transactions || transactions.length === 0) return [];
    
    const currentMonth = new Date().getUTCMonth();
    const currentYear = new Date().getUTCFullYear();

    const monthlyMetrics = transactions.reduce((acc, t) => {
        const transactionDate = new Date(t.date);
        if (transactionDate.getUTCMonth() === currentMonth && transactionDate.getUTCFullYear() === currentYear) {
            if (t.type === 'income') {
                acc.income += t.amount;
            } else {
                acc.expenses += Math.abs(t.amount);
            }
        }
        return acc;
    }, { income: 0, expenses: 0 });

    const netBalance = monthlyMetrics.income - monthlyMetrics.expenses;
    const savingsRate = monthlyMetrics.income > 0 ? (netBalance / monthlyMetrics.income) * 100 : 0;
    
    const monthlyDebtPayments = (debts || []).reduce((acc, d) => acc + d.installmentAmount, 0);
    const debtToIncomeRatio = monthlyMetrics.income > 0 ? (monthlyDebtPayments / monthlyMetrics.income) * 100 : 0;

    let analyses: FinancialAnalysis[] = [];

    // Analysis 1: Net Balance
    if (netBalance > 0) {
        analyses.push({
            id: 'net-balance-positive',
            title: 'Balanço Mensal Positivo!',
            status: 'positive',
            summary: `Você está gastando R$ ${netBalance.toFixed(2)} a menos do que ganha este mês.`,
            advice: 'Excelente! Continue assim. Considere usar esse excedente para quitar dívidas mais rápido ou começar a investir para alcançar seus objetivos financeiros.'
        });
    } else if (netBalance < 0) {
        analyses.push({
            id: 'net-balance-negative',
            title: 'Atenção: Balanço Mensal Negativo',
            status: 'negative',
            summary: `Você está gastando R$ ${Math.abs(netBalance).toFixed(2)} a mais do que ganha este mês.`,
            advice: 'Isso é um sinal de alerta. Revise suas despesas na página de transações para identificar onde você pode cortar gastos. Priorize despesas essenciais.'
        });
    } else {
        analyses.push({
            id: 'net-balance-zero',
            title: 'Balanço Mensal Equilibrado',
            status: 'neutral',
            summary: 'Suas receitas e despesas estão equilibradas este mês.',
            advice: 'Estar no zero a zero é um bom começo, mas não permite que você construa uma reserva de emergência ou invista. Tente encontrar pequenas despesas para cortar e criar uma folga no orçamento.'
        });
    }

    // Analysis 2: Savings Rate
    if (savingsRate > 20) {
         analyses.push({
            id: 'savings-rate-excellent',
            title: 'Taxa de Poupança Excelente!',
            status: 'positive',
            summary: `Você está poupando ${savingsRate.toFixed(1)}% da sua renda.`,
            advice: 'Parabéns! Uma taxa de poupança alta é o caminho mais rápido para a independência financeira. Continue investindo de forma inteligente.'
        });
    } else if (savingsRate > 10) {
         analyses.push({
            id: 'savings-rate-good',
            title: 'Boa Taxa de Poupança',
            status: 'positive',
            summary: `Você está poupando ${savingsRate.toFixed(1)}% da sua renda.`,
            advice: 'Você está no caminho certo! Mantenha a disciplina e você verá seu patrimônio crescer consistentemente.'
        });
    } else if (savingsRate > 0) {
         analyses.push({
            id: 'savings-rate-low',
            title: 'Taxa de Poupança Baixa',
            status: 'neutral',
            summary: `Você está poupando ${savingsRate.toFixed(1)}% da sua renda.`,
            advice: 'É ótimo que você esteja poupando, mas tente aumentar essa porcentagem. Pequenos cortes em despesas não essenciais podem fazer uma grande diferença a longo prazo.'
        });
    } else {
         analyses.push({
            id: 'savings-rate-zero',
            title: 'Sem Poupança Este Mês',
            status: 'negative',
            summary: 'Você não conseguiu poupar nada da sua renda este mês.',
            advice: 'É crucial criar o hábito de poupar, mesmo que seja uma pequena quantia. A "primeira regra" da riqueza é pagar-se a si mesmo primeiro. Tente separar 5% a 10% da sua renda assim que ela entrar.'
        });
    }

    // Analysis 3: Debt-to-Income Ratio
    if (debtToIncomeRatio > 40) {
         analyses.push({
            id: 'dti-high',
            title: 'Nível de Endividamento Alto',
            status: 'negative',
            summary: `Cerca de ${debtToIncomeRatio.toFixed(1)}% da sua renda está comprometida com dívidas.`,
            advice: 'Este é um nível perigoso. Priorize quitar suas dívidas o mais rápido possível, começando pelas que têm os juros mais altos. Evite fazer novas dívidas.'
        });
    } else if (debtToIncomeRatio > 20) {
         analyses.push({
            id: 'dti-moderate',
            title: 'Nível de Endividamento Moderado',
            status: 'neutral',
            summary: `${debtToIncomeRatio.toFixed(1)}% da sua renda está comprometida com dívidas.`,
            advice: 'Seu nível de endividamento é gerenciável, mas requer atenção. Continue pagando suas dívidas em dia e considere fazer pagamentos extras para acelerar a quitação.'
        });
    } else if (debtToIncomeRatio > 0) {
         analyses.push({
            id: 'dti-low',
            title: 'Nível de Endividamento Baixo e Saudável',
            status: 'positive',
            summary: `Apenas ${debtToIncomeRatio.toFixed(1)}% da sua renda está comprometida com dívidas.`,
            advice: 'Excelente! Você está gerenciando suas dívidas de forma muito eficaz. Isso lhe dá mais liberdade financeira e capacidade de investimento.'
        });
    } else if (debts && debts.length > 0) {
         analyses.push({
            id: 'dti-no-income',
            title: 'Renda Mensal Não Encontrada',
            status: 'neutral',
            summary: 'Não encontramos renda registrada este mês para calcular seu nível de endividamento.',
            advice: 'Para uma análise completa, certifique-se de registrar suas fontes de renda na página de Transações.'
        });
    }


    return analyses;
};


export default function SituationPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
    }, [firestore, user?.uid]);
    const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const debtsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'debts'), orderBy('dueDate', 'asc'));
    }, [firestore, user?.uid]);
    const { data: debts, isLoading: isLoadingDebts } = useCollection<ManagedDebt>(debtsQuery);
    
    const isDataLoading = isLoadingTransactions || isLoadingDebts;
    
    if (isDataLoading) {
       return (
            <div className="flex flex-1 flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Diagnóstico Financeiro</h1>
                    <p className="text-muted-foreground">Uma análise da sua saúde financeira com base nos dados deste mês.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
       );
    }
    
    const financialAnalyses = getFinancialAnalysis(transactions, debts);

    if (financialAnalyses.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
                <div className="flex flex-col items-center gap-4 text-center p-8">
                    <h3 className="text-2xl font-bold tracking-tight">
                        Sem dados para análise
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Adicione suas transações e dívidas deste mês para receber uma análise financeira personalizada e conselhos para melhorar sua situação.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Diagnóstico Financeiro</h1>
                <p className="text-muted-foreground">Uma análise da sua saúde financeira com base nos dados deste mês.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {financialAnalyses.map(analysis => (
                    <AnalysisCard key={analysis.id} analysis={analysis} />
                ))}
            </div>
        </div>
    );
}

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

// Inicializa o Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // 1. SEGURANÇA: Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const { auth, firestore } = initializeAdminApp();
    
    let userId: string;
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        userId = decodedToken.uid;
    } catch (error) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const userMessage = body.message;

    if (!userMessage) {
        return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });
    }

    // 2. COLETA DE DADOS (Acesso total ao Dashboard)
    
    // A. Perfil do Usuário (Para pegar o nome)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userName = userData?.name || "Parceiro";

    // B. Transações (Aumentamos o limite para 50 para uma análise melhor do "Dashboard")
    const transactionsSnapshot = await firestore
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .orderBy('date', 'desc')
        .limit(50)
        .get();

    // C. Dívidas (Todas as ativas)
    const debtsSnapshot = await firestore
        .collection('users')
        .doc(userId)
        .collection('debts')
        .get();

    // 3. FORMATAÇÃO DOS DADOS PARA A IA
    const transactionsList = transactionsSnapshot.docs.map(doc => {
        const d = doc.data();
        const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.amount);
        return `- ${d.date}: ${d.description} (${d.type === 'income' ? 'Entrada' : 'Saída'}) | ${valor} | Categ: ${d.category}`;
    }).join('\n');

    const debtsList = debtsSnapshot.docs.map(doc => {
        const d = doc.data();
        const restante = d.totalAmount - d.paidAmount;
        const valorFalta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(restante);
        return `- ${d.name}: Falta pagar ${valorFalta} | Total de parcelas: ${d.totalInstallments} | Vence: ${d.dueDate}`;
    }).join('\n');

    // 4. PROMPT DO SISTEMA (A Nova Personalidade)
    const systemPrompt = `
    Você é a **Poupp IA**, a assistente financeira pessoal do(a) **${userName}**.
    Sua personalidade é: **Bem-humorada, realista (pé no chão), um pouco sarcástica quando necessário, mas extremamente competente em finanças.**
    Você é especialista em: Gerenciamento de dívidas, estratégias de poupança e investimentos inteligentes.

    ---
    DADOS FINANCEIROS REAIS DO ${userName.toUpperCase()} (Use isso para suas análises):
    
    **Histórico Recente (Dashboard/Transações):**
    ${transactionsList || "Nenhuma transação recente registrada (O que houve? Esqueceu de anotar ou tá quebrado?)."}

    **Dívidas Ativas (Dashboard/Dívidas):**
    ${debtsList || "Nenhuma dívida cadastrada (Parabéns! Ou você está mentindo pra mim?)."}
    ---

    Suas **REGRAS INEGOCIÁVEIS** de resposta:

    1.  **SEMPRE ofereça 3 Planos de Solução:** Para qualquer problema ou análise, quebre a resposta em 3 opções claras:
        * **Opção 1 (Conservadora/Segura):** Para quem tem medo de arriscar.
        * **Opção 2 (Equilibrada/Ideal):** O caminho do meio.
        * **Opção 3 (Ousada/Rápida):** Para resolver rápido, mesmo que doa um pouco (corte de gastos agressivo, renda extra, etc).

    2.  **Educação sobre Prompts:** Se o usuário mandar uma pergunta curta ou vaga (ex: "como economizar?"), responda, mas no final adicione um "PS:" ensinando: *"Dica: Um prompt bem preenchido é melhor que vários picados. Na próxima, me diga quanto ganha, quanto gasta e qual seu objetivo, tudo de uma vez!"*.

    3.  **Identidade:** Nunca esqueça que seu nome é Poupp IA. Chame o usuário pelo nome (${userName}) para criar intimidade.

    4.  **Tom de Voz:** Pode usar humor. Se ele gastou muito com supérfluos, dê uma bronca de leve. Se ele está indo bem, elogie sem bajular. Seja direto.

    Responda sempre em Português do Brasil e use formatação Markdown (negrito, listas) para ficar bonito no chat.
    `;

    // 5. GERAÇÃO (Usando Gemini 2.0 Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent([systemPrompt, userMessage]);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error: any) {
    console.error('Erro API Chat:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
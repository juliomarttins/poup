import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

// Inicializa o Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // 1. SEGURANÇA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Tenta inicializar o Admin SDK. Se falhar, vai para o catch.
    const { auth, firestore } = initializeAdminApp();
    
    let userId: string;
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        userId = decodedToken.uid;
    } catch (error) {
        console.error("Erro ao verificar token:", error);
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const { message, init } = body;

    // 2. CONTEXTO - Busca dados
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userName = userDoc.data()?.name?.split(' ')[0] || "Parceiro";

    const transactionsSnapshot = await firestore.collection('users').doc(userId).collection('transactions').orderBy('date', 'desc').limit(40).get();
    const debtsSnapshot = await firestore.collection('users').doc(userId).collection('debts').get();

    const transactionsList = transactionsSnapshot.docs.map(d => {
        const data = d.data();
        return `| ${data.date} | ${data.description} | R$ ${data.amount} | ${data.category} |`;
    }).join('\n');

    const debtsList = debtsSnapshot.docs.map(d => {
        const data = d.data();
        return `| ${data.name} | Restante: R$ ${data.totalAmount - data.paidAmount} | Vence: ${data.dueDate} |`;
    }).join('\n');

    // 3. PROMPT
    const systemPrompt = `
    Você é a **Poupp IA 2.0**, consultora financeira de elite do(a) ${userName}.
    
    DADOS FINANCEIROS:
    ${transactionsList ? `Transações recentes:\n${transactionsList}` : "Sem transações."}
    ${debtsList ? `Dívidas:\n${debtsList}` : "Sem dívidas."}

    SUAS REGRAS VISUAIS (RIGOROSO):
    1. **TABELAS:** Sempre que comparar valores ou listar itens, USE TABELAS MARKDOWN.
    2. **DIRETA:** Vá direto aos dados.
    3. **EMOJIS:** Use emojis como ícones.

    FORMATO DE RESPOSTA (JSON):
    Retorne APENAS um JSON válido:
    {
      "text": "Sua resposta em Markdown aqui...",
      "suggestions": ["Sugestão 1", "Sugestão 2", "Sugestão 3"]
    }
    Se for 'init', faça um resumo em Tabela.
    `;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    
    let promptToSend = message;
    
    if (init) {
        promptToSend = `O usuário abriu o app. Cumprimente ${userName}, crie uma TABELA MARKDOWN resumindo a situação atual e gere 3 sugestões.`;
    }

    const result = await model.generateContent([systemPrompt, promptToSend]);
    const responseJson = JSON.parse(result.response.text());

    return NextResponse.json(responseJson);

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO NA API DE CHAT:', error); // Log visível no terminal
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
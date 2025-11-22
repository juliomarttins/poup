import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // 1. SEGURANÇA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
    
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
    const { message, init } = body; // 'init' indica que a tela acabou de abrir

    // 2. CONTEXTO FINANCEIRO (Busca rápida)
    // Pegamos o nome
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userName = userDoc.data()?.name?.split(' ')[0] || "Parceiro";

    const transactionsSnapshot = await firestore.collection('users').doc(userId).collection('transactions').orderBy('date', 'desc').limit(30).get();
    const debtsSnapshot = await firestore.collection('users').doc(userId).collection('debts').get();

    const transactionsList = transactionsSnapshot.docs.map(d => {
        const data = d.data();
        return `- ${data.date}: ${data.description} (R$ ${data.amount}) [${data.category}]`;
    }).join('\n');

    const debtsList = debtsSnapshot.docs.map(d => {
        const data = d.data();
        return `- Dívida: ${data.name} | Falta: R$ ${data.totalAmount - data.paidAmount}`;
    }).join('\n');

    // 3. PROMPT OTIMIZADO PARA VISUAL E CONCISÃO
    // Instruímos a IA a responder SEMPRE em JSON para o front montar os botões
    const systemPrompt = `
    Você é a **Poupp IA**, assistente do(a) ${userName}.
    
    DADOS REAIS:
    Transações: \n${transactionsList || "Sem dados recentes."}
    Dívidas: \n${debtsList || "Sem dívidas."}

    SUA MISSÃO:
    1. **Personalidade:** Bem-humorada, realista, DIRETA AO PONTO.
    2. **Formatação:** - Use MUITOS Emojis para dar cor (💰, 📉, 🚨, ✅).
       - Use **Negrito** para valores e conclusões.
       - Máximo de 2 ou 3 frases por bloco de texto. Nada de textão.
    3. **Planos:** Se pedir ajuda, dê 3 opções (Conservadora 🐢, Equilibrada ⚖️, Ousada 🚀).

    FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
    Você deve retornar APENAS um objeto JSON válido com esta estrutura:
    {
      "text": "Sua resposta formatada aqui...",
      "suggestions": ["Sugestão curta 1", "Sugestão curta 2", "Sugestão curta 3"]
    }
    
    As 'suggestions' devem ser perguntas curtas (máx 5 palavras) que o usuário provavelmente faria agora baseadas nos dados dele (ex: "Gastos com Uber?", "Como quitar dívida X?", "Resumo do mês").
    `;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" } // Força JSON
    });
    
    let promptToSend = message;
    
    // Se for inicialização, pedimos uma saudação + sugestões iniciais
    if (init) {
        promptToSend = `O usuário acabou de abrir o chat. Dê uma saudação curta e bem humorada usando o nome ${userName}, faça um micro resumo de 1 linha sobre a situação atual, e gere 3 botões de perguntas chaves nas sugestões.`;
    }

    const result = await model.generateContent([systemPrompt, promptToSend]);
    const responseText = result.response.text();
    
    // Parse do JSON gerado pela IA
    const responseJson = JSON.parse(responseText);

    return NextResponse.json(responseJson);

  } catch (error: any) {
    console.error('Erro API:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
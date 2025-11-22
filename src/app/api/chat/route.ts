import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // 1. SEGURANÇA
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
    const { message, init } = body;

    // 2. CONTEXTO E PERFIS
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userName = userData?.name?.split(' ')[0] || "Parceiro";

    // Cria um mapa de ID -> Nome do Perfil (ex: '123' -> 'Júlio')
    const profilesMap: Record<string, string> = {};
    if (userData?.profiles && Array.isArray(userData.profiles)) {
        userData.profiles.forEach((p: any) => {
            if (p.id && p.name) profilesMap[p.id] = p.name;
        });
    }

    const transactionsSnapshot = await firestore.collection('users').doc(userId).collection('transactions').orderBy('date', 'desc').limit(50).get();
    const debtsSnapshot = await firestore.collection('users').doc(userId).collection('debts').get();

    // Formata transações INCLUINDO QUEM GASTOU
    const transactionsList = transactionsSnapshot.docs.map(d => {
        const data = d.data();
        const quem = profilesMap[data.profileId] || "Conta"; // Tenta achar o nome pelo ID
        return `| ${data.date} | ${quem} | ${data.description} | R$ ${data.amount} | ${data.category} |`;
    }).join('\n');

    const debtsList = debtsSnapshot.docs.map(d => {
        const data = d.data();
        return `| ${data.name} | Restante: R$ ${data.totalAmount - data.paidAmount} | Vence: ${data.dueDate} |`;
    }).join('\n');

    // 3. PROMPT OTIMIZADO (RESPOSTA HÍBRIDA)
    const systemPrompt = `
    Você é a **Poupp IA 2.0**, consultora financeira do(a) ${userName}.
    
    DADOS (Use a coluna 'Quem' para identificar o responsável):
    Transações (Data | Quem | Descrição | Valor | Categoria):
    ${transactionsList || "Sem transações."}
    
    Dívidas:
    ${debtsList || "Sem dívidas."}

    SUAS REGRAS DE RESPOSTA:
    1. **RESPOSTA DIRETA PRIMEIRO:** Se o usuário perguntar "quem gastou mais?", RESPONDA DIRETAMENTE (ex: "Quem mais gastou foi o **Júlio**, com R$ 500"). Não jogue só a tabela. Explique o "porquê" resumidamente.
    2. **TABELA DE APOIO:** DEPOIS da resposta direta, use uma Tabela Markdown para detalhar os dados, se necessário.
    3. **ANÁLISE DE PERFIL:** Você agora sabe quem fez cada gasto. Use isso para comparar hábitos entre as pessoas da família (ex: "O Júlio gasta muito com Lazer, já a Maria gasta mais com Mercado").
    4. **FORMATO:** Use Markdown rico (negrito, tabelas) e emojis para ilustrar.

    FORMATO DE SAÍDA (JSON):
    {
      "text": "Sua resposta conversacional em Markdown (resposta direta + tabela se precisar)...",
      "suggestions": ["Sugestão 1", "Sugestão 2", "Sugestão 3"]
    }
    
    Se for 'init', dê um resumo geral e compare quem está gastando mais na família.
    `;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    
    let promptToSend = message;
    
    if (init) {
        promptToSend = `O usuário abriu o app. Cumprimente ${userName}.
        Analise quem (qual perfil) gastou mais nos últimos lançamentos e dê um resumo geral em tabela.
        Gere 3 sugestões de perguntas.`;
    }

    const result = await model.generateContent([systemPrompt, promptToSend]);
    const responseJson = JSON.parse(result.response.text());

    return NextResponse.json(responseJson);

  } catch (error: any) {
    console.error('Erro API Chat:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
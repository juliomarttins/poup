import { NextResponse } from 'next/server';
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
    const { message, init } = body;

    // 2. CONTEXTO
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userName = userDoc.data()?.name?.split(' ')[0] || "Parceiro";

    const transactionsSnapshot = await firestore.collection('users').doc(userId).collection('transactions').orderBy('date', 'desc').limit(40).get();
    const debtsSnapshot = await firestore.collection('users').doc(userId).collection('debts').get();

    // Prepara dados para a IA ler
    const transactionsList = transactionsSnapshot.docs.map(d => {
        const data = d.data();
        return `| ${data.date} | ${data.description} | R$ ${data.amount} | ${data.category} |`;
    }).join('\n');

    const debtsList = debtsSnapshot.docs.map(d => {
        const data = d.data();
        return `| ${data.name} | Restante: R$ ${data.totalAmount - data.paidAmount} | Vence: ${data.dueDate} |`;
    }).join('\n');

    // 3. PROMPT OTIMIZADO PARA TABELAS E ORGANIZAÇÃO
    const systemPrompt = `
    Você é a **Poupp IA 2.0**, consultora financeira de elite do(a) ${userName}.
    
    DADOS FINANCEIROS:
    ${transactionsList ? `Transações recentes:\n${transactionsList}` : "Sem transações."}
    ${debtsList ? `Dívidas:\n${debtsList}` : "Sem dívidas."}

    SUAS REGRAS VISUAIS (RIGOROSO):
    1. **TABELAS:** Sempre que comparar valores, categorias ou listar mais de 3 itens, USE TABELAS MARKDOWN. O usuário pediu "linhas e colunas", então obedeça.
       Exemplo de tabela:
       | Categoria | Valor | Status |
       | :--- | :--- | :--- |
       | iFood | R$ 200 | 🚨 Alto |

    2. **LISTAS:** Use listas com bullet points (•) para explicar planos.
    3. **DIRETA:** Sem texto de introdução longo. Vá direto aos dados.
    4. **EMOJIS:** Use emojis como ícones no início de títulos (ex: 📊 **Análise**, 🎯 **Meta**).

    FORMATO DE RESPOSTA (JSON):
    Retorne APENAS um JSON válido:
    {
      "text": "Sua resposta em Markdown aqui...",
      "suggestions": ["Sugestão 1", "Sugestão 2", "Sugestão 3"]
    }

    Se for 'init' (início), faça um resumo em Tabela dos top 3 gastos do mês e sugira ações.
    `;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    
    let promptToSend = message;
    
    if (init) {
        promptToSend = `O usuário abriu o app.
        1. Cumprimente pelo nome (${userName}).
        2. Crie uma TABELA MARKDOWN resumindo a situação atual (Entradas vs Saídas ou Top Gastos).
        3. Gere 3 sugestões de perguntas curtas e diretas sobre esses dados.`;
    }

    const result = await model.generateContent([systemPrompt, promptToSend]);
    const responseJson = JSON.parse(result.response.text());

    return NextResponse.json(responseJson);

  } catch (error: any) {
    console.error('Erro API:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
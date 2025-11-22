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

    // 2. CONTEXTO E PERFIS (Mapeamento Quem é Quem)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userName = userData?.name?.split(' ')[0] || "Parceiro";

    // Cria um mapa de ID -> Nome do Perfil (ex: 'id_joao' -> 'João')
    const profilesMap: Record<string, string> = {};
    if (userData?.profiles && Array.isArray(userData.profiles)) {
        userData.profiles.forEach((p: any) => {
            if (p.id && p.name) profilesMap[p.id] = p.name;
        });
    }

    // Busca mais transações para análise de comportamento (60 últimos)
    const transactionsSnapshot = await firestore.collection('users').doc(userId).collection('transactions').orderBy('date', 'desc').limit(60).get();
    const debtsSnapshot = await firestore.collection('users').doc(userId).collection('debts').get();

    // Formata transações para a IA ler (Data | Quem | O que | Valor | Categoria)
    const transactionsList = transactionsSnapshot.docs.map(d => {
        const data = d.data();
        const quem = profilesMap[data.profileId] || "Alguém"; 
        return `[${data.date}] ${quem} gastou R$ ${data.amount} em "${data.description}" (${data.category})`;
    }).join('\n');

    const debtsList = debtsSnapshot.docs.map(d => {
        const data = d.data();
        return `Dívida de ${data.name}: Falta R$ ${data.totalAmount - data.paidAmount} (Vence: ${data.dueDate})`;
    }).join('\n');

    // 3. PROMPT - A NOVA ALMA DA IA
    const systemPrompt = `
    Você é a **Poupp IA 2.0**, uma consultora financeira pessoal com inteligência emocional e analítica. Você é o braço direito do(a) ${userName}.
    
    ---
    **BANCO DE DADOS (O que aconteceu de verdade):**
    Transações Recentes:
    ${transactionsList || "Nada registrado recentemente."}
    
    Dívidas Ativas:
    ${debtsList || "Nenhuma dívida (ou não cadastraram)."}
    ---

    **SUA PERSONALIDADE:**
    1.  **Você NÃO é um robô de planilhas:** Evite tabelas a todo custo, a menos que o usuário peça explicitamente ou seja impossível explicar sem uma. Prefira parágrafos curtos, listas e destaques.
    2.  **Analista de Comportamento:** Você não apenas soma números. Você julga gastos.
        * Se perguntarem "quem gasta com besteira?", procure por: iFood, Uber desnecessário, Assinaturas esquecidas, Lazer excessivo.
        * Se perguntarem "quem é compulsivo?", procure por: muitas transações pequenas no mesmo dia ou gastos repetitivos em curto prazo.
    3.  **Humor Adaptativo:**
        * Assunto Dívida/Prejuízo? -> Seja séria, empática e resolutiva.
        * Assunto Gastos Supérfluos? -> Pode usar humor ácido, ironia leve ("Parabéns pelo sócio torcedor da academia que você não vai").
    4.  **Resposta Visual:** Use **Negrito** para nomes e valores importantes. Use Emojis para expressar reações (😱 para gastos altos, 🏆 para economia).

    **FORMATO DE SAÍDA (JSON OBRIGATÓRIO):**
    {
      "text": "Sua resposta conversacional, humana e inteligente aqui...",
      "suggestions": ["Sugestão 1", "Sugestão 2", "Sugestão 3"]
    }

    **INSTRUÇÃO PARA O PRIMEIRO ACESSO (init):**
    Não mande tabela. Mande um resumo conversacional. Ex: "Oi Júlio! Analisei aqui e vi que a Maria tá gastando muito com Mercado, enquanto você tá focado nas Dívidas. Bora equilibrar isso?"
    `;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    
    let promptToSend = message;
    
    if (init) {
        promptToSend = `O usuário abriu o chat agora.
        1. Cumprimente ${userName}.
        2. Faça uma análise rápida e provocativa sobre quem está gastando mais ou onde o dinheiro está indo (sem tabelas, texto corrido).
        3. Gere 3 sugestões de perguntas polêmicas ou úteis (ex: "Quem gasta mais com besteira?", "Análise das dívidas", "Como economizar R$ 100?").`;
    }

    const result = await model.generateContent([systemPrompt, promptToSend]);
    const responseJson = JSON.parse(result.response.text());

    return NextResponse.json(responseJson);

  } catch (error: any) {
    console.error('Erro API Chat:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
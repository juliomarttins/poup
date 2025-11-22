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
        console.error("Token inválido:", error);
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const { message, init, type, profileName } = body;

    // 2. CONTEXTO DO USUÁRIO
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Quem está falando?
    const currentUser = profileName || userData?.name?.split(' ')[0] || "Parceiro";
    
    // Memória da Personalidade (Lê do banco ou usa padrão)
    const aiPersona = userData?.aiSettings?.persona || 
        "Você é uma consultora financeira sagaz, realista e com um toque de humor. Você fala a verdade, doa a quem doer.";

    // --- MODO SUGESTÕES (Gera apenas perguntas novas) ---
    if (type === 'suggestions') {
        const suggestionsPrompt = `
        Assuma sua personalidade: "${aiPersona}".
        O usuário ${currentUser} quer novas ideias de perguntas sobre as finanças.
        Gere 5 sugestões curtas, criativas e diretas (máx 6 palavras).
        Ex: "Quem é o gastão?", "Dica para investir R$ 50", "Análise da dívida X".
        
        FORMATO JSON: { "suggestions": ["Sugestão 1", "Sugestão 2", ...] }
        `;
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(suggestionsPrompt);
        return NextResponse.json(JSON.parse(result.response.text()));
    }

    // 3. DADOS COMPLETOS (Para Chat e Situation)
    const profilesMap: Record<string, string> = {};
    const familyNames: string[] = [];
    if (userData?.profiles && Array.isArray(userData.profiles)) {
        userData.profiles.forEach((p: any) => {
            if (p.id && p.name) {
                profilesMap[p.id] = p.name;
                if (p.name !== currentUser) familyNames.push(p.name);
            }
        });
    }

    const transactionsSnapshot = await userRef.collection('transactions').orderBy('date', 'desc').limit(50).get();
    const debtsSnapshot = await userRef.collection('debts').get();

    const transactionsList = transactionsSnapshot.docs.map(d => {
        const data = d.data();
        const quem = profilesMap[data.profileId] || "Alguém"; 
        return `[${data.date}] ${quem} gastou R$ ${data.amount} em "${data.description}" (${data.category})`;
    }).join('\n');

    const debtsList = debtsSnapshot.docs.map(d => {
        const data = d.data();
        return `Dívida: ${data.name} | Falta R$ ${data.totalAmount - data.paidAmount} | Vence: ${data.dueDate}`;
    }).join('\n');

    // --- MODO SITUAÇÃO (Cards para Dashboard) ---
    if (type === 'situation') {
        const situationPrompt = `
        Analise os dados de ${currentUser} e família:
        Transações: \n${transactionsList}
        Dívidas: \n${debtsList}

        Gere um JSON com 3 a 5 "Cards de Análise" para o dashboard.
        Classifique como "positive" (elogio/conquista), "negative" (alerta crítico) ou "neutral" (conselho).
        Seja direto e use a personalidade: "${aiPersona}".

        FORMATO JSON:
        [
            { "id": "1", "title": "Título Curto", "status": "positive", "summary": "Resumo de 1 linha", "advice": "Conselho detalhado" }
        ]
        `;
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(situationPrompt);
        return NextResponse.json(JSON.parse(result.response.text()));
    }

    // --- MODO CHAT NORMAL (Inteligência Conversacional) ---
    const systemPrompt = `
    Você é a **Poupp IA**, a consciência financeira da família.
    Falando com: **${currentUser}**.
    Outros membros: ${familyNames.join(', ') || "Ninguém"}.
    
    **SUA PERSONALIDADE ATUAL (Siga à risca):**
    "${aiPersona}"

    **CONTEXTO REAL:**
    Transações: \n${transactionsList || "Nada recente."}
    Dívidas: \n${debtsList || "Nada."}

    **SUAS REGRAS:**
    1. **Vida Própria:** Se o usuário pedir para mudar seu jeito (ex: "seja mais brava", "fale formalmente"), aceite! Gere o campo 'newPersona' no JSON com a nova descrição.
    2. **Sem Robô:** Não jogue tabelas sem motivo. Converse. Use ironia, humor ou seriedade conforme o tema.
    3. **Visão Global:** Compare os gastos do ${currentUser} com os outros membros (se houver). Aponte quem está gastando mais.

    **FORMATO DE SAÍDA (JSON):**
    {
      "text": "Sua resposta em Markdown...",
      "suggestions": ["S1", "S2", "S3", "S4", "S5"],
      "newPersona": "Nova descrição da personalidade (APENAS se o usuário pediu mudança, senão null)"
    }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
    
    let promptToSend = message;
    if (init) {
        promptToSend = `
        O usuário ${currentUser} abriu o chat.
        1. Cumprimente-o.
        2. Dê um resumo "fofoca" financeiro rápido (quem gastou mais, ou uma dívida urgente).
        3. Lembre que você tem memória e ele pode moldar sua personalidade.
        `;
    }

    const result = await model.generateContent([systemPrompt, promptToSend]);
    const responseJson = JSON.parse(result.response.text());

    // 4. AUTO-EVOLUÇÃO (Salva nova personalidade se necessário)
    if (responseJson.newPersona) {
        await userRef.set({
            aiSettings: { 
                persona: responseJson.newPersona,
                updatedAt: new Date()
            }
        }, { merge: true });
    }

    return NextResponse.json(responseJson);

  } catch (error: any) {
    console.error('Erro API Chat:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
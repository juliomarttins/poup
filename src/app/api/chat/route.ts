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
    const { message, init, type, profileName } = body; // profileName = Quem está logado agora (ex: Liandra)

    // 2. CONTEXTO
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // Define quem é o usuário logado e quem são os outros
    const currentUser = profileName || userData?.name?.split(' ')[0] || "Parceiro";
    
    // Mapeamento
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

    const transactionsSnapshot = await firestore.collection('users').doc(userId).collection('transactions').orderBy('date', 'desc').limit(50).get();
    const debtsSnapshot = await firestore.collection('users').doc(userId).collection('debts').get();

    const transactionsList = transactionsSnapshot.docs.map(d => {
        const data = d.data();
        const quem = profilesMap[data.profileId] || "Alguém";
        return `[${data.date}] ${quem}: ${data.description} (R$ ${data.amount}) - ${data.category}`;
    }).join('\n');

    const debtsList = debtsSnapshot.docs.map(d => {
        const data = d.data();
        return `Dívida: ${data.name} | Falta: R$ ${data.totalAmount - data.paidAmount} | Vence: ${data.dueDate}`;
    }).join('\n');

    const aiPersona = userData?.aiSettings?.persona || "Você é uma consultora financeira sagaz, realista e amiga.";

    // --- MODO 1: ANÁLISE DE SITUAÇÃO (Para a página /dashboard/situation) ---
    if (type === 'situation') {
        const situationPrompt = `
        Analise os dados financeiros de ${currentUser} e família.
        Transações: \n${transactionsList}
        Dívidas: \n${debtsList}

        Gere um JSON com 3 análises distintas para popular cards na tela:
        1. "positive": Algo bom que aconteceu (ou o menos pior).
        2. "negative": O ponto crítico que precisa de atenção imediata.
        3. "neutral": Uma observação ou conselho estratégico.

        FORMATO JSON OBRIGATÓRIO:
        [
            { "id": "1", "title": "Título Curto", "status": "positive", "summary": "Resumo de 1 linha", "advice": "Conselho prático e direto." },
            { "id": "2", "title": "Título Curto", "status": "negative", "summary": "Resumo de 1 linha", "advice": "Bronca ou alerta direto." },
            { "id": "3", "title": "Título Curto", "status": "neutral", "summary": "Resumo de 1 linha", "advice": "Estratégia para o futuro." }
        ]
        `;
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(situationPrompt);
        return NextResponse.json(JSON.parse(result.response.text()));
    }

    // --- MODO 2: CHAT NORMAL ---
    const systemPrompt = `
    Você é a **Poupp IA**, falando diretamente com **${currentUser}**.
    Outros membros da família citados nos dados: ${familyNames.join(', ') || "Ninguém"}.

    **DADOS REAIS:**
    ${transactionsList || "Nada recente."}
    ${debtsList || "Nada."}

    **SUA PERSONALIDADE (${aiPersona}):**
    1. **Fale com o ${currentUser}:** Se a Liandra está logada, fale com a Liandra. Se o Júlio gastou, fale "O Júlio gastou", não "você gastou".
    2. **Anti-Robô:** Evite jogar números soltos ("Você gastou R$ 453,20"). Diga "Você gastou quase quinhentos reais". Seja conversacional.
    3. **Conselheira, não Calculadora:** Só use tabelas se pedirem. Prefira parágrafos curtos, frases de impacto e emojis.
    4. **Sugestões Infinitas:** Gere de 4 a 6 sugestões de perguntas curtas e interessantes para o usuário clicar.

    FORMATO DE SAÍDA (JSON):
    {
      "text": "Resposta em Markdown...",
      "suggestions": ["Sugestão 1", "Sugestão 2", "Sugestão 3", "Sugestão 4", "Sugestão 5"],
      "newPersona": null
    }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
    
    let promptToSend = message;
    if (init) {
        promptToSend = `O usuário ${currentUser} abriu o chat.
        1. Cumprimente-o pelo nome correto.
        2. Dê um resumo "fofoca" financeiro (quem gastou mais, alguma dívida vencendo).
        3. Lembre que você aprende com ele.
        4. Gere 5+ sugestões de perguntas variadas (curtas).`;
    }

    const result = await model.generateContent([systemPrompt, promptToSend]);
    const responseJson = JSON.parse(result.response.text());

    if (responseJson.newPersona) {
        await firestore.collection('users').doc(userId).set({ aiSettings: { persona: responseJson.newPersona } }, { merge: true });
    }

    return NextResponse.json(responseJson);

  } catch (error: any) {
    console.error('Erro API:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
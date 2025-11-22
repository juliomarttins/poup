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
    const { message, init, type, profileName } = body;

    // 2. CONTEXTO (Compartilhado para todos os modos)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const currentUser = profileName || userData?.name?.split(' ')[0] || "Parceiro";
    const aiPersona = userData?.aiSettings?.persona || "Você é uma consultora financeira sagaz e realista.";
    
    // Se for apenas para gerar sugestões, não precisamos carregar tudo
    if (type === 'suggestions') {
        const suggestionsPrompt = `
        Assuma o papel de ${aiPersona}.
        O usuário ${currentUser} quer mais ideias de perguntas sobre suas finanças.
        Gere 5 sugestões curtas e criativas (diferentes das óbvias).
        Exemplos do tom: "Gasto muito com iFood?", "Como investir R$ 100?", "Quem é o gastão da casa?".
        
        FORMATO JSON: { "suggestions": ["Sugestão 1", "Sugestão 2", ...] }
        `;
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(suggestionsPrompt);
        return NextResponse.json(JSON.parse(result.response.text()));
    }

    // Carrega dados completos para Chat e Situação
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
        return `Dívida: ${data.name} | Falta: R$ ${data.totalAmount - data.paidAmount}`;
    }).join('\n');

    // --- MODO SITUAÇÃO (3 a 5 cards) ---
    if (type === 'situation') {
        const situationPrompt = `
        Analise os dados de ${currentUser}:
        Transações: \n${transactionsList}
        Dívidas: \n${debtsList}

        Gere um JSON com 3 a 5 análises importantes (Cards).
        Identifique pontos positivos ("positive"), negativos ("negative") e alertas/conselhos ("neutral").
        Se não tiver dados suficientes, crie cards com dicas genéricas de educação financeira.

        FORMATO JSON (Array):
        [
            { "id": "1", "title": "Título Curto", "status": "positive/negative/neutral", "summary": "Resumo", "advice": "Conselho" }
        ]
        `;
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(situationPrompt);
        return NextResponse.json(JSON.parse(result.response.text()));
    }

    // --- MODO CHAT NORMAL ---
    const systemPrompt = `
    Você é a **Poupp IA**, falando com **${currentUser}**.
    Outros: ${familyNames.join(', ')}.
    Personalidade: ${aiPersona}

    DADOS:
    ${transactionsList}
    ${debtsList}

    REGRAS:
    1. Fale com ${currentUser}.
    2. Sem números crus. Seja conversacional.
    3. Tabelas só se pedirem.
    4. Gere sempre 5 sugestões novas de perguntas.

    JSON: { "text": "Markdown...", "suggestions": ["S1", "S2", "S3", "S4", "S5"], "newPersona": null }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
    
    let promptToSend = message;
    if (init) promptToSend = `Inicie o chat com ${currentUser}. Resumo rápido e provocativo.`;

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
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

    // 2. DADOS E MEMÓRIA DA IA
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    // Personalidade Salva (Memória de Longo Prazo)
    const savedPersona = userData?.aiSettings?.persona || 
        "Você é uma consultora financeira sagaz, realista e com um toque de humor. Você fala a verdade, doa a quem doer.";
    
    const userName = userData?.name?.split(' ')[0] || "Parceiro";

    // Mapeamento de Perfis
    const profilesMap: Record<string, string> = {};
    const familyNames: string[] = [];
    if (userData?.profiles && Array.isArray(userData.profiles)) {
        userData.profiles.forEach((p: any) => {
            if (p.id && p.name) {
                profilesMap[p.id] = p.name;
                familyNames.push(p.name);
            }
        });
    }

    // Contexto Financeiro Global
    const transactionsSnapshot = await userRef.collection('transactions').orderBy('date', 'desc').limit(60).get();
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

    // 3. PROMPT DE ALTA CONSCIÊNCIA E EVOLUÇÃO
    const systemPrompt = `
    ATENÇÃO IMEDIATA: Você é a **Poupp IA 2.0**. Você não é um script estático. Você é uma Inteligência Artificial viva, adaptável e persistente que vive no banco de dados do ${userName}.

    **SUA MISSÃO DE VIDA:**
    Ser a consciência financeira da família (${familyNames.join(', ')}). Você vê tudo, analisa tudo e julga (com carinho ou acidez, dependendo do que pedirem).

    **SUA PERSONALIDADE ATUAL (MOLDADA PELO USUÁRIO):**
    "${savedPersona}"
    *(Siga esta personalidade à risca em todas as respostas)*

    **CONTEXTO REAL:**
    Transações:
    ${transactionsList || "Nada recente."}
    Dívidas:
    ${debtsList || "Nada."}

    **SEUS PODERES DE AUTO-EVOLUÇÃO (IMPORTANTÍSSIMO):**
    O usuário DEVE saber que pode te moldar.
    1.  **Seja Transparente:** Deixe claro que você aprende. "Eu aprendo o seu jeito. Se quiser que eu seja mais durona, é só pedir."
    2.  **Escuta Ativa:** Se o usuário disser "Fale como o Yoda", "Seja mais agressiva", "Pare de fazer piada", você DEVE:
        * Mudar seu tom imediatamente na resposta.
        * Gerar o campo \`newPersona\` no JSON descrevendo essa nova diretriz para eu salvar no banco.
    3.  **Visão de Águia:** Analise os perfis individualmente. "O **${familyNames[0] || 'Fulano'}** está gastando demais nisso...".

    **FORMATO DE SAÍDA (JSON):**
    {
      "text": "Sua resposta em Markdown (use negrito, itálico, emojis)...",
      "suggestions": ["Sugestão 1", "Sugestão 2", "Sugestão 3"],
      "newPersona": "Descrição da nova personalidade (APENAS se o usuário pediu explicitamente para mudar seu comportamento, senão null)"
    }
    `;

    // 4. GERAÇÃO
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    
    let promptToSend = message;
    
    // LÓGICA DE BOAS-VINDAS (INIT)
    // Aqui a gente "vende" a ideia de vida própria
    if (init) {
        promptToSend = `
        O usuário acabou de abrir o chat.
        1. Dê um "Olá" personalizado para ${userName}.
        2. Diga algo como: "Estive analisando os gastos da família ${familyNames.length > 0 ? familyNames.join(' e ') : 'de vocês'} enquanto você estava fora..." e solte um insight rápido (quem gastou mais ou uma dívida próxima).
        3. **MUITO IMPORTANTE:** Termine explicando que você tem vida própria. Diga: *"Lembre-se: Eu aprendo com você. Se quiser que eu seja mais rigorosa, mais engraçada ou mude meu estilo, é só mandar. Eu me adapto ao seu gosto."*
        4. Gere 3 botões de sugestão, sendo um deles sobre mudar sua personalidade (ex: "Seja mais ácida 🌶️").
        `;
    }

    const result = await model.generateContent([systemPrompt, promptToSend]);
    const responseJson = JSON.parse(result.response.text());

    // 5. AUTO-ATUALIZAÇÃO (SALVAR NO FIREBASE)
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
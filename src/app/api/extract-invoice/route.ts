import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

// Verifica se a chave existe
const apiKey = process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    // 0. Validação de Infraestrutura
    if (!genAI) {
        console.error("FALHA: GOOGLE_API_KEY não definida nas variáveis de ambiente.");
        return NextResponse.json({ error: 'Servidor mal configurado: Falta API Key do Google.' }, { status: 500 });
    }

    // 1. Segurança (Token Firebase)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        const { auth } = initializeAdminApp();
        await auth.verifyIdToken(idToken);
    } catch (error: any) {
        console.error("Erro de Autenticação:", error);
        // Em ambiente de desenvolvimento local, às vezes o Admin SDK falha se não tiver credenciais.
        // Se quiser testar sem verificar token estritamente, comente o return abaixo (NÃO RECOMENDADO EM PROD).
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }

    // 2. Processamento do Arquivo
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo recebido.' }, { status: 400 });
    }

    // Validação de tamanho (Safety Net para Vercel Serverless Function que tem limite de payload)
    if (file.size > 4.5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo muito grande. O limite é 4.5MB.' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    // 3. Inteligência (Gemini Flash 1.5)
    // Usamos o modelo Flash que é mais rápido e barato para OCR
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Atue como um extrator de dados financeiros (OCR inteligente).
    Analise este documento (conta, boleto, nota fiscal ou recibo).
    Extraia os dados para preencher um sistema de gestão de dívidas.
    
    Retorne APENAS um JSON com estes campos (se não encontrar, tente deduzir ou deixe null):
    {
        "name": "Nome da empresa/favorecido ou descrição curta (Ex: Energia Elétrica, Mercado Livre)",
        "totalAmount": 0.00 (Número float, valor total do documento),
        "dueDate": "YYYY-MM-DD" (Data de vencimento. Se não houver, use a data de hoje),
        "category": "Categoria sugerida (Moradia, Alimentação, Transporte, Lazer, Saúde, Educação, Veículo, Outros)",
        "totalInstallments": 1 (Se for parcelado ex: 1/10, coloque 10. Se à vista, 1),
        "paidInstallments": 0 (Se for a parcela 3/10, significa que pagou 2, então retorne 2. Se for novo, 0),
        "installmentAmount": 0.00 (Valor da parcela mensal)
    }
    `;

    console.log("Enviando para Gemini...");
    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: base64Data,
                mimeType: file.type
            }
        }
    ]);

    const text = result.response.text();
    console.log("Resposta Gemini:", text);
    
    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        console.error("Erro ao fazer parse do JSON:", text);
        return NextResponse.json({ error: 'A IA não retornou um formato válido.' }, { status: 500 });
    }

    return NextResponse.json(json);

  } catch (error: any) {
    console.error('CRASH API:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
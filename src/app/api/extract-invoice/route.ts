import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

export async function POST(req: Request) {
  try {
    // 1. Validação da Chave API (Diagnóstico de erro de servidor)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ 
            error: 'Erro no Servidor: A chave GOOGLE_API_KEY não está configurada no arquivo .env ou nas variáveis de ambiente.' 
        }, { status: 500 });
    }

    // 2. Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Você não está autenticado.' }, { status: 401 });
    }

    // 3. Validação do Arquivo
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo foi recebido.' }, { status: 400 });
    }

    // Limite de segurança para evitar timeout/crash (4MB)
    if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo muito grande (Máx: 4MB). Tente reduzir a foto.' }, { status: 413 });
    }

    // 4. Processamento com IA
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analise esta imagem/documento financeiro. Extraia os dados para preenchimento de dívida.
    Retorne APENAS um JSON com estes campos exatos:
    {
        "name": "Nome da empresa (Ex: Nubank, Energia)",
        "totalAmount": 0.00 (Valor total numérico),
        "dueDate": "YYYY-MM-DD" (Data de vencimento. Se não achar, use hoje),
        "category": "Categoria sugerida (Moradia, Alimentação, Veículo, Cartão, Outros)",
        "totalInstallments": 1 (Quantidade total de parcelas. Se for à vista, 1),
        "installmentAmount": 0.00 (Valor da parcela),
        "paidInstallments": 0 (Quantas já foram pagas. Ex: se é a parcela 3 de 10, pagou 2)
    }
    `;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: file.type } }
    ]);

    const responseText = result.response.text();
    
    let json;
    try {
        json = JSON.parse(responseText);
    } catch (e) {
        console.error("Erro de Parse JSON IA:", responseText);
        return NextResponse.json({ error: 'A IA leu o arquivo mas não conseguiu estruturar os dados.' }, { status: 500 });
    }

    return NextResponse.json(json);

  } catch (error: any) {
    console.error('Erro Fatal na API:', error);
    return NextResponse.json({ 
        error: error.message || 'Erro interno ao processar imagem.' 
    }, { status: 500 });
  }
}
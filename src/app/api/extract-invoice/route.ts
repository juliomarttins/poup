import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Chave API não configurada no servidor.' }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (file.size > 4.5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo muito grande (Máx 4.5MB).' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    // [CORREÇÃO] Usando gemini-2.0-flash para compatibilidade com sua chave
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analise este documento financeiro (nota fiscal, recibo, print de app).
    Extraia dados para uma transação.
    Retorne APENAS JSON:
    {
        "name": "Nome do estabelecimento ou serviço (Curto)",
        "totalAmount": 0.00 (Valor numérico positivo),
        "dueDate": "YYYY-MM-DD" (Data da transação),
        "category": "Categoria sugerida (Mercado, Transporte, Alimentação, Saúde, Lazer, Educação, Outros)"
    }
    `;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: file.type } }
    ]);

    const text = result.response.text();
    try {
        const json = JSON.parse(text);
        return NextResponse.json(json);
    } catch (e) {
        console.error("Erro parse:", text);
        return NextResponse.json({ error: 'Não foi possível ler os dados da imagem.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro API:', error);
    return NextResponse.json({ error: error.message || 'Erro interno.' }, { status: 500 });
  }
}
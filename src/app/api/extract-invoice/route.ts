import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Servidor sem chave API configurada.' }, { status: 500 });
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
    // Usando o modelo mais rápido e estável para OCR
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analise a imagem deste comprovante, nota fiscal ou recibo.
    Sua missão é extrair os dados para preenchimento automático de um formulário financeiro.
    
    Regras de Extração:
    1. "name": Identifique o nome do estabelecimento (Ex: "Mercado Livre", "Uber", "Restaurante X"). Seja conciso.
    2. "totalAmount": Encontre o valor TOTAL pago. Retorne APENAS NÚMERO (ex: 150.50). Se tiver símbolo de moeda, remova. Se não achar valor exato, estime o maior valor visível.
    3. "dueDate": Data da transação no formato YYYY-MM-DD. Se não houver data explícita, use a data de hoje.
    4. "category": Classifique o gasto em uma destas categorias: [Alimentação, Transporte, Lazer, Saúde, Educação, Mercado, Moradia, Contas, Outros]. Se não souber, use 'Outros'.

    Retorne APENAS este JSON:
    {
        "name": string,
        "totalAmount": number,
        "dueDate": string,
        "category": string
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
        console.error("Erro JSON IA:", text);
        return NextResponse.json({ error: 'Falha ao interpretar a resposta da IA.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro API:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar.' }, { status: 500 });
  }
}
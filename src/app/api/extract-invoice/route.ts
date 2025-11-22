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
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    // Prompt Otimizado para Contexto Brasileiro e Detecção de Serviços
    const prompt = `
    Analise este documento (boleto, conta, recibo).
    Extraia dados para uma transação financeira pessoal no Brasil.

    INTELIGÊNCIA DE CATEGORIA:
    - Leia o LOGO da empresa e o Nome Fantasia.
    - Procure palavras-chave: "Telecom", "Internet", "Fibra", "Energia", "Saneamento", "Educação".
    - Se for "VIG TELECOM" ou similar, a categoria é "Internet" ou "Contas".
    - Priorize categorias específicas (ex: "Internet" é melhor que "Outros").

    CAMPOS OBRIGATÓRIOS (JSON):
    1. "name": Nome da empresa (Ex: VIG Telecom, Enel, Netflix).
    2. "totalAmount": Valor total numérico (float).
    3. "dueDate": Data de vencimento (YYYY-MM-DD).
    4. "category": Escolha a melhor categoria da lista: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Mercado', 'Dívidas', 'Crianças', 'Assinaturas', 'Contas', 'Internet', 'Outros'].
    
    Retorne APENAS o JSON.
    `;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: file.type } }
    ]);

    const text = result.response.text();
    try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanText);
        
        // Fallback de segurança
        if (!json.totalAmount) json.totalAmount = 0;
        
        return NextResponse.json(json);
    } catch (e) {
        console.error("Erro Parse IA:", text);
        return NextResponse.json({ error: 'Erro ao interpretar dados do documento.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro API:', error);
    return NextResponse.json({ error: 'Erro interno ao processar.' }, { status: 500 });
  }
}
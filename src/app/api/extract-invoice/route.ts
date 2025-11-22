import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Chave API ausente.' }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo.' }, { status: 400 });
    }

    if (file.size > 4.5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo muito grande.' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usando Gemini 2.0 Flash que é superior para OCR
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analise este documento financeiro brasileiro (Boleto Bancário, Fatura ou Recibo).
    Use as regras visuais da FEBRABAN para identificar os campos.

    REGRAS DE LEITURA (Prioridade Alta):
    1. **TOTAL (totalAmount):**
       - Procure no canto inferior direito por "(=) Valor do Documento" ou "Valor Cobrado".
       - Se houver "Desconto", subtraia mentalmente, mas prefira o "Valor Cobrado".
       - Se falhar, tente extrair os últimos dígitos da "Linha Digitável" (números no topo do boleto), pois o valor geralmente está lá.
       - Formato de saída: Número puro (ex: 150.00). Ignore "R$".

    2. **DATA (dueDate):**
       - Procure no canto superior direito por "Vencimento".
       - Formato de saída: YYYY-MM-DD.

    3. **NOME (name):**
       - Procure no topo esquerdo por "Beneficiário", "Cedente" ou leia o LOGOTIPO grande no topo (ex: Banco do Brasil, Bradesco, VIG Telecom, Inter).
       - Se for boleto de banco (ex: Itaú), tente achar o "Beneficiário Final" para ser mais específico.

    4. **CATEGORIA (category):**
       - Deduza pelo nome da empresa:
         - VIG, Claro, Vivo, Oi -> 'Internet'
         - Enel, Light, Sabesp -> 'Contas' (Moradia)
         - Assaí, Carrefour, Atacadão -> 'Mercado'
         - Uber, 99, Posto -> 'Transporte'
         - Escola, Faculdade -> 'Educação'
         - Farmácia, Hospital -> 'Saúde'
       - Se não tiver certeza, use 'Outros'.

    Retorne JSON:
    {
        "name": "string",
        "totalAmount": 0.00,
        "dueDate": "YYYY-MM-DD",
        "category": "string"
    }
    `;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: file.type } }
    ]);

    const text = result.response.text();
    try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanText);
        return NextResponse.json(json);
    } catch (e) {
        console.error("Erro JSON IA:", text);
        return NextResponse.json({ error: 'Falha na interpretação do documento.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro API:', error);
    return NextResponse.json({ error: 'Erro no servidor.' }, { status: 500 });
  }
}
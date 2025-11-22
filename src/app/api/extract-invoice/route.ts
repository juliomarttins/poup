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
    Você vai analisar uma IMAGEM ou PDF contendo um boleto brasileiro.

    Etapa 1 — OCR:
    Extraia TODO o texto visível do documento de forma literal.
    Não resuma. Não interprete. Apenas texto bruto.

    Etapa 2 — Interpretação:
    A partir do texto OCR, aplique estas regras:

    1. VALOR TOTAL:
       - procure por: "Valor do Documento", "Valor Cobrado", "Total a Pagar", "VALOR"
       - considere números perto de "R$"
       - formato final: 1234.56

    2. DATA DE VENCIMENTO:
       - procure "Vencimento"
       - formato final: YYYY-MM-DD

    3. NOME DO BENEFICIÁRIO:
       - procure "Beneficiário", "Cedente" ou empresa principal mencionada

    4. CATEGORIA:
       - Internet, Contas, Mercado, Transporte, Saúde ou Outros

    Retorne APENAS este JSON:

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
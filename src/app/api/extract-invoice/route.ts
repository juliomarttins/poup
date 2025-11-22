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

    // Prompt ultra-específico para documentos brasileiros
    const prompt = `
    Analise este documento (pode ser PDF, imagem, boleto, fatura ou recibo).
    Seu objetivo é extrair dados para uma transação financeira no Brasil.

    REGRAS DE EXTRAÇÃO:
    1. "totalAmount": Procure por "Valor do Documento", "Valor Cobrado", "Total a Pagar" ou "Valor Total". 
       - Ignore juros/multa se houver campo de valor original.
       - O formato brasileiro é 1.234,56. Converta para number (float) internacional (1234.56).
    2. "dueDate": Procure por "Vencimento", "Data de Vencimento" ou "Data". Formato de saída: YYYY-MM-DD.
    3. "name": Nome do Beneficiário, Cedente, Loja ou Empresa emissora.
    4. "category": Baseado no nome e itens, escolha uma: 'Moradia' (luz, água, aluguel), 'Educação', 'Saúde', 'Mercado', 'Transporte', 'Lazer', 'Veículo', 'Contas' (internet, telefone), 'Outros'.

    Retorne APENAS este JSON (sem markdown):
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
        // Limpeza extra caso a IA retorne ```json ... ```
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanText);
        
        // Validação de segurança dos dados
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
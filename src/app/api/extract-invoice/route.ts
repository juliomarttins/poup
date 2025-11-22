import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Chave API não configurada.' }, { status: 500 });
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

    // Limite seguro
    if (file.size > 4.5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo muito grande (Máx 4.5MB).' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // [MUDANÇA CRÍTICA] Usando o modelo mais potente para OCR de boletos
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro", 
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analise este documento financeiro (Boleto, Fatura, Recibo).
    
    ESTRATÉGIA DE LEITURA (Prioridade Máxima):
    1. **CÓDIGO DE BARRAS / LINHA DIGITÁVEL**: Procure por uma sequência longa de números (aprox 47 dígitos) no topo ou rodapé. 
       - Os últimos 10 dígitos dessa linha REPRESENTAM O VALOR. Use isso para confirmar se o OCR do campo "Valor" falhar.
    
    2. **VALOR TOTAL**:
       - Procure: "Valor do Documento", "Valor Cobrado", "Total a Pagar", "(=) Valor do Documento".
       - O formato é 1.000,00. Converta para float (1000.00).

    3. **DATA DE VENCIMENTO**:
       - Procure: "Vencimento", "Data de Vencimento", "VENCIMENTO".
       - Formato esperado: DD/MM/AAAA. Converta para YYYY-MM-DD.

    4. **IDENTIFICAÇÃO**:
       - Nome: Busque "Beneficiário", "Cedente", "Razão Social" ou o LOGOTIPO no topo.
       - Categoria: 
         - "VIG", "Claro", "Vivo", "Oi", "Tim", "Net" -> 'Internet'
         - "Enel", "Light", "Sabesp", "Caesb", "Saneago" -> 'Contas'
         - "Assaí", "Carrefour", "Atacadão" -> 'Mercado'
         - "Uber", "99" -> 'Transporte'
         - "Escola", "Faculdade" -> 'Educação'
         - Outros casos: tente inferir ou use 'Outros'.

    Retorne JSON estrito:
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
        
        if (!json.totalAmount) json.totalAmount = 0;

        return NextResponse.json(json);
    } catch (e) {
        console.error("Erro Parse IA:", text);
        return NextResponse.json({ error: 'Falha na leitura inteligente.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro API:', error);
    return NextResponse.json({ error: 'Erro no servidor.' }, { status: 500 });
  }
}
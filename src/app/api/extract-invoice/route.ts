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

    // Prompt Especializado em Boletos e Recibos Brasileiros
    const prompt = `
    Analise este documento financeiro (Boleto, Fatura, Recibo).
    
    ESTRATÉGIA DE LEITURA (Prioridade Máxima):
    1. **CÓDIGO DE BARRAS / LINHA DIGITÁVEL**: Procure por uma sequência longa de números (aprox 47 dígitos), geralmente no topo ou rodapé ("FICHA DE COMPENSAÇÃO"). 
       - Os últimos 10 dígitos geralmente indicam o valor (sem vírgula). 
       - Os 4 dígitos anteriores a esses indicam o fator de vencimento.
       - SE ACHAR A LINHA, USE-A PARA CONFIRMAR O VALOR.
    
    2. **PALAVRAS-CHAVE DE VALOR**:
       - Procure: "Valor do Documento", "Valor Cobrado", "Total a Pagar", "Valor Total", "Total".
       - O formato brasileiro é 1.000,00 (milhar ponto, decimal vírgula). Converta para float (1000.00).

    3. **PALAVRAS-CHAVE DE DATA**:
       - Procure: "Vencimento", "Data de Vencimento", "Pagar até".
       - Formato esperado: DD/MM/AAAA. Converta para YYYY-MM-DD.
       - Se não achar, use a data de "Processamento" ou "Documento".

    4. **IDENTIFICAÇÃO (Nome e Categoria)**:
       - Nome: Busque "Beneficiário", "Cedente", "Razão Social" ou o LOGOTIPO principal.
       - Categoria: 
         - Se for "VIG", "Claro", "Vivo", "Oi" -> 'Internet'
         - Se for "Enel", "Light", "Sabesp", "Saneago" -> 'Contas'
         - Se for "Assaí", "Carrefour", "Atacadão" -> 'Mercado'
         - Se for "Uber", "99", "Posto" -> 'Transporte'
         - Se for "Escola", "Faculdade" -> 'Educação'
         - Outros casos: tente inferir ou use 'Outros'.

    Retorne JSON estrito:
    {
        "name": "string (Nome da empresa)",
        "totalAmount": 0.00 (number float),
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
        
        // Tratamento de erro silencioso: Se valor vier zerado, tenta achar string de valor
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
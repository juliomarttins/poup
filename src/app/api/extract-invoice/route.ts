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
        return NextResponse.json({ error: 'Arquivo muito grande (Máx 4.5MB).' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // MODELO PRO para máxima precisão
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro", 
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analise este documento financeiro brasileiro (Boleto, Fatura, Cupom).
    
    REGRAS DE EXTRAÇÃO DE DADOS:
    1. **VALOR TOTAL**: 
       - Procure "Valor do Documento", "Total a Pagar", "Valor Total".
       - Retorne número float (ex: 175.19).
    
    2. **DATA DE VENCIMENTO**:
       - Procure "Vencimento". Formato YYYY-MM-DD.
    
    3. **NOME**: 
       - Nome da empresa emissora (ex: "Equatorial Goiás", "VIG Telecom").
    
    4. **CATEGORIA INTELIGENTE (Crucial)**:
       - Mapeie o serviço para uma destas categorias PADRÃO:
         - 'Contas' (Para: Energia, Água, Gás, IPTU, Condomínio) -> Ex: Equatorial, Enel, Saneago.
         - 'Internet' (Para: Banda Larga, Celular, TV) -> Ex: VIG, Claro, Vivo.
         - 'Mercado' (Para: Supermercados, Atacarejos) -> Ex: Assaí, Carrefour.
         - 'Transporte' (Para: Uber, Combustível, IPVA).
         - 'Moradia' (Para: Aluguel).
         - 'Educação' (Para: Escola, Faculdade).
         - 'Saúde' (Para: Farmácia, Médico).
       - Se NÃO se encaixar em nenhuma acima, use 'Outros'.

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
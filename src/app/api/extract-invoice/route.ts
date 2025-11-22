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

    const prompt = `
    Extraia os dados deste documento financeiro (boleto, fatura, recibo).
    
    Instruções:
    1. "totalAmount": Encontre o valor TOTAL a pagar. Se tiver juros ou multa calculados, use o valor final.
    2. "dueDate": Data de vencimento (YYYY-MM-DD).
    3. "name": Nome da empresa/beneficiário. Tente identificar do que se trata (ex: "VIG TELECOM" -> "Internet VIG").
    4. "category": Baseado no nome, classifique em: 'Internet', 'Moradia', 'Energia', 'Mercado', 'Transporte', 'Saúde', 'Outros'.

    Retorne JSON:
    {
        "name": string,
        "totalAmount": number | string,
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
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanText);
        
        // Tratamento de dados robusto (Correção para o erro de leitura)
        
        // 1. Corrigir Valor (aceita string "137,05" ou number 137.05)
        let amount = 0;
        if (json.totalAmount) {
            if (typeof json.totalAmount === 'number') {
                amount = json.totalAmount;
            } else if (typeof json.totalAmount === 'string') {
                // Remove R$, troca vírgula por ponto
                const cleanAmount = json.totalAmount.replace(/[^0-9,.-]/g, '').replace(',', '.');
                amount = parseFloat(cleanAmount);
            }
        }
        json.totalAmount = amount;

        // 2. Normalizar Categoria
        // Se a IA retornou "Internet" ou "VIG", forçamos para uma categoria que o frontend entende ou "Outros" com customização
        if (json.name && json.name.toUpperCase().includes('TELECOM')) {
             if (!json.category || json.category === 'Outros') json.category = 'Internet';
        }

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
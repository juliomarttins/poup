import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeAdminApp } from '@/firebase/admin';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // 1. Validação de Segurança (Token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const { auth } = initializeAdminApp();
    
    try {
        await auth.verifyIdToken(idToken);
    } catch (error) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // 2. Processamento do Arquivo
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    // 3. Inteligência (Gemini Flash 1.5)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analise este documento (conta, boleto ou fatura).
    Extraia as seguintes informações para preencher um formulário de dívida financeira:
    
    1. "name": Nome do favorecido/empresa ou descrição curta (Ex: "Conta de Luz", "Fatura Nubank").
    2. "totalAmount": Valor total a pagar (número puro, use ponto para decimais).
    3. "dueDate": Data de vencimento no formato YYYY-MM-DD. Se não achar, use a data de hoje.
    4. "category": Sugira uma categoria entre: 'Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Cartão de Crédito', 'Veículo', 'Outros'.
    5. "installmentAmount": Se for parcelado, o valor da parcela. Se for à vista, o mesmo valor total.
    6. "totalInstallments": Se for parcelado, total de parcelas. Se não, 1.
    7. "paidInstallments": Se identificar qual parcela é (ex: 02/10), coloque 1 (pois pagou 1 antes dessa). Se não, 0.

    Retorne APENAS o JSON.
    `;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: base64Data,
                mimeType: file.type
            }
        }
    ]);

    const text = result.response.text();
    const json = JSON.parse(text);

    return NextResponse.json(json);

  } catch (error: any) {
    console.error('Erro ao processar fatura:', error);
    return NextResponse.json({ error: 'Erro ao processar o documento.' }, { status: 500 });
  }
}
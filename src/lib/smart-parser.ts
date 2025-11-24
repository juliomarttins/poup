import { DEFAULT_CATEGORIES } from "./constants";

// Mapeamento de palavras-chave para categorias
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'Alimentação': ['pastel', 'almoço', 'jantar', 'lanche', 'ifood', 'rappi', 'mercado', 'pão', 'café', 'restaurante', 'burguer', 'pizza', 'açaí', 'padaria'],
    'Transporte': ['uber', '99', 'gasolina', 'etanol', 'ônibus', 'metro', 'estacionamento', 'pedágio', 'combustível'],
    'Moradia': ['aluguel', 'luz', 'água', 'internet', 'condomínio', 'iptu', 'gás'],
    'Lazer': ['cinema', 'jogo', 'steam', 'netflix', 'spotify', 'show', 'bar'],
    'Saúde': ['farmácia', 'remédio', 'médico', 'dentista', 'exame', 'convênio'],
    'Educação': ['curso', 'livro', 'escola', 'faculdade', 'material'],
    'Renda': ['salário', 'pix', 'venda', 'freela', 'bônus']
};

// Preposições para remover do título (limpeza)
const STOP_WORDS = ['com', 'no', 'na', 'de', 'do', 'da', 'para', 'pelo', 'pela', 'em', 'a', 'o'];

export function parseTransactionInput(input: string): { 
    amount: number; 
    description: string; 
    category: string; 
    type: 'income' | 'expense' 
} {
    // 1. Normalizar input
    const cleanInput = input.trim();
    
    // 2. Extrair Valor (aceita 50, 50.00, R$ 50, 50,00)
    const valueMatch = cleanInput.match(/[\d,.]+/);
    if (!valueMatch) throw new Error("Não entendi o valor. Tente '50 pastel'.");
    
    let rawAmount = valueMatch[0].replace(',', '.');
    // Correção para casos onde tem multiplos pontos (ex: 1.200.50) - Simplificação para MVP
    const amount = parseFloat(rawAmount);

    // 3. Extrair Descrição (remove o valor e limpa espaços extras)
    let description = cleanInput.replace(valueMatch[0], '').trim();
    
    // Remove símbolos de moeda se sobrou
    description = description.replace(/^(R\$|\$)/i, '').trim();

    // 4. Limpeza Inteligente de Título (Remove preposições iniciais)
    // Ex: "com pastel" -> "Pastel"
    const words = description.split(' ');
    if (words.length > 0 && STOP_WORDS.includes(words[0].toLowerCase())) {
        words.shift(); // Remove a primeira palavra
    }
    description = words.join(' ');
    
    // Capitalizar primeira letra
    description = description.charAt(0).toUpperCase() + description.slice(1);

    if (!description) description = "Gasto Geral";

    // 5. Categorização Automática
    let detectedCategory = 'Outros';
    let type: 'income' | 'expense' = 'expense';

    const lowerDesc = description.toLowerCase();

    // Checa Renda primeiro
    for (const keyword of CATEGORY_KEYWORDS['Renda']) {
        if (lowerDesc.includes(keyword)) {
            detectedCategory = 'Salário'; // Ou outra cat de renda
            type = 'income';
            break;
        }
    }

    // Se não for renda, checa despesas
    if (type === 'expense') {
        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (cat === 'Renda') continue;
            if (keywords.some(k => lowerDesc.includes(k))) {
                detectedCategory = cat;
                break;
            }
        }
    }

    return {
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        description,
        category: detectedCategory,
        type
    };
}
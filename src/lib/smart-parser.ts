// CATEGORIAS PADRÃO (Referência interna)
const CATEGORIES = {
    FOOD: 'Alimentação',
    TRANSPORT: 'Transporte',
    HOUSING: 'Moradia',
    LEISURE: 'Lazer',
    HEALTH: 'Saúde',
    EDUCATION: 'Educação',
    VEHICLE: 'Veículo',
    MARKET: 'Mercado',
    BILLS: 'Contas',
    INCOME: 'Renda',
    PETS: 'Pets',
    BEAUTY: 'Beleza',
    SHOPPING: 'Compras',
    SERVICES: 'Serviços',
    INVEST: 'Investimento'
};

// PALAVRAS-CHAVE (O Cérebro da IA Local)
const KEYWORDS: Record<string, string[]> = {
    [CATEGORIES.FOOD]: [
        'pastel', 'almoço', 'jantar', 'lanche', 'ifood', 'rappi', 'uber eats', 'restaurante', 
        'burguer', 'pizza', 'açaí', 'padaria', 'café', 'esfiha', 'coxinha', 'sushi', 'temaki', 
        'mc donalds', 'bk', 'subway', 'marmita', 'churrasco', 'sorvete', 'chocolate', 'bolo',
        'comida', 'refeição', 'boteco', 'bar', 'cerveja', 'drink', 'petisco'
    ],
    [CATEGORIES.MARKET]: [
        'mercado', 'supermercado', 'assai', 'carrefour', 'atacadao', 'pão de açúcar', 'dia', 
        'tenda', 'feira', 'sacolão', 'hortifruti', 'açougue', 'peixaria', 'compra mês', 
        'leite', 'pão', 'arroz', 'feijão', 'carne', 'frango', 'limpeza'
    ],
    [CATEGORIES.TRANSPORT]: [
        'uber', '99', 'taxi', 'ônibus', 'metro', 'trem', 'passagem', 'bilhete', 'top', 
        'recarga', 'estacionamento', 'zona azul', 'pedágio', 'sem parar', 'veloe'
    ],
    [CATEGORIES.VEHICLE]: [
        'gasolina', 'etanol', 'diesel', 'posto', 'abastecer', 'tanque', 'ipva', 'licenciamento', 
        'mecânico', 'oficina', 'revisão', 'óleo', 'pneu', 'amortecedor', 'freio', 'pastilha', 
        'bateria', 'funilaria', 'peça', 'carro', 'moto', 'seguro auto', 'lavar carro'
    ],
    [CATEGORIES.HOUSING]: [
        'aluguel', 'condomínio', 'luz', 'energia', 'enel', 'água', 'sabesp', 'gás', 'iptu', 
        'internet', 'vivo', 'claro', 'tim', 'oi', 'net', 'wifi', 'manutenção casa', 'obra', 
        'reforma', 'móvel', 'eletro'
    ],
    [CATEGORIES.HEALTH]: [
        'farmácia', 'drogasil', 'droga raia', 'remédio', 'medicamento', 'médico', 'consulta', 
        'exame', 'dentista', 'convênio', 'plano de saúde', 'psicólogo', 'terapia', 'hospital', 
        'laboratório', 'vacina', 'academia', 'smartfit', 'bluefit'
    ],
    [CATEGORIES.LEISURE]: [
        'cinema', 'ingresso', 'show', 'teatro', 'jogo', 'steam', 'psn', 'xbox', 'netflix', 
        'spotify', 'amazon prime', 'disney', 'hbo', 'assinatura', 'clube', 'viagem', 'hotel', 
        'airbnb', 'passagem aérea', 'festa'
    ],
    [CATEGORIES.EDUCATION]: [
        'curso', 'faculdade', 'escola', 'mensalidade', 'matrícula', 'livro', 'material escolar', 
        'papelaria', 'idiomas', 'inglês', 'udemy', 'alura'
    ],
    [CATEGORIES.PETS]: [
        'pet', 'petshop', 'ração', 'banho e tosa', 'veterinário', 'vacina pet', 'gato', 'cachorro', 'areia'
    ],
    [CATEGORIES.BEAUTY]: [
        'cabelo', 'cabeleireiro', 'barbeiro', 'barbearia', 'unha', 'manicure', 'pedicure', 
        'estética', 'depilação', 'cosmético', 'perfume', 'maquiagem', 'boticário', 'natura'
    ],
    [CATEGORIES.INCOME]: [
        'salário', 'pagamento', 'pix recebido', 'venda', 'freela', 'bônus', '13º', 'férias', 
        'reembolso', 'rendimento', 'aluguel recebido', 'depósito'
    ]
};

// Preposições e palavras de ligação para limpar (Case insensitive)
const STOP_WORDS = [
    'com', 'no', 'na', 'de', 'do', 'da', 'para', 'pelo', 'pela', 'em', 'a', 'o', 'as', 'os', 'um', 'uma',
    'gasto', 'compra', 'pagamento', 'valor', 'foi', 'paguei'
];

export function parseTransactionInput(input: string): { 
    amount: number; 
    description: string; 
    category: string; 
    type: 'income' | 'expense' 
} {
    const cleanInput = input.trim();
    
    // 1. Extração de Valor (Melhorada para R$ e formatos PT-BR)
    // Procura por números que podem ter R$, pontos ou vírgulas
    const valueMatch = cleanInput.match(/(?:R\$|(?:\$))\s*([\d.,]+)|([\d.,]+)/i);
    
    if (!valueMatch) throw new Error("Não entendi o valor. Digite algo como '50 pastel'.");
    
    let rawValue = valueMatch[1] || valueMatch[2]; // Pega o grupo que deu match
    
    // Corrige formatos como 1.200,50 para 1200.50
    // Se tem vírgula, assume que é decimal PT-BR
    if (rawValue.includes(',')) {
        rawValue = rawValue.replace(/\./g, '').replace(',', '.');
    } else {
        // Se só tem ponto, verifica se é milhar ou decimal (lógica simples: se tem apenas 1 ponto e 2 casas, é decimal)
        // Para evitar bugs, vamos assumir que ponto único é decimal em inputs simples
    }
    
    const amount = parseFloat(rawValue);

    // 2. Extração de Descrição
    // Remove o valor encontrado da string original para sobrar só o texto
    let description = cleanInput.replace(valueMatch[0], '').trim();
    
    // Limpeza de Stop Words no início da frase
    // Ex: "com pastel" -> divide em ["com", "pastel"] -> remove "com" -> "Pastel"
    let words = description.split(/\s+/);
    
    // Remove palavras iniciais irrelevantes recursivamente
    while (words.length > 0 && STOP_WORDS.includes(words[0].toLowerCase())) {
        words.shift();
    }
    
    description = words.join(' ');

    // Capitalização (Primeira letra maiúscula)
    if (description.length > 0) {
        description = description.charAt(0).toUpperCase() + description.slice(1);
    } else {
        description = "Gasto Geral";
    }

    // 3. Categorização Inteligente
    let category = 'Outros';
    let type: 'income' | 'expense' = 'expense';
    
    const lowerDesc = description.toLowerCase();

    // Verifica se é Renda primeiro
    if (KEYWORDS[CATEGORIES.INCOME].some(k => lowerDesc.includes(k))) {
        type = 'income';
        category = CATEGORIES.INCOME;
    } else {
        // Verifica despesas
        for (const [cat, words] of Object.entries(KEYWORDS)) {
            if (cat === CATEGORIES.INCOME) continue;
            
            // Verifica correspondência exata ou parcial inteligente
            if (words.some(w => lowerDesc.includes(w) || lowerDesc === w)) {
                category = cat;
                break; 
            }
        }
    }
    
    // Caso especial: Se a descrição for muito curta e genérica, tenta adivinhar pelo contexto (futuro)
    
    return {
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        description,
        category,
        type
    };
}
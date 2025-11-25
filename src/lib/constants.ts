export const APP_VERSION = "v1.2.0"; 
export const APP_NAME = "Poupp";

export const DEFAULT_CATEGORIES = {
    income: ['Salário', 'Bônus', 'Freelance', 'Investimentos', 'Rendimentos', 'Outros'],
    expense: [
        'Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 
        'Educação', 'Mercado', 'Dívidas', 'Crianças', 'Assinaturas', 'Outros'
    ]
};

// [NOVO] Definição dos Planos
export const SUBSCRIPTION_PLANS = {
    TRIAL: { id: 'trial', label: 'Teste Grátis', days: 8 },
    BASIC_15: { id: 'basic_15', label: 'Básico (15 Dias)', days: 15 },
    BROTHER: { id: 'brother', label: 'Plano Brother', days: 30 },
    PREMIUM_30: { id: 'premium_30', label: 'Premium Mensal', days: 30 },
    LIFETIME: { id: 'lifetime', label: 'Vitalício', days: 36500 }, // 100 anos
};

// [NOVO] Número do WhatsApp para Renovação (Ex: 5511999999999)
export const WHATSAPP_NUMBER = "5511999999999";
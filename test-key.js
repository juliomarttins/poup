// Arquivo: test-key.js
const API_KEY = 'AIzaSyDJS70XLjSEDcdLvAcOA8ZiUIGnRgov_Jk'; // Sua chave
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log("Consultando API do Google...");

fetch(URL)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error("ERRO:", data.error.message);
      return;
    }

    console.log("\nSUCESSO! Modelos disponiveis para sua chave:\n");
    const models = data.models || [];
    
    // Filtra apenas os que geram conteudo (chat)
    const chatModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

    chatModels.forEach(m => {
      console.log(`- ${m.name.replace('models/', '')}`);
      console.log(`  Versao: ${m.version}`);
      console.log(`  Descricao: ${m.displayName}\n`);
    });

    const tem15 = chatModels.some(m => m.name.includes('gemini-1.5'));
    if (tem15) {
        console.log("OTIMA NOTICIA: Sua chave TEM acesso ao Gemini 1.5 (Flash/Pro). Podemos usar o melhor motor.");
    } else {
        console.log("AVISO: Parece que voce so tem acesso aos modelos antigos.");
    }
  })
  .catch(err => console.error("Erro de conexao:", err));
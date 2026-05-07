// Arquivo: utils/mailer.js
const logger = require('./logger');

async function sendErrorEmail(errorDetails) {
    // VERSÃO PORTFÓLIO: Simulador de envio de e-mails
    // Removemos o nodemailer e as senhas de SMTP para o projeto rodar nativamente
    // em qualquer máquina sem precisar de arquivo .env.

    try {
        const safeError = String(errorDetails);

        logger.error("📧 [MOCK EMAIL ENVIADO] Alerta engatilhado para a equipe:");
        logger.error(`   Para: equipe-dados@portfolio-empresa.com`);
        logger.error(`   Assunto: 🚨 ALERTA CRÍTICO: Falha no ETL Metadados`);
        logger.error(`   Detalhes do Erro:\n${safeError}`);

    } catch (error) {
        logger.error(`Erro interno no mock de e-mail: ${error.message}`);
    }
}

module.exports = { sendErrorEmail };
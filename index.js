// Removemos o require('dotenv').config() para ser 100% Plug & Play
const logger = require('./utils/logger');
const pool = require('./config/database'); 
const MetadadosSync = require('./core/metadadosSync');
const { sendErrorEmail } = require('./utils/mailer');

async function bootstrapDatabase() {
    logger.info("⚙️ Verificando/Criando estrutura do banco de dados local (SQLite)...");
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS contratos (
            id_metadados TEXT PRIMARY KEY,
            colaborador_id TEXT,
            data_inicio TEXT,
            data_termino TEXT,
            tipo_contrato TEXT,
            situacao TEXT,
            empresa TEXT,
            nome TEXT,
            nascimento TEXT,
            sexo TEXT,
            cpf TEXT,
            email_corporativo TEXT,
            email_pessoal TEXT,
            meses_casa INTEGER,
            anos_casa INTEGER,
            cargo TEXT,
            ultima_sincronizacao TEXT
        );
    `;
    await pool.query(createTableQuery);
    logger.info("✅ Banco de dados pronto para receber os dados.");
}

async function main() {
    // Alteramos o texto do Log para refletir que é um projeto de Portfólio
    logger.info("🚀 Iniciando Pipeline ETL de Portfólio: Mock HR API -> SQLite");
    let sync;

    try {
        // 1. Prepara o banco de dados
        await bootstrapDatabase();

        // 2. Inicia o objeto de sincronização
        sync = new MetadadosSync();

        // 3. Executa as rotinas de carga
        await sync.syncContratos();
        // await sync.syncCargos();
        // await sync.syncDepartamentos();

        logger.info("🏁 ETL Finalizado com Sucesso.");
    } catch (error) {
        logger.error(`🚨 Falha Crítica no ETL: ${error.stack}`);

        logger.info("📨 Disparando rotina de notificações (Mock)...");
        await sendErrorEmail(error.stack);

        process.exitCode = 1;
    } finally {
        if (sync) {
            await sync.close();
        }
        logger.info("🛑 Finalizando processo do Node.");
        process.exit(); 
    }
}

main();
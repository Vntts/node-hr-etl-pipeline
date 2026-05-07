const pool = require('../config/database');
const apiClient = require('../config/apiClient');
const logger = require('../utils/logger');

class MetadadosSync {

    // 🔍 1. CONSULTA O CHECKPOINT NO BANCO
    async getLastSyncTimestamp() {
        try {
            // Removido o schema 'metadados.' para compatibilidade nativa com SQLite
            const res = await pool.query('SELECT MAX(ultima_sincronizacao) as last_sync FROM contratos');
            const lastSync = res.rows[0]?.last_sync;

            if (lastSync) {
                const date = new Date(lastSync);
                date.setDate(date.getDate() - 1);
                return date.toISOString().split('T')[0];
            }
            return null;
        } catch (error) {
            logger.warn(`Aviso: Não foi possível buscar o último checkpoint (Carga total será iniciada): ${error.message}`);
            return null;
        }
    }

    // 📡 2. EXTRAÇÃO COM FILTRO INCREMENTAL E TRAVA DE LOOP (Generators)
    async *fetchPaginated(endpoint, lastDate) {
        let page = 1;
        let lastFirstId = null;
        const limit = 100;

        while (true) {
            const params = { pagina: page, tamanhoPagina: limit };
            if (lastDate) params.dataAlteracao = lastDate;

            logger.info(`📡 Buscando Página ${page} ${lastDate ? `(Desde: ${lastDate})` : '(Carga Total)'}`);

            const res = await apiClient.get(endpoint, { params });
            const items = Array.isArray(res.data) ? res.data : (res.data.items || []);

            if (items.length === 0) {
                logger.info("🏁 Nenhum dado novo encontrado.");
                break;
            }

            // Adaptado para pegar a chave correta da nossa Mock API
            const currentFirstId = items[0].contrato || items[0].id;
            
            if (currentFirstId === lastFirstId) {
                logger.error("🚨 A API ignorou a paginação e repetiu dados (Trava de loop ativada).");
                break;
            }
            lastFirstId = currentFirstId;

            logger.info(`📄 Página ${page} processada (${items.length} registros).`);
            for (const item of items) yield item;

            if (items.length < limit) break;
            page++;
        }
    }

    // 💾 3. CARGA (UPSERT EM LOTE)
    async bulkUpsert(query, buffer) {
        if (!buffer || buffer.length === 0) return;
        
        try {
            await pool.query('BEGIN TRANSACTION');
            
            // No SQLite (Portfólio), iteramos o insert preparado dentro da transação.
            // Isso garante segurança (ACID) e velocidade próxima a um Bulk Insert real.
            for (const row of buffer) {
                await pool.query(query, row);
            }
            
            await pool.query('COMMIT');
            logger.info(`💾 Lote de ${buffer.length} registros únicos salvo com sucesso.`);
        } catch (error) {
            await pool.query('ROLLBACK');
            logger.error(`❌ Erro no Banco durante inserção do Lote: ${error.message}`);
            throw error; 
        }
    }

    // 🚀 4. ORQUESTRAÇÃO FINAL
    async syncContratos() {
        try {
            const lastSyncDate = await this.getLastSyncTimestamp();
            logger.info(lastSyncDate ? `⚡ Retomando sincronização a partir de: ${lastSyncDate}` : "🌍 Iniciando Carga Total");

            // 1. QUERY ADAPTADA PARA O PADRÃO SQLITE (?, ?)
            const upsertQuery = `
            INSERT INTO contratos (
                id_metadados, colaborador_id, data_inicio, data_termino, tipo_contrato, situacao,
                empresa, nome, nascimento, sexo, cpf, email_corporativo, email_pessoal, meses_casa, anos_casa, cargo, ultima_sincronizacao
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) 
            ON CONFLICT (id_metadados) DO UPDATE SET
                colaborador_id = EXCLUDED.colaborador_id, 
                data_inicio = EXCLUDED.data_inicio, 
                data_termino = EXCLUDED.data_termino, 
                tipo_contrato = EXCLUDED.tipo_contrato,
                situacao = EXCLUDED.situacao,
                empresa = EXCLUDED.empresa,
                nome = EXCLUDED.nome,
                nascimento = EXCLUDED.nascimento,
                sexo = EXCLUDED.sexo,
                cpf = EXCLUDED.cpf,
                email_corporativo = EXCLUDED.email_corporativo,
                email_pessoal = EXCLUDED.email_pessoal,
                meses_casa = EXCLUDED.meses_casa,
                anos_casa = EXCLUDED.anos_casa,
                cargo = EXCLUDED.cargo,
                ultima_sincronizacao = CURRENT_TIMESTAMP;
            `;

            const buffer = [];
            for await (const item of this.fetchPaginated('/colaborador/contratos', lastSyncDate)) {

                // 2. BUFFER COM SUPORTE AOS DADOS DA MOCK API
                buffer.push([
                    item.contrato || item.id,                      // id_metadados
                    item.pessoa || item.matricula,                 // colaborador_id
                    item.dataAdmissao || item.data_admissao,       // data_inicio
                    item.dataRescisao || null,                     // data_termino
                    item.tipoContrato || 'CLT',                    // tipo_contrato
                    item.situacao || item.status,                  // situacao
                    item.empresa || 'Mock Company S/A',            // empresa
                    item.nome,                                     // nome
                    item.dataNascimento || '1990-01-01',           // nascimento 
                    item.sexo || 'N/A',                            // sexo
                    item.cpf,                                      // cpf
                    item.emailCorporativo || `${item.nome.split(' ')[0].toLowerCase()}@mock.com`, // email_corporativo
                    item.emailPessoal || null,                     // email_pessoal
                    item.mesesCasa || 12,                          // meses_casa
                    item.anosCasa || 1,                            // anos_casa
                    item.cargo                                     // cargo
                ]);

                if (buffer.length >= 100) {
                    // Desduplicação inteligente
                    const unique = Array.from(new Map(buffer.map(r => [r[0], r])).values());
                    await this.bulkUpsert(upsertQuery, unique);
                    buffer.length = 0;
                }
            }

            // Salva os "restos" que não completaram o último lote de 100
            if (buffer.length > 0) {
                const unique = Array.from(new Map(buffer.map(r => [r[0], r])).values());
                await this.bulkUpsert(upsertQuery, unique);
            }

            logger.info("✅ Sincronização de Contratos concluída.");
        } catch (error) {
            logger.error(`💥 Erro Crítico em syncContratos: ${error.message}`);
            throw error;
        }
    }

    // 🔌 5. ENCERRA A CONEXÃO
    async close() {
        logger.info("🔌 Pipeline finalizado com segurança.");
        // O Mock DB do SQLite gerencia a própria conexão, mas mantemos 
        // o método para que o arquivo main.js original continue funcionando perfeitamente.
    }
}

module.exports = MetadadosSync;
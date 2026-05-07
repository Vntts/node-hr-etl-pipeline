// Arquivo: config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger'); // Mantém o seu logger

// Cria o arquivo do banco na raiz do projeto automaticamente
const dbPath = path.resolve(__dirname, '../../portfolio_database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Erro fatal ao conectar ao banco SQLite mockado:', err.message);
    } else {
        logger.info('✅ Conectado ao banco SQLite (Portfólio Plug & Play)');
    }
});

// Mockamos a interface do `pg` (PostgreSQL) para o SQLite.
// Assim, onde o seu código chama `pool.query()`, ele continua funcionando!
const pool = {
    query: (text, params) => {
        return new Promise((resolve, reject) => {
            // Converte os placeholders do Postgres ($1, $2) para o SQLite (?, ?)
            const sqliteQuery = text.replace(/\$\d+/g, '?');
            
            if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
                db.all(sqliteQuery, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows, rowCount: rows.length }); // Simula o retorno do pg
                });
            } else {
                db.run(sqliteQuery, params, function(err) {
                    if (err) reject(err);
                    else resolve({ rows: [], rowCount: this.changes }); // Simula o retorno do pg
                });
            }
        });
    }
};

module.exports = pool;
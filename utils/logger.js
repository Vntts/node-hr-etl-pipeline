// Arquivo: utils/logger.js
const winston = require("winston");
const path = require("path");

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        // Mostra o log no terminal (Console)
        new winston.transports.Console(),
        // Salva os logs em um arquivo na raiz do projeto (Excelente para portfólio!)
        new winston.transports.File({ 
            filename: path.resolve(__dirname, '../../etl_execucao.log'),
            level: 'info'
        })
    ]
});

module.exports = logger;
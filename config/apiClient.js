// Arquivo: config/apiClient.js
const { faker } = require('@faker-js/faker/locale/pt_BR');
const logger = require('../utils/logger'); 

// Função auxiliar para simular tempo de resposta da internet
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const apiClient = {
    get: async (url, config = {}) => {
        logger.info(`[MOCK API] Simulando requisição GET para: ${url}`);
        await delay(Math.floor(Math.random() * 300) + 100); // Finge latência de 100 a 400ms

        // Identifica qual endpoint está sendo chamado para gerar o dado correto
        // Nota: Ajustaremos os campos exatos quando eu vir a sua pasta de Services!
        let mockData = [];
        
        if (url.includes('colaboradores') || url.includes('funcionarios')) {
            const qtd = config.params?.limit || 20;
            for (let i = 0; i < qtd; i++) {
                mockData.push({
                    id: faker.string.uuid(),
                    matricula: faker.number.int({ min: 1000, max: 9999 }).toString(),
                    nome: faker.person.fullName(),
                    cpf: faker.string.numeric(11),
                    cargo: faker.person.jobTitle(),
                    departamento: faker.commerce.department(),
                    data_admissao: faker.date.past({ years: 5 }).toISOString(),
                    status: faker.helpers.arrayElement(['ATIVO', 'ATIVO', 'AFASTADO', 'DESLIGADO'])
                });
            }
        }

        // Retorna a estrutura que o axios retornaria (response.data)
        return { data: mockData };
    },

    post: async (url, data, config = {}) => {
        logger.info(`[MOCK API] Simulando requisição POST para: ${url}`);
        await delay(200);
        return { data: { success: true, message: "Mocked POST successful" } };
    }
};

module.exports = apiClient;
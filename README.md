# 🚀 Node.js ETL Pipeline: HR Metadados to SQL (Portfolio Edition)

Este é um projeto de **Engenharia de Dados** desenvolvido em Node.js que demonstra um fluxo de integração robusto entre uma API de Recursos Humanos (Metadados) e um banco de dados relacional. O sistema foi projetado para lidar com extração em larga escala, transformações de dados e carga otimizada.

> **Nota:** Esta é uma versão adaptada para portfólio. A infraestrutura original utilizava **PostgreSQL (Supabase)**, autenticação via **OAuth2** e **Nodemailer** para alertas. Para facilitar a avaliação técnica, esta versão foi convertida para rodar com **SQLite** e utiliza uma **Mock API** com a biblioteca `@faker-js/faker`, permitindo uma execução imediata sem configurações externas.

## 🧠 Diferenciais Técnicos e Arquitetura

Este projeto não é apenas um script de transferência; ele implementa padrões de software usados em sistemas de produção:

* **Extração com Async Generators:** Uso de `async *fetchPaginated` para criar fluxos de dados (streams), processando milhares de registros sem estourar o limite de memória do Node.js.
* **Checkpoint & Sincronização Incremental:** O sistema consulta o último registro no banco e solicita à API apenas o que foi alterado desde a última execução, reduzindo drasticamente o tráfego de rede.
* **Buffer de Carga & Upsert:** Implementação de um buffer que acumula registros para realizar inserções em lote dentro de transações ACID, utilizando `ON CONFLICT DO UPDATE` para garantir que dados novos sejam inseridos e dados antigos sejam atualizados sem duplicidade.
* **Observabilidade Avançada:** Logs estruturados com **Winston** (separados por Console e Arquivo) e um sistema de alertas de erro simulado, demonstrando prontidão para monitoramento em ambiente de produção.
* **Resiliência:** Tratamento de erros em camadas (API, Business Logic e Database) com rollback automático em caso de falha no lote de dados.
<br>
<img width="1794" height="748" alt="code 2" src="https://github.com/user-attachments/assets/f5d9dddf-17c8-445a-9b73-2c9c1fdabce7" />

## 🛠️ Tecnologias Utilizadas

* **Node.js** (Ambiente de execução)
* **SQLite3** (Banco de Dados local)
* **Faker.js** (Simulação de dados de RH realistas)
* **Winston** (Logging profissional)
* **Design Pattern: Service/Core Layer** (Separação de responsabilidades)

## ⚙️ Como Executar (Plug & Play)

O projeto foi configurado para rodar em qualquer ambiente Node.js sem a necessidade de arquivos `.env` ou bancos de dados externos.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/vntts/node-hr-etl-pipeline.git
    cd node-hr-etl-pipeline
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o Pipeline:**
    ```bash
    node index.js
    ```

Após a execução, os arquivos `portfolio_database.sqlite` (banco de dados) e `etl_execucao.log` (histórico de execução) serão criados automaticamente na raiz do projeto.

## 📊 Escalabilidade e BI

Na sua implementação original, este pipeline foi desenhado para sustentar a carga de **centenas de milhares de contratos de colaboradores**, servindo como fonte de dados (Source) para dashboards de Business Intelligence. O uso de transações e buffers de 100 em 100 registros garante que a pressão no banco de dados seja controlada, independentemente do volume total de dados.

## 💡 Casos de Uso e Valor de Negócio
A centralização destes dados em um banco de dados SQL permite que a empresa utilize a informação de forma estratégica em diversas atividades do dia a dia, tais como:

* **Gestão de Acessos e Offboarding:** Identificação imediata do momento em que um funcionário recebe baixa no sistema de RH. Isso permite que a equipe de TI automatize ou agilize a remoção de acessos a sistemas críticos (E-mail, VPN, ERP), garantindo a segurança da informação e conformidade com políticas de segurança.

* **Controle Analítico em BI:** Alimentação de dashboards de Business Intelligence para acompanhamento de indicadores de headcount, turnover, diversidade e evolução salarial, permitindo uma tomada de decisão baseada em dados reais.

* **Auditoria e Compliance:** Facilidade na consulta histórica de contratos e movimentações para auditorias internas ou fiscalizações trabalhistas, sem a necessidade de extrações manuais complexas do sistema de origem.

## 📁 Estrutura do Projeto

* `index.js`: Ponto de entrada, configuração do banco e orquestração.
* `core/metadadosSync.js`: Lógica principal de ETL (Extract, Transform, Load).
* `config/`: Configurações de conexão com Banco e API (Mockada).
* `utils/`: Utilitários de Logging e Notificações de erro.

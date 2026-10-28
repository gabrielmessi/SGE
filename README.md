# SGE — Sistema de Gestão de Estoque

> Sistema web para gerenciamento de estoque, movimentações de produtos e controle financeiro de pequenos comércios.

O **SGE (Sistema de Gestão de Estoque)** foi desenvolvido para facilitar a organização de produtos, o acompanhamento do estoque e o registro das operações diárias de um comércio, reunindo informações em uma interface prática e intuitiva.

---

## Funcionalidades

### Gestão de produtos

- Cadastro de novos produtos
- Edição e exclusão de produtos
- Organização por categorias
- Consulta de quantidade em estoque
- Visualização dos preços de custo e venda

### Controle de estoque

- Acompanhamento das quantidades disponíveis
- Definição de estoque mínimo
- Identificação de produtos que precisam de reposição
- Identificação de produtos esgotados
- Indicadores de produtos cadastrados, unidades disponíveis e valor do estoque a preço de custo
- Busca por nome ou categoria
- Filtros por categoria e situação do estoque

### Movimentações de estoque

- Registro de compras e entradas de mercadorias
- Registro de vendas e saídas de produtos
- Registro de perdas e quebras
- Cálculo automático dos valores das movimentações
- Histórico das movimentações realizadas
- Consulta das movimentações por data
- Registro de observações nas operações

### Controle financeiro

- Resumo diário das vendas registradas
- Acompanhamento das compras de estoque
- Cálculo do lucro bruto estimado
- Registro e acompanhamento de perdas
- Cadastro de despesas
- Consulta financeira por data
- Organização das movimentações por forma de pagamento

### Conferência de caixa

- Registro do fundo inicial do caixa
- Cálculo do dinheiro esperado na gaveta
- Consideração das vendas, compras e despesas pagas em dinheiro
- Registro do valor contado no fechamento
- Cálculo da diferença entre o valor esperado e o valor contado

### Formas de pagamento

O sistema permite registrar movimentações utilizando:

- Pix
- Dinheiro
- Débito
- Crédito
- Boleto

### Armazenamento e sincronização

- Armazenamento local de dados com LocalStorage
- Integração com Supabase para persistência dos dados
- Autenticação de usuários
- Verificação de autorização para acessar o estoque compartilhado
- Sincronização dos dados com o Supabase
- Atualização de dados em tempo real

> **Nota:** o funcionamento desses recursos depende da configuração correta do Supabase, do banco de dados e das permissões de acesso.

---

## Tecnologias utilizadas

| Tecnologia | Finalidade |
| --- | --- |
| HTML5 | Estrutura da aplicação |
| CSS3 | Estilização da interface |
| JavaScript | Lógica, validações e funcionalidades |
| Supabase | Banco de dados, autenticação e sincronização |
| LocalStorage | Armazenamento local no navegador |
| Git | Controle de versão |
| GitHub | Hospedagem do código-fonte e versionamento |
| Cloudflare | Hospedagem da aplicação quando publicada |

---

## Estrutura do projeto

```text
SGE/
├── index.html
├── styles.css
├── script.js
├── supabase-auth.js
├── supabase-config.js
└── README.md
```

### Principais arquivos

| Arquivo | Descrição |
| --- | --- |
| `index.html` | Estrutura da interface e dos formulários |
| `styles.css` | Estilos e apresentação visual |
| `script.js` | Funcionalidades de estoque, movimentações, relatórios e caixa |
| `supabase-auth.js` | Autenticação, autorização e sincronização dos dados |
| `supabase-config.js` | Configuração da conexão com o Supabase |
| `README.md` | Documentação do projeto |

---

## Segurança e validação

O projeto utiliza recursos como:

- Validação de dados dos produtos e das movimentações
- Verificação de valores numéricos e quantidades
- Tratamento de erros durante operações de armazenamento
- Escape de caracteres especiais em textos inseridos na interface
- Autenticação e verificação de autorização antes de carregar o estoque compartilhado

> **Nota:** a segurança efetiva também depende das políticas de acesso configuradas no Supabase e das permissões aplicadas no banco de dados.

---

## Objetivo do projeto

O objetivo do SGE é desenvolver uma solução prática para auxiliar pequenos comércios no controle de seus produtos, movimentações de estoque e informações financeiras.

O projeto também representa a aplicação prática de conhecimentos de programação, desenvolvimento web, integração com banco de dados e publicação de aplicações.

---

## Conhecimentos aplicados

- Estruturação de páginas com HTML5
- Estilização de interfaces com CSS3
- Lógica de programação com JavaScript
- Manipulação de dados e eventos
- Validação de formulários e tratamento de erros
- Armazenamento local com LocalStorage
- Integração com banco de dados e autenticação
- Sincronização de informações entre usuários autorizados
- Versionamento de código com Git e GitHub
- Configuração de hospedagem para aplicações web

---

## Status do projeto

🚧 **Em desenvolvimento e aprimoramento.**

A aplicação está temporariamente fora do ar enquanto passa por ajustes e melhorias. O repositório continua disponível para consulta do código-fonte e acompanhamento do desenvolvimento.

---

## Autor

**Gabriel Messi Cabral da Silva**

GitHub: [@gabrielmessi](https://github.com/gabrielmessi)

---

*Projeto desenvolvido para fins práticos de aprendizado e aplicação de conhecimentos em desenvolvimento web.*

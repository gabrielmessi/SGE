SGE — Sistema de Gestão de Estoque

O SGE (Sistema de Gestão de Estoque) é uma aplicação web desenvolvida para auxiliar no gerenciamento de produtos, controle de movimentações de estoque e acompanhamento financeiro de pequenos comércios.

O projeto foi desenvolvido com HTML, CSS e JavaScript, integrando o Supabase para armazenamento de dados, autenticação e sincronização entre usuários autorizados.

Status: a aplicação está temporariamente fora do ar por decisão do desenvolvedor. O repositório permanece disponível para consulta do código-fonte e acompanhamento do projeto.

Funcionalidades

* Gestão de produtos: cadastro, edição, consulta e exclusão de produtos.
* Categorias: organização dos produtos por categoria.
* Controle de estoque: acompanhamento das quantidades disponíveis e definição de estoque mínimo.
* Alertas de estoque: identificação de produtos que precisam de reposição ou estão esgotados.
* Movimentações de estoque: registro de compras, vendas e perdas.
* Histórico de movimentações: consulta dos registros das operações realizadas.
* Controle financeiro: acompanhamento de receitas, custos, despesas e perdas.
* Controle de caixa: recursos para acompanhamento das operações financeiras.
* Autenticação e autorização: controle de acesso conforme as permissões configuradas.
* Banco de dados em nuvem: integração com Supabase para persistência dos dados.
* Sincronização: atualização dos dados entre usuários autorizados, conforme a configuração do sistema.

Tecnologias utilizadas

Tecnologia	Finalidade
HTML5	Estrutura da aplicação
CSS3	Estilização e layout responsivo
JavaScript	Lógica, validações e funcionalidades
Supabase	Banco de dados e autenticação
LocalStorage	Armazenamento local e apoio à persistência de dados
Git	Controle de versão
GitHub	Hospedagem do código-fonte
Cloudflare Workers	Ambiente de publicação utilizado durante o desenvolvimento

Estrutura do projeto

SGE/
├── index.html          # Estrutura da aplicação
├── styles.css          # Estilos da interface
├── script.js           # Lógica e funcionalidades do sistema
├── supabase-auth.js    # Autenticação e integração com o Supabase
├── supabase-config.js  # Configuração da integração
└── README.md           # Documentação do projeto

Arquitetura e funcionamento

O SGE utiliza JavaScript para executar as principais funcionalidades da interface e gerenciar as operações realizadas pelo usuário.

A integração com o Supabase permite armazenar informações remotamente e implementar autenticação e controle de acesso. O LocalStorage também é utilizado como parte da estratégia de armazenamento da aplicação.

A disponibilidade e o funcionamento dos recursos dependem da configuração dos serviços integrados e das respectivas permissões de acesso.

Objetivo do projeto

O objetivo do SGE é desenvolver uma solução prática para organização de estoque e acompanhamento financeiro, aplicando conhecimentos de desenvolvimento web em um projeto próprio.

Durante seu desenvolvimento, foram trabalhados conceitos como:

* Manipulação do DOM com JavaScript.
* Validação de dados e tratamento de erros.
* Organização de funcionalidades e responsabilidades.
* Persistência de dados no navegador.
* Integração com banco de dados em nuvem.
* Autenticação e controle de permissões.
* Sincronização de informações.
* Versionamento e gerenciamento de código com Git e GitHub.
* Publicação de aplicações web.

Status do projeto

Em desenvolvimento e aprimoramento.

A publicação da aplicação web foi suspensa temporariamente por decisão do desenvolvedor. O código-fonte continua disponível neste repositório para consulta e evolução futura.

O projeto poderá voltar a ser publicado quando o desenvolvedor decidir retomar sua disponibilização.

Autor

Gabriel Messi Cabral da Silva

* GitHub: @gabrielmessi
* Repositório: github.com/gabrielmessi/SGE

⸻

Projeto desenvolvido de forma prática para aprendizado, experimentação e construção de portfólio na área de desenvolvimento web.

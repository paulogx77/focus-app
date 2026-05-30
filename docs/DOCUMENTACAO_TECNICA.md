# Documentacao Tecnica - Focus 2.0

## 1. Introducao

Este documento apresenta uma descricao tecnica e conceitual do projeto **Focus**, enfatizando sua arquitetura, seus componentes, o fluxo de persistencia de dados e a estrategia offline first adotada. O texto foi elaborado com linguagem orientada a registro academico, com o objetivo de apoiar apresentacoes, entregas de projeto e futuras manutencoes.

## 2. Contextualizacao Do Problema

Aplicacoes mobile voltadas ao acompanhamento de habitos exigem disponibilidade constante, inclusive em contextos de conectividade instavel. Em cenarios dessa natureza, uma dependencia exclusiva de persistencia remota comprometeria a usabilidade. Por essa razao, o Focus 2.0 foi projetado para operar segundo o paradigma **offline first**, no qual o armazenamento local e a base primaria de funcionamento, enquanto a sincronizacao remota ocorre de maneira complementar.

O projeto atende, portanto, a dois objetivos simultaneos:

1. manter a experiencia do usuario funcional sem internet;
2. disponibilizar persistencia remota para sincronizacao e restauracao posterior do estado da aplicacao.

## 3. Objetivos Do Sistema

Os objetivos tecnicos do sistema podem ser descritos da seguinte forma:

- prover um aplicativo mobile para gerenciamento de habitos;
- assegurar persistencia local confiavel no dispositivo;
- implementar uma API externa para armazenamento remoto;
- realizar sincronizacao automatica quando houver conectividade;
- permitir recuperacao de dados em outro dispositivo quando existir estado remoto salvo.

## 4. Arquitetura Geral

O sistema esta organizado em duas grandes camadas:

### 4.1 Camada cliente

Corresponde ao aplicativo mobile construido com React Native e Expo. Essa camada contem:

- interface do usuario;
- navegacao;
- gerenciamento de estado;
- persistencia local em `SQLite`;
- deteccao de conectividade;
- logica de sincronizacao remota.

### 4.2 Camada servidora

Corresponde a uma API HTTP desenvolvida com Fastify. Essa camada contem:

- validacao de payloads;
- persistencia remota do snapshot do usuario;
- endpoint de leitura do estado remoto;
- banco de dados SQLite gerenciado por Prisma.

## 5. Descricao Das Tecnologias Utilizadas

### 5.1 React Native

Responsavel pela construcao da interface mobile multiplataforma.

### 5.2 Expo

Fornece o ambiente de desenvolvimento, o bundler, a integracao com modulos nativos e a experiencia de execucao em desenvolvimento.

### 5.3 TypeScript

Empregado para aumentar a seguranca de tipos e a previsibilidade do comportamento do codigo.

### 5.4 React Navigation

Utilizado na organizacao das telas e dos fluxos de navegacao do aplicativo.

### 5.5 expo-sqlite

Biblioteca responsavel pelo banco local do aplicativo, permitindo operacao offline com persistencia estruturada.

### 5.6 expo-network

Utilizado para detectar o estado de conectividade do dispositivo e, assim, decidir quando a sincronizacao remota pode ocorrer.

### 5.7 Fastify

Framework HTTP do back end, escolhido por sua simplicidade e bom desempenho.

### 5.8 Prisma

ORM empregado para definir o esquema do banco remoto e facilitar a persistencia dos dados no lado servidor.

### 5.9 Zod

Biblioteca de validacao empregada no back end para verificar a estrutura dos payloads recebidos.

### 5.10 pnpm

Gerenciador de pacotes utilizado para instalacao de dependencias e execucao dos scripts padronizados do projeto.

## 6. Estrutura De Pastas

### 6.1 Raiz do projeto

- `App.tsx`: ponto de entrada do app
- `app.json`: configuracao base do Expo
- `app.config.js`: injecao dinamica da URL de sincronizacao
- `package.json`: scripts e dependencias do app
- `pnpm-workspace.yaml`: definicao do workspace incluindo a API

### 6.2 Pasta `src/`

- `components/`: componentes reutilizaveis de interface
- `context/`: contexto global da aplicacao
- `data/`: dados auxiliares e listas estaticas
- `navigation/`: definicoes de navegacao
- `screens/`: telas do aplicativo
- `state/`: regras centrais de manipulacao do estado
- `storage/`: camada de persistencia local
- `sync/`: servicos de sincronizacao remota
- `utils/`: funcoes utilitarias
- `types.ts`: tipos compartilhados

### 6.3 Pasta `api/`

- `src/`: codigo da API
- `prisma/`: esquema do banco e base SQLite de desenvolvimento
- `package.json`: scripts do back end
- `README.md`: guia resumido da API

### 6.4 Pasta `scripts/`

- `dev.js`: sobe app e API de modo integrado
- `dev-lan.js`: sobe o ambiente para uso na rede local
- `dev-tunnel.js`: sobe o ambiente com suporte ao modo tunnel do Expo

## 7. Modelo Conceitual De Dados

O sistema trabalha com tres entidades centrais.

### 7.1 Usuario

Representa a identidade principal do sujeito que utiliza o aplicativo.

Campos relevantes:

- `syncId`
- `name`
- `email`
- `picture`
- `provider`
- `focusGoal`
- `accentColor`
- `notificationsEnabled`
- `visualPreference`

### 7.2 Habito

Representa uma atividade recorrente monitorada pelo usuario.

Campos relevantes:

- `id`
- `name`
- `description`
- `icon`
- `category`
- `frequency`
- `daysOfWeek`
- `goalValue`
- `goalUnit`
- `color`
- `isActive`
- `createdAt`

### 7.3 Check-in

Representa o registro de execucao de um habito em uma data especifica.

Campos relevantes:

- `id`
- `habitId`
- `habitName`
- `habitColor`
- `date`
- `value`
- `note`
- `createdAt`

## 8. Estado Global Da Aplicacao

O estado da aplicacao e representado por um snapshot composto por:

- `user`
- `habits`
- `checkIns`

Esse snapshot e mantido em memoria e tambem persistido localmente. Sempre que uma operacao relevante ocorre, o estado e recalculado, persistido no repositrio local e, quando possivel, sincronizado remotamente.

## 9. Funcionamento Da Persistencia Local

O armazenamento local e implementado por meio do arquivo `src/storage/SqliteStoreRepository.ts`.

Essa camada e responsavel por:

- criar e manter as tabelas locais;
- salvar o perfil do usuario;
- gravar habitos;
- gravar check-ins;
- consultar resumos para a tela de hoje;
- consultar metricas do dashboard;
- consultar secoes do historico.

Em termos conceituais, o repositorio local funciona como a fonte primaria de operacao da aplicacao no uso cotidiano.

## 10. Funcionamento Da Persistencia Remota

No lado servidor, o armazenamento remoto e modelado pelo arquivo `api/prisma/schema.prisma` e manipulado pelas rotas em `api/src/routes.ts`.

Na versao atual, a API trabalha com a ideia de **snapshot completo**. Em vez de receber pequenas operacoes incrementais, ela recebe o estado inteiro do usuario e substitui o estado remoto existente.

Essa estrategia simplifica a sincronizacao e a validacao, embora possa futuramente evoluir para modelos incrementais ou com resolucao de conflitos.

## 11. Fluxo Offline First

O comportamento offline first pode ser entendido pelo seguinte encadeamento logico.

### 11.1 Atualizacao local imediata

Quando o usuario cria um habito ou realiza um check-in, a alteracao e aplicada ao estado local e persistida no banco do dispositivo.

### 11.2 Continuidade sem internet

Se o dispositivo estiver sem internet, a aplicacao continua operando normalmente porque a persistencia local nao depende da API externa.

### 11.3 Sincronizacao posterior

Quando a conectividade retorna, o app compara sua situacao atual com os metadados de sincronizacao e, caso existam alteracoes pendentes, envia o snapshot local para a API remota.

### 11.4 Restauracao remota

Quando um usuario inicia sessao em um dispositivo que ainda nao possui habitos ou check-ins locais, o app pode consultar a API e restaurar o snapshot remoto armazenado.

## 12. Fluxo De Sincronizacao

O projeto opera com dois movimentos complementares.

### 12.1 Push

O app envia o estado local atual para a API por meio de:

```http
PUT /v1/users/:userId/state
```

### 12.2 Pull

O app recupera o estado remoto quando necessario por meio de:

```http
GET /v1/users/:userId/state
```

## 13. Exemplo De Sincronizacao

Considere o seguinte cenario:

1. o usuario cria dois habitos no aparelho A sem internet;
2. o app grava os dados no `SQLite` local;
3. mais tarde, o aparelho A volta a ter internet;
4. o app envia o snapshot para a API;
5. a API salva esse snapshot em seu banco remoto;
6. o usuario instala o app no aparelho B;
7. ao entrar com o mesmo identificador estavel, o app detecta que o estado local ainda esta vazio;
8. o app consulta a API e restaura os habitos e check-ins no aparelho B.

## 14. Exemplos De Payloads

### 14.1 Exemplo de envio para a API

```json
{
  "state": {
    "user": {
      "syncId": "google:123456",
      "name": "Paulo Silva",
      "email": "paulo@email.com",
      "provider": "google",
      "focusGoal": "Ler diariamente",
      "accentColor": "#7C3AED",
      "notificationsEnabled": false,
      "visualPreference": "glass"
    },
    "habits": [
      {
        "id": 1,
        "name": "Leitura",
        "description": "20 minutos por dia",
        "icon": "book-open-page-variant",
        "category": "Estudo",
        "frequency": "daily",
        "daysOfWeek": [],
        "goalValue": "20",
        "goalUnit": "min",
        "color": "#7C3AED",
        "isActive": true,
        "createdAt": "2026-05-29T10:00:00.000Z"
      }
    ],
    "checkIns": [
      {
        "id": 1,
        "habitId": 1,
        "habitName": "Leitura",
        "habitColor": "#7C3AED",
        "date": "2026-05-29",
        "value": 1,
        "note": "atividade concluida",
        "createdAt": "2026-05-29T21:00:00.000Z"
      }
    ]
  }
}
```

### 14.2 Exemplo de resposta da API apos sincronizacao

```json
{
  "userId": "google:123456",
  "habitsCount": 1,
  "checkInsCount": 1,
  "syncedAt": "2026-05-29T21:15:00.000Z"
}
```

## 15. Autenticacao E Identidade

O sistema admite duas formas de entrada:

- autenticacao local por nome;
- autenticacao Google no ambiente web.

Do ponto de vista de sincronizacao entre dispositivos, o identificador mais robusto e o **identificador estavel do usuario**. No caso do login Google, esse identificador e derivado do `sub` retornado pelo provedor e passa a compor o `syncId`.

Isso significa que a recuperacao remota entre dispositivos e mais confiavel quando o usuario utiliza um login com identidade persistente. O login local por nome e suficiente para uso individual no aparelho, mas nao possui o mesmo grau de confiabilidade para migracao entre dispositivos.

## 16. Como Rodar O Projeto

### 16.1 Instalacao

```bash
pnpm install
```

### 16.2 Execucao integrada local

```bash
pnpm dev
```

### 16.3 Execucao integrada em LAN

```bash
pnpm dev:lan
```

### 16.4 Execucao integrada em tunnel

```bash
pnpm dev:tunnel
```

### 16.5 Execucao isolada da API

```bash
pnpm --dir api dev
```

### 16.6 Execucao isolada do app

```bash
pnpm start
```

## 17. Scripts Disponiveis

### Na raiz do projeto

- `pnpm dev`
- `pnpm dev:lan`
- `pnpm dev:tunnel`
- `pnpm start`
- `pnpm android`
- `pnpm ios`
- `pnpm web`

### Na pasta `api/`

- `pnpm --dir api setup`
- `pnpm --dir api dev`
- `pnpm --dir api build`
- `pnpm --dir api prisma:generate`
- `pnpm --dir api prisma:push`

## 18. Validacao Tecnica Recomendada

Para verificar o estado tecnico do projeto, recomenda-se:

```bash
npx tsc --noEmit
pnpm --dir api build
```

Esses comandos conferem, respectivamente, a integridade da tipagem do app e a compilacao do back end.

## 19. Limitacoes Atuais

Na versao atual, algumas limitacoes devem ser reconhecidas:

- a sincronizacao e baseada em snapshot completo, e nao em eventos incrementais;
- o login Google ainda nao esta plenamente habilitado no fluxo nativo do app;
- a recuperacao remota depende de um identificador estavel para ser plenamente confiavel;
- o modo `tunnel` pode depender de configuracoes adicionais do Expo no ambiente local.

## 20. Possibilidades De Evolucao

As principais evolucoes recomendadas para etapas futuras sao:

- sincronizacao incremental;
- resolucao de conflitos entre estado local e remoto;
- autenticacao estavel em ambiente nativo;
- recuperacao manual de backup pela interface;
- substituicao do banco remoto SQLite por PostgreSQL em producao.

## 21. Conclusao

O Focus 2.0 demonstra uma arquitetura coerente para um aplicativo mobile com funcionamento offline first e suporte a persistencia remota. O sistema foi organizado de modo a privilegiar disponibilidade local, manutencao simples e capacidade de evolucao futura. Em um contexto academico, o projeto exemplifica de forma clara a integracao entre aplicacao mobile, banco local, API de sincronizacao e banco remoto.

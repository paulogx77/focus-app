# Focus 2.0

## 1. Apresentacao

O **Focus 2.0** e uma aplicacao mobile para acompanhamento de habitos, rotina e consistencia pessoal. O projeto foi concebido em **React Native com Expo**, utilizando **TypeScript** em toda a base principal. A versao atual da aplicacao representa a continuidade de uma primeira etapa do produto, com a introducao de uma **arquitetura offline first** apoiada por uma **API externa de sincronizacao**.

Em termos funcionais, a aplicacao permite:

- autenticacao local com usuario e senha;
- cadastro, edicao, ativacao, desativacao e exclusao de habitos;
- registro de check-ins diarios com valor numerico e observacoes;
- visualizacao de hoje, dashboard, historico e perfil;
- persistencia local em banco `SQLite`;
- sincronizacao remota com uma API externa quando ha conectividade.

## 2. Objetivo Academico

O projeto atende ao principio de continuidade de uma aplicacao ja existente, acrescentando dois elementos centrais:

1. uma aplicacao **back end** responsavel pela persistencia remota;
2. um comportamento **offline first**, no qual o dispositivo preserva os dados localmente e realiza a persistencia remota assim que a conexao com a web estiver disponivel.

Assim, o uso cotidiano permanece funcional mesmo sem internet, ao passo que a API externa atua como mecanismo de sincronizacao e recuperacao de estado entre dispositivos.

## 3. Stack Tecnologica

### Aplicacao mobile

- React Native
- Expo
- TypeScript
- React Navigation
- expo-sqlite
- expo-network

### Back end

- Node.js
- Fastify
- Prisma ORM
- SQLite
- Zod

### Ferramentas de desenvolvimento

- pnpm
- Expo CLI
- tsx
- TypeScript Compiler

## 4. Estrutura Geral Do Repositorio

```text
Focus2.0/
|- App.tsx
|- app.json
|- app.config.js
|- package.json
|- pnpm-workspace.yaml
|- README.md
|- RegrasDeNegocio.md
|- docs/
|  \- DOCUMENTACAO_TECNICA.md
|- scripts/
|  |- dev.js
|  |- dev-lan.js
|  \- dev-tunnel.js
|- src/
|  |- components/
|  |- context/
|  |- data/
|  |- navigation/
|  |- screens/
|  |- state/
|  |- storage/
|  |- sync/
|  |- utils/
|  \- types.ts
\- api/
   |- package.json
   |- README.md
   |- prisma/
   \- src/
```

## 5. Funcionamento Em Alto Nivel

O funcionamento do sistema pode ser resumido em quatro etapas:

1. o usuario interage com a interface mobile;
2. o estado da aplicacao e atualizado em memoria e salvo no `SQLite` local;
3. quando a internet esta disponivel, o app envia o snapshot atual para a API;
4. em um novo dispositivo, se houver um snapshot remoto e o estado local estiver vazio, o app pode recuperar os dados da API e restaurar o contexto local.

## 6. Fluxo Offline First

O projeto adota uma estrategia **local first com sincronizacao remota posterior**.

### Etapa 1. Persistencia local

Toda alteracao feita pelo usuario e gravada primeiro no banco local do dispositivo. Isso significa que a aplicacao continua utilizavel mesmo na ausencia de conexao com a internet.

### Etapa 2. Deteccao de conectividade

O contexto global monitora a conectividade do dispositivo por meio de `expo-network`.

### Etapa 3. Sincronizacao remota

Quando a aplicacao identifica que ha internet e a URL da API esta configurada, o estado local e enviado para a rota remota de sincronizacao.

### Etapa 4. Restauracao remota

Se o usuario estiver em um dispositivo novo, com o estado local ainda vazio, e houver um snapshot remoto armazenado, o app pode baixar esse snapshot e reconstruir o estado local automaticamente.

## 7. Execucao Do Projeto

### 7.1 Requisitos

- Node.js instalado
- pnpm instalado
- Expo Go no celular, ou emulador/simulador local

### 7.2 Instalacao

```bash
pnpm install
```

Observacao: como o repositorio passou por transicao de `npm` para `pnpm`, pode ser necessario limpar `node_modules` em ambientes antigos antes de uma reinstalacao completa.

### 7.3 Inicializacao padrao

```bash
pnpm dev
```

Esse comando:

- executa o setup da API;
- sobe a API localmente na porta `3333`;
- inicia o Expo;
- injeta no app a URL de sincronizacao correspondente ao ambiente local.

### 7.4 Inicializacao para celular na mesma rede

```bash
pnpm dev:lan
```

Esse modo:

- detecta o IP local da maquina;
- configura a sincronizacao remota para esse IP;
- inicia o Expo em modo LAN.

### 7.5 Inicializacao alternativa via tunnel

```bash
pnpm dev:tunnel
```

Esse modo deve ser utilizado quando o QR Code nao funciona adequadamente em rede local. O funcionamento depende do suporte de tunnel do Expo no ambiente utilizado.

### 7.6 Execucao isolada da API

```bash
pnpm --dir api dev
```

### 7.7 Execucao isolada do app

```bash
pnpm start
```

### 7.8 Execucao por plataforma

```bash
pnpm android
pnpm ios
pnpm web
```

## 8. Exemplos De Uso

### Exemplo 1. Uso sem internet

1. o usuario abre o app sem conexao;
2. cadastra um habito chamado `Leitura`;
3. realiza um check-in no dia atual;
4. o app salva esses dados no `SQLite` local;
5. nenhum dado remoto e enviado nesse momento.

### Exemplo 2. Persistencia remota posterior

1. o mesmo usuario volta a ter internet;
2. o app identifica conectividade;
3. o snapshot local e enviado para a API;
4. a API grava o estado completo do usuario no banco remoto.

### Exemplo 3. Recuperacao em outro dispositivo

1. o usuario instala o app em outro dispositivo;
2. realiza login com um identificador estavel;
3. o app verifica que o estado local ainda esta vazio;
4. a aplicacao consulta a API;
5. se houver snapshot remoto, os dados sao restaurados localmente.

## 9. Arquivos Relevantes

- `App.tsx`: ponto de entrada da aplicacao
- `src/context/AppStateContext.tsx`: coordenacao do estado global e da sincronizacao
- `src/state/AppStateManager.ts`: regras de atualizacao do estado da aplicacao
- `src/storage/SqliteStoreRepository.ts`: persistencia local com `SQLite`
- `src/sync/syncService.ts`: servicos de sincronizacao remota
- `src/navigation/AppNavigator.tsx`: navegacao principal
- `api/src/routes.ts`: rotas de autenticacao e sincronizacao
- `api/prisma/schema.prisma`: esquema do banco remoto
- `scripts/dev.js`: orquestracao do ambiente de desenvolvimento

## 10. Documentacao Completa

Para uma descricao detalhada da arquitetura, do fluxo de sincronizacao, do modelo de dados, dos scripts de execucao e de exemplos tecnicos, consulte:

- `docs/DOCUMENTACAO_TECNICA.md`
- `docs/GUIA_EXECUCAO_MOBILE.md`

## 11. Consideracoes Finais

O Focus 2.0 foi estruturado para demonstrar uma abordagem moderna de aplicacao mobile com persistencia local robusta e sincronizacao remota posterior. A arquitetura adotada busca equilibrar disponibilidade, simplicidade de manutencao e evolucao progressiva do sistema.

# Focus Sync API

## 1. Apresentacao

Esta pasta contem a API externa do projeto **Focus 2.0**, responsavel pela persistencia remota do estado do usuario. Sua funcao principal e complementar a estrategia offline first do aplicativo mobile, armazenando remotamente um snapshot do estado local sempre que houver conectividade.

## 2. Tecnologias Utilizadas

- Node.js
- Fastify
- Prisma ORM
- SQLite
- Zod
- TypeScript

## 3. Responsabilidades Da API

A API possui quatro responsabilidades centrais:

1. receber o snapshot completo do estado de um usuario;
2. persistir esse snapshot em banco remoto;
3. disponibilizar o snapshot salvo para recuperacao posterior;
4. registrar eventos de sincronizacao para auditoria basica.

## 4. Execucao

### Instalacao

No contexto do workspace, a instalacao costuma ocorrer a partir da raiz:

```bash
pnpm install
```

### Preparacao do banco

```bash
pnpm --dir api setup
```

Esse comando executa:

- geracao do client Prisma;
- aplicacao do schema ao banco local de desenvolvimento.

### Modo de desenvolvimento

```bash
pnpm --dir api dev
```

### Build

```bash
pnpm --dir api build
```

## 5. Configuracao

O arquivo `.env` utilizado em desenvolvimento define, entre outros, os seguintes parametros:

```env
DATABASE_URL="file:./dev.db"
PORT=3333
```

## 6. Endpoints

### `GET /health`

Retorna o estado basico da API.

Exemplo de resposta:

```json
{
  "status": "ok"
}
```

### `PUT /v1/users/:userId/state`

Recebe o snapshot completo do usuario e o persiste no banco remoto.

Exemplo de payload:

```json
{
  "state": {
    "user": {
      "name": "Paulo",
      "email": "paulo@email.com",
      "provider": "local",
      "focusGoal": "Ler todos os dias",
      "accentColor": "#7C3AED",
      "notificationsEnabled": false,
      "visualPreference": "glass"
    },
    "habits": [
      {
        "id": 1,
        "name": "Leitura",
        "description": "20 minutos",
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
        "note": "feito",
        "createdAt": "2026-05-29T21:00:00.000Z"
      }
    ]
  }
}
```

Exemplo de resposta:

```json
{
  "userId": "f0c3a3d0-0000-4000-8000-000000000000",
  "habitsCount": 1,
  "checkInsCount": 1,
  "syncedAt": "2026-05-29T21:15:00.000Z"
}
```

### `GET /v1/users/:userId/state`

Retorna o snapshot mais recente do usuario.

## 7. Modelo De Persistencia

O modelo atual e baseado em **snapshot completo**. Isso significa que cada sincronizacao substitui o estado remoto anterior do usuario por um novo estado integral. Essa decisao simplifica a integracao com o app mobile, embora futuras evolucoes possam incluir sincronizacao incremental e resolucao de conflitos.

## 8. Integracao Com O App Mobile

Do ponto de vista do aplicativo mobile, a API opera da seguinte forma:

1. o app salva localmente no `SQLite` do dispositivo;
2. quando a conectividade e detectada, envia o estado atual para esta API;
3. se um novo dispositivo iniciar com o mesmo identificador de sincronizacao, o app pode consultar esta API para restaurar o snapshot remoto.

## 9. Consideracoes Finais

Esta API foi projetada como uma camada de persistencia remota simples, clara e apropriada para o contexto academico do projeto. Sua implementacao prioriza legibilidade, previsibilidade e compatibilidade com a estrategia offline first adotada no cliente mobile.

# Focus 2.0

App mobile de hábitos feito com **React Native + Expo**.

## O que faz

- Faz login simples com nome do usuário.
- Permite criar, editar, ativar/desativar e excluir hábitos.
- Registra check-ins diários com quantidade/progresso.
- Mostra visão de hoje, dashboard e histórico.
- Salva tudo localmente no aparelho.

## Como funciona

- A entrada do app é o `App.tsx`.
- A navegação tem uma tela de login e, depois, abas principais.
- Os dados ficam em `AsyncStorage`, então continuam salvos mesmo fechando o app.

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o projeto:

```bash
npm start
```

3. Se quiser abrir direto em uma plataforma:

```bash
npm run android
npm run ios
npm run web
```

## Requisitos

- Node.js instalado
- Expo Go no celular, ou emulador/simulador local

## Estrutura principal

- `App.tsx` - bootstrap do app
- `src/navigation` - navegação
- `src/screens` - telas
- `src/context` e `src/state` - estado da aplicação
- `src/storage` - persistência local

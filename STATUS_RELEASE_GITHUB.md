# Status da release para GitHub

## Resumo executivo

- Objetivo desta rodada: deixar a versao atual mais confiavel para subir ao GitHub.
- Notificacoes foram desativadas globalmente.
- Build local antigo foi limpo.
- Foram corrigidos bugs de confiabilidade fora das notificacoes.
- As validacoes principais passaram.

## O que foi alterado nesta rodada

1. Notificacoes removidas do runtime e do build.
2. Plugin `expo-notifications` removido de `app.json`.
3. Dependencia `expo-notifications` removida de `package.json` e `package-lock.json`.
4. Tela de perfil ajustada para exibir notificacoes como desativadas, sem botoes de teste/reagendamento.
5. Estado do usuario normalizado para manter `notificationsEnabled: false`.
6. `signOut` corrigido para limpar tambem habitos e check-ins, evitando vazamento de dados entre usuarios.
7. Hidratacao e queries assicronas ganharam tratamento minimo de erro para nao travar silenciosamente.
8. Login Google foi restringido no app nativo; com a configuracao atual ele fica disponivel apenas no web.
9. Selecao de persistencia separada por plataforma:
10. Nativo usa `SQLite`.
11. Web usa `LocalStoreRepository`.
12. Script `npm run doctor` corrigido para usar `npx expo-doctor`.
13. Dependencias Expo alinhadas com o SDK 54 (`expo` e `expo-font`).
14. `dist/` e `.expo/` foram limpos; `dist/` foi recriado apenas para validacao e removido de novo.

## Bugs encontrados e status

### Corrigidos

- Notificacoes instaveis: funcionalidade desligada para nao entrar bug conhecido na versao.
- Vazamento de dados apos logout: corrigido em `src/state/AppStateManager.ts`.
- Possivel travamento silencioso na hidratacao: mitigado em `src/context/AppStateContext.tsx`.
- Falha silenciosa em queries assicronas: mitigada em `src/context/useAppQuery.ts`.
- Export web quebrando por causa de `expo-sqlite`: corrigido com fabrica de repositorio por plataforma.
- Script `doctor` quebrado no ambiente local: corrigido em `package.json`.

### Ainda abertos / observacoes

- `npm audit` reportou 17 vulnerabilidades moderadas nas dependencias atuais.
- O README e `RegrasDeNegocio.md` ainda mencionam notificacoes como se estivessem ativas; isso esta desatualizado em relacao ao codigo.
- O login Google nativo nao esta habilitado por falta de `client IDs` especificos de Android/iOS.

## Situacao atual do "cambo"

- Nao encontrei nenhuma ocorrencia de `cambo`, `cambio` ou `combo` no codigo-fonte, configuracoes ou documentacao principal.
- Hoje nao existe no projeto nenhum modulo, tela, componente, tipo ou fluxo com esse nome.
- Se "cambo" era o nome esperado de alguma funcionalidade, o ponto continua em aberto e precisa de confirmacao manual.

## Como o app esta sendo usado hoje

### Fluxo principal

1. Entrada por `App.tsx`.
2. Provider global em `src/context/AppStateContext.tsx`.
3. Navegacao em `src/navigation/AppNavigator.tsx`.
4. Telas principais por abas: `Hoje`, `Habitos`, `Dashboard`, `Historico`, `Perfil`.
5. Tela modal para cadastro/edicao de habito: `AddHabit`.

### Login

- Login local por nome continua ativo.
- Login Google permanece no web.
- Login Google foi desativado no nativo para evitar um fluxo quebrado com a configuracao atual.

### Persistencia

- Android/iOS: `SqliteStoreRepository`.
- Web: `LocalStoreRepository`.
- Migracao legado -> `SQLite` continua no nativo quando houver estado anterior.

### Perfil

- Permite editar nome, meta principal, avatar, cor de destaque e preferencia visual.
- Notificacoes aparecem apenas como desativadas.

## Validacoes executadas

- `npx tsc --noEmit`: passou.
- `npm run doctor`: passou apos alinhar script e versoes Expo.
- `npx expo export --platform web`: passou apos separar a persistencia por plataforma.
- `dist/` gerado nessa validacao foi removido em seguida para manter a arvore limpa.

## Arquivos principais tocados nesta rodada

- `app.json`
- `package.json`
- `package-lock.json`
- `src/context/AppStateContext.tsx`
- `src/context/useAppQuery.ts`
- `src/screens/LoginScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/state/AppStateManager.ts`
- `src/storage/AppStateStorage.ts`
- `src/storage/createAppStateRepository.ts`
- `src/storage/createAppStateRepository.native.ts`
- `src/notifications/notificationService.ts` removido

## Situacao atual do worktree

- O repositorio ja estava com varias alteracoes antes desta rodada.
- Alem dos arquivos acima, existem outros arquivos modificados e nao rastreados no worktree atual.
- Eu nao reverti nada preexistente.
- Para subir uma versao confiavel, vale revisar o diff completo antes do commit final, porque ha trabalho em paralelo no repositorio.

## Recomendacao para subida

- Esta base esta mais estavel do que no inicio desta rodada.
- O minimo tecnico para subir com seguranca melhorou bastante.
- Antes do push final, eu recomendo revisar o diff completo e decidir se o login Google nativo deve continuar oculto ou ser configurado de vez com IDs reais.

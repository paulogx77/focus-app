# Focus 2.0 - Documento de Produto

## 1. Visao Geral

O **Focus** e um app mobile de habitos, rotina e consistencia pessoal.
A proposta e unir acompanhamento simples com uma experiencia visual premium, identidade de usuario e evolucao gradual do produto.

Este documento serve como a referencia para decisoes de produto, design e implementacao.

## 2. Objetivo Do Produto

- Ajudar o usuario a criar e manter habitos.
- Mostrar progresso de forma clara e motivadora.
- Guardar dados com persistencia confiavel.
- Permitir login com Google e personalizacao de perfil.
- Evoluir para insights e features mais inteligentes no futuro.

## 3. Direcao Da Experiencia

O app deve passar uma sensacao de:
- moderno;
- elegante;
- escuro;
- leve;
- sofisticado.

Nao queremos uma interface corporativa comum. Queremos um produto com identidade.

## 4. Feature Principal Nova

### 4.1 Login Com Google

O login passa a ser a porta de entrada principal do app.

Requisitos:
- autenticar com Google;
- manter sessao salva;
- preencher nome e foto quando possivel;
- permitir logout;
- tratar falhas com feedback simples.

Motivo:
- reduz atrito;
- deixa o app mais serio;
- prepara o caminho para sincronizacao futura.

### 4.2 Tela De Perfil

A tela de perfil sera a area de personalizacao do usuario.

Campos sugeridos:
- foto ou avatar;
- nome exibido;
- objetivo principal;
- preferencia de notificacoes;
- preferencia de visual;
- logout.

### 4.3 Glassmorphism

Manter o tema escuro atual, mas evoluir o visual para vidro fosco.

Diretrizes:
- cards transluidos;
- blur suave;
- borda fina com opacidade baixa;
- sombras discretas;
- destaque roxo preservado;
- legibilidade acima de qualquer efeito.

## 5. Escopo Funcional

### 5.1 Ja Existe / Base Do App

- login simples;
- hoje;
- habitos;
- dashboard;
- historico;
- cadastro de habitos;
- check-in diario;
- progresso numerico;
- analise de streak e taxas.

### 5.2 Proximas Features Em Destaque

- login com Google;
- tela de perfil;
- personalizacao visual;
- banco de dados de verdade no app;
- notificacoes ou lembretes;
- insights automáticos.

## 6. Telas Do Produto

### Telas Principais

- Login
- Hoje
- Habitos
- Dashboard
- Historico
- Perfil

### Telas Secundarias

- Adicionar/editar habito
- Detalhe do habito
- Modal de check-in
- Configuracoes futuras

## 7. Regras De Produto

- todo habito precisa ter nome;
- habitos podem ter frequencia diaria ou dias especificos;
- check-in diario deve salvar valor e nota quando aplicavel;
- habitos podem ser ativados ou desativados sem perder historico;
- exclusao deve preservar o historico sempre que possivel;
- o usuario deve conseguir voltar ao app sem refazer login toda vez.

## 8. Requisitos De Interface

### Cores

- fundo principal: `#0F0F1A`;
- superficie: tons escuros azulados;
- roxo principal: `#7C3AED`;
- roxo claro: `#A855F7`;
- sucesso: `#10B981`;
- erro: `#EF4444`;
- texto principal: branco;
- texto secundario: cinza claro.

### Glassmorphism

- usar em cards, modais e paineis;
- manter contraste alto;
- evitar excesso de transparencia;
- blur leve, nao poluido;
- bordas com brilho suave;
- nada deve prejudicar leitura.

## 9. Stack Tecnica Sugerida

| Camada | Decisao |
|---|---|
| Framework | React Native + Expo |
| Linguagem | TypeScript |
| Navegacao | React Navigation v7 |
| Estado | Context e/ou Zustand |
| Auth | Google Sign-In |
| Persistencia | Banco local no app |
| Visual | Dark glassmorphism |
| Icones | `@expo/vector-icons` |

Observacao:
- a camada de autenticacao pode usar um provedor externo;
- a persistencia de habitos e perfil precisa continuar funcionando localmente.

## 10. Modelo De Dados Esperado

Entidades minimas:
- usuario;
- perfil;
- habito;
- check-in;
- preferencias;
- configuracoes.

Campos importantes a prever:
- id do usuario;
- nome;
- foto;
- habitos ativos/inativos;
- frequencia;
- dias da semana;
- valor da meta;
- unidade da meta;
- data do check-in;
- nota do check-in;
- preferencias visuais.

## 11. Requisitos Tecnicos

- o app deve continuar rapido;
- funcionar bem no Expo;
- manter codigo simples de manter;
- evitar dependencia visual desnecessaria;
- preservar tema escuro como padrao;
- nao quebrar a experiencia em telas pequenas.

## 12. Roadmap Recomendado

### Fase 1

- definir schema do banco;
- criar autenticação Google;
- adicionar tela de perfil;
- preservar sessao.

### Fase 2

- aplicar glassmorphism no design system;
- refinar login e perfil;
- ajustar cards e modais.

### Fase 3

- adicionar banco de dados completo;
- migrar persistencia atual;
- preparar sincronizacao futura.

### Fase 4

- implementar novas features:
  - lembretes inteligentes;
  - insights automáticos;
  - filtros e categorias;
  - calendario de consistencia.

## 13. Prioridade De Implementacao

1. Login com Google.
2. Tela de perfil.
3. Banco de dados.
4. Glassmorphism.
5. Novas features de produto.

## 14. Regras Para O Assistente

- atuar como arquiteto e desenvolvedor sênior;
- preferir mudancas pequenas e corretas;
- nao inventar stack sem necessidade;
- manter o padrao visual definido;
- fechar cada etapa ate o fim.

## 15. Critério De Qualidade

O produto fica correto quando:
- o usuario entra com Google;
- consegue personalizar o perfil;
- visual parece premium;
- dados ficam salvos com confiabilidade;
- habitos e check-ins continuam simples de usar;
- o app tem base para crescer sem virar bagunca.

## 16. Status Atual

- Fase 1 foi coberta na prática: login com Google, perfil, sessão persistida e base local funcionando.
- Fase 2 avançou bem: glassmorphism aplicado, cards/modais refinados, fundo global revisto e navegação inferior personalizada.
- Fase 3 começou: persistência migrou para `SQLite`, com leituras principais saindo do repositório e não mais da tela.
- Lembrete diário base foi preparado com `expo-notifications`, respeitando a preferência salva no perfil.
- Em `Expo Go`, notificações degradam com segurança e mostram feedback claro; o teste real deve ser feito em `development build`.

## 17. Ponto De Retomada

- O produto parou em preparação de build estável para teste nativo.
- `expo-doctor` está sem pendências e a configuração de build foi preparada com `expo-dev-client` e `eas.json`.
- O próximo passo prático é configurar o Android SDK local (`ANDROID_HOME` / `adb`) e gerar a versão de teste.
- Depois disso, vale validar manualmente login, perfil, hábitos, histórico, `SQLite` e notificações no build nativo.

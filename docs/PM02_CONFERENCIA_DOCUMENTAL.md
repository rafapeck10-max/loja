# PM-02 — Páginas e vitrines · prévia local

Revisão de 09/11/2026, branch `feature/pm02-paginas-vitrines`, sobre PM-01 `e416755`. Esta entrega implementa edição e persistência local de rascunhos da página inicial. Não constitui publicação nem implementação integral do CMS planejado.

## Fontes retomadas

- `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md`, v0.2: seção 4 (disposição desktop/celular), PM-02, limites de publicação. SHA256 `4CE0516F7C3F3EE31865599CB817D742B601579CE3D211F964F6CBC19748F306`.
- `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md`, v1.1: MM-P01, HOME-06, CMS-02 e distinção entre home, hubs DEPT e campanhas LANDING. SHA256 `E1A02C0FF7526537A76A17B42640E7D1BCE64FF0F77FC2A1458D35F930253373`.
- Originais em `C:/Users/rafap/OneDrive/Área de Trabalho/LOJA MOBI/.md/`; preservados. Os estados “não iniciado/não verificado” no levantamento de 06/11 são históricos, não comprovam o estado atual do código.
- Código atual: `routes/index.tsx`, `HomeCurationPanel.tsx`, `home-curation.ts`, `HomeProductSection.tsx`, `ProductCard.tsx`. A ordem da Mobi prevalece como ponto inicial; a pesquisa não comprovou uma ordem universal de vitrines da concorrente.

## Matriz requisito → implementação → evidência → limite

| Requisito/fonte | Implementação | Evidência | Limite |
| --- | --- | --- | --- |
| PM-02: nome e rota Mobi | Seletor Página inicial · `/` | Prévia e código `PagesAndShelvesPanel` | Somente home; catálogo/categorias identificados como indisponíveis. Nenhuma das 38 rotas criada automaticamente. |
| PM-02: nome, tipo, estado, ordem; setas além de arrastar | Lista de sete seções, visibilidade e movimentos imutáveis | Teste do modelo; setas e ocultação exercitadas no navegador | Drag implementado por HTML5; não exercitado na conferência manual. Topo e convite final protegidos. |
| PM-02 / HOME-06: seleção por IDs e ordem atual | Quatro escolhas semanais com foto, referência, troca, remoção e ordem | Testes de seleção, duplicatas, elegibilidade e limite; troca/reordenação no navegador | Não confirma estoque físico nem carregamento de todas as imagens do catálogo. |
| PM-02: reaproveitar curadoria | Mesmo formato `weeklyIds/settings`, critérios extraídos para `homepage-curation.ts`; prévia chama regras existentes de `home-curation.ts` | Testes de seleção e limites; compilação | Nenhuma gravação na curadoria do servidor nesta versão. |
| PM-02: avisos de cadastro inválido | Validação antes de salvar; itens semanais ausentes ou inelegíveis identificados | Testes de item inválido e inspeção do código | Sem integração de estoque físico ou verificação remota das fotos. |
| CMS-02: contrato declarativo, sem HTML arbitrário | `PageDraft`, lista de tipos por ID, `HomepageSectionOrder` compartilhado com home | Testes de configuração inválida e revisão de código | Sem criação livre de hero, FAQ ou texto. Tipos adicionais exigem schema, formulário e renderer. |
| Painel §4: disposição responsiva | ≥1400 px: seções, propriedades e prévia; tablet: dois painéis + aba; celular: editor ou prévia | Conferência em 360, 390, 768, 1024 e 1440 px | Prévia representa 4/2 colunas; blocos fixos são resumos, não réplica integral da página pública. |
| Rascunho seguro | Salvar/reabrir explícito em localStorage; aviso de saída; recusa de base obsoleta; restauração da base | Salvar → recarregar → reabrir exercitado; conflito testado; navegação interna preserva alterações | Um rascunho por navegador e contexto; sem colaboração, backup remoto ou histórico. Não é PM-07. |

## Disposição adotada

Sequência inicial preservada: topo com banner/apresentação/condições/ambientes → Descubra algo novo → Escolhas da semana → Inspiração para sua sala → Novidades → Para sua sala → convite para catálogo. O editor permite mover os cinco blocos internos. Nenhuma ordenação do cadastro geral é alterada.

Novidades mantém janela de 30 dias e exceções atuais; Sala mantém regras atuais de categoria e inclusão/ocultação; Descoberta mantém rotação e exclusões existentes. Não foram inventadas personalização, datas de campanha ou promoções. A prévia reutiliza os cartões e cálculo comercial existentes, com navegação desativada dentro da representação.

Hubs de departamentos/ambientes (círculos no computador, listas no celular), landing pages e FAQ continuam planejados. HOME-06 é transferência técnica e CMS-02 é proposta de adaptação, não evidência de CMS interno observado na MadeiraMadeira. Não há conflito entre essas fontes quando suas classificações e limites são respeitados.

## Dados e publicação

Chaves locais separadas: `mobi:pages-and-shelves:home:v1:demo` e `:admin`. A prévia usa 16 produtos de uma amostra histórica pública da Mobi, explicitamente identificada como demonstração; preços não representam ofertas atuais. Não usa credenciais nem consultas administrativas.

No admin integrado, o editor recebe os produtos já consultados. Não há operação nova de escrita no servidor, migração, aplicação do rascunho à home ou botão de publicação. O compositor público usa a configuração padrão, preservando a ordem anterior. Persistência versionada no servidor, aprovação/aplicação e homologação autenticada são pendências para evolução posterior.

## Conferência e reversão

Validação: suíte Node (42 testes, incluindo oito de PM-02), TypeScript, ESLint direcionado e build. Conferência manual no navegador: ordem, visibilidade, troca, limite, imagens da seleção carregadas, navegação interna, salvar/recarregar/reabrir e restauração. Capturas e relatório ficam na pasta irmã `mobi-pm02-evidence/`, fora dos artefatos de build.

O teste visual usa a amostra local; não comprova o fluxo autenticado com banco real. Não houve push, merge ou publicação. Para desfazer esta entrega, reverter somente seu commit; nenhuma restauração de dados é necessária. Publicação depende da aprovação explícita de Rafael para a versão apresentada e do preflight de `DEPLOYMENT.md`.

## Adendo — seleção dinâmica da home (14/11/2026)

Este adendo atualiza o estado descrito acima, que era local e sem aplicação pública. A implementação abaixo fica na branch `codex/homepage-dynamic-curation`, baseada na produção atual (`d4381e5`). A prévia da branch foi revisada antes de qualquer integração em `main`.

### Requisito → aplicação → evidência → limite

| Fonte e requisito | Aplicação nesta versão | Evidência | Limite mantido |
| --- | --- | --- | --- |
| PM-02: escolher, buscar, trocar, retirar e ordenar produtos por vitrine | `PagesAndShelvesPanel` edita IDs de Escolhas da semana, Novidades e Para sua sala; as duas últimas mantêm modo automático ou manual. O seletor usa o catálogo existente e a prévia compartilha o renderer e os cards da loja. | 46 testes focados; lint direcionado; build Vite/Nitro. | Até quatro IDs por vitrine; produtos inelegíveis ou ausentes não viram substitutos automáticos no modo manual. |
| PM-02: revisar e aplicar somente a versão conferida | Comando autenticado aplica a revisão PM-02 mais recente via compare-and-swap do workspace existente; mantém histórico e snapshot anterior se houver conflito. `MOBI_REMOTE_HOME` é separado de `MOBI_REMOTE_STUDIO`. | `home-publication.test.mjs`, `admin-studio-persistence.test.mjs` e `admin-studio-repository.test.mjs`; sem operação remota nesta tarefa. | Esta entrega não habilitou nem validou aplicação remota; ativar a configuração da prévia requer preflight próprio. Não houve escrita no Supabase ou aplicação de migration. |
| HOME-06: lista editorial por IDs, título, limite e ordem; sem sequência universal da concorrente | A home lê somente o snapshot público allowlist e hidrata os IDs com os produtos atuais do catálogo. Nome, foto, categoria, preço e condições comerciais não são copiados para a seleção. | `home-runtime.test.mjs` cobre ordem, dados atuais, IDs ausentes e ausência de preenchimento arbitrário; o snapshot não expõe custo, fornecedor, histórico ou `baseVersion`. | A ordem permanece decisão da Mobi; a referência MadeiraMadeira não determina uma sequência obrigatória para a home. |
| Decisões Mobi posteriores: Quarto, Sala e Cozinha; esconder “Descubra algo novo”; Black Friday ligada ao PM-05 | O renderer continua ocultando discovery. As imagens de ambiente vêm do catálogo elegível. A seção Black Friday segue condicionada à campanha do PM-05. | Revisão de código e regras de seleção nos testes focados. | PM-02 não cria ofertas, campanha ou lista concorrente para Black Friday. |
| Segurança e preview | Leitura da configuração aplicada permanece server-side; em Vercel Preview sem chave privilegiada, a rota cai no comportamento sem snapshot, enquanto produção exige configuração. | Teste `Vercel Preview without the privileged key is not treated as production`; docs oficiais de [variáveis de ambiente Vercel](https://vercel.com/docs/environment-variables/system-environment-variables). | Preview não habilita publicação nem altera a loja. |

### Conferência desta entrega

- Branch: `codex/homepage-dynamic-curation`; commit de aplicação e leitura: `54e4238`; correção de ambiente Preview: `396f58c`.
- Verificação: suíte focada PM-02/publicação/cache/persistência/repositório — 46/46; ESLint direcionado — limpo; `npm run build` — concluído. O build ainda lista avisos de depreciação preexistentes de `createServerFn().inputValidator()` e o aviso do plugin `vite-tsconfig-paths`.
- Dados e operação: nenhum produto, preço, parcela, banner ou registro Supabase foi alterado; nenhuma migration foi aplicada. O snapshot público contém IDs e configuração de seção; os cards sempre usam os campos atuais do catálogo.
- Prévia Vercel da versão de código `396f58c`: READY em [loja-2imqq8lr9-rafapeck10-9742s-projects.vercel.app](https://loja-2imqq8lr9-rafapeck10-9742s-projects.vercel.app/). A página carregou com cabeçalho, ambientes, Escolhas da semana, Novidades e Para sua sala. “Descubra algo novo” permaneceu oculto; Black Friday não apareceu porque não havia campanha ativa configurada no PM-05.
- Limite da conferência visual: a página foi aberta na prévia e seu conteúdo foi inspecionado; não foi feita validação de screenshot responsivo em larguras desktop e celular. A confirmação final de aparência em celular continua pendente.
- A prévia é isolada: a produção continua no commit `d4381e5`; não houve merge, migration, escrita no Supabase ou publicação em produção. O gate `MOBI_REMOTE_HOME` não foi habilitado.
- Os documentos originais foram reabertos; hashes mantidos: painel `4CE0516F7C3F3EE31865599CB817D742B601579CE3D211F964F6CBC19748F306`; engenharia reversa `E1A02C0FF7526537A76A17B42640E7D1BCE64FF0F77FC2A1458D35F930253373`.

Este adendo substitui os trechos históricos que dizem que a aba Vitrine não tinha revisão/aplicação. As disposições do levantamento MadeiraMadeira continuam classificadas pelos próprios níveis de evidência; propostas de adaptação não são tratadas como funcionalidades observadas.

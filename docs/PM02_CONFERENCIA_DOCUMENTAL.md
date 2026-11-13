# PM-02 — Páginas e vitrines · prévia local

Revisão de 09/11/2026, branch `feature/pm02-paginas-vitrines`, sobre PM-01 `e416755`. Esta entrega implementa edição e persistência local de rascunhos da página inicial. Não constitui publicação nem implementação integral do CMS planejado.

## Fontes retomadas

- `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md`, v0.2: seção 4 (disposição desktop/celular), PM-02, limites de publicação. SHA256 `4CE0516F7C3F3EE31865599CB817D742B601579CE3D211F964F6CBC19748F306`.
- `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md`, v1.1: MM-P01, HOME-06, CMS-02 e distinção entre home, hubs DEPT e campanhas LANDING. SHA256 `E1A02C0FF7526537A76A17B42640E7D1BCE64FF0F77FC2A1458D35F930253373`.
- Originais em `C:/Users/rafap/OneDrive/Área de Trabalho/LOJA MOBI/.md/`; preservados. Os estados “não iniciado/não verificado” no levantamento de 06/11 são históricos, não comprovam o estado atual do código.
- Código atual: `routes/index.tsx`, `HomeCurationPanel.tsx`, `home-curation.ts`, `HomeProductSection.tsx`, `ProductCard.tsx`. A ordem da Mobi prevalece como ponto inicial; a pesquisa não comprovou uma ordem universal de vitrines da concorrente.

## Matriz requisito → implementação → evidência → limite

| Requisito/fonte                                          | Implementação                                                                                                                             | Evidência                                                                                         | Limite                                                                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| PM-02: nome e rota Mobi                                  | Seletor Página inicial · `/`                                                                                                              | Prévia e código `PagesAndShelvesPanel`                                                            | Somente home; catálogo/categorias identificados como indisponíveis. Nenhuma das 38 rotas criada automaticamente. |
| PM-02: nome, tipo, estado, ordem; setas além de arrastar | Lista de sete seções, visibilidade e movimentos imutáveis                                                                                 | Teste do modelo; setas e ocultação exercitadas no navegador                                       | Drag implementado por HTML5; não exercitado na conferência manual. Topo e convite final protegidos.              |
| PM-02 / HOME-06: seleção por IDs e ordem atual           | Quatro escolhas semanais com foto, referência, troca, remoção e ordem                                                                     | Testes de seleção, duplicatas, elegibilidade e limite; troca/reordenação no navegador             | Não confirma estoque físico nem carregamento de todas as imagens do catálogo.                                    |
| PM-02: reaproveitar curadoria                            | Mesmo formato `weeklyIds/settings`, critérios extraídos para `homepage-curation.ts`; prévia chama regras existentes de `home-curation.ts` | Testes de seleção e limites; compilação                                                           | Nenhuma gravação na curadoria do servidor nesta versão.                                                          |
| PM-02: avisos de cadastro inválido                       | Validação antes de salvar; itens semanais ausentes ou inelegíveis identificados                                                           | Testes de item inválido e inspeção do código                                                      | Sem integração de estoque físico ou verificação remota das fotos.                                                |
| CMS-02: contrato declarativo, sem HTML arbitrário        | `PageDraft`, lista de tipos por ID, `HomepageSectionOrder` compartilhado com home                                                         | Testes de configuração inválida e revisão de código                                               | Sem criação livre de hero, FAQ ou texto. Tipos adicionais exigem schema, formulário e renderer.                  |
| Painel §4: disposição responsiva                         | ≥1400 px: seções, propriedades e prévia; tablet: dois painéis + aba; celular: editor ou prévia                                            | Conferência em 360, 390, 768, 1024 e 1440 px                                                      | Prévia representa 4/2 colunas; blocos fixos são resumos, não réplica integral da página pública.                 |
| Rascunho seguro                                          | Salvar/reabrir explícito em localStorage; aviso de saída; recusa de base obsoleta; restauração da base                                    | Salvar → recarregar → reabrir exercitado; conflito testado; navegação interna preserva alterações | Um rascunho por navegador e contexto; sem colaboração, backup remoto ou histórico. Não é PM-07.                  |

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

## Atualização de 13/11/2026 — Escolhas da semana

### Causa encontrada

Na versão publicada, **Trocar** editava `PageDraft.curation.weeklyIds` e o salvamento remoto preservava esse conteúdo no histórico privado do painel. A home pública, porém, continuava lendo `produtos.vitrine_semana_ordem`; não havia uma ação que transferisse a seleção revisada para uma fonte consumida pela loja. Por isso, os cartões pareciam fixos mesmo com o editor visível.

### Correção preparada nesta branch

- Criar uma configuração pública mínima com os IDs ordenados da vitrine semanal, sem alterar cadastros, preços, custos ou fornecedores. A migration inicia com a seleção existente para preservar a apresentação atual.
- Fazer o painel mostrar o que está aplicado e distinguir isso do rascunho. O fluxo fica **Trocar → salvar rascunho → revisar → aplicar escolhas na loja**.
- Permitir aplicação somente de uma revisão remota marcada como revisada e na produção. A prévia Vercel fica em modo de conferência e não pode escrever na loja.
- Fazer a home carregar os IDs publicados e resolver cada produto no catálogo atual. Produto removido ou inelegível não será substituído por outro silenciosamente.

### Estado e limites

Esta atualização está em uma branch local de correção. A nova migration `20261113120000_add_mobi_homepage_weekly_curation.sql` **ainda não foi aplicada** e a correção não está publicada. Até a migration e a versão serem aprovadas, a home preserva a seleção atual do catálogo. O escopo é a lista de Escolhas da semana; outras edições do PM-02 continuam rascunhos e não são aplicadas por este botão.

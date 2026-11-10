# MM-P01 — execução local

## Ajuste solicitado após a prévia — 10/11/2026

A entrega anterior foi rejeitada visualmente. A descrição abaixo dela é histórica, não aprovação. Nova branch: `feature/mm-p01-redesign`, base `ec0aa5e`, sem publicação.

### Categorias da home

- A seleção anterior de cinco vitrines foi substituída por três ambientes fixos: Quarto, Sala e Cozinha. Fotos do catálogo ativo são selecionadas entre os produtos candidatos já consultados pela home, com preferência pelos produtos representativos quando disponíveis; a resposta pública acrescenta somente os três endereços de imagem.
- Cartões e títulos ficam centralizados. Cada foto preenche a largura do cartão (`object-fit: cover`), com recorte horizontal amplo no desktop e proporção própria no celular. Os títulos ficam abaixo das fotos, sem o CTA repetido “Ver modelos”.
- Referência ao vivo conferida em 10/11: “Navegue por categorias e ambiente” apresenta cartões horizontais com foto grande e nome sob a foto. A Mobi adota o padrão visual para três ambientes e seus destinos próprios; não copia promoções, conteúdo ou estrutura exclusiva.

- Capturas: `../mobi-studio-evidence/mm-p01-rooms-desktop.jpg` e `mm-p01-rooms-mobile.jpg`. Build e lint direcionado passaram. Nenhuma publicação ou gravação no catálogo ocorreu.

## Versão anterior da prévia — antes deste ajuste

- **Retirada expressa de Rafael:** “Descubra algo novo” não é mais renderizado na home nem listado no editor de seções. O identificador antigo permanece apenas para leitura compatível de revisões. Esta decisão substitui o planejamento anterior de rotação diária na home.
- Esta versão exibia cinco categorias da amostra. Foi substituída pela composição fixa de três ambientes documentada acima. A taxonomia completa continua no menu. A normalização de categorias da demonstração não altera o catálogo real.
- Cabeçalho mais compacto, busca em destaque, banner com produto do catálogo, benefícios em linha e vitrines sem linhas vazias de selos. Identidade Mobi preservada; atendimento online, sem loja física. Inspiração fica desativada nesta revisão.
- Banner, navegação, atendimento e curadoria continuam ligados aos campos suportados do painel. “Editar versão aplicada” reabre a configuração vigente nos editores, preservando o fluxo de rascunho, revisão e histórico. Prévia móvel de arte completa usa 1:1; desktop, 16:5.
- Aplicada apenas a revisão **local 11**, com amostra histórica de 16 produtos. A prévia agora abre em `/`; rotas de categoria, busca, produto e carrinho funcionam no demonstrador. Não equivale a homologação remota ou a catálogo atualizado.
- Conferência no navegador: cinco categorias com fotos; ausência de “Descubra algo novo”; categoria Cozinha abre Cozinha Cristal; busca, detalhe e carrinho exercitados; sem transbordamento horizontal em 390 px. Desktop conferido em 1440 px. Preço de referência preservado: R$399 à vista, 10 × R$45,40, total R$454.
- Suíte: 108/108 testes; TypeScript e build aprovados. Revisão independente corrigiu recuperação do editor e proporção da arte móvel. Capturas atuais: `../mobi-studio-evidence/mm-p01-redesign-desktop.png` e `mm-p01-redesign-mobile.png`.
- Originais de engenharia reversa v1.1 e painel v0.2 retomados na implementação e na entrega. Referência MadeiraMadeira aberta ao vivo; composição adaptada à operação Mobi. Persistência e autorização remotas continuam pendentes. Nenhum push, integração em produção, publicação ou gravação no banco real.

## Registro anterior — substituído visualmente

Plano: `docs/MM-P01_PLANO_APLICACAO_MOBI.md`. Base de trabalho: de67c42; branch `feature/mm-p01-home-integrada`. Publicação não autorizada.

- [x] Conferir originais v1.1/v0.2 e referência ao vivo.
- [x] Resolver produção: `dpl_EPejiQs16r3HV8JY2HN3S453kkuq`, READY, GitHub main `23c0d6749e911b6a9c91376deb71517f439c3c74`. Diferenças locais são as etapas PM e documentação, ainda não publicadas.
- [x] Contrato permitido, persistência isolada, revisão/conflito/restauração e renderer completo compartilhado, no ambiente local.
- [x] Cabeçalho, navegação, banner e vitrines ligados aos editores suportados no contrato local.
- [x] Testes, conferência documental final, desktop/mobile e revisão independente.
- [ ] Homologar persistência/autorização remotas, dados e rotas completas da loja real antes de publicação.
- [ ] Homologar artes finais por dispositivo e os critérios ainda não exercitados com catálogo atual.

## Decisões de execução

- Persistência desta versão será local no servidor de prévia, isolada do Supabase. A arquitetura documentada não autoriza migração remota. O contrato e o consumidor serão reais, mas não equivalem a persistência compartilhada em produção. Custo: será necessário adaptar o repositório de revisões e homologar a autorização no ambiente remoto antes de publicar configurações.
- O público recebe somente campos permitidos de home, nunca `StudioWorkspace`, `PageDraft.baseVersion` (contém dados internos do catálogo), custos, fornecedores, notas, histórico ou campanhas simuladas.
- Comunicação promocional, contagem e termos permanecem omitidos: não há motor público de campanhas nem campanha aprovada. Conteúdo de ajuda permanece nas rotas que já existem.

## Referência ao vivo — 09/11/2026

Home MadeiraMadeira aberta: cabeçalho em camadas, busca dominante, carrinho sempre acessível, menu Departamentos aberto por clique (primeira camada), banner com setas, atalhos e termos observados. CEP abriu uma sobreposição; foi fechada sem enviar endereço. Aviso de cookies fechado. Nenhuma compra, login ou mensagem.

Releitura da engenharia reversa: regras §0–3; ficha MM-P01; MENU-01 a 05; HOME-01 a 07; contratos e CMS. Não transferir 12x, unidades físicas, aplicativo, reputação, cupom ou condições do concorrente.

Preflight de interfaces: PM-02 fornece seções e curadoria; PM-03 fornece mídia; PM-06 fornece navegação; PM-08 fornece atendimento. O contrato público projeta apenas esses campos; PM-04 continua fonte de catálogo, sem aplicar cadastros locais. A prévia e a rota pública compartilharão o renderer.

## Entrega local e consumidores

| Origem | Consumidor efetivo nesta versão | Limite |
|---|---|---|
| PM-02: ordem, títulos, apoio e seleção | `HomepageContent`, `HomepageSectionOrder`, seleção central de produtos | Home; sem novos tipos/páginas. Seleção semanal preservada. |
| PM-03: desktop/mobile, alt, texto, destino, vigência, ordem | `HeroCarouselView` e `BannerSlide` | Sem biblioteca/upload remoto. Sem arte mobile, foto é recomposta com texto separado; arte sem texto HTML usa contain. |
| PM-06: nome, ordem, destino e visibilidade | `CategoryNavigation` e `MenuDrawer` | Filtros públicos ainda não são aplicados por esta revisão. |
| PM-08: região, consulta de entrega e montagem | `Header`, `Footer` e convite final | Número e operação online protegidos; template do pedido permanece fora deste lote. |
| Revisão e diferenças | `HomeConnectionPanel`, `home-configuration`, `home-local-store.server` | Aplicação restrita ao servidor local; sem autoria individual/produção compartilhada. |
| PM-09 | Capacidades CMS-05/06/08 atualizadas com limites locais | Nenhum requisito foi marcado automaticamente como validado ou ativo na loja. |

O editor PM-02 anterior continua oferecendo seu esquema resumido. A homologação desta versão usa **Home em revisão → Salvar versão da home → Ver home e diferenças**, que exibe a página completa pelo renderer compartilhado. A visualização da revisão é inerte; a home local aplicada permite testar menu e carrinho.

Rascunhos antigos do navegador foram preservados. A demonstração utiliza 16 registros históricos e custos sintéticos; os links de produtos representam a estrutura de URLs, mas não comprovam as rotas reais de detalhe nessa demonstração. A home local aplicada não significa publicação nem integração homologada com catálogo/banco reais.

## Matriz resumida de aceite

| IDs | Situação verificável |
|---|---|
| GLOBAL-02/03/04/07/08/09/10/11/12/14 | Componentes locais integrados, identidade/contatos preservados, carrinho vazio acessível e diálogos com Escape/foco. Busca/destinos completos, ancoragem e sobreposição de ações exigem homologação no aplicativo com dados atuais. |
| MENU-01/02/03/04 | Gaveta pública reutiliza taxonomia, nomes/destinos/ordem/visibilidade da revisão; clique/fechamento/retorno de foco conferidos. Cobertura de categorias com catálogo atual pendente. |
| HOME-01/02 | Mídia por dispositivo consumida, setas/indicadores/pausa/movimento reduzido, vigência e ausência de controles para um slide implementados. Conferência visual usou artes existentes; upload/arte final mobile não foi homologado nesta sessão. |
| HOME-05/06 | Categorias e quatro vitrines usam o renderer público; vazio é omitido. Descoberta usa dia de Brasília, tanto na revisão quanto no runtime. |
| CARD-01/04/06/07/08 | Reutilizados cartões e cálculo central. Fotos/10x conferidos na amostra; navegação e variantes reais continuam dependentes da homologação com catálogo atual. |
| GLOBAL-01, HOME-03/04/07 | Condicionais, omitidos. Nenhuma contagem, cupom ou oferta fictícios. |
| GLOBAL-13 | Investigação de cookies/serviços permanece pendente; não foi copiado aviso jurídico. |
| GLOBAL-05/06, CARD-02/03/05 | Adiados conforme seleção: conta, favoritos, troca de variante no card e avaliações sem backend/dados reais. |
| MENU-05 | Breadcrumb das páginas internas preservado; não acrescentado à home. |

## Evidências desta execução

- Originais relidos antes e ao final: engenharia reversa v1.1 (ficha, GLOBAL/MENU/HOME/CARD/CMS e contratos) e painel v0.2 (PM-02/03/04/06/08, revisão/publicação). Planejamento continua distinto do estado publicado.
- Fluxo CUA concluído: salvar rascunho de seções, mover Escolhas da semana antes de Descoberta sem trocar os quatro IDs, salvar revisão no servidor, abrir renderer completo, marcar revisão e aplicar **somente localmente**. Revisão local aplicada: **2**. Reabrir em nova aba preservou a revisão e o texto editado.
- Carrinho: falha inicial com zero diálogos; após correção, um diálogo nomeado, Tab contido, Escape fecha e foco volta ao acionador. Conferido em desktop e celular. Menu também fecha e devolve foco.
- 360/390/768/1024/1440 px: sem transbordamento horizontal; acionadores de menu/carrinho com pelo menos 44 px. Fotografias de móveis carregadas na vitrine móvel; fallback não é tratado como foto aprovada.
- Endpoint público retornou 200/revisão 2, sem `preco_atacado`, `supplier_price`, `sourceVersion`, `baseVersion`, histórico ou dados de restauração. Endpoint administrativo sem token e acesso direto ao arquivo privado retornaram 403.
- Suíte completa: **103/103 testes**. TypeScript e build passaram. Lint direcionado: zero erros; dois avisos de organização para Fast Refresh (`CategoryNavigation` preexistente e contexto/provider).
- Pagamento preservado: nenhuma mudança em `payment-config`, fórmula, catálogo ou cotação salva. Amostra Poltrona Jamile: R$399 à vista → 10 × R$45,40; total R$454, antes/depois.
- Evidências fora do Git: `../mobi-studio-evidence/mm-p01-home-desktop.png`, `mm-p01-home-mobile.png`, `mm-p01-vitrine-mobile.png`, `mm-p01-responsive.json`. Logs locais ignorados em `.mobi-local-preview/evidence/`.

## Revisão independente e decisões

Revisor independente `/root/review_mm_p01`, somente leitura. Nenhum achado crítico. Correções importantes: seleção da prévia e runtime passaram a usar `homeProductSelections`; configuração e produtos da home retornam no mesmo snapshot, com invalidação após aplicação; carrinho passou a usar Radix Dialog; JSON de revisão é validado integralmente antes de leitura pública. Os testes reproduziram as falhas de seleção, cache e integridade antes das correções; carrinho foi reproduzido e conferido pelo navegador.

Decisão: a corrupção estrutural foi reclassificada de Minor para Important porque poderia quebrar a home. Corrigida. Custo se a classificação fosse insuficiente: indisponibilidade da prévia com arquivo corrompido.

Minor pendente: recuperação automática de lock abandonado. A gravação falha preservando dados, com mensagem de recuperação. Decisão: não remover automaticamente um lock que pode pertencer a outro processo. Custo: recuperação manual após encerramento abrupto. Procedimento abaixo.

## Execução, recuperação e reversão

- Demonstração: `npx vite --config scripts/pm01-preview/vite.config.ts`; abrir `/scripts/pm01-preview/index.html?area=vitrine` ou `?view=home`. Restrita a 127.0.0.1:5187; sem cliente ou credencial Supabase. O token de demonstração é proteção local, não autenticação para produção.
- Aplicativo real em desenvolvimento: `MOBI_LOCAL_HOME=1` habilita o adapter somente fora de produção/Vercel, usando a autorização administrativa existente e consulta do catálogo. Esse percurso com credenciais reais **não foi homologado** nesta sessão. Nenhuma variável remota foi configurada.
- Arquivos: `.mobi-local-preview/demo/home.json` e `.mobi-local-preview/storefront/home.json`, separados e ignorados pelo Git/Vite. Não enviar esses arquivos à hospedagem; o driver recusa produção e Vercel, inclusive armazenamento efêmero.
- Arquivo inválido: não substituir por vazio. Preservar cópia e restaurar um backup conhecido.
- Lock persistente: encerrar **todos** os servidores que usam o diretório; conferir o caminho dentro de `.mobi-local-preview`; mover somente `home.lock` para um nome de recuperação datado; preservar `home.json`; reiniciar. Nunca remover lock de servidor ativo. Recuperação automática permanece pendente.
- Restaurar revisão pelo painel cria novo rascunho com base atual; exige revisão antes de aplicar e não apaga histórico. Conflito de catálogo/base bloqueia.
- Reversão de código: reverter o commit desta branch. Sem mudança de banco, preços ou configuração publicada a reverter. **Não integrar/pushar para branch de produção ou publicar sem aprovação explícita da versão.**

# PM-01 a PM-10 — conferência da versão local

09/11/2026 · branch `feature/pm01-pm10-painel` · base `fba4c86` (PM-02). Pedido: desenvolver os dez módulos considerando as funções futuras da engenharia reversa. A entrega é um estúdio de rascunhos locais integrado à estrutura do admin existente, com prévia demonstrativa. Não é homologação de persistência remota, trabalho em equipe ou publicação de configurações.

## Documentos retomados e decisões

- `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md`, v0.2, seções 0–11 e PM-01–PM-10. Original em `C:/Users/rafap/OneDrive/Área de Trabalho/LOJA MOBI/.md/`.
- `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md`, v1.1: protocolo, legenda V/T/P/B, fichas desktop/mobile, CMS-01–08, QUALITY, HOME, MENU/LIST/SEARCH, HELP/CONTENT, CHECK e manifesto. A cópia versionada foi comparada ao JSON original: 141 requisitos e 38 fichas idênticos.
- `AGENTS.md`, `DEPLOYMENT.md`, conferências PM-01/PM-02 e contratos atuais de catálogo, taxonomia, banners, curadoria e cálculo comercial.
- SHA256 do painel: `4CE0516F7C3F3EE31865599CB817D742B601579CE3D211F964F6CBC19748F306`. Engenharia: `E1A02C0FF7526537A76A17B42640E7D1BCE64FF0F77FC2A1458D35F930253373`.

As classificações “não iniciado/não verificado” da pesquisa são históricas. Nenhuma delas foi convertida automaticamente em implementação Mobi. V/T/P/B continuam qualificando a referência; observação Mobi, implementação e ativação são registros separados. HOME-06 não comprova uma ordem universal da concorrente; preservada a sequência Mobi. CMS descreve adaptações propostas, não acesso a um CMS privado da MadeiraMadeira.

## Matriz de cobertura real

| Módulo / referência | Implementado nesta versão | Arquivos principais / evidência | Pendências e limites |
| --- | --- | --- | --- |
| PM-01 / CMS, QUALITY | Resumo de cadastro e fila existentes; atividade local de revisões, campanhas em simulação, encerramento em até 7 dias e requisitos acompanhados, com origem explícita | `AdminOverview.tsx`, `AdminStudio.tsx`; contagens derivadas e navegação conferidas | Sem visitas, vendas ou contagem de campanhas publicadas. A atividade do navegador não representa dados remotos. |
| PM-02 / HOME-06, CMS-02 | Seções atuais, ordem/setas/drag, visibilidade, texto das vitrines e curadoria existente, agora ligadas ao histórico comum; abertura explícita do rascunho PM-02 anterior | `PagesAndShelvesPanel.tsx`, `HomepageSectionOrder.tsx`, `pages-shelves.ts`; validação de base e limites | Somente home. Topo e convite final preservados; fixos resumidos na prévia. Novos tipos exigem schema/formulário/renderer. Sem criar 38 rotas. |
| PM-03 / HOME-01/02, CMS-01 | Biblioteca local sobre contrato de banner, arte desktop/mobile, alt, sobreposição opcional, destino seguro, ordem, ativação, vigência, upload local e prévia compartilhada | `BannersPanel.tsx`, `BannerSlide.tsx`, `banner-drafts.ts`; testes de imagens/destinos/datas; `HeroCarousel` reutiliza renderer com padrão preservado | PNG/JPEG/WebP até 1 MB/arquivo, biblioteca 2 MB; validação estrutural e `image.onload` no upload. Sem upload remoto. Admin consulta banners existentes; indisponibilidade é sinalizada. Vínculo em campanha impede excluir a mídia. |
| PM-04 / CARD, PROD | Cadastro/importação/variantes autenticados existentes preservados. Demonstração permite rascunho por identificação, foto, cores, medidas, comercial e consulta de visibilidade | `routes/admin.tsx`, `ProductDraftPanel`; foto/custo/preço e busca por SKU | Editor demonstrativo não duplica cadastro remoto. Edição comercial por variante e importação permanecem no editor existente; fluxo autenticado não foi exercitado nesta conferência. Sem estoque físico inventado. |
| PM-05 / CMS-03/04, LANDING | Campanhas com período Brasília, participantes, preço em centavos, vínculos, comparação Pix/10x/total, revisão e simulação temporal; encerramento remove aplicabilidade sem regravar base antiga | `campaigns.ts`, `CampaignsPanel.tsx`; testes de datas, centavos, conflito, sobreposição e encerramento; fluxo navegador | Simulação de preço-base por produto, sem overrides por variante. Vínculos não ativam automaticamente banners/seções. Sem agendamento real, cupom ou desconto aplicado ao carrinho. Fingerprint detecta mudança comercial disponível, não é versão transacional remota. |
| PM-06 / MENU, LIST, SEARCH, CMS-06 | Ordem/nome/destino/visibilidade dos grupos atuais; filhos da taxonomia; seleção/ordem de filtros com cobertura e valores normalizados; prévia consome essas escolhas | `operational-config.ts`, `NavigationPanel`, normalizadores `catalog-search.ts`; testes de rotas/cobertura | Subcategorias não têm cadastro duplicado ou árvore livre. Filtro sem cobertura é pendência e não é oferecido na prévia. Aplicação da configuração ao menu público pendente. |
| PM-07 / HELP, CONTENT, CMS-07 | Páginas estruturadas, título/slug/corpo, revisão, links seguros e perguntas; renderer local com HTML escapado por React | `ContentPanel`, `StructuredPage`; validação de slug, links e perguntas; salvar/recarregar/restaurar conferidos | Quatro temas iniciais são propostas de texto para revisão comercial. Sem editor HTML arbitrário; rotas públicas de ajuda/artigos não foram criadas. |
| PM-08 / PROD-11/12, CHECK | Mensagens de região, entrega, montagem; modelo com produto/variante/quantidade/preço; prévia e link WhatsApp após conferência | `ServicePanel`, `serviceLink`; número público existente `5521984324338`; URL e texto conferidos sem abrir/enviar conversa | Número fixo à fonte pública atual; sem tabela de CEP/frete/prazo ou confirmação de estoque. Variante livre é informação a confirmar no atendimento; a consulta mostra preço-base por unidade. Sem envio automático ou venda aprovada. |
| PM-09 / todos os 141 IDs | Catálogo pesquisável por código/nome/página/grupo, filtros, ficha completa, dependências, acompanhamento e rascunhos por ID, evidência, geração/cópia/download MD/JSON e importação validada | `evolution.ts`, `EvolutionPanel.tsx`, manifesto v1.1; 12 testes próprios; busca MM-PROD-04 e exigência de evidência conferidas | Nenhum requisito é marcado implementado pela importação. Validado exige evidência e desktop/mobile; capacidades mapeadas são editores locais parciais com limite explícito, não autorização de ativação pública. |
| PM-10 / CMS-08, QUALITY-07 | Versões locais imutáveis, antes/depois, revisão, restauração como novo rascunho, exportação, conflito entre abas e recuperação sobre fonte atual preservando histórico | `admin-studio.ts`, `studio-validation.ts`, `AdminStudio.tsx`; testes e navegador | Sem versão publicada, autoria autenticada individual, papéis de equipe ou auditoria remota. Não há botão de publicação simulado. |

## Persistência, consistência e publicação

Chaves separadas: `mobi:admin-studio:v1:demo` e `:admin`. A revisão guarda a base consultada e o resultado. Salvar verifica o número de revisão no armazenamento; edição concorrente é bloqueada. Recuperar uma fonte incompatível exige ação explícita e cria revisões com a base atual; versões antigas são preservadas. JSON inválido não substitui a sessão. Falha/quota de armazenamento preserva edição aberta e permite exportá-la, incluindo a cópia bruta anterior quando acessível. O envelope tem limite de 3,5 milhões de caracteres; a quota do navegador pode ser menor.

A recuperação de consultas não reabre armazenamento sobre edições abertas. A comparação de `baseVersion` vale também na revisão e restauração de páginas. Navegar entre módulos mantém dados no estado comum; acompanhamento ainda não registrado permanece em rascunho por ID. Importação assíncrona usa o estado atual e rejeita concorrência ou tentativa antiga.

Na prévia, os mesmos 16 móveis de amostra alimentam o resumo e os editores; fotos/preços são históricos e quatro pendências foram introduzidas para conferir os estados. Custos são demonstrativos. Uma campanha de conferência é identificada como demonstração e foi encerrada após o teste. Os registros do navegador são evidência local, não dados comerciais publicados.

Nenhuma operação administrativa nova de escrita foi criada, nenhuma migração executada e nenhum dado remoto alterado. A consulta autenticada de banners reutiliza a operação existente. Cadastro/importação existentes mantêm seus próprios contratos. A página pública conserva a configuração padrão; os rascunhos do estúdio não são lidos pelo visitante público.

Para uso compartilhado e aplicação no site, ainda é necessário integrar persistência/autorização no servidor, revisão/publicação atômica com versão-base, autoria e políticas de acesso. Não existe um arquivo pronto que apenas precise ser habilitado para resolver essas dependências.

## Validação desta entrega

- Suíte Node: 90 testes, incluindo armazenamento, recuperação, restauração, base obsoleta, campanhas, manifesto/importação, links e imagens truncadas.
- TypeScript, ESLint direcionado e build. Não foi executado lint global de áreas sem relação com a mudança.
- Navegador integrado: os dez módulos em 1440, 768 e 360 px sem transbordamento horizontal; gaveta móvel, prévia, navegação, rascunho/reload, revisão/restauração, acompanhamento persistido, geração/cópia de pedido, texto opcional do banner, bloqueio de destino inseguro e simulação/encerramento comercial.
- Exemplo comercial conferido: base Pix R$ 399,00; 10x R$ 45,40; total R$ 454,00. Proposta local R$ 379,00; 10x R$ 43,20; total R$ 432,00. Ao encerrar, base R$ 399,00 preservada. Nenhuma taxa foi alterada.
- Capturas e relatório: pasta irmã `mobi-studio-evidence/`. O script histórico `verify.mjs` foi ajustado à navegação nova, mas não foi executado nesta rodada; a conferência de UI foi pelo navegador integrado. Não foi feita homologação autenticada com banco real, leitor de tela ou teste de equipe.

## Revisão e reversão

Revisão independente encontrou e corrigiu: perda de edição após recuperação da consulta; aceite global de página com base obsoleta; perda de acompanhamento ao navegar; importação assíncrona sobrescrevendo estado recente; dataURL de imagem truncada aceito em snapshot. Testes de regressão foram acrescentados. Na conferência visual, ajustados controles de data, cabeçalho e ações para 360 px.

Reverter somente o commit desta etapa devolve a versão PM-02 anterior; não requer restauração de banco. As chaves locais anteriores não foram apagadas. Sem push, merge, deployment ou publicação; Rafael precisa aprovar a versão apresentada antes de qualquer aplicação em produção.

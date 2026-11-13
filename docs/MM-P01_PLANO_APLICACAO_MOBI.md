# MM-P01 — plano de aplicação da página inicial Mobi

**Data:** 09/11/2026. **Estado:** plano para revisão; não é funcionalidade implementada nem autorização de publicação. **Base inspecionada:** `dad240f`, painel PM-01 a PM-10 em branch local. **Escopo:** a home pública `/`, com suas dependências de cabeçalho, navegação, cartões e painel. `MM-P01` não é o módulo administrativo `PM-01`.

## 1. Realidade operacional que determina o projeto

| Fato / fonte | Aplicação na home e no painel |
| --- | --- |
| Rafael confirmou em 09/11/2026: a Mobi não tem loja física. `moveis-nova-iguacu.tsx` também descreve loja online sem endereço aberto ao público. | Comunicar **atendimento online**. Não criar mapa de unidade, “encontre uma loja”, showroom, visitação, retirada ou CEP usado como localização de loja. Não confundir região atendida com endereço comercial aberto ao público. |
| Catálogo online e atendimento por WhatsApp constam no código atual. | Jornada: encontrar móvel → conferir detalhes/variante → montar seleção no carrinho quando desejado → consultar disponibilidade, entrega e condições no atendimento. Não transformar clique no WhatsApp em venda confirmada. |
| Código informa Nova Iguaçu e regiões próximas da Baixada Fluminense. | Mostrar região de atendimento e consulta por bairro/CEP. Não prometer cobertura de toda a região nem inventar tabela de frete/prazo. |
| Código informa pagamento na entrega, Pix/dinheiro e cartão em até 10x. | Manter a condição comercial vigente e o cálculo central. Revalidar o publicado antes da implementação; não mudar taxa, preço ou 10x para adaptar o visual. |
| Número público configurado: `5521984324338`. Horários constam no rodapé e na página de atendimento. | Reutilizar a fonte existente. Horários e condições de montagem precisam de conferência operacional antes de novos textos/promessas. Não interpretar contato WhatsApp como disponibilidade para ligações. |
| Não há fonte de quantidade física de estoque na inspeção. | Não mostrar “últimas unidades”, entrega imediata, estoque próprio ou mais vendidos sem dados que sustentem a afirmação. “Cadastro elegível” não significa estoque confirmado. |
| Marca, logo oficial, paleta e preferências já registradas. | Logo oficial sem recriação; verde/dourado/areia/cacau e tipografia existentes. Preservar rodapé e barra verde inferior móvel; não reintroduzir os rótulos rejeitados “Rotação diária” e “Curadoria da semana”. |

Texto orientador proposto: **“Sua casa começa por uma boa escolha. Conheça os móveis da Mobi e consulte entrega e disponibilidade pelo WhatsApp.”** É proposta editorial, não slogan já aprovado. A assinatura oficial “Móveis que combinam com a sua vida” permanece preservada.

Não presumir frete grátis, montagem gratuita/inclusa em todos os casos, crédito aprovado, cupom, aplicativo, marketplace, conta de cliente ou avaliação verificada.

## 2. Fontes, limites e divergências encontradas

Documentos retomados: `AGENTS.md`, `DEPLOYMENT.md`, `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md` v0.2, `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md` v1.1 (MM-P01 e grupos GLOBAL/MENU/HOME/CARD), `SITE_CONTEXT.md` do projeto, contexto da pasta de origem e conferência PM-01–PM-10. Os dois originais estão em `C:/Users/rafap/OneDrive/Área de Trabalho/LOJA MOBI/.md/` e não foram alterados.

Código conferido: `routes/index.tsx`, `routes/moveis-nova-iguacu.tsx`, `routes/__root.tsx`, `Header`, `Footer`, `MobileBottomBar`, `WhatsAppFloat`, `CategoryNavigation`, `HeroCarousel`, `BannerSlide`, `HomeProductSection`, `ProductCard`, curadoria, consultas públicas, cálculo comercial e estúdio administrativo.

| Divergência / lacuna | Decisão do plano |
| --- | --- |
| A referência tem links de lojas físicas, conta, favoritos, aplicativo e serviços de marketplace. | Esses elementos não entram por semelhança visual. A informação atual de Rafael prevalece; só entram capacidades e canais reais. |
| Contexto histórico registra 12x e taxas antigas; a cópia atual usa máximo 10x e outra configuração de taxa. | Tratar o contexto como histórico. Na execução, conferir versão que atende o domínio e registrar o 10x exato de referência. Não transportar taxas antigas nem recalcular dados nesta etapa. |
| Contexto antigo menciona quatro botões inferiores; a cópia atual tem cinco, incluindo Catálogo. | Preservar a barra existente; verificar o publicado antes de implementar. Não remover/renomear botões como efeito colateral da home. |
| Contexto descreve Descubra algo novo como rotação diária; `home-curation.ts` usa timestamp completo e a consulta fornece `new Date()`. | A estabilidade diária não está comprovada no código atual. Propor chave de rotação por dia em Brasília, explicitada no painel, com teste de fronteira de dia; preservar exclusões editoriais. Não anunciar que essa correção já existe. |
| O painel tem rascunhos locais; a home ainda não consome suas revisões de páginas, navegação, contato e campanhas. | Essa ligação é trabalho obrigatório do primeiro lote. Não considerar o painel integrado apenas porque os editores aparecem na prévia. |
| Não foi possível acessar o domínio pela ferramenta de leitura web nesta sessão. | Esta auditoria prova o estado da cópia local, não o deployment atual. A execução começa por resolver produção/commit e comparar fontes, conforme `DEPLOYMENT.md`. |

## 3. Composição proposta para a home

A referência documenta 34 requisitos candidatos nos quatro grupos; selecionar a página não aprova todos eles automaticamente. A sequência inferior da concorrente varia e não é um modelo universal. A composição abaixo é uma proposta própria para a Mobi.

### Computador

1. **Comunicação opcional e compacta**, apenas quando houver mensagem aprovada e vigente. Sem conteúdo, a faixa e seu espaço desaparecem. Não acumular barras de canais, ofertas e localização.
2. **Cabeçalho funcional:** logo, acesso a categorias, busca com destaque, atendimento e carrinho visível também vazio. Manter o sticky existente, conferindo altura e âncoras.
3. **Banner principal** com arte Mobi e um destino claro. Começar com uma peça aprovada; carrossel só quando houver mais de uma peça útil. Não repetir a mesma arte em três slides para preencher posições.
4. **Condições e ambientes**, com informação comercial verdadeira e os ícones de categorias existentes. A abertura de categorias no cabeçalho organiza a árvore; não repetir duas grades completas de categorias na mesma dobra.
5. **Escolhas da semana**, preservando os produtos, IDs e ordem editoriais atuais, até quatro itens. Proposta de prioridade: essa seleção entra antes de Descubra algo novo; a nova ordem precisa aparecer no rascunho comparativo, sem mudar a ordem interna dos produtos.
6. **Descubra algo novo**, mantendo exclusões e produtos elegíveis; estabilizar a rotação conforme a regra proposta no item anterior de divergências.
7. **Inspiração**, **Novidades** e **Para sua sala**, usando os blocos existentes e sem reservar altura para seções vazias. O bloco de inspiração só usa imagem e texto compatíveis com os móveis e o destino real.
8. **Convite ao catálogo e atendimento**, seguido do rodapé preservado. Identificar operação online, região atendida, contato e condições reais. Regras de campanha aparecem somente quando houver campanha aplicada e vigente.

### Celular

1. Primeira linha: menu, logo, atendimento e carrinho; busca na linha seguinte. Não inserir conta/favoritos apenas para completar ícones.
2. Banner com composição própria para celular; não reduzir a arte desktop até tornar texto ilegível ou cortar o móvel.
3. Informações essenciais compactas e **Sala, Cozinha e Quarto**, preservando os ícones e sem rolagem horizontal dessa faixa.
4. Mesma ordem editorial de seções; vitrines em duas colunas como ponto inicial. Valores, seleção e disponibilidade têm a mesma fonte dos outros dispositivos.
5. Barra verde inferior e WhatsApp preservados, com distância dos botões, rodapé, teclado, área segura e eventuais diálogos. Sem duas camadas principais abertas.

Títulos e textos de apoio ficam próximos; imagens e controles determinam a altura dos blocos. Não usar grandes alturas mínimas, linhas promocionais vazias ou espaços de módulos desligados. Áreas de toque de pelo menos 44px continuam obrigatórias.

## 4. Matriz dos 34 requisitos candidatos

“Existente” abaixo significa evidência na cópia inspecionada, não homologação em produção. “Aplicar” significa trabalho proposto. Os IDs mantêm a classificação de evidência V/T/P/B do documento original.

**Seleção inicial recomendada — 23 IDs:** GLOBAL-02/03/04/07/08/09/10/11/12/14; MENU-01/02/03/04; HOME-01/02/05/06; CARD-01/04/06/07/08 (todos com prefixo `MM-`). A seleção inclui preservar/refinar capacidades existentes, não reconstruí-las.

**Quatro condicionais:** GLOBAL-01, HOME-03/04/07, dependentes de mensagem/campanha real. **Uma investigação prévia:** GLOBAL-13. **Uma preservação de contexto, sem bloco novo na home:** MENU-05. **Cinco adiados:** GLOBAL-05/06 e CARD-02/03/05. Esses grupos somam os 34 candidatos; nenhum ID foi omitido por conveniência.

| ID | Base encontrada / decisão Mobi | Ligação com painel | Aceite específico da aplicação |
| --- | --- | --- | --- |
| MM-GLOBAL-01 | Faixa configurável opcional; não criar promoção de exemplo. | PM-02, PM-05, PM-07 | Sem mensagem ativa, nenhum bloco ou espaço; se rotativa, controles acessíveis. |
| MM-GLOBAL-02 | Adaptar aos canais reais: WhatsApp/atendimento. Sem barra extra de lojas, app ou telefone presumido. | PM-08 | Destinos oficiais e aprovados; nenhum link de unidade física. |
| MM-GLOBAL-03 | Reutilizar `MobiliLogo` e retorno ao início. | PM-10: ativo oficial protegido | Proporção preservada e link real. Não oferecer editor livre que substitua a marca por texto. |
| MM-GLOBAL-04 | Reutilizar busca atual por catálogo e filtros. | PM-06 e PM-04 | Enter e botão equivalentes, termo preservado e estado vazio/erro tratados. Não criar campo paralelo de busca. |
| MM-GLOBAL-05 | **Adiar conta de cliente.** Admin não é conta do comprador. | PM-09: dependência futura | Nenhum ícone/login público sem fluxo implementado. |
| MM-GLOBAL-06 | **Adiar favoritos.** Requer lista, remoção e persistência definidas. | PM-09 | Não inserir coração meramente decorativo nem cadastro de cliente implícito. |
| MM-GLOBAL-07 | Carrinho existe; tornar o acesso do cabeçalho utilizável com zero itens. | PM-04/05 fornecem dados; PM-01 não inventa vendas | Soma das quantidades consistente após incluir, excluir e recarregar; preservação da cotação existente. |
| MM-GLOBAL-08 | Adaptar localização para **região de entrega/consulta**, não localização de loja. | PM-08 | Sem cálculo, mostrar “Consulte entrega para seu bairro/CEP”. Sem GPS automático, frete zero ou prazo presumido. |
| MM-GLOBAL-09 | Sticky existente; refinar altura, âncoras e interação com barras móveis. | PM-02: comportamento suportado; parâmetros limitados | Sem salto, duplicação ou título/ação cobertos. |
| MM-GLOBAL-10 | Rodapé existente preservado; conteúdo e destinos ligados à configuração. | PM-07, PM-08, PM-10 | Sem visitação, mapa ou links inexistentes; horários e origem coerentes. |
| MM-GLOBAL-11 | Reutilizar mensagens e cálculo comercial existentes. | PM-05: condição; PM-07: apresentação | Sem bandeira/certificado/garantia não comprovados; mesma regra de 10x em todas as telas. |
| MM-GLOBAL-12 | WhatsApp flutuante existente; acrescentar contexto útil onde suportado. | PM-08 | Número oficial, sem envio automático; não cobre botões ou foto. |
| MM-GLOBAL-13 | **Investigar primeiro** os scripts/armazenamento e a política adotada. | PM-09; depois PM-07/10, se houver necessidade real | Não criar aviso decorativo com consentimento que não controla nada. Uma futura escolha deve persistir e ter efeito real. |
| MM-GLOBAL-14 | Conferir camadas públicas: menu, carrinho e consulta. Reutilizar primitivas acessíveis. | PM-10: capacidade; configurações não expõem z-index livre | Escape, fechamento, foco restaurado, rolagem e exclusividade de camada conferidos. |
| MM-MENU-01 | Criar menu desktop com clique/teclado usando taxonomia atual. | PM-06 | Cada categoria tem destino válido e tratamento para ausência de produtos. |
| MM-MENU-02 | Criar gaveta pública móvel, separada da gaveta administrativa. | PM-06 | Sem conta/lojas/serviços inventados; foco, fechar e posição de rolagem preservados. |
| MM-MENU-03 | Grupos reais por categoria e ambiente; filhos derivam da fonte atual. | PM-06 | Expansão e navegação têm funções claras; sem sinônimos/cadastros duplicados. |
| MM-MENU-04 | Preservar Sala/Cozinha/Quarto no celular e categorias existentes no desktop. | PM-06 e PM-02 | Seleção do painel aparece na navegação pública e na prévia; retorno do produto preserva contexto. |
| MM-MENU-05 | Não acrescentar breadcrumb à própria home. Conferir as trilhas existentes nas páginas de destino quando o menu mudar. | PM-06; expansão fora da home em tarefa própria | Uma trilha coerente, sem dois caminhos contraditórios. Não redesenhar todas as categorias nesta etapa. |
| MM-HOME-01 | `HeroCarousel`/`BannerSlide` existem; ligar assets desktop/mobile à leitura publicada. | PM-03 e PM-02 | A arte aprovada do painel é a exibida; alt, destino e fallback funcionam nos dois formatos. |
| MM-HOME-02 | Indicadores e autoplay existem parcialmente; faltam conferir/setas/pausa e movimento reduzido. | PM-03: opções suportadas | Com um slide não há controles; com vários há anterior/próximo, indicador e pausa se automático. |
| MM-HOME-03 | Atalhos promocionais **condicionais**, sem ocupar espaço no início. | PM-02, PM-03, PM-05 | Só aparecem com destino e seleção reais; não fingem oferta. Não introduzir trilho horizontal na faixa de ambientes protegida. |
| MM-HOME-04 | Contagem regressiva **fora do primeiro lote visual**. | PM-05 após motor de campanha publicado | Data real em Brasília, encerramento real e sem reinício por visita. Sem motor aplicado, sem faixa. |
| MM-HOME-05 | Reutilizar `CategoryNavigation`, ícones e taxonomia. | PM-06 e PM-02 | Somente categorias válidas e quantidade adequada ao dispositivo. |
| MM-HOME-06 | Reutilizar quatro vitrines e regras de curadoria; ligar ordem/textos/visibilidade à revisão publicada. | PM-02, PM-04; campanha em PM-05 quando suportada | Até quatro itens por vitrine atual, sem duplicata interna ou item inelegível; manter escolhas semanais e sua ordem. |
| MM-HOME-07 | Termos próprios apenas quando houver campanha válida. | PM-05 e PM-07 | Condições acessíveis antes da consulta/compra; frete e benefício sem regra não são anunciados. |
| MM-CARD-01 | Foto com `ImageWithFallback` e móvel inteiro. | PM-04 | Sem corte de braços/encosto; erro de mídia não cria altura infinita nem ocupa cartão desproporcional. |
| MM-CARD-02 | **Adiar coração** junto com favoritos. | PM-09 | Se desenvolvido depois, ação separada do link e estado real. |
| MM-CARD-03 | **Adiar seleção de variante no card** até contrato consistente. Não confundir galeria com SKU/cor comercial. | PM-04; dependência futura MM-PROD-04 em PM-09 | Foto, nome, ID, preço e disponibilidade precisam mudar juntos. Ambiguidade existente impede homologar esse comportamento. |
| MM-CARD-04 | Título e detalhes existem; refinar legibilidade e alinhamento sem grandes vazios. | PM-04 | Medidas/modelo essenciais não desaparecem na única distinção; nome acessível completo. |
| MM-CARD-05 | **Omitir avaliações enquanto não houver fonte real.** | PM-09: evolução futura | Nenhuma nota, estrelas ou contagem fictícias. |
| MM-CARD-06 | Reutilizar `ProductCard`, cálculo central e referências reais. | PM-04 e PM-05 | Pix/dinheiro, 10x e total consistentes no card/produto/carrinho/mensagem. Registrar antes/depois sem mudar a taxa. |
| MM-CARD-07 | Preservar selos editoriais existentes; outros só com regra/dado real. | PM-02, PM-04, PM-05 | Sem frete grátis/cashback/escassez presumidos; selos fora da foto no celular. |
| MM-CARD-08 | Reutilizar destino e “Ver detalhes”. | PM-04; rota existente | Teclado, toque e nova aba funcionam; atributos/variante não direcionam a item diferente. |

Contas, favoritos, avaliações, variantes no card e funcionalidades de outras páginas permanecem tarefas futuras identificadas. Selecionar MM-P01 não seleciona automaticamente os demais 141 requisitos.

## 5. Integração obrigatória com PM-01 a PM-10

| Área do painel | Responsabilidade na aplicação MM-P01 |
| --- | --- |
| PM-01 — Visão geral | Apontar pendências reais de banners, seções, links, cadastros e revisão. Origem/atualização claras; falha de leitura não vira zero. |
| PM-02 — Páginas e vitrines | Ordem, texto e visibilidade de tipos suportados; configuração do topo em blocos definidos, sem HTML arbitrário. Curadoria continua no contrato atual, sem campo duplicado. |
| PM-03 — Banners e mídias | Assets por dispositivo, alt, destino, ordem e vigência, consumidos pelo mesmo `BannerSlide` na prévia e na home. |
| PM-04 — Produtos | Fonte única de produto, foto, medidas, variantes e preços. O compositor guarda IDs/regras, não uma segunda cópia editável do catálogo. |
| PM-05 — Preços e campanhas | Condição comercial central e vínculos versionados. Atalhos/contagem/termos só poderão ser ligados ao runtime após o motor de campanha realmente existir. |
| PM-06 — Navegação e filtros | Mesma taxonomia para menu desktop, gaveta pública, ambientes e destinos. Não criar categoria só para preencher layout. |
| PM-07 — Conteúdo e ajuda | Mensagens e links próprios. Conteúdo público exige rota/renderer consumidor; sem links para artigos inexistentes. |
| PM-08 — Entrega e atendimento | Atendimento online, contato, horários e mensagens de consulta. “Sem loja física” é premissa operacional protegida, não um botão para inventar um endereço. |
| PM-09 — Evolução do site | Registrar os 34 candidatos, decisões de seleção, exclusões, dependências e evidências. Capacidade local/parcial não aparece como pública/validada. |
| PM-10 — Histórico e configurações | Base de versão, diferenças, revisão aplicada, autoria possível no acesso real, conflito, rollback como nova versão. Aplicação remota e uso compartilhado ainda precisam ser implementados. |

**Regra de pronto por campo:** editar no painel → salvar rascunho → ver efeito no renderer de prévia → revisar diferença → aplicar apenas a versão autorizada → ver efeito na home → restaurar por nova revisão. Um campo sem consumidor não conta como funcionalidade entregue.

Comportamentos como cálculo, semântica de carrinho, limites de segurança, logo e acessibilidade não precisam de controles livres. O painel gerencia conteúdo e configurações suportadas; a implementação mantém invariantes protegidas.

## 6. Base técnica antes do refinamento visual

Fluxo proposto: **editor administrativo → rascunho privado → mesma renderização de prévia → revisão identificada → aplicação autorizada e atômica → configuração pública validada → componentes da home**.

- Reutilizar o catálogo e as operações atuais. Inspecionar esquema/permissões antes de definir migrações; as entidades conceituais da especificação não são ordem de criar várias tabelas.
- Introduzir revisão de configuração com `schemaVersion`, `revisionId`, `baseVersion`, escopo, referências de recursos e estado de revisão/publicação. A estrutura exata depende do esquema encontrado; não está implementada neste documento.
- Prever endpoints de rascunho, revisão, prévia e aplicação com autorização no servidor. Leitura pública recebe **somente a revisão publicada** e um objeto permitido de conteúdo/configuração. Não expor `AdminStudio.entries` bruto: ele pode conter custos internos, notas e dados administrativos.
- Resolver produto por ID a partir da fonte pública; continuar usando o cálculo comercial central. Nunca gravar preço/registro real para experimentar um layout.
- Comparar `baseVersion` também na revisão, aplicação e restauração. Mudança concorrente bloqueia com comparação; nada de sobrescrita silenciosa ou sucesso parcial.
- Preservar os rascunhos locais existentes. Migração/reabertura explícita, cópia recuperável e indicação de origem; não sobrescrever a revisão pública com a demonstração de 16 móveis.
- Fazer a prévia da home completa com os mesmos componentes/dados permitidos da página real. A representação resumida de blocos fixos do PM-02 atual não basta para homologar MM-P01.
- Reutilizar a verificação administrativa existente quando adequada. Não afirmar que senha de sessão já oferece usuários/papéis individuais; uso compartilhado exige autorização e auditoria próprias.
- Na ausência/falha de configuração nova, a home mantém a versão pública estável ou informa falha controlada. Não recorrer a conteúdo fictício ou ao rascunho do navegador do visitante.
- Capacidade ausente continua desabilitada e gera tarefa em Evolução. O painel não executa desenvolvimento de código automaticamente.

## 7. Lotes de execução e critérios de término

Cada lote terá alteração em branch, prévia identificada, testes pertinentes e atualização da matriz. Não publicar no encerramento automático de um lote.

| Lote | Trabalho concreto / arquivos envolvidos | Conferência que permite encerrar |
| --- | --- | --- |
| 0 — Base e operação | Resolver deployment real, comparar fontes com `dad240f`; conferir contatos/horários/condições, arte e catálogo; fechar lista selecionada dos 34 candidatos. Registrar o 10x de referência. | Estado publicado identificado sem alterá-lo; fontes, lacunas e exclusões registradas; nenhum mapa/retirada/conta fictícios. |
| 1 — Painel ligado à home | Evoluir `admin-studio.ts`, `studio-validation.ts`, `AdminStudio.tsx` e contratos de configuração; criar módulos focados de leitura pública e operações administrativas conforme esquema validado; adaptar `routes/index.tsx`/`HomepageSectionOrder`. | Testes: salvar rascunho não muda público; prévia consome a revisão correta; visitante não lê custos/rascunhos; conflito bloqueia lote; revisão/restauração preservam histórico. Validar backend em ambiente de teste, sem escrever configuração publicada. |
| 2 — Cabeçalho e navegação reais | `Header.tsx`, `CategoryNavigation.tsx`, `Footer.tsx`, `WhatsAppFloat.tsx`, `MobileBottomBar.tsx`, `storefront.css`; novo menu público reutiliza componentes acessíveis existentes. Ligar PM-06/07/08 aos consumidores. | Menu e busca funcionam; carrinho vazio acessível; região é atendimento, não endereço; sem links mortos. Testar foco/Escape/scroll e preservar rodapé/barra inferior. |
| 3 — Banner e vitrines | `HeroCarousel.tsx`, `BannerSlide.tsx`, `HomeProductSection.tsx`, `ProductCard.tsx`, `home-curation.ts`, `products.functions.ts`, editores PM-02/03. Ligar assets responsivos e aplicar a ordem proposta em rascunho. | Móveis/arte carregam; uma peça não mostra controles inúteis; seleção semanal preservada; seções vazias somem. Testar rotação proposta por dia em Brasília e casos de erro/limite. Comparar preço/10x/total em todos os destinos. |
| 4 — Comunicação/campanha suportada | Só após lote 1 e motor real de campanha: ligar mensagem, atalhos, vigência, termos e eventuais contagens a PM-05/07. Reusar motor, sem duplicar regra comercial. | Datas e vínculos reais, efeitos apenas nos participantes, encerramento sem restaurar preço antigo sobre edição posterior. Sem dados aprovados, esses blocos permanecem omitidos. |
| 5 — Homologação da versão | Matriz ID → fonte → arquivo → capacidade pública → teste → evidência. Conferir home completa em 360/390/768/1024/1440 px, carregamento, retorno de navegação e estados. | Cada campo novo do painel tem consumidor comprovado; sem transbordamento, vazios de seções desligadas ou ações cobertas; nenhuma função futura marcada pronta. |
| 6 — Aplicação somente após aprovação | Apresentar commit/revisão e prévias; após Rafael aprovar essa versão, executar o preflight de `DEPLOYMENT.md` e aplicar o lote identificado. | Produção aponta à revisão aprovada e comportamento é verificado. Rollback recupera configuração por nova versão ou reverte o commit exato, preservando pedidos e dados posteriores. |

A prioridade inicial é **lote 1, ligação real entre painel e home**, após a conferência do lote 0. Refinar apenas a aparência antes dessa ligação manteria o problema de campos locais sem efeito público.

## 8. Validações e dependências de aceite

1. **Operação:** nenhuma referência a visitação/loja física/retirada; atendimento online explícito; entrega, montagem e pagamento sem promessas adicionais não confirmadas.
2. **Painel → prévia → home:** testar alteração de imagem mobile, ordem de seção, escolha semanal, destino de categoria, mensagem de atendimento e texto publicado. Cada mudança deve chegar ao consumidor certo, respeitando revisão e isolamento.
3. **Regras comerciais:** testes existentes de pagamento e carrinho; cotação preservada e antes/depois de 10x registrado. Não aprovar card que associa foto de uma variante ao preço de outra.
4. **Estados:** catálogo indisponível, vazio, produto removido, imagem quebrada, destino inválido, campanha expirada, armazenamento/rede negados e conflito entre abas/servidor.
5. **Responsividade/acessibilidade:** campos e botões utilizáveis, toque 44px, foco e nomes claros, movimento reduzido, menu/carrinho exclusivos, âncoras abaixo do cabeçalho e barra móvel sem sobreposição.
6. **Conteúdo/SEO:** descrição de loja online, região de atendimento e dados estruturados existentes de organização; nenhum endereço, certificado, nota ou estoque fictícios. Rascunho não entra no sitemap ou na busca pública.
7. **Verificações:** executar testes de categorias se houver mudança de taxonomia, pagamentos/carrinho se houver exibição comercial, testes dos contratos novos, TypeScript, lint direcionado e build. Compilação não substitui conferência visual ou funcional.

## 9. Resultado e limites desta etapa

Entregue **somente este plano**, com decisões de adaptação, seleção dos candidatos, integração ao painel, lotes e critérios de aceite. Não foram modificados código da aplicação, catálogo, preços, banco ou site publicado.

Pendências antes de implementar: comparação com deployment atual; confirmação operacional dos conteúdos que serão novos; identificação de persistência/autorização de teste; ativos reais por dispositivo. A inexistência de loja física já foi confirmada por Rafael e não precisa ser perguntada novamente.

# Revisão da home e do produto — 11/11/2026

Revisão e correções locais em `feature/mm-p07-product-page`. Desktop conferido; conferência visual móvel bloqueada pela ferramenta. Sem push, merge, publicação, migração ou alteração do catálogo remoto. Este registro não homologa toda a especificação nem ativa campanha comercial.

## Fontes e decisões vigentes

Originais reabertos antes da execução e novamente antes da entrega em `C:/Users/rafap/OneDrive/Área de Trabalho/LOJA MOBI/.md/`:

- Engenharia reversa v1.1: `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md`; SHA256 `E1A02C0FF7526537A76A17B42640E7D1BCE64FF0F77FC2A1458D35F930253373`.
- Painel v0.2: `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md`; SHA256 `4CE0516F7C3F3EE31865599CB817D742B601579CE3D211F964F6CBC19748F306`.

São propostas/requisitos, não prova de implantação. Os originais não foram editados. Pedidos posteriores de Rafael prevalecem sobre relatos históricos:

Páginas acessadas nesta rodada: [home MadeiraMadeira](https://www.madeiramadeira.com.br/), [produto Nimes](https://www.madeiramadeira.com.br/armario-de-cozinha-completa-suspenso-300cm-cinza-nimes-madesa-07-904383073.html?index=prod-poc-madeira&seller=21958), [home Mobi](https://www.mobimb.com.br/) e [produto Roma](https://www.mobimb.com.br/produto/sofa-roma-retratil-e-reclinavel-2-00-m-veludo-marrom).

| Decisão atual | Ressalva documental |
|---|---|
| Encontre por ambiente tem Quarto, Sala e Cozinha, nessa ordem, centralizados e com fotos preenchendo. | Planos/diário MM-P01 com cinco ou mais categorias são históricos. A árvore completa do menu continua servindo ao catálogo. |
| Remover Descubra algo novo. | Plano MM-P01 e partes antigas da execução citam Descoberta. O ID pode existir no histórico; o renderer não deve exibi-lo. |
| Black Friday é seção compacta ligada a PM-02/PM-05. | Desenho aprovado não autoriza hotsite completo, cupom, alteração de preço-base ou ativação comercial. |
| Identidade Mobi, atendimento online sem loja física, WhatsApp e cálculo vigente. | Não copiar 12x, lojas, reputação, cashback, montagem ou frete da concorrente. |
| Mostrar prévia e publicar só após aprovação da versão. | Aprovações anteriores não aprovam esta revisão automaticamente. |

## Comparação ao vivo e etapas da revisão

1. **MadeiraMadeira home — acessível:** cabeçalho em camadas, busca dominante, hero com indicadores e controles, atalhos compactos. Campanha 11.11/Black Friday observada; não transferir condições comerciais. Cobertura inferior variável, sem afirmação de auditoria integral do site.
2. **MadeiraMadeira produto Nimes 904383073 — acessível:** miniaturas à esquerda/contador, compra à direita, resumo de medidas, composição conjunta, descrição expansível e tabela agrupada com linhas alternadas. O botão de descrição foi acionado e a seção apareceu. Checkout, frete e serviços não foram contratados.
3. **Mobi publicada — versão anterior:** home ainda tem nove categorias e Descubra; esta Black Friday não estava publicada. No Roma SKU9750 havia oito fotos, medidas/cor, aviso de montagem e sugestão automática de roupeiro para o sofá. A diferença entre loja e branch é real; não declarar a prévia como publicação.
4. **Mobi local home — desktop conferido:** três ambientes/fotos carregadas, Descubra omitido e Black Friday com aviso de demonstração logo abaixo. Visibilidade e destino PM-06 agora alcançam também os cartões de ambiente; projeção parcial e falha da primeira foto usam alternativas do mesmo ambiente.
5. **PM-04 → produto → carrinho — conferido localmente:** escolhi Jamile como complemento de demonstração do Roma e salvei rascunho local v1. A associação apareceu na página; checkbox começou desmarcado. Marcar alterou R$1.999,00 para R$2.398,00. Adicionar 2 itens abriu carrinho com Roma/Marrom e Jamile, uma unidade de cada, com cotações individuais. Nenhuma mensagem ou pedido enviado.
6. **Produto local — desktop conferido:** oito fotos reais, SKU/cor restaurados, preço/parcela/total legíveis, aviso de montagem, descrição expandida e ficha agrupada. Navegação anterior/próxima, zoom, compartilhamento nativo e swipe foram revistos no código, mas não foram exercitados nesta rodada após a revisão.
7. **Mobile — bloqueado:** viewport solicitado 390×844, mas DOM permaneceu 1280×720, inclusive em nova aba. Essas capturas são desktop. Ao tentar a alternativa Chrome, o controle de computador encerrou a sessão porque não conseguiu confirmar a URL ativa no Windows. Nenhuma nova entrada de UI foi executada após o bloqueio. Swipe real/barra fixa/layout móvel continuam pendentes.

## Matriz de aderência e correções

| Requisito/fonte | Arquivos | Evidência e situação | Pendência |
|---|---|---|---|
| Três ambientes; HOME-05; PM-06 | `HomepageCategories.tsx`, `homepage-room-categories.ts`, `home-redesign.css` | Desktop com três cartões preenchidos; respeita visible/href, completa projeções parciais, evita foto vazia e usa alternativas reais. | Mobile/catálogo completo. |
| Remover Descubra; HOME-06 | `HomepageSectionOrder.tsx` | Bloco omitido mesmo em revisões antigas. | Não reintroduzir por plano histórico. |
| Imagens/densidade/preço; CARD-01/06 | `ProductCard.tsx`, estilos | Moldura preservada e cálculo central único; cópia comercial igual à publicada. | Homologação visual móvel. |
| Black Friday; PM-02/05 | `HomepageContent.tsx`, `home-configuration.ts`, `CampaignsPanel.tsx` | Projeção local com aviso; vigência Brasília; cancelamento/fim removem IDs sem sobrescrever preço-base. | Fonte pública persistente, autorização e ativação comercial. |
| PROD-01/02/03/04/05/19 | `ProductDetailView.tsx`, rota, CSS | Oito fotos, miniaturas/contador, SKU/cor e reset por produto; alvos de galeria ≥44px no código; swipe evita zoom acidental. | Interações de galeria/zoom e mobile não exercitadas nesta rodada. |
| PROD-06/07/08/09/10; PM-05 | `ProductDetailView.tsx`, carrinho, `payment.ts` | Preço/parcela/total separados; aviso vigente restaurado; cor acompanha item; CTA usa carrinho existente. | Barra móvel e painel de pagamento no celular. |
| PROD-13/14/15; PM-04 | `product-measurements.ts`, `ProductDetailView.tsx` | Ponto/vírgula, aberta/fechada, ambiguidades preservam original; descrição expande sem navegar e ficha agrupa dados. | Materiais, peso, montagem tipada, inclusos e fila automática de conflitos ainda não têm contrato completo. |
| PROD-16; PM-04 | `product-bundles.ts`, editores, view | Até três IDs editoriais; opções/cor de complemento exigem escolha quando ambíguas; total/inclusão correspondentes. | Migração e homologação autenticada em produção. |
| Compatibilidade antes de migrar | `product-schema.ts`, `products.functions.ts`, `admin.functions.ts` | PostgrestError bruto reconhecido; retries independentes; falta de bundle não desliga curadoria. Cadastro comum funciona sem coluna; seleção não vazia falha antes da escrita. | Testes com callbacks controlados; banco real não exercitado. |
| PM-04 campo/rascunho/prévia/histórico | `OperationsPanels.tsx`, `admin-studio.ts`, `product-drafts.ts`, `StorefrontPreview.tsx` | Formatos/base validados; todos os campos alimentam prévia; corrupção não derruba renderer nem apaga edição. Browser confirmou associação salva; testes confirmaram demais atributos. | Persistência e autorização compartilhadas. |
| PM-06/08 entre páginas | `StorefrontPreview.tsx`, provider | Produto carrega a mesma configuração de cabeçalho/menu/rodapé da home. Endpoint aceita apenas loopback na porta realmente usada. | Homologação real autenticada. |

## Preços e integridade do build

| Produto | À vista observado | 10x antes → depois | Total cartão |
|---|---:|---:|---:|
| Roma 9750 | R$1.999,00 | R$227,50 → R$227,50 | R$2.275,00 |
| Jamile | R$399,00 | R$45,40 → R$45,40 | R$454,00 |

Calculadora/identidade protegida mantêm hashes anteriores. A cópia que o build já removia passou a estar removida na fonte; aviso de montagem vigente passou ao componente. `mobi-product-check.mjs` valida sem reescrever arquivos nem exigir hash do template substituído. `vercel.json` usa essa checagem seguida do build.

`review-product.json` é uma cópia local dos dados públicos do Roma observados em 11/11, não conexão permanente com catálogo. A demonstração tem 16 registros históricos + esse produto =17; custos administrativos são sintéticos, não cotações de fornecedor, e não entram no renderer público. Roma/Jamile é um rascunho de demonstração, não curadoria publicada.

## Verificação e limites

- TypeScript, build e checagem comercial passaram. Lint direcionado sem erros; aviso de Fast Refresh no ProductCard permanece.
- 30 testes de produto/schema/rascunhos/medidas/validação passaram; scripts de pagamento/carrinho passaram.
- 5 testes novos de Black Friday passaram: ausência/revisão, vigência, fim/cancelamento, projeção sem preços/custos e conflitos.
- Grupo home/campanhas/runtime/imagens: 24 passaram; teste de arquivo falhou porque sandbox Windows negou rename (EPERM). Fora do sandbox apareceu fixture antiga sections:[] incompatível com o schema. Corrigida para defaultHomeSections(); persistência isolada reexecutada em temporários fora do sandbox: 3/3 passaram. Store/atomicidade/demo não alterados.
- Categorias e fallback de imagens passaram na revisão da home. Diff check sem erros.
- Vercel/Supabase MCP indisponíveis nas chamadas; CLI Vercel falhou em fetch também fora sandbox. Não foi certificado ID/commit do deployment atual. Comparação publicada é da UI observada, não da árvore remota.
- Capturas não provam acessibilidade completa; não se declarou conformidade WCAG.

## Capturas da rodada

Pasta `../../mobi-review-evidence/`: 01 referência home, 02 Mobi publicada home, 03 referência produto, 04 referência ficha, 05 Mobi publicada produto, 06 home local, 07 PM-04 salvo, 08 composição local, 09 carrinho, 10 ficha local. Nenhuma captura móvel aceita.

![Home local](../../mobi-review-evidence/06-mobi-home-revisada-desktop.jpg)

![Compre junto e descrição](../../mobi-review-evidence/08-produto-compre-junto-desktop.jpg)

![Ficha local](../../mobi-review-evidence/10-produto-ficha-desktop.jpg)

## Pendências para homologação

1. Conferir mobile real, galeria/zoom/swipe e barra fixa quando a ferramenta permitir.
2. Resolver fonte exata do deployment e alterações concorrentes antes de publicar.
3. Revisar/aplicar migração de complementos e homologar editor autenticado com aprovação correspondente; nenhuma DDL foi aplicada aqui.
4. Homologar fonte persistente/autorizada de home e campanhas; os dez módulos locais não equivalem a CMS remoto completo.
5. Evoluir atributos tipados de materiais, montagem e inclusos sem inferência de dados.

Prévia local em `http://127.0.0.1:5193/`; produto `/produto/sofa-roma-retratil-e-reclinavel-2-00-m-veludo-marrom`. Reversão: reverter só os arquivos desta revisão e usar histórico local de rascunhos; não restaurar banco nem sobrescrever alterações posteriores. Publicação continua aguardando aprovação explícita da versão.

# Revisão de alinhamento — página de produto

Data: 11/11/2026  
Área: MM-PROD-01, MM-PROD-02 e MM-PROD-16  
Branch: `feature/mm-p07-product-page`  
Escopo: página do sofá Roma na prévia local; sem gravação no catálogo ou publicação.

## Etapas observadas

1. **Mobi, captura desktop enviada — grade horizontal desalinhada.** O cabeçalho usa o eixo `.mobi-wrap` (máximo de 1280 px e 32 px de recuo no desktop); a página usava máximo de 1440 px e 40 px de recuo. Por isso, breadcrumb e miniaturas começavam bem à esquerda da logo e a área de compra ultrapassava o eixo do menu. Captura: [17 — produto desktop enviado](../../mobi-review-evidence/17-captura-produto-desktop-enviada.png).
2. **MadeiraMadeira, página de produto ao vivo — referência de composição.** Conferi breadcrumb, galeria à esquerda, miniaturas externas e coluna de compra à direita. A Mobi mantém seus próprios termos, identidade e operação online; não copiei ofertas ou serviços da referência. Captura anterior: [15 — referência MadeiraMadeira](../../mobi-review-evidence/15-madeiramadeira-produto-auditoria.jpg).
3. **Mobi, prévia estreita — saúde boa, homologação limitada.** A página usa uma coluna, indicadores sob a foto, preço fixo no rodapé e mantém título legível. O viewport capturado tem 636 px, não os 390 px exatos; a homologação a 390 px continua pendente. Captura: [14 — estado anterior](../../mobi-review-evidence/14-pagina-produto-previa-atual.jpg).
4. **Mobi, após ajuste da cor.** Para produto com uma única cor, substituí o bloco de duas linhas “Cor / variação” + “Marrom” por `Cor: Marrom`. Produtos com várias cores continuam com seleção de botões. Captura: [16 — cor alinhada](../../mobi-review-evidence/16-pagina-produto-cor-alinhada.jpg).
5. **Mobi, correção do enquadramento desktop.** Alinhei a largura máxima da página do produto a 1280 px e o recuo horizontal a 32 px, como no `.mobi-wrap` do cabeçalho. Breadcrumb, trilho de miniaturas e borda da coluna de compra passam a compartilhar o eixo da logo/menu. A prévia atualizada permanece local na rota do produto.
6. **Mobi, rolagem da ficha desktop.** A captura seguinte mostrou uma área branca depois do fim da galeria, enquanto a coluna de compra seguia com montagem, ações, entrega e medidas. A galeria agora acompanha a rolagem dentro da linha principal, abaixo do cabeçalho fixo, apenas em telas a partir de 1024 px. No celular, a página continua em fluxo normal.
7. **MM-PROD-16, “Compre junto”.** A página de referência coloca essa seção depois do resumo/vendedor e antes da descrição. O componente local tem cartões com seleção, preços, total recalculado e inclusão dos itens escolhidos. O rascunho do sofá Roma está com `compre_junto_ids: []`, então a seção fica oculta nessa prévia; não associei complementos inventados.

## Achados e limites

- O desalinhamento horizontal e o vazio causado pela diferença de altura entre colunas receberam correções locais; não alterei dados comerciais nem conteúdo do catálogo.
- A engenharia reversa v1.1 descreve a referência e marca MM-PROD-01/02/16 como “não iniciado/não verificado no código”; esse status é do documento, não prova o estado atual da branch. Nesta revisão, confirmei a composição na prévia local e a presença de implementação local para MM-PROD-16. A ficha orienta galeria à esquerda no computador e foto/indicadores na ordem móvel, adaptadas à identidade e operação Mobi.
- A especificação do painel v0.2 é uma proposta de arquitetura; ela não indica que a página pública ou cada campo já esteja integrado ao painel.
- O viewport de 390 px e a interação física por toque não foram homologados nesta revisão. Capturas também não comprovam acessibilidade integral.
- O rótulo compacto não altera cor, preço, parcela, SKU, catálogo, imagens ou regras comerciais.

## Próximo ajuste

Conferir na prévia se a galeria permanece abaixo do cabeçalho durante a rolagem e se para no fim da linha principal; homologar também a largura móvel de 390 px e o toque. Para exibir “Compre junto” no Roma, a Mobi precisa escolher IDs válidos de complementos no catálogo. Nada foi publicado.

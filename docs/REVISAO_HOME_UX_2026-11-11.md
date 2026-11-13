# Página inicial Mobi — revisão de UX e composição

11/11/2026. Implementação local na branch `feature/mm-p07-product-page`, sem publicação ou gravação no catálogo remoto. A amostra da prévia não representa preços/ofertas homologados para produção.

## Áreas e ligação com o painel

A composição Mobi mantém esta sequência na revisão local. A ordem, os títulos, a visibilidade e a seleção continuam consumindo a configuração existente; rascunhos anteriores não foram reescritos.

| Área | Função na página | Origem/painel | Referência e arquivo |
|---|---|---|---|
| Banner principal | Apresentar um destaque com destino claro, sem ocupar a tela inteira | PM-03: banners e imagens desktop/mobile existentes | MM-HOME-01/02; `HeroCarouselView`, `BannerSlide`, `home-redesign.css` |
| Condições de compra | Informar pagamento na entrega, cartão e consulta pelo WhatsApp | Regras comerciais vigentes; renderer existente | GLOBAL; `HomepageContent` |
| Quarto, Sala e Cozinha | Entrar nos ambientes por três fotos compactas, centralizadas e preenchidas | PM-06: destino/visibilidade; fotos derivadas dos produtos do ambiente | MM-HOME-05; `HomepageCategories` |
| Black Friday | Dar destaque à seleção da campanha em faixa verde e dourada | PM-02: seção/título/ordem; PM-05: produtos e período já suportados na simulação local | MM-HOME-03/06, CMS-04; `BlackFridayHomeSection`, `HomepageContent` |
| Escolhas da semana | Exibir a curadoria e sua ordem existentes | PM-02/PM-04: IDs e ordem atuais, preservados | MM-HOME-06; `HomeProductSection` |
| Novidades e Para sua sala | Exibir as seleções válidas sem deixar colunas vazias para preencher | PM-02: seção; PM-04: critérios/curadoria existentes | MM-HOME-06; `HomeProductSection` |
| Catálogo e atendimento | Oferecer continuação clara, região e ajuda ao final | Catálogo existente e mensagem de atendimento configurada | GLOBAL; `HomepageContent`, rodapé existente |

## Ajustes aplicados

- Banner e intervalos mais curtos; fotos preservam o móvel.
- Ambientes limitados a 600 px no desktop, com fotos inteiras em quadros quadrados e rótulos centrados. No celular, os três continuam visíveis. Esta correção substitui o enquadramento panorâmico com corte da primeira revisão.
- Black Friday tem cabeçalho próprio. A seção permanece condicionada à seleção válida e à campanha; a demonstração conserva seu aviso. Nenhum desconto, contagem, cupom ou frete foi inventado.
- Grades se adaptam a dois, três ou quatro itens. Uma vitrine com um único produto vira uma faixa com foto, identificação, preço e ação no desktop; no celular usa um cartão de largura completa.
- Textos comerciais e botões das vitrines ganharam legibilidade; o convite final para o catálogo ficou em uma linha de ação no computador e empilhado no celular.

## Conferência e limites

Os dois originais foram reabertos antes da implementação e na revisão final: especificação do painel v0.2 e engenharia reversa v1.1. A home da MadeiraMadeira foi aberta ao vivo: banner, trilhos promocionais e títulos próximos ao conteúdo foram observados. Sua sequência inferior varia com campanha/carregamento; esta ordem é uma adaptação Mobi, não uma sequência universal comprovada da referência. Os estados históricos “não iniciado” do levantamento não descrevem o código atual.

Build e ESLint focado passaram. No desktop (1280 px), foram conferidos banner, ambientes, Black Friday, vitrine com um produto e encerramento. No celular (390 px), foram conferidos banner, ambientes, Black Friday, preços e botões das vitrines. Nenhuma imagem quebrada foi identificada; a largura da página ficou dentro da viewport. O atalho Quarto abriu a categoria correta. A 360 px também foi conferida a largura pelo DOM; a captura dessa dimensão ficou com escala inconsistente da ferramenta e não foi usada como evidência visual. Nenhum teste automatizado novo foi criado.

As capturas em `.output/home-ux-2026-11-11/` registram a primeira revisão, rejeitada por Rafael. A correção atual está em `.output/mobile-layout-fix-2026-11-11/`. Prévia: `http://127.0.0.1:5196/`.

## Correção de celular após as capturas de Rafael

- Causa do enquadramento: fotos quadradas de 750×750 eram exibidas com `cover` em quadros de 107×91 no celular e ainda mais panorâmicos no desktop. Agora os quadros são quadrados e usam `contain`; a foto de cozinha, que é horizontal, também permanece inteira. O zoom de hover que voltava a cortar a foto foi retirado.
- Causa do desalinhamento: a regra móvel inicial de 44 px para o menu era substituída por outra de 88 px. A grade foi consolidada: menu de 44 px, logo ao lado, ações à direita, busca em uma linha independente. A composição vale também para tablet estreito. Campo de busca com 16 px, envio por lupa e contador do carrinho posicionado sem alargar o grupo de ações.
- MadeiraMadeira foi aberta novamente em largura de 390 px. Foram observados hambúrguer e logo próximos, ícones à direita e busca abaixo; adaptação Mobi conforme MM-GLOBAL-03/04 e MM-HOME-05. Os dois documentos originais foram reabertos antes e depois da implementação.
- O corte lateral exato do título da campanha não foi reproduzido no localhost desta rodada. A largura e a capacidade de encolher dos contêineres foram explicitadas, e os limites de cabeçalho, ambientes e título Black Friday foram verificados diretamente, sem usar apenas a largura total da página como evidência.
- Verificações de geometria em 320, 360, 390, 430, 600, 768, aproximadamente 1023 e 1440 px: os elementos conferidos permaneceram dentro da área disponível. A evidência registra a viewport efetivamente recebida e a regra móvel ativa. Menu abriu/fechou; a busca pela lupa retornou o Sofá Roma com o termo na URL; a página da Poltrona Jamile foi conferida em 390 px com imagem inteira e cabeçalho alinhado.
- Build, ESLint focado de Header/HomepageCategories e `git diff --check` passaram. Não foram criados testes automatizados novos para esta correção visual. Validação feita no navegador local com amostra; não equivale à conferência em aparelhos físicos nem à homologação de produção.

Evidências atuais: `home-390.jpg`, `product-390.jpg`, `desktop-black-friday.jpg` e `responsive-checks.json` em `.output/mobile-layout-fix-2026-11-11/`. Alterações em `Header.tsx`, `HomepageCategories.tsx` e `home-redesign.css`; os contratos de configuração do painel foram preservados.

Publicação remota, persistência compartilhada e ativação real de campanhas continuam com seus limites anteriores. A leitura do deployment atual pela CLI Vercel falhou por acesso à rede; nenhuma promoção, push ou publicação foi realizada. Aprovação da versão continua necessária antes de produção. A reversão deve retirar somente os ajustes desta revisão, preservando os demais trabalhos pendentes da branch.

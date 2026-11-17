# Banners aprovados em 17/11/2026

Rafael autorizou aplicar a nova Black Friday preta e os banners Genova e Sara, com versões independentes para computador e celular. Arquivos em public/banners/mobi-20261117-*.webp; conversão WebP mantém as dimensões nativas e a composição aprovada, sem esticar ou recortar os móveis, textos ou logos.

As imagens geradas têm proporção desktop diferente do espaço 2500 × 700. O renderer preserva a arte inteira com contain e fundo preto/verde correspondente. A versão mobile tem composição própria, aproximadamente 991:673. Não afirmar que os arquivos nativos foram exportados em 2500 × 700 ou 991 × 673.

A tabela homepage_banners existente mantém uma imagem por posição. approvedBannerArtwork reconhece as URLs das três artes e recupera a versão mobile correspondente tanto no renderer quanto no rascunho administrativo. URLs de outras imagens não recebem pareamento presumido. Não há migração de schema.

Destinos: Black → /categoria/sofas; Genova → /produto/estofado-retratil-reclinavel-genova-230-2x90-molas-ensacadas-veludo-in-6750-6769-230; Sara → /produto/alpoim-9602. Produtos consultados no catálogo, sem alteração de preços ou registros de produtos.

Fonte antes da publicação: main bf348529a6c91e46a7e36c0099ab51921e440f8b, deployment dpl_FxyecAFvW1Nko9hQMFHPKaz289yt. Verificação do script PowerShell depende de ferramentas indisponíveis neste Linux; conferir por conectores domínio/projeto/equipe/SHA e comparar somente caminhos revisados. Não alegar execução do script.

Antes da troca, os três registros homepage_banners usavam https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80, eyebrow COLEÇÃO MOBI, subtitle Móveis que combinam com a sua vida., cta_label Encontre seu próximo móvel, cta_href /?all=true#catalogo, active true. Títulos por posição: 1 Ambientes que fazem sentido.; 2 Um novo jeito de morar.; 3 Seu lar, com mais estilo. updated_at 2026-09-30 04:05:25.026601+00. A troca deve condicionar a escrita a essa base e não alterar outras posições.

Reversão: restaurar esses valores somente se os registros ainda apontarem às novas artes e reverter o commit se necessário. Preservar alterações posteriores e produtos. Sem escrita em workspace de rascunhos ou tabelas comerciais.

Verificações anteriores à publicação: 15 testes pertinentes de banners/fallback, ESLint direcionado e build passaram. Confirmar leitura das seis imagens e destinos no domínio após o deploy; simulação local não equivale a gravação real.

# Painel Mobi — revisão de usabilidade

Base: main `9f988155130e89b6e5ac5d07af91736bd85d1add`, correspondente ao deployment de produção `dpl_H28whZNDuvW9yQ3kpynnDnqyvvMX`, resolvido pelo domínio antes da implementação. Branch `codex/painel-intuitivo-20261116`. Produção não alterada.

## Resultado

A página inicial passa a separar precificação de cadastros com preço que precisam de conferência. Atalhos abrem precificação, importações e vitrine. O item da fila pode abrir diretamente seu preço. A área Precificar inicia com produtos sem preço, permite pesquisar nome/referência e alternar para os demais produtos. Salvar usa a operação administrativa existente.

O editor real do produto tem seções Dados do móvel, Fotos, Preço e fornecedor e Compre junto. Os campos permanecem no mesmo estado ao alternar a seção. Complementos usam pesquisa em vez de renderizar todo o catálogo; selecionados continuam visíveis. Há aviso ao descartar e ao fechar a página com alterações abertas. Os rótulos foram associados aos campos principais. O cálculo de 10x vem da função comercial já existente, sem alteração de taxas.

A busca global não duplica a busca contextual de Produtos/Precificar. As opções do filtro administrativo agrupam Sofá/Sofás, Banqueta/Banquetas e diferenças de maiúsculas/acentos. Nenhuma categoria ou URL foi reescrita no banco. A navegação mantém os módulos e passa a nomear claramente o simulador de ofertas.

Falha de rascunho mostra Revisão necessária, a versão bloqueada e o motivo expansível. Mantém as travas de conflito e a recuperação explícita com a fonte atual, sem sobrescrever a cópia antiga. O editor de vitrines deixa de afirmar que tudo é salvo no navegador quando é gerenciado pelo histórico remoto.

## Matriz documental

Fontes reabertas antes da implementação e da entrega: `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md` v0.2 e `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA.md` v1.1, anexos do projeto. Não são afirmação de integração completa.

| Requisito                                         | Fonte                           | Arquivo                                    | Evidência                                                                                         | Limite                                                        |
| ------------------------------------------------- | ------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Filas por tarefa e números reais                  | PM-01                           | AdminOverview.tsx                          | estados consultados; atalhos e abertura do item no navegador                                      | contagens seguem critérios do cadastro, não estoque físico    |
| Produto por seções; fornecedor interno            | PM-04; MM-QUALITY-01            | routes/admin.tsx                           | dados/fotos/preço/complementos, preservar edição e cancelar                                       | nenhum upload no banco real                                   |
| Precificação e comparação                         | PM-05; MM-CMS-03                | SupplierPricingPanel.tsx; routes/admin.tsx | R$ 999,00 → 10x R$ 113,70, salvar remove item da fila na fixture                                  | nenhuma política comercial alterada                           |
| Navegação mobile, alvos e leitura                 | seção 4; MM-QUALITY-01/03       | AdminWorkspace.tsx; admin-usability.css    | desktop 1363px; iframes com viewport 360/390/768px; sem overflow horizontal de documento          | sem aparelho real ou teclado virtual                          |
| Categorias sem duplicação na busca administrativa | PM-06                           | admin-categories.ts                        | dois testes de equivalência, preservação e distinção                                              | editor mantém categoria original; não é migração de taxonomia |
| Conflito e recuperação preservam versões          | PM-10; MM-CMS-08; MM-QUALITY-08 | AdminStudio.tsx; PagesAndShelvesPanel.tsx  | fixture obsoleta bloqueada; recuperação → v2; salvar → v3; revisão → v4; histórico preserva v1–v4 | Supabase de produção não sofreu escrita                       |
| Campanhas futuras distintas de operação real      | PM-05; MM-CMS-04                | admin-navigation.ts                        | navegação Simular ofertas; limitações de integração permanecem explícitas                         | motor comercial de campanhas não implementado nesta revisão   |

## Verificação

- TypeScript sem erros, ESLint direcionado e build da aplicação completos.
- Suíte Node: 180 testes passaram, zero falhas; inclui dois testes novos do filtro administrativo e testes existentes de preço, histórico, concorrência e publicação.
- Inspeção das 12 áreas: Início, Produtos, Precificar, Importações, Categorias, Vitrines, Banners, Conteúdo, Ofertas, Atendimento, Histórico e Evolução.
- Fluxos exercitados: busca Roma retorna um item; busca de complemento retorna a poltrona correspondente; seções de editor; fotos; busca e filtro de precificação; salvar preço na fixture atualiza contagem; cancelar saída mantém o texto temporário; descarte explícito fecha o editor; gaveta móvel; recuperação/salvar/revisar e retenção das quatro versões.
- Responsive: desktop e iframe com viewports de 360/390/768px. Em 360px, largura útil 345px e scrollWidth 345; em 768px, largura útil 753 e scrollWidth 753. A barra de rolagem interna reduz 15px da largura útil. Seções do produto em grade 2×2 no celular.
- Fixture isolada do dashboard real, sem senha real, sem operações Supabase. Uploads bloqueados explicitamente na demonstração. A fixture substitui módulos apenas no Vite da prévia; não altera o build de produção.

Não foram exercitados uploads, exclusão, importação em banco real, escrita remota real, publicação de campanhas, envio de WhatsApp nem publicação da home. Essas ações exigiriam alterar dados de produção e não constituem teste visual seguro. Suas integrações existentes foram preservadas e a compilação foi verificada; não se declara teste completo de ponta a ponta dessas operações.

## Reproduzir

`npx vite --config scripts/pm01-preview/vite.config.ts` e abrir `/scripts/pm01-preview/index.html?view=operations`. Para rascunho remoto simulado desatualizado: acrescentar `&scenario=stale`. O backend dessa fixture é memória local. Não usar fixture como catálogo ou persistência de produção.

## Publicação e reversão

Entregar prévia/PR para revisão. Não integrar em main nem promover produção antes da aprovação da versão. Reversão: reverter somente o commit desta entrega; nenhuma migração, restauração de banco ou alteração de taxa é necessária. Antes de publicar, repetir a resolução do deployment e o preflight previsto em DEPLOYMENT.md para os caminhos aprovados.

## Ajuste aprovado — miniaturas em 17/11/2026

Rafael aprovou o restante da revisão e pediu foto em toda referência a produto no painel. Acrescentadas identidades visuais compartilhadas em precificação, filas iniciais, cabeçalho do editor, seleção/comparação/prévia de campanhas, produtos relacionados de artigos, seleção do atendimento e referências identificáveis no histórico/revisão. Listas e seleções que já tinham imagens foram preservadas. Produtos removidos ou sem imagem têm espaço reservado com indicação Sem foto. A miniatura tenta a galeria quando a principal falha; usa object-fit contain para não cortar o móvel.

A seleção nativa de produto do atendimento virou diálogo com pesquisa e foto nas opções. A confirmação de remoção também mostra o móvel, mantendo cancelamento e a operação de exclusão existentes; confirmação fica bloqueada durante o envio. Nenhuma alteração de preço, taxa, cadastro ou fotos no banco.

Validação adicional: TypeScript e ESLint direcionado; 20 testes pertinentes de imagem, resumo e campanhas passaram. No navegador: miniaturas no início e precificação; imagem real do Roma carregada tanto na linha de preço quanto no cabeçalho do editor; seleção de Roma no atendimento confirmada pelo ID `review-sofa-roma`; confirmação visual de remoção aberta e cancelada com o produto preservado. Em viewport 390px, largura útil e scrollWidth iguais a 375px. Os links de algumas fotos SR retornaram HTTP 503 nesta sessão; nesses casos foi observado o fallback, sem alegar recuperação da origem ou substituir foto de um móvel pela de outro.


## Banners — autorização de publicação em 17/11/2026

Rafael autorizou publicar a revisão, condicionando a publicação às dimensões da Sofá na Caixa. Conferência ao vivo em https://sofanacaixa.com.br/: imagens desktop 2500 × 700 (também 1300 × 364, mesma proporção), mobile 991 × 673; carrossel medido com 1252 × 350,55 px.

| Requisito | Fonte | Implementação | Evidência | Limite |
| --- | --- | --- | --- | --- |
| Mesmas proporções responsivas | Pedido de Rafael; PM-03; MM-HOME-01 | src/home-redesign.css | Desktop 1252 × 351; celular 343 × 233, sem overflow | A resolução física das artes existentes não é alterada; contain preserva imagem inteira |
| Prévia indica dimensões reais | PM-03; MM-CMS-01 | src/components/admin-studio/BannersPanel.tsx | Rótulos 2500 × 700 e 991 × 673; formatos forçados com as mesmas proporções | Sem recorte destrutivo; arte fora da proporção mantém faixas |

17 testes de banners, seleção e fallback passaram; ESLint direcionado e build passaram. A prévia isolada mantém aviso de ausência do servidor local e algumas imagens do fornecedor indisponíveis, condições anteriores à alteração. Nenhuma alteração de artes, preços, taxas ou dados do catálogo. A publicação ocorre via PR #24 após prévia Vercel READY e nova conferência da origem em produção. O script PowerShell de preflight depende de ferramentas indisponíveis neste Linux; projeto, equipe, domínio, SHA de origem e caminhos alterados são conferidos por conectores e comparação Git equivalente, sem afirmar execução do script.

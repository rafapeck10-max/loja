# Página inicial dinâmica por meio do PM-02

**Estado:** desenho aprovado em conversa em 14/11/2026; esta especificação aguarda revisão. Nenhuma alteração de código, configuração ou banco de produção foi feita nesta etapa.

## Objetivo

Permitir que Rafael escolha pelo painel quais produtos aparecem nas vitrines da página inicial, pesquise no catálogo completo, troque, remova e ordene os itens, e veja o resultado na prévia. Depois da aprovação da versão, a home publicada deve consumir essa configuração. As informações de cada card continuam vindo do cadastro atual do produto.

“Dinâmica” aqui significa que a seleção e a ordem podem ser administradas no PM-02 e que nome, foto, categoria e preço vêm do catálogo vigente. Não significa mostrar todos os produtos ao mesmo tempo ou trocar itens aleatoriamente.

## Constatação do código atual

- `src/routes/index.tsx` carrega dados próprios para a home por `homepageProductsQueryOptions()`.
- `src/lib/products.functions.ts` consulta produtos no Supabase e hidrata os IDs selecionados com os campos públicos atuais. Portanto os dados dos cards já têm origem no catálogo.
- `src/lib/home-local-store.server.ts` desativa o repositório de configuração quando executa na Vercel ou em produção. A revisão aplicada pelo editor PM-02 local não chega à home pública.
- `src/lib/home-curation.ts` mantém uma lista de IDs de produtos em `featured-products.ts` como contingência quando a curadoria não está disponível. Ela não deve ser uma fonte normal da vitrine.
- `src/components/HomeCurationPanel.tsx` contém uma curadoria separada de produtos. Isso não substitui o fluxo do PM-02 de rascunho, prévia, revisão e configuração aplicada.

Consequência: cadastro atualizado e seleção editorial são coisas diferentes. O código atual atualiza os dados de um produto selecionado, mas o fluxo de página do PM-02 não publica a seleção que Rafael espera conseguir editar.

## Alternativas consideradas

1. **Preencher todas as vitrines automaticamente.** Novos produtos poderiam entrar sem seleção manual, mas Rafael perderia controle sobre o que aparece e a ordem.
2. **Escolher tudo manualmente.** Dá controle direto, porém exige manutenção manual das seções que já usam regras automáticas, como Novidades.
3. **Combinar catálogo automático e escolha manual por vitrine — recomendada.** Preserva as regras automáticas existentes e permite selecionar, trocar, retirar e ordenar produtos no PM-02 quando Rafael quiser controlar uma vitrine.

## Desenho aprovado

### 1. Editor PM-02

- Cada seção que exibe cards oferece uma lista visível dos itens atuais e uma ação clara para escolher/trocar produtos. A seção editorial de ambientes continua buscando fotos do catálogo por categoria.
- O seletor pesquisa o catálogo do PM-04 e identifica cada resultado por foto, nome, categoria, referência/SKU e preço atual.
- Rafael pode adicionar, substituir, remover e ordenar os produtos. Os controles e limites da seção ficam explícitos; o limite atual de quatro itens é mantido, salvo decisão posterior.
- Cada vitrine de cards pode usar a regra automática existente ou uma seleção manual de IDs. Escolhas da semana permanece manual por padrão; Novidades e Para sua sala preservam a regra automática atual por padrão. O painel torna a troca manual disponível sem apagar essas regras.
- A mesma lógica vale para as vitrines de produtos da home. A seção Black Friday continua recebendo produtos exclusivamente da campanha válida do PM-05, sem uma segunda lista concorrente no PM-02.
- As escolhas são referências aos IDs do catálogo, não cópias de nome, imagem ou preço. Atualizar o produto no PM-04 atualiza os dados usados no card sem perder sua posição na vitrine.
- Produtos sem preço de venda ou sem imagem válida não podem ser adicionados. Se um item selecionado perder elegibilidade depois, o painel aponta o problema e a home não inventa substituto nem mostra informação comercial inválida.

### 2. Conteúdo automático e decisões Mobi

- A curadoria semanal continua editável e ordenada pelo usuário.
- Novidades e Para sua sala conservam os critérios automáticos atuais como padrão; a escolha manual de uma vitrine substitui a lista exibida naquela revisão, sem criar cópias de cadastro de produto.
- A seleção de ambientes da home continua sendo Quarto, Sala e Cozinha, com imagens derivadas do catálogo elegível.
- “Descubra algo novo” permanece fora da página inicial, conforme a decisão posterior de Rafael, embora ainda apareça no modelo antigo de seções do código e nos documentos históricos.
- Preço, desconto, parcelas, disponibilidade de estoque e fornecedor não são modificados por este fluxo. A Mobi continua sendo uma loja online, sem loja física para visitação.

### 3. Rascunho, prévia e aplicação

1. O painel salva as alterações como rascunho compartilhado e recuperável.
2. A prévia desktop e celular usa o mesmo renderer e os mesmos cards da loja.
3. A revisão compara IDs, ordem e seções com a versão aplicada e identifica produto indisponível, duplicado na mesma vitrine ou inválido.
4. Uma configuração só chega à loja depois de revisão e ação explícita de aplicação/publicação. A loja mantém a versão anterior se a gravação falhar.
5. A home pública lê apenas a configuração aplicada e combina seus IDs com os dados públicos atuais do catálogo. Custos, fornecedor, rascunhos e histórico interno nunca são enviados ao visitante.

Para liberar o fluxo em produção será necessário persistir a configuração aplicada no servidor e acrescentar um consumidor público seguro. A migration `20261112161958_add_mobi_studio_workspace.sql` define armazenamento privado de rascunhos do painel; isso não constitui uma fonte pública da home. O estado de aplicação dessa migration no projeto remoto será confirmado antes da implementação. O desenho técnico da publicação e as regras de acesso serão detalhados no plano após aprovação desta especificação. Nenhuma migration será aplicada remotamente sem aprovação da versão revisada.

## Critérios de aceite

- O PM-02 encontra qualquer produto elegível pelo catálogo, sem IDs embutidos em uma lista da página inicial.
- Trocar, remover, adicionar e ordenar produtos muda a prévia desktop e celular, sem editar o cadastro do produto.
- Salvar, recarregar o painel e reabrir preserva o rascunho; a versão pública não muda antes da aplicação.
- Após aplicação autorizada, a rota pública mostra os IDs e a ordem escolhidos e os dados mais recentes dos produtos.
- Atualizar nome, foto ou preço no PM-04 atualiza o card da mesma seleção.
- A Black Friday usa a seleção/período do PM-05; descontos e condições não são presumidos.
- “Descubra algo novo” não aparece na página nem é reativado pelo editor.
- Nenhuma seção vazia ocupa espaço; itens inválidos geram explicação no painel e não exibem preço ou disponibilidade inventados.
- Nenhum custo ou nome interno de fornecedor aparece no transporte público.

## Fora de escopo

- Alterar preço base, preço anterior, cálculo de Pix/cartão, parcelas, estoque ou dados de fornecedores.
- Criar um CMS externo ou duplicar o catálogo no painel.
- Reintroduzir “Descubra algo novo”, criar novas rotas de categoria, ou alterar a operação real de entrega e atendimento.
- Aplicar migration, alterar dados remotos, fazer push para a branch de produção ou publicar a loja antes da aprovação da versão final.

## Referências e ressalvas documentais

- `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md`, v0.2, PM-02 e fluxo “Editar a página inicial”: seleção por IDs, rascunho, prévia desktop/mobile, revisão e publicação autorizada.
- `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md`, v1.1, MM-HOME-06: vitrines usam lista editorial de IDs, título, limite e ordenação; não há sequência universal confirmada para a home da referência.
- `docs/PM02_CONFERENCIA_DOCUMENTAL.md`: implementação anterior do editor é local; sem escrita no servidor ou aplicação pública.
- `docs/MM-P01_EXECUCAO.md`: a exclusão de “Descubra algo novo” e as três categorias Quarto/Sala/Cozinha são decisões posteriores às versões antigas dos documentos.
- O levantamento de engenharia reversa registra muitos itens como “não iniciado/não verificado”; esses status são históricos e não descrevem por si só o código atual.

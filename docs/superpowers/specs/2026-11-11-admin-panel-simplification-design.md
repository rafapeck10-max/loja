# Painel Mobi — navegação e telas por tarefa

Status: proposta para revisão do usuário. Nenhuma interface, dado ou integração foi alterada por este documento.

## Entendimento aprovado

O painel precisa ficar mais simples e bonito, com a função principal de cada aba evidente e sem ferramentas redundantes. A organização deve refletir a operação conhecida da Mobi: venda online de móveis, catálogo real, custo interno por fornecedor, preço à vista/Pix e atendimento por WhatsApp. A loja não tem ponto físico. O usuário pediu que funções já previstas continuem disponíveis, mas que as mais importantes sejam fáceis de encontrar.

A MadeiraMadeira serve como referência de experiência observável, não como prova do funcionamento administrativo interno da concorrente. A solução deve usar a identidade Mobi e os dados e regras já existentes no projeto.

## Estado atual observado

- A navegação principal coloca PM-01 a PM-10 e “Coletados para revisão” no mesmo nível, totalizando onze destinos.
- A Visão geral repete contagens do catálogo entre cartões, uma faixa de totais, a lista de pendências e a atividade local do estúdio. Também dá destaque parecido a funções locais, como simulações e acompanhamento de requisitos, e a dados reais do catálogo.
- Produtos já têm busca, filtros, edição e importação administrativa. O painel também agrupa produtos por fornecedor e sinaliza falta de custo, falta de preço no site e preço abaixo do custo informado.
- Conteúdo, mídia, categorias, campanhas e atendimento têm áreas de edição local. Essas telas não representam, por si só, alterações já aplicadas à loja publicada.
- Histórico e evolução têm funções próprias. A revisão de coletas é uma ação operacional do catálogo, não precisa competir com ele no menu principal.

## Organização proposta

O menu principal terá cinco destinos de operação e um grupo secundário:

1. **Início** — resumo operacional e próximas pendências.
2. **Catálogo** — produtos, fornecedores e preços, coletas para revisar, categorias e filtros.
3. **Conteúdo da loja** — páginas e vitrines, banners e mídias, conteúdo de ajuda.
4. **Ofertas** — preços e campanhas.
5. **Atendimento** — orientações operacionais, mensagens e consulta pelo WhatsApp.
6. **Mais** — histórico e configurações; evolução do site.

Os códigos PM-01 a PM-10 deixam de ocupar espaço no menu, mas continuam associados aos módulos em títulos secundários, documentação e estados de revisão quando forem úteis. Nenhuma função ou histórico será excluído por causa do agrupamento.

## Layout e prioridade dentro das áreas

### Início

- Mostrar primeiro a fila única de produtos que precisam de atenção, ordenada por impacto prático: preço ausente, custo do fornecedor ausente e imagem/cadastro incompleto conforme os critérios atuais.
- Cada linha informa o produto, o fornecedor quando disponível, o motivo específico e uma ação direta para abrir a edição.
- Mostrar uma contagem compacta de itens prontos e pendentes, sem repetir os mesmos totais em cartões e faixas diferentes.
- Manter atualização manual e data/origem da consulta em um único local. Em erro, exibir que a contagem não foi confirmada e oferecer nova tentativa; nunca inventar números.
- Campanhas locais, rascunhos, histórico e requisitos de evolução não ocupam cartões equivalentes aos dados operacionais. O acesso a essas áreas fica no menu correspondente.

### Catálogo

A área terá navegação interna curta, sem criar uma tela de opções antes dos produtos:

- **Produtos:** busca por nome/SKU, fornecedor e filtros essenciais por categoria, situação de publicação e situação de preço. A lista mantém ações existentes de criar, editar e remover; nenhum comportamento de gravação muda nesta reorganização.
- **Fornecedores e preços:** visão concentrada por fornecedor para a rotina de precificação. Cada grupo mostra somente contagens úteis e abre uma lista compacta com produto/SKU, custo informado pelo fornecedor, preço à vista/Pix da Mobi, diferença bruta e pendências. A diferença deve permanecer identificada como bruta e não como lucro ou margem, pois não inclui taxas, frete nem outros custos. Custo e fornecedor são internos e nunca aparecem na loja pública.
- **Coletas para revisar:** fila separada dentro do catálogo, com origem do arquivo, estado da conferência e ação explícita de revisar/importar. Nenhuma coleta é aceita ou publicada automaticamente.
- **Categorias e filtros:** editor e prévia local da taxonomia. O estado deve dizer claramente que salvar rascunho não altera a navegação publicada enquanto a persistência/aplicação remota não estiver disponível.

A busca global do topo continua restrita a produtos por nome/SKU e deve encaminhar diretamente para Produtos com o termo preenchido. Em telas de fornecedor, o filtro selecionado não deve sumir ao abrir a edição e voltar à lista.

### Conteúdo da loja

Subáreas internas: **Páginas e vitrines**, **Banners e mídias** e **Ajuda e conteúdo**.

- Páginas e vitrines priorizam escolher a página/seção, editar o conteúdo necessário, ordenar ou ocultar e conferir a prévia. Elementos fixos não devem aparecer como se fossem editáveis quando não são.
- Banners priorizam selecionar a arte, conferir os formatos para computador/celular, texto alternativo, destino, ordem e prévia. Vigência e detalhes menos comuns ficam recolhidos até serem necessários.
- Ajuda e conteúdo priorizam selecionar o artigo/página, editar e visualizar. Controles avançados de estrutura aparecem junto à edição correspondente, não como atalhos soltos.
- As três áreas identificam rascunho local, prévia, estado da fonte e o que ainda não é aplicado à loja. A prévia reflete o mesmo contrato de conteúdo consumido pela loja; não alegar publicação quando não houver essa integração.

### Ofertas

- A primeira tela lista campanhas e seus estados locais, com ação principal clara para criar ou continuar a revisão.
- A edição conduz na ordem: nome e período, produtos participantes, preço proposto, revisão dos valores e simulação.
- Mostrar preço atual real somente quando houver referência registrada; preservar preço à vista/Pix, regra Mobi de até 10x e total calculado. Não importar taxas ou quantidade de parcelas da concorrente.
- Associação de banners/seções, metadados de origem e limites técnicos ficam recolhidos como opções avançadas.
- A ação final desta versão é revisar/salvar simulação local. Não apresentar agendamento ou aplicação pública como disponível.

### Atendimento

- Dar prioridade às mensagens e instruções realmente usadas no atendimento online e ao botão/link de consulta pelo WhatsApp.
- Informar que preço, frete, prazo e disponibilidade são confirmados pelo canal de atendimento quando essa informação não vier de uma fonte integrada.
- Não incluir endereço de loja, showroom, visita, retirada ou fluxo de loja física.
- Manter campos e prévia local; alterações não aparecem como publicadas até haver integração real.

### Mais: histórico, configurações e evolução

- **Histórico e estado do painel:** revisões locais agrupadas por área, data e estado, com comparar, exportar, recuperar e restaurar conforme recursos existentes. Conflitos e alterações abertas devem ser avisados antes de substituir qualquer edição.
- **Evolução do site:** catálogo pesquisável dos 141 requisitos, separado do trabalho diário e com estado da referência, observação Mobi, implementação e ativação claramente distintos.
- Informações de migração, persistência remota e permissões mostram pendências objetivas. Não exibir controles de equipe ou publicação sem backend que os suporte.

## Regras transversais de interface

- Cada tela começa com título direto, uma frase curta sobre a tarefa e uma ação principal. Não reservar espaço para subtítulos ausentes nem acumular grandes margens entre título, explicação e conteúdo.
- Mostrar ao lado da ação o estado que importa: fonte consultada, rascunho local, erro ou dependência. Explicações secundárias ficam em detalhes recolhíveis próximos ao item correspondente.
- Usar controles e espaçamentos compactos da identidade visual Mobi, com hierarquia clara e áreas clicáveis de pelo menos 44 px. Em telas estreitas, subáreas passam a rolagem horizontal identificável ou lista compacta; formulários e dados não devem causar rolagem horizontal da página.
- Preservar ações existentes, limites de acesso, validações, IDs estáveis, histórico e estados. Simplificar significa remover repetição e esconder complexidade rara até ela ser necessária; não significa eliminar dados, capacidade planejada ou salvaguardas.
- Distinguir visualmente catálogo autenticado, coleta aguardando revisão, rascunho local, simulação e estado publicado confirmado. Não inferir publicação pelo fato de um conteúdo aparecer na prévia administrativa.

## Fora do escopo desta reorganização

- Criar migração ou alterar esquema, registros, preços, parcelas, produtos, estoque ou conteúdo publicado.
- Implementar publicação remota, envio de mídia, sincronização multiusuário, agenda de campanhas, permissões ou auditoria remota.
- Excluir módulos, estados locais, histórico, funções existentes ou requisitos do manifesto.
- Copiar a interface privada ou os dados da MadeiraMadeira; a referência inspira apenas comportamentos observáveis e aplicáveis à Mobi.

## Critérios de aceite da prévia

1. O menu principal apresenta no máximo cinco tarefas rotineiras e um acesso secundário “Mais”, mantendo todos os destinos atuais acessíveis.
2. Em Catálogo, uma pessoa identifica rapidamente os produtos de cada fornecedor, custo interno, preço Mobi, diferença bruta e itens sem preço/custo, sem confundir diferença com margem real.
3. Coletas, categorias/filtros, campanhas e conteúdo continuam disponíveis e mostram claramente seu estado local ou dependência.
4. A Visão geral tem uma fila acionável única e não repete os mesmos totais em vários blocos.
5. Atendimento representa a Mobi online, com consulta por WhatsApp e sem funções de loja física ou promessas não integradas.
6. Histórico, restauração e catálogo de requisitos permanecem acessíveis e protegidos contra substituição acidental.
7. A prévia local/branch é revisada em desktop e celular. Produção permanece sem alteração até aprovação explícita dessa versão.

## Base documental e pendências conhecidas

- Especificação Mobi do Painel, versão 0.2: define PM-01–PM-10 como arquitetura proposta e separa funções locais de integrações futuras.
- Engenharia reversa MadeiraMadeira, versão 1.1: reúne observações e requisitos da referência; não comprova o CMS privado da concorrente nem o estado Mobi.
- Conferência PM-01–PM-10: registra o comportamento local atual, as dependências de persistência remota e os limites de cada módulo.
- Preparação de fornecedores para migração: preservar fornecedor e custo internos, não misturar com preço público e não tratar o agrupamento atual como migração concluída.
- Acesso autenticado ao painel e ambiente local com configuração Supabase seguem necessários para a futura revisão visual e operacional da prévia. Não usar produção para contornar essa limitação.

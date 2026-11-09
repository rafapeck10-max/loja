# PM-01 — Conferência documental e critérios para a correção

Data: 09/11/2026. Versão examinada: commit `a095c7a`, branch local `feature/pm01-visao-geral`.

Situação: primeira prévia rejeitada por Rafael. PM-01 em revisão; não está homologado visualmente, funcionalmente em ambiente real ou autorizado para publicação. Os testes anteriores não equivalem à aprovação de experiência e aparência.

## 1. Fontes efetivamente retomadas

| Fonte | Versão | Trechos determinantes |
|---|---|---|
| `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md` | 0.2, 06/11/2026 | §0 adaptação/isolamento/aprovação; §2 base e limites; §4 estrutura desktop/mobile; §5 módulos disponíveis; §6 PM-01; §8 dados e permissões; §9 entregas; §10 validação |
| `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md` | 1.1, 06/11/2026 | §0–3 interpretação, IDs e composição; grupos CMS/QUALITY; §7–8 estados e dados; §10 aceite/MM-QA; §12–14 lacunas, rastreabilidade e manifesto |
| `AGENTS.md` e `DEPLOYMENT.md` da cópia de trabalho | revisão da branch | Preservação de histórico, reaproveitamento, isolamento e verificação antes de publicar |
| Código Mobi | base main `23c0d6749e911b6a9c91376deb71517f439c3c74` + primeira entrega | `admin.tsx`, `AdminOverview.tsx`, `admin-overview.ts`, `admin-filters.ts`, `admin.functions.ts`, `HomeBannersPanel.tsx`, `home-curation.ts`, `products.functions.ts`, `styles.css`, `MobiliLogo.tsx` |

Originais dos dois documentos: `C:/Users/rafap/OneDrive/Área de Trabalho/LOJA MOBI/.md/`. Não foram alterados.

SHA-256 da engenharia reversa: `E1A02C0FF7526537A76A17B42640E7D1BCE64FF0F77FC2A1458D35F930253373`.

SHA-256 da especificação do painel: `4CE0516F7C3F3EE31865599CB817D742B601579CE3D211F964F6CBC19748F306`.

O manifesto embutido foi analisado como JSON: 38 fichas, 141 requisitos e 141 IDs únicos. Sua cópia de consulta está em `docs/referencias/madeira-manifesto-v1.1.json`. Os detalhes de todos os requisitos permanecem nessa cópia: computador, celular, comportamento, dados, dependências, aceite e reversão. Seleção/status originais são metadados da referência; não são auditoria de implementação da Mobi.

## 2. O que a referência permite concluir

O PM-01 não é uma tela administrativa da MadeiraMadeira inspecionada. CMS é uma proposta de adaptação Mobi, com evidência P. Não há screenshot nem especificação de backend privado da concorrente que determine uma reprodução literal desse painel.

A especificação Mobi define estrutura, funções e limites; a direção visual ainda precisa de uma composição própria verificável. Valores observados na loja concorrente, como Inter, laranja, largura da sidebar de categoria e proporções de banners, não são tokens do painel Mobi.

Identidade encontrada no código: logo `MobiliLogo`/`mobi-logo-approved.png`; Manrope com fallback sans-serif; verde `#2E3F32`, dourado `#C5A059`, areia `#F4EFE6`, cacau `#493327`. Conferir a fonte realmente carregada no navegador, além da declaração CSS. Não confundir o menu da loja pública ou a barra inferior aprovada com a navegação do admin.

## 3. Confronto da entrega com a especificação

Legenda: atendido no código local; parcial; ausente; dependente de outra capacidade; não validado. Nenhum desses estados significa publicado ou aprovado.

| Detalhe exigido | Fonte | Evidência na primeira versão | Situação / correção necessária |
|---|---|---|---|
| Nome Painel Mobi e identidade oficial | Painel §4 | Logo reaproveitado e nome alterado | Parcial: aplicação de tokens não garante qualidade visual; reconferir tipografia renderizada, hierarquia e densidade |
| Sidebar desktop com logo, navegação e contexto | Painel §4 Computador | Mantidas cinco abas horizontais | Ausente: redesenhar a estrutura de navegação administrativa |
| Faixa superior com título, busca contextual e acesso loja/ajuda | Painel §4 Computador | Cabeçalho e subtítulo, sem busca contextual do painel | Parcial: busca pública da loja não substitui busca contextual administrativa; não criar atalho para ajuda inexistente |
| Gaveta mobile com área atual identificada | Painel §4 Celular | Abas em grade de duas colunas | Ausente: gaveta acessível, fechamento e retorno de foco |
| Conteúdo adaptado ao dispositivo | Painel §4; QUALITY-03 | Colunas empilhadas; cinco larguras sem overflow | Parcial: corrigir navegação e avaliar densidade/legibilidade, teclado, toque e rotação |
| Cartão Rascunhos em revisão | PM-01 | Texto “Pendente de integração” | Dependência: falta fonte persistente de rascunhos/revisões; fila de fornecedor não é rascunho editorial |
| Cartão Campanhas vigentes | PM-01 | Somente indicação de integração futura | Dependência: fonte de campanhas com status e vigência |
| Cartão Campanhas terminando | PM-01 | Não representado individualmente | Dependência e regra de produto: janela “terminando” não foi definida no documento; decidir e exibir período, sem inventar urgência |
| Cartão Pendências de cadastro | PM-01 | Preço, imagem e custo, repartidos em contadores | Parcial: categorias atuais são úteis, mas não substituem a visão geral de operação |
| Cartão Solicitações de desenvolvimento | PM-01 | Apenas texto de integração futura | Dependência: acompanhamento PM-09, com estado Mobi separado de evidência da referência |
| Origem e horário de cada número | PM-01 | Origem geral no rodapé e horário por consulta | Parcial: relacionar a cada cartão sua fonte e atualização de forma consultável; informar o que está indisponível |
| Sem visitas, conversão/vendas fictícias | PM-01 | Nenhuma métrica desse tipo adicionada | Atendido localmente; manter |
| Pendência contém problema e item | PM-01 | Nome e motivos por produto | Atendido para esses cadastros |
| Pendência contém impacto | PM-01 | Não há campo/explicação de impacto específica | Ausente: explicar a consequência verificável, sem afirmar bloqueio de vitrine sem aplicar a regra real |
| Ação direta resolve o item indicado | PM-01 | Callback de edição ligado ao ID; demo abre diálogo ilustrativo | Parcial: verificar formulário real autenticado e retorno ao contexto, sem gravação de teste em produção |
| Banner mobile ausente | PM-01; CMS-01 | Sem regra de diagnóstico | Dependência: editor atual usa uma imagem por posição. Não marcar todos os banners como erro por um campo mobile que ainda não existe |
| Campanha sem data final | PM-01; CMS-04 | Sem fonte e sem regra | Dependência: validar campanha real/rascunho; não criar alerta a partir de número de exemplo |
| Produto da vitrine sem preço | PM-01; CMS-02 | Inspeção genérica de todos os produtos | Parcial: cruzar seleção real de vitrine e elegibilidade. Produto sem preço fora da seleção não é esse mesmo alerta |
| Requisito aguardando validação | PM-01; QUALITY-06 | Sem fonte de acompanhamento | Dependência: ler estado Mobi e evidência, não `evidence=V` ou status inicial do manifesto |
| Contagem baseada em regras executadas | PM-01 | Regras locais executadas para preço/imagem/custo | Atendido só nesse recorte. “URL informada” não prova imagem carregada; documentar cobertura |
| Limite da consulta de revisão | Painel §6 origem; QUALITY-08 | Limite compartilhado 500; exibe 500+ ao atingir | Atendido localmente; não chamar mínimo conhecido de total exato |
| Carregando/erro não viram zero | QUALITY-08; Painel §10 | Casos de falha total/parcial e carregamento previstos | Atendido na amostra; fluxo autenticado real ainda não validado |
| Módulo planejado não ganha botão falso | Painel §5 | Texto de pendência, sem salvar/publicar fictício | Atendido nesse aspecto. Atalhos da demo são demonstrativos, não editores funcionais |
| Prévia usa componentes reais | Painel §10; CMS-05 | Resumo real importado em harness separado | Parcial: não reproduz navegação, sessão, editores e shell reais do `/admin` |
| Validação de foco/leitor de tela | QUALITY-01 | Atributos acessíveis e teste de Escape no diálogo da demo | Não validado integralmente: não houve teste com leitor de tela, ciclo completo de foco/gaveta nem editor real |
| Aviso de alterações não salvas | Painel §4 | Não implementado pelo PM-01 | Responsabilidade dos editores; preservar rascunhos ao navegar e verificar antes de ampliar a navegação |
| Comparação por ID e evidências | QUALITY-06; MM-QA-14 | Testes e relatório sem matriz de conformidade documental | Corrigido documentalmente por esta matriz; nenhuma nova homologação de UI |
| Versão, reversão, aprovação | §0; QUALITY-07 | Branch/commit local e nenhuma publicação | Atendido: código isolado; versão visual rejeitada não pode ser promovida |

## 4. Relação exata com os IDs da engenharia reversa

| ID | Relação com PM-01 | Limite do escopo |
|---|---|---|
| MM-CMS-01 | Diagnóstico de banner e atalho ao editor | Não implementar biblioteca completa nem campos sem consumidor por causa do resumo |
| MM-CMS-02 | Saúde das seleções e seções da vitrine | Reaproveitar curadoria; não duplicar o compositor |
| MM-CMS-03 | Destino das pendências comerciais | Não mudar preços ou taxas ao construir a Visão geral |
| MM-CMS-04 | Fonte futura de vigência e alertas de campanhas | Sem fonte real, status indisponível/planejado; não inventar campanha ativa |
| MM-CMS-05 | Prévia local isolada | Mesmos componentes da versão implementada; diferença de harness declarada |
| MM-CMS-06 | Possível origem futura de pendências de atributos | Não adicionar motor de filtros como efeito colateral |
| MM-CMS-07 | Origem futura de rascunhos editoriais | Não tratar fila de importação como revisão de conteúdo |
| MM-CMS-08 | Histórico e rastreabilidade dos eventos | Não confundir log persistente com timestamp de consulta |
| MM-QUALITY-01 | Foco, teclado, toque de 44px, nomes acessíveis, diálogo/gaveta | Testar na navegação realmente entregue |
| MM-QUALITY-02 | Logo e qualquer mídia do resumo carregadas; fallback | Validar imagem por carregamento é diferente de verificar string de URL |
| MM-QUALITY-03 | 360/390/768/1024/1440, rotação e interações | Capturas isoladas não validam o editor inteiro |
| MM-QUALITY-04 | Restrições sobre métricas e intenção WhatsApp | Não instalar analytics nem criar números de vendas neste lote |
| MM-QUALITY-05 | Preservar metadados existentes; admin não público | Sem auditoria SEO pública adicional; noindex não é autenticação |
| MM-QUALITY-06 | Reaproveitar rota, consultas, sessão, editores e estado | Mapa de arquivo/ação/evidência obrigatório |
| MM-QUALITY-07 | Isolamento, reversão, aprovação da versão | Sem merge para produção ou promoção sem aprovação explícita |
| MM-QUALITY-08 | Dados ausentes, falhas e conflitos com origem identificada | Desconhecido não vira zero, estoque presumido ou alerta inventado |

Todos os demais 125 requisitos continuam catalogados, sem seleção automática, auditoria de implementação ou autorização de execução neste lote. O inventário integral pode ser consultado no JSON e no índice gerado nesta pasta.

## 5. Dados e regras necessários para o resumo

| Informação | Fonte inspecionada | O que pode ser afirmado |
|---|---|---|
| Cadastro e preço/custo/imagem | `listAdminProdutos`, `admin-filters.ts` | Estado administrativo conforme regras existentes; não é confirmação física de estoque |
| Seleções de vitrine | Campos de curadoria + `home-curation.ts` | Necessário cruzar produto selecionado, disponibilidade textual e elegibilidade da seção; respeitar fallback atual |
| Fila coletada | `listPendingScrapedProducts` | Até 500 retornados; não é catálogo publicado nem rascunho editorial |
| Banners | `HomeBannersPanel` + consulta administrativa de banners | Contrato atual tem uma imagem por posição; disponibilidade de tabela precisa ser checada |
| Rascunhos editoriais | Nenhuma fonte persistente auditada para esse resumo | Indisponível; estado local do formulário de banner não equivale a histórico persistente |
| Campanhas vigentes/terminando | Nenhuma fonte integrada auditada para PM-01 | Indisponível; Black Friday permanece trabalho paralelo separado |
| Solicitações/requisitos em validação | Sem acompanhamento PM-09 integrado | Manifesto é catálogo da referência, não andamento real |

Modelo de apresentação proposto para cada indicador: nome, valor ou estado explícito, fonte, instante da última consulta bem-sucedida, cobertura/limite e destino. Cada pendência precisa de recurso/ID, regra, problema, impacto, ação, estado e origem. Este é um contrato de apresentação proposto; não é uma migração de banco.

Uma consulta em atualização deve indicar isso. Se houver dado antigo visível após erro, marcar desatualização; caso seja ocultado, não substituir por zero. Zero só vem de uma consulta bem-sucedida sem ocorrências. A data de consulta não é a data de edição do produto.

## 6. Direção concreta para refazer a primeira tela

Separar exigência documental de decisão visual:

- Exigência: sidebar desktop e gaveta mobile; topo com área atual e busca contextual; conteúdo operacional; linguagem de negócio; identidade Mobi; sem funcionalidades falsas.
- Proposta de composição para revisão visual: navegação persistente e compacta à esquerda; faixa superior discreta; um título Visão geral; resumo de operação; lista de atenção como bloco principal; atalhos secundários. Não repetir vários cabeçalhos e frases decorativas antes dos dados.
- Na Visão geral, as categorias de operação especificadas precisam estar representadas. Fontes ainda não implementadas devem aparecer com estado informativo e motivo, sem números ilustrativos que pareçam reais. Em demonstração isolada, dados fictícios podem mostrar estados futuros, desde que a área inteira seja identificada como estudo e não como integração pronta.
- A lista de atenção prioriza consequências e ações verificáveis. Não chamar aviso de custo interno de produto de indisponibilidade pública sem verificar a regra do site.
- Definir um conjunto coerente de tamanhos de texto, pesos, alturas de controles e intervalos, usando tokens existentes. Essa composição ainda exige inspeção visual e feedback; não está aprovada só por constar neste documento.
- Menu só abre áreas funcionais. PM-02 a PM-10 não estão automaticamente autorizados como implementações completas por este redesenho.

## 7. Conferência obrigatória antes da próxima entrega

1. Reabrir os dois documentos originais; comparar versão/hash e reler o módulo selecionado, os IDs relacionados e critérios transversais. Não trabalhar somente pelo resumo desta auditoria.
2. Atualizar esta matriz com evidência de código e de tela; conservar estado parcial quando faltar validação real.
3. Conferir tokens e fonte efetivamente renderizada, logo, alinhamento, densidade, contraste e hierarquia em computador e celular. Qualidade visual exige avaliação própria além de testes funcionais.
4. Demonstrar o mesmo shell e navegação que a versão de código utiliza. Qualquer destino somente ilustrativo deve ficar explícito.
5. Testar botões/destinos, filtros, abrir/fechar gaveta, Escape, foco, teclado, leitor de tela e toque; verificar as larguras indicadas e rotação. Marcar o que não foi possível testar.
6. Exercitar consulta carregando, sucesso, vazio, falha, falha parcial, atualização e limite de contagem; sem zeros presumidos, campanhas ou números reais inventados.
7. Preservar estado dos editores existentes e confirmar que a prévia não grava dados publicados. Não testar salvar/upload contra produção por estar em localhost.
8. Apresentar versão, capturas, comparação contra requisitos, pendências e reversão. Testes verdes não encerram pendência visual nem substituem aprovação de Rafael.
9. Só avançar o PM-01 para validado quando os critérios do recorte estiverem demonstrados e a versão aceita. Aprovação de desenvolvimento não autoriza publicação.

## 8. Decisões não presentes nos documentos

Não foram especificados: screenshot final do admin, medidas exatas de seus componentes, janela de “campanhas terminando”, regra de prioridade entre alertas nem fonte persistente das três capacidades futuras. Esses pontos não podem ser apresentados como observados na MadeiraMadeira. Decisões visuais rotineiras podem ser propostas e mostradas; regra comercial ou prazo que altere o significado dos dados exige definição explícita.

As 38 fichas são famílias de página/estado, não ordem de criar 38 rotas. O inventário de 995 URLs não significa 995 telas inspecionadas. O status original `nao_iniciado` e a evidência V/T/P/B não confirmam estado atual da Mobi.

Resultado desta etapa: requisitos e falhas documentados para corrigir o PM-01. A tela rejeitada continua sendo a primeira versão; este documento não afirma que o redesenho já ocorreu.

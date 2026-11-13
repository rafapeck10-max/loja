# Auditoria funcional e visual Mobi — 12/11/2026

## Resultado e ambiente

Auditoria da versão **local em desenvolvimento**, com correções de falhas reproduzidas. Não equivale à homologação de produção, nem à implementação de todos os itens do planejamento.

- Branch: `feature/mm-p07-product-page`, base `833bccf`, com alterações locais anteriores preservadas. Não houve commit, push, merge ou publicação.
- Prévia auditada: [loja local](http://127.0.0.1:5201/) e [painel local](http://127.0.0.1:5201/scripts/pm01-preview/index.html?area=overview).
- Origem e armazenamento isolados: porta 5201, `.mobi-local-preview/audit-2026-11-12/`. Os rascunhos do navegador na porta 5196 e o arquivo `.mobi-local-preview/demo/home.json` não foram editados.
- Base demonstrativa: 17 registros administrativos, 13 elegíveis para a listagem pública. Esses números **não são uma contagem do catálogo real da Mobi**.
- O ciclo de salvar/revisar/aplicar/restaurar foi exercitado exclusivamente na cópia de auditoria. A configuração aplicada dessa cópia foi reposta ao conteúdo original após o teste; o histórico e os rascunhos de teste do navegador 5201 permanecem separados.
- Nenhuma mensagem foi enviada no WhatsApp. Nenhum preço, estoque, fornecedor ou configuração remota foi gravado.

## Falhas encontradas e corrigidas

| Prioridade | Falha reproduzida | Correção e conferência |
|---|---|---|
| P1 | Editar ajuda descartava `articles` do mesmo rascunho. Na reprodução, quatro artigos viraram zero. | `ContentPanel` preserva os demais campos ao editar ou adicionar páginas. Após a correção, ajuda e artigo coexistiram e foram salvos na versão local 4. |
| P1 | `/ajuda` retornava `Not Found` na prévia. Inspiração e artigos também não tinham rotas correspondentes nesse ambiente. | Rotas locais e middleware completados. As telas foram extraídas para componentes usados tanto pelas rotas principais quanto pela prévia. Busca, leitura e FAQ foram exercitados com conteúdo temporário revisado. |
| P1 | Inspiração acessava `articles.length` quando não havia configuração. A checagem de tipos já falhava. | Estado vazio trata a lista ausente. TypeScript e compilação passaram. |
| P1 | Artigo com produto relacionado quebrava a prévia com “Valor monetário inválido”. | O adaptador da prévia devolvia registros administrativos. Agora converte para o contrato público, com os mesmos critérios de elegibilidade. Artigo abriu com Poltrona Jamile, R$ 399,00 e 10x R$ 45,40. |
| P1 | Atualizações de código criavam outra raiz React sobre a existente, com `removeChild` e tela de erro. | A raiz da prévia é desmontada no descarte do módulo. A navegação final abriu sem erro no console da aba nova. |
| P1 | Compilar enquanto a prévia estava aberta podia encerrar o servidor por `EBUSY` ao monitorar `.output`. | O monitoramento ignora build, evidências e armazenamento local. Uma nova compilação terminou com a prévia funcionando; home e filtros reabriram depois dela. |
| P2 | Carrinho carregava JSON sem validar o formato, podia renderizar dados inválidos e não sincronizava alterações entre abas. | Leitura validada, preservação de cotações válidas, hidratação antes da gravação e sincronização entre abas. Há três testes de regressão para armazenamento corrompido, quantidades e cotações. |
| P2 | Diminuir/aumentar tinham 14 × 14 px; remover tinha 16 × 16 px. Fotos no carrinho usavam corte. | Controles passaram a 44 × 44 px; imagens usam enquadramento inteiro. Conferência visual em celular e medição no DOM. |
| P2 | Erros do checkout não estavam associados aos campos, e o foco continuava no envio. | `aria-describedby`, alertas e foco no primeiro campo inválido. O envio vazio ficou bloqueado e focou Nome completo. |
| P2 | Filtros de cor, material e característica não tinham nome acessível. | Nomes adicionados. O seletor de cor foi localizado e operado pelo nome acessível na prévia. Corrigido também “1 produto” no carrinho e no botão dos filtros. |
| P2 | A aba de fornecedores ficava inteiramente vazia na prévia. | Reutiliza o painel de precificação existente com dados demonstrativos e rascunhos salvos. Teste separou um fornecedor de teste dos itens sem fornecedor e conferiu o atalho ao cadastro. O fornecedor de teste foi restaurado ao cadastro-base depois. |
| P2 | Data editorial preenchida podia desaparecer ao sair do campo, impedindo salvar a revisão. | Tratamento do evento de entrada alinhado ao editor de ajuda. A data foi mantida e o conteúdo salvo. |
| P2 | A prévia não montava o componente de notificações. | Notificações de adicionar/remover/salvar ficam disponíveis. Mensagens de adição foram observadas no carrinho. |

## Cobertura funcional executada

| Área | Exercício e resultado |
|---|---|
| Cabeçalho e menu | Menu mobile, expansão de Sofás, entrada na categoria e fechamento do drawer. Busca “Cristal” levou a dois resultados; URLs e compartilhamento preservam o contexto da busca. |
| Categorias | Poltronas, Sofás, Sala, Painéis e racks, Quartos e Cozinha abertas; acesso ao catálogo completo conferido. |
| Busca e filtros | Ordenação crescente conferida pelos 13 preços; cor Marrom deixou o Sofá Roma; limite de largura produziu estado vazio; faixa de preço invertida exibiu alerta. Remoção/limpeza e estados da URL foram conferidos. |
| Produtos | Os 13 produtos elegíveis abriram com título, imagem e compra. Os quatro registros pendentes da amostra não aparecem na listagem pública. |
| Galeria | Oito seletores do Sofá Roma operados; todas as oito fotos carregaram. Anterior/próxima, ampliação, navegação ampliada e fechamento por Escape foram exercitados. |
| Pagamento | Roma: Pix/dinheiro R$ 1.999,00; cartão **10x R$ 227,50**, total R$ 2.275,00. Esses valores foram preservados. Para duas unidades: Pix R$ 3.998,00; cartão 10x R$ 455,00, total R$ 4.550,00. |
| Compre junto | Associação temporária no painel para Roma + Jamile + New Odin apareceu na página. Seleção totalizou R$ 2.723,00 e adicionou três móveis ao carrinho. Isso comprova o fluxo da amostra, não uma associação publicada. |
| Carrinho | Adicionar, aumentar, diminuir, remover, recarregar e sincronizar entre duas abas. Ao final, os três itens de teste foram removidos; carrinho vazio e conclusão desabilitada confirmados. |
| Checkout | Nome, rua e bairro obrigatórios; mensagens, foco e seleção do cartão conferidos. Não foi realizado envio válido para WhatsApp. |
| Banners | Criar, editar texto/destino, ativar, salvar, revisar e aplicar na cópia local. Com dois banners: pontos, anterior/próximo, pausa e retomada disponíveis. Imagem do produto inteira na composição mobile. |
| Black Friday | Quatro produtos da seleção demonstrativa, links, preços e aviso de prévia conferidos. Nenhum desconto ou campanha foi aplicado à loja real. |
| Ajuda e editorial | Estado vazio; artigo temporário revisado; busca por termo e tema; página do artigo, produto relacionado, data e URL de compartilhamento; busca da ajuda e FAQ sobre operação online. |
| Painel | As 12 áreas foram abertas: início, produtos, fornecedores, coletas, navegação, vitrines, banners, conteúdo, campanhas, atendimento, histórico e evolução. As oito seções do editor de produto foram percorridas. |
| Falhas e recuperação | Simulação de consulta indisponível mostrou contagens não confirmadas, sem presumir zero. “Tentar novamente” recuperou a amostra. Catálogo vazio exibiu zero com orientação para cadastrar. |
| Histórico | Restauração de revisão compatível criou novo rascunho preservando histórico. Revisão antiga com fonte de catálogo diferente foi recusada, sem sobrescrever a aplicada. |

A fila de coletas na prévia é uma demonstração de destino; importação real e gravação do catálogo exigem o painel integrado. Os editores locais e seus estados não comprovam operações remotas.

## UX, imagens e responsividade

- Início, Sofás e produto foram conferidos a **360, 768, 1024 e 1440 px**, total de 12 combinações registradas. Os fluxos mobile também foram operados a 390 px.
- As 12 áreas administrativas foram abertas a 360 px sem largura de documento superior à viewport ou tela de erro.
- Capturas mostram alinhamento da logo e do conteúdo, imagens inteiras na galeria/carrinho, três ambientes na home e Black Friday. Os controles de compra mobile compartilham o mesmo carrinho e cálculo.
- Não houve imagem visível quebrada nas verificações registradas. O item administrativo sem foto da amostra apresenta fallback e pendência, sem ser tratado como foto válida.
- Conferência do grupo de qualidade da engenharia reversa: acessibilidade, carregamento, responsividade e reaproveitamento dos componentes. A ausência de overflow foi usada como um dos sinais, acompanhada por inspeção das capturas e interação.

## Validação técnica

| Verificação | Resultado |
|---|---|
| Todos os testes `tests/*.test.mjs` | **139 passaram, 0 falharam, 0 ignorados.** |
| `npm run test:payment` | 4 passaram; comando foi corrigido para apontar aos testes existentes de cotação e variantes públicas. |
| `npx tsc --noEmit --pretty false` | Passou, sem erros, no escopo do `tsconfig.json` do projeto (`src` e configurações principais). |
| ESLint nos arquivos envolvidos | 0 erros; dois avisos de exportação para Fast Refresh no contexto de carrinho. |
| Build completo | Passou, incluindo compilação do cliente e servidor. |
| Build com prévia aberta | Passou; servidor e páginas continuaram disponíveis depois de excluir os diretórios gerados do monitoramento. |
| Console da aba final nova | Nenhum erro capturado. |

Na primeira execução, oito testes falharam: sete expectativas antigas (cópia operacional, campos estruturados e inclusão da Black Friday) e uma restrição de renomeação de arquivos temporários no sandbox. As expectativas foram alinhadas ao contrato atual, mantendo a regra de **não inferir material, cor, característica ou dimensão confirmada a partir de texto de marketing**. O teste de armazenamento passou fora dessa restrição, e a execução final de todos os 139 testes também passou.

O lint global do repositório tem divergências preexistentes de formatação e avisos em arquivos de trabalho anteriores. Não foi feita uma reformatação geral do projeto nem declarada aprovação do lint global.

## Documentos e rastreabilidade

Reabertos antes da implementação e na conferência de entrega:

- `AGENTS.md` aplicável e `DEPLOYMENT.md`.
- `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md`, versão **1.1**, em `C:/Users/rafap/OneDrive/Área de Trabalho/LOJA MOBI/.md/`.
- `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md`, versão **0.2**, no mesmo diretório.
- Conferências locais de PM-01 a PM-10 e da home/produto.

A MadeiraMadeira ao vivo foi reaberta para conferir a home mobile, a hierarquia de ofertas/banners, o WhatsApp e os destinos de ajuda. Não foram transferidos ofertas, lojas físicas ou condições comerciais da concorrente. A Mobi continua adaptada à identidade própria e ao atendimento online.

| Requisito/fonte | Arquivos principais | Evidência | Pendência/limite |
|---|---|---|---|
| MM-QUALITY-01, PM-04/06 | `CartDrawer`, `StoreCatalog`, `Header` | Toque 44 px, nomes acessíveis, foco e alertas | Leitor de tela e dispositivo físico não homologados. |
| MM-QUALITY-02, PM-03 | `CartDrawer`, `HeroCarouselView`, `BannerSlide` | Fotos, oito imagens da galeria e carrossel | Servidores externos de imagem e arte final de campanha continuam dependências. |
| MM-QUALITY-03 | Componentes públicos e painel | Capturas, 12 combinações públicas e 12 áreas mobile | Não substitui teste em iPhone/Android reais ou todas as orientações. |
| PM-07, MM-QUALITY-06 | `OperationsPanels`, views compartilhadas e rotas | Preservação de conteúdo, busca, artigo e FAQ | Textos comerciais precisam de revisão/aprovação para publicação. |
| PM-03/05/10 | `AdminStudio`, `HomeConnectionPanel`, preview local | Rascunho → revisão → aplicação local; restauração e conflito | Persistência/aplicação remota e campanha real não homologadas. |
| PM-04, MM-QUALITY-06 | `SupplierPricingPanel`, contexto do carrinho | Grupos por fornecedor, cotação preservada e sincronização | Fornecedores/custos reais não foram importados ou verificados. |
| MM-QUALITY-05 | Rotas, SEO e testes existentes | Tipos, build e testes de metadados | Não houve validação de crawler ou atualização do site publicado. |

**Divergências documentais:** os estados “não iniciado/não verificado” da pesquisa de 06/11 descrevem a data da pesquisa, não o estado atual. “Descubra algo novo” permanece como ID histórico de configuração, desativado; não deve ser reativado por uma expectativa antiga de teste. Planejamento de CMS remoto, usuários e campanhas não foi convertido em declaração de integração pronta.

## Pendências e limites para a próxima etapa

1. Homologar integração remota: autenticação e permissões, persistência, auditoria individual, aplicação e reversão no ambiente de migração. Não foram usadas credenciais nem escritas no banco real nesta auditoria.
2. Revisar dados reais de fornecedor, custo, atributos, dimensões e imagens. Ausência de dado não foi preenchida por suposição. A amostra não mede a qualidade do catálogo real.
3. Aprovar conteúdo comercial e campanha/arte final de Black Friday. Os artigos e páginas não revisados ficam fora do conteúdo público aplicado; os testes temporários de ajuda/editorial não foram publicados.
4. Confirmar em celular real o compartilhamento nativo/cópia e a abertura do WhatsApp. Foram conferidos destinos e mensagens geradas; o compartilhamento nativo não teve confirmação observável no navegador de teste, e não foi enviado pedido real.
5. Verificar permissões de sessão, importação, uploads remotos, falha real de rede, desempenho e analytics no ambiente integrado. Paginação acima de 24 itens tem cobertura de lógica, mas não foi percorrida na UI da amostra com 13 produtos.
6. Homologação de acessibilidade com leitor de tela e de desempenho em rede/dispositivo reais. Não foi gerada pontuação Lighthouse nem alegada conformidade integral.

## Evidências e reversão

Os arquivos de evidência estão em `artifacts/audit-2026-11-12/`:

- `browser-checks.json`: registros funcionais, responsividade, painel mobile e fotos. Inclui observações anteriores às correções; o resultado final está descrito neste relatório.
- `tests-final.log`, `types-final.log`, `eslint-changed.json`, `eslint-preview-config.json`, `eslint-supplier-final.json`, `payment.log`, `build-final.log`, `build-with-preview.log`.
- `home-mobile.jpg`, `home-desktop.jpg`, `black-friday-mobile.jpg`, `produto-desktop.jpg`, `carrinho-mobile.jpg`.
- `home-after-workflow.json` e `home-after-content.json`: cópias demonstrativas das revisões temporárias do teste.
- `manifest-sha256.json`: hashes dos arquivos envolvidos nesta entrega local.

Para reverter, revisar e desfazer somente as alterações desta auditoria nos arquivos do manifesto, preservando as alterações anteriores do projeto. A cópia de dados e a origem de navegador da auditoria são independentes. Não usar reset global, apagar rascunhos da porta 5196 ou promover produção para testar.

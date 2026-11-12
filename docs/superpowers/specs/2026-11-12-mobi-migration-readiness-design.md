# Mobi — desenho de prontidão para migração

**Data:** 12/11/2026

**Estado:** desenho aprovado por Rafael em 12/11/2026. Execução local iniciada em 12/11/2026: contratos puros de persistência e resolução exata de fornecedor implementados e verificados. Integração remota, alteração de schema/dados e publicação continuam pendentes; nenhuma escrita remota foi feita.
**Escopo:** preparar o painel e a loja para sair de rascunhos locais e operar com persistência remota, sem duplicar o catálogo e sem publicar antes da aprovação da versão.

## 1. Objetivo e critérios de sucesso

Conectar as configurações que o painel realmente edita à loja Mobi, preservar os dados existentes e tornar a migração verificável e reversível. A mudança precisa manter separados rascunho, revisão, prévia e configuração publicada.

O trabalho estará pronto para apresentar quando:

- o painel persistir rascunhos e histórico fora do navegador;
- a prévia usar o mesmo renderer e os mesmos dados da loja, com conteúdo ainda não publicado isolado;
- revisão e aplicação verificarem a versão-base e não sobrescreverem mudanças concorrentes;
- a página pública consumir somente configuração aplicada e dados públicos do catálogo;
- dados de custo, fornecedor e credenciais permanecerem no servidor/administração;
- migrações de fornecedor preservarem campos e valores legados até a reconciliação ser comprovada;
- os fluxos críticos forem conferidos em ambiente de teste e a versão final for apresentada em desktop e celular.

## 2. Fontes e decisões que orientam o desenho

- `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md`, v0.2: especialmente seções 8–10 sobre dados, autorização, conflito de `baseVersion`, publicação atômica e validação.
- `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md`, v1.1: `MM-CMS-01`–`MM-CMS-08`, `MM-QUALITY-06`–`MM-QUALITY-08` e fichas das páginas relacionadas. A referência descreve necessidades e evidências, não funções já existentes na Mobi.
- `AGENTS.md` e `DEPLOYMENT.md`: desenvolver em isolamento, validar a prévia, preservar preço/parcelamento e aguardar aprovação explícita da versão antes de produção.
- `docs/PM01_PM10_CONFERENCIA_DOCUMENTAL.md`: distingue os dez módulos locais de integração remota já funcional.
- `docs/PM04_FORNECEDORES_PRECIFICACAO_PREPARO_MIGRACAO.md`: manter fornecedor textual compatível durante adoção de IDs e não inferir equivalências.
- `docs/AUDITORIA_FUNCIONAL_2026-11-12.md`: registra os limites da prévia e a falta de persistência remota.

Decisões já confirmadas: a Mobi vende e atende online, não possui loja física; não se deve duplicar o catálogo; preço em 10x deve continuar exato; a publicação depende da aprovação da versão apresentada.

## 3. Estado técnico confirmado e limites

1. `src/lib/home-local.functions.ts` só ativa o armazenamento local quando `MOBI_LOCAL_HOME=1` e fora de produção/Vercel. `src/lib/home-local-store.server.ts` grava revisões em JSON no disco local; o próprio arquivo declara que não é banco persistente da Vercel.
2. O estúdio do painel mantém rascunhos e revisões no navegador. A home pública atual não lê esses rascunhos.
3. `src/lib/admin.functions.ts` já tem operações administrativas para catálogo e módulos existentes. Elas validam a senha no servidor e acessam Supabase pelo cliente server-only com `SUPABASE_SERVICE_ROLE_KEY`. Esse cliente ignora RLS; a chave não pode chegar ao navegador e cada operação precisa manter verificação server-side.
4. Produto continua na tabela `produtos`; fornecedor é texto. A importação usa `scraped_products`. O painel já agrupa fornecedores por nome, mas não existe relacionamento confirmado por UUID.
5. O inventário remoto de 12/11 confirmou `produto_preco_historico`, sete colunas, uma chave estrangeira de produto e 1.510 linhas agregadas. A relação não aparece nos tipos locais; não alterar tipos ou preços antes de alinhar o fluxo oficial de geração.
6. `supabase/migrations/20261110190000_add_product_bundle_ids.sql` existe no repositório, mas o painel não mostrou a migration e `produtos.compre_junto_ids` não existe no schema remoto observado. Os tipos e `admin.functions.ts` locais já usam esse campo, então publicar o código atual antes de resolver a divergência pode quebrar operações de catálogo.
7. O projeto alvo foi identificado como `mobi-loja`, ref `xzgafeqifikqrxrjaueb`, pelo registro de entrega Mobi, `docs/supabase-catalog-access.md` e painel autenticado. O `supabase/config.toml` estava em `ehdxfbutcsqnunxlvval` e foi alinhado localmente para `xzgafeqifikqrxrjaueb`. O inventário de migrations, tabelas/colunas, constraints/índices, RLS/grants, funções/triggers e Storage está em `docs/supabase-migration-inventory.md`; não houve escrita remota.
8. O projeto Supabase aberto não mostrou branches nem backups e não há destino descartável confirmado. A ferramenta Supabase MCP e a CLI não estavam disponíveis. Por isso, DDL, backfill e integração remota continuam bloqueados até haver ambiente de teste e plano de reversão.
9. A consulta agregada de 12/11 encontrou 2.233 produtos; essa é uma observação da sessão, não valor para fixar no código.

## 4. Abordagens consideradas

### A. Acrescentar campos diretamente a cada tabela existente

Menos camadas inicialmente, mas mistura rascunho e conteúdo publicado, dificulta histórico e revisão e pode deixar um salvamento parcial entre módulos.

### B. Copiar todo o painel e catálogo para uma nova estrutura genérica

Facilita manter um snapshot, mas duplica produtos/preços, cria fontes de verdade concorrentes e amplia o risco de divergência.

### C. Persistir revisões do painel e adaptar os consumidores existentes — recomendada

Armazenar versões de configuração e o estado publicado com controle transacional; manter produtos, preços e tabelas de domínio existentes como fonte de verdade; adicionar adaptadores somente onde o renderer público ainda não consome uma configuração suportada. Os nomes/tabelas finais serão escolhidos após o inventário somente de leitura, sem assumir que são necessárias sete tabelas.

## 5. Arquitetura proposta

### 5.1 Rascunhos, revisão e publicação

- Um contrato versionado contém configurações do painel, estado de revisão, versão-base e metadados de autoria/auditoria. Rascunhos PM-04 podem conter somente os deltas de produto editados — inclusive custo e custo de variação — em armazenamento administrativo protegido. Não contém cópia integral do catálogo.
- Revisões aprovadas são imutáveis. Restaurar cria nova revisão; nunca apaga o histórico.
- Uma operação de revisão/aplicação compara `baseVersion` com o estado atual. Versão obsoleta retorna conflito claro, mantendo ambas as revisões.
- A troca da referência publicada e a gravação de histórico são atômicas no banco. Falha conserva a publicação anterior e o rascunho.
- O inventário remoto determina se o contrato cabe em tabela existente ou requer a menor estrutura nova possível. O documento do painel define entidades conceituais; não obriga sete tabelas.

### 5.2 Segurança e acesso

- Leituras/escritas administrativas passam por funções server-side e validação administrativa antes de usar o cliente privilegiado.
- Chaves privilegiadas ficam exclusivamente no servidor. Nenhum segredo, custo ou identidade interna de fornecedor entra no bundle ou resposta pública.
- Novas tabelas/objetos não concedem escrita a `anon`/visitante. RLS e grants serão definidos e conferidos para o ambiente real; o uso de service role não será tratado como proteção por RLS.
- A primeira etapa preserva o modo de acesso individual existente. Papéis e contas separadas para equipe ficam fora do corte inicial, conforme PM-10, mas autoria individual não será alegada enquanto não existir autenticação individual.

### 5.3 Loja pública e prévia

- A prévia local seleciona uma revisão de teste e chama os componentes/renderers reais; não altera o ponteiro publicado.
- A loja pública recebe somente a versão aplicada e os campos públicos necessários, usando uma projeção com allowlist. Deltas PM-04, `preco_atacado`, custos de variação e identidade de fornecedor nunca entram nessa resposta.
- Produtos seguem sendo lidos da fonte atual. A configuração pode selecionar IDs de produtos válidos e guardar deltas administrativos explícitos, mas não replica o catálogo como nova fonte.
- Configurações ainda sem consumidor público funcional continuam marcadas como pendentes; salvar seu JSON não será apresentado como integração concluída.
- O primeiro corte abrange todos os fluxos já funcionais que têm consumidor real na Mobi. Itens apenas planejados permanecem fora da publicação até serem implementados e conectados de ponta a ponta.
- Para banners/mídia, o inventário identifica buckets e políticas existentes. Upload ou nova biblioteca só é incluído se necessário e com política de acesso revisada; URL digitada não será chamada de upload integrado.

### 5.4 Fornecedores e preços

- Criar UUID de fornecedor e referências anuláveis em `produtos` e `scraped_products` somente após conferir o schema real.
- Preservar `fornecedor`/`supplier`, custos, URLs de origem, variantes e histórico durante a transição.
- Backfill somente para correspondência textual exata aprovada; variações de acento, caixa, abreviação ou grafia permanecem pendentes até revisão.
- Atualizar importação e painel para IDs depois da reconciliação; manter leitura dos campos legados enquanto o corte é acompanhado.
- Conversão para centavos inteiros é migração comercial separada e não faz parte desta etapa.

## 6. Etapas e entregáveis

| Etapa                                 | Entregável                                                                                                              | Regra de conclusão                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 0 — Inventário remoto                 | Relatório somente de leitura de projeto, tabelas/colunas, migrations, RPCs, policies/RLS, buckets e contagens agregadas | Projeto alvo confirmado; diferenças entre tipos locais e schema registradas; nenhuma escrita.    |
| 1 — Contrato e persistência do painel | Adaptador server-side, revisões persistentes, controle de base, revisão e ponteiro aplicado                             | Rascunho sobrevive a sessão; conflito não sobrescreve; visitante só lê publicação.               |
| 2 — Consumidores e prévia             | Conectar apenas campos com editor, renderer e consumidor real; revisar mídias necessárias                               | A mesma configuração é visível na prévia e, após aplicação de teste, no consumidor isolado.      |
| 3 — Fornecedores                      | Migration compatível, mapa de correspondência, backfill em teste e tipos/leituras atualizados                           | Contagens, nulos, IDs, custos, fontes e importação conciliados; campos textuais preservados.     |
| 4 — Homologação                       | Casos de acesso público/admin, revisão, conflito, publicação, rollback, catálogo, WhatsApp e telas                      | Evidências de ambiente de teste, desktop e celular; preços/10x comparados quando tocados.        |
| 5 — Aprovação de produção             | Apresentação da versão/commit exatos, plano de corte e reversão                                                         | Rafael aprova explicitamente a versão antes de qualquer escrita/migração/publicação em produção. |

Se o acesso remoto continuar indisponível, as etapas locais de contrato, adaptador e teste não usam dados de produção; inventário e migração de banco ficam bloqueados até existir acesso ao projeto correto.

## 7. Reversão e tratamento de falha

- O corte mantém campos legados e registros de versão; não executa `DROP COLUMN` nesta fase.
- Em caso de falha na publicação, o ponteiro ativo permanece apontando para a versão anterior; a nova revisão permanece recuperável.
- O rollback de banco será definido após conhecer operações e dependências reais. Não será presumido que toda migration tenha rollback seguro automático.
- Backups/exportações são feitos antes do backfill, com totais e checksums quando aplicável. Nenhuma restauração geral será usada para desfazer campanha ou edição isolada.
- Preview local e testes não reutilizam o mesmo storage/dataset da loja em uso.

## 8. Fora do escopo desta migração

- Publicação ou escrita no Supabase de produção antes da aprovação da versão exata.
- Criar loja física, showroom, retirada, estoque ou regras de entrega não confirmadas.
- Criar novo app/painel separado ou duplicar catálogo no CMS.
- Reescrever histórico comercial, arredondar parcelas, converter preços para centavos ou remover colunas antigas.
- Criar papéis/contas individuais, automações ou integrações externas sem requisito confirmado.
- Marcar como implementados os requisitos MM que continuam apenas planejados ou sem consumidor.

## 9. Matriz de rastreabilidade inicial

| Necessidade                                           | Fonte                                   | Evidência atual                                                            | Pendência                                                                           |
| ----------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Adaptar à Mobi e não copiar a concorrente             | Engenharia reversa §0; painel §0        | Regra registrada no `AGENTS.md`                                            | Aplicar ao conteúdo/renderer novo.                                                  |
| Rascunho separado do publicado e revisão com conflito | Painel §§8–10; MM-CMS-05/08, QUALITY-07 | Revisões locais existentes; painel ainda usa browser storage               | Persistência e aplicação atômica remotas.                                           |
| Configuração publicada consumida pelo visitante       | MM-CMS-02/05/06/07; MM-QUALITY-06       | Home local lê arquivo quando explicitamente habilitada                     | Conectar ao consumidor publicado por adaptador validado.                            |
| Manter catálogo e preços como fonte existente         | Painel §8; PM-04                        | `produtos`/`scraped_products` identificados no código                      | Conferir schema e todas as escritas/importações remotas.                            |
| Fornecedor por UUID sem perder nomes                  | PM-04; MM-CMS-03                        | UI agrupa texto; proposta de schema não aplicada                           | Auditoria de nomes, aprovação de mapa, migration em teste.                          |
| Privacidade de custo/fornecedor                       | AGENTS.md; PM-04                        | Mapeadores públicos ocultam esses campos; cliente privilegiado server-only | Verificar funções/tipos/policies do destino e incluir regressão.                    |
| Migração “compre junto”                               | MM-PROD-09; SQL local                   | Migration local existe; coluna e ID estão ausentes no painel remoto         | Resolver drift antes de publicar código que lê ou grava o campo.                   |
| Desktop/mobile e retorno seguro                       | AGENTS.md; QUALITY-01/03/07             | Auditoria local de 12/11                                                   | Homologar migração remota em ambiente de teste; físico permanece fora da cobertura. |

## 10. Questões dependentes do inventário

1. Qual projeto Supabase é o destino e qual versão de schema realmente está aplicada?
2. Qual é o estado de RLS, RPCs de curation/banner, policies e grants atuais?
3. Existe ambiente/branch de teste já disponível, sem custo ou impacto de produção?
4. Que tabelas e relações contêm `produto_preco_historico`, variações e mídias?
5. Quais nomes de fornecedores correspondem exatamente e quem aprova os casos ambíguos?

Essas respostas não autorizam gravação em produção; definem o schema e o plano executável para revisão posterior.

## 11. Auto-revisão do desenho

- Distingue a migration local de `compre_junto_ids` da ausência confirmada no schema/histórico remoto observado.
- Registra a contagem agregada atual de 2.233 sem fixá-la no código.
- Não assume sete tabelas, não duplica catálogo e adia nomes finais até conferir o schema.
- Não usa service role como se RLS o limitasse; exige verificação explícita server-side e chaves somente no servidor.
- Permite que rascunhos PM-04 guardem deltas privados com custos, sem serializá-los na projeção pública.
- Distingue persistência de configuração de implementação dos 141 requisitos.
- Preserva custos, parcelas e campos antigos e separa IDs de fornecedores da conversão monetária.
- Mantém produção bloqueada até prévia, evidências, revisão e aprovação da versão exata.

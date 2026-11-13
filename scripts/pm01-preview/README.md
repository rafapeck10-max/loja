# Painel Mobi — prévia local PM-01 a PM-10

## Revisão em 11/11/2026

Estado vigente e precedência: [relatório consolidado](../../docs/REVISAO_HOME_PRODUTO_2026-11-11.md). A amostra tem 17 registros: 16 históricos e uma cópia dos atributos públicos do Sofá Roma observados em 11/11, com oito fotos/ficha real. Custos administrativos são sintéticos para demonstração; nenhum registro remoto foi alterado. Os relatos abaixo são históricos quando divergirem desse relatório.

Com a porta padrão ocupada: `npx vite --config scripts/pm01-preview/vite.config.ts --port 5193 --strictPort`. Home `http://127.0.0.1:5193/`; produto `/produto/sofa-roma-retratil-e-reclinavel-2-00-m-veludo-marrom`; PM-04 `/scripts/pm01-preview/index.html?area=produtos`. O endpoint aceita apenas loopback na porta realmente usada. Rascunhos PM-04 validados alimentam todos os atributos da prévia. Desktop/associação/carrinho conferidos; mobile desta rodada bloqueado pela ferramenta. Nada publicado.

A versão atual reúne os dez módulos, com rascunhos, revisão e histórico locais. A área Evolução contém os 141 requisitos e 38 fichas originais, com estados Mobi separados e exportação de pedidos. Campanhas são simulações, páginas de ajuda têm renderer local e entrega usa consulta ao WhatsApp. Persistência compartilhada, papéis e aplicação das configurações no site permanecem pendentes.

Comando e endereço permanecem: `npx vite --config scripts/pm01-preview/vite.config.ts` → http://127.0.0.1:5187/scripts/pm01-preview/index.html. A pasta conserva o nome técnico original. A amostra atual tem 16 móveis históricos, com quatro pendências inseridas para conferir estados, e usa a mesma fonte no resumo e nos editores. Não contém credenciais nem chama operações administrativas na demonstração.

Conferência atual: [PM01_PM10_CONFERENCIA_DOCUMENTAL.md](../../docs/PM01_PM10_CONFERENCIA_DOCUMENTAL.md). Chaves locais `mobi:admin-studio:v1:demo` / `:admin`, com versões e recuperação. O rascunho antigo de PM-02 pode ser aberto explicitamente, sem apagar seu arquivo anterior. Foram verificados 90 testes Node, TypeScript, lint direcionado, build e os dez módulos no navegador integrado em 360/768/1440 px. Evidências na pasta irmã `mobi-studio-evidence/`.

As seções abaixo registram as entregas anteriores; a descrição de fixtures/rotas é histórica quando divergir da versão atual. O script `verify.mjs` foi adaptado à navegação atual, mas não foi executado nesta rodada; a conferência de navegador foi pelo ambiente integrado.

## PM-02 — Páginas e vitrines

O mesmo endereço agora abre o editor PM-02. “Visão geral” continua acessível no menu. A pasta conserva o nome técnico para não quebrar o comando local.

`PagesAndShelvesPanel` edita um rascunho da home: ordem/visibilidade dos blocos internos, título e apoio das vitrines, seleção semanal de até quatro produtos e exceções das seleções automáticas. A ordem inicial e as regras vêm do código atual da Mobi. No computador largo há três colunas; tablet e celular alternam editor/prévia. A representação usa cartões reais e resume os blocos fixos.

Salvar grava apenas `mobi:pages-and-shelves:home:v1:demo` no navegador. Reabrir é explícito; bases desatualizadas são recusadas. Restaurar edição preserva o rascunho salvo até um novo salvamento. A amostra de 16 móveis contém fotos/preços históricos, não ofertas atuais. Não há credenciais, gravação no servidor ou publicação.

Conferência e pendências: [PM02_CONFERENCIA_DOCUMENTAL.md](../../docs/PM02_CONFERENCIA_DOCUMENTAL.md). O teste de navegador `verify.mjs` permanece focado no PM-01; a conferência PM-02 foi feita pelo navegador integrado, com relatório/capturas na pasta irmã `mobi-pm02-evidence/`.

## Revisão 2

O resumo e a navegação foram refeitos após a rejeição visual da primeira versão. `AdminWorkspace.tsx` agora é compartilhado pela prévia e pelo admin real: sidebar no computador, gaveta no celular, busca e ajuda. Cinco áreas operacionais são representadas; quatro fontes não integradas permanecem sem valores. Pendências incluem impacto. O feedback sobre espaços foi aplicado removendo alturas reservadas e reduzindo intervalos, sem reduzir os alvos de toque.

O teste de navegador também cobre foco da gaveta/ajuda, retorno após Escape, busca e rotação. Ver a seção 9 de `docs/PM01_CONFERENCIA_DOCUMENTAL.md` para evidências e limites atualizados. A descrição da primeira entrega abaixo permanece como histórico técnico; o estado visual atual é o da revisão 2.

Entrega local em `feature/pm01-visao-geral`, baseada na main `23c0d6749e911b6a9c91376deb71517f439c3c74`.

## Implementação

- `src/components/AdminOverview.tsx`: resumo, pendências, atalhos e origem/horário das consultas.
- `src/lib/admin-overview.ts`: contagens usando os critérios existentes e identificação das pendências.
- `src/routes/admin.tsx`: nova aba inicial, conectada às consultas administrativas e ações existentes.
- `src/lib/admin.functions.ts`: apenas substitui o limite existente de 500 registros por uma constante compartilhada; contrato e permissões preservados.
- `src/admin-overview.css`: estilos limitados ao novo componente e à navegação do painel com cinco abas.

As consultas são independentes: falha ou carregamento não vira zero. A fila de revisão mostra `500+` ao atingir o limite da consulta, sem inventar um total exato. Os critérios atuais de “Publicados” não confirmam estoque físico ou carregamento da foto.

Campanhas, rascunhos e solicitações de desenvolvimento aparecem como pendentes de integração. Preços, cálculo de parcelas, dados de catálogo, permissões e fluxo de publicação não foram alterados.

## Prévia

O harness desta pasta importa o componente real, com 12 produtos e três itens de revisão fictícios, identificados como demonstração. Não importa operações do servidor, não usa credenciais e não acessa o banco. Os destinos das ações nesta demonstração são somente leitura; no `/admin` integrado as ações abrem os editores existentes.

Comando: `npx vite --config scripts/pm01-preview/vite.config.ts`.

Endereço: http://127.0.0.1:5187/scripts/pm01-preview/index.html.

Em “Conferir estados da prévia”, revisar carregamento, falha total, falha parcial, catálogo vazio e limite da consulta.

## Validação e limites

- `node --experimental-strip-types --test tests/*.test.mjs`: suíte disponível do repositório, incluindo seis testes novos do resumo.
- `npx tsc --noEmit` e `npm run build`.
- ESLint direcionado ao componente, módulo e harness novos.
- `scripts/pm01-preview/verify.mjs`: navegador Edge via Playwright; aceita o caminho do módulo em `PLAYWRIGHT_MODULE` se não instalado no projeto. Confere contagens, navegação, revisão do item correto, estados e ausência de overflow em 360, 390, 768, 1024 e 1440 px. Registra capturas e relatório em `.output/pm01-evidence/`.

Os testes visuais usam a amostra local; o fluxo autenticado contra o banco real não foi exercitado. A integração ao painel foi conferida no código e na compilação. Não houve publicação, push ou merge.

## Aprovação e reversão

Aprovação recebida para desenvolver o desenho apresentado. Publicação da versão ainda não autorizada. Antes de publicar, conferir a fonte que atende o domínio, eventuais mudanças concorrentes e executar o preflight do repositório.

Para reverter depois de uma futura integração, reverter somente o commit desta entrega. Nenhuma migração ou restauração de dados é necessária.

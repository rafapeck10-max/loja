# PM-01 — Visão geral Mobi

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

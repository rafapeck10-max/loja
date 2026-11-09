# Painel Mobi PM-01 a PM-10 — plano de execução

Pedido de Rafael em 09/11/2026: desenvolver os dez módulos, considerando capacidades futuras da engenharia reversa. Execução local na branch `feature/pm01-pm10-painel`, partindo de `fba4c86`. A especificação fornecida v0.2 e engenharia reversa v1.1 são o briefing existente; a implementação foi solicitada expressamente. Este plano organiza essa execução, sem nova autorização de publicação.

## Restrições globais

- Identidade oficial Mobi; layout compacto, controles móveis de 44px, editor/prévia responsivos.
- Reutilizar catálogo, taxonomia, cálculo de 10x e contratos existentes. Nenhuma escrita no banco ou configuração públicos, alteração de taxa, push ou deployment.
- Acompanhamento dos 141 requisitos separado de configuração/ativação. Nenhum estado validado sem evidência; capacidades futuras geram pedido de desenvolvimento.
- Persistência local versionada por contexto, revisão com diferenças, conflito entre abas, restauração como nova revisão. Informar claramente origem e limites; não chamar versão local de publicada.
- Sem motor de cupons, frete/estoque fictício, usuários/papéis simulados ou formulários que não tenham consumidor na prévia.

## Arquitetura e contratos

`admin-studio` fornece envelope de revisão e armazenamento local. Os painéis recebem dados tipados e callbacks `onChange`, sem gravar remotamente. Registro de capacidades liga requisitos a componentes com evidência explícita. Página pública mantém comportamento padrão; a prévia local consome rascunhos através dos renderers/componentes existentes ou adaptadores isolados. Os editores autenticados de produto/importação existentes são preservados.

## Tarefas e validação

1. Base compartilhada e PM-10: revisões imutáveis, diferenças, restauração, conflitos e validação de armazenamento; testes Node antes da implementação.
2. PM-09: validar/importar manifesto completo, explorar 141 IDs/38 páginas, acompanhar estado/evidência, gerar pedido Markdown/JSON com política Mobi; testes de esquema, referências e exportação.
3. PM-05: campanhas/overrides locais, período Brasília, comparação exata de preço/10x, estados simulados e encerramento com conflitos; testes de intervalo e preservação de edição posterior.
4. PM-03: editor de mídia sobre contrato atual, formatos desktop/mobile consumidos por renderer, destino seguro, upload local limitado, composição/ativação; testes de links/arquivos/datas. Sem upload remoto.
5. PM-06/07/08: árvore de categorias e cobertura de filtros existentes, conteúdo estruturado e prévia, mensagens/WhatsApp públicos sem prometer custo ou prazo desconhecidos; testes de validação e normalização.
6. Integrar PM-01/02/04 e navegação dos dez módulos, rascunhos compartilhados sem desmontar editores, revisão/histórico, estados e recuperação. Preservar cadastro/importação reais, usar editor de amostra na demonstração.
7. Conferir fontes novamente, suíte Node, TypeScript, lint dos arquivos novos, build e navegador desktop/celular. Revisão independente do conjunto. Documentar cobertura real e dependências de produção; commit local.

## Foco da revisão

Base obsoleta entre abas; JSON local/importado inválido; preços posteriores ao override; links e conteúdo inseguros; requisito validado sem evidência; armazenamento cheio; nomes/dados longos no celular; edição não salva ao navegar. Os testes devem cobrir invariantes de dados, e a conferência de navegador os fluxos/foco/disposição.

## Progresso

- Contexto e fontes retomados; baseline PM-01/02 preservada em `fba4c86`.
- Decisão: a solicitação amplia os dez módulos do painel, não seleciona automaticamente todas as 141 funcionalidades públicas. Custo se essa leitura estiver incorreta: ampliar o escopo público em uma nova etapa com IDs explícitos.
- Tarefas 1–7 implementadas e conferidas; 90 testes, TypeScript, lint direcionado e build aprovados, com conferência dos dez módulos em 360/768/1440 px. Revisão, correções e limites registrados em `PM01_PM10_CONFERENCIA_DOCUMENTAL.md`. Entrega versionada somente em branch local; sem autorização de publicação.

# Preparação da persistência de rascunhos — 12/11/2026

Estado: interface ligada ao transporte assíncrono, backend autenticado, migration gerada pela CLI oficial e SQL executado com sucesso em PostgreSQL isolado (PGlite 0.5.4). Não aplicado no Supabase, não habilitado na Vercel e sem publicação. Este corte prepara rascunhos administrativos; aplicação de configuração pública e migração relacional de fornecedores continuam etapas distintas.

## Arquivos e contrato

- `src/lib/admin-studio-remote.ts`: transporte do navegador para funções administrativas, sem chave privilegiada.
- `src/lib/admin.functions.ts`: endpoints POST `readAdminStudioWorkspace` e `changeAdminStudioWorkspace`, ambos verificam a senha administrativa antes de carregar armazenamento privilegiado.
- `src/lib/admin-studio-store.server.ts`: ligação com o cliente Supabase já existente, habilitada apenas com `MOBI_REMOTE_STUDIO=1` no servidor.
- `src/lib/admin-studio-supabase.ts`: chamadas RPC, validação das respostas e falhas explícitas; ausência de instalação não vira rascunho vazio.
- `src/lib/admin-studio-repository.ts`: criação de revisões, revisão, restauração e recuperação com comparação atômica de versão; recuperação só aceita fontes obtidas pelo servidor.
- `src/lib/admin-studio-sources.server.ts`: reconstrói a fonte atual usando catálogo/banners administrativos e padrões de conteúdo do código; não aceita a fonte de recuperação enviada pelo navegador.
- `supabase/migrations/20261112161958_add_mobi_studio_workspace.sql`: arquivo criado pela CLI oficial 3.1.0 e preenchido com o SQL validado. Uma tabela privada de workspace/histórico e duas RPCs com privilégios de invocador; acesso apenas por `service_role`. Não duplica catálogo nem modifica preços. O candidato anterior em `docs/sql` é registro da preparação.
- `AdminStudio.tsx` e `/admin`: consultam o modo no servidor e usam operações assíncronas quando habilitado. Salvamento só mostra sucesso após confirmação; erros preservam a edição e oferecem reabertura/exportação. Importar cópia local abre comparação antes do salvamento explícito. Nenhum rascunho local é apagado.

A versão lida precisa coincidir no momento do UPDATE. Uma segunda gravação concorrente retorna conflito e preserva a edição do operador. Restauração produz nova revisão. O modo individual atual identifica a autorização administrativa; não alega autoria por pessoa.

## Ativação executável após validação isolada

1. Confirmar o alvo `mobi-loja` (`xzgafeqifikqrxrjaueb`), executar o inventário somente leitura em `scripts/mobi-migration-preflight.sql` e reconciliar migrations já aplicadas. Não executar `db push` indiscriminadamente: há SQL legado divergente.
2. Obter backup verificável antes de qualquer alteração em produção. Validar o SQL candidato num banco exclusivo da loja, com papéis Supabase equivalentes. O projeto CRM não é destino deste trabalho.
3. Conferir que `anon` e `authenticated` não podem ler a tabela nem executar RPCs; `service_role` pode ler e comparar/gravar. Testar duas gravações sobre a mesma versão: uma deve retornar true e outra false. Conferir limite do JSON e preservação do histórico.
4. A migration já foi gerada e validada isoladamente. Aplicá-la primeiro ao destino de teste confirmado, conferir advisors e sincronizar tipos a partir do destino; nunca marcar migrations antigas como aplicadas sem reconciliar seu conteúdo.
5. Em ambiente isolado, habilitar a variável de servidor `MOBI_REMOTE_STUDIO=1`. A interface consulta o modo autenticado e passa a usar o transporte remoto. Se a consulta do modo falhar, bloqueia a abertura dos editores e oferece nova tentativa; não muda silenciosamente para armazenamento local.
6. A importação usa `inspectLocalWorkspaceImport` e `createExplicitStudioImportCommand`; cada área é importada explicitamente sobre a versão remota conferida. Nunca limpar o armazenamento local após falha ou conflito.
7. Homologar celular/computador e apresentar a prévia/commit para aprovação da versão. Habilitar produção somente depois da revisão completa do fluxo. Salvar rascunho não aplica conteúdo na loja.

## Reversão

Desabilitar `MOBI_REMOTE_STUDIO`, voltar ao deployment anterior e preservar a tabela e seus registros para recuperação. Exportar rascunhos antes da troca de modo. Não apagar tabela, histórico, catálogo ou conteúdo local como forma de reverter.

## Conferência documental

Painel v0.2 §§8–10: autorização server-side, rascunho separado do publicado, conflito de base e falha explícita. Engenharia reversa v1.1, MM-CMS-08: restauração acrescenta registro e não apaga evidência. Os dois originais foram reabertos no OneDrive nesta etapa.

## Evidências desta etapa

- 30 testes de contrato/persistência/fornecedor/complementos passaram.
- `tests/studio-sql-integration.mjs` executou a migration real no PostgreSQL temporário: acesso de anon/authenticated negado na tabela e RPCs; service role lê e grava; duas gravações concorrentes produzem apenas um sucesso; revisão e restauração preservam três versões; JSON incompleto é rejeitado; service role não pode apagar o histórico por DELETE.
- O navegador conferiu a interface com o fixture assíncrono em memória: Atendimento → editar região → salvar versão 1 → comparar diferenças → revisar versão 2 → restaurar versão 1 como versão 3. Isso prova o comportamento da interface com promessas; o teste SQL separado cobre armazenamento/RPC.
- Fixture disponível somente na prévia local: `?view=remote-drafts&area=service`. Identificado como dados em memória, sem conexão Supabase. Não representa uma prévia hospedada da versão nem persistência após recarregar a página.

Pendente para ativação real: backup verificável, aplicação da migration no destino confirmado, advisors/permissões desse destino e habilitação na Vercel. O consumo da configuração aplicada pela loja permanece fora deste corte de rascunhos.

Referência técnica: [RLS e privilégios Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

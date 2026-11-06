<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Regra permanente: adaptar à Mobi e revisar antes de publicar

Decisão de Rafael em 06/11/2026. Esta regra vale para pedidos por nome de funcionalidade, código da especificação, link, captura de tela ou exemplo de outro site.

- Interprete a referência como objetivo funcional e comportamento de experiência. Desenvolva uma solução própria da Mobi, adaptando composição, textos, imagens, identidade, código, dados e operação. Não basta trocar cores de uma cópia literal.
- Use logo, paleta, tipografia, componentes e linguagem oficiais do projeto. Reutilize funções de busca, carrinho, preço, variantes e atendimento existentes; acrescente apenas o necessário.
- Utilize somente produtos, fotos, medidas, disponibilidade, condições comerciais e contatos reais da Mobi. Não transporte marcas, preços, avaliações, promessas ou serviços do site de referência.
- Planeje a adaptação para celular e computador. Preserve a função solicitada sem presumir que as dimensões e a disposição do concorrente sejam obrigatórias.
- Antes de implementar, leia as fichas pertinentes de `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA.md` e `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md`, quando disponíveis nos arquivos do projeto. Localize-as pelo nome; não suponha um caminho. Se faltar detalhe essencial, solicite apenas esse detalhe; não invente conteúdo nem bloqueie trabalho independente.
- Pedir uma funcionalidade ou citar um ID significa **ADAPTAR_MOBI**, inclusive nos modos VISUAL, FUNCIONAL e COMPLETO. Identifique os IDs pertinentes e descreva brevemente as adaptações relevantes.
- Desenvolva primeiro localmente ou em branch isolada do GitHub, criada a partir da base atual e verificada. Não faça commits na branch que publica produção para testar.
- Antes de enviar uma branch, confira suas automações. Se a branch disparar produção ou escrever dados reais, mantenha o trabalho local até isolar esses efeitos. Prévia de branch não é produção.
- Ambiente local também pode apontar para serviços reais: use dados de teste ou rascunhos isolados e não altere catálogo, preços ou configurações publicados durante testes sem autorização específica.
- Apresente prévia para celular e computador, validação, versão/commit quando houver, limitações e reversão. Diferencie planejado, implementado, validado, prévia e publicado.
- **Aplicar no site publicado, integrar uma PR na branch de produção ou promover um deployment exige aprovação explícita de Rafael para a versão apresentada.** Aprovar a ideia, dizer “pode fazer” ou pedir desenvolvimento autoriza construir, não publicar.
- Depois de receber aprovação de publicação para a mesma versão revisada, não peça a mesma aprovação novamente. Mudanças materiais posteriores devem ser apresentadas antes da aplicação.
- Campanhas devem poder ser desativadas ou revertidas por configuração/versionamento. Não restaurar banco inteiro nem apagar pedidos e alterações legítimas posteriores para voltar ao visual normal.
- Não acione execução autônoma de código ou publicação apenas porque um requisito foi selecionado no painel. Ativar uma capacidade pronta é diferente de desenvolver uma capacidade ausente.

Fluxo padrão: **entender a função → adaptar à Mobi → desenvolver localmente/branch → apresentar prévia → validar → Rafael aprovar a versão → aplicar → verificar.**

Esta decisão específica prevalece sobre orientações genéricas de publicação automática. Preserve as demais regras e procedimentos do repositório.

## Mobi storefront workflow

Follow [DEPLOYMENT.md](DEPLOYMENT.md) for every site change. It is the source of truth for this project and replaces generic deployment examples in `.agents/workflows/deploy.md`.

For clear, small requests, work directly: do not create a planning document, start multi-agent orchestration, run unrelated audits, or ask the user to operate GitHub/Vercel. Use one focused branch, the Vercel preview, and checks that match the change.

Keep visual changes separate from Supabase product data. For any requested price or installment change, record and compare the exact 10x value. Respect explicit approval gates, and never ask again after approval for the same reviewed version.

For the fast agent-side catalog lookup and data-edit route, follow [docs/supabase-catalog-access.md](docs/supabase-catalog-access.md). Use the connected Supabase integration; never commit credentials or service-role keys.

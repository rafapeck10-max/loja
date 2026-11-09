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

## Mobi storefront workflow

Follow [DEPLOYMENT.md](DEPLOYMENT.md) for every site change. It is the source of truth for this project and replaces generic deployment examples in `.agents/workflows/deploy.md`.

For clear, small requests, work directly: do not create a planning document, start multi-agent orchestration, run unrelated audits, or ask the user to operate GitHub/Vercel. Use one focused branch, the Vercel preview, and checks that match the change.

Keep visual changes separate from Supabase product data. For any requested price or installment change, record and compare the exact 10x value. Respect explicit approval gates, and never ask again after approval for the same reviewed version.

For the fast agent-side catalog lookup and data-edit route, follow [docs/supabase-catalog-access.md](docs/supabase-catalog-access.md). Use the connected Supabase integration; never commit credentials or service-role keys.

## Mobi — conferência documental antes de entregar

Decisão de Rafael em 09/11/2026: sempre retomar os documentos e conferir os detalhes antes de entregar uma etapa. A primeira prévia PM-01 foi rejeitada; não tratá-la como design homologado.

- Antes de implementar e novamente antes de entregar, reabrir `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md` e `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md` (nome canônico no texto: `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA.md`). Na máquina de origem estão em `C:/Users/rafap/OneDrive/Área de Trabalho/LOJA MOBI/.md/`. Em outro ambiente, localizar os anexos equivalentes. Se indisponíveis, declarar a lacuna; não alegar leitura.
- Conferir versão, módulo, IDs relacionados, dependências e aceite; manter uma matriz requisito → fonte → arquivo → evidência → pendência. Para PM-01, retomar [a conferência detalhada](docs/PM01_CONFERENCIA_DOCUMENTAL.md).
- Os originais prevalecem sobre resumos. A cópia do manifesto em `docs/referencias/` é referência versionada, não fonte de status real ou seleção de trabalho.
- Conferir separadamente aderência documental, aparência desktop/mobile e funcionamento. Compilação, testes e ausência de overflow não provam qualidade visual ou conformidade total.
- Rafael apontou excesso de vazios na prévia em 09/11/2026. Manter composição compacta: não reservar altura para linhas de texto ausentes, reduzir margens acumuladas entre título/subtítulo e ajustar cartões ao conteúdo. Preservar legibilidade e controles com toque de pelo menos 44 px; não interpretar compactação como fonte minúscula.
- Na mesma data Rafael reforçou: evitar aparência genérica, preservar a identidade da loja e pesquisar técnicas de UX/design. Priorizar a tarefa da Mobi (móveis, preço, imagem, fornecedor, curadoria) e os ativos oficiais. Não dar a módulos indisponíveis o mesmo peso de ações utilizáveis; mostrar limitações sem grandes cartões vazios e revelar explicações secundárias por expansão.
- Não confundir proposta com implementação, amostra com integração real, evidência da concorrente com status Mobi, nem URL de imagem com foto carregada.
- Adaptar à identidade e à operação Mobi. Desenvolver localmente ou em branch isolada; usar rascunhos/dados de teste; apresentar versão, prévia, validação, limites e reversão.
- Não publicar, promover deployment ou integrar em branch que publica produção sem Rafael aprovar explicitamente a versão apresentada. Aprovação anterior para a mesma versão não precisa ser repetida.

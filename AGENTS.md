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

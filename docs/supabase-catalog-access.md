# Acesso ao catálogo no Supabase

Este procedimento documenta o caminho administrativo usado pelo agente para consultar ou editar dados do catálogo. Ele usa a integração Supabase já conectada, sem depender do site, da interface da loja ou de credenciais no repositório.

## Projeto e ferramenta

- Projeto Supabase: `mobi-loja`
- Project ref: `xzgafeqifikqrxrjaueb`
- Ferramenta de consulta: Supabase MCP `supabase_execute_sql`, passando o project ref como `project_id`
- Tabela do catálogo: `public.produtos`

Exemplo de consulta focada por SKU:

```sql
SELECT sku, nome, fornecedor, preco_atual, preco_atacado,
       fonte_preco, custo_status, custo_conferido_em
FROM public.produtos
WHERE sku = 'SKU_EXATO';
```

Selecione somente os campos necessários e prefira buscar pelo SKU ou ID exato. Para consultar preços de fornecedor, confira também `fonte_preco`, `custo_status` e `custo_conferido_em`; `preco_atacado` é o valor de atacado registrado no catálogo e pode precisar de confirmação recente.

## Edições

- Siga as aprovações de catálogo e preço definidas em [DEPLOYMENT.md](../DEPLOYMENT.md).
- Leia o registro atual antes de editar e mostre os valores antes/depois para alterações comerciais.
- Atualize somente os registros e campos aprovados. Use ID ou SKU exato e, quando possível, condicione o UPDATE ao valor anterior para evitar sobrescrever uma alteração concorrente.
- Depois da gravação, consulte os registros novamente e confira os valores finais.
- Alterações apenas de dados do catálogo não exigem novo deploy da Vercel. Mudanças no código da loja seguem o fluxo de deploy do projeto.

## Credenciais

O acesso do agente é fornecido pela integração conectada ao Supabase. Não adicione senhas, connection strings, tokens ou chaves `service_role` ao repositório.

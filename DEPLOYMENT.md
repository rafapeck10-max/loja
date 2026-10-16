# Publicações da loja

O código da interface deve ficar versionado neste repositório. Os dados de produtos, imagens e preços são mantidos no Supabase e seguem o fluxo próprio de catálogo.

## Fluxo de trabalho

1. Faça cada alteração em uma branch e mantenha o diff restrito ao pedido.
2. Use a prévia do Vercel para conferir a branch antes de integrar.
3. Antes de publicar, compare a prévia com o site ativo e confirme que o código de origem contém as alterações já presentes em produção.
4. Publique a partir de um commit revisado do repositório. Evite implantações de diretórios locais ou reimplantações de um pacote sem referência ao commit.
5. Se uma publicação emergencial via CLI for necessária, primeiro registre no GitHub o mesmo código e associe a implantação ao commit correspondente.

## Build

- Deixe a instalação de dependências sob o comando padrão do projeto.
- Não use o campo **Install Command** do Vercel para executar `sed`, `find` ou outros comandos que alterem código-fonte durante o build.
- Formatação de descrições, textos de produto e regras da interface devem ser implementados em arquivos versionados de `src/`.
- Confira separadamente qualquer mudança de preço ou de catálogo. Uma mudança de interface não deve substituir dados do catálogo.

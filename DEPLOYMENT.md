# Alterações e publicação da loja

Este é o procedimento principal para mudanças no site. O cliente não precisa abrir o GitHub, mexer na Vercel ou preparar arquivos.

## Como pedir

Envie o link da página ou uma captura de tela e diga o resultado desejado. Se algo precisa permanecer igual — especialmente preço à vista ou o valor de 10x — escreva isso no pedido. Um pedido claro já é suficiente; não repita perguntas que a imagem e a conversa já responderam.

## Caminho da alteração

Antes de editar, resolver o deployment que atende `mobimb.com.br` e comparar seus arquivos fonte, não os nomes dos bundles compilados. A produção de referência `dpl_HvAbcX8PoQMMr5rHHn2z6giHUX19` foi recuperada integralmente no commit `6483e99`: os 125 arquivos enviados à Vercel foram preservados. Uma republicação pela CLI pode não informar o commit; nesse caso usar a árvore de fonte da API da Vercel. Não escolher uma pasta apenas por seu nome ou por um aviso antigo.

Executar `pwsh -File scripts/deploy-preflight.ps1 -ExpectedDeploymentId <deployment-em-uso>` antes de publicar. Para uma alteração intencional, passar somente os caminhos revisados em `-AllowedChangedPath`. Qualquer outra diferença bloqueia a publicação. O script verifica autenticação, projeto/equipe, mudança concorrente do deployment e diferenças de conteúdo da aplicação.

O `vercel.json` mantém o mesmo comando de compilação da produção recuperada, incluindo o aviso de montagem e a remoção dos textos já aprovados. A taxa efetivamente usada no total de até 10x fica em `src/lib/payment-config.ts`, na entrada de 10 parcelas. A fórmula desconta a taxa sobre o total do cartão e arredonda esse total para cima ao real seguinte. Preço à vista e cotações já salvas no carrinho mantêm suas regras.

1. Conferir o pedido e o estado atual da loja. Usar a `main` mais recente e uma branch própria.
2. Alterar somente o que foi pedido. Mudanças visuais não devem editar preços, parcelas ou registros do catálogo no Supabase.
3. Usar a prévia da branch na Vercel e conferir a página ou o componente afetado.
4. Fazer apenas as verificações relevantes. O build da prévia verifica a compilação. `npm run test:categories` serve para mudanças nas categorias; `npm run lint` está disponível para mudanças no código. Não exigir uma bateria genérica de testes para uma mudança pequena.
5. Integrar pelo GitHub e deixar a Vercel publicar a partir do commit versionado. Depois, confirmar que o deploy está `READY` e que a rota afetada responde corretamente.

## Aprovação sem repetição

- Para correção visual, texto comum ou bug simples, o pedido explícito autoriza concluir e publicar quando a prévia estiver correta. Não perguntar de novo “posso publicar?”.
- Para preço, parcelamento, catálogo/estoque ou texto que defina responsabilidade comercial, mostrar o antes e depois e esperar a aprovação final antes de publicar.
- Se o usuário já pediu para confirmar antes da publicação, essa confirmação continua obrigatória. Um “pode publicar” para a versão revisada basta; não solicitar a mesma aprovação outra vez.

## Proteção do parcelamento

O valor da parcela em 10x é uma verificação importante. Se uma mudança tocar em preço ou pagamento, registrar o 10x atual e comparar com a prévia. Quando o usuário pedir para manter o 10x, preservar exatamente esse valor e informar o resultado da comparação. Não ajustar o parcelamento como efeito colateral de uma mudança visual.

## Comandos disponíveis

Os comandos definidos em `package.json` incluem `npm run build`, `npm run lint` e `npm run test:categories`. Não existe script `npm test`. Escolher o comando conforme a área alterada; não executar auditorias ou tarefas sem relação com o pedido.

## Regras de publicação

- Usar GitHub e Vercel conectados para criar prévia e produção a partir do commit.
- Não publicar diretório local ou pacote sem vínculo com commit.
- Não usar o campo **Install Command** da Vercel para executar `sed`, `find` ou editar o código durante o build.
- Preferir merge commit para manter o histórico da branch publicada.
- No resumo final, informar o que mudou, link da prévia ou da loja, estado da publicação e valores de 10x comparados quando relevantes.

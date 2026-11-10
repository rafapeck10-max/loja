# Seção Black Friday na página inicial da Mobi

**Status:** especificação para revisão de Rafael. Nenhum código, preço, configuração publicada ou banco foi alterado.

**Escopo aprovado para desenho em 10/11/2026:** adicionar uma seção à home da Mobi, ligada ao PM-02 e às campanhas do PM-05, exibida somente durante uma campanha válida. Esta aprovação não autoriza ativação comercial nem publicação.

## Objetivo

Apresentar na página inicial os produtos de uma campanha Black Friday configurada pela Mobi. A seção deve seguir a identidade e a operação online da loja, usar produtos e preços confiáveis e desaparecer ao cancelar ou terminar a campanha. A área é uma seção da home; não é o hotsite completo MM-P17.

## Fontes e estado atual

- A engenharia reversa v1.1 descreve MM-P17 com hero, apresentação, atalhos, ofertas, conteúdo e FAQ. MM-LANDING-01 pede tema temporário, configuração versionada, período, produtos e condições, além de restaurar o tema base e os preços ao desligar a campanha. Para este escopo foi aprovada só uma seção na home.
- A especificação do painel v0.2 define PM-02 para ordenar e editar seções e PM-05 para configurar produtos, condições e vigência, com revisão e prévia. Ela é uma proposta funcional; não comprova integração pública.
- No código atual, `HomepageContent` e `HomepageSectionOrder` compartilham a renderização da home e PM-02 define seções da página. PM-05 permite rascunho e simulação local; a própria interface informa que isso não programa campanha nem aplica preço ao catálogo, detalhe ou carrinho.
- `black-friday-rascunho/` registra preços e produtos candidatos, mas sua base é antiga e o documento pede conferir a identificação e o preço no catálogo. Esses dados não são fonte de ofertas ativas.

### Limites descobertos

1. A campanha local do PM-05 ainda não é uma fonte persistente e autoritativa para a vitrine pública. Prévia local não equivale a publicação.
2. A implementação documentada do PM-05 simula preços por produto, sem preço promocional por variante. A especificação separada do painel Black Friday propõe ofertas por produto e variante. Para esta seção, variantes com condições distintas ficam bloqueadas até existir um preço autoritativo compatível em todos os pontos de compra.
3. A Mobi atende online e não tem loja física. A seção não pode sugerir retirada, visitação ou endereço de loja.

## Desenho aprovado para revisão

### Conteúdo e disposição

- Adicionar uma única seção de produtos da campanha, com título e apoio editáveis no PM-02.
- Posição inicial: depois de **Encontre por ambiente** e antes de **Escolhas da semana**. O PM-02 pode reordená-la pelo mesmo mecanismo das outras seções.
- Aplicar paleta, logo, tipografia e linguagem Mobi. Usar os cartões de produto já existentes para preservar fotos, preço e parcelas; manter composição compacta.
- Exibir quatro cartões por linha no desktop e duas colunas no celular, seguindo as regras vigentes da vitrine. Não criar hero alto, atalhos, FAQ ou página separada neste escopo.
- Não mostrar contagem regressiva, preço riscado, percentual ou economia enquanto não houver uma condição comercial validada e uma data final real. O conteúdo da amostra deve estar explicitamente identificado como demonstração.

### Controle pelo painel

- O PM-02 controla estado no rascunho, ordem, título e texto de apoio da seção.
- O PM-05 mantém nome, participantes, datas e condições da campanha. A seção referencia a campanha; não duplica sua seleção ou seus preços em outra lista independente.
- A prévia administrativa deve usar o mesmo renderer e os mesmos cartões da home. Salvar rascunho não altera a home aplicada.
- Revisão/aplicação e histórico devem identificar a versão da home e a campanha associada. Dados internos de custo, fornecedor, notas e snapshots não entram na projeção pública.
- Como `PageSection` e `HomeConfiguration` são tipados/versionados, o plano deve definir compatibilidade ou migração sem perda para rascunhos e revisões existentes ao acrescentar a seção.

### Visibilidade e comportamento comercial

- A seção só é elegível para exibição pública quando estiver habilitada na revisão publicada e lida pela fonte pública autoritativa, a campanha estiver autorizada, o horário estiver dentro da vigência `America/Sao_Paulo` e houver pelo menos um produto válido no catálogo. Um estado `applied` do adaptador local não equivale a publicação.
- A simulação local do PM-05, isoladamente, nunca satisfaz o estado “autorizada para publicação”. Sem fonte pública persistente, a home publicada omite a seção; a prévia local pode demonstrá-la com aviso de amostra.
- A seção usa o preço corrente do catálogo. Se exibir preço promocional, a mesma fonte autoritativa deve alimentar cartão da home, listagem, detalhe e carrinho, incluindo o cálculo atual de 10x. Caso contrário, não exibir a oferta como válida.
- Cancelamento ou expiração remove a seção promocional sem sobrescrever preço-base, edição legítima posterior, seleção semanal ou outras partes da home. A operação não apaga histórico.

## Escopo

**Incluído:** seção responsiva na home; associação à campanha do PM-05; ordem e conteúdo no PM-02; prévia compartilhada; estados de ausência, campanha inválida, cancelada e expirada; projeção mínima e segura dos dados necessários; histórico/versionamento da revisão.

**Fora deste escopo:** hotsite completo MM-P17; banners ou arte de campanha; FAQ e conteúdo editorial; cupons; alteração de preços-base, estoque, parcelas ou pedidos; preço promocional por variante sem fonte validada; ativação de campanha real; gravação no banco ou publicação em produção sem uma decisão e aprovação próprias.

## Critérios de aceite

1. O administrador consegue incluir/desativar e ordenar a seção pelo PM-02, e configurar/associar a campanha no PM-05 sem criar listas de produtos duplicadas.
2. A prévia mostra a mesma composição e os mesmos cartões que a home; os rascunhos continuam isolados da versão aplicada.
3. Se não houver campanha autorizada, vigência válida ou produto elegível, a seção não aparece publicamente e o painel explica a dependência.
4. Na data/hora de início, produtos e condições válidos tornam-se elegíveis; ao cancelar ou expirar, a seção é retirada, a home normal é restaurada e os preços-base do catálogo permanecem intactos.
5. Nenhum preço, desconto, urgência, condição de entrega ou benefício é inventado. Preço promocional só aparece com consistência demonstrada em home, detalhe e carrinho.
6. Desktop e celular mantêm imagens carregadas, cartões legíveis, controles utilizáveis e sem rolagem horizontal indevida.
7. Prévia, commit, limites e procedimento de reversão são apresentados antes de qualquer publicação. Publicação aguarda aprovação explícita da versão apresentada.

## Dependência para disponibilização pública

O código atual oferece simulação local, mas ainda não fornece uma campanha publicada e persistente à loja. Antes de prometer a seção ativa em produção, o plano de implementação deve verificar a fonte autorizada existente, a persistência e as permissões; se não existir uma fonte adequada, isso será apresentado como bloqueio/dependência para uma decisão separada. Não criar tabela, política, segredo ou gravação remota por suposição. Até essa dependência estar resolvida, a entrega é uma prévia de branch e não uma campanha pública.

## Referências consultadas

- `MOBI_ENGENHARIA_REVERSA_MADEIRAMADEIRA (1).md` v1.1: MM-P17, MM-LANDING-01 e MM-HOME-04.
- `MOBI_PAINEL_CONTROLE_ESPECIFICACAO.md` v0.2: PM-02, PM-05, prévia, revisão e separação entre rascunho e aplicação.
- Repositório: `src/components/HomepageContent.tsx`, `src/components/HomepageSectionOrder.tsx`, `src/lib/pages-shelves.ts`, `src/lib/home-configuration.ts`, `src/lib/campaigns.ts`, `src/components/admin-studio/CampaignsPanel.tsx` e `docs/PM01_PM10_CONFERENCIA_DOCUMENTAL.md`.
- Rascunho Black Friday: `black-friday-rascunho/LEIA-ME.md`, `BLACK-FRIDAY-PAINEL-SPEC.md` e `PRODUTOS-BLACK-FRIDAY.md`.

## Próxima etapa

Rafael revisa esta especificação e pede ajustes ou a aprova. Só depois será elaborado e revisado um plano de implementação. A implementação permanecerá em branch e a publicação seguirá o aceite da versão final.

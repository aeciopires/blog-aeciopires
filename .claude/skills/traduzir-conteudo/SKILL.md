---
name: traduzir-conteudo
description: Traduz para inglês (en-US) posts e páginas do blog (index.en.md ao lado do original pt-BR), mantendo comandos, código e links idênticos, revisa a gramática e carimba a tradução (make i18n-ok). Use quando um post/página for criado ou alterado, quando o pre-commit/CI acusar tradução ausente ou desatualizada, ou quando pedirem para traduzir o blog.
---

# traduzir-conteudo

O blog é pt-BR (idioma padrão, na raiz) com uma versão em inglês en-US em `/en/`. A tradução é feita
**localmente, antes do commit**, por esta skill (ou pelo agente `tradutor-en`, que a segue). Nada é traduzido
no build nem no navegador. O pre-commit e a CI rodam `make check-i18n` e **bloqueiam** o commit/deploy se
alguma página publicada estiver sem tradução, com a tradução desatualizada ou com comandos/links diferentes.

## Arquivos

| Original (pt-BR, fonte) | Tradução (en-US) | URL da tradução |
|---|---|---|
| `content/posts/<slug>/index.md` | `content/posts/<slug>/index.en.md` | `/en/<slug>/` |
| `content/<pagina>/index.md` | `content/<pagina>/index.en.md` | `/en/<pagina>/` |
| `content/<secao-ou-termo>/_index.md` | `_index.en.md` no mesmo diretório | `/en/...` |

Imagens e outros arquivos do bundle são **compartilhados** (não copie). O slug é o mesmo nos dois idiomas.
Textos de layout/shortcodes próprios ficam em `i18n/pt-BR.yaml` e `i18n/en.yaml` (chaves `blog.*`, mesmas
chaves nos dois); menus em `config/_default/menus.{pt-br,en}.toml` (mesmos itens, nomes traduzidos).

## Passo a passo

1. **O que traduzir:** `make i18n-status` (falta / desatualizada / rascunho). Página **nova** → traduza o
   arquivo inteiro. Página **alterada** → `make i18n-diff SLUG=<slug>` mostra só o que mudou no pt-BR desde
   a última tradução; aplique as mesmas mudanças no `index.en.md` (não retraduza o resto).
2. **Leia o original inteiro** antes de escrever (contexto, termos, tom).
3. **Escreva `index.en.md`** seguindo as regras abaixo. Front matter: só `title` e `description` (e
   `summary`/`linkTitle`, se houver) são traduzidos; depois rode `make i18n-sync-fm SLUG=<slug>`, que copia
   do pt-BR todos os outros campos (slug, date, lastmod, draft, tags, categories, show*) e tira `aliases` e
   `wp_id` (só do pt-BR, URLs herdadas do WordPress).
4. **Carimbe:** `make i18n-ok SLUG=<slug>`. Ele confere a estrutura (abaixo) e grava `sourceHash` (hash do
   pt-BR traduzido). Erro → corrija a tradução, nunca o original. Trecho em português de propósito (nome
   próprio, título de livro, nome de evento) → `make i18n-ok SLUG=<slug> FORCAR=1`, depois de conferir.
5. **Gramática e estilo:** `make prosa-en SLUG=<slug>` mostra o texto corrido; revise tudo (seção
   "Inglês"). Corrigiu? Rode `make i18n-ok` de novo.
6. **Valide:** `make check-i18n` e, para ver a página, `make serve` → `http://localhost:1313/en/<slug>/`
   (claro, escuro e celular). Antes do commit: `make lint-md validate`.

Muitas páginas de uma vez: divida em lotes e delegue ao agente `tradutor-en` (um lote por agente, em
paralelo); depois rode `make check-i18n` e `make validate` uma vez só (vários `hugo` ao mesmo tempo se atrapalham).

## Regras (o `make i18n-ok` confere as marcadas com ✔)

- ✔ **Blocos de código idênticos**, linha a linha: comandos, saídas, YAML, nomes de arquivo, `echo "..."` em
  português, tudo igual. **Só linhas que são inteiramente comentário** (`# ...`, `// ...`) podem ser
  traduzidas; comentário no fim de uma linha de comando fica como está. Linha comentada que é código
  (`# - alertmanager:9093`) fica igual.
- ✔ **Código em linha** (`` `...` ``) idêntico.
- ✔ **Links externos idênticos** (mesmas URLs, mesma quantidade), inclusive "(cópia arquivada)", que vira
  "(archived copy)". Recurso só em português? Pode acrescentar "(in Portuguese)" ao texto do link.
- ✔ **Links internos:** `/slug/` no pt-BR vira `/en/slug/` (a tradução existe, o check garante), exceto para
  conteúdo `bilingue: true`, que continua `/slug/`; arquivos
  (`/wp-content/uploads/...`, qualquer caminho com extensão) ficam iguais; `{{< ref >}}` fica igual (o Hugo já
  aponta para o idioma certo).
- **Texto de link descritivo:** nada de "here", "click here", "more", "read more", "learn more", "Go"...
  (o Lighthouse derruba o SEO das páginas em inglês e o `make i18n-ok` recusa). Ex.: `described [here](url)` →
  `described in the [Prometheus overview](url)`; `[Go](https://go.dev/)` → `the [Go language](https://go.dev/)`.
- **Âncoras na mesma página** (`#instalacao`): o id muda com o título traduzido; ajuste para o id do título
  em inglês (minúsculas, hífens: `## Installing Docker` → `#installing-docker`).
- ✔ **Shortcodes na mesma sequência** e com os mesmos parâmetros técnicos (`src`, `href`, `repo`, `id`,
  `icon`...). Traduza só textos: `caption`, `alt`, `title`, `label` e o conteúdo entre abertura e fechamento
  (`alert`, rótulos de `mermaid`, `tabs`). `{{< removido nome="..." >}}` fica igual (é um nome de arquivo).
- ✔ **Imagens** com o mesmo arquivo; traduza o texto alternativo.
- ✔ **Mesma estrutura de títulos** (quantidade de `#`, `##`, `###`...).
- **Aviso de atualização:** `**Atualizado em 21/11/2026:** ...` vira `**Updated on November 21, 2026:** ...`.
  Ao usar `make aviso-atualizacao`, passe também `RESUMO_EN="..."` (mesmo `lastmod` nos dois arquivos).
- **Conteúdo que já é bilíngue no original** (o mesmo arquivo traz o texto em pt-BR e em inglês: seções
  "[English Version]"/"[Versão em Português]", blocos 🇺🇸/🇧🇷, "## English"/"## Português"): **não tem tradução**.
  Marque `bilingue: true` no front matter do `index.md` e não crie `index.en.md` (o `check-i18n` recusa). A página
  existe só na URL original (`/slug/`, sem `/en/`); links nas páginas em inglês e itens de menu em inglês apontam
  para ela sem `/en/` (`menus.en.toml`: `url = "/slug/"` no lugar de `pageRef`). Hoje: `sobre`, `helm-chart-zabbix-7-0-0`,
  `helm-chart-zabbix-8-0-0`, `helm-chart-kubernetes-watchdog-pod-restart-delete`, `imagem-docker-para-troubleshooting`
  e os dois resumos de incidente (GCP e AWS). Na versão em inglês, ela aparece na home, no total de posts e na busca
  (com a URL original), mas não em `/en/posts/` nem nas páginas de tag/categoria em inglês.
- **Sentido histórico** preservado como no original (anúncios, "na época, usei a versão X").
- **Nada de conteúdo novo** que não esteja no pt-BR (nem cortes).
- **Erros encontrados no original: corrija e registre** (seção "Correções no original").
- HTML cru é omitido (`unsafe = false`), como no pt-BR: só Markdown e shortcodes.

## Correções no original

Ao traduzir (ou revisar), corrija no pt-BR **e** na tradução os erros que encontrar, e registre cada correção
para o autor conferir antes do commit:

- **Corrija direto:** ortografia, acentuação, concordância, crase, regência, pontuação, espaços faltando
  ("pessoal!Há"), nomes próprios (GitHub, VMware), links com Markdown quebrado, texto que contradiz o próprio
  código do post (ex.: "8 pods" com `desiredReplicas: "30"`), nomes inconsistentes entre comandos do mesmo post
  (ex.: policy criada com um nome e usada com outro) e afirmações técnicas comprovadamente erradas, conferidas
  na documentação oficial (cite a URL).
- **Não corrija sozinho, só registre como pendente:** o que exige teste (protocolo da skill `revisar-conteudo`),
  versões/URLs que você não conferiu, links de vídeo/arquivo cujo destino certo só o autor sabe, cortes de
  conteúdo, slugs e URLs (imutáveis) e o sentido histórico de anúncios.
- Correção de comando, versão ou fato técnico vira aviso no post:
  `make aviso-atualizacao SLUG=<slug> RESUMO="..." RESUMO_EN="..."`. Gramática e digitação não precisam de aviso.
- **Registre** cada item em `reports/correcoes-conteudo-AAAA-MM-DD.md` (pasta ignorada pelo Git), um por linha:

  ```markdown
  - [ ] `slug` · antes: "texto antigo" → depois: "texto novo" · motivo (fonte, se houver)
  - [ ] `slug` · PENDENTE: descrição do problema · por que não foi corrigido
  ```

- O autor confere cada item e marca `- [x]` (ou desfaz a correção). **O pre-commit bloqueia** o commit de um
  conteúdo que ainda tenha item `- [ ]` nesses relatórios (`make check-correcoes`); itens PENDENTE também
  precisam ser marcados (decididos) antes do commit daquele conteúdo.
- Depois de corrigir o pt-BR: `make i18n-diff SLUG=…`, atualize a tradução e `make i18n-ok SLUG=…`.

## Inglês (en-US)

- Inglês americano (color, behavior, license como verbo/substantivo `license`), técnico e direto, na
  **primeira pessoa** e no tom do autor (didático, próximo). Frases curtas; voz ativa.
- Termos: mantenha nomes de produtos e marcas (Kubernetes, Argo CD, GitHub, macOS); "deploy" (verbo) /
  "deployment"; "cluster", "namespace", "pod" em minúsculas como na documentação oficial; "on-premises".
- Não traduza literalmente expressões brasileiras; escreva como um engenheiro americano escreveria
  ("Fica a dica" → "Tip:"; "Bora lá" → "Let's get started").
- Títulos de seção em *sentence case* ("Installing the Vault agent"), como no restante do blog.
- Datas por extenso no texto (November 21, 2026); números com ponto decimal.
- Textos religiosos/pessoais (ex.: posts da categoria "fé"): traduza o texto do autor fielmente; citações
  bíblicas traduzidas do português do post, sem colar outra versão da Bíblia (direitos autorais).
- Revise: concordância, artigos (a/an/the), preposições, tempos verbais, pontuação fora do texto do link,
  vírgula serial opcional mas consistente no arquivo, e nada de trecho esquecido em português
  (o `make i18n-ok` avisa linhas suspeitas).

## Não faça

- Traduzir no build, no navegador ou por serviço externo/API em tempo de execução: a tradução é arquivo versionado.
- Mudar comandos, URLs, nomes de arquivo, versões ou saídas na tradução (o `i18n-ok` bloqueia).
- Editar o pt-BR para "fazer o check passar" (corrigir um erro real do original é outra coisa: registre em `reports/`).
- Carimbar (`i18n-ok`) sem ter traduzido/revisado de fato as mudanças mostradas pelo `i18n-diff`.
- Commit/push sem pedido explícito do autor.

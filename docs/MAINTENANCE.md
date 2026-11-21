# Manual de operação e manutenção

Como manter o blog em constante evolução, seguindo boas práticas, oferecendo o melhor ao leitor e com segurança para você. Arquitetura: [ARCHITECTURE.md](ARCHITECTURE.md). Cloudflare: [cloudflare.md](cloudflare.md).

## 1. Primeiros passos (uma vez por máquina)

```bash
git clone --recurse-submodules git@github.com:aeciopires/blog-aeciopires.git
cd blog-aeciopires
make check-deps      # diagnóstico, não altera nada
make install-deps    # mise + ferramentas + submódulo do tema + skill
make install-hooks   # pre-commit: repositórios do GitHub (data/github.json) + segredos/chaves/e-mail (todo commit) + check-tags e lint-md nos .md alterados
make serve           # http://localhost:1313
```

- Ative o mise no shell (`eval "$(mise activate bash)"` ou `zsh` no `~/.bashrc`/`~/.zshrc`). Sem isso o Makefile ainda funciona, via `mise exec`.
- No macOS, inicie o Colima antes dos alvos com Docker: `colima start --cpu 2 --memory 4 --vm-type vz --mount-type virtiofs` e `docker context use colima`.

## 2. Referência do Makefile

`make help` lista tudo. Convenções:

- parâmetros em MAIÚSCULAS (`SLUG=`, `TITLE=`, `TAG=`);
- alvos que apagam ou alteram conteúdo **simulam** por padrão e só executam com `CONFIRM=sim`;
- todo alvo retorna código de erro diferente de zero se falhar, igual à CI.

| Grupo | Alvo | Exemplo |
|---|---|---|
| Ambiente | `check-deps` | `make check-deps` |
| | `install-deps` | `make install-deps` |
| | `serve` / `serve-prod` / `serve-docker` | `make serve` |
| | `build` / `clean` | `make build` |
| Conteúdo | `new-post` / `new-page` | `make new-post SLUG=helm-chart-zabbix-9-0-0 TITLE="Helm Chart Zabbix 9.0.0"` |
| | `publish-post` / `publish-page` | `make publish-post SLUG=helm-chart-zabbix-9-0-0 DATE=now` |
| | `unpublish-post` / `unpublish-page` | `make unpublish-post SLUG=meu-post [PRIVATE=1]` |
| | `rm-post` / `rm-page` | `make rm-post SLUG=antigo REDIRECT=novo CONFIRM=sim` |
| | `list-drafts` | `make list-drafts` |
| Tags | `check-tags` / `fix-tags` | `make fix-tags SLUG=meu-post CONFIRM=sim` |
| | `new-tag` / `merge-tag` | `make new-tag NAME=opentofu DESC="OpenTofu"` · `make merge-tag FROM=tf TO=terraform CONFIRM=sim` |
| | `tags-report` / `install-hooks` | `make tags-report` |
| Dados | `github-repos` | `make github-repos` (o pre-commit já roda) |
| Imagens | `optimize-images` | `make optimize-images` |
| Qualidade | `lint-md` / `lint-md-fix` | `make lint-md` |
| | `validate` | `make validate` (check-secrets, lint-md, check-tags, build, validate-links, check-home, actionlint, shellcheck, compare-urls) |
| | `check-home` | `make build check-home` (home leve: cards, JSON com SRI, URLs e fidelidade ao card do tema; seção 8) |
| | `check-secrets` | `make check-secrets` (gitleaks no histórico do Git; exceções em `.gitleaks.toml`) |
| | `validate-diagrams` | `make validate-diagrams` (Docker) |
| | `check-links-online` | `make check-links-online` → `reports/links.md` |
| | `audit-content` | `make audit-content SLUG=meu-post` → `reports/content-audit.md` |
| Atualizações | `check-updates` / `outdated` | `make check-updates` → `reports/updates.md` |
| | `update-theme` | `make update-theme TAG=v3.11.0` |
| | `skill-sync` | `make skill-sync` (ou `COPY=1`) |

## 3. Conteúdo: tarefas do dia a dia

| Tarefa | Como |
|---|---|
| Novo post | `make new-post SLUG=… TITLE="…"` → escrever → `make serve` → `make lint-md validate` → `make publish-post SLUG=… DATE=now` → push/PR |
| Nova página | `make new-page SLUG=… TITLE="…"` → menu em `config/_default/menus.pt-br.toml` (se aplicável) → mesmo fluxo |
| Editar post | Editar → atualizar `lastmod` → se a mudança for relevante, nota "Atualizado em DD/MM/AAAA" no início |
| Despublicar (rascunho) | `make unpublish-post SLUG=…` / `make unpublish-page SLUG=…`. Some do site, continua no `make serve`. **O repositório é público**: para rascunho realmente privado, `PRIVATE=1` |
| Republicar | `make publish-post SLUG=…` / `make publish-page SLUG=…` (traz de volta de `_privado/`, se for o caso) |
| Remover de vez | `make rm-post SLUG=… REDIRECT=<outro-slug> CONFIRM=sim` (ou `rm-page`). Sempre preferir despublicar ou redirecionar a deixar 404 |
| Renomear slug | **Evitar.** Se inevitável, `aliases: ["/slug-antigo/"]` no front matter |
| Ver rascunhos | `make list-drafts` (posts com data no futuro: `mise exec -- hugo list future`) |
| Imagens | No *page bundle*: `feature.*` = imagem destacada; texto alternativo em todas; `make optimize-images` antes do commit |
| Categorias e tags | Só as registradas em `data/taxonomia.yaml` (1 a 5 tags por post). Tag nova: `make new-tag`; sinônimo: `make fix-tags`; unir: `make merge-tag`. O `make check-tags` bloqueia o que estiver fora do padrão |
| Diagramas em posts | Shortcode `{{</* mermaid */>}}` do Blowfish |
| Novos embeds | Shortcodes do Blowfish. Se envolver um novo domínio, **atualizar a CSP** ([cloudflare.md](cloudflare.md)) antes |
| Banner de tecnologias | `data/tecnologias.yaml` + logo oficial em `assets/img/logos/` + linha em `assets/img/logos/SOURCES.md`. Nome longo que quebra feio no celular: campo opcional `legenda` com hífen opcional, ex.: `legenda: "Victoria\u00ADMetrics"` (no celular estreito vira "Victoria-/Metrics"; o `nome` continua no `alt` e no `title`) |
| Links nos posts | Externos (`http://`/`https://`) abrem **sozinhos** em nova aba: o Blowfish adiciona `target="_blank" rel="noreferrer"` (`article.externalLinkForceNewTab`, ligado por padrão; desligar num post: `externalLinkForceNewTab: false` no front matter). Links internos: caminho relativo (`/slug/`) ou `{{</* ref */>}}`, nunca `https://blog.aeciopires.com/...` (abriria em nova aba). Não escreva `target` à mão: HTML cru é omitido |
| Páginas de lista (Categorias, Tags, Posts) | O título vem de `content/<seção ou taxonomia>/_index.md` (`title` em pt-BR). Sem esse arquivo, o Hugo usa o nome interno em inglês (era o caso de `/categories/`). Taxonomia nova: criar o `_index.md` junto |

Notas:

- **Despublicar ≠ remover.** O Hugo não gera rascunhos em produção: a página some do site, do RSS, do sitemap e da busca no próximo deploy (que também limpa o cache). O tópico do giscus fica no GitHub e volta se o conteúdo for republicado.
- **`PRIVATE=1`** move o *bundle* para `_privado/` (no `.gitignore`), visível só no `make serve` (mount em `config/development/module.toml`). **Faça backup próprio** dessa pasta. O que já foi commitado continua no histórico do git.
- **`rm-*`** recusa se houver alterações não commitadas, lista os links que vão quebrar e lembra de travar a discussão do giscus.
- **HTML cru** no Markdown é omitido (`unsafe = false`). Use os shortcodes do Blowfish.

**Checklist de qualidade por post:**

- título claro e `description` de até ~155 caracteres;
- comandos testados na versão citada, que deve aparecer explicitamente;
- links para a documentação oficial;
- blocos de código com linguagem;
- imagens leves e com `alt`;
- sem segredos, IPs internos ou dados pessoais nos exemplos;
- leitura conferida nos modos claro e escuro e no celular.

## 4. Testar localmente antes de publicar

| Objetivo | Comando |
|---|---|
| Escrever com *live reload* (mostra rascunhos) | `make serve` |
| Ver exatamente como o leitor verá (sem rascunhos, modo produção, sem analytics) | `make serve-prod` |

Um post novo continua rascunho (`draft: true`) até o `make publish-post`: aparece no `make serve`, mas **não** no `make serve-prod` (nem a página, nem o card na home). Isso é esperado; veja a seção 11 ("Post não aparece").
| Ambiente isolado / sem mise | `make serve-docker` |
| Mesma validação da CI | `make lint-md validate` |
| Desempenho (Lighthouse) | No site publicado ou no PageSpeed Insights. **Não** meça no `make serve`/`serve-prod`: o servidor do Hugo não minifica, não comprime (sem Brotli/gzip), não manda cache e injeta o *live reload* (a home chegava a 454 KB contra 22 KB publicados) |
| Diagramas da documentação | `make validate-diagrams` |

O que olhar no navegador:

- home, um post longo, `/tags/`, `/posts/` e Contato;
- botão claro/escuro (a primeira visita abre escura, como no blowfish.page);
- larguras de celular no DevTools (modo dispositivo): 320, 360 (Galaxy S2x e a maioria dos Android), 390/393 (iPhone/Pixel), 412 e 430 px; depois 640, 768 e ≥ 1024 px. Em cada uma: sem rolagem horizontal e nada saindo da borda das caixas (banner de tecnologias, números da home, nuvem de tags, tabelas e blocos de código);
- busca (`Ctrl K`);
- comentários: o giscus só carrega com `repoId`/`categoryId` preenchidos e no domínio real; localmente aparece só a parte arquivada.

## 5. Manter o conteúdo atualizado e verificado

1. `make audit-content` (todo o site ou `SLUG=…`) e ler `reports/content-audit.md`.
2. Para validar contra fontes oficiais e atualizar, pedir ao Claude Code, por exemplo:
   - "Use a skill revisar-conteudo no post helm-chart-zabbix-8-0-0";
   - "Use a skill revisar-conteudo nos 5 posts mais antigos".
3. Revisar o PR proposto: a tabela "antes, depois e fonte oficial", o `make serve` e o `make validate`.
4. Links externos: `make check-links-online` mensal. Para link morto, trocar pela fonte oficial atual ou pela cópia do Internet Archive (marcada "(cópia arquivada)"); sem cópia útil, remover a linha.
5. Ferramentas de apoio (também usadas pelas skills):
   - `make aviso-atualizacao SLUG=… RESUMO="…"`: aviso "Atualizado em DD/MM/AAAA" no início do post + `lastmod` (substitui o aviso anterior);
   - `make verificar-texto [SLUG="…"]`: restos da migração (`<http://…>`, pontuação dentro de links, `**` soltos, HTML cru, heredoc sem aspas com `$` de template) e erros de escrita recorrentes. Nem todo aviso é erro: confira cada um;
   - `make prosa SLUG="…"`: só o texto corrido, para revisar a gramática.
6. Para testar os comandos dos posts, a skill `revisar-conteudo` usa Docker e clusters kind com nomes `revisao-*`, portas alternativas e nenhuma credencial real, e remove tudo ao final. Seus containers e clusters não são tocados.

## 6. Usar as skills do Claude Code

| Skill | Quando usar | Exemplo de pedido |
|---|---|---|
| `blowfish` | Qualquer mudança de tema, configuração, layout, shortcode ou front matter | "Usando a skill blowfish, mostre o sumário em todos os posts longos" |
| `revisar-conteudo` | Atualizar e testar posts com base em fontes oficiais | "Revise o post X com a skill revisar-conteudo" ou "Teste com Docker e kind os posts com comandos" |
| `escrever-post` | Escrever um post novo (fica como rascunho) | "Escreva um post sobre o repositório github.com/aeciopires/X" |
| `atualizar-site` | Atualizar Hugo, Blowfish, ferramentas e imagens | "Use a skill atualizar-site e proponha as atualizações disponíveis" |

- As skills nunca publicam sozinhas: entregam uma branch ou PR para você revisar.
- O [CLAUDE.md](../CLAUDE.md) vale para todas.
- A skill `blowfish` é um link para `themes/blowfish/.claude/skills/blowfish`, então acompanha a versão do tema. Se não aparecer, `make skill-sync`.

## 7. Atualizar softwares

**Política de versões:** a versão **estável mais nova possível**, limitada só por compatibilidade, com o motivo registrado na tabela abaixo. Sem alpha, beta, RC ou nightly. Node.js: LTS mais novo.

| Software | Usada | Motivo da limitação |
|---|---|---|
| Hugo *extended* | 0.169.0 | Blowfish v3.10.0 declara `hugoVersion` máx. 0.169.0 (0.170.1 já existe) |
| Blowfish | v3.10.0 | — |
| lychee · actionlint · shellcheck · oxipng | 0.24.2 · 1.7.12 · 0.11.0 · 10.2.1 | — |
| Node.js | 26.13.1 (LTS) | LTS mais novo |
| markdownlint-cli2 | 0.24.1 | — |
| Imagem do Hugo | `ghcr.io/gohugoio/hugo:v<versão do mise.toml>` | Segue o `mise.toml` |
| mermaid-cli | `minlag/mermaid-cli:12.0.1` | Imagem mais nova publicada no Docker Hub |
| GitHub Actions | ver `.github/workflows/` (SHA + versão) | Dependabot |

- **Ver o que há de novo:** `make check-updates` (versão atual, a mais nova e a mais nova *permitida*).
- **Ferramentas do mise:** editar a versão no `mise.toml` → `mise install` → `make validate` → `make serve` → PR.
- **Blowfish:** `make update-theme TAG=vX.Y.Z` (mostra changelog, diff da skill e faixa de Hugo; roda `make validate`). Se a faixa mudou, ajustar o Hugo no `mise.toml` **no mesmo PR**. Revisar `layouts/tags/terms.html` (override do tema) e o visual nos modos claro e escuro e no celular.
- **Hugo:** só dentro da faixa do Blowfish; ler as notas de versão e rodar `hugo --logLevel info` para ver *deprecations*.
- **GitHub Actions:** merge dos PRs do Dependabot depois de ler o changelog.
- **Quando NÃO atualizar:** versão alpha/beta/RC; Hugo fora da faixa do tema; semana de publicação importante; CI vermelha por outro motivo.
- **Desfazer:** `git revert` do PR, ou `make update-theme TAG=<anterior>`.
- Mudou `Makefile`, scripts ou `mise.toml`? Testar em pelo menos um Ubuntu e um macOS.

## 8. Fazer ajustes e evoluir o site

| Mudança | Onde |
|---|---|
| Tamanho da fonte, largura do texto e margens no computador | Variáveis `--blog-fonte-lg`, `--blog-fonte-2xl`, `--blog-largura-texto` e `--blog-margem-lateral` no fim de `assets/css/custom.css` (celular e tablet seguem o tema). Mantenha o texto entre 60 e 80 caracteres por linha |
| Busca (termos em qualquer ordem, sem acento, tolerância a erro) | `assets/js/busca.js`: ajusta as opções da Fuse.js do tema (`useTokenSearch`, `tokenMatch: "all"`, `ignoreDiacritics`, `threshold: 0.15`), sem copiar o `search.js`. Mais tolerância (0.2+) acha "zabix", mas faz "istio" casar com "isto". **Segurança:** o `search.js` do tema monta os resultados com `innerHTML`; o `busca.js` envolve `fuse.search` e entrega ao tema cópias com escape (título, seção, data; resumo com escape duplo porque o tema faz `innerHTML` → `textContent` → `innerHTML`) e links só do próprio site. Após atualizar o Blowfish, conferir se o tema ainda usa `new Fuse(...)` e `fuse.search(...)`, os campos `title`/`summary`/`permalink`/`section`/`date`/`externalUrl`, e se a Fuse.js é ≥ 7.5; testar uma busca e o `/?s=termo` |
| Ordenação dos posts da home (Mais recentes, Mais antigos, Mais lidos, Menos lidos) | Ver "Ordenação dos posts da home" logo abaixo |
| Logos pequenos dentro de posts | `{{< figure src="logo.svg" alt="Logo do X" figureClass="logo-post" nozoom=true >}}`: 80 px de altura, vários lado a lado (classe `logo-post` em `assets/css/custom.css`) |
| Blocos de código sem barra de rolagem | Fim de `assets/css/custom.css`: linhas longas quebram só na exibição (`pre-wrap`); copiar traz o comando original, sem `\` extra. Para voltar à rolagem horizontal, remova esse bloco |
| Números da home (posts, categorias, repositórios no GitHub) | `layouts/shortcodes/blog-stats.html`: cada cartão é um link. Trocar um número: acrescentar/remover um `dict` em `$itens` (`valor`, `rotulo`, `url` e `externo` para abrir em nova aba). Dado externo novo: gerar um `data/*.json` por script (como `scripts/github-repos.mjs`), nunca ampliar `security.http.urls` |
| Banner de tecnologias no celular | `assets/css/custom.css`, bloco "Banner de tecnologias": até 640 px, 3 colunas fluidas (`repeat(3, minmax(0, 1fr))`, placas com `width: 100%`); até 340 px, 2 colunas; legendas com fonte menor que quebram em até 2 linhas. **Não use largura fixa em px** em grades do celular: foi o que fez as placas saírem da borda no Galaxy S26 (360 px) |
| Taxonomias | Só `tags` e `categories` (`[taxonomies]` em `hugo.toml`). `series` foi desligada porque nenhum post usava (gerava `/series/` vazia). Para usar séries: reativar em `[taxonomies]` e em `[related.indices]`, criar `content/series/_index.md` com `title: "Séries"` e pôr `series: ["Nome"]` nos posts |
| Cores, vidro, banner, nuvem | `assets/css/custom.css` (cores do esquema nativo `blowfish` via `--color-*`; não criar esquema próprio sem necessidade) |
| Parâmetros do tema | `config/_default/params.toml`, conferindo a documentação da versão fixada |
| Comportamento de layout | Override em `layouts/partials/` ou shortcode em `layouts/shortcodes/`; **nunca** editar `themes/blowfish/` |
| Textos do tema | `i18n/pt-BR.yaml` (só as chaves que mudam) |
| Novo serviço de terceiros | Avaliar privacidade e segurança → CSP → [cloudflare.md](cloudflare.md) → página Privacidade → `CLAUDE.md` se virar regra |
| Mudança de arquitetura | [ARCHITECTURE.md](ARCHITECTURE.md) (diagramas) + registro da decisão em `PLANS/<nome>/` |

### Ordenação dos posts da home

O Blowfish não tem ordenação escolhida pelo leitor: só `list.orderByWeight`, fixo no build. A contagem de leituras do tema (`showViews`) depende do Firebase, um serviço de terceiros, por isso não foi usada. A solução é própria:

| Peça | Papel |
|---|---|
| `layouts/partials/recent-articles/cardview.html` | **Override** do tema (v3.10.0). **Home leve:** o HTML traz só os `homepage.showRecentItems` posts mais recentes (cards do tema), os botões e um `<template data-card-molde>` com um card renderizado pelo tema. Os dados de todos os posts vão para `js/posts-home.<hash>.json` (fingerprint + integridade nos atributos `data-json`/`data-json-integridade`). O JSON é extraído da **saída dos partials do tema** (`article-link/card.html` para a imagem, `article-meta/basic.html` para metadados e chips), então acompanha a configuração e as versões do Blowfish; se a extração falhar, o build emite WARN. Mantém o `.Paginate` do tema para não sumir com `/page/N/` |
| `assets/js/ordenar-home.js` | Na ordem padrão não baixa nada. Ao escolher outra ordem, baixa o JSON uma vez (`fetch` com `integrity`), valida e monta os cards que faltam **clonando o molde** e preenchendo só com `textContent` e URLs validadas. Ativa um botão por vez (`aria-pressed`), troca o título da seção e lembra a escolha (`localStorage`). Falha no JSON (rede, integridade, dados inválidos) → volta para "Mais recentes". Sem JavaScript, os botões não aparecem e a home fica como no tema |
| `scripts/check-home.mjs` + `make check-home` | Roda no `make validate`, no `pr-check` e no deploy: confere os cards da home, o molde, o SRI do JSON, as URLs e compara título, imagem, metadados e chips do JSON com o card do tema em `/posts/` (todos os posts). É o alarme para mudanças do Blowfish |
| `assets/css/custom.css` (bloco "Ordenação dos posts da home") | Visual dos botões nos modos claro e escuro |
| `scripts/visualizacoes.mjs` + `make visualizacoes` | Gera `data/visualizacoes.json` (ignorado pelo Git) com as visualizações por caminho dos últimos 180 dias, pela API GraphQL do Cloudflare Web Analytics (`rumPageloadEventsAdaptiveGroups`). A API só responde até 26 semanas e 2 dias (184 dias) atrás; pedir mais dá o erro *cannot request data older than 26w2d*. Os números são aproximados (a API usa amostragem) |
| `.github/workflows/deploy.yml` | Passo "Visualizações por página" antes do build e republicação toda segunda (09:15 UTC) para atualizar os números |

Sem `data/visualizacoes.json` (sem o secret no deploy, ou num build local sem `make visualizacoes`), "Mais lidos" e "Menos lidos" não aparecem; "Mais recentes" e "Mais antigos" sempre funcionam. Posts sem visitas no período contam como 0 (aparecem primeiro em "Menos lidos", desempatados pela data).

**Novos posts ou posts removidos:** nada a fazer. A lista vem do Hugo a cada build, e os números são recalculados no deploy seguinte (no máximo uma semana depois, ou na hora com Actions → *Deploy* → *Run workflow*). Um post novo começa com 0 visitas. Se um post mudar de endereço, as visitas antigas ficam no caminho antigo até saírem da janela de 180 dias.

**Regras de segurança da home leve** (não relaxar):

- no JavaScript, nada de `innerHTML`, `outerHTML`, `insertAdjacentHTML` ou `document.write`: texto só por `textContent`, atributos por `setAttribute`;
- URLs do JSON (post, imagem, termos) só se forem caminhos do próprio site (`/…`, sem `//`, sem esquema, sem `\`, aspas, `<`, `>` ou espaços); item inválido é descartado. A mesma regra está em `scripts/check-home.mjs`;
- o JSON só leva dados do próprio build (front matter e saída do tema); nunca comentários, dados de visitantes ou de APIs de terceiros;
- mesma origem e `connect-src 'self'`: a CSP não muda. O `htmlUnescape` no override vale só porque o resultado vai para o JSON e vira `textContent`.

**Ao atualizar o Blowfish ou o Hugo**, confira:

1. `make update-theme TAG=…` lista o diff do tema nos arquivos que a home usa (`recent-articles/`, `article-link/card.html`, `article-meta/basic.html`). Traga para o override as mudanças do tema (classes do grid, chamada do card) e mantenha os atributos `data-*`, o molde, os botões e o `<script>`.
2. `make validate` roda o `check-home`. Se falhar com "difere do card do tema" ou "molde incompleto", o HTML do card mudou: ajuste no override as expressões `$separador`, `$reLinhaMeta` e `$reTermo` e, no `ordenar-home.js`, os seletores do molde (`img`, `header a`, `h2`, `header + div` e suas duas linhas, `.px-2`, `.article-link__summary`). WARN do `cardview.html` no build indica o mesmo.
3. Se o tema passou a oferecer ordenação nativa ou se `homepage.showRecentItems`/`cardView`/`list.showSummary` mudaram de nome (notas da versão e https://blowfish.page/docs/homepage-layout/).
4. Se `hugo.Data`, `.Paginate`, `.Date.Unix`, `findRESubmatch`, `resources.FromString` e `jsonify` continuam válidos (`hugo --logLevel info` sem avisos de deprecated).
5. Teste no navegador: `make serve-prod` → home → cada botão muda a ordem, só um fica ativo e os cards montados ficam iguais aos do tema (imagem, data, palavras, tempo, chips); recarregue com outra ordem salva; desligue o JavaScript e veja os 6 mais recentes; DevTools → Console sem erros de CSP; celular e modos claro/escuro.
5. Para testar "Mais lidos" com os números reais: exporte `CLOUDFLARE_ANALYTICS_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no terminal (sem salvar o token em arquivo) e rode `make visualizacoes` antes do `make serve-prod`. Só exportar as variáveis não basta: o Hugo lê o arquivo, não as variáveis. Com o servidor já rodando, ele recarrega sozinho ao surgir o arquivo.
6. Para testar "Mais lidos" sem token, crie um `data/visualizacoes.json` de exemplo: `{"paginas": {"/zabbix-docker/": 10, "/primeiros-passos-com-docker/": 5}}` (o arquivo é ignorado pelo Git).

**Janela de dados:** o padrão é 180 dias (`VISUALIZACOES_DIAS`, que aceita no máximo 180). A API do Web Analytics só responde até 26 semanas e 2 dias (184 dias) atrás. Por isso não usar "6 meses" de calendário, que pode passar de 184 dias e dar o erro *cannot request data older than 26w2d*. Se o Cloudflare mudar esse limite, ajustar o teto em `scripts/visualizacoes.mjs`.

**Se a API do Cloudflare mudar** (o passo do deploy falha com erro do GraphQL): conferir o conjunto de dados e os campos na [documentação do Web Analytics](https://developers.cloudflare.com/web-analytics/) e no esquema da API (GraphiQL em https://graphql.cloudflare.com/explorer), ajustar a consulta em `scripts/visualizacoes.mjs` e testar com `CLOUDFLARE_ANALYTICS_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... make visualizacoes`.

Peças próprias do site:

| Arquivo | Para quê |
|---|---|
| `layouts/shortcodes/blog-chamada.html` | Chamada da home (eyebrow, título, botões) |
| `layouts/shortcodes/blog-stats.html` | Números da home, cada um é um link: posts publicados (→ `/posts/`) e categorias (→ `/categories/`), calculados no build, e repositórios públicos no GitHub (→ aba de repositórios do perfil, nova aba), lidos de `data/github.json` |
| `scripts/github-repos.mjs` + `make github-repos` | Atualiza `data/github.json` pela API REST pública do GitHub (`GET /users/{usuario}`, campo `public_repos`). Roda no pre-commit (`.githooks/pre-commit`, ativado por `make install-hooks`): se o número mudou, o hook inclui `data/github.json` no commit. Sem rede, com timeout de 5 s ou erro da API, mantém o arquivo como está e não bloqueia o commit; para pular, `GITHUB_REPOS_SKIP=1 git commit …`. O deploy não consulta a API: publica o número versionado. O Hugo não consulta a API direto porque `security.http.urls` só libera `/repos/` |
| `layouts/shortcodes/tecnologias.html` | Banner "Stacks que uso no dia a dia" |
| `layouts/shortcodes/nuvem-tags.html` + `layouts/partials/tag-cloud.html` | Nuvem de tags (home e `/tags/`): o tamanho mostra a frequência; o número de posts fica só no `title` e num texto para leitor de tela (classe `tag-cloud__contagem`). A lista "Todas as tags de A a Z" de `/tags/` mantém o número visível (todas têm o mesmo tamanho) |
| `layouts/tags/terms.html` | Página `/tags/` com nuvem e lista A–Z (override do tema) |
| `layouts/partials/recent-articles/cardview.html` + `assets/js/ordenar-home.js` + `scripts/visualizacoes.mjs` | Ordenação dos posts da home (override do tema; ver acima) |
| `layouts/shortcodes/jotform.html` | Formulário de contato |
| `layouts/shortcodes/licenca-blowfish.html` | Texto MIT integral em `/creditos/` |
| `layouts/partials/comments.html` + `assets/js/giscus.js` + `static/giscus/` | Comentários (giscus + arquivados) |
| `layouts/partials/extend-head.html` | Cloudflare Web Analytics (só build de produção) |
| `layouts/partials/extend-head-uncached.html` + `assets/js/legacy-redirect.js` | `/?p=ID` e `/?s=termo` do WordPress |
| `layouts/partials/extend-footer.html` + `i18n/pt-BR.yaml` | Aviso de licença no rodapé |

## 9. Segurança (para você e para o leitor)

- **Contas:** 2FA no GitHub e no Cloudflare; *branch protection* na `main` (exigir `pr-check`, sem force-push); *secret scanning* e *push protection* ligados.
- **Segredos:** nunca no repositório. O único segredo é `CLOUDFLARE_API_TOKEN` (só *Cache Purge*, zona `aeciopires.com`, com expiração), em GitHub Secrets. O token do **Web Analytics** (`[cloudflareAnalytics] token` em `params.toml`) **não é segredo**: é um identificador público que vai no HTML de toda página, como um ID do Google Analytics; por isso pode ficar no Git.
- **Barreiras contra vazamento**, em camadas:
  1. *pre-commit* (`make install-hooks`), em todo commit (antes, atualiza `data/github.json`, que também passa pelo gitleaks): gitleaks nas mudanças staged (tokens, chaves privadas, senhas), arquivos sensíveis (`.env`, `*.pem`, `*.key`, `id_rsa`, `credentials.json`, `.claude/settings.local.json`…) e o e-mail do autor (lido de `git config user.email` e de `git config --get-all hooks.emailbloqueado`, para não ficar escrito no repositório).
  2. CI (`pr-check.yml` → `make check-secrets`): gitleaks no histórico completo; pega o que passou com `--no-verify`.
  3. GitHub *secret scanning* + *push protection*: recusa o push de segredos conhecidos.
- **Falso positivo do gitleaks:** confira se é mesmo exemplo/placeholder; então adicione uma exceção bem delimitada em `.gitleaks.toml` (ou `gitleaks:allow` na linha). **Segredo real que vazou:** revogue/rotacione primeiro, depois remova do histórico.
- **Workflows:** actions por SHA, com `permissions` mínimas.
- **Hugo:** `security` em `hugo.toml` restrito (`http.urls` só `api.github.com/repos/`); `unsafe = false`.
- **Navegador do leitor:** CSP, HSTS e demais headers ([cloudflare.md](cloudflare.md)); qualquer novo script ou iframe exige atualizar a CSP primeiro, em modo *Report-Only*. Conferir de vez em quando que a CSP está **aplicada**: `curl -sI https://blog.aeciopires.com/ | grep -i content-security` deve mostrar `content-security-policy:` (sem `-report-only`). Depois de mudar a CSP, seguir "Testar a CSP" em [cloudflare.md](cloudflare.md), seção 5 (o formulário de contato depende de `form.jotform.com`).
- **JavaScript próprio** (`assets/js/`): nunca `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`eval` com dados; texto por `textContent`; URLs vindas de dados só do próprio site (validadas); `postMessage` com origem fixa; nada inline (fingerprint/SRI). Código do tema que monta HTML com dados (busca) é neutralizado por envoltório (`busca.js`), nunca editando `themes/`.
- **Riscos residuais aceitos:** `style-src 'unsafe-inline'` (o tema usa `style=` nos elementos); `img-src https:` (imagens externas antigas); `client.js` do giscus sem SRI (o arquivo muda sem versão; isolado no domínio giscus.app e no iframe).
- **Comentários:** moderação semanal; *interaction limits* em ondas de spam; nunca renderizar HTML vindo de comentários.
- **Conteúdo:** exemplos sem credenciais, IPs internos ou dados pessoais. Revisar *screenshots* antes de publicar. Nunca publicar o e-mail do autor.
- **Privacidade:** página Privacidade atualizada sempre que entrar ou sair um serviço de terceiros.

### Checagens externas de TLS e headers

| Ferramenta | Link | Última nota | O que avalia |
|---|---|---|---|
| Qualys SSL Labs | <https://www.ssllabs.com/ssltest/analyze.html?d=blog.aeciopires.com&latest> | **A+** (21/11/2026) | Certificado e cadeia, versões de TLS e cifras da **borda do Cloudflare**, HSTS |
| securityheaders.com | <https://securityheaders.com/?q=blog.aeciopires.com> | **A** (20/11/2026) | Headers de segurança (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`…) |

- **Quando rodar:** mensalmente (seção 10) e sempre depois de mexer em SSL/TLS, *Edge Certificates* ou nos headers do Cloudflare.
- **SSL Labs:** o parâmetro `&latest` mostra o resultado em cache (até alguns dias). Para um teste novo, clique em *Clear cache* na página do resultado; leva de 1 a 3 minutos. O Cloudflare tem vários IPs na borda: a nota vale para todos os listados.
- **O que mantém o A+:** HSTS com `max-age` de pelo menos 6 meses (hoje `31536000`, [cloudflare.md](cloudflare.md), seção 5), TLS mínimo 1.2 e certificado de borda válido (Universal SSL do Cloudflare, renovado sozinho). Sem HSTS a nota cai para A; TLS 1.0/1.1 habilitado derruba para B.
- **Se a nota cair:** ler o motivo no topo do relatório (avisos em laranja/vermelho), comparar com as configurações de SSL/TLS do Cloudflare e com a seção 5 do [cloudflare.md](cloudflare.md), corrigir no painel (pelo autor) e registrar a nova data e nota nesta tabela. O certificado da **origem** (GitHub Pages ↔ Cloudflare) não aparece no SSL Labs: é vigiado pelo `origin-cert.yml`.
- Registrar a nota e a data nesta tabela a cada checagem.

### Configuração do repositório no GitHub

Feita em 20/11/2026, exceto onde marcado como pendente. O Claude Code não altera essas configurações (regra do `CLAUDE.md`); ele só consulta, por exemplo com `gh api repos/aeciopires/blog-aeciopires --jq .security_and_analysis`.

| Item | Onde | Valor | Status |
|---|---|---|---|
| GitHub Pages | Settings → Pages → Build and deployment → Source | **GitHub Actions** | feito |
| Permissões dos workflows | Settings → Actions → General → Workflow permissions | **Read repository contents**; desmarcado "Allow GitHub Actions to create and approve pull requests" | feito |
| Secret scanning e push protection | Settings → Advanced Security (ou Code security) → Secret Protection | ligados | feito |
| Dependabot | Settings → Advanced Security → Dependabot | **alerts** e **security updates** ligados (atualizações de versão vêm do `.github/dependabot.yml`) | feito |
| Proteção da `main` | Settings → Rules → Rulesets | ruleset abaixo | feito, **falta o check `validate`** |
| Ambiente do Pages | Settings → Environments → github-pages | só a branch `main` | conferir após o 1º deploy |
| Secrets/variables do Cloudflare | Settings → Secrets and variables → Actions | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | **pendente** (Fase 6) |
| Variables de transição | idem | `MIGRACAO_CONCLUIDA=true` (após a Fase 4), `DOMINIO_ATIVO=true` (após a virada de DNS) | **pendente** |

**Ruleset da `main`, passo a passo:**

1. **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. **Ruleset name:** `main` · **Enforcement status:** Active.
3. **Bypass list → Add bypass → Repository admin** (você continua publicando com `git push` direto em `main`, como o fluxo permite; outras pessoas precisam de PR).
4. **Target branches → Add target → Include default branch**.
5. Marque **Restrict deletions** e **Block force pushes**.
6. Marque **Require status checks to pass** → **Add checks** → `validate` (job do `pr-check.yml`).
   - **Pendente:** o check só aparece na busca depois que o `pr-check` rodar uma vez. Abra o primeiro PR (ex.: o da migração), espere o `PR check` terminar e volte a este passo.
7. **Create**.

**Ambiente do Pages (após o 1º deploy):** em **Settings → Environments → github-pages → Deployment branches and tags**, deve estar **Selected branches and tags** contendo só `main` (o GitHub cria assim por padrão; só conferir).

**Secrets e variables (Fase 6):** em **Settings → Secrets and variables → Actions**:

- aba **Secrets → New repository secret:** `CLOUDFLARE_API_TOKEN` — token criado no Cloudflare em **My Profile → API Tokens → Create Token → Custom token**, com permissão **Zone → Cache Purge → Purge**, recurso **Include → Specific zone → aeciopires.com** e **TTL** (data de expiração, rotação anual);
- aba **Variables → New repository variable:** `CLOUDFLARE_ZONE_ID` (no painel do Cloudflare: zona `aeciopires.com` → Overview → API → Zone ID), `MIGRACAO_CONCLUIDA=true` e, depois da virada, `DOMINIO_ATIVO=true`.

Sem esses valores os workflows continuam funcionando: o purge do cache é pulado, o `compare-urls` não bloqueia e o `origin-cert.yml` não roda.

### Configurar o giscus (comentários)

Feito em 20/11/2026. Repita estes passos só se for reinstalar (outro repositório, categoria recriada etc.).

1. **Prepare o repositório `aeciopires/blog-aeciopires`:**
   - ele precisa ser **público** (já é, por causa do GitHub Pages gratuito);
   - em **Settings → General → Features**, marque **Discussions**.
2. **Crie a categoria dos comentários:** em **Discussions → Categories → New category**, crie **Comentários** no formato **Announcement** (só mantenedores e o app giscus abrem tópicos; os leitores apenas respondem). Categoria atual: <https://github.com/aeciopires/blog-aeciopires/discussions/categories/53362060>.
   - Apague as categorias padrão (General, Ideas, Polls, Q&A, Show and tell, Announcements), para ninguém abrir tópicos soltos. Feito em 20/11/2026: só existe **Comentários**.
3. **Instale o app do giscus:** em <https://github.com/apps/giscus> (também em <https://github.com/marketplace/giscus>), clique em **Install**, escolha **Only select repositories** e selecione **apenas** `aeciopires/blog-aeciopires` (menor privilégio).
4. **Valide no configurador:** em <https://giscus.app>, informe `aeciopires/blog-aeciopires` e aguarde a confirmação de que o repositório atende aos requisitos (público, Discussions ligadas, app instalado). Em **Categoria da discussão**, escolha **Comentários**.
   - **Não copie o `<script>` gerado para o site.** Neste blog o script é montado por `assets/js/giscus.js` (sem JS inline, por causa da CSP), com as opções já definidas: mapeamento `pathname` estrito, reações, caixa de comentário no topo, idioma `pt`, carregamento *lazy* e tema que acompanha o claro/escuro do Blowfish (`static/giscus/t9-*.css`).
   - Do configurador, aproveite só os dois IDs (`data-repo-id` e `data-category-id`), ou obtenha-os pelo `gh` (abaixo).
5. **Grave os IDs** em `config/_default/params.toml`, seção `[giscus]` (abaixo), rode `make serve` e confira a área de comentários num post. Localmente o giscus pode recusar a origem `localhost`; a validação final é no staging/produção, com um comentário de teste apagado depois.
6. **Acompanhe:** no repositório, **Watch → Custom → Discussions**, para receber os comentários por e-mail (moderação na seção 10).

### IDs do giscus

Ficam em `config/_default/params.toml` (`[giscus]`). São **públicos** (não são segredos). O giscus exige os **IDs GraphQL** (`node_id`):

| Campo | Valor atual | Não usar |
|---|---|---|
| `repoId` | `R_kgDOV0zJLg` | o `id` numérico da API REST (`1464650030`) |
| `categoryId` | `DIC_kwDOV0zJLs4DLj2M` (categoria "Comentários") | o número da URL da categoria (`53362060`) |

Para obter de novo (ex.: categoria recriada ou repositório renomeado):

```bash
# ID do repositório (node_id)
gh api repos/aeciopires/blog-aeciopires --jq .node_id

# ID do repositório + IDs das categorias de Discussions
gh api graphql -f query='{repository(owner:"aeciopires",name:"blog-aeciopires"){id discussionCategories(first:25){nodes{id name}}}}'
```

Alternativa sem CLI: o configurador em <https://giscus.app> mostra os mesmos IDs no `<script>` gerado.

### Variables e secrets do repositório

| Nome | Tipo | Para quê |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | Purge do cache após o deploy (sem ele, o passo é pulado) |
| `CLOUDFLARE_ZONE_ID` | variable | Zona `aeciopires.com` |
| `MIGRACAO_CONCLUIDA` | variable | `true` torna o `compare-urls` bloqueante no `pr-check` |
| `DOMINIO_ATIVO` | variable | `true` liga o `origin-cert.yml` (depois da virada de DNS) |
| `CLOUDFLARE_ANALYTICS_TOKEN` | secret | Leitura do Web Analytics para "Mais lidos"/"Menos lidos" da home (sem ele, esses botões ficam ocultos) |
| `CLOUDFLARE_ACCOUNT_ID` | variable | Conta do Cloudflare consultada pelo `scripts/visualizacoes.mjs` |

**Criar o `CLOUDFLARE_API_TOKEN`** (só *Cache Purge*, só esta zona, com validade):

1. Cloudflare → ícone do perfil → **My Profile → API Tokens → Create Token → Create Custom Token**.
2. Nome: `github-actions-blog-purge`. **Permissions:** `Zone` · `Cache Purge` · `Purge`. **Zone Resources:** `Include` · `Specific zone` · `aeciopires.com`.
3. **TTL:** data de término (ex.: 1 ano) e anote no calendário (seção 10, rotação anual). Opcional: *Client IP Address Filtering* não se aplica (runners do GitHub mudam de IP).
4. **Continue to summary → Create Token** e copie o valor (aparece uma vez só).
5. Grave no GitHub sem deixar o valor no histórico do shell: `gh secret set CLOUDFLARE_API_TOKEN` (o `gh` pede o valor) ou Settings → Secrets and variables → Actions → *New repository secret*.

**Criar o `CLOUDFLARE_ANALYTICS_TOKEN`** (só leitura de Analytics, só esta conta, com validade): mesmo caminho do token acima, com o nome `github-actions-blog-analytics`, **Permissions:** `Account` · `Account Analytics` · `Read` e **Account Resources:** `Include` · a sua conta. Grave com `gh secret set CLOUDFLARE_ANALYTICS_TOKEN`. O **Account ID** fica em Cloudflare → domínio → **Overview** → bloco **API** (não é segredo): `gh variable set CLOUDFLARE_ACCOUNT_ID --body "<account-id>"`. Teste local opcional: `CLOUDFLARE_ANALYTICS_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... make visualizacoes` (não salve o token em arquivo).

**Achar o `CLOUDFLARE_ZONE_ID`:** Cloudflare → domínio `aeciopires.com` → **Overview** → coluna da direita, bloco **API** → *Zone ID* (não é segredo). Gravar: `gh variable set CLOUDFLARE_ZONE_ID --body "<zone-id>"` ou Settings → Secrets and variables → Actions → aba *Variables*.

**Depois da virada:** `gh variable set DOMINIO_ATIVO --body true` e `gh variable set MIGRACAO_CONCLUIDA --body true`. Conferir: `gh secret list` e `gh variable list`.
`gh variable` exige gh ≥ 2.31 (o pacote do Ubuntu 22.04 é 2.4); sem ele, usar o site (Settings → Secrets and variables → Actions) ou `gh api repos/aeciopires/blog-aeciopires/actions/variables`.

**Atenção na virada:** o `baseURL` do build vem do `actions/configure-pages`, que só passa a usar o domínio depois do *Custom domain* configurado. Rodar um novo deploy logo após configurar o domínio (Actions → *Deploy* → *Run workflow*) e limpar o cache do Cloudflare; senão o HTML continua com o prefixo `/blog-aeciopires/` e CSS/JS dão 404.

## 10. Calendário de manutenção

| Frequência | Tarefa |
|---|---|
| Semanal | Moderar comentários do giscus (e-mails de Discussions); olhar falhas de workflow |
| A cada PR do Dependabot | Ler o changelog da action, deixar o `pr-check` rodar e fazer merge |
| Mensal | `make check-updates` (só **ver**); alertas de segurança do GitHub; `make check-links-online`; SSL Labs e securityheaders.com (seção 9, "Checagens externas"), anotando nota e data |
| Trimestral | `make tags-report` + `make merge-tag` nas tags fracas; `make audit-content` + skill `revisar-conteudo` nos 5 posts mais lidos e nos 5 mais antigos; eventos do WAF, cache e relatórios da CSP; limites do plano Free |
| Quando sair versão do Hugo ou do Blowfish | Skill `atualizar-site` ou `make update-theme`; notas de migração; `hugo --logLevel info`; conferir os overrides (incluindo a ordenação da home, seção 8); `make serve` (claro/escuro/celular) e `make validate` antes do PR |
| Toda segunda (automático) | O `deploy.yml` republica o site às 09:15 UTC para atualizar "Mais lidos"/"Menos lidos" da home. Se o passo "Visualizações por página" falhar, ver seção 8 ("Janela de dados" e "Se a API do Cloudflare mudar") |
| 1º de janeiro (automático) | O `deploy.yml` republica o site às 03:05 UTC para atualizar os anos calculados na home ("há N anos" na chamada da home). Conferir em Actions que rodou; se o repositório ficou 60 dias sem atividade, o GitHub desativa o agendamento: reative em Actions → Deploy → *Enable workflow* ou rode *Run workflow* |
| Anual | Rotacionar os tokens do Cloudflare (purge e analytics); revisar permissões do app giscus; revisar `CLAUDE.md`, `README.md`, `docs/*.md`, página Créditos e `assets/img/logos/SOURCES.md` |
| Sempre que o `origin-cert.yml` falhar | Contingência em [cloudflare.md](cloudflare.md) |

## 11. Troubleshooting

| Problema | Causa provável | Ação |
|---|---|---|
| Erro 526 | Certificado da origem | [cloudflare.md](cloudflare.md), contingência do certificado |
| Conteúdo antigo após o deploy | O purge falhou | Purge manual no painel do Cloudflare |
| Build falha após atualização | *Deprecation* do Hugo ou do Blowfish | Ler as notas de versão; `hugo --logLevel info` |
| Hugo avisa versão fora da faixa | Hugo e tema desalinhados | Alinhar com a seção 7 |
| `themes/blowfish` vazio | Clone sem submódulo | `git submodule update --init` |
| Skill `blowfish` não aparece | Link simbólico não foi seguido | `make skill-sync` (ou `COPY=1`) |
| `mise` não encontrado | Shell não ativado | Ativar o mise no shell |
| `mise.toml` não confiável | Primeira vez no clone | `mise trust` |
| *Live reload* não funciona no macOS | Eventos de arquivo não atravessam o Colima | Usar `make serve-docker` (já usa `--poll`) ou `make serve` nativo |
| Porta 1313 ocupada | Outro processo usando a porta | Liberar a porta |
| `check-tags` falha | Tag fora do registro ou sinônimo | `make fix-tags` ou `make new-tag` |
| "Raw HTML omitted" no build | HTML cru no Markdown | Trocar por shortcode do Blowfish |
| Post não aparece (404 na página e fora da home/lista), mas aparece no `make serve` | Rascunho (`draft: true`): o `make serve-prod` e o deploy não geram rascunhos | `make list-drafts`; para publicar, `make publish-post SLUG=… DATE=now` e push. Para só revisar, use `make serve` |
| Post não aparece nem no `make serve` | Data no futuro (`buildFuture = false` em `hugo.toml`), por exemplo fuso errado na `date` | `mise exec -- hugo list future`; corrigir a `date` (com `-03:00`) ou usar `make publish-post SLUG=… DATE=now` |
| Feed antigo não redireciona | Regras R1/R2 | [cloudflare.md](cloudflare.md) |
| giscus não carrega | IDs vazios, CSP sem `giscus.app` ou app desinstalado | Preencher `[giscus]`, corrigir a CSP ou reinstalar o app |
| Página de lista com nome em inglês (ex.: "categories", "series") | Falta `content/<taxonomia>/_index.md` | Criar com `title` em pt-BR (ver seção 3, "Páginas de lista") |
| Caixas saindo da borda no celular | Largura fixa em px numa grade ou flex | Trocar por colunas fluidas (`minmax(0, 1fr)`, `width: 100%`) e conferir nas larguras da seção 4 |
| Número de repositórios na home desatualizado | Hook não ativado, commit com `GITHUB_REPOS_SKIP=1`, sem rede ou nenhum commit desde a mudança no GitHub | `make install-hooks` (uma vez) ou `make github-repos` e commitar `data/github.json` |
| Formulário de contato some (ícone de página quebrada no lugar) | A CSP bloqueou o iframe do Jotform (`form.jotform.com`, ou outro domínio novo do Jotform) | DevTools → Console mostra o domínio recusado; incluir em `frame-src` ([cloudflare.md](cloudflare.md), seção 5) |
| `check-home` falha depois de atualizar o Blowfish | O HTML do card do tema mudou | Seção 8, "Ao atualizar o Blowfish ou o Hugo", item 2 |
| Lighthouse pior no `make serve-prod` que no site | O servidor do Hugo não minifica nem comprime | Medir no site publicado (seção 4) |
| Tema do giscus não troca | Script de observação da classe `dark` | Revisar `assets/js/giscus.js` |

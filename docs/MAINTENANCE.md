# Manual de operação e manutenção

Como manter o blog em constante evolução, seguindo boas práticas, oferecendo o melhor ao leitor e com segurança para você. Arquitetura: [ARCHITECTURE.md](ARCHITECTURE.md). Cloudflare: [cloudflare.md](cloudflare.md).

## 1. Primeiros passos (uma vez por máquina)

```bash
git clone --recurse-submodules git@github.com:aeciopires/blog-aeciopires.git
cd blog-aeciopires
make check-deps      # diagnóstico, não altera nada
make install-deps    # mise + ferramentas + submódulo do tema + skill
make install-hooks   # pre-commit: segredos/chaves/e-mail (todo commit) + check-tags e lint-md nos .md alterados
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
| Imagens | `optimize-images` | `make optimize-images` |
| Qualidade | `lint-md` / `lint-md-fix` | `make lint-md` |
| | `validate` | `make validate` (check-secrets, lint-md, check-tags, build, validate-links, actionlint, shellcheck, compare-urls) |
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
| Ver rascunhos | `make list-drafts` |
| Imagens | No *page bundle*: `feature.*` = imagem destacada; texto alternativo em todas; `make optimize-images` antes do commit |
| Categorias e tags | Só as registradas em `data/taxonomia.yaml` (1 a 5 tags por post). Tag nova: `make new-tag`; sinônimo: `make fix-tags`; unir: `make merge-tag`. O `make check-tags` bloqueia o que estiver fora do padrão |
| Diagramas em posts | Shortcode `{{</* mermaid */>}}` do Blowfish |
| Novos embeds | Shortcodes do Blowfish. Se envolver um novo domínio, **atualizar a CSP** ([cloudflare.md](cloudflare.md)) antes |
| Banner de tecnologias | `data/tecnologias.yaml` + logo oficial em `assets/img/logos/` + linha em `assets/img/logos/SOURCES.md` |

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
| Ambiente isolado / sem mise | `make serve-docker` |
| Mesma validação da CI | `make lint-md validate` |
| Diagramas da documentação | `make validate-diagrams` |

O que olhar no navegador:

- home, um post longo, `/tags/`, `/posts/` e Contato;
- botão claro/escuro (a primeira visita abre escura, como no blowfish.page);
- largura de celular (DevTools, 390 px);
- busca (`Ctrl K`);
- comentários: o giscus só carrega com `repoId`/`categoryId` preenchidos e no domínio real; localmente aparece só a parte arquivada.

## 5. Manter o conteúdo atualizado e verificado

1. `make audit-content` (todo o site ou `SLUG=…`) e ler `reports/content-audit.md`.
2. Para validar contra fontes oficiais e atualizar, pedir ao Claude Code, por exemplo:
   - "Use a skill revisar-conteudo no post helm-chart-zabbix-8-0-0";
   - "Use a skill revisar-conteudo nos 5 posts mais antigos".
3. Revisar o PR proposto: a tabela "antes, depois e fonte oficial", o `make serve` e o `make validate`.
4. Links externos: `make check-links-online` mensal. Para link morto, trocar pela fonte oficial atual ou pelo Wayback Machine.

## 6. Usar as skills do Claude Code

| Skill | Quando usar | Exemplo de pedido |
|---|---|---|
| `blowfish` | Qualquer mudança de tema, configuração, layout, shortcode ou front matter | "Usando a skill blowfish, adicione uma série 'Helm Chart do Zabbix' aos 4 posts" |
| `revisar-conteudo` | Atualizar posts com base em fontes oficiais | "Revise o post X com a skill revisar-conteudo" |
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
| Busca (termos em qualquer ordem, sem acento, tolerância a erro) | `assets/js/busca.js`: só ajusta as opções da Fuse.js do tema (`useTokenSearch`, `tokenMatch: "all"`, `ignoreDiacritics`, `threshold: 0.15`), sem copiar o `search.js`. Mais tolerância (0.2+) acha "zabix", mas faz "istio" casar com "isto". Após atualizar o Blowfish, conferir se o tema ainda usa `new Fuse(...)` e se a Fuse.js é ≥ 7.5 |
| Logos pequenos dentro de posts | `{{< figure src="logo.svg" alt="Logo do X" figureClass="logo-post" nozoom=true >}}`: 80 px de altura, vários lado a lado (classe `logo-post` em `assets/css/custom.css`) |
| Blocos de código sem barra de rolagem | Fim de `assets/css/custom.css`: linhas longas quebram só na exibição (`pre-wrap`); copiar traz o comando original, sem `\` extra. Para voltar à rolagem horizontal, remova esse bloco |
| Cores, vidro, banner, nuvem | `assets/css/custom.css` (cores do esquema nativo `blowfish` via `--color-*`; não criar esquema próprio sem necessidade) |
| Parâmetros do tema | `config/_default/params.toml`, conferindo a documentação da versão fixada |
| Comportamento de layout | Override em `layouts/partials/` ou shortcode em `layouts/shortcodes/`; **nunca** editar `themes/blowfish/` |
| Textos do tema | `i18n/pt-BR.yaml` (só as chaves que mudam) |
| Novo serviço de terceiros | Avaliar privacidade e segurança → CSP → [cloudflare.md](cloudflare.md) → página Privacidade → `CLAUDE.md` se virar regra |
| Mudança de arquitetura | [ARCHITECTURE.md](ARCHITECTURE.md) (diagramas) + registro da decisão em `PLANS/<nome>/` |

Peças próprias do site:

| Arquivo | Para quê |
|---|---|
| `layouts/shortcodes/blog-chamada.html` | Chamada da home (eyebrow, título, botões) |
| `layouts/shortcodes/blog-stats.html` | Números da home, calculados no build |
| `layouts/shortcodes/tecnologias.html` | Banner "Stacks que uso no dia a dia" |
| `layouts/shortcodes/nuvem-tags.html` + `layouts/partials/tag-cloud.html` | Nuvem de tags (home e `/tags/`) |
| `layouts/tags/terms.html` | Página `/tags/` com nuvem e lista A–Z (override do tema) |
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
  1. *pre-commit* (`make install-hooks`), em todo commit: gitleaks nas mudanças staged (tokens, chaves privadas, senhas), arquivos sensíveis (`.env`, `*.pem`, `*.key`, `id_rsa`, `credentials.json`, `.claude/settings.local.json`…) e o e-mail do autor (lido de `git config user.email` e de `git config --get-all hooks.emailbloqueado`, para não ficar escrito no repositório).
  2. CI (`pr-check.yml` → `make check-secrets`): gitleaks no histórico completo; pega o que passou com `--no-verify`.
  3. GitHub *secret scanning* + *push protection*: recusa o push de segredos conhecidos.
- **Falso positivo do gitleaks:** confira se é mesmo exemplo/placeholder; então adicione uma exceção bem delimitada em `.gitleaks.toml` (ou `gitleaks:allow` na linha). **Segredo real que vazou:** revogue/rotacione primeiro, depois remova do histórico.
- **Workflows:** actions por SHA, com `permissions` mínimas.
- **Hugo:** `security` em `hugo.toml` restrito (`http.urls` só `api.github.com/repos/`); `unsafe = false`.
- **Navegador do leitor:** CSP, HSTS e demais headers ([cloudflare.md](cloudflare.md)); qualquer novo script ou iframe exige atualizar a CSP primeiro, em modo *Report-Only*.
- **Comentários:** moderação semanal; *interaction limits* em ondas de spam; nunca renderizar HTML vindo de comentários.
- **Conteúdo:** exemplos sem credenciais, IPs internos ou dados pessoais. Revisar *screenshots* antes de publicar. Nunca publicar o e-mail do autor.
- **Privacidade:** página Privacidade atualizada sempre que entrar ou sair um serviço de terceiros.

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

**Criar o `CLOUDFLARE_API_TOKEN`** (só *Cache Purge*, só esta zona, com validade):

1. Cloudflare → ícone do perfil → **My Profile → API Tokens → Create Token → Create Custom Token**.
2. Nome: `github-actions-blog-purge`. **Permissions:** `Zone` · `Cache Purge` · `Purge`. **Zone Resources:** `Include` · `Specific zone` · `aeciopires.com`.
3. **TTL:** data de término (ex.: 1 ano) e anote no calendário (seção 10, rotação anual). Opcional: *Client IP Address Filtering* não se aplica (runners do GitHub mudam de IP).
4. **Continue to summary → Create Token** e copie o valor (aparece uma vez só).
5. Grave no GitHub sem deixar o valor no histórico do shell: `gh secret set CLOUDFLARE_API_TOKEN` (o `gh` pede o valor) ou Settings → Secrets and variables → Actions → *New repository secret*.

**Achar o `CLOUDFLARE_ZONE_ID`:** Cloudflare → domínio `aeciopires.com` → **Overview** → coluna da direita, bloco **API** → *Zone ID* (não é segredo). Gravar: `gh variable set CLOUDFLARE_ZONE_ID --body "<zone-id>"` ou Settings → Secrets and variables → Actions → aba *Variables*.

**Depois da virada:** `gh variable set DOMINIO_ATIVO --body true` e `gh variable set MIGRACAO_CONCLUIDA --body true`. Conferir: `gh secret list` e `gh variable list`.
`gh variable` exige gh ≥ 2.31 (o pacote do Ubuntu 22.04 é 2.4); sem ele, usar o site (Settings → Secrets and variables → Actions) ou `gh api repos/aeciopires/blog-aeciopires/actions/variables`.

**Atenção na virada:** o `baseURL` do build vem do `actions/configure-pages`, que só passa a usar o domínio depois do *Custom domain* configurado. Rodar um novo deploy logo após configurar o domínio (Actions → *Deploy* → *Run workflow*) e limpar o cache do Cloudflare; senão o HTML continua com o prefixo `/blog-aeciopires/` e CSS/JS dão 404.

## 10. Calendário de manutenção

| Frequência | Tarefa |
|---|---|
| Semanal | Moderar comentários do giscus (e-mails de Discussions); olhar falhas de workflow |
| A cada PR do Dependabot | Ler o changelog da action, deixar o `pr-check` rodar e fazer merge |
| Mensal | `make check-updates` (só **ver**); alertas de segurança do GitHub; `make check-links-online` |
| Trimestral | `make tags-report` + `make merge-tag` nas tags fracas; `make audit-content` + skill `revisar-conteudo` nos 5 posts mais lidos e nos 5 mais antigos; eventos do WAF, cache e relatórios da CSP; limites do plano Free |
| Quando sair versão do Hugo ou do Blowfish | Skill `atualizar-site` ou `make update-theme`; notas de migração; `hugo --logLevel info`; `make serve` (claro/escuro/celular) e `make validate` antes do PR |
| 1º de janeiro (automático) | O `deploy.yml` republica o site às 03:05 UTC para atualizar os anos calculados na home ("há N anos", "anos de blog"). Conferir em Actions que rodou; se o repositório ficou 60 dias sem atividade, o GitHub desativa o agendamento: reative em Actions → Deploy → *Enable workflow* ou rode *Run workflow* |
| Anual | Rotacionar o token do Cloudflare; revisar permissões do app giscus; revisar `CLAUDE.md`, `README.md`, `docs/*.md`, página Créditos e `assets/img/logos/SOURCES.md` |
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
| Feed antigo não redireciona | Regras R1/R2 | [cloudflare.md](cloudflare.md) |
| giscus não carrega | IDs vazios, CSP sem `giscus.app` ou app desinstalado | Preencher `[giscus]`, corrigir a CSP ou reinstalar o app |
| Tema do giscus não troca | Script de observação da classe `dark` | Revisar `assets/js/giscus.js` |

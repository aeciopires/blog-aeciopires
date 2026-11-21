# Manual de operação e manutenção

Como manter o blog em constante evolução, seguindo boas práticas, oferecendo o melhor ao leitor e com segurança para você. Arquitetura: [ARCHITECTURE.md](ARCHITECTURE.md). Cloudflare: [cloudflare.md](cloudflare.md).

## 1. Primeiros passos (uma vez por máquina)

```bash
git clone --recurse-submodules git@github.com:aeciopires/blog-aeciopires.git
cd blog-aeciopires
make check-deps      # diagnóstico, não altera nada
make install-deps    # mise + ferramentas + submódulo do tema + skill
make install-hooks   # pre-commit: repositórios do GitHub (data/github.json) + segredos/chaves/e-mail (todo commit) + versão em inglês em dia + check-tags e lint-md nos .md alterados
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
| Inglês (en-US) | `i18n-status` / `check-i18n` | `make i18n-status` (falta, desatualizada, rascunho) · `make check-i18n` (bloqueia no pre-commit e na CI) |
| | `i18n-diff` / `i18n-ok` | `make i18n-diff SLUG=meu-post` (o que mudou no pt-BR) · `make i18n-ok SLUG=meu-post` (valida e carimba) |
| | `check-correcoes` | `make check-correcoes` (correções feitas pela IA no conteúdo, em `reports/correcoes-conteudo-*.md`, ainda não conferidas: bloqueia o commit daquele conteúdo) |
| | `test-idioma` | `make test-idioma` (Docker: redirecionamento pelo idioma do navegador, seletor e CSP oficial; a cada versão do Hugo/Blowfish) |
| | `i18n-sync-fm` / `prosa-en` | `make i18n-sync-fm SLUG=meu-post` (copia tags, datas e draft do pt-BR) · `make prosa-en SLUG=meu-post` |
| Dados | `github-repos` | `make github-repos` (o pre-commit já roda) |
| Imagens | `optimize-images` | `make optimize-images` |
| Qualidade | `lint-md` / `lint-md-fix` | `make lint-md` |
| | `validate` | `make validate` (check-secrets, lint-md, check-tags, check-i18n, check-correcoes, build, validate-links, check-home, actionlint, shellcheck, compare-urls) |
| | `check-home` | `make build check-home` (home leve de cada idioma: cards, JSON com SRI, URLs e fidelidade ao card do tema; seção 8) |
| | `lighthouse` | `make lighthouse [URL=…]` (Docker; site publicado; seção 4) |
| | `lighthouse-local` | `make lighthouse-local [PAGINAS="/ /en/ /slug/ /en/slug/"]` (Docker; build de produção local, antes do commit; seção 4) |
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
| Novo post | `make new-post SLUG=… TITLE="…"` → escrever → **traduzir** (skill `traduzir-conteudo`) → `make serve` → `make lint-md validate` → `make publish-post SLUG=… DATE=now` (publica os dois idiomas; recusa sem a tradução em dia) → push/PR |
| Nova página | `make new-page SLUG=… TITLE="…"` → menu em `config/_default/menus.pt-br.toml` **e** `menus.en.toml` (se aplicável) → mesmo fluxo |
| Editar post | Editar → atualizar `lastmod` → se a mudança for relevante, `make aviso-atualizacao SLUG=… RESUMO="…" RESUMO_EN="…"` → atualizar a tradução (`make i18n-diff SLUG=…`, skill `traduzir-conteudo`, `make i18n-ok SLUG=…`). O commit é bloqueado enquanto a tradução estiver desatualizada |
| Despublicar (rascunho) | `make unpublish-post SLUG=…` / `make unpublish-page SLUG=…`. Some do site, continua no `make serve`. **O repositório é público**: para rascunho realmente privado, `PRIVATE=1` |
| Republicar | `make publish-post SLUG=…` / `make publish-page SLUG=…` (traz de volta de `_privado/`, se for o caso) |
| Remover de vez | `make rm-post SLUG=… REDIRECT=<outro-slug> CONFIRM=sim` (ou `rm-page`). Sempre preferir despublicar ou redirecionar a deixar 404 |
| Renomear slug | **Evitar.** Se inevitável, `aliases: ["/slug-antigo/"]` no front matter |
| Ver rascunhos | `make list-drafts` (posts com data no futuro: `mise exec -- hugo list future`) |
| Imagens | No *page bundle*: `feature.*` = imagem destacada; texto alternativo em todas; `make optimize-images` antes do commit |
| Categorias e tags | Só as registradas em `data/taxonomia.yaml` (1 a 5 tags por post). Tag nova: `make new-tag`; sinônimo: `make fix-tags`; unir: `make merge-tag`. O `make check-tags` bloqueia o que estiver fora do padrão |
| Diagramas em posts | Shortcode `{{</* mermaid */>}}` do Blowfish |
| Novos embeds | Shortcodes do Blowfish. Se envolver um novo domínio, **atualizar a CSP** ([cloudflare.md](cloudflare.md)) antes |
| Banner de tecnologias | `data/tecnologias.yaml` + logo oficial em `assets/img/logos/` + linha em `assets/img/logos/SOURCES.md`. No build, PNG/JPG viram WebP de no máximo 144×72 (2× a placa, `Fit`: proporção e cores mantidas) e SVG ganha hash no nome; o arquivo oficial fica intacto em `assets/`. Nome longo que quebra feio no celular: campo opcional `legenda` com hífen opcional, ex.: `legenda: "Victoria\u00ADMetrics"` (no celular estreito vira "Victoria-/Metrics"; o `nome` continua no `alt` e no `title`) |
| Links nos posts | Externos (`http://`/`https://`) abrem **sozinhos** em nova aba: o Blowfish adiciona `target="_blank" rel="noreferrer"` (`article.externalLinkForceNewTab`, ligado por padrão; desligar num post: `externalLinkForceNewTab: false` no front matter). Links internos: caminho relativo (`/slug/`) ou `{{</* ref */>}}`, nunca `https://blog.aeciopires.com/...` (abriria em nova aba). Não escreva `target` à mão: HTML cru é omitido |
| Páginas de lista (Categorias, Tags, Posts) | O título vem de `content/<seção ou taxonomia>/_index.md` (`title` em pt-BR) e de `_index.en.md` (inglês). Sem esse arquivo, o Hugo usa o nome interno em inglês (era o caso de `/categories/`). Taxonomia nova: criar os dois. Página de termo criada por `make merge-tag`/`fix-tags` já ganha a versão `_index.en.md` |
| Versão em inglês | Seção "Versão em inglês (en-US)" abaixo |

Notas:

- **Despublicar ≠ remover.** O Hugo não gera rascunhos em produção: a página some do site, do RSS, do sitemap e da busca no próximo deploy (que também limpa o cache). O tópico do giscus fica no GitHub e volta se o conteúdo for republicado.
- **`PRIVATE=1`** move o *bundle* para `_privado/` (no `.gitignore`), visível só no `make serve` (mount em `config/development/module.toml`). **Faça backup próprio** dessa pasta. O que já foi commitado continua no histórico do git.
- **`rm-*`** recusa se houver alterações não commitadas, lista os links que vão quebrar e lembra de travar a discussão do giscus.
- **HTML cru** no Markdown é omitido (`unsafe = false`). Use os shortcodes do Blowfish.

### Versão em inglês (en-US)

O blog tem duas versões: **pt-BR** (padrão, na raiz, fonte do conteúdo; URLs do WordPress intactas) e **en-US** em `/en/` (`/en/<slug>/`, `/en/tag/<x>/`, `/en/posts/`). O seletor de idioma é o do próprio Blowfish (ícone de idioma no cabeçalho, no computador e no celular), sem override, e funciona nos modos claro e escuro. O **redirecionamento automático pelo idioma do navegador** está ligado (seção "Redirecionamento pelo idioma do navegador", abaixo): quem abre a home com o navegador em inglês vai para `/en/`; a escolha feita no seletor fica lembrada e vence o idioma do navegador.

**A tradução é feita só localmente, antes do commit**, por IA local: a skill `traduzir-conteudo` (ou o agente `tradutor-en`, para lotes em paralelo). Nada é traduzido no build, no deploy nem no navegador; as traduções são arquivos versionados:

| Original (pt-BR) | Tradução | Textos de interface |
|---|---|---|
| `content/posts/<slug>/index.md` | `content/posts/<slug>/index.en.md` | Layouts próprios: chaves `blog.*` em `i18n/pt-BR.yaml` e `i18n/en.yaml` |
| `content/<pagina>/index.md` | `content/<pagina>/index.en.md` | Menus: `config/_default/menus.pt-br.toml` e `menus.en.toml` (mesmos itens) |
| `content/**/_index.md` | `content/**/_index.en.md` | Site: `config/_default/languages.{pt-br,en}.toml` (título, descrição, bio) |

Imagens do bundle são compartilhadas (não duplique). Nome, foto e perfis do autor ficam em `[author]` de `params.toml` (valem para os dois idiomas).

**Garantia (`scripts/i18n.mjs`, `make check-i18n`)**, rodada no pre-commit (quando o commit mexe em `content/`, `i18n/` ou menus), no `make validate`, no `pr-check` e no deploy. Falha se:

- uma página publicada não tem tradução, ou uma tradução não tem original;
- a tradução está **desatualizada**: o `sourceHash` gravado no `index.en.md` não bate com o hash do pt-BR (título, descrição e corpo). Qualquer mudança no texto pt-BR exige atualizar e carimbar a tradução;
- comandos e links divergem: blocos de código (só linhas que são inteiramente comentário podem ser traduzidas), código em linha, URLs externas, imagens, `src` de shortcodes e `ref` têm de ser **idênticos**; links internos `/slug/` têm de virar `/en/slug/`; mesma sequência de shortcodes e mesma estrutura de títulos;
- o front matter difere nos campos não traduzíveis (slug, date, lastmod, draft, tags, categories, show*); `aliases` e `wp_id` são só do pt-BR;
- `i18n/en.yaml` não tem as mesmas chaves `blog.*` de `i18n/pt-BR.yaml`, os menus divergem, ou um layout (do tema ou próprio) usa uma chave de i18n sem texto em pt-BR ou en (pega chave nova do Blowfish após atualizar).

Rascunhos (`draft: true`) podem ficar sem tradução (aviso). **Conteúdo que já é bilíngue no original** (o mesmo arquivo traz pt-BR e inglês, como `sobre`, os helm charts do Zabbix e do watchdog, a imagem de troubleshooting e os resumos de incidentes da GCP e da AWS) leva `bilingue: true` no front matter e **não tem** `index.en.md` (o check recusa a duplicata): fica só em `/slug/`, links e menus em inglês apontam para lá (`menus.en.toml`: `url = "/sobre/"`). Na versão em inglês ele aparece na home, no total de posts e na busca (com a URL original; `lang.Merge` no `cardview.html` e no `blog-stats.html`, como o `index.json` do tema já faz), mas não em `/en/posts/` nem nas páginas de tag/categoria em inglês. Assim, quando um comando for testado e corrigido no pt-BR (skill `revisar-conteudo`), a versão em inglês **não passa** no check até receber a mesma correção.

**Correções no original feitas pela IA:** ao traduzir ou revisar, a skill `traduzir-conteudo` (e o agente `tradutor-en`) corrige no pt-BR e na tradução erros de gramática, digitação, Markdown quebrado e comandos/textos que contradizem o próprio post, e registra **cada correção** (e o que deixou PENDENTE para você decidir) em `reports/correcoes-conteudo-AAAA-MM-DD.md` (ignorado pelo Git), uma linha `- [ ]` por item. Antes do commit, confira cada item (`git diff`), desfaça o que não concordar e marque `- [x]`. O pre-commit e o `make validate` rodam `make check-correcoes` e **bloqueiam** o commit de um conteúdo com item ainda `- [ ]`.

**Fluxo:**

1. `make i18n-status` → o que falta ou está desatualizado.
2. Peça ao Claude Code: "Use a skill traduzir-conteudo no post X" (ou "traduza o que estiver pendente").
3. Para uma página já traduzida, `make i18n-diff SLUG=…` mostra só o que mudou no pt-BR desde a última tradução.
4. `make i18n-sync-fm SLUG=…` (campos mecânicos do front matter), `make i18n-ok SLUG=…` (confere e carimba), `make prosa-en SLUG=…` (gramática).
5. `make lint-md validate`, `make serve` → `/en/<slug>/`.

Ferramentas mecânicas já tratam os dois idiomas: `make publish-*`/`unpublish-*` mudam `draft`/`date`/`lastmod` nos dois arquivos (publicar recusa sem a tradução em dia), `make rm-* REDIRECT=` cria o alias nos dois (no `index.en.md`, `"/slug/"` vira `/en/slug/`), as tags (`fix-tags`, `merge-tag`, `rm-tag`) mudam os dois arquivos e `make aviso-atualizacao … RESUMO_EN="…"` põe o aviso "Updated on Month D, YYYY" com o mesmo `lastmod`.

**SEO:** cada página traz `<link rel="alternate" hreflang="pt-BR|en-US">` para as duas versões (tema), `<html lang>` do idioma e canonical próprio. O `/sitemap.xml` vira um índice que aponta para `/pt-br/sitemap.xml` e `/en/sitemap.xml` (o Hugo também gera `/pt-br/`, que redireciona para `/`). Feeds: `/index.xml` (pt-BR) e `/en/index.xml` (inglês), além dos de seção e termo (`/en/posts/index.xml`, `/en/tag/<x>/index.xml`). Search Console: [cloudflare.md](cloudflare.md), seção 10.

### Redirecionamento pelo idioma do navegador

| Peça | Papel |
|---|---|
| `params.toml`, `[languageRedirect]` | `enabled = true`; `browserRedirectHomeOnly = true` (só a home redireciona pelo idioma do navegador); `storedLanguageRedirect = true` (a escolha no seletor fica no `localStorage` do leitor, chave `blowfish_preferred_language`, e vale em todas as páginas); sem `fallbackLanguage`: navegador em outro idioma (ex.: espanhol) fica no pt-BR |
| `layouts/partials/language-redirect.html` | **Override** do partial do tema (v3.10.0). O tema escreve a configuração num `<script>` inline que muda em cada página: a CSP (sem `'unsafe-inline'`) bloquearia, e uma exceção por hash não é viável (um hash por página). O override passa a mesma configuração no atributo `data-config` |
| `assets/js/idioma-config.js` | Concatenado **antes** do `assets/js/language-redirect.js` do tema num só arquivo (`js/idioma.<hash>.js`, SRI, `async`: síncrono, como no tema, bloqueava a renderização e o FCP no celular ia de 1,2 s para 1,4 s): lê o `data-config`, entrega ao código do tema e desliga o redirecionamento para robôs (Googlebot, Bingbot…), Lighthouse e navegadores automatizados, para a home `/` continuar indexada em pt-BR. Só aceita caminhos do próprio site |
| `layouts/partials/extend-head-uncached.html` | `<link rel="alternate" hreflang="x-default">` para a versão pt-BR (recomendado pelo Google quando há redirecionamento por idioma) |
| `scripts/check-home.mjs` (`make validate`) | Confere no build: nenhum script inline com a configuração, script com SRI, `data-config` JSON válido com caminhos do site, `x-default` |
| `scripts/i18n.mjs` (`make check-i18n`) | Guarda o sha256 do `language-redirect.html` e do `language-redirect.js` do tema (`TEMA_IDIOMA`) e **falha** quando o Blowfish os muda |
| `make test-idioma [URL=https://blog.aeciopires.com]` (`scripts/test-idioma.sh` + `docker/lighthouse/idioma.mjs`) | Com `URL=`, os mesmos cenários no site **publicado**, com a CSP real do Cloudflare (rodar depois do deploy). Sem `URL=`: build de produção + Chromium (imagem do Lighthouse) com a **CSP oficial** desta documentação ([cloudflare.md](cloudflare.md), seção 5) aplicada: navegador en → `/en/`; pt, pt-PT e es ficam no pt-BR; só a home redireciona; Googlebot e Lighthouse não são redirecionados; a escolha no seletor vence e vale nas outras páginas; seletor presente; zero violações da CSP |

**CSP e Cloudflare:** nada a mudar. Como a configuração deixou de ser inline e o script vem do próprio site com SRI, a CSP atual já permite (`script-src 'self'`); o `make test-idioma` prova isso. Nenhuma regra do Cloudflare depende do idioma. **Não** acrescente `'unsafe-inline'` em `script-src` para "resolver" o redirecionamento.

**A cada versão nova do Blowfish ou do Hugo:**

1. `make check-i18n`: se acusar "language-redirect … mudou no tema", compare o partial e o JS novos do tema com o override (`git -C themes/blowfish diff <tag antiga>..<tag nova> -- layouts/partials/language-redirect.html assets/js/language-redirect.js`; o `make update-theme` já mostra o resumo), traga as mudanças da configuração (`$config`) para `layouts/partials/language-redirect.html` e confira se o JS do tema ainda lê `window.BlowfishLanguageRedirectConfig` e o clique em `.translation a[href]`;
2. `make test-idioma` e `make build check-home` verdes (depois do deploy, `make test-idioma URL=https://blog.aeciopires.com`);
3. atualize os dois sha256 em `TEMA_IDIOMA` (`scripts/i18n.mjs`) com `sha256sum themes/blowfish/layouts/partials/language-redirect.html themes/blowfish/assets/js/language-redirect.js`;
4. se o tema passar a carregar a configuração sem script inline, apague o override e o `idioma-config.js` (e ajuste o `check-home`).

**Comentários:** uma discussão do giscus por post, compartilhada pelos dois idiomas (mapping `specific` com o caminho do pt-BR, o mesmo termo que o mapping antigo usava). Os comentários arquivados aparecem nos dois idiomas, em português.

**"Mais lidos":** a ordem soma as visitas das duas versões de cada post, então é a mesma nos dois idiomas.

**Ao atualizar Hugo ou Blowfish**, quase nada muda por causa do inglês: não há override do seletor de idioma, do hreflang nem do sitemap. O `make update-theme` mostra o diff desses arquivos do tema e o `make validate` roda o `check-i18n` (chaves novas sem texto) e o `check-home` dos dois idiomas. Conferir no navegador o seletor de idioma (computador e celular, claro e escuro).

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
| Escrever com *live reload* (mostra rascunhos) | `make serve` (inglês em `http://localhost:1313/en/`) |
| Ver exatamente como o leitor verá (sem rascunhos, modo produção, sem analytics) | `make serve-prod` |

**Lighthouse antes do commit:** `make lighthouse-local PAGINAS="/ /en/ /<slug>/ /en/<slug>/"` gera o build de produção em `reports/lighthouse/site/` (sem o beacon do Cloudflare) e o mede dentro do container, servido com gzip e cache longo como no Cloudflare. Use para comparar pt-BR e en-US e para medir uma mudança antes de publicar. Medição de 21/11/2026 (Lighthouse 13.6.0, celular e computador), antes e depois da versão em inglês, em `/`, `/primeiros-passos-com-docker/`, `/posts/`, `/sobre/`, `/tags/` e nas versões `/en/` correspondentes (mais `/instalando-o-go/` e `/en/category/go/`): **antes** Performance 99–100, Acessibilidade 100, Boas práticas 100, SEO 100; **depois**, pt-BR e en-US, Performance 100, Acessibilidade 100, Boas práticas 100, SEO 100. Únicas exceções, iguais antes e depois e nos dois idiomas: Boas práticas 96 no `/sobre/` no celular ("imagem com baixa resolução", a foto do autor) e Agentic Browsing 50 no celular (menu do tema, ver abaixo). Cuidado próprio do inglês: o Lighthouse trata textos de link como "here", "more", "read more" e até "Go" como genéricos e tira 8 pontos do SEO; por isso a categoria Go aparece como "Golang" em inglês (`content/categories/go/_index.en.md` e `nome_en` em `data/tecnologias.yaml`) e o `make i18n-ok` recusa esses textos. Com o redirecionamento pelo idioma do navegador ligado (script `async`), as notas ficaram iguais (FCP 1,2 s, sem recurso bloqueante novo).

**Lighthouse depois da versão em inglês (21/11/2026, site publicado, deploy `44929679151`, Lighthouse 13.6.0):** `/`, `/en/`, `/primeiros-passos-com-docker/`, `/en/primeiros-passos-com-docker/`, `/posts/`, `/en/posts/`, `/en/tags/` e `/en/conhecendo-o-hashicorp-vault/`, celular e computador: **Performance 100, Acessibilidade 100, Boas práticas 100 e SEO 100** em todas (só `/en/` no celular deu Performance 99, variação normal entre medições). Comparação site publicado × build local (`hugo --gc --minify`, 906 arquivos): 897 idênticos; as diferenças são do Cloudflare (*Automatic HTTPS Rewrites* troca `http://` por `https://` em links de 3 posts; *Managed robots.txt*) e o nome do JSON da home, que muda com as visualizações geradas no deploy.

**Lighthouse (21/11/2026, site publicado, Lighthouse 13.6.0):** Performance 100, Acessibilidade 93 (celular) / 96 (computador), Boas práticas 100, SEO 100. As falhas de acessibilidade (contraste de "Ordenar:" e do link no aviso "Atualizado em", botão do menu do celular sem nome) foram corrigidas no PR seguinte; medido no build local: **Acessibilidade 100** nos dois perfis. A categoria nova **Agentic Browsing** (Lighthouse 13) dá 50 no celular porque o tema usa `<label role="button">` no botão do menu (`role` não permitido em `label`); corrigir exige sobrescrever o cabeçalho e o `menu-a11y.js` do tema, então fica como sugestão para o Blowfish. Ganhos de desempenho que dependem de você no Cloudflare: regras C4 e C5 de cache ([cloudflare.md](cloudflare.md), seção 3).

Um post novo continua rascunho (`draft: true`) até o `make publish-post`: aparece no `make serve`, mas **não** no `make serve-prod` (nem a página, nem o card na home). Isso é esperado; veja a seção 11 ("Post não aparece").
| Ambiente isolado / sem mise | `make serve-docker` |
| Mesma validação da CI | `make lint-md validate` |
| Desempenho e acessibilidade (Lighthouse) | `make lighthouse` (Docker; padrão: a home publicada; outra página: `URL=https://blog.aeciopires.com/<slug>/`) → notas e falhas no terminal, relatórios em `reports/lighthouse/`. Ou o PageSpeed Insights. **Não** meça no `make serve`/`serve-prod`: o servidor do Hugo não minifica, não comprime (sem Brotli/gzip), não manda cache e injeta o *live reload* (a home chegava a 454 KB contra 22 KB publicados) |
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
   - `make aviso-atualizacao SLUG=… RESUMO="…" [RESUMO_EN="…"]`: aviso "Atualizado em DD/MM/AAAA" no início do post + `lastmod` (e "Updated on Month D, YYYY" na tradução). O aviso novo entra **acima** dos anteriores, que ficam como histórico; no mesmo dia, substitui o do dia;
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
| `traduzir-conteudo` | Criar ou atualizar a versão em inglês de posts e páginas (antes do commit) | "Use a skill traduzir-conteudo no post X" ou "Traduza o que estiver pendente (make i18n-status)". Muitos posts: ela divide em lotes para o agente `tradutor-en` (`.claude/agents/`) |

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
| Lighthouse (`make lighthouse`) | `lighthouse@13.6.0` sobre `node:26-bookworm-slim` | `LIGHTHOUSE_VERSION`/`NODE_IMAGE` em `scripts/lighthouse.sh` e nos `ARG` de `docker/lighthouse/Dockerfile`; ao mudar, apagar a imagem local `blog-lighthouse:<versão antiga>` |
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
| Textos do tema | `i18n/pt-BR.yaml` e `i18n/en.yaml` (só as chaves que mudam, mais as `blog.*` dos layouts próprios, iguais nos dois arquivos). Hoje: rodapé, título "Mais recentes" da home (`shortcode.recent_articles`), nome do botão de busca (`search.open_button_title`: "Pesquisar: Ctrl K ou /", precisa conter o texto visível "Ctrl K") e os nomes acessíveis que o Blowfish não traduz |
| Links dentro de citações (`> …`) | `assets/css/custom.css`, bloco "Links dentro de citações": sublinhados, porque o tema tira o sublinhado e a cor do link fica parecida com a do texto da citação (o Lighthouse reprovava a acessibilidade, "Links rely on color", em 30 posts) |
| Links dentro de avisos (`alert`) | `assets/css/custom.css`, bloco "Links dentro do shortcode alert": `primary-800` no claro e `primary-200` no escuro (contraste ≥ 7). Depende da classe `bg-primary-100` do alert do tema: conferir a cada atualização |
| Foto do autor | `imageQuality` em `[author]` de `config/_default/params.toml` (85; com 96 a imagem da home tinha o dobro do tamanho sem diferença visível) |
| Acessibilidade do cabeçalho (nomes para leitores de tela) | Os botões de tema e busca usam `footer.dark_appearance`/`footer.light_appearance` e `search.open_button_title`, já traduzidos pelo tema. O botão do menu do celular, o fechar menu e as áreas de navegação usam `nav.main_menu`, `nav.mobile_menu`, `nav.close_menu`, `nav.footer_menu` e `nav.toggle_submenu`, que o Blowfish v3.10.0 **não traduz** para pt-BR (sem elas, o hambúrguer fica sem nome e o Lighthouse reprova). Estão em `i18n/pt-BR.yaml` (e `nav.toggle_submenu` em `i18n/en.yaml`). O `make check-i18n` compara as chaves usadas nos layouts com as do tema e do projeto, nos dois idiomas, e falha se faltar alguma; conferir também no celular (DevTools → Elements → Accessibility) que os botões do cabeçalho têm nome |
| Novo serviço de terceiros | Avaliar privacidade e segurança → CSP → [cloudflare.md](cloudflare.md) → página Privacidade → `CLAUDE.md` se virar regra |
| Mudança de arquitetura | [ARCHITECTURE.md](ARCHITECTURE.md) (diagramas) + registro da decisão em `PLANS/<nome>/` |

### Ordenação dos posts da home

O Blowfish não tem ordenação escolhida pelo leitor: só `list.orderByWeight`, fixo no build. A contagem de leituras do tema (`showViews`) depende do Firebase, um serviço de terceiros, por isso não foi usada. A solução é própria:

| Peça | Papel |
|---|---|
| `layouts/partials/recent-articles/cardview.html` | **Override** do tema (v3.10.0). **Home leve:** o HTML traz só os `homepage.showRecentItems` posts mais recentes (cards do tema), os botões e um `<template data-card-molde>` com um card renderizado pelo tema. Os dados de todos os posts vão para `js/posts-home.<hash>.json` (fingerprint + integridade nos atributos `data-json`/`data-json-integridade`). O JSON é extraído da **saída dos partials do tema** (`article-link/card.html` para a imagem, `article-meta/basic.html` para metadados e chips), então acompanha a configuração e as versões do Blowfish; se a extração falhar, o build emite WARN. Mantém o `.Paginate` do tema para não sumir com `/page/N/` |
| `assets/js/ordenar-home.js` | Na ordem padrão não baixa nada. Ao escolher outra ordem, baixa o JSON uma vez (`fetch` com `integrity`), valida e monta os cards que faltam **clonando o molde** e preenchendo só com `textContent` e URLs validadas. Ativa um botão por vez (`aria-pressed`), troca o título da seção e lembra a escolha (`localStorage`). Falha no JSON (rede, integridade, dados inválidos) → volta para "Mais recentes". Sem JavaScript, os botões não aparecem e a home fica como no tema |
| `scripts/check-home.mjs` + `make check-home` | Roda no `make validate`, no `pr-check` e no deploy: confere os cards da home, o molde, o SRI do JSON, as URLs e compara título, imagem, metadados e chips do JSON com o card do tema em `/posts/` (todos os posts). É o alarme para mudanças do Blowfish |
| `assets/css/custom.css` (bloco "Ordenação dos posts da home") | Visual dos botões nos modos claro e escuro; o rótulo "Ordenar:" é preto no claro e branco no escuro (contraste máximo, exigido pelo Lighthouse). O título da seção ("Mais recentes") vem de `shortcode.recent_articles` em `i18n/pt-BR.yaml` e acompanha o botão escolhido |
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
| `scripts/lighthouse.sh` + `docker/lighthouse/Dockerfile` + `make lighthouse` | Lighthouse em Docker (imagem local `blog-lighthouse:<versão>`, criada na primeira execução a partir da imagem oficial do Node + Chromium do Debian + `lighthouse` do npm, versões fixas). Mede o site publicado nos perfis celular e computador; notas e falhas no terminal, relatórios HTML/JSON em `reports/lighthouse/` (ignorado pelo Git). O `make check-updates` mostra se há versão nova |
| `scripts/github-repos.mjs` + `make github-repos` | Atualiza `data/github.json` pela API REST pública do GitHub (`GET /users/{usuario}`, campo `public_repos`). Roda no pre-commit (`.githooks/pre-commit`, ativado por `make install-hooks`): se o número mudou, o hook inclui `data/github.json` no commit. Sem rede, com timeout de 5 s ou erro da API, mantém o arquivo como está e não bloqueia o commit; para pular, `GITHUB_REPOS_SKIP=1 git commit …`. O deploy não consulta a API: publica o número versionado. O Hugo não consulta a API direto porque `security.http.urls` só libera `/repos/` |
| `layouts/shortcodes/tecnologias.html` | Banner "Stacks que uso no dia a dia" |
| `layouts/shortcodes/nuvem-tags.html` + `layouts/partials/tag-cloud.html` | Nuvem de tags (home e `/tags/`): o tamanho mostra a frequência; o número de posts fica só no `title` e num texto para leitor de tela (classe `tag-cloud__contagem`). A lista "Todas as tags de A a Z" de `/tags/` mantém o número visível (todas têm o mesmo tamanho) |
| `layouts/tags/terms.html` | Página `/tags/` com nuvem e lista A–Z (override do tema) |
| `layouts/partials/recent-articles/cardview.html` + `assets/js/ordenar-home.js` + `scripts/visualizacoes.mjs` | Ordenação dos posts da home (override do tema; ver acima) |
| `layouts/shortcodes/jotform.html` | Formulário de contato |
| `layouts/shortcodes/licenca-blowfish.html` | Texto MIT integral em `/creditos/` |
| `layouts/partials/comments.html` + `assets/js/giscus.js` + `static/giscus/` | Comentários (giscus + arquivados) |
| `layouts/partials/extend-head.html` | Cloudflare Web Analytics (só build de produção) |
| `layouts/partials/extend-head-uncached.html` + `assets/js/legacy-redirect.js` | `/?p=ID` e `/?s=termo` do WordPress. Script `async` (não bloqueia a renderização); só redireciona para caminhos do próprio site |
| `layouts/partials/extend-footer.html` + `i18n/*.yaml` | Aviso de licença no rodapé |
| `scripts/i18n.mjs` + `make check-i18n`/`i18n-*` + `.claude/skills/traduzir-conteudo` + `.claude/agents/tradutor-en.md` | Versão em inglês: garantia de tradução completa, em dia e com os mesmos comandos/links (seção 3, "Versão em inglês") |
| `layouts/partials/language-redirect.html` + `assets/js/idioma-config.js` + `make test-idioma` | Redirecionamento pelo idioma do navegador sem script inline (seção 3) |
| `docker/lighthouse/local.mjs` + `make lighthouse-local` | Lighthouse no build local de produção, servido dentro do container (seção 4) |

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
| Mensal | `make lighthouse` (anotar as notas na seção 4); `make check-updates` (só **ver**); alertas de segurança do GitHub; `make check-links-online`; SSL Labs e securityheaders.com (seção 9, "Checagens externas"), anotando nota e data |
| Mensal | `make i18n-status` (deve dizer "tudo traduzido e em dia"; rascunhos aparecem como aviso); `make lighthouse URL=https://blog.aeciopires.com/en/` |
| Trimestral | `make tags-report` + `make merge-tag` nas tags fracas; `make audit-content` + skill `revisar-conteudo` nos 5 posts mais lidos e nos 5 mais antigos; eventos do WAF, cache e relatórios da CSP; limites do plano Free |
| Quando sair versão do Hugo ou do Blowfish | Skill `atualizar-site` ou `make update-theme`; notas de migração; `hugo --logLevel info`; conferir os overrides (incluindo a ordenação da home, seção 8, e o redirecionamento por idioma, seção 3); `make test-idioma`; `make serve` (claro/escuro/celular) e `make validate` antes do PR |
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
| Commit bloqueado: "versão em inglês ausente, desatualizada…" | O pt-BR mudou e a tradução não acompanhou (ou um comando/link ficou diferente) | `make i18n-diff SLUG=…`, skill `traduzir-conteudo`, `make i18n-ok SLUG=…`. Nunca contornar com `--no-verify`: a CI roda o mesmo check |
| Commit bloqueado: "correções da IA não conferidas" | Itens `- [ ]` em `reports/correcoes-conteudo-*.md` para o conteúdo do commit | Confira cada correção (`git diff`), desfaça o que não concordar e marque `- [x]` |
| `make check-i18n`: "language-redirect … mudou no tema" | Atualização do Blowfish mexeu no redirecionamento por idioma | Seção 3, "Redirecionamento pelo idioma do navegador" (revisar o override, `make test-idioma`, atualizar `TEMA_IDIOMA`) |
| Leitor diz que "caiu no inglês" | Navegador em inglês, na home | Comportamento esperado; o seletor de idioma volta e a escolha fica lembrada |
| `make publish-post` recusa | Falta `index.en.md` ou ele está desatualizado | Traduza (skill `traduzir-conteudo`) e rode de novo |
| `/en/<slug>/` dá 404 | Tradução é rascunho, ou falta o `index.en.md` | `make i18n-status`; o `check-i18n` impede publicar assim |
| `make build` local gerava `robots.txt` com `Disallow: /` | O `[env]` do `mise.toml` (`HUGO_ENVIRONMENT=development`) vencia o `HUGO_ENVIRONMENT=production` de fora do `mise exec` | Corrigido: o Makefile e o `lighthouse.sh` usam `mise exec -- env HUGO_ENVIRONMENT=production hugo …`. O deploy (CI) não era afetado |
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

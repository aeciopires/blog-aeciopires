# CLAUDE.md

## Projeto

- Blog pessoal (pt-BR) em Hugo + tema Blowfish (git submodule em `themes/blowfish`, tag fixada),
  visual T9 (esquema `blowfish`, abre escuro, botão claro/escuro, arte própria como fundo, como o blowfish.page).
- Publicado no GitHub Pages via GitHub Actions, com Cloudflare Free na frente (DNS, proxy, cache, WAF, analytics).
- Domínio: <https://blog.aeciopires.com> — URLs herdadas do WordPress NÃO podem mudar (`config/_default/hugo.toml`, `[permalinks]`).
- Decisões e histórico: `PLANS/blog-migration/PLAN.md` (registro histórico; não reescrever).

## Comandos

- Dependências: `make check-deps`, `make install-deps` (ferramentas via mise; Docker/Colima por fora)
- Rodar: `make serve` (com rascunhos) | `make serve-prod` (como o leitor vê) | `make serve-docker`
- Validar (obrigatório antes de commit): `make lint-md validate`
- Conteúdo: `make new-post|new-page SLUG=`, `make publish-post|publish-page SLUG= [DATE=now]`,
  `make unpublish-post|unpublish-page SLUG= [PRIVATE=1]`, `make rm-post|rm-page SLUG= [REDIRECT=] CONFIRM=sim`
- Tags: `make check-tags`, `make fix-tags`, `make new-tag NAME= DESC=`, `make merge-tag FROM= TO=`, `make tags-report`
- Qualidade: `make audit-content [SLUG=]`, `make check-links-online`, `make validate-diagrams`
- Atualizações: `make check-updates`, `make update-theme TAG=vX.Y.Z`, `make skill-sync`
- Sem mise ativado no shell, prefixe com `mise exec --` (o Makefile já faz isso).

## Skills

- `blowfish` (oficial, link para o submódulo): use para QUALQUER mudança de tema, config, layout, shortcode ou front matter.
- `revisar-conteudo`: validar/atualizar posts contra fontes oficiais (só fontes oficiais; citar URL e data).
- `atualizar-site`: atualizar Hugo, Blowfish, ferramentas do mise e imagens, lendo as notas de versão.
- Docs de referência da versão fixada: <https://gohugo.io/documentation/> e <https://blowfish.page/docs/>

## Conteúdo

- Posts em `content/posts/<slug>/index.md`; páginas em `content/<slug>/index.md`; imagem destacada `feature.*`.
- Front matter obrigatório: title, slug, date (com fuso -03:00), categories, tags, description. Posts migrados têm `wp_id`.
- Mídias antigas em `static/wp-content/uploads/` — não mover nem renomear.
- `markup.goldmark.renderer.unsafe = false`: HTML cru no Markdown é omitido. Use shortcodes.
- Shortcodes permitidos: do Blowfish `alert`, `button`, `figure`, `github`, `mermaid`, `tabs`, `youtubeLite`;
  próprios `jotform`, `blog-chamada`, `blog-stats`, `tecnologias`, `nuvem-tags`, `licenca-blowfish`, `removido` (arquivo/mídia que sumiu da origem: só nome + tooltip).
- Tags e categorias: só as de `data/taxonomia.yaml` (1–5 tags/post). Nunca criar tag sem `make new-tag`;
  trocar sinônimos com `make fix-tags`; `make check-tags` deve passar.
- Atualizar post: `lastmod` + nota "Atualizado em DD/MM/AAAA"; preservar o sentido histórico do tutorial.
- Remover: preferir unpublish ou REDIRECT; nunca deixar 404 sem motivo.
- Rascunhos ficam públicos no GitHub (repo público); para privado usar PRIVATE=1 (`_privado/` no .gitignore).

## Segurança (regras obrigatórias)

- Nunca commitar segredos, tokens, `.env` ou dados pessoais; segredos só em GitHub Secrets.
- Nunca publicar o e-mail do autor (páginas, posts, rodapé, JSON-LD, `params.author`); contato só via Jotform. Sem X/Twitter, sem YouTube como perfil.
- Perfis do autor só em `config/_default/languages.pt-br.toml` (`params.author.links`); os ícones do menu repetem as URLs (exceção documentada).
- Não adicionar scripts/iframes de terceiros sem atualizar a CSP (`docs/cloudflare.md`) e pedir aprovação.
- Comentários: novos só via giscus (GitHub Discussions); antigos em `data/comments/` são somente leitura.
  Nunca usar `safeHTML`, `markdownify`, `htmlUnescape` ou `unsafe` em conteúdo de terceiros ou de `data/comments/`.
- JavaScript próprio só em `assets/js/`, carregado com fingerprint/SRI (nada inline).
- `security` do Hugo em `hugo.toml`: não ampliar `exec.allow`, `funcs.getenv` nem `http.urls`.
- Actions fixadas por SHA, `permissions` mínimas; não ampliar permissões de workflows.
- Não alterar regras que tocam `/.well-known/acme-challenge/` (renovação do certificado).
- Não alterar DNS/Cloudflare/GitHub settings pelo Claude; propor a mudança e documentar em `docs/cloudflare.md`.
- Logos de tecnologias: só arquivos oficiais, sem recolorir/distorcer; registrar em `assets/img/logos/SOURCES.md`.
- Manter os avisos de licença (rodapé, `/creditos/`, LICENSE do tema).

## Deploy

- Push em `main` publica (`deploy.yml`) e limpa o cache do Cloudflare. Preferir PR (`pr-check.yml`).
  O `deploy.yml` também republica todo 1º de janeiro (cron), por causa dos anos calculados na home.
- Nunca force-push em `main`. Rollback = `git revert` + push.
- Não fazer commit/push sem pedido explícito do usuário.

## Atualizações e ajustes

- Política: a versão estável mais nova possível, limitada só por compatibilidade
  (ex.: Hugo dentro de `[module.hugoVersion]` do Blowfish); sem alpha/beta/RC; Node = LTS mais novo.
- Versões exatas em `mise.toml` (nunca `latest`); Blowfish = tag do submódulo; atualização sob demanda, testada localmente.
- Uma atualização por PR; ler changelog/notas de migração; `make lint-md validate` verde; revisar claro/escuro/celular.
- Scripts e Makefile: Ubuntu 22.04/24.04/26.04 (amd64) e macOS (amd64/arm64);
  GNU Make 3.81, bash 3.2, sem `sed -i`, `date -d`, `readlink -f`, `grep -P`; passar no shellcheck.
- Customizar o tema só por override (`assets/css/custom.css`, `layouts/partials`, `layouts/shortcodes`), nunca editando `themes/blowfish/`.
  Overrides de layout do tema existentes: `layouts/tags/terms.html` (revisar a cada atualização do Blowfish).
  O CSS de leitura no computador sobrescreve as classes `.max-w-prose` e `.lg:px-32` do tema, e o dos blocos de código
  (quebra visual de linhas longas) sobrescreve `.chroma .line` e `.chroma > code`: conferir a cada atualização.
- Corrigir avisos de `hugo --logLevel info`; não usar funções deprecated (ex.: `hugo.Data`, não `site.Data`).
- Ao mudar comportamento, atualizar `README.md`, `docs/ARCHITECTURE.md`, `docs/MAINTENANCE.md`, `docs/cloudflare.md` e este arquivo.

## Referências

- `README.md` · `docs/ARCHITECTURE.md` · `docs/MAINTENANCE.md` (manual de operação) · `docs/cloudflare.md`
- `PLANS/blog-migration/PLAN.md` (decisões da migração) · `PLANS/blog-migration/IMPLEMENTACAO.md` (desvios e status)
- Diagramas: sempre Mermaid; validar com `make validate-diagrams` antes do commit.

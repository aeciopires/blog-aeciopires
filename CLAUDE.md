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
- "Mais/Menos lidos" localmente: `make visualizacoes` antes do serve (com `CLOUDFLARE_ANALYTICS_TOKEN` e
  `CLOUDFLARE_ACCOUNT_ID` exportados); sem `data/visualizacoes.json` esses botões não aparecem
- Validar (obrigatório antes de commit): `make lint-md validate` (inclui `make check-secrets` e `make check-home`)
- Repositórios públicos do GitHub (cartão da home): `make github-repos` (o pre-commit já roda; `GITHUB_REPOS_SKIP=1` pula)
- Conteúdo: `make new-post|new-page SLUG=`, `make publish-post|publish-page SLUG= [DATE=now]`,
  `make unpublish-post|unpublish-page SLUG= [PRIVATE=1]`, `make rm-post|rm-page SLUG= [REDIRECT=] CONFIRM=sim`
- Tags: `make check-tags`, `make fix-tags`, `make new-tag NAME= DESC=`, `make merge-tag FROM= TO=`, `make tags-report`
- Qualidade: `make audit-content [SLUG=]`, `make check-links-online`, `make validate-diagrams`, `make lighthouse [URL=]`
  (Docker, site publicado; relatórios em `reports/lighthouse/`)
- Atualizações: `make check-updates`, `make update-theme TAG=vX.Y.Z`, `make skill-sync`
- Sem mise ativado no shell, prefixe com `mise exec --` (o Makefile já faz isso).

## Skills

- `blowfish` (oficial, link para o submódulo): use para QUALQUER mudança de tema, config, layout, shortcode ou front matter.
- `revisar-conteudo`: validar/atualizar/testar posts contra fontes oficiais (citar URL e data), com o protocolo de testes
  seguros (Docker/kind, portas alternativas, sem credenciais reais nem mudanças no sistema), gramática e limpeza.
- `escrever-post`: post novo em pt-BR (ex.: apresentar um repositório), com cada comando testado; fica como rascunho.
- `atualizar-site`: atualizar Hugo, Blowfish, ferramentas do mise e imagens, lendo as notas de versão.
- Docs de referência da versão fixada: <https://gohugo.io/documentation/> e <https://blowfish.page/docs/>

## Conteúdo

- Posts em `content/posts/<slug>/index.md`; páginas em `content/<slug>/index.md`; imagem destacada `feature.*`.
- Front matter obrigatório: title, slug, date (com fuso -03:00), categories, tags, description. Posts migrados têm `wp_id`.
- Mídias antigas em `static/wp-content/uploads/` — não mover nem renomear.
- `markup.goldmark.renderer.unsafe = false`: HTML cru no Markdown é omitido. Use shortcodes.
- Shortcodes permitidos: do Blowfish `alert`, `button`, `figure`, `github`, `mermaid`, `tabs`, `youtubeLite`;
  próprios `jotform`, `blog-chamada`, `blog-stats`, `tecnologias`, `nuvem-tags`, `licenca-blowfish`, `removido` (arquivo/mídia que sumiu da origem: só nome + tooltip).
  Logo pequeno num post: `figure` com `figureClass="logo-post" nozoom=true` (não usar imagem Markdown, que ocupa a largura toda).
- Links: externos abrem sozinhos em nova aba (Blowfish, `externalLinkForceNewTab`); internos sempre relativos (`/slug/`)
  ou `{{< ref >}}`, nunca `https://blog.aeciopires.com/...`. Não escrever `target` à mão.
- Páginas de lista/taxonomia precisam de `content/<nome>/_index.md` com `title` em pt-BR (senão o Hugo mostra o nome
  interno em inglês, ex.: "categories"). Taxonomias ativas: só `tags` e `categories` (`series` desligada).
- Banner de tecnologias (`data/tecnologias.yaml`): `nome`, `logo`, `url` e `legenda` opcional (hífen opcional `\u00AD`
  para nomes longos no celular).
- Layout no celular: nada de largura fixa em px em grades; conferir 320, 360, 390, 412 e 430 px (sem rolagem
  horizontal nem caixa saindo da borda), além de 768 e ≥ 1024 px.
- Tags e categorias: só as de `data/taxonomia.yaml` (1–5 tags/post). Nunca criar tag sem `make new-tag`;
  trocar sinônimos com `make fix-tags`; `make check-tags` deve passar.
- Atualizar post: `make aviso-atualizacao SLUG= RESUMO=` (aviso `alert` "Atualizado em DD/MM/AAAA" + `lastmod`);
  preservar o sentido histórico do tutorial. Antes de entregar: `make verificar-texto SLUG=` e `make prosa SLUG=` (gramática).
- Link morto: cópia do Internet Archive marcada "(cópia arquivada)" ou endereço oficial atual; sem cópia útil, remover.
- Testes em Docker/kind: nunca mexer em containers/clusters/configuração do autor nem usar `sudo`; ao final, remover
  só o que o teste criou e perguntar sobre imagens que podem ser dele (detalhes na skill `revisar-conteudo`).
- Remover: preferir unpublish ou REDIRECT; nunca deixar 404 sem motivo.
- Rascunhos ficam públicos no GitHub (repo público); para privado usar PRIVATE=1 (`_privado/` no .gitignore).
- Post que não aparece (nem a página nem na home): quase sempre é rascunho (`draft: true`, visível só no `make serve`;
  o `make serve-prod` e o deploy escondem) ou data no futuro (`buildFuture = false`). Conferir com `make list-drafts`
  e `mise exec -- hugo list future`; não é erro de renderização. Corrigir com `make publish-post SLUG= DATE=now`
  (só com pedido do autor) ou ajustando a `date`. Ao entregar um post novo, avisar que ele ainda é rascunho.

## Segurança (regras obrigatórias)

- Nunca commitar segredos, tokens, `.env` ou dados pessoais; segredos só em GitHub Secrets.
  Antes de cada commit, o pre-commit (`make install-hooks`) atualiza `data/github.json`, roda gitleaks, bloqueia arquivos sensíveis e o e-mail do autor.
  Nunca usar `git commit --no-verify` para contornar; falso positivo só com exceção pontual em `.gitleaks.toml`.
- Nunca publicar o e-mail do autor (páginas, posts, rodapé, JSON-LD, `params.author`); contato só via Jotform. Sem X/Twitter, sem YouTube como perfil.
- Perfis do autor só em `config/_default/languages.pt-br.toml` (`params.author.links`); os ícones do menu repetem as URLs (exceção documentada).
- Não adicionar scripts/iframes de terceiros sem atualizar a CSP (`docs/cloudflare.md`) e pedir aprovação.
- Comentários: novos só via giscus (GitHub Discussions); antigos em `data/comments/` são somente leitura.
  Nunca usar `safeHTML`, `markdownify`, `htmlUnescape` ou `unsafe` em conteúdo de terceiros ou de `data/comments/`.
- JavaScript próprio só em `assets/js/`, carregado com fingerprint/SRI (nada inline). Nunca `innerHTML`/`outerHTML`/
  `insertAdjacentHTML`/`eval` com dados: texto por `textContent`; URLs vindas de dados só do próprio site (validadas);
  JSON só com dados do build (nunca de visitantes ou terceiros), na mesma origem (CSP inalterada).
- CSP: aplicada desde 21/11/2026 (`content-security-policy:`, não `-report-only`). Valor oficial em `docs/cloudflare.md`,
  seção 5, incluindo `form.jotform.com` (iframe do contato) e `giscus.app` em `style-src`. Qualquer mudança na CSP ou
  serviço novo: seguir "Testar a CSP" dessa seção, sempre conferindo `/contato/` (formulário com reCAPTCHA).
- `security` do Hugo em `hugo.toml`: não ampliar `exec.allow`, `funcs.getenv` nem `http.urls`.
- Actions fixadas por SHA, `permissions` mínimas; não ampliar permissões de workflows.
- Não alterar regras que tocam `/.well-known/acme-challenge/` (renovação do certificado).
- Não alterar DNS/Cloudflare/GitHub settings pelo Claude; propor a mudança e documentar em `docs/cloudflare.md`.
  Pendente (21/11/2026): regras de cache C4 (imagens com hash, 1 ano) e C5 (`/wp-content/uploads/`, 1 mês), seção 3.
- Logos de tecnologias: só arquivos oficiais, sem recolorir/distorcer; registrar em `assets/img/logos/SOURCES.md`.
- Manter os avisos de licença (rodapé, `/creditos/`, LICENSE do tema).

## Deploy

- Push em `main` publica (`deploy.yml`) e limpa o cache do Cloudflare. Preferir PR (`pr-check.yml`).
  O `deploy.yml` também republica todo 1º de janeiro (anos calculados na home) e toda segunda ("Mais lidos" da home,
  `data/visualizacoes.json` gerado com o secret `CLOUDFLARE_ANALYTICS_TOKEN`; janela de 180 dias, no máximo,
  porque a API recusa dados com mais de 184 dias).
- Total de repositórios públicos (home): `data/github.json`, versionado, atualizado pelo pre-commit
  (`scripts/github-repos.mjs`, que o inclui no commit se mudar; sem rede, mantém o valor). À mão: `make github-repos`.
- Taxonomias: só `tags` e `categories` (`series` desligada, nenhum post usa).
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
  Overrides de layout do tema existentes: `layouts/tags/terms.html` e `layouts/partials/recent-articles/cardview.html`
  (home leve: só 6 cards no HTML; o resto vem de um JSON extraído da saída de `article-link/card.html` e
  `article-meta/basic.html` e é montado por `assets/js/ordenar-home.js` clonando um molde do tema; ordenação +
  `scripts/visualizacoes.mjs`). `make check-home` (no `validate` e na CI) compara o JSON com o card do tema em
  `/posts/`: se falhar após atualizar o Blowfish, seguir o checklist de `docs/MAINTENANCE.md`, seção 8.
  O CSS de leitura no computador sobrescreve as classes `.max-w-prose` e `.lg:px-32` do tema, o dos blocos de código
  (quebra visual de linhas longas) sobrescreve `.chroma .line` e `.chroma > code`, e o dos links em avisos usa
  `.article-content div.bg-primary-100 a` (contraste): conferir a cada atualização.
  A busca é ajustada por `assets/js/busca.js` (envolve `window.Fuse` com opções extras e entrega ao `search.js` do
  tema resultados com escape, porque ele usa `innerHTML`; não copiar o `search.js` do tema).
  Links externos em nova aba dependem de `render-link.html` do tema (`article.externalLinkForceNewTab`).
  O `make update-theme` lista o diff do tema em todos esses arquivos.
- Lighthouse: `make lighthouse` (site publicado; em 21/11/2026: Performance/Boas práticas/SEO 100, Acessibilidade 100
  após as correções); `make serve`/`serve-prod` não minificam nem comprimem. Contraste mínimo 4.5 (texto normal) nos
  modos claro e escuro; imagens raster novas do layout: redimensionar no build (`Fit`/`Resize`, WebP); scripts próprios
  no `<head>` com `async`/`defer`; todo botão/link precisa de nome acessível (texto visível contido no `aria-label`).
  Versões do Lighthouse: `scripts/lighthouse.sh` e `docker/lighthouse/Dockerfile` (o `make check-updates` avisa).
- Acessibilidade: o Blowfish v3.10.0 não traduz as chaves `nav.*` para pt-BR (nome do botão do menu do celular e das
  áreas de navegação); ficam em `i18n/pt-BR.yaml`. Conferir chaves novas sem tradução a cada atualização do tema.
- Corrigir avisos de `hugo --logLevel info`; não usar funções deprecated (ex.: `hugo.Data`, não `site.Data`).
- Ao mudar comportamento, atualizar `README.md`, `docs/ARCHITECTURE.md`, `docs/MAINTENANCE.md`, `docs/cloudflare.md` e este arquivo.

## Referências

- `README.md` · `docs/ARCHITECTURE.md` · `docs/MAINTENANCE.md` (manual de operação) · `docs/cloudflare.md`
- `PLANS/blog-migration/PLAN.md` (decisões da migração) · `PLANS/blog-migration/IMPLEMENTACAO.md` (desvios e status)
- Diagramas: sempre Mermaid; validar com `make validate-diagrams` antes do commit.

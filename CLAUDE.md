# CLAUDE.md

## Projeto

- Blog pessoal em Hugo + tema Blowfish (git submodule em `themes/blowfish`, tag fixada),
  visual T9 (esquema `blowfish`, abre escuro, botão claro/escuro, arte própria como fundo, como o blowfish.page).
- Publicado no GitHub Pages via GitHub Actions, com Cloudflare Free na frente (DNS, proxy, cache, WAF, analytics).
- Domínio: <https://blog.aeciopires.com> — URLs herdadas do WordPress NÃO podem mudar (`config/_default/hugo.toml`, `[permalinks]`).
- Idiomas: pt-BR (padrão e FONTE, na raiz) e en-US em `/en/` (`index.en.md`/`_index.en.md` ao lado do original).
  A tradução é feita só localmente, antes do commit, por IA (skill `traduzir-conteudo`); nunca no build/navegador.
- Decisões e histórico: `PLANS/blog-migration/PLAN.md` (registro histórico; não reescrever).

## Comandos

- Dependências: `make check-deps`, `make install-deps` (ferramentas via mise; Docker/Colima por fora)
- Rodar: `make serve` (com rascunhos) | `make serve-prod` (como o leitor vê) | `make serve-docker`
- "Mais/Menos lidos" localmente: `make visualizacoes` antes do serve (com `CLOUDFLARE_ANALYTICS_TOKEN` e
  `CLOUDFLARE_ACCOUNT_ID` exportados); sem `data/visualizacoes.json` esses botões não aparecem
- Validar (obrigatório antes de commit): `make lint-md validate` (inclui `check-secrets`, `check-i18n`, `check-correcoes`
  e `check-home`)
- Inglês: `make i18n-status`, `make i18n-diff SLUG=`, `make i18n-sync-fm SLUG=`, `make i18n-ok SLUG= [FORCAR=1]`,
  `make prosa-en SLUG=`, `make check-i18n`, `make check-correcoes`, `make test-idioma` (redirecionamento por idioma, Docker)
- Repositórios públicos do GitHub (cartão da home): `make github-repos` (o pre-commit já roda; `GITHUB_REPOS_SKIP=1` pula)
- Conteúdo: `make new-post|new-page SLUG=`, `make publish-post|publish-page SLUG= [DATE=now]`,
  `make unpublish-post|unpublish-page SLUG= [PRIVATE=1]`, `make rm-post|rm-page SLUG= [REDIRECT=] CONFIRM=sim`
- Tags: `make check-tags`, `make fix-tags`, `make new-tag NAME= DESC=`, `make merge-tag FROM= TO=`, `make tags-report`
- Qualidade: `make audit-content [SLUG=]`, `make check-links-online`, `make validate-diagrams`, `make lighthouse [URL=]`
  (Docker, site publicado; relatórios em `reports/lighthouse/`), `make lighthouse-local [PAGINAS="/ /en/ …"]` (build local)
- Atualizações: `make check-updates`, `make update-theme TAG=vX.Y.Z`, `make skill-sync`
- Sem mise ativado no shell, prefixe com `mise exec --` (o Makefile já faz isso).

## Skills

- `blowfish` (oficial, link para o submódulo): use para QUALQUER mudança de tema, config, layout, shortcode ou front matter.
- `revisar-conteudo`: validar/atualizar/testar posts contra fontes oficiais (citar URL e data), com o protocolo de testes
  seguros (Docker/kind, portas alternativas, sem credenciais reais nem mudanças no sistema), gramática e limpeza.
- `escrever-post`: post novo em pt-BR (ex.: apresentar um repositório), com cada comando testado; fica como rascunho.
- `traduzir-conteudo`: versão en-US de posts/páginas novos ou alterados (comandos e links idênticos, gramática,
  carimbo `make i18n-ok`); lotes grandes com o agente `tradutor-en` (`.claude/agents/`).
- `atualizar-site`: atualizar Hugo, Blowfish, ferramentas do mise e imagens, lendo as notas de versão.
- Docs de referência da versão fixada: <https://gohugo.io/documentation/> e <https://blowfish.page/docs/>

## Conteúdo

- Posts em `content/posts/<slug>/index.md`; páginas em `content/<slug>/index.md`; imagem destacada `feature.*`.
- Versão em inglês (obrigatória para tudo que é publicado): `index.en.md`/`_index.en.md` no mesmo diretório, mesmo slug
  (`/en/<slug>/`). Traduz só `title`/`description`/texto; código, comandos, código em linha, URLs e parâmetros técnicos
  de shortcodes IDÊNTICOS ao pt-BR (só linhas inteiras de comentário podem ser traduzidas); links internos `/slug/` →
  `/en/slug/`; `aliases`/`wp_id` só no pt-BR; demais campos do front matter iguais (`make i18n-sync-fm`).
  Mudou o pt-BR → atualize e carimbe a tradução no mesmo commit (pre-commit e CI bloqueiam; nunca `--no-verify`).
  Corrigiu um comando no pt-BR → mesma correção no en (o check exige). Nunca edite o pt-BR para passar no check.
- Erros achados ao traduzir/revisar (gramática, digitação, Markdown quebrado, texto que contradiz o código do post,
  nomes inconsistentes entre comandos, fato técnico conferido na doc oficial): corrigir no pt-BR E no en e registrar
  cada item em `reports/correcoes-conteudo-AAAA-MM-DD.md` (uma linha `- [ ]` por item: slug, antes → depois, motivo); o que exige
  teste ou decisão do autor vira item PENDENTE, sem corrigir. O autor marca `- [x]`; `make check-correcoes`
  (pre-commit e validate) bloqueia o commit do conteúdo com item aberto. Comando/versão/fato → também aviso.
  Conteúdo que JÁ é bilíngue no original (pt-BR e inglês no mesmo arquivo): `bilingue: true` no front matter e SEM
  `index.en.md` (o check recusa a duplicata); links e menus em inglês apontam para `/slug/` (sem `/en/`).
- Front matter obrigatório: title, slug, date (com fuso -03:00), categories, tags, description. Posts migrados têm `wp_id`.
- Mídias antigas em `static/wp-content/uploads/` — não mover nem renomear.
- `markup.goldmark.renderer.unsafe = false`: HTML cru no Markdown é omitido. Use shortcodes.
- Shortcodes permitidos: do Blowfish `alert`, `button`, `figure`, `github`, `mermaid`, `tabs`, `youtubeLite`;
  próprios `jotform`, `blog-chamada`, `blog-stats`, `tecnologias`, `nuvem-tags`, `licenca-blowfish`, `removido` (arquivo/mídia que sumiu da origem: só nome + tooltip).
  Logo pequeno num post: `figure` com `figureClass="logo-post" nozoom=true` (não usar imagem Markdown, que ocupa a largura toda).
- Links: externos abrem sozinhos em nova aba (Blowfish, `externalLinkForceNewTab`); internos sempre relativos (`/slug/`)
  ou `{{< ref >}}`, nunca `https://blog.aeciopires.com/...`. Não escrever `target` à mão.
- Textos de layouts/shortcodes próprios: sempre `i18n "blog.…"`, com a chave em `i18n/pt-BR.yaml` E `i18n/en.yaml`
  (nada de texto fixo em português no HTML). Menus: `menus.pt-br.toml` e `menus.en.toml` com os mesmos itens.
- Páginas de lista/taxonomia precisam de `content/<nome>/_index.md` com `title` em pt-BR (e `_index.en.md` em inglês) (senão o Hugo mostra o nome
  interno em inglês, ex.: "categories"). Taxonomias ativas: só `tags` e `categories` (`series` desligada).
- Banner de tecnologias (`data/tecnologias.yaml`): grupos com `nome` e `nome_en`; itens com `nome`, `logo`, `url` e `legenda` opcional (hífen opcional `\u00AD`
  para nomes longos no celular).
- Layout no celular: nada de largura fixa em px em grades; conferir 320, 360, 390, 412 e 430 px (sem rolagem
  horizontal nem caixa saindo da borda), além de 768 e ≥ 1024 px.
- Tags e categorias: só as de `data/taxonomia.yaml` (1–5 tags/post). Nunca criar tag sem `make new-tag`;
  trocar sinônimos com `make fix-tags`; `make check-tags` deve passar.
- Atualizar post: `make aviso-atualizacao SLUG= RESUMO= RESUMO_EN=` (aviso `alert` "Atualizado em DD/MM/AAAA" e
  "Updated on Month D, YYYY" + `lastmod` nos dois; entra acima dos avisos anteriores, que ficam);
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
- Perfis do autor só em `[author]` de `config/_default/params.toml` (`links`, nome, foto; valem para os dois idiomas;
  `headline`/`bio` traduzidos em `languages.{pt-br,en}.toml`); os ícones dos dois menus repetem as URLs (exceção documentada).
- Não adicionar scripts/iframes de terceiros sem atualizar a CSP (`docs/cloudflare.md`) e pedir aprovação.
- Comentários: novos só via giscus (GitHub Discussions; uma discussão por post para os dois idiomas, termo = caminho
  pt-BR); antigos em `data/comments/` são somente leitura.
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
  (quebra visual de linhas longas) sobrescreve `.chroma .line` e `.chroma > code`, o dos links em avisos usa
  `.article-content div.bg-primary-100 a` (contraste) e o dos links em citações sublinha `.article-content blockquote a`
  (Lighthouse link-in-text-block): conferir a cada atualização.
  A busca é ajustada por `assets/js/busca.js` (envolve `window.Fuse` com opções extras e entrega ao `search.js` do
  tema resultados com escape, porque ele usa `innerHTML`; não copiar o `search.js` do tema).
  Links externos em nova aba dependem de `render-link.html` do tema (`article.externalLinkForceNewTab`).
  O `make update-theme` lista o diff do tema em todos esses arquivos.
  Multilíngue: seletor de idioma, hreflang e sitemap são os do tema (sem override). Redirecionamento pelo idioma do
  navegador LIGADO, com override `layouts/partials/language-redirect.html` + `assets/js/idioma-config.js` (config em
  `data-config`, sem script inline; robôs/Lighthouse não redirecionam; `hreflang x-default` = pt-BR). CSP inalterada:
  nunca `'unsafe-inline'`. O `check-i18n` guarda o hash do partial e do JS do tema (`TEMA_IDIOMA`) e falha se o
  Blowfish os mudar: revisar o override, `make test-idioma` e atualizar o hash. Também falha se um layout usar chave
  de i18n sem texto em pt-BR ou en. Seletor de idioma sempre visível (não remover).
- Lighthouse: `make lighthouse` (site publicado; em 21/11/2026: Performance/Boas práticas/SEO 100, Acessibilidade 100
  após as correções); `make serve`/`serve-prod` não minificam nem comprimem. Contraste mínimo 4.5 (texto normal) nos
  modos claro e escuro; imagens raster novas do layout: redimensionar no build (`Fit`/`Resize`, WebP); scripts próprios
  no `<head>` com `async`/`defer`; todo botão/link precisa de nome acessível (texto visível contido no `aria-label`).
  Versões do Lighthouse: `scripts/lighthouse.sh` e `docker/lighthouse/Dockerfile` (o `make check-updates` avisa).
  Mudança de layout/conteúdo: comparar pt-BR e en com `make lighthouse-local` antes do commit (notas não podem cair).
- Acessibilidade: o Blowfish v3.10.0 não traduz as chaves `nav.*` para pt-BR (nome do botão do menu do celular e das
  áreas de navegação); ficam em `i18n/pt-BR.yaml`. Conferir chaves novas sem tradução a cada atualização do tema.
- Corrigir avisos de `hugo --logLevel info`; não usar funções deprecated (ex.: `hugo.Data`, não `site.Data`).
- `make build`/`lighthouse-local` rodam `mise exec -- env HUGO_ENVIRONMENT=production hugo` (o `[env]` do mise venceria).
- Ao mudar comportamento, atualizar `README.md`, `docs/ARCHITECTURE.md`, `docs/MAINTENANCE.md`, `docs/cloudflare.md` e este arquivo.

## Referências

- `README.md` · `docs/ARCHITECTURE.md` · `docs/MAINTENANCE.md` (manual de operação) · `docs/cloudflare.md`
- Search Console da versão em inglês: `docs/cloudflare.md`, seção 10
- `PLANS/blog-migration/PLAN.md` (decisões da migração) · `PLANS/blog-migration/IMPLEMENTACAO.md` (desvios e status)
- Diagramas: sempre Mermaid; validar com `make validate-diagrams` antes do commit.

# Implementação do plano de migração — status e desvios

Acompanha o [PLAN.md](PLAN.md) (registro histórico, não reescrito). Atualizado em 20/11/2026.

## Status por fase

| Fase | Status | Observações |
|---|---|---|
| 0 — Preparação | Feito | Versões conferidas. Inventário de URLs em `scripts/urls-wordpress.txt` (216). Backup completo (WXR + dump do banco + `uploads/`) em `~/Desktop/bkp_blog`, fora do repositório. Relatórios do Jetpack Stats/Google Analytics **não serão exportados** (decisão do autor, 20/11/2026). Registro DNS antigo de `blog`: dispensado, virada concluída. 2FA ativado pelo autor no GitHub e no Cloudflare (20/11/2026) |
| 1 — Esqueleto | Feito (local) | `mise.toml`, `Makefile`, scripts, `docker-compose.yml`, submódulo v3.10.0, config, skills, workflows, `dependabot.yml`, `CLAUDE.md`, `README.md`, `docs/`. giscus configurado em 20/11/2026: `repoId = "R_kgDOV0zJLg"`, `categoryId = "DIC_kwDOV0zJLs4DLj2M"` (IDs GraphQL; o id REST `1464650030` e o número da URL `53362060` não funcionam; comando em `docs/MAINTENANCE.md`). **Pendente (autor):** teste em macOS |
| 2 — Tema | Feito (local) | T9 aplicado e revisado por capturas (escuro/claro, computador/celular). Aviso MIT preservado no CSS minificado. **Logos:** 21 de 27 oficiais; 6 em texto por diretriz de marca (Docker, AWS, Google Cloud, Gemini, ChatGPT) e macOS sem logo |
| 3 — Conversão | Feito (local) | `scripts/migracao/migrar.sh` (reproduzível): 81 posts, 5 páginas fixas (sobre, cursos, curso-docker, curso-kubernetes-k8s, contato; revisadas à mão em 20/11/2026), 5 páginas rascunho como redirecionamento, 161 comentários arquivados (sanitizados), 251 mídias, 67 tags com aliases das antigas, 19 categorias. `compare-urls`: 216/216 URLs preservadas; lychee: 0 links internos quebrados; lint: 0 problemas; build sem avisos |
| 4 — Revisão | **Concluída em 20/11/2026** (autor validou todo o conteúdo: posts, páginas e comentários) | Lista em [revisao-fase-4.md](revisao-fase-4.md). Auditoria WordPress × Hugo (`scripts/migracao/comparar_wordpress.py`) sem pendências. Tags resolvidas: **57 tags** (inclui a nova `fe`); 6 removidas por decisão do autor e 5 que ficaram sem posts após o enxugamento (`alertmanager`, `azure`, `cert-manager`, `fargate`, `ingress-nginx`), todas com `/tag/<nome>/` → `/tags/`. `make validate` OK; PDF externo quebrado com o shortcode `removido` |
| 5 — Staging | **Em andamento** (desde 20/11/2026) | PR #1 (`aa2ed57`) e PR #2 (`b85b2dd`: hook de segredos, imagens no próprio site, busca) mesclados; deploys `44740864708` e `44746971510` OK em <https://aeciopires.github.io/blog-aeciopires/>; check `validate` exigido no ruleset da `main`; branches temporárias removidas. A virada aconteceu antes do roteiro de testes; ele passa a valer no domínio final (ver Fase 5 abaixo) |
| 6 — Virada de DNS | **Quase concluída** (20/11/2026) | Seções 1 a 5 e 7 de `docs/cloudflare.md` feitas pelo autor. PR #3 (`2754a7c`) mesclado; deploy `44760468192` OK. O HTML no cache do Cloudflare ainda vinha do build com o prefixo `/blog-aeciopires/` (CSS 404) até o *Purge Everything* manual. Conferido: `server: cloudflare`, feeds → 301, `/wp-login.php` e `POST /` → 403, `/wp-content/uploads/` → 200, beacon do Web Analytics, CSP efetiva com nota **A** no securityheaders.com. Erro 1016 do domínio raiz corrigido (R3); `jenkins`/`puppet` migrados para Redirect Rules com `A 192.0.2.1` (R4, R5). Secret `CLOUDFLARE_API_TOKEN` e variable `CLOUDFLARE_ZONE_ID` criados pelo autor (20/11/2026; conferido via API). **Pendente:** HSTS de 1 ano, confirmar o purge automático no próximo deploy, Search Console, SSL Labs, variables de fechamento. Hospedagem do WordPress desligada pelo autor (20/11/2026) |

## Desvios em relação ao plano (e motivo)

| Plano | Implementado | Motivo |
|---|---|---|
| Posts com `showHero = true`, `heroStyle = "background"` | `backgroundCanvas = true` + `defaultBackgroundImage` (arte) e `showHero = false` | O hero `background` do Blowfish usa a **imagem destacada do post** como fundo; o mockup final mostra a **arte** no topo do post. O canvas reproduz o mockup sem sobrescrever layouts do tema |
| Shortcode `stats` próprio | `blog-stats` | O Blowfish v3.10.0 já tem um shortcode `stats`; o nome próprio evita sobrescrevê-lo |
| Chamada da home com `{{< button >}}` no `_index.md` | Shortcode `blog-chamada` | `unsafe = false` impede HTML cru no Markdown; o shortcode monta eyebrow, título e botões (cursos só aparecem quando as páginas existirem) |
| Mininuvem da home **depois** dos posts recentes | **Antes** dos posts recentes | O layout `background` do tema renderiza o conteúdo antes da lista de recentes; mudar a ordem exigiria sobrescrever o layout da home |
| Home igual ao mockup (sem foto) | Foto, nome, headline e links do autor no topo | O layout `background` do tema sempre exibe o bloco do autor; mantido para não sobrescrever o layout |
| `scripts/check-tags.mjs` (+ outros) | `scripts/tags.mjs` com subcomandos (`check`, `fix`, `new`, `merge`, `report`, `normalize`, `init`) | Um só arquivo, sem dependências npm (parser de um subconjunto de YAML validado pelo próprio script) |
| `lychee = "0.24.2"` no `mise.toml` | `github:lycheeverse/lychee` 0.24.2 com build **musl** no Linux | O binário glibc exige glibc ≥ 2.38 e não roda no Ubuntu 22.04 (2.35). Padrões de macOS seguem os nomes oficiais da release; **testar no macOS** |
| `timeZone` (`America/Sao_Paulo` em 3.6.3, `America/Recife` em 7.1) | `America/Recife` | Rascunho de configuração do plano; ambos -03:00, sem horário de verão |
| `languageCode = "pt-br"` | `locale = "pt-BR"` no idioma | `languageCode` está *deprecated* desde o Hugo 0.158 |
| Analytics "só em produção" | `hugo.IsProduction` **e** `not hugo.IsServer` | Garante que `make serve-prod` não envie visitas |
| `compare-urls` bloqueante no `pr-check` | Bloqueante só com a variable `MIGRACAO_CONCLUIDA=true` | Até a Fase 3 todas as URLs faltam; sem isso a CI ficaria vermelha no esqueleto |
| `origin-cert.yml` semanal | Só com a variable `DOMINIO_ATIVO=true` | Antes da virada de DNS não existe certificado de `blog.aeciopires.com` no GitHub Pages |
| Purge do Cloudflare sempre | Só com secret `CLOUDFLARE_API_TOKEN` e variable `CLOUDFLARE_ZONE_ID` | Staging funciona sem o Cloudflare |
| Conversão com wp2hugo (6.1) | wp2hugo só para o **corpo** em Markdown; front matter, comentários e mídias montados do WXR por `scripts/migracao/importar_wordpress.py` | O front matter do wp2hugo traz metadados internos do WP e datas em `+00:00`, e o `comments.yaml` dele inclui **e-mails** dos comentaristas (proibido em 6.5) |
| Mídias baixadas pelo wp2hugo | Copiadas do `uploads/` do backup, sem acesso à rede | Backup local completo; 628 variações `-NxN` não referenciadas descartadas (6.3) |
| Rascunhos do WordPress | **Ignorados** (36 posts, 5 páginas e 58 comentários neles) | Decisão do autor (20/11/2026) |
| Links para rascunhos | Removidos, mantendo o texto (13 links, 4 destinos) | Já davam 404 no WordPress; listados em `revisao-fase-4.md` |
| Páginas fixas (sobre, cursos, cursos de Docker e Kubernetes, contato) | Revisadas à mão: seções com `##`, botão para o formulário Jotform de cada curso, slides do SlideShare como link (sem iframe), logo do Docker removido (diretriz de marca) | `unsafe = false`, CSP e marcas |
| Páginas rascunho do WordPress | Viraram redirecionamento (alias): `/arquivos/` → `/sobre/`; `/curso-de-a-a-zabbix/`, `/curso-de-puppet/`, `/curso-integracao-continua-com-jenkins/`, `/rascunho/` → `/cursos/` | Cursos encerrados; nenhuma URL vira 404 |
| Categoria `zabbix-2` | `content/categories/<slug>/_index.md` com `slug` e `title` do WordPress para todas as categorias | No Hugo, `:slug` de um termo vem do título ("Zabbix" → `zabbix`); o `slug` explícito preserva `/category/zabbix-2/` |
| Páginas `home`, `home2`, `uncategorized` | Aliases: `/home/` → `/`, `/home2/` → `/posts/`, `/category/uncategorized/` → `/posts/` | Não têm conteúdo próprio no site novo |
| Títulos H1 no corpo dos posts | Rebaixados um nível e sem saltos (H2 → H5 vira H2 → H3) | O título vem do front matter; o TOC começa no H2 |
| Linguagem dos blocos de código (6.4, revisão manual) | Definida automaticamente só quando inequívoca; 44 blocos ficaram `text` | Lista em `revisao-fase-4.md` |
| Crases digitadas no WordPress (`` `<strong>x</strong>` ``) | Convertidas para código inline | O wp2hugo as escapava e o conteúdo (ex.: `<service>`) era omitido como HTML |
| MD036/MD026 do markdownlint | Desligadas | Negrito como subtítulo e pontuação em títulos são estilo dos posts, não erro |
| Tipografia e largura do tema (16px, 65 caracteres por linha) | No computador: fonte 17px (≥ 1024px) e 18px (≥ 1536px), texto até 78 caracteres por linha e margens laterais de 4rem (≥ 1280px), só por CSS com variáveis | Pedido do autor (20/11/2026): fonte pequena e espaço sobrando; celular inalterado |
| Tabelas e embeds do WordPress (6.4) | `scripts/migracao/tabelas_embeds.py` (etapa 4b do `migrar.sh`): 3 tabelas viram tabelas Markdown e 5 embeds de páginas do blog viram listas de links com o título | O wp2hugo achatou as tabelas em texto corrido (`conhecendo-o-kubernetes-gateway-api`, `instalando-o-locust-no-kubernetes-para-testes-de-carga`) e deixou os embeds como caminhos soltos (também `instalando-o-zabbix-no-kubernetes-usando-o-helm`). Verificado nos 81 posts comparando listas, imagens, títulos, código, citações, tabelas e palavras grudadas com o WXR |
| Numeração dos passos (`1)`, `2)`…) | Restaurada pelo texto de cada passo em 12 tutoriais (Docker e afins); `MD029` desligada no markdownlint | O `markdownlint --fix` da migração renumerou todos os passos para `1)`, porque cada passo é uma lista de 1 item entre blocos de código |
| Comentários arquivados | Quebra de linha simples vira `<br>` (texto continua escapado) e data no formato do tema (pt-BR) | 64 comentários com comandos colados numa linha só; datas saíam em inglês ("Aug") |
| Auditoria de 20/11/2026 (`scripts/migracao/comparar_wordpress.py`) | Corrigidos: 4 links de rastreamento do Mailchimp e 1 `fbclid` (destino trocado pela URL real), URL já quebrada no WordPress (Elasticsearch/DigitalOcean), 4 URLs com caractere invisível U+2028 (Go), emoji dentro de URL (Helm Chart 8), links de `kubectl`/`helm` perdidos dentro de código (Locust, KEDA), data original da página Contato | 88 itens publicados conferidos; 161 comentários aprovados presentes, com autor, data e respostas; 59 pingbacks descartados; sem e-mail/IP de comentaristas |
| Blocos de código com rolagem horizontal (tema) | Quebra visual das linhas longas (`white-space: pre-wrap`), sem barra de rolagem; o texto copiado continua idêntico (botão do tema usa `textContent`) | Pedido do autor (20/11/2026); conferido no computador e no celular |
| Post `testemunho-de-uma-norte-coreana` | Removido em 20/11/2026 (`make rm-post`), com `/testemunho-de-uma-norte-coreana/` → `/testemunhos-sobre-a-vida-na-coreia-do-norte/` (alias) | Decisão do autor; o post não tinha comentários arquivados. Site com 80 posts |
| Busca do tema (Fuse.js, frase exata na ordem digitada) | `assets/js/busca.js` envolve `window.Fuse`: termos em qualquer ordem (todos obrigatórios, ranking por relevância), sem acentos e com tolerância a 1 erro de digitação (`threshold` 0.15) | Pedido do autor (20/11/2026). Medido no índice real e no navegador: "helm kubernetes" 0 → 19, "zabbix docker" 0 → 8, "instalacao zabbix" 0 → 4, "kubernets" 0 → 32; "istio" e "prometheus" sem ruído novo. Sem cópia do `search.js` do tema |
| Publicação só por push | Também por cron todo 1º de janeiro | Os anos da home são calculados no build |
| Pre-commit só com check-tags e lint-md (6.8) | Também gitleaks 8.30.1 (segredos, tokens e chaves), bloqueio de arquivos sensíveis e do e-mail do autor em todo commit; `make check-secrets` no `validate` e no `pr-check` | Pedido do autor (20/11/2026). Testado com token, chave privada, `.env` e e-mail falsos (bloqueados) e arquivo limpo (aceito) |
| Imagens de terceiros carregadas direto da origem (herança do WordPress) | Site contido: logos de Jenkins e Kubernetes trocados pelos arquivos oficiais (CC BY-SA 3.0 com atribuição; diretrizes da Linux Foundation) e copiados para o post; 5 capturas do MyToolkit (repositório do autor, GPL-3.0) copiadas; banner do livro de Jenkins copiado (autoria do autor); ilustração da HashiCorp e diagrama da CNCF viraram link para a fonte. Créditos em `/creditos/` | Pedido do autor (20/11/2026): nenhuma imagem externa por visita. Recursos externos restantes só sob demanda: giscus, Jotform (Contato), YouTube (`youtubeLite`) e, após a Fase 6, o Cloudflare Web Analytics |
| `security.http.urls` "sem curingas" | `^https://api\.github\.com/repos/` e método só `GET` | Único acesso remoto do tema usado pelo site (shortcode `github`) |

## Observações para revisão

- **Modo claro/escuro:** com `defaultAppearance = "dark"` + `autoSwitchAppearance = true`, o Blowfish abre escuro na primeira visita mesmo com o sistema em claro (o automático só escurece). É o mesmo comportamento do blowfish.page. O modo claro vem pelo botão e fica lembrado.
- **Páginas do WordPress:** migradas em 20/11/2026. Sobre mantém os 14 comentários arquivados e o giscus; Cursos e cursos sem comentários. `/home/` e `/home2/` viram redirecionamento; `/countdown/` não existe no WXR de 20/11/2026 (sem ação).
- Os botões "Curso Docker" e "Curso Kubernetes" da home aparecem automaticamente quando `content/curso-docker/` e `content/curso-kubernetes-k8s/` existirem.

## Pendências do autor

Situação em 20/11/2026. Nada foi commitado: todo o trabalho está na branch `feat/migracao-hugo`, fora do Git.

### Concluídas

- ~~Backup/WXR~~ (`~/Desktop/bkp_blog`); ~~giscus~~ (só a categoria **Comentários**); ~~logos~~ (21 de 27; os demais em texto por diretriz de marca, ver `assets/img/logos/SOURCES.md`); ~~GitHub~~ (Pages, permissões, secret scanning, push protection, Dependabot, ruleset da `main`; `docs/MAINTENANCE.md`, seção 9); ~~tags~~ (57, `make check-tags` OK); ~~páginas fixas e redirecionamentos~~.

### Fase 4 — concluída em 20/11/2026

- ~~Revisão de conteúdo~~ ([revisao-fase-4.md](revisao-fase-4.md)): links removidos, blocos de código, comentários arquivados, posts mais lidos, `description` e páginas fixas validados pelo autor.

### Primeiro PR — concluído em 20/11/2026

- ~~`make install-hooks`~~; ~~commit e PR #1~~ (`validate` verde na CI); ~~merge na `main`~~; ~~deploy no GitHub Pages~~ (build 39 s + deploy 8 s; páginas, redirecionamentos, RSS, sitemap e busca respondem 200); ~~check `validate` no ruleset da `main`~~ (conferido via API).
- Fase 0: exportação de analytics dispensada pelo autor; anotação do DNS antigo dispensada (virada concluída); 2FA ativado (20/11/2026).

### Fase 5 — Testes funcionais (agora no domínio final)

A virada de DNS aconteceu antes destes testes. Roteiro (autor), agora em <https://blog.aeciopires.com/>:

- [ ] Celular (Android/iOS) e computador: home, um post longo, Categorias, Tags, Cursos, Sobre.
- [ ] Modos claro/escuro (botão e preferência do sistema).
- [ ] Busca: `kubernetes helm`, `instalacao zabbix`, `kubernets` (`Ctrl K` no computador).
- [ ] RSS: `/index.xml` num leitor de feeds.
- [ ] Lighthouse (Chrome DevTools → Lighthouse, mobile): anotar Performance, Accessibility, Best Practices e SEO.
- [ ] Formulário de Contato (Jotform): enviar uma mensagem de teste e conferir o recebimento.
- [ ] Botões "Quero fazer o curso" (Docker e Kubernetes) abrem o formulário certo.
- [ ] giscus: comentar num post como teste, conferir em Discussions → Comentários e apagar.
- [ ] Redirecionamentos: `/arquivos/`, `/testemunho-de-uma-norte-coreana/`, `/category/zabbix-2/`.

**Limitação do staging (histórico):** imagens e links internos escritos no corpo dos posts usam caminho absoluto (`/wp-content/...`, `/slug/`) e dão 404 no staging (subpasta `/blog-aeciopires/`). No domínio final (raiz) funcionam; conferir o conteúdo localmente com `make serve-prod`. O `make validate-links` cobre esses caminhos.

**Fase 0:** não exportar relatórios do Jetpack Stats/Google Analytics (decisão do autor, 20/11/2026); anotar o DNS antigo de `blog` ficou sem efeito (virada feita). 2FA ativado no GitHub e no Cloudflare (20/11/2026).

### Fase 6 — Virada de DNS

Passo a passo com caixas de seleção em [docs/cloudflare.md](../../docs/cloudflare.md):

1. ~~Seção 1 (ordem importa): domínio verificado no GitHub, `CNAME`, *Custom domain*, *Enforce HTTPS*, SSL, proxy.~~ Feito.
1. ~~Seções 2 a 4: zona, Cache Rules, WAF/rate limiting/redirects.~~ Feito.
1. ~~Seção 5: headers de segurança.~~ Feito: CSP efetiva, nota A no securityheaders.com. **Pendente:** HSTS para `max-age=31536000` após alguns dias estável (passo 7).
1. ~~Seção 4: domínio raiz/`www` (erro 1016, R3) e subdomínios `jenkins`/`puppet` (R4, R5).~~ Feito.
1. ~~Seção 7: Web Analytics e token público em `params.toml` (via PR).~~ Feito (beacon no ar desde o deploy `44760468192`).
1. ~~Secrets/variables: [MAINTENANCE.md, seção 9 → Variables e secrets](../../docs/MAINTENANCE.md) (como criar o token e achar o Zone ID).~~ Feito em 20/11/2026. Confirmar no próximo deploy o passo "Limpar cache do Cloudflare" verde no job `deploy`.
1. Seção 9: testes após a virada (feitos: cache, feeds, WAF, uploads, redirects, securityheaders; faltam SSL Labs, Web Analytics registrando e purge automático); reenviar `sitemap.xml` no Search Console.
1. Depois: `DOMINIO_ATIVO=true`, `MIGRACAO_CONCLUIDA=true` (pelo site do GitHub: Settings → Secrets and variables → Actions → *Variables*).
1. ~~Desligar a hospedagem do WordPress~~: desligada pelo autor em 20/11/2026, sem os 30 dias de observação previstos. Seguro porque nenhum registro de DNS aponta para ela (`blog` no GitHub Pages; raiz, `www`, `jenkins` e `puppet` só redirecionam na borda; sem MX). Manter o backup em `~/Desktop/bkp_blog`; acompanhar 404 no Search Console.

### Adiado

1. Testar `make check-deps && make install-deps && make serve` no macOS (amd64/arm64) e no Ubuntu 24.04/26.04 (só há acesso ao Ubuntu 22.04, onde tudo foi testado). Atenção ao padrão do lychee para macOS no `mise.toml`.

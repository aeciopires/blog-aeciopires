# Implementação do plano de migração — status e desvios

Acompanha o [PLAN.md](PLAN.md) (registro histórico, não reescrito; as decisões posteriores estão na seção 19 dele). Atualizado em 21/11/2026.

## Status por fase

| Fase | Status | Observações |
|---|---|---|
| 0 — Preparação | Feito | Versões conferidas. Inventário de URLs em `scripts/urls-wordpress.txt` (216). Backup completo (WXR + dump do banco + `uploads/`) em `~/Desktop/bkp_blog`, fora do repositório. Relatórios do Jetpack Stats/Google Analytics **não serão exportados** (decisão do autor, 20/11/2026). Registro DNS antigo de `blog`: dispensado, virada concluída. 2FA ativado pelo autor no GitHub e no Cloudflare (20/11/2026) |
| 1 — Esqueleto | Feito (local) | `mise.toml`, `Makefile`, scripts, `docker-compose.yml`, submódulo v3.10.0, config, skills, workflows, `dependabot.yml`, `CLAUDE.md`, `README.md`, `docs/`. giscus configurado em 20/11/2026: `repoId = "R_kgDOV0zJLg"`, `categoryId = "DIC_kwDOV0zJLs4DLj2M"` (IDs GraphQL; o id REST `1464650030` e o número da URL `53362060` não funcionam; comando em `docs/MAINTENANCE.md`). **Pendente (autor):** teste em macOS |
| 2 — Tema | Feito (local) | T9 aplicado e revisado por capturas (escuro/claro, computador/celular). Aviso MIT preservado no CSS minificado. **Logos:** 21 de 27 oficiais; 6 em texto por diretriz de marca (Docker, AWS, Google Cloud, Gemini, ChatGPT) e macOS sem logo |
| 3 — Conversão | Feito (local) | `scripts/migracao/migrar.sh` (reproduzível): 81 posts, 5 páginas fixas (sobre, cursos, curso-docker, curso-kubernetes-k8s, contato; revisadas à mão em 20/11/2026), 5 páginas rascunho como redirecionamento, 161 comentários arquivados (sanitizados), 251 mídias, 67 tags com aliases das antigas, 19 categorias. `compare-urls`: 216/216 URLs preservadas; lychee: 0 links internos quebrados; lint: 0 problemas; build sem avisos |
| 4 — Revisão | **Concluída em 20/11/2026** (autor validou todo o conteúdo: posts, páginas e comentários) | Lista em [revisao-fase-4.md](revisao-fase-4.md). Auditoria WordPress × Hugo (`scripts/migracao/comparar_wordpress.py`) sem pendências. Tags resolvidas: **57 tags** (inclui a nova `fe`); 6 removidas por decisão do autor e 5 que ficaram sem posts após o enxugamento (`alertmanager`, `azure`, `cert-manager`, `fargate`, `ingress-nginx`), todas com `/tag/<nome>/` → `/tags/`. `make validate` OK; PDF externo quebrado com o shortcode `removido` |
| 5 — Staging | **Concluída** (20/11/2026) | PR #1 (`aa2ed57`) e PR #2 (`b85b2dd`: hook de segredos, imagens no próprio site, busca) mesclados; deploys `44740864708` e `44746971510` OK em <https://aeciopires.github.io/blog-aeciopires/>; check `validate` exigido no ruleset da `main`; branches temporárias removidas. Roteiro de testes funcionais executado pelo autor no domínio final (20/11/2026) |
| 6 — Virada de DNS | **Quase concluída** (20/11/2026) | Seções 1 a 5 e 7 de `docs/cloudflare.md` feitas pelo autor. PR #3 (`2754a7c`) mesclado; deploy `44760468192` OK. O HTML no cache do Cloudflare ainda vinha do build com o prefixo `/blog-aeciopires/` (CSS 404) até o *Purge Everything* manual. Conferido: `server: cloudflare`, feeds → 301, `/wp-login.php` e `POST /` → 403, `/wp-content/uploads/` → 200, beacon do Web Analytics, CSP efetiva com nota **A** no securityheaders.com. Erro 1016 do domínio raiz corrigido (R3); `jenkins`/`puppet` migrados para Redirect Rules com `A 192.0.2.1` (R4, R5). Secret `CLOUDFLARE_API_TOKEN` e variable `CLOUDFLARE_ZONE_ID` criados pelo autor (20/11/2026; conferido via API). Hospedagem do WordPress desligada pelo autor (20/11/2026). PR #4 mesclado; deploy `44766555983` com o passo "Limpar cache do Cloudflare" verde (purge automático funcionando). SSL Labs nota **A**. Variables `DOMINIO_ATIVO=true` e `MIGRACAO_CONCLUIDA=true` criadas. HSTS de 1 ano aplicado. Search Console: propriedade de **domínio** `aeciopires.com` com TXT `google-site-verification` criado no Cloudflare (visível no DNS público; aguardando o Google validar). Web Analytics registrando métricas (conferido pelo autor). `origin-cert.yml` verde (run `44773088455`, disparo manual): certificado do GitHub Pages para `blog.aeciopires.com` válido até 18/02/2027 (89 dias). Search Console configurado pelo autor (propriedade de domínio verificada, sitemap enviado); a inspeção da home mostrou 403 do rastreamento anterior à virada, e o teste ao vivo passou ("O URL está disponível para o Google"; [cloudflare.md](../../docs/cloudflare.md), seção 10). Comparação site no ar × build local: idênticos, exceto alterações do Cloudflare; *Email Obfuscation* desligado e Web Analytics em instalação manual (beacon duplicado), ambos pelo autor. **Pendente:** acompanhar indexação e 404 no Search Console por 1–2 semanas |

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

### Fase 5 — Testes funcionais — concluída em 20/11/2026

A virada de DNS aconteceu antes destes testes; o autor executou o roteiro no domínio final, <https://blog.aeciopires.com/>:

- [x] Celular (Android/iOS) e computador: home, um post longo, Categorias, Tags, Cursos, Sobre.
- [x] Modos claro/escuro (botão e preferência do sistema).
- [x] Busca: `kubernetes helm`, `instalacao zabbix`, `kubernets` (`Ctrl K` no computador).
- [x] RSS: `/index.xml` num leitor de feeds.
- [x] Lighthouse (Chrome DevTools → Lighthouse, mobile): Performance **99**, Accessibility **96**, Best Practices **96**, SEO **100** (20/11/2026; referência para comparar após atualizações do tema/Hugo).
- [x] Formulário de Contato (Jotform): enviar uma mensagem de teste e conferir o recebimento.
- [x] Botões "Quero fazer o curso" (Docker e Kubernetes) abrem o formulário certo.
- [x] giscus: comentar num post como teste, conferir em Discussions → Comentários e apagar.
- [x] Redirecionamentos: `/arquivos/`, `/testemunho-de-uma-norte-coreana/`, `/category/zabbix-2/`.

**Limitação do staging (histórico):** imagens e links internos escritos no corpo dos posts usam caminho absoluto (`/wp-content/...`, `/slug/`) e dão 404 no staging (subpasta `/blog-aeciopires/`). No domínio final (raiz) funcionam; conferir o conteúdo localmente com `make serve-prod`. O `make validate-links` cobre esses caminhos.

**Fase 0:** não exportar relatórios do Jetpack Stats/Google Analytics (decisão do autor, 20/11/2026); anotar o DNS antigo de `blog` ficou sem efeito (virada feita). 2FA ativado no GitHub e no Cloudflare (20/11/2026).

### Fase 6 — Virada de DNS

Passo a passo com caixas de seleção em [docs/cloudflare.md](../../docs/cloudflare.md):

1. ~~Seção 1 (ordem importa): domínio verificado no GitHub, `CNAME`, *Custom domain*, *Enforce HTTPS*, SSL, proxy.~~ Feito.
1. ~~Seções 2 a 4: zona, Cache Rules, WAF/rate limiting/redirects.~~ Feito.
1. ~~Seção 5: headers de segurança.~~ Feito: CSP efetiva, nota A no securityheaders.com; HSTS em `max-age=31536000` (sem `includeSubDomains`/`preload`) desde 20/11/2026.
1. ~~Seção 4: domínio raiz/`www` (erro 1016, R3) e subdomínios `jenkins`/`puppet` (R4, R5).~~ Feito.
1. ~~Seção 7: Web Analytics e token público em `params.toml` (via PR).~~ Feito (beacon no ar desde o deploy `44760468192`).
1. ~~Secrets/variables: [MAINTENANCE.md, seção 9 → Variables e secrets](../../docs/MAINTENANCE.md) (como criar o token e achar o Zone ID).~~ Feito em 20/11/2026. Confirmar no próximo deploy o passo "Limpar cache do Cloudflare" verde no job `deploy`.
1. Seção 9: testes após a virada (feitos: cache, feeds, WAF, uploads, redirects, securityheaders, SSL Labs nota A, purge automático; Web Analytics registrando, `origin-cert.yml` verde); reenviar `sitemap.xml` no Search Console (89 URLs; passo a passo na seção 10 do `cloudflare.md`).
1. ~~Depois: `DOMINIO_ATIVO=true`, `MIGRACAO_CONCLUIDA=true` (pelo site do GitHub: Settings → Secrets and variables → Actions → *Variables*).~~ Feito em 20/11/2026: o `origin-cert.yml` passa a rodar (segundas) e o passo "URLs do WordPress preservadas" (`make compare-urls`) do `pr-check.yml` passa a bloquear o PR. A checagem online de links externos continua não bloqueante.
1. ~~Desligar a hospedagem do WordPress~~: desligada pelo autor em 20/11/2026, sem os 30 dias de observação previstos. Seguro porque nenhum registro de DNS aponta para ela (`blog` no GitHub Pages; raiz, `www`, `jenkins` e `puppet` só redirecionam na borda; sem MX). Manter o backup em `~/Desktop/bkp_blog`; acompanhar 404 no Search Console.

### Adiado

1. Testar `make check-deps && make install-deps && make serve` no macOS (amd64/arm64) e no Ubuntu 24.04/26.04 (só há acesso ao Ubuntu 22.04, onde tudo foi testado). Atenção ao padrão do lychee para macOS no `mise.toml`.

## Depois da migração (PRs #6 a #10, registro retroativo)

Registrado em 21/11/2026. Resumo das decisões na seção 19 do [PLAN.md](PLAN.md).

| PR | Data | O que mudou | Validação |
|---|---|---|---|
| #6 | 20/11/2026 | Linktree como terceiro perfil do autor; registros do Search Console e do Cloudflare | `make validate` |
| #7 | 20/11/2026 | Ordenação da home (override de `recent-articles/cardview.html` + `assets/js/ordenar-home.js`; `scripts/visualizacoes.mjs` com o Web Analytics); nuvem de tags sem número visível; `make aviso-atualizacao`, `prosa` e `verificar-texto`; skill `escrever-post`; posts de Docker/Kubernetes revisados e testados em Docker/kind; novos posts `docker-hub-image-statistics` e `myhealthcheck`; post do ArgoCD na AWS removido (alias na home) | `make validate`; testes em Docker/kind (skill `revisar-conteudo`) |
| #8 | 21/11/2026 | Home leve (HTML de ~298 KB para ~83 KB; JSON com SRI e molde do tema; `make check-home` no validate, pr-check e deploy); cartões da home como links e total de repositórios (`data/github.json` no pre-commit); banner de tecnologias fluido no celular; CSP aplicada e corrigida; escape dos resultados da busca (`busca.js`) e redirecionamentos legados só para caminhos do site; taxonomia `series` desligada | `make validate`; teste da CSP no site publicado (0 violações) |
| #9 | 21/11/2026 | Acessibilidade 100 (contraste de "Ordenar:" e dos links em avisos, chaves `nav.*` em pt-BR, nome do botão de busca); logos em WebP no build e foto do autor menor; `legacy-redirect.js` async; `make lighthouse` | Lighthouse publicado: Performance 100, Boas práticas 100, SEO 100; Acessibilidade 100 no build local |
| #10 | 21/11/2026 | Versão en-US (detalhes abaixo) | Ver "Testes do PR #10" |

### PR #10 — versão em inglês (en-US)

- **Conteúdo:** 75 posts e páginas traduzidos (`index.en.md` ao lado do original) e 41 páginas de seção, categoria e tag (`_index.en.md`). Feito por 9 agentes `tradutor-en` em paralelo, seguindo a skill `traduzir-conteudo`, com revisão gramatical (`make prosa-en`). Sete conteúdos que já eram bilíngues no original (`sobre`, `helm-chart-zabbix-7-0-0`, `helm-chart-zabbix-8-0-0`, `helm-chart-kubernetes-watchdog-pod-restart-delete`, `imagem-docker-para-troubleshooting` e os dois resumos de incidente, GCP e AWS) receberam `bilingue: true` e não têm tradução (decisão do autor); em inglês aparecem na home, no total de posts e na busca, com a URL original.
- **Garantia:** `scripts/i18n.mjs` (`make check-i18n`, `i18n-status`, `i18n-diff`, `i18n-ok`, `i18n-sync-fm`, `prosa-en`) no pre-commit, no `make validate`, no `pr-check.yml` e no `deploy.yml`.
- **Interface:** `config/_default/languages.en.toml` e `menus.en.toml`; textos dos layouts próprios em `i18n/pt-BR.yaml` e `i18n/en.yaml` (chaves `blog.*`); `[author]` em `params.toml`; grupos do banner com `nome_en`; comentários do giscus com uma discussão por post para os dois idiomas (mapping `specific` com o caminho pt-BR, mantendo as discussões existentes).
- **Redirecionamento pelo idioma do navegador:** ligado com override de `layouts/partials/language-redirect.html` + `assets/js/idioma-config.js` (async, SRI). O tema usa script inline que muda em cada página; uma exceção na CSP não era viável (hash por página) nem segura (`'unsafe-inline'`). Robôs e Lighthouse não são redirecionados; `hreflang` x-default = pt-BR; o `check-i18n` guarda o hash dos arquivos do tema para revisar o override a cada versão do Blowfish.
- **Correções de conteúdo:** os agentes acharam erros nos originais pt-BR e os corrigiram nos dois idiomas, com registro em `reports/correcoes-conteudo-2026-11-21.md` (130 itens; os 20 pendentes foram decididos pelo autor, como Gateway API 1.7, `Michal Simon`, RFC 2818, `saltproject.io`, RabbitMQ 4.4.1, remoção do vídeo repetido e do link duplicado). Todos conferidos pelo autor antes do commit (`make check-correcoes`).
- **Outras correções:** `make aviso-atualizacao` apagava o aviso anterior (agora o novo entra acima; os avisos de 20/11 do Flux CD e do Zabbix com Docker foram restaurados); `make build` local gerava `robots.txt` com `Disallow: /` porque o `[env]` do `mise.toml` vencia o ambiente de produção (o deploy não era afetado); links em citações sublinhados (o Lighthouse reprovava a acessibilidade em 30 posts); "Go" vira "Golang" em inglês (o Lighthouse trata "Go" como texto de link genérico).

### Testes do PR #10

- `make validate` verde, `make validate-diagrams` OK, `hugo --logLevel info` sem avisos.
- `make test-idioma`: 12 cenários num Chromium com a CSP oficial aplicada, zero violações.
- Seletor de idioma nos modos claro e escuro, no computador e no celular, sem rolagem horizontal de 320 px em diante.
- `make lighthouse-local`, 13 páginas pt-BR e en, celular e computador: Performance 99–100, Acessibilidade 100, Boas práticas 100 e SEO 100, iguais à linha de base de antes da mudança. Exceção que já existia: Boas práticas 96 no `/sobre/` no celular, por causa da foto do autor.

### Desvios em relação ao plano (pós-migração)

| Plano | Implementado | Motivo |
|---|---|---|
| Blog só em pt-BR | pt-BR + en-US em `/en/` | Pedido do autor (21/11/2026) |
| Perfis do autor em `languages.pt-br.toml` | `[author]` em `params.toml` | Valer para os dois idiomas sem duplicar (o Hugo mescla com o `[params.author]` de cada idioma) |
| Customizar o tema só por override, o mínimo possível | Novo override: `layouts/partials/language-redirect.html` | Única forma de ligar o redirecionamento por idioma sem afrouxar a CSP; protegido pelo hash no `check-i18n` e pelo `make test-idioma` |
| Lighthouse só no site publicado | Também `make lighthouse-local` (build de produção servido no container) | Medir antes do commit e comparar pt-BR com en-US |

**Publicado em 21/11/2026:** PR #10 mesclado; deploy `44929679151` verde (inclusive "Versão em inglês completa e em dia" e "Limpar cache do Cloudflare"). Site publicado × build local: 897 de 906 arquivos idênticos (diferenças só do Cloudflare e do JSON das visualizações). `make test-idioma URL=https://blog.aeciopires.com`: 12 cenários OK com a CSP real. Lighthouse publicado (8 páginas pt-BR/en, celular e computador): 100 em todas as categorias (Performance 99 em `/en/` no celular, variação).

### Pendências do autor (PR #10)

1. ~~Revisar e fazer o merge do PR #10.~~ Feito.
2. ~~Search Console, depois do deploy ([cloudflare.md](../../docs/cloudflare.md), seção 10): sitemaps e inspeção de URL dos dois idiomas.~~ Feito pelo autor em 21/11/2026. **Pendente:** em 1–2 semanas, conferir em **Indexação → Páginas** as páginas `/en/...` indexadas.
3. Formulário de contato em inglês (Jotform): fica a cargo do autor; a página `/en/contato/` usa o mesmo formulário por enquanto.

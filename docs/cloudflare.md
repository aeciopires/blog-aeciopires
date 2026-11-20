# Cloudflare: configuração e contingências

Fonte da verdade da configuração do Cloudflare (plano Free) para `blog.aeciopires.com`. **Toda mudança no painel atualiza este documento no mesmo dia.** O Claude Code não altera o painel: propõe a mudança aqui. Detalhes e motivos: [PLAN.md, seções 10 e 11](../PLANS/blog-migration/PLAN.md).

> Status: **planejado, ainda não aplicado.** Aplicar na Fase 5 (staging) e na virada de DNS (Fase 6). Ao aplicar, marcar cada item e anotar a data.

Limites do Free (conferir no painel): WAF custom rules 5, rate limiting 1, Single Redirects 10, Cache Rules 10, Transform Rules 10 por tipo.

## 1. Virada de DNS (ordem importa)

O GitHub só emite o certificado se enxergar o DNS apontando para ele; por isso o proxy é ligado **por último**.

1. [ ] Anotar o registro `blog` atual (rollback): tipo, valor, proxy. → `__________`
2. [ ] Verificar o domínio na conta GitHub: Settings (usuário) → Pages → *Add a domain* → `aeciopires.com` → TXT `_github-pages-challenge-aeciopires` → Verify.
3. [ ] DNS: `blog` → `CNAME aeciopires.github.io`, **DNS only (nuvem cinza)**. Remover `A`/`AAAA` antigos de `blog`.
4. [ ] Repositório → Settings → Pages → *Custom domain*: `blog.aeciopires.com`. Aguardar "DNS check successful".
5. [ ] Aguardar o certificado e marcar **Enforce HTTPS**.
6. [ ] SSL/TLS: **Full (strict)**; *Always Use HTTPS*; TLS mínimo 1.2; TLS 1.3; *Automatic HTTPS Rewrites*. **Não** ligar o HSTS da zona.
7. [ ] DNS: ligar o **proxy** (nuvem laranja) em `blog`.
8. [ ] Aplicar as seções 3 a 6 e ativar o Web Analytics (seção 7).
9. [ ] Repositório: secret `CLOUDFLARE_API_TOKEN`, variables `CLOUDFLARE_ZONE_ID` e `DOMINIO_ATIVO=true`.
10. [ ] Testar (seção 9) e reenviar o `sitemap.xml` no Search Console.
11. [ ] Manter o WordPress em subdomínio temporário com acesso restrito por 30 dias; depois, cancelar.

Com o proxy ligado, o GitHub Pages pode exibir "not pointing to GitHub". **É esperado.**

**Rollback:** restaurar o registro `blog` anotado no passo 1. Vale em segundos/minutos.

## 2. Configurações gerais da zona

| Onde | Configuração |
|---|---|
| SSL/TLS | Full (strict) · Always Use HTTPS · TLS ≥ 1.2 · TLS 1.3 · Automatic HTTPS Rewrites |
| Security → Settings | Security Level *Medium* · Browser Integrity Check ligado |
| Security → Bots | *Block AI bots* **desligado** (decisão) · *Bot Fight Mode* **desligado** |
| Security → WAF → Managed rules | *Cloudflare Free Managed Ruleset* |
| Speed / Network | HTTP/3, 0-RTT, Brotli, Early Hints · **Rocket Loader desligado** |
| Caching | Tiered Cache (Smart Topology) ligado |
| Scrape Shield | Email Obfuscation ligado · Hotlink Protection **desligado** |
| DNS | **DNSSEC** ligado (DS no registrador). Se houver CAA, incluir `letsencrypt.org` |
| Notifications | Alertas de certificado e DDoS |

## 3. Cache Rules

O deploy limpa o cache (`deploy.yml`), então é seguro guardar HTML na borda.

| # | Nome | Expressão | Ação |
|---|---|---|---|
| C1 | Não cachear ACME | `starts_with(http.request.uri.path, "/.well-known/acme-challenge/")` | Bypass |
| C2 | Cachear o blog | `http.host eq "blog.aeciopires.com"` | Eligible · Edge TTL 1 dia · Browser TTL: respeitar origem |
| C3 | Assets com fingerprint | `http.host eq "blog.aeciopires.com" and (starts_with(http.request.uri.path, "/css/") or starts_with(http.request.uri.path, "/js/") or starts_with(http.request.uri.path, "/fonts/"))` | Browser TTL 1 ano |

## 4. WAF, rate limiting e redirects

| # | Nome | Expressão | Ação |
|---|---|---|---|
| W1 | Liberar ACME | `starts_with(http.request.uri.path, "/.well-known/acme-challenge/")` | **Skip** (demais regras + rate limit) |
| W2 | Só leitura | `not http.request.method in {"GET" "HEAD" "OPTIONS"}` | Block |
| W3 | Scanners e arquivos sensíveis | `http.request.uri.path contains ".php" or http.request.uri.path contains "/wp-admin" or http.request.uri.path contains "/wp-includes" or http.request.uri.path contains "/xmlrpc" or http.request.uri.path contains "/.env" or http.request.uri.path contains "/.git" or http.request.uri.path contains "/cgi-bin"` | Block |
| W4 | User-agent vazio | `http.user_agent eq ""` | Block |
| W5 | Emergência | ex.: país/ASN de ataque em curso | Managed Challenge (**desativada**) |

W3 **não** bloqueia `/wp-content/`: `/wp-content/uploads/` serve as imagens antigas.

**Rate limiting:** `http.host eq "blog.aeciopires.com"` → 100 requisições / 10 s por IP → Block 10 s.

**Single Redirects:**

| # | Origem | Destino | Tipo |
|---|---|---|---|
| R1 | `/feed/`, `/feed`, `/comments/feed/` | `https://blog.aeciopires.com/index.xml` | 301 |
| R2 | wildcard `https://blog.aeciopires.com/*/feed/` | `https://blog.aeciopires.com/${1}/index.xml` | 301 |

## 5. Headers de segurança (Transform Rules → Response Headers, só `blog.aeciopires.com`)

| Header | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=300` no início; depois `max-age=31536000` (**sem** `includeSubDomains`/`preload`) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | abaixo (primeiro como `Content-Security-Policy-Report-Only` por 1–2 semanas) |

```text
default-src 'self';
script-src 'self' https://static.cloudflareinsights.com https://form.jotformz.com https://cdn.jotfor.ms https://giscus.app;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https://cloudflareinsights.com;
frame-src https://form.jotformz.com https://giscus.app https://www.youtube-nocookie.com https://www.youtube.com;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
object-src 'none';
upgrade-insecure-requests
```

- O Blowfish aplica o modo escuro com JS do bundle (`assets/js/appearance.js`), sem script inline; confirmar na fase *Report-Only*. Se aparecer script inline, usar *hashes* `'sha256-…'`, nunca `'unsafe-inline'` em `script-src`.
- `style-src 'unsafe-inline'`: o tema e a nuvem de tags usam atributos `style`.
- giscus: `client.js` de `giscus.app` cria um iframe do mesmo domínio; as folhas de tema (`/giscus/t9-*.css`) são lidas pelo iframe.
- Jotform (embed por script): `form.jotformz.com` e `cdn.jotfor.ms` em `script-src`; confirmar a lista exata na fase *Report-Only* (pode usar outros `*.jotfor.ms`).
- Todo novo embed/serviço: atualizar esta CSP **antes** de publicar o conteúdo.

## 6. Acesso direto à origem — risco aceito

`https://aeciopires.github.io/blog-aeciopires/` redireciona (301) ao domínio. Os IPs do GitHub Pages (`185.199.108–111.153`) com `Host: blog.aeciopires.com` respondem sem o Cloudflare e não há como bloquear (hospedagem compartilhada). Impacto baixo: o conteúdo é público. Alternativa futura: Cloudflare Pages.

## 7. Cloudflare Web Analytics

- Ativar em **Analytics & Logs → Web Analytics → `blog.aeciopires.com`**.
- Copiar o token público do site para `config/_default/params.toml` → `[cloudflareAnalytics] token`. O beacon só entra no build de produção (`layouts/partials/extend-head.html`).
- Sem cookies → sem banner de consentimento; descrito na página Privacidade.

## 8. Contingência: certificado da origem (erro 526)

O GitHub renova o certificado da origem (~90 dias). Com o proxy ligado, a validação passa pelo Cloudflare (por isso C1/W1). O `origin-cert.yml` falha se faltarem menos de 20 dias.

1. Desligar o proxy de `blog` (nuvem cinza) por ~1 hora para o GitHub renovar.
2. Conferir: `echo | openssl s_client -connect 185.199.108.153:443 -servername blog.aeciopires.com 2>/dev/null | openssl x509 -noout -subject -enddate`
3. Religar o proxy.
4. Emergência: SSL **Full** (sem *strict*) temporariamente, e voltar para Full (strict) assim que renovar.

## 9. Testes após a virada

- [ ] `curl -sI https://blog.aeciopires.com/` → `server: cloudflare`; 2ª requisição com `cf-cache-status: HIT`.
- [ ] `/feed/` e `/tag/helm/feed/` → 301 para `index.xml`.
- [ ] `/wp-login.php` e `POST /` → 403.
- [ ] `/wp-content/uploads/…` → 200.
- [ ] SSL Labs nota A; securityheaders.com nota A (após CSP aplicada).
- [ ] Deploy de teste aparece em ~2 min (purge ok); Web Analytics registrando; `origin-cert.yml` verde.

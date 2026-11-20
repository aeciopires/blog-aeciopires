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
| W3 | Scanners e arquivos sensíveis | expressão no bloco abaixo | Block |
| W4 | User-agent vazio | `http.user_agent eq ""` | Block |
| W5 | Emergência | ex.: país/ASN de ataque em curso | Managed Challenge (**desativada**) |

Expressão da W3 (colar no *Edit expression*):

```text
(
    (
      (
        http.request.uri.path eq "/wp-admin"
        or starts_with(http.request.uri.path, "/wp-admin/")
      )
      and http.request.uri.path ne "/wp-admin/admin-ajax.php"
    )
    or http.request.uri.path contains "/wp-includes"
    or http.request.uri.path contains "/wp-login.php"
    or http.request.uri.path contains "/xmlrpc.php"
    or http.request.uri.path contains "/xmlrpc"
    or http.request.uri.path contains "/cgi-bin"
    or http.request.uri.path contains "/wp-json/wp/v2/users"
    or http.request.uri.path contains "/wp-json/wp/v2/pages"
    or http.request.uri.path contains "wp-config.php"
    or http.request.uri.path contains "/wp-comments-post.php"
    or http.request.uri.path contains "/wp-json/oembed/1.0/embed"
    or http.request.uri.path contains "/feed"
    or http.request.uri.path contains "/tag/ssh-server/feed/"
    or http.request.uri.path contains "wp-links-opml.php"
    or http.request.uri.path contains "readme.html"
    or http.request.uri.path contains "license.txt"
    or http.request.uri.path contains "debug.log"
    or http.request.uri.path contains "wp-activate.php"
    or http.request.uri.path contains "upgrade.php"
    or http.request.uri.path contains ".env"
    or http.request.uri.path contains "wp-signup.php"
    or http.request.uri.path contains "install.php"
    or http.request.uri.path contains "wp-config.php.bak"
    or http.request.uri.path contains "wp-config.old"
    or http.request.uri.path contains "/.git"
    or http.request.uri.path contains "/.svn"
    or http.request.uri.path contains "/.hg"
    or http.request.uri.path contains ".gitignore"
    or http.request.uri.path contains ".gitattributes"
    or http.request.uri.path contains ".htaccess"
    or http.request.uri.path contains "wp-config-sample.php"
    or http.request.uri.path contains "composer.json"
    or http.request.uri.path contains "composer.lock"
    or http.request.uri.path contains "phpunit.xml"
    or http.request.uri.path contains "phpunit.xml.dist"
    or http.request.uri.path contains "phpinfo.php"
    or http.request.uri.path contains "error_log"
    or http.request.uri.path contains "server-status"
    or http.request.uri.path contains "server-info"
    or http.request.uri.path contains "wp-trackback.php"
    or http.request.uri.path contains "web.config"
    or http.request.uri.path contains "nginx.conf"
    or http.request.uri.path contains "docker-compose.yml"
    or http.request.uri.path contains "Dockerfile"
    or http.request.uri.path contains ".sqlite"
    or http.request.uri.path contains ".sqlite3"
    or http.request.uri.path contains ".dump"
    or http.request.uri.path contains "adminer.php"
    or http.request.uri.path contains "phpmyadmin"
    or http.request.uri.path contains "status.php"
    or http.request.uri.path contains "/backup.zip"
    or http.request.uri.path contains "/site.zip"
    or http.request.uri.query contains "wp-config.php"
    or http.request.uri.query contains "/etc/passwd"
    or http.request.uri.query contains "boot.ini"
    or http.request.uri.path contains ".php"
  )
```

W3 **não** bloqueia `/wp-content/`: `/wp-content/uploads/` serve as imagens antigas.
O `contains "/feed"` não quebra os feeds antigos: os *Single Redirects* (R1/R2) rodam antes do WAF e respondem 301 primeiro.
Conferido contra todas as URLs do build e de `static/wp-content/` (nenhuma casa com a W3).

**Rate limiting:** `http.host eq "blog.aeciopires.com" or http.host eq "aeciopires.com"` → 100 requisições / 10 s por IP → Block 10 s.

**Single Redirects:**

| # | Origem | Destino | Tipo |
|---|---|---|---|
| R1 | `/feed/`, `/feed`, `/comments/feed/` | `https://blog.aeciopires.com/index.xml` | 301 |
| R2 | wildcard `https://blog.aeciopires.com/*/feed/` | `https://blog.aeciopires.com/${1}/index.xml` | 301 |
| R3 | `aeciopires.com` e `www.aeciopires.com` (qualquer caminho) | `https://blog.aeciopires.com` + mesmo caminho | 301 |
| R4 | `jenkins.aeciopires.com` | `https://aeciopires.github.io/blog-livro-jenkins/` | 301 |
| R5 | `puppet.aeciopires.com` | `https://aeciopires.github.io/blog-livro-puppet/` | 301 |

### Domínio raiz e `www` (erro 1016)

**Status:** corrigido pelo autor em 20/11/2026 (conferido: `aeciopires.com` e `www.aeciopires.com/sobre/` → 301 para o blog, mantendo o caminho).

**Sintoma (20/11/2026):** `https://aeciopires.com/` mostrava *Error 1016 — Origin DNS error* (HTTP 530). O blog não era afetado.

**Causa:** os registros `@` e `www` estavam com proxy (nuvem laranja) apontando para um destino que não resolve mais (CNAME da hospedagem antiga). Com proxy ligado, o Cloudflare precisa resolver o destino para buscar a página; como não consegue, devolve 1016. O plano da migração cobria só o `blog`, então o domínio raiz ficou de fora.

**Solução:** o domínio raiz e o `www` só redirecionam para o blog (R3):

1. [x] **DNS → Records:** anotar os registros atuais de `@` e `www` (para voltar atrás). Trocar ambos por `A` → `192.0.2.1`, **Proxied** (nuvem laranja). É um IP reservado para documentação, padrão do Cloudflare para nomes que só existem para redirecionar; o tráfego nunca chega a ele. Não mexer em `MX`, `TXT` (SPF/DKIM/DMARC, `_github-pages-challenge-*`) nem no `blog`.
2. [x] **Rules → Redirect Rules → Create rule** (`Domínio raiz para o blog`):
   - *Custom filter expression*: `(http.host eq "aeciopires.com") or (http.host eq "www.aeciopires.com")`
   - *Then*: **Dynamic**, expressão `concat("https://blog.aeciopires.com", http.request.uri.path)`, código **301**, **Preserve query string** marcado.
3. [x] Conferir:

   ```bash
   curl -sI https://aeciopires.com/ | grep -iE '^(HTTP|location)'            # 301 → https://blog.aeciopires.com/
   curl -sI https://www.aeciopires.com/sobre/ | grep -iE '^(HTTP|location)'  # 301 → https://blog.aeciopires.com/sobre/
   ```

- O certificado *Universal* do Cloudflare já cobre `aeciopires.com` e `*.aeciopires.com`; não é preciso nada no GitHub.
- Sem WAF/headers extras para o domínio raiz: ele só responde 301. O rate limit já inclui `aeciopires.com`.
- **Volta atrás:** restaurar os registros anotados no passo 1 e desativar a regra.

### Subdomínios dos livros: `jenkins` e `puppet` (R4, R5)

`jenkins.aeciopires.com` e `puppet.aeciopires.com` só redirecionam (301) para os sites dos livros no GitHub Pages
(`aeciopires.github.io/blog-livro-jenkins/` e `aeciopires.github.io/blog-livro-puppet/`). Não dependem do WordPress nem deste repositório.

**Status:** configurado pelo autor em 20/11/2026 e conferido (301 para os destinos acima, `server: cloudflare`).

- **DNS:** `A` → `192.0.2.1`, **Proxied** (mesmo padrão do domínio raiz). O 301 é respondido na borda do Cloudflare, que nunca consulta o destino do registro; por isso o desligamento da hospedagem antiga não os afeta. **Nunca** deixar esses nomes com nuvem cinza (sem proxy, o redirect não roda) nem apontando para um CNAME de hospedagem que pode deixar de existir (erro 1016).
- **Regras:** *Redirect Rules* (no lugar das antigas *Page Rules*, que o Cloudflare está descontinuando). Para cada subdomínio:
  - *Custom filter expression*: `http.host eq "jenkins.aeciopires.com"` (ou `puppet`)
  - *Then*: **Static**, URL de destino acima, código **301**.
- **Conferir:**

  ```bash
  for n in jenkins puppet; do curl -s -o /dev/null -w "$n: %{http_code} -> %{redirect_url}\n" "https://$n.aeciopires.com/"; done
  ```

- **Mudar o destino** (ex.: livro com domínio próprio): editar só a regra; o DNS fica igual.

## 5. Headers de segurança (Transform Rules → Response Headers, só `blog.aeciopires.com`)

**Status (20/11/2026):** regra aplicada; CSP já efetiva (`Content-Security-Policy`); securityheaders.com nota **A**. Pendente: HSTS ainda em `max-age=300` (passo 7).

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

### Passo a passo no painel

Fazer **depois** de um deploy já com o domínio (HTML sem o prefixo `/blog-aeciopires/`), para testar o site correto.

1. [ ] Cloudflare → `aeciopires.com` → **Rules → Overview → Create rule → Response Header Transform Rule**.
2. [ ] Nome `Headers de segurança do blog`; *Custom filter expression*: `http.host eq "blog.aeciopires.com"`.
3. [ ] Em **Then → Modify response header**, um **Set static** por header da tabela acima, com HSTS em `max-age=300` e a CSP com o nome `Content-Security-Policy-Report-Only`. A CSP vai em uma linha só:

   ```text
   default-src 'self'; script-src 'self' https://static.cloudflareinsights.com https://form.jotformz.com https://cdn.jotfor.ms https://giscus.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; frame-src https://form.jotformz.com https://giscus.app https://www.youtube-nocookie.com https://www.youtube.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests
   ```

4. [ ] **Deploy** e conferir:

   ```bash
   curl -sI https://blog.aeciopires.com/ \
     | grep -iE 'strict-transport|content-security|x-frame|referrer-policy|permissions-policy|x-content-type'
   ```

5. [ ] **Fase *Report-Only* (1–2 semanas):** com DevTools → Console aberto, navegar pela home, busca, troca claro/escuro, um post com comentários (giscus), um post com vídeo (YouTube) e `/contato/` (Jotform). Cada violação aparece como `[Report Only] Refused to …`. Para cada domínio legítimo citado: atualizar primeiro a CSP desta seção (PR) e depois a regra no painel.
6. [ ] Sem violações: renomear o header para `Content-Security-Policy` (mesmo valor) e repetir os testes do passo 5.
7. [ ] Estável por alguns dias: HSTS para `max-age=31536000` (**sem** `includeSubDomains`/`preload`).
8. [ ] <https://securityheaders.com/?q=blog.aeciopires.com> com nota A; marcar o item na seção 9.

**Se algo quebrar:** desativar a regra (efeito imediato) ou voltar só a CSP para `-Report-Only`. O HSTS já enviado continua no navegador do leitor até expirar; por isso começar com `max-age=300`.

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

- [x] `curl -sI https://blog.aeciopires.com/` → `server: cloudflare`; 2ª requisição com `cf-cache-status: HIT`.
- [x] `/feed/` e `/tag/helm/feed/` → 301 para `index.xml`.
- [x] `/wp-login.php` e `POST /` → 403.
- [x] `/wp-content/uploads/…` → 200.
- [x] `https://aeciopires.com/` e `https://www.aeciopires.com/` → 301 para o blog (R3).
- [x] `jenkins.aeciopires.com` e `puppet.aeciopires.com` → 301 para os sites dos livros (R4, R5).
- [ ] SSL Labs nota A.
- [x] securityheaders.com nota A (CSP efetiva, 20/11/2026).
- [ ] Deploy de teste aparece em ~2 min (purge ok); Web Analytics registrando; `origin-cert.yml` verde.

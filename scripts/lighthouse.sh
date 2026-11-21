#!/usr/bin/env bash
# make lighthouse [URL=https://blog.aeciopires.com/] (docs/MAINTENANCE.md, seção 4).
# make lighthouse-local [PAGINAS="/ /en/ /slug/ /en/slug/"]
# Roda o Lighthouse em Docker (imagem local blog-lighthouse:<versão>, criada na primeira vez a partir de
# docker/lighthouse/Dockerfile) nos perfis celular e computador e grava os relatórios em reports/lighthouse/.
# Modo normal: mede o site PUBLICADO (o servidor do Hugo, make serve/serve-prod, não minifica nem comprime).
# Modo --local: gera o build de produção em reports/lighthouse/site/ (sem o beacon do Cloudflare, para não
# contar visitas de teste) e o serve DENTRO do container (docker/lighthouse/local.mjs, com gzip e cache como
# o Cloudflare). Serve para medir antes do commit, por exemplo as páginas pt-BR e en-US de uma mudança.
# O Chromium roda com --no-sandbox só dentro deste container descartável (usuário sem root).
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
LOCAL=""
if [ "${1:-}" = "--local" ]; then
  LOCAL=1
  shift
fi
URL="${1:-https://blog.aeciopires.com/}"
NODE_IMAGE="${NODE_IMAGE:-node:26-bookworm-slim}"
LIGHTHOUSE_VERSION="${LIGHTHOUSE_VERSION:-13.6.0}"
IMAGEM="blog-lighthouse:${LIGHTHOUSE_VERSION}"
SAIDA="reports/lighthouse"

command -v docker >/dev/null 2>&1 || { echo "ERRO: Docker não encontrado (no macOS, inicie o Colima)" >&2; exit 1; }
if [ -n "$LOCAL" ]; then
  PAGINAS="${1:-/ /en/ /primeiros-passos-com-docker/ /en/primeiros-passos-com-docker/}"
  for p in $PAGINAS; do
    printf '%s' "$p" | grep -Eq '^/[A-Za-z0-9/._-]*$' || { echo "ERRO: caminho inválido '$p' (use /slug/ ou /en/slug/)" >&2; exit 1; }
  done
else
  printf '%s' "$URL" | grep -Eq '^https?://[^[:space:]]+$' || { echo "uso: make lighthouse URL=https://…" >&2; exit 1; }
fi

if ! docker image inspect "$IMAGEM" >/dev/null 2>&1; then
  echo "== Criando $IMAGEM (só na primeira vez)"
  docker build -q -t "$IMAGEM" --build-arg NODE_IMAGE="$NODE_IMAGE" --build-arg LIGHTHOUSE_VERSION="$LIGHTHOUSE_VERSION" docker/lighthouse >/dev/null
fi

mkdir -p "$SAIDA"
chmod 777 "$SAIDA" # o container grava como o usuário "node"

if [ -n "$LOCAL" ]; then
  SITE="$SAIDA/site"
  rm -rf "$SITE"
  echo "== Build de produção em $SITE (sem analytics)"
  # env dentro do mise exec: o [env] do mise.toml (HUGO_ENVIRONMENT=development) venceria a variável de fora.
  mise exec -- env HUGO_ENVIRONMENT=production HUGO_SEM_ANALYTICS=1 hugo --gc --minify --quiet -d "$SITE" -b "http://localhost:8080/"
  # shellcheck disable=SC2086
  docker run --rm --name blog-lighthouse-local --shm-size=1g --entrypoint node \
    -v "$RAIZ/$SITE:/site:ro" -v "$RAIZ/docker/lighthouse/local.mjs:/home/node/local.mjs:ro" -v "$RAIZ/$SAIDA:/out" \
    "$IMAGEM" /home/node/local.mjs $PAGINAS
  nomes=""
  for p in $PAGINAS; do
    n="local$(printf '%s' "$p" | sed -E 's#[^A-Za-z0-9]+#-#g; s#-+$##')"
    [ "$n" = "local" ] && n="local-home"
    nomes="$nomes $n"
  done
else
  nome="$(printf '%s' "$URL" | sed -E 's#^https?://##; s#[^A-Za-z0-9]+#-#g; s#-+$##')"
  nomes="$nome"
  for perfil in mobile desktop; do
    extra=""
    [ "$perfil" = "desktop" ] && extra="--preset=desktop"
    echo "== $perfil: $URL"
    # shellcheck disable=SC2086
    docker run --rm --name "blog-lighthouse-$perfil" --shm-size=1g -v "$RAIZ/$SAIDA:/out" "$IMAGEM" "$URL" $extra \
      --output=json --output=html --output-path="/out/$nome-$perfil" \
      --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
  done
fi

# shellcheck disable=SC2086
mise exec -- node - "$SAIDA" $nomes <<'NODE'
const fs = require("node:fs");
const [dir, ...nomes] = process.argv.slice(2);
for (const nome of nomes) for (const perfil of ["mobile", "desktop"]) {
  const r = JSON.parse(fs.readFileSync(`${dir}/${nome}-${perfil}.report.json`, "utf8"));
  const notas = Object.values(r.categories).map((c) => `${c.title}: ${Math.round(c.score * 100)}`).join(" | ");
  console.log(`\n${nome} ${perfil}: ${notas}`);
  for (const c of Object.values(r.categories)) {
    for (const ref of c.auditRefs) {
      const a = r.audits[ref.id];
      if (ref.weight > 0 && a.score !== null && a.score < 0.9 && !["notApplicable", "manual", "informative"].includes(a.scoreDisplayMode)) {
        console.log(`  - [${c.title}] ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`);
      }
    }
  }
}
console.log(`\nRelatórios: ${dir}/<nome>-{mobile,desktop}.report.html`);
NODE

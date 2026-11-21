#!/usr/bin/env bash
# make test-idioma (docs/MAINTENANCE.md, "Redirecionamento pelo idioma do navegador").
# Gera o build de produção (make build) e testa num Chromium (imagem local blog-lighthouse, a mesma do
# make lighthouse) o redirecionamento pelo idioma do navegador, o seletor de idioma e a escolha lembrada,
# com a CSP OFICIAL de docs/cloudflare.md (seção 5) aplicada: qualquer violação falha o teste.
# Rodar a cada atualização do Hugo ou do Blowfish e a cada mudança na CSP ou no override de idioma.
# Com URL (make test-idioma URL=https://blog.aeciopires.com): testa o site PUBLICADO, com a CSP real do Cloudflare.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
LIGHTHOUSE_VERSION="${LIGHTHOUSE_VERSION:-13.6.0}"
IMAGEM="blog-lighthouse:${LIGHTHOUSE_VERSION}"
command -v docker >/dev/null 2>&1 || { echo "ERRO: Docker não encontrado (no macOS, inicie o Colima)" >&2; exit 1; }
docker image inspect "$IMAGEM" >/dev/null 2>&1 || { echo "ERRO: imagem $IMAGEM ausente; rode make lighthouse-local uma vez" >&2; exit 1; }

# CSP oficial: a linha "default-src 'self'; script-src ..." da seção 5. upgrade-insecure-requests sai porque o
# teste é em http://127.0.0.1 (no site publicado, tudo já é HTTPS).
CSP="$(grep -m1 -E "^[[:space:]]*default-src 'self'; script-src" docs/cloudflare.md | sed -E 's/^[[:space:]]+//; s/;?[[:space:]]*upgrade-insecure-requests//')"
[ -n "$CSP" ] || { echo "ERRO: CSP não encontrada em docs/cloudflare.md (seção 5)" >&2; exit 1; }

URL="${1:-}"
if [ -n "$URL" ]; then
  printf '%s' "$URL" | grep -Eq '^https://[^[:space:]]+$' || { echo "uso: make test-idioma [URL=https://…]" >&2; exit 1; }
  docker run --rm --name blog-test-idioma --entrypoint node -e BASE="$URL" \
    -v "$RAIZ/docker/lighthouse/idioma.mjs:/home/node/idioma.mjs:ro" "$IMAGEM" /home/node/idioma.mjs
  exit $?
fi
make -s build >/dev/null
docker run --rm --name blog-test-idioma --entrypoint node -e CSP="$CSP" \
  -v "$RAIZ/public:/site:ro" -v "$RAIZ/docker/lighthouse/idioma.mjs:/home/node/idioma.mjs:ro" \
  "$IMAGEM" /home/node/idioma.mjs

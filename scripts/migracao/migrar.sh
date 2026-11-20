#!/usr/bin/env bash
# Fase 3 (PLAN.md seção 6): pipeline completo e reproduzível da conversão WordPress -> Hugo.
# Uso único; versionado como registro. Refaz o conteúdo migrado do zero (idempotente).
#
#   bash scripts/migracao/migrar.sh <dir-do-backup>
#   (o diretório deve conter o WXR *.xml e a pasta uploads/)
#
# Etapas: wp2hugo (só o corpo em Markdown) -> importar_wordpress.py (front matter pelo WXR,
# comentários sanitizados, mídias) -> normalize-tags (mapa da seção 6.7) -> markdownlint --fix
# -> linguagem dos blocos de código. NÃO toca em: content/_index.md, posts/_index.md, contato,
# privacidade, creditos, data/taxonomia.yaml (só acrescenta sinônimos).
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ"
BKP="${1:?uso: migrar.sh <dir-do-backup com *.xml e uploads/>}"
WXR="$(find "$BKP" -maxdepth 1 -name '*.xml' | head -1)"
[ -f "$WXR" ] && [ -d "$BKP/uploads" ] || { echo "ERRO: $BKP precisa ter o WXR *.xml e uploads/" >&2; exit 1; }

TMP="$(mktemp -d "${TMPDIR:-/tmp}/migracao.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

echo "== 1/6 wp2hugo (sem baixar mídias)"
HUGO_DIR="$(dirname "$(mise which hugo)")"
PATH="$HUGO_DIR:$PATH" mise exec github:ashishb/wp2hugo@1.39.0 -- wp2hugo -source "$WXR" -output "$TMP" \
  -color-log-output=false -generate-nginx-config=false -media-cache-dir "$TMP/cache" >"$TMP/wp2hugo.log" 2>&1
GERADO="$(find "$TMP" -maxdepth 1 -type d -name 'generated-*' | head -1)"

echo "== 2/6 limpando o conteúdo migrado anterior"
find content/posts -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +
rm -rf content/sobre content/cursos content/curso-docker content/curso-kubernetes-k8s \
  content/categories content/tags static/wp-content
find data/comments -name '*.yaml' -delete 2>/dev/null || true

echo "== 3/6 importando (WXR + corpo do wp2hugo)"
python3 -I scripts/migracao/importar_wordpress.py --wxr "$WXR" --wp2hugo "$GERADO/content" --uploads "$BKP/uploads" --write

echo "== 4/6 limpeza das tags (PLAN.md 6.7)"
mise exec -- node scripts/tags.mjs normalize PLANS/blog-migration/tags/tags-map.yaml --write >/dev/null

echo "== 4b/6 tabelas e embeds achatados pelo wp2hugo"
python3 -I scripts/migracao/tabelas_embeds.py --wxr "$WXR" --write

echo "== 5/6 markdownlint --fix"
mise exec -- markdownlint-cli2 --fix "content/**/*.md" "!content/**/_index.md" >/dev/null 2>&1 || true

echo "== 6/6 linguagem dos blocos de código"
python3 -I scripts/migracao/linguagem_blocos.py --write

echo "Concluído. Próximos: make check-tags, make build compare-urls validate-links, revisão da Fase 4."

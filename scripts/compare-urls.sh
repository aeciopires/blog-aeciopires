#!/usr/bin/env bash
# make compare-urls (PLAN.md 7.3): confere se cada URL do WordPress (scripts/urls-wordpress.txt)
# existe no site gerado em public/ — como página ou como redirecionamento (alias) do Hugo.
# URLs tratadas fora do Hugo (regras R1/R2 do Cloudflare) ficam em scripts/urls-excecoes.txt.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
LISTA="scripts/urls-wordpress.txt"
EXCECOES="scripts/urls-excecoes.txt"
PUBLIC="${PUBLIC:-public}"
[ -d "$PUBLIC" ] || { echo "ERRO: $PUBLIC/ não existe (make build)" >&2; exit 1; }
[ -f "$LISTA" ] || { echo "ERRO: $LISTA não existe" >&2; exit 1; }

faltando=0; total=0; redirecionadas=0
while IFS= read -r url || [ -n "$url" ]; do
  case "$url" in '' | \#*) continue ;; esac
  total=$((total + 1))
  if [ -f "$EXCECOES" ] && grep -Fxq "$url" "$EXCECOES"; then continue; fi
  arquivo="$PUBLIC${url%/}/index.html"
  [ "$url" = "/" ] && arquivo="$PUBLIC/index.html"
  if [ -f "$arquivo" ]; then
    if grep -q 'http-equiv="\?refresh' "$arquivo" 2>/dev/null; then redirecionadas=$((redirecionadas + 1)); fi
  else
    echo "FALTANDO: $url"
    faltando=$((faltando + 1))
  fi
done <"$LISTA"

echo "compare-urls: $total URL(s) do WordPress, $redirecionadas via redirecionamento, $faltando faltando."
[ "$faltando" -eq 0 ]

#!/usr/bin/env bash
# Alvos de conteúdo do Makefile (PLAN.md 9.3 e 9.3.1).
#
#   content.sh new        post|page SLUG [TITLE]
#   content.sh publish    post|page SLUG [now]          (DATE=now atualiza a data)
#   content.sh unpublish  post|page SLUG [private]      (PRIVATE=1 move para _privado/)
#   content.sh rm         post|page SLUG [REDIRECT] [sim]
#   content.sh list-drafts
#
# Versão em inglês: cada bundle pode ter index.en.md (tradução, scripts/i18n.mjs). publish exige a
# tradução em dia (make check-i18n do par); publish/unpublish mudam draft/date/lastmod nos DOIS arquivos;
# rm remove o bundle inteiro e, com REDIRECT, cria o alias nos dois idiomas.
#
# Portabilidade (PLAN.md 9.7): bash 3.2, utilitários BSD e GNU. Sem sed -i, date -d,
# readlink -f, grep -P, arrays associativos ou mapfile. Front matter editado com awk.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"

erro() { printf 'ERRO: %s\n' "$*" >&2; exit 1; }
aviso() { printf 'AVISO: %s\n' "$*" >&2; }
info() { printf '%s\n' "$*"; }

validar_tipo() {
  case "${1:-}" in
    post | page) ;;
    *) erro "tipo inválido '${1:-}': use post ou page" ;;
  esac
}

validar_slug() {
  local slug="${1:-}"
  [ -n "$slug" ] || erro "informe SLUG=<slug> (minúsculas, números e hífens)"
  if ! printf '%s' "$slug" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$'; then
    erro "SLUG inválido '$slug': use só minúsculas, números e hífens (ex.: meu-post)"
  fi
}

# Diretório do bundle (sempre dentro de content/ ou _privado/).
dir_bundle() {
  local tipo="$1" slug="$2" base="${3:-content}"
  if [ "$tipo" = "post" ]; then printf '%s/posts/%s' "$base" "$slug"; else printf '%s/%s' "$base" "$slug"; fi
}

# Data atual com fuso no formato do Hugo: 2026-11-20T10:00:00-03:00 (date do BSD e do GNU).
agora() {
  local d
  d="$(date '+%Y-%m-%dT%H:%M:%S%z')"
  printf '%s:%s' "${d%??}" "${d#"${d%??}"}"
}

# Troca (ou acrescenta) uma chave de 1º nível dentro do bloco --- do front matter.
fm_set() {
  local arquivo="$1" chave="$2" valor="$3" tmp
  tmp="$(mktemp "${TMPDIR:-/tmp}/fm.XXXXXX")"
  # valor via ambiente (awk -v interpretaria escapes como \")
  FM_VALOR="$valor" awk -v k="$chave" '
    BEGIN { n = 0; feito = 0; v = ENVIRON["FM_VALOR"] }
    /^---[[:space:]]*$/ {
      n++
      if (n == 2 && !feito) { print k ": " v; feito = 1 }
      print; next
    }
    n == 1 && $0 ~ "^" k ":" { if (!feito) { print k ": " v; feito = 1 }; next }
    { print }
  ' "$arquivo" >"$tmp"
  cat "$tmp" >"$arquivo"
  rm -f "$tmp"
}

fm_get() {
  awk -v k="$2" '
    /^---[[:space:]]*$/ { n++; next }
    n == 1 && $0 ~ "^" k ":" { sub("^" k ":[[:space:]]*", ""); print; exit }
  ' "$1"
}

# Tradução em inglês ao lado do original (index.md -> index.en.md).
arquivo_en() { printf '%s' "${1%.md}.en.md"; }

# Acrescenta um alias ao front matter (cria a chave se não existir).
add_alias() {
  local arq="$1" alias="$2" atual
  [ -f "$arq" ] || return 0
  atual="$(fm_get "$arq" aliases)"
  if [ -z "$atual" ] || [ "$atual" = "[]" ]; then
    fm_set "$arq" aliases "[\"$alias\"]"
  else
    fm_set "$arq" aliases "$(printf '%s' "$atual" | sed "s#]\$#, \"$alias\"]#")"
  fi
  info "alias $alias adicionado em $arq"
}

no_menu() {
  grep -Eq "pageRef[[:space:]]*=[[:space:]]*\"/?$1\"" config/_default/menus.pt-br.toml 2>/dev/null
}

cmd_new() {
  local tipo="$1" slug="$2" titulo="${3:-}" dir arquivo
  validar_tipo "$tipo"; validar_slug "$slug"
  dir="$(dir_bundle "$tipo" "$slug")"
  [ ! -e "$dir" ] || erro "$dir já existe"
  [ ! -e "$(dir_bundle "$tipo" "$slug" _privado)" ] || erro "já existe um rascunho privado em $(dir_bundle "$tipo" "$slug" _privado)"
  arquivo="$dir/index.md"
  if [ "$tipo" = "post" ]; then
    hugo new content "posts/$slug/index.md" >/dev/null
  else
    hugo new content --kind pages "$slug/index.md" >/dev/null
  fi
  if [ -n "$titulo" ]; then
    fm_set "$arquivo" title "\"$(printf '%s' "$titulo" | sed 's/"/\\"/g')\""
  fi
  info "criado: $arquivo (draft: true)"
  if [ "$tipo" = "post" ]; then
    info ""
    info "Tags mais usadas (use só as registradas em data/taxonomia.yaml):"
    node scripts/tags.mjs report >/dev/null 2>&1 && grep -E '^\| [a-z0-9-]+ \| [0-9]+ ' reports/tags.md | head -20 | awk -F'|' '{ printf "  %s(%s)\n", $2, $3 }' | sed 's/  */ /g' || true
  else
    info "Se a página for para o menu, inclua em config/_default/menus.pt-br.toml."
  fi
}

cmd_publish() {
  local tipo="$1" slug="$2" quando="${3:-}" dir arquivo
  validar_tipo "$tipo"; validar_slug "$slug"
  dir="$(dir_bundle "$tipo" "$slug")"
  if [ ! -d "$dir" ] && [ -d "$(dir_bundle "$tipo" "$slug" _privado)" ]; then
    mkdir -p "$(dirname "$dir")"
    mv "$(dir_bundle "$tipo" "$slug" _privado)" "$dir"
    info "movido de _privado/ para $dir"
  fi
  arquivo="$dir/index.md"
  [ -f "$arquivo" ] || erro "$arquivo não existe"
  node scripts/tags.mjs check "$arquivo" || erro "corrija as tags antes de publicar (make fix-tags / make new-tag)"
  local data arquivos
  arquivos="$arquivo"
  # Conteúdo já bilíngue no original (bilingue: true) não tem tradução; os demais precisam de index.en.md.
  if [ "$(fm_get "$arquivo" bilingue)" != "true" ]; then
    [ -f "$(arquivo_en "$arquivo")" ] || erro "falta a versão em inglês $(arquivo_en "$arquivo"): traduza antes de publicar (skill traduzir-conteudo), ou marque bilingue: true se o texto já tem pt-BR e inglês"
    arquivos="$arquivo $(arquivo_en "$arquivo")"
  fi
  data="$(agora)"
  for f in $arquivos; do
    fm_set "$f" draft false
    if [ "$quando" = "now" ]; then
      fm_set "$f" date "$data"
      fm_set "$f" lastmod "$data"
    fi
  done
  if ! node scripts/i18n.mjs check "$arquivo"; then
    for f in $arquivos; do fm_set "$f" draft true; done
    erro "a tradução não está em dia (acima); nada foi publicado (draft voltou a true). Atualize e rode make i18n-ok SLUG=$slug"
  fi
  info "publicado: $arquivos (draft: false). Sai no próximo deploy (push em main)."
}

cmd_unpublish() {
  local tipo="$1" slug="$2" privado="${3:-}" dir arquivo destino
  validar_tipo "$tipo"; validar_slug "$slug"
  dir="$(dir_bundle "$tipo" "$slug")"
  arquivo="$dir/index.md"
  [ -f "$arquivo" ] || erro "$arquivo não existe"
  fm_set "$arquivo" draft true
  [ ! -f "$(arquivo_en "$arquivo")" ] || fm_set "$(arquivo_en "$arquivo")" draft true
  if [ "$tipo" = "page" ] && no_menu "$slug"; then aviso "a página '$slug' está no menu (config/_default/menus.pt-br.toml)"; fi
  if [ "$privado" = "1" ]; then
    destino="$(dir_bundle "$tipo" "$slug" _privado)"
    mkdir -p "$(dirname "$destino")"
    if git ls-files --error-unmatch "$arquivo" >/dev/null 2>&1; then
      git rm -r -q --cached "$dir"
      aviso "o conteúdo já commitado continua no histórico do git"
    fi
    mv "$dir" "$destino"
    info "despublicado e movido para $destino (fora do git; faça backup próprio de _privado/)."
  else
    info "despublicado: $arquivo (draft: true). Some do site no próximo deploy e continua no make serve."
    info "Lembrete: o repositório é público; para rascunho privado use PRIVATE=1."
  fi
}

cmd_rm() {
  local tipo="$1" slug="$2" redirect="${3:-}" confirmar="${4:-}" dir destino_arq
  validar_tipo "$tipo"; validar_slug "$slug"
  dir="$(dir_bundle "$tipo" "$slug")"
  [ -d "$dir" ] || erro "$dir não existe"
  if [ -n "$(git status --porcelain -- "$dir")" ]; then erro "$dir tem alterações não commitadas; commite ou descarte antes"; fi
  info "Conteúdo que aponta para /$slug/ (links que vão quebrar):"
  grep -rlE "(\(|\")(/en)?/$slug/|relref \"[^\"]*$slug\"" content --include='*.md' | grep -v "^$dir/" | sed 's/^/  /' || info "  nenhum"
  if [ "$tipo" = "page" ] && no_menu "$slug"; then aviso "a página está no menu: remova de config/_default/menus.pt-br.toml"; fi
  if [ -n "$redirect" ]; then
    validar_slug "$redirect"
    destino_arq="$(dir_bundle post "$redirect")/index.md"
    [ -f "$destino_arq" ] || destino_arq="$(dir_bundle page "$redirect")/index.md"
    [ -f "$destino_arq" ] || erro "destino do REDIRECT não encontrado: $redirect"
  else
    aviso "sem REDIRECT=<slug>, /$slug/ vai virar 404"
  fi
  if [ "$confirmar" != "sim" ]; then
    info ""
    info "SIMULAÇÃO: nada foi removido. Para executar: CONFIRM=sim"
    return 0
  fi
  if [ -n "$redirect" ]; then
    add_alias "$destino_arq" "/$slug/"
    # Na tradução, o alias também é relativo ao idioma: "/slug/" no index.en.md gera /en/slug/.
    add_alias "$(arquivo_en "$destino_arq")" "/$slug/"
  fi
  git rm -r -q "$dir"
  info "removido: $dir"
  info "Lembretes: trave/arquive a discussão do giscus desta URL; se o conteúdo for sensível, peça remoção no Search Console."
}

cmd_list_drafts() {
  hugo list drafts
  if [ -d _privado ]; then
    info ""
    info "Rascunhos privados (_privado/, fora do git):"
    find _privado -name index.md | sed 's/^/  /'
  fi
}

acao="${1:-}"; shift || true
case "$acao" in
  new) cmd_new "${1:-}" "${2:-}" "${3:-}" ;;
  publish) cmd_publish "${1:-}" "${2:-}" "${3:-}" ;;
  unpublish) cmd_unpublish "${1:-}" "${2:-}" "${3:-}" ;;
  rm) cmd_rm "${1:-}" "${2:-}" "${3:-}" "${4:-}" ;;
  list-drafts) cmd_list_drafts ;;
  *) erro "uso: content.sh new|publish|unpublish|rm|list-drafts ..." ;;
esac

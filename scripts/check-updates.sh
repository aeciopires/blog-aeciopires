#!/usr/bin/env bash
# make check-updates (PLAN.md 9.2.1 e 9.3): compara versões em uso com as mais novas.
# NÃO altera nada. Gera reports/updates.md. Política: estável mais nova, limitada só por
# compatibilidade (Hugo dentro da faixa [module.hugoVersion] do Blowfish fixado).
set -uo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ" || exit 1
mkdir -p reports
SAIDA="reports/updates.md"
MERMAID_IMAGE="${MERMAID_IMAGE:-minlag/mermaid-cli:12.0.1}"

estavel() { grep -Ev -- '-(alpha|beta|rc|pre|dev|nightly)|[0-9](a|b|rc)[0-9]' ; }

{
  echo "# Atualizações disponíveis"
  echo
  echo "Gerado em $(date '+%Y-%m-%d %H:%M') por \`make check-updates\`. Nada foi alterado."
  echo
  echo "## Ferramentas do mise.toml"
  echo
  echo '```text'
  OUT="$(mise outdated 2>/dev/null)" || OUT="(mise outdated falhou)"
  echo "${OUT:-todas as ferramentas estão na versão mais nova}"
  echo '```'
  echo
  echo "## Blowfish (submódulo)"
  echo
  ATUAL="$(git -C themes/blowfish describe --tags --exact-match 2>/dev/null || echo '?')"
  NOVA="$(git ls-remote --tags --refs https://github.com/nunocoracao/blowfish.git 2>/dev/null | awk -F/ '{print $3}' | estavel | sort -V | tail -1)"
  echo "- Em uso: \`$ATUAL\` · mais nova: \`${NOVA:-?}\`"
  [ -n "$NOVA" ] && [ "$NOVA" != "$ATUAL" ] && echo "- Atualizar com \`make update-theme TAG=$NOVA\` (ler https://github.com/nunocoracao/blowfish/releases/tag/$NOVA)"
  echo
  echo "## Hugo (limitado pela faixa do Blowfish)"
  echo
  MIN="$(awk -F'"' '/^\[module.hugoVersion\]/{f=1} f && /^min/{print $2; exit}' themes/blowfish/config.toml)"
  MAX="$(awk -F'"' '/^\[module.hugoVersion\]/{f=1} f && /^max/{print $2; exit}' themes/blowfish/config.toml)"
  EM_USO="$(awk -F'"' '/^hugo-extended/{print $2}' mise.toml)"
  TODAS="$(mise ls-remote hugo-extended 2>/dev/null | estavel)"
  MAIS_NOVA="$(printf '%s\n' "$TODAS" | tail -1)"
  PERMITIDA="$(printf '%s\n' "$TODAS" | awk -v max="$MAX" '{ split($0,a,"."); split(max,b,"."); if (a[1]*1e6+a[2]*1e3+a[3] <= b[1]*1e6+b[2]*1e3+b[3]) v=$0 } END { print v }')"
  echo "- Em uso: \`$EM_USO\` · mais nova: \`$MAIS_NOVA\` · faixa do Blowfish $ATUAL: \`$MIN\`–\`$MAX\` · **mais nova permitida: \`$PERMITIDA\`**"
  echo
  echo "## Imagens Docker"
  echo
  echo "- Hugo: \`ghcr.io/gohugoio/hugo:v$EM_USO\` (segue o mise.toml automaticamente)"
  MTAG="$(curl -fsS 'https://hub.docker.com/v2/repositories/minlag/mermaid-cli/tags?page_size=50' 2>/dev/null | grep -o '"name":"[0-9][0-9.]*"' | cut -d'"' -f4 | sort -V | tail -1)"
  echo "- mermaid-cli: em uso \`$MERMAID_IMAGE\` · mais nova no Docker Hub: \`${MTAG:-?}\`"
  echo
  echo "## GitHub Actions"
  echo
  echo "- Atualizadas pelo Dependabot (PRs semanais)."
} >"$SAIDA"
cat "$SAIDA"

#!/usr/bin/env bash
# make update-theme TAG=vX.Y.Z (PLAN.md 3.3, 3.6.1 e 12.1). Move o submódulo para uma TAG de release,
# mostra o changelog, o diff da skill do Blowfish e avisa se a faixa de Hugo mudou. Depois roda make validate.
# Não usa "git submodule update --remote" (iria para o topo da main, não para uma release).
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
TAG="${1:-}"
printf '%s' "$TAG" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' || { echo "uso: make update-theme TAG=vX.Y.Z" >&2; exit 1; }
[ -z "$(git status --porcelain -- themes/blowfish)" ] || { echo "ERRO: themes/blowfish com alterações locais" >&2; exit 1; }

ANTIGA="$(git -C themes/blowfish describe --tags --exact-match 2>/dev/null || git -C themes/blowfish rev-parse --short HEAD)"
faixa() { awk -F'"' '/^\[module.hugoVersion\]/{f=1} f && /^(min|max)/{printf "%s ", $2}' themes/blowfish/config.toml; }
FAIXA_ANTIGA="$(faixa)"

git -C themes/blowfish fetch --tags --quiet origin
git -C themes/blowfish rev-parse -q --verify "refs/tags/$TAG" >/dev/null || { echo "ERRO: tag $TAG não existe" >&2; exit 1; }
git -C themes/blowfish checkout --quiet "$TAG"

echo "== Blowfish: $ANTIGA -> $TAG"
echo "Notas de versão: https://github.com/nunocoracao/blowfish/releases/tag/$TAG"
echo
echo "== Commits"
git -C themes/blowfish log --oneline "$ANTIGA..$TAG" | head -50
echo
echo "== Diff da skill do Blowfish (revisar como código: sem hooks, comandos ou scripts inesperados)"
git -C themes/blowfish diff "$ANTIGA..$TAG" -- .claude/skills || true
echo
FAIXA_NOVA="$(faixa)"
echo "== Faixa de Hugo: antes [$FAIXA_ANTIGA] agora [$FAIXA_NOVA]"
if [ "$FAIXA_ANTIGA" != "$FAIXA_NOVA" ]; then
  echo "ATENÇÃO: a faixa mudou. Ajuste hugo-extended no mise.toml NO MESMO PR (a mais nova dentro da faixa) e rode mise install."
fi
echo
echo "== Overrides do projeto para revisar contra o tema novo"
echo "  layouts/tags/terms.html (baseado em _default/terms.html do tema)"
echo "  layouts/partials/recent-articles/cardview.html (ordenação da home; ver docs/MAINTENANCE.md, seção 8)"
git -C themes/blowfish diff --stat "$ANTIGA..$TAG" -- layouts/_default/terms.html layouts/partials/home/background.html layouts/partials/footer.html layouts/partials/recent-articles/ layouts/partials/article-link/card.html config/_default || true
echo
bash scripts/skill-sync.sh
make validate
echo
echo "Próximos passos: make serve (claro/escuro/celular) e abrir o PR com o resumo e o link das notas de versão."

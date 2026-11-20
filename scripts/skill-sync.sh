#!/usr/bin/env bash
# make skill-sync (PLAN.md 3.6.1): recria .claude/skills/blowfish a partir do submódulo.
# Padrão: link simbólico versionado. Com COPY=1 (ambiente que não segue links), copia a pasta.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
ORIGEM="themes/blowfish/.claude/skills/blowfish"
DESTINO=".claude/skills/blowfish"
[ -f "$ORIGEM/SKILL.md" ] || { echo "ERRO: $ORIGEM/SKILL.md não existe (git submodule update --init)" >&2; exit 1; }
mkdir -p .claude/skills
if [ "${COPY:-0}" = "1" ]; then
  rm -rf "$DESTINO"
  cp -R "$ORIGEM" "$DESTINO"
  echo "skill-sync: copiado $ORIGEM -> $DESTINO (não commitar a cópia; o versionado é o link)"
else
  if [ -L "$DESTINO" ] && [ -f "$DESTINO/SKILL.md" ]; then echo "skill-sync: link OK"; exit 0; fi
  rm -rf "$DESTINO"
  ln -s ../../themes/blowfish/.claude/skills/blowfish "$DESTINO"
  echo "skill-sync: link $DESTINO -> ../../$ORIGEM"
fi

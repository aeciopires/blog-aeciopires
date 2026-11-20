#!/usr/bin/env bash
# make check-deps: diagnóstico do ambiente, sem alterar nada (PLAN.md 9.4).
# Saída OK / AVISO / FALTA. Retorna erro se faltar algo obrigatório.
# Portável: bash 3.2, Ubuntu 22.04/24.04/26.04 amd64, macOS amd64/arm64.
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ" || exit 1

FALTAS=0
ok() { printf '  %-6s %s\n' "OK" "$*"; }
aviso() { printf '  %-6s %s\n' "AVISO" "$*"; }
falta() { printf '  %-6s %s\n' "FALTA" "$*"; FALTAS=$((FALTAS + 1)); }
tem() { command -v "$1" >/dev/null 2>&1; }

# Compara versões x.y.z: retorna 0 se $1 <= $2.
versao_le() {
  [ "$1" = "$2" ] && return 0
  [ "$(printf '%s\n%s\n' "$1" "$2" | sort -t. -k1,1n -k2,2n -k3,3n | head -1)" = "$1" ]
}

echo "Sistema"
SO="$(uname -s)"; ARQ="$(uname -m)"
case "$SO" in
  Linux)
    ID=""; VER=""
    if [ -r /etc/os-release ]; then
      # shellcheck disable=SC1091
      ID="$(. /etc/os-release && printf '%s' "${ID:-}")"
      # shellcheck disable=SC1091
      VER="$(. /etc/os-release && printf '%s' "${VERSION_ID:-}")"
    fi
    case "$ID:$VER:$ARQ" in
      ubuntu:22.04:x86_64 | ubuntu:24.04:x86_64 | ubuntu:26.04:x86_64) ok "Ubuntu $VER ($ARQ)" ;;
      *) aviso "$ID $VER ($ARQ): combinação não testada (suportado: Ubuntu 22.04/24.04/26.04 amd64)" ;;
    esac
    ;;
  Darwin)
    case "$ARQ" in
      x86_64 | arm64) ok "macOS $(sw_vers -productVersion 2>/dev/null) ($ARQ)" ;;
      *) aviso "macOS ($ARQ): arquitetura não testada" ;;
    esac
    ;;
  *) aviso "$SO ($ARQ): sistema não testado" ;;
esac

echo "Pré-requisitos do sistema"
for c in git make curl bash; do
  if tem "$c"; then ok "$c"; else falta "$c (Ubuntu: apt-get install $c · macOS: xcode-select --install)"; fi
done

echo "mise e ferramentas (mise.toml)"
if tem mise; then
  ok "mise $(mise --version 2>/dev/null | awk '{print $1}')"
  if mise doctor 2>/dev/null | grep -qi 'activated: yes'; then ok "mise ativado no shell"; else aviso "mise não parece ativado no shell: eval \"\$(mise activate bash)\" (ou zsh)"; fi
  if mise trust --show 2>/dev/null | grep -q "mise.toml.*trusted\|^$RAIZ.*trusted"; then
    ok "mise.toml confiável"
  elif mise ls --current >/dev/null 2>&1; then
    ok "mise.toml confiável"
  else
    falta "mise.toml não confiável: mise trust"
  fi
  FALTANDO="$(mise ls --current --missing 2>/dev/null | awk '{print $1"@"$2}' | tr '\n' ' ')"
  if [ -z "$FALTANDO" ]; then ok "ferramentas instaladas nas versões exatas"; else falta "ferramentas não instaladas: $FALTANDO(make install-deps)"; fi
else
  falta "mise (make install-deps ou https://mise.jdx.dev)"
fi

echo "Hugo e tema"
HUGO="hugo"; tem hugo || HUGO="mise exec -- hugo"
HV="$($HUGO version 2>/dev/null || true)"
if [ -z "$HV" ]; then
  falta "hugo (make install-deps)"
else
  case "$HV" in *+extended*) ok "hugo extended" ;; *) falta "hugo não é extended" ;; esac
  HNUM="$(printf '%s' "$HV" | sed -E 's/^hugo v([0-9.]+).*/\1/')"
  if [ -f themes/blowfish/config.toml ]; then
    MIN="$(awk -F'"' '/^\[module.hugoVersion\]/{f=1} f && /^min/{print $2; exit}' themes/blowfish/config.toml)"
    MAX="$(awk -F'"' '/^\[module.hugoVersion\]/{f=1} f && /^max/{print $2; exit}' themes/blowfish/config.toml)"
    if versao_le "$MIN" "$HNUM" && versao_le "$HNUM" "$MAX"; then ok "hugo $HNUM dentro da faixa do Blowfish ($MIN–$MAX)"; else falta "hugo $HNUM fora da faixa do Blowfish ($MIN–$MAX)"; fi
  fi
fi

if [ -f themes/blowfish/LICENSE ]; then
  ESPERADA="$(git -C "$RAIZ" ls-tree HEAD themes/blowfish 2>/dev/null | awk '{print $3}')"
  ATUAL="$(git -C themes/blowfish rev-parse HEAD 2>/dev/null)"
  TAG="$(git -C themes/blowfish describe --tags --exact-match 2>/dev/null || echo "sem tag")"
  if [ -n "$ESPERADA" ] && [ "$ESPERADA" != "$ATUAL" ]; then
    aviso "submódulo themes/blowfish em $TAG, diferente do registrado no repositório (git submodule update --init)"
  else
    ok "submódulo themes/blowfish ($TAG)"
  fi
else
  falta "submódulo themes/blowfish vazio: git submodule update --init (ou make install-deps)"
fi

if [ -f .claude/skills/blowfish/SKILL.md ]; then ok "skill .claude/skills/blowfish"; else aviso "skill .claude/skills/blowfish ausente: make skill-sync"; fi

echo "Docker (opcional)"
if tem docker; then
  ok "docker CLI"
  if docker compose version >/dev/null 2>&1; then ok "docker compose (v2)"
  elif tem docker-compose; then ok "docker-compose (legado)"
  else aviso "docker compose ausente (só para make serve-docker)"; fi
  if docker info >/dev/null 2>&1; then ok "daemon Docker acessível"; else aviso "daemon Docker inacessível (Linux: serviço/grupo docker · macOS: colima start)"; fi
else
  aviso "docker ausente (opcional: make serve-docker e make validate-diagrams)"
fi
if [ "$SO" = "Darwin" ]; then
  if tem colima; then
    if colima status >/dev/null 2>&1; then ok "colima em execução"; else aviso "colima parado: colima start --cpu 2 --memory 4 --vm-type vz --mount-type virtiofs"; fi
    if [ "$(docker context show 2>/dev/null)" = "colima" ]; then ok "contexto Docker colima"; else aviso "contexto Docker não é colima: docker context use colima"; fi
  else
    aviso "colima ausente (opcional; https://github.com/abiosoft/colima)"
  fi
fi

echo "Rede"
if (exec 3<>/dev/tcp/127.0.0.1/1313) 2>/dev/null; then aviso "porta 1313 ocupada"; else ok "porta 1313 livre"; fi

echo
if [ "$FALTAS" -gt 0 ]; then
  echo "check-deps: $FALTAS item(ns) obrigatório(s) faltando. Rode: make install-deps"
  exit 1
fi
echo "check-deps: tudo OK."

#!/usr/bin/env bash
# make install-deps (PLAN.md 9.5). Idempotente: pode rodar várias vezes.
# Instala pré-requisitos (pedindo confirmação), mise, ferramentas do mise.toml, submódulo e skill.
# NÃO instala Docker/Compose/Colima: só informa o status.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
tem() { command -v "$1" >/dev/null 2>&1; }
SO="$(uname -s)"

echo "1/5 Pré-requisitos do sistema"
FALTAM=""
for c in git make curl; do tem "$c" || FALTAM="$FALTAM $c"; done
if [ -n "$FALTAM" ]; then
  if [ "$SO" = "Linux" ] && tem apt-get; then
    echo "Faltam:$FALTAM. Comando: sudo apt-get install -y$FALTAM ca-certificates"
    printf 'Executar agora? [s/N] '
    read -r resp
    case "$resp" in
      s | S | sim)
        sudo apt-get update
        # shellcheck disable=SC2086 # lista de pacotes separada por espaço, de propósito
        sudo apt-get install -y $FALTAM ca-certificates
        ;;
      *)
        echo "Instale e rode de novo."
        exit 1
        ;;
    esac
  elif [ "$SO" = "Darwin" ]; then
    echo "Faltam:$FALTAM. Rode: xcode-select --install"; exit 1
  else
    echo "Faltam:$FALTAM. Instale pelo gerenciador de pacotes do sistema."; exit 1
  fi
else
  echo "  OK"
fi

echo "2/5 mise"
if ! tem mise; then
  if [ "$SO" = "Darwin" ] && tem brew; then
    brew install mise
  else
    echo "  Instalando pelo instalador oficial (https://mise.run)"
    curl -fsSL https://mise.run | sh
    export PATH="$HOME/.local/bin:$PATH"
  fi
  SHELL_NOME="$(basename "${SHELL:-bash}")"
  echo "  Ative o mise no seu shell (não editamos seus arquivos):"
  echo "    echo 'eval \"\$(mise activate $SHELL_NOME)\"' >> ~/.${SHELL_NOME}rc"
else
  echo "  OK ($(mise --version | awk '{print $1}'))"
fi

echo "3/5 Ferramentas do mise.toml"
mise trust -q "$RAIZ/mise.toml"
mise install

echo "4/5 Tema Blowfish (submódulo) e skill"
git submodule update --init
bash scripts/skill-sync.sh

echo "5/5 Docker / Compose / Colima (não instalados por aqui)"
if tem docker; then echo "  docker presente"; else
  if [ "$SO" = "Darwin" ]; then echo "  Opcional: Colima + Docker CLI (https://github.com/abiosoft/colima)"
  else echo "  Opcional: Docker Engine (https://docs.docker.com/engine/install/ubuntu/)"; fi
fi

echo
bash scripts/check-deps.sh

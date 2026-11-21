#!/usr/bin/env bash
# make lighthouse [URL=https://blog.aeciopires.com/] (docs/MAINTENANCE.md, seção 4).
# Roda o Lighthouse em Docker (imagem local blog-lighthouse:<versão>, criada na primeira vez a partir de
# docker/lighthouse/Dockerfile) nos perfis celular e computador e grava os relatórios em reports/lighthouse/.
# Mede o site PUBLICADO: o servidor do Hugo (make serve/serve-prod) não minifica nem comprime.
# O Chromium roda com --no-sandbox só dentro deste container descartável (usuário sem root).
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
URL="${1:-https://blog.aeciopires.com/}"
NODE_IMAGE="${NODE_IMAGE:-node:26-bookworm-slim}"
LIGHTHOUSE_VERSION="${LIGHTHOUSE_VERSION:-13.6.0}"
IMAGEM="blog-lighthouse:${LIGHTHOUSE_VERSION}"
SAIDA="reports/lighthouse"

printf '%s' "$URL" | grep -Eq '^https?://[^[:space:]]+$' || { echo "uso: make lighthouse URL=https://…" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERRO: Docker não encontrado (no macOS, inicie o Colima)" >&2; exit 1; }

if ! docker image inspect "$IMAGEM" >/dev/null 2>&1; then
  echo "== Criando $IMAGEM (só na primeira vez)"
  docker build -q -t "$IMAGEM" --build-arg NODE_IMAGE="$NODE_IMAGE" --build-arg LIGHTHOUSE_VERSION="$LIGHTHOUSE_VERSION" docker/lighthouse >/dev/null
fi

mkdir -p "$SAIDA"
chmod 777 "$SAIDA" # o container grava como o usuário "node"
nome="$(printf '%s' "$URL" | sed -E 's#^https?://##; s#[^A-Za-z0-9]+#-#g; s#-+$##')"
for perfil in mobile desktop; do
  extra=""
  [ "$perfil" = "desktop" ] && extra="--preset=desktop"
  echo "== $perfil: $URL"
  # shellcheck disable=SC2086
  docker run --rm --name "blog-lighthouse-$perfil" --shm-size=1g -v "$RAIZ/$SAIDA:/out" "$IMAGEM" "$URL" $extra \
    --output=json --output=html --output-path="/out/$nome-$perfil" \
    --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
done

mise exec -- node - "$SAIDA" "$nome" <<'NODE'
const fs = require("node:fs");
const [dir, nome] = process.argv.slice(2);
for (const perfil of ["mobile", "desktop"]) {
  const r = JSON.parse(fs.readFileSync(`${dir}/${nome}-${perfil}.report.json`, "utf8"));
  const notas = Object.values(r.categories).map((c) => `${c.title}: ${Math.round(c.score * 100)}`).join(" | ");
  console.log(`\n${perfil}: ${notas}`);
  for (const c of Object.values(r.categories)) {
    for (const ref of c.auditRefs) {
      const a = r.audits[ref.id];
      if (ref.weight > 0 && a.score !== null && a.score < 0.9 && !["notApplicable", "manual", "informative"].includes(a.scoreDisplayMode)) {
        console.log(`  - [${c.title}] ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`);
      }
    }
  }
}
console.log(`\nRelatórios: ${dir}/${nome}-{mobile,desktop}.report.html`);
NODE

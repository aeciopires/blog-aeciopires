#!/usr/bin/env node
// Atualiza data/github.json com a quantidade de repositórios públicos do autor no GitHub,
// pela API REST pública (GET /users/{usuario}, campo public_repos).
// Usado pelo shortcode blog-stats (home). O Hugo não consulta essa API direto porque
// security.http.urls só libera /repos/ (CLAUDE.md: não ampliar).
// Roda no pre-commit (.githooks/pre-commit), que adiciona o arquivo ao commit se o número mudar;
// à mão: make github-repos.
//
// Variáveis de ambiente:
//   GITHUB_USUARIO  opcional; padrão aeciopires
//   GITHUB_TOKEN    opcional; só se o limite da API sem autenticação (60 pedidos/hora por IP) atrapalhar
//
// Sem rede, com timeout (5 s) ou erro da API, mantém o data/github.json versionado e sai com
// sucesso: o commit não é bloqueado e a home mostra o último número conhecido.
// Documentação: docs/MAINTENANCE.md (linha de scripts/github-repos.mjs na tabela de peças da home).

import { readFileSync, writeFileSync } from "node:fs";

const USUARIO = process.env.GITHUB_USUARIO || "aeciopires";
const TOKEN = process.env.GITHUB_TOKEN || "";
const SAIDA = "data/github.json";

const cabecalhos = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "blog-build",
};
if (TOKEN) cabecalhos.Authorization = `Bearer ${TOKEN}`;

let atual = {};
try {
  atual = JSON.parse(readFileSync(SAIDA, "utf8"));
} catch {
  // sem arquivo anterior: segue
}

try {
  const resposta = await fetch(`https://api.github.com/users/${encodeURIComponent(USUARIO)}`, {
    headers: cabecalhos,
    signal: AbortSignal.timeout(5000),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  const corpo = await resposta.json();
  const total = Number(corpo.public_repos);
  if (!Number.isInteger(total) || total < 0) throw new Error("campo public_repos ausente ou inválido");
  if (atual.usuario === USUARIO && atual.repositoriosPublicos === total) {
    console.log(`github-repos: ${total} repositório(s) público(s), sem mudança em ${SAIDA}`);
  } else {
    const saida = { usuario: USUARIO, repositoriosPublicos: total, atualizadoEm: new Date().toISOString().slice(0, 10) };
    writeFileSync(SAIDA, `${JSON.stringify(saida, null, 2)}\n`);
    console.log(`github-repos: ${total} repositório(s) público(s) gravado(s) em ${SAIDA}`);
  }
} catch (erro) {
  console.log(`github-repos: falha ao consultar a API do GitHub (${erro.message}); mantendo ${SAIDA} como está.`);
}

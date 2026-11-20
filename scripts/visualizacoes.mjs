#!/usr/bin/env node
// Gera data/visualizacoes.json com as visualizações de página por caminho (requestPath),
// a partir do Cloudflare Web Analytics (API GraphQL, conjunto rumPageloadEventsAdaptiveGroups).
// Usado pelos botões "Mais lidos" e "Menos lidos" da home (layouts/partials/recent-articles/cardview.html).
//
// Variáveis de ambiente:
//   CLOUDFLARE_ANALYTICS_TOKEN  token de API com a permissão "Account Analytics: Read" (secret)
//   CLOUDFLARE_ACCOUNT_ID       ID da conta no Cloudflare (não é segredo)
//   VISUALIZACOES_HOST          opcional; padrão blog.aeciopires.com
//   VISUALIZACOES_DIAS          opcional; padrão 180. O Web Analytics só responde até 26 semanas e
//                               2 dias (184 dias) atrás; pedir mais que isso dá erro na API
//
// Sem token ou conta, não faz nada e sai com sucesso: o site é gerado sem os botões de leitura.
// Os números são aproximados: a API aplica amostragem (docs: web-analytics/faq).
// Documentação: docs/MAINTENANCE.md, seção "Ordenação dos posts da home".

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const TOKEN = process.env.CLOUDFLARE_ANALYTICS_TOKEN || "";
const CONTA = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const HOST = process.env.VISUALIZACOES_HOST || "blog.aeciopires.com";
// 180 dias deixa folga para o limite de 184 dias da API (6 meses de calendário podem passar dele).
const DIAS = Math.min(Number.parseInt(process.env.VISUALIZACOES_DIAS || "180", 10) || 180, 180);
const SAIDA = "data/visualizacoes.json";
// VISUALIZACOES_ENDPOINT só existe para testes locais com uma API simulada.
const ENDPOINT = process.env.VISUALIZACOES_ENDPOINT || "https://api.cloudflare.com/client/v4/graphql";
const JANELA_DIAS = 30;

if (!TOKEN || !CONTA) {
  console.log("visualizacoes: CLOUDFLARE_ANALYTICS_TOKEN ou CLOUDFLARE_ACCOUNT_ID ausente; nada a fazer (botões de leitura ficam ocultos).");
  process.exit(0);
}

const CONSULTA = `query($conta: String!, $inicio: Time!, $fim: Time!, $host: String!) {
  viewer {
    accounts(filter: { accountTag: $conta }) {
      rumPageloadEventsAdaptiveGroups(
        limit: 5000
        orderBy: [count_DESC]
        filter: { datetime_geq: $inicio, datetime_lt: $fim, requestHost: $host }
      ) {
        count
        dimensions { requestPath }
      }
    }
  }
}`;

async function consultar(inicio, fim) {
  const resposta = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: CONSULTA, variables: { conta: CONTA, inicio, fim, host: HOST } }),
  });
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status} na API do Cloudflare`);
  }
  const corpo = await resposta.json();
  if (corpo.errors && corpo.errors.length) {
    throw new Error(corpo.errors.map((e) => e.message).join("; "));
  }
  return corpo.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
}

// Normaliza o caminho como o Hugo gera o RelPermalink dos posts: sem query/fragmento e com "/" no fim.
function normalizar(caminho) {
  let c = String(caminho || "/").split(/[?#]/)[0];
  if (!c.startsWith("/")) c = `/${c}`;
  if (!c.endsWith("/") && !/\.[a-z0-9]+$/i.test(c)) c = `${c}/`;
  return c;
}

const fim = new Date();
const inicioTotal = new Date(fim.getTime() - DIAS * 86400000);

const paginas = {};
for (let fimJanela = new Date(fim); fimJanela > inicioTotal; ) {
  const inicioJanela = new Date(Math.max(inicioTotal.getTime(), fimJanela.getTime() - JANELA_DIAS * 86400000));
  const grupos = await consultar(inicioJanela.toISOString(), fimJanela.toISOString());
  for (const g of grupos) {
    const caminho = normalizar(g.dimensions?.requestPath);
    paginas[caminho] = (paginas[caminho] || 0) + (g.count || 0);
  }
  fimJanela = inicioJanela;
}

const ordenadas = Object.fromEntries(Object.entries(paginas).sort((a, b) => b[1] - a[1]));
const saida = {
  geradoEm: fim.toISOString(),
  periodo: { inicio: inicioTotal.toISOString(), fim: fim.toISOString() },
  fonte: "Cloudflare Web Analytics (rumPageloadEventsAdaptiveGroups, valores aproximados)",
  paginas: ordenadas,
};
mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, `${JSON.stringify(saida, null, 2)}\n`);
console.log(`visualizacoes: ${Object.keys(ordenadas).length} caminho(s) gravados em ${SAIDA}`);

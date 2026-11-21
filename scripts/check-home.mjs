#!/usr/bin/env node
// Confere, sobre o build em public/, a home leve (layouts/partials/recent-articles/cardview.html +
// assets/js/ordenar-home.js). Pega quebras causadas por atualizações do Hugo ou do Blowfish
// antes de publicar. Roda em `make validate` (e na CI); à mão: make build check-home.
//
// Verifica:
//  1. a home traz só os N cards visíveis (data-visiveis) e o molde <template data-card-molde>
//     com as partes que o JavaScript preenche (img, header a, h2, linha de metadados, chips);
//  2. o JSON leve existe, bate com a integridade (SRI) declarada e tem um item por post;
//  3. cada URL do JSON passa na mesma regra do navegador (caminho do próprio site);
//  4. fidelidade ao tema: para cada post, título, imagem, metadados e chips do JSON são iguais
//     aos do card que o tema renderiza em /posts/ (mesmo partial). Se o Blowfish mudar o HTML
//     do card, este teste falha e aponta o post e o campo.
// Documentação: docs/MAINTENANCE.md, seção 8 ("Ordenação dos posts da home").

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const PUBLIC = "public";
const erros = [];
const erro = (msg) => erros.push(msg);

const html = (arquivo) => readFileSync(join(PUBLIC, arquivo), "utf8");
const attr = (tag, nome) => {
  const m = tag.match(new RegExp(`\\s${nome}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`));
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
};
const decodificar = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
const texto = (s) => decodificar(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// Mesma regra de assets/js/ordenar-home.js (caminhoSeguro).
const caminhoSeguro = (v) =>
  typeof v === "string" && v.length > 0 && v.length <= 2048 && v[0] === "/" && v[1] !== "/" && v[1] !== "\\" &&
  !/[\u0000- \u007f\\<>"'`]/.test(v);

// Partes de um card do tema (HTML minificado ou não).
function partesDoCard(card) {
  const link = card.match(/<header>\s*<a\s[^>]*>/);
  const img = card.match(/<img\s[^>]*>/);
  const h2 = card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const blocoMeta = card.match(/<\/header>\s*<div[^>]*>([\s\S]*)<\/div>\s*<\/div>\s*<div class="?px-6/);
  let meta = [];
  let chips = [];
  if (blocoMeta) {
    const linhas = blocoMeta[1].split(/<div class="?flex flex-row flex-wrap items-center"?>/).slice(1);
    if (linhas[0]) {
      meta = linhas[0]
        .split(/<span class="?px-2 text-primary-500"?>[^<]*<\/span>/)
        .map(texto)
        .filter(Boolean);
    }
    if (linhas[1]) {
      chips = [...linhas[1].matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [texto(m[1]), attr(m[0].match(/<a\s[^>]*>/)[0], "href")]);
    }
  }
  return {
    url: link ? attr(link[0], "href") : null,
    imagem: img ? attr(img[0], "src") : "",
    titulo: h2 ? texto(h2[1]) : "",
    meta,
    chips,
  };
}

function cardsDe(pagina) {
  return [...pagina.matchAll(/<article class="?article-link--card[\s\S]*?<\/article>/g)].map((m) => m[0]);
}

// ---------- 1. home ----------
if (!existsSync(join(PUBLIC, "index.html"))) {
  console.error("check-home: public/index.html não existe; rode make build antes.");
  process.exit(1);
}
const home = html("index.html");
const secao = home.match(/<section[^>]*data-posts-home[^>]*>/);
if (!secao) {
  erro("home sem <section data-posts-home> (override cardview.html não está em uso?)");
}
const visiveis = secao ? Number(attr(secao[0], "data-visiveis")) : 0;
const urlJson = secao ? attr(secao[0], "data-json") : null;
const integridade = secao ? attr(secao[0], "data-json-integridade") : null;
const itensHome = [...home.matchAll(/<div class="?ordenar-home__item"?\s+data-url=("?)([^"\s>]+)\1/g)].map((m) => m[2]);
if (itensHome.length !== visiveis) {
  erro(`home com ${itensHome.length} card(s); esperado ${visiveis} (data-visiveis)`);
}
const molde = home.match(/<template data-card-molde>([\s\S]*?)<\/template>/);
if (!molde) {
  erro("home sem <template data-card-molde>");
} else {
  const p = partesDoCard(molde[1]);
  if (!p.url || !p.imagem || !p.titulo || p.meta.length === 0 || p.chips.length === 0) {
    erro(`molde incompleto (url=${!!p.url} img=${!!p.imagem} h2=${!!p.titulo} meta=${p.meta.length} chips=${p.chips.length}): o HTML do card do Blowfish mudou?`);
  }
}

// ---------- 2. JSON ----------
let dados = { posts: [], termos: [] };
if (!urlJson || !caminhoSeguro(urlJson) || !existsSync(join(PUBLIC, urlJson))) {
  erro(`JSON da home ausente ou com caminho inválido: ${urlJson}`);
} else {
  const bruto = readFileSync(join(PUBLIC, urlJson));
  const [alg, valor] = String(integridade || "").split("-");
  const calculado = alg ? createHash(alg).update(bruto).digest("base64") : "";
  if (!valor || calculado !== valor) {
    erro("integridade (SRI) do JSON não confere com o arquivo");
  }
  dados = JSON.parse(bruto.toString("utf8"));
}
const termos = dados.termos || [];
const porUrl = new Map((dados.posts || []).map((p) => [p.u, p]));

const indice = JSON.parse(html("index.json"));
// Posts do índice da busca, sem a própria página de lista (/posts/).
const totalPosts = indice.filter((i) => i.type === "posts" && i.permalink !== "/posts/").length;
if (porUrl.size !== totalPosts) {
  erro(`JSON com ${porUrl.size} post(s); o índice da busca tem ${totalPosts}`);
}
const recentes = [...(dados.posts || [])].sort((a, b) => b.d - a.d).slice(0, visiveis).map((p) => p.u);
if (recentes.join() !== itensHome.join()) {
  erro("os cards visíveis da home não são os mais recentes do JSON");
}

// ---------- 3. URLs ----------
for (const p of dados.posts || []) {
  if (!caminhoSeguro(p.u)) erro(`URL inválida no JSON: ${p.u}`);
  if (p.i && !caminhoSeguro(p.i)) erro(`imagem inválida no JSON (${p.u}): ${p.i}`);
  if (!p.t || !Array.isArray(p.m) || p.m.length === 0) erro(`post sem título ou metadados no JSON: ${p.u}`);
  for (const c of p.c || []) {
    if (!termos[c] || !caminhoSeguro(termos[c].u)) erro(`termo inválido (${p.u}): índice ${c}`);
  }
}

// ---------- 4. fidelidade ao card do tema (/posts/ e /posts/page/N/) ----------
const paginas = ["posts/index.html"];
const dirPaginas = join(PUBLIC, "posts", "page");
if (existsSync(dirPaginas)) {
  for (const n of readdirSync(dirPaginas)) paginas.push(join("posts", "page", n, "index.html"));
}
let comparados = 0;
for (const pagina of paginas) {
  if (!existsSync(join(PUBLIC, pagina))) continue;
  for (const card of cardsDe(html(pagina))) {
    const t = partesDoCard(card);
    const j = porUrl.get(t.url);
    if (!j) continue;
    comparados += 1;
    const doJson = {
      titulo: j.t,
      imagem: j.i || "",
      meta: j.m,
      chips: (j.c || []).map((i) => [termos[i]?.r, termos[i]?.u]),
    };
    for (const campo of ["titulo", "imagem", "meta", "chips"]) {
      if (JSON.stringify(doJson[campo]) !== JSON.stringify(t[campo])) {
        erro(`${t.url}: "${campo}" do JSON difere do card do tema\n    tema: ${JSON.stringify(t[campo])}\n    json: ${JSON.stringify(doJson[campo])}`);
      }
    }
  }
}
if (comparados < Math.min(totalPosts, 10)) {
  erro(`só ${comparados} card(s) do tema encontrados em /posts/ para comparar (o HTML do card mudou?)`);
}

if (erros.length) {
  console.error(`check-home: ${erros.length} problema(s)`);
  for (const e of erros.slice(0, 20)) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`check-home: OK (${itensHome.length} cards na home, ${porUrl.size} posts no JSON, ${comparados} comparados com o tema)`);

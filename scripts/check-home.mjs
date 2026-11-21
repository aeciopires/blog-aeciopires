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
// Roda para cada idioma (pt-BR na raiz e en-US em /en/).
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

// Cada idioma tem a sua home, o seu JSON e o seu índice de busca: "" = pt-BR (raiz), "en/" = inglês.
const IDIOMAS = ["", "en/"];
const resumo = [];
function verificarIdioma(prefixo) {
  const erroIdioma = (msg) => erro(`[${prefixo || "pt-BR "}] ${msg}`);
  // ---------- 1. home ----------
  if (!existsSync(join(PUBLIC, prefixo, "index.html"))) {
    erroIdioma(`public/${prefixo}index.html não existe; rode make build antes.`);
    return "";
  }
  const home = html(`${prefixo}index.html`);
  const secao = home.match(/<section[^>]*data-posts-home[^>]*>/);
  if (!secao) {
    erroIdioma("home sem <section data-posts-home> (override cardview.html não está em uso?)");
  }
  const visiveis = secao ? Number(attr(secao[0], "data-visiveis")) : 0;
  const urlJson = secao ? attr(secao[0], "data-json") : null;
  const integridade = secao ? attr(secao[0], "data-json-integridade") : null;
  const itensHome = [...home.matchAll(/<div class="?ordenar-home__item"?\s+data-url=("?)([^"\s>]+)\1/g)].map((m) => m[2]);
  if (itensHome.length !== visiveis) {
    erroIdioma(`home com ${itensHome.length} card(s); esperado ${visiveis} (data-visiveis)`);
  }
  const molde = home.match(/<template data-card-molde>([\s\S]*?)<\/template>/);
  if (!molde) {
    erroIdioma("home sem <template data-card-molde>");
  } else {
    const p = partesDoCard(molde[1]);
    if (!p.url || !p.imagem || !p.titulo || p.meta.length === 0 || p.chips.length === 0) {
      erroIdioma(`molde incompleto (url=${!!p.url} img=${!!p.imagem} h2=${!!p.titulo} meta=${p.meta.length} chips=${p.chips.length}): o HTML do card do Blowfish mudou?`);
    }
  }

  // ---------- 2. JSON ----------
  let dados = { posts: [], termos: [] };
  if (!urlJson || !caminhoSeguro(urlJson) || !existsSync(join(PUBLIC, urlJson))) {
    erroIdioma(`JSON da home ausente ou com caminho inválido: ${urlJson}`);
  } else {
    const bruto = readFileSync(join(PUBLIC, urlJson));
    const [alg, valor] = String(integridade || "").split("-");
    const calculado = alg ? createHash(alg).update(bruto).digest("base64") : "";
    if (!valor || calculado !== valor) {
      erroIdioma("integridade (SRI) do JSON não confere com o arquivo");
    }
    dados = JSON.parse(bruto.toString("utf8"));
  }
  const termos = dados.termos || [];
  const porUrl = new Map((dados.posts || []).map((p) => [p.u, p]));

  const indice = JSON.parse(html(`${prefixo}index.json`));
  // Posts do índice da busca, sem a própria página de lista (/posts/).
  const totalPosts = indice.filter((i) => i.type === "posts" && i.permalink !== `/${prefixo}posts/`).length;
  if (porUrl.size !== totalPosts) {
    erroIdioma(`JSON com ${porUrl.size} post(s); o índice da busca tem ${totalPosts}`);
  }
  const recentes = [...(dados.posts || [])].sort((a, b) => b.d - a.d).slice(0, visiveis).map((p) => p.u);
  if (recentes.join() !== itensHome.join()) {
    erroIdioma("os cards visíveis da home não são os mais recentes do JSON");
  }

  // ---------- 3. URLs ----------
  for (const p of dados.posts || []) {
    if (!caminhoSeguro(p.u)) erroIdioma(`URL inválida no JSON: ${p.u}`);
    if (p.i && !caminhoSeguro(p.i)) erroIdioma(`imagem inválida no JSON (${p.u}): ${p.i}`);
    if (!p.t || !Array.isArray(p.m) || p.m.length === 0) erroIdioma(`post sem título ou metadados no JSON: ${p.u}`);
    for (const c of p.c || []) {
      if (!termos[c] || !caminhoSeguro(termos[c].u)) erroIdioma(`termo inválido (${p.u}): índice ${c}`);
    }
  }

  // ---------- 4. fidelidade ao card do tema (/posts/ e /posts/page/N/) ----------
  const paginas = [`${prefixo}posts/index.html`];
  const dirPaginas = join(PUBLIC, prefixo, "posts", "page");
  if (existsSync(dirPaginas)) {
    for (const n of readdirSync(dirPaginas)) paginas.push(join(prefixo, "posts", "page", n, "index.html"));
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
          erroIdioma(`${t.url}: "${campo}" do JSON difere do card do tema\n    tema: ${JSON.stringify(t[campo])}\n    json: ${JSON.stringify(doJson[campo])}`);
        }
      }
    }
  }
  if (comparados < Math.min(totalPosts, 10)) {
    erroIdioma(`só ${comparados} card(s) do tema encontrados em /posts/ para comparar (o HTML do card mudou?)`);
  }
  return `${prefixo || "pt-BR: "}${itensHome.length} cards na home, ${porUrl.size} posts no JSON, ${comparados} comparados com o tema`;
}
for (const prefixo of IDIOMAS) resumo.push(verificarIdioma(prefixo));

// ---------- 5. redirecionamento pelo idioma do navegador (override de language-redirect.html) ----------
// Sem <script> inline (CSP), um script com SRI e data-config JSON válido, traduções só com caminhos do site,
// e hreflang x-default apontando para o pt-BR. Pega mudanças do Blowfish/Hugo na saída.
for (const pagina of ["index.html", "en/index.html", "posts/index.html", "en/posts/index.html"]) {
  if (!existsSync(join(PUBLIC, pagina))) { erro(`[idioma] ${pagina} não existe`); continue; }
  const h = html(pagina);
  if (/BlowfishLanguageRedirectConfig\s*=/.test(h)) erro(`[idioma] ${pagina}: configuração do redirecionamento em script inline (a CSP bloqueia); o override layouts/partials/language-redirect.html está em uso?`);
  const tag = (h.match(/<script\s[^>]*data-config=[^>]*>/) || [])[0];
  if (!tag) { erro(`[idioma] ${pagina}: sem o script do redirecionamento (data-config)`); continue; }
  if (!attr(tag, "integrity")) erro(`[idioma] ${pagina}: script do redirecionamento sem integrity (SRI)`);
  if (!caminhoSeguro(attr(tag, "src") || "")) erro(`[idioma] ${pagina}: src do script inválido`);
  try {
    const c = JSON.parse(decodificar(attr(tag, "data-config") || ""));
    if (c.enabled !== true || !Array.isArray(c.translations) || c.translations.length < 2) erro(`[idioma] ${pagina}: data-config sem enabled/translations`);
    for (const t of c.translations || []) if (!caminhoSeguro(t.url)) erro(`[idioma] ${pagina}: URL de tradução inválida ${t.url}`);
  } catch (e) {
    erro(`[idioma] ${pagina}: data-config não é JSON válido (${e.message})`);
  }
  if (!/hreflang="?x-default"?/.test(h)) erro(`[idioma] ${pagina}: sem <link hreflang="x-default">`);
}

if (erros.length) {
  console.error(`check-home: ${erros.length} problema(s)`);
  for (const e of erros.slice(0, 20)) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`check-home: OK (${resumo.join("; ")})`);

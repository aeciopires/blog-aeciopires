#!/usr/bin/env node
// Versão em inglês (en-US) do blog: garantia de que cada página pt-BR tem a tradução em dia.
// pt-BR é o idioma padrão e a FONTE; a tradução fica ao lado, no mesmo bundle:
//   content/posts/<slug>/index.md   ->  content/posts/<slug>/index.en.md
//   content/<pasta>/_index.md       ->  content/<pasta>/_index.en.md
// A tradução é feita ANTES do commit, por IA local (skill traduzir-conteudo / agente tradutor-en);
// nada é traduzido no build nem no navegador. Documentação: docs/MAINTENANCE.md, seção "Versão em inglês".
//
//   node scripts/i18n.mjs status                      make i18n-status   (todas as páginas)
//   node scripts/i18n.mjs check [arquivos.md...]      make check-i18n    (validate, pre-commit, CI)
//   node scripts/i18n.mjs ok <alvo>... [--forcar]     make i18n-ok SLUG= (valida e carimba sourceHash)
//   node scripts/i18n.mjs diff <alvo>                 make i18n-diff SLUG= (o que mudou no pt desde a tradução)
//   node scripts/i18n.mjs prosa <alvo>...             make prosa-en SLUG= (texto corrido do en, revisão)
//   node scripts/i18n.mjs sync-fm <alvo>...           copia do pt os campos não traduzíveis do front matter
//   node scripts/i18n.mjs faltando                    lista os arquivos pt sem tradução ou desatualizados
//   node scripts/i18n.mjs correcoes [arquivos.md...]  make check-correcoes: correções no conteúdo ainda não
//                                                     conferidas pelo autor (reports/correcoes-conteudo-*.md)
//
// <alvo>: slug de post ou página (ex.: primeiros-passos-com-docker, sobre) ou caminho de um .md.
//
// Regras verificadas (a tradução muda só o texto; o resto é igual ao pt-BR):
//  - front matter: title, description, summary e linkTitle são traduzidos; aliases e wp_id são só do pt
//    (URLs herdadas do WordPress); todo o resto (slug, date, lastmod, draft, tags, categories, show*...) igual;
//  - blocos de código: iguais, linha a linha, exceto linhas que são só comentário (#, //), que podem ser traduzidas;
//  - código em linha (`...`), URLs externas, imagens, src de figuras e a sequência de shortcodes: iguais;
//  - links internos: /slug/ no pt vira /en/slug/ no en (arquivos com extensão, como /wp-content/..., ficam iguais);
//  - títulos (#, ##...): mesma quantidade por nível;
//  - sourceHash: hash do pt (título, descrição e corpo) quando a tradução foi feita/revisada. Mudou o pt,
//    a tradução fica "desatualizada" e o commit é bloqueado até ser atualizada e carimbada de novo.
// Rascunhos (draft: true) podem ficar sem tradução; publicados, não.
// Conteúdo que JÁ é bilíngue no original (pt-BR + inglês no mesmo arquivo) leva "bilingue: true" no front matter
// do pt-BR e NÃO tem tradução (index.en.md é recusado): links das páginas em inglês apontam para a URL original
// (/slug/, sem /en/) e menus em inglês usam url = "/slug/" no lugar de pageRef.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { join, relative, resolve, dirname, basename } from "node:path";

const RAIZ = resolve(dirname(new URL(import.meta.url).pathname), "..");
const CONTEUDO = join(RAIZ, "content");
const TRADUZIVEIS = new Set(["title", "description", "summary", "linkTitle"]);
const SO_PT = new Set(["aliases", "wp_id"]);
const SO_EN = new Set(["sourceHash", "aliases"]);
const rel = (f) => relative(RAIZ, f);

// ---------- arquivos e pares ----------
function todosPt(dir = CONTEUDO) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...todosPt(p));
    else if (e.name === "index.md" || e.name === "_index.md") out.push(p);
  }
  return out.sort();
}
function todosEn(dir = CONTEUDO) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...todosEn(p));
    else if (e.name === "index.en.md" || e.name === "_index.en.md") out.push(p);
  }
  return out.sort();
}
const enDe = (pt) => pt.replace(/\.md$/, ".en.md");
const ptDe = (en) => en.replace(/\.en\.md$/, ".md");

function resolverAlvo(alvo) {
  const candidatos = [alvo, join(RAIZ, alvo), join(CONTEUDO, "posts", alvo, "index.md"), join(CONTEUDO, alvo, "index.md"), join(CONTEUDO, alvo, "_index.md")];
  for (const c of candidatos) {
    if (existsSync(c) && statSync(c).isFile()) {
      const abs = resolve(c);
      return abs.endsWith(".en.md") ? ptDe(abs) : abs;
    }
    if (existsSync(c) && statSync(c).isDirectory()) {
      for (const n of ["index.md", "_index.md"]) if (existsSync(join(c, n))) return resolve(join(c, n));
    }
  }
  console.error(`não encontrado: ${alvo} (use o slug do post/página ou o caminho do .md)`);
  process.exit(2);
}

// ---------- front matter (subconjunto simples de YAML, como scripts/tags.mjs) ----------
function partes(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: [], corpo: texto };
  const fm = [];
  for (const linha of m[1].split("\n")) {
    const k = linha.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
    if (k) fm.push({ chave: k[1], valor: k[2].trim(), extra: [] });
    else if (fm.length) fm[fm.length - 1].extra.push(linha);
  }
  return { fm, corpo: m[2] };
}
const bruto = (item) => [item.valor, ...item.extra].join("\n").trim();
const mapaFm = (fm) => new Map(fm.map((i) => [i.chave, bruto(i)]));
function montar(fm, corpo) {
  const linhas = fm.flatMap((i) => [`${i.chave}:${i.valor ? ` ${i.valor}` : ""}`, ...i.extra]);
  return `---\n${linhas.join("\n")}\n---\n${corpo}`;
}
const ler = (f) => partes(readFileSync(f, "utf8"));
const rascunho = (fm) => mapaFm(fm).get("draft") === "true";

// Hash da fonte: só o que é traduzido (título, descrição, resumo e corpo). Campos mecânicos
// (tags, datas, draft) são comparados um a um e não deixam a tradução "desatualizada".
function hashPt(texto) {
  const { fm, corpo } = partes(texto);
  const m = mapaFm(fm);
  const fonte = JSON.stringify([...TRADUZIVEIS].map((k) => m.get(k) || "").concat(corpo.replace(/\r\n/g, "\n").trimEnd()));
  return createHash("sha256").update(fonte).digest("hex").slice(0, 16);
}

// ---------- extração do corpo ----------
// Separa o corpo em blocos de código cercados (``` ou ~~~) e o resto (prosa + shortcodes).
function analisar(corpo) {
  const blocos = [];
  const prosa = [];
  let atual = null;
  for (const linha of corpo.split("\n")) {
    const cerca = linha.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (atual) {
      if (cerca && cerca[1][0] === atual.cerca[0] && cerca[1].length >= atual.cerca.length && !cerca[2].trim()) {
        blocos.push(atual);
        atual = null;
      } else atual.linhas.push(linha);
    } else if (cerca) atual = { cerca: cerca[1], info: cerca[2].trim(), linhas: [] };
    else prosa.push(linha);
  }
  if (atual) blocos.push(atual);
  return { blocos, prosa: prosa.join("\n") };
}
// Linhas que são só comentário (podem ser traduzidas). "#!" (shebang) e "#include" não são comentário.
const soComentario = (l) => /^\s*(#(?![!]|include\b)|\/\/|--\s|;\s|<!--)/.test(l);
const codigoNormalizado = (b) => [b.info, ...b.linhas.filter((l) => !soComentario(l)).map((l) => l.replace(/\s+$/, ""))].join("\n");

// Prosa sem o conteúdo do shortcode mermaid (rótulos de diagrama são traduzidos).
const semMermaid = (t) => t.replace(/\{\{<\s*mermaid[\s\S]*?\{\{<\s*\/mermaid\s*>\}\}/g, "{{< mermaid >}}");

const todos = (re, t, g = 1) => [...t.matchAll(re)].map((m) => m[g]);
function elementos(corpo) {
  const { blocos, prosa } = analisar(corpo);
  const p = semMermaid(prosa);
  const urls = todos(/https?:\/\/[^\s)\]>"'`|]+/g, p, 0).map((u) => u.replace(/[.,;:!?]+$/, ""));
  const internos = [
    ...todos(/\]\((\/[^)\s]*)/g, p),
    ...todos(/\]:\s+(\/\S+)/g, p),
    ...todos(/\b(?:href|link|url)="(\/[^"]*)"/g, p),
  ];
  return {
    blocos,
    codigoLinha: todos(/(?<!`)`([^`\n]+)`(?!`)/g, p),
    urls,
    internos,
    imagens: todos(/!\[[^\]]*\]\(([^)\s]+)/g, p),
    srcs: todos(/\bsrc="([^"]+)"/g, p),
    refs: todos(/\{\{<\s*(?:rel)?ref\s+"([^"]+)"/g, p),
    shortcodes: todos(/\{\{[<%]\s*([a-zA-Z][\w-]*)/g, p),
    titulos: todos(/^(#{1,6})\s/gm, p).map((h) => h.length),
    prosa: p,
  };
}

// /slug/ (página) vira /en/slug/; arquivos (com extensão) e âncoras ficam como estão.
// Caminhos (/slug/) das páginas bilíngues no original: não têm versão /en/.
let _bilingues;
function caminhosBilingues() {
  if (_bilingues) return _bilingues;
  _bilingues = new Set();
  for (const pt of todosPt()) {
    const m = mapaFm(partes(readFileSync(pt, "utf8")).fm);
    if (m.get("bilingue") !== "true") continue;
    const d = rel(dirname(pt)).replace(/^content\/?/, "");
    const slug = (m.get("slug") || "").replace(/^["']|["']$/g, "") || basename(d);
    _bilingues.add(d.startsWith("posts/") ? `/${slug}/` : `/${d}/`);
  }
  return _bilingues;
}

function internoEn(u) {
  const [caminho] = u.split(/[?#]/);
  if (/\.[a-z0-9]{2,5}$/i.test(caminho)) return u;
  if (caminhosBilingues().has(caminho.endsWith("/") ? caminho : `${caminho}/`)) return u;
  return u === "/" ? "/en/" : `/en${u}`;
}

const contar = (lista) => lista.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
function difMultiset(a, b) {
  const ca = contar(a);
  const cb = contar(b);
  const faltam = [];
  const sobram = [];
  for (const [k, n] of ca) for (let i = (cb.get(k) || 0); i < n; i++) faltam.push(k);
  for (const [k, n] of cb) for (let i = (ca.get(k) || 0); i < n; i++) sobram.push(k);
  return { faltam, sobram };
}

// Palavras muito comuns em português que não existem em inglês: indicam trecho não traduzido.
const PT = /(?<![\p{L}])(não|você|vocês|também|então|está|estão|são|uma|umas|uns|pelo|pela|isso|isto|esse|essa|este|esta|agora|quando|porque|já|muito|mais|sobre|seu|sua|nosso|nossa|onde|como|para|com|sem|ao|aos|à|às|dos|das|nos|nas|foi|ser|ter|pode|podem|deve|após|até|então|aqui|ainda|cada)(?![\p{L}])/giu;
function residuosPt(prosa) {
  const out = [];
  prosa.split("\n").forEach((linha, i) => {
    const s = linha.replace(/\{\{[<%][\s\S]*?[%>]\}\}/g, " ").replace(/`[^`]*`/g, " ").replace(/\]\([^)]*\)/g, "]").replace(/https?:\/\/\S+/g, " ");
    const achados = s.match(PT) || [];
    if (achados.length >= 2) out.push(`linha ${i + 1}: ${s.trim().slice(0, 110)}`);
  });
  return out;
}

// Textos de link que o Lighthouse (auditoria "link-text", SEO) considera genéricos em inglês: derrubam a nota.
const LINK_GENERICO = /^(click here|click this|go|here|this|start|right here|more|learn more|read more|continue|link|this link|see more|more info|more information|check out|details|download)$/i;
function linksGenericos(prosa) {
  return [...prosa.matchAll(/(?<!!)\[([^\]]+)\]\(/g)].map((m) => m[1].replace(/[*_`]/g, "").trim()).filter((t) => LINK_GENERICO.test(t));
}

// ---------- verificação de um par ----------
// Retorna { erros: [], avisos: [], estado: "ok"|"falta"|"desatualizada"|"rascunho"|"orfa" }
function verificarPar(pt) {
  const en = enDe(pt);
  const r = { pt, en, erros: [], avisos: [], estado: "ok" };
  if (!existsSync(pt) && !existsSync(en)) return r; // os dois removidos (ex.: make rm-post)
  if (!existsSync(pt)) {
    r.estado = "orfa";
    r.erros.push(`${rel(en)}: tradução sem o original pt-BR (${rel(pt)}); remova ou renomeie junto`);
    return r;
  }
  const textoPt = readFileSync(pt, "utf8");
  const a = partes(textoPt);
  const ehRascunho = rascunho(a.fm);
  if (mapaFm(a.fm).get("bilingue") === "true") {
    r.estado = "bilingue";
    if (existsSync(en)) r.erros.push(`${rel(en)}: ${rel(pt)} já é bilíngue no original (bilingue: true) e não leva tradução; remova ${basename(en)}`);
    return r;
  }
  if (!existsSync(en)) {
    r.estado = ehRascunho ? "rascunho" : "falta";
    (ehRascunho ? r.avisos : r.erros).push(`${rel(pt)}: sem tradução ${basename(en)} (skill traduzir-conteudo)`);
    return r;
  }
  const b = ler(en);
  const ma = mapaFm(a.fm);
  const mb = mapaFm(b.fm);

  // front matter
  for (const [k, v] of ma) {
    if (TRADUZIVEIS.has(k)) {
      if (!mb.get(k)) r.erros.push(`${rel(en)}: front matter sem "${k}" traduzido`);
    } else if (!SO_PT.has(k) && mb.get(k) !== v) {
      r.erros.push(`${rel(en)}: front matter "${k}" deve ser igual ao pt-BR (${v || "vazio"}; está ${mb.has(k) ? mb.get(k) || "vazio" : "ausente"}). Use: make i18n-sync-fm SLUG=…`);
    }
  }
  for (const k of mb.keys()) {
    if (!ma.has(k) && !SO_EN.has(k) && !TRADUZIVEIS.has(k)) r.erros.push(`${rel(en)}: front matter "${k}" não existe no pt-BR`);
  }
  if (mb.has("wp_id")) r.erros.push(`${rel(en)}: wp_id é só do pt-BR (redirecionamentos do WordPress)`);

  // corpo
  const ea = elementos(a.corpo);
  const eb = elementos(b.corpo);
  if (ea.blocos.length !== eb.blocos.length) {
    r.erros.push(`${rel(en)}: ${eb.blocos.length} bloco(s) de código; o pt-BR tem ${ea.blocos.length}`);
  } else {
    ea.blocos.forEach((bl, i) => {
      const x = codigoNormalizado(bl);
      const y = codigoNormalizado(eb.blocos[i]);
      if (x !== y) {
        const la = x.split("\n");
        const lb = y.split("\n");
        let j = 0;
        while (j < la.length && la[j] === lb[j]) j++;
        r.erros.push(`${rel(en)}: bloco de código ${i + 1} difere do pt-BR (comandos devem ser iguais; só linhas de comentário podem ser traduzidas)\n      pt: ${la[j] ?? "(fim)"}\n      en: ${lb[j] ?? "(fim)"}`);
      }
    });
  }
  const comparar = (nome, x, y) => {
    const { faltam, sobram } = difMultiset(x, y);
    if (faltam.length || sobram.length) {
      r.erros.push(`${rel(en)}: ${nome} diferentes do pt-BR${faltam.length ? `\n      faltam no en: ${faltam.slice(0, 5).join("  ")}` : ""}${sobram.length ? `\n      sobram no en: ${sobram.slice(0, 5).join("  ")}` : ""}`);
    }
  };
  comparar("códigos em linha (`...`)", ea.codigoLinha, eb.codigoLinha);
  comparar("links externos", ea.urls, eb.urls);
  comparar("links internos (/slug/ no pt = /en/slug/ no en)", ea.internos.map(internoEn), eb.internos);
  comparar("imagens", ea.imagens, eb.imagens);
  comparar("src de shortcodes", ea.srcs, eb.srcs);
  comparar("refs ({{< ref >}})", ea.refs, eb.refs);
  if (ea.shortcodes.join() !== eb.shortcodes.join()) {
    r.erros.push(`${rel(en)}: sequência de shortcodes difere do pt-BR\n      pt: ${ea.shortcodes.join(", ")}\n      en: ${eb.shortcodes.join(", ")}`);
  }
  if (ea.titulos.join() !== eb.titulos.join()) {
    r.erros.push(`${rel(en)}: estrutura de títulos (#, ##...) difere do pt-BR (pt: ${ea.titulos.join("") || "-"}; en: ${eb.titulos.join("") || "-"})`);
  }
  for (const l of residuosPt(eb.prosa).slice(0, 5)) r.avisos.push(`${rel(en)}: possível trecho em português, ${l}`);
  for (const t of linksGenericos(eb.prosa)) r.avisos.push(`${rel(en)}: texto de link genérico "${t}" (o Lighthouse reduz o SEO); descreva o destino, ex.: "the Go language", "the Prometheus overview"`);

  // atualização
  const h = hashPt(textoPt);
  if (mb.get("sourceHash") !== `"${h}"`) {
    r.estado = ehRascunho ? "rascunho" : "desatualizada";
    const msg = mb.has("sourceHash")
      ? `${rel(en)}: tradução desatualizada (o pt-BR mudou). Veja o que mudou: make i18n-diff SLUG=${slugDe(pt)}; atualize e rode make i18n-ok SLUG=${slugDe(pt)}`
      : `${rel(en)}: tradução sem carimbo sourceHash (rode make i18n-ok SLUG=${slugDe(pt)} depois de revisar)`;
    (ehRascunho ? r.avisos : r.erros).push(msg);
  } else if (r.erros.length) r.estado = "erro";
  if (r.erros.length && r.estado === "ok") r.estado = "erro";
  return r;
}

function slugDe(pt) {
  const d = rel(dirname(pt)).replace(/^content\/?/, "");
  if (d.startsWith("posts/") && basename(pt) === "index.md") return d.slice(6);
  return d || "content/_index.md";
}

// ---------- textos da interface e menus ----------
// Chaves (caminho completo) de um YAML simples de i18n.
function chavesYaml(arquivo) {
  const out = [];
  const pilha = [];
  for (const linha of readFileSync(arquivo, "utf8").split("\n")) {
    const m = linha.match(/^(\s*)([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m || linha.trim().startsWith("#")) continue;
    const nivel = m[1].length / 2;
    pilha.length = nivel;
    pilha[nivel] = m[2];
    if (m[3] && !m[3].startsWith("#")) out.push(pilha.join("."));
  }
  return out;
}
// Itens dos menus (sem os nomes, que são traduzidos).
function itensMenu(arquivo) {
  const out = [];
  let atual = null;
  for (const linha of readFileSync(arquivo, "utf8").split("\n")) {
    const sec = linha.match(/^\[\[(\w+)\]\]/);
    if (sec) { atual = { menu: sec[1] }; out.push(atual); continue; }
    const kv = linha.match(/^\s*(pageRef|url|identifier|weight|pre|parent)\s*=\s*(.+?)\s*$/);
    if (kv && atual) atual[kv[1]] = kv[2].replace(/\s+#.*$/, "");
  }
  // pageRef "x" (pt) equivale a url "/x/" (en): página bilíngue, sem versão /en/.
  return out.map((i) => {
    const c = { ...i };
    if (c.pageRef) { c.url = `"/${c.pageRef.replace(/^["'/]+|["'/]+$/g, "")}/"`; delete c.pageRef; }
    return JSON.stringify(Object.fromEntries(Object.entries(c).sort()));
  });
}
// Chaves usadas pelos layouts (tema + próprios) sem texto num dos idiomas: viram texto/aria-label vazio.
// Pega, a cada atualização do Blowfish, chave nova que o tema não traduz (docs/MAINTENANCE.md, seção 8).
function layoutsDe(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? layoutsDe(p) : e.name.endsWith(".html") ? [p] : [];
  });
}
function chavesSemTraducao() {
  const usadas = new Set();
  for (const f of [...layoutsDe(join(RAIZ, "themes", "blowfish", "layouts")), ...layoutsDe(join(RAIZ, "layouts"))]) {
    // "| default ..." logo depois: o tema já tem um texto de reserva (em inglês) e a chave é opcional.
    for (const m of readFileSync(f, "utf8").matchAll(/\bi18n\s+"([A-Za-z0-9_.]+)"(\s*\|\s*default)?/g)) if (!m[2]) usadas.add(m[1]);
  }
  const erros = [];
  for (const [idioma, arquivo] of [["pt-BR", "pt-BR.yaml"], ["en", "en.yaml"]]) {
    const existentes = new Set();
    for (const base of [join(RAIZ, "themes", "blowfish", "i18n"), join(RAIZ, "i18n")]) {
      const f = join(base, arquivo);
      if (!existsSync(f)) continue;
      for (const k of chavesYaml(f)) { existentes.add(k); existentes.add(k.replace(/\.(one|other|zero|few|many)$/, "")); }
    }
    const faltam = [...usadas].filter((k) => !existentes.has(k)).sort();
    if (faltam.length) erros.push(`i18n/${arquivo}: chaves usadas pelos layouts sem texto em ${idioma} (o tema não traduz; acrescente): ${faltam.join(", ")}`);
  }
  return erros;
}

// Arquivos do tema dos quais o redirecionamento pelo idioma do navegador depende (override em
// layouts/partials/language-redirect.html + assets/js/idioma-config.js). Se o Blowfish mudar algum, o check
// falha até alguém revisar o override, testar (docs/MAINTENANCE.md, "Redirecionamento pelo idioma do
// navegador") e atualizar o hash aqui. Hashes do Blowfish v3.10.0.
const TEMA_IDIOMA = {
  "themes/blowfish/layouts/partials/language-redirect.html": "76d710306d7e9aeaa0d4fde56dac676cd63cc645a42b72051ba51d2094f6c9cd",
  "themes/blowfish/assets/js/language-redirect.js": "1e4bab5facc3777d19f8e691b0c2d6f58c6bfc346083affbe304dc743df43ff6",
};
function temaIdiomaMudou() {
  const erros = [];
  for (const [arquivo, esperado] of Object.entries(TEMA_IDIOMA)) {
    const f = join(RAIZ, arquivo);
    if (!existsSync(f)) { erros.push(`${arquivo} não existe mais no tema: revise o redirecionamento pelo idioma (layouts/partials/language-redirect.html)`); continue; }
    const atual = createHash("sha256").update(readFileSync(f)).digest("hex");
    if (atual !== esperado) erros.push(`${arquivo} mudou no tema (sha256 ${atual}): revise layouts/partials/language-redirect.html e assets/js/idioma-config.js, teste o redirecionamento e atualize TEMA_IDIOMA em scripts/i18n.mjs`);
  }
  return erros;
}

function verificarInterface() {
  const erros = chavesSemTraducao().concat(temaIdiomaMudou());
  const pt = join(RAIZ, "i18n", "pt-BR.yaml");
  const en = join(RAIZ, "i18n", "en.yaml");
  if (existsSync(pt) && existsSync(en)) {
    const a = chavesYaml(pt).filter((k) => k.startsWith("blog."));
    const b = chavesYaml(en).filter((k) => k.startsWith("blog."));
    const { faltam, sobram } = difMultiset(a, b);
    if (faltam.length) erros.push(`i18n/en.yaml: faltam chaves de i18n/pt-BR.yaml: ${faltam.join(", ")}`);
    if (sobram.length) erros.push(`i18n/en.yaml: chaves que não existem em i18n/pt-BR.yaml: ${sobram.join(", ")}`);
  }
  const mpt = join(RAIZ, "config", "_default", "menus.pt-br.toml");
  const men = join(RAIZ, "config", "_default", "menus.en.toml");
  if (existsSync(mpt) && existsSync(men) && itensMenu(mpt).join() !== itensMenu(men).join()) {
    erros.push("config/_default/menus.en.toml: itens (pageRef, url, weight, ícones) diferentes de menus.pt-br.toml; só os nomes podem mudar");
  }
  return erros;
}

// ---------- comandos ----------
function cmdCheck(args) {
  let pares;
  if (args.length) {
    const s = new Set();
    for (const a of args) {
      const abs = resolve(RAIZ, a);
      if (!abs.startsWith(CONTEUDO) || !/(^|\/)_?index(\.en)?\.md$/.test(abs)) continue;
      s.add(abs.endsWith(".en.md") ? ptDe(abs) : abs);
    }
    pares = [...s];
  } else {
    pares = todosPt();
    for (const en of todosEn()) if (!existsSync(ptDe(en))) pares.push(ptDe(en));
  }
  let erros = 0;
  let avisos = 0;
  const interfaceMudou = !args.length || args.some((a) => /^(i18n\/|config\/_default\/menus\.)/.test(a));
  if (interfaceMudou) {
    for (const e of verificarInterface()) { console.error(`ERRO: ${e}`); erros++; }
  }
  for (const pt of pares) {
    const r = verificarPar(pt);
    for (const e of r.erros) console.error(`ERRO: ${e}`);
    for (const a of r.avisos) console.error(`aviso: ${a}`);
    erros += r.erros.length;
    avisos += r.avisos.length;
  }
  if (erros) {
    console.error(`\ncheck-i18n: ${erros} erro(s) em ${pares.length} página(s). Tradução: skill traduzir-conteudo (docs/MAINTENANCE.md, "Versão em inglês").`);
    process.exit(1);
  }
  console.log(`check-i18n: OK (${pares.length} página(s)${avisos ? `, ${avisos} aviso(s)` : ""})`);
}

function cmdStatus() {
  const cont = {};
  const linhas = [];
  for (const pt of todosPt()) {
    const r = verificarPar(pt);
    cont[r.estado] = (cont[r.estado] || 0) + 1;
    if (r.estado !== "ok") linhas.push(`  ${r.estado.padEnd(13)} ${rel(pt)}`);
  }
  for (const en of todosEn()) if (!existsSync(ptDe(en))) { cont.orfa = (cont.orfa || 0) + 1; linhas.push(`  orfa          ${rel(en)}`); }
  console.log(linhas.join("\n") || "  tudo traduzido e em dia");
  console.log(`\n${Object.entries(cont).map(([k, v]) => `${k}: ${v}`).join(" · ")}`);
}

function cmdFaltando() {
  for (const pt of todosPt()) {
    const r = verificarPar(pt);
    if (r.estado !== "ok") console.log(rel(pt));
  }
}

function cmdOk(args) {
  const forcar = args.includes("--forcar");
  let falhou = false;
  for (const a of args.filter((x) => x !== "--forcar")) {
    const pt = resolverAlvo(a);
    const en = enDe(pt);
    if (!existsSync(en)) { console.error(`ERRO: ${rel(en)} não existe`); falhou = true; continue; }
    // carimba antes de verificar, para a verificação olhar só a estrutura
    const b = ler(en);
    const h = `"${hashPt(readFileSync(pt, "utf8"))}"`;
    const fm = b.fm.filter((i) => i.chave !== "sourceHash").concat({ chave: "sourceHash", valor: h, extra: [] });
    const antes = readFileSync(en, "utf8");
    writeFileSync(en, montar(fm, b.corpo));
    let r;
    try {
      r = verificarPar(pt);
    } catch (e) {
      writeFileSync(en, antes);
      throw e;
    }
    const bloqueiam = r.erros.concat(r.avisos.filter((x) => x.includes("texto de link genérico")), forcar ? [] : r.avisos.filter((x) => x.includes("possível trecho em português")));
    if (bloqueiam.length) {
      writeFileSync(en, antes);
      for (const e of bloqueiam) console.error(`ERRO: ${e}`);
      console.error(`${rel(en)}: NÃO carimbado. Corrija (ou, se o trecho em português for intencional, como um nome próprio, use FORCAR=1).`);
      falhou = true;
      continue;
    }
    for (const x of r.avisos) console.error(`aviso: ${x}`);
    console.log(`carimbado: ${rel(en)} (sourceHash ${h})`);
  }
  if (falhou) process.exit(1);
}

function cmdDiff(args) {
  const pt = resolverAlvo(args[0] || "");
  const en = enDe(pt);
  const alvo = existsSync(en) ? mapaFm(ler(en).fm).get("sourceHash") || "" : "";
  const caminho = rel(pt);
  if (alvo === `"${hashPt(readFileSync(pt, "utf8"))}"`) { console.log(`${rel(en)} está em dia com ${caminho}.`); return; }
  let commit = "";
  if (alvo) {
    const commits = execFileSync("git", ["log", "--format=%H", "--", caminho], { cwd: RAIZ, encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const c of commits) {
      try {
        const t = execFileSync("git", ["show", `${c}:${caminho}`], { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
        if (`"${hashPt(t)}"` === alvo) { commit = c; break; }
      } catch { /* arquivo não existia nesse commit */ }
    }
  }
  if (!commit) {
    console.log(`Sem versão anterior do pt-BR que bata com o sourceHash de ${rel(en)}: traduza ${caminho} inteiro.`);
    return;
  }
  console.log(`# ${caminho}: mudanças desde ${commit.slice(0, 10)} (a versão que ${basename(en)} traduziu)\n`);
  process.stdout.write(execFileSync("git", ["diff", "--no-color", commit, "--", caminho], { cwd: RAIZ, encoding: "utf8" }));
}

function cmdProsa(args) {
  for (const a of args) {
    const en = enDe(resolverAlvo(a));
    if (!existsSync(en)) { console.error(`${rel(en)} não existe`); continue; }
    const { fm, corpo } = ler(en);
    const m = mapaFm(fm);
    console.log(`##### ${rel(en)}\n${m.get("title") || ""}\n${m.get("description") || ""}`);
    const { prosa } = analisar(corpo);
    for (const linha of semMermaid(prosa).split("\n")) {
      const s = linha.trim();
      if (!s || s.startsWith("{{<") || s.startsWith("|")) continue;
      console.log(s.replace(/\]\([^)]+\)/g, "]"));
    }
  }
}

function cmdSyncFm(args) {
  for (const a of args) {
    const pt = resolverAlvo(a);
    const en = enDe(pt);
    if (!existsSync(en)) { console.error(`${rel(en)} não existe`); continue; }
    const fa = partes(readFileSync(pt, "utf8")).fm;
    const b = ler(en);
    const mb = new Map(b.fm.map((i) => [i.chave, i]));
    const novo = [];
    for (const i of fa) {
      if (SO_PT.has(i.chave)) continue;
      novo.push(TRADUZIVEIS.has(i.chave) && mb.has(i.chave) ? mb.get(i.chave) : i);
    }
    for (const k of ["aliases", "sourceHash"]) if (mb.has(k)) novo.push(mb.get(k));
    const antes = readFileSync(en, "utf8");
    const depois = montar(novo, b.corpo);
    if (antes !== depois) { writeFileSync(en, depois); console.log(`front matter sincronizado: ${rel(en)}`); }
  }
}

// ---------- correções feitas pela IA no conteúdo, para o autor conferir antes do commit ----------
// reports/correcoes-conteudo-AAAA-MM-DD.md (ignorado pelo Git): "- [ ] `slug` · ..." = ainda não conferido.
function cmdCorrecoes(args) {
  const dir = join(RAIZ, "reports");
  const relatorios = existsSync(dir) ? readdirSync(dir).filter((f) => /^correcoes-conteudo-.*\.md$/.test(f)).sort() : [];
  const pendentes = [];
  for (const f of relatorios) {
    readFileSync(join(dir, f), "utf8").split("\n").forEach((l, i) => {
      const m = l.match(/^\s*- \[ \] `([^`]+)`/);
      if (m) pendentes.push({ slug: m[1], onde: `reports/${f}:${i + 1}`, texto: l.trim().slice(6, 160) });
    });
  }
  let alvo = pendentes;
  if (args.length) {
    const slugs = new Set();
    for (const a of args) {
      const abs = resolve(RAIZ, a);
      if (!abs.startsWith(CONTEUDO) || !/\.md$/.test(abs)) continue;
      slugs.add(slugDe(abs.endsWith(".en.md") ? ptDe(abs) : abs));
    }
    alvo = pendentes.filter((p) => slugs.has(p.slug));
  }
  if (alvo.length) {
    for (const p of alvo) console.error(`PENDENTE: ${p.onde}  ${p.texto}`);
    console.error(`\ncheck-correcoes: ${alvo.length} correção(ões) feitas pela IA ainda não conferidas. Revise cada uma (git diff),`);
    console.error("desfaça o que não concordar e marque - [x] no relatório. Skill traduzir-conteudo, seção \"Correções no original\".");
    process.exit(1);
  }
  console.log(`check-correcoes: OK (${pendentes.length ? `${pendentes.length} pendente(s) em outros conteúdos` : "nada pendente"})`);
}

const [, , comando, ...args] = process.argv;
const comandos = { correcoes: cmdCorrecoes, check: cmdCheck, status: cmdStatus, ok: cmdOk, diff: cmdDiff, prosa: cmdProsa, "sync-fm": cmdSyncFm, faltando: cmdFaltando };
if (!comandos[comando]) {
  console.error("uso: i18n.mjs status | check [arquivos] | ok <alvo>... [--forcar] | diff <alvo> | prosa <alvo>... | sync-fm <alvo>... | faltando");
  process.exit(2);
}
comandos[comando](args);

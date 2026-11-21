#!/usr/bin/env node
// Governança de tags e categorias (PLAN.md 6.7 e 6.8). Node puro (do mise), sem dependências npm.
//
// Uso (via Makefile):
//   node scripts/tags.mjs check [arquivos.md...]        make check-tags
//   node scripts/tags.mjs fix [--slug S] [--write]      make fix-tags [SLUG=] [CONFIRM=sim]
//   node scripts/tags.mjs new NOME "DESCRIÇÃO" [--force] make new-tag NAME= DESC=
//   node scripts/tags.mjs merge DE PARA [--write]       make merge-tag FROM= TO= [CONFIRM=sim]
//   node scripts/tags.mjs remove NOME [--write]         make rm-tag NAME= [CONFIRM=sim]
//   node scripts/tags.mjs report                        make tags-report  (reports/tags.md)
//   node scripts/tags.mjs normalize MAPA [--write]      make normalize-tags (Fase 3, uma vez)
//   node scripts/tags.mjs init [--write]                registra as tags em uso (Fase 3)
//
// Formatos aceitos (subconjunto simples de YAML, validado aqui):
//   front matter:  tags: ["a", "b"]  ou  tags:\n  - a\n  - b   (idem categories)
//   data/taxonomia.yaml: chaves de 1º nível; mapas "  chave: valor"; listas "[a, b]".

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CONTEUDO = path.join(RAIZ, "content");
const REGISTRO = path.join(RAIZ, "data", "taxonomia.yaml");
const SLUG_OK = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---------- utilidades ----------
const rel = (f) => path.relative(RAIZ, f);
const erro = (msg) => { console.error(`ERRO: ${msg}`); process.exit(1); };

function arquivosMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...arquivosMd(p));
    else if (e.name.endsWith(".md") && !e.name.startsWith("_index")) out.push(p);
  }
  return out.sort();
}

function slugificar(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const limparValor = (v) => v.trim().replace(/^["']|["']$/g, "");
const lerLista = (v) => {
  const m = v.trim().match(/^\[(.*)\]$/);
  if (!m) return null;
  return m[1].split(",").map(limparValor).filter(Boolean);
};
const semComentario = (l) => l.replace(/\s+#.*$/, "").replace(/^#.*$/, "");

// ---------- registro (data/taxonomia.yaml) ----------
function lerRegistro() {
  if (!fs.existsSync(REGISTRO)) erro(`${rel(REGISTRO)} não existe`);
  const reg = {};
  let atual = null;
  fs.readFileSync(REGISTRO, "utf8").split("\n").forEach((bruta, i) => {
    const l = semComentario(bruta);
    if (!l.trim()) return;
    let m;
    if ((m = l.match(/^([a-z_]+):\s*(.*)$/))) {
      atual = m[1];
      const lista = m[2] ? lerLista(m[2]) : null;
      if (m[2] && !lista) erro(`${rel(REGISTRO)}:${i + 1}: valor de 1º nível deve ser lista [a, b]`);
      reg[atual] = lista || {};
    } else if ((m = l.match(/^ {2}([a-z0-9_-]+):\s*(.*)$/)) && atual) {
      const lista = lerLista(m[2]);
      reg[atual][m[1]] = lista || (/^\d+$/.test(m[2].trim()) ? Number(m[2]) : limparValor(m[2]));
    } else {
      erro(`${rel(REGISTRO)}:${i + 1}: linha fora do formato esperado: ${bruta}`);
    }
  });
  reg.tags ||= {}; reg.sinonimos ||= {}; reg.categorias ||= []; reg.regras ||= {};
  reg.regras.proibidas ||= [];
  return reg;
}

function gravarRegistro(reg) {
  const original = fs.readFileSync(REGISTRO, "utf8");
  const cabecalho = original.split("\n").filter((l, i, a) => a.slice(0, i + 1).every((x) => x.startsWith("#") || !x.trim())).join("\n");
  const mapa = (o) => Object.keys(o).sort().map((k) => `  ${k}: ${o[k]}`).join("\n");
  const r = reg.regras;
  const txt = `${cabecalho.trimEnd()}

tags:                       # tags permitidas (slug: descrição curta)
${mapa(reg.tags)}

sinonimos:                  # variação -> tag oficial (make fix-tags corrige)
${mapa(reg.sinonimos)}

categorias: [${[...reg.categorias].join(", ")}]

regras:
  max_tags_por_post: ${r.max_tags_por_post ?? 5}
  min_tags_por_post: ${r.min_tags_por_post ?? 1}
  proibidas: [${r.proibidas.join(", ")}]   # já são categorias
`;
  fs.writeFileSync(REGISTRO, txt);
}

// ---------- front matter ----------
function lerFrontMatter(arquivo) {
  const texto = fs.readFileSync(arquivo, "utf8");
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const linhas = m[1].split("\n");
  const fm = { texto, bloco: m[0], linhas, tags: null, categories: null, draft: false, date: null };
  for (let i = 0; i < linhas.length; i++) {
    const k = linhas[i].match(/^(tags|categories|draft|date):\s*(.*)$/);
    if (!k) continue;
    if (k[1] === "draft") { fm.draft = k[2].trim() === "true"; continue; }
    if (k[1] === "date") { fm.date = limparValor(k[2]); continue; }
    let lista = lerLista(k[2]);
    if (!lista && !k[2].trim()) {
      lista = [];
      while (i + 1 < linhas.length && /^\s*-\s+/.test(linhas[i + 1])) lista.push(limparValor(linhas[++i].replace(/^\s*-\s+/, "")));
    }
    fm[k[1]] = lista ?? [limparValor(k[2])];
  }
  return fm;
}

// Regrava só a chave pedida, no formato inline; o resto do arquivo fica intacto.
function trocarChave(fm, chave, valores) {
  const novas = [];
  const linhas = fm.linhas;
  let feito = false;
  for (let i = 0; i < linhas.length; i++) {
    if (new RegExp(`^${chave}:`).test(linhas[i])) {
      while (i + 1 < linhas.length && /^\s*-\s+/.test(linhas[i + 1])) i++;
      novas.push(`${chave}: [${valores.map((v) => `"${v}"`).join(", ")}]`);
      feito = true;
    } else novas.push(linhas[i]);
  }
  if (!feito) novas.push(`${chave}: [${valores.map((v) => `"${v}"`).join(", ")}]`);
  const bloco = `---\n${novas.join("\n")}\n---\n`;
  return fm.texto.replace(fm.bloco, bloco);
}

function diffSimples(arquivo, antes, depois) {
  const a = antes.split("\n"), d = depois.split("\n");
  console.log(`--- ${rel(arquivo)}`);
  for (let i = 0; i < Math.max(a.length, d.length); i++)
    if (a[i] !== d[i]) { if (a[i] !== undefined) console.log(`- ${a[i]}`); if (d[i] !== undefined) console.log(`+ ${d[i]}`); }
}

// ---------- aliases (redirecionamentos das tags antigas, PLAN.md 6.7) ----------
function adicionarAlias(arquivoIndice, titulo, alias, gravar) {
  const p = path.join(CONTEUDO, arquivoIndice);
  let texto = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : `---\ntitle: "${titulo}"\naliases: []\n---\n`;
  const m = texto.match(/^aliases:\s*\[(.*)\]\s*$/m);
  const atuais = m ? m[1].split(",").map(limparValor).filter(Boolean) : [];
  if (atuais.includes(alias)) return;
  atuais.push(alias);
  atuais.sort();
  const linha = `aliases: [${atuais.map((a) => `"${a}"`).join(", ")}]`;
  texto = m ? texto.replace(m[0], linha) : texto.replace(/^---\n/, `---\n${linha}\n`);
  console.log(`alias ${alias} -> ${rel(p)}`);
  if (gravar) {
    const novo = !fs.existsSync(p);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, texto);
    // Página de termo nova: cria também a versão em inglês (o nome da tag é o mesmo) e a carimba.
    const en = p.replace(/\.md$/, ".en.md");
    if (novo && !fs.existsSync(en)) {
      fs.writeFileSync(en, `---\ntitle: "${titulo}"\n---\n`);
      execFileSync(process.execPath, [path.join(RAIZ, "scripts", "i18n.mjs"), "ok", p], { stdio: "inherit" });
    }
  }
}

// ---------- comandos ----------
function validarArquivo(arquivo, reg) {
  const fm = lerFrontMatter(arquivo);
  if (!fm) return [];
  const problemas = [];
  const ehPost = rel(arquivo).startsWith(path.join("content", "posts") + path.sep);
  const tags = fm.tags || [];
  if (ehPost || tags.length) {
    const { max_tags_por_post: max = 5, min_tags_por_post: min = 1 } = reg.regras;
    if (tags.length < min || tags.length > max) problemas.push(`${tags.length} tags (permitido: ${min} a ${max})`);
    const vistos = new Set();
    for (const t of tags) {
      if (vistos.has(t)) problemas.push(`tag repetida "${t}"`);
      vistos.add(t);
      if (!SLUG_OK.test(t)) problemas.push(`tag "${t}" fora do padrão de slug; sugestão: "${slugificar(t)}"`);
      else if (reg.sinonimos[t]) problemas.push(`tag "${t}" é sinônimo: ${t} -> ${reg.sinonimos[t]} (make fix-tags)`);
      else if (reg.regras.proibidas.includes(t)) problemas.push(`tag "${t}" é proibida (já é categoria)`);
      else if (!reg.tags[t]) problemas.push(`tag "${t}" nova; use uma existente ou registre com make new-tag NAME=${t} DESC="..."`);
    }
  }
  for (const c of fm.categories || [])
    if (!reg.categorias.includes(c)) problemas.push(`categoria "${c}" fora da lista de data/taxonomia.yaml`);
  return problemas;
}

function cmdCheck(args) {
  const reg = lerRegistro();
  // Mesmo escopo nos dois modos: _index.md (seções e termos) não tem tags.
  const arquivos = args.length
    ? args.filter((f) => f.startsWith("content/") && f.endsWith(".md") && !path.basename(f).startsWith("_index")).map((f) => path.join(RAIZ, f))
    : arquivosMd(CONTEUDO);
  let total = 0;
  for (const f of arquivos) {
    if (!fs.existsSync(f)) continue;
    for (const p of validarArquivo(f, reg)) { console.error(`✗ ${rel(f)}: ${p}`); total++; }
  }
  if (total) { console.error(`\ncheck-tags: ${total} problema(s) em ${arquivos.length} arquivo(s).`); process.exit(1); }
  console.log(`check-tags: OK (${arquivos.length} arquivo(s)).`);
}

function cmdFix(args) {
  const reg = lerRegistro();
  const gravar = args.includes("--write");
  const iSlug = args.indexOf("--slug");
  let arquivos = arquivosMd(CONTEUDO);
  if (iSlug >= 0) arquivos = arquivos.filter((f) => path.basename(path.dirname(f)) === args[iSlug + 1]);
  let mudou = 0;
  for (const f of arquivos) {
    const fm = lerFrontMatter(f);
    if (!fm || !fm.tags) continue;
    const novas = [...new Set(fm.tags.map((t) => reg.sinonimos[slugificar(t)] || slugificar(t)))].filter(Boolean);
    if (JSON.stringify(novas) === JSON.stringify(fm.tags)) continue;
    const depois = trocarChave(fm, "tags", novas);
    diffSimples(f, fm.texto, depois);
    if (gravar) fs.writeFileSync(f, depois);
    mudou++;
  }
  console.log(mudou ? (gravar ? `fix-tags: ${mudou} arquivo(s) corrigido(s).` : `fix-tags: simulação; ${mudou} arquivo(s). Para gravar: CONFIRM=sim`) : "fix-tags: nada a corrigir.");
}

function cmdNew(args) {
  const [nome, desc] = args;
  if (!nome || !desc) erro('uso: make new-tag NAME=<slug> DESC="descrição curta"');
  if (!SLUG_OK.test(nome)) erro(`"${nome}" não é um slug válido; sugestão: "${slugificar(nome)}"`);
  if (/#/.test(desc)) erro("a descrição não pode conter #");
  const reg = lerRegistro();
  if (reg.tags[nome]) erro(`a tag "${nome}" já existe`);
  if (reg.sinonimos[nome]) erro(`"${nome}" é sinônimo de "${reg.sinonimos[nome]}"; use a oficial`);
  if (reg.regras.proibidas.includes(nome)) erro(`"${nome}" é proibida (já é categoria; ver regras.proibidas)`);
  const parecidas = Object.keys(reg.tags).filter((t) => levenshtein(t, nome) <= 2 || t.includes(nome) || nome.includes(t));
  if (parecidas.length && !args.includes("--force")) erro(`parecida com: ${parecidas.join(", ")}. Se for mesmo nova: FORCE=1`);
  reg.tags[nome] = desc;
  gravarRegistro(reg);
  console.log(`new-tag: "${nome}" registrada em ${rel(REGISTRO)}.`);
}

function cmdMerge(args) {
  const [de, para] = args;
  const gravar = args.includes("--write");
  if (!de || !para) erro("uso: make merge-tag FROM=<antiga> TO=<nova>");
  const reg = lerRegistro();
  if (!reg.tags[para]) erro(`a tag de destino "${para}" não está registrada`);
  for (const f of arquivosMd(CONTEUDO)) {
    const fm = lerFrontMatter(f);
    if (!fm?.tags?.includes(de)) continue;
    const novas = [...new Set(fm.tags.map((t) => (t === de ? para : t)))];
    const depois = trocarChave(fm, "tags", novas);
    diffSimples(f, fm.texto, depois);
    if (gravar) fs.writeFileSync(f, depois);
  }
  adicionarAlias(path.join("tags", para, "_index.md"), para, `/tag/${de}/`, gravar);
  if (gravar) {
    delete reg.tags[de];
    reg.sinonimos[de] = para;
    gravarRegistro(reg);
    console.log(`merge-tag: ${de} -> ${para} gravado.`);
  } else console.log("merge-tag: simulação. Para gravar: CONFIRM=sim");
}

function cmdRemove(args) {
  const nome = args.find((a) => !a.startsWith("--"));
  const gravar = args.includes("--write");
  if (!nome) erro("uso: make rm-tag NAME=<tag> [CONFIRM=sim]");
  const reg = lerRegistro();
  if (!reg.tags[nome]) erro(`a tag "${nome}" não está registrada`);
  let n = 0;
  for (const f of arquivosMd(CONTEUDO)) {
    const fm = lerFrontMatter(f);
    if (!fm?.tags?.includes(nome)) continue;
    const depois = trocarChave(fm, "tags", fm.tags.filter((t) => t !== nome));
    diffSimples(f, fm.texto, depois);
    if (gravar) fs.writeFileSync(f, depois);
    n++;
  }
  // a URL antiga da tag passa a redirecionar para o índice de tags
  adicionarAlias(path.join("tags", "_index.md"), "Tags", `/tag/${nome}/`, gravar);
  // aliases que apontavam para esta tag (ex.: sinônimos unidos) passam a ir para /tags/
  const indice = path.join(CONTEUDO, "tags", nome, "_index.md");
  if (fs.existsSync(indice)) {
    const m = fs.readFileSync(indice, "utf8").match(/^aliases:\s*\[(.*)\]\s*$/m);
    for (const al of m ? m[1].split(",").map(limparValor).filter(Boolean) : [])
      adicionarAlias(path.join("tags", "_index.md"), "Tags", al, gravar);
    console.log(`remove ${rel(indice)}`);
    if (gravar) fs.rmSync(path.dirname(indice), { recursive: true });
  }
  if (gravar) {
    delete reg.tags[nome];
    for (const [de, para] of Object.entries(reg.sinonimos)) if (para === nome) delete reg.sinonimos[de];
    gravarRegistro(reg);
    console.log(`rm-tag: "${nome}" removida de ${n} arquivo(s) e do registro; /tag/${nome}/ -> /tags/.`);
  } else console.log(`rm-tag: simulação (${n} arquivo(s)). Para gravar: CONFIRM=sim`);
}

// Traduções (index.en.md) têm as mesmas tags do original: contam uma vez só (scripts/i18n.mjs).
const soOriginais = (lista) => lista.filter((f) => !f.endsWith(".en.md"));

function contagens() {
  const cont = {}, ultimo = {};
  for (const f of soOriginais(arquivosMd(path.join(CONTEUDO, "posts")))) {
    const fm = lerFrontMatter(f);
    if (!fm || fm.draft) continue;
    for (const t of fm.tags || []) {
      cont[t] = (cont[t] || 0) + 1;
      if (!ultimo[t] || (fm.date && fm.date > ultimo[t])) ultimo[t] = fm.date;
    }
  }
  return { cont, ultimo };
}

function cmdReport() {
  const reg = lerRegistro();
  const { cont, ultimo } = contagens();
  const seisMeses = new Date(Date.now() - 182 * 864e5).toISOString().slice(0, 10);
  const todas = [...new Set([...Object.keys(reg.tags), ...Object.keys(cont)])].sort((a, b) => (cont[b] || 0) - (cont[a] || 0) || a.localeCompare(b));
  const l = [`# Relatório de tags`, ``, `Gerado em ${new Date().toISOString().slice(0, 10)} por \`make tags-report\`. Só posts publicados.`, ``,
    `## Tags por número de posts`, ``, `| Tag | Posts | Situação |`, `|---|---|---|`];
  for (const t of todas) {
    const n = cont[t] || 0;
    let sit = "";
    if (!reg.tags[t]) sit = "❌ fora do registro";
    else if (reg.sinonimos[t]) sit = "❌ sinônimo em uso";
    else if (n === 0) sit = "⚠️ sem posts: candidata a remover";
    else if (n === 1 && ultimo[t] && ultimo[t].slice(0, 10) < seisMeses) sit = "⚠️ 1 post há mais de 6 meses: candidata a unir";
    l.push(`| ${t} | ${n} | ${sit} |`);
  }
  fs.mkdirSync(path.join(RAIZ, "reports"), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, "reports", "tags.md"), l.join("\n") + "\n");
  console.log(`tags-report: reports/tags.md (${todas.length} tags).`);
}

// Fase 3 (uma vez): aplica PLANS/blog-migration/tags/tags-map.yaml aos posts convertidos.
function lerMapa(arquivo) {
  const mapa = { unir: {}, remover_duplicam_categoria: [], remover_genericas: [], remover_sem_posts: [], revisar_na_fase_4: [] };
  let atual = null;
  for (const bruta of fs.readFileSync(arquivo, "utf8").split("\n")) {
    const l = semComentario(bruta);
    if (!l.trim()) continue;
    let m;
    if ((m = l.match(/^([a-z0-9_]+):\s*$/))) atual = m[1];
    // seções fora das conhecidas (ex.: resultado esperado) são ignoradas
    else if ((m = l.match(/^ {2}([a-z0-9-]+):\s*([a-z0-9-]+)$/)) && atual && mapa[atual] && !Array.isArray(mapa[atual])) mapa[atual][m[1]] = m[2];
    else if ((m = l.match(/^ {2}- ([a-z0-9-]+)$/)) && atual && Array.isArray(mapa[atual])) mapa[atual].push(m[1]);
  }
  return mapa;
}

function cmdNormalize(args) {
  const arquivoMapa = args.find((a) => !a.startsWith("--"));
  if (!arquivoMapa || !fs.existsSync(arquivoMapa)) erro("uso: node scripts/tags.mjs normalize <tags-map.yaml> [--write]");
  const gravar = args.includes("--write");
  const mapa = lerMapa(arquivoMapa);
  const remover = new Set([...mapa.remover_duplicam_categoria, ...mapa.remover_genericas, ...mapa.remover_sem_posts]);
  for (const f of arquivosMd(path.join(CONTEUDO, "posts"))) {
    const fm = lerFrontMatter(f);
    if (!fm?.tags) continue;
    const novas = [...new Set(fm.tags.map(slugificar).map((t) => mapa.unir[t] || t).filter((t) => !remover.has(t)))];
    if (JSON.stringify(novas) === JSON.stringify(fm.tags)) continue;
    const depois = trocarChave(fm, "tags", novas);
    diffSimples(f, fm.texto, depois);
    if (gravar) fs.writeFileSync(f, depois);
  }
  for (const [de, para] of Object.entries(mapa.unir)) adicionarAlias(path.join("tags", para, "_index.md"), para, `/tag/${de}/`, gravar);
  for (const t of mapa.remover_duplicam_categoria) adicionarAlias(path.join("categories", t === "tutorial" || t === "tutoriais-2" ? "tutoriais" : t, "_index.md"), t, `/tag/${t}/`, gravar);
  for (const t of [...mapa.remover_genericas, ...mapa.remover_sem_posts]) adicionarAlias(path.join("tags", "_index.md"), "Tags", `/tag/${t}/`, gravar);
  if (gravar) {
    const reg = lerRegistro();
    for (const [de, para] of Object.entries(mapa.unir)) reg.sinonimos[de] = para;
    gravarRegistro(reg);
  }
  console.log(gravar ? "normalize: aplicado. Rode `node scripts/tags.mjs init --write` e revise as tags marcadas para a Fase 4." : "normalize: simulação. Para gravar: --write");
  console.log(`Revisar na Fase 4: ${mapa.revisar_na_fase_4.join(", ")}`);
}

function cmdInit(args) {
  const reg = lerRegistro();
  const { cont } = contagens();
  const novas = Object.keys(cont).filter((t) => !reg.tags[t] && !reg.sinonimos[t] && !reg.regras.proibidas.includes(t)).sort();
  for (const t of novas) reg.tags[t] = `TODO descrever (${cont[t]} post${cont[t] > 1 ? "s" : ""})`;
  console.log(`init: ${novas.length} tag(s) em uso fora do registro: ${novas.join(", ") || "-"}`);
  if (args.includes("--write")) { gravarRegistro(reg); console.log(`gravado em ${rel(REGISTRO)}`); }
}

const [cmd, ...args] = process.argv.slice(2);
const comandos = { check: cmdCheck, fix: cmdFix, new: cmdNew, merge: cmdMerge, remove: cmdRemove, report: cmdReport, normalize: cmdNormalize, init: cmdInit };
if (!comandos[cmd]) erro(`comando desconhecido "${cmd ?? ""}". Use: ${Object.keys(comandos).join(", ")}`);
comandos[cmd](args);

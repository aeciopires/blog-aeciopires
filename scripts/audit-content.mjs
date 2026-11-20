#!/usr/bin/env node
// make audit-content [SLUG=…] (PLAN.md 9.3.2). Não acessa a internet: só EXTRAI e ORGANIZA
// o que precisa ser conferido contra fontes oficiais pela skill revisar-conteudo.
// Saída: reports/content-audit.md e reports/content-audit.json.
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const POSTS = path.join(RAIZ, "content", "posts");
const slugFiltro = process.argv[2] || "";

// apiVersion removidas do Kubernetes (guia oficial: https://kubernetes.io/docs/reference/using-api/deprecation-guide/)
const APIS_REMOVIDAS = {
  "extensions/v1beta1": "1.16/1.22", "apps/v1beta1": "1.16", "apps/v1beta2": "1.16",
  "networking.k8s.io/v1beta1": "1.22", "rbac.authorization.k8s.io/v1beta1": "1.22",
  "apiextensions.k8s.io/v1beta1": "1.22", "admissionregistration.k8s.io/v1beta1": "1.22",
  "policy/v1beta1": "1.25", "batch/v1beta1": "1.25", "autoscaling/v2beta1": "1.25",
  "autoscaling/v2beta2": "1.26", "flowcontrol.apiserver.k8s.io/v1beta2": "1.29",
  "storage.k8s.io/v1beta1": "1.22/1.27", "discovery.k8s.io/v1beta1": "1.25",
};

const PADROES = [
  ["imagem", /\b(?:image:\s*|FROM\s+|docker (?:run|pull)[^\n]*?\s)([a-z0-9./_-]+:[A-Za-z0-9._-]+)/g],
  ["helm --version", /helm\s+(?:install|upgrade)[^\n]*--version[ =]([0-9][\w.-]*)/g],
  ["go", /\bgo\s?(1\.\d+(?:\.\d+)?)\b/gi],
  ["python", /\bpython\s?(3\.\d+(?:\.\d+)?)\b/gi],
  ["--version citada", /^(?:\$\s*)?([a-z][\w-]+)\s+(?:--version|version)\s*$/gm],
  ["versão vX.Y.Z", /\b(v\d+\.\d+\.\d+)\b/g],
];

function arquivos(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? arquivos(p) : e.name === "index.md" ? [p] : [];
  });
}

const fmValor = (fm, k) => (fm.match(new RegExp(`^${k}:\\s*["']?([^"'\\n]*)`, "m")) || [])[1] || "";
const hoje = new Date();
const resultado = [];

for (const f of arquivos(POSTS).sort()) {
  const slug = path.basename(path.dirname(f));
  if (slugFiltro && slug !== slugFiltro) continue;
  const texto = fs.readFileSync(f, "utf8");
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
  const fm = m ? m[1] : "";
  const corpo = m ? texto.slice(m[0].length) : texto;
  const data = fmValor(fm, "date"), lastmod = fmValor(fm, "lastmod");
  const ref = new Date(lastmod || data);
  const idadeAnos = isNaN(ref) ? null : +((hoje - ref) / (365.25 * 864e5)).toFixed(1);
  const item = {
    slug, arquivo: path.relative(RAIZ, f), titulo: fmValor(fm, "title"), data, lastmod, idadeAnos,
    semLastmodMaisDe2Anos: !lastmod && idadeAnos !== null && idadeAnos > 2,
    versoes: [], apisRemovidas: [], links: [],
  };
  for (const [tipo, re] of PADROES)
    for (const x of corpo.matchAll(re)) item.versoes.push({ tipo, valor: x[1], trecho: x[0].trim().slice(0, 120) });
  for (const x of corpo.matchAll(/apiVersion:\s*([\w./-]+)/g))
    if (APIS_REMOVIDAS[x[1]]) item.apisRemovidas.push({ apiVersion: x[1], removidaEm: APIS_REMOVIDAS[x[1]] });
  for (const x of corpo.matchAll(/https?:\/\/[^\s)"'<>\]]+/g)) item.links.push(x[0]);
  item.links = [...new Set(item.links)];
  item.versoes = item.versoes.filter((v, i, a) => a.findIndex((w) => w.trecho === v.trecho) === i);
  resultado.push(item);
}

fs.mkdirSync(path.join(RAIZ, "reports"), { recursive: true });
fs.writeFileSync(path.join(RAIZ, "reports", "content-audit.json"), JSON.stringify(resultado, null, 2));
const md = [`# Auditoria de conteúdo`, ``, `Gerado em ${hoje.toISOString().slice(0, 10)} por \`make audit-content\`${slugFiltro ? ` (SLUG=${slugFiltro})` : ""}.`,
  `Itens a conferir **contra fontes oficiais** (skill revisar-conteudo). Nada aqui é veredito.`, ``];
for (const r of resultado.sort((a, b) => (b.idadeAnos ?? 0) - (a.idadeAnos ?? 0))) {
  md.push(`## ${r.titulo || r.slug}`, ``, `- Arquivo: \`${r.arquivo}\` · data ${r.data || "?"} · lastmod ${r.lastmod || "—"} · idade ${r.idadeAnos ?? "?"} anos${r.semLastmodMaisDe2Anos ? " · ⚠️ mais de 2 anos sem lastmod" : ""}`);
  if (r.apisRemovidas.length) md.push(`- ❌ apiVersion removidas: ${r.apisRemovidas.map((a) => `\`${a.apiVersion}\` (removida em ${a.removidaEm})`).join(", ")}`);
  if (r.versoes.length) { md.push(`- Versões citadas:`); for (const v of r.versoes) md.push(`  - ${v.tipo}: \`${v.valor}\` — \`${v.trecho.replace(/`/g, "'")}\``); }
  if (r.links.length) md.push(`- Links externos (${r.links.length}): ${r.links.slice(0, 15).join(" · ")}${r.links.length > 15 ? " …" : ""}`);
  md.push("");
}
fs.writeFileSync(path.join(RAIZ, "reports", "content-audit.md"), md.join("\n"));
console.log(`audit-content: ${resultado.length} post(s) → reports/content-audit.md e .json`);

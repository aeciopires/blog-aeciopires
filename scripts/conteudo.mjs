#!/usr/bin/env node
// Auxiliares para revisar e escrever posts (skills revisar-conteudo e escrever-post).
//
//   node scripts/conteudo.mjs aviso <slug> "<resumo>"   aviso "Atualizado em DD/MM/AAAA" + lastmod
//   node scripts/conteudo.mjs prosa <slug>...           texto corrido, para revisão gramatical
//   node scripts/conteudo.mjs verificar [<slug>...]     restos da migração e erros recorrentes
//
// Sem slug, "verificar" percorre todos os posts. Datas no fuso America/Recife (-03:00).
// Alvos do Makefile: aviso-atualizacao, prosa, verificar-texto.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";

const DIR = "content/posts";
const [, , comando, ...args] = process.argv;

function arquivo(slug) {
  const p = `${DIR}/${slug}/index.md`;
  if (!existsSync(p)) {
    console.error(`post não encontrado: ${p}`);
    process.exit(2);
  }
  return p;
}

function partes(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error("front matter não encontrado");
  return { fm: m[1], corpo: m[2] };
}

// Data e hora atuais em America/Recife, no formato do front matter.
function agora() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Recife", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return { iso: `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}-03:00`, br: `${p.day}/${p.month}/${p.year}` };
}

function aviso(slug, resumo) {
  if (!resumo) {
    console.error('uso: aviso <slug> "<resumo do que mudou>"');
    process.exit(2);
  }
  const p = arquivo(slug);
  const { fm, corpo } = partes(readFileSync(p, "utf8"));
  const { iso, br } = agora();
  const novoFm = /^lastmod:/m.test(fm) ? fm.replace(/^lastmod:.*$/m, `lastmod: ${iso}`) : fm.replace(/^(date:.*)$/m, `$1\nlastmod: ${iso}`);
  const bloco = `{{< alert icon="circle-info" >}}\n**Atualizado em ${br}:** ${resumo}\n{{< /alert >}}`;
  let novoCorpo;
  const existente = /\{\{< alert icon="circle-info" >\}\}\n\*\*Atualizado em \d{2}\/\d{2}\/\d{4}:\*\*[^\n]*\n\{\{< \/alert >\}\}/;
  const antigo = /\n\*\*Atualizado em:? ?[^*\n]+\*\*[ \t ]*\n/;
  if (existente.test(corpo)) novoCorpo = corpo.replace(existente, bloco);
  else if (antigo.test(corpo)) novoCorpo = corpo.replace(antigo, `\n${bloco}\n`);
  else novoCorpo = `\n${bloco}\n\n${corpo.replace(/^\n+/, "")}`;
  writeFileSync(p, `---\n${novoFm}\n---\n${novoCorpo}`);
  console.log(`aviso aplicado em ${p} (lastmod ${iso})`);
}

function prosa(slugs) {
  for (const slug of slugs) {
    const { corpo } = partes(readFileSync(arquivo(slug), "utf8"));
    console.log(`##### ${slug}`);
    let codigo = false;
    for (const linha of corpo.split("\n")) {
      const s = linha.trim();
      if (s.startsWith("```")) { codigo = !codigo; continue; }
      if (codigo || !s || s.startsWith("{{<") || s.startsWith("|")) continue;
      if (/^[-*] \[[^\]]+\]\([^)]+\)( \(cópia arquivada\))?$/.test(s)) continue;
      console.log(s.replace(/\]\([^)]+\)/g, "]"));
    }
  }
}

// [regex, descrição] aplicados fora dos blocos de código (exceto os marcados com "codigo").
const REGRAS = [
  [/\]\(<https?:/, "link com <...> dentro dos parênteses (resto da migração)"],
  [/\[[^\]]*[,.;:]\]\(/, "pontuação dentro do texto do link (ex.: [Docker,](...)): mova para fora"],
  [/^\*\*\s*$/, "marcador de negrito solto (resto da migração)"],
  [/\*\*Atualizado em:? ?\d{1,2} de /, "aviso de atualização no formato antigo: use make aviso-atualizacao"],
  [/código fonte/i, '"código fonte" → "código-fonte"'],
  [/on-premisse/i, '"on-premisse" → "on-premises"'],
  [/\ba cerca d[aeo]s?\b/i, 'confira: "acerca de" = sobre; "a cerca de" = aproximadamente'],
  [/auto-assinad/i, '"auto-assinado" → "autoassinado"'],
  [/recém criad/i, '"recém criado" → "recém-criado"'],
  [/ao invés d/i, '"ao invés de" (oposição) → normalmente "em vez de"'],
  [/^Mais informações sobre .* e como configurá-l[oa],? acesse/i, 'frase sem sujeito: "Para mais informações sobre X e sobre como configurá-lo, acesse"'],
  [/\b(Github|Gitlab|Wordpress|MacOS|Macos)\b/, "nome próprio: GitHub, GitLab, WordPress, macOS"],
  [/<\/?(div|span|p|br|img|iframe)\b/i, "HTML cru é omitido (unsafe = false): use shortcode"],
];
const REGRAS_CODIGO = [
  [/--address="<https?:/, "URL com <...> num comando (resto da migração)"],
];

function verificar(slugs) {
  const lista = slugs.length ? slugs : readdirSync(DIR).filter((d) => existsSync(`${DIR}/${d}/index.md`));
  let total = 0;
  for (const slug of lista) {
    const { corpo } = partes(readFileSync(arquivo(slug), "utf8"));
    // NBSP (comum nos posts migrados): não é erro de exibição, mas faz buscas e substituições
    // exatas falharem. Avisa uma vez por post, para lembrar de considerá-lo ao editar.
    const nbsp = (corpo.match(/ /g) || []).length;
    if (nbsp) console.log(`${slug}: ${nbsp} espaço(s) não separável(eis) (NBSP); em substituições, aceite \\u00a0`);
    let codigo = false;
    let heredocSemAspas = false;
    let mermaid = false;
    corpo.split("\n").forEach((linha, i) => {
      const s = linha.trim();
      if (s.startsWith("```")) { codigo = !codigo; heredocSemAspas = false; return; }
      if (/^\{\{<\s*mermaid/.test(s)) { mermaid = true; return; }
      if (/^\{\{<\s*\/mermaid/.test(s)) { mermaid = false; return; }
      if (mermaid) return;
      const regras = codigo ? REGRAS_CODIGO : REGRAS;
      if (codigo && /<<\s*EOF\b/.test(s)) heredocSemAspas = true;
      if (codigo && heredocSemAspas && /\{\{[^}]*\$[a-z]/i.test(s)) {
        console.log(`${slug}: heredoc sem aspas com $variável de template: use <<'EOF'`);
        total++;
      }
      for (const [re, msg] of regras) {
        const m = linha.match(re);
        if (m) {
          const trecho = linha.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20).trim();
          console.log(`${slug}: ${msg}\n    … ${trecho} …`);
          total++;
        }
      }
    });
  }
  console.log(total ? `\n${total} ponto(s) para conferir (nem todos são erro; revise cada um).` : "verificar-texto: nada encontrado");
}

if (comando === "aviso") aviso(args[0], args.slice(1).join(" "));
else if (comando === "prosa") prosa(args);
else if (comando === "verificar") verificar(args);
else {
  console.error("uso: conteudo.mjs aviso <slug> \"<resumo>\" | prosa <slug>... | verificar [<slug>...]");
  process.exit(2);
}

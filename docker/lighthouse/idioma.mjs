// make test-idioma (docs/MAINTENANCE.md, "Redirecionamento pelo idioma do navegador"). Roda DENTRO do container
// blog-lighthouse: serve o build de produção montado em /site com a CSP OFICIAL (variável CSP, lida de
// docs/cloudflare.md, seção 5, por scripts/test-idioma.sh) e testa num Chromium o redirecionamento pelo idioma
// do navegador, o seletor de idioma e a escolha lembrada, falhando em qualquer violação da CSP.
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { createRequire } from "node:module";
const require = createRequire("/usr/local/lib/node_modules/lighthouse/package.json");
const puppeteer = require("puppeteer-core");
const CSP = process.env.CSP || "";
if (!CSP) { console.error("CSP vazia: rode via make test-idioma"); process.exit(2); }
const T = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".xml": "application/xml" };
const srv = http.createServer((q, r) => {
  let f = join("/site", decodeURIComponent(q.url.split("?")[0]));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
  if (!existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": T[extname(f)] || "application/octet-stream", "Content-Security-Policy": CSP });
  createReadStream(f).pipe(r);
});
await new Promise((ok) => srv.listen(8080, "127.0.0.1", ok));
const b = await puppeteer.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--headless=new"] });
const UA_NORMAL = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const UA_GOOGLE = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const UA_LH = "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse";
let falhas = 0;

async function pagina(idiomas, ua) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setUserAgent(ua);
  await p.evaluateOnNewDocument((l) => {
    Object.defineProperty(navigator, "languages", { get: () => l });
    Object.defineProperty(navigator, "language", { get: () => l[0] });
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  }, idiomas);
  const erros = [];
  p.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  p.on("pageerror", (e) => erros.push(String(e)));
  return { ctx, p, erros };
}
async function ir(p, url) {
  await p.goto(`http://127.0.0.1:8080${url}`, { waitUntil: "networkidle0" }).catch(() => {});
  await new Promise((r) => setTimeout(r, 300));
  return new URL(p.url()).pathname;
}
function confere(nome, obtido, esperado, erros) {
  const csp = erros.filter((e) => /Content Security Policy|Refused to/i.test(e));
  const ok = obtido === esperado && csp.length === 0;
  if (!ok) falhas++;
  console.log(`${ok ? "OK  " : "FALHA"} ${nome}: ${obtido} (esperado ${esperado})${csp.length ? ` CSP: ${csp.join(" | ")}` : ""}`);
}

const casos = [
  ["navegador en-US abre /", ["en-US", "en"], UA_NORMAL, "/", "/en/"],
  ["navegador pt-BR abre /", ["pt-BR", "pt"], UA_NORMAL, "/", "/"],
  ["navegador pt-PT abre /en/", ["pt-PT"], UA_NORMAL, "/en/", "/"],
  ["navegador es abre / (sem tradução: fica no padrão)", ["es-ES", "es"], UA_NORMAL, "/", "/"],
  ["navegador en-US abre post pt (só a home redireciona)", ["en-US"], UA_NORMAL, "/instalando-o-go/", "/instalando-o-go/"],
  ["Googlebot en-US abre / (robô não redireciona)", ["en-US"], UA_GOOGLE, "/", "/"],
  ["Lighthouse en-US abre / (não redireciona)", ["en-US"], UA_LH, "/", "/"],
];
for (const [nome, idiomas, ua, url, esperado] of casos) {
  const { ctx, p, erros } = await pagina(idiomas, ua);
  confere(nome, await ir(p, url), esperado, erros);
  await ctx.close();
}

// Escolha manual no seletor vence o idioma do navegador e vale nas outras páginas.
{
  const { ctx, p, erros } = await pagina(["en-US"], UA_NORMAL);
  confere("en-US abre / → /en/", await ir(p, "/"), "/en/", erros);
  await p.evaluate(() => { const a = [...document.querySelectorAll(".translation a[href]")].find((x) => x.getAttribute("href") === "/"); if (a) a.click(); });
  await new Promise((r) => setTimeout(r, 1500));
  confere("clicou Português no seletor", new URL(p.url()).pathname, "/", erros);
  confere("volta à / depois da escolha (fica em pt)", await ir(p, "/"), "/", erros);
  confere("abre /en/instalando-o-go/ com escolha pt (vai para pt)", await ir(p, "/en/instalando-o-go/"), "/instalando-o-go/", erros);
  const seletor = await p.$$eval(".translation a", (as) => as.map((a) => a.textContent.trim()));
  console.log(`${seletor.length >= 2 ? "OK  " : "FALHA"} seletor de idioma presente: ${seletor.join(", ")}`);
  if (seletor.length < 2) falhas++;
  await ctx.close();
}
await b.close();
srv.close();
console.log(falhas ? `\n${falhas} falha(s)` : "\ntodos os cenários OK");
process.exitCode = falhas ? 1 : 0;

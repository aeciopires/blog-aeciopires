// Roda DENTRO do container blog-lighthouse (make lighthouse-local; docs/MAINTENANCE.md, seção 4).
// Serve o build de produção montado em /site (somente leitura) num servidor HTTP mínimo, com gzip e
// cache longo para arquivos com hash, como o Cloudflare faz no site publicado, e roda o Lighthouse
// em cada caminho recebido nos perfis celular e computador. Relatórios em /out.
// Uso: node local.mjs /caminho1/ /en/caminho2/ ...
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";

const RAIZ = "/site";
const PORTA = 8080;
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json",
};
const COMPRIMIR = /^(text\/|application\/(json|xml|manifest)|image\/svg)/;

function arquivoDe(url) {
  const caminho = normalize(decodeURIComponent(url.split(/[?#]/)[0])).replace(/^(\.\.[/\\])+/, "");
  let f = join(RAIZ, caminho);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
  return f.startsWith(RAIZ) && existsSync(f) ? f : null;
}

const servidor = http.createServer((req, res) => {
  const f = arquivoDe(req.url);
  const alvo = f || join(RAIZ, "404.html");
  const tipo = TIPOS[extname(alvo).toLowerCase()] || "application/octet-stream";
  const comHash = /\.[0-9a-f]{16,}\./.test(alvo) || /_hu_[0-9a-f]+/.test(alvo);
  const cabecalhos = {
    "Content-Type": tipo,
    "Cache-Control": comHash ? "public, max-age=31536000, immutable" : "public, max-age=600",
  };
  let corpo = createReadStream(alvo);
  if (COMPRIMIR.test(tipo) && /gzip/.test(req.headers["accept-encoding"] || "")) {
    cabecalhos["Content-Encoding"] = "gzip";
    corpo = corpo.pipe(createGzip({ level: 9 }));
  }
  res.writeHead(f ? 200 : 404, cabecalhos);
  corpo.pipe(res);
});

function lighthouse(url, saida, perfil) {
  const args = [url, "--output=json", "--output=html", `--output-path=${saida}`, "--quiet",
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu"];
  if (perfil === "desktop") args.push("--preset=desktop");
  return new Promise((ok, falha) => {
    const p = spawn("lighthouse", args, { stdio: "inherit" });
    p.on("exit", (c) => (c === 0 ? ok() : falha(new Error(`lighthouse saiu com ${c} (${url})`))));
  });
}

servidor.listen(PORTA, "127.0.0.1", async () => {
  try {
    for (const caminho of process.argv.slice(2)) {
      const nome = `local${caminho.replace(/[^A-Za-z0-9]+/g, "-").replace(/-+$/, "") || "-home"}`;
      for (const perfil of ["mobile", "desktop"]) {
        console.log(`== ${perfil}: ${caminho}`);
        await lighthouse(`http://localhost:${PORTA}${caminho}`, `/out/${nome}-${perfil}`, perfil);
      }
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    servidor.close();
  }
});

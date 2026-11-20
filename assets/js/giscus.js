// giscus (PLAN.md 6.6): cria o script do giscus a partir dos data-* do contêiner
// (sem JS inline, compatível com a CSP) e acompanha o modo claro/escuro do Blowfish,
// observando a classe "dark" do <html> e enviando setConfig ao iframe.
(function () {
  "use strict";
  var container = document.getElementById("giscus-container");
  if (!container) return;

  var ORIGEM = "https://giscus.app";
  var d = container.dataset;

  function temaAtual() {
    return document.documentElement.classList.contains("dark") ? d.themeDark : d.themeLight;
  }

  var s = document.createElement("script");
  s.src = ORIGEM + "/client.js";
  s.async = true;
  s.crossOrigin = "anonymous";
  var attrs = {
    "data-repo": d.repo,
    "data-repo-id": d.repoId,
    "data-category": d.category,
    "data-category-id": d.categoryId,
    "data-mapping": "pathname",
    "data-strict": "1",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "0",
    "data-input-position": "top",
    "data-theme": temaAtual(),
    "data-lang": "pt",
    "data-loading": "lazy"
  };
  Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
  container.appendChild(s);

  function enviarTema() {
    var iframe = document.querySelector("iframe.giscus-frame");
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: temaAtual() } } }, ORIGEM);
  }

  new MutationObserver(enviarTema).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });
})();

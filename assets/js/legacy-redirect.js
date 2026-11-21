// Redirecionamentos de URLs antigas do WordPress que dependem da query string (PLAN.md 7.2),
// carregado só na home:
//   /?p=1234  -> /<slug>/   (mapa wp_id -> URL gerado pelo Hugo no atributo data-map)
//   /?s=termo -> abre a busca do Blowfish com o termo
(function () {
  "use strict";
  var params = new URLSearchParams(window.location.search);
  var self = document.currentScript;

  var id = params.get("p") || params.get("page_id");
  if (id && /^[0-9]+$/.test(id) && self) {
    try {
      var mapa = JSON.parse(self.getAttribute("data-map") || "{}");
      var destino = Object.prototype.hasOwnProperty.call(mapa, id) ? String(mapa[id]) : "";
      // Só caminhos do próprio site ("/slug/"): nunca outro domínio nem "javascript:".
      if (/^\/(?![\/\\])[^\s"'<>`\\]*$/.test(destino)) {
        window.location.replace(destino);
        return;
      }
    } catch (e) { /* mapa inválido: segue na home */ }
  }

  var termo = params.get("s");
  if (!termo) return;
  window.addEventListener("load", function () {
    var botao = document.getElementById("search-button") || document.getElementById("search-button-mobile");
    var input = document.getElementById("search-query");
    if (!botao || !input) return;
    botao.click();
    input.value = termo.slice(0, 100);
    // o índice da busca é carregado na primeira abertura; repete até haver resultados
    var tentativas = 0;
    var timer = setInterval(function () {
      input.dispatchEvent(new KeyboardEvent("keyup"));
      var resultados = document.getElementById("search-results");
      tentativas += 1;
      if ((resultados && resultados.children.length > 0) || tentativas >= 15) clearInterval(timer);
    }, 300);
  });
})();

/*
  Busca mais flexível (estilo Google) sem sobrescrever o search.js do Blowfish.

  O tema cria o índice com `new Fuse(dados, opcoes)` e threshold 0: a consulta só casa
  como frase exata, na ordem digitada ("helm kubernetes" não achava nada). Este script
  roda depois do bundle do tema (ambos com defer) e envolve window.Fuse para acrescentar:
    - useTokenSearch + tokenMatch "all": cada palavra é buscada separadamente, em qualquer
      ordem, e todas precisam aparecer; o ranking pondera os termos mais raros (Fuse.js >= 7.5);
    - ignoreDiacritics: "instalacao" acha "instalação";
    - threshold 0.15: tolera um erro de digitação em palavras médias/longas ("kubernets"),
      sem casar palavras curtas parecidas ("istio" com "isto"). Medido no índice do site.
  As demais opções (campos, pesos, ordenação) continuam as do tema.

  Segurança: o search.js do tema monta os resultados com innerHTML, usando título, seção,
  data e resumo do index.json (o termo digitado não entra no HTML). Para que um texto de post
  parecido com HTML (ex.: "<img …>" num tutorial) nunca vire HTML na lista, os resultados
  entregues ao tema são CÓPIAS com escape: a busca continua sobre os dados originais.
  O resumo leva escape duplo porque o tema faz innerHTML → textContent → innerHTML.
  Links só do próprio site (ou http/https em externalUrl); o resto vira "#".
  Se o tema deixar de usar a Fuse ou mudar a versão, o script não quebra: opções
  desconhecidas são ignoradas pela biblioteca. Revisar a cada atualização do Blowfish.
*/
(function () {
  "use strict";

  var FuseDoTema = window.Fuse;
  if (typeof FuseDoTema !== "function" || FuseDoTema.ajustadaPeloBlog) {
    return;
  }

  var AJUSTES = {
    useTokenSearch: true,
    tokenMatch: "all",
    ignoreDiacritics: true,
    threshold: 0.15,
  };

  function escapar(valor) {
    return String(valor == null ? "" : valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Texto puro de um trecho HTML sem executar nada (DOMParser cria um documento inerte).
  function textoPuro(html) {
    try {
      return new DOMParser().parseFromString(String(html || ""), "text/html").body.textContent || "";
    } catch (e) {
      return "";
    }
  }

  function linkInterno(valor) {
    try {
      var url = new URL(String(valor || ""), window.location.origin);
      // Mesmo formato do índice (caminho relativo), só se for do próprio site.
      return url.origin === window.location.origin ? url.pathname + url.search + url.hash : "#";
    } catch (e) {
      return "#";
    }
  }

  function linkExterno(valor) {
    return /^https?:\/\/[^\s"'<>`]+$/i.test(String(valor || "")) ? String(valor) : "";
  }

  function paraExibir(item) {
    var copia = Object.assign({}, item);
    copia.title = escapar(item.title);
    copia.section = escapar(item.section);
    copia.date = escapar(item.date);
    copia.summary = escapar(escapar(textoPuro(item.summary)));
    copia.permalink = escapar(linkInterno(item.permalink));
    copia.externalUrl = escapar(linkExterno(item.externalUrl));
    return copia;
  }

  function FuseDoBlog(dados, opcoes, indice) {
    var fuse = new FuseDoTema(dados, Object.assign({}, opcoes, AJUSTES), indice);
    var buscar = fuse.search;
    fuse.search = function () {
      var resultados = buscar.apply(fuse, arguments) || [];
      return resultados.map(function (r) {
        return Object.assign({}, r, { item: paraExibir(r.item) });
      });
    };
    return fuse;
  }

  // Mantém os métodos e propriedades estáticos (version, createIndex, parseIndex...).
  Object.keys(FuseDoTema).forEach(function (chave) {
    FuseDoBlog[chave] = FuseDoTema[chave];
  });
  FuseDoBlog.prototype = FuseDoTema.prototype;
  FuseDoBlog.ajustadaPeloBlog = true;

  window.Fuse = FuseDoBlog;
})();

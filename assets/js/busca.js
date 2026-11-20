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

  function FuseDoBlog(dados, opcoes, indice) {
    return new FuseDoTema(dados, Object.assign({}, opcoes, AJUSTES), indice);
  }

  // Mantém os métodos e propriedades estáticos (version, createIndex, parseIndex...).
  Object.keys(FuseDoTema).forEach(function (chave) {
    FuseDoBlog[chave] = FuseDoTema[chave];
  });
  FuseDoBlog.prototype = FuseDoTema.prototype;
  FuseDoBlog.ajustadaPeloBlog = true;

  window.Fuse = FuseDoBlog;
})();

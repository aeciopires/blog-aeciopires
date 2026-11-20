/*
  Ordenação dos posts da home (layouts/partials/recent-articles/cardview.html).

  Botões que funcionam como um grupo de opções: só um fica ativo (aria-pressed="true").
  Os cards já vêm no HTML em ordem de data (mais recentes primeiro); este script só os
  reordena e mostra os primeiros N (data-visiveis). Sem JavaScript, nada muda: o grupo de
  botões continua escondido e a home mostra os mais recentes, como no tema.

  A escolha fica salva no navegador do leitor (localStorage), só por conveniência.
*/
(function () {
  "use strict";

  var grupo = document.querySelector("[data-ordenar-home]");
  var lista = document.querySelector("[data-posts-home]");
  if (!grupo || !lista) {
    return;
  }

  var CHAVE = "blog-ordem-home";
  var visiveis = parseInt(lista.getAttribute("data-visiveis"), 10) || 6;
  var itens = Array.prototype.slice.call(lista.querySelectorAll(".ordenar-home__item"));
  var botoes = Array.prototype.slice.call(grupo.querySelectorAll("[data-ordem]"));
  // Título da seção ("Recente", do tema): acompanha a ordem escolhida.
  var titulo = grupo.previousElementSibling && grupo.previousElementSibling.tagName === "H2" ? grupo.previousElementSibling : null;
  var tituloOriginal = titulo ? titulo.textContent : "";

  function numero(item, atributo) {
    return parseInt(item.getAttribute(atributo), 10) || 0;
  }

  var COMPARADORES = {
    recentes: function (a, b) {
      return numero(b, "data-data") - numero(a, "data-data");
    },
    antigos: function (a, b) {
      return numero(a, "data-data") - numero(b, "data-data");
    },
    "mais-lidos": function (a, b) {
      return numero(b, "data-visitas") - numero(a, "data-visitas") || COMPARADORES.recentes(a, b);
    },
    "menos-lidos": function (a, b) {
      return numero(a, "data-visitas") - numero(b, "data-visitas") || COMPARADORES.recentes(a, b);
    },
  };

  function aplicar(ordem) {
    if (!COMPARADORES[ordem] || !grupo.querySelector('[data-ordem="' + ordem + '"]')) {
      ordem = "recentes";
    }
    itens.slice().sort(COMPARADORES[ordem]).forEach(function (item, indice) {
      item.hidden = indice >= visiveis;
      lista.appendChild(item);
    });
    botoes.forEach(function (botao) {
      var ativo = botao.getAttribute("data-ordem") === ordem;
      botao.setAttribute("aria-pressed", String(ativo));
      if (ativo && titulo) {
        titulo.textContent = ordem === "recentes" ? tituloOriginal : botao.textContent;
      }
    });
    return ordem;
  }

  function lerEscolha() {
    try {
      return window.localStorage.getItem(CHAVE);
    } catch (e) {
      return null;
    }
  }

  function salvarEscolha(ordem) {
    try {
      window.localStorage.setItem(CHAVE, ordem);
    } catch (e) {
      /* navegação privada ou armazenamento bloqueado: segue sem salvar */
    }
  }

  botoes.forEach(function (botao) {
    botao.addEventListener("click", function () {
      salvarEscolha(aplicar(botao.getAttribute("data-ordem")));
    });
  });

  aplicar(lerEscolha() || "recentes");
  grupo.hidden = false;
})();

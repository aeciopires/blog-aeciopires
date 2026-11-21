/*
  Ordenação dos posts da home (layouts/partials/recent-articles/cardview.html).

  O HTML traz só os N posts mais recentes (data-visiveis), em cards do tema. Ao escolher outra
  ordem, este script baixa uma única vez o JSON leve (data-json, mesma origem, com fingerprint e
  verificação de integridade) e monta os cards que faltam clonando o molde renderizado pelo tema
  (<template data-card-molde>). Na ordem padrão ("Mais recentes") o JSON não é baixado.

  Regras de segurança (docs/MAINTENANCE.md, seção 8):
  - nada de innerHTML/outerHTML/insertAdjacentHTML: textos entram só por textContent;
  - URLs (post, imagem, categorias/tags) só se forem caminhos do próprio site ("/…", sem "//",
    sem esquema, sem barra invertida nem caracteres de controle); item inválido é descartado;
  - nenhuma origem nova: a CSP atual (connect-src 'self') já cobre o fetch.

  Botões funcionam como um grupo de opções: só um fica ativo (aria-pressed="true").
  Sem JavaScript, nada muda: os botões ficam escondidos e a home mostra os mais recentes.
  A escolha fica salva no navegador do leitor (localStorage), só por conveniência.
*/
(function () {
  "use strict";

  var grupo = document.querySelector("[data-ordenar-home]");
  var lista = document.querySelector("[data-posts-home]");
  var molde = document.querySelector("template[data-card-molde]");
  if (!grupo || !lista) {
    return;
  }

  var CHAVE = "blog-ordem-home";
  var MAX_TEXTO = 500;
  var visiveis = parseInt(lista.getAttribute("data-visiveis"), 10) || 6;
  var botoes = Array.prototype.slice.call(grupo.querySelectorAll("[data-ordem]"));
  // Título da seção ("Mais recentes": chave shortcode.recent_articles em i18n/pt-BR.yaml): acompanha a ordem escolhida.
  var titulo = grupo.previousElementSibling && grupo.previousElementSibling.tagName === "H2" ? grupo.previousElementSibling : null;
  var tituloOriginal = titulo ? titulo.textContent : "";

  // Cards já presentes no HTML, por URL (reaproveitados em qualquer ordem).
  var cards = {};
  var ordemInicial = [];
  Array.prototype.forEach.call(lista.querySelectorAll(".ordenar-home__item[data-url]"), function (item) {
    var url = caminhoSeguro(item.getAttribute("data-url"));
    if (url) {
      cards[url] = item;
      ordemInicial.push(url);
    }
  });

  var posts = null; // dados do JSON, depois de validados
  var carregando = null;

  // ---------- validação ----------

  // Caminho do próprio site: começa com "/", não com "//" nem "/\", sem esquema e sem caracteres
  // de controle ou espaços. Resolve contra a origem atual e exige a mesma origem.
  function caminhoSeguro(valor) {
    if (typeof valor !== "string" || valor.length === 0 || valor.length > 2048) {
      return null;
    }
    if (valor.charAt(0) !== "/" || valor.charAt(1) === "/" || valor.charAt(1) === "\\") {
      return null;
    }
    if (/[\u0000- \u007f\\<>"'`]/.test(valor)) {
      return null;
    }
    try {
      var resolvida = new URL(valor, window.location.origin);
      if (resolvida.origin !== window.location.origin) {
        return null;
      }
    } catch (e) {
      return null;
    }
    return valor;
  }

  function texto(valor) {
    return typeof valor === "string" ? valor.slice(0, MAX_TEXTO) : "";
  }

  function inteiro(valor) {
    return typeof valor === "number" && isFinite(valor) ? Math.floor(valor) : 0;
  }

  function validar(dados) {
    if (!dados || !Array.isArray(dados.posts)) {
      return [];
    }
    var termos = Array.isArray(dados.termos)
      ? dados.termos.map(function (t) {
          var url = t && typeof t === "object" ? caminhoSeguro(t.u) : null;
          var rotulo = t && typeof t === "object" ? texto(t.r) : "";
          return url && rotulo ? { rotulo: rotulo, url: url } : null;
        })
      : [];
    var vistos = {};
    var saida = [];
    dados.posts.forEach(function (p) {
      if (!p || typeof p !== "object") {
        return;
      }
      var url = caminhoSeguro(p.u);
      var tituloPost = texto(p.t);
      if (!url || !tituloPost || vistos[url]) {
        return;
      }
      vistos[url] = true;
      saida.push({
        url: url,
        titulo: tituloPost,
        imagem: p.i ? caminhoSeguro(p.i) : null,
        dataHora: /^\d{4}-\d{2}-\d{2}T[\d:+\-Z]+$/.test(p.dt || "") ? p.dt : "",
        data: inteiro(p.d),
        meta: Array.isArray(p.m) ? p.m.map(texto).filter(Boolean).slice(0, 10) : [],
        termos: Array.isArray(p.c)
          ? p.c
              .map(function (i) {
                return termos[inteiro(i)] || null;
              })
              .filter(Boolean)
              .slice(0, 20)
          : [],
        visitas: inteiro(p.v),
        resumo: texto(p.s),
      });
    });
    return saida;
  }

  // ---------- montagem do card a partir do molde do tema ----------

  function maisInterno(el) {
    while (el && el.firstElementChild) {
      el = el.firstElementChild;
    }
    return el;
  }

  function montarCard(post) {
    if (!molde || !molde.content || !molde.content.firstElementChild) {
      return null;
    }
    var artigo = molde.content.firstElementChild.cloneNode(true);

    var img = artigo.querySelector("img");
    if (img) {
      if (post.imagem) {
        img.setAttribute("src", post.imagem);
        img.setAttribute("alt", post.titulo);
      } else {
        var moldura = img.closest(".thumbnail_card") || img.parentNode;
        moldura.parentNode.removeChild(moldura);
      }
    }

    var link = artigo.querySelector("header a");
    if (!link) {
      return null;
    }
    link.setAttribute("href", post.url);
    link.removeAttribute("target");
    link.removeAttribute("rel");
    var h2 = link.querySelector("h2") || link;
    h2.textContent = post.titulo;

    var blocoMeta = artigo.querySelector("header + div");
    var linhas = blocoMeta ? Array.prototype.slice.call(blocoMeta.children) : [];

    // Linha 1: metadados (data · palavras · tempo de leitura), na ordem do tema.
    var linhaMeta = linhas[0];
    if (linhaMeta) {
      var separador = linhaMeta.querySelector(".px-2");
      var modelos = Array.prototype.filter.call(linhaMeta.children, function (el) {
        return el !== separador && !el.classList.contains("px-2");
      });
      while (linhaMeta.firstChild) {
        linhaMeta.removeChild(linhaMeta.firstChild);
      }
      post.meta.forEach(function (valor, i) {
        var modelo = modelos[Math.min(i, modelos.length - 1)];
        var el = modelo ? modelo.cloneNode(false) : document.createElement("span");
        el.textContent = valor;
        if (el.tagName === "TIME") {
          if (post.dataHora) {
            el.setAttribute("datetime", post.dataHora);
          } else {
            el.removeAttribute("datetime");
          }
        }
        if (i > 0 && separador) {
          linhaMeta.appendChild(separador.cloneNode(true));
        }
        linhaMeta.appendChild(el);
      });
    }

    // Linha 2: chips de categorias e tags.
    var linhaTermos = linhas[1];
    if (linhaTermos) {
      var chipModelo = linhaTermos.querySelector("a");
      while (linhaTermos.firstChild) {
        linhaTermos.removeChild(linhaTermos.firstChild);
      }
      if (chipModelo && post.termos.length) {
        post.termos.forEach(function (termo) {
          var chip = chipModelo.cloneNode(true);
          chip.setAttribute("href", termo.url);
          maisInterno(chip).textContent = termo.rotulo;
          linhaTermos.appendChild(chip);
        });
      } else {
        linhaTermos.parentNode.removeChild(linhaTermos);
      }
    }

    var resumo = artigo.querySelector(".article-link__summary");
    if (resumo) {
      if (post.resumo) {
        resumo.textContent = post.resumo;
      } else {
        resumo.parentNode.removeChild(resumo);
      }
    }

    var item = document.createElement("div");
    item.className = "ordenar-home__item";
    item.setAttribute("data-url", post.url);
    item.appendChild(artigo);
    return item;
  }

  function card(post) {
    if (!cards[post.url]) {
      var novo = montarCard(post);
      if (novo) {
        cards[post.url] = novo;
      }
    }
    return cards[post.url] || null;
  }

  // ---------- dados ----------

  function carregar() {
    if (posts) {
      return Promise.resolve(posts);
    }
    if (carregando) {
      return carregando;
    }
    var url = caminhoSeguro(lista.getAttribute("data-json"));
    var integridade = lista.getAttribute("data-json-integridade") || "";
    if (!url || !window.fetch) {
      return Promise.reject(new Error("JSON indisponível"));
    }
    var opcoes = { credentials: "same-origin" };
    if (integridade) {
      opcoes.integrity = integridade;
    }
    carregando = window
      .fetch(url, opcoes)
      .then(function (resposta) {
        if (!resposta.ok) {
          throw new Error("HTTP " + resposta.status);
        }
        return resposta.json();
      })
      .then(function (dados) {
        posts = validar(dados);
        if (!posts.length) {
          throw new Error("JSON sem posts válidos");
        }
        return posts;
      })
      .catch(function (erro) {
        carregando = null;
        throw erro;
      });
    return carregando;
  }

  // ---------- ordenação ----------

  var COMPARADORES = {
    recentes: function (a, b) {
      return b.data - a.data;
    },
    antigos: function (a, b) {
      return a.data - b.data;
    },
    "mais-lidos": function (a, b) {
      return b.visitas - a.visitas || COMPARADORES.recentes(a, b);
    },
    "menos-lidos": function (a, b) {
      return a.visitas - b.visitas || COMPARADORES.recentes(a, b);
    },
  };

  function mostrar(urls) {
    var fragmento = document.createDocumentFragment();
    urls.forEach(function (url) {
      if (cards[url]) {
        fragmento.appendChild(cards[url]);
      }
    });
    while (lista.firstChild) {
      lista.removeChild(lista.firstChild);
    }
    lista.appendChild(fragmento);
  }

  function marcar(ordem) {
    botoes.forEach(function (botao) {
      var ativo = botao.getAttribute("data-ordem") === ordem;
      botao.setAttribute("aria-pressed", String(ativo));
      if (ativo && titulo) {
        titulo.textContent = ordem === "recentes" ? tituloOriginal : botao.textContent;
      }
    });
  }

  function aplicar(ordem) {
    if (!COMPARADORES[ordem] || !grupo.querySelector('[data-ordem="' + ordem + '"]')) {
      ordem = "recentes";
    }
    marcar(ordem);
    if (ordem === "recentes") {
      mostrar(ordemInicial);
      return Promise.resolve(ordem);
    }
    lista.setAttribute("aria-busy", "true");
    return carregar()
      .then(function (dados) {
        var urls = [];
        dados
          .slice()
          .sort(COMPARADORES[ordem])
          .some(function (post) {
            if (card(post)) {
              urls.push(post.url);
            }
            return urls.length >= visiveis;
          });
        mostrar(urls);
        return ordem;
      })
      .catch(function () {
        // Sem o JSON (rede, integridade ou dados inválidos): volta para os mais recentes.
        marcar("recentes");
        mostrar(ordemInicial);
        return "recentes";
      })
      .then(function (aplicada) {
        lista.removeAttribute("aria-busy");
        return aplicada;
      });
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
      var pedida = botao.getAttribute("data-ordem");
      aplicar(pedida).then(function (aplicada) {
        if (aplicada === pedida) {
          salvarEscolha(aplicada);
        }
      });
    });
  });

  aplicar(lerEscolha() || "recentes");
  grupo.hidden = false;
})();

/*
  Redirecionamento automático pelo idioma do navegador (params.languageRedirect) sem script inline.

  O Blowfish (layouts/partials/language-redirect.html) escreve a configuração num <script> inline, que muda
  em cada página (lista de traduções): a CSP do site (script-src sem 'unsafe-inline') bloquearia, e um hash
  por página não é viável. O override layouts/partials/language-redirect.html passa a mesma configuração no
  atributo data-config deste script, e este trecho é concatenado ANTES do assets/js/language-redirect.js do
  tema (mesmo arquivo, com fingerprint e SRI): define window.BlowfishLanguageRedirectConfig e o código do tema
  roda em seguida, sem alteração (seletor de idioma, escolha lembrada no localStorage e redirecionamento).

  Ajustes do blog:
  - robôs (Googlebot, Bingbot...), Lighthouse e navegadores automatizados não são redirecionados: a home "/"
    tem de continuar indexável em pt-BR (o hreflang aponta as versões; x-default = pt-BR);
  - só caminhos do próprio site entram na lista de traduções (nada de URL externa ou "javascript:").
  Revisar a cada atualização do Blowfish (docs/MAINTENANCE.md, "Redirecionamento pelo idioma do navegador").
*/
(function () {
  "use strict";
  var script = document.currentScript;
  var config = { enabled: false };
  try {
    config = JSON.parse((script && script.getAttribute("data-config")) || "{}");
  } catch (e) {
    config = { enabled: false };
  }

  var robo = /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|embedly|whatsapp|telegram|linkedin/i;
  if (navigator.webdriver || robo.test(navigator.userAgent || "")) {
    config.enabled = false;
  }

  var caminhoDoSite = /^\/(?![\/\\])[^\s"'<>`\\]*$/;
  config.translations = (Array.isArray(config.translations) ? config.translations : []).filter(function (t) {
    return t && typeof t.url === "string" && caminhoDoSite.test(t.url);
  });

  window.BlowfishLanguageRedirectConfig = config;
})();

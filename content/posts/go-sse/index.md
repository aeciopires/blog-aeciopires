---
title: "Go-SSE"
slug: "go-sse"
date: 2026-07-12T04:03:41-03:00
lastmod: 2026-07-12T04:03:42-03:00
draft: false
categories: ["devops", "docker", "git", "go", "kubernetes", "prometheus"]
tags: ["golang", "docker", "kubernetes", "helm"]
description: "Go-SSE é uma aplicação web para testar e demonstrar o protocolo Server-Sent Events (SSE) utilizando Golang."
wp_id: 3512
---

Go-SSE é uma aplicação web para testar e demonstrar o protocolo [Server-Sent Events (SSE)](https://king.host/blog/glossario/server-sent-events-o-que-e-e-como-usar/) utilizando Golang.

O SSE permite que um servidor envie atualizações automáticas para um navegador por meio de uma conexão HTTP aberta.

Diferentemente de outras técnicas como AJAX, onde o cliente solicita atualizações, o SSE mantém essa conexão aberta, e o servidor envia atualizações assim que elas estiverem disponíveis. Essa abordagem reduz o número de solicitações ao servidor, tornando o fluxo de dados mais eficiente.

O SSE é um protocolo leve, unidirecional e utiliza o formato `text/event-stream`, ele permite atualizações eficientes do servidor para o navegador (por exemplo, dashboards, notificações) com funcionalidade nativa de reconexão automática.

Referências:

- [Server-Sent Events - HTML Living Standard](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [MDN Web Docs - Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [RFC 2818 - HTTP Over TLS](https://www.rfc-editor.org/rfc/rfc2818)

A aplicação GoSSE implementa um backend em Go que serve um frontend, além de incluir métricas do Prometheus e configurações do Docker.

Eu desenvolvi essa aplicação quando estava validando o suporte de uma CDN a esse protocolo.
Se houver algum caso de uso em que essa aplicação lhe ajude, fique à vontade para utilizar.

Mais detalhes sobre o uso podem ser encontrados em: [https://github.com/aeciopires/go-sse](https://github.com/aeciopires/go-sse)

{{< figure src="/wp-content/uploads/2026/07/app-1.png" alt="app" >}}

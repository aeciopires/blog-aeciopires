---
title: "Go-SSE"
slug: "go-sse"
date: 2026-07-12T04:03:41-03:00
lastmod: 2026-07-12T04:03:42-03:00
draft: false
categories: ["devops", "docker", "git", "go", "kubernetes", "prometheus"]
tags: ["golang", "docker", "kubernetes", "helm"]
description: "Go-SSE is a web application to test and demonstrate the Server-Sent Events (SSE) protocol using Golang."
sourceHash: "d5f1354f6ec87bed"
---

Go-SSE is a web application to test and demonstrate the [Server-Sent Events (SSE)](https://king.host/blog/glossario/server-sent-events-o-que-e-e-como-usar/) protocol (in Portuguese) using Golang.

SSE allows a server to push automatic updates to a browser over an open HTTP connection.

Unlike other techniques such as AJAX, where the client requests updates, SSE keeps this connection open, and the server sends updates as soon as they are available. This approach reduces the number of requests to the server, making the data flow more efficient.

SSE is a lightweight, unidirectional protocol that uses the `text/event-stream` format. It enables efficient updates from the server to the browser (for example, dashboards and notifications) with built-in automatic reconnection.

References:

- [Server-Sent Events - HTML Living Standard](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [MDN Web Docs - Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [RFC 2818 - HTTP Over TLS](https://www.rfc-editor.org/rfc/rfc2818)

The GoSSE application implements a Go backend that serves a frontend, and it also includes Prometheus metrics and Docker configuration.

I developed this application when I was validating a CDN's support for this protocol.
If you have a use case where this application can help you, feel free to use it.

More details about its usage can be found at: [https://github.com/aeciopires/go-sse](https://github.com/aeciopires/go-sse)

{{< figure src="/wp-content/uploads/2026/07/app-1.png" alt="app" >}}

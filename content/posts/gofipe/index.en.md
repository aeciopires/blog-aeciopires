---
title: "GoFipe"
slug: "gofipe"
date: 2026-07-12T03:46:04-03:00
lastmod: 2026-07-12T03:46:04-03:00
draft: false
categories: ["devops", "docker", "git", "go", "kubernetes"]
tags: ["docker", "golang", "helm", "kubernetes", "linux"]
description: "GoFipe is a web application that provides an intuitive interface for looking up the FIPE vehicle price table."
sourceHash: "ce83b20916beccbb"
---

GoFipe is a web application that provides an intuitive interface for looking up the FIPE vehicle price table.

The Fipe Table (Fundação Instituto de Pesquisas Econômicas, the Institute of Economic Research Foundation) is the main indicator of average prices for new, nearly new, and used vehicles in Brazil. It serves as a reference guide for buying and selling negotiations, for setting insurance policies, and as the basis for calculating the IPVA (Brazil's annual vehicle tax).

References:

- [https://www.fipe.org.br](https://www.fipe.org.br)
- [https://fipe.online/docs/comece-aqui](https://fipe.online/docs/comece-aqui)

I created this application as a hobby and to strengthen my learning of Golang.

It implements a Go backend (acting as a proxy for the FIPE data source and serving the frontend), a simple frontend using Go HTML Templates, Prometheus metrics, and Docker settings.

For more details on how to run it, visit [https://github.com/aeciopires/gofipe](https://github.com/aeciopires/gofipe).

{{< figure src="/wp-content/uploads/2026/07/gofipe-1024x579.png" alt="gofipe" >}}

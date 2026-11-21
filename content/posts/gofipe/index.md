---
title: "GoFipe"
slug: "gofipe"
date: 2026-07-12T03:46:04-03:00
lastmod: 2026-07-12T03:46:04-03:00
draft: false
categories: ["devops", "docker", "git", "go", "kubernetes"]
tags: ["docker", "golang", "helm", "kubernetes", "linux"]
description: "GoFipe é uma aplicação web que oferece uma interface intuitiva para consultar a tabela de preços de veículos FIPE."
wp_id: 3505
---

GoFipe é uma aplicação web que oferece uma interface intuitiva para consultar a tabela de preços de veículos FIPE.

A Tabela Fipe (Fundação Instituto de Pesquisas Econômicas) é o principal indicador de preços médios de veículos novos, seminovos e usados no Brasil. Ela serve como um guia de referência para negociações de compra e venda, definição de apólices de seguro e base de cálculo para o IPVA.

Referências:

- [https://www.fipe.org.br](https://www.fipe.org.br)
- [https://fipe.online/docs/comece-aqui](https://fipe.online/docs/comece-aqui)

Criei essa aplicação como um passatempo e para fortalecer meu aprendizado com Golang.

Ela implementa um backend em Go (atuando como proxy para a fonte de dados da FIPE e servindo o frontend), um frontend simples utilizando Go HTML Templates, métricas do Prometheus e configurações do Docker.

Para saber mais detalhes sobre como executar, acesse [https://github.com/aeciopires/gofipe](https://github.com/aeciopires/gofipe).

{{< figure src="/wp-content/uploads/2026/07/gofipe-1024x579.png" alt="gofipe" >}}

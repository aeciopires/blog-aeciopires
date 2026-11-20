---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
slug: "{{ .File.ContentBaseName }}"
date: {{ .Date }}
lastmod: {{ .Date }}
draft: true
# Categorias e tags: SÓ as registradas em data/taxonomia.yaml (1 a 5 tags).
# Tag nova: make new-tag NAME=... DESC="..." · Validar: make check-tags
categories: []
tags: []
description: ""   # até ~155 caracteres, usado no SEO e nos cards
---

<!-- Imagem destacada: salve como feature.png|jpg|webp nesta pasta. Texto alternativo em todas as imagens. -->

Escreva aqui.

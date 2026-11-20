---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
slug: "{{ .File.ContentBaseName }}"
date: {{ .Date }}
draft: true
description: ""
showDate: false
showReadingTime: false
showWordCount: false
showAuthor: false
showComments: false
---

Escreva aqui. Se a página for para o menu, inclua em config/_default/menus.pt-br.toml.

---
title: "Instalando o Go"
slug: "instalando-o-go"
date: 2021-02-07T15:57:35-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["devops", "go", "tutoriais"]
tags: ["golang"]
description: "Se você ainda não sabe o que é Go, recomendo ver os links que estão neste tutorial."
wp_id: 2504
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** versão atualizada para o Go 1.27.4 (a estável mais recente), com os comandos testados num Ubuntu 24.04: download, instalação em `/usr/local/go` e configuração do `PATH` no `.bashrc`.
{{< /alert >}}

Se você ainda não sabe o que é [**Go**](https://golang.org/), recomendo ver os links que estão [neste tutorial](/primeiros-passos-com-go/).

Para instalar o Go no Linux, execute os seguintes comandos:

```bash
VERSION=1.27.4
cd /tmp
mkdir -p $HOME/go/bin
curl https://dl.google.com/go/go$VERSION.linux-amd64.tar.gz -o go.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go.tar.gz
rm /tmp/go.tar.gz
export GOPATH=$HOME/go
export PATH=$PATH:/usr/local/go/bin:$GOPATH/bin
go version
echo "GOPATH=$HOME/go" >> ~/.bashrc
echo "PATH=\$PATH:/usr/local/go/bin:\$GOPATH/bin" >> ~/.bashrc
```

Veja também o curso gratuito de Go em pt-BR com [Ellen Korbes](https://www.linkedin.com/in/l-k%C3%B6rbes/) disponível em: [http://aprendago.com](http://aprendago.com/)

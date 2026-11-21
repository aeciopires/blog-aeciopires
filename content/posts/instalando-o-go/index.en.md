---
title: "Installing Go"
slug: "instalando-o-go"
date: 2021-02-07T15:57:35-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["devops", "go", "tutoriais"]
tags: ["golang"]
description: "If you don't know what Go is yet, I recommend checking out the links in this tutorial."
sourceHash: "e7321e3bcd073224"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** updated to Go 1.27.4 (the latest stable release), with the commands tested on Ubuntu 24.04: download, installation in `/usr/local/go` and `PATH` setup in `.bashrc`.
{{< /alert >}}

If you don't know what the [**Go language**](https://golang.org/) is yet, I recommend checking out the links in [this tutorial](/en/primeiros-passos-com-go/).

To install Go on Linux, run the following commands:

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

Also check out the free Go course in Portuguese (pt-BR) by [Ellen Korbes](https://www.linkedin.com/in/l-k%C3%B6rbes/), available at: [http://aprendago.com](http://aprendago.com/)

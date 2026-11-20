---
title: "Instalando o Docker, Docker Registry e Portainer"
slug: "instalando-o-docker-docker-swarm-docker-registry-e-portainer"
date: 2017-08-16T18:25:06-03:00
lastmod: 2026-10-07T08:27:28-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["containers", "docker", "portainer", "swarm"]
description: "O Docker pode ser instalado no Ubuntu seguindo o seguinte tutorial:"
wp_id: 1507
---

**Atualizado em: 7 de outubro de 2026**

## Instalando o Docker

O Docker pode ser instalado no Ubuntu seguindo o seguinte tutorial:

[https://docs.docker.com/engine/install/ubuntu](https://docs.docker.com/engine/install/ubuntu)

Para instalá-lo em outras distribuições GNU/Linux acesse o link abaixo.

[https://docs.docker.com/engine/install](https://docs.docker.com/engine/install)

## Iniciando o Docker Registry

Inicie o conteiner que contém o Registry com o comando abaixo:

```bash
docker run -d --name registry \
 -p 5000:5000 \
 --restart=always \
 registry:3
```

O conteiner do Registry será iniciado como serviço. Mesmo que o conteiner pare, ele será reiniciado.  
O registry ficará acessível em: **http://ip-servidor:5000/**

Testando o download da imagem Ubuntu do Docker Hub e na sequencia enviando para o registry local.

```bash
docker pull ubuntu

docker tag ubuntu localhost:5000/ubuntu
docker push localhost:5000/ubuntu
```

O Docker Registry é uma alternativa ao Docker Hub para hospedagem de imagens privadas de forma gratuita. Saiba mais sobre o Registry em: [https://distribution.github.io/distribution/](https://distribution.github.io/distribution/)

Referências:

[https://distribution.github.io/distribution/about/deploying](https://distribution.github.io/distribution/about/deploying)

[https://hub.docker.com/\_/registry](https://hub.docker.com/_/registry)

[https://www.docker.com/blog/how-to-use-your-own-registry-2](https://www.docker.com/blog/how-to-use-your-own-registry-2)

## Iniciando o Portainer (Interface Web para o Docker)

Inicie o conteiner que contém a interface web para o Docker com os comandos abaixo:

```bash
docker volume create portainer_data

PORTAINER_VERSION='lts'

docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:"$PORTAINER_VERSION"

```

O Portainer gera e usa automaticamente um certificado autoassinado para a porta 9443/TCP.

Como no conteiner, os dados são perdidos quando o mesmo é removido, os dados do Portainer serão persistidos no volume Docker **portainer\_data**. Saiba mais sobre o Portainer em: **http://portainer.io**

O portainer ficará acessível em: **https://ip-servidor:9443/** (com HTTPS).

> Atenção!!! Segundo a documentação oficial ([https://docs.portainer.io/start/install-ce/server/docker/linux](https://docs.portainer.io/start/install-ce/server/docker/linux)), a porta 8000/TCP não é a interface web com HTTP. Ela expõe um servidor de túnel TCP, que é opcional e só é necessário se você for usar os recursos de \*Edge compute\* com \*Edge agents\*. Se você precisar da interface web sem HTTPS na porta 9000/TCP, por motivos de compatibilidade, adicione a opção `-p 9000:9000` ao comando `docker run`.

A partir das versões 2.43 e 2.39.4 do Portainer, novas instalações exigem um **setup token** para concluir a configuração inicial (criação do usuário administrador). Esse token é exibido no log do conteiner, na linha que contém `setup_token=`. Para obtê-lo, execute o comando abaixo e cole o valor no campo **Setup token** da interface web. Mais detalhes em: [https://docs.portainer.io/faqs/installing/setup-token](https://docs.portainer.io/faqs/installing/setup-token)

```bash
docker logs portainer 2>&1 | grep setup_token=
```

Mais informações sobre o Portainer podem ser obtidas em:

[https://docs.portainer.io/start/install-ce/server/docker/linux](https://docs.portainer.io/start/install-ce/server/docker/linux)

[https://docs.portainer.io](https://docs.portainer.io)

{{< figure src="/wp-content/uploads/2017/08/portainer2-1024x447.png" alt="portainer2" >}}

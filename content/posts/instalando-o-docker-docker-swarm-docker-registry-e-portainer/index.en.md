---
title: "Installing Docker, Docker Registry, and Portainer"
slug: "instalando-o-docker-docker-swarm-docker-registry-e-portainer"
date: 2017-08-16T18:25:06-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["containers", "docker", "portainer"]
description: "Docker can be installed on Ubuntu by following this tutorial:"
sourceHash: "498dc110e8ff5e1e"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested: Docker Registry with the `registry:3` image (3.1.2), pushing an image to the local registry, and Portainer CE `lts` (2.45.4) with the `setup_token` shown in the log. No changes were needed.
{{< /alert >}}

## Installing Docker

Docker can be installed on Ubuntu by following this tutorial:

[https://docs.docker.com/engine/install/ubuntu](https://docs.docker.com/engine/install/ubuntu)

To install it on other GNU/Linux distributions, see the link below.

[https://docs.docker.com/engine/install](https://docs.docker.com/engine/install)

## Starting Docker Registry

Start the container that runs the Registry with the command below:

```bash
docker run -d --name registry \
 -p 5000:5000 \
 --restart=always \
 registry:3
```

The Registry container will start as a service. Even if the container stops, it will be restarted.  
The Registry will be available at: **http://ip-servidor:5000/**

Testing by pulling the Ubuntu image from Docker Hub and then pushing it to the local registry.

```bash
docker pull ubuntu

docker tag ubuntu localhost:5000/ubuntu
docker push localhost:5000/ubuntu
```

Docker Registry is a free alternative to Docker Hub for hosting private images. Learn more about the Registry at: [https://distribution.github.io/distribution/](https://distribution.github.io/distribution/)

References:

[https://distribution.github.io/distribution/about/deploying](https://distribution.github.io/distribution/about/deploying)

[https://hub.docker.com/\_/registry](https://hub.docker.com/_/registry)

[https://www.docker.com/blog/how-to-use-your-own-registry-2](https://www.docker.com/blog/how-to-use-your-own-registry-2)

## Starting Portainer (web interface for Docker)

Start the container that runs the web interface for Docker with the commands below:

```bash
docker volume create portainer_data

PORTAINER_VERSION='lts'

docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:"$PORTAINER_VERSION"

```

Portainer automatically generates and uses a self-signed certificate for port 9443/TCP.

Since a container's data is lost when it is removed, Portainer's data will be persisted in the **portainer\_data** Docker volume. Learn more about Portainer at: **http://portainer.io**

Portainer will be available at: **https://ip-servidor:9443/** (with HTTPS).

> Attention!!! According to the official documentation ([https://docs.portainer.io/start/install-ce/server/docker/linux](https://docs.portainer.io/start/install-ce/server/docker/linux)), port 8000/TCP is not the HTTP web interface. It exposes a TCP tunnel server, which is optional and only needed if you are going to use the _Edge compute_ features with _Edge agents_. If you need the web interface without HTTPS on port 9000/TCP for compatibility reasons, add the `-p 9000:9000` option to the `docker run` command.

Starting with Portainer versions 2.43 and 2.39.4, new installations require a **setup token** to complete the initial setup (creating the administrator user). This token is shown in the container log, on the line that contains `setup_token=`. To get it, run the command below and paste the value into the **Setup token** field in the web interface. More details at: [https://docs.portainer.io/faqs/installing/setup-token](https://docs.portainer.io/faqs/installing/setup-token)

```bash
docker logs portainer 2>&1 | grep setup_token=
```

More information about Portainer is available at:

[https://docs.portainer.io/start/install-ce/server/docker/linux](https://docs.portainer.io/start/install-ce/server/docker/linux)

[https://docs.portainer.io](https://docs.portainer.io)

{{< figure src="/wp-content/uploads/2017/08/portainer2-1024x447.png" alt="portainer2" >}}

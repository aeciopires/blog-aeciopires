---
title: "Installing Grafana with Docker"
slug: "instalando-o-grafana-via-docker"
date: 2018-06-08T12:08:14-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "grafana"]
tags: ["docker", "grafana"]
description: "Based on the pages below from the Grafana documentation on installing with Docker, I put together the following tutorial to install it."
sourceHash: "e4da4fef52bf9227"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested with the `grafana/grafana` image (Grafana 13.3.1) over HTTP and HTTPS, using a certificate generated as in the post [Configuring Grafana to run over HTTPS](/en/configurando-o-grafana-para-funcionar-sobre-https/). No changes were needed: the `chown 472:472` in this post already ensures that Grafana can read the files.
{{< /alert >}}

Based on the pages below from the Grafana documentation on installing with Docker, I put together the following tutorial to install it.

[http://docs.grafana.org/installation/docker/](http://docs.grafana.org/installation/docker/)

[http://docs.grafana.org/installation/configuration/](http://docs.grafana.org/installation/configuration/)

If you don't know what Docker is, I recommend starting with the links on this page. It's a long road, but this technology is worth learning.

[/en/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/en/curso-docker](/en/curso-docker)

To install Grafana and its dependencies, I followed the steps below.

1) Create the directory for the Grafana data to be persisted outside the container.

```bash
sudo mkdir -p /docker/grafana/data
sudo chown -R 472:472 /docker/grafana/data
sudo chmod -R 775 /docker/grafana
```

2) OPTIONAL: To use Grafana with HTTPS, create the directory below and then copy the public key (e.g., certificado.crt) and the private key (e.g., certificado.key) of the certificate you will use.

```bash
sudo mkdir -p /docker/grafana/certs
sudo chown -R 472:472 /docker/grafana/certs
```

The directory permissions were set to user and group 472 because that is the UID and GID of the Grafana user running inside the container, which needs permissions on the directories that will hold the data persisted outside the container.

3) OPTIONAL: Start the Grafana Docker container with HTTPS support.

```bash
docker run -d --name=grafana \
 --restart always \
 -p 3000:3000 \
 -e "GF_SERVER_PROTOCOL=https" \
 -e "GF_SERVER_HTTP_PORT=3000" \
 -e "GF_SERVER_CERT_FILE=/etc/certs/server.crt" \
 -e "GF_SERVER_CERT_KEY=/etc/certs/server.key" \
 -v /docker/grafana/data:/var/lib/grafana \
 -v /docker/grafana/certs/certificado.crt:/etc/certs/server.crt \
 -v /docker/grafana/certs/certificado.key:/etc/certs/server.key \
 grafana/grafana
```

Remember to replace the names certificado.key and certificado.crt with the names of the certificate files you copied in step 2.

Or start the Grafana Docker container with HTTP.

```bash
docker run -d --name=grafana \
 --restart always \
 -p 3000:3000 \
 -e "GF_SERVER_PROTOCOL=http" \
 -e "GF_SERVER_HTTP_PORT=3000" \
 -v /docker/grafana/data:/var/lib/grafana \
 grafana/grafana
```

4) You can view the log with the command below.

```bash
docker logs grafana
```

5) Access Grafana at the URL **https://IP-Servidor:3000 (with HTTPS)** or **http://IP-Servidor:3000 (with HTTP)**. The login is **admin** and the default password is **admin**.

6) If you want to stop the container, just run the command below.

```bash
docker stop grafana
```

7) To start it again, run the command below.

```bash
docker start grafana
```

For more information about Grafana and how to configure it, check out the links below.

- [http://docs.grafana.org](http://docs.grafana.org)
- [https://github.com/monitoringartist/Zabbix-Docker-Monitoring](https://github.com/monitoringartist/Zabbix-Docker-Monitoring)
- [https://hub.docker.com/r/monitoringartist/grafana-xxl/](https://hub.docker.com/r/monitoringartist/grafana-xxl/)

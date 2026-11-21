---
title: "Installing Graylog via Docker"
slug: "graylog-docker"
date: 2017-09-26T11:22:29-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["docker", "graylog"]
description: "This Graylog page has a lot of information about installing Graylog using Docker images. The example file used in this tutorial (…"
sourceHash: "c6691613f58c2d5b"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** tested with the official `open-core` compose file, which now uses Graylog 7.2 (7.2.2), Data Node 7.2, and MongoDB 7.0: initial setup, login with the password from `.env`, receiving and searching for a GELF message, `stop`, and `start`. Fixed the file name in the `docker compose -f` commands (the downloaded file is `docker-compose.yml`, not `.yaml`).
{{< /alert >}}

This [Graylog](https://go2docs.graylog.org/7-2/downloading_and_installing_graylog/docker_installation.htm) page has a lot of information about installing Graylog using Docker images. The example file used in this tutorial (**open-core**) uses Docker images for Graylog, Graylog Data Node, and MongoDB.

In this tutorial, Graylog runs in a [Docker](https://www.docker.com/) container, which makes the installation very simple and gets the service up and running quickly.

If you don't know what Docker is, I recommend starting with the links on this page. It's a long road, but this technology is worth learning.

[/en/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/en/curso-docker](/en/curso-docker)

Before you start… install Docker and the Docker Compose plugin following the official documentation: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/) and [https://docs.docker.com/compose/install/linux/](https://docs.docker.com/compose/install/linux/). On Ubuntu/Debian, with the Docker repository configured, the plugin can be installed with the following commands:

```bash
sudo apt-get update;

sudo apt-get install docker-compose-plugin;

docker compose version
```

0) Create the Graylog directory and download the `docker-compose.yml` and `.env.example` files from the official repository.

```bash
sudo mkdir -p /docker/graylog;

cd /docker/graylog;

sudo curl -sSL -o docker-compose.yml https://raw.githubusercontent.com/Graylog2/docker-compose/main/open-core/docker-compose.yml;

sudo curl -sSL -o .env https://raw.githubusercontent.com/Graylog2/docker-compose/main/open-core/.env.example
```

**The version used in this tutorial was 7.2**, more precisely open-core: [https://github.com/Graylog2/docker-compose/tree/main/open-core](https://github.com/Graylog2/docker-compose/tree/main/open-core)

1) Edit the `/docker/graylog/.env` file and fill in the `GRAYLOG_PASSWORD_SECRET` and `GRAYLOG_ROOT_PASSWORD_SHA2` variables. According to the repository's README ([https://github.com/Graylog2/docker-compose](https://github.com/Graylog2/docker-compose)), Graylog does not start without them. The comments in the `.env` file itself suggest the commands below to generate the values (replace **SUA\_SENHA** with the password you want to use for the **admin** user):

```bash
# Value for the GRAYLOG_PASSWORD_SECRET variable (at least 64 characters)
pwgen -N 1 -s 96

# Value for the GRAYLOG_ROOT_PASSWORD_SHA2 variable
echo -n SUA_SENHA | shasum -a 256

sudo vim /docker/graylog/.env
```

2) Increase the limit of memory map areas (`vm.max_map_count`), required by Data Node (OpenSearch), with the command below. Source: [https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html)

```bash
sudo sysctl -w vm.max_map_count=262144;
```

3) Run the Graylog containers with the following command.

```bash
cd /docker/graylog;
sudo docker compose -f docker-compose.yml up -d
```

4) To view the logs, run the command below.

```bash
cd /docker/graylog;
sudo docker compose -f docker-compose.yml logs
```

Find lines similar to the ones shown below. They contain the initial password to access Graylog.

```text
graylog-1   | Initial configuration is accessible at 0.0.0.0:9000, with username 'admin' and password 'ToRZLCYMgV'.
graylog-1   | Try clicking on http://admin:ToRZLCYMgV@0.0.0.0:9000
```

> Attention!!! In the official `docker-compose.yml` file, the ports are published only on the host's `127.0.0.1` address (example: `"127.0.0.1:9000:9000/tcp"`) and the `GRAYLOG_HTTP_EXTERNAL_URI` variable uses `http://localhost:9000/`. In other words, by default Graylog is only accessible from the server itself ( **http://localhost:9000**). To access it from another machine, adjust these settings in `docker-compose.yml` according to your environment, and remember to protect access to the server.

5) Access Graylog at the URL **http://IP-Servidor:9000** (with HTTP). By default, the login is **admin** and the password is shown in the log, as in the previous example. After completing the initial setup, log in with the **admin** user and the password you used to generate the value of the `GRAYLOG_ROOT_PASSWORD_SHA2` variable.

6) If you want to stop the container, just run the commands below.

```bash
cd /docker/graylog;
sudo docker compose stop
```

7) To start it again, run the command below.

```bash
cd /docker/graylog;
sudo docker compose start
```

For more information about Graylog and how to configure it, check the links below.

[https://go2docs.graylog.org/current/downloading\_and\_installing\_graylog/docker\_installation.htm](https://go2docs.graylog.org/current/downloading_and_installing_graylog/docker_installation.htm)

[https://github.com/Graylog2/docker-compose](https://github.com/Graylog2/docker-compose)

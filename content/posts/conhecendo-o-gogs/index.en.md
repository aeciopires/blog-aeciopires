---
title: "Getting to know Gogs"
slug: "conhecendo-o-gogs"
date: 2018-08-27T17:35:56-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["tutoriais"]
tags: ["docker", "gogs"]
description: "Gogs is open source software that provides a web interface for managing git repositories, similar to GitHub, GitLab and Bitbucket,…"
sourceHash: "d7dc8663c4df8785"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested with `gogs/gogs:0.14` (0.14.4) and the `postgres` image without a pinned tag, which currently installs PostgreSQL 19: installation through the browser, login, repository creation and clone. No changes were needed.
{{< /alert >}}

[Gogs](https://gogs.io/) is open source software that provides a web interface for managing git repositories, similar to [GitHub](http://github.com), [GitLab](http://gitlab.com) and [Bitbucket](http://www.bitbucket.org), but much simpler and lighter than those three. The impressive part is that a Gogs Docker container was using only 50 MB of RAM. That's great when you want to host git repositories without much complexity.

I came across Gogs in 2018 through a post by [Daniel Requena on Twitter](https://twitter.com/Daniel_Requena/status/1034067717509316608).

The Gogs documentation can be found at [https://gogs.io/getting-started/introduction](https://gogs.io/getting-started/introduction).

The page [https://github.com/gogs/gogs/tree/master/docker](https://github.com/gogs/gogs/tree/master/docker) has a tutorial on how to run Gogs in a Docker container.

Below I'll show how to install it integrated with PostgreSQL.

1) Create the database in the PostgreSQL Docker container with the commands below.

```bash
sudo mkdir -p /docker/postgresql/data;
sudo chown -R 999:999 /docker/postgresql/data

docker run -d -p 5432:5432 \
  --name postgresql \
  --restart=always \
  -v /docker/postgresql/data:/var/lib/postgresql/ \
  -e POSTGRES_PASSWORD=gogs \
  -e POSTGRES_USER=gogs \
  -e POSTGRES_DB=gogs \
  postgres
```

> Attention!!! Starting with PostgreSQL 18, the official `postgres` image changed the volume to `/var/lib/postgresql` (the data is stored in a subdirectory named after the version number, for example: `/var/lib/postgresql/18/docker`). That's why the host directory is mounted at `/var/lib/postgresql`. If you use a PostgreSQL 17 or earlier image, mount the directory at `/var/lib/postgresql/data`. More details in the `PGDATA` section of the page [https://hub.docker.com/\_/postgres](https://hub.docker.com/_/postgres).

2) Start the Gogs Docker container with the commands below.

```bash
sudo mkdir -p /docker/gogs/data

docker run -d --name gogs \
  --restart=always \
  -p 10022:22 -p 80:3000 \
  -v /docker/gogs/data:/data \
  gogs/gogs:0.14
```

3) You can view the log with the command below.

```bash
docker logs -f gogs
```

4) Access Gogs at the URL **http://IP-Servidor** and fill in the information to configure it, and also create the admin username and password. See an example in the sequence of images below.

{{< figure src="/wp-content/uploads/2018/08/gogs1.png" alt="gogs1" >}}

{{< figure src="/wp-content/uploads/2018/08/gogs2.png" alt="gogs2" >}}

{{< figure src="/wp-content/uploads/2018/08/gogs3.png" alt="gogs3" >}}

5) Once it's configured, you'll be redirected to the login page, as shown in the image below.

{{< figure src="/wp-content/uploads/2018/08/gogs4.png" alt="gogs4" >}}

6) To create a repository, click the **+** button, as shown in the image below.

{{< figure src="/wp-content/uploads/2018/08/gogs5.png" alt="gogs5" >}}

7) Fill in the information for the new repository.

{{< figure src="/wp-content/uploads/2018/08/gogs6.png" alt="gogs6" >}}

8) The new repository will be created and ready to use.

{{< figure src="/wp-content/uploads/2018/08/gogs7.png" alt="gogs7" >}}

9) If you want to stop the container, just run the command below.

```bash
docker stop gogs
```

10) To start it again, run the command below.

```bash
docker start gogs
```

---
title: "Installing GitLab with Docker"
slug: "gitlab-docker"
date: 2017-08-17T15:55:00-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "git", "tutoriais"]
tags: ["containers", "docker", "git", "gitlab"]
description: "The page https://docs.gitlab.com/install/docker/ has plenty of information about the official GitLab Docker images (a web tool for…"
sourceHash: "87e44327f89a53c6"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** command tested with the `gitlab/gitlab-ce:latest` image (GitLab CE 19.6.1): startup, the message "Thank you for using GitLab Docker Image!" in the log, the login screen, and the initial root password in the `initial_root_password` file. No changes were needed.
{{< /alert >}}

The page [https://docs.gitlab.com/install/docker/](https://docs.gitlab.com/install/docker/) has plenty of information about the official [Docker](http://docker.com) images for [GitLab](https://gitlab.com) (a web tool for version control using Git).

In this tutorial, GitLab will run in a single container that provides the whole environment it needs, which makes the installation very simple and gets the service up and running quickly.

According to the official documentation, 16 GB of RAM is the recommended baseline for a single-node installation, and in memory-constrained environments GitLab can run with at least 8 GB of RAM. The complete list of hardware and software requirements is on this page: [https://docs.gitlab.com/install/requirements/](https://docs.gitlab.com/install/requirements/).

If you don't know what Docker is, I recommend starting with the links on this page. It's a long road, but this technology is worth learning.

[/en/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/en/curso-docker](/en/curso-docker)

Below is the customized tutorial for starting the GitLab container with persistent data.

1) Create the GitLab data, log, and configuration directories.

```bash
sudo mkdir -p /docker/gitlab/config \
 /docker/gitlab/logs \
 /docker/gitlab/data;
```

2) Start the GitLab Docker container.

```bash
docker run -d --hostname gitlab.example.com \
 --env GITLAB_OMNIBUS_CONFIG="external_url 'http://gitlab.example.com'" \
 -p 443:443 -p 80:80 -p 2022:22 \
 --name gitlab \
 --restart always \
 -v /docker/gitlab/config:/etc/gitlab \
 -v /docker/gitlab/logs/:/var/log/gitlab \
 -v /docker/gitlab/data/:/var/opt/gitlab \
 --shm-size 256m \
 gitlab/gitlab-ce:latest
```

Replace the name **gitlab.example.com** with the container's DNS name appropriate for your network.

> The `--shm-size 256m` option is part of the command in the official documentation ([https://docs.gitlab.com/install/docker/installation/](https://docs.gitlab.com/install/docker/installation/)). The documentation's command also uses a specific image version (`<version>`) instead of the `latest` tag, which makes it easier to control upgrades. The available tags are at [https://hub.docker.com/r/gitlab/gitlab-ce/tags](https://hub.docker.com/r/gitlab/gitlab-ce/tags).

3) You can view the log with the commands below.

```bash
docker logs -f gitlab
```

The service can take up to 5 minutes to start and configure itself the first time. It will be ready when the message below appears in the log.

```text
Thank you for using GitLab Docker Image!
```

4) Open GitLab at **http://IP-Servidor (with HTTP)**. You will be asked for the root user and the initial password created during installation.

To get the initial root password, run the following command:

```bash
docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

> > According to the official documentation, the file with the initial password is automatically removed on the first container restart after 24 hours. Change the root password right after logging in for the first time.

5) If you want to stop the container, just run the command below.

```bash
docker stop gitlab
```

6) To start it again, run the command below.

```bash
docker start gitlab
```

For more information about GitLab and how to configure it with HTTPS support, see the links below.

[https://docs.gitlab.com/install/docker/installation](https://docs.gitlab.com/install/docker/installation)

[https://docs.gitlab.com/omnibus/settings/ssl](https://docs.gitlab.com/omnibus/settings/ssl)

[https://hub.docker.com/r/gitlab/gitlab-ce/](https://hub.docker.com/r/gitlab/gitlab-ce/)

[https://docs.gitlab.com/install/docker/configuration](https://docs.gitlab.com/install/docker/configuration)

[https://www.tutorialspoint.com/gitlab/index.htm](https://www.tutorialspoint.com/gitlab/index.htm)

Keep in mind that the database, code repositories, configuration, and logs are persisted in the **/docker/gitlab** directory on the Docker host where the container is running.

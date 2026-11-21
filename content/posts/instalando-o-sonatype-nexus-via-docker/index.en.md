---
title: "Installing Sonatype Nexus via Docker"
slug: "instalando-o-sonatype-nexus-via-docker"
date: 2017-08-15T17:45:45-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["docker", "maven", "nexus"]
description: "This GitHub repository has a tutorial for running Sonatype Nexus (a repository for artifacts built by Apache Maven)."
sourceHash: "ee4b1f7c04692ee4"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested with the `sonatype/nexus3` image (Nexus 3.98.3 Community Edition): startup, log, `admin.password` file and administrator login. No changes were needed.
{{< /alert >}}

{{< figure src="/wp-content/uploads/2017/08/nexus.jpg" alt="nexus" >}}

This [GitHub repository](https://github.com/sonatype/docker-nexus3) has a tutorial for running [Sonatype Nexus](https://help.sonatype.com/en/sonatype-nexus-repository.html) (a repository for artifacts built by [Apache Maven](https://maven.apache.org/)).

> Starting with version 3.77.0, the free edition of Nexus Repository was renamed **Sonatype Nexus Repository Community Edition**, which has some usage limitations. More details at: [https://help.sonatype.com/en/ce-onboarding.html](https://help.sonatype.com/en/ce-onboarding.html)

According to the tutorial, Nexus runs in a [Docker](https://www.docker.com/) container, which makes the setup very simple, and you quickly have the service up and running.

If you don't know what Docker is, I recommend starting with the links on this page. It's a long road, but this technology is worth learning.

[/en/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/en/curso-docker](/en/curso-docker)

Below is a customized tutorial for starting the Nexus container with persistent data.

1) Create the Nexus data directory.

```bash
sudo mkdir -p /docker/nexus/data;
sudo chown -R 200 /docker/nexus/data;
```

2) Start the Nexus Docker container.

```bash
docker run -d -p 8081:8081 --name nexus -v /docker/nexus/data:/nexus-data sonatype/nexus3
```

3) You can view the log with one of the commands below.

```bash
docker logs -f nexus

# or

tail -f /docker/nexus/data/log/nexus.log
```

4) Wait for the service to start. According to the documentation at [https://github.com/sonatype/docker-nexus3](https://github.com/sonatype/docker-nexus3), this can take 2 to 3 minutes. You can check whether the service is responding with the command below.

```bash
curl http://localhost:8081/
```

5) Get the initial Nexus password:

```bash
sudo cat /docker/nexus/data/admin.password
```

6) Access Nexus at **http://IP-Servidor:8081**. The login is **admin**, and the default password is the output of the previous command.

7) To stop the container, just run the command below.

```bash
docker stop nexus
```

8) To start it again, run the command below.

```bash
docker start nexus
```

For more information about Nexus and how to configure it, check out the links below.

[https://help.sonatype.com/en/sonatype-nexus-repository.html](https://help.sonatype.com/en/sonatype-nexus-repository.html)

[https://github.com/sonatype/docker-nexus3](https://github.com/sonatype/docker-nexus3)

To run Nexus with HTTPS in Docker, follow the instructions in this tutorial:

[https://help.sonatype.com/en/configuring-ssl.html](https://help.sonatype.com/en/configuring-ssl.html)

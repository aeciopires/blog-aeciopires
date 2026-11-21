---
title: "Installing Redmine with Docker"
slug: "redmine-docker"
date: 2017-08-16T11:11:54-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["containers", "docker", "mysql", "redmine"]
description: "This GitHub repository has a tutorial for running Redmine on Docker."
sourceHash: "f132ddb94967a6cd"
---

{{< figure src="/wp-content/uploads/2017/08/redmine_docker.png" alt="redmine_docker" >}}

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested with `mysql:8` (8.4.13) and `redmine:7` (7.0.3): installation, access to the web interface, backup with `mysqldump`, and restore. No changes were needed.
{{< /alert >}}

This [GitHub repository](https://github.com/docker-library/redmine) has a tutorial for running [Redmine](http://www.redmine.org/) on Docker.

According to the tutorial, Redmine runs in a [Docker](https://www.docker.com/) container, which makes the installation very simple and gets the service up and running quickly.

If you don't know what Docker is, I recommend starting with the links on this page. It's a long road, but this technology is worth learning.

[/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/curso-docker/](/en/curso-docker/)

Below is the customized tutorial for starting the Redmine and MySQL containers with persistent data.

1) Create the MySQL data directory.

```bash
sudo mkdir -p /docker/redmine/mysql/data;
sudo chown -R 999:999 /docker/redmine/mysql/data/
```

2) Create the Redmine data, plugins, and themes directories.

```bash
sudo mkdir -p /docker/redmine/data;
sudo mkdir -p /docker/redmine/plugins;
sudo mkdir -p /docker/redmine/themes;
sudo chmod -R 775 /docker/redmine;
```

3) Start the [MySQL](https://hub.docker.com/_/mysql/) Docker container with the database for Redmine.

```text
MYSQL_VERSION="8";docker run -d --name mysql-redmine \
--restart always \
-p 3306:3306 \
-v /docker/redmine/mysql/data:/var/lib/mysql \
-e MYSQL_HOST=172.17.0.1 \
-e MYSQL_ROOT_PASSWORD=secret \
-e MYSQL_DATABASE=redmine \
-e MYSQL_USER=redmine \
-e MYSQL_PASSWORD=redmine \
-e MYSQL_ROOT_HOST='%' \
mysql:$MYSQL_VERSION --mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_bin
```

4) Start the [Redmine](https://hub.docker.com/_/redmine/) Docker container, pointing it to the database created in MySQL.

```bash
REDMINE_VERSION="7";

docker run -d --name redmine \
 -p 3001:3000 \
 -v /docker/redmine/data:/usr/src/redmine/files \
 -v /docker/redmine/plugins:/usr/src/redmine/plugins \
 -v /docker/redmine/themes:/usr/src/redmine/themes \
 -e REDMINE_DB_MYSQL=172.17.0.1 \
 -e REDMINE_DB_PORT=3306 \
 -e REDMINE_DB_USERNAME=redmine \
 -e REDMINE_DB_PASSWORD=redmine \
 -e REDMINE_DB_DATABASE=redmine \
 -e REDMINE_DB_ENCODING=utf8 \
 redmine:$REDMINE_VERSION
```

5) You can view the logs with the commands below.

```bash
docker logs redmine;
docker logs mysql-redmine
```

6) Wait about 5 minutes for Redmine to start. Access Redmine at **http://IP-Servidor:3001**. The login is **admin** and the default password is **admin**.

7) To stop the container, just run the command below.

```bash
docker stop redmine;
docker stop mysql-redmine
```

8) To start it again, run the command below.

```bash
docker start mysql-redmine;
docker start redmine
```

For more information about Redmine and how to configure it, see the links below.

[http://www.redmine.org/](http://www.redmine.org/)

[http://www.redmine.org/projects/redmine/wiki/Guide](http://www.redmine.org/projects/redmine/wiki/Guide)

[https://hub.docker.com/\_/redmine/](https://hub.docker.com/_/redmine/)

[https://hub.docker.com/\_/mysql/](https://hub.docker.com/_/mysql/)

If you need to dump all the databases of the MySQL container created earlier, use the command below.

```bash
docker exec mysql-redmine sh -c 'exec mysqldump redmine -uroot -p"$MYSQL_ROOT_PASSWORD"' > /home/redmine.sql
```

Keep in mind that the database data is persisted in the **/docker/redmine/mysql/data** directory of the Docker host where the container is running.

If you need to restore the dump, use the commands below.

Drop the old database and create it again.

```text
docker exec -i -t mysql-redmine /bin/bash

root@4f39b60a2dde:/# mysql -u root -p
Enter password:

mysql> drop database redmine;
mysql> create database redmine;
mysql> quit

root@4f39b60a2dde:/# exit
```

Restore the dump into the new database.

```bash
docker stop redmine;
docker exec -i mysql-redmine /usr/bin/mysql -uroot -psecret --database=redmine < /home/redmine.sql;
docker start redmine

# ou

docker stop redmine;
cat /home/redmine.sql | docker exec mysql-redmine sh -c 'exec /usr/bin/mysql -u root --password="$MYSQL_ROOT_PASSWORD" redmine';
docker start redmine
```

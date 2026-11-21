---
title: "Installing WordPress via Docker"
slug: "instalando-o-wordpress-via-docker"
date: 2017-09-21T11:22:11-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["docker", "mysql", "wordpress"]
description: "This Docker Hub page has a lot of information about the official WordPress images for Docker."
sourceHash: "4c1e47596306aaf1"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested with `mysql:9.7` and `wordpress:7.1` (WordPress 7.1.5): installation, backup with `mysqldump`, and restore. No changes were needed.
{{< /alert >}}

This [Docker Hub](https://hub.docker.com/_/wordpress) page has a lot of information about the official [WordPress](https://br.wordpress.com) images for Docker.

In this tutorial, WordPress runs in a [Docker](https://www.docker.com/) container, which makes the installation very simple and gets the service up and running quickly.

If you don't know what Docker is, I recommend starting with the links on this page. It's a long road, but this technology is worth learning.

[/en/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/en/curso-docker](/en/curso-docker)

Below is the customized tutorial to start the WordPress and MySQL containers with persistent data.

1) Create the MySQL data directory.

```bash
sudo mkdir -p /docker/mysql/wordpress/data
```

2) Start the MySQL Docker container with the database for WordPress.

```bash
docker run -d --name mysql-wordpress \
 -p 3306:3306 \
 -v /docker/mysql/wordpress/data:/var/lib/mysql \
 -e MYSQL_ROOT_PASSWORD=secret \
 -e MYSQL_DATABASE=wordpress \
 -e MYSQL_USER=wordpress \
 -e MYSQL_PASSWORD=wordpress \
 mysql:9.7
```

3) Start the WordPress Docker container, connecting to the database created in MySQL.

```bash
docker run -d --name wordpress \
 -p 80:80 \
 -e WORDPRESS_DB_HOST="IP-DOCKER-HOST:3306" \
 -e WORDPRESS_DB_USER="wordpress" \
 -e WORDPRESS_DB_PASSWORD="wordpress" \
 -e WORDPRESS_DB_NAME="wordpress" \
 wordpress:7.1
```

4) You can view the logs with the commands below.

```bash
docker logs wordpress;
docker logs mysql-wordpress
```

5) Access WordPress at the URL **http://IP-Servidor (with HTTP).**

6) If you want to stop the containers, just run the commands below.

```bash
docker stop wordpress;
docker stop mysql-wordpress
```

7) To start them again, run the commands below.

```bash
docker start mysql-wordpress;
docker start wordpress
```

For more information about WordPress and how to configure it, check the links below.

[https://developer.wordpress.org](https://developer.wordpress.org)

[https://wordpress.org/documentation](https://wordpress.org/documentation)

[https://hub.docker.com/\_/mysql/](https://hub.docker.com/_/mysql/)

[https://hub.docker.com/\_/wordpress/](https://hub.docker.com/_/wordpress/)

8) If you need to dump the wordpress database from the MySQL container created earlier, use the command below.

```bash
docker exec mysql-wordpress sh -c 'exec mysqldump wordpress -uroot -p"secret"' > /home/wordpress.sql
```

Remember that the database data is persisted in the **/docker/mysql/wordpress/data** directory on the Docker host where the container is running.

If you need to restore the dump, use the commands below.

Drop the old database and create it again.

```text
docker exec -i -t mysql-wordpress /bin/bash

root@4f39b60a2dde:/# mysql -u root -p
Enter password:

mysql> drop database wordpress;
mysql> create database wordpress;
mysql> quit

root@4f39b60a2dde:/# exit
```

Restore the dump into the new database.

```bash
docker stop wordpress;
docker exec -i mysql-wordpress /usr/bin/mysql -uroot -psecret --database=wordpress < /home/wordpress.sql;
docker start wordpress;

# or

docker stop wordpress;
cat /home/wordpress.sql | docker exec mysql-wordpress sh -c 'exec /usr/bin/mysql -u root --password="secret" wordpress';
docker start wordpress;
```

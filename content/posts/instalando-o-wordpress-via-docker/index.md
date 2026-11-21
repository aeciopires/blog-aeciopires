---
title: "Instalando o Wordpress via Docker"
slug: "instalando-o-wordpress-via-docker"
date: 2017-09-21T11:22:11-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["docker", "mysql", "wordpress"]
description: "Nesta página do Docker Hub tem várias informações acerca das imagens oficiais do Wordpress no Docker."
wp_id: 1552
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** comandos testados com `mysql:9.7` e `wordpress:7.1` (WordPress 7.1.5): instalação, backup com `mysqldump` e restauração. Nenhuma alteração foi necessária.
{{< /alert >}}

Nesta página do [Docker Hub](https://hub.docker.com/_/wordpress) tem várias informações acerca das imagens oficiais do [WordPress](https://br.wordpress.com) no Docker.

Segundo este tutorial, o WordPress é executado usando um conteiner [Docker](https://www.docker.com/), o que deixa a instalação bem simples e rapidamente você tem o serviço funcionando.

Se você não sabe o que é Docker, recomendo começar lendo os links desta página. É um longo caminho, mas vale a pena conhecer essa tecnologia.

[/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também dou curso de Docker: [/curso-docker](/curso-docker)

Abaixo tem o tutorial customizado para iniciar o conteiner WordPress e MySQL persistindo os dados.

1) Crie o diretório de dados do MySQL.

```bash
sudo mkdir -p /docker/mysql/wordpress/data
```

2) Inicie o conteiner docker do MySQL com o banco de dados para o WordPress.

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

3) Inicie o conteiner docker do WordPress acessando o banco de dados criado no MySQL.

```bash
docker run -d --name wordpress \
 -p 80:80 \
 -e WORDPRESS_DB_HOST="IP-DOCKER-HOST:3306" \
 -e WORDPRESS_DB_USER="wordpress" \
 -e WORDPRESS_DB_PASSWORD="wordpress" \
 -e WORDPRESS_DB_NAME="wordpress" \
 wordpress:7.1
```

4) O log pode ser visualizado com os comandos abaixo.

```bash
docker logs wordpress;
docker logs mysql-wordpress
```

5) Acesse o WordPress na URL **http://IP-Servidor (com HTTP).**

6) Se quiser parar o conteiner, é só executar o comando abaixo.

```bash
docker stop wordpress;
docker stop mysql-wordpress
```

7) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start mysql-wordpress;
docker start wordpress
```

Para mais informações sobre o WordPress e sobre como configurá-lo, acesse os links abaixo.

[https://developer.wordpress.org](https://developer.wordpress.org)

[https://wordpress.org/documentation](https://wordpress.org/documentation)

[https://hub.docker.com/\_/mysql/](https://hub.docker.com/_/mysql/)

[https://hub.docker.com/\_/wordpress/](https://hub.docker.com/_/wordpress/)

8) Se precisar fazer o dump do banco de dados wordpress do conteiner MySQL criado anteriormente, use o comando abaixo.

```bash
docker exec mysql-wordpress sh -c 'exec mysqldump wordpress -uroot -p"secret"' > /home/wordpress.sql
```

Lembrando que os dados do banco são persistidos no diretório **/docker/mysql/wordpress/data** do Docker Host no qual o conteiner está sendo executado.

Se precisar restaurar o dump, use os comandos abaixo.

Remova o banco antigo e crie-o novamente.

```text
docker exec -i -t mysql-wordpress /bin/bash

root@4f39b60a2dde:/# mysql -u root -p
Enter password:

mysql> drop database wordpress;
mysql> create database wordpress;
mysql> quit

root@4f39b60a2dde:/# exit
```

Restaure o dump no banco novo.

```bash
docker stop wordpress;
docker exec -i mysql-wordpress /usr/bin/mysql -uroot -psecret --database=wordpress < /home/wordpress.sql;
docker start wordpress;

# ou

docker stop wordpress;
cat /home/wordpress.sql | docker exec mysql-wordpress sh -c 'exec /usr/bin/mysql -u root --password="secret" wordpress';
docker start wordpress;
```

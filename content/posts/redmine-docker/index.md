---
title: "Instalando o Redmine via Docker"
slug: "redmine-docker"
date: 2017-08-16T11:11:54-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["containers", "docker", "mysql", "redmine"]
description: "Neste repositório do GitHub tem um tutorial para executar o Redmine no Docker."
wp_id: 1490
---

{{< figure src="/wp-content/uploads/2017/08/redmine_docker.png" alt="redmine_docker" >}}

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** comandos testados com `mysql:8` (8.4.13) e `redmine:7` (7.0.3): instalação, acesso à interface, backup com `mysqldump` e restauração. Nenhuma alteração foi necessária.
{{< /alert >}}

Neste [repositório do GitHub](https://github.com/docker-library/redmine) tem um tutorial para executar o [Redmine](http://www.redmine.org/) no Docker.

Segundo o tutorial, o Redmine é executado usando um conteiner [Docker](https://www.docker.com/), o que deixa a instalação bem simples e rapidamente você tem o serviço funcionando.

Se você não sabe o que é Docker, recomendo começar lendo os links desta página. É um longo caminho, mas vale a pena conhecer essa tecnologia.

[/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também dou curso de Docker: [/curso-docker](/curso-docker)

Abaixo tem o tutorial customizado para iniciar o conteiner Redmine e MySQL persistindo os dados.

1) Crie o diretório de dados do MySQL.

```bash
sudo mkdir -p /docker/redmine/mysql/data;
sudo chown -R 999:999 /docker/redmine/mysql/data/
```

2) Crie o diretório de dados, plugins e temas do Redmine.

```bash
sudo mkdir -p /docker/redmine/data;
sudo mkdir -p /docker/redmine/plugins;
sudo mkdir -p /docker/redmine/themes;
sudo chmod -R 775 /docker/redmine;
```

3) Inicie o conteiner docker do [MySQL](https://hub.docker.com/_/mysql/) com o banco de dados para o Redmine.

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

4) Inicie o conteiner docker do [Redmine](https://hub.docker.com/_/redmine/) acessando o banco de dados criado no MySQL.

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

5) O log pode ser visualizado com os comandos abaixo.

```bash
docker logs redmine;
docker logs mysql-redmine
```

6) Aguarde uns 5 minutos até o Redmine iniciar. Acesse o Redmine na URL **http://IP-Servidor:3001**. O login é **admin** e a senha padrão é **admin**.

7) Se quiser parar o conteiner, é só executar o comando abaixo.

```bash
docker stop redmine;
docker stop mysql-redmine
```

8) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start mysql-redmine;
docker start redmine
```

Para mais informações sobre o Redmine e sobre como configurá-lo, acesse os links abaixo.

[http://www.redmine.org/](http://www.redmine.org/)

[http://www.redmine.org/projects/redmine/wiki/Guide](http://www.redmine.org/projects/redmine/wiki/Guide)

[https://hub.docker.com/\_/redmine/](https://hub.docker.com/_/redmine/)

[https://hub.docker.com/\_/mysql/](https://hub.docker.com/_/mysql/)

Se precisar fazer o dump de todos os bancos de dados do conteiner MySQL criado anteriormente, use o comando abaixo.

```bash
docker exec mysql-redmine sh -c 'exec mysqldump redmine -uroot -p"$MYSQL_ROOT_PASSWORD"' > /home/redmine.sql
```

Lembrando que os dados do banco são persistidos no diretório **/docker/redmine/mysql/data** do Docker Host no qual o conteiner está sendo executado.

Se precisar restaurar o dump, use os comandos abaixo.

Remova o banco antigo e crie-o novamente.

```text
docker exec -i -t mysql-redmine /bin/bash

root@4f39b60a2dde:/# mysql -u root -p
Enter password:

mysql> drop database redmine;
mysql> create database redmine;
mysql> quit

root@4f39b60a2dde:/# exit
```

Restaure o dump no banco novo.

```bash
docker stop redmine;
docker exec -i mysql-redmine /usr/bin/mysql -uroot -psecret --database=redmine < /home/redmine.sql;
docker start redmine

# ou

docker stop redmine;
cat /home/redmine.sql | docker exec mysql-redmine sh -c 'exec /usr/bin/mysql -u root --password="$MYSQL_ROOT_PASSWORD" redmine';
docker start redmine
```

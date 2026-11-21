---
title: "Installing Zabbix via Docker"
slug: "zabbix-docker"
date: 2017-08-16T16:39:55-03:00
lastmod: 2026-11-21T13:11:13-03:00
draft: false
categories: ["docker", "tutoriais", "zabbix-2"]
tags: ["docker", "mysql", "zabbix"]
description: "This GitHub repository has a lot of information about using the official Zabbix images on Docker."
sourceHash: "5dc1f842fb61547a"
---

{{< alert icon="circle-info" >}}
**Updated on November 21, 2026:** fixed the text about `openssl dhparam`: the command generates Diffie-Hellman parameters, not a key pair.
{{< /alert >}}

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** tested with the `ubuntu-8.0-latest` images (Zabbix 8.0.0) and MySQL 9.7 (Zabbix 8.0 supports MySQL 8.4 to 9.7): database, SNMP traps, server, frontend with HTTP and HTTPS, agent and proxy. Fixed the text about the certificate validity (the command generates 10 years, not 1000), and the private key permission changed to `644` (the frontend runs as a non-root user and only needs to read the file).
{{< /alert >}}

This [GitHub repository](https://github.com/zabbix/zabbix-docker/) has a lot of information about using the official [Zabbix](http://zabbix.com) images on Docker.

The official instructions for installing Zabbix with Docker are available at: [https://www.zabbix.com/documentation/current/en/manual/installation/containers](https://www.zabbix.com/documentation/current/en/manual/installation/containers)

If you don't know what Docker is, I recommend starting with the links below. This technology is well worth getting to know.

[/en/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/en/curso-docker](/en/curso-docker)

* * *

This tutorial shows how to run Zabbix using [Docker](https://www.docker.com/) containers, which makes the installation very simple and fast. It shows how to start the Zabbix and MySQL containers with persistent data.

0) Install Docker by following one of the tutorials below.

- On Ubuntu: [https://docs.docker.com/engine/install/ubuntu](https://docs.docker.com/engine/install/ubuntu)
- On Debian: [https://docs.docker.com/engine/install/debian](https://docs.docker.com/engine/install/debian)
- On CentOS: [https://docs.docker.com/engine/install/centos](https://docs.docker.com/engine/install/centos)

1) Create directories to persist the MySQL data, MIBs and SNMP Traps.

```bash
sudo mkdir -p /docker/zabbix/mysql/data \
 /docker/zabbix/snmptraps \
 /docker/zabbix/mibs

sudo chown -R 999:999 /docker/zabbix/mysql/data/
```

**Attention:** The volume allows you to add new MIB ( _Management Information Bases_) files. This volume doesn't support subdirectories; all MIB files must be placed in **/docker/zabbix/mibs**. Source: [https://www.zabbix.com/documentation/current/en/manual/installation/containers](https://www.zabbix.com/documentation/current/en/manual/installation/containers)

2) **OPTIONAL** \- Create the certificate directory to use Zabbix over HTTPS (this is recommended for security reasons).

```bash
sudo mkdir -p /docker/zabbix/ssl
```

After that, **copy the certificate, certificate authority, and public and private key files to this directory**.

3) Download the [Docker images of some Zabbix components](https://hub.docker.com/u/zabbix). Change the values according to the needs of your environment.

```text
ZABBIX_VERSION="ubuntu-8.0-latest"
MYSQL_VERSION="9.7"
```

4) Create a Docker virtual network dedicated to the Zabbix components. Change the values according to the needs of your environment.

```bash
ZABBIX_SUBNET="172.50.0.0/16"
ZABBIX_IP_RANGE="172.50.240.0/20"

docker network create --subnet ${ZABBIX_SUBNET} --ip-range ${ZABBIX_IP_RANGE} zabbix-net

docker network inspect zabbix-net
```

5) Start the MySQL Docker container, creating the database for Zabbix. Change the values according to the needs of your environment.

```bash
docker run -d --name zabbix-mysql \
 --restart always \
 -p 3306:3306 \
 -v /docker/zabbix/mysql/data:/var/lib/mysql \
 -e MYSQL_ROOT_PASSWORD=secret \
 -e MYSQL_DATABASE=zabbix \
 -e MYSQL_USER=zabbix \
 -e MYSQL_PASSWORD=zabbix \
 --network=zabbix-net \
 mysql:${MYSQL_VERSION} \
 --character-set-server=utf8mb4 \
 --collation-server=utf8mb4_bin
```

To view the log, use the following command.

```bash
docker logs -f zabbix-mysql
```

6) Start the Zabbix SNMP Trap Docker container. Change the values according to the needs of your environment.

```bash
docker run -d --name zabbix-snmptraps -t \
 --restart always \
 -p 162:1162/udp \
 -v /docker/zabbix/snmptraps:/var/lib/zabbix/snmptraps:rw \
 -v /docker/zabbix/mibs:/usr/share/snmp/mibs:ro \
 --network=zabbix-net \
 zabbix/zabbix-snmptraps:${ZABBIX_VERSION}
```

To view the log, use the following command.

```bash
docker logs -f zabbix-snmptraps
```

7) Start the Zabbix-Server Docker container. Change the values according to the needs of your environment.

```bash
docker run -d --name zabbix-server \
 --restart always \
 -p 10051:10051 \
 -e DB_SERVER_HOST="zabbix-mysql" \
 -e DB_SERVER_PORT="3306" \
 -e MYSQL_ROOT_PASSWORD="secret" \
 -e MYSQL_DATABASE="zabbix" \
 -e MYSQL_USER="zabbix" \
 -e MYSQL_PASSWORD="zabbix" \
 -e ZBX_ENABLE_SNMP_TRAPS="true" \
 --network=zabbix-net \
 --volumes-from zabbix-snmptraps \
 zabbix/zabbix-server-mysql:${ZABBIX_VERSION}
```

To view the log, use the following command.

```bash
docker logs -f zabbix-server
```

8) Start the Zabbix-Web container **WITHOUT HTTPS**. Change the values according to the needs of your environment.

```bash
docker run -d --name zabbix-web \
 --restart always \
 -p 80:8080 \
 -e ZBX_SERVER_HOST="zabbix-server" \
 -e DB_SERVER_HOST="zabbix-mysql" \
 -e DB_SERVER_PORT="3306" \
 -e MYSQL_ROOT_PASSWORD="secret" \
 -e MYSQL_DATABASE="zabbix" \
 -e MYSQL_USER="zabbix" \
 -e MYSQL_PASSWORD="zabbix" \
 -e PHP_TZ="America/Sao_Paulo" \
 --network=zabbix-net \
 zabbix/zabbix-web-nginx-mysql:${ZABBIX_VERSION}
```

Or start the Zabbix-Web Docker container **WITH HTTPS**, accessing the database created in MySQL and the Zabbix-Server container. Change the values according to the needs of your environment.

NOTE: At the end of this tutorial, there is the **EXTRA: Creating a self-signed certificate for use with Nginx** section, which can be used as an example to configure Nginx with HTTPS.

```bash
docker run -d --name zabbix-web \
 --restart always \
 -p 80:8080 -p 443:8443 \
 -v /docker/zabbix/ssl/ssl.crt:/etc/ssl/nginx/ssl.crt \
 -v /docker/zabbix/ssl/ssl.key:/etc/ssl/nginx/ssl.key \
 -v /docker/zabbix/ssl/dhparam.pem:/etc/ssl/nginx/dhparam.pem \
 -e ZBX_SERVER_HOST="zabbix-server" \
 -e DB_SERVER_HOST="zabbix-mysql" \
 -e DB_SERVER_PORT="3306" \
 -e MYSQL_ROOT_PASSWORD="secret" \
 -e MYSQL_DATABASE="zabbix" \
 -e MYSQL_USER="zabbix" \
 -e MYSQL_PASSWORD="zabbix" \
 -e PHP_TZ="America/Sao_Paulo" \
 --network=zabbix-net \
 zabbix/zabbix-web-nginx-mysql:${ZABBIX_VERSION}
```

To view the log, use the following command.

```bash
docker logs -f zabbix-web
```

9) Start the Zabbix-Agent Docker container. Change the values according to the needs of your environment.

```bash
docker run -d --name zabbix-agent \
 --hostname "$(hostname)" \
 --privileged \
 -v /:/rootfs \
 -v /var/run:/var/run \
 --restart always \
 -p 10050:10050 \
 -e ZBX_HOSTNAME="$(hostname)" \
 -e ZBX_SERVER_HOST="172.17.0.1" \
 -e ZBX_PASSIVESERVERS="${ZABBIX_IP_RANGE}" \
 zabbix/zabbix-agent:${ZABBIX_VERSION}
```

To view the log, use the following command.

```bash
docker logs -f zabbix-agent
```

10) **OPTIONAL** \- Start the Zabbix-Proxy Docker container. Change the values according to the needs of your environment.

```bash
docker run -d --name zabbix-proxy \
 --restart always \
 -p 10053:10050 \
 -e ZBX_HOSTNAME="$(hostname)" \
 -e ZBX_SERVER_HOST="zabbix-server" \
 -e ZBX_ENABLE_SNMP_TRAPS="true" \
 --network=zabbix-net \
 --volumes-from zabbix-snmptraps \
 zabbix/zabbix-proxy-sqlite3:${ZABBIX_VERSION}
```

To view the log, use the following command.

```bash
docker logs -f zabbix-proxy
```

11) Access Zabbix at the URL **http://IP-Servidor (with HTTP) or https://IP-Servidor (with HTTPS)**. The login is **Admin** and the default password is **zabbix**.

Remember to register the Zabbix Proxy and the Host with the Zabbix Agent installed.

12) If you want to stop the container, just run the following command.

```bash
docker stop nome-conteiner
```

13) To start it again, run the following command.

```bash
docker start nome-conteiner
```

14) To remove a container, use the following commands.

```bash
docker stop nome-conteiner
docker rm nome-conteiner
```

15) For more information about Zabbix, the Docker images and how to customize configuration parameters, see the links below.

[https://scaron.info/blog/improve-your-nginx-ssl-configuration.html](https://scaron.info/blog/improve-your-nginx-ssl-configuration.html)

[http://zabbixbrasil.org/?page\_id=7](http://zabbixbrasil.org/?page_id=7)

[https://blog.zabbix.com/zabbix-docker-containers/7150/](https://blog.zabbix.com/zabbix-docker-containers/7150/)

[https://www.youtube.com/watch?v=ScKlF0ICVYA](https://www.youtube.com/watch?v=ScKlF0ICVYA)

[https://www.zabbix.com/documentation/current/manual/installation/containers](https://www.zabbix.com/documentation/current/manual/installation/containers)

16) **OPTIONAL** \- If you need to dump all the databases of the MySQL container created earlier, use the command below. Change the values according to the needs of your environment. Keep in mind that the database data is persisted in the **/docker/zabbix/mysql/data** directory of the Docker Host where the container is running.

```bash
docker exec zabbix-mysql sh -c 'exec mysqldump zabbix -uroot -p"MYSQL_ROOT_PASSWORD"' > /home/zabbix.sql
```

17) **OPTIONAL** \- If you need to restore the dump, follow the steps below.

Drop the old database and create it again.

```text
docker exec -i -t zabbix-mysql /bin/bash

root@4f39b60a2dde:/# mysql -u root -p
Enter password:

mysql> drop database zabbix;
mysql> create database zabbix;
mysql> quit

root@4f39b60a2dde:/# exit
```

Restore the dump into the new database. Change the values according to the needs of your environment.

```bash
docker stop zabbix-web
docker stop zabbix-server

docker exec -i zabbix-mysql /usr/bin/mysql -uroot -pMYSQL_ROOT_PASSWORD --database=zabbix < /home/zabbix.sql

docker start zabbix-server
docker start zabbix-web
```

Or:

```bash
docker stop zabbix-web
docker stop zabbix-server

cat /home/zabbix.sql | docker exec zabbix-mysql sh -c 'exec /usr/bin/mysql -u root --password="MYSQL_ROOT_PASSWORD" zabbix'

docker start zabbix-server
docker start zabbix-web
```

## EXTRA: Creating a self-signed certificate for use with Nginx

Install the **openssl** package.

On Debian/Ubuntu:

```bash
sudo apt-get -y install openssl
```

On CentOS:

```bash
sudo yum install -y openssl
```

Now create an RSA private key. Run the commands below. You'll need to set a password for the private key.

```bash
sudo mkdir -p /docker/zabbix/ssl
cd /docker/zabbix/ssl
sudo openssl genrsa -aes256 -out ssl.key 4096

sudo cp ssl.key ssl.key.org
sudo openssl rsa -in ssl.key.org -out ssl.key

sudo chmod 644 ssl.key
sudo rm ssl.key.org
```

Now create a certificate signing request. Run the command below.

```bash
sudo openssl req -new -sha256 -key ssl.key -out ssl.csr
```

While the command above runs, you'll be asked for the certificate data, which will be displayed in the user's browser. See the example below.

- Country Name (2 letter code) [GB]: **BR**
- State or Province Name (full name) [Berkshire]: **State**
- Locality Name (eg, city) [Newbury]: **City**
- Organization Name (eg, company) [My Company Ltd]: **My Company Ltd**
- Organizational Unit Name (eg, section) []: **My department**
- Common Name (eg, your name or your server’s hostname) []: **nomeservidor.empresa.com.br**
- Email Address []: **email@empresa.com.br**
- Please enter the following ‘extra’ attributes
- to be sent with your certificate request
- A challenge password []: **(leave it empty by pressing ENTER)**
- An optional company name []: **(leave it empty by pressing ENTER)**

Now sign the certificate.

```bash
sudo openssl x509 -req -days 3650 -sha256 -in ssl.csr -signkey ssl.key -out ssl.crt
```

With the command above, you'll sign the certificate with a validity of 10 years (approximately 3650 days). If you want to change this period, change the number of days in the **-days** parameter.

Now create the Diffie-Hellman parameters with the following command:

```bash
sudo openssl dhparam -out dhparam.pem 4096
```

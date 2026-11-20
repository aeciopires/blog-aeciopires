---
title: "Instalando o Graylog via Docker"
slug: "graylog-docker"
date: 2017-09-26T11:22:29-03:00
lastmod: 2026-10-07T11:45:07-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["docker", "graylog"]
description: "Nesta página do Graylog tem várias informações acerca da instalação do Graylog usando imagens Docker. O arquivo de exemplo usado neste tutorial (…"
wp_id: 1557
---

**Atualizado em: 7 de outubro de 2026**

Nesta página do [Graylog](https://go2docs.graylog.org/5-2/downloading_and_installing_graylog/docker_installation.htm) tem várias informações acerca da instalação do Graylog usando imagens Docker. O arquivo de exemplo usado neste tutorial ( **open-core**) usa imagens Docker do Graylog, do Graylog Data Node e do MongoDB.

Segundo este tutorial, o Graylog é executado usando um conteiner [Docker,](https://www.docker.com/) o que deixa a instalação bem simples e rapidamente você tem o serviço funcionando.

Se você não sabe o que é Docker, recomendo começar lendo os links desta página. É um longo caminho, mas vale a pena conhecer essa tecnologia.

[/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também dou curso de Docker: [/curso-docker](/curso-docker)

Antes de começar… instale o Docker e o plugin Docker Compose seguindo a documentação oficial: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/) e [https://docs.docker.com/compose/install/linux/](https://docs.docker.com/compose/install/linux/). No Ubuntu/Debian, com o repositório do Docker configurado, o plugin pode ser instalado com os seguintes comandos:

```bash
sudo apt-get update;

sudo apt-get install docker-compose-plugin;

docker compose version
```

0) Crie o diretório do Graylog e baixe os arquivos `docker-compose.yml` e `.env.example` do repositório oficial.

```bash
sudo mkdir -p /docker/graylog;

cd /docker/graylog;

sudo curl -sSL -o docker-compose.yml https://raw.githubusercontent.com/Graylog2/docker-compose/main/open-core/docker-compose.yml;

sudo curl -sSL -o .env https://raw.githubusercontent.com/Graylog2/docker-compose/main/open-core/.env.example
```

**A versão usada neste tutorial foi a 7.1**, mais precisamente o open-core: [https://github.com/Graylog2/docker-compose/tree/main/open-core](https://github.com/Graylog2/docker-compose/tree/main/open-core)

1) Edite o arquivo `/docker/graylog/.env` e preencha as variáveis `GRAYLOG_PASSWORD_SECRET` e `GRAYLOG_ROOT_PASSWORD_SHA2`. Segundo o README do repositório ([https://github.com/Graylog2/docker-compose](https://github.com/Graylog2/docker-compose)), o Graylog não inicia sem elas. Os comentários do próprio arquivo `.env` sugerem os comandos abaixo para gerar os valores (troque **SUA\_SENHA** pela senha que deseja usar no usuário **admin**):

```bash
# Valor para a variável GRAYLOG_PASSWORD_SECRET (no mínimo 64 caracteres)
pwgen -N 1 -s 96

# Valor para a variável GRAYLOG_ROOT_PASSWORD_SHA2
echo -n SUA_SENHA | shasum -a 256

sudo vim /docker/graylog/.env
```

2) Aumente o tamanho da quantidade de arquivos que podem ser carregados na memória com o comando abaixo. Fonte: [https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html)

```bash
sudo sysctl -w vm.max_map_count=262144;
```

3) Execute os conteiners do graylog com o seguinte comando.

```bash
cd /docker/graylog;
sudo docker compose -f docker-compose.yaml up -d
```

4) Para visualizar os logs, execute o comando abaixo.

```bash
cd /docker/graylog;
sudo docker compose -f docker-compose.yaml logs
```

Localize as linhas semelhantes as mostradas a seguir. Elas contém a senha inicial de acesso ao graylog.

```text
graylog-1   | Initial configuration is accessible at 0.0.0.0:9000, with username 'admin' and password 'ToRZLCYMgV'.
graylog-1   | Try clicking on http://admin:ToRZLCYMgV@0.0.0.0:9000
```

> Atenção!!! No arquivo `docker-compose.yml` oficial, as portas são publicadas apenas no endereço `127.0.0.1` do host (exemplo: `"127.0.0.1:9000:9000/tcp"`) e a variável `GRAYLOG_HTTP_EXTERNAL_URI` usa `http://localhost:9000/`. Ou seja, por padrão o Graylog só fica acessível a partir do próprio servidor ( **http://localhost:9000**). Para acessar a partir de outra máquina, ajuste essas configurações no `docker-compose.yml` de acordo com o seu ambiente, lembrando de proteger o acesso ao servidor.

5) Acesse o Graylog na URL **http://IP-Servidor:9000**(com HTTP). Por padrão, o login é **admin** e a senha é exibida no log, conforme mostrado no exemplo anterior. Depois de concluir a configuração inicial, entre com o usuário **admin** e a senha que você usou para gerar o valor da variável `GRAYLOG_ROOT_PASSWORD_SHA2`.**  
**

6) Se quiser parar o conteiner, é só executar os comandos abaixo.

```bash
cd /docker/graylog;
sudo docker compose stop
```

7) Para iniciá-lo novamente, execute o comando abaixo.

```bash
cd /docker/graylog;
sudo docker compose start
```

Mais informações sobre o Graylog e como configurá-lo, acesse o link abaixo.

[https://go2docs.graylog.org/current/downloading\_and\_installing\_graylog/docker\_installation.htm](https://go2docs.graylog.org/current/downloading_and_installing_graylog/docker_installation.htm)

[https://github.com/Graylog2/docker-compose](https://github.com/Graylog2/docker-compose)

---
title: "Conhecendo o Gogs"
slug: "conhecendo-o-gogs"
date: 2018-08-27T17:35:56-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["tutoriais"]
tags: ["docker", "gogs"]
description: "O Gogs é um software de código-fonte aberto que oferece uma interface web para o gerenciamento de repositórios git similar ao GitHub, GitLab e Bitbucket,…"
wp_id: 1780
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** comandos testados com `gogs/gogs:0.14` (0.14.4) e a imagem `postgres` sem tag fixa, que hoje instala o PostgreSQL 19: instalação pelo navegador, login, criação de repositório e clone. Nenhuma alteração foi necessária.
{{< /alert >}}

O [Gogs](https://gogs.io/) é um software de código-fonte aberto que oferece uma interface web para o gerenciamento de repositórios git similar ao [GitHub](http://github.com), [GitLab](http://gitlab.com) e [Bitbucket](http://www.bitbucket.org), só que muito mais simples e leve que os três anteriores. O impressionante é que um conteiner Docker do Gogs estava consumindo apenas 50 MB de memória RAM. Isso é muito bom quando você quiser hospedar repositórios git sem muita complexidade.

Conheci o Gogs em 2018 a partir de um post de [Daniel Requena no Twitter](https://twitter.com/Daniel_Requena/status/1034067717509316608).

A documentação do Gogs pode ser encontrada na página [https://gogs.io/getting-started/introduction](https://gogs.io/getting-started/introduction).

Na página [https://github.com/gogs/gogs/tree/master/docker](https://github.com/gogs/gogs/tree/master/docker) tem um tutorial de como executar o Gogs num conteiner Docker.

Abaixo vou mostrar como instalá-lo integrando ao PostgreSQL.

1) Crie o banco de dados no conteiner Docker do PostgreSQL com os comandos abaixo.

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

> Atenção!!! A partir do PostgreSQL 18, a imagem oficial `postgres` mudou o volume para `/var/lib/postgresql` (os dados ficam em um subdiretório com o número da versão, exemplo: `/var/lib/postgresql/18/docker`). Por isso, o diretório do host é montado em `/var/lib/postgresql`. Se você usar uma imagem do PostgreSQL 17 ou anterior, monte o diretório em `/var/lib/postgresql/data`. Mais detalhes na seção `PGDATA` da página [https://hub.docker.com/\_/postgres](https://hub.docker.com/_/postgres).

2) Inicie o conteiner Docker do Gogs com os comandos abaixo.

```bash
sudo mkdir -p /docker/gogs/data

docker run -d --name gogs \
  --restart=always \
  -p 10022:22 -p 80:3000 \
  -v /docker/gogs/data:/data \
  gogs/gogs:0.14
```

3) O log pode ser visualizado com os comandos abaixo.

```bash
docker logs -f gogs
```

4) Acesse o Gogs na URL **http://IP-Servidor** e preencha as informações para configurá-lo e crie também o usuário e senha de admin. Veja um exemplo na sequência de imagens abaixo.

{{< figure src="/wp-content/uploads/2018/08/gogs1.png" alt="gogs1" >}}

{{< figure src="/wp-content/uploads/2018/08/gogs2.png" alt="gogs2" >}}

{{< figure src="/wp-content/uploads/2018/08/gogs3.png" alt="gogs3" >}}

5) Depois de configurado, você será redirecionado para a página de login conforme mostra a imagem abaixo.

{{< figure src="/wp-content/uploads/2018/08/gogs4.png" alt="gogs4" >}}

6) Para criar um repositório, clique no botão **+,** conforme mostra a imagem abaixo.

{{< figure src="/wp-content/uploads/2018/08/gogs5.png" alt="gogs5" >}}

7) Preencha as informações do novo repositório.

{{< figure src="/wp-content/uploads/2018/08/gogs6.png" alt="gogs6" >}}

8) O novo repositório estará criado e disponível para uso.

{{< figure src="/wp-content/uploads/2018/08/gogs7.png" alt="gogs7" >}}

9) Se quiser parar o conteiner, é só executar o comando abaixo.

```bash
docker stop gogs
```

10) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start gogs
```

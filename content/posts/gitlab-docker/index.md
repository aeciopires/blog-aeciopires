---
title: "Instalando o GitLab via Docker"
slug: "gitlab-docker"
date: 2017-08-17T15:55:00-03:00
lastmod: 2026-10-07T08:21:06-03:00
draft: false
categories: ["docker", "git", "tutoriais"]
tags: ["containers", "docker", "git", "gitlab"]
description: "Na página https://docs.gitlab.com/install/docker/ tem várias informações a cerca das imagens Docker oficiais do GitLab (ferramenta web para…"
wp_id: 1516
---

**Atualizado em: 7 de outubro de 2026**

Na página [https://docs.gitlab.com/install/docker/](https://docs.gitlab.com/install/docker/) tem várias informações a cerca das imagens [Docker](http://docker.com) oficiais do [GitLab](https://gitlab.com) (ferramenta web para versionamento usando o Git).

Neste tutorial, o Gitlab será executado usando um único conteiner para fornecer todo o ambiente necessário para executá-lo [,](https://www.docker.com/) o que deixa a instalação bem simples e rapidamente você tem o serviço funcionando.

Segundo a documentação oficial, para uma instalação em um único node, 16 GB de memória RAM é a base recomendada e, em ambientes com pouca memória, o GitLab pode rodar com, pelo menos, 8 GB de memória RAM. A lista completa de requisitos de hardware e software está na página: [https://docs.gitlab.com/install/requirements/](https://docs.gitlab.com/install/requirements/).

Se você não sabe o que é Docker, recomendo começar lendo os links desta página. É um longo caminho, mas vale a pena conhecer essa tecnologia.

[/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também dou curso de Docker: [/curso-docker](/curso-docker)

Abaixo tem o tutorial customizado para iniciar o conteiner GitLab persistindo os dados.

1) Crie o diretório de dados, log e configuração do GitLab.

```bash
sudo mkdir -p /docker/gitlab/config \
 /docker/gitlab/logs \
 /docker/gitlab/data;
```

2) Inicie o conteiner docker do GitLab.

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

Altere o nome **gitlab.example.com** pelo nome DNS do conteiner adequado para a sua rede.

> A opção `--shm-size 256m` faz parte do comando da documentação oficial ([https://docs.gitlab.com/install/docker/installation/](https://docs.gitlab.com/install/docker/installation/)). O comando da documentação também usa uma versão específica da imagem (`<version>`) em vez da tag `latest`, o que facilita o controle de atualizações. As tags disponíveis estão em [https://hub.docker.com/r/gitlab/gitlab-ce/tags](https://hub.docker.com/r/gitlab/gitlab-ce/tags).

3) O log pode ser visualizado com os comandos abaixo.

```bash
docker logs -f gitlab
```

O serviço pode demorar até 5 minutos para ser iniciado e configurado da primeira vez. Ele estará pronto para ser acessado quando aparecer a mensagem abaixo no log.

```text
Thank you for using GitLab Docker Image!
```

4) Acesse o GitLab na URL **http://IP-Servidor (com HTTP)**. Será solicitado que crie informe o usuário root e a senha inicial criada durante a instalação.

Para obter a senha inicial do root, informe o seguinte comando:

```bash
docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

> > Segundo a documentação oficial, o arquivo com a senha inicial é removido automaticamente no primeiro reinício do conteiner após 24 horas. Troque a senha do root logo após o primeiro acesso.

5) Se quiser parar o conteiner, é só executar o comando abaixo.

```bash
docker stop gitlab
```

6) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start gitlab
```

Mais informações sobre o GitLab e como configurá-lo com suporte a HTTPS, acesse os links abaixo.

[https://docs.gitlab.com/install/docker/installation](https://docs.gitlab.com/install/docker/installation)

[https://docs.gitlab.com/omnibus/settings/ssl](https://docs.gitlab.com/omnibus/settings/ssl)

[https://hub.docker.com/r/gitlab/gitlab-ce/](https://hub.docker.com/r/gitlab/gitlab-ce/)

[https://docs.gitlab.com/install/docker/configuration](https://docs.gitlab.com/install/docker/configuration)

[https://www.tutorialspoint.com/gitlab/index.htm](https://www.tutorialspoint.com/gitlab/index.htm)

Lembrando que os dados do banco, repositórios de código, configurações e logs são persistidos no diretório **/docker/gitlab** do Docker Host no qual o conteiner está sendo executado.

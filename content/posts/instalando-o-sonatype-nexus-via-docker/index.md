---
title: "Instalando o Sonatype Nexus via Docker"
slug: "instalando-o-sonatype-nexus-via-docker"
date: 2017-08-15T17:45:45-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["docker", "maven", "nexus"]
description: "Neste repositório do GitHub tem um tutorial para executar o Sonatype Nexus (repositório de artefatos gerados pelo Apache Maven)."
wp_id: 1482
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** comandos testados com a imagem `sonatype/nexus3` (Nexus 3.98.3 Community Edition): inicialização, log, arquivo `admin.password` e login de administrador. Nenhuma alteração foi necessária.
{{< /alert >}}

{{< figure src="/wp-content/uploads/2017/08/nexus.jpg" alt="nexus" >}}

Neste [repositório do GitHub](https://github.com/sonatype/docker-nexus3) tem um tutorial para executar o [Sonatype Nexus](https://help.sonatype.com/en/sonatype-nexus-repository.html) (repositório de artefatos gerados pelo [Apache Maven](https://maven.apache.org/)).

> A partir da versão 3.77.0, a edição gratuita do Nexus Repository passou a se chamar **Sonatype Nexus Repository Community Edition**, que tem algumas limitações de uso. Mais detalhes em: [https://help.sonatype.com/en/ce-onboarding.html](https://help.sonatype.com/en/ce-onboarding.html)

Segundo o tutorial, o Nexus é executado usando um contêiner [Docker](https://www.docker.com/), o que deixa a configuração bem simples e rapidamente você tem o serviço funcionando.

Se você não sabe o que é Docker, recomendo começar lendo os links desta página. É um longo caminho, mas vale a pena conhecer essa tecnologia.

[/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também dou curso de Docker: [/curso-docker](/curso-docker)

Abaixo tem o tutorial customizado para iniciar o contêiner Nexus persistindo os dados.

1) Crie o diretório de dados do Nexus.

```bash
sudo mkdir -p /docker/nexus/data;
sudo chown -R 200 /docker/nexus/data;
```

2) Inicie o contêiner docker do Nexus.

```bash
docker run -d -p 8081:8081 --name nexus -v /docker/nexus/data:/nexus-data sonatype/nexus3
```

3) O log pode ser visualizado com um dos comandos abaixo.

```bash
docker logs -f nexus

# ou

tail -f /docker/nexus/data/log/nexus.log
```

4) Aguarde o serviço iniciar. Segundo a doc [https://github.com/sonatype/docker-nexus3](https://github.com/sonatype/docker-nexus3), isso pode levar de 2 a 3 minutos. Você pode testar se o serviço está respondendo com o comando abaixo.

```bash
curl http://localhost:8081/
```

5) Obtenha a senha inicial do Nexus:

```bash
sudo cat /docker/nexus/data/admin.password
```

6) Acesse o Nexus na URL **http://IP-Servidor:8081**. O login é **admin** e a senha padrão é o resultado do comando anterior.

7) Se quiser parar o contêiner, é só executar o comando abaixo.

```bash
docker stop nexus
```

8) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start nexus
```

Para mais informações sobre o Nexus e sobre como configurá-lo, acesse os links abaixo.

[https://help.sonatype.com/en/sonatype-nexus-repository.html](https://help.sonatype.com/en/sonatype-nexus-repository.html)

[https://github.com/sonatype/docker-nexus3](https://github.com/sonatype/docker-nexus3)

Se quiser executar o Nexus com HTTPS no Docker, siga as instruções deste tutorial:

[https://help.sonatype.com/en/configuring-ssl.html](https://help.sonatype.com/en/configuring-ssl.html)

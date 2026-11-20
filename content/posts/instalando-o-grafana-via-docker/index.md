---
title: "Instalando o Grafana via Docker"
slug: "instalando-o-grafana-via-docker"
date: 2018-06-08T12:08:14-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "grafana"]
tags: ["docker", "grafana"]
description: "Observando as páginas abaixo sobre a documentação da instalação do Grafana via Docker, foi elaborado o seguinte tutorial para instalá-lo."
wp_id: 1678
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** comandos testados com a imagem `grafana/grafana` (Grafana 13.3.1) por HTTP e por HTTPS, usando um certificado gerado como no post [Configurando o Grafana para funcionar sobre HTTPS](/configurando-o-grafana-para-funcionar-sobre-https/). Nenhuma alteração foi necessária: o `chown 472:472` deste post já garante que o Grafana consiga ler os arquivos.
{{< /alert >}}

Observando as páginas abaixo sobre a documentação da instalação do Grafana via Docker, foi elaborado o seguinte tutorial para instalá-lo.

[http://docs.grafana.org/installation/docker/](http://docs.grafana.org/installation/docker/)

[http://docs.grafana.org/installation/configuration/](http://docs.grafana.org/installation/configuration/)

Se você não sabe o que é Docker, recomendo começar lendo os links desta página. É um longo caminho, mas vale a pena conhecer essa tecnologia.

[/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também dou curso de Docker: [/curso-docker](/curso-docker)

Para instalar o Grafana e as dependências foram executados os passos abaixo.

1) Crie o diretório de dados do Grafana a serem persistidos fora do conteiner.

```bash
sudo mkdir -p /docker/grafana/data
sudo chown -R 472:472 /docker/grafana/data
sudo chmod -R 775 /docker/grafana
```

2) OPCIONAL: Para usar o Grafana com HTTPS, crie o diretório abaixo e em seguida copie a chave pública (EX.: certificado.crt) e privada (EX.: certificado.key) do certificado a ser usado.

```bash
sudo mkdir -p /docker/grafana/certs
sudo chown -R 472:472 /docker/grafana/certs
```

As permissões dos diretórios foram ajustadas para o usuário e grupo 472, porque esse é o UID e GID do usuário do Grafana executado dentro do conteiner e que precisa ter permissão nos diretórios que receberão os dados a serem persistidos fora do conteiner.

3) OPCIONAL: Inicie o conteiner docker do Grafana com suporte a HTTPS.

```bash
docker run -d --name=grafana \
 --restart always \
 -p 3000:3000 \
 -e "GF_SERVER_PROTOCOL=https" \
 -e "GF_SERVER_HTTP_PORT=3000" \
 -e "GF_SERVER_CERT_FILE=/etc/certs/server.crt" \
 -e "GF_SERVER_CERT_KEY=/etc/certs/server.key" \
 -v /docker/grafana/data:/var/lib/grafana \
 -v /docker/grafana/certs/certificado.crt:/etc/certs/server.crt \
 -v /docker/grafana/certs/certificado.key:/etc/certs/server.key \
 grafana/grafana
```

Lembre-se de alterar os nomes certificado.key e certificado.crt pelos nomes dos arquivos de certificado que você copiou no passo 2.

Ou, inicie o conteiner docker do Grafana com HTTP.

```bash
docker run -d --name=grafana \
 --restart always \
 -p 3000:3000 \
 -e "GF_SERVER_PROTOCOL=http" \
 -e "GF_SERVER_HTTP_PORT=3000" \
 -v /docker/grafana/data:/var/lib/grafana \
 grafana/grafana
```

4) O log pode ser visualizado com o comando abaixo.

```bash
docker logs grafana
```

5) Acesse o Grafana na URL **https://IP-Servidor:3000 (com HTTPS)** ou **http://IP-Servidor:3000 (com HTTP)**. O login é **admin** e a senha padrão é **admin**.

6) Se quiser parar o conteiner, é só executar o comando abaixo.

```bash
docker stop grafana
```

7) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start grafana
```

Para mais informações sobre o Grafana e sobre como configurá-lo, acesse os links abaixo.

- [http://docs.grafana.org](http://docs.grafana.org)
- [https://github.com/monitoringartist/Zabbix-Docker-Monitoring](https://github.com/monitoringartist/Zabbix-Docker-Monitoring)
- [https://hub.docker.com/r/monitoringartist/grafana-xxl/](https://hub.docker.com/r/monitoringartist/grafana-xxl/)

---
title: "Instalando o Elastic, Kibana e LogStash via Docker"
slug: "instalando-o-elastic-kibana-e-logstash-via-docker"
date: 2018-07-10T17:30:43-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker"]
tags: ["docker", "elasticsearch", "kibana", "logstash"]
description: "Nesta página do Elastic (também conhecido como ElasticSearch) tem várias informações acerca da instalação do stack ELK (Elastic, LogStash e Kibana)."
wp_id: 1708
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** testado com a versão 9.5.6 do Elasticsearch, Kibana e Logstash: redefinição da senha, token de inscrição e código de verificação do Kibana, e consulta com o certificado da CA. Correções: a variável de monitoramento do Logstash agora usa o nome que a imagem reconhece (`XPACK_MONITORING_ELASTICSEARCH_HOSTS`; com pontos no nome ela era ignorada), e o `curl` de teste usa `localhost`, o nome que o certificado gerado aceita.
{{< /alert >}}

Nesta página do [Elastic (também conhecido como ElasticSearch)](https://www.elastic.co/guide/en/elastic-stack/current/installing-elastic-stack.html) tem várias informações acerca da instalação do stack ELK (Elastic, LogStash e Kibana).

A instalação usando o [Docker](https://www.docker.com/) é bem mais simples e rápida.

Se você não sabe o que é Docker, recomendo começar lendo os links abaixo. É um longo caminho, mas vale a pena conhecer essa tecnologia.

[/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também ministro curso de Docker: [/curso-docker](/curso-docker)

0) Crie o diretório abaixo para persistir os dados dos conteiners.

```bash
sudo mkdir -p /docker/elastic/data;
sudo chmod -R g+rwx /docker/elastic;
sudo chown -R 1000:1000 /docker/elastic;
```

1) Aumente o limite de áreas de memória mapeada (`vm.max_map_count`), exigido pelo Elasticsearch, com o comando abaixo. Fonte: [https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html)

```bash
sudo sysctl -w vm.max_map_count=262144;
```

2) Inicie os conteineres do Elastic, Kibana e LogStash. Todos têm de usar o mesmo número de versão para manter compatibilidade entre os componentes. Nos comandos abaixo, troque o **IP\_SERVIDOR\_ELASTIC** pelo IP do servidor que executa o ElasticSearch.

```bash
docker network create elastic;

export VERSAO=9.5.6;

docker run -d --name elastic \
 -p 9200:9200 -p 9300:9300 \
 --restart=always \
 --net elastic \
 -e "http.host=0.0.0.0" \
 -e "discovery.type=single-node" \
 -m 1GB \
 -v /docker/elastic/data:/usr/share/elasticsearch/data \
 docker.elastic.co/elasticsearch/elasticsearch:$VERSAO;

docker run -d --name kibana \
 -p 5601:5601 \
 --restart=always \
 --net elastic \
 docker.elastic.co/kibana/kibana:$VERSAO;

docker run -d --name logstash \
 --restart=always \
 --net elastic \
 -e "XPACK_MONITORING_ELASTICSEARCH_HOSTS=https://IP_SERVIDOR_ELASTIC:9200" \
 docker.elastic.co/logstash/logstash:$VERSAO

```

> Atenção!!! Segundo a documentação do Logstash ([https://www.elastic.co/docs/reference/logstash/docker-config](https://www.elastic.co/docs/reference/logstash/docker-config)), as configurações podem ser definidas por variáveis de ambiente escritas em letras maiúsculas e com `_` como separador (exemplo: `XPACK_MONITORING_ELASTICSEARCH_HOSTS` corresponde a `xpack.monitoring.elasticsearch.hosts`, que é o nome usado no `logstash.yml` da imagem; com pontos no nome, a variável é ignorada). Como a segurança do Elasticsearch vem habilitada por padrão a partir da versão 8.0 (HTTPS e autenticação), o envio de dados do Logstash para o Elasticsearch também exige credenciais e o certificado da autoridade certificadora. Consulte a documentação para configurar o pipeline de acordo com o seu ambiente.

Fonte:

[https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic)

[https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-kibana-with-docker](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-kibana-with-docker)  
[https://www.elastic.co/guide/en/logstash/current/docker.html](https://www.elastic.co/guide/en/logstash/current/docker.html)

[https://www.elastic.co/docs/reference/logstash/docker-config](https://www.elastic.co/docs/reference/logstash/docker-config)

3) Gere uma nova senha para o usuário **elastic** e um **token** de acesso ao Kibana com os seguintes comandos:

```bash
docker exec -it elastic /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic;

docker exec -it elastic /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana
```

4) Acesse o Kibana na URL **http://IP-Servidor:5601**. Cole o **token gerado para o Kibana** e clique no botão Configure Elastic.

Durante o processo de validação do token, será solicitado um código de validação. Você pode obter esse código usando o seguinte comando:

```bash
docker exec -it kibana bin/kibana-verification-code
```

Após o Kibana ser configurado automaticamente, entre com o usuário **elastic** e a **senha gerada** para o usuário **elastic** no terminal nos passos anteriores.

Para testar o acesso à API do Elasticsearch pela linha de comando, copie o certificado da autoridade certificadora gerado na instalação e faça uma requisição HTTPS, trocando **SENHA** pela senha do usuário **elastic** (comandos da documentação oficial: [https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic)):

```bash
docker cp elastic:/usr/share/elasticsearch/config/certs/http_ca.crt .
```

```bash
curl --cacert http_ca.crt -u elastic:SENHA https://localhost:9200
```

Execute o `curl` no próprio servidor: o certificado gerado automaticamente pelo Elasticsearch só vale para `localhost`, `127.0.0.1` e o IP interno do container, como mostra a [documentação oficial](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic). Acessando pelo IP do servidor, o `curl` recusa o certificado.

5) Se quiser parar o conteiner, é só executar os comandos abaixo.

```bash
docker stop elastic;
docker stop kibana;
docker stop logstash
```

6) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start elastic;
docker start kibana;
docker start logstash
```

7) Para visualizar os logs, execute o comando abaixo.

```bash
docker logs -f elastic;
docker logs -f kibana;
docker logs -f logstash
```

Para mais informações sobre o stack ELK e sobre como configurá-lo, acesse os links abaixo.

[https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)

[https://www.elastic.co/guide/en/elastic-stack/current/installing-elastic-stack.html](https://www.elastic.co/guide/en/elastic-stack/current/installing-elastic-stack.html)

[https://www.tutorialspoint.com/elasticsearch/index.htm](https://www.tutorialspoint.com/elasticsearch/index.htm)

[https://www.elastic.co/guide/en/kibana/current/index.html](https://www.elastic.co/guide/en/kibana/current/index.html)

[https://www.elastic.co/guide/en/logstash/current/index.html](https://www.elastic.co/guide/en/logstash/current/index.html)

[https://www.tutorialspoint.com/logstash/index.htm](https://www.tutorialspoint.com/logstash/index.htm)

[https://www.elastic.co/guide/en/beats/libbeat/current/index.html](https://www.elastic.co/guide/en/beats/libbeat/current/index.html)

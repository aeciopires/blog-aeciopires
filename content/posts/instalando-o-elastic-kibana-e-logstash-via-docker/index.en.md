---
title: "Installing Elastic, Kibana, and LogStash via Docker"
slug: "instalando-o-elastic-kibana-e-logstash-via-docker"
date: 2018-07-10T17:30:43-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker"]
tags: ["docker", "elasticsearch", "kibana", "logstash"]
description: "This Elastic (also known as ElasticSearch) page has plenty of information about installing the ELK stack (Elastic, LogStash, and Kibana)."
sourceHash: "fee2838441dcbc3e"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** tested with version 9.5.6 of Elasticsearch, Kibana, and Logstash: password reset, enrollment token and Kibana verification code, and a query using the CA certificate. Fixes: the Logstash monitoring variable now uses the name the image recognizes (`XPACK_MONITORING_ELASTICSEARCH_HOSTS`; with dots in the name it was ignored), and the test `curl` uses `localhost`, the name the generated certificate accepts.
{{< /alert >}}

This [Elastic (also known as ElasticSearch)](https://www.elastic.co/guide/en/elastic-stack/current/installing-elastic-stack.html) page has plenty of information about installing the ELK stack (Elastic, LogStash, and Kibana).

Installing with [Docker](https://www.docker.com/) is much simpler and faster.

If you don't know what Docker is, I recommend starting by reading the links below. It's a long road, but this technology is worth getting to know.

[/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/curso-docker](/en/curso-docker)

0) Create the directory below to persist the containers' data.

```bash
sudo mkdir -p /docker/elastic/data;
sudo chmod -R g+rwx /docker/elastic;
sudo chown -R 1000:1000 /docker/elastic;
```

1) Increase the limit of memory map areas (`vm.max_map_count`), required by Elasticsearch, with the command below. Source: [https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html)

```bash
sudo sysctl -w vm.max_map_count=262144;
```

2) Start the Elastic, Kibana, and LogStash containers. They all have to use the same version number to keep the components compatible. In the commands below, replace **IP\_SERVIDOR\_ELASTIC** with the IP of the server running ElasticSearch.

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

> Attention!!! According to the Logstash documentation ([https://www.elastic.co/docs/reference/logstash/docker-config](https://www.elastic.co/docs/reference/logstash/docker-config)), settings can be defined through environment variables written in uppercase with `_` as the separator (example: `XPACK_MONITORING_ELASTICSEARCH_HOSTS` corresponds to `xpack.monitoring.elasticsearch.hosts`, which is the name used in the image's `logstash.yml`; with dots in the name, the variable is ignored). Since Elasticsearch security is enabled by default starting with version 8.0 (HTTPS and authentication), sending data from Logstash to Elasticsearch also requires credentials and the certificate authority's certificate. Check the documentation to configure the pipeline according to your environment.

Source:

[https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic)

[https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-kibana-with-docker](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-kibana-with-docker)  
[https://www.elastic.co/guide/en/logstash/current/docker.html](https://www.elastic.co/guide/en/logstash/current/docker.html)

[https://www.elastic.co/docs/reference/logstash/docker-config](https://www.elastic.co/docs/reference/logstash/docker-config)

3) Generate a new password for the **elastic** user and a Kibana access **token** with the following commands:

```bash
docker exec -it elastic /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic;

docker exec -it elastic /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana
```

4) Open Kibana at the URL **http://IP-Servidor:5601**. Paste the **token generated for Kibana** and click the Configure Elastic button.

While the token is being validated, you'll be asked for a verification code. You can get this code with the following command:

```bash
docker exec -it kibana bin/kibana-verification-code
```

After Kibana is configured automatically, log in with the **elastic** user and the **password generated** for the **elastic** user in the terminal in the previous steps.

To test access to the Elasticsearch API from the command line, copy the certificate authority's certificate generated during installation and make an HTTPS request, replacing **SENHA** with the **elastic** user's password (commands from the official documentation: [https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic)):

```bash
docker cp elastic:/usr/share/elasticsearch/config/certs/http_ca.crt .
```

```bash
curl --cacert http_ca.crt -u elastic:SENHA https://localhost:9200
```

Run `curl` on the server itself: the certificate generated automatically by Elasticsearch is only valid for `localhost`, `127.0.0.1`, and the container's internal IP, as shown in the [official documentation](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic). When accessing through the server's IP, `curl` rejects the certificate.

5) If you want to stop the containers, just run the commands below.

```bash
docker stop elastic;
docker stop kibana;
docker stop logstash
```

6) To start them again, run the commands below.

```bash
docker start elastic;
docker start kibana;
docker start logstash
```

7) To view the logs, run the commands below.

```bash
docker logs -f elastic;
docker logs -f kibana;
docker logs -f logstash
```

For more information about the ELK stack and how to configure it, see the links below.

[https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)

[https://www.elastic.co/guide/en/elastic-stack/current/installing-elastic-stack.html](https://www.elastic.co/guide/en/elastic-stack/current/installing-elastic-stack.html)

[https://www.tutorialspoint.com/elasticsearch/index.htm](https://www.tutorialspoint.com/elasticsearch/index.htm)

[https://www.elastic.co/guide/en/kibana/current/index.html](https://www.elastic.co/guide/en/kibana/current/index.html)

[https://www.elastic.co/guide/en/logstash/current/index.html](https://www.elastic.co/guide/en/logstash/current/index.html)

[https://www.tutorialspoint.com/logstash/index.htm](https://www.tutorialspoint.com/logstash/index.htm)

[https://www.elastic.co/guide/en/beats/libbeat/current/index.html](https://www.elastic.co/guide/en/beats/libbeat/current/index.html)

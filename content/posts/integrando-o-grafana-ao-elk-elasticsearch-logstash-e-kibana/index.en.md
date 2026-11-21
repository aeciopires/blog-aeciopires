---
title: "Integrating Grafana with ELK (Elasticsearch, Logstash, and Kibana)"
slug: "integrando-o-grafana-ao-elk-elasticsearch-logstash-e-kibana"
date: 2018-07-30T11:28:15-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["grafana", "tutoriais"]
tags: ["elasticsearch", "grafana", "kibana", "logstash"]
description: "Image description: Grafana's home dashboard with some sample graphs for different metrics."
sourceHash: "fe3f8345f5f4d32c"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** the access test was checked against Elasticsearch 9.5.6: the original command (HTTP, no password) no longer connects, and the command with HTTPS, the CA certificate, and a password works when using `localhost`, the name the generated certificate accepts. Current Grafana supports Elasticsearch 7.17 or later, 8.x, and 9.x, as already noted in the remark in step 3.
{{< /alert >}}

{{< figure src="/wp-content/uploads/2016/05/Captura-de-tela-de-2016-05-26-171923-1024x500.png" alt="Screenshot from 2016-05-26 17:19:23" >}}

Image description: Grafana's home dashboard with some sample graphs for different metrics.

This tip is for anyone looking for an elegant, easy-to-use web interface as an alternative to Kibana.

Since I already know and use Grafana integrated with Zabbix to visualize the collected data in more elegant graphs and dashboards, I did a little research and found that Grafana already has full integration with Elasticsearch through [this plugin](https://grafana.com/plugins/elasticsearch).

So, if you have Grafana installed (see this tutorial [/en/instalando-o-grafana-via-docker](/en/instalando-o-grafana-via-docker)) and also have the ELK stack installed (see this other tutorial [/en/instalando-o-elastic-kibana-e-logstash-via-docker](/en/instalando-o-elastic-kibana-e-logstash-via-docker)), you can set up the integration by following the steps in the next section.

## Integrating Grafana with ELK

1) Assuming Grafana and ELK are installed, use the command below to test access to Elasticsearch. Replace **IP\_SERVIDOR\_ELASTICSEARCH** with the correct server IP in the following command.

```bash
curl -XGET 'IP_SERVIDOR_ELASTICSEARCH:9200/_cat/indices?v&pretty'
```

> Attention!!! Starting with Elasticsearch 8.0, security is enabled by default: the API uses HTTPS with a certificate generated during installation and requires authentication. In that case, follow the installation tutorial mentioned above and use the following command (as described in the official documentation: [https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic)), replacing **SENHA** with the password of the **elastic** user:
>
> ```bash
> docker cp elastic:/usr/share/elasticsearch/config/certs/http_ca.crt .
> ```
>
> ```bash
> curl --cacert http_ca.crt -u elastic:SENHA 'https://localhost:9200/_cat/indices?v&pretty'
> ```
>
> Run this `curl` on the Elasticsearch server itself: the automatically generated certificate is only valid for `localhost`, `127.0.0.1`, and the container's internal IP.

The result should look something like this.

```text
health status index uuid pri rep docs.count docs.deleted store.size pri.store.size
yellow open .kibana tlBWNF-gQ4qvEPa2cAkkMQ 1 1 24 1 75.8kb 75.8kb
```

The previous command was used to test whether access to Elasticsearch is working.

2) Open Grafana at **http://IP\_SERVIDOR\_GRAFANA:3000** and log in (the default username and password are **admin**).

3) Add a data source in Grafana as shown in the following image.

{{< figure src="/wp-content/uploads/2018/07/grafana_elasticsearch.png" alt="grafana elasticsearch" >}}

Image description: The image has the following fields and values filled in:

- **Name:** enter the value elasticsearch.
- **Type:** the value is Elasticsearch (the plugin used in the integration)
- **URL** (in the HTTP section): enter http://IP\_ELASTICSEARCH:9200 (the default Elasticsearch port)
- **Access** (in the HTTP section): the value is Server (Default).
- The **Auth** section has the fields: **Basic Auth, With credentials, TLS client auth, With CA cert, and Skip TLS Verification (insecure).** In my case, these fields were left empty, but if the Elasticsearch service is exposed through an HTTP proxy server and/or uses a self-signed certificate, these fields need to be filled in to avoid connectivity problems.
- In the **ElasticSearch details** section, the following fields were filled in:
  - **Index name**: the index name, which in my case was set to **logstash-\*.** Change it according to your environment.
  - **Time field name**: set to @timestamp. This is the index field that holds the timestamp of when each record was stored.
  - **Version**: the Elasticsearch version in use. In my case, it was 5.6 or later.
  - **Max concurrent Shard Requests**: set to 256, which is the number of simultaneous requests that can be made to each Elasticsearch shard.
  - **Min time interval**: set to 10s, which is the interval in seconds between each request Grafana makes to Elasticsearch to fetch the data.

**Note:** This tutorial was written using version 6.x and Elasticsearch 5.6. The names, positions, and values of the fields may be different in newer versions of the software. But, in principle, the idea of this tutorial can help with the setup. As of the October 2026 review, the [Grafana documentation](https://grafana.com/docs/grafana/latest/datasources/elasticsearch/) stated that the data source supports Elasticsearch 7.17 or later, 8.x, 9.x, and Elastic Cloud Serverless. With Elasticsearch 8.x or later, use the **https** address in the **URL** field and provide the credentials and the certificate authority's certificate in the **Auth** section.

Each field's configuration is explained in detail in the Grafana documentation: [https://grafana.com/docs/grafana/latest/datasources/elasticsearch/](https://grafana.com/docs/grafana/latest/datasources/elasticsearch/)

After configuring it, just click the **Save & Test** button.

4) Optionally, you can import this dashboard [https://grafana.com/grafana/dashboards/878](https://grafana.com/grafana/dashboards/878) and customize it to suit your needs for visualizing Elasticsearch data in Grafana.

Done! The integration between the systems is complete. Now it's time to get creative with extracting and visualizing the data.

For more information about this integration, see [https://grafana.com/docs/grafana/latest/datasources/elasticsearch/](https://grafana.com/docs/grafana/latest/datasources/elasticsearch/)

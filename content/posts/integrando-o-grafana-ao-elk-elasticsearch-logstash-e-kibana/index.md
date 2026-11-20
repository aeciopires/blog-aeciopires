---
title: "Integrando o Grafana ao ELK (ElasticSearch, Logstash e Kibana)"
slug: "integrando-o-grafana-ao-elk-elasticsearch-logstash-e-kibana"
date: 2018-07-30T11:28:15-03:00
lastmod: 2026-10-11T00:49:22-03:00
draft: false
categories: ["grafana", "tutoriais"]
tags: ["elasticsearch", "grafana", "kibana", "logstash"]
description: "Descrição da imagem: dashboard inicial do Grafana com alguns gráficos de exemplo para diferentes métricas."
wp_id: 1749
---

**Atualizado em: 9 de outubro de 2026**

{{< figure src="/wp-content/uploads/2016/05/Captura-de-tela-de-2016-05-26-171923-1024x500.png" alt="Captura de tela de 2016-05-26 17:19:23" >}}

Descrição da imagem: dashboard inicial do Grafana com alguns gráficos de exemplo para diferentes métricas.

Essa dica é indicada para quem procura uma interface web alternativa ao Kibana que seja elegante e simples de usar.

Como eu já conheço e uso o Grafana integrado ao Zabbix para visualizar os dados coletados em gráficos e dashboards mais elegantes, pesquisei um pouco e vi que o Grafana já tem uma integração completa com o ElasticSearch, através do uso [deste plugin](https://grafana.com/plugins/elasticsearch).

Dessa forma se você tem o Grafana instalado (veja este tutorial [/instalando-o-grafana-via-docker](/instalando-o-grafana-via-docker) ) e também possui o stack ELK instalado (veja este outro tutorial [/instalando-o-elastic-kibana-e-logstash-via-docker](/instalando-o-elastic-kibana-e-logstash-via-docker)), você pode configurar a integração seguindo os passos da seção seguinte.

## Integrando o Grafana ao ELK

1) Considerando que o Grafana e o ELK estão instalados, use o comando abaixo para testar o acesso ao ElasticSearch. Troque **IP\_SERVIDOR\_ELASTICSEARCH** pelo IP correto do servidor no comando a seguir.

```bash
curl -XGET 'IP_SERVIDOR_ELASTICSEARCH:9200/_cat/indices?v&pretty'
```

> Atenção!!! A partir do Elasticsearch 8.0, a segurança vem habilitada por padrão: a API usa HTTPS com um certificado gerado na instalação e exige autenticação. Nesse caso, siga o tutorial de instalação citado acima e use o comando a seguir (conforme a documentação oficial: [https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic)), trocando **SENHA** pela senha do usuário **elastic**:
>
> ```bash
> docker cp elastic:/usr/share/elasticsearch/config/certs/http_ca.crt .
> ```
>
> ```bash
> curl --cacert http_ca.crt -u elastic:SENHA 'https://IP_SERVIDOR_ELASTICSEARCH:9200/_cat/indices?v&pretty'
> ```

O resultado deve ser algo semelhante ao mostrado a seguir.

```text
health status index uuid pri rep docs.count docs.deleted store.size pri.store.size
yellow open .kibana tlBWNF-gQ4qvEPa2cAkkMQ 1 1 24 1 75.8kb 75.8kb
```

O comando anterior foi usado para testar se o acesso ao ElasticSearch está correto.

2) Acesse o Grafana na URL **http://IP\_SERVIDOR\_GRAFANA:3000** e faça login no sistema (O usuário e senha padrão é **admin**) **.**

3) Adicione um DataSource no Grafana conforme mostrado na imagem a seguir.

{{< figure src="/wp-content/uploads/2018/07/grafana_elasticsearch.png" alt="grafana elasticsearch" >}}

Descrição da imagem: A imagem possui os seguintes campos e valores preenchidos:

- **Name:** preencha o valor elasticsearch.
- **Type:** o valor é Elasticsearch (que é o plugin usado na integração)
- **URL** (na seção HTTP): preencha http://IP\_ELASTICSEARCH:9200 (porta padrão do Elasticsearch)
- **Access** (na seção HTTP): o valor é Server (Default).
- A seção **Auth** possui os campos: **Basic Auth, With credentials, TLS client auth, With CA cert e Skip TLS Verification (insecure).** No meu caso, esses campos não foram preenchidos, mas se o serviço ElasticSearch estiver sendo exposto usando um servidor HTTP Proxy e/ou com certificado autoassinado, esses campos precisam ser preenchidos para evitar problemas de conectividade.
- Na seçao **ElasticSearch details**, foram preenchidos os seguintes campos:
  - **Index name**: o nome do index, que no meu caso foi preenchido o valor **logstash-\*.** Mude de acordo com o seu ambiente.
  - **Time field name**: foi preenchido o valor @timestamp. É o campo do index que contém a informação sobre o timestamp de registro de cada informação.
  - **Version**: foi informada a versão do ElasticSearch utilizada. No meu caso foi a 5.6 ou superior.
  - **Max concurrent Shard Requests**: foi preenchido o valor 256, que significa o número de requisições simultâneas que pode ser feita em cada shard do ElasticSearch.
  - **Min time interval**: foi preenchido o valor 10s, que significa o intervalo em segundos entre cada requisição que o Grafana fará ao ElasticSearch para obter os dados.

**Observação:**Este tutorial foi escrito usando a versão 6.x e ElasticSearch 5.6. Os nomes, posição e valores dos campos podem ser diferentes nas versões mais recentes do software. Mas a princípio a ideia deste tutorial pode ajudar na configuração. Na revisão de outubro de 2026, a [documentação do Grafana](https://grafana.com/docs/grafana/latest/datasources/elasticsearch/) informava que o data source suporta o Elasticsearch 7.17 ou superior, 8.x, 9.x e o Elastic Cloud Serverless. Com o Elasticsearch 8.x ou superior, use o endereço com **https** no campo **URL** e informe as credenciais e o certificado da autoridade certificadora na seção **Auth**.

A explicação detalhada sobre a configuração de cada campo é detalhada na documentação do Grafana: [https://grafana.com/docs/grafana/latest/datasources/elasticsearch/](https://grafana.com/docs/grafana/latest/datasources/elasticsearch/)

Após configurar, basta clicar no botão **Save & Test**.

4) Opcionalmente, você pode importar o este dashboard [https://grafana.com/grafana/dashboards/878](https://grafana.com/grafana/dashboards/878), para customizar conforme as necessidades de visualização de dados do ElasticSearch no Grafana.

Pronto! A integração entre os sistemas está concluída. Agora é usar a criatividade para extrair e visualizar os dados.

Para obter mais informações sobre esta integração acesse o link [https://grafana.com/docs/grafana/latest/datasources/elasticsearch/](https://grafana.com/docs/grafana/latest/datasources/elasticsearch/)

---
title: "Primeiros passos com RabbitMQ"
slug: "primeiros-passos-com-rabbitmq"
date: 2019-04-18T09:46:17-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["devops", "tutoriais"]
tags: ["docker", "elasticsearch", "rabbitmq"]
description: "Estou começando a dar os primeiros passos com o RabbitMQ e quero compartilhar os links que já estudei até aqui e que servem de bússola para quem quer…"
wp_id: 2030
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** a página de alta disponibilidade citada abaixo (`ha.html`) trata do espelhamento de filas clássicas, recurso [removido no RabbitMQ 4.0](https://www.rabbitmq.com/docs/3.13/ha). Hoje a documentação oficial recomenda usar [quorum queues](https://www.rabbitmq.com/docs/quorum-queues). A lista de links foi mantida como registro histórico; os links que deixaram de funcionar apontam para cópias arquivadas no [Internet Archive](https://web.archive.org/).
{{< /alert >}}

Olá!

Estou começando a dar os primeiros passos com o [**RabbitMQ**](https://www.rabbitmq.com/) e quero compartilhar os links que já estudei até aqui e que servem de bússola para quem quer começar a usá-lo também. Esta página será atualizada à medida que eu encontrar mais documentos relevantes.

**RabbitMQ para iniciantes:**

- [https://helloflu.wordpress.com/2015/12/17/rabbitmq-for-beginners/](https://helloflu.wordpress.com/2015/12/17/rabbitmq-for-beginners/)
- [https://www.tutlane.com/tutorial/rabbitmq](https://www.tutlane.com/tutorial/rabbitmq)
- [https://www.concrete.com.br/2012/01/26/rabbitmq-conceitos-basicos/](https://web.archive.org/web/20190825153051/https://www.concrete.com.br/2012/01/26/rabbitmq-conceitos-basicos/) (cópia arquivada)
- [https://www.rabbitmq.com/getstarted.html](https://www.rabbitmq.com/getstarted.html)
- [https://www.rabbitmq.com/tutorials/tutorial-one-python.html](https://www.rabbitmq.com/tutorials/tutorial-one-python.html)

**Gerenciando o RabbitMQ:**

- [https://www.cloudamqp.com/blog/2015-05-18-part1-rabbitmq-for-beginners-what-is-rabbitmq.html](https://www.cloudamqp.com/blog/2015-05-18-part1-rabbitmq-for-beginners-what-is-rabbitmq.html)
- [https://www.cloudamqp.com/blog/2015-05-27-part3-rabbitmq-for-beginners\_the-management-interface.html](https://www.cloudamqp.com/blog/2015-05-27-part3-rabbitmq-for-beginners_the-management-interface.html)
- [https://www.tutlane.com/tutorial/rabbitmq/rabbitmq-exchanges](https://www.tutlane.com/tutorial/rabbitmq/rabbitmq-exchanges)

**Manual RabbitMQ:**

- [https://www.rabbitmq.com/documentation.html](https://www.rabbitmq.com/documentation.html)
- [https://rabbitmq.docs.pivotal.io/35/topics/](https://web.archive.org/web/20190917161959/https://rabbitmq.docs.pivotal.io/35/topics/) (cópia arquivada)

**Cluster RabbitMQ:**  

- [https://www.rabbitmq.com/clustering.html](https://www.rabbitmq.com/clustering.html)
- [https://www.rabbitmq.com/ha.html](https://www.rabbitmq.com/ha.html)
- [https://www.rabbitmq.com/cli.html](https://www.rabbitmq.com/cli.html)
- [https://www.rabbitmq.com/management.html](https://www.rabbitmq.com/management.html)

**Integrando o Elastic Stack ao RabbitMQ:**

- [https://tpodolak.com/blog/2016/11/17/elastic-stack-reading-logs-queue/](https://tpodolak.com/blog/2016/11/17/elastic-stack-reading-logs-queue/)
- [https://stackoverflow.com/questions/31551648/use-elastic-search-with-rabbitmq](https://stackoverflow.com/questions/31551648/use-elastic-search-with-rabbitmq)
- [http://jakege.blogspot.com/2014/04/centralized-logging-system-based-on.html](http://jakege.blogspot.com/2014/04/centralized-logging-system-based-on.html)
- [https://www.elastic.co/guide/en/logstash/current/plugins-inputs-rabbitmq.html](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-rabbitmq.html)
- [https://stackoverflow.com/questions/39620509/sending-rabbitmq-events-to-logstash-and-elastic](https://stackoverflow.com/questions/39620509/sending-rabbitmq-events-to-logstash-and-elastic)
- [https://medium.com/@anderskmadsen/elk-and-rabbitmq-in-docker-44c6fd501015](https://medium.com/@anderskmadsen/elk-and-rabbitmq-in-docker-44c6fd501015)
- [http://blog.lusis.org/blog/2012/01/31/load-balancing-logstash-with-amqp/](http://blog.lusis.org/blog/2012/01/31/load-balancing-logstash-with-amqp/)
- [https://www.youtube.com/watch?v=pnNNLuqWHKk](https://www.youtube.com/watch?v=pnNNLuqWHKk)
- [http://gago.io/blog/docker-de-z-15-rabbitmq-logstash-elsticseach-e-kibana-com-docker-compose/](http://gago.io/blog/docker-de-z-15-rabbitmq-logstash-elsticseach-e-kibana-com-docker-compose/)
- [https://blog.jayway.com/2012/07/27/how-to-set-up-semantic-logging-part-one-with-logstash-kibana-elasticsearch-and-puppet/](https://web.archive.org/web/20230401202723/https://blog.jayway.com/2012/07/27/how-to-set-up-semantic-logging-part-one-with-logstash-kibana-elasticsearch-and-puppet/) (cópia arquivada)
- [https://www.vivaolinux.com.br/artigo/Logstash-+-Redis-+-Elasticsearch-+-Kibana-Gerenciando-logs?pagina=2](https://www.vivaolinux.com.br/artigo/Logstash-+-Redis-+-Elasticsearch-+-Kibana-Gerenciando-logs?pagina=2)

**Gerenciando o RabbitMQ pela linha de comando:**

- [https://www.rabbitmq.com/management-cli.html](https://www.rabbitmq.com/management-cli.html)
- [https://www.rabbitmq.com/cli.html](https://www.rabbitmq.com/cli.html)
- [https://stackoverflow.com/questions/4545660/rabbitmq-creating-queues-and-bindings-from-a-command-line](https://stackoverflow.com/questions/4545660/rabbitmq-creating-queues-and-bindings-from-a-command-line)
- [http://manpages.ubuntu.com/manpages/trusty/man1/rabbitmqctl.1.html](http://manpages.ubuntu.com/manpages/trusty/man1/rabbitmqctl.1.html)
- [https://docs.bitnami.com/oci/infrastructure/rabbitmq/administration/use-admin-console/](https://web.archive.org/web/20191114080324/https://docs.bitnami.com/oci/infrastructure/rabbitmq/administration/use-admin-console/) (cópia arquivada)
- [https://training-course-material.com/training/Rabbitmq\_-\_messaging\_service\_that\_just\_works](https://training-course-material.com/training/Rabbitmq_-_messaging_service_that_just_works)
- [https://stackoverflow.com/questions/10709533/is-it-possible-to-view-rabbitmq-message-contents-directly-from-the-command-line](https://stackoverflow.com/questions/10709533/is-it-possible-to-view-rabbitmq-message-contents-directly-from-the-command-line)

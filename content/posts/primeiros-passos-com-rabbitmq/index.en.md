---
title: "Getting started with RabbitMQ"
slug: "primeiros-passos-com-rabbitmq"
date: 2019-04-18T09:46:17-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["devops", "tutoriais"]
tags: ["docker", "elasticsearch", "rabbitmq"]
description: "I am taking my first steps with RabbitMQ and want to share the links I have studied so far, which serve as a compass for anyone who wants…"
sourceHash: "f2ae117b1659b7c5"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** the high availability page cited below (`ha.html`) covers classic queue mirroring, a feature [removed in RabbitMQ 4.0](https://www.rabbitmq.com/docs/3.13/ha). Today the official documentation recommends using [quorum queues](https://www.rabbitmq.com/docs/quorum-queues). The list of links was kept as a historical record; the links that stopped working point to archived copies on the [Internet Archive](https://web.archive.org/).
{{< /alert >}}

Hello!

I am taking my first steps with [**RabbitMQ**](https://www.rabbitmq.com/) and want to share the links I have studied so far, which serve as a compass for anyone who wants to start using it too. This page will be updated as I find more relevant documents.

**RabbitMQ for beginners:**

- [https://helloflu.wordpress.com/2015/12/17/rabbitmq-for-beginners/](https://helloflu.wordpress.com/2015/12/17/rabbitmq-for-beginners/)
- [https://www.tutlane.com/tutorial/rabbitmq](https://www.tutlane.com/tutorial/rabbitmq)
- [https://www.concrete.com.br/2012/01/26/rabbitmq-conceitos-basicos/](https://web.archive.org/web/20190825153051/https://www.concrete.com.br/2012/01/26/rabbitmq-conceitos-basicos/) (archived copy)
- [https://www.rabbitmq.com/getstarted.html](https://www.rabbitmq.com/getstarted.html)
- [https://www.rabbitmq.com/tutorials/tutorial-one-python.html](https://www.rabbitmq.com/tutorials/tutorial-one-python.html)

**Managing RabbitMQ:**

- [https://www.cloudamqp.com/blog/2015-05-18-part1-rabbitmq-for-beginners-what-is-rabbitmq.html](https://www.cloudamqp.com/blog/2015-05-18-part1-rabbitmq-for-beginners-what-is-rabbitmq.html)
- [https://www.cloudamqp.com/blog/2015-05-27-part3-rabbitmq-for-beginners\_the-management-interface.html](https://www.cloudamqp.com/blog/2015-05-27-part3-rabbitmq-for-beginners_the-management-interface.html)
- [https://www.tutlane.com/tutorial/rabbitmq/rabbitmq-exchanges](https://www.tutlane.com/tutorial/rabbitmq/rabbitmq-exchanges)

**RabbitMQ manual:**

- [https://www.rabbitmq.com/documentation.html](https://www.rabbitmq.com/documentation.html)
- [https://rabbitmq.docs.pivotal.io/35/topics/](https://web.archive.org/web/20190917161959/https://rabbitmq.docs.pivotal.io/35/topics/) (archived copy)

**RabbitMQ cluster:**  

- [https://www.rabbitmq.com/clustering.html](https://www.rabbitmq.com/clustering.html)
- [https://www.rabbitmq.com/ha.html](https://www.rabbitmq.com/ha.html)
- [https://www.rabbitmq.com/cli.html](https://www.rabbitmq.com/cli.html)
- [https://www.rabbitmq.com/management.html](https://www.rabbitmq.com/management.html)

**Integrating the Elastic Stack with RabbitMQ:**

- [https://tpodolak.com/blog/2016/11/17/elastic-stack-reading-logs-queue/](https://tpodolak.com/blog/2016/11/17/elastic-stack-reading-logs-queue/)
- [https://stackoverflow.com/questions/31551648/use-elastic-search-with-rabbitmq](https://stackoverflow.com/questions/31551648/use-elastic-search-with-rabbitmq)
- [http://jakege.blogspot.com/2014/04/centralized-logging-system-based-on.html](http://jakege.blogspot.com/2014/04/centralized-logging-system-based-on.html)
- [https://www.elastic.co/guide/en/logstash/current/plugins-inputs-rabbitmq.html](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-rabbitmq.html)
- [https://stackoverflow.com/questions/39620509/sending-rabbitmq-events-to-logstash-and-elastic](https://stackoverflow.com/questions/39620509/sending-rabbitmq-events-to-logstash-and-elastic)
- [https://medium.com/@anderskmadsen/elk-and-rabbitmq-in-docker-44c6fd501015](https://medium.com/@anderskmadsen/elk-and-rabbitmq-in-docker-44c6fd501015)
- [http://blog.lusis.org/blog/2012/01/31/load-balancing-logstash-with-amqp/](http://blog.lusis.org/blog/2012/01/31/load-balancing-logstash-with-amqp/)
- [https://www.youtube.com/watch?v=pnNNLuqWHKk](https://www.youtube.com/watch?v=pnNNLuqWHKk)
- [http://gago.io/blog/docker-de-z-15-rabbitmq-logstash-elsticseach-e-kibana-com-docker-compose/](http://gago.io/blog/docker-de-z-15-rabbitmq-logstash-elsticseach-e-kibana-com-docker-compose/)
- [https://blog.jayway.com/2012/07/27/how-to-set-up-semantic-logging-part-one-with-logstash-kibana-elasticsearch-and-puppet/](https://web.archive.org/web/20230401202723/https://blog.jayway.com/2012/07/27/how-to-set-up-semantic-logging-part-one-with-logstash-kibana-elasticsearch-and-puppet/) (archived copy)
- [https://www.vivaolinux.com.br/artigo/Logstash-+-Redis-+-Elasticsearch-+-Kibana-Gerenciando-logs?pagina=2](https://www.vivaolinux.com.br/artigo/Logstash-+-Redis-+-Elasticsearch-+-Kibana-Gerenciando-logs?pagina=2)

**Managing RabbitMQ from the command line:**

- [https://www.rabbitmq.com/management-cli.html](https://www.rabbitmq.com/management-cli.html)
- [https://www.rabbitmq.com/cli.html](https://www.rabbitmq.com/cli.html)
- [https://stackoverflow.com/questions/4545660/rabbitmq-creating-queues-and-bindings-from-a-command-line](https://stackoverflow.com/questions/4545660/rabbitmq-creating-queues-and-bindings-from-a-command-line)
- [http://manpages.ubuntu.com/manpages/trusty/man1/rabbitmqctl.1.html](http://manpages.ubuntu.com/manpages/trusty/man1/rabbitmqctl.1.html)
- [https://docs.bitnami.com/oci/infrastructure/rabbitmq/administration/use-admin-console/](https://web.archive.org/web/20191114080324/https://docs.bitnami.com/oci/infrastructure/rabbitmq/administration/use-admin-console/) (archived copy)
- [https://training-course-material.com/training/Rabbitmq\_-\_messaging\_service\_that\_just\_works](https://training-course-material.com/training/Rabbitmq_-_messaging_service_that_just_works)
- [https://stackoverflow.com/questions/10709533/is-it-possible-to-view-rabbitmq-message-contents-directly-from-the-command-line](https://stackoverflow.com/questions/10709533/is-it-possible-to-view-rabbitmq-message-contents-directly-from-the-command-line)

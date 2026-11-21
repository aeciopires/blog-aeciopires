---
title: "Installing RabbitMQ via Docker"
slug: "instalando-o-rabbitmq-via-docker"
date: 2019-04-18T10:47:14-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["devops", "docker", "tutoriais"]
tags: ["docker", "rabbitmq"]
description: "RabbitMQ is a queue management service for receiving and delivering messages between applications, even if they were developed in…"
sourceHash: "1ea43f184a99173c"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested with the `rabbitmq:4-management` image (RabbitMQ 4.4.1 and `rabbitmqadmin` 2.35.0): listings, creating an exchange, a queue, and a binding, users and permissions, exporting and importing definitions, and reading messages. No changes were needed.
{{< /alert >}}

[RabbitMQ](https://www.rabbitmq.com/) is a queue management service for receiving and delivering messages between applications, even if they were developed in different programming languages. It is free, and its source code is open and available at: [https://github.com/rabbitmq](https://github.com/rabbitmq).

It uses the [AMQP](https://en.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol) protocol to exchange messages and, by default, uses the following ports:

- 5672/TCP, for delivering and receiving messages.

- 15672/TCP, for accessing the RabbitMQ management interface.

**Installing RabbitMQ via Docker**

Installing with Docker is much simpler and faster.

If you don't know what Docker is, I recommend starting with the links below. It's a long road, but this technology is worth learning.

 [/en/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/en/curso-docker](/en/curso-docker)

1) Create the directory below to persist the data outside the container.

```bash
sudo mkdir -p /docker/rabbitmq/data
```

2) Pull the RabbitMQ Docker image.

```bash
export VERSAO=4-management
docker pull rabbitmq:$VERSAO
```

Use the command below to list the downloaded images.

```bash
docker images
```

3) Run the RabbitMQ container.

```bash
docker run -d --name rabbitmq \
 -p 5672:5672 \
 -p 15672:15672 \
 --restart=always \
 --hostname rabbitmq-master \
 -v /docker/rabbitmq/data:/var/lib/rabbitmq \
 rabbitmq:$VERSAO
```

Source: [https://hub.docker.com/\_/rabbitmq/](https://hub.docker.com/_/rabbitmq/)

4) Access RabbitMQ at http://IP-Servidor:15672. The default login is **guest**, and the password is **guest**.

5) To stop the container, just run the command below.

```bash
docker stop rabbitmq
```

6) To start it again, run the command below.

```bash
docker start rabbitmq
```

7) To view the logs, run the command below.

```bash
docker logs -f rabbitmq
```

You can find more information about RabbitMQ and how to configure it in the links below.

[https://www.rabbitmq.com/documentation.html](https://www.rabbitmq.com/documentation.html)  
[/en/primeiros-passos-com-rabbitmq/](/en/primeiros-passos-com-rabbitmq/)

If you can't access RabbitMQ through the web interface, you can manage it from the command line.

> Attention!!! The `rabbitmq:4-management` image now ships version 2 of `rabbitmqadmin` (in the November 20, 2026 review, the image shipped RabbitMQ 4.4.1 and `rabbitmqadmin` 2.35.0). This new version has a different syntax from version 1, which was used in the original version of this post. The commands below were updated and tested with version 2. The documentation is available at: [https://www.rabbitmq.com/docs/management-cli](https://www.rabbitmq.com/docs/management-cli)

Accessing the command prompt of the RabbitMQ container:

```bash
docker exec -it rabbitmq /bin/bash
```

Accessing the help for the rabbitmqadmin command:

```text
rabbitmqadmin --help
rabbitmqadmin help
rabbitmqadmin declare --help
rabbitmqctl --help
```

Listing the existing exchanges in RabbitMQ:

```text
rabbitmqadmin list exchanges
```

Listing the existing queues in RabbitMQ:

```text
rabbitmqadmin list queues
```

Listing the existing bindings in RabbitMQ:

```text
rabbitmqadmin list bindings
```

Listing the existing vhosts in RabbitMQ:

```text
rabbitmqadmin list vhosts
```

Listing the existing users in RabbitMQ:

```text
rabbitmqadmin list users
```

Adding an exchange named '**app1**' of type '**direct**' in the vhost '**/**':

```text
rabbitmqadmin declare exchange --name app1 --type direct --durable true --vhost /
```

Adding a durable queue named '**logs\_app1**' in the vhost '**/**'

```text
rabbitmqadmin declare queue --name logs_app1 --durable true --vhost /
```

Adding a binding between the exchange '**app1**' and the queue '**logs\_app1**' with the routing\_key '**app1-logs\_app1**':

```text
rabbitmqadmin declare binding --source app1 --destination logs_app1 --destination-type queue --routing-key app1-logs_app1
```

Adding a user named '**user\_app1**' to RabbitMQ with '**administrator**' permission:

```text
rabbitmqctl add_user user_app1 SENHA
rabbitmqctl set_user_tags user_app1 administrator
rabbitmqctl set_permissions -p / user_app1 ".*" ".*" ".*"
rabbitmqctl set_topic_permissions -p / user_app1 app1 ".*" ".*"
```

Change the password of the guest user:

```text
rabbitmqctl change_password guest NOVA-SENHA
```

Setting the RabbitMQ cluster name to 'rabbit@rabbitmq-master':

```text
rabbitmqctl set_cluster_name rabbit@rabbitmq-master
```

Exporting the configuration (remember to save it to a directory or volume shared by the container and the host)

```text
rabbitmqadmin --username guest --password NOVA-SENHA definitions export --file /tmp/rabbit.json
```

Importing the configuration (remember to mount a directory or volume shared by the container and the host):

```text
rabbitmqadmin --username guest --password NOVA-SENHA definitions import --file /tmp/rabbit.json
```

Reading up to 10 messages from a queue:

```text
rabbitmqadmin --username guest --password NOVA-SENHA get messages --queue logs_app1 --count 10
```

**Note:**  
Once the password of the **guest** user has been changed, you need to add the parameters **--username guest --password NOVA-SENHA** to any **rabbitmqadmin** command (version 2 syntax, used in the examples above).

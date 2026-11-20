---
title: "Instalando o RabbitMQ via Docker"
slug: "instalando-o-rabbitmq-via-docker"
date: 2019-04-18T10:47:14-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["devops", "docker", "tutoriais"]
tags: ["docker", "rabbitmq"]
description: "O RabbitMQ é um serviço de gerenciamento de filas para recebimento e entrega de mensagens entre aplicações, mesmo que tenham sido desenvolvidas em…"
wp_id: 2035
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** comandos testados com a imagem `rabbitmq:4-management` (RabbitMQ 4.4.1 e `rabbitmqadmin` 2.35.0): listagens, criação de exchange, fila e binding, usuários e permissões, exportação e importação de definições, e leitura de mensagens. Nenhuma alteração foi necessária.
{{< /alert >}}

O [RabbitMQ](https://www.rabbitmq.com/) é um serviço de gerenciamento de filas para recebimento e entrega de mensagens entre aplicações, mesmo que tenham sido desenvolvidas em diferentes linguagens de programação. Ele é gratuito e possui o código-fonte aberto e disponível em: [https://github.com/rabbitmq](https://github.com/rabbitmq).

Utiliza o protocolo [AMQP](https://en.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol) para realizar a troca de mensagens e faz uso, por padrão, das portas:

- 5672/TCP, para entrega e recebimento de mensagens.

- 15672/TCP, para acessar a interface de gerenciamento do RabbitMQ.

**Instalando o RabbitMQ via Docker**

A instalação usando o Docker é bem mais simples e rápida.

Se você não sabe o que é Docker, recomendo começar lendo os links abaixo. É um longo caminho, mas vale a pena conhecer essa tecnologia.

 [/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também ministro curso de Docker: [/curso-docker](/curso-docker)

1) Crie o diretório abaixo para persistir os dados fora do conteiner.

```bash
sudo mkdir -p /docker/rabbitmq/data
```

2) Baixe a imagem Docker do RabbitMQ.

```bash
export VERSAO=4-management
docker pull rabbitmq:$VERSAO
```

Use o comando abaixo para listar as imagens obtidas.

```bash
docker images
```

3) Execute o conteiner do RabbitMQ.

```bash
docker run -d --name rabbitmq \
 -p 5672:5672 \
 -p 15672:15672 \
 --restart=always \
 --hostname rabbitmq-master \
 -v /docker/rabbitmq/data:/var/lib/rabbitmq \
 rabbitmq:$VERSAO
```

Fonte: [https://hub.docker.com/\_/rabbitmq/](https://hub.docker.com/_/rabbitmq/)

4) Acesse o RabbitMQ na URL http://IP-Servidor:15672. O login padrão é **guest** e a senha é **guest**.

5) Se quiser parar o conteiner, é só executar o comando abaixo.

```bash
docker stop rabbitmq
```

6) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start rabbitmq
```

7) Para visualizar os logs, execute o comando abaixo.

```bash
docker logs -f rabbitmq
```

Mais informações sobre o RabbitMQ e como configurá-lo podem ser encontradas nos links abaixo.

[https://www.rabbitmq.com/documentation.html](https://www.rabbitmq.com/documentation.html)  
[/primeiros-passos-com-rabbitmq/](/primeiros-passos-com-rabbitmq/)

Caso não consiga acessar o RabbitMQ via interface Web, você pode gerenciá-lo pela linha de comando.

> Atenção!!! A imagem `rabbitmq:4-management` passou a trazer a versão 2 do `rabbitmqadmin` (na revisão de outubro de 2026, a imagem trazia o RabbitMQ 4.3.6 e o `rabbitmqadmin` 2.35.0). Essa nova versão tem uma sintaxe diferente da versão 1, que era usada na versão original deste post. Os comandos abaixo foram atualizados e testados com a versão 2. A documentação está disponível em: [https://www.rabbitmq.com/docs/management-cli](https://www.rabbitmq.com/docs/management-cli)

Acessando o prompt de comandos do conteiner do RabbitMQ:

```bash
docker exec -it rabbitmq /bin/bash
```

Acessando a ajuda do comando rabbitmqadmin:

```text
rabbitmqadmin --help
rabbitmqadmin help
rabbitmqadmin declare --help
rabbitmqctl --help
```

Listando os exchanges existentes no RabbitMQ:

```text
rabbitmqadmin list exchanges
```

Listando as filas existentes no RabbitMQ:

```text
rabbitmqadmin list queues
```

Listando os bindings existentes no RabbitMQ:

```text
rabbitmqadmin list bindings
```

Listando os vhosts existentes no RabbitMQ:

```text
rabbitmqadmin list vhosts
```

Listando os usuários existentes no RabbitMQ:

```text
rabbitmqadmin list users
```

Adicionando um exchange com o nome '**app1**' e o tipo '**direct**' no vhost '**/**':

```text
rabbitmqadmin declare exchange --name app1 --type direct --durable true --vhost /
```

Adicionando uma fila com o nome '**logs\_app1**', durável no vhost '**/**'

```text
rabbitmqadmin declare queue --name logs_app1 --durable true --vhost /
```

Adicionando um bind entre o exchange '**app1**' e a queue '**logs\_app1**' com a routing\_key '**app1-logs\_app1**':

```text
rabbitmqadmin declare binding --source app1 --destination logs_app1 --destination-type queue --routing-key app1-logs_app1
```

Adicionando um usuário ao RabbitMQ com o nome '**user\_app1**' com permissão de '**administrator**':

```text
rabbitmqctl add_user user_app1 SENHA
rabbitmqctl set_user_tags user_app1 administrator
rabbitmqctl set_permissions -p / user_app1 ".*" ".*" ".*"
rabbitmqctl set_topic_permissions -p / user_app1 app1 ".*" ".*"
```

Altere a senha do usuário guest:

```text
rabbitmqctl change_password guest NOVA-SENHA
```

Definindo o nome do cluster RabbitMQ para 'rabbit@rabbitmq-master':

```text
rabbitmqctl set_cluster_name rabbit@rabbitmq-master
```

Exportando a configuração (lembre-se de salvar em um diretório ou volume comum ao conteiner e ao host)

```text
rabbitmqadmin --username guest --password NOVA-SENHA definitions export --file /tmp/rabbit.json
```

Importando a configuração (lembre-se de montar um diretório ou volume comum ao conteiner e ao host):

```text
rabbitmqadmin --username guest --password NOVA-SENHA definitions import --file /tmp/rabbit.json
```

Visualizando a quantidade de mensagens numa fila:

```text
rabbitmqadmin --username guest --password NOVA-SENHA get messages --queue logs_app1 --count 10
```

**Observação:**  
A partir do momento que a senha do usuário **guest** foi alterada, se faz necessário adicionar os parâmetros **--username guest --password NOVA-SENHA** em qualquer comando do **rabbitmqadmin** (sintaxe da versão 2, usada nos exemplos acima).

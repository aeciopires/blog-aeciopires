---
title: "Configurando o Grafana para funcionar sobre HTTPS"
slug: "configurando-o-grafana-para-funcionar-sobre-https"
date: 2016-05-26T18:13:34-03:00
lastmod: 2026-10-08T13:58:06-03:00
draft: false
categories: ["grafana", "tutoriais", "zabbix-2"]
tags: ["grafana", "zabbix"]
description: "Neste tutorial será mostrado como configurar o Grafana para funcionar sobre HTTPS, usando um certificado auto-assinado."
wp_id: 999
---

{{< figure src="/wp-content/uploads/2016/05/Captura-de-tela-de-2016-05-26-171923-1024x500.png" alt="Captura de tela de 2016-05-26 17:19:23" caption="Captura de tela de 2016-05-26 17:19:23" >}}

**Atualizado em: 7 de outubro de 2026**

Neste tutorial  será mostrado como configurar o Grafana para funcionar sobre HTTPS, usando um certificado auto-assinado.

## Criando um certificado auto-assinado

Instale o pacote opensssl.

No Debian/Ubuntu:

```bash
sudo apt-get -y install openssl
```

Agora crie uma chave privada RSA. Execute os comandos abaixo.

```bash
sudo mkdir /etc/certs
cd /etc/certs/
sudo openssl genrsa -aes256 -out server.key 2048
sudo cp server.key server.key.org
sudo openssl rsa -in server.key.org -out server.key
sudo rm server.key.org
```

Durante a execução do comando `openssl genrsa`, defina uma senha para a chave. O comando `openssl rsa` pedirá essa senha e gravará a chave sem senha no arquivo **server.key**, para que o Grafana consiga lê-la.

Agora crie uma requisição de assinatura de certificado. Execute o comando abaixo.

```bash
sudo openssl req -new -sha256 -key server.key -out server.csr
```

Durante a execução do comando acima será solicitado a senha da chave privada e os dados do certificado e que serão exibidos no navegador do usuário. Veja o exemplo abaixo.

Country Name (2 letter code) [GB]:**BR**  
State or Province Name (full name) [Berkshire]:**Estado**  
Locality Name (eg, city) [Newbury]:**Cidade**  
Organization Name (eg, company) [My Company Ltd]: **Minha empresa LTDA**  
Organizational Unit Name (eg, section) []:**Meu setor de trabalho**  
Common Name (eg, your name or your server's hostname) []:**nomeservidor.empresa.com.br**  
Email Address []:**email@empresa.com.br**  
Please enter the following 'extra' attributes  

to be sent with your certificate request  

A challenge password []:  

An optional company name []:

Agora assine o certificado.

```bash
sudo openssl x509 -req -days 3650 -sha256 -in server.csr -signkey server.key -out server.crt
```

Usando, o comando acima, você estará assinando o certificado com validade de 10 anos (aproximadamente 3650 dias). Se quiser mudar este tempo, altere a quantidade de dias no parâmetro **-days**.

## Configurando o Grafana para funcionar sobre HTTPS

Quando o Grafana é instalado via pacote .deb, o arquivo de configuração fica em: **/etc/grafana/grafana.ini.**

Edite o arquivo **/etc/grafana/grafana.ini** e altere os parâmetro abaixo para ficar da seguinte maneira **.**

Antes:

;protocol = http  
;http\_port = 3000  
;cert\_file =
;cert\_key =

Depois:

protocol = https

http\_port = 3000

cert\_file = /etc/certs/server.crt

cert\_key = /etc/certs/server.key

Agora é só reiniciar o Grafana.

No Debian 8/Ubuntu 16.04:

```bash
sudo systemctl restart grafana-server
```

O Grafana estará acessível na URL: **https://ip-servidor:3000**

Aceite o certificado no navegador, pois o mesmo vai reclamar que o site está usando um certificado auto-assinado.

Os passos acima pode ser adaptados para a sua realidade, caso possua um certificado válido.  

Se quiser configurar o Grafana para disponibilizar dashboards para cada cliente, siga os passos deste tutorial: [http://andredeo.blogspot.com.br/2016/12/zabbix-e-grafana-disponibilizando-um.html](http://andredeo.blogspot.com.br/2016/12/zabbix-e-grafana-disponibilizando-um.html)

**Fonte:**

[http://www.akadia.com/services/ssh\_test\_certificate.html](http://www.akadia.com/services/ssh_test_certificate.html)

[https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana)

[https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https](https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https)

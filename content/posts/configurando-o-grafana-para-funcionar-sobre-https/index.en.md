---
title: "Configuring Grafana to run over HTTPS"
slug: "configurando-o-grafana-para-funcionar-sobre-https"
date: 2016-05-26T18:13:34-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["grafana", "tutoriais", "zabbix-2"]
tags: ["grafana", "zabbix"]
description: "This tutorial shows how to configure Grafana to run over HTTPS using a self-signed certificate."
sourceHash: "49dfbbba9eaf15d5"
---

{{< figure src="/wp-content/uploads/2016/05/Captura-de-tela-de-2016-05-26-171923-1024x500.png" alt="Screenshot from 2016-05-26 17:19:23" caption="Screenshot from 2016-05-26 17:19:23" >}}

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** tested with Grafana 13.3.1 installed from the official APT repository on Ubuntu 24.04. Following the original post, the service would not start because the `grafana` user could not read the key; I added the ownership and permissions adjustment from the official documentation. It is also now clear that the `grafana.ini` change applies only to the `[server]` section.
{{< /alert >}}

This tutorial shows how to configure Grafana to run over HTTPS using a self-signed certificate.

## Creating a self-signed certificate

Install the openssl package.

On Debian/Ubuntu:

```bash
sudo apt-get -y install openssl
```

Now create an RSA private key. Run the commands below.

```bash
sudo mkdir /etc/certs
cd /etc/certs/
sudo openssl genrsa -aes256 -out server.key 2048
sudo cp server.key server.key.org
sudo openssl rsa -in server.key.org -out server.key
sudo rm server.key.org
```

While the `openssl genrsa` command runs, set a password for the key. The `openssl rsa` command will ask for that password and write the key without a password to the **server.key** file, so that Grafana can read it.

Now create a certificate signing request. Run the command below.

```bash
sudo openssl req -new -sha256 -key server.key -out server.csr
```

While the command above runs, you will be asked for the certificate details, which will be shown in the user's browser. See the example below.

Country Name (2 letter code) [GB]:**BR**  
State or Province Name (full name) [Berkshire]:**State**  
Locality Name (eg, city) [Newbury]:**City**  
Organization Name (eg, company) [My Company Ltd]: **My Company LLC**  
Organizational Unit Name (eg, section) []:**My department**  
Common Name (eg, your name or your server's hostname) []:**nomeservidor.empresa.com.br**  
Email Address []:**email@empresa.com.br**  
Please enter the following 'extra' attributes  

to be sent with your certificate request  

A challenge password []:  

An optional company name []:

Now sign the certificate.

```bash
sudo openssl x509 -req -days 3650 -sha256 -in server.csr -signkey server.key -out server.crt
```

With the command above, you sign the certificate with a validity of 10 years (approximately 3650 days). If you want to change this period, change the number of days in the **-days** parameter.

Grafana installed from a package runs as the `grafana` user, which must be able to read the certificate and the key. Otherwise, the service does not start and logs `could not load SSL certificate: open /etc/certs/server.key: permission denied`. Adjust the owner and permissions, as described in the [official documentation](https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https/):

```bash
sudo chown grafana:grafana /etc/certs/server.crt /etc/certs/server.key
sudo chmod 400 /etc/certs/server.key /etc/certs/server.crt
```

## Configuring Grafana to run over HTTPS

When Grafana is installed from the .deb package, the configuration file is located at: **/etc/grafana/grafana.ini.**

Edit the **/etc/grafana/grafana.ini** file and, in the **[server]** section, change the parameters below so they look like this (the same names appear in other sections of the file, which must not be changed).

Before:

;protocol = http  
;http\_port = 3000  
;cert\_file =
;cert\_key =

After:

protocol = https

http\_port = 3000

cert\_file = /etc/certs/server.crt

cert\_key = /etc/certs/server.key

Now just restart Grafana.

On distributions with systemd (Debian, Ubuntu, and others):

```bash
sudo systemctl restart grafana-server
```

Grafana will be available at the URL: **https://ip-servidor:3000**

Accept the certificate in the browser, since it will warn you that the site is using a self-signed certificate.

You can adapt the steps above to your own situation if you have a valid certificate.  

If you want to configure Grafana to provide dashboards for each customer, follow the steps in this tutorial (in Portuguese): [http://andredeo.blogspot.com.br/2016/12/zabbix-e-grafana-disponibilizando-um.html](http://andredeo.blogspot.com.br/2016/12/zabbix-e-grafana-disponibilizando-um.html)

**Source:**

[http://www.akadia.com/services/ssh\_test\_certificate.html](http://www.akadia.com/services/ssh_test_certificate.html)

[https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana)

[https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https](https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https)

---
title: "Configurando o Grafana para funcionar sobre HTTPS"
slug: "configurando-o-grafana-para-funcionar-sobre-https"
date: 2016-05-26T18:13:34-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["grafana", "tutoriais", "zabbix-2"]
tags: ["grafana", "zabbix"]
description: "Neste tutorial será mostrado como configurar o Grafana para funcionar sobre HTTPS, usando um certificado autoassinado."
wp_id: 999
---

{{< figure src="/wp-content/uploads/2016/05/Captura-de-tela-de-2016-05-26-171923-1024x500.png" alt="Captura de tela de 2016-05-26 17:19:23" caption="Captura de tela de 2016-05-26 17:19:23" >}}

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** testado com o Grafana 13.3.1 instalado pelo repositório APT oficial no Ubuntu 24.04. Seguindo o post original, o serviço não subia porque o usuário `grafana` não conseguia ler a chave; foi incluído o ajuste de dono e permissões da documentação oficial. Também ficou claro que a alteração do `grafana.ini` é só na seção `[server]`.
{{< /alert >}}

Neste tutorial será mostrado como configurar o Grafana para funcionar sobre HTTPS, usando um certificado autoassinado.

## Criando um certificado autoassinado

Instale o pacote openssl.

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

Durante a execução do comando acima, serão solicitados os dados do certificado, que serão exibidos no navegador do usuário. Veja o exemplo abaixo.

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

Usando o comando acima, você estará assinando o certificado com validade de 10 anos (aproximadamente 3650 dias). Se quiser mudar este tempo, altere a quantidade de dias no parâmetro **-days**.

O Grafana instalado por pacote roda com o usuário `grafana`, que precisa conseguir ler o certificado e a chave. Sem isso, o serviço não sobe e registra `could not load SSL certificate: open /etc/certs/server.key: permission denied`. Ajuste o dono e as permissões, como indica a [documentação oficial](https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https/):

```bash
sudo chown grafana:grafana /etc/certs/server.crt /etc/certs/server.key
sudo chmod 400 /etc/certs/server.key /etc/certs/server.crt
```

## Configurando o Grafana para funcionar sobre HTTPS

Quando o Grafana é instalado via pacote .deb, o arquivo de configuração fica em: **/etc/grafana/grafana.ini.**

Edite o arquivo **/etc/grafana/grafana.ini** e, na seção **[server]**, altere os parâmetros abaixo para ficar da seguinte maneira (os mesmos nomes aparecem em outras seções do arquivo, que não devem ser alteradas).

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

Nas distribuições com systemd (Debian, Ubuntu e outras):

```bash
sudo systemctl restart grafana-server
```

O Grafana estará acessível na URL: **https://ip-servidor:3000**

Aceite o certificado no navegador, pois ele vai avisar que o site está usando um certificado autoassinado.

Os passos acima podem ser adaptados para a sua realidade, caso possua um certificado válido.  

Se quiser configurar o Grafana para disponibilizar dashboards para cada cliente, siga os passos deste tutorial: [http://andredeo.blogspot.com.br/2016/12/zabbix-e-grafana-disponibilizando-um.html](http://andredeo.blogspot.com.br/2016/12/zabbix-e-grafana-disponibilizando-um.html)

**Fonte:**

[http://www.akadia.com/services/ssh\_test\_certificate.html](http://www.akadia.com/services/ssh_test_certificate.html)

[https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana)

[https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https](https://grafana.com/docs/grafana/latest/setup-grafana/set-up-https)

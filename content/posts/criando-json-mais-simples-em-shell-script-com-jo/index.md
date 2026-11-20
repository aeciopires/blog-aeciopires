---
title: "Criando JSON mais simples em Shell Script com JO e JJ"
slug: "criando-json-mais-simples-em-shell-script-com-jo"
date: 2020-12-14T17:35:46-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
tags: ["linux", "bash"]
description: "Não sei vocês, mas acho muito chato criar JSON em shell script com o comando jq."
wp_id: 2469
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** exemplos testados com o jo 1.9 (pacote do Ubuntu 24.04). As saídas mostradas foram ajustadas para a indentação que o jo gera hoje.
{{< /alert >}}

Não sei vocês, mas acho muito chato criar JSON em **shell script** com o comando **jq**.

Eu trabalhei em algo semelhante esses dias, então investi algumas horas pesquisando e achei o comando **jo** ([https://github.com/jpmens/jo](https://github.com/jpmens/jo))

Ele está disponível para instalação no Ubuntu, ArchLinux e outras distros GNU/Linux.

Exemplo de uso:

```text
jo -p name=jo n=17 parser=false
```

Resultado:

```json
{
   "name": "jo",
   "n": 17,
   "parser": false
}
```

Tente fazer a mesma coisa com o comando jq e compare o tamanho e a complexidade da linha de comando...

Outro exemplo mais complexo:

```text
jo -p name=JP object=$(jo fruit=Orange point=$(jo x=10 y=20) number=17) sunday=false
```

Resultado:

```json
{
   "name": "JP",
   "object": {
      "fruit": "Orange",
      "point": {
         "x": 10,
         "y": 20
      },
      "number": 17
   },
   "sunday": false
}
```

Mais informações em:

[https://jpmens.net/2016/03/05/a-shell-command-to-create-json-jo/](https://jpmens.net/2016/03/05/a-shell-command-to-create-json-jo/)

[https://github.com/jpmens/jo/blob/master/jo.md](https://github.com/jpmens/jo/blob/master/jo.md)

Já a ferramenta JJ ([https://github.com/tidwall/jj](https://github.com/tidwall/jj)) pode ser utilizada para ler, criar, editar e remover registros de um arquivo JSON.

Já para ler arquivos JSON ou fazer lint, existem outras ferramentas que vocês podem encontrar nos seguintes links:

- [https://github.com/antonmedv/fx](https://github.com/antonmedv/fx)
- [https://medium.com/better-programming/how-to-work-with-json-in-the-command-line-and-terminal-with-fx-58ac3cef8e04](https://medium.com/better-programming/how-to-work-with-json-in-the-command-line-and-terminal-with-fx-58ac3cef8e04)
- [https://geekflare.com/json-online-tools/](https://geekflare.com/json-online-tools/)
- [https://ilya-sher.org/2018/04/10/list-of-json-tools-for-command-line/](https://ilya-sher.org/2018/04/10/list-of-json-tools-for-command-line/)
- [https://cameronnokes.com/blog/working-with-json-in-bash-using-jq/](https://cameronnokes.com/blog/working-with-json-in-bash-using-jq/)

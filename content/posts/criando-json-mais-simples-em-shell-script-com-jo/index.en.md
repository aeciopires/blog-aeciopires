---
title: "Creating JSON more easily in Shell Script with JO and JJ"
slug: "criando-json-mais-simples-em-shell-script-com-jo"
date: 2020-12-14T17:35:46-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
tags: ["linux", "bash"]
description: "I don't know about you, but I find it really tedious to create JSON in a shell script with the jq command."
sourceHash: "71f7a0f826cec156"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** examples tested with jo 1.9 (Ubuntu 24.04 package). The outputs shown were adjusted to the indentation that jo generates today.
{{< /alert >}}

I don't know about you, but I find it really tedious to create JSON in a **shell script** with the **jq** command.

I worked on something similar recently, so I spent a few hours researching and found the **jo** command ([https://github.com/jpmens/jo](https://github.com/jpmens/jo))

It is available for installation on Ubuntu, Arch Linux, and other GNU/Linux distros.

Usage example:

```text
jo -p name=jo n=17 parser=false
```

Result:

```json
{
   "name": "jo",
   "n": 17,
   "parser": false
}
```

Try doing the same thing with the jq command and compare the length and complexity of the command line...

Another, more complex example:

```text
jo -p name=JP object=$(jo fruit=Orange point=$(jo x=10 y=20) number=17) sunday=false
```

Result:

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

More information at:

[https://jpmens.net/2016/03/05/a-shell-command-to-create-json-jo/](https://jpmens.net/2016/03/05/a-shell-command-to-create-json-jo/)

[https://github.com/jpmens/jo/blob/master/jo.md](https://github.com/jpmens/jo/blob/master/jo.md)

The JJ tool ([https://github.com/tidwall/jj](https://github.com/tidwall/jj)), on the other hand, can be used to read, create, edit, and delete records in a JSON file.

To read JSON files or lint them, there are other tools that you can find at the following links:

- [https://github.com/antonmedv/fx](https://github.com/antonmedv/fx)
- [https://medium.com/better-programming/how-to-work-with-json-in-the-command-line-and-terminal-with-fx-58ac3cef8e04](https://medium.com/better-programming/how-to-work-with-json-in-the-command-line-and-terminal-with-fx-58ac3cef8e04)
- [https://geekflare.com/json-online-tools/](https://geekflare.com/json-online-tools/)
- [https://ilya-sher.org/2018/04/10/list-of-json-tools-for-command-line/](https://ilya-sher.org/2018/04/10/list-of-json-tools-for-command-line/)
- [https://cameronnokes.com/blog/working-with-json-in-bash-using-jq/](https://cameronnokes.com/blog/working-with-json-in-bash-using-jq/)

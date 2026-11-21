---
title: "Getting started with SaltStack"
slug: "primeiros-passos-com-saltstack"
date: 2018-10-13T15:28:07-03:00
lastmod: 2024-11-19T01:36:19-03:00
draft: false
categories: ["saltstack", "tutoriais"]
tags: ["saltstack", "zabbix"]
description: "SaltStack is an open source tool that handles configuration management of servers, services, containers, and network devices.…"
sourceHash: "581e8c467b30a5c5"
---

![saltstack](/wp-content/uploads/2018/10/saltstack.png)

Hello!

**[SaltStack](https://saltproject.io/)** is an open source tool that handles configuration management of servers, services, containers, and network devices.
It is an alternative to tools such as: Ansible ([https://www.ansible.com](https://www.ansible.com)), Puppet ([https://puppet.com](https://puppet.com)), and Chef ([https://www.chef.io/chef](https://www.chef.io/chef)).

**Update:** [SaltStack was acquired by VMware in October 2020](https://blogs.vmware.com/management/2020/10/vmware-completes-saltstack-acquisition-to-bolster-software-configuration-management-and-infrastructure-automation.html), but part of the project will remain open source on the [saltproject.io](https://saltproject.io/) website

I'm taking my first steps with SaltStack, and at the end of this page I want to share the links I have studied so far, which serve as a compass for anyone who wants to start using it too. This page will be updated as I find more relevant documents.

Before going on, I want to thank [**Alisson de Oliveira**](https://www.linkedin.com/in/alisson-de-oliveira-43863a33/), my coworker at [**Unirede**](https://www.unirede.net), who is helping me take my first steps.

In the following link, you will find a comparative analysis of SaltStack, Ansible, and Puppet, in which the author shares the pros and cons he found during his analysis, based on the needs of the project he worked on.

[https://blog.ryandlane.com/2014/08/04/moving-away-from-puppet-saltstack-or-ansible/](https://blog.ryandlane.com/2014/08/04/moving-away-from-puppet-saltstack-or-ansible/)

You can find more links to comparative studies of SaltStack, Puppet, Ansible, and Chef at the end of this page.

To speed up the creation of the test environment, follow the recommendations on the following page. It creates 3 virtual machines (1 master and 2 minions) using Vagrant and VirtualBox. Access to a computer/laptop with 6 GB of RAM is recommended.

[https://docs.saltstack.com/en/getstarted/fundamentals/index.html](https://docs.saltstack.com/en/getstarted/fundamentals/index.html)

I'm also sharing some SaltStack usage examples in the repository [https://github.com/aeciopires/saltstack-examples](https://github.com/aeciopires/saltstack-examples). One of the examples is installing Zabbix 4.2 using SaltStack.

Happy studying!

**Documentation:**

- Get started: [https://docs.saltstack.com/en/getstarted](https://docs.saltstack.com/en/getstarted/)
- Installing SaltStack on CentOS: [https://repo.saltstack.com/#rhel](https://repo.saltstack.com/#rhel)
- Installing SaltStack on Ubuntu: [https://repo.saltstack.com/#ubuntu](https://repo.saltstack.com/#ubuntu)
- Configuring SaltStack: [https://docs.saltstack.com/en/latest/ref/configuration/index.html](https://docs.saltstack.com/en/latest/ref/configuration/index.html)
- Manual: [https://docs.saltstack.com](https://docs.saltstack.com)
- Table of contents: [https://docs.saltstack.com/en/latest/contents.html](https://docs.saltstack.com/en/latest/contents.html)
- Modules: [https://docs.saltstack.com/en/latest/salt-modindex.html](https://docs.saltstack.com/en/latest/salt-modindex.html)
- Formulas (States): [https://github.com/saltstack-formulas](https://github.com/saltstack-formulas)

**Tutorials, blogs, and websites about SaltStack:**

- [https://www.tutorialspoint.com/saltstack](https://www.tutorialspoint.com/saltstack)
- [https://project-awesome.org/hbokh/awesome-saltstack](https://project-awesome.org/hbokh/awesome-saltstack)
- [https://blog.talpor.com/2014/07/saltstack-beginners-tutorial](https://blog.talpor.com/2014/07/saltstack-beginners-tutorial)
- [https://www.digitalocean.com/community/tutorial\_series/managing-development-environments-with-saltstack](https://www.digitalocean.com/community/tutorial_series/managing-development-environments-with-saltstack)
- [http://blog.infracloud.io/saltstack-tutorial-part-1](http://blog.infracloud.io/saltstack-tutorial-part-1)
- [http://blog.infracloud.io/saltstack-tutorial-part-2](http://blog.infracloud.io/saltstack-tutorial-part-2)
- [https://linuxacademy.com/blog/devops/getting-started-with-salt](https://linuxacademy.com/blog/devops/getting-started-with-salt)
- [https://www.mirantis.com/blog/introduction-to-salt-and-saltstack](https://www.mirantis.com/blog/introduction-to-salt-and-saltstack)
- [http://www.justincarmony.com/slides/salt-tutorial](http://www.justincarmony.com/slides/salt-tutorial)
- [https://www.linuxjournal.com/content/getting-started-salt-stack-other-configuration-management-system-built-python](https://www.linuxjournal.com/content/getting-started-salt-stack-other-configuration-management-system-built-python)
- [https://bencane.com/2013/09/03/getting-started-with-saltstack-by-example-automatically-installing-nginx](https://bencane.com/2013/09/03/getting-started-with-saltstack-by-example-automatically-installing-nginx)
- [https://foxutech.com/saltstack-introduction](https://foxutech.com/saltstack-introduction)
- [https://www.unixmen.com/saltstack-examples](https://www.unixmen.com/saltstack-examples)
- [https://www.yet.org/2016/09/salt/](https://www.yet.org/2016/09/salt/)
- [https://www.yet.org/2016/09/salt-formulas/](https://www.yet.org/2016/09/salt-formulas/)
- [https://www.yet.org/2016/10/reclass/](https://www.yet.org/2016/10/reclass/)
- [https://www.yet.org/2016/10/os-salt/](https://www.yet.org/2016/10/os-salt/)
- [http://eavpn.com/index.html](http://eavpn.com/index.html)
- [https://www.linode.com/docs/applications/configuration-management/beginners-guide-to-salt/](https://www.linode.com/docs/applications/configuration-management/beginners-guide-to-salt/)
- [https://foxutech.com/salt-commands/](https://foxutech.com/salt-commands/)
- [http://www.xenuser.org/saltstack-cheat-sheet/](http://www.xenuser.org/saltstack-cheat-sheet/)
- [https://github.com/harkx/saltstack-cheatsheet/blob/master/README.md](https://github.com/harkx/saltstack-cheatsheet/blob/master/README.md)
- [https://dev-eole.ac-dijon.fr/doc/cheatsheets/saltstack.html](https://dev-eole.ac-dijon.fr/doc/cheatsheets/saltstack.html)

**Videos:**

- [https://www.packtpub.com/networking-and-servers/learning-salt](https://www.packtpub.com/networking-and-servers/learning-salt)

**Books:**

- [http://shop.oreilly.com/product/0636920033240.do](http://shop.oreilly.com/product/0636920033240.do)
- [https://www.packtpub.com/networking-and-servers/mastering-saltstack-second-edition](https://www.packtpub.com/networking-and-servers/mastering-saltstack-second-edition)
- [https://www.packtpub.com/networking-and-servers/learning-saltstack-second-edition](https://www.packtpub.com/networking-and-servers/learning-saltstack-second-edition)
- [https://www.packtpub.com/networking-and-servers/extending-saltstack](https://www.packtpub.com/networking-and-servers/extending-saltstack)
- [https://www.packtpub.com/networking-and-servers/mastering-saltstack](https://www.packtpub.com/networking-and-servers/mastering-saltstack)
- [https://www.packtpub.com/networking-and-servers/learning-saltstack](https://www.packtpub.com/networking-and-servers/learning-saltstack)
- [https://www.packtpub.com/networking-and-servers/salt-cookbook](https://www.packtpub.com/networking-and-servers/salt-cookbook)
- [https://search.packtpub.com/?query=saltstack&refinementList%5Breleased%5D%5B0%5D=Available](https://search.packtpub.com/?query=saltstack&refinementList%5Breleased%5D%5B0%5D=Available)

**Docker and Salt:**

- [https://docs.saltstack.com/en/develop/ref/modules/all/salt.modules.docker.html](https://docs.saltstack.com/en/develop/ref/modules/all/salt.modules.docker.html)
- [https://medium.com/@timlwhite/the-simplest-way-to-learn-saltstack-cd9f5edbc967](https://medium.com/@timlwhite/the-simplest-way-to-learn-saltstack-cd9f5edbc967)
- [https://github.com/saltstack/docker-containers](https://github.com/saltstack/docker-containers)
- [https://hackernoon.com/creating-an-army-of-docker-containers-using-saltstack-boto3-cloudinit-on-aws-cfd048e9c116](https://hackernoon.com/creating-an-army-of-docker-containers-using-saltstack-boto3-cloudinit-on-aws-cfd048e9c116)
- [https://amplitude.com/blog/2016/03/03/deploying-docker-saltstack](https://amplitude.com/blog/2016/03/03/deploying-docker-saltstack)
- [https://opsnotice.xyz/docker-with-saltstack/](https://opsnotice.xyz/docker-with-saltstack/)

**Jinja:**

- [http://jinja.pocoo.org/docs/2.10/templates/](http://jinja.pocoo.org/docs/2.10/templates/)
- [http://jinja.quantprogramming.com/](http://jinja.quantprogramming.com/)

**YAML:**

- [http://yaml-online-parser.appspot.com](http://yaml-online-parser.appspot.com/)
- [http://www.yamllint.com](http://www.yamllint.com/)

**Comparison of Puppet, Ansible, Chef, and SaltStack:**

- [https://www.tutorialspoint.com/saltstack/saltstack\_competitors.htm](https://www.tutorialspoint.com/saltstack/saltstack_competitors.htm)
- [https://www.anutanetworks.com/network-automation-with-chef-puppet-ansible/](https://www.anutanetworks.com/network-automation-with-chef-puppet-ansible/)
- [https://blog.overops.com/deployment-management-tools-chef-vs-puppet-vs-ansible-vs-saltstack-vs-fabric/](https://blog.overops.com/deployment-management-tools-chef-vs-puppet-vs-ansible-vs-saltstack-vs-fabric/)
- [https://www.infoworld.com/article/2609482/data-center-review-puppet-vs-chef-vs-ansible-vs-salt.html](https://www.infoworld.com/article/2609482/data-center-review-puppet-vs-chef-vs-ansible-vs-salt.html)
- [http://www.diva-portal.org/smash/get/diva2:1117279/FULLTEXT01.pdf](http://www.diva-portal.org/smash/get/diva2:1117279/FULLTEXT01.pdf)
- [http://www.diva-portal.org/smash/record.jsf?pid=diva2%3A1117279&dswid=9945](http://www.diva-portal.org/smash/record.jsf?pid=diva2%3A1117279&dswid=9945)
- [http://www.diva-portal.org/smash/record.jsf?pid=diva2%3A732615&dswid=-2929](http://www.diva-portal.org/smash/record.jsf?pid=diva2%3A732615&dswid=-2929)
- [https://www.networkworld.com/article/2172097/puppet-vs--chef-vs--ansible-vs--salt.amp.html](https://www.networkworld.com/article/2172097/puppet-vs--chef-vs--ansible-vs--salt.amp.html)
- [https://www.intigua.com/blog/puppet-vs.-chef-vs.-ansible-vs.-saltstack](https://www.intigua.com/blog/puppet-vs.-chef-vs.-ansible-vs.-saltstack)
- [https://resources.sei.cmu.edu/asset\_files/WhitePaper/2019\_019\_001\_539335.pdf](https://resources.sei.cmu.edu/asset_files/WhitePaper/2019_019_001_539335.pdf)
- [https://technology.hcs-company.com/a-short-comparison-of-ansible-chef-puppet-and-saltstack/](https://technology.hcs-company.com/a-short-comparison-of-ansible-chef-puppet-and-saltstack/)
- [https://www.quora.com/Whats-the-difference-between-Ansible-Puppet-Chef-and-SaltStack](https://www.quora.com/Whats-the-difference-between-Ansible-Puppet-Chef-and-SaltStack)
- {{< removido nome="Devops-Comparison-v3.pdf" >}}
- [http://www.diva-portal.org/smash/get/diva2:732615/FULLTEXT01.pdf](http://www.diva-portal.org/smash/get/diva2:732615/FULLTEXT01.pdf)
- [https://resources.sei.cmu.edu/asset\_files/WhitePaper/2019\_019\_001\_539335.pdf](https://resources.sei.cmu.edu/asset_files/WhitePaper/2019_019_001_539335.pdf)
- [https://en.wikipedia.org/wiki/Comparison\_of\_open-source\_configuration\_management\_software](https://en.wikipedia.org/wiki/Comparison_of_open-source_configuration_management_software)
- [https://www.infoworld.com/article/2609482/data-center-review-puppet-vs-chef-vs-ansible-vs-salt.html](https://www.infoworld.com/article/2609482/data-center-review-puppet-vs-chef-vs-ansible-vs-salt.html)
- [https://ieeexplore.ieee.org/abstract/document/8329890](https://ieeexplore.ieee.org/abstract/document/8329890)
- [https://ieeexplore.ieee.org/abstract/document/7950402](https://ieeexplore.ieee.org/abstract/document/7950402)
- [https://ieeexplore.ieee.org/abstract/document/6932958](https://ieeexplore.ieee.org/abstract/document/6932958)

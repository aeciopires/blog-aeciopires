---
title: "Learning AWS CDK with Python and Floci"
slug: "aprendendo-aws-cdk-com-python-e-floci"
date: 2026-10-01T20:42:30-03:00
lastmod: 2026-10-01T20:42:31-03:00
draft: false
categories: ["devops", "docker", "git", "tutoriais"]
tags: ["aws", "cdk", "iac", "python", "docker"]
description: "A few days ago, I needed to study AWS CDK (Cloud Development Kit) and organized the content, code examples, and tests in this repository:…"
sourceHash: "083cbe6f63d7c809"
---

A few days ago, I needed to study [AWS CDK (Cloud Development Kit)](https://docs.aws.amazon.com/cdk/v2/guide/home.html) and organized the content, code examples, and tests in this repository: [https://github.com/aeciopires/learning-cdk-python](https://github.com/aeciopires/learning-cdk-python). The material grew so much that it became a learning path.

I also intend to help other people who are studying CDK to use it at work.

## What is AWS CDK?

{{< figure src="/wp-content/uploads/2026/10/cdk.png" alt="cdk" >}}

> The AWS Cloud Development Kit (AWS CDK) is an open-source software development framework for defining cloud infrastructure in code and provisioning it through [AWS CloudFormation](https://aws.amazon.com/pt/cloudformation/).

In practice, instead of clicking around the AWS console or writing hundreds of lines of CloudFormation JSON/YAML, you write a Python class (a `*Stack*`) describing a queue, a bucket, a database... CDK turns that code into a CloudFormation template (`cdk synth`), shows what is going to change (`cdk diff`), and creates the resources (`cdk deploy`).

If you already use [Terraform](https://developer.hashicorp.com/terraform) (I wrote about it in [Getting to know Terraform](/en/conhecendo-o-terraform/)), you will feel right at home with the idea of infrastructure as code. The difference is that, with CDK, you use a real programming language: loops, functions, classes, unit tests, everything we already know from software development.

## What about Floci?

{{< figure src="/wp-content/uploads/2026/10/floci.png" alt="floci" >}}

The biggest obstacle for anyone learning AWS is the fear of the bill at the end of the month. A NAT Gateway, an RDS database, or an EKS cluster left running by mistake can lead to a very unpleasant surprise.

To solve this, the code in the repository runs on [floci](https://floci.io), **a free and open-source local AWS emulator** that runs with a simple `docker compose up`. The AWS CLI, SDK (boto3), and CDK commands work the same way as they would on AWS, except they point to a container running in your local environment.

That way, you can make mistakes, delete, recreate, and break everything as much as you want, at no cost at all. When you feel confident, each module also has instructions for deploying to a real AWS account (with very clear cost warnings, so nobody gets caught by surprise).

## Some lessons learned along the way

While building the content of this repository, I learned a lot of things that are not in the "hello world" tutorials:

- **Not everything the emulator says it created was actually created.** Some services (DocumentDB, MSK, OpenSearch, among others) are only registered by floci's CloudFormation, but are not created. That's why each README includes the AWS CLI commands to check each resource one by one, and the limitations are honestly documented.
- **Running `cdk deploy` twice should not duplicate anything**, but on floci this happened with some resources. The explanation (and the solution) are in the documentation.
- **Running `cdk diff` before every `cdk deploy`** is a habit worth its weight in gold, especially in production.
- **Infrastructure unit tests** catch many errors before any resource even exists.

## Wrapping up...

I hope this repository can help you learn and use AWS CDK with more safety and confidence. Publishing this material is a way to learn better and to give back to the community, sharing what I learned and used for free, thanks to what other people created and shared.

The project is open source (GPLv3) and open to suggestions for improvement and contributions, whether fixing something, improving the documentation, or creating new modules. If the content is useful to you, leave a star ⭐ on the repository and share it with anyone who also needs to learn CDK.

See you next time!

## References

- https://github.com/aeciopires/learning-cdk-python
- https://docs.aws.amazon.com/cdk/v2/guide/home.html
- https://docs.aws.amazon.com/cdk/api/v2/python/
- https://floci.io
- https://github.com/floci-io/floci
- https://docs.astral.sh/uv/
- https://mise.jdx.dev

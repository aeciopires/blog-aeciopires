---
title: "Learning Amazon ECS with AWS CDK, Python and Floci"
slug: "aprendendo-amazon-ecs-com-aws-cdk-python-e-floci"
date: 2026-10-03T02:35:40-03:00
lastmod: 2026-10-03T02:35:41-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "tutoriais"]
tags: ["aws", "cdk", "ecs", "iac", "python"]
description: "A few days ago, I published the post Learning AWS CDK with Python and Floci here on the blog. Right after that, I needed to dive deeper into Amazon ECS (Elastic…"
sourceHash: "dc611b0eef0b3501"
---

* * *

A few days ago, I published the post [Learning AWS CDK with Python and Floci](/en/aprendendo-aws-cdk-com-python-e-floci/) here on the blog. Right after that, I needed to dive deeper into [Amazon ECS (Elastic Container Service)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) and followed the same learning method: I organized the content, the code examples, and the tests in this repository: [https://github.com/aeciopires/learning-ecs](https://github.com/aeciopires/learning-ecs). And, once again, the material grew so much that it became a learning path, from zero to advanced.

My intention is also to help other people who are studying ECS to use it at work.

## What is Amazon ECS?

Amazon ECS is a fully managed container orchestration service that helps you deploy, manage, and scale containerized applications.

In practice, you describe your application in a _task definition_ (image, CPU, memory, ports, variables, secrets…), create a _service_ that keeps the desired number of tasks running, and choose where they will run: on [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) (no servers to manage) or on EC2 instances that you control. ECS takes care of replacing tasks that fail, registering everything with the load balancer, and deploying new versions.

If you already use Kubernetes ([I've written about it in several posts here on the blog](/en/?s=kubernetes) and I even have a [course if you want to learn about it or go deeper into the subject](/en/curso-kubernetes-k8s/)), you will recognize many ideas: a _task definition_ resembles a _Pod_, and a _service_ resembles a _Deployment_. The difference is that ECS is simpler and tightly integrated with the other AWS services, with no _control plane_ for you to manage.

## What about Floci?

Just like in the CDK learning path, all the infrastructure is written with [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html) in Python, and each module runs first on [floci](https://floci.io), **a free and open source local AWS emulator** that runs with a simple `docker compose up`.

And here comes the coolest part: floci runs ECS tasks as **real containers** on your machine. You deploy a Fargate service behind an ALB, run a `curl` against `localhost`, and get the application's response. All of this without an AWS account and at no cost.

When you feel confident, each module also has instructions for deploying to a real AWS account, with very clear cost warnings (NAT Gateway, load balancers, and databases are billed by the hour, so don't forget to destroy everything afterward).

## What's in the learning path?

There are several **modules**, organized into 6 phases:

- **Fundamentals:** multi-AZ networking (VPC, subnets, NAT, flow logs), the first service on Fargate, and capacity with EC2 instances.
- **Exposing services:** ALB and NLB (public and internal), API Gateway, CloudFront, and Service Connect for service-to-service communication.
- **Data and messaging:** RDS MySQL (with WordPress), RDS PostgreSQL (with PostgREST), Aurora, ElastiCache (Valkey), DocumentDB, SQS + SNS, and S3.
- **Scaling and releasing versions:** Service Auto Scaling and deployment strategies (rolling update, blue/green, canary, and linear, plus rollback).
- **Cross-region resilience:** the same application in two regions, with failover through CloudFront.
- **Observability:** CloudWatch, Prometheus and Grafana, and Datadog.

Each module is a CDK stack that you can deploy, test, and destroy, and it has a README with: the architecture, the configuration variables, **all the AWS CLI commands** to create, inspect, change, and remove what the module teaches, the metrics to watch, a troubleshooting guide, and a "floci vs real AWS" table showing what works locally and what only works on AWS.

The applications used are public images from Docker Hub (nginx, traefik/whoami, wordpress, postgrest, prom/prometheus, grafana, datadog/agent…), with no custom images.

## Some lessons learned along the way

While building the content of this repository, I learned a lot that isn't in the "hello world" tutorials:

- **An emulator is not AWS.** floci actually runs a lot of things, but some features are only accepted and not applied (for example, blue/green, canary, and circuit breaker in deployments, or the CloudFront failover origin). That's why each module honestly documents what works locally and what only works in a real account.
- **`cdk destroy` on floci leaves the VPCs behind.** Everything else is removed, but the empty VPC stays, and each destroy + deploy cycle adds one more. I created the `scripts/floci_prune.py` script to find and delete these orphaned VPCs.
- **On floci, always use `cdk deploy --method=direct`.** With the default method (change set), floci recreated resources without a fixed name on every deploy, even with no changes. The explanation is in the documentation.
- **Learning to operate ECS with the AWS CLI is as important as writing the infrastructure.** Day to day, it's with `aws ecs describe-services`, `list-tasks`, `update-service`, and `execute-command` that you investigate a problem in production.
- **Infrastructure unit tests** still catch many errors before any resource exists. All stacks have tests, with about 99% coverage.

## Wrapping up…

I hope this repository can help you learn and use Amazon ECS more safely and confidently. Publishing this material is a way to learn better and to give back to the community, sharing what I learned and used for free from what other people created and shared.

The project is open source (GPLv3) and open to suggestions for improvement and contributions, whether fixing something, improving the documentation, or creating new modules. If the content is useful to you, leave a star ⭐ on the repository and share it with anyone who also needs to learn ECS.

See you next time!

## References

- [https://github.com/aeciopires/learning-ecs](https://github.com/aeciopires/learning-ecs)
- [/en/aprendendo-aws-cdk-com-python-e-floci/](/en/aprendendo-aws-cdk-com-python-e-floci/)
- [https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
- [https://docs.aws.amazon.com/cdk/v2/guide/home.html](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [https://docs.aws.amazon.com/cdk/api/v2/python/](https://docs.aws.amazon.com/cdk/api/v2/python/)
- [https://floci.io](https://floci.io)
- [https://github.com/floci-io/floci](https://github.com/floci-io/floci)
- [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)
- [https://mise.jdx.dev](https://mise.jdx.dev)

* * *

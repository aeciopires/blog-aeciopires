---
title: "CLI: Update-Git"
slug: "cli-update-git"
date: 2026-07-12T04:23:08-03:00
lastmod: 2026-07-12T04:23:44-03:00
draft: false
categories: ["devops", "git", "go"]
tags: ["git", "golang", "linux"]
description: "updateGit is a Golang CLI tool that automatically discovers and updates all git repositories inside a specified base directory."
sourceHash: "04f76654be7b1f95"
---

**updateGit** is a Golang CLI tool that automatically discovers and updates all git repositories inside a specified base directory.

In my daily work, I deal with dozens of git repositories cloned in my local environment, and I'm used to keeping all of them up to date before making any change. Instead of updating each repository individually, I created this tool so that, with a single command, I keep all the repository clones up to date.

Features:

- 🔍 Updates multiple git repositories:
  - Automatic discovery of git repositories in the specified directory
  - Batch execution of the git pull command in all discovered repositories
  - Detection of Git repository metadata
- ⚙️ Configuration: support for configuration files and environment variables
- 🛡️ Error handling: comprehensive error handling with detailed messages

More usage details can be found at: [https://github.com/aeciopires/updateGit](https://github.com/aeciopires/updateGit)

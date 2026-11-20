#!/usr/bin/env python3
"""Fase 3/4 (uso único): define a linguagem dos blocos de código sem linguagem (MD040).

Só marca a linguagem quando o conteúdo é inequívoco; o resto vira "text" (sem destaque),
para revisão na Fase 4. Imprime um relatório por linguagem.
Uso: python3 -I scripts/migracao/linguagem_blocos.py [--write]
"""
import glob
import json
import os
import re
import sys
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CMDS = r"(sudo|cd|export|curl|wget|docker|docker-compose|kubectl|helm|git|apt|apt-get|yum|dnf|brew|mkdir|echo|chmod|chown|terraform|terragrunt|make|pip3?|python3?|go|systemctl|service|cat|vim|nano|ls|cp|mv|rm|tar|unzip|ssh|scp|source|aws|gcloud|az|mise|asdf|minikube|kind|k0s|vault|argocd|flux|eksctl|npm|npx|node|openssl|ln|sed|awk|grep|watch|tee|touch|java|mvn|ansible|ansible-playbook|salt|puppet|zabbix_\w+|psql|mysql|htpasswd|keytool|update-alternatives|useradd|usermod|passwd|systemd\w*|journalctl|nohup|\./[\w.-]+|\$\w+=?)"


def classificar(codigo):
    linhas = [l for l in codigo.split("\n") if l.strip()]
    if not linhas:
        return "text"
    primeira = linhas[0].strip()
    try:
        if primeira[:1] in "{[":
            json.loads(codigo)
            return "json"
    except ValueError:
        pass
    if re.match(r"^FROM\s+\S+", primeira):
        return "dockerfile"
    if primeira.startswith("<?xml") or re.match(r"^<[a-zA-Z][\w:-]*[\s>]", primeira):
        return "xml"
    if re.match(r"^(resource|provider|variable|module|terraform|data|output|locals)\s+(\"|\{)", primeira):
        return "hcl"
    if re.match(r"^package\s+\w+$", primeira):
        return "go"
    eh_cmd = re.compile(r"^\s*(\$\s+)?" + CMDS + r"(\s|$)")
    if eh_cmd.match(primeira) and "<<" in primeira:
        return "bash"                       # heredoc: o conteúdo faz parte do comando
    # junta continuações de linha ("\\" no fim) antes de contar comandos
    juntas = re.sub(r"\\\n", " ", "\n".join(linhas)).split("\n")
    sem_coment = [l for l in juntas if not re.match(r"^\s*#", l)] or juntas
    comandos = sum(1 for l in sem_coment if eh_cmd.match(l))
    if comandos and comandos >= len(sem_coment) * 0.5:
        return "bash"
    chave = re.compile(r"^\s*(-\s+)?[\w.\-/\"']+:(\s|$)|^\s*-\s+\S|^---$|^\s*#")
    yaml = sum(1 for l in linhas if chave.match(l))
    if re.match(r"^(apiVersion|kind|services)\s*:", primeira) or (yaml == len(linhas) and len(linhas) >= 3):
        return "yaml"
    return "text"


def main():
    gravar = "--write" in sys.argv
    total = Counter()
    for f in sorted(glob.glob(os.path.join(RAIZ, "content", "**", "index.md"), recursive=True)):
        s = open(f, encoding="utf-8").read()

        def troca(m):
            lang = classificar(m.group(2))
            total[lang] += 1
            return m.group(1) + lang + "\n" + m.group(2) + m.group(3)
        def troca_citacao(m):           # bloco dentro de citação: "> ```"
            pre = m.group(1)
            codigo = re.sub(r"^" + re.escape(pre.rstrip()) + r" ?", "", m.group(3), flags=re.M)
            lang = classificar(codigo)
            total[lang] += 1
            return pre + "```" + lang + "\n" + m.group(3) + m.group(4)
        novo = re.sub(r"(^```)\n(.*?)(^```[ \t]*$)", troca, s, flags=re.S | re.M)
        novo = re.sub(r"^((?:> ?)+)(```)\n(.*?)(^(?:> ?)+```[ \t]*$)", troca_citacao, novo, flags=re.S | re.M)
        if gravar and novo != s:
            open(f, "w", encoding="utf-8").write(novo)
    print("blocos sem linguagem por classificação:", dict(total.most_common()))
    if not gravar:
        print("SIMULAÇÃO. Use --write.")


if __name__ == "__main__":
    main()

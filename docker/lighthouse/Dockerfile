# Lighthouse em container para `make lighthouse` (docs/MAINTENANCE.md, seção 4).
# Só imagem oficial do Node + Chromium do Debian + pacote oficial `lighthouse` (Google), versões fixas.
# Atualizar: NODE_IMAGE (LTS do mise.toml) e LIGHTHOUSE_VERSION no Makefile; o build usa os ARGs abaixo.
ARG NODE_IMAGE=node:26-bookworm-slim
FROM ${NODE_IMAGE}
ARG LIGHTHOUSE_VERSION=13.6.0
RUN apt-get update -qq \
 && apt-get install -y -qq --no-install-recommends chromium fonts-dejavu-core ca-certificates >/dev/null \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g --silent "lighthouse@${LIGHTHOUSE_VERSION}"
ENV CHROME_PATH=/usr/bin/chromium
USER node
WORKDIR /home/node
ENTRYPOINT ["lighthouse"]

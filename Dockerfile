FROM node:lts-alpine AS base

FROM base AS build
RUN apk add --no-cache git
RUN git clone https://github.com/nasa/openmct.git && cd openmct && git checkout v2.1.3 && npm install

FROM base AS libraries
WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci

FROM base AS runtime
RUN apk add --update --no-cache dumb-init
ENV NODE_ENV=production
USER node

WORKDIR /usr/src/app
COPY --chown=node:node --from=libraries /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node --from=build /openmct/dist/ /usr/src/app/public/
COPY --chown=node:node app.js .
VOLUME [ "/usr/src/app/public/plugins" ]
EXPOSE 3000
HEALTHCHECK NONE
CMD ["dumb-init", "node", "app.js"]
FROM node:22 as sadh-front-build-step

RUN mkdir -p /app
RUN npm cache clear --force

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

ARG mode
RUN npm run build -- --mode $mode

FROM caddy:2.10
RUN rm -rf /usr/share/caddy
COPY --from=sadh-front-build-step /app/dist /usr/share/caddy

COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
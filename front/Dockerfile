FROM node:18 as faipp-frontend-build-step

RUN mkdir -p /app
RUN npm cache clear --force

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

RUN npm run build


FROM nginx
RUN rm -rfd /var/www/html/
COPY --from=faipp-frontend-build-step /app/dist /var/www/html/

EXPOSE 80

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]

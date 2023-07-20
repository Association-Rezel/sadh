FROM node:18 as faipp-frontend-build-step

RUN mkdir -p /app
RUN npm cache clear --force

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

RUN npm run build


FROM nginx
RUN rm -rfd /usr/share/nginx/html
COPY --from=faipp-frontend-build-step /app/dist /usr/share/nginx/html

RUN sed -i 's/index  index.html index.htm;/index  index.html index.htm;\n        try_files $uri $uri\/ $uri.html \/index.html;/g' /etc/nginx/conf.d/default.conf

EXPOSE 80

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]

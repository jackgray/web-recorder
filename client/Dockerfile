# Stage 1: Build the React application
FROM node:16 AS build

WORKDIR /app

COPY package*.json  ./

RUN npm install

COPY ./src ./src
COPY ./public ./public

RUN npm run build

# Stage 2: Serve the application using nginx
FROM nginx:stable-alpine as serve

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.template

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 443

# Add bash
RUN apk add --no-cache bash

# Sub in the env vars used in nginx.conf on launch since it cannot read env vars at runtime
# This makes the container configurable without rebuild
CMD /bin/bash -c "envsubst '$NGINX_CLIENT_NAME' < /etc/nginx/nginx.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"
# CMD ["nginx", "-g", "daemon off;"]

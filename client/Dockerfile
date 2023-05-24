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

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]

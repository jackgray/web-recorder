# Stage 2: Serve the application using nginx
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl /app/data/ssl

EXPOSE 443

RUN nginx -t
# Add bash
# RUN apk add --no-cache bash

# Sub in the env vars used in nginx.conf on launch since it cannot read env vars at runtime
# This makes the container configurable without rebuild
# CMD /bin/bash -c "envsubst '$NGINX_CLIENT_NAME' < /etc/nginx/nginx.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"
CMD ["nginx", "-g", "daemon off;"]




#!/bin/env bash

source .env

# CLIENT azure container instance
az container create \
--resource-group "${RESOURCE_GROUP}" \
--name "${CONTAINER_NAME_CLIENT}" \
--image "${DOCKER_IMAGE_CLIENT}" \
--dns-name-label "${DNS_NAME_LABEL_CLIENT}" \
--ports 443 \
--environment-variables \
CLIENT_ENDPOINT="$CLIENT_ENDPOINT" \
SERVER_ENDPOINT="$SERVER_ENDPOINT" \
NGINX_SERVER_NAME="$NGINX_SERVER_NAME" \
SERVER_PORT="$SERVER_PORT" \
--azure-file-volume-account-name "${FILE_VOLUME_ACCOUNT_NAME}" \
--azure-file-volume-account-key "${FILE_VOLUME_ACCOUNT_KEY}" \
--azure-file-volume-share-name "${FILE_VOLUME_SHARE_NAME}" \
--azure-file-volume-mount-path /app/data

#SERVER
az container create \
--resource-group "${RESOURCE_GROUP}" \
--name "${CONTAINER_NAME_SERVER}" \
--image "${DOCKER_IMAGE_SERVER}" \
--dns-name-label "${DNS_NAME_LABEL_SERVER}" \
--ports 443 \
--environment-variables \
CLIENT_ENDPOINT="$CLIENT_ENDPOINT" \
SERVER_ENDPOINT="$SERVER_ENDPOINT" \
SERVER_PORT="$SERVER_PORT" \
--azure-file-volume-account-name "${FILE_VOLUME_ACCOUNT_NAME}" \
--azure-file-volume-account-key "${FILE_VOLUME_ACCOUNT_KEY}" \
--azure-file-volume-share-name "${FILE_VOLUME_SHARE_NAME}" \
--azure-file-volume-mount-path /app/data
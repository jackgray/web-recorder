#!/bin/env bash
PROXY_VERSION=v1.5

source ../../.env

# Build the Docker image and tag it with the version number
docker build -t "$DOCKER_IMAGE_REVERSE_PROXY" .

# Optionally, also tag the image as 'latest'
docker tag "${DOCKER_IMAGE_REVERSE_PROXY}" jackgray/"$CONTAINER_NAME_REVERSE_PROXY":"${PROXY_VERSION}"

# Push the image to Docker Hub
docker push "$DOCKER_IMAGE_REVERSE_PROXY"
docker push jackgray/"$CONTAINER_NAME_REVERSE_PROXY":"${PROXY_VERSION}"
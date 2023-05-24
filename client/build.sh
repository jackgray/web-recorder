#!/bin/env bash

source ../.env

# Build the Docker image and tag it with the version number
docker build -t "$DOCKER_IMAGE_CLIENT" .

# Optionally, also tag the image as 'latest'
# docker tag "${DOCKER_IMAGE_CLIENT}" jackgray/"$CONTAINER_NAME_CLIENT":latest

# Push the image to Docker Hub
docker push "$DOCKER_IMAGE_CLIENT"
# docker push jackgray/"$CONTAINER_NAME_CLIENT":latest
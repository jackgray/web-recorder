#!/bin/env bash

source ../.env

# Build the Docker image and tag it with the version number
docker build -t jackgray/audio-recorder-client:${APP_VERSION} .
docker push jackgray/audio-recorder-client:${APP_VERSION}

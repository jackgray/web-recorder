az storage file list --share-name $FILE_VOLUME_SHARE_NAME --account-name $FILE_VOLUME_ACCOUNT_NAME --path ssl --output table

az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME_CLIENT --container-name $CONTAINER_NAME_CLIENT --follow

az container show --name $CONTAINER_NAME_CLIENT --resource-group $RESOURCE_GROUP

sudo mount -t cifs $FILE_VOLUME_ACCOUNT_NAME.file.core.windows.net/$FILE_VOLUME_SHARE_NAME /mnt/myshare -o vers=3.0,username=$FILE_VOLUME_ACCOUNT_NAME,password=$FILE_VOLUME_ACCOUNT_KEY,dir_mode=0777,file_mode=0777


az container attach --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME_CLIENT

docker service create \
  --name client \
  --replicas 1 \
  --publish published=443,target=443 \
  --mount type=volume,source=./ssl,target=/ssl \
  --env SERVER_PORT=443 \
  jackgray/${DOCKER_IMAGE_CLIENT}

docker service create \
--name server \
--replicas 1 \
--publish published=443,target=443 \
--mount type=bind,source=/home/jackgray/Code/audio-recording-webapp/ssl,target=/ssl \
--mount type=bind,source=/home/jackgray/Code/audio-recording-webapp/config,target=/config \
--mount type=bind,source=/home/jackgray/Code/audio-recording-webapp/uploads,target=/uploads \
--mount type=bind,source=/home/jackgray/Code/audio-recording-webapp/audio,target=/audio \
--env SERVER_PORT=443 \
${DOCKER_IMAGE_SERVER}


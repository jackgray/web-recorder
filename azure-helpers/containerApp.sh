# Commands for setting up the container images as a "containerapp" as opposed to container instance
# add container app extension
az extension add --name containerapp --upgrade

# register namespaces
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights

# Create a containerapp environment
az containerapp env create \
  --name "$AZ_ENV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$AZ_LOCATION"

# Make the container app
#---------- CLIENT ---------
az containerapp up \
  --name "$CONTAINER_NAME_CLIENT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$AZ_LOCATION" \
  --environment "$AZ_ENV_NAME" \
  --image "$DOCKER_IMAGE_CLIENT" \
  --target-port "$CLIENT_PORT_SSL" \
  --ingress external \
  --query properties.configuration.ingress.fqdn

#---------- SERVER ---------
az containerapp up \
  --name "$CONTAINER_NAME_SERVER" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --environment "$AZ_ENV_NAME" \
  --image "$DOCKER_IMAGE_SERVER" \
  --target-port "$SERVER_PORT" \
  --ingress external \
  --query properties.configuration.ingress.fqdn


az containerapp env storage set --name "$ORG_NAME" --resource-group "$RESOURCE_GROUP" \
    --storage-name mystorage \
    --azure-file-account-name "$FILE_VOLUME_ACCOUNT_NAME" \
    --azure-file-account-key "$FILE_VOLUME_ACCOUNT_KEY" \
    --azure-file-share-name "$FILE_VOLUME_SHARE_NAME" \
    --access-mode ReadWrite

# Get yaml template for app
az containerapp show -n "$CONTAINER_NAME_SERVER" -g "$RESOURCE_GROUP" -o yaml > server.yaml

# Modify yaml template with volume mount details then update
az containerapp update --name "$CONTAINER_NAME_SERVER" --resource-group "$RESOURCE_GROUP" \
    --set-env-vars \
    CLIENT_ENDPOINT="$CLIENT_ENDPOINT" \
    SERVER_ENDPOINT="$SERVER_ENDPOINT" \
    NGINX_SERVER_NAME="$NGINX_SERVER_NAME" \
    SERVER_PORT="$SERVER_PORT" \
    --yaml server.yaml

# Above, yaml and other flags must be updated separately. 
# AZ CLI ignores flags in the presence of a yaml file.

# You must then validate your custom domain for each server and client in the Azure portal
# Go to your container app in the portal and select custom domains on the sidebar. Select "add certificates later".
# Add the CNAME and txt records to your dns settings of your domain provider.

# Logs
az containerapp logs show --name "$CONTAINER_NAME_CLIENT" --resource-group "$RESOURCE_GROUP"

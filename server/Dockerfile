# Use the official lightweight Node.js 16 image.
FROM node:16-buster-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json before other files
# Utilise Docker cache to save re-installing dependencies if unchanged
COPY package*.json ./

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg

# Install app dependencies
RUN npm install

# Copy app source code
COPY . .

# Start the app
CMD [ "node", "src/server.js" ]

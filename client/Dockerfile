# Use an official Node.js runtime as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies in the container
RUN npm install

# Copy the rest of your app's source code to the container
COPY . .

# Build the app
RUN npm run build

# Expose port 5000 for the app (default for serve)
EXPOSE 3000

# Command to serve the built app using serve
CMD ["node", "server.js"]

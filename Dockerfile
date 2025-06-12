# Use Node.js 23 LTS
FROM node:23-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and root files
COPY . .

# Expose port
EXPOSE 3007

# Start the service
CMD ["node", "server.js"]
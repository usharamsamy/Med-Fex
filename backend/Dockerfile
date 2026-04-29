# Use node 20 alpine for a slim image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the backend port
EXPOSE 5000

# Run the server
CMD ["npm", "start"]

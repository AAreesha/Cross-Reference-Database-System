# Use official Node.js Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose Vite's default dev server port
EXPOSE 5173

# Run the Vite development server
CMD ["npm", "run", "dev"]

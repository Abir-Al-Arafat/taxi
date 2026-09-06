# ==========================================
# Stage 1: Build the TypeScript application
# ==========================================
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for building)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the TypeScript code (assumes you have a "build" script in package.json)
RUN npm run build

# ==========================================
# Stage 2: Run the production application
# ==========================================
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only package files to install production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the compiled output from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Ensure the public directory exists for uploaded static assets
RUN mkdir -p /usr/src/app/public

# Expose the port your app runs on
EXPOSE 5000

# Start the application
CMD ["node", "dist/server.js"]
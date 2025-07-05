# Stage 1: Install dependencies and build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client (needed for build if you import types or client during build)
# Ensure your DATABASE_URL is available if your build step tries to connect to the DB,
# or mock Prisma client generation if not needed for build.
# For now, assuming generate is safe. If it needs DB, this might need adjustment or a dummy URL.
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Set NEXT_TELEMETRY_DISABLED to 1 to disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules # If you have runtime dependencies not bundled by Next.js

# For Prisma Client in production, copy the generated client and schema
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client


# Expose port 3000
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Command to run the application
# The `next start` command requires `package.json` to exist if not using a custom server.
# Ensure `package.json` includes "next": "version" in dependencies.
CMD ["npm", "start"]

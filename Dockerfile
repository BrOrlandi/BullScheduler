FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Switch to root to copy files and change ownership
USER root

# Copy package files and ensure appuser owns them
COPY --chown=appuser:appgroup package*.json pnpm-lock.yaml ./

# Install production dependencies using pnpm
RUN pnpm install --prod --frozen-lockfile

# Copy source code and ensure appuser owns it
COPY --chown=appuser:appgroup . .

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["node", "index.js"]

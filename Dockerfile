FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Create a non-root user (group with the same name 'appuser' will be created automatically)
RUN adduser -D appuser

# Copy package files and ensure appuser owns them
# No need to switch to root if the directory /app is writable by the current user (root at this stage)
# or if we ensure subsequent commands run as root before switching to appuser permanently.
# For simplicity and safety, perform chown operations as root.
USER root
COPY --chown=appuser:appuser package*.json pnpm-lock.yaml ./

# Install production dependencies using pnpm
RUN pnpm install --prod --frozen-lockfile

# Copy source code and ensure appuser owns it
COPY --chown=appuser:appuser . .

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["node", "index.js"]

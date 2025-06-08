# BullScheduler

A lightweight job scheduling service built with Node.js, Express, and BullMQ. This service allows you to schedule jobs to be executed at specific times or after delays, with jobs being sent to a configured webhook URL when they execute.

## Features

- **Job Scheduling**: Schedule jobs to run at specific times (`executeAt`) or after a delay (`delayMs`)
- **Webhook Integration**: Automatically sends job data to a configured webhook URL when jobs execute
- **Redis-Powered**: Uses Redis and BullMQ for reliable job queuing and processing
- **Job Monitoring**: Includes Bull Board dashboard accessible at `/admin` for monitoring job status
- **REST API**: Simple HTTP API for scheduling jobs via POST requests

## Quick Start

1. Set up environment variables:

   - `REDIS_HOST` - Redis server host (default: localhost)
   - `REDIS_PORT` - Redis server port (default: 6379)
   - `JOBS_WEBHOOK_URL` - URL where completed jobs will be sent
   - `PORT` - API server port (default: 3000)

2. Schedule a job by sending a POST request to `/job`:

   ```json
   {
     "name": "example-job",
     "executeAt": "2024-01-01T12:00:00Z",
     "data": { "your": "data" }
   }
   ```

3. Monitor jobs at `http://localhost:3000/admin`

## Environment Variable Configuration

Environment variables can be configured for the `bull-scheduler-api` service. The primary way to set these for Docker Compose is via the `environment` block in the `docker-compose.yml` file or by creating a `.env` file in the root of the project.

The order of precedence for environment variables in Docker Compose is as follows:
1. Variables set directly in the `environment` section of `docker-compose.yml`.
2. Variables passed from your shell environment.
3. Variables defined in an `env_file` (e.g., `.env`).
4. Variables defined in the `Dockerfile` (not currently used for these specific variables).
5. If a variable is not defined in any of these places, the application might use hardcoded defaults (as seen in `index.js` for `PORT`, `REDIS_HOST`, `REDIS_PORT`).

Key environment variables:
- `REDIS_HOST`: The hostname or IP address of the Redis server.
- `REDIS_PORT`: The port number on which the Redis server is listening.
- `PORT`: The port number for the `bull-scheduler-api` service.
- `JOBS_WEBHOOK_URL`: The URL to which job data will be sent upon execution.

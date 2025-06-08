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

## Environment Variables

The service is configured using environment variables. These should be defined in a `.env` file in the root of the project. An `.env.example` file is provided as a template.

- `REDIS_HOST`: Hostname of the Redis server (defaults to `localhost`).
- `REDIS_PORT`: Port of the Redis server (defaults to `6379`).
- `JOBS_WEBHOOK_URL`: The URL to which job data will be POSTed upon execution. This is a required field for jobs to be processed.
- `PORT`: The port on which the API server will listen (defaults to `3000`).
- `SECRET_TOKEN`: A secret token used to authenticate requests to the `/job` endpoint. If set, requests to `/job` must include a valid `Authorization: Bearer <token>` header.
- `BULL_BOARD_USERNAME`: Username for accessing the Bull Dashboard at `/admin`. Defaults to `admin` if not set.
- `BULL_BOARD_PASSWORD`: Password for accessing the Bull Dashboard. If this variable is not set, the dashboard will not have password protection.

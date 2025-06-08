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

## Docker Deployment

This project is configured for Docker deployment.

### Building the Image

To build the Docker image for this project, navigate to the project root directory (where the `Dockerfile` is located) and run:

```bash
docker build -t bull-scheduler .
```

(You can replace `bull-scheduler` with your preferred image name.)

### Running with Docker Compose

A `docker-compose.yml` file is provided for easy local deployment with Redis.

1.  **Environment Setup:**
    Ensure you have a `.env` file in the project root. You can copy `.env.example` and modify it:

    ```bash
    cp .env.example .env
    ```

    **Important:** When using `docker-compose`, set `REDIS_HOST` in your `.env` file to `bull-scheduler-redis`. The `PORT` should be `3000`.

    Example `.env` for Docker Compose:

    ```
    REDIS_HOST=bull-scheduler-redis
    REDIS_PORT=6379
    JOBS_WEBHOOK_URL=your_webhook_url_here
    PORT=3000
    ```

2.  **Start Services:**
    Run the following command from the project root:

    ```bash
    docker-compose up -d
    ```

    This will build the API image (if not already built) and start both the `bull-scheduler-api` and `bull-scheduler-redis` services.

3.  **Accessing the Application:**
    - API: `http://localhost:3000`
    - Bull Board (Admin Interface): `http://localhost:3000/admin`

### Environment Variables

The service is configured using environment variables. These should be defined in a `.env` file in the root of the project. An `.env.example` file is provided as a template.

- `REDIS_HOST`: Hostname of the Redis server (defaults to `localhost`).
- `REDIS_PORT`: Port of the Redis server (defaults to `6379`).
- `JOBS_WEBHOOK_URL`: The URL to which job data will be POSTed upon execution. This is a required field for jobs to be processed.
- `PORT`: The port on which the API server will listen (defaults to `3000`).
- `SECRET_TOKEN`: A secret token used to authenticate requests to the `/job` endpoint. If set, requests to `/job` must include a valid `Authorization: Bearer <token>` header.
- `BULL_BOARD_USERNAME`: Username for accessing the Bull Dashboard at `/admin`. Defaults to `admin` if not set.
- `BULL_BOARD_PASSWORD`: Password for accessing the Bull Dashboard. If this variable is not set, the dashboard will not have password protection.


While `docker-compose.yml` uses an `.env` file for convenience in local development, for production deployments, you should inject these environment variables directly into the container. Do not bundle your production `.env` file within the Docker image.

### Publishing to Docker Hub (Optional)

Once you have built your image, you can publish it to Docker Hub or any other Docker registry.

1.  **Tag your image:**

    ```bash
    docker tag bull-scheduler your-dockerhub-username/your-repository-name:latest
    ```

    (Replace `bull-scheduler` with the name you used during the build, `your-dockerhub-username`, `your-repository-name`, and `latest` with your desired tag.)

2.  **Log in to Docker Hub:**

    ```bash
    docker login
    ```

    (Enter your Docker Hub credentials when prompted.)

3.  **Push the image:**
    ```bash
    docker push your-dockerhub-username/your-repository-name:latest
    ```
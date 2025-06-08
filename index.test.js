const axios = require('axios');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis'); // Assuming same Redis connection as app

jest.mock('axios'); // Mock axios

describe('Job Processing with Custom Webhook URL', () => {
  let queue;
  let worker;
  const queueName = 'test-queue-' + Date.now(); // Use a unique queue name for tests
  const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null, // Disable retries for tests for faster feedback
    connectTimeout: 10000, // Optional: Shorter connect timeout for tests
  });

  beforeAll(async () => {
    queue = new Queue(queueName, { connection: redisConnection });
    await queue.waitUntilReady(); // Ensure queue is connected
  });

  afterEach(async () => {
    if (worker) {
      await worker.close(); // Close worker after each test
    }
    // Clean axios mocks after each test
    axios.post.mockClear();
    // Obliterate the queue to remove all jobs and ensure clean state
    // This also removes any listeners that might have been attached to the queue
    await queue.obliterate({ force: true });
  });

  afterAll(async () => {
    if (queue) {
      await queue.close(); // Close queue after all tests
    }
    if (redisConnection) {
      await redisConnection.quit(); // Close Redis connection
    }
  });

  test('should use custom webhook_url if provided', async () => {
    const customWebhookUrl = 'http://custom-webhook-url.com/test';
    const jobData = { message: 'Hello from test!' };
    const jobName = 'test-job-custom';

    // This worker replicates the core logic of the main application worker
    // for deciding the URL and what data to send.
    worker = new Worker(queueName, async (job) => {
      const { webhook_url, data: actualJobData } = job.data;
      const url = webhook_url || process.env.JOBS_WEBHOOK_URL; // Fallback to env var if not provided
      try {
        return await axios.post(url, actualJobData);
      } catch (error) {
        console.error('Test worker failed (custom):', error.message);
        throw error;
      }
    }, { connection: redisConnection });

    axios.post.mockResolvedValue({ status: 200, data: 'mock success' });

    await queue.add(jobName, {
      _name: jobName, // As per current app structure
      data: jobData,    // Actual payload nested under 'data'
      webhook_url: customWebhookUrl,
    });

    await new Promise(resolve => {
      worker.on('completed', (job, result) => resolve(result));
      worker.on('failed', (job, err) => resolve(err)); // Resolve to not hang test on failure
        setTimeout(() => resolve(new Error('Test timed out waiting for worker')), 2000); // Timeout
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(customWebhookUrl, jobData);
  });

  test('should use global JOBS_WEBHOOK_URL if custom is not provided', async () => {
    const originalGlobalWebhookUrl = process.env.JOBS_WEBHOOK_URL;
    const tempGlobalWebhookUrl = 'http://global-webhook-url.com/default';
    process.env.JOBS_WEBHOOK_URL = tempGlobalWebhookUrl;

    const jobData = { message: 'Hello from another test!' };
    const jobName = 'test-job-global';

    worker = new Worker(queueName, async (job) => {
      // Replicating the logic from index.js worker:
      // const { webhook_url, data } = job.data; // In index.js, 'data' is the payload.
      // const targetUrl = webhook_url || JOBS_WEBHOOK_URL; // JOBS_WEBHOOK_URL from .env
      // await axios.post(targetUrl, data);
      const { webhook_url, data: actualJobData } = job.data; // job.data.data is the payload
      const url = webhook_url || process.env.JOBS_WEBHOOK_URL;
      try {
        return await axios.post(url, actualJobData);
      } catch (error) {
        console.error('Test worker failed (global):', error.message);
        throw error;
      }
    }, { connection: redisConnection });

    axios.post.mockResolvedValue({ status: 200, data: 'mock success global' });

    // When adding to queue, 'data' is the key for the payload.
    // 'webhook_url' is at the same level.
    await queue.add(jobName, {
      _name: jobName,
      data: jobData,
      // webhook_url is intentionally omitted here
    });

    await new Promise(resolve => {
      worker.on('completed', (job, result) => resolve(result));
      worker.on('failed', (job, err) => resolve(err)); // Resolve to not hang test
      setTimeout(() => resolve(new Error('Test timed out waiting for worker')), 2000); // Timeout
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(tempGlobalWebhookUrl, jobData);

    // Restore original env var if it existed, or delete if it didn't
    if (originalGlobalWebhookUrl !== undefined) {
        process.env.JOBS_WEBHOOK_URL = originalGlobalWebhookUrl;
    } else {
        delete process.env.JOBS_WEBHOOK_URL;
    }
  });
});

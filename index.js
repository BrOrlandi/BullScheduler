const express = require('express');
const bodyParser = require('body-parser');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');
const dotenv = require('dotenv');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const basicAuth = require('express-basic-auth');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';
const JOBS_WEBHOOK_URL = process.env.JOBS_WEBHOOK_URL;
const SECRET_TOKEN = process.env.SECRET_TOKEN || 'secret';
const BULL_BOARD_USERNAME = process.env.BULL_BOARD_USERNAME || 'admin';
const BULL_BOARD_PASSWORD = process.env.BULL_BOARD_PASSWORD || 'admin';

const queueName = 'bull-scheduler-jobs';

const redisConnection = new IORedis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  maxRetriesPerRequest: null,
});

const queue = new Queue(queueName, { connection: redisConnection });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token === SECRET_TOKEN) {
      return next();
    }
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

app.post('/job', authenticateToken, async (req, res) => {
  const { name, executeAt, delayMs, data, webhookUrl } = req.body;

  if (!data) return res.status(400).json({ error: 'Missing data' });

  const delay = executeAt
    ? new Date(executeAt).getTime() - Date.now()
    : delayMs || 0;

  try {
    await queue.add(
      name,
      {
        _name: name,
        _metadata: { executeAt, delayMs },
        _webhookUrl: webhookUrl,
        data,
      },
      {
        delay,
        // removeOnComplete: true,
        // removeOnFail: true,
      }
    );
    console.log('Job scheduled with success:', name);
    return res.json({ message: 'Job scheduled with success' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to schedule job' });
  }
});

const worker = new Worker(
  queueName,
  async (job) => {
    // job.data contains { _name, _metadata, data, _webhookUrl }
    const { _webhookUrl, data } = job.data; // Extract webhookUrl and the original data
    const targetUrl = _webhookUrl || JOBS_WEBHOOK_URL; // Use job-specific URL or fallback to global
    try {
      const response = await axios.post(targetUrl, data); // Send only actualJobData
      console.log(
        'Job executed:',
        job.id,
        '[',
        job.name,
        '] Response:',
        response.status
      );

      return response.data;
    } catch (err) {
      throw new Error(
        `Failed to send job to webhook for job ${job.id} using url ${targetUrl} error: ${err.message}`
      );
    }
  },
  { connection: redisConnection }
);

// Start bull board
const serverAdapter = new ExpressAdapter();
const router = createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter: serverAdapter,
});

if (BULL_BOARD_PASSWORD) {
  app.use(
    '/admin',
    basicAuth({
      users: { [BULL_BOARD_USERNAME]: BULL_BOARD_PASSWORD },
      challenge: true,
      realm: 'Bull Dashboard',
    })
  );
}

serverAdapter.setBasePath('/admin');
app.use('/admin', serverAdapter.getRouter());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Jobs webhook url:', JOBS_WEBHOOK_URL);
  console.log(`API is running on port ${PORT}`);
});

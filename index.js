const express = require('express');
const bodyParser = require('body-parser');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');
const dotenv = require('dotenv');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';
const JOBS_WEBHOOK_URL = process.env.JOBS_WEBHOOK_URL;

const queueName = 'bull-scheduler-jobs';

const redisConnection = new IORedis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  maxRetriesPerRequest: null,
});

const queue = new Queue(queueName, { connection: redisConnection });

app.post('/job', async (req, res) => {
  const { name, executeAt, delayMs, data } = req.body;

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
    const url = JOBS_WEBHOOK_URL;
    try {
      const response = await axios.post(url, job.data);
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
      console.error('Failed to send job to webhook:', err.message);
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

serverAdapter.setBasePath('/admin');
app.use('/admin', serverAdapter.getRouter());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Jobs webhook url:', JOBS_WEBHOOK_URL);
  console.log(`API is running on port ${PORT}`);
});

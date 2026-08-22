import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import logger from './utils/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import authRouter from './routes/auth.route.js';
import usersRouter from './routes/users.route.js';
import { arcjetMiddleware } from './middlewares/arcjet.middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(helmet());
app.use(
  morgan('combined', {
    stream: {
      write: message => {
        logger.info(message.trim());
      },
    },
  })
);

app.get('/', (_req, res) => {
  logger.info('Hello from acquisition API');

  res.status(200).send({ message: 'Hello from acquisition API' });
});

app.get('/health', (_req, res) => {
  logger.info('Health check OK');

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (_req, res) => {
  res.status(200).json({ message: 'Acquisitions API is running!' });
});

app.use(arcjetMiddleware);

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;

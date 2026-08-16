import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import logger from './utils/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';

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

app.get('/', (req, res) => {
  logger.info('Hello from acquisition API');

  res.status(200).send({ message: 'Hello from acquisition API' });
});

export default app;

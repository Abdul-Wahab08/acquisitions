import jwt from 'jsonwebtoken';
import logger from './logger.js';

const jwtSecret = process.env.JWT_SECRET || 'SECRET';
const jwtExpiry = process.env.JWT_EXPIRY;

export const jwtToken = {
  sign: payload => {
    try {
      return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiry });
    } catch (error) {
      logger.error('Failed to generate token: ', error);
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, jwtSecret);
    } catch (error) {
      logger.error('Failed to authenticate user: ', error);
    }
  },
};

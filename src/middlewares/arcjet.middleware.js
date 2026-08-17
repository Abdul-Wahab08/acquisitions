import { isSpoofedBot } from '@arcjet/inspect';
import logger from '../utils/logger.js';
import aj from '../utils/arcjet.js';

export async function arcjetMiddleware(req, res, next) {
  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
        });

        return res
          .status(403)
          .json({ error: 'Forbidden', message: 'Too many requests' });
      } else if (decision.reason.isBot()) {
        logger.warn('Bot request blocked', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Automated requests are not allowed',
        });
      } else {
        logger.warn('Request blocked by Arcjet', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
        });

        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (decision.ip.isHosting()) {
      logger.warn('Hosting request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Hosting providers are not allowed',
      });
    } else if (decision.results.some(isSpoofedBot)) {
      logger.warn('Spoofed bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed',
      });
    }

    next();
  } catch (error) {
    logger.error('Arcjet middleware error: ', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

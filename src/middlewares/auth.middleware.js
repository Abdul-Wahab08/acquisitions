import { jwtToken } from '../utils/jwtToken.js';
import logger from '../utils/logger.js';

export function verifyJwt(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decodedToken = jwtToken.verify(token);

    if (!decodedToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Failed to authenticate user: ', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const role = req.user.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
}

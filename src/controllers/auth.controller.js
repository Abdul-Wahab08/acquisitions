import { users } from '../db/schema.js';
import { db } from '../db/index.js';
import logger from '../utils/logger.js';
import { signInSchema, signupSchema } from '../validations/auth.validation.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { formatValidationError } from '../utils/formatValidationError.js';
import { jwtToken } from '../utils/jwtToken.js';

async function signup(req, res, next) {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: formatValidationError(validationResult.error),
      });
    }

    const { email, password, name, role } = validationResult.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });

    const token = jwtToken.sign({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
    };

    res.cookie('token', token, options);

    logger.info(`User ${newUser.email} signed up successfully`);

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    logger.error('Sign up error: ', error);
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Password is incorrect',
      });
    }

    const token = jwtToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
    };

    res.cookie('token', token, options);

    logger.info(`User ${user.email} logged in successfully`);

    return res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    logger.error('Login error: ', error);
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('token');

    logger.info('User logged out successfully');
    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error: ', error);
    next(error);
  }
}

export { signup, login, logout };

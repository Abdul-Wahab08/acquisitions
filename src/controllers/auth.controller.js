import { users } from '../db/schema.js';
import { db } from '../db/index.js';
import logger from '../utils/logger.js';
import { signupSchema } from '../validations/auth.validation.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { formatValidationError } from '../utils/formatValidationError.js';
import { jwtToken } from '../utils/jwtToken.js';

async function signup(req, res) {
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
        createdAt: users.createdAt,
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
      token,
    });
  } catch (error) {
    logger.error('Sign up error: ', error);
    throw error;
  }
}

export { signup };

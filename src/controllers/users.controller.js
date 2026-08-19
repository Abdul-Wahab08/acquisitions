import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import logger from '../utils/logger.js';
import {
  updateUserSchema,
  userIdSchema,
} from '../validations/users.validation.js';

async function getAllUsers(req, res, next) {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users);

    return res.status(200).json({
      message: 'Users fetched successfully',
      data: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error('Error fetching users: ', error);
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const userId = req.params.id;

    const validationResult = userIdSchema.safeParse({ id: userId });

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.issues,
      });
    }

    const validatedId = validationResult.data.id;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, validatedId));

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    logger.info(`User with ID ${validatedId} fetched successfully`);

    return res.status(200).json({
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    logger.error('Error fetching user: ', error);
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = req.params.id;

    const validationResult = userIdSchema.safeParse({ id: userId });
    const updateValidationResult = updateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.issues,
      });
    }

    if (!updateValidationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: updateValidationResult.error.issues,
      });
    }

    const validatedId = validationResult.data.id;
    const validatedUpdateData = updateValidationResult.data;

    if (validatedUpdateData.email) {
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedUpdateData.email));

      if (existingEmail && existingEmail.id !== validatedId) {
        return res.status(400).json({
          message: 'Email already in use by another user',
        });
      }
    }

    const [isUserExists] = await db
      .select()
      .from(users)
      .where(eq(users.id, validatedId))
      .limit(1);

    if (!isUserExists) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (req.user.role !== 'admin' && validatedUpdateData.role) {
      return res.status(403).json({
        message: 'You are not authorized to update user roles',
      });
    }

    const updateData = {
      ...validatedUpdateData,
      updated_at: new Date(),
    };

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, validatedId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User with ID ${validatedId} updated successfully`);

    return res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating user: ', error);
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = req.params.id;

    const validationResult = userIdSchema.safeParse({ id: userId });

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.issues,
      });
    }

    const validatedId = validationResult.data.id;

    await db.delete(users).where(eq(users.id, validatedId));

    logger.info(`User with ID ${validatedId} deleted successfully`);

    return res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user: ', error);
    next(error);
  }
}

export { getAllUsers, getUserById, updateUser, deleteUser };

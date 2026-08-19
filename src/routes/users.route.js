import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/users.controller.js';
import { isAdmin, verifyJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJwt);

router.get('/get-users', getAllUsers);
router.get('/get-user/:id', getUserById);
router.put('/update-user/:id', updateUser);
router.delete('/delete-user/:id', isAdmin, deleteUser);

export default router;

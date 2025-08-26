import express from 'express';
import { registerUser } from './register-user';
import { manageUser } from './manage-user';
import { getUser } from './get-user';
import { listUsers } from './list-users';

export const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/manage', manageUser);
userRouter.get('/info', getUser);
userRouter.get('/list', listUsers);

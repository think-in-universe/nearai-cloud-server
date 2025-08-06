import express from 'express';
import { registerUser } from './register-user';
import { getUser } from './get-user';
import { manageUser } from './manage-user';

export const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.get('/info', getUser);
userRouter.post('/manage', manageUser);

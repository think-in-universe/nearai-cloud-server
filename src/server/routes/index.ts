import express from 'express';
import { ping } from './ping';
import { notFoundMiddleware } from '../middlewares/not-found';
import { userRouter } from './user';
import { keyRouter } from './key';

// TODO: Need Fix: Currently 405 Method Not Allowed will be considered as 404 Not Found
export const router = express.Router();

router.get('/', ping);
router.use('/user', userRouter);
router.use('/key', keyRouter);

router.use(notFoundMiddleware);

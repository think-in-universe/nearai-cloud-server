import express from 'express';
import { notFoundMiddleware } from '../middlewares/not-found';
import { openaiRouter } from './openai';
import { ping } from './ping';
import { userRouter } from './user';
import { keyRouter } from './key';
import { modelRouter } from './model';
import { credentialRouter } from './credential';
import { statsRouter } from './stats';

// TODO: Need Fix: Currently 405 Method Not Allowed will be considered as 404 Not Found
export const router = express.Router();

router.use('', openaiRouter);
router.use('/v1', openaiRouter);

router.get('/', ping);
router.use('/user', userRouter);
router.use('/key', keyRouter);
router.use('/model', modelRouter);
router.use('/credential', credentialRouter);

router.use('/stats', statsRouter);

router.use(notFoundMiddleware);

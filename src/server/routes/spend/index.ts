import express from 'express';
import { getSpendLogs } from './logs';

export const spendRouter = express.Router();

spendRouter.get('/logs', getSpendLogs);

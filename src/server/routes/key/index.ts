import express from 'express';
import { generateKey } from './generate-key';
import { generateServiceAccount } from './generate-service-account';
import { updateKey } from './update-key';
import { deleteKey } from './delete-key';
import { getKey } from './get-key';
import { listKeys } from './list-keys';
import { getSpendLogs } from './get-spend-logs';

export const keyRouter = express.Router();

keyRouter.post('/generate', generateKey);
keyRouter.post('/service-account/generate', generateServiceAccount);
keyRouter.post('/update', updateKey);
keyRouter.post('/delete', deleteKey);
keyRouter.get('/info', getKey);
keyRouter.get('/list', listKeys);
keyRouter.get('/usage', getSpendLogs);

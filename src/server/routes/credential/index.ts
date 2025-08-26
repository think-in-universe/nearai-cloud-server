import express from 'express';
import { createCredential } from './create-credential';
import { updateCredential } from './update-credential';
import { listCredentials } from './list-credentials';

export const credentialRouter = express.Router();

credentialRouter.post('/new', createCredential);
credentialRouter.post('/update', updateCredential);
credentialRouter.get('/list', listCredentials);

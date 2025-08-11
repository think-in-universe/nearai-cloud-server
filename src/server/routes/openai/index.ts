import express from 'express';
import { chatCompletions } from './chat-completions';
import { models } from './models';
import { attestationReport } from './attestation-report';
import { signature } from './signature';

export const openaiRouter = express.Router();

openaiRouter.post('/chat/completions', chatCompletions);
openaiRouter.get('/models', models);
openaiRouter.get('/attestation/report', attestationReport);
openaiRouter.get('/signature/:chat_id', signature);

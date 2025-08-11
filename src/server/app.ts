import express from 'express';
import cors from 'cors';
import ctx from 'express-http-context';
import { config } from '../config';
import {
  createIncomingLogMiddleware,
  createOutgoingLogMiddleware,
} from './middlewares/log';
import {
  createOpenAiHttpErrorMiddleware,
  createExposeErrorMiddleware,
} from './middlewares/error';
import { router } from './routes';

export function runServer() {
  const app = express();

  app.disable('x-powered-by');

  app.set('query parser', 'extended');

  app.use(cors());

  app.use(createIncomingLogMiddleware({ isDev: config.isDev }));
  app.use(createOutgoingLogMiddleware({ isDev: config.isDev }));

  app.use(express.json());
  app.use(ctx.middleware);
  app.use(router);

  app.use(
    createOpenAiHttpErrorMiddleware({
      isDev: config.isDev,
    }),
  );
  app.use(
    createExposeErrorMiddleware({
      isDev: config.isDev,
    }),
  );

  app.listen(config.server.port);
}

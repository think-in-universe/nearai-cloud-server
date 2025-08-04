import { ErrorRequestHandler } from 'express';
import { isHttpError } from 'http-errors';
import { throwHttpError } from '../../utils/error';
import { STATUS_CODES } from '../../utils/consts';

export function createHttpErrorMiddleware({
  isDev = true,
}: { isDev?: boolean } = {}): ErrorRequestHandler {
  return (
    e: unknown,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    req,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    res,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    next,
  ) => {
    if (isDev) {
      console.error(e);
    }

    if (isHttpError(e)) {
      throw e;
    }

    throwHttpError({
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      cause: e,
    });
  };
}

export function createExposeErrorMiddleware({
  isDev = true,
}: { isDev?: boolean } = {}): ErrorRequestHandler {
  return (
    e: unknown,
    req,
    res,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    next,
  ) => {
    let status;
    let message: string;
    let stack: string | undefined;

    if (isHttpError(e)) {
      status = e.status;
      message = isDev || status !== 500 ? e.message : 'Internal Server Error';
      stack = isDev ? e.stack : undefined;
    } else if (e instanceof Error) {
      status = 500;
      message = isDev ? e.message : 'Internal Server Error';
      stack = isDev ? e.stack : undefined;
    } else {
      status = 500;
      message = 'Internal Server Error';
    }

    res.status(status).json({
      error: {
        status,
        message,
        stack,
      },
    });
  };
}

import { ErrorRequestHandler } from 'express';
import { isOpenAiHttpError, createOpenAiHttpError } from '../../utils/error';
import { STATUS_CODES } from '../../utils/consts';

export function createOpenAiHttpErrorMiddleware({
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

    if (isOpenAiHttpError(e)) {
      throw e;
    }

    throw createOpenAiHttpError({
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
    if (isOpenAiHttpError(e)) {
      res.status(e.status).json({
        error: {
          message:
            isDev || e.status !== STATUS_CODES.INTERNAL_SERVER_ERROR
              ? e.message
              : 'Internal Server Error',
          type: e.type,
          param: e.param,
          code: e.code,
          stack: isDev ? e.stack : undefined,
        },
      });
    } else {
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        error: {
          message: 'Internal Server Error',
          type: 'error',
          param: null,
          code: STATUS_CODES.INTERNAL_SERVER_ERROR.toString(),
        },
      });
    }
  };
}

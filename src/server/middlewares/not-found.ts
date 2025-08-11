import { RequestHandler } from 'express';
import { createOpenAiHttpError } from '../../utils/error';
import { STATUS_CODES } from '../../utils/consts';

export const notFoundMiddleware: RequestHandler = () => {
  throw createOpenAiHttpError({
    status: STATUS_CODES.NOT_FOUND,
  });
};

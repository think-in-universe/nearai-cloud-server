import { RequestHandler } from 'express';
import { throwHttpError } from '../../utils/error';
import { STATUS_CODES } from '../../utils/consts';

export const notFoundMiddleware: RequestHandler = () => {
  throwHttpError({
    status: STATUS_CODES.NOT_FOUND,
  });
};

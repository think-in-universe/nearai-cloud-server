import createHttpError from 'http-errors';
import { ThrowHttpErrorOptions } from '../types/error';

export function throwHttpError({
  status,
  cause,
  message,
}: ThrowHttpErrorOptions = {}): never {
  const error = message ?? cause;
  if (status && error) {
    throw createHttpError(status, error);
  } else if (!status && error) {
    throw createHttpError(error);
  } else if (status && !error) {
    throw createHttpError(status);
  } else {
    throw createHttpError();
  }
}

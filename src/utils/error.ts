import internalCreateHttpError, { HttpError, isHttpError } from 'http-errors';
import {
  InternalOpenAiHttpErrorOptions,
  ThrowHttpErrorOptions,
  OpenAiHttpError,
  ThrowOpenAiHttpErrorOptions,
} from '../types/error';
import * as v from 'valibot';

export function isOpenAiHttpError(e: unknown): e is OpenAiHttpError {
  if (!isHttpError(e)) {
    return false;
  }

  const schema = v.object({
    type: v.nullable(v.string()), // Use `nullable` for LiteLLM compatibility
    param: v.nullable(v.string()),
    code: v.nullable(v.string()),
  });

  const { success } = v.safeParse(schema, e);

  return success;
}

export function createOpenAiHttpError({
  status,
  message,
  cause,
  type,
  param,
  code,
}: ThrowOpenAiHttpErrorOptions = {}): OpenAiHttpError {
  return new InternalOpenAiHttpError({
    status,
    message,
    cause,
    type,
    param,
    code,
  });
}

function createHttpError({
  status,
  message,
  cause,
}: ThrowHttpErrorOptions = {}) {
  const error = message ?? cause;
  if (status && error) {
    return internalCreateHttpError(status, error);
  } else if (!status && error) {
    return internalCreateHttpError(error);
  } else if (status && !error) {
    return internalCreateHttpError(status);
  } else {
    return internalCreateHttpError();
  }
}

class InternalOpenAiHttpError extends Error implements HttpError {
  status: number;
  statusCode: number;
  expose: boolean;

  type: string;
  param: string | null;
  code: string | null;

  constructor({
    status,
    message,
    cause,
    type,
    param,
    code,
  }: InternalOpenAiHttpErrorOptions) {
    const e = createHttpError({
      status,
      message,
      cause,
    });

    super(e.message, {
      cause,
    });

    this.status = e.status;
    this.statusCode = e.statusCode;
    this.expose = e.expose;

    this.type = type ?? 'error';
    this.param = param ?? null;
    this.code = code ?? e.status.toString();

    this.name = e.name;
  }
}

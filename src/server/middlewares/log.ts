import { RequestHandler } from 'express';
import morgan from 'morgan';
import dayjs from 'dayjs';
import { addColor, getHttpStatusColor } from '../../utils/color';
import { throwHttpError } from '../../utils/error';
import { STATUS_CODES } from '../../utils/consts';

export function createIncomingLogMiddleware({
  isDev = true,
}: { isDev?: boolean } = {}): RequestHandler {
  return morgan(
    (tokens, req, res) => {
      const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

      const method = tokens['method']?.(req, res);

      if (!method) {
        throwHttpError({
          status: STATUS_CODES.INTERNAL_SERVER_ERROR,
          message: `Pre log token 'method' not found`,
        });
      }

      const url = tokens['url']?.(req, res);

      if (!url) {
        throwHttpError({
          status: STATUS_CODES.INTERNAL_SERVER_ERROR,
          message: `Pre log token 'url' not found`,
        });
      }

      return [
        addColor(`[${timestamp}]`, 'gray', isDev),
        ' ',
        addColor('-->', 'gray', isDev),
        ' ',
        method,
        ' ',
        addColor(url, 'gray', isDev),
      ].join('');
    },
    {
      immediate: true,
    },
  );
}

export function createOutgoingLogMiddleware({
  isDev = true,
}: { isDev?: boolean } = {}): RequestHandler {
  return morgan((tokens, req, res) => {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

    const method = tokens['method']?.(req, res);

    if (!method) {
      throwHttpError({
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: `Post log token 'method' not found`,
      });
    }

    const url = tokens['url']?.(req, res);

    if (!url) {
      throwHttpError({
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: `Post log token 'url' not found`,
      });
    }

    const status = tokens['status']?.(req, res);

    if (!status) {
      throwHttpError({
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: `Post log token 'status' not found`,
      });
    }

    const statusColor = getHttpStatusColor(Number(status));

    const responseTime = tokens['response-time']?.(req, res);

    if (!responseTime) {
      throwHttpError({
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: `Post log token 'response-time' not found`,
      });
    }

    return [
      addColor(`[${timestamp}]`, 'gray', isDev),
      ' ',
      addColor('-->', 'gray', isDev),
      ' ',
      method,
      ' ',
      addColor(url, 'gray', isDev),
      ' ',
      addColor(status, statusColor, isDev),
      ' ',
      addColor(`${responseTime}ms`, 'gray', isDev),
    ].join('');
  });
}

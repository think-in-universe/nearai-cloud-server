import { RequestHandler } from 'express';
import morgan from 'morgan';
import dayjs from 'dayjs';
import { addColor, getHttpStatusColor } from '../../utils/color';

export function createIncomingLogMiddleware({
  isDev = true,
}: { isDev?: boolean } = {}): RequestHandler {
  return morgan(
    (tokens, req, res) => {
      const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS');

      const method = tokens['method']?.(req, res) ?? '';

      const url = tokens['url']?.(req, res) ?? '';

      return [
        addColor(`[${timestamp}]`, 'gray', isDev),
        ' ',
        addColor('<--', 'gray', isDev),
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

    const method = tokens['method']?.(req, res) ?? '';

    const url = tokens['url']?.(req, res) ?? '';

    const status = tokens['status']?.(req, res) ?? '';

    const statusColor = status ? getHttpStatusColor(Number(status)) : 'gray';

    const responseTime = tokens['response-time']?.(req, res) ?? '';

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

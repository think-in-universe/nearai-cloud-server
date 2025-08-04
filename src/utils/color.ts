import { Color, HttpStatusColor } from '../types/color';
import chalk from 'chalk';

export function getHttpStatusColor(status: number): HttpStatusColor {
  if (status >= 200 && status < 300) {
    return 'green';
  } else if (status >= 300 && status < 400) {
    return 'blue';
  } else if (status >= 400 && status < 500) {
    return 'yellow';
  } else if (status >= 500 && status < 600) {
    return 'red';
  } else {
    return 'gray';
  }
}

export function addColor(s: string, color: Color, isDev = true): string {
  if (isDev) {
    return chalk[color](s);
  } else {
    return s;
  }
}

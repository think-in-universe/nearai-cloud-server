import { logger } from './logger';
import { config } from '../config';
import { ENV } from '../utils/envs';
import { SLACK_ALERT_TAG } from '../utils/consts';
import axios from 'axios';

export async function sendSlackInfo(
  message: string,
  {
    emitLog = true,
    channel = false,
  }: {
    emitLog?: boolean;
    channel?: boolean;
  } = {},
) {
  if (emitLog) {
    logger.info(message);
  }

  try {
    await sendSlackAlert({
      message,
      tag: SLACK_ALERT_TAG,
      env: ENV,
      level: '💡INFO',
      channel,
    });
  } catch (e: unknown) {
    logger.error(`Failed to send Slack info: ${e}`);
  }
}

export async function sendSlackWarning(
  message: string,
  {
    emitLog = true,
    channel = false,
  }: {
    emitLog?: boolean;
    channel?: boolean;
  } = {},
) {
  if (emitLog) {
    logger.warn(message);
  }

  try {
    await sendSlackAlert({
      message,
      tag: SLACK_ALERT_TAG,
      env: ENV,
      level: '⚠️WARN',
      channel,
    });
  } catch (e: unknown) {
    logger.error(`Failed to send Slack warning: ${e}`);
  }
}

export async function sendSlackError(
  message: string,
  {
    emitLog = true,
    channel = false,
  }: {
    emitLog?: boolean;
    channel?: boolean;
  } = {},
) {
  if (emitLog) {
    logger.error(message);
  }

  try {
    await sendSlackAlert({
      message,
      tag: SLACK_ALERT_TAG,
      env: ENV,
      level: '❌ERROR',
      channel,
    });
  } catch (e: unknown) {
    logger.error(`Failed to send Slack error: ${e}`);
  }
}

async function sendSlackAlert({
  message,
  tag,
  env,
  level,
  channel,
}: {
  message: string;
  tag: string;
  env: string;
  level: '💡INFO' | '⚠️WARN' | '❌ERROR';
  channel: boolean;
}) {
  await sendSlackMessage(
    `${channel ? '<!channel>' : ''} *${tag}@${env}:* *[${level}]* ${message}`,
  );
}

async function sendSlackMessage(message: string) {
  if (!config.slack.webhookUrl) {
    return;
  }
  await axios.post(config.slack.webhookUrl, { text: message });
}

import ctx from 'express-http-context';
import * as v from 'valibot';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import {
  CTX_GLOBAL_KEYS,
  INPUT_LIMITS,
  STATUS_CODES,
} from '../../../utils/consts';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { createOpenAiHttpError } from '../../../utils/error';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const inputSchema = v.object({
  keyHash: v.pipe(v.string(), v.hash([INPUT_LIMITS.KEY_HASH_TYPE])),
  startDate: v.optional(v.pipe(v.string(), v.isoDate())),
  endDate: v.optional(v.pipe(v.string(), v.isoDate())),
});

/**
 * @deprecated
 */
const inputSchemaLegacy = v.object({
  keyOrKeyHash: v.optional(v.string()),
  keyHash: v.optional(v.pipe(v.string(), v.hash([INPUT_LIMITS.KEY_HASH_TYPE]))),
  startDate: v.optional(v.pipe(v.string(), v.isoDate())),
  endDate: v.optional(v.pipe(v.string(), v.isoDate())),
});

const outputSchema = v.array(
  v.object({
    userId: v.string(),
    keyHash: v.string(),
    status: v.string(),
    callType: v.string(),
    spend: v.number(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    modelId: v.string(),
    model: v.string(),
    startTime: v.string(),
    endTime: v.string(),
  }),
);

export const getSpendLogs = createRouteResolver({
  inputs: {
    query: inputSchemaLegacy,
  },
  output: outputSchema,
  middlewares: [authMiddleware],
  resolve: async ({ inputs: { query } }) => {
    const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

    if (!query.keyHash && !query.keyOrKeyHash) {
      throw createOpenAiHttpError({
        status: STATUS_CODES.BAD_REQUEST,
        message: 'Missing keyHash',
      });
    }

    const logs = await adminLitellmApiClient.getSpendLogs({
      userId: user.userId,
      keyOrKeyHash: query.keyHash ?? query.keyOrKeyHash!,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return logs.map((log) => {
      return {
        requestId: log.requestId,
        userId: log.userId,
        keyHash: log.keyHash,
        status: log.status,
        callType: log.callType,
        spend: log.spend,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
        modelId: log.modelId,
        model: log.model,
        startTime: log.startTime,
        endTime: log.endTime,
      };
    });
  },
});

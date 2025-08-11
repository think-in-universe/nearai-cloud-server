import ctx from 'express-http-context';
import * as v from 'valibot';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { CTX_GLOBAL_KEYS } from '../../../utils/consts';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';

const inputSchema = v.object({
  keyOrKeyHash: v.string(),
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
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [authMiddleware],
  resolve: async ({ inputs: { query } }) => {
    const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

    const logs = await adminLitellmApiClient.getSpendLogs({
      userId: user.userId,
      keyOrKeyHash: query.keyOrKeyHash,
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

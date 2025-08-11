import { createRouteResolver } from '../../middlewares/route-resolver';
import { keyAuthMiddleware } from '../../middlewares/auth';
import * as v from 'valibot';
import { litellmDatabaseClient } from '../../../services/litellm-database-client';
import { createOpenAiHttpError } from '../../../utils/error';
import { STATUS_CODES } from '../../../utils/consts';
import { createPrivateLlmApiClient } from '../../../services/private-llm-api-client';
import * as ctx from 'express-http-context';
import { InternalModelParams } from '../../../types/litellm-database-client';

const inputSchema = v.object({
  model: v.string(),
});

const attestationSchema = v.object({
  signing_address: v.string(),
  intel_quote: v.string(),
  nvidia_payload: v.string(),
});

const outputSchema = v.intersect([
  attestationSchema,
  v.object({
    all_attestations: v.array(attestationSchema),
  }),
]);

export const attestationReport = createRouteResolver({
  inputs: {
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [
    keyAuthMiddleware,
    async (req, res, next, { query }) => {
      const modelParams = await litellmDatabaseClient.getInternalModelParams(
        query.model,
      );

      if (!modelParams) {
        throw createOpenAiHttpError({
          status: STATUS_CODES.BAD_REQUEST,
          message: 'Invalid model',
        });
      }

      ctx.set('modelParams', modelParams);

      next();
    },
  ],
  resolve: async () => {
    const modelParams: InternalModelParams = ctx.get('modelParams');
    const client = createPrivateLlmApiClient(
      modelParams.apiKey,
      modelParams.apiUrl,
    );
    return await client.attestationReport({
      model: modelParams.model,
    });
  },
});

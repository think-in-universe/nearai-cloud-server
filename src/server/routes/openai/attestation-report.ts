import { createRouteResolver } from '../../middlewares/route-resolver';
import { keyAuthMiddleware } from '../../middlewares/auth';
import * as v from 'valibot';
import { litellmDatabaseClient } from '../../../services/litellm-database-client';
import { createOpenAiHttpError } from '../../../utils/error';
import { STATUS_CODES } from '../../../utils/consts';
import { createPrivateLlmApiClient } from '../../../services/private-llm-api-client';
import * as ctx from 'express-http-context';
import { InternalModelParams } from '../../../types/litellm-database-client';
import { AttestationReport } from '../../../types/privatellm-api-client';

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
      const modelParamsList =
        await litellmDatabaseClient.listInternalModelParams(query.model);

      if (modelParamsList.length === 0) {
        throw createOpenAiHttpError({
          status: STATUS_CODES.BAD_REQUEST,
          message: 'Invalid model',
        });
      }

      ctx.set('modelParamsList', modelParamsList);

      next();
    },
  ],
  resolve: async () => {
    const modelParamsList: InternalModelParams[] = ctx.get('modelParamsList');

    let allReports: AttestationReport | undefined;

    for (const modelParams of modelParamsList) {
      const client = createPrivateLlmApiClient(
        modelParams.apiKey,
        modelParams.apiUrl,
      );

      const report = await client.attestationReport({
        model: modelParams.model,
      });

      if (!allReports) {
        allReports = report;
      } else {
        if (report.all_attestations.length > 0) {
          allReports.all_attestations.push(...report.all_attestations);
        } else {
          allReports.all_attestations.push(report);
        }
      }
    }

    return allReports!;
  },
});

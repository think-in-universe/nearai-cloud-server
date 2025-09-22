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
import { logger } from '../../../services/logger';

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

    const reportPromises = modelParamsList.map((modelParams) => {
      const client = createPrivateLlmApiClient(
        modelParams.apiKey,
        modelParams.apiUrl,
      );

      const f = async () => {
        try {
          return await client.attestationReport({
            model: modelParams.model,
          });
        } catch (e) {
          logger.error(
            `Failed to GET /attestation/report. Model Id (${modelParams.modelId}). ${e}`,
          );
          return undefined;
        }
      };

      return f();
    });

    const reports = await Promise.all(reportPromises);

    let mergedReport: AttestationReport | undefined;

    reports.forEach((report) => {
      if (!report) {
        return;
      }

      if (!mergedReport) {
        mergedReport = report;
      } else {
        if (report.all_attestations.length > 0) {
          mergedReport.all_attestations.push(...report.all_attestations);
        } else {
          mergedReport.all_attestations.push(report);
        }
      }
    });

    if (!mergedReport) {
      throw createOpenAiHttpError({
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: 'No attestation available',
      });
    }

    return mergedReport;
  },
});

import { createRouteResolver } from '../../middlewares/route-resolver';
import { keyAuthMiddleware } from '../../middlewares/auth';
import * as v from 'valibot';
import { litellmDatabaseClient } from '../../../services/litellm-database-client';
import { createOpenAiHttpError } from '../../../utils/error';
import {
  FETCH_ATTESTATION_REPORT_TIMEOUT,
  STATUS_CODES,
} from '../../../utils/consts';
import { createPrivateLlmApiClient } from '../../../services/private-llm-api-client';
import * as ctx from 'express-http-context';
import { InternalModelParams } from '../../../types/litellm-database-client';
import { AttestationReport } from '../../../types/privatellm-api-client';
import { logger } from '../../../services/logger';
import {
  GatewayAttestation,
  generateGatewayAttestation,
  parseNonce,
} from '../../../utils/attestation';
import { config } from '../../../config';

const inputSchema = v.object({
  model: v.string(),
  signing_algo: v.optional(v.string()),
  nonce: v.optional(v.string()),
  signing_address: v.optional(v.string()),
});

const recordSchema = v.record(v.string(), v.unknown());

const gatewayAttestationSchema = v.object({
  request_nonce: v.string(),
  intel_quote: v.string(),
  event_log: v.array(recordSchema),
  info: recordSchema,
});

const modelAttestationSchema = v.object({
  signing_address: v.string(),
  intel_quote: v.string(),
  nvidia_payload: v.string(),
  request_nonce: v.optional(v.string()),
  event_log: v.optional(v.array(recordSchema)),
  info: v.optional(recordSchema),
});

const outputSchema = v.intersect([
  modelAttestationSchema,
  v.object({
    gateway_attestation: gatewayAttestationSchema,
    model_attestations: v.array(modelAttestationSchema),
    all_attestations: v.array(modelAttestationSchema),
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
      const modelAlias = await litellmDatabaseClient.getModelAlias();
      query.model = modelAlias[query.model] ?? query.model;

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
  resolve: async ({ inputs: { query } }) => {
    // Parse nonce. Generate random nonce if not provided.
    let nonce: string;
    try {
      nonce = parseNonce(query.nonce);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      throw createOpenAiHttpError({
        status: STATUS_CODES.BAD_REQUEST,
        message: `Invalid nonce: ${message}`,
        cause: e,
      });
    }

    if (!nonce) {
      throw createOpenAiHttpError({
        status: STATUS_CODES.BAD_REQUEST,
        message: 'Invalid nonce',
      });
    }

    // Generate gateway attestation
    let gatewayAttestation: GatewayAttestation | undefined;
    try {
      gatewayAttestation = !config.isDev
        ? await generateGatewayAttestation(nonce)
        : {
            request_nonce: nonce,
            intel_quote:
              'intel quote not available for development environment',
            event_log: [],
            info: {},
          };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      throw createOpenAiHttpError({
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: `Failed to get gateway attestation: ${message}`,
        cause: e,
      });
    }

    if (!gatewayAttestation) {
      throw createOpenAiHttpError({
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: 'Failed to get gateway attestation',
      });
    }

    const modelParamsList: InternalModelParams[] = ctx.get('modelParamsList');

    // Get model attestations via model API calls
    const modelAttestationPromises = modelParamsList.map((modelParams) => {
      const client = createPrivateLlmApiClient(
        modelParams.apiKey,
        modelParams.apiUrl,
      );

      const f = async () => {
        try {
          return await client.attestationReport(
            {
              model: modelParams.model,
              signing_algo: query.signing_algo,
              nonce,
              signing_address: query.signing_address,
            },
            FETCH_ATTESTATION_REPORT_TIMEOUT,
          );
        } catch (e) {
          logger.debug(
            `Failed to GET /attestation/report. Model Id (${modelParams.modelId}). ${e}`,
          );
          return undefined;
        }
      };

      return f();
    });

    const modelAttestations = await Promise.all(modelAttestationPromises);

    let mergedReport: AttestationReport | undefined;

    modelAttestations.forEach((report) => {
      if (!report) {
        return;
      }

      if (!mergedReport) {
        mergedReport = report;
        if (report.all_attestations.length === 0) {
          mergedReport.all_attestations = [report];
        }
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
        message: 'No model attestations available',
      });
    }

    const { all_attestations, ...attestationFields } = mergedReport;

    return {
      gateway_attestation: gatewayAttestation,
      model_attestations: all_attestations,
      // keep the original attestation fields for backward compatibility
      ...attestationFields,
      all_attestations,
    };
  },
});

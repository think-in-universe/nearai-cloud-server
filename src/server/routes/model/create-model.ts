import { createRouteResolver } from '../../middlewares/route-resolver';
import * as v from 'valibot';
import { litellmServiceAccountAuthMiddleware } from '../../middlewares/auth';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { INPUT_LIMITS } from '../../../utils/consts';

const inputSchema = v.object({
  model: v.pipe(v.string(), v.regex(INPUT_LIMITS.MODEL_FORMAT)),
  providerModelName: v.pipe(v.string(), v.nonEmpty()),
  providerName: v.pipe(v.string(), v.nonEmpty()),
  credentialName: v.pipe(v.string(), v.nonEmpty()),
  inputCostPerToken: v.optional(v.number()),
  outputCostPerToken: v.optional(v.number()),
  metadata: v.object({
    verifiable: v.boolean(),
    contextLength: v.number(),
    modelFullName: v.pipe(v.string(), v.nonEmpty()),
    modelDescription: v.pipe(v.string(), v.nonEmpty()),
    modelIcon: v.pipe(v.string(), v.nonEmpty()),
  }),
});

const outputSchema = v.object({
  modelId: v.string(),
});

export const createModel = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  output: outputSchema,
  middlewares: [litellmServiceAccountAuthMiddleware],
  resolve: async ({ inputs: { body } }) => {
    return adminLitellmApiClient.createModel({
      model: body.model,
      providerModelName: body.providerModelName,
      providerName: body.providerName,
      credentialName: body.credentialName,
      inputCostPerToken: body.inputCostPerToken,
      outputCostPerToken: body.outputCostPerToken,
      metadata: body.metadata,
    });
  },
});

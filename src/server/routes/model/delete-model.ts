import { createRouteResolver } from '../../middlewares/route-resolver';
import * as v from 'valibot';
import { litellmServiceAccountAuthMiddleware } from '../../middlewares/auth';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';

const inputSchema = v.object({
  modelId: v.string(),
});

export const deleteModel = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  middlewares: [litellmServiceAccountAuthMiddleware],
  resolve: async ({ inputs: { body } }) => {
    return adminLitellmApiClient.deleteModel({
      modelId: body.modelId,
    });
  },
});

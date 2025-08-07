import * as v from 'valibot';
import { litellm } from '../../../services/litellm';
import { litellmServiceAccountMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';

const inputSchema = v.object({
  userId: v.string(),
  maxBudget: v.nullable(v.number()),
});

export const manageUser = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  middlewares: [litellmServiceAccountMiddleware],
  resolve: async ({ inputs: { body } }) => {
    await litellm.manageUser({
      userId: body.userId,
      maxBudget: body.maxBudget,
    });
  },
});

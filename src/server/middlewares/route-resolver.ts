import * as v from 'valibot';
import ctx from 'express-http-context';
import { throwHttpError } from '../../utils/error';
import { CTX_GLOBAL_KEYS, STATUS_CODES } from '../../utils/consts';
import { RequestHandler } from 'express';
import {
  CreateRouteResolverOptions,
  BaseSchema,
  UnknownSchema,
  RouteResolver,
  ToUndefinedSchema,
  toUndefinedSchema,
} from '../../types/route-resolver';

export function createRouteResolver<
  TParamsInputSchema extends BaseSchema = ToUndefinedSchema,
  TQueryInputSchema extends BaseSchema = ToUndefinedSchema,
  TBodyInputSchema extends BaseSchema = ToUndefinedSchema,
  TOutputSchema extends BaseSchema = UnknownSchema,
>({
  inputs: inputSchemas,
  output: outputSchema,
  middlewares: routeResolverMiddlewares = [],
  resolve,
}: CreateRouteResolverOptions<
  TParamsInputSchema,
  TQueryInputSchema,
  TBodyInputSchema,
  TOutputSchema
>): RouteResolver {
  const parseInputMiddleware: RequestHandler = (req, res, next) => {
    ctx.set(
      CTX_GLOBAL_KEYS.INPUT.PARAMS,
      parseInput(inputSchemas?.params ?? toUndefinedSchema, req.params),
    );

    ctx.set(
      CTX_GLOBAL_KEYS.INPUT.QUERY,
      parseInput(inputSchemas?.query ?? toUndefinedSchema, req.query),
    );

    ctx.set(
      CTX_GLOBAL_KEYS.INPUT.BODY,
      parseInput(inputSchemas?.body ?? toUndefinedSchema, req.body),
    );

    next();
  };

  const middlewares: RequestHandler[] = routeResolverMiddlewares.map(
    (middleware) => {
      return (req, res, next) => {
        return middleware(req, res, next, {
          params: ctx.get(CTX_GLOBAL_KEYS.INPUT.PARAMS),
          query: ctx.get(CTX_GLOBAL_KEYS.INPUT.QUERY),
          body: ctx.get(CTX_GLOBAL_KEYS.INPUT.BODY),
        });
      };
    },
  );

  const parseOutputMiddleware: RequestHandler = async (req, res) => {
    let output: unknown = await resolve({
      inputs: {
        params: ctx.get(CTX_GLOBAL_KEYS.INPUT.PARAMS),
        query: ctx.get(CTX_GLOBAL_KEYS.INPUT.QUERY),
        body: ctx.get(CTX_GLOBAL_KEYS.INPUT.BODY),
      },
      req,
      res,
    });

    if (outputSchema) {
      output = parseOutput(outputSchema, output);
    }

    if (output === undefined) {
      res.status(STATUS_CODES.NO_CONTENT).send();
    } else {
      res.json(output);
    }
  };

  return [parseInputMiddleware, ...middlewares, parseOutputMiddleware];
}

function parseInput(schema: BaseSchema, data: unknown): unknown {
  try {
    return v.parse(schema, data);
  } catch (e: unknown) {
    if (e instanceof v.ValiError) {
      throwHttpError({
        status: STATUS_CODES.BAD_REQUEST,
        cause: e,
      });
    }

    throw e;
  }
}

function parseOutput(schema: BaseSchema, data: unknown): unknown {
  try {
    return v.parse(schema, data);
  } catch (e: unknown) {
    if (e instanceof v.ValiError) {
      throwHttpError({
        cause: e,
      });
    }

    throw e;
  }
}

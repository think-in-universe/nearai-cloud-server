import { createRouteResolver } from '../middlewares/route-resolver';
import { RouteResolver } from '../../types/route-resolver';

export const ping: RouteResolver = createRouteResolver({
  resolve: () => 'NEAR AI Cloud Server',
});

import { Hono } from 'hono';
import { HonoEnv } from '../../types/hono';
import { getHealthHandler } from './handlers/get-health';

const routes = new Hono<HonoEnv>().get('/', getHealthHandler);

export default routes;
export type HealthRoute = typeof routes;

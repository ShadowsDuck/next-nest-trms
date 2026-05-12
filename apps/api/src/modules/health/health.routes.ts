import { Hono } from 'hono';
import { HonoEnv } from '../../types/hono';
import { getHealthHandler } from './handlers/get-health';

const healthRouter = new Hono<HonoEnv>();

/**
 * เส้นทาง (Routes) สำหรับจัดการข้อมูล health
 */
healthRouter.get('/', getHealthHandler);

export default healthRouter;

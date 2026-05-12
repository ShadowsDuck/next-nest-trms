import { Hono } from 'hono';
import { HonoEnv } from '../../types/hono';
import { checkHealthHandler } from './handlers/health';

const healthRouter = new Hono<HonoEnv>();

/**
 * เส้นทาง (Routes) สำหรับจัดการข้อมูล health
 */
healthRouter.get('/', checkHealthHandler);

export default healthRouter;

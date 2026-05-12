import { Hono } from 'hono';
import { checkHealth } from './health.service';

const healthRouter = new Hono();

// ตรวจสอบความพร้อมของระบบ
healthRouter.get('/', async (c) => {
  const result = await checkHealth();
  if (result.status === 'error') {
    return c.json(result, 503);
  }
  return c.json(result);
});

export default healthRouter;

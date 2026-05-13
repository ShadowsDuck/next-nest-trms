import { serve } from '@hono/node-server';
import app from './app';
import { env } from './env';

/**
 * เริ่มต้นการทำงานของ HTTP Server
 */
function bootstrap() {
  const port = env.PORT;

  console.log(`🚀 API is running at http://localhost:${port}/api`);

  serve({
    fetch: app.fetch,
    port,
  });
}

bootstrap();

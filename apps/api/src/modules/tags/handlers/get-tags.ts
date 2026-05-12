import type { TagResponse } from '@workspace/schemas';
import { Context } from 'hono';
import { HonoEnv } from '../../../types/hono';
import { getTagsQuery } from '../queries/get-tags.query';

/**
 * Handler สำหรับดึงรายการหมวดหมู่ทั้งหมด
 */
export async function getTagsHandler(c: Context<HonoEnv>) {
  const tags = await getTagsQuery();

  const response: TagResponse[] = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    colorCode: tag.colorCode,
  }));

  return c.json(response);
}

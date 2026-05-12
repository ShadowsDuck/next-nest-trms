import type { TagResponse } from '@workspace/schemas';
import { db } from '../../lib/db';

// ดึงรายการหมวดหมู่ทั้งหมด
export async function findAllTags(): Promise<TagResponse[]> {
  const tags = await db.tag.findMany({
    orderBy: { name: 'asc' },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    colorCode: tag.colorCode,
  }));
}

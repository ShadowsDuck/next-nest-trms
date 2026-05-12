import { db } from '../../../lib/db';

/**
 * ดึงรายการหมวดหมู่ทั้งหมด
 */
export async function getTagsQuery() {
  return await db.tag.findMany({
    orderBy: { name: 'asc' },
  });
}

import { tagSchema } from '@workspace/schemas'
import * as z from 'zod'
import { fetcher } from '@/shared/lib/fetcher'

const tagListSchema = z.array(tagSchema)

export async function getTagOptions() {
  const data = await fetcher<unknown>('/api/tags', {
    cache: 'no-store',
  })

  return tagListSchema.parse(data).map((tag) => ({
    label: tag.name,
    value: tag.name,
  }))
}

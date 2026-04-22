import { TagResponse, tagSchema } from '@workspace/schemas'
import * as z from 'zod'
import { api } from '@/shared/lib/fetcher'

const tagListSchema = z.array(tagSchema)

export async function getAllTags(): Promise<TagResponse[]> {
  const data = await api.get<TagResponse[]>('/api/tags', {
    cache: 'no-store',
  })

  return tagListSchema.parse(data)
}

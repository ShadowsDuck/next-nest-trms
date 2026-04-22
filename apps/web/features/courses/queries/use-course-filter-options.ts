'use client'

import { useQuery } from '@tanstack/react-query'
import { getAllTags } from '@/domains/tags'
import { COURSE_FILTER_OPTIONS_QUERY_KEY } from '../options/query-options'

type TagOption = {
  label: string
  value: string
}

async function getTagOptions(): Promise<TagOption[]> {
  const tags = await getAllTags()

  return tags.map((tag) => ({
    label: tag.name,
    value: tag.name,
  }))
}

export function useCourseFilterOptions() {
  return useQuery({
    queryKey: COURSE_FILTER_OPTIONS_QUERY_KEY,
    queryFn: async () => ({
      tagOptions: await getTagOptions(),
    }),
  })
}

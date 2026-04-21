'use client'

import { useQuery } from '@tanstack/react-query'
import { getTagOptions } from '@/domains/tags/data/get-tags'

export function useCourseFilterOptions() {
  return useQuery({
    queryKey: ['course-filter-options'],
    queryFn: async () => ({
      tagOptions: await getTagOptions(),
    }),
    staleTime: 5 * 60 * 1000,
  })
}

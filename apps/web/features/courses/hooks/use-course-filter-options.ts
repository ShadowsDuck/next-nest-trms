'use client'

import { useQuery } from '@tanstack/react-query'
import { getTagOptions } from '../data/get-tag-filter-options'

export function useCourseFilterOptions() {
  return useQuery({
    queryKey: ['course-filter-options'],
    queryFn: async () => ({
      tagOptions: await getTagOptions(),
    }),
    staleTime: 5 * 60 * 1000,
  })
}

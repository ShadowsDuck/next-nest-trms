'use client'

import { useQuery } from '@tanstack/react-query'
import { getTagOptions } from '@/domains/tags'
import { COURSE_FILTER_OPTIONS_QUERY_KEY } from '../options/query-options'

export function useCourseFilterOptions() {
  return useQuery({
    queryKey: COURSE_FILTER_OPTIONS_QUERY_KEY,
    queryFn: async () => ({
      tagOptions: await getTagOptions(),
    }),
    staleTime: 5 * 60 * 1000,
  })
}


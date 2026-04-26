'use client'

import { useQuery } from '@tanstack/react-query'
import { getAllTags } from '@/domains/tags'

type TagOption = {
  id: string
  name: string
}

// ดึงตัวเลือกหมวดหมู่หลักสูตรเพื่อใช้ในฟอร์มสร้างหลักสูตร
export function useTagOptions() {
  return useQuery({
    queryKey: ['course-create-tag-options'],
    queryFn: async (): Promise<TagOption[]> => {
      const tags = await getAllTags()

      return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
      }))
    },
  })
}

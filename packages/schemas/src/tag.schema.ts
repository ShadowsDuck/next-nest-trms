import * as z from "zod"

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorCode: z.string().optional().nullable(),
})

export type TagResponse = z.infer<typeof tagSchema>

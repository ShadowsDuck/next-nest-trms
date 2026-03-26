import * as z from "zod"

export const toArray = z.transform((val) => {
  if (val === undefined) return undefined
  return typeof val === "string" ? [val] : val
})

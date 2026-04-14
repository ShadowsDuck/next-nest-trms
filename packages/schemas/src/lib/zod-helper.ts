import * as z from "zod"

export const toArray = z.transform((val) => {
  if (val === undefined) return undefined

  const normalizeString = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

  if (typeof val === "string") {
    return normalizeString(val)
  }

  if (Array.isArray(val)) {
    return val.flatMap((item) =>
      typeof item === "string" ? normalizeString(item) : [item]
    )
  }

  return [val]
})

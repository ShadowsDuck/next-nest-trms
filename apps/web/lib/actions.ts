'use server'

import { authFetch } from './authFetch'

export async function getEmployee() {
  const response = await authFetch('/employees')
  const data = await response.json()

  return data
}

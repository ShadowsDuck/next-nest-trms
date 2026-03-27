import { Suspense } from 'react'

async function Info() {
  const response = await fetch(
    'https://jsonplaceholder.typicode.com/todos/?_limit=5'
  )
  const data = await response.json()

  return (
    <div>
      {data.map((item: { id: number; title: string }, index: number) => (
        <div key={item.id}>
          {index + 1}. {item.title}
        </div>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Info />
      </Suspense>
    </div>
  )
}

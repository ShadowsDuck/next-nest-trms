'use cache'

export async function CachedDashboardData() {
  const res = await fetch(`${process.env.API_URL}/api/employees`)
  const stats = await res.json()

  return (
    <div className="p-4 border rounded">
      <h2>สถิติของคุณ</h2>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  )
}

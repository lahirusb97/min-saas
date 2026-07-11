import { useEffect, useState } from 'react'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Home() {
  const [status, setStatus] = useState('checking backend...')

  useEffect(() => {
    api
      .get('/')
      .then((res) => setStatus(String(res.data)))
      .catch(() => setStatus('backend unreachable'))
  }, [])

  return (
    <section className="mx-auto max-w-md p-8">
      <Card>
        <CardHeader>
          <CardTitle>Home</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Welcome to min-saas.</p>
          <p className="text-sm text-muted-foreground">API status: {status}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    </section>
  )
}

export default Home

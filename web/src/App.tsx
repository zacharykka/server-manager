import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          Server Manager
        </h1>
        <div className="space-y-4">
          <p className="text-muted-foreground mb-6">
            Ansible-powered server management platform
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setCount((count) => count + 1)}>
              Click me ({count})
            </Button>
            <Button variant="outline">
              Secondary
            </Button>
          </div>
          <div className="mt-8 p-4 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-2">Status</h2>
            <p className="text-sm text-muted-foreground">
              Frontend configuration complete ✅
            </p>
            <p className="text-sm text-muted-foreground">
              Tailwind CSS + Shadcn/UI ready
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

import * as React from "react"
import { useParams } from "react-router-dom"
import { ServerForm } from "@/components/ServerForm"

export function EditServerPage() {
  const { id } = useParams<{ id: string }>()
  const serverId = id ? parseInt(id) : undefined

  if (!serverId) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">服务器不存在</h1>
          <p className="text-gray-600">您要编辑的服务器不存在或已被删除。</p>
        </div>
      </div>
    )
  }

  return <ServerForm serverId={serverId} />
}
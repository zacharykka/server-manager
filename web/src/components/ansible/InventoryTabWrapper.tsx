import { useEffect } from 'react'
import { InventoryTab } from './InventoryTab'
import { useInventory } from '@/hooks/useAnsible'

export function InventoryTabWrapper() {
  const { refreshInventories } = useInventory()

  useEffect(() => {
    // Only load data when this tab is actually rendered (user is authenticated)
    refreshInventories()
  }, [refreshInventories])

  return <InventoryTab />
}
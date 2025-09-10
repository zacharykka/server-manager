import { useEffect } from 'react'
import { PlaybookTab } from './PlaybookTab'
import { usePlaybook } from '@/hooks/useAnsible'

export function PlaybookTabWrapper() {
  const { refreshPlaybooks } = usePlaybook()

  useEffect(() => {
    // Only load data when this tab is actually rendered (user is authenticated)
    refreshPlaybooks()
  }, [refreshPlaybooks])

  return <PlaybookTab />
}